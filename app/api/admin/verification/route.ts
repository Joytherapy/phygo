import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminServer";
import { REVIEW_DECISIONS, serviceClient, type ReviewDecision } from "@/lib/verification";
import { OFFICIAL_REGISTER_URL, REGISTRY_RESULTS, REJECTION_CATEGORIES, type RegistryResult, type RejectionCategory } from "@/lib/verificationEvidence";

// Manual review of professional registrations by a PHYGO administrator
// (PHYGO_ADMIN_EMAILS, server-side only; see lib/auth/adminServer.ts). Only a
// signed-in administrator: no bearer token (CRON_SECRET or API token) is
// accepted, so every check and decision is attributed to a person.
//
// The administrator compares four separate things for each request:
//   1. the user's declaration (legal name, number, territorial Order);
//   2. the document received (opened through /api/admin/verification/document);
//   3. the result of their own check on the official register (recorded here);
//   4. the final decision.
// Nothing is checked automatically: no official register API is integrated.
// An approval (or the confirmation of an already verified account) needs a
// document and a recorded "match" on the official register. Every check and
// decision is written together with its history entry in one database
// transaction (verification_record_check / verification_decide), so a failed
// history write never leaves a half-applied decision.
// Administrator status gives access to this console and to verification
// documents only: no patient data is read here.

const LIST_FIELDS =
  "id, display_name, practice_stage, professional_status, registry_country, registry_name, registration_number, verification_requested_at, verification_reviewed_at, verification_reviewed_by, verification_message";
const REQUEST_FIELDS =
  "id, user_id, status, submitted_while_verified, legal_first_name, legal_last_name, registry_country, registry_name, registration_number, document_path, document_mime, document_size, document_deleted_at, declaration_version, declaration_accepted_at, submitted_at, registry_check, registry_checked_at, registry_checked_by, decided_at, decided_by, rejection_category, user_message";

const OPEN = ["pending", "needs_info"];

// ?status=pending|needs_info|verified|rejected lists accounts by status;
// ?status=reconfirm lists verified accounts with an open request (documents
// sent without interrupting their access).
export async function GET(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) return admin.response;
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  let query = db.from("profiles").select(LIST_FIELDS);
  if (status === "reconfirm") {
    const { data: open, error: openError } = await db.from("professional_verification_requests").select("user_id").in("status", OPEN);
    if (openError) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    const ids = Array.from(new Set((open ?? []).map((r) => r.user_id)));
    if (!ids.length) return NextResponse.json({ requests: [], officialRegister: OFFICIAL_REGISTER_URL });
    query = query.eq("professional_status", "verified").in("id", ids);
  } else {
    query = query.eq("professional_status", status);
  }
  const { data, error } = await query.order("verification_requested_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const ids = (data ?? []).map((p) => p.id);
  const none = { data: [] as Record<string, any>[], error: null };
  const [requests, reviews, deadlines] = ids.length
    ? await Promise.all([
        db.from("professional_verification_requests").select(REQUEST_FIELDS).in("user_id", ids).order("submitted_at", { ascending: false }),
        db.from("professional_verification_reviews").select("id, user_id, request_id, action, registry_check, rejection_category, internal_note, note_redacted_at, reviewer, created_at").in("user_id", ids).order("created_at", { ascending: true }),
        db.from("professional_evidence_deadlines").select("user_id, due_at, satisfied_at").in("user_id", ids),
      ])
    : [none, none, none];
  if (requests.error || reviews.error || deadlines.error) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const rows = (data ?? []).map((p) => {
    const latest = (requests.data ?? []).find((r) => r.user_id === p.id) ?? null;
    const deadline = (deadlines.data ?? []).find((d) => d.user_id === p.id) ?? null;
    return {
      ...p,
      request: latest && { ...latest, document_path: undefined, has_document: !!latest.document_path },
      evidenceDeadline: deadline && { dueAt: deadline.due_at, satisfied: !!deadline.satisfied_at, overdue: !deadline.satisfied_at && Date.parse(deadline.due_at) <= Date.now() },
      history: (reviews.data ?? []).filter((v) => v.user_id === p.id),
    };
  });
  return NextResponse.json({ requests: rows, officialRegister: OFFICIAL_REGISTER_URL });
}

export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) return admin.response;
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const reviewer = admin.email;
  const note = typeof body.internalNote === "string" ? body.internalNote.trim().slice(0, 1000) || null : null;

  // 1. Record the administrator's own check on the official register.
  if (body.action === "registry_check") {
    const result = body.result as RegistryResult;
    if (typeof body.requestId !== "string" || !UUID.test(body.requestId) || !REGISTRY_RESULTS.includes(result)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { error } = await db.rpc("verification_record_check", { p_request_id: body.requestId, p_result: result, p_note: note, p_reviewer: reviewer });
    if (error) return refusal(error);
    return NextResponse.json({ ok: true, registryCheck: result });
  }

  // 2. Final decision on the account: approve (or confirm an already verified
  // account), ask for information, reject, or revoke a verified account.
  const decision = body.decision as ReviewDecision;
  if (typeof body.userId !== "string" || !UUID.test(body.userId) || !REVIEW_DECISIONS.includes(decision)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) || null : null;
  if (decision !== "verified" && !message) {
    // The user must be told why, or what is missing.
    return NextResponse.json({ error: "A message for the user is required" }, { status: 400 });
  }
  const category = (body.rejectionCategory ?? null) as RejectionCategory | null;
  if (decision === "rejected" && !REJECTION_CATEGORIES.includes(category as RejectionCategory)) {
    return NextResponse.json({ error: "A rejection category is required" }, { status: 400 });
  }

  const { data: outcome, error } = await db.rpc("verification_decide", {
    p_user_id: body.userId,
    p_decision: decision,
    p_message: message,
    p_category: decision === "rejected" ? category : null,
    p_note: note,
    p_reviewer: reviewer,
  });
  if (error) return refusal(error);
  const { data } = await db.from("profiles").select(LIST_FIELDS).eq("id", body.userId).maybeSingle();
  return NextResponse.json({ request: data, outcome });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Refusals raised by the database functions ('verification:<code>'); anything
// else is a failure, and nothing was written (one transaction).
const REFUSALS: Record<string, [number, string]> = {
  not_found: [404, "Not found"],
  already_decided: [409, "Request already decided"],
  no_request: [409, "No open request with evidence to approve"],
  no_document: [409, "No document to compare"],
  registry_not_matched: [409, "Record a match on the official register first"],
  no_registration: [409, "No registration details to verify"],
  details_changed: [409, "The profile details no longer match the request"],
  message_required: [400, "A message for the user is required"],
  category_required: [400, "A rejection category is required"],
  invalid_decision: [400, "Invalid input"],
};
function refusal(error: { message?: string }) {
  const code = /verification:([a-z_]+)/.exec(error.message ?? "")?.[1];
  const known = code ? REFUSALS[code] : undefined;
  if (known) return NextResponse.json({ error: known[1], code }, { status: known[0] });
  console.error("verification decision not saved:", error.message);
  return NextResponse.json({ error: "Service unavailable: nothing was changed" }, { status: 503 });
}
