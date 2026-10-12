// Server-side gates for API routes that act on behalf of a signed-in user.
// Frontend hiding is not security: every protected route must call one of
// these before doing paid or sensitive work.
//
// - requireUser(): any signed-in account.
// - requireProfessional(): a signed-in clinician. Patient accounts (a row in
//   patients.patient_user_id) and student accounts (profiles.practice_stage)
//   are refused, mirroring the page-level rules in middleware.ts.
//
// Lookups use the caller's own session (anon key + cookie), so Row Level
// Security applies: patients and profiles rows are only readable by their
// owner, exactly as in middleware.ts.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type Gate =
  | { ok: true; user: User; supabase: SupabaseClient }
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
    console.error(
      "requireProfessional: patient lookup failed:",
      patientError.message,
    );
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 },
      ),
    };
  }
  if (patientRecord) return { ok: false, response: forbidden() };

  const { data: profile } = await supabase
    .from("profiles")
    .select("practice_stage")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.practice_stage === "student")
    return { ok: false, response: forbidden() };

  return gate;
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

function forbidden() {
  return NextResponse.json(
    { error: "Professional account required" },
    { status: 403 },
  );
}
