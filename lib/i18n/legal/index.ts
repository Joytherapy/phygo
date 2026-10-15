import type { AppLang } from '@/lib/i18n/uiStrings';
import { frenchTypography } from '@/lib/i18n/landingStrings';
import type { LegalDict } from './types';
import { withVerification } from './withVerification';
import { en } from './en';
import { it } from './it';
import { es } from './es';
import { fr } from './fr';

export type { LegalDict, LegalDoc, LegalBlock, LegalListItem, LegalSection, ContactDoc } from './types';

// The professional-verification texts are added only once every value is set
// and the legal review is approved (see verificationValues.ts).
export const LEGAL_STRINGS: Record<AppLang, LegalDict> = {
  en: withVerification(en, 'en'),
  it: withVerification(it, 'it'),
  es: withVerification(es, 'es'),
  fr: frenchTypography(withVerification(fr, 'fr')),
};
