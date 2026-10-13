import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ConditionDetailView from '@/components/library/ConditionDetailView';
import { SITE_URL, buildConditionPath, buildConditionIdPath, parseConditionId } from '@/lib/publicLibrary';
import { lazy } from '@/lib/lazy';

export const revalidate = 3600; // re-render at most once an hour, keeps content fresh without hitting the DB on every request

const adminSupabase = lazy(() => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
));

interface ConditionRecord {
  id: number;
  condition_name: string;
  goals: string | null;
  clinical_tests: string | null;
  red_flags: string | null;
  contraindications: string | null;
  typical_exercises: string | null;
  progression_criteria: string | null;
  evidence_level: string | null;
  return_to_activity_criteria: string | null;
  outcome_measures: string | null;
  source: string | null;
  source_date: string | null;
}

async function getCondition(id: number): Promise<ConditionRecord | null> {
  const { data, error } = await adminSupabase
    .from('knowledge_base')
    .select(
      'id, condition_name, goals, clinical_tests, red_flags, contraindications, typical_exercises, progression_criteria, evidence_level, return_to_activity_criteria, outcome_measures, source, source_date'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Errore caricamento condizione pubblica:', error);
    return null;
  }
  return data as ConditionRecord | null;
}


export async function generateMetadata({
  params,
}: {
  params: { idSlug: string };
}): Promise<Metadata> {
  const id = parseConditionId(params.idSlug);
  if (!id) return { title: 'Condizione non trovata | Phygo' };

  const condition = await getCondition(id);
  if (!condition) return { title: 'Condizione non trovata | Phygo' };

  const description =
    (condition.goals || condition.clinical_tests || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 155) ||
    `${condition.condition_name}: obiettivi riabilitativi, test clinici, red flags ed esercizi tipici, verificati su letteratura scientifica aggiornata.`;

  const url = `${SITE_URL}${buildConditionPath(condition.id, condition.condition_name)}`;
  const enUrl = `${SITE_URL}${buildConditionIdPath(condition.id, 'en')}`;
  const esUrl = `${SITE_URL}${buildConditionIdPath(condition.id, 'es')}`;
  const frUrl = `${SITE_URL}${buildConditionIdPath(condition.id, 'fr')}`;

  return {
    title: `${condition.condition_name} — Guida Clinica per Fisioterapisti | Phygo`,
    description,
    alternates: {
      canonical: url,
      languages: { it: url, en: enUrl, es: esUrl, fr: frUrl, 'x-default': url },
    },
    openGraph: {
      title: `${condition.condition_name} — Guida Clinica | Phygo`,
      description,
      url,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${condition.condition_name} | Phygo`,
      description,
    },
  };
}


export default async function PublicConditionPage({
  params,
}: {
  params: { idSlug: string };
}) {
  const id = parseConditionId(params.idSlug);
  if (!id) notFound();

  const record = await getCondition(id as number);
  if (!record) notFound();
  const condition = record as ConditionRecord;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: condition.condition_name,
    about: {
      '@type': 'MedicalCondition',
      name: condition.condition_name,
    },
    ...(condition.source_date ? { lastReviewed: condition.source_date } : {}),
    ...(condition.source ? { citation: condition.source } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'Phygo',
    },
  };

  return (
    <ConditionDetailView
      lang="it"
      jsonLd={jsonLd}
      data={{
        id: condition.id,
        name: condition.condition_name,
        fields: {
          goals: condition.goals,
          clinical_tests: condition.clinical_tests,
          red_flags: condition.red_flags,
          contraindications: condition.contraindications,
          typical_exercises: condition.typical_exercises,
          progression_criteria: condition.progression_criteria,
          return_to_activity_criteria: condition.return_to_activity_criteria,
          outcome_measures: condition.outcome_measures,
        },
        evidenceLevel: condition.evidence_level,
        source: condition.source,
        sourceDate: condition.source_date,
      }}
    />
  );
}
