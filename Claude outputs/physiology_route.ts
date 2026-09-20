import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { CONCEPT_FIELD_ORDER } from '@/lib/physiologyFields';

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
    const url = new URL(req.url);
    const lang = parseLang(url.searchParams.get('lang'));
    const system = url.searchParams.get('system'); // 'muscular' | 'neurological' | 'cellular' | null (all)

    let query = adminSupabase.from('physiology_concepts').select('*').order('sort_order', { ascending: true });
    if (system === 'muscular' || system === 'neurological' || system === 'cellular') {
      query = query.eq('system', system);
    }

    const { data, error } = await query;

    if (error) {
      console.error('physiology concepts list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const concepts = await Promise.all(
      (data ?? []).map(async (c) => {
        const { fields } = await translateContent('physiology_concept', c.id, c, CONCEPT_FIELD_ORDER, lang);
        return { ...c, ...fields };
      })
    );

    return NextResponse.json({ concepts });
  } catch (err) {
    console.error('physiology concepts list error:', err);
    return NextResponse.json({ error: 'Failed to load physiology concepts' }, { status: 500 });
  }
}
