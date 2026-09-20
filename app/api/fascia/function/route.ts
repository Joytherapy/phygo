import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { FUNCTION_FIELD_ORDER } from '@/lib/fasciaFields';

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
      .from('fascia_function')
      .select('id,slug,name,category,description,clinical_relevance,diagram_image,created_at')
      .order('category', { ascending: true });

    if (error) {
      console.error('fascia function list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = await Promise.all(
      (data ?? []).map(async (f) => {
        const { fields } = await translateContent('fascia_function', f.id, f, FUNCTION_FIELD_ORDER, lang);
        return { ...f, ...fields };
      })
    );

    return NextResponse.json({ items });
  } catch (err) {
    console.error('fascia function list error:', err);
    return NextResponse.json({ error: 'Failed to load function content' }, { status: 500 });
  }
}
