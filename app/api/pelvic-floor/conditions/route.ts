import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTranslatedCondition, type SupportedLang } from '@/lib/conditionTranslation';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseLang(value: string | null): SupportedLang | 'it' {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export async function GET(req: Request) {
  try {
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

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
      if (lang === 'it') {
        const { data: conds } = await adminSupabase
          .from('knowledge_base')
          .select(
            'id, condition_name, goals, clinical_tests, red_flags, contraindications, typical_exercises, progression_criteria, evidence_level'
          )
          .in('id', conditionIds);
        conditions = conds || [];
      } else {
        const translated = await Promise.all(
          conditionIds.map((id) => getTranslatedCondition(id, lang))
        );
        conditions = translated
          .filter((c): c is NonNullable<typeof c> => c !== null)
          .map((c) => ({
            id: c.id,
            condition_name: c.condition_name,
            goals: c.goals,
            clinical_tests: c.clinical_tests,
            red_flags: c.red_flags,
            contraindications: c.contraindications,
            typical_exercises: c.typical_exercises,
            progression_criteria: c.progression_criteria,
            evidence_level: c.evidence_level,
          }));
      }
    }

    const compartmentMap = new Map((tags || []).map((t) => [t.condition_id, t.compartment]));
    const enriched = conditions.map((c) => ({
      ...c,
      compartment: compartmentMap.get(c.id) ?? 'systemic',
    }));

    return NextResponse.json({ conditions: enriched }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err) {
    console.error('pelvic floor conditions error:', err);
    return NextResponse.json({ error: 'Failed to load conditions' }, { status: 500 });
  }
}
