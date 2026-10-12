import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/sessionServer";
import { serviceClient } from "@/lib/verification";
import { SIGNED_URL_SECONDS, VERIFICATION_BUCKET } from "@/lib/verificationEvidence";

// The signed-in user's OWN latest verification document, as a short-lived
// signed URL. The request is looked up by the session's user id only: no id
// or path from the client is accepted, so another user's file is unreachable.
export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data: request } = await db
    .from("professional_verification_requests")
    .select("document_path, document_mime")
    .eq("user_id", gate.user.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!request?.document_path) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data, error } = await db.storage.from(VERIFICATION_BUCKET).createSignedUrl(request.document_path, SIGNED_URL_SECONDS);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  return NextResponse.json({ url: data.signedUrl, mime: request.document_mime, expiresIn: SIGNED_URL_SECONDS }, { headers: { "Cache-Control": "no-store" } });
}
