import { NextResponse } from "next/server";
import { hasCronSecret } from "@/lib/auth/adminServer";
import { serviceClient } from "@/lib/verification";
import { VERIFICATION_BUCKET } from "@/lib/verificationEvidence";

// Retention of verification data, by category. Everything is OFF: each step
// runs only when its own variable is set to a number of days, and no period
// has been approved yet (see docs/security/verification-evidence.md).
//   VERIFICATION_DOCUMENT_RETENTION_DAYS  document files, counted from the
//     final decision (approved, rejected or superseded). The file is removed
//     from storage, then checked to be gone; only then is document_path
//     cleared and document_deleted_at set. Status, decision and history stay.
//   VERIFICATION_NOTE_RETENTION_DAYS  internal notes in the history, counted
//     from the entry: the note is removed, the entry stays.
//   VERIFICATION_HISTORY_RETENTION_DAYS  older requests, counted from their
//     decision, with their history entries (foreign-key cascade). Never the
//     latest request of an account, nor its latest approved one.
// Not scheduled in vercel.json; call with "Authorization: Bearer <CRON_SECRET>".
const DAY = 24 * 60 * 60 * 1000;
// Supabase returns at most 1,000 rows per query, so every list is read in
// pages, in a stable order, before anything is changed.
const PAGE = 1000;
const days = (name: string) => {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
};

export async function GET(req: Request) {
  if (!hasCronSecret(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const documentDays = days("VERIFICATION_DOCUMENT_RETENTION_DAYS");
  const noteDays = days("VERIFICATION_NOTE_RETENTION_DAYS");
  const historyDays = days("VERIFICATION_HISTORY_RETENTION_DAYS");
  if (!documentDays && !noteDays && !historyDays) return NextResponse.json({ configured: false, deleted: 0 });

  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const report: Record<string, unknown> = { configured: true };

  if (documentDays) {
    const { data, error } = await readAll((from, to) =>
      db
        .from("professional_verification_requests")
        .select("id, user_id, document_path, decided_at, status")
        .in("status", ["verified", "rejected", "superseded"])
        .order("id")
        .range(from, to),
    );
    if (error) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    const cutoff = Date.now() - documentDays * DAY;
    const due = (data ?? []).filter((r) => r.document_path && r.decided_at && Date.parse(r.decided_at) < cutoff);
    let deleted = 0;
    let failed = 0;
    for (const r of due) {
      const path = r.document_path as string;
      if (!(await removeAndConfirm(db, path))) {
        failed++;
        continue;
      }
      const { error: updateError } = await db
        .from("professional_verification_requests")
        .update({ document_path: null, document_deleted_at: new Date().toISOString() })
        .eq("id", r.id);
      if (updateError) failed++;
      else deleted++;
    }
    Object.assign(report, { retentionDays: documentDays, deleted, failed });
  }

  if (noteDays) {
    const cutoff = Date.now() - noteDays * DAY;
    const { data, error } = await readAll((from, to) =>
      db
        .from("professional_verification_reviews")
        .select("id, created_at, internal_note, note_redacted_at")
        .is("note_redacted_at", null)
        .order("id")
        .range(from, to),
    );
    if (error) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    let redacted = 0;
    for (const r of (data ?? []).filter((x) => x.internal_note && Date.parse(x.created_at) < cutoff)) {
      const { error: redactError } = await db
        .from("professional_verification_reviews")
        .update({ internal_note: null, note_redacted_at: new Date().toISOString() })
        .eq("id", r.id);
      if (!redactError) redacted++;
    }
    Object.assign(report, { noteRetentionDays: noteDays, notesRemoved: redacted });
  }

  if (historyDays) {
    // Newest first across all pages: the first row seen for an account is its
    // latest request.
    const { data, error } = await readAll((from, to) =>
      db
        .from("professional_verification_requests")
        .select("id, user_id, status, submitted_at, decided_at, document_path")
        .order("submitted_at", { ascending: false })
        .order("id")
        .range(from, to),
    );
    if (error) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    const cutoff = Date.now() - historyDays * DAY;
    const keep = new Set<string>();
    const seen = new Set<string>();
    const seenApproved = new Set<string>();
    for (const r of data ?? []) {
      if (!seen.has(r.user_id)) {
        seen.add(r.user_id);
        keep.add(r.id); // latest request of the account
      }
      if (r.status === "verified" && !seenApproved.has(r.user_id)) {
        seenApproved.add(r.user_id);
        keep.add(r.id); // latest approval: the basis of the current status
      }
    }
    let removed = 0;
    for (const r of (data ?? []).filter((x) => !keep.has(x.id) && x.decided_at && Date.parse(x.decided_at) < cutoff)) {
      if (r.document_path && !(await removeAndConfirm(db, r.document_path))) continue;
      const { error: deleteError } = await db.from("professional_verification_requests").delete().eq("id", r.id);
      if (!deleteError) removed++;
    }
    Object.assign(report, { historyRetentionDays: historyDays, requestsRemoved: removed });
  }

  return NextResponse.json(report);
}

/** Reads every page of a query; any page error fails the whole read. */
async function readAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) return { data: null, error };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return { data: rows, error: null };
  }
}

/** Removes a document from storage and confirms it is no longer listed in its folder. */
async function removeAndConfirm(db: NonNullable<ReturnType<typeof serviceClient>>, path: string): Promise<boolean> {
  const storage = db.storage.from(VERIFICATION_BUCKET);
  const { error } = await storage.remove([path]);
  if (error) {
    console.error("verification retention: document not removed");
    return false;
  }
  const slash = path.lastIndexOf("/");
  const { data: left, error: listError } = await storage.list(path.slice(0, slash), { search: path.slice(slash + 1) });
  if (listError || (left ?? []).some((f) => f.name === path.slice(slash + 1))) {
    console.error("verification retention: document still present after removal");
    return false;
  }
  return true;
}
