import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { getTranslatedCondition, type SupportedLang } from '@/lib/conditionTranslation';
import { STRUCTURE_FIELD_ORDER } from '@/lib/urinaryFields';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const lang = parseLang(new URL(request.url).searchParams.get('lang'));

    const { data: structure, error: structureError } = await adminSupabase
      .from('urinary_structures')
      .select('*')
      .eq('slug', slug)
      .single();

    if (structureError || !structure) {
      console.error('urinary structure detail error:', structureError);
      return NextResponse.json({ error: 'Structure not found' }, { status: 404 });
    }

    const { fields } = await translateContent(
      'urinary_structure',
      structure.id,
      structure,
      STRUCTURE_FIELD_ORDER,
      lang
    );
    const translatedStructure = { ...structure, ...fields };

    const { data: links, error: linksError } = await adminSupabase
      .from('urinary_conditions')
      .select('condition_id')
      .eq('structure_id', structure.id);

    if (linksError) {
      console.error('urinary structure conditions error:', linksError);
      return NextResponse.json({ error: linksError.message }, { status: 500 });
    }

    const conditionIds = (links ?? []).map((l) => l.condition_id);
    let conditions: any[] = [];

    if (conditionIds.length > 0) {
      if (lang === 'it') {
        const { data: conditionsData, error: conditionsError } = await adminSupabase
          .from('knowledge_base')
          .select('id, condition_name, goals, red_flags')
          .in('id', conditionIds);

        if (conditionsError) {
          console.error('urinary structure conditions fetch error:', conditionsError);
        } else {
          conditions = conditionsData ?? [];
        }
      } else {
        const translated = await Promise.all(
          conditionIds.map((id) => getTranslatedCondition(id, lang as SupportedLang))
        );
        conditions = translated
          .filter((c): c is NonNullable<typeof c> => c !== null)
          .map((c) => ({ id: c.id, condition_name: c.condition_name, goals: c.goals, red_flags: c.red_flags }));
      }
    }

    return NextResponse.json({ structure: translatedStructure, conditions });
  } catch (err) {
    console.error('urinary structure detail error:', err);
    return NextResponse.json({ error: 'Failed to load structure' }, { status: 500 });
  }
}
