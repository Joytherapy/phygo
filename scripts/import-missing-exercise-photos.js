#!/usr/bin/env node
/**
 * import-missing-exercise-photos.js
 *
 * Carica le foto (screenshot presi dai video) per gli esercizi della lista
 * "esercizi_senza_foto.csv" che non avevano nessuna foto. Ogni foto diventa
 * la foto "image_start" (quella usata nella card della Libreria Esercizi).
 *
 * COME METTERE LE FOTO
 * ---------------------
 * 1. Crea una cartella dentro il progetto chiamata "foto-esercizi"
 *    (stesso livello di "scripts", "app", ecc.)
 * 2. Dentro, metti ogni foto con il nome esatto dell'esercizio, in minuscolo
 *    e con i trattini al posto degli spazi. Esempi gia' pronti per le prime
 *    foto mandate:
 *      alternating-oblique-sit-ups.png
 *      cable-fly-machine-mid.png
 *      chest-dip-bodyweight.png
 *      copenhagen-plank.png
 *      kettlebell-skull-crusher.png
 *      kettlebell-standing-tricep-extension.png
 *    (puoi usare .png o .jpg, va bene uguale)
 *
 * COME USARLO
 * -----------
 *   node scripts/import-missing-exercise-photos.js            (anteprima)
 *   node scripts/import-missing-exercise-photos.js --apply     (applica davvero)
 *
 * Si puo' rilanciare piu' volte aggiungendo foto nuove nella cartella via
 * via che le prepari: quelle gia' fatte vengono riconosciute e saltate.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'exercise-media';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Errore: non trovo NEXT_PUBLIC_SUPABASE_URL e/o SUPABASE_SERVICE_ROLE_KEY nel file .env.local.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const APPLY = process.argv.includes('--apply');
const dirArg = process.argv.find((a) => a.startsWith('--dir='));
const PHOTOS_DIR = dirArg ? dirArg.slice('--dir='.length) : path.join(__dirname, '..', 'foto-esercizi');

function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

async function buildSlugMap() {
  const PAGE = 1000;
  let from = 0;
  const map = new Map(); // slug -> exercise_id
  for (;;) {
    const { data, error } = await supabase
      .from('exercise_assets')
      .select('exercise_id, storage_key')
      .eq('asset_type', 'video')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`exercise_assets: ${error.message}`);
    for (const row of data || []) {
      const slug = row.storage_key.split('/')[0];
      if (!map.has(slug)) map.set(slug, row.exercise_id);
    }
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return map;
}

async function hasPhotoAlready(exerciseId) {
  const { data, error } = await supabase
    .from('exercise_assets')
    .select('id')
    .eq('exercise_id', exerciseId)
    .eq('asset_type', 'image_start')
    .limit(1);
  if (error) throw new Error(error.message);
  return (data || []).length > 0;
}

async function main() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    console.error(`Non trovo la cartella: ${PHOTOS_DIR}`);
    console.error('Creala e mettici dentro le foto (vedi istruzioni in testa al file).');
    process.exit(1);
  }

  const files = fs
    .readdirSync(PHOTOS_DIR)
    .filter((f) => /\.(png|jpe?g)$/i.test(f));

  if (files.length === 0) {
    console.log(`Nessuna foto trovata dentro ${PHOTOS_DIR}.`);
    return;
  }

  console.log(`Trovate ${files.length} foto in ${PHOTOS_DIR}.\n`);

  const slugMap = await buildSlugMap();

  let toImport = [];
  let notFound = [];
  let alreadyHas = [];

  for (const file of files) {
    const slug = path.basename(file, path.extname(file));
    const exerciseId = slugMap.get(slug);
    if (!exerciseId) {
      notFound.push(file);
      continue;
    }
    const already = await hasPhotoAlready(exerciseId);
    if (already) {
      alreadyHas.push({ file, slug, exerciseId });
      continue;
    }
    toImport.push({ file, slug, exerciseId });
  }

  console.log(`Da importare: ${toImport.length}`);
  console.log(`Gia' hanno una foto (saltate): ${alreadyHas.length}`);
  console.log(`Nome file non corrisponde a nessun esercizio: ${notFound.length}`);
  if (notFound.length) {
    console.log('\nQuesti nomi file non li riconosco (controlla lo slug):');
    for (const f of notFound) console.log(`  ${f}`);
  }
  if (toImport.length) {
    console.log('\nFoto che verrebbero importate:');
    for (const t of toImport) console.log(`  ${t.file}  ->  exercise_id=${t.exerciseId}`);
  }

  if (!APPLY) {
    console.log('\n(Anteprima soltanto - nessun file caricato. Rilancia con --apply per importare davvero.)');
    return;
  }

  console.log(`\n--apply attivo: carico ${toImport.length} foto...\n`);
  let ok = 0;
  let err = 0;
  for (const t of toImport) {
    try {
      const buf = fs.readFileSync(path.join(PHOTOS_DIR, t.file));
      const ext = path.extname(t.file).toLowerCase();
      const key = `${t.slug}/image_start${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, buf, {
        contentType: contentTypeFor(t.file),
        upsert: true,
      });
      if (upErr) throw new Error(`upload: ${upErr.message}`);

      const { error: insErr } = await supabase.from('exercise_assets').insert({
        id: crypto.randomUUID(),
        exercise_id: t.exerciseId,
        asset_type: 'image_start',
        variant: null,
        is_default: true,
        storage_bucket: BUCKET,
        storage_key: key,
        bytes: buf.length,
      });
      if (insErr) throw new Error(`db insert: ${insErr.message}`);

      console.log(`  OK  ${t.file}`);
      ok++;
    } catch (e) {
      console.log(`  ERRORE  ${t.file}: ${e.message}`);
      err++;
    }
  }

  console.log(`\nFatto. Importate: ${ok}, errori: ${err}.`);
}

main().catch((e) => {
  console.error('\nErrore fatale:', e.message || e);
  process.exit(1);
});
