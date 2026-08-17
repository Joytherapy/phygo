// Salva questo file come: link-images.js (nella cartella principale del progetto, ~/Downloads/phygo)
// Esegui con: node link-images.js
// Richiede che il server sia già acceso (npm run dev) in un altro terminale.

const SUPABASE_URL = 'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

const imageMap = {
  'Sit-to-Stand': 'strength-01-sit-to-stand.png',
  'Seated Knee Extension': 'strength-02-seated-knee-extension.png',
  'Standing Heel Raise': 'strength-03-standing-heel-raise.png',
  'Standing Wall Push-Up': 'strength-04-standing-wall-pushup.png',
  'Standing Toe Raise': 'strength-05-standing-toe-raise.png',
  'Standing Hip Abduction': 'strength-06-standing-hip-abduction.png',
  'Standing Hip Extension': 'strength-07-standing-hip-extension.png',
  'Standing Knee Flexion': 'strength-08-standing-knee-flexion.png',
  'Mini Squat with Chair Support': 'strength-09-mini-squat.png',
  'Seated Bicep Curl': 'strength-10-seated-bicep-curl.png',
  'Seated Overhead Press': 'strength-11-seated-overhead-press.png',
  'Seated Row with Resistance Band': 'strength-12-seated-row-band.png',
  'Seated Chest Press with Resistance Band': 'strength-13-seated-chest-press-band.png',
  'Seated Marching with Resistance': 'strength-14-seated-marching.png',
  'Bridge': 'strength-15-bridge.png',
  'Side-Lying Hip Raise': 'strength-16-side-lying-hip-raise.png',
  'Step-Up with Support': 'strength-17-step-up.png',
  'Counter Tricep Press': 'strength-18-counter-tricep-press.png',
  'Seated Ball Squeeze': 'strength-19-seated-ball-squeeze.png',
  'Standing Lateral Step with Band': 'strength-20-standing-lateral-step-band.png',
};

async function linkImages() {
  const base = 'http://localhost:3000';

  console.log('Recupero elenco esercizi esistenti...');
  const listRes = await fetch(`${base}/api/library/admin`);
  const listData = await listRes.json();
  const items = listData.items || [];

  console.log(`Trovati ${items.length} esercizi nel database.`);
  console.log('Collego le immagini...');

  let updated = 0;
  let notFound = 0;

  for (const [title, filename] of Object.entries(imageMap)) {
    const item = items.find((i) => i.title === title);

    if (!item) {
      console.error(`✗ Esercizio non trovato nel database: "${title}"`);
      notFound++;
      continue;
    }

    const imageUrl = `${SUPABASE_URL}/${filename}`;

    const res = await fetch(`${base}/api/library/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: item.id,
        subcategory_id: item.subcategory_id,
        title: item.title,
        goal: item.goal,
        level: item.level,
        body_position: item.body_position,
        equipment: item.equipment,
        steps: item.steps,
        reps_duration: item.reps_duration,
        easier_option: item.easier_option,
        harder_option: item.harder_option,
        tip: item.tip,
        safety_note: item.safety_note,
        sort_order: item.sort_order,
        image_url: imageUrl,
      }),
    });

    const data = await res.json();
    if (data.success) {
      console.log(`✓ ${title}`);
      updated++;
    } else {
      console.error(`✗ ${title} — ${data.error}`);
    }
  }

  console.log(`\nFatto! ${updated} immagini collegate, ${notFound} esercizi non trovati.`);
}

linkImages();
