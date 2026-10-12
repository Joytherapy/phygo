// Server-side gates for API routes that act on behalf of a signed-in user.
// Frontend hiding is not security: every protected route must call one of
// these before doing paid or sensitive work.
//
// - requireUser(): any signed-in account.
// - requireProfessional(): an account that declares itself a professional.
//   Patient accounts (a row in patients.patient_user_id) and student accounts
//   (profiles.practice_stage) are refused, mirroring middleware.ts.
// - requireVerifiedProfessional(): a professional whose registration PHYGO
//   has verified (profiles.professional_status = 'verified'), or a listed
//   pre-existing account during the bounded transition (see below).
//
// Lookups use the caller's own session (anon key + cookie), so Row Level
// Security applies: patients and profiles rows are only readable by their
// owner, exactly as in middleware.ts.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type Gate =
  | { ok: true; user: User; supabase: SupabaseClient; professionalStatus?: string }
  | { ok: false; response: NextResponse };

export function sessionSupabase(): SupabaseClient {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  ) as unknown as SupabaseClient;
}

export async function requireUser(): Promise<Gate> {
  const supabase = sessionSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      ),
    };
  return { ok: true, user, supabase };
}

export async function requireProfessional(): Promise<Gate> {
  const gate = await requireUser();
  if (!gate.ok) return gate;
  const { user, supabase } = gate;

  const { data: patientRecord, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("patient_user_id", user.id)
    .maybeSingle();
  if (patientError) {
    // Fail closed: without this check a patient account could reach clinician-only operations.
    console.error("requireProfessional: patient lookup failed:", patientError.message);
    return { ok: false, response: unavailable() };
  }
  if (patientRecord) return { ok: false, response: forbidden() };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("practice_stage, professional_status")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    console.error("requireProfessional: profile lookup failed:", profileError.message);
    return { ok: false, response: unavailable() };
  }
  if (profile?.practice_stage === "student")
    return { ok: false, response: forbidden() };

  return { ...gate, professionalStatus: profile?.professional_status ?? "not_applicable" };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TRANSITION_MS = 90 * 24 * 60 * 60 * 1000;
const warned = new Set<string>();
function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

/**
 * Temporary transition policy for accounts that existed before professional
 * verification was introduced. It covers ONLY the stable account ids the owner
 * lists explicitly, and only until a fixed end date:
 *
 *   PROFESSIONAL_TRANSITION_ACCOUNTS  comma-separated auth user ids (UUIDs)
 *   PROFESSIONAL_TRANSITION_UNTIL     end of the transition, ISO 8601
 *                                     (e.g. 2026-11-30T23:59:59Z); at most
 *                                     90 days ahead
 *
 * Nothing qualifies automatically: a new account, or one that switches its
 * declared role to professional, is not on the list. If either variable is
 * missing or invalid, or the date has passed or is more than 90 days ahead,
 * the list is ignored (fail closed). See docs/security/professional-verification-rollout.md.
 */
export function verificationTransition(now = new Date()): { accounts: Set<string>; until: Date } | null {
  if (process.env.PROFESSIONAL_VERIFICATION_MODE)
    warnOnce("PROFESSIONAL_VERIFICATION_MODE is no longer supported and is ignored; use PROFESSIONAL_TRANSITION_ACCOUNTS");
  const listRaw = process.env.PROFESSIONAL_TRANSITION_ACCOUNTS?.trim();
  const untilRaw = process.env.PROFESSIONAL_TRANSITION_UNTIL?.trim();
  if (!listRaw) return null;
  const until = untilRaw ? new Date(untilRaw) : null;
  if (!until || Number.isNaN(until.getTime()) || until.getTime() - now.getTime() > MAX_TRANSITION_MS) {
    warnOnce("verification transition ignored: PROFESSIONAL_TRANSITION_UNTIL is missing, invalid or more than 90 days ahead");
    return null;
  }
  if (until <= now) return null;
  const entries = listRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const accounts = new Set(entries.filter((e) => UUID.test(e)));
  if (accounts.size !== entries.length)
    warnOnce(`verification transition: ${entries.length - accounts.size} invalid entries in PROFESSIONAL_TRANSITION_ACCOUNTS ignored`);
  return accounts.size ? { accounts, until } : null;
}

/**
 * End of the temporary access for this account, or null when it is not
 * covered. A PHYGO decision always wins: verified accounts do not need it and
 * rejected accounts lose it immediately, whatever the list says.
 */
export function transitionUntilFor(userId: string, professionalStatus: string | undefined): string | null {
  if (professionalStatus === "verified" || professionalStatus === "rejected") return null;
  const transition = verificationTransition();
  return transition?.accounts.has(userId.toLowerCase()) ? transition.until.toISOString() : null;
}

/**
 * A professional whose registration has been reviewed and approved by PHYGO.
 * Used for operations that send real clinical information to a paid AI
 * processor or open live consultations with patients. Declaring yourself a
 * professional (practice_stage) or typing a registration number is not enough;
 * only an administrator can set professional_status = 'verified'. Accounts on
 * the explicit transition list (above) are let through until its end date.
 * Patients and students are refused before any of this (requireProfessional).
 */
export async function requireVerifiedProfessional(): Promise<Gate> {
  const gate = await requireProfessional();
  if (!gate.ok) return gate;
  if (gate.professionalStatus === "verified") return gate;
  const until = transitionUntilFor(gate.user.id, gate.professionalStatus);
  if (until) {
    console.warn("verification transition: listed unverified account allowed until", until, gate.user.id);
    return gate;
  }
  return {
    ok: false,
    response: NextResponse.json(
      {
        error: "Professional verification required",
        message: "Submit your professional registration details from your profile. Once a PHYGO administrator has verified them, this feature is unlocked.",
        code: "verification_required",
        verificationStatus: gate.professionalStatus,
      },
      { status: 403 },
    ),
  };
}

/** The patient must belong to the signed-in clinician (patients.user_id), checked under RLS. */
export async function ownsPatient(
  supabase: SupabaseClient,
  userId: string,
  patientId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) console.error("ownsPatient lookup failed:", error.message);
  return !!data;
}

function unavailable() {
  return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
}

function forbidden() {
  return NextResponse.json(
    { error: "Professional account required" },
    { status: 403 },
  );
}
