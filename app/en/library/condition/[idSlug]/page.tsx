import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AlertTriangle, Quote, ArrowLeft, Sparkles, Info } from 'lucide-react';
import LanguageSwitcher from '@/components/library/LanguageSwitcher';
import { SITE_URL, buildConditionPath, buildConditionIdPath, parseConditionId } from '@/lib/publicLibrary';
import { getTranslatedCondition, type TranslatedCondition } from '@/lib/conditionTranslation';

export const revalidate = 3600;

const EVIDENCE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: 'rgba(50,214,160,0.12)', text: '#189F73', label: 'High evidence' },
  moderate: { bg: 'rgba(79,124,255,0.12)', text: '#4F7CFF', label: 'Moderate evidence' },
  low: { bg: 'rgba(148,163,184,0.15)', text: '#64748B', label: 'Limited evidence' },
};

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-1.5">
        {title}
      </h2>
      <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed whitespace-pre-line">
        {children}
      </p>
    </div>
  );
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

  const evidence = condition.evidence_level
    ? EVIDENCE_STYLE[condition.evidence_level.toLowerCase()]
    : null;

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
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6 pt-40 pb-24">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <a
            href="/en/library/condition"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Clinical Library
          </a>
          <LanguageSwitcher current="en" hrefFor={(lang) => buildConditionIdPath(condition.id, lang)} />
        </div>

        {condition._translationFailed && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
            <Info size={14} className="shrink-0 mt-0.5" />
            <p>
              The English translation for this page is being generated — showing the original
              Italian content below for now. Refresh in a moment to see the English version.
            </p>
          </div>
        )}

        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]" />
            Clinical Guide
          </div>
          {evidence && (
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full"
              style={{ background: evidence.bg, color: evidence.text }}
            >
              {evidence.label}
            </span>
          )}
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-10">
          {condition.condition_name}
        </h1>

        {condition.goals && <Section title="Rehabilitation Goals">{condition.goals}</Section>}
        {condition.clinical_tests && <Section title="Clinical Tests">{condition.clinical_tests}</Section>}
        {condition.typical_exercises && (
          <Section title="Typical Exercises">{condition.typical_exercises}</Section>
        )}
        {condition.progression_criteria && (
          <Section title="Progression Criteria">{condition.progression_criteria}</Section>
        )}
        {condition.return_to_activity_criteria && (
          <Section title="Return-to-Activity Criteria">
            {condition.return_to_activity_criteria}
          </Section>
        )}
        {condition.outcome_measures && (
          <Section title="Outcome Measures">{condition.outcome_measures}</Section>
        )}

        {condition.red_flags && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle size={14} className="text-red-500" />
              <p className="font-semibold text-red-500 text-xs uppercase tracking-wide">Red Flags</p>
            </div>
            <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed whitespace-pre-line">
              {condition.red_flags}
            </p>
          </div>
        )}

        {condition.contraindications && (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="font-semibold text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wide mb-1.5">
              Contraindications
            </p>
            <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed whitespace-pre-line">
              {condition.contraindications}
            </p>
          </div>
        )}

        {!condition._translationFailed && (condition.red_flags || condition.contraindications) && (
          <p className="mb-10 text-[11px] italic text-ink/35 dark:text-white/35">
            Machine-translated from Italian — for clinical decisions, please verify Red Flags and
            Contraindications against the original source.
          </p>
        )}

        {condition.source && (
          <div className="mb-10 flex items-start gap-2 text-xs text-ink/40 dark:text-white/40">
            <Quote size={13} className="shrink-0 mt-0.5" />
            <p>
              {condition.source}
              {condition.source_date ? ` — ${condition.source_date}` : ''}
            </p>
          </div>
        )}

        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-gradient-to-br from-[#4F7CFF]/5 to-[#32D6A0]/5 p-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#32D6A0] text-white">
              <Sparkles size={18} />
            </div>
          </div>
          <p className="font-display text-xl font-bold mb-2">Are you a physiotherapist?</p>
          <p className="text-sm text-ink/60 dark:text-white/60 max-w-md mx-auto mb-6">
            Link this condition to a patient&apos;s clinical history, generate dosed exercises and automatic SOAP notes — free, no credit card required.
          </p>
          <a
            href="/login?mode=signup"
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
          >
            Try Phygo for free
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
