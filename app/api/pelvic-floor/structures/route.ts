import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { STRUCTURE_FIELD_ORDER } from '@/lib/pelvicFloorFields';

export const dynamic = 'force-dynamic';

// Passing a custom `fetch` here forces every request this client makes to
// bypass Next.js's Data Cache (which otherwise silently caches the
// underlying fetch() calls made by @supabase/supabase-js, independently of
// this route's `export const dynamic = 'force-dynamic'`, and can keep
// serving a stale row set — e.g. missing newly INSERTed rows — even across
// redeploys). See Supabase's own Next.js App Router caching guidance.
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
);

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export async function GET(req: Request) {
  try {
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    const { data, error } = await adminSupabase
      .from('pelvic_floor_structures')
      .select('id, slug, name, category, anatomy, function, clinical_relevance, diagram_image, created_at, evidence_level, applies_to')
      .order('name', { ascending: true });

    if (error) {
      console.error('pelvic floor structures list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const structures = await Promise.all(
      (data ?? []).map(async (s) => {
        const { fields } = await translateContent('pelvic_floor_structure', s.id, s, STRUCTURE_FIELD_ORDER, lang);
        return { ...s, ...fields };
      })
    );

    return NextResponse.json({ structures }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err) {
    console.error('pelvic floor structures list error:', err);
    return NextResponse.json({ error: 'Failed to load structures' }, { status: 500 });
  }
}
