// Serves a professional verification document through the server, so the
// browser never receives a Storage URL, a signed token or any Storage
// credential. Used only by the two document routes, after their own
// permission check (the document's owner, or a signed-in administrator).
//
// For every request:
//   - the storage path comes from the database row, never from the client,
//     and must sit in the owner's folder for that request;
//   - the file is read from the private bucket with the service role, with a
//     random cacheNonce so no Storage CDN entry is ever reused;
//   - the bytes are checked again (size, real type from the first bytes,
//     agreement with the type recorded at upload) before anything is sent;
//   - the response forbids caching by the browser, proxies and the
//     application CDN, is a download (never rendered as a page of this site),
//     and carries no-sniff and a restrictive Content-Security-Policy.
// Nothing about the path, the file or its contents is logged.
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_DOCUMENT_BYTES, VERIFICATION_BUCKET, sniffDocument } from "@/lib/verificationEvidence";

export const NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0",
  Vary: "Cookie, Authorization",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

const FILE_HEADERS: Record<string, string> = {
  ...NO_STORE_HEADERS,
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; sandbox",
  "Cross-Origin-Resource-Policy": "same-origin",
};

const EXTENSION: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };

/** A JSON error with the same no-store headers (errors are never cached either). */
export function documentError(status: number, error: string): NextResponse {
  return NextResponse.json({ error }, { status, headers: NO_STORE_HEADERS });
}

export type DocumentRow = { id: string; user_id: string; document_path: string | null; document_mime: string | null };

export async function serveVerificationDocument(db: SupabaseClient, row: DocumentRow | null): Promise<Response> {
  if (!row?.document_path) return documentError(404, "Not found");
  const path = row.document_path;
  // Same rule as the database constraint verification_document_in_owner_folder.
  if (!path.startsWith(`${row.user_id}/${row.id}/`) || path.includes("..")) {
    console.error("verification document: stored path outside the owner folder");
    return documentError(500, "Document unavailable");
  }
  const expected = row.document_mime ?? "";
  if (!EXTENSION[expected]) return documentError(500, "Document unavailable");

  const { data, error } = await db.storage.from(VERIFICATION_BUCKET).download(path, { cacheNonce: randomUUID() }, { cache: "no-store" });
  if (error || !data) {
    console.error("verification document: download failed");
    return documentError(503, "Service unavailable");
  }
  const bytes = new Uint8Array(await data.arrayBuffer());
  const detected = bytes.length > 0 && bytes.length <= MAX_DOCUMENT_BYTES ? sniffDocument(bytes) : null;
  if (!detected || detected.mime !== expected) {
    console.error("verification document: stored file does not match its recorded type");
    return documentError(500, "Document unavailable");
  }
  return new Response(bytes, {
    status: 200,
    headers: {
      ...FILE_HEADERS,
      "Content-Type": expected,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `attachment; filename="phygo-verification-document.${EXTENSION[expected]}"`,
    },
  });
}
