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
