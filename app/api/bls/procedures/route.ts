import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { BLS_PROCEDURE_FIELD_ORDER } from '@/lib/firstAidFields';

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
      .from('bls_procedures')
      .select('*')
      .order('procedure_category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('bls procedures list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const procedures = await Promise.all(
      (data ?? []).map(async (p) => {
        const { fields } = await translateContent('bls_procedure', p.id, p, BLS_PROCEDURE_FIELD_ORDER, lang);
        return { ...p, ...fields };
      })
    );

    return NextResponse.json({ procedures });
  } catch (err) {
    console.error('bls procedures list error:', err);
    return NextResponse.json({ error: 'Failed to load procedures' }, { status: 500 });
  }
}
