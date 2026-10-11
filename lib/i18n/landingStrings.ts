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
    audiences: string;
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
  audiences: {
    eyebrow: string;
    title: string;
    intro: string;
    spine: string;
    /** Students, physiotherapists, patients (My Phygo) — in this order. */
    paths: {
      label: string;
      title: string;
      text: string;
      items: string[];
      /** Shown only when video calls are configured (DAILY_API_KEY). */
      videoItem: string;
      note: string;
      cta: string;
      hint: string;
    }[];
  };
  story: {
    eyebrow: string;
    title: string;
    intro: string;
    caseLabel: string;
    roles: { phygo: string; you: string };
    /** Schedule, document, plan, export, follow up — in this order. */
    chapters: { kicker: string; title: string; text: string; videoText: string; phygo: string; you: string }[];
    agenda: {
      title: string;
      days: string[];
      patientA: string;
      patientB: string;
      patientC: string;
      inPerson: string;
      remote: string;
      request: string;
      requestWhen: string;
      confirm: string;
      decline: string;
      call: string;
      callText: string;
    };
    listening: string;
    languagesPill: string;
    transcript: string;
    soapLabels: [string, string, string, string];
    soap: [string, string, string, string];
    reasoning: { label: string; text: string }[];
    linkedLabel: string;
    exercises: { name: string; dose: string }[];
    videoLabel: string;
    fromLibrary: string;
    phasesLabel: string;
    current: string;
    pdf: { file: string; sections: string[]; download: string; scanTitle: string; scanText: string; scanNote: string };
    record: { title: string; entries: { when: string; text: string }[]; references: string; next: string };
    review: string;
    savedTo: string;
    portalTitle: string;
    portalText: string;
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
    growthLabel: string;
    growthNote: string;
    todayLabel: string;
    goalLabel: string;
    templateNote: string;
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
  trust: { eyebrow: string; title: string; intro: string; items: TitleText[]; privacy: string };
  pricing: {
    eyebrow: string;
    title: string;
    sub: string;
    /** The only offer that exists today: a free account. */
    today: { label: string; name: string; price: string; text: string; items: string[]; limits: string; cta: string };
    /** Paid plans are planned, not purchasable (there is no checkout). */
    planned: { label: string; status: string; note: string };
    monthly: string;
    annual: string;
    save: string;
    perMonth: string;
    custom: string;
    billingLabel: string;
    notYet: string;
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
    navLabel: string;
    languageLabel: string;
  };
  common: { illustrative: string };
}

/** Applies French typographic spacing to every string in a dictionary. */
export function frenchTypography<T>(value: T): T {
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

/**
 * Localized path of a public page. English keeps the unprefixed URL
 * (/privacy), the other languages are prefixed (/it/privacy), matching the
 * landing (/, /it) and library (/library, /en/library) conventions.
 */
export type PublicPage = 'privacy' | 'terms' | 'contact';
export function publicPath(lang: AppLang, page: PublicPage): string {
  return lang === 'en' ? `/${page}` : `/${lang}/${page}`;
}

/** Same page in every language, for language switchers and hreflang. */
export function publicPathsFor(page: PublicPage): Record<AppLang, string> {
  return { en: publicPath('en', page), it: publicPath('it', page), es: publicPath('es', page), fr: publicPath('fr', page) };
}

/** Entry points that keep the visitor's language (read by the login and My Phygo pages). */
export function signupHref(lang: AppLang): string {
  return `/login?mode=signup&lang=${lang}`;
}
export function loginHref(lang: AppLang): string {
  return `/login?lang=${lang}`;
}
export function myPhygoLoginHref(lang: AppLang): string {
  return `/my-phygo/login?lang=${lang}`;
}

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
