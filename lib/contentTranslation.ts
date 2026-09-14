// Generic lazy, self-caching translation engine for dashboard content OTHER
// than `knowledge_base` conditions (which keep using the dedicated
// lib/conditionTranslation.ts + condition_translations table already built
// and shipped for the public Clinical Library and, going forward, the
// dashboard Body Map section).
//
// This module is what every OTHER dashboard section (Brain Map, Oncology,
// Cardiopulmonary, Manual Therapy, Orthopedic Tests, and any hardcoded
// per-zone content) plugs into as it gets translated, one section at a
// time. It stores translated field values as jsonb in a single generic
// `content_translations` table (see sql/2026-09_i18n_foundation.sql) keyed
// by (content_type, content_id, lang), so adding a new section never needs
// a new SQL table or migration — only a `contentType` string and a list of
// field names to translate.
//
// Same behavior as the conditions-specific engine: first real request for a
// given (content_type, content_id, lang) calls OpenAI and caches the
// result; a source_hash over the translatable fields invalidates the cache
// automatically if the Italian source is later edited; a translation
// failure degrades gracefully to the original Italian values rather than
// breaking the page.

import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** All languages the dashboard can be used in. Italian is the source language content is authored in. */
export type AppLang = 'it' | 'en' | 'es' | 'fr';

const LANG_NAMES: Record<Exclude<AppLang, 'it'>, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
};

function computeSourceHash(fields: Record<string, string | null | undefined>, order: readonly string[]): string {
  const raw = order.map((f) => fields[f] ?? '').join('|||');
  return createHash('sha256').update(raw).digest('hex');
}

export interface TranslateContentResult<F extends string> {
  /** Translated values keyed by field name — falls back to the original Italian value for any field the model didn't return. */
  fields: Record<F, string>;
  /** True if this is the original Italian content shown as a fallback because translation failed (rate limit, API outage, etc). */
  failed: boolean;
}

/**
 * Translates (and caches) an arbitrary record's fields into the target
 * language. Pass `lang: 'it'` and it returns the source fields unchanged —
 * callers don't need to special-case the source language themselves.
 *
 * @param contentType a short stable string identifying the KIND of content, e.g. 'brain_map_zone', 'oncology_structure', 'orthopedic_test' — becomes part of the cache key, not shown to users.
 * @param contentId the source row's id or slug (numeric ids and string slugs both work — always compared/stored as text).
 * @param fields the Italian source values to translate, keyed by field name.
 * @param fieldOrder which keys of `fields` to translate, in a stable order (used for the cache-invalidating hash — keep this list's order stable across calls for the same contentType).
 */
export async function translateContent<F extends string>(
  contentType: string,
  contentId: string | number,
  fields: Record<F, string | null | undefined>,
  fieldOrder: readonly F[],
  lang: AppLang
): Promise<TranslateContentResult<F>> {
  const fallback = () => {
    const out = {} as Record<F, string>;
    for (const f of fieldOrder) out[f] = fields[f] ?? '';
    return out;
  };

  if (lang === 'it') {
    return { fields: fallback(), failed: false };
  }

  const sourceFields: Partial<Record<F, string>> = {};
  for (const f of fieldOrder) {
    const v = fields[f];
    if (v) sourceFields[f] = v;
  }
  if (Object.keys(sourceFields).length === 0) {
    return { fields: fallback(), failed: false };
  }

  const idStr = String(contentId);
  const sourceHash = computeSourceHash(fields, fieldOrder);

  const { data: cached } = await adminSupabase
    .from('content_translations')
    .select('fields, source_hash')
    .eq('content_type', contentType)
    .eq('content_id', idStr)
    .eq('lang', lang)
    .maybeSingle();

  if (cached && cached.source_hash === sourceHash) {
    const merged = fallback();
    const cachedFields = (cached.fields ?? {}) as Partial<Record<F, string>>;
    for (const f of fieldOrder) {
      if (cachedFields[f]) merged[f] = cachedFields[f] as string;
    }
    return { fields: merged, failed: false };
  }

  const translated = await translateFieldsWithOpenAI(sourceFields, lang);
  if (!translated) {
    return { fields: fallback(), failed: true };
  }

  const { error: upsertError } = await adminSupabase.from('content_translations').upsert(
    {
      content_type: contentType,
      content_id: idStr,
      lang,
      fields: translated,
      source_hash: sourceHash,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'content_type,content_id,lang' }
  );
  if (upsertError) {
    console.error('Errore salvataggio traduzione in cache (content_translations):', upsertError);
  }

  const merged = fallback();
  for (const f of fieldOrder) {
    if (translated[f]) merged[f] = translated[f] as string;
  }
  return { fields: merged, failed: false };
}

async function translateFieldsWithOpenAI<F extends string>(
  sourceFields: Partial<Record<F, string>>,
  lang: Exclude<AppLang, 'it'>
): Promise<Partial<Record<F, string>> | null> {
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
- Named clinical tests, signs, muscles, nerves and maneuvers (e.g. Lachman test, McMurray test, biceps brachii, musculocutaneous nerve) are internationally recognized anatomical/clinical terms: use their standard internationally recognized ${langName} form rather than translating them literally.
- Preserve all numbers, units, percentages, dosages, durations, degrees and scale/instrument names exactly as given — never convert, round, or alter them.
- Do not add, omit, soften, or reinterpret information beyond what the source says; translate the clinical meaning faithfully and concisely.
- Preserve the original structure (line breaks and list-like phrasing) so the translation reads the same way the Italian source does.
- If any field is patient-safety-critical (warnings, contraindications, red flags), translate every listed item — never summarize, merge, or drop any of them.

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
    return JSON.parse(raw);
  } catch (err) {
    console.error('Errore traduzione OpenAI (content_translations):', err);
    return null;
  }
}
