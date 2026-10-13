import type { AppLang } from '@/lib/i18n/uiStrings';
import type { LegalDict, LegalSection } from './types';
import { VERIFICATION_TEXTS } from './verification.generated';
import {
  LEGAL_REVIEW_APPROVED,
  VERIFICATION_PLACEHOLDERS,
  VERIFICATION_VALUES,
  type VerificationPlaceholder,
} from './verificationValues';

const LANGS: AppLang[] = ['it', 'en', 'es', 'fr'];
export const PRIVACY_ANCHOR = 'professional-verification';

/** Every value set in every language, and the legal review approved. */
export function verificationTextsReady(
  values = VERIFICATION_VALUES,
  approved = LEGAL_REVIEW_APPROVED,
): boolean {
  return approved && LANGS.every((l) => VERIFICATION_PLACEHOLDERS.every((k) => typeof values[l][k] === 'string' && (k === 'DPO_SENTENCE' || values[l][k]!.trim() !== '')));
}

function fill<T>(value: T, values: Partial<Record<VerificationPlaceholder, string>>): T {
  if (typeof value === 'string') {
    return value
      .replace(/\{\{([A-Z_]+)\}\}/g, (m, k: VerificationPlaceholder) => values[k] ?? m)
      .replace(/ {2,}/g, ' ')
      .trim() as unknown as T;
  }
  if (Array.isArray(value)) return value.map((v) => fill(v, values)) as unknown as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v, values)])) as T;
  return value;
}

/**
 * Adds the professional-verification section to the privacy notice (anchor
 * #professional-verification), Terms §3A after §3, and the governing law in
 * Terms §12, only when verificationTextsReady(). Otherwise returns the
 * dictionary unchanged.
 */
export function withVerification(dict: LegalDict, lang: AppLang, values = VERIFICATION_VALUES, approved = LEGAL_REVIEW_APPROVED): LegalDict {
  if (!verificationTextsReady(values, approved)) return dict;
  const v = values[lang];
  const texts = fill(VERIFICATION_TEXTS[lang], v);
  const privacySection: LegalSection = { ...texts.privacy, title: `${dict.privacy.sections.length + 1}. ${texts.privacy.title}`, id: PRIVACY_ANCHOR };
  const terms = [...dict.terms.sections];
  const eligibility = terms.findIndex((s) => s.title.startsWith('3.'));
  const law = terms.findIndex((s) => s.title.startsWith('12.'));
  if (eligibility < 0 || law < 0) throw new Error(`legal ${lang}: Terms §3 or §12 not found`);
  terms[law] = { ...terms[law], blocks: [v.GOVERNING_LAW!] };
  terms.splice(eligibility + 1, 0, { ...texts.terms, id: 'professional-verification' });
  return {
    ...dict,
    privacy: { ...dict.privacy, sections: [...dict.privacy.sections, privacySection] },
    terms: { ...dict.terms, sections: terms },
  };
}
