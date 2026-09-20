import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { SPORTS_MEDICINE_FIELD_ORDER } from '@/lib/sportsMedicineFields';

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

    const { data, error } = await adminSupabase
      .from('sports_medicine_concepts')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('sports medicine concepts list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const concepts = await Promise.all(
      (data ?? []).map(async (c) => {
        const { fields } = await translateContent('sports_medicine_concept', c.id, c, SPORTS_MEDICINE_FIELD_ORDER, lang);
        return { ...c, ...fields };
      })
    );

    return NextResponse.json({ concepts });
  } catch (err) {
    console.error('sports medicine concepts list error:', err);
    return NextResponse.json({ error: 'Failed to load sports medicine concepts' }, { status: 500 });
  }
}
