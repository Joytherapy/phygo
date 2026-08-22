import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ID delle 8 patologie del sistema nervoso periferico già presenti in knowledge_base
// ma non ancora collegate a nessuna zona/sezione tramite le tabelle *_zone_conditions.
// Recuperati il 22/8/2026 tramite query SQL diretta su Supabase.
const PERIPHERAL_NERVE_CONDITION_IDS = [46, 67, 71, 72, 77, 80, 99, 100];

export async function GET() {
  try {
    const { data, error } = await adminSupabase
      .from('knowledge_base')
      .select(
        'id, condition_name, goals, clinical_tests, red_flags, contraindications, typical_exercises, progression_criteria, evidence_level'
      )
      .in('id', PERIPHERAL_NERVE_CONDITION_IDS)
      .order('condition_name', { ascending: true });

    if (error) {
      console.error('peripheral-nerves error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conditions: data ?? [] });
  } catch (err) {
    console.error('peripheral-nerves error:', err);
    return NextResponse.json({ error: 'Failed to load conditions' }, { status: 500 });
  }
}
