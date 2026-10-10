#!/usr/bin/env node
/**
 * import-alternating-oblique-situps.js
 *
 * Importa UN SOLO esercizio, "Alternating Oblique Sit-Ups": è l'unico, tra i
 * ~15 nomi segnalati come "forse mancanti" dal controllo fatto sul catalogo
 * ufficiale del fornitore (2000+ EXERCISE METADATA.xlsx), che risulta
 * davvero assente dal database E ha un video reale dentro il bundle
 * Dropbox (cartella "Abdominals" dentro "HD 720p LOWEST FILE SIZE").
 *
 * Tutti gli altri nomi segnalati in quel controllo erano falsi positivi:
 * esistono già nel database con un nome leggermente diverso da quello del
 * catalogo (es. "front raises dumbbell seated" = "Seated Dumbbell Neutral
 * Grip Front Raises", già presente), oppure non hanno nessun video nel
 * bundle (es. "plate loaded chest press incline", "russian twist weighted
 * ball" — nomi presenti nel catalogo ma senza file video corrispondente).
 *
 * COME USARLO
 * -----------
 * 1. Scarica da Dropbox, dentro
 *      ULTIMATE BUNDLE MASTER FOLDER 4K+1080p+ILLUSTRATIONS+EXERCISE CATALOG
 *        / HD 720p LOWEST FILE SIZE / Abdominals /
 *    questi due file:
 *      Alternating Oblique Sit-Ups.mp4
 *      Alternating Oblique Sit-Ups_Female.mp4
 *    e mettili dentro una cartella sul Mac chiamata:
 *      ~/Downloads/Abdominals
 *    (va bene anche se in quella cartella ci sono altri file: lo script
 *    guarda solo questi due nomi).
 *
 * 2. Apri il Terminale dentro la cartella del progetto "phygo" e fai prima
 *    un'anteprima (non scrive nulla):
 *      node scripts/import-alternating-oblique-situps.js
 *
 * 3. Se l'anteprima dice che l'esercizio non esiste ancora e i video sono
 *    stati trovati, lancia con --apply per importarlo davvero:
 *      node scripts/import-alternating-oblique-situps.js --apply
 *
 * Se preferisci metterli in un'altra cartella, puoi indicarla così:
 *   node scripts/import-alternating-oblique-situps.js --dir="/percorso/cartella" --apply
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dckmumxswheamyymerea.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'exercise-media';
const SOURCE = 'exercise_animatic';
const EXTERNAL_ID = 'alternating_oblique_sit_ups';
const SLUG = 'alternating-oblique-sit-ups';

if (!SERVICE_ROLE_KEY) {
  console.error('Errore: non trovo SUPABASE_SERVICE_ROLE_KEY ne\' nel file .env.local ne\' tra le variabili esportate.');
  console.error('Esportala prima di lanciare lo script, es.: export SUPABASE_SERVICE_ROLE_KEY="..."');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const dirArg = process.argv.find((a) => a.startsWith('--dir='));
const SEARCH_ROOT = dirArg ? dirArg.slice('--dir='.length) : path.join(os.homedir(), 'Downloads', 'Abdominals');

const MALE_FILENAME = 'Alternating Oblique Sit-Ups.mp4';
const FEMALE_FILENAME = 'Alternating Oblique Sit-Ups_Female.mp4';

// Dati presi parola per parola dal catalogo ufficiale del fornitore
// (2000+ EXERCISE METADATA.xlsx, riga "Alternating oblique sit ups").
const EXERCISE_DATA = {
  display: 'Alternating Oblique Sit-Ups',
  category: 'Bodyweight',
  body_region: 'core-abdomen',
  primary_muscle: 'Obliques (external and internal obliques), Abdominals (rectus abdominis)',
  secondary_muscles: ['Hip Flexors (iliopsoas)'],
  equipment: [],
  instructions:
    '1. Lie on your back with your knees bent and feet flat on the floor. Place your hands lightly behind your head with your elbows pointing outward.\n' +
    '2. Lift your shoulders off the mat and twist your torso to bring your right elbow towards your left knee.\n' +
    '3. Lower your shoulders back to the starting position.\n' +
    '4. Repeat the movement on the opposite side, bringing your left elbow towards your right knee. Continue alternating sides.',
  tips:
    '1. Engage your core throughout the exercise to maximize muscle activation and protect your lower back.\n' +
    '2. Avoid pulling on your neck with your hands to prevent strain; use your core muscles to lift and twist your torso.\n' +
    '3. Perform the movement slowly and with control to ensure proper form and maximize effectiveness.',
};

function ensureDownloadedFromICloud(filePath) {
  try {
    execSync(`brctl download ${JSON.stringify(filePath)}`, { stdio: 'ignore' });
  } catch (e) {
    // brctl non disponibile o file non iCloud: si prosegue comunque.
  }
}
function isAllZero(buf) {
  for (let i = 0; i < buf.length; i++) if (buf[i] !== 0) return false;
  return true;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function readFileWaitingForICloud(filePath, maxWaitMs = 20000) {
  ensureDownloadedFromICloud(filePath);
  const start = Date.now();
  let buf = fs.readFileSync(filePath);
  while (buf.length > 0 && isAllZero(buf) && Date.now() - start < maxWaitMs) {
    await sleep(1000);
    buf = fs.readFileSync(filePath);
  }
  return buf;
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
  console.log(`Cartella controllata: ${SEARCH_ROOT}\n`);

  const { data: existing, error: existingErr } = await supabase
    .from('exercises')
    .select('id, external_id')
    .eq('source', SOURCE)
    .eq('external_id', EXTERNAL_ID)
    .maybeSingle();

  if (existingErr) {
    console.error('Errore controllando il database:', existingErr.message);
    process.exit(1);
  }

  if (existing) {
    console.log(`"${EXERCISE_DATA.display}" e' GIA' presente nel database (id ${existing.id}). Non c'e' nulla da importare.`);
    return;
  }

  const malePath = path.join(SEARCH_ROOT, MALE_FILENAME);
  const femalePath = path.join(SEARCH_ROOT, FEMALE_FILENAME);
  const hasMale = fs.existsSync(malePath);
  const hasFemale = fs.existsSync(femalePath);

  console.log(`"${EXERCISE_DATA.display}" NON e' ancora nel database.`);
  console.log(`Video maschile trovato: ${hasMale ? 'SI' : 'NO'}  (${malePath})`);
  console.log(`Video femminile trovato: ${hasFemale ? 'SI' : 'NO'}  (${femalePath})`);
  console.log(`Categoria: ${EXERCISE_DATA.category}  |  Zona: ${EXERCISE_DATA.body_region}`);
  console.log(`Muscolo primario: ${EXERCISE_DATA.primary_muscle}`);

  if (!hasMale && !hasFemale) {
    console.log('\nNessuno dei due file e\' presente nella cartella indicata: scarica prima i video da Dropbox (vedi istruzioni in testa al file), poi riprova.');
    return;
  }

  if (!APPLY) {
    console.log('\n(Anteprima soltanto - non e\' stato scritto nulla nel database. Rilancia con --apply per importare davvero.)');
    return;
  }

  console.log('\n--apply attivo: carico i video e creo l\'esercizio nel database...\n');

  const exerciseId = crypto.randomUUID();
  const assetsToInsert = [];

  try {
    if (hasMale) {
      const buf = await readFileWaitingForICloud(malePath);
      if (buf.length > 0 && !isAllZero(buf)) {
        const key = `${SLUG}/video_720p.mp4`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, buf, { contentType: 'video/mp4', upsert: true });
        if (upErr) throw new Error(`upload video maschile: ${upErr.message}`);
        assetsToInsert.push({ exercise_id: exerciseId, asset_type: 'video', variant: null, is_default: true, storage_bucket: BUCKET, storage_key: key, bytes: buf.length });
      }
    }
    if (hasFemale) {
      const buf = await readFileWaitingForICloud(femalePath);
      if (buf.length > 0 && !isAllZero(buf)) {
        const key = `${SLUG}-female/video_720p.mp4`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, buf, { contentType: 'video/mp4', upsert: true });
        if (upErr) throw new Error(`upload video femminile: ${upErr.message}`);
        assetsToInsert.push({ exercise_id: exerciseId, asset_type: 'video', variant: 'female', is_default: !hasMale, storage_bucket: BUCKET, storage_key: key, bytes: buf.length });
      }
    }

    if (assetsToInsert.length === 0) {
      console.log('I file trovati risultano vuoti o non leggibili: nessun video valido da importare.');
      return;
    }

    const { error: exErr } = await supabase.from('exercises').insert({
      id: exerciseId,
      source: SOURCE,
      external_id: EXTERNAL_ID,
      primary_muscle: EXERCISE_DATA.primary_muscle,
      secondary_muscles: EXERCISE_DATA.secondary_muscles,
      equipment: EXERCISE_DATA.equipment,
      body_region: EXERCISE_DATA.body_region,
      category: EXERCISE_DATA.category,
      subcategory: null,
      difficulty: null,
      tags: [],
      metadata_complete: true,
    });
    if (exErr) throw new Error(`creazione esercizio: ${exErr.message}`);

    const { error: trErr } = await supabase.from('exercise_translations').insert({
      exercise_id: exerciseId,
      lang: 'en',
      name: EXERCISE_DATA.display,
      instructions: EXERCISE_DATA.instructions,
      tips: EXERCISE_DATA.tips,
      is_source: true,
    });
    if (trErr) throw new Error(`creazione traduzione: ${trErr.message}`);

    const { error: assetErr } = await supabase.from('exercise_assets').insert(
      assetsToInsert.map((a) => ({
        exercise_id: a.exercise_id,
        asset_type: a.asset_type,
        variant: a.variant,
        is_default: a.is_default,
        storage_bucket: a.storage_bucket,
        storage_key: a.storage_key,
        bytes: a.bytes,
      }))
    );
    if (assetErr) throw new Error(`creazione asset: ${assetErr.message}`);

    console.log(`OK: "${EXERCISE_DATA.display}" creato con successo (id ${exerciseId}).`);
  } catch (e) {
    console.error(`ERRORE: ${e.message}`);
    process.exit(1);
  }
}

run();
