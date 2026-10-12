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

/**
 * Transition switch for professional verification (env PROFESSIONAL_VERIFICATION_MODE):
 *   enforce (default) - clinician-only operations need professional_status = 'verified'.
 *   grace             - declared professionals keep their current access while
 *                       verification requests are collected and reviewed; each
 *                       unverified use is logged. Meant for a limited rollout window.
 */
export function verificationMode(): "enforce" | "grace" {
  return process.env.PROFESSIONAL_VERIFICATION_MODE === "grace" ? "grace" : "enforce";
}

/**
 * A professional whose registration has been reviewed and approved by PHYGO.
 * Used for operations that send real clinical information to a paid AI
 * processor or open live consultations with patients. Declaring yourself a
 * professional (practice_stage) or typing a registration number is not enough;
 * only an administrator can set professional_status = 'verified'.
 */
export async function requireVerifiedProfessional(): Promise<Gate> {
  const gate = await requireProfessional();
  if (!gate.ok) return gate;
  if (gate.professionalStatus === "verified") return gate;
  if (verificationMode() === "grace") {
    console.warn("verification grace mode: unverified professional allowed", gate.user.id);
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
