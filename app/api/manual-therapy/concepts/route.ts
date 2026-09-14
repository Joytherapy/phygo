import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { CONCEPT_FIELD_ORDER } from '@/lib/manualTherapyFields';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export async function GET(req: Request) {
  try {
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    const { data, error } = await adminSupabase
      .from('manual_therapy_concepts')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('manual therapy concepts list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const concepts = await Promise.all(
      (data ?? []).map(async (c) => {
        const { fields } = await translateContent('manual_therapy_concept', c.id, c, CONCEPT_FIELD_ORDER, lang);
        return { ...c, ...fields };
      })
    );

    return NextResponse.json({ concepts });
  } catch (err) {
    console.error('manual therapy concepts list error:', err);
    return NextResponse.json({ error: 'Failed to load concepts' }, { status: 500 });
  }
}
