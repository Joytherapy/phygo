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

    const { data: tags, error: tagsError } = await adminSupabase
      .from('hematology_condition_tags')
      .select('condition_id, system');

    if (tagsError) {
      console.error('hematology conditions tags error:', tagsError);
      return NextResponse.json({ error: tagsError.message }, { status: 500 });
    }

    const conditionIds = (tags ?? []).map((t) => t.condition_id);
    let conditions: any[] = [];

    if (conditionIds.length > 0) {
      if (lang === 'it') {
        const { data, error } = await adminSupabase
          .from('knowledge_base')
          .select('id, condition_name, goals, clinical_tests, red_flags, typical_exercises, contraindications, evidence_level, source, source_date')
          .in('id', conditionIds);

        if (error) {
          console.error('hematology conditions fetch error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        conditions = data ?? [];
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
            typical_exercises: c.typical_exercises,
            contraindications: c.contraindications,
            evidence_level: c.evidence_level,
            source: c.source,
            source_date: c.source_date,
          }));
      }
    }

    // hematology_condition_tags.system is always 'hematology' for every row —
    // there is no sub-system split here (unlike cardiopulmonary's
    // cardiac/respiratory/mixed_systemic), so it's just carried through as-is.
    const merged = conditions.map((c) => ({
      ...c,
      system: tags?.find((t) => t.condition_id === c.id)?.system ?? 'hematology',
    }));

    return NextResponse.json({ conditions: merged });
  } catch (err) {
    console.error('hematology conditions list error:', err);
    return NextResponse.json({ error: 'Failed to load conditions' }, { status: 500 });
  }
}
