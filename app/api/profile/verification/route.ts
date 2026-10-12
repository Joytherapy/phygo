import { NextResponse } from "next/server";
import { requireUser, transitionUntilFor } from "@/lib/auth/sessionServer";
import { parseVerificationRequest, serviceClient } from "@/lib/verification";

// GET: the signed-in user's own verification status.
// POST: submit or update registration details. The status becomes 'pending'
// whenever the details change (including after a previous approval), so a
// verified number cannot be replaced without a new review. Clients cannot
// write these columns directly (see the profiles trigger); this route is the
// only way in, and it never accepts a status from the request body.

const FIELDS =
  "practice_stage, professional_status, registry_country, registry_name, registration_number, verification_requested_at, verification_reviewed_at, verification_message";

export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const { data, error } = await gate.supabase.from("profiles").select(FIELDS).eq("id", gate.user.id).maybeSingle();
  if (error) {
    console.error("verification status read failed:", error.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  return NextResponse.json({ verification: toPublic(data, gate.user.id) });
}

export async function POST(req: Request) {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;

  // Patient accounts (My Phygo) have no professional registration to verify.
  const { data: patientRecord, error: patientError } = await gate.supabase
    .from("patients")
    .select("id")
    .eq("patient_user_id", gate.user.id)
    .maybeSingle();
  if (patientError) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  if (patientRecord) return NextResponse.json({ error: "Not available for patient accounts" }, { status: 403 });

  const parsed = parseVerificationRequest(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: "Invalid input", fields: parsed.errors }, { status: 400 });

  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const { data: current, error: readError } = await db.from("profiles").select(FIELDS).eq("id", gate.user.id).maybeSingle();
  if (readError || !current) {
    console.error("verification request read failed:", readError?.message ?? "no profile");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { registryCountry, registryName, registrationNumber } = parsed.value;
  const unchanged =
    current.registry_country === registryCountry &&
    current.registry_name === registryName &&
    current.registration_number === registrationNumber;
  // Re-sending the same details never downgrades a decision already taken.
  if (unchanged && ["pending", "verified", "rejected"].includes(current.professional_status)) {
    return NextResponse.json({ verification: toPublic(current, gate.user.id) });
  }

  const { data: updated, error: updateError } = await db
    .from("profiles")
    .update({
      registry_country: registryCountry,
      registry_name: registryName,
      registration_number: registrationNumber,
      professional_status: "pending",
      verification_requested_at: new Date().toISOString(),
      verification_reviewed_at: null,
      verification_reviewed_by: null,
      verification_message: null,
    })
    .eq("id", gate.user.id)
    .select(FIELDS)
    .maybeSingle();
  if (updateError) {
    console.error("verification request save failed:", updateError.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  return NextResponse.json({ verification: toPublic(updated, gate.user.id) });
}

function toPublic(p: Record<string, any> | null, userId: string) {
  const status = p?.professional_status ?? "not_applicable";
  return {
    status,
    practiceStage: p?.practice_stage ?? "professional",
    registryCountry: p?.registry_country ?? null,
    registryName: p?.registry_name ?? null,
    registrationNumber: p?.registration_number ?? null,
    requestedAt: p?.verification_requested_at ?? null,
    reviewedAt: p?.verification_reviewed_at ?? null,
    message: p?.verification_message ?? null,
    // Set only for accounts on the owner's temporary transition list.
    transitionUntil: p?.practice_stage === "student" ? null : transitionUntilFor(userId, status),
  };
}
