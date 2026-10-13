import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { evidenceDeadlineFor, requireUser, transitionUntilFor } from "@/lib/auth/sessionServer";
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
// document. Every submission is reviewed by an administrator. The account
// status depends on what changes:
//   - a verified account sending the same legal name, number and Order stays
//     verified while the document is reviewed (no interruption);
//   - any other submission (new account, or changed details) puts the account
//     to 'pending' until a new decision.
// The route never accepts a status, a check result or a storage path from the
// client; the document is validated here (size, extension and real type) and
// stored in a private bucket under a server-generated path.

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

  // One transaction (sql/2026-10_verification_evidence_PROPOSED.sql,
  // verification_submit): the request, the replaced requests and the profile
  // change together or not at all.
  const v = parsed.value;
  const { data: result, error: submitError } = await db.rpc("verification_submit", {
    p_user_id: userId,
    p_request_id: requestId,
    p_legal_first_name: v.legalFirstName,
    p_legal_last_name: v.legalLastName,
    p_registry_country: v.registryCountry,
    p_registry_name: v.registryName,
    p_registration_number: v.registrationNumber,
    p_document_path: path,
    p_document_mime: type.type.mime,
    p_document_size: bytes.length,
    p_declaration_version: String(form.get("declarationVersion")),
  });
  if (submitError) {
    await db.storage.from(VERIFICATION_BUCKET).remove([path]);
    console.error("verification request save failed:", submitError.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Replaced requests no longer need their documents. If a file cannot be
  // removed now, its path stays on the superseded request so the retention
  // job can remove it later.
  const replaced = ((result as { superseded_paths?: string[] } | null)?.superseded_paths ?? []).filter(Boolean);
  if (replaced.length) {
    const { error: removeError } = await db.storage.from(VERIFICATION_BUCKET).remove(replaced);
    if (removeError) console.error("verification: replaced documents not removed yet");
    else
      await db
        .from("professional_verification_requests")
        .update({ document_path: null, document_deleted_at: new Date().toISOString() })
        .eq("user_id", userId)
        .in("document_path", replaced);
  }

  const { data: updated, error: readError } = await gate.supabase.from("profiles").select(FIELDS).eq("id", userId).maybeSingle();
  if (readError) {
    console.error("verification status read failed:", readError.message);
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
  const deadline = status === "verified" ? await evidenceDeadlineFor(supabase, userId) : null;
  const evidence = deadline && deadline !== "error" && !deadline.satisfied ? deadline : null;
  return {
    ...toPublic(p),
    transitionUntil,
    // Accounts verified before documents were required: the date by which
    // the document must be confirmed, and whether it has passed.
    evidenceDueAt: evidence?.dueAt ?? null,
    evidenceOverdue: !!evidence?.overdue,
    canManagePatients: professional && deadline !== "error" && ((status === "verified" && !evidence?.overdue) || !!transitionUntil),
    request: await latestRequest(userId),
  };
}

async function latestRequest(userId: string) {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("professional_verification_requests")
    .select("id, status, legal_first_name, legal_last_name, submitted_at, submitted_while_verified, decided_at, document_path, document_deleted_at, declaration_version, user_message")
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
