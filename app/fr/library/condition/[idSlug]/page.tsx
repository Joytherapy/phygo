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
  if (!id) return { title: 'Pathologie introuvable | Phygo' };

  const condition = await getTranslatedCondition(id, 'fr');
  if (!condition) return { title: 'Pathologie introuvable | Phygo' };

  const description =
    (condition.goals || condition.clinical_tests || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 155) ||
    `${condition.condition_name} : objectifs de rééducation, tests cliniques, signaux d'alarme et exercices types, vérifiés à partir de la littérature scientifique actuelle.`;

  const url = `${SITE_URL}${buildConditionPath(condition.id, condition.condition_name, 'fr')}`;
  const itUrl = `${SITE_URL}${buildConditionIdPath(condition.id, 'it')}`;
  const enUrl = `${SITE_URL}${buildConditionIdPath(condition.id, 'en')}`;
  const esUrl = `${SITE_URL}${buildConditionIdPath(condition.id, 'es')}`;

  return {
    title: `${condition.condition_name} — Guide Clinique pour Kinésithérapeutes | Phygo`,
    description,
    alternates: {
      canonical: url,
      languages: { it: itUrl, en: enUrl, es: esUrl, fr: url, 'x-default': itUrl },
    },
    openGraph: {
      title: `${condition.condition_name} — Guide Clinique | Phygo`,
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


export default async function PublicConditionPageFR({
  params,
}: {
  params: { idSlug: string };
}) {
  const id = parseConditionId(params.idSlug);
  if (!id) notFound();

  const record = await getTranslatedCondition(id as number, 'fr');
  if (!record) notFound();
  const condition = record as TranslatedCondition;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: condition.condition_name,
    inLanguage: 'fr',
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
      lang="fr"
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
        untranslated: condition._untranslatedFields ?? [],
      }}
    />
  );
}
