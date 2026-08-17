// Salva questo file come: link-mobility-images.js (nella cartella principale del progetto, ~/Downloads/phygo)
// Esegui con: node link-mobility-images.js
// Richiede che il server sia già acceso (npm run dev) in un altro terminale.

const SUPABASE_URL = 'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

const imageMap = {
  'Seated Neck Rotation': 'mobility-01-seated-neck-rotation.png',
  'Chin Tuck': 'mobility-02-chin-tuck.png',
  'Shoulder Rolls': 'mobility-03-shoulder-rolls.png',
  'Arm Circles': 'mobility-04-arm-circles.png',
  'Seated Cross-Body Reach': 'mobility-05-seated-cross-body-reach.png',
  'Seated Trunk Rotation': 'mobility-06-seated-trunk-rotation.png',
  'Side Trunk Stretch': 'mobility-07-side-trunk-stretch.png',
  'Pelvic Tilt': 'mobility-08-pelvic-tilt.png',
  'Seated Hip Open-Close': 'mobility-09-seated-hip-open-close.png',
  'Seated Knee Lift': 'mobility-10-seated-knee-lift.png',
  'Ankle Pumps': 'mobility-11-ankle-pumps.png',
  'Ankle Circles': 'mobility-12-ankle-circles.png',
  'Heel Slides': 'mobility-13-heel-slides.png',
  'Standing Hip Circles': 'mobility-14-standing-hip-circles.png',
  'Standing Leg Swing with Support': 'mobility-15-standing-leg-swing.png',
  'Standing Heel-Toe Rock': 'mobility-16-standing-heel-toe-rock.png',
  'Standing Wall Shoulder Slide': 'mobility-17-standing-wall-shoulder-slide.png',
  'Warm-Up March and Stretch': 'mobility-18-warmup-march-stretch.png',
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
