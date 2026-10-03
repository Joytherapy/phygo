import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTranslatedConditionNames, type SupportedLang } from '@/lib/conditionTranslation';

export const dynamic = 'force-dynamic';

// Elenco completo delle ~480+ condizioni cliniche di `knowledge_base`, per la
// sezione "Patologie" del dashboard (menu Libreria). Diverso dalle pagine
// pubbliche /library/condition (SEO, senza filtri): qui serve un filtro per
// sistema, quindi oltre al nome uniamo anche a quale sistema ciascuna
// condizione è collegata, leggendo le stesse tabelle di tag già usate dalle
// pagine per-sistema del dashboard (urinary_condition_tags e le sue 8
// analoghe). Una condizione collegata solo a `body_zone_conditions` (il
// grosso di ortopedia/MSK/medicina dello sport, ~280 righe) o a nessuna
// tabella finisce nel bucket 'orthoOther' — non è un errore, è la stessa
// "quarta categoria senza nome" già segnalata nell'audit del database.
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseLang(value: string | null): SupportedLang | 'it' {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

// system_key -> tabella di tag. 'pelvic_floor' e 'oncology' seguono lo stesso
// schema (condition_id, system) delle altre 7 — vedi audit del database.
const SYSTEM_TABLES: { key: string; table: string }[] = [
  { key: 'cardiopulmonary', table: 'cardiopulmonary_condition_tags' },
  { key: 'endocrine', table: 'endocrine_condition_tags' },
  { key: 'urinary', table: 'urinary_condition_tags' },
  { key: 'gastrointestinal', table: 'gastrointestinal_condition_tags' },
  { key: 'immune', table: 'immune_condition_tags' },
  { key: 'hematology', table: 'hematology_condition_tags' },
  { key: 'pelvicFloor', table: 'pelvic_floor_condition_tags' },
  { key: 'neurology', table: 'neurology_condition_tags' },
  { key: 'oncology', table: 'oncology_condition_tags' },
];

export async function GET(req: Request) {
  try {
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    const tagResults = await Promise.all(
      SYSTEM_TABLES.map(({ table }) => adminSupabase.from(table).select('condition_id'))
    );

    const tagError = tagResults.find((r) => r.error)?.error;
    if (tagError) {
      console.error('conditions-library list error (tags):', tagError.message);
      return NextResponse.json({ error: 'Errore lettura categorie' }, { status: 500 });
    }

    // Una condizione può risultare taggata a più di un sistema (es. alcune
    // condizioni urinarie sono cross-taggate anche dal pavimento pelvico):
    // si tengono tutti i system key pertinenti, non solo il primo trovato.
    const systemsByCondition = new Map<number, Set<string>>();
    tagResults.forEach((result, i) => {
      const key = SYSTEM_TABLES[i].key;
      for (const row of result.data ?? []) {
        const set = systemsByCondition.get(row.condition_id) ?? new Set<string>();
        set.add(key);
        systemsByCondition.set(row.condition_id, set);
      }
    });

    const names =
      lang === 'it'
        ? await (async () => {
            const { data, error } = await adminSupabase
              .from('knowledge_base')
              .select('id, condition_name')
              .order('condition_name', { ascending: true });
            if (error) {
              console.error('conditions-library list error (names it):', error.message);
              return [];
            }
            return data ?? [];
          })()
        : await getTranslatedConditionNames(lang);

    const conditions = names.map((n) => {
      const systems = systemsByCondition.get(n.id);
      return {
        id: n.id,
        name: n.condition_name,
        systems: systems && systems.size > 0 ? Array.from(systems) : ['orthoOther'],
      };
    });

    conditions.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ conditions, lang });
  } catch (err) {
    console.error('conditions-library list error:', err);
    return NextResponse.json({ error: 'List failed' }, { status: 500 });
  }
}
