import type { Metadata } from 'next';
import type { AppLang } from '@/lib/i18n/uiStrings';
import { LANDING_LANGS, LANDING_PATH, LANDING_STRINGS, fill, formatNumber } from '@/lib/i18n/landingStrings';
import { getLandingData, roundDown } from './landingData';

/** Per-language title, description, canonical, hreflang alternates and Open Graph locale. */
export async function buildLandingMetadata(lang: AppLang): Promise<Metadata> {
  const t = LANDING_STRINGS[lang];
  const rounded = roundDown((await getLandingData(lang)).total);
  const description = rounded ? fill(t.meta.description, { n: formatNumber(lang, rounded) }) : t.meta.descriptionNoCount;
  const path = LANDING_PATH[lang];

  return {
    title: t.meta.title,
    description,
    alternates: {
      canonical: path,
      languages: {
        ...Object.fromEntries(LANDING_LANGS.map((l) => [l, LANDING_PATH[l]])),
        'x-default': LANDING_PATH.en,
      },
    },
    openGraph: {
      title: t.meta.title,
      description,
      url: path,
      type: 'website',
      locale: t.meta.ogLocale,
      alternateLocale: LANDING_LANGS.filter((l) => l !== lang).map((l) => LANDING_STRINGS[l].meta.ogLocale),
      siteName: 'PHYGO',
    },
    twitter: { card: 'summary_large_image', title: t.meta.title, description },
  };
}
