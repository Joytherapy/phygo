import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { TEST_FIELD_ORDER } from '@/lib/pelvicFloorFields';

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
      .from('pelvic_floor_tests')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('pelvic floor tests list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const tests = await Promise.all(
      (data ?? []).map(async (t) => {
        const { fields } = await translateContent('pelvic_floor_test', t.slug, t, TEST_FIELD_ORDER, lang);
        return { ...t, ...fields };
      })
    );

    return NextResponse.json({ tests }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err) {
    console.error('pelvic floor tests list error:', err);
    return NextResponse.json({ error: 'Failed to load tests' }, { status: 500 });
  }
}
