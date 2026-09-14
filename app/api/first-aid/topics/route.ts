import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { FIRST_AID_TOPIC_FIELD_ORDER } from '@/lib/firstAidFields';

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
      .from('first_aid_topics')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('first aid topics list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const topics = await Promise.all(
      (data ?? []).map(async (t) => {
        const { fields } = await translateContent('first_aid_topic', t.id, t, FIRST_AID_TOPIC_FIELD_ORDER, lang);
        return { ...t, ...fields };
      })
    );

    return NextResponse.json({ topics });
  } catch (err) {
    console.error('first aid topics list error:', err);
    return NextResponse.json({ error: 'Failed to load topics' }, { status: 500 });
  }
}
