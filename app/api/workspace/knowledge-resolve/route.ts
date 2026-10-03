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
// surfacing a knowledge object with nowhere real to "Open in PHYGO").
// Neurology CONDITIONS + TESTS were added by the 2026-09-26 audit migration
// (`neurology_condition_tags`, `neuro_tests`, href confirmed against the
// real `/dashboard/brain-map` route) — no neurology STRUCTURES table exists
// yet (brain/nerve anatomy lives in `brain_zones`/`peripheral_nerves`
// instead of a `neurology_structures` table shaped like the other 8), so
// TOPIC MODE below still can't surface a neuro "organ page" the way it can
// for the other 8 systems — only SPECIFIC MODE (a named condition/test)
// works for neurology today.
//
// Matching rule, straight from the feature spec: "If there is no strong
// match: DO NOTHING. Silence is better than a wrong suggestion." — matches
// require a whole-word-phrase overlap of at least MIN_MATCH_CHARS between the
// selection and a candidate's name/keywords, in either containment
// direction, never a loose substring hit.
//
// Response SHAPE then depends on which kind won, not just which single row:
//   - a STRUCTURE winning (at least as strong as the best condition/test —
//     see "TOPIC MODE" below) means the selection reads as a general
//     topic/organ/region name ("fegato", "cuore"), so the response is that
//     whole topic — anatomy + physiology (already one row) plus a LIST of
//     related conditions/tests from the same system, not a single pick.
//   - a CONDITION or TEST winning means the selection named something
//     precise, so the response stays exactly that one object ("SPECIFIC
//     MODE"), same as always.
//
// Reads use the service-role client (like /api/knowledge-lookup and
// /api/search) because all of this is shared clinical reference data, not
// user-owned rows. The route itself is still gated behind
// requireWorkspaceUser so only a signed-in Workspace user can call it.

const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const MIN_MATCH_CHARS = 4
// Only for the RISKY match direction — see matchScore below. A generic short
// word ("test", "dolore") used to be able to hijack a totally unrelated
// entry just because it happened to appear as one word inside that entry's
// longer name or keyword list. Requiring the SELECTION to clear this length
// before that direction counts removes the shortest, worst offenders (a bare
// 4-letter word) without also blocking legitimate short-but-specific terms
// like "cuore" (heart) or "rene" (kidney) — length alone can't tell those
// apart from "dolore"/"esame" at a similar or shorter length, which is what
// FRAGMENT_DENYLIST below is for; it does the precision work here, not the
// length floor.
const MIN_FRAGMENT_CHARS = 4
// Generic clinical/administrative filler words that appear inside countless
// otherwise-specific names and keyword lists ("Test della Navetta", "dolore
// vescicale cronico", …) but name nothing specific on their own — selecting
// just one of these should never surface a suggestion, no matter how long a
// candidate phrase it happens to sit inside. Deliberately short and curated
// from words that actually caused a wrong match in testing (see the route's
// top comment), not a guess at every possible generic word — extend this
// list if testing turns up another one, rather than trying to enumerate
// every generic term up front.
const FRAGMENT_DENYLIST = new Set([
  'test', 'tests', 'esame', 'esami', 'dolore', 'dolori', 'terapia', 'terapie',
  'trattamento', 'trattamenti', 'valutazione', 'valutazioni', 'sintomo', 'sintomi',
  'paziente', 'pazienti', 'cura', 'cure', 'patologia', 'patologie', 'malattia',
  'malattie', 'sindrome', 'condizione', 'condizioni', 'procedura', 'procedure',
  'intervento', 'interventi', 'pain', 'symptom', 'symptoms', 'treatment', 'therapy',
])
// How long fetched reference data (knowledge_base + all structure/test
// tables — ~500 rows, static clinical content that changes only when the
// team edits the Library, never per-request) stays cached in this server
// process before the next request re-fetches it. Selecting text used to
// re-run all 17 of these Supabase reads on EVERY click, which is why a cold
// request took ~4s and even a warm one was 600ms-1.3s; within the TTL a
// request is a pure in-memory scan instead.
const CACHE_TTL_MS = 10 * 60 * 1000

// Condition → system lookup, mirrors /api/search's own pushConditions calls.
const CONDITION_SYSTEM_TABLES: { table: string; system: string }[] = [
  { table: 'cardiopulmonary_condition_tags', system: 'cardiopulmonary' },
  // Was `oncology_conditions` (a standalone table with NO `condition_id`
  // column at all — the `.select('condition_id, system')` below silently
  // errored on every request and got swallowed by `?? []`, so oncology's 18
  // conditions were never actually tagged/reachable here). Fixed by the
  // 2026-09-26 audit migration: oncology's 18 conditions were copied into
  // `knowledge_base` itself and tagged via this new join table, mirroring
  // every other system instead of living in isolation.
  { table: 'oncology_condition_tags', system: 'oncology' },
  { table: 'pelvic_floor_condition_tags', system: 'pelvic-floor' },
  { table: 'endocrine_condition_tags', system: 'endocrine' },
  { table: 'urinary_condition_tags', system: 'urinary' },
  { table: 'gastrointestinal_condition_tags', system: 'gastrointestinal' },
  { table: 'immune_condition_tags', system: 'immune' },
  { table: 'hematology_condition_tags', system: 'hematology' },
  // Added by the 2026-09-26 audit migration — closes the gap this file's own
  // top comment used to flag ("no neuro_condition_tags-style join table
  // exists"). Mirrors the other 7 systems' pattern exactly.
  { table: 'neurology_condition_tags', system: 'neurology' },
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
  // neuro_tests has the identical (id, name, category, procedure,
  // interpretation) shape as the other 8 — safe to include as-is.
  { table: 'neuro_tests', system: 'neurology' },
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
  neurology: '/dashboard/brain-map',
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Whole-word-phrase containment, padding both sides with spaces so a match
// can't land mid-word (e.g. "hip" must not match inside "chip") — but unlike
// the old phraseOverlap, the two directions are no longer treated as
// equally trustworthy, which is what let generic words hijack unrelated
// entries (see MIN_FRAGMENT_CHARS above for the concrete cases this fixes:
// "test" → an unrelated named test, "dolore" → an unrelated pain syndrome,
// "BPCO" → a different condition's complication note that merely happens to
// mention it):
//
//   - EXACT match (the whole selection equals the whole candidate term) is
//     always the strongest signal and wins outright, e.g. selecting exactly
//     "BPCO" against a candidate whose OWN name/keyword is exactly "BPCO".
//   - selection CONTAINS candidate (the student highlighted a passage that
//     names a specific full term, e.g. "...il paziente presenta BPCO in fase
//     acuta...") is the safe, intended direction — a real, deliberately
//     chosen term appearing in what was selected. Kept at MIN_MATCH_CHARS.
//   - candidate CONTAINS selection (the selection is only a FRAGMENT of some
//     other entry's longer keyword phrase, e.g. selection "bpco" sitting
//     inside keyword "riacutizzazione bpco" on a DIFFERENT condition) is the
//     risky direction: a short, possibly-generic selection coincidentally
//     matching part of someone else's keyword. Only counts past the higher
//     MIN_FRAGMENT_CHARS bar, so an exact "BPCO" now correctly resolves to
//     the dedicated BPCO entry (exact match, next bullet) instead of that
//     unrelated fragment hit, and bare short/common words stop matching
//     anything at all — "silence is better than a wrong suggestion".
function matchScore(selectionNorm: string, candidateNorm: string): number {
  if (!selectionNorm || !candidateNorm) return 0
  if (selectionNorm === candidateNorm) return 100_000 + candidateNorm.length
  const paddedSelection = ` ${selectionNorm} `
  const paddedCandidate = ` ${candidateNorm} `
  if (candidateNorm.length >= MIN_MATCH_CHARS && paddedSelection.includes(` ${candidateNorm} `)) {
    return candidateNorm.length
  }
  if (
    selectionNorm.length >= MIN_FRAGMENT_CHARS &&
    !FRAGMENT_DENYLIST.has(selectionNorm) &&
    paddedCandidate.includes(` ${selectionNorm} `)
  ) {
    return selectionNorm.length
  }
  return 0
}

// Static clinical reference data — see CACHE_TTL_MS above for why this is
// cached rather than re-fetched from Supabase on every text selection.
// `conditionSystem` folds in what used to be a SEPARATE 8-query lookup run
// again on every single request that matched a condition (to find its
// "system", for the category/href shown in the panel) — same static data,
// so it's fetched once here alongside everything else instead.
let cachedData: { kb: any[]; structures: any[][]; tests: any[][]; conditionSystem: Map<string, string>; fetchedAt: number } | null = null

async function loadData() {
  if (cachedData && Date.now() - cachedData.fetchedAt < CACHE_TTL_MS) return cachedData

  const [kbRes, structureResults, testResults, systemResults] = await Promise.all([
    adminSupabase.from('knowledge_base').select('*'),
    Promise.all(STRUCTURE_TABLES.map((t) => adminSupabase.from(t.table).select('id, name, category, anatomy, function, clinical_relevance'))),
    Promise.all(TEST_TABLES.map((t) => adminSupabase.from(t.table).select('id, name, category, procedure, interpretation'))),
    Promise.all(CONDITION_SYSTEM_TABLES.map(({ table }) => adminSupabase.from(table).select('condition_id, system'))),
  ])

  const conditionSystem = new Map<string, string>()
  for (const res of systemResults) {
    for (const row of res.data ?? []) {
      // First system tagged for a given condition wins, matching the old
      // per-request lookup's own tie-break (CONDITION_SYSTEM_TABLES order,
      // first non-null hit).
      if (row.condition_id != null && !conditionSystem.has(String(row.condition_id)) && row.system) {
        conditionSystem.set(String(row.condition_id), row.system)
      }
    }
  }

  cachedData = {
    kb: kbRes.data ?? [],
    structures: structureResults.map((r) => r.data ?? []),
    tests: testResults.map((r) => r.data ?? []),
    conditionSystem,
    fetchedAt: Date.now(),
  }
  return cachedData
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

type ScoredMatch = { row: any; system: string | null; score: number }

// Builds the candidate name/keyword list for ONE knowledge_base condition
// row, across every stored language — shared by the main condition scan and
// the "related conditions" scan below so the two can never drift apart.
function conditionCandidates(row: any): string[] {
  const candidates: string[] = [row.condition_name]
  if (row.condition_keywords) candidates.push(...String(row.condition_keywords).split(','))
  if (row.translations && typeof row.translations === 'object') {
    for (const translated of Object.values(row.translations) as any[]) {
      if (translated?.condition_name) candidates.push(translated.condition_name)
      if (translated?.condition_keywords) candidates.push(...String(translated.condition_keywords).split(','))
    }
  }
  return candidates
}

function localizeCondition(row: any, lang: string) {
  return lang !== 'it' && row.translations?.[lang] ? { ...row, ...row.translations[lang] } : row
}

export async function GET(req: NextRequest) {
  const { unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const rawText = req.nextUrl.searchParams.get('text') || ''
  const lang = req.nextUrl.searchParams.get('lang') || 'it'
  const selection = normalize(rawText).slice(0, 400) // a whole-paragraph selection shouldn't blow up matching

  if (selection.length < MIN_MATCH_CHARS) return NextResponse.json({ match: null })

  const { kb, structures: structureResults, tests: testResults, conditionSystem } = await loadData()

  // Track the single best CONDITION, STRUCTURE and TEST separately (instead
  // of one running winner across all three) so a structure's score can be
  // compared against a condition's/test's score to decide the RESPONSE
  // SHAPE below, rather than always collapsing to one flat "whichever
  // scored highest, evaluated-order breaks ties" pick — see the topic-mode
  // comment below for why.
  let bestCondition: ScoredMatch | null = null
  let bestStructure: ScoredMatch | null = null
  let bestTest: ScoredMatch | null = null

  for (const row of kb) {
    for (const candidate of conditionCandidates(row)) {
      const score = matchScore(selection, normalize(candidate))
      if (score > 0 && (!bestCondition || score > bestCondition.score)) bestCondition = { row, system: null, score }
    }
  }

  STRUCTURE_TABLES.forEach((t, i) => {
    for (const row of structureResults[i] ?? []) {
      const score = matchScore(selection, normalize(row.name))
      if (score > 0 && (!bestStructure || score > bestStructure.score)) bestStructure = { row, system: t.system, score }
    }
  })

  TEST_TABLES.forEach((t, i) => {
    for (const row of testResults[i] ?? []) {
      const score = matchScore(selection, normalize(row.name))
      if (score > 0 && (!bestTest || score > bestTest.score)) bestTest = { row, system: t.system, score }
    }
  })

  if (!bestCondition && !bestStructure && !bestTest) return NextResponse.json({ match: null })

  // TOPIC MODE — a `*_structures` row IS, by construction, the "this whole
  // organ/region" entry for its system (e.g. "Fegato e Metabolismo Epatico",
  // "Anatomia del Cuore"), already carrying anatomy + function together on
  // one row. When a structure is the STRONGEST (or only) signal — i.e. the
  // selection reads as a general topic/organ name rather than a specific
  // clinical term — answer with that whole topic: anatomy, physiology, AND
  // a list of related conditions/tests from the same system, instead of
  // silently picking one of them as if it were "the" answer. A specific
  // clinical term (a named condition, syndrome, or test) still scores
  // higher than a bare organ name via the exact-match tier, so it keeps
  // going through SPECIFIC MODE below untouched.
  const structureMatch = bestStructure
  const structureIsTopic =
    structureMatch && (!bestCondition || structureMatch.score >= bestCondition.score) && (!bestTest || structureMatch.score >= bestTest.score)

  if (structureIsTopic && structureMatch) {
    const row = structureMatch.row
    const system = structureMatch.system

    // Related conditions: every OTHER condition tagged to the same system
    // that matches the selection at all (either direction), not just the
    // single top scorer — presented as a candidate LIST rather than one
    // confident pick is exactly what keeps this safe: a list invites the
    // student's own judgment, whereas a single suggestion implies
    // certainty. This is the same matchScore used everywhere else, just no
    // longer collapsed to a single winner.
    const relatedConditionMatches: { knowledgeId: string; title: string; score: number }[] = []
    for (const kbRow of kb) {
      if (conditionSystem.get(String(kbRow.id)) !== system) continue
      let rowScore = 0
      for (const candidate of conditionCandidates(kbRow)) rowScore = Math.max(rowScore, matchScore(selection, normalize(candidate)))
      if (rowScore > 0) {
        const finalMatch = localizeCondition(kbRow, lang)
        relatedConditionMatches.push({ knowledgeId: String(kbRow.id), title: finalMatch.condition_name as string, score: rowScore })
      }
    }
    relatedConditionMatches.sort((a, b) => b.score - a.score)

    const relatedTestMatches: { knowledgeId: string; title: string; score: number }[] = []
    TEST_TABLES.forEach((t, i) => {
      if (t.system !== system) return
      for (const testRow of testResults[i] ?? []) {
        const score = matchScore(selection, normalize(testRow.name))
        if (score > 0) relatedTestMatches.push({ knowledgeId: String(testRow.id), title: testRow.name as string, score })
      }
    })
    relatedTestMatches.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      match: {
        knowledgeType: 'structure' as const,
        knowledgeId: String(row.id),
        title: row.name as string,
        category: system,
        sectionLabel: system,
        href: system ? SYSTEM_HREF[system] ?? null : null,
        evidenceLevel: null,
        source: null,
        sections: buildSections(row, STRUCTURE_SECTION_FIELDS),
        relatedConditions: relatedConditionMatches.slice(0, 6).map(({ knowledgeId, title }) => ({ knowledgeId, title })),
        relatedTests: relatedTestMatches.slice(0, 4).map(({ knowledgeId, title }) => ({ knowledgeId, title })),
      },
    })
  }

  // SPECIFIC MODE — unchanged from before: the strongest signal names a
  // precise clinical condition or test, so answer with exactly that one
  // object, the same as always.
  const best: { kind: 'condition' | 'test' } & ScoredMatch =
    bestCondition && (!bestTest || bestCondition.score >= bestTest.score)
      ? { kind: 'condition', ...bestCondition }
      : { kind: 'test', ...(bestTest as ScoredMatch) }

  if (best.kind === 'condition') {
    const kb = best.row
    const finalMatch = localizeCondition(kb, lang)
    const category = conditionSystem.get(String(kb.id)) ?? null

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
