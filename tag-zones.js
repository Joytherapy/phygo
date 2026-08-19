// Salva questo file come: tag-zones.js (nella cartella principale del progetto, ~/Downloads/phygo)
// Esegui con: node tag-zones.js
// Collega ogni esercizio esistente alle zone anatomiche cliniche pertinenti.

const zoneMap = {
  // Strength
  'Sit-to-Stand': ['hip', 'knee'],
  'Seated Knee Extension': ['knee'],
  'Standing Heel Raise': ['ankle-foot'],
  'Standing Toe Raise': ['ankle-foot'],
  'Standing Hip Abduction': ['hip'],
  'Standing Hip Extension': ['hip'],
  'Standing Knee Flexion': ['knee'],
  'Mini Squat with Chair Support': ['hip', 'knee'],
  'Standing Wall Push-Up': ['shoulder', 'elbow'],
  'Seated Bicep Curl': ['elbow'],
  'Seated Overhead Press': ['shoulder'],
  'Seated Row with Resistance Band': ['shoulder', 'thoracic-spine'],
  'Seated Chest Press with Resistance Band': ['shoulder', 'elbow'],
  'Seated Marching with Resistance': ['hip'],
  'Bridge': ['hip', 'lumbar-spine'],
  'Side-Lying Hip Raise': ['hip'],
  'Step-Up with Support': ['hip', 'knee'],
  'Counter Tricep Press': ['elbow'],
  'Seated Ball Squeeze': ['hip'],
  'Standing Lateral Step with Band': ['hip', 'knee'],
  // Mobility
  'Seated Neck Rotation': ['cervical-spine'],
  'Chin Tuck': ['cervical-spine'],
  'Shoulder Rolls': ['shoulder'],
  'Arm Circles': ['shoulder'],
  'Seated Cross-Body Reach': ['thoracic-spine', 'shoulder'],
  'Seated Trunk Rotation': ['thoracic-spine', 'lumbar-spine'],
  'Side Trunk Stretch': ['thoracic-spine', 'lumbar-spine'],
  'Pelvic Tilt': ['lumbar-spine'],
  'Seated Hip Open-Close': ['hip'],
  'Seated Knee Lift': ['hip', 'knee'],
  'Ankle Pumps': ['ankle-foot'],
  'Ankle Circles': ['ankle-foot'],
  'Heel Slides': ['knee', 'hip'],
  'Standing Hip Circles': ['hip'],
  'Standing Leg Swing with Support': ['hip'],
  'Standing Heel-Toe Rock': ['ankle-foot'],
  'Standing Wall Shoulder Slide': ['shoulder'],
  'Warm-Up March and Stretch': ['whole-body'],
  // Balance
  'Feet-Together Stance': ['whole-body'],
  'Semi-Tandem Stance': ['whole-body'],
  'Tandem Stance': ['whole-body'],
  'Single-Leg Toe Tap': ['whole-body', 'hip'],
  'Single-Leg Stand': ['whole-body', 'hip'],
  'Forward Weight Shift': ['whole-body'],
  'Lateral Weight Shift': ['whole-body'],
  'Clock Taps': ['whole-body'],
  'Heel-to-Toe Walk': ['whole-body'],
  'Backward Walk': ['whole-body'],
  'Lateral Step at the Counter': ['whole-body'],
  'Step Over a Line': ['whole-body'],
  'Turn in Place': ['whole-body'],
  'Stand, Pause, and Sit': ['hip', 'knee', 'whole-body'],
  'Standing March with Support': ['whole-body', 'hip'],
  'Standing Head Turns': ['cervical-spine', 'whole-body'],
  'Reach Outside the Base': ['whole-body', 'shoulder'],
  'Four-Corner Step': ['whole-body'],
  'Walking on Unstable Surfaces': ['whole-body', 'ankle-foot'],
  'Eyes-Closed Balance, Feet Together': ['whole-body'],
  'Eyes-Closed Single-Leg Balance': ['whole-body'],
  'Resisting Manual Perturbations': ['whole-body'],
  'Walking Ball Toss with Clinician': ['whole-body'],
};

async function tagZones() {
  const base = 'http://localhost:3000';

  console.log('Recupero esercizi e zone...');
  const [itemsRes, zonesRes] = await Promise.all([
    fetch(`${base}/api/library/admin`),
    fetch(`${base}/api/library/admin/zones`),
  ]);
  const itemsData = await itemsRes.json();
  const zonesData = await zonesRes.json();

  const items = itemsData.items || [];
  const zones = zonesData.zones || [];

  console.log(`Trovati ${items.length} esercizi e ${zones.length} zone.`);

  let linked = 0;
  let notFound = 0;

  for (const [title, zoneSlugs] of Object.entries(zoneMap)) {
    const item = items.find((i) => i.title === title);
    if (!item) {
      console.error(`✗ Esercizio non trovato: "${title}"`);
      notFound++;
      continue;
    }

    for (const slug of zoneSlugs) {
      const zone = zones.find((z) => z.slug === slug);
      if (!zone) {
        console.error(`  ✗ Zona non trovata: "${slug}"`);
        continue;
      }

      const res = await fetch(`${base}/api/library/admin/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId: zone.id, itemId: item.id }),
      });
      const data = await res.json();
      if (data.success) {
        linked++;
      } else {
        console.error(`  ✗ Errore collegando "${title}" a "${slug}": ${data.error}`);
      }
    }
    console.log(`✓ ${title} → ${zoneSlugs.join(', ')}`);
  }

  console.log(`\nFatto! ${linked} collegamenti creati, ${notFound} esercizi non trovati.`);
}

tagZones();
