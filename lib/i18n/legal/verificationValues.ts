// Values for the professional-verification sections of the privacy notice and
// the Terms (generated from docs/legal, see verification.generated.ts).
//
// NOTHING IS PUBLISHED until both are true:
//   1. every value below is set, in all four languages (an empty string is a
//      valid value only for DPO_SENTENCE, meaning "no DPO sentence");
//   2. LEGAL_REVIEW_APPROVED is true, set in its own commit once the lawyer has
//      approved the Italian text (decision D12 in docs/release/DECISIONS.md).
// Until then /privacy and /terms show exactly what they show today.
// The decisions behind each value: docs/release/DECISIONS.md (D1–D11).
import type { AppLang } from '@/lib/i18n/uiStrings';

export const VERIFICATION_PLACEHOLDERS = [
  'CONTROLLER', // D1
  'PRIVACY_CONTACT', // D2
  'DPO_SENTENCE', // D2 ('' when no DPO is appointed)
  'ADMINS', // D3
  'LEGAL_BASIS', // D4, lawyer
  'FUNCTION_REGION', // D7
  'TRANSFER_SAFEGUARDS', // D8, lawyer
  'RETENTION_DOCUMENT', // D9
  'RETENTION_NOTES', // D9
  'RETENTION_HISTORY', // D9
  'TRANSITION_DAYS', // D10
  'GOVERNING_LAW', // D11: the full sentence of Terms §12
] as const;

export type VerificationPlaceholder = (typeof VERIFICATION_PLACEHOLDERS)[number];

export const VERIFICATION_VALUES: Record<AppLang, Partial<Record<VerificationPlaceholder, string>>> = {
  it: {},
  en: {},
  es: {},
  fr: {},
};

export const LEGAL_REVIEW_APPROVED = false;
