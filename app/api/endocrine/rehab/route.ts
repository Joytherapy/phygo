import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { REHAB_FIELD_ORDER } from '@/lib/endocrineFields';

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
      .from('endocrine_rehab')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('endocrine rehab list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rehab = await Promise.all(
      (data ?? []).map(async (r) => {
        const { fields } = await translateContent('endocrine_rehab', r.id, r, REHAB_FIELD_ORDER, lang);
        return { ...r, ...fields };
      })
    );

    return NextResponse.json({ rehab });
  } catch (err) {
    console.error('endocrine rehab list error:', err);
    return NextResponse.json({ error: 'Failed to load rehab protocols' }, { status: 500 });
  }
}
