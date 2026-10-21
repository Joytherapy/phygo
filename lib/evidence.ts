// One reading of "how strong is the evidence" for the whole app. The stored
// values are mixed (English enums, Italian words, ranges like
// "moderata-alta", free text like "High - RCTs"); they are read here into
// six tiers, each with one colour used everywhere, so the level stands out
// at a glance. The colour never replaces the words: the label is always shown.

export type EvidenceTier = 'strong' | 'moderate_high' | 'moderate' | 'low_moderate' | 'weak' | 'consensus'

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

const HIGH = '(?:high|strong|alta|alto|forte|elevat\\w*|fuerte|elevee?|fort)'
const MID = '(?:moderat\\w*|moderad\\w*|modere\\w*|media|medio|medium)'
const LOW = '(?:low|bassa|basso|baja|bajo|faible|debole|weak|limited|limitat\\w*|limitad\\w*|limitee?)'

export function evidenceTier(raw: string | null | undefined): EvidenceTier | null {
  const v = fold(raw ?? '')
  if (!v) return null
  if (new RegExp(`${MID}\\W+(?:to\\W+|a\\W+|-\\W*)?${HIGH}|${HIGH}\\W+(?:to\\W+|a\\W+)?${MID}`).test(v)) return 'moderate_high'
  if (new RegExp(`${LOW}\\W+(?:to\\W+|a\\W+)?${MID}|${MID}\\W+(?:to\\W+|a\\W+)?${LOW}`).test(v)) return 'low_moderate'
  if (/consens|expert|espert|opinion|experto|avis d/.test(v)) return 'consensus'
  if (/very low|molto bass|insufficien|muy baja|tres faible/.test(v) || new RegExp(`(^|\\W)${LOW}(\\W|$)`).test(v)) return 'weak'
  if (new RegExp(`(^|\\W)${MID}(\\W|$)`).test(v)) return 'moderate'
  if (new RegExp(`(^|\\W)${HIGH}(\\W|$)`).test(v)) return 'strong'
  return null
}

/** Background, text, ring and dot classes for each tier (light and dark themes). */
export const EVIDENCE_STYLE: Record<EvidenceTier | 'unknown', { chip: string; dot: string }> = {
  strong: { chip: 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300', dot: 'bg-emerald-500' },
  moderate_high: { chip: 'bg-teal-500/15 text-teal-700 ring-1 ring-teal-500/30 dark:text-teal-300', dot: 'bg-teal-500' },
  moderate: { chip: 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300', dot: 'bg-amber-500' },
  low_moderate: { chip: 'bg-orange-500/15 text-orange-700 ring-1 ring-orange-500/30 dark:text-orange-300', dot: 'bg-orange-500' },
  weak: { chip: 'bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/30 dark:text-rose-300', dot: 'bg-rose-500' },
  consensus: { chip: 'bg-sky-500/15 text-sky-700 ring-1 ring-sky-500/30 dark:text-sky-300', dot: 'bg-sky-500' },
  unknown: { chip: 'bg-black/5 text-ink/60 ring-1 ring-black/10 dark:bg-white/10 dark:text-white/55 dark:ring-white/15', dot: 'bg-ink/30 dark:bg-white/30' },
}

/** RGB of each tier for the PDFs. */
export const EVIDENCE_RGB: Record<EvidenceTier | 'unknown', [number, number, number]> = {
  strong: [4, 120, 87],
  moderate_high: [15, 118, 110],
  moderate: [180, 83, 9],
  low_moderate: [194, 65, 12],
  weak: [190, 18, 60],
  consensus: [3, 105, 161],
  unknown: [90, 90, 110],
}

export const EVIDENCE_LABELS: Record<'it' | 'en' | 'es' | 'fr', Record<EvidenceTier, string>> = {
  it: { strong: 'Alta', moderate_high: 'Moderata-alta', moderate: 'Moderata', low_moderate: 'Bassa-moderata', weak: 'Bassa', consensus: 'Consenso di esperti' },
  en: { strong: 'High', moderate_high: 'Moderate-high', moderate: 'Moderate', low_moderate: 'Low-moderate', weak: 'Low', consensus: 'Expert consensus' },
  es: { strong: 'Alta', moderate_high: 'Moderada-alta', moderate: 'Moderada', low_moderate: 'Baja-moderada', weak: 'Baja', consensus: 'Consenso de expertos' },
  fr: { strong: 'Élevée', moderate_high: 'Modérée à élevée', moderate: 'Modérée', low_moderate: 'Faible à modérée', weak: 'Faible', consensus: 'Consensus d’experts' },
}

/** The label shown for a stored value: the tier in the reader's language, or the value itself when it is not recognised. */
export function evidenceLabel(raw: string, lang: string): string {
  const tier = evidenceTier(raw)
  const labels = EVIDENCE_LABELS[(lang in EVIDENCE_LABELS ? lang : 'it') as keyof typeof EVIDENCE_LABELS]
  return tier ? labels[tier] : raw.trim()
}
