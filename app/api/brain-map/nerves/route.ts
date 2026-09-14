import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { NERVE_FIELD_ORDER } from '@/lib/brainMapFields';

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    // select('*') here (rather than a narrow column list) so the same full
    // field set as app/api/brain-map/nerve/[slug]/route.ts is available —
    // translateContent hashes ALL of NERVE_FIELD_ORDER, so using a matching
    // field set keeps the cached translation shared between the list and
    // detail views of the same nerve instead of invalidating each other.
    const { data, error } = await adminSupabase
      .from('peripheral_nerves')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('nerves list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let nerves = data ?? [];

    if (lang !== 'it' && nerves.length > 0) {
      nerves = await Promise.all(
        nerves.map(async (n) => {
          const { fields } = await translateContent(
            'peripheral_nerve',
            n.id,
            {
              name: n.name,
              origin: n.origin,
              anatomy: n.anatomy,
              motor_function: n.motor_function,
              sensory_function: n.sensory_function,
              compression_site: n.compression_site,
              clinical_sign: n.clinical_sign,
            },
            NERVE_FIELD_ORDER,
            lang
          );
          return {
            id: n.id,
            slug: n.slug,
            region: n.region,
            name: fields.name || n.name,
            compression_site: n.compression_site ? fields.compression_site || n.compression_site : n.compression_site,
          };
        })
      );
    } else {
      nerves = nerves.map((n) => ({ id: n.id, slug: n.slug, name: n.name, region: n.region, compression_site: n.compression_site }));
    }

    return NextResponse.json({ nerves });
  } catch (err) {
    console.error('nerves list error:', err);
    return NextResponse.json({ error: 'Failed to load nerves' }, { status: 500 });
  }
}
