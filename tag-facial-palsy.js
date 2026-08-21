require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: brainstem } = await supabase
    .from('brain_zones')
    .select('id')
    .eq('slug', 'brainstem')
    .single();

  if (!brainstem) {
    console.log('Zona brainstem non trovata.');
    return;
  }

  const { error } = await supabase
    .from('brain_zone_conditions')
    .upsert(
      [{ zone_id: brainstem.id, condition_id: 99 }],
      { onConflict: 'zone_id,condition_id', ignoreDuplicates: true }
    );

  if (error) throw error;
  console.log('Collegamento creato: Paralisi del nervo faciale -> Brainstem');
}

main().catch((err) => {
  console.error('Errore:', err);
  process.exit(1);
});
