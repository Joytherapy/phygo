import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { getTranslatedCondition, type SupportedLang } from '@/lib/conditionTranslation';
import { STRUCTURE_FIELD_ORDER } from '@/lib/pelvicFloorFields';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    const { data: structure, error: structureErr } = await adminSupabase
      .from('pelvic_floor_structures')
      .select('*')
      .eq('slug', slug)
      .single();

    if (structureErr || !structure) {
      return NextResponse.json({ error: 'Structure not found' }, { status: 404 });
    }

    const { fields } = await translateContent(
      'pelvic_floor_structure',
      structure.id,
      structure,
      STRUCTURE_FIELD_ORDER,
      lang
    );
    const translatedStructure = { ...structure, ...fields };

    const { data: conditionLinks } = await adminSupabase
      .from('pelvic_floor_conditions')
      .select('condition_id')
      .eq('structure_id', structure.id);

    const conditionIds = (conditionLinks || []).map((l) => l.condition_id);

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
          conditionIds.map((id) => getTranslatedCondition(id, lang as SupportedLang))
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

    return NextResponse.json({ structure: translatedStructure, conditions }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err) {
    console.error('pelvic floor structure detail error:', err);
    return NextResponse.json({ error: 'Failed to load structure' }, { status: 500 });
  }
}
