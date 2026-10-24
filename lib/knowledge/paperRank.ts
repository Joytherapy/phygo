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
import { fitsCase, regionsOf, type Region } from '../clinical/region'

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
  | { level: 'unverified'; reason: 'case_region_unknown' | 'paper_region_unknown' }

/**
 * Whether, and how, a paper is evidence for this condition. Null: not shown.
 * - direct: a search phrase (the condition) is in the title, or in the
 *   abstract of a paper whose title or abstract is about a region that fits;
 * - indirect, with its reason: same region with one of the condition's own
 *   words (title or abstract) but not this exact condition, or the same mechanism ("tendinopathy") named in
 *   the title of a paper about another region;
 * - unverified: it shares the condition's terms, but the region of the case
 *   or of the paper is not recognised, so its pertinence is not claimed;
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
  if (!fitsCase(paperRegions, regions)) return mechanismInTitle && shared ? { level: 'indirect', reason: 'same_mechanism_other_region' } : null
  if (phraseInTitle) return { level: 'direct', reason: 'same_condition' }
  if (phraseInAbstract) return { level: 'direct', reason: 'same_region' }
  return { level: 'indirect', reason: 'same_region' }
}
