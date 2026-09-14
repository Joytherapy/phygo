import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConditionSearchList from '../../../library/condition/_components/ConditionSearchList';
import LanguageSwitcher from '@/components/library/LanguageSwitcher';
import { SITE_URL, buildConditionIndexPath } from '@/lib/publicLibrary';
import { getTranslatedConditionNames } from '@/lib/conditionTranslation';

export const revalidate = 3600;

const description =
  'Hundreds of clinical conditions — orthopedic, neurological, cardiopulmonary, oncological — with rehab goals, clinical tests, red flags and typical exercises, verified against up-to-date scientific literature.';

export const metadata: Metadata = {
  title: 'Clinical Library — Conditions & Pathologies | Phygo',
  description,
  alternates: {
    canonical: `${SITE_URL}/en/library/condition`,
    languages: {
      it: `${SITE_URL}/library/condition`,
      en: `${SITE_URL}/en/library/condition`,
      es: `${SITE_URL}/es/library/condition`,
      fr: `${SITE_URL}/fr/library/condition`,
      'x-default': `${SITE_URL}/library/condition`,
    },
  },
  openGraph: {
    title: 'Clinical Library — Conditions & Pathologies | Phygo',
    description,
    url: `${SITE_URL}/en/library/condition`,
    type: 'website',
  },
};

export default async function ConditionLibraryIndexPageEN() {
  const conditions = await getTranslatedConditionNames('en');

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]" />
            Clinical Library
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]">
              {conditions.length}
            </span>{' '}
            clinical conditions
          </h1>
          <p className="text-sm text-ink/50 dark:text-white/50 max-w-xl mx-auto">
            Orthopedic, neurological, cardiopulmonary, oncological — every entry verified against clinical guidelines and up-to-date scientific literature, built for day-to-day physiotherapy practice.
          </p>
          <div className="flex justify-center mt-5">
            <LanguageSwitcher current="en" hrefFor={(lang) => buildConditionIndexPath(lang)} />
          </div>
        </div>

        <ConditionSearchList items={conditions} lang="en" />
      </div>

      <Footer />
    </div>
  );
}
