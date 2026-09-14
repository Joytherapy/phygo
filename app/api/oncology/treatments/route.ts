import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { TREATMENT_FIELD_ORDER } from '@/lib/oncologyFields';

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
      .from('oncology_treatments')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('oncology treatments list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const treatments = await Promise.all(
      (data ?? []).map(async (t) => {
        const { fields } = await translateContent('oncology_treatment', t.id, t, TREATMENT_FIELD_ORDER, lang);
        return { ...t, ...fields };
      })
    );

    return NextResponse.json({ treatments });
  } catch (err) {
    console.error('oncology treatments list error:', err);
    return NextResponse.json({ error: 'Failed to load treatments' }, { status: 500 });
  }
}
