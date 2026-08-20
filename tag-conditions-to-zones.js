require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parole chiave italiane/inglesi da cercare in condition_name + condition_keywords
// per ogni zona anatomica. Il match è case-insensitive e cerca la sottostringa.
const ZONE_KEYWORDS = {
  'cervical-spine': ['cervical', 'cervicale', 'collo', 'colpo di frusta', 'whiplash', 'cefalea cervicogenica'],
  'trapezius': ['trapezio', 'trapezius'],
  'shoulder': ['spalla', 'shoulder', 'cuffia dei rotatori', 'rotator cuff', 'capsulite', 'glenoomerale', 'labbro glenoideo', 'slap'],
  'chest': ['pettorale', 'pectoral', 'toracica', 'thoracic outlet', 'stretto toracico'],
  'biceps': ['bicipite', 'bicep'],
  'triceps': ['tricipite', 'tricep'],
  'elbow': ['gomito', 'elbow', 'epicondilite', 'epitrocleite', 'tunnel cubitale'],
  'forearm': ['avambraccio', 'forearm'],
  'wrist-hand': ['polso', 'mano', 'wrist', 'hand', 'tunnel carpale', 'carpal', 'de quervain', 'dito a scatto', 'trigger finger', 'dupuytren', 'scafoide'],
  'core-abdomen': ['addome', 'addominale', 'core', 'lombalgia'],
  'thoracic-spine': ['dorsale', 'toracica', 'thoracic spine', 'colonna dorsale'],
  'lumbar-spine': ['lombare', 'lombalgia', 'lumbar', 'ernia del disco', 'sciatalgia', 'sciatica', 'spondilolisi', 'stenosi spinale', 'colpo della strega'],
  'hip': ['anca', 'hip', 'femoro-acetabolare', 'displasia', 'protesi danca', 'protesi totale anca'],
  'glutes': ['gluteo', 'gluteal', 'piriforme', 'trocanterico'],
  'quadriceps': ['quadricipite', 'quadriceps', 'femoro-rotulea', 'rotula', 'patellofemoral'],
  'hamstrings': ['ischiocrurali', 'hamstring', 'bicipite femorale'],
  'knee': ['ginocchio', 'knee', 'menisco', 'legamento crociato', 'lca', 'lcm', 'condropatia', 'osgood-schlatter', 'baker'],
  'calf': ['polpaccio', 'calf', 'tibiale', 'shin splint'],
  'ankle-foot': ['caviglia', 'piede', 'ankle', 'foot', 'achille', 'achillea', 'fascite plantare', 'alluce valgo', 'tunnel tarsale', 'morton', 'metatarsalgia'],
};

async function main() {
  console.log('Carico zone e patologie...');

  const { data: zones, error: zonesErr } = await supabase
    .from('body_zones')
    .select('id, name, slug');
  if (zonesErr) throw zonesErr;

  const { data: conditions, error: condErr } = await supabase
    .from('knowledge_base')
    .select('id, condition_name, condition_keywords');
  if (condErr) throw condErr;

  console.log(`${zones.length} zone, ${conditions.length} patologie trovate.`);

  const links = [];

  for (const condition of conditions) {
    const haystack = `${condition.condition_name || ''} ${condition.condition_keywords || ''}`.toLowerCase();

    for (const zone of zones) {
      const keywords = ZONE_KEYWORDS[zone.slug];
      if (!keywords) continue;

      const matches = keywords.some((kw) => haystack.includes(kw.toLowerCase()));
      if (matches) {
        links.push({ zone_id: zone.id, condition_id: condition.id });
      }
    }
  }

  console.log(`${links.length} collegamenti zona↔patologia trovati. Inserisco (ignorando duplicati)...`);

  const { error: insertErr } = await supabase
    .from('body_zone_conditions')
    .upsert(links, { onConflict: 'zone_id,condition_id', ignoreDuplicates: true });

  if (insertErr) throw insertErr;

  console.log('Fatto! body_zone_conditions popolata.');
}

main().catch((err) => {
  console.error('Errore:', err);
  process.exit(1);
});