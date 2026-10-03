#!/usr/bin/env node
/**
 * repair-corrupted-exercise-videos.js
 *
 * Ripara i video degli esercizi risultati corrotti (caricati come file vuoti)
 * su Supabase Storage, ricaricando il file originale corretto dal Mac.
 *
 * COME USARLO:
 *   1. Apri il Terminale dentro la cartella del progetto "phygo".
 *   2. Lancia lo script:
 *        node scripts/repair-corrupted-exercise-videos.js
 *      (legge da solo la chiave segreta di Supabase dal file .env.local del
 *      progetto, lo stesso che usa già il sito - non serve fare nient'altro.
 *      Se per qualche motivo non la trova, esportala a mano prima di lanciare
 *      lo script: export SUPABASE_SERVICE_ROLE_KEY="...")
 *
 * Lo script cerca da solo i file .mp4 originali dentro la cartella Downloads
 * (incluse tutte le sue sottocartelle, es. Yoga, Legs, Shoulders, ecc. - quelle
 * scaricate per gli Exercise Animatic). Se li hai spostati altrove, imposta
 * SEARCH_ROOT nella riga di comando, es.:
 *        SEARCH_ROOT="/percorso/cartella" node scripts/repair-corrupted-exercise-videos.js
 *
 * Alla fine stampa un riepilogo: quanti video ha sistemato, e se qualcuno non
 * e' stato trovato sul Mac (in quel caso va controllato a mano).
 *
 * NOTA: molti di questi file originali sono su iCloud Drive e non ancora
 * scaricati fisicamente sul Mac (solo "segnaposto"). Per ognuno lo script
 * chiede da solo a iCloud di scaricarlo prima di leggerlo - per questo può
 * volerci qualche secondo in più per file rispetto alla prima volta. Serve
 * una connessione internet attiva e l'accesso a iCloud Drive funzionante.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

// Su iCloud Drive con "Ottimizza spazio di archiviazione" attivo, molti dei file
// .mp4 originali sono solo segnaposto (la dimensione e' quella giusta, ma il
// contenuto non e' ancora scaricato sul disco: leggerlo restituisce tutti zeri).
// Prima di leggere ogni file si chiede esplicitamente a iCloud di scaricarlo
// (brctl download), e si aspetta che il contenuto reale sia disponibile.
function ensureDownloadedFromICloud(filePath) {
  try {
    execSync(`brctl download ${JSON.stringify(filePath)}`, { stdio: 'ignore' });
  } catch (e) {
    // brctl non disponibile o file non iCloud: non è un problema, si prosegue comunque.
  }
}

function isAllZero(buf) {
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] !== 0) return false;
  }
  return true;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Legge il file aspettando, se serve, che iCloud lo scarichi davvero (non solo il segnaposto).
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

const SUPABASE_URL = 'https://dckmumxswheamyymerea.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEARCH_ROOT = process.env.SEARCH_ROOT || path.join(os.homedir(), 'Downloads');
const BUCKET = 'exercise-media';

if (!SERVICE_ROLE_KEY) {
  console.error('Errore: non trovo SUPABASE_SERVICE_ROLE_KEY ne\' nel file .env.local ne\' tra le variabili esportate.');
  console.error('Esportala prima di lanciare lo script, es.: export SUPABASE_SERVICE_ROLE_KEY="..."');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// I 150 esercizi con video corrotto, con il loro percorso nel bucket Supabase ("storage_key").
const BROKEN = [
  {
    "id": "4c06c55e-a123-4a9a-bf21-74830b36fc76",
    "name": "Alternating Leg Downward Dog",
    "key": "alternating-leg-downward-dog/video_720p.mp4"
  },
  {
    "id": "a67f121b-0a0f-4c05-a98f-a5f047619c9f",
    "name": "Alternating Lunge With Rotation",
    "key": "alternating-lunge-with-rotation/video_720p.mp4"
  },
  {
    "id": "c13ee993-d120-4696-9ff3-ffb8eb74b05a",
    "name": "Archer Step Back",
    "key": "archer-step-back/video_720p.mp4"
  },
  {
    "id": "f578509c-9c1c-497d-82be-5a49a413d7db",
    "name": "Archer Stepback",
    "key": "archer-stepback-female/video_720p.mp4"
  },
  {
    "id": "92a6bfc7-2688-496f-86a2-58e741807911",
    "name": "3 Leg Dog Pose",
    "key": "3-leg-dog-pose-female/video_720p.mp4"
  },
  {
    "id": "874b5dfd-54e4-40a2-908f-6d1e7c34b41f",
    "name": "45 Degree Bicycle Twist Knee to Elbow",
    "key": "45-degree-bicycle-twist-knee-to-elbow/video_720p.mp4"
  },
  {
    "id": "7fba8519-3c57-4ba6-a4d5-a9090c40615f",
    "name": "45 Degree Bicycle Twisting",
    "key": "45-degree-bicycle-twisting-female/video_720p.mp4"
  },
  {
    "id": "e7cdb9ee-e35d-4f76-8bf1-22a83bb67993",
    "name": "45 Degree Bicycle Twisting Crunch",
    "key": "45-degree-bicycle-twisting-crunch-female/video_720p.mp4"
  },
  {
    "id": "089c5f62-adc2-4315-bd8f-2bde99e627d7",
    "name": "90 Degree Heels Touch",
    "key": "90-degree-heels-touch-female/video_720p.mp4"
  },
  {
    "id": "1e2272d9-d129-409e-89fa-7479b6bbad45",
    "name": "Ab Wheel Plank",
    "key": "ab-wheel-plank/video_720p.mp4"
  },
  {
    "id": "088671f8-d2d5-4377-bee5-ab87b46c2a46",
    "name": "Abdominal Crunches Machine",
    "key": "abdominal-crunches-machine/video_720p.mp4"
  },
  {
    "id": "7a92bbbf-5e27-484c-9101-5de16318ff39",
    "name": "Abdominal Crunches With Hold",
    "key": "abdominal-crunches-with-hold/video_720p.mp4"
  },
  {
    "id": "bf541feb-3219-44bf-9d50-499f00f7beaa",
    "name": "Air Bike (Version 2)",
    "key": "air-bike-version-2-female/video_720p.mp4"
  },
  {
    "id": "1b5eb44f-a9d7-4402-9596-44f69886828f",
    "name": "Alternate Arm Leg Plank Hold",
    "key": "alternate-arm-leg-plank-hold/video_720p.mp4"
  },
  {
    "id": "de3a849f-c370-4680-9501-f8cb5e512f80",
    "name": "Alternate Arm Leg Plank Rest Pause",
    "key": "alternate-arm-leg-plank-rest-pause/video_720p.mp4"
  },
  {
    "id": "97827947-ca89-4832-af7f-60db37f0e2f9",
    "name": "Alternate Leg Raise From Reverse Plank Position",
    "key": "alternate-leg-raise-from-reverse-plank-position/video_720p.mp4"
  },
  {
    "id": "f085b8a0-6c0c-4525-ab3b-dc302721f9d0",
    "name": "Alternate Leg Raise With Head Up",
    "key": "alternate-leg-raise-with-head-up/video_720p.mp4"
  },
  {
    "id": "7b2279d4-32f3-4328-a49e-c8b13ace3d6a",
    "name": "Alternate Lying Floor Leg Raise",
    "key": "alternate-lying-floor-leg-raise/video_720p.mp4"
  },
  {
    "id": "22b720b4-78ad-48d4-8496-b3c2f95e2799",
    "name": "Alternate Single Leg Raises Plank",
    "key": "alternate-single-leg-raises-plank/video_720p.mp4"
  },
  {
    "id": "60e2c48d-3664-48c6-b22c-1f3e89248d38",
    "name": "Alternate Sprinter Lunge",
    "key": "alternate-sprinter-lunge/video_720p.mp4"
  },
  {
    "id": "af0b2f0c-6864-4c6f-a255-89205e448d4f",
    "name": "Alternate Toe Tap Leg Lift",
    "key": "alternate-toe-tap-leg-lift/video_720p.mp4"
  },
  {
    "id": "eb4805a6-692c-4b50-a4c7-62b224c2927b",
    "name": "Band Bent Over One Arm Kickback",
    "key": "band-bent-over-one-arm-kickback-female/video_720p.mp4"
  },
  {
    "id": "60744979-1807-4b49-b56d-fc9a380fd968",
    "name": "Band Decline Sit Up",
    "key": "band-decline-sit-up-female/video_720p.mp4"
  },
  {
    "id": "5a713160-6c29-40f6-803c-64461f979e51",
    "name": "Band Incline Triceps Extension",
    "key": "band-incline-triceps-extension-female/video_720p.mp4"
  },
  {
    "id": "59c7d898-0eba-4f83-91cf-0235ab62619a",
    "name": "Band Kneeling Crunch",
    "key": "band-kneeling-crunch-female/video_720p.mp4"
  },
  {
    "id": "14ed606c-f931-4314-a639-6528a5c7e3a3",
    "name": "Barbell Landmine Side Bend",
    "key": "barbell-landmine-side-bend/video_720p.mp4"
  },
  {
    "id": "2297c66a-7a38-494d-952d-4ac84f9d64b3",
    "name": "Barbell Lying Triceps Skull Crusher",
    "key": "barbell-lying-triceps-skull-crusher-female/video_720p.mp4"
  },
  {
    "id": "c3c87821-880c-498d-b80d-f332519ce897",
    "name": "Barbell Lying Triceps Skull Crushers",
    "key": "barbell-lying-triceps-skull-crushers/video_720p.mp4"
  },
  {
    "id": "cc0f5d40-09d0-458c-87f3-f50d8f16e434",
    "name": "Barbell Seated Overhead Triceps Press",
    "key": "barbell-seated-overhead-triceps-press/video_720p.mp4"
  },
  {
    "id": "255b6882-b1ab-494b-a1d2-b6ec1718cb0b",
    "name": "Barbell Seated Twist on Exercise Ball",
    "key": "barbell-seated-twist-on-exercise-ball/video_720p.mp4"
  },
  {
    "id": "3aa69cfd-8470-4d13-9a56-4cf4d6f29bbe",
    "name": "Barbell Standing Overhead Triceps Extension",
    "key": "barbell-standing-overhead-triceps-extension/video_720p.mp4"
  },
  {
    "id": "d83ec90a-d6ef-4c41-ad7f-fc57a6345449",
    "name": "Basic Toe Touch",
    "key": "basic-toe-touch/video_720p.mp4"
  },
  {
    "id": "02be9183-ca0e-4204-bf33-7bbf771d63d3",
    "name": "Bench Reverse Plank Hold",
    "key": "bench-reverse-plank-hold/video_720p.mp4"
  },
  {
    "id": "f08e03e1-8c0d-4e1b-865b-a499d6d02006",
    "name": "Bent Knee Lying Twist (On Stability Ball)",
    "key": "bent-knee-lying-twist-on-stability-ball/video_720p.mp4"
  },
  {
    "id": "726072cc-6a3f-47bd-9db2-9df4e80acf4f",
    "name": "Bicycle Air Legs",
    "key": "bicycle-air-legs/video_720p.mp4"
  },
  {
    "id": "337dbdb3-17c2-460e-b41c-92ded8d0fc28",
    "name": "Bird Dog",
    "key": "bird-dog/video_720p.mp4"
  },
  {
    "id": "33a97a13-f4e1-4b6d-a364-1f299478ad53",
    "name": "Bird Dog (Version 2)",
    "key": "bird-dog-version-2/video_720p.mp4"
  },
  {
    "id": "0d2d375e-7f8c-459d-a47d-9dba01a5ab42",
    "name": "Body Saw Plank",
    "key": "body-saw-plank/video_720p.mp4"
  },
  {
    "id": "c37cecc2-83eb-4335-93f5-c26a799bcc59",
    "name": "Bodyweight Kneeling Push-Up Row",
    "key": "bodyweight-kneeling-push-up-row/video_720p.mp4"
  },
  {
    "id": "aa0cc41c-55dd-4cef-9885-c8cf1d7e6edb",
    "name": "Bodyweight Kneeling Triceps Extension",
    "key": "bodyweight-kneeling-triceps-extension/video_720p.mp4"
  },
  {
    "id": "75e96f69-4f71-474b-a661-bc8f09cbfe27",
    "name": "Bodyweight Overhead Triceps Extension",
    "key": "bodyweight-overhead-triceps-extension/video_720p.mp4"
  },
  {
    "id": "9ab8fcd3-a427-4c21-9e05-2e637ab0ecbe",
    "name": "Bow Pose",
    "key": "bow-pose/video_720p.mp4"
  },
  {
    "id": "3fdcbea4-f8e0-458c-af82-97559f2e9f37",
    "name": "Bridge - Mountain Climber (Cross Body)",
    "key": "bridge-mountain-climber-cross-body/video_720p.mp4"
  },
  {
    "id": "ad12a4d3-38c6-4021-9561-f16467076abe",
    "name": "Bridge Hip Abduction",
    "key": "bridge-hip-abduction/video_720p.mp4"
  },
  {
    "id": "ae9be263-ff07-4482-b835-532b80d34443",
    "name": "Bridge Pose Setu Bandhasana",
    "key": "bridge-pose-setu-bandhasana/video_720p.mp4"
  },
  {
    "id": "8122d46c-4d36-44d7-8cf5-77074d4d2164",
    "name": "Bridge With Alternating Leg Raise",
    "key": "bridge-with-alternating-leg-raise/video_720p.mp4"
  },
  {
    "id": "b0bbb34e-69aa-4125-acf8-33d69aaecec1",
    "name": "Butterfly Yoga Pose",
    "key": "butterfly-yoga-pose/video_720p.mp4"
  },
  {
    "id": "6863942e-3118-49be-8b42-994faea50ee8",
    "name": "Cable Lying Triceps Extension (Low)",
    "key": "cable-lying-triceps-extension-low/video_720p.mp4"
  },
  {
    "id": "6f07024a-d72f-4a2a-b36b-1f4a0ebae937",
    "name": "Cable Reverse Grip Triceps Push Down Straight Bar on Crossover",
    "key": "cable-reverse-grip-triceps-push-down-straight-bar-on-crossover/video_720p.mp4"
  },
  {
    "id": "a8bbfcee-254d-4960-a5e3-14cc06458abf",
    "name": "Cable Reverse Grip Triceps Pushdown (Ez-Bar)",
    "key": "cable-reverse-grip-triceps-pushdown-ez-bar/video_720p.mp4"
  },
  {
    "id": "b5ab5aec-ce72-4665-ba46-6cf61837d727",
    "name": "Cable Reverse Grip Triceps Pushdown Back Side Pov",
    "key": "cable-reverse-grip-triceps-pushdown-back-side-pov/video_720p.mp4"
  },
  {
    "id": "2d03a2b6-6cb4-42d1-b9f7-c9098da8ffd5",
    "name": "Cable Triceps Overhead Extension (Ez Bar)",
    "key": "cable-triceps-overhead-extension-ez-bar/video_720p.mp4"
  },
  {
    "id": "2e42469b-1a62-41b4-ad03-f1bdf4d7a1ee",
    "name": "Cable Triceps Push Down Elbow Out (V Bar)",
    "key": "cable-triceps-push-down-elbow-out-v-bar/video_720p.mp4"
  },
  {
    "id": "776e8787-17b3-4b62-b014-addca4dec8ac",
    "name": "Cable Triceps Push Down Ez Bar Close Grip",
    "key": "cable-triceps-push-down-ez-bar-close-grip/video_720p.mp4"
  },
  {
    "id": "bfa50ac4-629e-40b8-b765-65f7d80e64f5",
    "name": "Cable Triceps Push Down Ez Bar Wide Grip",
    "key": "cable-triceps-push-down-ez-bar-wide-grip/video_720p.mp4"
  },
  {
    "id": "690f7964-3c23-485f-887c-d85bc435e1c8",
    "name": "Cable Triceps Push Down Straight Bar",
    "key": "cable-triceps-push-down-straight-bar/video_720p.mp4"
  },
  {
    "id": "70d88f0a-87c6-41e4-8209-b89e3cec64ab",
    "name": "Captains Chair Straight Leg Raise",
    "key": "captains-chair-straight-leg-raise/video_720p.mp4"
  },
  {
    "id": "0fae963f-f2c4-475a-a599-45012ca0fc92",
    "name": "Cat Pose",
    "key": "cat-pose/video_720p.mp4"
  },
  {
    "id": "097a94fa-ba4e-4278-a119-902f24705e43",
    "name": "Cat Stretch",
    "key": "cat-stretch/video_720p.mp4"
  },
  {
    "id": "c89dea2f-ddd1-4ea0-af06-18db8d2a5492",
    "name": "Chair Pose",
    "key": "chair-pose/video_720p.mp4"
  },
  {
    "id": "d79592a4-0ed1-445d-a348-b141b294d443",
    "name": "Child Pose",
    "key": "child-pose/video_720p.mp4"
  },
  {
    "id": "54b7b7d4-7b8b-42d1-970f-32106ee78624",
    "name": "Child Pose Arms Extended Left Right",
    "key": "child-pose-arms-extended-left-right/video_720p.mp4"
  },
  {
    "id": "4e393cfd-964e-4d1f-85e5-5e32b13088f2",
    "name": "Child Pose Arms on Side",
    "key": "child-pose-arms-on-side/video_720p.mp4"
  },
  {
    "id": "f93b2b28-70d5-43d0-a09a-c921f4a56339",
    "name": "Child Pose Elbows on Block",
    "key": "child-pose-elbows-on-block/video_720p.mp4"
  },
  {
    "id": "3c7cdb6f-c9d7-486d-add6-1dc1979d758e",
    "name": "Child Pose Up",
    "key": "child-pose-up/video_720p.mp4"
  },
  {
    "id": "52cc2bf3-1ebb-400e-b6a3-03675b4594bf",
    "name": "Cobra Full Push Up",
    "key": "cobra-full-push-up/video_720p.mp4"
  },
  {
    "id": "3a47db7e-4211-44dc-ab0f-ceec5e5d7ff6",
    "name": "Cobra Push Up",
    "key": "cobra-push-up/video_720p.mp4"
  },
  {
    "id": "c47cb54a-b2c5-46dd-b771-44fd1411b33d",
    "name": "Cobra Side Ab Stretch",
    "key": "cobra-side-ab-stretch/video_720p.mp4"
  },
  {
    "id": "3621ddd6-1da2-45a8-8433-b549cc1d83b6",
    "name": "Cobra Yoga Pose Hold",
    "key": "cobra-yoga-pose-hold/video_720p.mp4"
  },
  {
    "id": "2c394745-56c2-449d-b7ee-f800f43d72c5",
    "name": "Crab Pose",
    "key": "crab-pose/video_720p.mp4"
  },
  {
    "id": "d603cef6-eedd-46ab-927a-fc0e6a3d58cb",
    "name": "Crescent Moon Pose",
    "key": "crescent-moon-pose/video_720p.mp4"
  },
  {
    "id": "61847df1-f8d0-498c-a153-b8e0506e785d",
    "name": "Criss Cross Bow Tie Pose",
    "key": "criss-cross-bow-tie-pose/video_720p.mp4"
  },
  {
    "id": "d3a8f92b-6c8b-4fca-83d5-4dab83ab222a",
    "name": "Crow Pose",
    "key": "crow-pose/video_720p.mp4"
  },
  {
    "id": "aa0a92ea-06e3-4259-9990-989b26f1d584",
    "name": "Crunch (Legs on Stability Ball)",
    "key": "crunch-legs-on-stability-ball/video_720p.mp4"
  },
  {
    "id": "730bf078-4438-4ced-8c5a-bf71ea9712aa",
    "name": "Crunch (On Stability Ball)",
    "key": "crunch-on-stability-ball/video_720p.mp4"
  },
  {
    "id": "6f01f417-24dd-4a53-a44d-7fb81289b5b0",
    "name": "Decline Bent Leg Reverse Crunch",
    "key": "decline-bent-leg-reverse-crunch/video_720p.mp4"
  },
  {
    "id": "622075a4-3ed0-4b53-8f71-fe5aaa90ba9b",
    "name": "Decline Levitating Sit Ups Bodyweight",
    "key": "decline-levitating-sit-ups-bodyweight/video_720p.mp4"
  },
  {
    "id": "3457b506-8b47-40be-9fbe-8c23a15b1f97",
    "name": "Decline Sit Ups Dumbbells",
    "key": "decline-sit-ups-dumbbells/video_720p.mp4"
  },
  {
    "id": "da26a0da-1fc4-4c59-bb64-84ba065e45e7",
    "name": "Double Pigeon Pose",
    "key": "double-pigeon-pose/video_720p.mp4"
  },
  {
    "id": "c1aeae9d-253a-4644-bb91-b863e3e0b3b7",
    "name": "Downward Dog Toe to Heel",
    "key": "downward-dog-toe-to-heel/video_720p.mp4"
  },
  {
    "id": "d381f326-6d12-4faf-8f69-7c7a0f74101f",
    "name": "Downward Dog With Fingers Facing Feet",
    "key": "downward-dog-with-fingers-facing-feet/video_720p.mp4"
  },
  {
    "id": "34253f8a-8b80-4b1e-b084-8312d09483e7",
    "name": "Dumbbell Crunch Hold With Legs Off",
    "key": "dumbbell-crunch-hold-with-legs-off/video_720p.mp4"
  },
  {
    "id": "a8891d40-be31-49cc-b2d4-dfb9d57d3cbe",
    "name": "Dumbbell Decline Overhead Sit-Up",
    "key": "dumbbell-decline-overhead-sit-up/video_720p.mp4"
  },
  {
    "id": "152d1ea4-141b-43e3-87b8-010b57860c27",
    "name": "Dumbbell Decline Triceps Pull-Over Extension",
    "key": "dumbbell-decline-triceps-pull-over-extension/video_720p.mp4"
  },
  {
    "id": "f5adbeea-a228-4042-bf85-5fdd6562332d",
    "name": "Dumbbell Half Kneeling Wood Chopper",
    "key": "dumbbell-half-kneeling-wood-chopper/video_720p.mp4"
  },
  {
    "id": "dfb28acf-254d-48c2-b5f9-2e7227bf6520",
    "name": "Dumbbell Kneeling Wood Chopper",
    "key": "dumbbell-kneeling-wood-chopper/video_720p.mp4"
  },
  {
    "id": "c85ace53-3884-4e10-9ced-a992497ae299",
    "name": "Dumbbell Lying One Arm Neutral Triceps Extension",
    "key": "dumbbell-lying-one-arm-neutral-triceps-extension/video_720p.mp4"
  },
  {
    "id": "e6aaa93c-2fae-4cde-9bae-3e4030757cca",
    "name": "Dumbbell Lying Triceps Extension on Floor",
    "key": "dumbbell-lying-triceps-extension-on-floor/video_720p.mp4"
  },
  {
    "id": "dabd194f-3874-4335-9a78-4a972fbb9381",
    "name": "Dumbbell One Arm Triceps Extension (On Bench)",
    "key": "dumbbell-one-arm-triceps-extension-on-bench/video_720p.mp4"
  },
  {
    "id": "4d242c8e-84c9-4369-9f76-bf2c56a3ce67",
    "name": "Dumbbell Overhead Extension Standing",
    "key": "dumbbell-overhead-extension-standing/video_720p.mp4"
  },
  {
    "id": "2beeebd7-212c-4a18-819a-9a41a737f927",
    "name": "Dumbbell Overhead Side Bend",
    "key": "dumbbell-overhead-side-bend/video_720p.mp4"
  },
  {
    "id": "3f7ee01e-99ee-4f2b-b2d8-680d401a3730",
    "name": "Dumbbell Pronate-Grip Triceps Extension",
    "key": "dumbbell-pronate-grip-triceps-extension/video_720p.mp4"
  },
  {
    "id": "57198af5-cec7-4f1f-860c-a61dd84fb793",
    "name": "Dumbbell Russian Twist With Legs Floor Off",
    "key": "dumbbell-russian-twist-with-legs-floor-off/video_720p.mp4"
  },
  {
    "id": "eea42a7c-f54e-4b29-8d89-254ec4bd0aec",
    "name": "Dumbbell Side Plank Up Down",
    "key": "dumbbell-side-plank-up-down/video_720p.mp4"
  },
  {
    "id": "dc9f7aab-79ba-48c6-98fc-672ced833160",
    "name": "Dumbbell Side Plank With Rear Fly",
    "key": "dumbbell-side-plank-with-rear-fly/video_720p.mp4"
  },
  {
    "id": "89c2155a-76b2-490a-8957-bcf7979c4484",
    "name": "Dumbbell Single Arm Starfish Crunch",
    "key": "dumbbell-single-arm-starfish-crunch/video_720p.mp4"
  },
  {
    "id": "7ece7f4c-3e9e-4183-8147-0c08c08d29a5",
    "name": "Dumbbell Single Leg Glute Bridge",
    "key": "dumbbell-single-leg-glute-bridge/video_720p.mp4"
  },
  {
    "id": "73b399e1-9770-4f3b-a75c-35041c8c6043",
    "name": "Dumbbell Standing Both Arms Kickback",
    "key": "dumbbell-standing-both-arms-kickback/video_720p.mp4"
  },
  {
    "id": "70e5fe54-8c1a-4873-b260-368dc8993621",
    "name": "Dumbbell Standing One Arm Extension",
    "key": "dumbbell-standing-one-arm-extension/video_720p.mp4"
  },
  {
    "id": "d5ab11b4-7bbd-499c-a363-2dffb20e345b",
    "name": "Dumbbell Standing Triceps Extension",
    "key": "dumbbell-standing-triceps-extension/video_720p.mp4"
  },
  {
    "id": "9e311a2b-cd17-4308-bd43-c1746a289ffe",
    "name": "Dumbbell Starfish Crunch Alternating",
    "key": "dumbbell-starfish-crunch-alternating/video_720p.mp4"
  },
  {
    "id": "fe0aad98-4724-4805-8eae-c48738adef98",
    "name": "Dumbbell Straight Arm Crunch",
    "key": "dumbbell-straight-arm-crunch/video_720p.mp4"
  },
  {
    "id": "23cba76e-4275-4f88-94f6-79263179ed45",
    "name": "Dumbbell Straight Arm Twisting Sit-Up",
    "key": "dumbbell-straight-arm-twisting-sit-up/video_720p.mp4"
  },
  {
    "id": "b5d0534c-a261-459d-92f7-1101782b2a53",
    "name": "Dumbbell Straight Leg Russian Twist",
    "key": "dumbbell-straight-leg-russian-twist/video_720p.mp4"
  },
  {
    "id": "d20a604e-b081-4783-bc93-72fe1b3896e6",
    "name": "Dumbbell Triceps Kick Back Single Arm",
    "key": "dumbbell-triceps-kick-back-single-arm/video_720p.mp4"
  },
  {
    "id": "5307e27b-b375-4dbf-a6e6-978acae3b548",
    "name": "Dumbbells Triceps Kick Back Both Arms",
    "key": "dumbbells-triceps-kick-back-both-arms/video_720p.mp4"
  },
  {
    "id": "e39d78ff-0c5b-42e8-b325-2f0cd46e2a78",
    "name": "Eagle Arms Chin Into Chest",
    "key": "eagle-arms-chin-into-chest/video_720p.mp4"
  },
  {
    "id": "a7566764-5145-4e68-815e-66ecc3a7aebf",
    "name": "Easy Pose Neck Stretch",
    "key": "easy-pose-neck-stretch/video_720p.mp4"
  },
  {
    "id": "0e052430-6365-4eaf-830b-2287d7662e98",
    "name": "Easy Seated Twist Pose",
    "key": "easy-seated-twist-pose/video_720p.mp4"
  },
  {
    "id": "65e5a75a-b80e-4820-af79-7c6b74a78d4c",
    "name": "Elbow-Up and Down Dynamic Plank",
    "key": "elbow-up-and-down-dynamic-plank/video_720p.mp4"
  },
  {
    "id": "68bf010e-f6f6-43e3-9a2b-fb11411ab88a",
    "name": "Extended Side Angle",
    "key": "extended-side-angle/video_720p.mp4"
  },
  {
    "id": "6c73f88e-d1ef-4873-a7ec-aaab21f00ee4",
    "name": "Extended Side Angle Pose",
    "key": "extended-side-angle-pose/video_720p.mp4"
  },
  {
    "id": "fb9dbdde-b1a8-4dca-9d16-2f7a19bfec8e",
    "name": "Extended Side Angle Pose With Block",
    "key": "extended-side-angle-pose-with-block/video_720p.mp4"
  },
  {
    "id": "593ba19f-ea2c-4b51-b5d8-ba9f08839f8c",
    "name": "Ez Bar Overhead Extensions Standing",
    "key": "ez-bar-overhead-extensions-standing/video_720p.mp4"
  },
  {
    "id": "88df6695-fa2b-4160-ac08-914393a1f3fd",
    "name": "Gate Pose Rounding Spine Looking Up",
    "key": "gate-pose-rounding-spine-looking-up/video_720p.mp4"
  },
  {
    "id": "02a1f7ef-cb44-4099-9442-3bf73b01773a",
    "name": "Gate Pose Variation Arm Extended on Side",
    "key": "gate-pose-variation-arm-extended-on-side/video_720p.mp4"
  },
  {
    "id": "55e1d4a8-bd10-4780-a356-9dfd91a15ea9",
    "name": "Half Lotus",
    "key": "half-lotus/video_720p.mp4"
  },
  {
    "id": "1f5c2d8a-5eff-4fb2-8df6-87107c17d58a",
    "name": "Half Monkey Pose",
    "key": "half-monkey-pose/video_720p.mp4"
  },
  {
    "id": "7fd34e91-baaf-4f76-bd8a-f96a847775cc",
    "name": "Happy Baby",
    "key": "happy-baby/video_720p.mp4"
  },
  {
    "id": "4339c523-e546-4310-8797-ddc94cff7ee7",
    "name": "High Cable Kneeling Crunch",
    "key": "high-cable-kneeling-crunch/video_720p.mp4"
  },
  {
    "id": "da5c1f41-3e35-4b32-ae96-1429f893da1a",
    "name": "High Plank",
    "key": "high-plank/video_720p.mp4"
  },
  {
    "id": "505174ac-ed57-42b7-be97-b33c7c2c895c",
    "name": "High Resistance Band Kneeling Crunch",
    "key": "high-resistance-band-kneeling-crunch/video_720p.mp4"
  },
  {
    "id": "e6c99406-f17e-47fb-8730-03ef7c90f1c4",
    "name": "Scapula Push Up",
    "key": "scapula-push-up/video_720p.mp4"
  },
  {
    "id": "152b2e6b-9725-4af2-81af-bf20755344c6",
    "name": "Leg Raises (Straight Legs)",
    "key": "leg-raises-straight-legs/video_720p.mp4"
  },
  {
    "id": "934f93ce-11a9-4b33-9ace-c8a62bb50817",
    "name": "Lying Abs Resistance Band",
    "key": "lying-abs-resistance-band/video_720p.mp4"
  },
  {
    "id": "0eb32866-0b5a-41cf-9a16-f11645c99bb7",
    "name": "Modified Hindu Push Up",
    "key": "modified-hindu-push-up/video_720p.mp4"
  },
  {
    "id": "c96875c1-5dcf-45be-abaa-1a46d59e2f5e",
    "name": "Overhand Tricep Stretching Single Arm",
    "key": "overhand-tricep-stretching-single-arm/video_720p.mp4"
  },
  {
    "id": "136daf49-6aab-4bbb-a85d-4bde99f5cfe6",
    "name": "Overhead Extension Resistance Band Both Arms",
    "key": "overhead-extension-resistance-band-both-arms/video_720p.mp4"
  },
  {
    "id": "f2a8dbbb-4394-48e9-8bbc-2a29da8f321e",
    "name": "Resistance Band Glute Bridge",
    "key": "resistance-band-glute-bridge-female/video_720p.mp4"
  },
  {
    "id": "f8cc043a-1010-4295-959e-35f30bb5825d",
    "name": "Resistance Band Glute Bridge Abduction",
    "key": "resistance-band-glute-bridge-abduction/video_720p.mp4"
  },
  {
    "id": "219d55cd-55f1-4d06-bc72-01f2eb457583",
    "name": "Resistance Band Glute Bridge_Version2",
    "key": "resistance-band-glute-bridge-version2/video_720p.mp4"
  },
  {
    "id": "a34143c0-9585-4c2e-93cc-939d4f454004",
    "name": "Resistance Band Lying Bent Knee Raise",
    "key": "resistance-band-lying-bent-knee-raise/video_720p.mp4"
  },
  {
    "id": "62389ebb-766d-4549-b1a8-3f93d3b89222",
    "name": "Resistance Band Upper Body Dead Bug",
    "key": "resistance-band-upper-body-dead-bug/video_720p.mp4"
  },
  {
    "id": "c016ca5e-b7db-4305-8431-e895ecc85b32",
    "name": "Reverse Crunch With Kick Out",
    "key": "reverse-crunch-with-kick-out/video_720p.mp4"
  },
  {
    "id": "9fff0bc9-8bdc-4fe2-baa8-f37a2b5bdef2",
    "name": "Seated Cross Leg Glute Stretch",
    "key": "seated-cross-leg-glute-stretch/video_720p.mp4"
  },
  {
    "id": "751a0cc7-252c-4844-bf22-80d1789e789c",
    "name": "Seated Side Stretch",
    "key": "seated-side-stretch/video_720p.mp4"
  },
  {
    "id": "5c4091d6-19ec-4af5-a921-3c83f335f9d9",
    "name": "Side Plank Oblique Crunch",
    "key": "side-plank-oblique-crunch/video_720p.mp4"
  },
  {
    "id": "ff82948a-5d0e-4450-93e4-84e4b0dd08f9",
    "name": "Side Plank With Hip Lift",
    "key": "side-plank-with-hip-lift/video_720p.mp4"
  },
  {
    "id": "c3f6a32c-25c5-457d-a4ac-f9b3bdfbdd53",
    "name": "Single Arm Overhead Extension Resistance Band",
    "key": "single-arm-overhead-extension-resistance-band/video_720p.mp4"
  },
  {
    "id": "b095a5d9-f080-4dd9-adcb-9ead83fa63ee",
    "name": "Standing Cable Oblique Twist",
    "key": "standing-cable-oblique-twist/video_720p.mp4"
  },
  {
    "id": "bec15f32-57ad-485e-b83e-7e5e2edaa7d2",
    "name": "Superman Holds",
    "key": "superman-holds/video_720p.mp4"
  },
  {
    "id": "f70e3c85-4c1e-4ee9-be99-b8806ca348f8",
    "name": "Suspension Trainer With Grips Abdominal Fallout",
    "key": "suspension-trainer-with-grips-abdominal-fallout/video_720p.mp4"
  },
  {
    "id": "3a67a4cb-91c0-4eb3-955d-283535e767bb",
    "name": "Suspension Trainer With Grips Hanging Knees to Elbows",
    "key": "suspension-trainer-with-grips-hanging-knees-to-elbows/video_720p.mp4"
  },
  {
    "id": "674908a5-88fd-4270-bc49-e1677a03fd60",
    "name": "Suspension Trainer With Grips Hanging Leg Hip Raise",
    "key": "suspension-trainer-with-grips-hanging-leg-hip-raise/video_720p.mp4"
  },
  {
    "id": "223c4bdc-8e1e-4014-bebd-04c774148ff3",
    "name": "Suspension Trainer With Grips Hanging Straight Leg Hip Raise",
    "key": "suspension-trainer-with-grips-hanging-straight-leg-hip-raise/video_720p.mp4"
  },
  {
    "id": "d76f0f34-7121-4f7e-9090-83df097aa7c6",
    "name": "Suspension Trainer With Grips Pull Through",
    "key": "suspension-trainer-with-grips-pull-through/video_720p.mp4"
  },
  {
    "id": "aa785b49-1fc9-4603-ac82-9d014331fe38",
    "name": "Suspension Trainer With Grips Reverse Ab Rollout",
    "key": "suspension-trainer-with-grips-reverse-ab-rollout/video_720p.mp4"
  },
  {
    "id": "862ef6a6-a801-4d95-a3f3-03274d874cc4",
    "name": "Suspension Trainer With Grips Supine Crunch",
    "key": "suspension-trainer-with-grips-supine-crunch/video_720p.mp4"
  },
  {
    "id": "83029369-2833-408f-9f16-5bb6c3498e5d",
    "name": "Suspension Trainer With Grips Triceps Extension",
    "key": "suspension-trainer-with-grips-triceps-extension/video_720p.mp4"
  },
  {
    "id": "c9f37e34-fab0-481b-8e31-17eb1ca9690f",
    "name": "Tricep Cable Kickback on Crossover Machine",
    "key": "tricep-cable-kickback-on-crossover-machine/video_720p.mp4"
  }
];

function stripExt(name) {
  return name.replace(/\.(mp4|mov|m4v)$/i, '');
}

// Nome base, senza genere, senza punteggiatura: usato per il confronto principale.
function baseKey(name) {
  return stripExt(name)
    .toLowerCase()
    .replace(/[_-]?female\b/gi, '')
    .replace(/[_-]?male\b/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// 'female' | 'male' | null, dedotto dal nome file o dalla storage_key.
function genderOf(name) {
  if (/female/i.test(name)) return 'female';
  if (/\bmale\b/i.test(name)) return 'male';
  return null;
}

function walk(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'phygo') continue;
      walk(full, acc);
    } else if (entry.isFile() && /\.mp4$/i.test(entry.name)) {
      acc.push(full);
    }
  }
}

console.log(`Cerco i file video sorgente dentro: ${SEARCH_ROOT} ...`);
const allMp4 = [];
walk(SEARCH_ROOT, allMp4);
console.log(`Trovati ${allMp4.length} file .mp4 locali in totale.\n`);

// Indice: nome-base normalizzato -> lista di file candidati (con genere dedotto)
const indexByBase = new Map();
for (const filePath of allMp4) {
  const base = baseKey(path.basename(filePath));
  if (!indexByBase.has(base)) indexByBase.set(base, []);
  indexByBase.get(base).push({ filePath, gender: genderOf(path.basename(filePath)) });
}

function findCandidate(exerciseName, storageKey) {
  const base = baseKey(exerciseName);
  const candidates = indexByBase.get(base) || [];
  if (candidates.length === 0) return { file: null, ambiguous: false };
  if (candidates.length === 1) return { file: candidates[0].filePath, ambiguous: false };

  // Piu' di un file con lo stesso nome base: prova a scegliere in base al genere
  // indicato nella storage_key (es. "...-female/video_720p.mp4").
  const wantGender = genderOf(storageKey);
  if (wantGender) {
    const match = candidates.find((c) => c.gender === wantGender);
    if (match) return { file: match.filePath, ambiguous: false };
  }
  // Nessun modo sicuro per scegliere: prendo il primo ma segnalo l'ambiguita'.
  return { file: candidates[0].filePath, ambiguous: true, alternatives: candidates.map((c) => c.filePath) };
}

async function run() {
  let uploaded = 0;
  let errors = 0;
  const notFound = [];
  const ambiguous = [];

  let i = 0;
  for (const ex of BROKEN) {
    i++;
    const { file, ambiguous: isAmbiguous, alternatives } = findCandidate(ex.name, ex.key);

    if (!file) {
      notFound.push(ex);
      console.log(`[${i}/${BROKEN.length}] NON TROVATO: "${ex.name}"`);
      continue;
    }

    if (isAmbiguous) {
      ambiguous.push({ ex, alternatives });
    }

    const buffer = await readFileWaitingForICloud(file);
    if (buffer.length === 0 || isAllZero(buffer)) {
      console.log(`ATTENZIONE: il file locale per "${ex.name}" e' vuoto (forse ancora su iCloud e non scaricabile ora), salto. (${file})`);
      notFound.push(ex);
      continue;
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(ex.key, buffer, { contentType: 'video/mp4', upsert: true });

    if (error) {
      console.log(`ERRORE caricando "${ex.name}": ${error.message}`);
      errors++;
    } else {
      const sizeKb = (buffer.length / 1024).toFixed(0);
      console.log(`[${i}/${BROKEN.length}] OK (${sizeKb} KB): ${ex.name}${isAmbiguous ? '  [nome ambiguo, verificare]' : ''}`);
      uploaded++;
    }
  }

  console.log('\n--- Riepilogo ---');
  console.log(`Video sistemati con successo: ${uploaded} / ${BROKEN.length}`);
  if (errors) console.log(`Errori durante il caricamento: ${errors}`);
  if (ambiguous.length) {
    console.log(`\nAttenzione, ${ambiguous.length} video avevano piu' di un file locale con lo stesso nome base (scelto il primo disponibile) - vale la pena ricontrollarli a mano:`);
    for (const a of ambiguous) {
      console.log(`  - "${a.ex.name}": scelto ${a.alternatives[0]}`);
      for (const alt of a.alternatives.slice(1)) console.log(`      (alternativa non usata: ${alt})`);
    }
  }
  if (notFound.length) {
    console.log(`\nNon trovati sul Mac (${notFound.length}) - questi vanno controllati a mano:`);
    for (const ex of notFound) console.log(`  - ${ex.name}`);
  }
}

run();
