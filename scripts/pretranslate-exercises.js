#!/usr/bin/env node
/**
 * pretranslate-exercises.js
 *
 * Perche' il video "non si vedeva" passando la Exercise Library in francese o
 * spagnolo: non e' un problema di video. lib/exerciseTranslation.ts traduce
 * ogni esercizio al VOLO, dentro la stessa richiesta che carica la pagina, la
 * prima volta che qualcuno la apre in quella lingua — e lo fa UNO ALLA VOLTA,
 * a blocchi di 25, mai in parallelo (apposta, per non sforare i limiti di
 * OpenAI). Con 1923 esercizi, se nessuno aveva ancora aperto la pagina in
 * francese/spagnolo, la primissima richiesta doveva tradurne quasi 2000 prima
 * di poter rispondere — un'attesa di diversi minuti, molto oltre il tempo
 * massimo che il server concede a una singola richiesta: la richiesta viene
 * interrotta a meta' e il browser non riceve mai la lista degli esercizi (ne'
 * i video, ne' il resto — la pagina resta vuota/non carica).
 *
 * Questo script fa lo stesso identico lavoro di traduzione (stesso prompt,
 * stesso modello, stessa tabella di destinazione: exercise_translations) ma
 * da terminale, UNA VOLTA SOLA, in anticipo — cosi' quando un utente apre
 * davvero la pagina in francese o spagnolo, la traduzione e' gia' pronta in
 * cache e la pagina carica veloce come in italiano/inglese.
 *
 * COME USARLO
 * -----------
 * 1. ANTEPRIMA (non chiama OpenAI, non scrive nulla — solo un conteggio):
 *        node scripts/pretranslate-exercises.js
 *    Stampa quanti esercizi mancano ancora di traduzione per ciascuna lingua.
 *
 * 2. Se il conteggio sembra ragionevole, lancia per davvero:
 *        node scripts/pretranslate-exercises.js --apply
 *    Di default traduce francese e spagnolo (le due lingue segnalate come
 *    rotte). Per includere anche l'italiano:
 *        node scripts/pretranslate-exercises.js --apply --langs=fr,es,it
 *    Si puo' interrompere in qualsiasi momento (Ctrl+C) e far ripartire piu'
 *    tardi con lo stesso comando: gli esercizi gia' tradotti vengono
 *    riconosciuti e saltati (stessa logica di cache gia' usata dal sito).
 *
 * NOTE
 * ----
 * - Legge da sole le chiavi SUPABASE_SERVICE_ROLE_KEY e OPENAI_API_KEY dal
 *   file .env.local del progetto (le stesse che usa gia' il sito).
 * - Con ~1900 esercizi il tempo stimato e' di svariati minuti PER lingua
 *   (chiamate a OpenAI fatte apposta in sequenza, mai in parallelo, per non
 *   sforare i limiti dell'account) — e' normale che non sia istantaneo, va
 *   semplicemente lasciato andare.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Errore: non trovo NEXT_PUBLIC_SUPABASE_URL e/o SUPABASE_SERVICE_ROLE_KEY nel file .env.local.');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('Errore: non trovo OPENAI_API_KEY nel file .env.local.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const APPLY = process.argv.includes('--apply');
const langsArg = process.argv.find((a) => a.startsWith('--langs='));
const LANGS = (langsArg ? langsArg.split('=')[1].split(',') : ['fr', 'es']).map((s) => s.trim());

const LANG_NAMES = { it: 'Italian', es: 'Spanish', fr: 'French' };
const TRANSLATABLE_FIELDS = ['name', 'instructions', 'tips'];
const ID_CHUNK_SIZE = 150; // lettura cache, limite lunghezza URL PostgREST
const TRANSLATE_CHUNK = 25; // stesso valore usato dal sito in lib/exerciseTranslation.ts
const MAX_RATE_LIMIT_RETRIES = 6;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function computeSourceHash(record) {
  const raw = TRANSLATABLE_FIELDS.map((f) => record[f] ?? '').join('|||');
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function getRetryAfterSeconds(err) {
  const headers = err?.headers;
  if (!headers) return null;
  const val = typeof headers.get === 'function' ? headers.get('retry-after') : headers['retry-after'];
  const n = val ? parseFloat(val) : NaN;
  return Number.isFinite(n) ? n : null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Identico, parola per parola, al prompt gia' in produzione in
// lib/exerciseTranslation.ts — cosi' le righe scritte da questo script sono
// indistinguibili da quelle che avrebbe scritto il sito stesso.
async function translateBatchWithOpenAI(records, lang) {
  const langName = LANG_NAMES[lang];
  const payload = {};
  for (const r of records) {
    const entry = {};
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
          { role: 'user', content: JSON.stringify(payload) },
        ],
      });
      const raw = completion.choices[0]?.message?.content;
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      const isRateLimit = err?.status === 429;
      const isQuotaExhausted =
        err?.code === 'credit_balance_exhausted' ||
        err?.error?.code === 'credit_balance_exhausted' ||
        err?.type === 'insufficient_quota' ||
        err?.error?.type === 'insufficient_quota';
      if (isQuotaExhausted) {
        console.error('\nOpenAI: credito esaurito sull\'account. Ricarica su platform.openai.com/settings/organization/billing e rilancia lo stesso comando (riparte da dove si era fermato).');
        process.exit(1);
      }
      if (isRateLimit && attempt < MAX_RATE_LIMIT_RETRIES) {
        const retryAfter = getRetryAfterSeconds(err);
        const waitMs = Math.ceil((retryAfter ?? Math.min(2 ** attempt, 30)) * 1000) + 500;
        console.warn(`\n  rate limit OpenAI, attendo ${Math.round(waitMs / 1000)}s e riprovo...`);
        await sleep(waitMs);
        continue;
      }
      console.error('\nErrore OpenAI:', err?.message || err);
      return null;
    }
  }
  return null;
}

async function fetchAll(table, select, filters) {
  const PAGE = 1000;
  let from = 0;
  let out = [];
  for (;;) {
    let q = supabase.from(table).select(select).range(from, from + PAGE - 1);
    if (filters) q = filters(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    out = out.concat(data || []);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

async function main() {
  console.log(`Lingue: ${LANGS.join(', ')}  |  modalita': ${APPLY ? 'APPLY (scrive davvero)' : 'ANTEPRIMA (solo conteggio)'}\n`);

  const exercises = await fetchAll('exercises', 'id', (q) => q.eq('source', 'exercise_animatic').is('archived_at', null));
  const exerciseIds = exercises.map((e) => e.id);
  console.log(`Esercizi totali: ${exerciseIds.length}`);

  const idChunksForEn = chunk(exerciseIds, ID_CHUNK_SIZE);
  const enResults = await Promise.all(
    idChunksForEn.map((ids) =>
      supabase.from('exercise_translations').select('exercise_id, name, instructions, tips').eq('lang', 'en').in('exercise_id', ids)
    )
  );
  const sourceRecords = enResults.flatMap((r) => r.data || []);
  const sourceById = new Map(sourceRecords.map((r) => [r.exercise_id, r]));
  console.log(`Testo sorgente in inglese disponibile per: ${sourceRecords.length} esercizi\n`);

  for (const lang of LANGS) {
    if (!LANG_NAMES[lang]) {
      console.log(`Lingua "${lang}" sconosciuta, salto.`);
      continue;
    }
    console.log(`--- ${LANG_NAMES[lang]} (${lang}) ---`);

    const idChunks = chunk(exerciseIds, ID_CHUNK_SIZE);
    const cacheResults = await Promise.all(
      idChunks.map((ids) =>
        supabase.from('exercise_translations').select('exercise_id, source_hash').eq('lang', lang).in('exercise_id', ids)
      )
    );
    const cacheByExercise = new Map(cacheResults.flatMap((r) => r.data || []).map((row) => [row.exercise_id, row]));

    const missing = [];
    for (const id of exerciseIds) {
      const source = sourceById.get(id);
      if (!source) continue; // nessun testo inglese per questo esercizio, niente da tradurre
      const hash = computeSourceHash(source);
      const cached = cacheByExercise.get(id);
      if (!cached || cached.source_hash !== hash) missing.push({ ...source, __hash: hash });
    }

    console.log(`  gia' tradotti e aggiornati: ${exerciseIds.length - missing.length}`);
    console.log(`  da tradurre: ${missing.length}`);

    if (!APPLY || missing.length === 0) {
      console.log('');
      continue;
    }

    const chunks = chunk(missing, TRANSLATE_CHUNK);
    let done = 0;
    let written = 0;
    for (const batch of chunks) {
      const translated = await translateBatchWithOpenAI(batch, lang);
      if (translated) {
        const rows = batch
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
              source_hash: r.__hash,
              updated_at: new Date().toISOString(),
            };
          });
        if (rows.length > 0) {
          const { error } = await supabase.from('exercise_translations').upsert(rows, { onConflict: 'exercise_id,lang' });
          if (error) console.error(`\n  errore salvataggio lotto: ${error.message}`);
          else written += rows.length;
        }
      }
      done += batch.length;
      process.stdout.write(`\r  tradotti: ${done}/${missing.length}  (salvati: ${written})`);
    }
    console.log('\n');
  }

  console.log('Fatto.');
}

main().catch((e) => {
  console.error('\nErrore fatale:', e.message || e);
  process.exit(1);
});
