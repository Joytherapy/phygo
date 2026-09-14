import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTranslatedCondition, type SupportedLang } from '@/lib/conditionTranslation';
import type { AppLang } from '@/lib/contentTranslation';

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

    // Elenco dinamico: tutti i condition_id distinti collegati a QUALSIASI nervo
    // periferico tramite nerve_conditions, invece della vecchia lista fissa di 8 id
    // (recuperata il 22/8/2026, ormai obsoleta da quando tutti e 25 i nervi sono
    // stati collegati alle rispettive patologie in una sessione successiva).
    const { data: links, error: linksErr } = await adminSupabase
      .from('nerve_conditions')
      .select('condition_id');

    if (linksErr) {
      console.error('peripheral-nerves error (links):', linksErr);
      return NextResponse.json({ error: linksErr.message }, { status: 500 });
    }

    const conditionIds = Array.from(new Set((links ?? []).map((l) => l.condition_id)));

    if (conditionIds.length === 0) {
      return NextResponse.json({ conditions: [] });
    }

    const { data, error } = await adminSupabase
      .from('knowledge_base')
      .select(
        'id, condition_name, goals, clinical_tests, red_flags, contraindications, typical_exercises, progression_criteria, evidence_level'
      )
      .in('id', conditionIds)
      .order('condition_name', { ascending: true });

    if (error) {
      console.error('peripheral-nerves error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let conditions = data ?? [];
    if (lang !== 'it' && conditions.length > 0) {
      conditions = await Promise.all(
        conditions.map(async (c) => (await getTranslatedCondition(c.id, lang as SupportedLang)) ?? c)
      );
    }

    return NextResponse.json({ conditions });
  } catch (err) {
    console.error('peripheral-nerves error:', err);
    return NextResponse.json({ error: 'Failed to load conditions' }, { status: 500 });
  }
}
