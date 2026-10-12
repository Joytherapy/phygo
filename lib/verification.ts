// Professional verification: shared rules for the profile and admin APIs.
// See sql/2026-10_professional_verification_PROPOSED.sql for the data model.
//
// PHYGO does not query any official register automatically: no supported
// registry API is integrated. A PHYGO administrator checks each request by
// hand against the official public register of the country named in the
// request, then approves, rejects or asks for more information.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serviceRoleConfigProblem } from "@/lib/supabase/serverConfig";

export const VERIFICATION_STATUSES = ["not_applicable", "pending", "needs_info", "verified", "rejected"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export const REVIEW_DECISIONS = ["verified", "rejected", "needs_info"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

export type VerificationRequest = {
  registryCountry: string;
  registryName: string;
  registrationNumber: string;
};

let admin: SupabaseClient | null = null;
export function serviceClient(): SupabaseClient | null {
  const problem = serviceRoleConfigProblem();
  if (problem) {
    console.error("verification: server configuration problem:", problem);
    return null;
  }
  admin ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  return admin;
}

const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

/** Validates and normalises a submission; returns the fields or a list of error keys. */
export function parseVerificationRequest(body: unknown): { ok: true; value: VerificationRequest } | { ok: false; errors: string[] } {
  const b = (body ?? {}) as Record<string, unknown>;
  const registryCountry = clean(b.registryCountry).toUpperCase();
  const registryName = clean(b.registryName);
  const registrationNumber = clean(b.registrationNumber);
  const errors: string[] = [];
  if (!/^[A-Z]{2}$/.test(registryCountry)) errors.push("registryCountry");
  if (registryName.length < 2 || registryName.length > 120) errors.push("registryName");
  if (!/^[A-Za-z0-9][A-Za-z0-9 ./\-]{0,39}$/.test(registrationNumber)) errors.push("registrationNumber");
  return errors.length ? { ok: false, errors } : { ok: true, value: { registryCountry, registryName, registrationNumber } };
}
