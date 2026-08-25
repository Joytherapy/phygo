import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: tags, error: tagsErr } = await adminSupabase
      .from('pelvic_floor_condition_tags')
      .select('condition_id, compartment');

    if (tagsErr) {
      console.error('pelvic floor conditions error:', tagsErr);
      return NextResponse.json({ error: tagsErr.message }, { status: 500 });
    }

    const conditionIds = (tags || []).map((t) => t.condition_id);

    let conditions: any[] = [];
    if (conditionIds.length > 0) {
      const { data: conds } = await adminSupabase
        .from('knowledge_base')
        .select(
          'id, condition_name, goals, clinical_tests, red_flags, contraindications, typical_exercises, progression_criteria, evidence_level'
        )
        .in('id', conditionIds);
      conditions = conds || [];
    }

    const compartmentMap = new Map((tags || []).map((t) => [t.condition_id, t.compartment]));
    const enriched = conditions.map((c) => ({
      ...c,
      compartment: compartmentMap.get(c.id) ?? 'systemic',
    }));

    return NextResponse.json({ conditions: enriched });
  } catch (err) {
    console.error('pelvic floor conditions error:', err);
    return NextResponse.json({ error: 'Failed to load conditions' }, { status: 500 });
  }
}
