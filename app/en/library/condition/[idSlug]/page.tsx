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
  if (!id) return { title: 'Condition not found | Phygo' };

  const condition = await getTranslatedCondition(id, 'en');
  if (!condition) return { title: 'Condition not found | Phygo' };

  const description =
    (condition.goals || condition.clinical_tests || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 155) ||
    `${condition.condition_name}: rehab goals, clinical tests, red flags and typical exercises, verified against up-to-date scientific literature.`;

  const url = `${SITE_URL}${buildConditionPath(condition.id, condition.condition_name, 'en')}`;
  const itUrl = `${SITE_URL}${buildConditionIdPath(condition.id, 'it')}`;
  const esUrl = `${SITE_URL}${buildConditionIdPath(condition.id, 'es')}`;
  const frUrl = `${SITE_URL}${buildConditionIdPath(condition.id, 'fr')}`;

  return {
    title: `${condition.condition_name} — Clinical Guide for Physiotherapists | Phygo`,
    description,
    alternates: {
      canonical: url,
      languages: { it: itUrl, en: url, es: esUrl, fr: frUrl, 'x-default': itUrl },
    },
    openGraph: {
      title: `${condition.condition_name} — Clinical Guide | Phygo`,
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


export default async function PublicConditionPageEN({
  params,
}: {
  params: { idSlug: string };
}) {
  const id = parseConditionId(params.idSlug);
  if (!id) notFound();

  const record = await getTranslatedCondition(id as number, 'en');
  if (!record) notFound();
  const condition = record as TranslatedCondition;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: condition.condition_name,
    inLanguage: 'en',
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
      lang="en"
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
