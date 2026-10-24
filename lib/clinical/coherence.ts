// Deterministic coherence checks on everything generated from a note, with
// the clinician's own words (the transcript) as the reference. Used by the
// note panel ("Coherence checks") and by the content tests. It only states
// facts it can check: a region or side that does not match, a measurement, an
// appointment or a treatment "done" that is not in the clinician's words, a
// paper whose pertinence could not be verified. Whether the reasoning is sound
// stays with the clinician; when the region of the case is not recognised it
// says so instead of reporting "no inconsistency".
import { caseSide, contradictsSide, exerciseRegions, fitsCase, normalize, pertinentTo, regionsOf, type Region } from './region'

export type IssueKind =
  | 'region_unknown' | 'district' | 'section_region' | 'side'
  | 'exercise' | 'evidence' | 'evidence_unverified' | 'protocol'
  | 'invented' | 'invented_appointment' | 'invented_treatment'
export type Issue = { kind: IssueKind; severity: 'high' | 'medium'; item: string; section?: SectionName; regions?: Region[]; caseRegions?: Region[] }

export type SectionName =
  | 'subjective' | 'objective' | 'assessment' | 'plan' | 'summaryForPatient'
  | 'hypotheses' | 'differentials' | 'supportingFindings' | 'findingsAgainst' | 'missingInformation' | 'suggestedAssessments' | 'redFlagsPrecautions'

type Reasoning = Partial<Record<'hypotheses' | 'differentials', string[] | string>> & Partial<Record<'supportingFindings' | 'findingsAgainst' | 'missingInformation' | 'suggestedAssessments' | 'redFlagsPrecautions', string>>

export type GeneratedOutput = {
  transcript: string
  note: { subjective?: string; objective?: string; assessment?: string; plan?: string; summaryForPatient?: string; primaryCondition?: string; clinicalReasoning?: Reasoning | null }
  exercises: { name: string; body_region?: string | null; primary_muscle?: string | null }[]
  papers: { title: string; relevance?: string | null; relevance_reason?: string | null }[]
  protocol: { name: string; keywords?: string | null } | null
}

const MEASURE = /(\d+(?:[.,]\d+)?)\s*(°|gradi|degrees|grados|degres|cm|mm|kg|\/\s*10|%|secondi|seconds|sec\b|ripetizioni|reps\b)/gi
const digits = (s: string) => s.replace(',', '.')

/** Numbers with a unit or a 0–10 scale written in a section but absent from the clinician's words. */
export function measuresNotInTranscript(section: string, transcript: string): string[] {
  const said = new Set(Array.from(transcript.matchAll(/\d+(?:[.,]\d+)?/g)).map((m) => digits(m[0])))
  const out: string[] = []
  for (const m of Array.from(section.matchAll(MEASURE))) {
    if (!said.has(digits(m[1]))) out.push(m[0].trim())
  }
  return Array.from(new Set(out))
}

// A fixed day, date or time is an appointment; the clinician has to have said
// it. Numeric dates are not looked for: "6/10" and "2-3" are scores and doses.
const WEEKDAYS = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
const MONTHS = 'gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre'
const DAY_OF_MONTH = new RegExp(` (\\d{1,2} (?:${MONTHS})) `, 'g')
const TIME = /\b\d{1,2}:\d{2}\b/g

/** Days, dates and times written in a section but not in the clinician's words. */
export function appointmentsNotInTranscript(section: string, transcript: string): string[] {
  const said = normalize(transcript)
  const t = normalize(section)
  const out = WEEKDAYS.filter((d) => t.includes(` ${d} `) && !said.includes(` ${d} `))
  for (const m of Array.from(t.matchAll(DAY_OF_MONTH))) if (!said.includes(` ${m[1]} `)) out.push(m[1])
  for (const m of Array.from(section.matchAll(TIME))) if (!transcript.includes(m[0])) out.push(m[0])
  return Array.from(new Set(out))
}

// A sentence saying a treatment was done ("eseguita terapia manuale") must
// name a treatment the clinician said; otherwise a proposal reads as done.
const DONE = / (eseguit[oaie]|effettuat[oaie]|svolt[oaie]|praticat[oaie]|applicat[oaie]|performed|carried out|applied|delivered|realizad[oa]s?|aplicad[oa]s?|effectuee?s?|realisee?s?|pratiquee?s?) /
const TREATMENTS = ['terapia manuale', 'manual therapy', 'terapia manual', 'therapie manuelle', 'tecar', 'laser', 'ultrasuoni', 'ultrasound', 'ultrasonidos', 'ultrasons', 'onde d urto', 'shock wave', 'shockwave', 'ondas de choque', 'ondes de choc', 'dry needling', 'taping', 'kinesio', 'bendaggio', 'massaggio', 'massage', 'masaje', 'mobilizzazion', 'mobilization', 'mobilisation', 'movilizacion', 'manipolazion', 'manipulation', 'manipulacion', 'elettrostimolazion', 'electrical stimulation', 'tens', 'crioterapia', 'cryotherapy', 'infiltrazion', 'injection']

// Word stems (any ending); the other terms are whole words ("tens" is not "tensione").
const STEMS = new Set(['mobilizzazion', 'manipolazion', 'elettrostimolazion', 'infiltrazion'])
const names = (text: string, t: string) => text.includes(STEMS.has(t) ? ` ${t}` : ` ${t} `)

/** Treatments a section presents as done that the clinician did not mention. */
export function treatmentsNotInTranscript(section: string, transcript: string): string[] {
  const said = normalize(transcript)
  const out: string[] = []
  for (const sentence of section.split(/[.;!?\n]+/)) {
    const s = normalize(sentence)
    if (!DONE.test(s)) continue
    for (const t of TREATMENTS) if (names(s, t) && !names(said, t)) out.push(t)
  }
  return Array.from(new Set(out))
}

/** Regions of today's case: what the clinician said, plus the condition named today. */
export function caseRegionsOf(transcript: string, note: GeneratedOutput['note']): Region[] {
  return Array.from(new Set([...regionsOf(transcript), ...regionsOf(`${note.primaryCondition ?? ''} ${note.assessment ?? ''}`)]))
}

const asText = (v: string[] | string | undefined | null) => (Array.isArray(v) ? v.join(' ') : v ?? '')

/** Every generated section that has text, by name. */
export function sectionsOf(note: GeneratedOutput['note']): [SectionName, string][] {
  const r = note.clinicalReasoning ?? {}
  const all: [SectionName, string][] = [
    ['subjective', note.subjective ?? ''], ['objective', note.objective ?? ''], ['assessment', note.assessment ?? ''], ['plan', note.plan ?? ''], ['summaryForPatient', note.summaryForPatient ?? ''],
    ['hypotheses', asText(r.hypotheses)], ['differentials', asText(r.differentials)], ['supportingFindings', asText(r.supportingFindings)], ['findingsAgainst', asText(r.findingsAgainst)],
    ['missingInformation', asText(r.missingInformation)], ['suggestedAssessments', asText(r.suggestedAssessments)], ['redFlagsPrecautions', asText(r.redFlagsPrecautions)],
  ]
  return all.filter(([, text]) => text.trim())
}

// Sections that state the case (where it is, what is proposed). Differentials,
// tests to consider and precautions may legitimately name other regions.
const REGION_SECTIONS: SectionName[] = ['subjective', 'objective', 'assessment', 'plan', 'summaryForPatient', 'hypotheses', 'supportingFindings']

export function checkOutput(o: GeneratedOutput): Issue[] {
  const issues: Issue[] = []
  const said = regionsOf(o.transcript)
  const condition = regionsOf(`${o.note.primaryCondition ?? ''} ${o.note.assessment ?? ''}`)
  const caseRegions = caseRegionsOf(o.transcript, o.note)
  const sections = sectionsOf(o.note)

  // 0. Without a recognised region nothing below can be judged by region: say so.
  if (caseRegions.length === 0) issues.push({ kind: 'region_unknown', severity: 'medium', item: '' })

  // 1. The condition assessed today is in a region the clinician talked about.
  if (said.length && condition.length && !fitsCase(condition, said)) {
    issues.push({ kind: 'district', severity: 'high', item: o.note.primaryCondition || o.note.assessment || '', regions: condition, caseRegions: said })
  }
  // 2. Each section: no region the clinician did not talk about (beyond the
  //    neighbours), no side opposite to the one given.
  const near = pertinentTo(said)
  const side = caseSide(o.transcript)
  for (const [name, text] of sections) {
    if (said.length && REGION_SECTIONS.includes(name)) {
      const off = regionsOf(text).filter((r) => !near.has(r))
      if (off.length) issues.push({ kind: 'section_region', severity: 'medium', item: name, section: name, regions: off, caseRegions: said })
    }
    if (contradictsSide(text, side)) issues.push({ kind: 'side', severity: 'high', item: name, section: name })
  }
  // 3. Exercises, 4. papers, 5. protocol: in the case's regions or their neighbours.
  for (const e of o.exercises) {
    const r = exerciseRegions(e)
    if (!fitsCase(r, caseRegions)) issues.push({ kind: 'exercise', severity: 'high', item: e.name, regions: r, caseRegions })
    else if (contradictsSide(e.name, side)) issues.push({ kind: 'side', severity: 'medium', item: e.name })
  }
  for (const p of o.papers) {
    if (p.relevance === 'unverified') {
      issues.push({ kind: 'evidence_unverified', severity: 'medium', item: p.title })
      continue
    }
    // Shown as indirect because it shares the mechanism: already labelled with its reason.
    if (p.relevance === 'indirect' && p.relevance_reason === 'same_mechanism_other_region') continue
    const r = regionsOf(p.title)
    if (!fitsCase(r, condition.length ? condition : caseRegions)) issues.push({ kind: 'evidence', severity: 'high', item: p.title, regions: r, caseRegions })
  }
  if (o.protocol) {
    const r = regionsOf(`${o.protocol.name} ${o.protocol.keywords ?? ''}`)
    if (!fitsCase(r, condition.length ? condition : caseRegions)) issues.push({ kind: 'protocol', severity: 'high', item: o.protocol.name, regions: r, caseRegions })
  }
  // 6. Facts must come from the clinician: measurements in the findings and
  //    assessment, fixed appointments in the plan and follow-up, treatments
  //    presented as done.
  for (const [name, text] of sections) {
    if (name === 'subjective' || name === 'objective' || name === 'assessment') {
      for (const m of measuresNotInTranscript(text, o.transcript)) issues.push({ kind: 'invented', severity: 'medium', item: m, section: name })
    }
    if (name === 'plan' || name === 'summaryForPatient') {
      for (const a of appointmentsNotInTranscript(text, o.transcript)) issues.push({ kind: 'invented_appointment', severity: 'medium', item: a, section: name })
    }
    for (const t of treatmentsNotInTranscript(text, o.transcript)) issues.push({ kind: 'invented_treatment', severity: 'high', item: t, section: name })
  }
  return issues
}
