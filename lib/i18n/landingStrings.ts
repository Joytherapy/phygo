// PHYGO public landing page strings (/, /it, /es, /fr) — kept as its own
// additive file, like lib/i18n/agendaStrings.ts and quizStrings.ts, so the
// shared uiStrings.ts dictionary is not edited for a single feature.
//
// Every visible string, aria label and metadata field of the landing page
// lives here. Each language is written natively rather than translated
// literally. Conventions:
// - "{n}" is filled at render time with a live, rounded-down library figure.
// - French typography (narrow no-break spaces before ; : ! ? and inside « »)
//   is applied automatically by frenchTypography() below.

import type { AppLang } from '@/lib/i18n/uiStrings';
import { en } from './landing/en';
import { it } from './landing/it';
import { es } from './landing/es';
import { fr } from './landing/fr';

type Step = { label: string; title: string; text: string; alt: string };
type Group = { title: string; items: string[] };

/** One audience path (students or physiotherapists): same structure, same visual weight. */
export type AudiencePath = {
  eyebrow: string;
  title: string;
  intro: string;
  tablistLabel: string;
  /** Four real screens, shown as tabs. */
  steps: [Step, Step, Step, Step];
  extrasTitle: string;
  extras: string[];
  cta: string;
  ctaNote: string;
  caption: string;
};

export interface LandingDict {
  meta: { title: string; description: string; descriptionNoCount: string; ogLocale: string };
  nav: {
    students: string;
    physiotherapists: string;
    library: string;
    trust: string;
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
    cta: string;
    note: string;
    imageAlt: string;
    secondImageAlt: string;
    caption: string;
    /** The two audience cards under the hero (#students, #physiotherapists). */
    choose: string;
    paths: { students: { title: string; text: string; link: string }; physiotherapists: { title: string; text: string; link: string } };
  };
  students: AudiencePath & { /** Prefix of the 3D model credits under the student screens. */ modelCredit: string };
  physiotherapists: AudiencePath & {
    /** Added to the extras only when video calls are configured (DAILY_API_KEY). */
    videoItem: string;
    patients: { title: string; text: string; cta: string };
  };
  /** Live library figures (rounded down) with number-free fallbacks. */
  figures: {
    conditions: string;
    conditionsFallback: string;
    protocols: string;
    protocolsFallback: string;
    exercises: string;
    exercisesFallback: string;
    libraryCta: string;
    translationNote: string;
  };
  trust: {
    eyebrow: string;
    title: string;
    intro: string;
    /** What the AI does, what stays with you, safeguards in place. */
    columns: [Group, Group, Group];
    privacy: string;
  };
  pricing: {
    eyebrow: string;
    title: string;
    sub: string;
    free: { label: string; name: string; price: string; items: string[]; limits: string; cta: string };
    /** Paid plans are planned, not purchasable (there is no checkout). */
    planned: { title: string; text: string };
  };
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  final: { title: string; text: string; cta: string; note: string };
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
