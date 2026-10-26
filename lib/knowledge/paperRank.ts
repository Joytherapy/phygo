// Ranking of the Science library papers for a note. Searching only for the
// whole keyword phrase ("rotator cuff tendinopathy") inside a title or
// abstract finds almost nothing; the search also uses the phrase's
// significant words, and papers are ranked: a whole phrase counts more than a
// single word, and the title more than the abstract.
//
// Ranking alone kept any paper sharing one word with the note (a shoulder note
// got "Traumatic leg pain in adolescents" because its abstract mentions
// shoulder pain). paperRelevance() decides whether a paper is shown at all:
// its title must be about a body region that fits the condition, and it must
// share the condition's own terms, not just generic words.
import { normalizeText } from './conditionMatch'
import { regionFit, regionsOf, type Region } from '../clinical/region'

const STOP = new Set(['with', 'without', 'after', 'before', 'pain', 'chronic', 'acute', 'patients', 'patient', 'therapy', 'treatment', 'syndrome', 'disorder', 'injury', 'physical', 'physiotherapy', 'rehabilitation', 'exercise', 'exercises'])
// Words that say nothing about which condition a paper is about.
const GENERIC = new Set([...Array.from(STOP), 'musculoskeletal', 'muscle', 'muscles', 'joint', 'joints', 'sport', 'sports', 'function', 'functional', 'adults', 'older', 'people', 'training', 'management', 'clinical', 'disease', 'conditions', 'condition', 'outcomes', 'program', 'programme', 'the', 'and', 'for', 'of', 'in', 'a'])
const isGeneric = (phrase: string) => phrase.split(' ').every((w) => GENERIC.has(w))

export function searchTerms(keywords: string[]): { phrases: string[]; words: string[] } {
  const phrases = Array.from(new Set(keywords.map((k) => normalizeText(k)).filter((k) => k.length >= 3 && !isGeneric(k)))).slice(0, 4)
  const words = Array.from(new Set(phrases.flatMap((p) => p.split(' ')).filter((w) => w.length >= 5 && !GENERIC.has(w)))).filter((w) => !phrases.includes(w)).slice(0, 8)
  return { phrases, words }
}

export function paperScore(paper: { title?: string | null; abstract?: string | null }, terms: { phrases: string[]; words: string[] }): number {
  const title = ` ${normalizeText(paper.title ?? '')} `
  const abstract = ` ${normalizeText(paper.abstract ?? '')} `
  let score = 0
  for (const p of terms.phrases) score += (title.includes(` ${p} `) ? 12 : 0) + (abstract.includes(` ${p} `) ? 6 : 0)
  for (const w of terms.words) score += (title.includes(` ${w} `) ? 3 : 0) + (abstract.includes(` ${w} `) ? 1 : 0)
  return score
}

export type PaperRelevance =
  | { level: 'direct'; reason: 'same_condition' | 'same_region' }
  | { level: 'indirect'; reason: 'same_region' | 'same_mechanism_other_region' }
  | { level: 'unverified'; reason: 'case_region_unknown' | 'paper_region_unknown' | 'population_or_mechanism_not_stated' | 'adjacent_region' }

/**
 * Whether, and how, a paper is evidence for this condition. Null: not shown.
 * - direct: a search phrase (the condition) is in the title, or in the
 *   abstract of a paper whose title or abstract is about a region that fits;
 * - indirect, with its reason: same region with one of the condition's own
 *   words (title or abstract) but not this exact condition, or the same mechanism ("tendinopathy") named in
 *   the title of a paper about another region;
 * - unverified: it shares the condition's terms, but the region of the case
 *   or of the paper is not recognised, or the paper is about a neighbouring
 *   region ("adjacent_region": the knee's neighbourhood includes the calf and
 *   the ankle for exercises, but an Achilles paper is not knee evidence), so
 *   its pertinence is not claimed;
 * - null: another region without a shared mechanism, or only generic words.
 * `regions` are the regions of the condition.
 */
export function paperRelevance(paper: { title?: string | null; abstract?: string | null }, terms: { phrases: string[]; words: string[] }, regions: Region[]): PaperRelevance | null {
  const title = ` ${normalizeText(paper.title ?? '')} `
  const abstract = ` ${normalizeText(paper.abstract ?? '')} `
  const phraseInTitle = terms.phrases.some((p) => title.includes(` ${p} `))
  const phraseInAbstract = terms.phrases.some((p) => abstract.includes(` ${p} `))
  const wordsInTitle = terms.words.filter((w) => title.includes(` ${w} `)).length
  const wordsInAbstract = terms.words.filter((w) => abstract.includes(` ${w} `)).length
  // Words that are about the condition itself, not about where it is.
  const mechanismInTitle = terms.words.some((w) => regionsOf(w).length === 0 && title.includes(` ${w} `))
  // Enough in common to stand without a region: the condition, or its words in the title.
  const shared = phraseInTitle || phraseInAbstract || wordsInTitle >= 2 || (wordsInTitle >= 1 && wordsInAbstract >= 1)
  if (!shared && wordsInTitle + wordsInAbstract === 0) return null

  const titleRegions = regionsOf(paper.title)
  const paperRegions = titleRegions.length ? titleRegions : regionsOf(paper.abstract)
  if (!regions.length) return shared ? { level: 'unverified', reason: 'case_region_unknown' } : null
  if (!paperRegions.length) return shared ? { level: 'unverified', reason: 'paper_region_unknown' } : null
  if (regionFit(paperRegions, regions) === 'incompatible') return mechanismInTitle && shared ? { level: 'indirect', reason: 'same_mechanism_other_region' } : null
  // "Same region" is the same region, not a neighbouring one.
  if (!paperRegions.some((r) => regions.includes(r))) {
    if (mechanismInTitle && shared) return { level: 'indirect', reason: 'same_mechanism_other_region' }
    return shared ? { level: 'unverified', reason: 'adjacent_region' } : null
  }
  if (phraseInTitle) return { level: 'direct', reason: 'same_condition' }
  if (phraseInAbstract) return { level: 'direct', reason: 'same_region' }
  return { level: 'indirect', reason: 'same_region' }
}

// A paper about a population or a mechanism ("Traumatic leg pain in
// adolescents") is evidence for a case only when the case is about it too:
// the same region is not enough. Each qualifier: the words of a title that
// state it, and what in the case (the clinician's words, the condition, the
// assessment) supports it, or the age range it implies.
const QUALIFIERS: { name: string; title: RegExp; case: RegExp; ages?: [number, number] }[] = [
  { name: 'children', title: /\b(child|children|childhood|paediatric|pediatric|infants?|kids)\b/, case: /\b(bambin[oaie]|pediatric[oaie]?|child|children|niñ[oa]s?|enfants?)\b/, ages: [0, 12] },
  { name: 'adolescents', title: /\b(adolescen\w*|youths?|teenage\w*|juvenile)\b/, case: /\b(adolescen\w*|ragazz[oaie]|teenage\w*|youths?)\b/, ages: [10, 19] },
  { name: 'older adults', title: /\b(older adults?|older people|elderly|aged \d+|geriatric)\b/, case: /\b(anzian[oaie]|elderly|geriatric\w*|older)\b/, ages: [65, 130] },
  { name: 'trauma', title: /\b(traumatic|trauma|post traumatic|fractures?|whiplash)\b/, case: /\b(traum\w*|cadut[ao]|fall|fell|fratture?|fractures?|incidente|accident\w*|contusion\w*|distorsion\w*|sprain\w*|colpo|urto|whiplash|colpo di frusta|infortun\w*)\b/ },
  { name: 'surgery', title: /\b(post ?operative|surgery|surgical|arthroplasty|reconstruction|replacement|repair)\b/, case: /\b(operat\w*|intervent\w*|chirurg\w*|surg\w*|protesi|arthroplasty|ricostruzion\w*|reconstruction|sutur\w*|repair)\b/ },
  { name: 'athletes', title: /\b(athletes?|athletic|elite|players?|runners?)\b/, case: /\b(atlet\w*|athlet\w*|sport\w*|calci\w*|corsa|corre|runners?|players?|gioca\w*|agonist\w*)\b/ },
  { name: 'pregnancy', title: /\b(pregnan\w*|postpartum|post partum|antenatal|perinatal)\b/, case: /\b(gravidanz\w*|incinta|pregnan\w*|post ?partum|parto|embarazo|grossesse)\b/ },
]

/**
 * The populations and mechanisms a paper's title is about that the case does
 * not state (an age given in the case counts for the age groups).
 */
export function unstatedQualifiers(title: string | null | undefined, caseText: string): string[] {
  const t = normalizeText(title ?? '')
  const c = normalizeText(caseText)
  const ages = Array.from(c.matchAll(/\b(\d{1,3}) ?(anni|years?|yo|ans|anos)\b/g)).map((m) => Number(m[1]))
  return QUALIFIERS.filter((q) => q.title.test(t) && !q.case.test(c) && !(q.ages && ages.some((a) => a >= q.ages![0] && a <= q.ages![1]))).map((q) => q.name)
}
