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

// Disturbi Diffusi del SNP: condizioni sistemiche/diffuse del sistema nervoso periferico
// (es. Guillain-Barré, CIDP, Charcot-Marie-Tooth, neuropatia da chemioterapia) che non
// sono legate a un singolo nervo nominato, quindi non passano per la tabella nerve_conditions
// (nerve_id singolo) ma per il ponte dedicato peripheral_nerve_diffuse_conditions.
export async function GET(req: Request) {
  try {
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    const { data: links, error: linksErr } = await adminSupabase
      .from('peripheral_nerve_diffuse_conditions')
      .select('condition_id');

    if (linksErr) {
      console.error('diffuse-conditions error:', linksErr);
      return NextResponse.json({ error: linksErr.message }, { status: 500 });
    }

    const conditionIds = (links || []).map((l) => l.condition_id);

    let conditions: any[] = [];
    if (conditionIds.length > 0) {
      const { data, error } = await adminSupabase
        .from('knowledge_base')
        .select(
          'id, condition_name, goals, clinical_tests, red_flags, contraindications, typical_exercises, progression_criteria, evidence_level'
        )
        .in('id', conditionIds)
        .order('condition_name', { ascending: true });

      if (error) {
        console.error('diffuse-conditions error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      conditions = data ?? [];

      if (lang !== 'it' && conditions.length > 0) {
        conditions = await Promise.all(
          conditions.map(async (c) => (await getTranslatedCondition(c.id, lang as SupportedLang)) ?? c)
        );
      }
    }

    return NextResponse.json({ conditions });
  } catch (err) {
    console.error('diffuse-conditions error:', err);
    return NextResponse.json({ error: 'Failed to load diffuse conditions' }, { status: 500 });
  }
}
