import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/adminServer";
import { serviceClient } from "@/lib/verification";
import { SIGNED_URL_SECONDS, VERIFICATION_BUCKET } from "@/lib/verificationEvidence";

// A verification document for the reviewing administrator, as a signed URL
// valid for SIGNED_URL_SECONDS. requireAdmin (PHYGO_ADMIN_EMAILS, server-side
// only) runs before anything is read. Admin status opens this document and
// nothing else: it grants no access to patient data.
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const requestId = new URL(req.url).searchParams.get("requestId") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data: request } = await db
    .from("professional_verification_requests")
    .select("document_path, document_mime")
    .eq("id", requestId)
    .maybeSingle();
  if (!request?.document_path) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data, error } = await db.storage.from(VERIFICATION_BUCKET).createSignedUrl(request.document_path, SIGNED_URL_SECONDS);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  return NextResponse.json({ url: data.signedUrl, mime: request.document_mime, expiresIn: SIGNED_URL_SECONDS }, { headers: { "Cache-Control": "no-store" } });
}
