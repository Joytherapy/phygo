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

    const { data: nerve, error: nerveErr } = await adminSupabase
      .from('peripheral_nerves')
      .select('*')
      .eq('slug', slug)
      .single();

    if (nerveErr || !nerve) {
      return NextResponse.json({ error: 'Nerve not found' }, { status: 404 });
    }

    const { data: conditionLinks } = await adminSupabase
      .from('nerve_conditions')
      .select('condition_id')
      .eq('nerve_id', nerve.id);

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

    return NextResponse.json({ nerve, conditions });
  } catch (err) {
    console.error('nerve detail error:', err);
    return NextResponse.json({ error: 'Failed to load nerve' }, { status: 500 });
  }
}
