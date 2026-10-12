import { NextResponse } from "next/server";
import { hasCronSecret } from "@/lib/auth/adminServer";
import { serviceClient } from "@/lib/verification";
import { VERIFICATION_BUCKET } from "@/lib/verificationEvidence";

// Deletes verification documents once the configured retention has passed
// after the final decision. OFF unless VERIFICATION_DOCUMENT_RETENTION_DAYS is
// set: no retention period has been approved yet, so production deletes
// nothing until the owner confirms one (see the PR and the release guide).
// Only the file goes: the request row (status, decision, declaration, registry
// check) and the review history stay, with document_deleted_at set.
// Not scheduled in vercel.json; call with "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: Request) {
  if (!hasCronSecret(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const days = Number.parseInt(process.env.VERIFICATION_DOCUMENT_RETENTION_DAYS ?? "", 10);
  if (!Number.isFinite(days) || days < 1) return NextResponse.json({ configured: false, deleted: 0 });

  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data, error } = await db
    .from("professional_verification_requests")
    .select("id, document_path, decided_at, status")
    .in("status", ["verified", "rejected", "superseded"]);
  if (error) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const due = (data ?? []).filter((r) => r.document_path && r.decided_at && Date.parse(r.decided_at) < cutoff);
  let deleted = 0;
  for (const r of due) {
    const { error: removeError } = await db.storage.from(VERIFICATION_BUCKET).remove([r.document_path as string]);
    if (removeError) continue;
    await db
      .from("professional_verification_requests")
      .update({ document_path: null, document_deleted_at: new Date().toISOString() })
      .eq("id", r.id);
    deleted++;
  }
  return NextResponse.json({ configured: true, retentionDays: days, deleted });
}
