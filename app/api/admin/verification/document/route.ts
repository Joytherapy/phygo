import { requireAdminSession } from "@/lib/auth/adminServer";
import { serviceClient } from "@/lib/verification";
import { documentError, serveVerificationDocument } from "@/lib/verificationDocument";
import { consumeHourly, HOURLY_LIMITS } from "@/lib/rateLimit";

// A verification document for a signed-in administrator, streamed by the
// server (lib/verificationDocument.ts): no signed URL or Storage credential
// reaches the browser. Only an administrator session is accepted: no bearer
// token (CRON_SECRET or API token) opens documents. The request id must be a
// UUID and the storage path comes from that row only; administrator status
// grants nothing else (no clinical permission, no patient data).
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) return documentError(admin.response.status, admin.response.status === 401 ? "Not authenticated" : "Forbidden");
  const params = new URL(req.url).searchParams;
  const requestId = params.get("requestId") ?? "";
  if (params.getAll("requestId").length !== 1 || !UUID.test(requestId)) return documentError(400, "Invalid input");
  const limited = await consumeHourly(`verification-document-admin:${admin.userId}`, HOURLY_LIMITS.verificationDocumentAdmin);
  if (limited === "limited") return documentError(429, "Too many requests");
  if (limited !== "allowed") return documentError(503, "Service unavailable");
  const db = serviceClient();
  if (!db) return documentError(503, "Service unavailable");
  const { data, error } = await db
    .from("professional_verification_requests")
    .select("id, user_id, document_path, document_mime")
    .eq("id", requestId)
    .maybeSingle();
  if (error) return documentError(503, "Service unavailable");
  return serveVerificationDocument(db, data);
}
