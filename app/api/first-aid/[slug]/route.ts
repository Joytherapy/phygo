import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const { data: topic, error: topicError } = await adminSupabase
      .from('first_aid_topics')
      .select('*')
      .eq('slug', slug)
      .single();

    if (topicError) {
      console.error('first aid topic detail error:', topicError);
      return NextResponse.json({ error: topicError.message }, { status: 404 });
    }

    const { data: protocols, error: protocolsError } = await adminSupabase
      .from('first_aid_country_protocols')
      .select('*')
      .eq('topic_id', topic.id)
      .order('country', { ascending: true });

    if (protocolsError) {
      console.error('first aid protocols list error:', protocolsError);
      return NextResponse.json({ error: protocolsError.message }, { status: 500 });
    }

    return NextResponse.json({ topic, protocols: protocols ?? [] });
  } catch (err) {
    console.error('first aid topic detail error:', err);
    return NextResponse.json({ error: 'Failed to load topic' }, { status: 500 });
  }
}