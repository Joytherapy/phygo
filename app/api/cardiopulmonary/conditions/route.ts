import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: tags, error: tagsError } = await adminSupabase
      .from('cardiopulmonary_condition_tags')
      .select('condition_id, system');

    if (tagsError) {
      console.error('cardiopulmonary conditions tags error:', tagsError);
      return NextResponse.json({ error: tagsError.message }, { status: 500 });
    }

    const conditionIds = (tags ?? []).map((t) => t.condition_id);
    let conditions: any[] = [];

    if (conditionIds.length > 0) {
      const { data, error } = await adminSupabase
        .from('knowledge_base')
        .select('id, condition_name, goals, clinical_tests, red_flags, typical_exercises, contraindications')
        .in('id', conditionIds);

      if (error) {
        console.error('cardiopulmonary conditions fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      conditions = data ?? [];
    }

    const merged = conditions.map((c) => ({
      ...c,
      system: tags?.find((t) => t.condition_id === c.id)?.system ?? 'mixed_systemic',
    }));

    return NextResponse.json({ conditions: merged });
  } catch (err) {
    console.error('cardiopulmonary conditions list error:', err);
    return NextResponse.json({ error: 'Failed to load conditions' }, { status: 500 });
  }
}