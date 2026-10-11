import { cache } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { buildConditionPath, type Lang } from '@/lib/publicLibrary';
import { COVERAGE_KEYS, type CoverageKey } from './coverageKeys';

export { COVERAGE_KEYS, type CoverageKey };

// Live data for the public landing pages (/, /it, /es, /fr), read from the
// same tables that power the public /library/condition pages. Uses the ANON
// key on purpose: knowledge_base, condition_translations, rehab_phases and
// exercises all have public-read RLS policies, so the landing page never needs
// the service-role key. Pages revalidate hourly, so numbers follow the library
// as it grows instead of being hard-coded marketing figures.
//
// Every query is best-effort: if Supabase is unreachable (or a build runs
// without env vars) the page renders number-free wording rather than failing
// or showing an invented figure.

export type SectionKey = 'goals' | 'clinical_tests' | 'red_flags' | 'typical_exercises';
const SECTION_KEYS: SectionKey[] = ['goals', 'clinical_tests', 'red_flags', 'typical_exercises'];

export type FeaturedEntry = {
  id: number;
  name: string;
  href: string;
  evidenceLevel: string | null;
  sections: { key: SectionKey; text: string }[];
  phaseCount: number;
  /** true when the text comes from the Italian source rather than a cached translation */
  isSource: boolean;
};

export type StoryCondition = {
  name: string;
  href: string;
  phases: string[];
};

export type LandingData = {
  total: number | null;
  coverage: Partial<Record<CoverageKey, number>>;
  phasedProtocols: number | null;
  exercises: number | null;
  featured: FeaturedEntry | null;
  story: StoryCondition | null;
  /** A real exercise from the exercise library, named in the visitor's language. */
  libraryExercise: string | null;
  sampleNames: string[];
};

// The sample patient in the landing story has rotator cuff related shoulder
// pain — library entry 1, whose name and rehab phases exist in all four
// languages. The featured library entry is the first candidate that has a
// complete text in the visitor's language (Italian is the source language;
// en/es/fr come from cached translations, never generated here). Candidates
// differ per language because translation coverage differs; they were picked
// by checking which entries are complete and cleanly written in each language.
const STORY_CONDITION_ID = 1;
const FEATURED_CANDIDATES: Record<Lang, number[]> = {
  it: [4, 5, 1],
  en: [20, 22, 24, 25],
  es: [5, 1, 19],
  fr: [1, 19, 29, 10],
};
// "Resistance Band Standing External Rotation": a shoulder exercise from the
// exercise library, translated into all four languages, with video.
const LIBRARY_EXERCISE_ID = '42196e02-03db-44c2-878c-0a1bf6c10ba7';

function getClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function clip(text: string | null | undefined, max = 280): string | null {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.(\-–]$/, '')}…`;
}

async function countNonEmpty(supabase: SupabaseClient, column: CoverageKey) {
  const { count, error } = await supabase
    .from('knowledge_base')
    .select('id', { count: 'exact', head: true })
    .not(column, 'is', null)
    .neq(column, '');
  return error ? null : count;
}

/** Typographic apostrophes, plus a missing French elision apostrophe in stored text ("l activité" -> "l’activité"). */
function tidy(text: string, lang: Lang): string {
  const clean = text.replace(/\s+/g, ' ').trim().replace(/(\p{L})'(\p{L})/gu, '$1’$2');
  return lang === 'fr' ? clean.replace(/\b([ldLD]) (?=[aeiouyhàâéèêîôûAEIOUYHÉ])/g, '$1’') : clean;
}

async function getPhases(supabase: SupabaseClient, conditionId: number, lang: Lang): Promise<string[]> {
  const { data } = await supabase
    .from('rehab_phases')
    .select('phase_number, phase_name, translations')
    .eq('condition_id', conditionId)
    .order('phase_number', { ascending: true });
  return (data ?? [])
    .map((p: any) => (lang === 'it' ? p.phase_name : p.translations?.[lang]?.phase_name) as string | undefined)
    .filter((n): n is string => !!n && n.trim().length > 0)
    .map((n) => tidy(n, lang));
}

type ConditionText = { name: string } & Partial<Record<SectionKey, string | null>>;

async function getConditionText(supabase: SupabaseClient, id: number, lang: Lang): Promise<ConditionText | null> {
  if (lang === 'it') {
    const { data } = await supabase
      .from('knowledge_base')
      .select('condition_name, goals, clinical_tests, red_flags, typical_exercises')
      .eq('id', id)
      .maybeSingle();
    return data?.condition_name ? { name: data.condition_name, ...data } : null;
  }
  const { data } = await supabase
    .from('condition_translations')
    .select('condition_name, goals, clinical_tests, red_flags, typical_exercises')
    .eq('condition_id', id)
    .eq('lang', lang)
    .maybeSingle();
  return data?.condition_name ? { name: data.condition_name, ...data } : null;
}

async function getFeatured(supabase: SupabaseClient, lang: Lang): Promise<FeaturedEntry | null> {
  for (const id of FEATURED_CANDIDATES[lang]) {
    const text = await getConditionText(supabase, id, lang);
    if (!text) continue;
    const sections = SECTION_KEYS.map((key) => {
      const clipped = clip(text[key]);
      return { key, text: clipped ? tidy(clipped, lang) : null };
    }).filter(
      (s): s is { key: SectionKey; text: string } => !!s.text
    );
    if (sections.length < SECTION_KEYS.length) continue;
    const [{ data: base }, phases] = await Promise.all([
      supabase.from('knowledge_base').select('evidence_level').eq('id', id).maybeSingle(),
      getPhases(supabase, id, lang),
    ]);
    return {
      id,
      name: tidy(text.name, lang),
      href: buildConditionPath(id, text.name, lang),
      evidenceLevel: base?.evidence_level ?? null,
      sections,
      phaseCount: phases.length,
      isSource: lang === 'it',
    };
  }
  return null;
}

async function getStory(supabase: SupabaseClient, lang: Lang): Promise<StoryCondition | null> {
  const [text, phases] = await Promise.all([
    getConditionText(supabase, STORY_CONDITION_ID, lang),
    getPhases(supabase, STORY_CONDITION_ID, lang),
  ]);
  if (!text) return null;
  return { name: tidy(text.name, lang), href: buildConditionPath(STORY_CONDITION_ID, text.name, lang), phases };
}

async function getLibraryExercise(supabase: SupabaseClient, lang: Lang): Promise<string | null> {
  const { data } = await supabase
    .from('exercise_translations')
    .select('name')
    .eq('exercise_id', LIBRARY_EXERCISE_ID)
    .eq('lang', lang)
    .maybeSingle();
  return data?.name ? tidy(data.name, lang) : null;
}

/** An evenly spread, deterministic selection of real condition names in the visitor's language. */
async function getSampleNames(supabase: SupabaseClient, lang: Lang, wanted = 48): Promise<string[]> {
  const { data } =
    lang === 'it'
      ? await supabase.from('knowledge_base').select('id, condition_name').order('id', { ascending: true })
      : await supabase
          .from('condition_translations')
          .select('condition_id, condition_name')
          .eq('lang', lang)
          .order('condition_id', { ascending: true });
  // Marquee labels: drop qualifiers ("… — therapeutic exercise", "(RCRSP)") and very long names.
  const names = (data ?? [])
    .map((r: any) =>
      (r.condition_name as string | null)
        ?.split(' — ')[0]
        .replace(/\s*\([^)]*\)\s*$/, '')
        .trim()
    )
    .filter((n): n is string => !!n && n.length <= 48)
    .map((n) => tidy(n, lang));
  if (names.length <= wanted) return names;
  const step = names.length / wanted;
  return Array.from({ length: wanted }, (_, i) => names[Math.floor(i * step)]);
}

async function loadLandingData(lang: Lang): Promise<LandingData> {
  const empty: LandingData = {
    total: null,
    coverage: {},
    phasedProtocols: null,
    exercises: null,
    featured: null,
    story: null,
    libraryExercise: null,
    sampleNames: [],
  };
  const supabase = getClient();
  if (!supabase) {
    console.warn('[landing] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing: showing the page without library figures.');
    return empty;
  }

  try {
    const [totalRes, coverageCounts, phasesRes, exercisesRes, featured, story, libraryExercise, sampleNames] =
      await Promise.all([
        supabase.from('knowledge_base').select('id', { count: 'exact', head: true }),
        Promise.all(COVERAGE_KEYS.map((k) => countNonEmpty(supabase, k))),
        supabase.from('rehab_phases').select('condition_id'),
        // Active exercises that have a demonstration video, so "exercises with video" stays literally true.
        supabase
          .from('exercises')
          .select('id, exercise_assets!inner(asset_type)', { count: 'exact', head: true })
          .is('archived_at', null)
          .eq('exercise_assets.asset_type', 'video'),
        getFeatured(supabase, lang).catch(() => null),
        getStory(supabase, lang).catch(() => null),
        getLibraryExercise(supabase, lang).catch(() => null),
        getSampleNames(supabase, lang).catch(() => []),
      ]);

    // Say why figures are missing (wrong key, network, RLS) instead of failing silently; the page still renders.
    if (totalRes.error) console.warn('[landing] Library figures unavailable:', totalRes.error.message);

    const coverage: LandingData['coverage'] = {};
    COVERAGE_KEYS.forEach((k, i) => {
      const n = coverageCounts[i];
      if (typeof n === 'number') coverage[k] = n;
    });

    return {
      total: totalRes.error ? null : totalRes.count ?? null,
      coverage,
      phasedProtocols: phasesRes.error
        ? null
        : new Set((phasesRes.data ?? []).map((r: { condition_id: number | null }) => r.condition_id).filter(Boolean)).size || null,
      exercises: exercisesRes.error ? null : exercisesRes.count || null,
      featured,
      story,
      libraryExercise,
      sampleNames,
    };
  } catch (err) {
    console.error('Landing data unavailable:', err);
    return empty;
  }
}

/** Deduplicated per request: generateMetadata and the page share one set of queries. */
export const getLandingData = cache(loadLandingData);

/** 626 -> 600, 1924 -> 1900; small or unknown counts return null so copy can fall back to number-free wording. */
export function roundDown(total: number | null, step = 100): number | null {
  if (!total || total < step) return null;
  return Math.floor(total / step) * step;
}
