import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireUser, transitionUntilFor } from "@/lib/auth/sessionServer";
import { serviceClient } from "@/lib/verification";
import {
  VERIFICATION_BUCKET,
  checkDocument,
  documentPath,
  parseEvidenceForm,
  requestForUser,
} from "@/lib/verificationEvidence";
import { consumeHourly, HOURLY_LIMITS, limitResponse } from "@/lib/rateLimit";

// GET: the signed-in user's own verification status and latest request.
// POST (multipart/form-data): a new verification request with the registration
// document. Every submission starts a new review: the profile goes back to
// 'pending' (also after an approval), so details or documents cannot be
// replaced without a new decision. The route never accepts a status, a check
// result or a storage path from the client; the document is validated here
// (size, extension and real type) and stored in a private bucket under a
// server-generated path.

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
  return NextResponse.json({ verification: await withAccess(gate.supabase, data, gate.user.id) });
}

export async function POST(req: Request) {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const userId = gate.user.id;

  // Patient accounts (My Phygo) have no professional registration to verify.
  const { data: patientRecord, error: patientError } = await gate.supabase
    .from("patients")
    .select("id")
    .eq("patient_user_id", userId)
    .maybeSingle();
  if (patientError) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  if (patientRecord) return NextResponse.json({ error: "Not available for patient accounts" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid input", fields: ["document"], code: "document_missing" }, { status: 400 });

  const parsed = parseEvidenceForm(form);
  const file = form.get("document");
  const fileErrors: string[] = [];
  let bytes: Uint8Array | null = null;
  let type: ReturnType<typeof checkDocument> | null = null;
  if (!(file instanceof File) || file.size === 0) {
    fileErrors.push("document_missing");
  } else {
    bytes = new Uint8Array(await file.arrayBuffer());
    type = checkDocument(file.name, bytes);
    if (!type.ok) fileErrors.push(type.error);
  }
  if (!parsed.ok || fileErrors.length) {
    return NextResponse.json(
      {
        error: "Invalid input",
        fields: [...(parsed.ok ? [] : parsed.errors), ...(fileErrors.length ? ["document"] : [])],
        code: fileErrors[0],
      },
      { status: fileErrors[0] === "document_too_large" ? 413 : 400 },
    );
  }
  if (!type?.ok || !bytes) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const limited = limitResponse(await consumeHourly(`verification-upload:${userId}`, HOURLY_LIMITS.verificationUpload));
  if (limited) return limited;

  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const requestId = randomUUID();
  const path = documentPath(userId, requestId, type.type.ext);
  const { error: uploadError } = await db.storage
    .from(VERIFICATION_BUCKET)
    .upload(path, bytes, { contentType: type.type.mime, upsert: false });
  if (uploadError) {
    console.error("verification document upload failed");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const v = parsed.value;
  const { error: insertError } = await db.from("professional_verification_requests").insert({
    id: requestId,
    user_id: userId,
    legal_first_name: v.legalFirstName,
    legal_last_name: v.legalLastName,
    registry_country: v.registryCountry,
    registry_name: v.registryName,
    registration_number: v.registrationNumber,
    document_path: path,
    document_mime: type.type.mime,
    document_size: bytes.length,
    declaration_version: String(form.get("declarationVersion")),
    declaration_accepted_at: now,
    status: "pending",
    submitted_at: now,
  });
  if (insertError) {
    await db.storage.from(VERIFICATION_BUCKET).remove([path]);
    console.error("verification request save failed:", insertError.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Earlier open requests are replaced by this one; their documents are no longer needed.
  const { data: open } = await db
    .from("professional_verification_requests")
    .select("id, document_path, status")
    .eq("user_id", userId)
    .in("status", ["pending", "needs_info"]);
  const replaced = (open ?? []).filter((r) => r.id !== requestId);
  if (replaced.length) {
    const paths = replaced.map((r) => r.document_path).filter(Boolean) as string[];
    if (paths.length) await db.storage.from(VERIFICATION_BUCKET).remove(paths);
    for (const r of replaced) {
      await db
        .from("professional_verification_requests")
        .update({ status: "superseded", decided_at: now, document_path: null, document_deleted_at: r.document_path ? now : null })
        .eq("id", r.id);
    }
  }

  const { data: updated, error: updateError } = await db
    .from("profiles")
    .update({
      registry_country: v.registryCountry,
      registry_name: v.registryName,
      registration_number: v.registrationNumber,
      professional_status: "pending",
      verification_requested_at: now,
      verification_reviewed_at: null,
      verification_reviewed_by: null,
      verification_message: null,
    })
    .eq("id", userId)
    .select(FIELDS)
    .maybeSingle();
  if (updateError) {
    console.error("verification status update failed:", updateError.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  return NextResponse.json({ verification: await withAccess(gate.supabase, updated, userId) });
}

// Adds the account's temporary transition access, if any, whether it may
// manage real patients (same rule as can_manage_patients() in the database),
// and the user's view of their latest request. The interface uses
// canManagePatients only to explain and disable actions; the database and
// API routes enforce it.
async function withAccess(supabase: SupabaseClient, p: Record<string, any> | null, userId: string) {
  const status = p?.professional_status ?? "not_applicable";
  const professional = p?.practice_stage !== "student";
  const until = professional ? await transitionUntilFor(supabase, userId, status) : null;
  const transitionUntil = until === "error" ? null : until;
  return {
    ...toPublic(p),
    transitionUntil,
    canManagePatients: professional && (status === "verified" || !!transitionUntil),
    request: await latestRequest(userId),
  };
}

async function latestRequest(userId: string) {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("professional_verification_requests")
    .select("id, status, legal_first_name, legal_last_name, submitted_at, decided_at, document_path, document_deleted_at, declaration_version, user_message")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return requestForUser(data);
}

function toPublic(p: Record<string, any> | null) {
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
  };
}
