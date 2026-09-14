import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTranslatedCondition, type SupportedLang } from '@/lib/conditionTranslation';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { ZONE_INFO, GERIATRIC_PRINCIPLES } from '@/lib/brainMapContent';
import { ZONE_INFO_FIELD_ORDER, GERIATRIC_FIELD_ORDER } from '@/lib/brainMapFields';

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

/** Looks up ZONE_INFO[slug] and translates it (cached) when lang !== 'it'. Returns undefined if this slug has no narrative at all. */
async function getZoneInfo(slug: string, lang: AppLang) {
  const source = ZONE_INFO[slug];
  if (!source) return undefined;
  if (lang === 'it') return source;

  const { fields } = await translateContent('brain_zone_info', slug, source, ZONE_INFO_FIELD_ORDER, lang);
  return fields;
}

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
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    const { data: zone, error: zoneErr } = await adminSupabase
      .from('brain_zones')
.select('id, name, slug, image_url')      .eq('slug', slug)
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

      // Same lazy-translate-and-cache engine already used by the public
      // Clinical Library and Body Map — these are the same knowledge_base
      // rows, so a condition translated once (from anywhere) is cached
      // everywhere.
      if (lang !== 'it' && conditions.length > 0) {
        conditions = await Promise.all(
          conditions.map(async (c) => (await getTranslatedCondition(c.id, lang as SupportedLang)) ?? c)
        );
      }
    }

    let translatedZone = zone;
    if (lang !== 'it') {
      const { fields } = await translateContent(
        'brain_zone_name',
        zone.id,
        { name: zone.name },
        ['name'] as const,
        lang
      );
      translatedZone = { ...zone, name: fields.name || zone.name };
    }

    const info = await getZoneInfo(zone.slug, lang);

    // GERIATRIC_PRINCIPLES is the same static content on every zone hub page
    // (not tied to this specific zone) — translated here too, since this is
    // the only route this page already calls, and the per-slug cache means
    // translating it via the first zone a user visits covers every other one.
    const geriatricPrinciples =
      lang === 'it'
        ? GERIATRIC_PRINCIPLES
        : await Promise.all(
            GERIATRIC_PRINCIPLES.map(async (g) => {
              const { fields } = await translateContent(
                'brain_geriatric_principle',
                g.slug,
                g,
                GERIATRIC_FIELD_ORDER,
                lang
              );
              return { ...g, ...fields };
            })
          );

    return NextResponse.json({ zone: translatedZone, conditions, info, geriatricPrinciples });
  } catch (err) {
    console.error('brain-map zone error:', err);
    return NextResponse.json({ error: 'Failed to load zone' }, { status: 500 });
  }
}
