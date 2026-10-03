#!/usr/bin/env node
/**
 * import-missing-images.js
 *
 * Collega agli esercizi della Libreria la FOTO iniziale (image_start) che
 * manca per 687 esercizi su 1880 (hanno gia' tutti il video, manca solo la
 * foto). Le foto NON sono mai state fotografate ex-novo: esistono gia' dentro
 * il tuo Dropbox, nella cartella "ILLUSTRATIONS" del bundle
 * "ULTIMATE BUNDLE MASTER FOLDER 4K+1080p+ILLUSTRATIONS+EXERCISE CATALOG",
 * organizzate esattamente come i video (una sottocartella per zona del corpo,
 * stesso nome del file video ma con estensione .jpg). Semplicemente, quando i
 * video sono stati importati, nessuno script era andato a prendere anche
 * quella cartella di foto.
 *
 * COME USARLO
 * -----------
 * 1. Scarica dal tuo Dropbox la cartella "ILLUSTRATIONS" (quella dentro
 *    "ULTIMATE BUNDLE MASTER FOLDER 4K+1080p+ILLUSTRATIONS+EXERCISE CATALOG")
 *    e mettila dentro la cartella Downloads del Mac, cosi' che il percorso
 *    diventi:
 *        ~/Downloads/ILLUSTRATIONS/Chest/...
 *        ~/Downloads/ILLUSTRATIONS/Legs/...
 *        ecc.
 *    (Va bene scaricare tutta la cartella ILLUSTRATIONS con tutte le
 *    sottocartelle dentro: lo script le scorre tutte da solo, non importa il
 *    nome della sottocartella.)
 *
 * 2. Apri il Terminale dentro la cartella del progetto "phygo" e fai prima
 *    una "prova a vuoto" (ANTEPRIMA, non scrive nulla):
 *        node scripts/import-missing-images.js
 *    Stampa quante foto ha trovato e quante riuscirebbe ad abbinare, e salva
 *    un file import-images-preview.json con l'elenco completo (compresi gli
 *    esercizi per cui NON ha trovato una foto corrispondente, da controllare
 *    a mano).
 *
 * 3. Se l'anteprima ti sembra giusta, lancia lo stesso comando con --apply:
 *        node scripts/import-missing-images.js --apply
 *    Questa volta carica davvero le foto su Supabase e le collega agli
 *    esercizi. Si puo' interrompere in qualsiasi momento (Ctrl+C) e far
 *    ripartire piu' tardi: gli esercizi che hanno gia' la foto vengono
 *    riconosciuti e saltati, non vengono duplicati.
 *
 * NOTE
 * ----
 * - Legge da solo la chiave segreta di Supabase dal file .env.local del
 *   progetto (la stessa che usa gia' il sito).
 * - Se un file e' ancora su iCloud e non scaricato sul disco, lo script
 *   chiede lui stesso a iCloud di scaricarlo prima di leggerlo (come gli
 *   altri script usati nei giorni scorsi).
 * - La foto viene messa nella STESSA cartella di archiviazione dove si trova
 *   gia' il video di quell'esercizio (lo stesso "nome cartella" usato per il
 *   video), cosi' l'app la trova nello stesso posto in cui cerca gia' la
 *   foto per gli altri esercizi.
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
const SOURCE = 'exercise_animatic';

if (!SERVICE_ROLE_KEY) {
  console.error('Errore: non trovo SUPABASE_SERVICE_ROLE_KEY ne\' nel file .env.local ne\' tra le variabili esportate.');
  console.error('Esportala prima di lanciare lo script, es.: export SUPABASE_SERVICE_ROLE_KEY="..."');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const rootArgRaw = process.argv.slice(2).find((a) => !a.startsWith('--'));
const SEARCH_ROOT = rootArgRaw ? path.resolve(rootArgRaw) : path.join(os.homedir(), 'Downloads', 'ILLUSTRATIONS');

if (!fs.existsSync(SEARCH_ROOT)) {
  console.error(`Non trovo la cartella: ${SEARCH_ROOT}`);
  console.error('Scarica la cartella "ILLUSTRATIONS" dal tuo Dropbox dentro Downloads (vedi istruzioni in cima a questo file), poi rilancia.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Utilita' nomi file (stesse regole gia' usate per i video in
// import-missing-exercises.js, con in piu' la rimozione del numero finale che
// la cartella ILLUSTRATIONS usa per le angolazioni alternative della stessa
// foto, es. "Plate Single Leg Deadlift1.jpg" = stessa foto/esercizio di
// "Plate Single Leg Deadlift.jpg").
// ---------------------------------------------------------------------------
function stripExt(name) {
  return name.replace(/\.(jpg|jpeg|png)$/i, '');
}
function genderOf(filename) {
  return /female/i.test(filename) ? 'female' : 'male';
}
function cleanDisplayName(filename) {
  return stripExt(filename)
    .replace(/[_\s]?female\b/gi, '')
    .replace(/[_\s]?male\b/gi, '')
    .replace(/(?<=[A-Za-z])\d+$/, '') // toglie SOLO il numero di angolazione alternativa attaccato
    // direttamente a una lettera (es. "Name1.jpg" -> "Name"), MAI un numero che fa
    // parte del nome vero (es. "...Version 2", "...Wall V.2", "...360 Degrees")
    .replace(/\s+/g, ' ')
    .trim();
}
function normalizeKey(name) {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
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

function contentTypeFor(filePath) {
  if (/\.png$/i.test(filePath)) return 'image/png';
  return 'image/jpeg';
}

// ---------------------------------------------------------------------------
// 1) Scorro TUTTA la cartella ILLUSTRATIONS (tutte le sottocartelle, non
//    importa come si chiamano) e raggruppo le foto per nome esercizio.
// ---------------------------------------------------------------------------
function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(jpe?g|png)$/i.test(entry.name)) out.push(full);
  }
}

const allImageFiles = [];
walk(SEARCH_ROOT, allImageFiles);

const byDisplayName = new Map(); // chiave normalizzata -> { male: path|null, female: path|null, display }
for (const filePath of allImageFiles) {
  const filename = path.basename(filePath);
  const display = cleanDisplayName(filename);
  const key = normalizeKey(display);
  if (!key) continue;
  if (!byDisplayName.has(key)) byDisplayName.set(key, { male: null, female: null, display });
  const entry = byDisplayName.get(key);
  const g = genderOf(filename);
  if (!entry[g]) entry[g] = filePath; // la prima trovata vince (es. "Name.jpg" prima di "Name1.jpg" se lette in ordine alfabetico)
}

console.log(`Cartella foto: ${SEARCH_ROOT}`);
console.log(`File immagine trovati: ${allImageFiles.length}  ->  ${byDisplayName.size} esercizi unici (maschio/femmina contati come uno).\n`);

// ---------------------------------------------------------------------------
// 2) Prendo dal database gli esercizi che hanno gia' il video ma NON hanno
//    ancora la foto, con il loro nome inglese e la cartella di archiviazione
//    gia' usata dal video (cosi' la foto va a finire nello stesso posto).
// ---------------------------------------------------------------------------
function folderOf(storageKey) {
  return storageKey.split('/')[0];
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

// Pochi casi conosciuti in cui il nome della foto nel bundle del fornitore e'
// scritto in modo diverso dal nome dell'esercizio nel database (parola in
// piu'/mancante, trattini al posto di spazi) - trovati controllando a mano i
// rimasti dopo il primo giro. Chiave = nome esercizio (minuscolo), valore =
// nome da cercare tra le foto (minuscolo).
const MANUAL_ALIASES = {
  'pec deck fly machine': 'pec deck fly machine flies',
  'assisted close-grip underhand chin-up': 'assisted close grip underhand chin up',
};

async function run() {
  const [exercises, translations, videoAssets, imageAssets] = await Promise.all([
    fetchAll('exercises', 'id, external_id', (q) => q.eq('source', SOURCE).is('archived_at', null)),
    fetchAll('exercise_translations', 'exercise_id, name', (q) => q.eq('lang', 'en')),
    fetchAll('exercise_assets', 'exercise_id, variant, is_default, storage_key', (q) => q.eq('asset_type', 'video')),
    fetchAll('exercise_assets', 'exercise_id', (q) => q.eq('asset_type', 'image_start')),
  ]);

  const nameByExercise = new Map(translations.map((t) => [t.exercise_id, t.name]));
  const hasImage = new Set(imageAssets.map((a) => a.exercise_id));

  const videosByExercise = new Map(); // exercise_id -> { male: {key,is_default}|null, female: {key,is_default}|null }
  for (const a of videoAssets) {
    if (!videosByExercise.has(a.exercise_id)) videosByExercise.set(a.exercise_id, { male: null, female: null });
    const entry = videosByExercise.get(a.exercise_id);
    const g = a.variant === 'female' ? 'female' : 'male';
    entry[g] = { key: a.storage_key, is_default: !!a.is_default };
  }

  const missing = exercises.filter((e) => !hasImage.has(e.id));

  console.log(`Esercizi totali: ${exercises.length}`);
  console.log(`Esercizi senza foto iniziale: ${missing.length}\n`);

  const plan = missing.map((e) => {
    const name = nameByExercise.get(e.id) || null;
    const videos = videosByExercise.get(e.id) || { male: null, female: null };
    const slug = videos.male ? folderOf(videos.male.key) : videos.female ? folderOf(videos.female.key).replace(/-female$/, '') : null;
    const lookupKey = name ? (MANUAL_ALIASES[normalizeKey(name)] || normalizeKey(name)) : null;
    const imgEntry = lookupKey ? byDisplayName.get(lookupKey) : null;

    const canMale = !!(videos.male && imgEntry && imgEntry.male);
    const canFemale = !!(videos.female && imgEntry && imgEntry.female);

    return {
      exerciseId: e.id,
      externalId: e.external_id,
      name,
      slug,
      hasMaleVideo: !!videos.male,
      hasFemaleVideo: !!videos.female,
      foundImage: !!imgEntry,
      canImportMale: canMale,
      canImportFemale: canFemale,
      maleDefault: videos.male ? videos.male.is_default : false,
      femaleDefault: videos.female ? videos.female.is_default : false,
      imageMalePath: canMale ? imgEntry.male : null,
      imageFemalePath: canFemale ? imgEntry.female : null,
    };
  });

  const previewPath = path.join(__dirname, '..', 'import-images-preview.json');
  fs.writeFileSync(previewPath, JSON.stringify(plan, null, 2), 'utf8');
  console.log(`Anteprima completa salvata in: ${previewPath}`);

  const importabili = plan.filter((p) => p.canImportMale || p.canImportFemale);
  const nonTrovati = plan.filter((p) => !p.canImportMale && !p.canImportFemale);
  console.log(`Foto trovate e abbinabili: ${importabili.length}`);
  console.log(`Esercizi per cui NON ho trovato una foto corrispondente: ${nonTrovati.length}`);
  if (nonTrovati.length) {
    console.log('(elenco completo nel file di anteprima - controlla se il nome della foto nella cartella e\' scritto in modo leggermente diverso dal nome dell\'esercizio)');
  }

  if (!APPLY) {
    console.log('\n(Anteprima soltanto - non e\' stato scritto nulla nel database. Rilancia con --apply per importare davvero.)');
    return;
  }

  console.log('\n--apply attivo: inizio a caricare le foto e collegarle agli esercizi...\n');

  let created = 0;
  let errors = 0;
  let i = 0;

  for (const item of importabili) {
    i++;
    try {
      const assetsToInsert = [];

      if (item.canImportMale) {
        const buf = await readFileWaitingForICloud(item.imageMalePath);
        if (buf.length > 0 && !isAllZero(buf)) {
          const key = `${item.slug}/image_start.jpg`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, buf, { contentType: contentTypeFor(item.imageMalePath), upsert: true });
          if (upErr) throw new Error(`upload foto maschile: ${upErr.message}`);
          assetsToInsert.push({
            exercise_id: item.exerciseId,
            asset_type: 'image_start',
            variant: null,
            is_default: item.maleDefault,
            storage_bucket: BUCKET,
            storage_key: key,
            bytes: buf.length,
            source_filename: path.basename(item.imageMalePath),
          });
        }
      }

      if (item.canImportFemale) {
        const buf = await readFileWaitingForICloud(item.imageFemalePath);
        if (buf.length > 0 && !isAllZero(buf)) {
          const key = `${item.slug}-female/image_start.jpg`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, buf, { contentType: contentTypeFor(item.imageFemalePath), upsert: true });
          if (upErr) throw new Error(`upload foto femminile: ${upErr.message}`);
          assetsToInsert.push({
            exercise_id: item.exerciseId,
            asset_type: 'image_start',
            variant: 'female',
            is_default: item.femaleDefault,
            storage_bucket: BUCKET,
            storage_key: key,
            bytes: buf.length,
            source_filename: path.basename(item.imageFemalePath),
          });
        }
      }

      if (assetsToInsert.length === 0) {
        console.log(`[${i}/${importabili.length}] SALTATO (file vuoto/non leggibile): ${item.name}`);
        continue;
      }

      const { error: assetErr } = await supabase.from('exercise_assets').insert(assetsToInsert);
      if (assetErr) throw new Error(`creazione asset: ${assetErr.message}`);

      created++;
      console.log(`[${i}/${importabili.length}] OK: ${item.name}`);
    } catch (e) {
      errors++;
      console.log(`[${i}/${importabili.length}] ERRORE su "${item.name}": ${e.message}`);
    }
  }

  console.log('\n--- Riepilogo importazione foto ---');
  console.log(`Esercizi con foto collegata: ${created}`);
  console.log(`Errori: ${errors}`);
}

run();
