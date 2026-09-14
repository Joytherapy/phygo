import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTranslatedCondition, type SupportedLang } from '@/lib/conditionTranslation';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { NERVE_FIELD_ORDER } from '@/lib/brainMapFields';

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
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

    const { data: nerve, error: nerveErr } = await adminSupabase
      .from('peripheral_nerves')
      .select('*')
      .eq('slug', slug)
      .single();

    if (nerveErr || !nerve) {
      return NextResponse.json({ error: 'Nerve not found' }, { status: 404 });
    }

    const { data: conditionLinks } = await adminSupabase
      .from('nerve_conditions')
      .select('condition_id')
      .eq('nerve_id', nerve.id);

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

      if (lang !== 'it' && conditions.length > 0) {
        conditions = await Promise.all(
          conditions.map(async (c) => (await getTranslatedCondition(c.id, lang as SupportedLang)) ?? c)
        );
      }
    }

    let translatedNerve = nerve;
    if (lang !== 'it') {
      const { fields } = await translateContent(
        'peripheral_nerve',
        nerve.id,
        {
          name: nerve.name,
          origin: nerve.origin,
          anatomy: nerve.anatomy,
          motor_function: nerve.motor_function,
          sensory_function: nerve.sensory_function,
          compression_site: nerve.compression_site,
          clinical_sign: nerve.clinical_sign,
        },
        NERVE_FIELD_ORDER,
        lang
      );
      translatedNerve = {
        ...nerve,
        name: fields.name || nerve.name,
        origin: nerve.origin ? fields.origin || nerve.origin : nerve.origin,
        anatomy: nerve.anatomy ? fields.anatomy || nerve.anatomy : nerve.anatomy,
        motor_function: nerve.motor_function ? fields.motor_function || nerve.motor_function : nerve.motor_function,
        sensory_function: nerve.sensory_function ? fields.sensory_function || nerve.sensory_function : nerve.sensory_function,
        compression_site: nerve.compression_site ? fields.compression_site || nerve.compression_site : nerve.compression_site,
        clinical_sign: nerve.clinical_sign ? fields.clinical_sign || nerve.clinical_sign : nerve.clinical_sign,
      };
    }

    return NextResponse.json({ nerve: translatedNerve, conditions });
  } catch (err) {
    console.error('nerve detail error:', err);
    return NextResponse.json({ error: 'Failed to load nerve' }, { status: 500 });
  }
}
