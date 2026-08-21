require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: conditions } = await supabase
    .from('knowledge_base')
    .select('id, condition_name')
    .in('condition_name', ["Rischio di caduta nell'anziano", 'Sarcopenia']);

  if (!conditions || conditions.length === 0) {
    console.log('Condizioni non trovate.');
    return;
  }

  const fallCondition = conditions.find((c) => c.condition_name.includes('caduta'));
  const sarcopeniaCondition = conditions.find((c) => c.condition_name === 'Sarcopenia');

  console.log('Trovate:', conditions.map((c) => `${c.condition_name} (id ${c.id})`));

  // --- Zone del CERVELLO ---
  const { data: brainZones } = await supabase
    .from('brain_zones')
    .select('id, slug');

  const brainLinks = [];
  if (fallCondition) {
    const cerebellum = brainZones.find((z) => z.slug === 'cerebellum');
    if (cerebellum) brainLinks.push({ zone_id: cerebellum.id, condition_id: fallCondition.id });
  }

  if (brainLinks.length > 0) {
    const { error } = await supabase
      .from('brain_zone_conditions')
      .upsert(brainLinks, { onConflict: 'zone_id,condition_id', ignoreDuplicates: true });
    if (error) throw error;
    console.log(`${brainLinks.length} collegamenti creati su brain_zones.`);
  }

  // --- Zone del CORPO ---
  const { data: bodyZones } = await supabase
    .from('body_zones')
    .select('id, slug');

  const bodyLinks = [];
  const bodyTargets = ['whole-body', 'hip', 'knee', 'ankle-foot'];

  for (const zone of bodyZones.filter((z) => bodyTargets.includes(z.slug))) {
    if (fallCondition) bodyLinks.push({ zone_id: zone.id, condition_id: fallCondition.id });
    if (sarcopeniaCondition) bodyLinks.push({ zone_id: zone.id, condition_id: sarcopeniaCondition.id });
  }

  if (bodyLinks.length > 0) {
    const { error } = await supabase
      .from('body_zone_conditions')
      .upsert(bodyLinks, { onConflict: 'zone_id,condition_id', ignoreDuplicates: true });
    if (error) throw error;
    console.log(`${bodyLinks.length} collegamenti creati su body_zones.`);
  }
}

main().catch((err) => {
  console.error('Errore:', err);
  process.exit(1);
});
