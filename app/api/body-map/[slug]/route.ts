import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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
      .from('body_zones')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (zoneErr || !zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let plan = 'free';
    if (user) {
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();
      if (profile?.plan) plan = profile.plan;
    }

    const { data: itemLinks } = await adminSupabase
      .from('body_zone_items')
      .select('item_id')
      .eq('zone_id', zone.id);

    const itemIds = (itemLinks || []).map((l) => l.item_id);

    let exercises: any[] = [];
    if (itemIds.length > 0) {
      const { data: items } = await adminSupabase
        .from('library_items')
        .select('id, title, level, body_position, equipment, image_url, goal')
        .in('id', itemIds);
      exercises = items || [];
    }

    const exerciseLimit = plan === 'free' ? 2 : 6;
    const featuredExercises = exercises.slice(0, exerciseLimit);

    const { data: conditionLinks } = await adminSupabase
      .from('body_zone_conditions')
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

    return NextResponse.json({
      zone,
      exercises: featuredExercises,
      totalExercises: exercises.length,
      conditions,
      plan,
    });
  } catch (err) {
    console.error('body-map zone error:', err);
    return NextResponse.json({ error: 'Failed to load zone' }, { status: 500 });
  }
}