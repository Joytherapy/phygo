// Server-side gates for API routes that act on behalf of a signed-in user.
// Frontend hiding is not security: every protected route must call one of
// these before doing paid or sensitive work.
//
// - requireUser(): any signed-in account.
// - requireProfessional(): an account that declares itself a professional.
//   Patient accounts (a row in patients.patient_user_id) and student accounts
//   (profiles.practice_stage) are refused, mirroring middleware.ts.
// - requireVerifiedProfessional(): a professional whose registration PHYGO
//   has verified (profiles.professional_status = 'verified') and whose
//   evidence deadline, if any, has not passed unconfirmed; or a listed
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

const MAX_TRANSITION_MS = 90 * 24 * 60 * 60 * 1000;
const warned = new Set<string>();
function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

/**
 * Temporary transition policy for accounts that existed before professional
 * verification was introduced. The list lives in the database table
 * professional_transition_accounts (sql/2026-10_patient_management_A_...):
 * only the owner adds rows, each with an end date at most 90 days ahead, and
 * users can read only their own row. The same list is used by the database
 * rules for patient records (can_manage_patients()), so one list governs
 * clinical AI, video and patient management. Nothing qualifies automatically:
 * a new account, or one that switches its declared role, is not on the list.
 *
 * Returns the end of this account's temporary access, null when it is not
 * covered, or "error" when the list cannot be read (callers fail closed).
 * A PHYGO decision always wins: verified accounts do not need it and rejected
 * accounts lose it immediately.
 */
export async function transitionUntilFor(
  supabase: SupabaseClient,
  userId: string,
  professionalStatus: string | undefined,
): Promise<string | null | "error"> {
  for (const old of ["PROFESSIONAL_VERIFICATION_MODE", "PROFESSIONAL_TRANSITION_ACCOUNTS", "PROFESSIONAL_TRANSITION_UNTIL"])
    if (process.env[old]) warnOnce(`${old} is no longer used and is ignored; the transition list is the professional_transition_accounts table`);
  if (professionalStatus === "verified" || professionalStatus === "rejected") return null;
  const { data, error } = await supabase
    .from("professional_transition_accounts")
    .select("until")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("transition list lookup failed:", error.message);
    return "error";
  }
  const until = data?.until ? new Date(data.until) : null;
  const now = Date.now();
  if (!until || Number.isNaN(until.getTime()) || until.getTime() <= now || until.getTime() - now > MAX_TRANSITION_MS) return null;
  return until.toISOString();
}

/**
 * A professional whose registration has been reviewed and approved by PHYGO.
 * Used for operations that send real clinical information to a paid AI
 * processor or open live consultations with patients. Declaring yourself a
 * professional (practice_stage) or typing a registration number is not enough;
 * only an administrator can set professional_status = 'verified'. Accounts on
 * the explicit transition list (above) are let through until their end date.
 * The same rule decides patient management in the database (can_manage_patients()).
 * Patients and students are refused before any of this (requireProfessional).
 */
export type EvidenceDeadline = { dueAt: string; satisfied: boolean; overdue: boolean };

/**
 * The account's deadline to send its registration document, if it was
 * verified before documents were required (table
 * professional_evidence_deadlines, sql/2026-10_verification_evidence_PROPOSED.sql;
 * rows are added only by the owner's backfill). Users can read only their own
 * row. Returns null when there is none, or "error" when it cannot be read
 * (callers fail closed). The database applies the same rule to patient records
 * (sql/2026-10_verification_evidence_access_PROPOSED.sql).
 */
export async function evidenceDeadlineFor(supabase: SupabaseClient, userId: string): Promise<EvidenceDeadline | null | "error"> {
  const { data, error } = await supabase
    .from("professional_evidence_deadlines")
    .select("due_at, satisfied_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("evidence deadline lookup failed:", error.message);
    return "error";
  }
  if (!data?.due_at) return null;
  const due = new Date(data.due_at);
  if (Number.isNaN(due.getTime())) return "error";
  const satisfied = !!data.satisfied_at;
  return { dueAt: due.toISOString(), satisfied, overdue: !satisfied && due.getTime() <= Date.now() };
}

export async function requireVerifiedProfessional(): Promise<Gate> {
  const gate = await requireProfessional();
  if (!gate.ok) return gate;
  if (gate.professionalStatus === "verified") {
    // Verified before documents were required, and the deadline has passed
    // without a confirmed document: clinical functions stop, data stays.
    const deadline = await evidenceDeadlineFor(gate.supabase, gate.user.id);
    if (deadline === "error") return { ok: false, response: unavailable() };
    if (!deadline?.overdue) return gate;
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Registration document required",
          message: "The deadline to send your registration document has passed. Send it from your profile; once a PHYGO administrator confirms it, this feature is unlocked again. Your data has not been deleted.",
          code: "verification_evidence_overdue",
          verificationStatus: gate.professionalStatus,
          evidenceDueAt: deadline.dueAt,
        },
        { status: 403 },
      ),
    };
  }
  const until = await transitionUntilFor(gate.supabase, gate.user.id, gate.professionalStatus);
  if (until === "error") return { ok: false, response: unavailable() };
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
