import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTranslatedCondition, type SupportedLang } from '@/lib/conditionTranslation';
import { translateContent, type AppLang } from '@/lib/contentTranslation';

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Aggrega tutte le patologie collegate a QUALSIASI zona cerebrale (brain_zone_conditions),
// con l'elenco delle zone a cui ciascuna è collegata — per la tab "Conditions" della
// vista Brain, che finora esponeva le patologie solo cliccando i singoli hotspot.
export async function GET(req: Request) {
  try {
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    const { data: zones, error: zonesErr } = await adminSupabase
      .from('brain_zones')
      .select('id, slug, name');

    if (zonesErr) {
      console.error('brain-map conditions error (zones):', zonesErr);
      return NextResponse.json({ error: zonesErr.message }, { status: 500 });
    }

    let zoneNameBySlug = new Map<string, string>();
    if (lang !== 'it' && (zones || []).length > 0) {
      await Promise.all(
        (zones || []).map(async (z) => {
          const { fields } = await translateContent('brain_zone_name', z.id, { name: z.name }, ['name'] as const, lang);
          zoneNameBySlug.set(z.slug, fields.name || z.name);
        })
      );
    } else {
      for (const z of zones || []) zoneNameBySlug.set(z.slug, z.name);
    }

    const zoneById = new Map<number, { slug: string; name: string }>(
      (zones || []).map((z) => [z.id, { slug: z.slug, name: zoneNameBySlug.get(z.slug) ?? z.name }])
    );

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

      let translatedConds = conds || [];
      if (lang !== 'it' && translatedConds.length > 0) {
        translatedConds = await Promise.all(
          translatedConds.map(async (c) => (await getTranslatedCondition(c.id, lang as SupportedLang)) ?? c)
        );
      }

      conditions = translatedConds.map((c) => ({
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
