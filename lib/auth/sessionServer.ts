// Server-side gates for API routes that act on behalf of a signed-in user.
// Frontend hiding is not security: every protected route must call one of
// these before doing paid or sensitive work.
//
// - requireUser(): any signed-in account.
// - requireProfessional(): an account that declares itself a professional.
//   Patient accounts (a row in patients.patient_user_id) and student accounts
//   (profiles.practice_stage) are refused, mirroring middleware.ts.
// - requireVerifiedProfessional(): a professional whose registration PHYGO
//   has verified (profiles.professional_status = 'verified').
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

const warned = new Set<string>();
function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

/**
 * Temporary access for pre-existing accounts is NOT granted by this code
 * version. The owner's time-limited transition list lives in the database
 * (table professional_transition_accounts, PR #8), where the patient-record
 * rules can use it too. The environment variables of an earlier draft
 * (PROFESSIONAL_TRANSITION_ACCOUNTS / PROFESSIONAL_TRANSITION_UNTIL) and the
 * old PROFESSIONAL_VERIFICATION_MODE grant nothing in any version: if they are
 * still set they are ignored and logged, so a stale value can never open
 * clinical access (also when the code is rolled back to this version).
 */
export function warnIgnoredTransitionEnv() {
  for (const old of ["PROFESSIONAL_VERIFICATION_MODE", "PROFESSIONAL_TRANSITION_ACCOUNTS", "PROFESSIONAL_TRANSITION_UNTIL"])
    if (process.env[old]) warnOnce(`${old} is no longer used and is ignored; remove it from the environment`);
}

/**
 * A professional whose registration has been reviewed and approved by PHYGO.
 * Used for operations that send real clinical information to a paid AI
 * processor or open live consultations with patients. Declaring yourself a
 * professional (practice_stage) or typing a registration number is not enough;
 * only an administrator can set professional_status = 'verified'.
 * Patients and students are refused before any of this (requireProfessional).
 */
export async function requireVerifiedProfessional(): Promise<Gate> {
  const gate = await requireProfessional();
  if (!gate.ok) return gate;
  warnIgnoredTransitionEnv();
  if (gate.professionalStatus === "verified") return gate;
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
