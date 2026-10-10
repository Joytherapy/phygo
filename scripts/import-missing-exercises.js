#!/usr/bin/env node
/**
 * import-missing-exercises.js
 *
 * Importa nella Libreria Esercizi di Phygo i video che esistono dentro le
 * cartelle Exercise Animatic scaricate sul Mac (Legs, Powerlifting, Back,
 * Shoulders, Chest, Biceps, Forearms, "Stretching - Mobility",
 * Calisthenics-Cardio-Plyo-Functional) ma che NON sono ancora stati caricati
 * nel database (tabella "exercises" + "exercise_translations" + i video dentro
 * lo storage bucket "exercise-media").
 *
 * COME USARLO
 * -----------
 * 1. Apri il Terminale dentro la cartella del progetto "phygo".
 *
 * 2. Prima fai sempre una "prova a vuoto" (ANTEPRIMA, non scrive nulla):
 *      node scripts/import-missing-exercises.js Legs
 *    Stampa un riepilogo e salva un file import-preview-Legs.json nella
 *    cartella del progetto, con l'elenco di cosa verrebbe creato (nome
 *    esercizio, muscolo/zona dedotta, attrezzo/categoria dedotta). Apri quel
 *    file e dai un'occhiata: se qualcosa ti sembra sbagliato (zona del corpo
 *    o attrezzo dedotto male), segnalamelo prima di procedere.
 *
 * 3. Se l'anteprima ti sembra giusta, lancia lo stesso comando con --apply:
 *      node scripts/import-missing-exercises.js Legs --apply
 *    Questa volta carica davvero i video su Supabase e crea gli esercizi nel
 *    database. Si può interrompere in qualsiasi momento (Ctrl+C) e far
 *    ripartire più tardi: gli esercizi già creati vengono riconosciuti e
 *    saltati, non vengono duplicati.
 *
 * 4. Ripeti punto 2 e 3 per ciascuna cartella, una alla volta, ad es.:
 *      node scripts/import-missing-exercises.js Powerlifting
 *      node scripts/import-missing-exercises.js Powerlifting --apply
 *      node scripts/import-missing-exercises.js Back
 *      node scripts/import-missing-exercises.js Back --apply
 *      ...e così via per Shoulders, Chest, Biceps, Forearms,
 *      "Stretching - Mobility" (tra virgolette perché contiene uno spazio),
 *      Calisthenics-Cardio-Plyo-Functional.
 *
 * NOTE
 * ----
 * - Legge da solo la chiave segreta di Supabase dal file .env.local del
 *   progetto (la stessa che usa già il sito).
 * - Se un file è ancora su iCloud e non scaricato sul disco, lo script chiede
 *   lui stesso a iCloud di scaricarlo prima di leggerlo (come lo script di
 *   riparazione dei video usato nei giorni scorsi).
 * - Questi esercizi nuovi arrivano con solo il video (niente foto iniziale/
 *   finale, perché nelle cartelle non ci sono foto separate) e senza
 *   traduzione italiana ancora pronta: la traduzione viene generata al volo,
 *   automaticamente, la prima volta che qualcuno apre la pagina in italiano
 *   (stesso meccanismo già usato per gli altri 1271 esercizi).
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

if (!SERVICE_ROLE_KEY) {
  console.error('Errore: non trovo SUPABASE_SERVICE_ROLE_KEY ne\' nel file .env.local ne\' tra le variabili esportate.');
  console.error('Esportala prima di lanciare lo script, es.: export SUPABASE_SERVICE_ROLE_KEY="..."');
  process.exit(1);
}

const folderArg = process.argv[2];
const APPLY = process.argv.includes('--apply');

if (!folderArg) {
  console.error('Uso: node scripts/import-missing-exercises.js <NomeCartella> [--apply]');
  console.error('Esempio: node scripts/import-missing-exercises.js Legs');
  process.exit(1);
}

// Preferiamo sempre la copia appena scaricata/estratta da Dropbox dentro
// "HD 720p LOWEST FILE SIZE/<categoria>", perche' le vecchie cartelle dirette
// in Downloads/<categoria> possono avere file "archiviati" da macOS su
// iCloud (placeholder non scaricati: stessa causa del vecchio bug dei video
// vuoti), e leggerli puo' fallire o restituire un file vuoto.
const FRESH_ROOT = path.join(os.homedir(), 'Downloads', 'HD 720p LOWEST FILE SIZE', folderArg);
const LEGACY_ROOT = path.join(os.homedir(), 'Downloads', folderArg);
const SEARCH_ROOT = fs.existsSync(FRESH_ROOT) ? FRESH_ROOT : LEGACY_ROOT;
if (!fs.existsSync(SEARCH_ROOT)) {
  console.error(`Non trovo la cartella: ${FRESH_ROOT} (ne' ${LEGACY_ROOT})`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Deduzione zona del corpo (body_region) dal nome esercizio. Stesse regole
// (ordine incluso: dalla più specifica alla più generica) già usate per
// classificare i 1271 esercizi esistenti, estese per coprire anche i nomi che
// compaiono in queste cartelle nuove.
// ---------------------------------------------------------------------------
const FOLDER_DEFAULT_REGION = {
  Back: 'thoracic-spine',
  Legs: 'quadriceps',
  Shoulders: 'shoulder',
  Chest: 'chest',
  Biceps: 'biceps',
  Forearms: 'forearm',
  Powerlifting: 'whole-body',
  'Stretching - Mobility': 'whole-body',
  'Calisthenics-Cardio-Plyo-Functional': 'whole-body',
};

const REGION_RULES = [
  // Regole specifiche/eccezioni PRIMA delle regole generiche che altrimenti le
  // intercetterebbero per sbaglio (es. "Upright Row" non e' un esercizio di
  // schiena solo perche' contiene "row"; "Wrist Curl" non e' un bicipite solo
  // perche' contiene "curl"; "Leg Curl" e' femorale, non quadricipite).
  [/upright row/i, 'shoulder'],
  [/wrist curl|wrist extension|wrist flexor|wrist pronation|wrist rotation/i, 'forearm'],
  [/leg curl/i, 'hamstrings'],
  [/leg kickback|glute kickback|donkey kick/i, 'glutes'],
  [/hamstring/i, 'hamstrings'],
  [/glute/i, 'glutes'],
  [/\bcalv|\bcalf/i, 'calf'],
  [/quad|squat|leg press|lunge|step.?up|leg extension/i, 'quadriceps'],
  [/\bhip\b|adductor|abductor/i, 'hip'],
  [/ankle/i, 'ankle-foot'],
  [/\bneck\b|cervical/i, 'cervical-spine'],
  [/trapez|\bshrug/i, 'trapezius'],
  [/good morning/i, 'hamstrings'],
  [/lat pull|\brow\b|rowing|pulldown|pull.?up|chin.?up|superman|back extension|hyperextension|lat prayer/i, 'thoracic-spine'],
  [/deadlift|lower back|lumbar/i, 'lumbar-spine'],
  [/shoulder|delt|overhead press|military press|lateral raise|front raise|face pull|arnold/i, 'shoulder'],
  [/chest|bench press|\bfly\b|push.?up|\bpec\b/i, 'chest'],
  [/bicep|curl/i, 'biceps'],
  [/tricep|skull crusher|kickback|pushdown|dip\b/i, 'triceps'],
  [/forearm|wrist/i, 'forearm'],
  [/abdomen|\babs?\b|crunch|sit.?up|plank|\bcore\b|oblique|russian twist/i, 'core-abdomen'],
  [/stretch|mobility|foam roller|yoga|pose/i, 'whole-body'],
];

function guessRegion(name, folder) {
  for (const [re, region] of REGION_RULES) {
    if (re.test(name)) return region;
  }
  return FOLDER_DEFAULT_REGION[folder] || 'whole-body';
}

// ---------------------------------------------------------------------------
// Deduzione attrezzo/categoria dal nome - stessa logica (l'etichetta descrive
// l'attrezzo usato, non il tipo di allenamento) già in uso nel resto della
// libreria.
// ---------------------------------------------------------------------------
const EQUIPMENT_RULES = [
  [/dumbbell/i, ['Dumbbells'], 'Free Weights'],
  [/\bbarbell\b|ez.?bar/i, ['Barbell'], 'Free Weights'],
  [/kettlebell/i, ['Kettlebells'], 'Free Weights'],
  [/suspension trainer/i, ['Suspension Trainer'], 'Free Weights'],
  [/ski ergometer/i, ['Ski Ergometer'], 'Free Weights'],
  [/sled/i, ['Sled'], 'Free Weights'],
  [/battle rope/i, ['Battle Rope'], 'Free Weights'],
  [/\bplate\b/i, ['Plate'], 'Free Weights'],
  [/landmine/i, ['Barbell', 'Landmine Attachment'], 'Free Weights'],
  [/resistance band|\bband\b/i, ['Resistance Band'], 'Resistance'],
  [/lat pull down machine|pulldown machine/i, ['Lat Pull Down Machine (Cable)'], 'Resistance'],
  [/assisted.*(pull.?up|chin.?up)/i, ['Assisted Pull Up Machine'], 'Resistance'],
  [/\bcable\b/i, ['Cable Pulley Machine'], 'Resistance'],
  [/hammer strength|\bmachine\b/i, ['Machine'], 'Resistance'],
  [/rowing machine|gym rowing/i, ['Rowing Machine'], 'Cardio'],
  [/elliptical/i, ['Elliptical Machine'], 'Cardio'],
  [/treadmill/i, ['Treadmill'], 'Cardio'],
  [/spinbike|stationary (exercise )?bike|indoor cycling/i, ['Exercise Bike'], 'Cardio'],
  [/stepmill/i, ['Stepmill Machine'], 'Cardio'],
  [/yoga mat/i, ['Yoga Mat'], 'Bodyweight'],
  [/exercise ball|stability ball/i, ['Exercise Ball'], 'Bodyweight'],
  [/pull.?up bar/i, ['Pull Up Bar'], 'Bodyweight'],
  [/ab wheel/i, ['Ab wheel'], 'Bodyweight'],
  [/hyperextension bench/i, ['Hyperextension Bench'], 'Bodyweight'],
  [/\bchair\b/i, ['Chair'], 'Bodyweight'],
];

function guessEquipmentCategory(name) {
  for (const [re, equip, cat] of EQUIPMENT_RULES) {
    if (re.test(name)) return { equipment: equip, category: cat };
  }
  return { equipment: [], category: 'Bodyweight' };
}

// Zona -> muscolo "primary_muscle" leggibile (coerente con lo stile già usato
// nei dati esistenti, dove primary_muscle è testo libero in inglese).
const REGION_TO_PRIMARY_MUSCLE = {
  'cervical-spine': 'Neck',
  shoulder: 'Shoulders',
  'thoracic-spine': 'Upper Back',
  elbow: 'Elbow',
  'wrist-hand': 'Wrist/Hand',
  forearm: 'Forearms',
  'lumbar-spine': 'Lower Back',
  hip: 'Hips',
  knee: 'Knee',
  'ankle-foot': 'Ankle/Foot',
  'whole-body': 'Full Body',
  trapezius: 'Trapezius',
  chest: 'Chest',
  'core-abdomen': 'Abdominals',
  glutes: 'Glutes',
  quadriceps: 'Quadriceps',
  hamstrings: 'Hamstrings',
  calf: 'Calves',
  biceps: 'Biceps',
  triceps: 'Triceps',
};

// ---------------------------------------------------------------------------
// Utilita' file / nomi (stesse regole usate in repair-corrupted-exercise-videos.js)
// ---------------------------------------------------------------------------
function stripExt(name) {
  return name.replace(/\.(mp4|mov|m4v)$/i, '');
}

function genderOf(filename) {
  if (/female/i.test(filename)) return 'female';
  return 'male';
}

// Nome "pulito" per il titolo (senza Female/Male/doppi spazi), usato come
// nome inglese dell'esercizio.
function cleanDisplayName(filename) {
  return stripExt(filename)
    .replace(/[_\s]?female\b/gi, '')
    .replace(/[_\s]?male\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// external_id / slug: minuscolo, solo lettere-numeri, separatore sottolineato
// per external_id (come i dati esistenti: "bodyweight_standing_triangle_fly"),
// separatore trattino per lo storage_key (come "bodyweight-standing-triangle-fly").
function toExternalId(displayName) {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
function toSlug(displayName) {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

// ---------------------------------------------------------------------------
// 1) Leggo la cartella e raggruppo i file per esercizio (maschio/femmina)
// ---------------------------------------------------------------------------
const filesInFolder = fs.readdirSync(SEARCH_ROOT, { withFileTypes: true })
  .filter((e) => e.isFile() && /\.mp4$/i.test(e.name))
  .map((e) => e.name);

const byDisplayName = new Map(); // displayName -> { male: path|null, female: path|null }
for (const filename of filesInFolder) {
  const display = cleanDisplayName(filename);
  if (!byDisplayName.has(display)) byDisplayName.set(display, { male: null, female: null });
  const entry = byDisplayName.get(display);
  const g = genderOf(filename);
  entry[g] = path.join(SEARCH_ROOT, filename);
}

console.log(`Cartella: ${SEARCH_ROOT}`);
console.log(`File .mp4 trovati: ${filesInFolder.length}  ->  ${byDisplayName.size} esercizi unici (maschio/femmina contati come uno).\n`);

// ---------------------------------------------------------------------------
// 2) Confronto con cosa c'e' gia' nel database (per external_id)
// ---------------------------------------------------------------------------
async function run() {
  const candidates = Array.from(byDisplayName.keys()).map((display) => ({
    display,
    externalId: toExternalId(display),
    slug: toSlug(display),
  }));

  const { data: existing, error: existingErr } = await supabase
    .from('exercises')
    .select('external_id')
    .eq('source', SOURCE)
    .in('external_id', candidates.map((c) => c.externalId));

  if (existingErr) {
    console.error('Errore controllando cosa esiste gia\' nel database:', existingErr.message);
    process.exit(1);
  }

  const existingIds = new Set((existing || []).map((r) => r.external_id));
  const missing = candidates.filter((c) => !existingIds.has(c.externalId));

  console.log(`Gia' presenti nel database: ${candidates.length - missing.length}`);
  console.log(`Da importare: ${missing.length}\n`);

  const plan = missing.map((c) => {
    const files = byDisplayName.get(c.display);
    const region = guessRegion(c.display, folderArg);
    const { equipment, category } = guessEquipmentCategory(c.display);
    return {
      display: c.display,
      externalId: c.externalId,
      slug: c.slug,
      hasMaleVideo: !!files.male,
      hasFemaleVideo: !!files.female,
      body_region: region,
      primary_muscle: REGION_TO_PRIMARY_MUSCLE[region] || null,
      equipment,
      category,
    };
  });

  const previewPath = path.join(__dirname, '..', `import-preview-${folderArg.replace(/[^a-zA-Z0-9_-]+/g, '_')}.json`);
  fs.writeFileSync(previewPath, JSON.stringify(plan, null, 2), 'utf8');
  console.log(`Anteprima completa salvata in: ${previewPath}`);

  const noVideo = plan.filter((p) => !p.hasMaleVideo && !p.hasFemaleVideo);
  if (noVideo.length) {
    console.log(`\nATTENZIONE: ${noVideo.length} esercizi non hanno nessun video valido, verranno saltati.`);
  }

  if (!APPLY) {
    console.log('\n(Anteprima soltanto - non e\' stato scritto nulla nel database. Rilancia con --apply per importare davvero.)');
    return;
  }

  console.log('\n--apply attivo: inizio a caricare video e creare gli esercizi nel database...\n');

  let created = 0;
  let skippedNoVideo = 0;
  let errors = 0;
  let i = 0;

  for (const item of plan) {
    i++;
    if (!item.hasMaleVideo && !item.hasFemaleVideo) {
      skippedNoVideo++;
      continue;
    }

    const exerciseId = crypto.randomUUID();
    const files = byDisplayName.get(item.display);

    try {
      // Video maschile (chiave senza suffisso) e/o femminile (chiave con "-female").
      const assetsToInsert = [];

      if (files.male) {
        const buf = await readFileWaitingForICloud(files.male);
        if (buf.length > 0 && !isAllZero(buf)) {
          const key = `${item.slug}/video_720p.mp4`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, buf, { contentType: 'video/mp4', upsert: true });
          if (upErr) throw new Error(`upload video maschile: ${upErr.message}`);
          assetsToInsert.push({ exercise_id: exerciseId, asset_type: 'video', variant: null, is_default: true, storage_bucket: BUCKET, storage_key: key, bytes: buf.length });
        }
      }
      if (files.female) {
        const buf = await readFileWaitingForICloud(files.female);
        if (buf.length > 0 && !isAllZero(buf)) {
          const key = `${item.slug}-female/video_720p.mp4`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, buf, { contentType: 'video/mp4', upsert: true });
          if (upErr) throw new Error(`upload video femminile: ${upErr.message}`);
          // Se non c'e' un video maschile, quello femminile diventa il video di
          // default mostrato nella card/pagina.
          assetsToInsert.push({ exercise_id: exerciseId, asset_type: 'video', variant: 'female', is_default: !files.male, storage_bucket: BUCKET, storage_key: key, bytes: buf.length });
        }
      }

      if (assetsToInsert.length === 0) {
        console.log(`[${i}/${plan.length}] SALTATO (video vuoto/non leggibile): ${item.display}`);
        skippedNoVideo++;
        continue;
      }

      const { error: exErr } = await supabase.from('exercises').insert({
        id: exerciseId,
        source: SOURCE,
        external_id: item.externalId,
        primary_muscle: item.primary_muscle,
        secondary_muscles: [],
        equipment: item.equipment,
        body_region: item.body_region,
        category: item.category,
        subcategory: null,
        difficulty: null,
        tags: [],
        metadata_complete: false,
      });
      if (exErr) throw new Error(`creazione esercizio: ${exErr.message}`);

      const { error: trErr } = await supabase.from('exercise_translations').insert({
        exercise_id: exerciseId,
        lang: 'en',
        name: item.display,
        instructions: null,
        tips: null,
        is_source: true,
      });
      if (trErr) throw new Error(`creazione traduzione: ${trErr.message}`);

      // asset_type/storage_bucket/storage_key/exercise_id/is_default sono gli
      // unici campi che l'app legge davvero; passo solo quelli che esistono
      // di sicuro nella tabella.
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

      created++;
      console.log(`[${i}/${plan.length}] OK: ${item.display}  (${item.category} / ${item.body_region})`);
    } catch (e) {
      errors++;
      console.log(`[${i}/${plan.length}] ERRORE su "${item.display}": ${e.message}`);
    }
  }

  console.log('\n--- Riepilogo importazione ---');
  console.log(`Esercizi creati con successo: ${created}`);
  console.log(`Saltati per video mancante/vuoto: ${skippedNoVideo}`);
  console.log(`Errori: ${errors}`);
}

run();
