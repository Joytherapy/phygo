import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const { data: zone, error: zoneErr } = await adminSupabase
      .from('brain_zones')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (zoneErr || !zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    const { data: conditionLinks } = await adminSupabase
      .from('brain_zone_conditions')
      .select('condition_id')
      .eq('zone_id', zone.id);

    const conditionIds = (conditionLinks || []).map((l) => l.condition_id);

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

    return NextResponse.json({ zone, conditions });
  } catch (err) {
    console.error('brain-map zone error:', err);
    return NextResponse.json({ error: 'Failed to load zone' }, { status: 500 });
  }
}
