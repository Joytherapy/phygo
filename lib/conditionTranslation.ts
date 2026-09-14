// Lazy, self-caching translation layer for the public /library/condition
// pages, currently serving English, Spanish and French (Italian is the
// source language and needs no translation). Nothing is pre-translated by
// hand: the first real visit to a non-Italian URL triggers a translation via
// OpenAI, which is then cached in the `condition_translations` table (see
// sql/2026-09_condition_translations.sql — its `lang` column is a plain,
// unconstrained text column, so adding a language here needs no further SQL
// migration) so every later visit — by a person or by Googlebot — is
// instant and free. If the underlying Italian content is later edited, the
// cached translation's source hash no longer matches and it is silently
// regenerated on next visit.

import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type SupportedLang = 'en' | 'es' | 'fr';

const LANG_NAMES: Record<SupportedLang, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
};

export interface ConditionRecord {
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

const TRANSLATABLE_FIELDS = [
  'condition_name',
  'goals',
  'clinical_tests',
  'red_flags',
  'contraindications',
  'typical_exercises',
  'progression_criteria',
  'return_to_activity_criteria',
  'outcome_measures',
] as const;

type TranslatableField = (typeof TRANSLATABLE_FIELDS)[number];

function computeSourceHash(record: ConditionRecord): string {
  const raw = TRANSLATABLE_FIELDS.map((f) => record[f] ?? '').join('|||');
  return createHash('sha256').update(raw).digest('hex');
}

/** Translated view of a condition: same shape as ConditionRecord, values in the target language (falls back to Italian per-field if translation is only partial). */
export type TranslatedCondition = ConditionRecord & { _translationStale?: boolean; _translationFailed?: boolean };

async function translateFieldsWithOpenAI(
  record: ConditionRecord,
  lang: SupportedLang
): Promise<Partial<Record<TranslatableField, string>> | null> {
  const sourceFields: Partial<Record<TranslatableField, string>> = {};
  for (const f of TRANSLATABLE_FIELDS) {
    const v = record[f];
    if (v) sourceFields[f] = v;
  }
  if (Object.keys(sourceFields).length === 0) return {};

  const langName = LANG_NAMES[lang];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a senior clinical translator and physiotherapist, native-level fluent in ${langName}, translating to the standard used in international peer-reviewed physiotherapy and rehabilitation literature. Translate the values of the given JSON object from Italian into formal, professional ${langName} written for physiotherapists anywhere in the world who read that language — not a single country's dialect, regionalism, or slang.

Write with the polish and precision expected of a premium clinical software product: choose the more exact, elegant term available in ${langName} over a flatter or more generic one, and prefer varied, professional phrasing over repetitive or clunky constructions — all without changing, softening, or embellishing the underlying clinical content.

Rules:
- Use internationally standardized medical and physiotherapy terminology (as used in international clinical guidelines, the ICF classification, and peer-reviewed rehabilitation journals) rather than a literal, word-for-word translation.
- Named clinical tests, signs and maneuvers (e.g. Lachman test, McMurray test, Ober test, Thomas test, Spurling test) are internationally recognized eponyms: keep them in their standard internationally recognized form instead of translating them literally, unless an equally standard translated name is the one actually used in ${langName}-language clinical literature.
- Preserve all numbers, units, percentages, dosages, durations, degrees and scale/instrument names exactly as given — never convert, round, or alter them.
- Do not add, omit, soften, or reinterpret information beyond what the source says; translate the clinical meaning faithfully and concisely.
- Preserve the original structure (line breaks and list-like phrasing) so the translation reads the same way the Italian source does.

The fields "red_flags" and "contraindications" are patient-safety-critical: they are read by physiotherapists to decide whether it is safe to treat a patient at all. For these two fields specifically: translate every single warning, condition, or item listed — never summarize, merge, or drop any of them — and if the source lists items one per line or as a list, preserve that same one-item-per-line structure exactly so nothing can be misread as belonging to a different item. Before finalizing your answer, re-read your own translation of "red_flags" and "contraindications" against the Italian source and confirm the same number of distinct warnings/items is present in both; if in doubt, translate more literally rather than less.

Return ONLY a JSON object with the exact same keys as the input and the translated values — no commentary, no markdown, no extra keys.`,
        },
        {
          role: 'user',
          content: JSON.stringify(sourceFields),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Errore traduzione OpenAI (condizione singola):', err);
    return null;
  }
}

async function getBaseCondition(id: number): Promise<ConditionRecord | null> {
  const { data, error } = await adminSupabase
    .from('knowledge_base')
    .select(
      'id, condition_name, goals, clinical_tests, red_flags, contraindications, typical_exercises, progression_criteria, evidence_level, return_to_activity_criteria, outcome_measures, source, source_date'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Errore caricamento condizione base:', error);
    return null;
  }
  return data as ConditionRecord | null;
}

/**
 * Full detail-page translation, with cache-or-translate-and-cache logic.
 * Returns null only if the condition itself doesn't exist.
 */
export async function getTranslatedCondition(
  id: number,
  lang: SupportedLang
): Promise<TranslatedCondition | null> {
  const base = await getBaseCondition(id);
  if (!base) return null;

  const sourceHash = computeSourceHash(base);

  const { data: cached } = await adminSupabase
    .from('condition_translations')
    .select('*')
    .eq('condition_id', id)
    .eq('lang', lang)
    .maybeSingle();

  if (cached && cached.source_hash === sourceHash) {
    return {
      ...base,
      condition_name: cached.condition_name ?? base.condition_name,
      goals: cached.goals ?? base.goals,
      clinical_tests: cached.clinical_tests ?? base.clinical_tests,
      red_flags: cached.red_flags ?? base.red_flags,
      contraindications: cached.contraindications ?? base.contraindications,
      typical_exercises: cached.typical_exercises ?? base.typical_exercises,
      progression_criteria: cached.progression_criteria ?? base.progression_criteria,
      return_to_activity_criteria:
        cached.return_to_activity_criteria ?? base.return_to_activity_criteria,
      outcome_measures: cached.outcome_measures ?? base.outcome_measures,
    };
  }

  const translated = await translateFieldsWithOpenAI(base, lang);
  if (!translated) {
    // Translation unavailable right now (rate limit, API outage, missing key) —
    // degrade gracefully to the Italian original rather than break the page.
    return { ...base, _translationFailed: true };
  }

  const upsertRow = {
    condition_id: id,
    lang,
    condition_name: translated.condition_name ?? null,
    goals: translated.goals ?? null,
    clinical_tests: translated.clinical_tests ?? null,
    red_flags: translated.red_flags ?? null,
    contraindications: translated.contraindications ?? null,
    typical_exercises: translated.typical_exercises ?? null,
    progression_criteria: translated.progression_criteria ?? null,
    return_to_activity_criteria: translated.return_to_activity_criteria ?? null,
    outcome_measures: translated.outcome_measures ?? null,
    source_hash: sourceHash,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await adminSupabase
    .from('condition_translations')
    .upsert(upsertRow, { onConflict: 'condition_id,lang' });

  if (upsertError) {
    console.error('Errore salvataggio traduzione in cache:', upsertError);
  }

  return {
    ...base,
    condition_name: translated.condition_name ?? base.condition_name,
    goals: translated.goals ?? base.goals,
    clinical_tests: translated.clinical_tests ?? base.clinical_tests,
    red_flags: translated.red_flags ?? base.red_flags,
    contraindications: translated.contraindications ?? base.contraindications,
    typical_exercises: translated.typical_exercises ?? base.typical_exercises,
    progression_criteria: translated.progression_criteria ?? base.progression_criteria,
    return_to_activity_criteria:
      translated.return_to_activity_criteria ?? base.return_to_activity_criteria,
    outcome_measures: translated.outcome_measures ?? base.outcome_measures,
  };
}

/**
 * Cheap index-page translation: only condition names, batch-translated in as
 * few OpenAI calls as possible and cached per-id (leaving other fields null
 * until/unless that condition's detail page is visited and fills them in).
 */
export async function getTranslatedConditionNames(
  lang: SupportedLang
): Promise<{ id: number; condition_name: string }[]> {
  const { data: baseRows, error } = await adminSupabase
    .from('knowledge_base')
    .select('id, condition_name')
    .order('condition_name', { ascending: true });

  if (error || !baseRows) {
    console.error('Errore caricamento nomi condizioni:', error);
    return [];
  }

  const { data: cachedRows } = await adminSupabase
    .from('condition_translations')
    .select('condition_id, condition_name')
    .eq('lang', lang);

  const cacheMap = new Map<number, string>();
  for (const c of cachedRows ?? []) {
    if (c.condition_name) cacheMap.set(c.condition_id, c.condition_name);
  }

  const missing = baseRows.filter((r) => !cacheMap.has(r.id));

  if (missing.length > 0) {
    const CHUNK = 200;
    for (let i = 0; i < missing.length; i += CHUNK) {
      const chunk = missing.slice(i, i + CHUNK);
      const translatedNames = await translateNamesBatch(chunk, lang);
      if (!translatedNames) continue;

      const rowsToUpsert = chunk
        .filter((c) => translatedNames[c.id])
        .map((c) => ({
          condition_id: c.id,
          lang,
          condition_name: translatedNames[c.id],
          source_hash: computeSourceHash({
            id: c.id,
            condition_name: c.condition_name,
            goals: null,
            clinical_tests: null,
            red_flags: null,
            contraindications: null,
            typical_exercises: null,
            progression_criteria: null,
            evidence_level: null,
            return_to_activity_criteria: null,
            outcome_measures: null,
            source: null,
            source_date: null,
          }),
          updated_at: new Date().toISOString(),
        }));

      if (rowsToUpsert.length > 0) {
        // Only the name + a name-only source hash is written here. If the
        // detail page later translates the full record it computes the real
        // full-field hash and overwrites this row anyway, so no data is lost.
        const { error: upsertErr } = await adminSupabase
          .from('condition_translations')
          .upsert(rowsToUpsert, { onConflict: 'condition_id,lang', ignoreDuplicates: false });
        if (upsertErr) console.error('Errore cache nomi tradotti:', upsertErr);

        for (const r of rowsToUpsert) cacheMap.set(r.condition_id, r.condition_name);
      }
    }
  }

  return baseRows.map((r) => ({ id: r.id, condition_name: cacheMap.get(r.id) ?? r.condition_name }));
}

async function translateNamesBatch(
  items: { id: number; condition_name: string }[],
  lang: SupportedLang
): Promise<Record<number, string> | null> {
  const langName = LANG_NAMES[lang];
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a senior clinical translator and physiotherapist, native-level fluent in ${langName}. Translate physiotherapy/medical condition names from Italian into the standard, internationally recognized ${langName} nomenclature used in clinical guidelines and peer-reviewed rehabilitation literature — not a literal, word-for-word translation and not a regional or colloquial term. Where a condition is conventionally referred to by an eponym or Latin/English term even within ${langName}-language clinical practice, keep that standard form rather than inventing a new translation. Favor the precise, polished term a premium clinical product would use over a flatter or more generic one. You will receive a JSON object mapping numeric ids to Italian condition names. Return ONLY a JSON object with the exact same ids as keys and the translated names as values — no commentary, no markdown, no extra keys.`,
        },
        {
          role: 'user',
          content: JSON.stringify(
            Object.fromEntries(items.map((c) => [c.id, c.condition_name]))
          ),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const result: Record<number, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const idNum = parseInt(k, 10);
      if (Number.isFinite(idNum) && typeof v === 'string') result[idNum] = v;
    }
    return result;
  } catch (err) {
    console.error('Errore traduzione OpenAI (batch nomi):', err);
    return null;
  }
}
