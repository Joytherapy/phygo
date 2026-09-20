import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { STRUCTURE_FIELD_ORDER } from '@/lib/immuneFields';

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
      .from('immune_structures')
      .select('id,slug,name,category,anatomy,function,clinical_relevance,diagram_image,created_at')
      .order('category', { ascending: true });

    if (error) {
      console.error('immune structures list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const structures = await Promise.all(
      (data ?? []).map(async (s) => {
        const { fields } = await translateContent('immune_structure', s.id, s, STRUCTURE_FIELD_ORDER, lang);
        return { ...s, ...fields };
      })
    );

    return NextResponse.json({ structures });
  } catch (err) {
    console.error('immune structures list error:', err);
    return NextResponse.json({ error: 'Failed to load structures' }, { status: 500 });
  }
}
