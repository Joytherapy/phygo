#!/usr/bin/env node
/**
 * revert-exercise-images-to-original.js
 *
 * Rimette le FOTO della Libreria Esercizi come erano prima di tutto il
 * lavoro di oggi su "trim-exercise-image-margins.js" (quello che toglieva i
 * margini e ne rimetteva uno uniforme). Non cancella nessun file: i file
 * ritagliati restano su Supabase Storage, come backup — questo script
 * cambia solo il database perché punti di nuovo al file ORIGINALE
 * (non ritagliato) di ogni foto.
 *
 * Usalo insieme a scripts/revert-exercise-card-to-original.js (quello
 * rimette il riquadro della pagina com'era prima).
 *
 * COME FUNZIONA
 * -------------
 * Ogni foto ritagliata ha, nel nome del file, un suffisso "-trimmed"
 * aggiunto alla fine (es. "image_start.jpg" -> "image_start-trimmed.jpg",
 * o anche "image_start-trimmed-trimmed.jpg" se e' stata ritagliata due
 * volte). Questo script toglie tutti i "-trimmed" dal nome per calcolare
 * qual era il nome originale, controlla che quel file originale esista
 * ancora su Supabase Storage (non e' mai stato cancellato), e se c'e'
 * aggiorna il database perche' punti di nuovo li'.
 *
 * COME USARLO
 * -----------
 *   node scripts/revert-exercise-images-to-original.js            (anteprima)
 *   node scripts/revert-exercise-images-to-original.js --apply     (applica davvero)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Errore: non trovo NEXT_PUBLIC_SUPABASE_URL e/o SUPABASE_SERVICE_ROLE_KEY nel file .env.local.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const APPLY = process.argv.includes('--apply');
const CONCURRENCY = 6;

function originalKeyFor(key) {
  // Toglie uno o piu' "-trimmed" consecutivi appena prima dell'estensione.
  return key.replace(/(-trimmed)+(\.[a-zA-Z0-9]+)$/i, '$2');
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

async function folderExists(bucket, folderCache, folder) {
  const cacheKey = `${bucket}::${folder}`;
  if (folderCache.has(cacheKey)) return folderCache.get(cacheKey);
  const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 1000 });
  const names = new Set((data || []).map((f) => f.name));
  if (error) {
    folderCache.set(cacheKey, new Set());
    return new Set();
  }
  folderCache.set(cacheKey, names);
  return names;
}

async function main() {
  const rows = await fetchAllAssetRows();
  console.log(`${rows.length} foto nel database (image_start/image_end).\n`);

  const folderCache = new Map();
  const toRevert = [];
  const alreadyOriginal = [];
  const missingOriginal = [];

  let done = 0;
  async function worker(queue) {
    while (queue.length) {
      const row = queue.shift();
      const candidate = originalKeyFor(row.storage_key);
      if (candidate === row.storage_key) {
        alreadyOriginal.push(row);
      } else {
        const lastSlash = candidate.lastIndexOf('/');
        const folder = lastSlash === -1 ? '' : candidate.slice(0, lastSlash);
        const basename = lastSlash === -1 ? candidate : candidate.slice(lastSlash + 1);
        const names = await folderExists(row.storage_bucket, folderCache, folder);
        if (names.has(basename)) {
          toRevert.push({ ...row, candidate });
        } else {
          missingOriginal.push({ ...row, candidate });
        }
      }
      done++;
      if (done % 50 === 0 || done === rows.length) {
        process.stdout.write(`\r  controllate ${done}/${rows.length}`);
      }
    }
  }
  const queue = rows.slice();
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
  console.log('\n');

  console.log(`Gia' originali (nessun "-trimmed" nel nome): ${alreadyOriginal.length}`);
  console.log(`Da rimettere all'originale: ${toRevert.length}`);
  console.log(`Originale NON trovato su Storage (da controllare a mano): ${missingOriginal.length}`);
  if (missingOriginal.length) {
    console.log(`\nAttenzione, per questi non ho trovato il file originale (lascio il ritagliato, cosi\' almeno la foto non sparisce):`);
    for (const r of missingOriginal.slice(0, 15)) {
      console.log(`  exercise_id=${r.exercise_id}  ${r.asset_type}  ${r.storage_key} -> atteso ${r.candidate}`);
    }
  }

  if (!APPLY) {
    console.log('\n(Anteprima soltanto - nessun file e\' stato modificato. Rilancia con --apply per applicare davvero.)');
    return;
  }

  console.log(`\n--apply attivo: aggiorno il database per ${toRevert.length} foto...\n`);
  let okCount = 0;
  let errCount = 0;
  let doneApply = 0;
  async function applyWorker(queue) {
    while (queue.length) {
      const r = queue.shift();
      const { error } = await supabase
        .from('exercise_assets')
        .update({ storage_key: r.candidate })
        .eq('exercise_id', r.exercise_id)
        .eq('asset_type', r.asset_type)
        .eq('storage_bucket', r.storage_bucket)
        .eq('storage_key', r.storage_key);
      if (error) {
        errCount++;
        console.log(`\n  ERRORE su exercise_id=${r.exercise_id} ${r.asset_type}: ${error.message}`);
      } else {
        okCount++;
      }
      doneApply++;
      if (doneApply % 50 === 0 || doneApply === toRevert.length) {
        process.stdout.write(`\r  ${doneApply}/${toRevert.length}  (rimesse: ${okCount}, errori: ${errCount})`);
      }
    }
  }
  const applyQueue = toRevert.slice();
  await Promise.all(Array.from({ length: CONCURRENCY }, () => applyWorker(applyQueue)));

  console.log('\n\nFatto.');
  console.log(`Rimesse all'originale: ${okCount}`);
  console.log(`Errori: ${errCount}`);
  console.log('\nI file ritagliati NON sono stati cancellati da Storage, restano li\' come backup.');
}

main().catch((e) => {
  console.error('\nErrore fatale:', e.message || e);
  process.exit(1);
});
