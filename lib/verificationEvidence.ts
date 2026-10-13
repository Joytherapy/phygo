// Professional verification with evidence (sql/2026-10_verification_evidence_PROPOSED.sql).
//
// The registration document is stored in a PRIVATE bucket that only the server
// (service role) can reach. Every read goes through a server-side permission
// check and returns a signed URL valid for SIGNED_URL_SECONDS. Uploading a
// document never grants anything: the request stays 'pending' until an
// administrator has checked the official register by hand and approved it.
//
// Nothing here queries a register automatically: no official API is integrated.
// Never log document contents, storage paths of other users or signed URLs.
import { randomUUID } from "crypto";

export const VERIFICATION_BUCKET = "verification-documents";
/** Below Vercel's 4.5 MB request body limit for serverless functions. */
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
export const SIGNED_URL_SECONDS = 60;
/** Bump when the declaration text changes; the accepted version is stored with each request. */
export const DECLARATION_VERSION = "2026-10-12.v1";
/** Official public register of Italian physiotherapists (FNOFI / OFI), checked by hand. */
export const OFFICIAL_REGISTER_URL = "https://albo.alboweb-fnofi.net/registry/search";

export const REGISTRY_RESULTS = ["match", "mismatch", "not_found"] as const;
export type RegistryResult = (typeof REGISTRY_RESULTS)[number];
export const REJECTION_CATEGORIES = ["not_in_register", "data_mismatch", "document_unreadable", "document_not_valid", "other"] as const;
export type RejectionCategory = (typeof REJECTION_CATEGORIES)[number];

type DocType = { mime: "application/pdf" | "image/jpeg" | "image/png"; ext: "pdf" | "jpg" | "png" };
const EXTENSIONS: Record<string, DocType["ext"]> = { pdf: "pdf", jpg: "jpg", jpeg: "jpg", png: "png" };

/** The file's real type from its first bytes; null for anything else. */
export function sniffDocument(bytes: Uint8Array): DocType | null {
  const starts = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts([0x25, 0x50, 0x44, 0x46, 0x2d])) return { mime: "application/pdf", ext: "pdf" }; // %PDF-
  if (starts([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: "png" };
  return null;
}

/**
 * Checks size, extension and real type together. The client's file name and
 * MIME type are never trusted on their own: the extension must be allowed
 * and agree with the bytes.
 */
export function checkDocument(fileName: string, bytes: Uint8Array): { ok: true; type: DocType } | { ok: false; error: "document_missing" | "document_too_large" | "document_type" } {
  if (bytes.length === 0) return { ok: false, error: "document_missing" };
  if (bytes.length > MAX_DOCUMENT_BYTES) return { ok: false, error: "document_too_large" };
  const ext = EXTENSIONS[(fileName.split(".").pop() ?? "").toLowerCase()];
  const type = sniffDocument(bytes);
  if (!ext || !type || ext !== type.ext) return { ok: false, error: "document_type" };
  return { ok: true, type };
}

/** Server-generated, unguessable path inside the owner's folder; never taken from the client. */
export function documentPath(userId: string, requestId: string, ext: DocType["ext"]): string {
  return `${userId}/${requestId}/${randomUUID()}.${ext}`;
}

export type EvidenceFields = {
  legalFirstName: string;
  legalLastName: string;
  registryCountry: string;
  registryName: string;
  registrationNumber: string;
};

const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
const NAME = /^[\p{L}][\p{L}\p{M} .'’-]{0,79}$/u;

/** Validates the submitted fields and the declaration; returns the fields or the list of invalid ones. */
export function parseEvidenceForm(form: { get(name: string): unknown }):
  | { ok: true; value: EvidenceFields }
  | { ok: false; errors: string[] } {
  const value: EvidenceFields = {
    legalFirstName: clean(form.get("legalFirstName")),
    legalLastName: clean(form.get("legalLastName")),
    registryCountry: clean(form.get("registryCountry")).toUpperCase(),
    registryName: clean(form.get("registryName")),
    registrationNumber: clean(form.get("registrationNumber")),
  };
  const errors: string[] = [];
  if (!NAME.test(value.legalFirstName)) errors.push("legalFirstName");
  if (!NAME.test(value.legalLastName)) errors.push("legalLastName");
  if (!/^[A-Z]{2}$/.test(value.registryCountry)) errors.push("registryCountry");
  if (value.registryName.length < 2 || value.registryName.length > 120) errors.push("registryName");
  if (!/^[A-Za-z0-9][A-Za-z0-9 ./\-]{0,39}$/.test(value.registrationNumber)) errors.push("registrationNumber");
  // The declaration must be accepted explicitly, in the version shown to the user.
  if (form.get("declarationAccepted") !== "true" || form.get("declarationVersion") !== DECLARATION_VERSION) errors.push("declaration");
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

/** What the user may see of their own latest request: no reviewer identity, no internal notes. */
export function requestForUser(r: Record<string, any> | null) {
  if (!r) return null;
  return {
    id: r.id,
    status: r.status,
    legalFirstName: r.legal_first_name,
    legalLastName: r.legal_last_name,
    submittedAt: r.submitted_at,
    // Sent by an already verified account with unchanged details: the
    // account stayed verified while this request is reviewed.
    whileVerified: !!r.submitted_while_verified,
    decidedAt: r.decided_at ?? null,
    hasDocument: !!r.document_path,
    documentDeleted: !!r.document_deleted_at,
    declarationVersion: r.declaration_version,
    message: r.user_message ?? null,
  };
}
