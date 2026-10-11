import { cache } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { buildConditionPath } from '@/lib/publicLibrary';

// Live numbers for the public landing page, read from the same knowledge_base
// table that powers the public /library/condition pages. Uses the ANON key on
// purpose: every table read here already has a public-read RLS policy, so the
// landing page never needs the service-role key. app/page.tsx revalidates
// hourly, so the counts follow the library as it grows instead of being a
// hard-coded marketing number.
//
// Every query is best-effort: if Supabase is unreachable (or the build runs
// without env vars), the landing page renders without numbers rather than
// failing the build or showing a made-up figure.

export type CoverageKey =
  | 'goals'
  | 'clinical_tests'
  | 'red_flags'
  | 'contraindications'
  | 'typical_exercises'
  | 'progression_criteria'
  | 'return_to_activity_criteria'
  | 'outcome_measures'
  | 'source';

export const COVERAGE_FIELDS: { key: CoverageKey; label: string }[] = [
  { key: 'goals', label: 'Rehabilitation goals' },
  { key: 'clinical_tests', label: 'Clinical tests' },
  { key: 'red_flags', label: 'Red flags' },
  { key: 'contraindications', label: 'Contraindications' },
  { key: 'typical_exercises', label: 'Typical exercises' },
  { key: 'progression_criteria', label: 'Progression criteria' },
  { key: 'return_to_activity_criteria', label: 'Return-to-activity criteria' },
  { key: 'outcome_measures', label: 'Outcome measures' },
  { key: 'source', label: 'Cited sources' },
];

export type FeaturedCondition = {
  name: string;
  href: string;
  evidenceLevel: string | null;
  sections: { label: string; text: string }[];
  phases: { number: number; name: string }[];
};

export type LibraryStats = {
  total: number | null;
  coverage: Partial<Record<CoverageKey, number>>;
  phasedProtocols: number | null;
  featured: FeaturedCondition | null;
};

// A real library entry with an English translation already cached in
// condition_translations, so the landing page never triggers an on-demand
// translation. If it is ever removed, the section simply hides the preview.
const FEATURED_CONDITION_ID = 20;

function getClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function countNonEmpty(supabase: SupabaseClient, column: CoverageKey) {
  const { count, error } = await supabase
    .from('knowledge_base')
    .select('id', { count: 'exact', head: true })
    .not(column, 'is', null)
    .neq(column, '');
  return error ? null : count;
}

function clip(text: string | null | undefined, max = 260): string | null {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]$/, '')}…`;
}

async function getFeatured(supabase: SupabaseClient): Promise<FeaturedCondition | null> {
  const [{ data: base }, { data: en }, { data: phases }] = await Promise.all([
    supabase.from('knowledge_base').select('id, evidence_level').eq('id', FEATURED_CONDITION_ID).maybeSingle(),
    supabase
      .from('condition_translations')
      .select('condition_name, goals, clinical_tests, red_flags, typical_exercises')
      .eq('condition_id', FEATURED_CONDITION_ID)
      .eq('lang', 'en')
      .maybeSingle(),
    supabase
      .from('rehab_phases')
      .select('phase_number, phase_name, translations')
      .eq('condition_id', FEATURED_CONDITION_ID)
      .order('phase_number', { ascending: true }),
  ]);

  if (!base || !en?.condition_name) return null;

  const sections = [
    { label: 'Goals', text: clip(en.goals) },
    { label: 'Clinical tests', text: clip(en.clinical_tests) },
    { label: 'Red flags', text: clip(en.red_flags) },
    { label: 'Exercises', text: clip(en.typical_exercises) },
  ].filter((s): s is { label: string; text: string } => !!s.text);

  if (sections.length === 0) return null;

  return {
    name: en.condition_name,
    href: buildConditionPath(base.id, en.condition_name, 'en'),
    evidenceLevel: base.evidence_level,
    sections,
    phases: (phases ?? [])
      .map((p: any) => ({
        number: Number(p.phase_number),
        name: (p.translations?.en?.phase_name as string | undefined) || '',
      }))
      .filter((p) => p.name),
  };
}

async function loadLibraryStats(): Promise<LibraryStats> {
  const empty: LibraryStats = { total: null, coverage: {}, phasedProtocols: null, featured: null };
  const supabase = getClient();
  if (!supabase) return empty;

  try {
    const [totalRes, coverageCounts, phasesRes, featured] = await Promise.all([
      supabase.from('knowledge_base').select('id', { count: 'exact', head: true }),
      Promise.all(COVERAGE_FIELDS.map((f) => countNonEmpty(supabase, f.key))),
      supabase.from('rehab_phases').select('condition_id'),
      getFeatured(supabase).catch(() => null),
    ]);

    const coverage: LibraryStats['coverage'] = {};
    COVERAGE_FIELDS.forEach((f, i) => {
      const n = coverageCounts[i];
      if (typeof n === 'number') coverage[f.key] = n;
    });

    const phasedProtocols = phasesRes.error
      ? null
      : new Set((phasesRes.data ?? []).map((r: { condition_id: number | null }) => r.condition_id).filter(Boolean)).size;

    return {
      total: totalRes.error ? null : totalRes.count ?? null,
      coverage,
      phasedProtocols,
      featured,
    };
  } catch (err) {
    console.error('Landing library stats unavailable:', err);
    return empty;
  }
}

/** Deduplicated per request: generateMetadata and the page share one set of queries. */
export const getLibraryStats = cache(loadLibraryStats);

/** "626" -> "600+"; small or unknown counts fall back to wording without a number. */
export function roundedCountLabel(total: number | null): string | null {
  if (!total || total < 100) return null;
  return `${Math.floor(total / 100) * 100}+`;
}
