import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { AIRWAY_FIELD_ORDER } from '@/lib/cardiopulmonaryFields';

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
      .from('airway_clearance_techniques')
      .select('*')
      .order('technique_category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('airway clearance list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const techniques = await Promise.all(
      (data ?? []).map(async (t) => {
        const { fields } = await translateContent('airway_clearance_technique', t.id, t, AIRWAY_FIELD_ORDER, lang);
        return { ...t, ...fields };
      })
    );

    return NextResponse.json({ techniques });
  } catch (err) {
    console.error('airway clearance list error:', err);
    return NextResponse.json({ error: 'Failed to load techniques' }, { status: 500 });
  }
}
