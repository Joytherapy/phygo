// Salva questo file come: link-balance-images.js (nella cartella principale del progetto, ~/Downloads/phygo)
// Esegui con: node link-balance-images.js

const SUPABASE_URL = 'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

const imageMap = {
  'Feet-Together Stance': 'balance-01-feet-together-stance.png',
  'Semi-Tandem Stance': 'balance-02-semi-tandem-stance.png',
  'Tandem Stance': 'balance-03-tandem-stance.png',
  'Single-Leg Toe Tap': 'balance-04-single-leg-toe-tap.png',
  'Single-Leg Stand': 'balance-05-single-leg-stand.png',
  'Forward Weight Shift': 'balance-06-forward-weight-shift.png',
  'Lateral Weight Shift': 'balance-07-lateral-weight-shift.png',
  'Clock Taps': 'balance-08-clock-taps.png',
  'Heel-to-Toe Walk': 'balance-09-heel-to-toe-walk.png',
  'Backward Walk': 'balance-10-backward-walk.png',
  'Lateral Step at the Counter': 'balance-11-lateral-step-counter.png',
  'Step Over a Line': 'balance-12-step-over-line.png',
  'Turn in Place': 'balance-13-turn-in-place.png',
  'Stand, Pause, and Sit': 'balance-14-stand-pause-sit.png',
  'Standing March with Support': 'balance-15-standing-march.png',
  'Standing Head Turns': 'balance-16-standing-head-turns.png',
  'Reach Outside the Base': 'balance-17-reach-outside-base.png',
  'Four-Corner Step': 'balance-18-four-corner-step.png',
  'Walking on Unstable Surfaces': 'balance-19-walking-unstable-surfaces.png',
  'Eyes-Closed Balance, Feet Together': 'balance-20-eyes-closed-feet-together.png',
  'Eyes-Closed Single-Leg Balance': 'balance-21-eyes-closed-single-leg.png',
  'Resisting Manual Perturbations': 'balance-22-resisting-perturbations.png',
  'Walking Ball Toss with Clinician': 'balance-23-walking-ball-toss-clinician.png',
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
