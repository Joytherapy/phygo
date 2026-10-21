// Ranking of the Science library papers for a note. Searching only for the
// whole keyword phrase ("rotator cuff tendinopathy") inside a title or
// abstract finds almost nothing; the search also uses the phrase's
// significant words, and papers are ranked: a whole phrase counts more than a
// single word, and the title more than the abstract.
import { normalizeText } from './conditionMatch'

const STOP = new Set(['with', 'without', 'after', 'before', 'pain', 'chronic', 'acute', 'patients', 'patient', 'therapy', 'treatment', 'syndrome', 'disorder', 'injury', 'physical', 'physiotherapy', 'rehabilitation', 'exercise', 'exercises'])

export function searchTerms(keywords: string[]): { phrases: string[]; words: string[] } {
  const phrases = Array.from(new Set(keywords.map((k) => normalizeText(k)).filter((k) => k.length >= 3))).slice(0, 4)
  const words = Array.from(new Set(phrases.flatMap((p) => p.split(' ')).filter((w) => w.length >= 5 && !STOP.has(w)))).filter((w) => !phrases.includes(w)).slice(0, 8)
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
