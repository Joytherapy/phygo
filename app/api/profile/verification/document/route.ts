import { requireUser } from "@/lib/auth/sessionServer";
import { serviceClient } from "@/lib/verification";
import { documentError, serveVerificationDocument } from "@/lib/verificationDocument";
import { consumeHourly, HOURLY_LIMITS } from "@/lib/rateLimit";

// The signed-in user's OWN latest verification document, streamed by the
// server (lib/verificationDocument.ts): no signed URL or Storage credential
// reaches the browser. The request is looked up by the session's user id
// only; any id, path or file name in the URL is ignored, so another user's
// file is unreachable.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return documentError(gate.response.status, gate.response.status === 401 ? "Not authenticated" : "Forbidden");
  const limited = await consumeHourly(`verification-document:${gate.user.id}`, HOURLY_LIMITS.verificationDocument);
  if (limited === "limited") return documentError(429, "Too many requests");
  if (limited !== "allowed") return documentError(503, "Service unavailable");
  const db = serviceClient();
  if (!db) return documentError(503, "Service unavailable");
  const { data, error } = await db
    .from("professional_verification_requests")
    .select("id, user_id, document_path, document_mime")
    .eq("user_id", gate.user.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return documentError(503, "Service unavailable");
  return serveVerificationDocument(db, data);
}
