import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { CONDITION_FIELD_ORDER } from '@/lib/oncologyFields';

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
      .from('oncology_conditions')
      .select('*')
      .order('system', { ascending: true });

    if (error) {
      console.error('oncology conditions list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const conditions = await Promise.all(
      (data ?? []).map(async (c) => {
        const { fields } = await translateContent('oncology_condition', c.id, c, CONDITION_FIELD_ORDER, lang);
        return { ...c, ...fields };
      })
    );

    return NextResponse.json({ conditions });
  } catch (err) {
    console.error('oncology conditions list error:', err);
    return NextResponse.json({ error: 'Failed to load conditions' }, { status: 500 });
  }
}
