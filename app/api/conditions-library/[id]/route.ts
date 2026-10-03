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

const FIELDS =
  'id, condition_name, goals, clinical_tests, red_flags, typical_exercises, contraindications, progression_criteria, return_to_activity_criteria, outcome_measures, evidence_level, source, source_date';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Id non valido' }, { status: 400 });
    }

    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    if (lang === 'it') {
      const { data, error } = await adminSupabase.from('knowledge_base').select(FIELDS).eq('id', id).maybeSingle();
      if (error) {
        console.error('conditions-library detail error:', error.message);
        return NextResponse.json({ error: 'Errore lettura condizione' }, { status: 500 });
      }
      if (!data) return NextResponse.json({ error: 'Non trovata' }, { status: 404 });
      return NextResponse.json({ condition: data });
    }

    const translated = await getTranslatedCondition(id, lang);
    if (!translated) return NextResponse.json({ error: 'Non trovata' }, { status: 404 });
    return NextResponse.json({ condition: translated });
  } catch (err) {
    console.error('conditions-library detail error:', err);
    return NextResponse.json({ error: 'Detail failed' }, { status: 500 });
  }
}
