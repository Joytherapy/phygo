#!/usr/bin/env node
/**
 * trim-exercise-image-margins.js
 *
 * Il problema reale dietro lo "sfondo non uniforme" nella Exercise Library non è
 * un problema di CSS: è che i file del bundle Exercise Animatic hanno ognuno un
 * margine diverso intorno al personaggio. Alcuni lo riempiono quasi tutto, altri
 * hanno il personaggio piccolo in mezzo a un grande canvas bianco (o trasparente).
 * Qualunque trucco di layout (riempi-e-ritaglia, adatta-senza-tagliare, ecc.) può
 * solo scegliere QUALE compromesso mostrare per quella differenza — non puo'
 * farla sparire, perché vive dentro il file stesso.
 *
 * Questo script la fa sparire alla radice: per ogni foto (image_start/image_end)
 * 1. la scarica da Supabase Storage
 * 2. rimuove automaticamente il margine uniforme intorno al personaggio (bianco
 *    o trasparente, qualunque sia: la libreria lo rileva da sola guardando il
 *    colore ai bordi)
 * 3. ci rimette un margine FISSO E UGUALE PER TUTTI (il 7% della dimensione),
 *    cosi' che ogni personaggio occupi sempre circa la stessa proporzione del
 *    riquadro, invece che una proporzione a caso decisa dal file sorgente
 * 4. carica il risultato in un file NUOVO (quello originale resta intatto, come
 *    backup) e aggiorna il database perché punti al file nuovo
 *
 * Dopo questo passaggio, la pagina Exercise Library puo' tornare a usare un
 * semplice "riempi il riquadro" (object-cover) senza nessuno dei due problemi
 * visti finora: ne' il riquadro grigio con l'omino piccolo, ne' lo sfondo
 * bianco/trasparente incoerente — perché ogni foto, alla fonte, avrà ormai lo
 * stesso margine.
 *
 * COME USARLO
 * -----------
 * 1. (una tantum) installa la libreria di elaborazione immagini:
 *        npm install sharp
 *
 * 2. ANTEPRIMA (non scrive né modifica nulla, solo un report):
 *        node scripts/trim-exercise-image-margins.js
 *    Scarica le foto, calcola quanto margine toglierebbe da ciascuna e stampa
 *    un riepilogo (quante cambiano poco, quante molto) + salva
 *    trim-images-preview.json con il dettaglio per controllare a mano i casi
 *    piu' estremi prima di procedere.
 *
 *    Per provare su poche foto prima di scaricarle tutte (piu' veloce):
 *        node scripts/trim-exercise-image-margins.js --limit=30
 *
 * 3. Se il riepilogo sembra ragionevole, lancia per davvero:
 *        node scripts/trim-exercise-image-margins.js --apply
 *    Si puo' interrompere in qualsiasi momento (Ctrl+C) e far ripartire piu'
 *    tardi con lo stesso comando: le foto gia' sistemate vengono riconosciute
 *    (file trim-images-progress.json) e saltate, non rielaborate due volte.
 *
 * NOTE
 * ----
 * - Legge da solo la chiave segreta di Supabase dal file .env.local del
 *   progetto (la stessa che usa gia' il sito).
 * - Il file originale di ogni foto NON viene mai toccato ne' cancellato: la
 *   versione ritagliata viene caricata con un nome nuovo (stesso percorso,
 *   suffisso "-trimmed"), e solo il riferimento nel database viene aggiornato
 *   a puntare li'. Per tornare indietro su una singola foto basta rimettere a
 *   mano nel database il vecchio storage_key (riga per riga, presente nel
 *   report trim-images-progress.json).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Manca la libreria "sharp". Installala prima con:\n    npm install sharp');
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Errore: non trovo NEXT_PUBLIC_SUPABASE_URL e/o SUPABASE_SERVICE_ROLE_KEY nel file .env.local.');
  console.error('Se la chiave segreta non e\' li\', esportala prima di lanciare lo script, es.: export SUPABASE_SERVICE_ROLE_KEY="..."');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const APPLY = process.argv.includes('--apply');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

// Margine uniforme rimesso dopo il ritaglio, come frazione della dimensione del
// personaggio ritagliato (es. 0.07 = il personaggio occupa circa l'86% del
// riquadro su ogni lato, stesso rapporto per ogni foto).
const MARGIN_FRACTION = 0.07;
// Sensibilita' del rilevamento del margine da togliere: piu' alto = piu'
// tollerante verso leggere variazioni di tono (utile per i .jpg compressi).
const TRIM_THRESHOLD = 24;
// Sotto questa percentuale di area rimossa, il file e' gia' abbastanza stretto:
// non vale la pena ricaricarlo (si aggiunge comunque il margine fisso, ma senza
// un ritaglio reale non cambierebbe quasi nulla).
const MIN_AREA_REMOVED_TO_ACT = 0.03;

const CONCURRENCY = 6;
const PROGRESS_PATH = path.join(__dirname, '..', 'trim-images-progress.json');
const PREVIEW_PATH = path.join(__dirname, '..', 'trim-images-preview.json');

function loadProgress() {
  if (!fs.existsSync(PROGRESS_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'));
  } catch {
    return {};
  }
}
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2), 'utf8');
}

function newKeyFor(oldKey) {
  const dot = oldKey.lastIndexOf('.');
  if (dot === -1) return `${oldKey}-trimmed`;
  return `${oldKey.slice(0, dot)}-trimmed${oldKey.slice(dot)}`;
}

async function fetchAllAssetRows() {
  const PAGE = 1000;
  let from = 0;
  let out = [];
  for (;;) {
    const { data, error } = await supabase
      .from('exercise_assets')
      .select('exercise_id, asset_type, storage_bucket, storage_key')
      .in('asset_type', ['image_start', 'image_end'])
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`exercise_assets: ${error.message}`);
    out = out.concat(data || []);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

async function processOne(bucket, key) {
  const { data: blob, error: dlErr } = await supabase.storage.from(bucket).download(key);
  if (dlErr || !blob) throw new Error(`download ${bucket}/${key}: ${dlErr?.message || 'nessun dato'}`);
  const inputBuffer = Buffer.from(await blob.arrayBuffer());

  const inputMeta = await sharp(inputBuffer).metadata();
  const origW = inputMeta.width || 0;
  const origH = inputMeta.height || 0;

  const trimmed = sharp(inputBuffer).trim({ threshold: TRIM_THRESHOLD });
  const trimmedBuffer = await trimmed.toBuffer();
  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  const trimW = trimmedMeta.width || origW;
  const trimH = trimmedMeta.height || origH;

  const origArea = origW * origH || 1;
  const trimArea = trimW * trimH;
  const areaRemovedPct = 1 - trimArea / origArea;

  const stats = { origW, origH, trimW, trimH, areaRemovedPct };

  if (areaRemovedPct < MIN_AREA_REMOVED_TO_ACT) {
    return { acted: false, stats };
  }

  const padX = Math.round(trimW * MARGIN_FRACTION);
  const padY = Math.round(trimH * MARGIN_FRACTION);
  const hasAlpha = !!inputMeta.hasAlpha;
  const background = hasAlpha ? { r: 255, g: 255, b: 255, alpha: 0 } : { r: 255, g: 255, b: 255, alpha: 1 };

  let out = sharp(trimmedBuffer).extend({
    top: padY,
    bottom: padY,
    left: padX,
    right: padX,
    background,
  });

  const format = (inputMeta.format || 'jpeg').toLowerCase();
  if (format === 'png') {
    out = out.png();
  } else {
    out = out.jpeg({ quality: 92 });
  }
  const outputBuffer = await out.toBuffer();

  return { acted: true, stats, outputBuffer, format };
}

async function runPreview(rows) {
  console.log(`Analizzo ${rows.length} foto (solo lettura, non scrivo nulla)...\n`);
  const results = [];
  let done = 0;

  async function worker(queue) {
    while (queue.length) {
      const row = queue.shift();
      try {
        const r = await processOne(row.storage_bucket, row.storage_key);
        results.push({ exercise_id: row.exercise_id, asset_type: row.asset_type, key: row.storage_key, ...r.stats, would_act: r.acted });
      } catch (e) {
        results.push({ exercise_id: row.exercise_id, asset_type: row.asset_type, key: row.storage_key, error: String(e.message || e) });
      }
      done++;
      if (done % 25 === 0 || done === rows.length) {
        process.stdout.write(`\r  ${done}/${rows.length}`);
      }
    }
  }

  const queue = rows.slice();
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
  console.log('\n');

  const ok = results.filter((r) => !r.error);
  const errored = results.filter((r) => r.error);
  const wouldAct = ok.filter((r) => r.would_act);
  const untouched = ok.filter((r) => !r.would_act);

  const buckets = { lieve: 0, medio: 0, forte: 0 };
  for (const r of wouldAct) {
    if (r.areaRemovedPct < 0.2) buckets.lieve++;
    else if (r.areaRemovedPct < 0.5) buckets.medio++;
    else buckets.forte++;
  }

  const top = [...wouldAct].sort((a, b) => b.areaRemovedPct - a.areaRemovedPct).slice(0, 10);

  console.log(`Foto analizzate: ${results.length}`);
  console.log(`Errori di lettura: ${errored.length}`);
  console.log(`Gia' strette (nessuna modifica utile): ${untouched.length}`);
  console.log(`Da ritagliare: ${wouldAct.length}`);
  console.log(`  margine lieve  (<20% rimosso): ${buckets.lieve}`);
  console.log(`  margine medio  (20-50% rimosso): ${buckets.medio}`);
  console.log(`  margine forte  (>50% rimosso): ${buckets.forte}`);
  if (top.length) {
    console.log(`\nI 10 casi con piu' margine rimosso (controllali a mano nel report, per essere sicuri che non abbia tagliato via un pezzo di personaggio):`);
    for (const r of top) {
      console.log(`  ${(r.areaRemovedPct * 100).toFixed(0)}%  ${r.asset_type}  exercise_id=${r.exercise_id}  (${r.origW}x${r.origH} -> ${r.trimW}x${r.trimH})`);
    }
  }
  if (errored.length) {
    console.log(`\n${errored.length} foto hanno dato errore in lettura (dettaglio in ${path.basename(PREVIEW_PATH)}).`);
  }

  fs.writeFileSync(PREVIEW_PATH, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nReport completo: ${PREVIEW_PATH}`);
  console.log('Nessun file e\' stato modificato. Se il riepilogo sembra ragionevole, rilancia con --apply.');
}

async function runApply(rows) {
  const progress = loadProgress();
  const todo = rows.filter((r) => !progress[`${r.storage_bucket}::${r.storage_key}`]);
  console.log(`${rows.length} foto totali, ${rows.length - todo.length} gia' sistemate in precedenza, ${todo.length} da fare.\n`);

  let done = 0;
  let acted = 0;
  let skipped = 0;
  let errored = 0;

  async function worker(queue) {
    while (queue.length) {
      const row = queue.shift();
      const progressKey = `${row.storage_bucket}::${row.storage_key}`;
      try {
        const result = await processOne(row.storage_bucket, row.storage_key);
        if (result.acted) {
          const newKey = newKeyFor(row.storage_key);
          const { error: upErr } = await supabase.storage
            .from(row.storage_bucket)
            .upload(newKey, result.outputBuffer, {
              contentType: result.format === 'png' ? 'image/png' : 'image/jpeg',
              upsert: true,
            });
          if (upErr) throw new Error(`upload: ${upErr.message}`);

          const { error: dbErr } = await supabase
            .from('exercise_assets')
            .update({ storage_key: newKey })
            .eq('exercise_id', row.exercise_id)
            .eq('asset_type', row.asset_type)
            .eq('storage_bucket', row.storage_bucket)
            .eq('storage_key', row.storage_key);
          if (dbErr) throw new Error(`db update: ${dbErr.message}`);

          progress[progressKey] = { newKey, ...result.stats, appliedAt: new Date().toISOString() };
          acted++;
        } else {
          progress[progressKey] = { skipped: true, ...result.stats, appliedAt: new Date().toISOString() };
          skipped++;
        }
        saveProgress(progress);
      } catch (e) {
        errored++;
        console.log(`\n  ERRORE su exercise_id=${row.exercise_id} ${row.asset_type} (${row.storage_key}): ${e.message || e}`);
      }
      done++;
      if (done % 10 === 0 || done === todo.length) {
        process.stdout.write(`\r  ${done}/${todo.length}  (ritagliate: ${acted}, gia' strette: ${skipped}, errori: ${errored})`);
      }
    }
  }

  const queue = todo.slice(0, LIMIT === Infinity ? undefined : LIMIT);
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

  console.log('\n\nFatto.');
  console.log(`Ritagliate e aggiornate: ${acted}`);
  console.log(`Gia' strette, lasciate come sono: ${skipped}`);
  console.log(`Errori: ${errored}`);
  console.log(`\nProgressi salvati in ${path.basename(PROGRESS_PATH)}: rilanciando lo stesso comando, queste foto vengono saltate.`);
}

async function main() {
  let rows = await fetchAllAssetRows();
  if (LIMIT !== Infinity && !APPLY) rows = rows.slice(0, LIMIT);
  if (APPLY) {
    await runApply(rows);
  } else {
    await runPreview(rows.slice(0, LIMIT === Infinity ? undefined : LIMIT));
  }
}

main().catch((e) => {
  console.error('\nErrore fatale:', e.message || e);
  process.exit(1);
});
