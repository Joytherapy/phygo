import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/lib/workspace/authServer'

// GET /api/workspace/knowledge-resolve?text=<selected text>&lang=it|en|es|fr
//
// PHYGO Smart Study Panel — resolves text the user selected inside a
// Workspace PDF to an EXISTING PHYGO knowledge object, reusing the same
// `knowledge_base` table + translations-merge pattern already established by
// /api/knowledge-lookup (SOAP-note matcher) and /api/search (general
// search) — no new knowledge content, no new knowledge table.
//
// Scope (P1 — extends the P0 conditions-only pass): matches across three
// EXISTING kinds of knowledge, all already in production tables:
//   - condition  → `knowledge_base` (unchanged from P0)
//   - structure  → the 8 per-system `*_structures` tables (anatomy/function/
//                  clinical relevance — same shape across all 8 systems)
//   - test       → the 8 per-system `*_tests` tables (procedure/interpretation)
// Deliberately NOT included: `functional_tests` (a differently-shaped,
// system-agnostic table not referenced anywhere in /api/search either, and
// with no confirmed PHYGO page it belongs to — matching it in would risk
// surfacing a knowledge object with nowhere real to "Open in PHYGO"), and
// neurology (no `neuro_condition_tags`-style join table exists the way the
// other 8 systems have one, so neuro conditions/structures aren't
// resolvable through the same generic path here without guessing a route
// that was never verified — left for a future pass rather than shipped
// unverified).
//
// Matching rule, straight from the feature spec: "If there is no strong
// match: DO NOTHING. Silence is better than a wrong suggestion." — matches
// require a whole-word-phrase overlap of at least MIN_MATCH_CHARS between the
// selection and a candidate's name/keywords, in either containment
// direction, never a loose substring hit. The single highest-scoring
// candidate across all three kinds wins; ties are broken by whichever was
// evaluated first (conditions, then structures, then tests).
//
// Reads use the service-role client (like /api/knowledge-lookup and
// /api/search) because all of this is shared clinical reference data, not
// user-owned rows. The route itself is still gated behind
// requireWorkspaceUser so only a signed-in Workspace user can call it.

const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const MIN_MATCH_CHARS = 4

// Condition → system lookup, mirrors /api/search's own pushConditions calls.
const CONDITION_SYSTEM_TABLES: { table: string; system: string }[] = [
  { table: 'cardiopulmonary_condition_tags', system: 'cardiopulmonary' },
  { table: 'oncology_conditions', system: 'oncology' },
  { table: 'pelvic_floor_condition_tags', system: 'pelvic-floor' },
  { table: 'endocrine_condition_tags', system: 'endocrine' },
  { table: 'urinary_condition_tags', system: 'urinary' },
  { table: 'gastrointestinal_condition_tags', system: 'gastrointestinal' },
  { table: 'immune_condition_tags', system: 'immune' },
  { table: 'hematology_condition_tags', system: 'hematology' },
]

// Structures and tests carry their own system directly (the table itself
// IS the system), so no join is needed for these two kinds — simpler than
// conditions, which live in one shared table tagged via a separate join.
const STRUCTURE_TABLES: { table: string; system: string }[] = [
  { table: 'cardiopulmonary_structures', system: 'cardiopulmonary' },
  { table: 'oncology_structures', system: 'oncology' },
  { table: 'pelvic_floor_structures', system: 'pelvic-floor' },
  { table: 'endocrine_structures', system: 'endocrine' },
  { table: 'urinary_structures', system: 'urinary' },
  { table: 'gastrointestinal_structures', system: 'gastrointestinal' },
  { table: 'immune_structures', system: 'immune' },
  { table: 'hematology_structures', system: 'hematology' },
]
const TEST_TABLES: { table: string; system: string }[] = [
  { table: 'cardiopulmonary_tests', system: 'cardiopulmonary' },
  { table: 'oncology_tests', system: 'oncology' },
  { table: 'pelvic_floor_tests', system: 'pelvic-floor' },
  { table: 'endocrine_tests', system: 'endocrine' },
  { table: 'urinary_tests', system: 'urinary' },
  { table: 'gastrointestinal_tests', system: 'gastrointestinal' },
  { table: 'immune_tests', system: 'immune' },
  { table: 'hematology_tests', system: 'hematology' },
]

const SYSTEM_HREF: Record<string, string> = {
  cardiopulmonary: '/dashboard/cardiopulmonary',
  oncology: '/dashboard/oncology',
  'pelvic-floor': '/dashboard/pelvic-floor',
  endocrine: '/dashboard/endocrine',
  urinary: '/dashboard/urinary',
  gastrointestinal: '/dashboard/gastrointestinal',
  immune: '/dashboard/immune',
  hematology: '/dashboard/hematology',
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Whole-word-phrase containment in either direction — padding both sides
// with spaces so a match can't land mid-word (e.g. "hip" must not match
// inside "chip"), then requiring the shorter side to still clear
// MIN_MATCH_CHARS so a stray short word can't trigger a suggestion on its own.
function phraseOverlap(a: string, b: string): number {
  if (!a || !b) return 0
  const shorter = a.length <= b.length ? a : b
  const longer = a.length <= b.length ? b : a
  if (shorter.length < MIN_MATCH_CHARS) return 0
  if (` ${longer} `.includes(` ${shorter} `)) return shorter.length
  return 0
}

const CONDITION_SECTION_FIELDS: { key: string; field: string }[] = [
  { key: 'goals', field: 'goals' },
  { key: 'clinical_tests', field: 'clinical_tests' },
  { key: 'red_flags', field: 'red_flags' },
  { key: 'typical_exercises', field: 'typical_exercises' },
  { key: 'outcome_measures', field: 'outcome_measures' },
  { key: 'progression_criteria', field: 'progression_criteria' },
  { key: 'return_to_activity_criteria', field: 'return_to_activity_criteria' },
  { key: 'contraindications', field: 'contraindications' },
]
const STRUCTURE_SECTION_FIELDS: { key: string; field: string }[] = [
  { key: 'anatomy', field: 'anatomy' },
  { key: 'function', field: 'function' },
  { key: 'clinical_relevance', field: 'clinical_relevance' },
]
const TEST_SECTION_FIELDS: { key: string; field: string }[] = [
  { key: 'procedure', field: 'procedure' },
  { key: 'interpretation', field: 'interpretation' },
]

function buildSections(row: any, fields: { key: string; field: string }[]) {
  return fields
    .map(({ key, field }) => ({ key, body: row[field] }))
    .filter((s): s is { key: string; body: string } => typeof s.body === 'string' && s.body.trim().length > 0)
}

type BestMatch = { kind: 'condition' | 'structure' | 'test'; row: any; system: string | null; score: number }

export async function GET(req: NextRequest) {
  const { unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const rawText = req.nextUrl.searchParams.get('text') || ''
  const lang = req.nextUrl.searchParams.get('lang') || 'it'
  const selection = normalize(rawText).slice(0, 400) // a whole-paragraph selection shouldn't blow up matching

  if (selection.length < MIN_MATCH_CHARS) return NextResponse.json({ match: null })

  const [kbRes, structureResults, testResults] = await Promise.all([
    adminSupabase.from('knowledge_base').select('*'),
    Promise.all(STRUCTURE_TABLES.map((t) => adminSupabase.from(t.table).select('id, name, category, anatomy, function, clinical_relevance'))),
    Promise.all(TEST_TABLES.map((t) => adminSupabase.from(t.table).select('id, name, category, procedure, interpretation'))),
  ])

  let best: BestMatch | null = null

  for (const row of kbRes.data ?? []) {
    const candidates: string[] = [row.condition_name]
    if (row.condition_keywords) candidates.push(...String(row.condition_keywords).split(','))
    const translated = row.translations?.[lang]
    if (translated?.condition_name) candidates.push(translated.condition_name)
    if (translated?.condition_keywords) candidates.push(...String(translated.condition_keywords).split(','))
    for (const candidate of candidates) {
      const score = phraseOverlap(selection, normalize(candidate))
      if (score > 0 && (!best || score > best.score)) best = { kind: 'condition', row, system: null, score }
    }
  }

  STRUCTURE_TABLES.forEach((t, i) => {
    for (const row of structureResults[i].data ?? []) {
      const score = phraseOverlap(selection, normalize(row.name))
      if (score > 0 && (!best || score > best.score)) best = { kind: 'structure', row, system: t.system, score }
    }
  })

  TEST_TABLES.forEach((t, i) => {
    for (const row of testResults[i].data ?? []) {
      const score = phraseOverlap(selection, normalize(row.name))
      if (score > 0 && (!best || score > best.score)) best = { kind: 'test', row, system: t.system, score }
    }
  })

  if (!best) return NextResponse.json({ match: null })

  if (best.kind === 'condition') {
    const kb = best.row
    const finalMatch = lang !== 'it' && kb.translations?.[lang] ? { ...kb, ...kb.translations[lang] } : kb

    const systemLookups = await Promise.all(
      CONDITION_SYSTEM_TABLES.map(({ table }) => adminSupabase.from(table).select('system').eq('condition_id', kb.id).limit(1))
    )
    let category: string | null = null
    for (let i = 0; i < systemLookups.length; i++) {
      const hit = systemLookups[i].data?.[0]
      if (hit?.system) {
        category = hit.system
        break
      }
    }

    return NextResponse.json({
      match: {
        knowledgeType: 'condition' as const,
        knowledgeId: String(kb.id),
        title: finalMatch.condition_name as string,
        category,
        sectionLabel: category,
        href: category ? SYSTEM_HREF[category] ?? null : null,
        evidenceLevel: (finalMatch.evidence_level as string | null) ?? null,
        source: (finalMatch.source as string | null) ?? null,
        sections: buildSections(finalMatch, CONDITION_SECTION_FIELDS),
      },
    })
  }

  if (best.kind === 'structure') {
    const row = best.row
    return NextResponse.json({
      match: {
        knowledgeType: 'structure' as const,
        knowledgeId: String(row.id),
        title: row.name as string,
        category: best.system,
        sectionLabel: best.system,
        href: best.system ? SYSTEM_HREF[best.system] ?? null : null,
        evidenceLevel: null,
        source: null,
        sections: buildSections(row, STRUCTURE_SECTION_FIELDS),
      },
    })
  }

  const row = best.row
  return NextResponse.json({
    match: {
      knowledgeType: 'test' as const,
      knowledgeId: String(row.id),
      title: row.name as string,
      category: best.system,
      sectionLabel: best.system,
      href: best.system ? SYSTEM_HREF[best.system] ?? null : null,
      evidenceLevel: null,
      source: null,
      sections: buildSections(row, TEST_SECTION_FIELDS),
    },
  })
}
