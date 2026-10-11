import type { AppLang } from '@/lib/i18n/uiStrings';
import { frenchTypography } from '@/lib/i18n/landingStrings';
import type { LegalDict } from './types';
import { en } from './en';
import { it } from './it';
import { es } from './es';
import { fr } from './fr';

export type { LegalDict, LegalDoc, LegalBlock, ContactDoc } from './types';

export const LEGAL_STRINGS: Record<AppLang, LegalDict> = { en, it, es, fr: frenchTypography(fr) };
