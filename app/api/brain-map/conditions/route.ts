import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Aggrega tutte le patologie collegate a QUALSIASI zona cerebrale (brain_zone_conditions),
// con l'elenco delle zone a cui ciascuna è collegata — per la tab "Conditions" della
// vista Brain, che finora esponeva le patologie solo cliccando i singoli hotspot.
export async function GET() {
  try {
    const { data: zones, error: zonesErr } = await adminSupabase
      .from('brain_zones')
      .select('id, slug, name');

    if (zonesErr) {
      console.error('brain-map conditions error (zones):', zonesErr);
      return NextResponse.json({ error: zonesErr.message }, { status: 500 });
    }

    const zoneById = new Map((zones || []).map((z) => [z.id, { slug: z.slug, name: z.name }]));

    const { data: links, error: linksErr } = await adminSupabase
      .from('brain_zone_conditions')
      .select('zone_id, condition_id');

    if (linksErr) {
      console.error('brain-map conditions error (links):', linksErr);
      return NextResponse.json({ error: linksErr.message }, { status: 500 });
    }

    const zonesByCondition = new Map<number, { slug: string; name: string }[]>();
    for (const link of links || []) {
      const zone = zoneById.get(link.zone_id);
      if (!zone) continue;
      const existing = zonesByCondition.get(link.condition_id) ?? [];
      if (!existing.some((z) => z.slug === zone.slug)) existing.push(zone);
      zonesByCondition.set(link.condition_id, existing);
    }

    const conditionIds = Array.from(zonesByCondition.keys());

    let conditions: any[] = [];
    if (conditionIds.length > 0) {
      const { data: conds, error: condsErr } = await adminSupabase
        .from('knowledge_base')
        .select(
          'id, condition_name, goals, clinical_tests, red_flags, contraindications, typical_exercises, progression_criteria, evidence_level'
        )
        .in('id', conditionIds)
        .order('condition_name', { ascending: true });

      if (condsErr) {
        console.error('brain-map conditions error (knowledge_base):', condsErr);
        return NextResponse.json({ error: condsErr.message }, { status: 500 });
      }

      conditions = (conds || []).map((c) => ({
        ...c,
        zones: zonesByCondition.get(c.id) ?? [],
      }));
    }

    return NextResponse.json({ conditions });
  } catch (err) {
    console.error('brain-map conditions error:', err);
    return NextResponse.json({ error: 'Failed to load brain conditions' }, { status: 500 });
  }
}
