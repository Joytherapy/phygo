// Which condition sheet of the knowledge base (knowledge_base, with its rehab
// phases) fits a note. The note's primary condition is often written in
// English (the note prompt's example is English) while the sheets' keywords
// are Italian, with the other languages in `translations`: every name and
// keyword in every language is a candidate, matched as whole words against
// both the primary condition and the assessment. Longer, more specific
// matches win; a match in the primary condition counts double.

export type KbRow = {
  id: string | number
  condition_name?: string | null
  condition_keywords?: string | null
  translations?: Record<string, { condition_name?: string | null; condition_keywords?: string | null }> | null
}

export const normalizeText = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

// Words too generic to identify a condition on their own.
const GENERIC = new Set(['dolore', 'pain', 'dolor', 'douleur', 'sindrome', 'syndrome', 'sindrome', 'test', 'lesione', 'injury', 'lesion', 'patologia', 'disease', 'disturbo', 'disorder', 'trauma', 'post', 'cronico', 'chronic', 'acuto', 'acute'])
const MIN_CHARS = 4

export function candidatesOf(row: KbRow): string[] {
  const out = [row.condition_name ?? '', ...(row.condition_keywords ?? '').split(',')]
  for (const t of Object.values(row.translations ?? {})) {
    if (!t || typeof t !== 'object') continue
    out.push(t.condition_name ?? '', ...(t.condition_keywords ?? '').split(','))
  }
  return Array.from(new Set(out.map(normalizeText).filter((c) => c.length >= MIN_CHARS && !GENERIC.has(c))))
}

export type ConditionMatch = { row: KbRow; keyword: string; score: number }

export function bestCondition(rows: KbRow[], primaryCondition: string, assessment: string): ConditionMatch | null {
  const primary = ` ${normalizeText(primaryCondition)} `
  const full = ` ${normalizeText(assessment)} `
  let best: ConditionMatch | null = null
  for (const row of rows) {
    for (const c of candidatesOf(row)) {
      const needle = ` ${c} `
      const score = primary.includes(needle) ? c.length * 2 + 1 : full.includes(needle) ? c.length : 0
      if (score > 0 && (!best || score > best.score)) best = { row, keyword: c, score }
    }
  }
  return best
}

// Words that only say where (they come from lib/clinical/region.ts) or that
// are too common to name a condition.
const COMMON = new Set(['della', 'dello', 'delle', 'degli', 'dopo', 'with', 'without', 'after', 'related', 'correlato', 'correlata'])

/**
 * Whether the clinician's own words state the condition of a sheet: one of
 * its names or keywords, in any language, or a word of its name that names a
 * condition ("tendinopatia" of "Tendinopatia della cuffia dei rotatori" in
 * "tendinopatia del sovraspinato"), when the sheet is of a region they spoke
 * about. A sheet chosen only from the model's assessment ("femororotuleo"
 * when the clinician said "dolore al ginocchio") is not stated.
 */
export function conditionStated(row: KbRow, transcript: string, regionWords: Set<string>, sameRegion: boolean): boolean {
  const said = ` ${normalizeText(transcript)} `
  if (candidatesOf(row).some((c) => said.includes(` ${c} `))) return true
  if (!sameRegion) return false
  const names = [row.condition_name, ...Object.values(row.translations ?? {}).map((t) => t?.condition_name)]
  const words = names.flatMap((n) => normalizeText(n ?? '').split(' ')).filter((w) => w.length >= 6 && !regionWords.has(w) && !GENERIC.has(w) && !COMMON.has(w))
  return words.some((w) => said.includes(` ${w} `))
}

/**
 * What the clinician said about the diagnosis of a sheet, apart from whether
 * the sheet matches the case: 'stated' (affirmed), 'suspected' (named only as
 * a suspicion or a hypothesis: "sospetta problematica della cuffia"), or
 * 'not_stated'. A sheet that matches the case never confirms a diagnosis.
 * `hedged`: whether a sentence is worded as a hypothesis
 * (lib/clinical/facts.ts isHedged).
 */
export function diagnosisStatus(row: KbRow, transcript: string, regionWords: Set<string>, sameRegion: boolean, hedged: (sentence: string) => boolean): 'stated' | 'suspected' | 'not_stated' {
  const sentences = transcript.split(/(?<=[.;!?])\s+|\n+/).filter((x) => x.trim())
  const naming = sentences.filter((x) => conditionStated(row, x, regionWords, sameRegion))
  if (!naming.length) return 'not_stated'
  return naming.some((x) => !hedged(x)) ? 'stated' : 'suspected'
}

// What a clinician says when only the symptom and the region are known, to
// find a regional sheet without a more specific diagnosis.
export const REGION_SYMPTOMS: Record<string, string[]> = {
  shoulder: ['dolore alla spalla', 'spalla dolorosa', 'shoulder pain', 'dolor de hombro', 'douleur d epaule'],
  elbow: ['dolore al gomito', 'elbow pain', 'dolor de codo', 'douleur du coude'],
  wrist_hand: ['dolore al polso', 'dolore alla mano', 'wrist pain', 'hand pain', 'dolor de muneca', 'douleur du poignet'],
  cervical: ['cervicalgia', 'dolore al collo', 'dolore cervicale', 'neck pain', 'dolor de cuello', 'cervicalgie'],
  thoracic: ['dorsalgia', 'dolore dorsale', 'thoracic pain', 'upper back pain', 'dorsalgie'],
  lumbar: ['lombalgia', 'mal di schiena', 'dolore lombare', 'low back pain', 'lumbalgia', 'lombalgie'],
  hip: ['dolore all anca', 'dolore d anca', 'hip pain', 'dolor de cadera', 'douleur de hanche'],
  thigh: ['dolore alla coscia', 'thigh pain'],
  knee: ['gonalgia', 'dolore al ginocchio', 'dolore di ginocchio', 'knee pain', 'dolor de rodilla', 'gonalgie', 'douleur du genou'],
  lower_leg: ['dolore al polpaccio', 'dolore alla gamba', 'calf pain', 'leg pain'],
  ankle_foot: ['dolore alla caviglia', 'dolore al piede', 'ankle pain', 'foot pain', 'dolor de tobillo', 'douleur de cheville'],
  upper_limb: ['dolore al braccio', 'arm pain'],
  lower_limb: ['dolore alla gamba', 'leg pain'],
}

const NONSPECIFIC = new Set(['aspecifico', 'aspecifica', 'nonspecific', 'non', 'specific', 'specifico', 'specifica', 'generico', 'generica', 'generic', 'inespecifico', 'inespecifica', 'specifique', 'regionale', 'regional', 'di', 'del', 'della', 'dello', 'al', 'alla', 'all', 'd', 'de', 'du'])

/**
 * Whether a sheet only names this region's pain ("Dolore di ginocchio
 * aspecifico", "Lombalgia aspecifica"), not a diagnosis ("Dolore
 * femororotuleo", "Coxartrosi"): the sheet to use when the clinician
 * described pain in the region without naming a condition.
 */
export function isRegionalSheet(row: KbRow, region: string): boolean {
  const allowed = new Set((REGION_SYMPTOMS[region] ?? []).flatMap((p) => p.split(' ')))
  const words = normalizeText(row.condition_name ?? '').split(' ').filter(Boolean)
  return allowed.size > 0 && words.length > 0 && words.some((w) => allowed.has(w)) && words.every((w) => allowed.has(w) || GENERIC.has(w) || NONSPECIFIC.has(w))
}
