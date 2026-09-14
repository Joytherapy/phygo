// Shared helpers for Phygo's public (non-gated) content library — used by
// /library/condition pages, the sitemap and robots.txt. Keeping these in one
// place means the URL format only has to be decided once.

/**
 * The real, live domain search engines should index today.
 * NOTE: app/layout.tsx's metadataBase still points at https://phygo.app,
 * which per project notes has not been purchased/deployed yet — only
 * https://phygo.vercel.app is actually live. Sitemap/robots/canonical URLs
 * here intentionally use the live domain so Google indexes something that
 * resolves. If phygo.app is ever bought and made the real production
 * domain, update this one constant (and layout.tsx's metadataBase) together.
 */
export const SITE_URL = 'https://phygo.vercel.app';

/**
 * Turns a condition name into a URL-safe, SEO-friendly slug.
 * Handles Italian accented characters explicitly since condition names
 * are written in Italian (es. "Tendinopatia Achillea" -> "tendinopatia-achillea").
 */
export function slugify(text: string): string {
  const accentMap: Record<string, string> = {
    à: 'a', á: 'a', â: 'a', ä: 'a',
    è: 'e', é: 'e', ê: 'e', ë: 'e',
    ì: 'i', í: 'i', î: 'i', ï: 'i',
    ò: 'o', ó: 'o', ô: 'o', ö: 'o',
    ù: 'u', ú: 'u', û: 'u', ü: 'u',
    ñ: 'n', ç: 'c',
    // French/Spanish extras not already covered above
    œ: 'oe', æ: 'ae', ý: 'y', ÿ: 'y',
  };
  return text
    .toLowerCase()
    .split('')
    .map((ch) => accentMap[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** All languages the public library is available in. Italian is the source language and has no URL prefix; the others are prefixed (e.g. /en/...). */
export type Lang = 'it' | 'en' | 'es' | 'fr';

export const SUPPORTED_LANGS: Lang[] = ['it', 'en', 'es', 'fr'];

export const LANG_PREFIX: Record<Lang, string> = { it: '', en: '/en', es: '/es', fr: '/fr' };

/** Human-readable label for each language, shown in the language switcher — in its OWN language (an Italian speaker still reads "English" fine, and native-language labels are the standard SEO/UX convention for language switchers). */
export const LANG_LABELS: Record<Lang, string> = {
  it: 'Italiano',
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

/** Builds the public URL path for a condition detail page, e.g. "/library/condition/142-tendinopatia-achillea" (Italian, default), "/en/library/condition/142-achilles-tendinopathy" (English), "/es/library/condition/142-tendinopatia-aquilea" (Spanish) or "/fr/library/condition/142-tendinopathie-achilleenne" (French). */
export function buildConditionPath(id: number, name: string, lang: Lang = 'it'): string {
  return `${LANG_PREFIX[lang]}/library/condition/${id}-${slugify(name)}`;
}

/**
 * Numeric-only variant of buildConditionPath, for cross-language links where
 * the caller doesn't have (and shouldn't have to fetch) the condition name
 * translated into the TARGET language — e.g. a language switcher rendered on
 * the Italian page linking over to the Spanish version. The text after the
 * id is purely cosmetic (see parseConditionId below), so a numeric-only URL
 * always resolves correctly.
 */
export function buildConditionIdPath(id: number, lang: Lang = 'it'): string {
  return `${LANG_PREFIX[lang]}/library/condition/${id}`;
}

/** Builds the public URL path for the condition library index, in any supported language. */
export function buildConditionIndexPath(lang: Lang = 'it'): string {
  return `${LANG_PREFIX[lang]}/library/condition`;
}

/**
 * Extracts the numeric condition id from a URL segment like
 * "142-tendinopatia-achillea". The text after the id is purely cosmetic —
 * only the leading number is ever used to look up the record, so an old
 * or slightly-off slug in a bookmarked/shared link still resolves.
 */
export function parseConditionId(idSlug: string): number | null {
  const match = idSlug.match(/^(\d+)/);
  if (!match) return null;
  const id = parseInt(match[1], 10);
  return Number.isFinite(id) ? id : null;
}
