import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/adminServer";
import { REVIEW_DECISIONS, serviceClient, type ReviewDecision } from "@/lib/verification";
import { OFFICIAL_REGISTER_URL, REGISTRY_RESULTS, REJECTION_CATEGORIES, type RegistryResult, type RejectionCategory } from "@/lib/verificationEvidence";

// Manual review of professional registrations by a PHYGO administrator
// (PHYGO_ADMIN_EMAILS, server-side only; see lib/auth/adminServer.ts).
//
// The administrator compares four separate things for each request:
//   1. the user's declaration (legal name, number, territorial Order);
//   2. the document received (opened through /api/admin/verification/document);
//   3. the result of their own check on the official register (recorded here);
//   4. the final decision.
// Nothing is checked automatically: no official register API is integrated.
// An approval needs a document and a recorded "match" on the official register.
// Every check and decision is kept in professional_verification_reviews.

const LIST_FIELDS =
  "id, display_name, practice_stage, professional_status, registry_country, registry_name, registration_number, verification_requested_at, verification_reviewed_at, verification_reviewed_by, verification_message";
const REQUEST_FIELDS =
  "id, user_id, status, legal_first_name, legal_last_name, registry_country, registry_name, registration_number, document_path, document_mime, document_size, document_deleted_at, declaration_version, declaration_accepted_at, submitted_at, registry_check, registry_checked_at, registry_checked_by, decided_at, decided_by, rejection_category, user_message";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  const { data, error } = await db
    .from("profiles")
    .select(LIST_FIELDS)
    .eq("professional_status", status)
    .order("verification_requested_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const ids = (data ?? []).map((p) => p.id);
  const { data: requests } = ids.length
    ? await db.from("professional_verification_requests").select(REQUEST_FIELDS).in("user_id", ids).order("submitted_at", { ascending: false })
    : { data: [] as Record<string, any>[] };
  const requestIds = (requests ?? []).map((r) => r.id);
  const { data: reviews } = requestIds.length
    ? await db.from("professional_verification_reviews").select("id, request_id, action, registry_check, rejection_category, internal_note, reviewer, created_at").in("request_id", requestIds).order("created_at", { ascending: true })
    : { data: [] as Record<string, any>[] };

  const rows = (data ?? []).map((p) => {
    const own = (requests ?? []).filter((r) => r.user_id === p.id);
    const latest = own[0] ?? null;
    return {
      ...p,
      request: latest && { ...latest, document_path: undefined, has_document: !!latest.document_path },
      history: (reviews ?? []).filter((v) => own.some((r) => r.id === v.request_id)),
    };
  });
  return NextResponse.json({ requests: rows, officialRegister: OFFICIAL_REGISTER_URL });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const reviewer = await reviewerLabel(req);
  const note = typeof body.internalNote === "string" ? body.internalNote.trim().slice(0, 1000) || null : null;

  // 1. Record the administrator's own check on the official register.
  if (body.action === "registry_check") {
    const result = body.result as RegistryResult;
    if (typeof body.requestId !== "string" || !REGISTRY_RESULTS.includes(result)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { data: request } = await db.from("professional_verification_requests").select("id, status").eq("id", body.requestId).maybeSingle();
    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!["pending", "needs_info"].includes(request.status)) return NextResponse.json({ error: "Request already decided" }, { status: 409 });
    const now = new Date().toISOString();
    const { error } = await db
      .from("professional_verification_requests")
      .update({ registry_check: result, registry_checked_at: now, registry_checked_by: reviewer })
      .eq("id", request.id);
    if (error) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    await db.from("professional_verification_reviews").insert({ request_id: request.id, action: "registry_check", registry_check: result, internal_note: note, reviewer, created_at: now });
    return NextResponse.json({ ok: true, registryCheck: result });
  }

  // 2. Final decision on the account (approve, ask for information, reject or revoke).
  const decision = body.decision as ReviewDecision;
  if (typeof body.userId !== "string" || !REVIEW_DECISIONS.includes(decision)) {
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

  const { data: target } = await db.from("profiles").select("professional_status, registration_number").eq("id", body.userId).maybeSingle();
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: latest } = await db
    .from("professional_verification_requests")
    .select("id, status, document_path, registry_check")
    .eq("user_id", body.userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (decision === "verified") {
    // Real verification, not self-declaration: an open request with its
    // document, and the administrator's own "match" on the official register.
    if (!latest || !["pending", "needs_info"].includes(latest.status)) {
      return NextResponse.json({ error: "No open request with evidence to approve", code: "no_request" }, { status: 409 });
    }
    if (!latest.document_path) return NextResponse.json({ error: "No document to compare", code: "no_document" }, { status: 409 });
    if (latest.registry_check !== "match") {
      return NextResponse.json({ error: "Record a match on the official register first", code: "registry_not_matched" }, { status: 409 });
    }
    if (!target.registration_number) {
      return NextResponse.json({ error: "No registration details to verify" }, { status: 409 });
    }
  }

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("profiles")
    .update({
      professional_status: decision,
      verification_reviewed_at: now,
      verification_reviewed_by: reviewer,
      verification_message: message,
    })
    .eq("id", body.userId)
    .select(LIST_FIELDS)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  if (latest) {
    const revoking = decision === "rejected" && target.professional_status === "verified";
    await db
      .from("professional_verification_requests")
      .update({
        status: decision,
        decided_at: now,
        decided_by: reviewer,
        rejection_category: decision === "rejected" ? category : null,
        user_message: message,
      })
      .eq("id", latest.id);
    await db.from("professional_verification_reviews").insert({
      request_id: latest.id,
      action: revoking ? "revoked" : decision,
      rejection_category: decision === "rejected" ? category : null,
      internal_note: note,
      reviewer,
      created_at: now,
    });
  }
  return NextResponse.json({ request: data });
}

/** The reviewing administrator's e-mail, or "api-token" for server-to-server calls. */
async function reviewerLabel(req: Request): Promise<string> {
  if (/^Bearer\s+/i.test(req.headers.get("authorization") ?? "")) return "api-token";
  const cookieStore = cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { get: (name: string) => cookieStore.get(name)?.value },
  });
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? "admin";
}
