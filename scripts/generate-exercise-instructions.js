#!/usr/bin/env node
/**
 * generate-exercise-instructions.js
 *
 * Scrive le "istruzioni" (passo-passo) e i "tips" (consigli) in inglese per gli
 * esercizi importati da Exercise Animatic che hanno solo il video, senza testo
 * (i 609 esercizi aggiunti dalle 9 cartelle: Legs, Powerlifting, Back, Shoulders,
 * Chest, Biceps, Forearms, Stretching-Mobility, Calisthenics-Cardio-Plyo-Functional).
 *
 * Usa la stessa chiave OpenAI (OPENAI_API_KEY) e lo stesso modello (gpt-4o) gia'
 * usati dal sito per tradurre questi stessi campi in italiano/spagnolo/francese
 * (lib/exerciseTranslation.ts) — qui pero' si GENERA il testo inglese mancante,
 * non lo si traduce. Una volta scritto l'inglese, la traduzione automatica nelle
 * altre lingue scatta da sola al primo caricamento della pagina in quella lingua
 * (stesso meccanismo gia' verificato per i nomi).
 *
 * COME USARLO
 * -----------
 * 1. Prima una "prova a vuoto" (ANTEPRIMA, non scrive nulla nel database):
 *      node scripts/generate-exercise-instructions.js
 *    Chiama davvero OpenAI (serve per generare il testo da farti vedere), ma
 *    salva tutto in un file di anteprima invece di scrivere su Supabase.
 *    Apri il file e leggi qualche esempio: se lo stile ti sembra giusto, procedi.
 *
 * 2. Se l'anteprima ti convince, lancia lo stesso comando con --apply:
 *      node scripts/generate-exercise-instructions.js --apply
 *    Questa volta scrive davvero instructions+tips nel database (tabella
 *    exercise_translations, riga lang='en'). Si puo' interrompere e far
 *    ripartire: gli esercizi che hanno gia' le istruzioni vengono saltati.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const SUPABASE_URL = 'https://dckmumxswheamyymerea.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SOURCE = 'exercise_animatic';

if (!SERVICE_ROLE_KEY) {
  console.error('Errore: non trovo SUPABASE_SERVICE_ROLE_KEY nel file .env.local.');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('Errore: non trovo OPENAI_API_KEY nel file .env.local.');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const CHUNK = 15; // esercizi per chiamata OpenAI — stesso ordine di grandezza usato per le traduzioni
const MAX_RATE_LIMIT_RETRIES = 6;

function getRetryAfterSeconds(err) {
  const headers = err?.headers;
  if (!headers) return null;
  const val = typeof headers.get === 'function' ? headers.get('retry-after') : headers['retry-after'];
  const n = val ? parseFloat(val) : NaN;
  return Number.isFinite(n) ? n : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Due esempi reali gia' presenti nel database, usati come ancora di stile: stesso
// formato ("1. ...", "2. ...", frasi complete con posizione di partenza -> movimento
// -> ritorno), stesso tono (istruzioni tecniche, niente numeri di ripetizioni/serie
// inventati, perche' quelli li' decide il fisioterapista caso per caso).
const STYLE_EXAMPLES = [
  {
    name: 'Band Concentration Curl',
    primary_muscle: 'Biceps',
    equipment: ['Resistance Band'],
    category: 'Resistance',
    instructions: [
      '1. Sit on a bench with your feet flat on the floor, placing the middle of the resistance band under your right foot. Hold the handle of the band in your right hand, and rest your elbow against the inside of your thigh, fully extending your arm towards the floor.',
      '2. Curl the handle upward towards your shoulder, squeezing your biceps at the top of the movement until your hand is near shoulder level.',
      '3. Slowly lower the handle back to the starting position with control, fully extending your arm. Repeat for the desired number of repetitions, then switch to the left arm.',
    ],
    tips: '1. Ensure the resistance band is securely placed under your foot to avoid slipping.\n2. Exhale as you curl the band upwards and inhale as you lower it back down.\n3. Keep your upper arm stationary and avoid swinging it.',
  },
  {
    name: 'Bridge Hip Abduction',
    primary_muscle: 'Glutes',
    equipment: [],
    category: 'Bodyweight',
    instructions: [
      '1. Begin by lying on your back with your knees bent, feet flat on the floor at shoulder width, and arms extended by your sides.',
      '2. Lift your hips off the floor to form a straight line from your shoulders to your knees, engaging your glutes and core.',
      '3. While keeping your hips elevated, move your knees outwards in a controlled manner and back.',
      '4. Repeat the movement for the desired number of repetitions.',
    ],
    tips: '1. Keep your core engaged to maintain stability and support your lower back.\n2. Ensure your hips remain elevated and level throughout the exercise to maximize glute activation.\n3. Perform the leg abductions slowly and with control to avoid any jerky movements and enhance muscle engagement.',
  },
];

async function generateBatchWithOpenAI(items) {
  const payload = {};
  for (const it of items) {
    payload[it.id] = {
      name: it.name,
      primary_muscle: it.primary_muscle || null,
      equipment: it.equipment || [],
      category: it.category || null,
      body_region: it.body_region || null,
    };
  }

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a senior physiotherapist and strength coach writing exercise-library content in English for a premium clinical software product used by physiotherapists and their patients.

You will receive a JSON object mapping an exercise id to what is already known about it: "name" (the exercise's title, exactly as it must appear — do not rename it), "primary_muscle", "equipment" (array, may be empty for bodyweight work), "category" (Bodyweight / Free Weights / Resistance / Cardio — describes the equipment type), "body_region". For each id, write:
- "instructions": an array of 2 to 4 strings, each starting with its own number ("1. ", "2. ", ...), describing starting position, the movement itself, and the return/repeat — technically accurate, specific to the named exercise, consistent with the given muscle/equipment/category (never contradict them, never invent equipment that isn't listed).
- "tips": a single string with 2 to 3 numbered lines ("1. ...\\n2. ...\\n3. ...") covering form cues, breathing, and/or a common safety mistake to avoid.

Style to match exactly (these two are real examples already in the product, follow their register, sentence structure and level of detail):
${JSON.stringify(STYLE_EXAMPLES, null, 2)}

Rules:
- Never invent specific rep counts, set counts, durations, distances, weights or angles — the source examples above never do, because that is decided per patient by the physiotherapist, not by this content.
- If you are not confident what an unusually-named exercise is, give your best technically-reasonable interpretation consistent with its name, muscle and equipment rather than a generic filler description.
- Keep instructions and tips in English only.

Return ONLY a JSON object with the exact same ids as keys, each mapping to {"instructions": [...], "tips": "..."} — no commentary, no markdown, no extra keys.`,
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
        console.error('OpenAI: credito esaurito sull\'account. Ricarica il credito su platform.openai.com/settings/organization/billing e rilancia lo script (riparte da dove si e\' fermato).');
        process.exit(1);
      }
      if (isRateLimit && attempt < MAX_RATE_LIMIT_RETRIES) {
        const retryAfter = getRetryAfterSeconds(err);
        const waitMs = Math.ceil((retryAfter ?? Math.min(2 ** attempt, 30)) * 1000) + 500;
        console.warn(`Rate limit OpenAI: attendo ${waitMs}ms e riprovo (tentativo ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES})`);
        await sleep(waitMs);
        continue;
      }
      console.error('Errore OpenAI:', err.message || err);
      return null;
    }
  }
  return null;
}

async function run() {
  console.log('Cerco gli esercizi senza istruzioni...');

  // Lettura paginata (come import-missing-exercises.js) per non perdere righe oltre
  // il limite di 1000 righe per richiesta di PostgREST. Due passaggi separati
  // (esercizi, poi traduzioni) invece di una join annidata, stesso schema gia'
  // usato e verificato in app/api/exercise-library/list/route.ts.
  const PAGE_SIZE = 1000;
  const allExercises = [];
  for (let page = 0; ; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('exercises')
      .select('id, primary_muscle, equipment, category, body_region')
      .eq('source', SOURCE)
      .is('archived_at', null)
      .order('id', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Errore lettura esercizi:', error.message);
      process.exit(1);
    }
    allExercises.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  function chunkArray(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  const idChunks = chunkArray(allExercises.map((e) => e.id), 150);
  const trResults = await Promise.all(
    idChunks.map((ids) =>
      supabase.from('exercise_translations').select('exercise_id, name, instructions').in('exercise_id', ids).eq('lang', 'en')
    )
  );
  const trError = trResults.find((r) => r.error)?.error;
  if (trError) {
    console.error('Errore lettura traduzioni:', trError.message);
    process.exit(1);
  }
  const trByExercise = new Map(trResults.flatMap((r) => r.data || []).map((t) => [t.exercise_id, t]));

  const items = allExercises
    .filter((e) => {
      const tr = trByExercise.get(e.id);
      return tr && (tr.instructions === null || tr.instructions === undefined);
    })
    .map((e) => ({
      id: e.id,
      name: trByExercise.get(e.id)?.name,
      primary_muscle: e.primary_muscle,
      equipment: e.equipment,
      category: e.category,
      body_region: e.body_region,
    }));

  console.log(`Esercizi senza istruzioni trovati: ${items.length}\n`);
  if (items.length === 0) {
    console.log('Niente da fare: tutti gli esercizi hanno gia\' le istruzioni.');
    return;
  }

  const results = {};
  let done = 0;
  let errors = 0;

  for (let i = 0; i < items.length; i += CHUNK) {
    const batch = items.slice(i, i + CHUNK);
    const generated = await generateBatchWithOpenAI(batch);
    if (!generated) {
      errors += batch.length;
      console.log(`[${i + 1}-${i + batch.length}/${items.length}] ERRORE sul lotto, salto (riprova rilanciando lo script).`);
      continue;
    }
    for (const it of batch) {
      const g = generated[it.id];
      if (g && Array.isArray(g.instructions) && g.instructions.length > 0 && g.tips) {
        results[it.id] = { instructions: g.instructions, tips: g.tips, name: it.name };
        done++;
      } else {
        errors++;
        console.log(`  ! Risposta mancante/incompleta per "${it.name}" (${it.id})`);
      }
    }
    console.log(`[${Math.min(i + CHUNK, items.length)}/${items.length}] generati finora: ${done}, errori: ${errors}`);
  }

  const previewPath = path.join(__dirname, '..', 'instructions-preview.json');
  fs.writeFileSync(previewPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nAnteprima completa salvata in: ${previewPath}`);

  if (!APPLY) {
    console.log('\n(Anteprima soltanto - non e\' stato scritto nulla nel database. Rilancia con --apply per salvare davvero.)');
    return;
  }

  console.log('\n--apply attivo: scrivo instructions+tips nel database...\n');
  let written = 0;
  let writeErrors = 0;
  const ids = Object.keys(results);
  for (let i = 0; i < ids.length; i += 200) {
    const idsChunk = ids.slice(i, i + 200);
    const rows = idsChunk.map((id) => ({
      exercise_id: id,
      lang: 'en',
      instructions: results[id].instructions,
      tips: results[id].tips,
    }));
    // UPDATE (non upsert): la riga lang='en' esiste gia' da quando l'esercizio e' stato
    // importato (is_source:true, name gia' presente) — qui si completa solo instructions/tips.
    for (const row of rows) {
      const { error } = await supabase
        .from('exercise_translations')
        .update({ instructions: row.instructions, tips: row.tips })
        .eq('exercise_id', row.exercise_id)
        .eq('lang', 'en');
      if (error) {
        writeErrors++;
        console.log(`ERRORE scrittura su ${row.exercise_id}: ${error.message}`);
      } else {
        written++;
      }
    }
    console.log(`Scritti: ${written}/${ids.length}`);
  }

  console.log('\n--- Riepilogo ---');
  console.log(`Istruzioni generate: ${done}`);
  console.log(`Scritte nel database: ${written}`);
  console.log(`Errori: ${errors + writeErrors}`);
}

run();
