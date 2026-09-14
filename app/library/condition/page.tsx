import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConditionSearchList from './_components/ConditionSearchList';
import LanguageSwitcher from '@/components/library/LanguageSwitcher';
import { SITE_URL, buildConditionIndexPath } from '@/lib/publicLibrary';

export const revalidate = 3600;

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const description =
  'Centinaia di condizioni cliniche — ortopediche, neurologiche, cardiopolmonari, oncologiche — con obiettivi riabilitativi, test clinici, red flags ed esercizi tipici verificati su letteratura scientifica aggiornata.';

export const metadata: Metadata = {
  title: 'Libreria Clinica — Condizioni e Patologie | Phygo',
  description,
  alternates: {
    canonical: `${SITE_URL}/library/condition`,
    languages: {
      it: `${SITE_URL}/library/condition`,
      en: `${SITE_URL}/en/library/condition`,
      es: `${SITE_URL}/es/library/condition`,
      fr: `${SITE_URL}/fr/library/condition`,
      'x-default': `${SITE_URL}/library/condition`,
    },
  },
  openGraph: {
    title: 'Libreria Clinica — Condizioni e Patologie | Phygo',
    description,
    url: `${SITE_URL}/library/condition`,
    type: 'website',
  },
};

async function getAllConditions() {
  const { data, error } = await adminSupabase
    .from('knowledge_base')
    .select('id, condition_name')
    .order('condition_name', { ascending: true });

  if (error) {
    console.error('Errore caricamento libreria condizioni:', error);
    return [];
  }
  return data ?? [];
}

export default async function ConditionLibraryIndexPage() {
  const conditions = await getAllConditions();

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
            Libreria Clinica
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]">
              {conditions.length}
            </span>{' '}
            condizioni cliniche
          </h1>
          <p className="text-sm text-ink/50 dark:text-white/50 max-w-xl mx-auto">
            Ortopediche, neurologiche, cardiopolmonari, oncologiche — ogni voce verificata su linee guida e letteratura scientifica aggiornata, pensata per la pratica fisioterapica quotidiana.
          </p>
          <div className="flex justify-center mt-5">
            <LanguageSwitcher current="it" hrefFor={(lang) => buildConditionIndexPath(lang)} />
          </div>
        </div>

        <ConditionSearchList items={conditions} />
      </div>

      <Footer />
    </div>
  );
}
