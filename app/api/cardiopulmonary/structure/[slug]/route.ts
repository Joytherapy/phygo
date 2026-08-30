import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const { data: structure, error: structureError } = await adminSupabase
      .from('cardiopulmonary_structures')
      .select('*')
      .eq('slug', slug)
      .single();

    if (structureError || !structure) {
      console.error('cardiopulmonary structure detail error:', structureError);
      return NextResponse.json({ error: 'Structure not found' }, { status: 404 });
    }

    const { data: links, error: linksError } = await adminSupabase
      .from('cardiopulmonary_conditions')
      .select('condition_id')
      .eq('structure_id', structure.id);

    if (linksError) {
      console.error('cardiopulmonary structure conditions error:', linksError);
      return NextResponse.json({ error: linksError.message }, { status: 500 });
    }

    const conditionIds = (links ?? []).map((l) => l.condition_id);
    let conditions: any[] = [];

    if (conditionIds.length > 0) {
      const { data: conditionsData, error: conditionsError } = await adminSupabase
        .from('knowledge_base')
        .select('id, condition_name, goals, red_flags')
        .in('id', conditionIds);

      if (conditionsError) {
        console.error('cardiopulmonary structure conditions fetch error:', conditionsError);
      } else {
        conditions = conditionsData ?? [];
      }
    }

    return NextResponse.json({ structure, conditions });
  } catch (err) {
    console.error('cardiopulmonary structure detail error:', err);
    return NextResponse.json({ error: 'Failed to load structure' }, { status: 500 });
  }
}