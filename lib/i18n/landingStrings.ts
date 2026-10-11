// PHYGO public landing page strings (/, /it, /es, /fr) — kept as its own
// additive file, like lib/i18n/agendaStrings.ts and quizStrings.ts, so the
// shared uiStrings.ts dictionary is not edited for a single feature.
//
// Every visible string, aria label and metadata field of the landing page
// lives here. Each language is written natively rather than translated
// literally. Conventions:
// - "*text*" marks the serif-italic accent inside a headline (see Rich in
//   components/landing/ui.tsx); "\n" marks a deliberate line break.
// - "{n}", "{name}", "{conditions}", "{exercises}" are filled at render time.
// - French typography (narrow no-break spaces before ; : ! ? and inside « »)
//   is applied automatically by frenchTypography() below.

import type { AppLang } from '@/lib/i18n/uiStrings';
import { en } from './landing/en';
import { it } from './landing/it';
import { es } from './landing/es';
import { fr } from './landing/fr';

export type CoverageLabelKey =
  | 'goals'
  | 'clinical_tests'
  | 'red_flags'
  | 'contraindications'
  | 'typical_exercises'
  | 'progression_criteria'
  | 'return_to_activity_criteria'
  | 'outcome_measures'
  | 'source'
  | 'phased';

type TitleText = { title: string; text: string };

export interface LandingDict {
  meta: { title: string; description: string; descriptionNoCount: string; ogLocale: string };
  nav: {
    tour: string;
    library: string;
    pricing: string;
    faq: string;
    login: string;
    startFree: string;
    openMenu: string;
    closeMenu: string;
    language: string;
    darkMode: string;
    lightMode: string;
    home: string;
    skip: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    sub: string;
    conditionsPhrase: string;
    conditionsFallback: string;
    exercisesPhrase: string;
    exercisesFallback: string;
    ctaPrimary: string;
    ctaSecondary: string;
    assurances: string[];
    caption: string;
    stage: {
      windowTitle: string;
      draft: string;
      sidebar: string[];
      voiceLabel: string;
      voiceText: string;
      linkedLabel: string;
      evidence: string;
      exerciseLabel: string;
      phasesLabel: string;
      reviewSave: string;
      ariaLabel: string;
    };
  };
  proof: {
    conditions: string;
    exercises: string;
    protocols: string;
    languages: string;
    mapsValue: string;
    maps: string;
  };
  story: {
    eyebrow: string;
    title: string;
    intro: string;
    caseLabel: string;
    chapters: { kicker: string; title: string; text: string }[];
    listening: string;
    languagesPill: string;
    transcript: string;
    soapLabels: [string, string, string, string];
    soap: [string, string, string, string];
    reasoning: { label: string; text: string }[];
    linkedLabel: string;
    region: string;
    exercises: { name: string; dose: string }[];
    videoLabel: string;
    fromLibrary: string;
    phasesLabel: string;
    current: string;
    review: string;
    savedTo: string;
    portalTitle: string;
    portalText: string;
    pdf: string;
    caption: string;
    chapterNav: string;
  };
  library: {
    eyebrow: string;
    title: string;
    titleNoCount: string;
    intro: string;
    countLabel: string;
    namesLabel: string;
    coverageTitle: string;
    coverageLive: string;
    fields: Record<CoverageLabelKey, string>;
    coverageNote: string;
    featuredKicker: string;
    evidence: string;
    levels: Record<string, string>;
    tabs: { goals: string; clinical_tests: string; red_flags: string; typical_exercises: string };
    phasesLabel: string;
    excerptTranslated: string;
    excerptSource: string;
    openEntry: string;
    cta: string;
    languages: string;
    tablistLabel: string;
  };
  anatomy: {
    eyebrow: string;
    title: string;
    intro: string;
    body: TitleText & { regions: string[]; caption: string; svgLabel: string };
    brain: TitleText & { alt: string; caption: string };
    systemsLabel: string;
    systems: string[];
  };
  tools: {
    eyebrow: string;
    title: string;
    intro: string;
    columns: (TitleText & { items: string[] })[];
  };
  workspace: { eyebrow: string; title: string; intro: string; items: TitleText[] };
  trust: { eyebrow: string; title: string; intro: string; items: TitleText[]; privacy: string };
  pricing: {
    eyebrow: string;
    title: string;
    sub: string;
    monthly: string;
    annual: string;
    save: string;
    perMonth: string;
    custom: string;
    popular: string;
    billingLabel: string;
    tiers: { description: string; features: string[]; cta: string }[];
  };
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  final: { title: string; text: string; cta: string; secondary: string; note: string };
  footer: {
    tagline: string;
    product: string;
    library: string;
    pricing: string;
    privacy: string;
    terms: string;
    contact: string;
    rights: string;
    languageLabel: string;
  };
  common: { illustrative: string };
}

/** Applies French typographic spacing to every string in a dictionary. */
function frenchTypography<T>(value: T): T {
  if (typeof value === 'string') {
    return value
      .replace(/ ([;:!?»])/g, ' $1')
      .replace(/« /g, '« ')
      .replace(/(\d) %/g, '$1 %') as unknown as T;
  }
  if (Array.isArray(value)) return value.map(frenchTypography) as unknown as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, frenchTypography(v)])) as T;
  }
  return value;
}

export const LANDING_STRINGS: Record<AppLang, LandingDict> = {
  en,
  it,
  es,
  fr: frenchTypography(fr),
};

/** BCP 47 tags for Intl formatting and <html lang>. */
export const LANDING_LOCALE: Record<AppLang, string> = {
  en: 'en-GB',
  it: 'it-IT',
  es: 'es-ES',
  fr: 'fr-FR',
};

/** Landing page path per language. English is the international default at "/". */
export const LANDING_PATH: Record<AppLang, string> = {
  en: '/',
  it: '/it',
  es: '/es',
  fr: '/fr',
};

/** Order in which languages are offered in the switcher. */
export const LANDING_LANGS: AppLang[] = ['en', 'it', 'es', 'fr'];

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? String(vars[key]) : m));
}

export function formatNumber(lang: AppLang, n: number): string {
  return new Intl.NumberFormat(LANDING_LOCALE[lang]).format(n);
}

export function formatPrice(lang: AppLang, amount: number): string {
  return new Intl.NumberFormat(LANDING_LOCALE[lang], {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(amount);
}
