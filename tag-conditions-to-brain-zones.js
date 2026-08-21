require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ZONE_KEYWORDS = {
  'frontal-lobe': ['post-ictus', 'ictus'],
  'parietal-lobe': ['post-ictus', 'ictus'],
  'temporal-lobe': ['epilessia', 'crisi epilettica', 'post-ictus', 'ictus'],
  'occipital-lobe': ['post-ictus', 'ictus'],
  'cerebellum': ['sclerosi multipla', 'atassia', 'post-ictus', 'ictus'],
  'brainstem': ['post-ictus', 'ictus'],
  'basal-ganglia': ['parkinson', 'gangli della base', 'corea', 'distonia'],
};

async function main() {
  console.log('Carico zone cerebrali e patologie...');

  const { data: zones, error: zonesErr } = await supabase
    .from('brain_zones')
    .select('id, name, slug');
  if (zonesErr) throw zonesErr;

  const { data: conditions, error: condErr } = await supabase
    .from('knowledge_base')
    .select('id, condition_name, condition_keywords');
  if (condErr) throw condErr;

  console.log(`${zones.length} zone cerebrali, ${conditions.length} patologie trovate.`);

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

  console.log(`${links.length} collegamenti trovati. Inserisco (ignorando duplicati)...`);

  const { error: insertErr } = await supabase
    .from('brain_zone_conditions')
    .upsert(links, { onConflict: 'zone_id,condition_id', ignoreDuplicates: true });

  if (insertErr) throw insertErr;

  console.log('Fatto! brain_zone_conditions popolata.');
}

main().catch((err) => {
  console.error('Errore:', err);
  process.exit(1);
});
