#!/usr/bin/env node
/**
 * import-vertical-videos.js
 *
 * Aggiunge, agli esercizi che esistono GIA' nella Libreria Esercizi di Phygo,
 * una versione IN PIU' del video in formato verticale (per la visualizzazione
 * da telefono), presa dalla cartella "VERTICAL VIDEOS" appena scaricata ed
 * estratta sul Mac (Downloads/VERTICAL VIDEOS/<categoria>/...mp4).
 *
 * NON tocca i video orizzontali gia' presenti: li lascia esattamente come
 * sono, aggiunge solo un video nuovo in piu' per ogni esercizio trovato
 * (variante "vertical" nel database, "vertical-female" per la versione
 * femminile), cosi' il sito puo' scegliere quale mostrare a seconda dello
 * schermo.
 *
 * Gli esercizi vengono riconosciuti per NOME (es. "Air Bike Crunch.mp4" si
 * abbina all'esercizio gia' esistente "Air Bike Crunch"), non per cartella:
 * non serve quindi indicare una categoria, lo script controlla da solo tutte
 * le sottocartelle dentro "VERTICAL VIDEOS".
 *
 * COME USARLO
 * -----------
 * 1. Apri il Terminale dentro la cartella del progetto "phygo".
 *
 * 2. Prima fai sempre una "prova a vuoto" (ANTEPRIMA, non scrive nulla):
 *      node scripts/import-vertical-videos.js
 *    Stampa un riepilogo e salva un file import-preview-vertical.json nella
 *    cartella del progetto con l'elenco di: quanti video si abbinano a un
 *    esercizio esistente, quanti esercizi hanno gia' un video verticale
 *    (verranno saltati, non duplicati), e quali nomi di file NON hanno
 *    trovato nessun esercizio corrispondente (da controllare a mano).
 *
 * 3. Se l'anteprima sembra giusta, lancia lo stesso comando con --apply:
 *      node scripts/import-vertical-videos.js --apply
 *    Carica davvero i video su Supabase Storage e aggiunge la riga nel
 *    database. Si puo' interrompere in qualsiasi momento (Ctrl+C) e far
 *    ripartire piu' tardi: gli esercizi che hanno gia' il video verticale
 *    vengono riconosciuti e saltati, non vengono duplicati.
 *
 * NOTE
 * ----
 * - Legge da solo la chiave segreta di Supabase dal file .env.local del
 *   progetto (la stessa che usa gia' il sito).
 * - Se un file e' ancora su iCloud e non scaricato sul disco, lo script
 *   chiede lui stesso a iCloud di scaricarlo prima di leggerlo.
 * - Non ci sono foto in questa cartella (solo video): le foto di ogni
 *   esercizio restano quelle gia' presenti, non vengono toccate.
 * - Le traduzioni (IT/EN/ES/FR) sono quelle gia' esistenti dell'esercizio:
 *   aggiungere un video in piu' non cambia il testo, quindi non serve fare
 *   nulla in piu' per le traduzioni.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dckmumxswheamyymerea.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'exercise-media';
const SEARCH_ROOT = process.env.SEARCH_ROOT || path.join(os.homedir(), 'Downloads', 'VERTICAL VIDEOS');
const APPLY = process.argv.includes('--apply');

if (!SERVICE_ROLE_KEY) {
  console.error('Errore: non trovo SUPABASE_SERVICE_ROLE_KEY ne\' nel file .env.local ne\' tra le variabili esportate.');
  console.error('Esportala prima di lanciare lo script, es.: export SUPABASE_SERVICE_ROLE_KEY="..."');
  process.exit(1);
}
if (!fs.existsSync(SEARCH_ROOT)) {
  console.error(`Non trovo la cartella: ${SEARCH_ROOT}`);
  console.error('Se l\'hai messa altrove, lancia cosi\': SEARCH_ROOT="/percorso/cartella" node scripts/import-vertical-videos.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// --- stesse utility di normalizzazione gia' usate in repair-corrupted-exercise-videos.js ---
function stripExt(name) {
  return name.replace(/\.(mp4|mov|m4v)$/i, '');
}
function baseKey(name) {
  return stripExt(name)
    .toLowerCase()
    .replace(/[_-]?female\b/gi, '')
    .replace(/[_-]?male\b/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
function genderOf(filename) {
  return /female/i.test(filename) ? 'female' : null;
}
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

function walkMp4(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMp4(full, acc);
    } else if (entry.isFile() && /\.mp4$/i.test(entry.name)) {
      acc.push(full);
    }
  }
}

async function run() {
  console.log(`Cerco i video verticali dentro: ${SEARCH_ROOT} ...`);
  const allMp4 = [];
  walkMp4(SEARCH_ROOT, allMp4);
  console.log(`Trovati ${allMp4.length} file .mp4 in totale.\n`);

  // Supabase limita ogni richiesta a 1000 righe: leggo a "pagine" per essere
  // sicuro di avere TUTTI gli esercizi e TUTTI i video, non solo i primi 1000.
  async function fetchAll(table, select, filters) {
    const PAGE = 1000;
    let from = 0;
    const all = [];
    while (true) {
      let q = supabase.from(table).select(select).range(from, from + PAGE - 1);
      for (const [col, val] of Object.entries(filters || {})) q = q.eq(col, val);
      const { data, error } = await q;
      if (error) {
        console.error(`Errore leggendo "${table}" dal database:`, error.message);
        process.exit(1);
      }
      all.push(...data);
      if (data.length < PAGE) break;
      from += PAGE;
    }
    return all;
  }

  // 1) Tutti gli esercizi esistenti con il loro nome inglese, indicizzati per baseKey.
  const translations = await fetchAll('exercise_translations', 'exercise_id, name', { lang: 'en' });
  const exerciseByBase = new Map(); // baseKey -> exercise_id
  for (const row of translations) {
    const key = baseKey(row.name);
    if (!exerciseByBase.has(key)) exerciseByBase.set(key, row.exercise_id);
  }

  // 2) Tutti gli asset video esistenti, per sapere in che cartella dello storage
  //    si trova ciascun esercizio e se ha gia' una variante "vertical".
  const assets = await fetchAll('exercise_assets', 'exercise_id, variant, storage_key, is_default, asset_type', { asset_type: 'video' });
  const videoDirByExercise = new Map(); // exercise_id -> "slug" (cartella nello storage)
  const hasVerticalAlready = new Set(); // "exerciseId|gender"
  for (const a of assets) {
    if (!videoDirByExercise.has(a.exercise_id) || a.is_default) {
      const dir = a.storage_key.split('/').slice(0, -1).join('/');
      if (dir) videoDirByExercise.set(a.exercise_id, dir.replace(/-female$/, ''));
    }
    if (a.variant === 'vertical') hasVerticalAlready.add(`${a.exercise_id}|null`);
    if (a.variant === 'vertical-female') hasVerticalAlready.add(`${a.exercise_id}|female`);
  }

  // 2.5) Se un esercizio non ha ancora nessun video (es. appena creato a mano),
  //      uso come cartella il suo external_id con i trattini al posto degli
  //      underscore (stessa convenzione usata per tutti gli altri esercizi).
  const allExercises = await fetchAll('exercises', 'id, external_id', {});
  for (const ex of allExercises) {
    if (!videoDirByExercise.has(ex.id) && ex.external_id) {
      videoDirByExercise.set(ex.id, ex.external_id.replace(/_/g, '-'));
    }
  }

  // 3) Costruisco il piano: per ogni file verticale, trovo l'esercizio e la
  //    cartella storage da usare.
  const matched = [];
  const noExercise = [];
  const noStorageDir = [];

  for (const filePath of allMp4) {
    const filename = path.basename(filePath);
    const key = baseKey(filename);
    const exerciseId = exerciseByBase.get(key);
    if (!exerciseId) {
      noExercise.push(filename);
      continue;
    }
    const dir = videoDirByExercise.get(exerciseId);
    if (!dir) {
      noStorageDir.push({ filename, exerciseId });
      continue;
    }
    const gender = genderOf(filename);
    const alreadyHas = hasVerticalAlready.has(`${exerciseId}|${gender || 'null'}`);
    matched.push({ filePath, filename, exerciseId, dir, gender, alreadyHas });
  }

  const toDo = matched.filter((m) => !m.alreadyHas);
  const alreadyDone = matched.filter((m) => m.alreadyHas);

  console.log(`Video abbinati a un esercizio esistente: ${matched.length}`);
  console.log(`  - gia' con il video verticale (verranno saltati): ${alreadyDone.length}`);
  console.log(`  - da caricare: ${toDo.length}`);
  console.log(`Video SENZA nessun esercizio corrispondente: ${noExercise.length}`);
  if (noStorageDir.length) console.log(`Esercizi trovati ma senza una cartella video esistente (caso raro, da controllare a mano): ${noStorageDir.length}`);

  const previewPath = path.join(__dirname, '..', 'import-preview-vertical.json');
  fs.writeFileSync(previewPath, JSON.stringify({
    daCaricare: toDo.map((m) => ({ file: m.filename, exerciseId: m.exerciseId, cartellaStorage: m.dir, genere: m.gender })),
    giaPresenti: alreadyDone.map((m) => m.filename),
    senzaEsercizioCorrispondente: noExercise,
    senzaCartellaStorage: noStorageDir,
  }, null, 2), 'utf8');
  console.log(`\nAnteprima completa salvata in: ${previewPath}`);

  if (!APPLY) {
    console.log('\n(Anteprima soltanto - non e\' stato scritto nulla nel database. Rilancia con --apply per caricare davvero.)');
    return;
  }

  console.log('\n--apply attivo: inizio a caricare i video verticali...\n');
  let uploaded = 0;
  let errors = 0;
  let i = 0;

  for (const m of toDo) {
    i++;
    try {
      const buffer = await readFileWaitingForICloud(m.filePath);
      if (buffer.length === 0 || isAllZero(buffer)) {
        console.log(`[${i}/${toDo.length}] SALTATO (file vuoto/non leggibile, forse ancora su iCloud): ${m.filename}`);
        continue;
      }
      const key = `${m.dir}${m.gender === 'female' ? '-female' : ''}/video_vertical.mp4`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, buffer, { contentType: 'video/mp4', upsert: true });
      if (upErr) throw new Error(`upload: ${upErr.message}`);

      const { error: insErr } = await supabase.from('exercise_assets').insert({
        exercise_id: m.exerciseId,
        asset_type: 'video',
        variant: m.gender === 'female' ? 'vertical-female' : 'vertical',
        is_default: false,
        storage_bucket: BUCKET,
        storage_key: key,
        bytes: buffer.length,
      });
      if (insErr) throw new Error(`inserimento nel database: ${insErr.message}`);

      uploaded++;
      console.log(`[${i}/${toDo.length}] OK: ${m.filename}`);
    } catch (e) {
      errors++;
      console.log(`[${i}/${toDo.length}] ERRORE su "${m.filename}": ${e.message}`);
    }
  }

  console.log('\n--- Riepilogo ---');
  console.log(`Video verticali caricati con successo: ${uploaded} / ${toDo.length}`);
  if (errors) console.log(`Errori: ${errors}`);
}

run();
