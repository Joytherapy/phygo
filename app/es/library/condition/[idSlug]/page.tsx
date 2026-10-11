import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ConditionDetailView from '@/components/library/ConditionDetailView';
import { SITE_URL, buildConditionPath, buildConditionIdPath, parseConditionId } from '@/lib/publicLibrary';
import { getTranslatedCondition, type TranslatedCondition } from '@/lib/conditionTranslation';

export const revalidate = 3600;


export async function generateMetadata({
  params,
}: {
  params: { idSlug: string };
}): Promise<Metadata> {
  const id = parseConditionId(params.idSlug);
  if (!id) return { title: 'Condición no encontrada | Phygo' };

  const condition = await getTranslatedCondition(id, 'es');
  if (!condition) return { title: 'Condición no encontrada | Phygo' };

  const description =
    (condition.goals || condition.clinical_tests || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 155) ||
    `${condition.condition_name}: objetivos de rehabilitación, pruebas clínicas, señales de alarma y ejercicios típicos, verificados con literatura científica actualizada.`;

  const url = `${SITE_URL}${buildConditionPath(condition.id, condition.condition_name, 'es')}`;
  const itUrl = `${SITE_URL}${buildConditionIdPath(condition.id, 'it')}`;
  const enUrl = `${SITE_URL}${buildConditionIdPath(condition.id, 'en')}`;
  const frUrl = `${SITE_URL}${buildConditionIdPath(condition.id, 'fr')}`;

  return {
    title: `${condition.condition_name} — Guía Clínica para Fisioterapeutas | Phygo`,
    description,
    alternates: {
      canonical: url,
      languages: { it: itUrl, en: enUrl, es: url, fr: frUrl, 'x-default': itUrl },
    },
    openGraph: {
      title: `${condition.condition_name} — Guía Clínica | Phygo`,
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


export default async function PublicConditionPageES({
  params,
}: {
  params: { idSlug: string };
}) {
  const id = parseConditionId(params.idSlug);
  if (!id) notFound();

  const record = await getTranslatedCondition(id as number, 'es');
  if (!record) notFound();
  const condition = record as TranslatedCondition;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: condition.condition_name,
    inLanguage: 'es',
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
      lang="es"
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
        translationFailed: !!condition._translationFailed,
      }}
    />
  );
}
