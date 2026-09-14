import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { FIRST_AID_TOPIC_FIELD_ORDER, FIRST_AID_PROTOCOL_FIELD_ORDER } from '@/lib/firstAidFields';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const lang = parseLang(new URL(request.url).searchParams.get('lang'));
    const { slug } = params;

    const { data: topicRow, error: topicError } = await adminSupabase
      .from('first_aid_topics')
      .select('*')
      .eq('slug', slug)
      .single();

    if (topicError) {
      console.error('first aid topic detail error:', topicError);
      return NextResponse.json({ error: topicError.message }, { status: 404 });
    }

    const { data: protocolRows, error: protocolsError } = await adminSupabase
      .from('first_aid_country_protocols')
      .select('*')
      .eq('topic_id', topicRow.id)
      .order('country', { ascending: true });

    if (protocolsError) {
      console.error('first aid protocols list error:', protocolsError);
      return NextResponse.json({ error: protocolsError.message }, { status: 500 });
    }

    const { fields: topicFields } = await translateContent('first_aid_topic', topicRow.id, topicRow, FIRST_AID_TOPIC_FIELD_ORDER, lang);
    const topic = { ...topicRow, ...topicFields };

    const protocols = await Promise.all(
      (protocolRows ?? []).map(async (p) => {
        const { fields } = await translateContent('first_aid_protocol', p.id, p, FIRST_AID_PROTOCOL_FIELD_ORDER, lang);
        return { ...p, ...fields };
      })
    );

    return NextResponse.json({ topic, protocols });
  } catch (err) {
    console.error('first aid topic detail error:', err);
    return NextResponse.json({ error: 'Failed to load topic' }, { status: 500 });
  }
}
