// Lazy, self-caching translation layer for the Exercise Library (Exercise
// Animatic import), mirroring lib/conditionTranslation.ts and
// lib/contentTranslation.ts — same "translate on first real request, then
// cache forever until the source changes" behavior — but mirrored in the
// other direction: for this content ENGLISH is the source language (the
// licensed exercise text is authored in English), so 'en' is the no-op
// passthrough and 'it' is a real translation target alongside 'es'/'fr'.
//
// Cache lives directly in `exercise_translations` (exercise_id, lang) —
// no separate cache table needed, since that table already has exactly the
// right shape (name, instructions, tips, source_hash) for every language,
// with `is_source` marking the one authored row (lang='en').

import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Languages the Exercise Library can be displayed in. English is the source language this content is authored in. */
export type ExerciseLang = 'en' | 'it' | 'es' | 'fr';
export type ExerciseTranslationTarget = Exclude<ExerciseLang, 'en'>;

const LANG_NAMES: Record<ExerciseTranslationTarget, string> = {
  it: 'Italian',
  es: 'Spanish',
  fr: 'French',
};

const TRANSLATABLE_FIELDS = ['name', 'instructions', 'tips'] as const;
type TranslatableField = (typeof TRANSLATABLE_FIELDS)[number];

export interface ExerciseSourceRecord {
  exercise_id: string;
  name: string;
  instructions: string | null;
  tips: string | null;
}

export type TranslatedExerciseFields = Record<TranslatableField, string | null>;

// Con ~1270 esercizi, un solo .in('exercise_id', ids) con tutti gli id supera la lunghezza
// massima di URL accettata da PostgREST (Bad Request). Si spezza quindi la lettura della cache
// in blocchi piu' piccoli, eseguiti in parallelo, e si uniscono i risultati (stesso fix gia'
// applicato in app/api/exercise-library/list/route.ts).
const ID_CHUNK_SIZE = 150;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function computeSourceHash(record: ExerciseSourceRecord): string {
  const raw = TRANSLATABLE_FIELDS.map((f) => record[f] ?? '').join('|||');
  return createHash('sha256').update(raw).digest('hex');
}

/** Legge il retry-after (in secondi) da un errore OpenAI 429, se presente. */
function getRetryAfterSeconds(err: any): number | null {
  const headers = err?.headers;
  if (!headers) return null;
  const val = typeof headers.get === 'function' ? headers.get('retry-after') : headers['retry-after'];
  const n = val ? parseFloat(val) : NaN;
  return Number.isFinite(n) ? n : null;
}

const MAX_RATE_LIMIT_RETRIES = 6;

async function translateBatchWithOpenAI(
  records: ExerciseSourceRecord[],
  lang: ExerciseTranslationTarget
): Promise<Record<string, Partial<TranslatedExerciseFields>> | null> {
  const langName = LANG_NAMES[lang];

  const payload: Record<string, Partial<Record<TranslatableField, string>>> = {};
  for (const r of records) {
    const entry: Partial<Record<TranslatableField, string>> = {};
    if (r.name) entry.name = r.name;
    if (r.instructions) entry.instructions = r.instructions;
    if (r.tips) entry.tips = r.tips;
    if (Object.keys(entry).length > 0) payload[r.exercise_id] = entry;
  }
  if (Object.keys(payload).length === 0) return {};

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a senior clinical translator and physiotherapist, native-level fluent in ${langName}, translating exercise-library content from English into formal, professional ${langName} written for physiotherapists and their patients — not a single country's dialect, regionalism, or slang.

Write with the polish and precision expected of a premium clinical software product: choose the more exact, elegant term available in ${langName} over a flatter or more generic one, and prefer varied, professional phrasing over repetitive or clunky constructions — all without changing, softening, or embellishing the underlying content.

You will receive a JSON object mapping an exercise id to its fields: "name" (the exercise's title), "instructions" (numbered step-by-step execution cues), "tips" (coaching cues/safety notes). Rules:
- Translate exercise and equipment names into the standard term used in ${langName}-language fitness and rehabilitation literature (e.g. "dumbbell", "resistance band", "hyperextension bench" each have an established ${langName} equivalent) — do not leave common equipment nouns in English. Only keep a name untranslated if it is itself an internationally recognized proper name with no established ${langName} equivalent.
- Preserve all numbers, reps, sets, durations, degrees and units exactly as given — never convert, round, or alter them.
- Preserve the original structure (line breaks, numbered steps, one cue per line) so the translation reads the same way the English source does.
- Do not add, omit, soften, or reinterpret information beyond what the source says; translate the meaning faithfully and concisely.
- If a field is missing for an id, omit that key for that id in your answer.

Return ONLY a JSON object with the exact same ids as keys, each mapping to an object with the same field names as the input and the translated values — no commentary, no markdown, no extra keys.`,
          },
          {
            role: 'user',
            content: JSON.stringify(payload),
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err: any) {
      const isRateLimit = err?.status === 429;
      // "insufficient_quota" / "credit_balance_exhausted" e' un problema di credito OpenAI
      // esaurito, non un limite temporaneo: riprovare non serve a nulla (fallirebbe sempre
      // allo stesso modo) e farebbe solo aspettare l'utente inutilmente per diversi minuti.
      // In quel caso si fallisce subito, lasciando il fallback automatico all'inglese.
      const isQuotaExhausted =
        err?.code === 'credit_balance_exhausted' ||
        err?.error?.code === 'credit_balance_exhausted' ||
        err?.type === 'insufficient_quota' ||
        err?.error?.type === 'insufficient_quota';

      if (isQuotaExhausted) {
        console.error(
          'OpenAI: credito esaurito sull\'account — traduzione saltata per questo lotto (resta in inglese). Ricarica il credito su platform.openai.com/settings/organization/billing per riabilitare le traduzioni.'
        );
        return null;
      }

      if (isRateLimit && attempt < MAX_RATE_LIMIT_RETRIES) {
        const retryAfter = getRetryAfterSeconds(err);
        const waitMs = Math.ceil((retryAfter ?? Math.min(2 ** attempt, 30)) * 1000) + 500;
        console.warn(
          `Rate limit OpenAI (traduzione esercizi): attendo ${waitMs}ms e riprovo (tentativo ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES})`
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      console.error('Errore traduzione OpenAI (exercise_translations):', err);
      return null;
    }
  }
  return null;
}

/**
 * Batch cache-or-translate for a list of English source exercise records.
 * Returns a map keyed by exercise_id with the fields in the target language
 * (falling back per-field to the English original if a cached/translated
 * value is missing). Pass lang: 'en' and it returns the source unchanged —
 * callers don't need to special-case the source language themselves.
 */
export async function getTranslatedExercisesBatch(
  records: ExerciseSourceRecord[],
  lang: ExerciseLang
): Promise<Map<string, TranslatedExerciseFields>> {
  const fallbackMap = new Map<string, TranslatedExerciseFields>(
    records.map((r) => [r.exercise_id, { name: r.name, instructions: r.instructions, tips: r.tips }])
  );

  if (lang === 'en' || records.length === 0) {
    return fallbackMap;
  }

  const hashByExercise = new Map(records.map((r) => [r.exercise_id, computeSourceHash(r)]));

  const idChunks = chunkArray(
    records.map((r) => r.exercise_id),
    ID_CHUNK_SIZE
  );
  const cacheResults = await Promise.all(
    idChunks.map((ids) =>
      adminSupabase
        .from('exercise_translations')
        .select('exercise_id, name, instructions, tips, source_hash')
        .eq('lang', lang)
        .in('exercise_id', ids)
    )
  );
  const cacheError = cacheResults.find((r) => r.error)?.error;
  if (cacheError) {
    console.error('Errore lettura cache traduzioni esercizi:', cacheError);
  }
  const cachedRows = cacheResults.flatMap((r) => r.data || []);

  const cacheByExercise = new Map((cachedRows ?? []).map((row) => [row.exercise_id, row]));
  const result = new Map(fallbackMap);
  const missing: ExerciseSourceRecord[] = [];

  for (const record of records) {
    const cached = cacheByExercise.get(record.exercise_id);
    if (cached && cached.source_hash === hashByExercise.get(record.exercise_id)) {
      result.set(record.exercise_id, {
        name: cached.name ?? record.name,
        instructions: cached.instructions ?? record.instructions,
        tips: cached.tips ?? record.tips,
      });
    } else {
      missing.push(record);
    }
  }

  if (missing.length === 0) {
    return result;
  }

  // Un'unica chiamata OpenAI per l'intero lotto mancante, a blocchi di 25 —
  // scala bene sia per i 10 esercizi di test sia per una libreria futura più grande.
  // translateBatchWithOpenAI gestisce da sola i 429 "rate limit" con attesa e nuovo tentativo,
  // quindi qui non serve altro accorgimento oltre a proseguire in sequenza (mai in parallelo,
  // per non moltiplicare il consumo di token al minuto).
  const CHUNK = 25;
  for (let i = 0; i < missing.length; i += CHUNK) {
    const chunk = missing.slice(i, i + CHUNK);
    const translated = await translateBatchWithOpenAI(chunk, lang);
    if (!translated) continue;

    const rowsToUpsert = chunk
      .filter((r) => translated[r.exercise_id])
      .map((r) => {
        const t = translated[r.exercise_id];
        return {
          exercise_id: r.exercise_id,
          lang,
          name: t.name ?? r.name,
          instructions: t.instructions ?? r.instructions,
          tips: t.tips ?? r.tips,
          is_source: false,
          source_hash: hashByExercise.get(r.exercise_id),
          updated_at: new Date().toISOString(),
        };
      });

    if (rowsToUpsert.length > 0) {
      const { error: upsertError } = await adminSupabase
        .from('exercise_translations')
        .upsert(rowsToUpsert, { onConflict: 'exercise_id,lang' });
      if (upsertError) {
        console.error('Errore salvataggio traduzione in cache (exercise_translations):', upsertError);
      }
      for (const row of rowsToUpsert) {
        result.set(row.exercise_id, { name: row.name, instructions: row.instructions, tips: row.tips });
      }
    }
  }

  return result;
}
