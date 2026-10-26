// Deterministic coherence checks on everything generated from a note, with
// the clinician's own words (the transcript) as the reference. Used by the
// note panel ("Coherence checks") and by the content tests. It only states
// facts it can check: a region or side that does not match, a measurement, an
// appointment or a treatment "done" that is not in the clinician's words, a
// paper whose pertinence could not be verified. Whether the reasoning is sound
// stays with the clinician; when the region of the case is not recognised it
// says so instead of reporting "no inconsistency", and an item whose region
// is not recognised is reported as not verified, never as pertinent.
//
// The case is today's problem as the clinician describes it (caseProfile):
// regions named only in history or as negated are not part of it, and each
// side is checked against the region it was given for.
import { analyzeMentions, caseProfile, exerciseFit, exerciseRegions, normalize, pertinentTo, regionFit, regionsOf, sideContradictions, type CaseProfile, type Region } from './region'
import { isHedged, sanitizeNote, sentencesOf, unsupportedArrangements, unsupportedFindings } from './facts'

export type IssueKind =
  | 'region_unknown' | 'district' | 'section_region' | 'history_as_active' | 'side'
  | 'exercise' | 'exercise_unverified' | 'evidence' | 'evidence_unverified' | 'protocol' | 'protocol_unverified'
  | 'invented' | 'invented_finding' | 'invented_test' | 'invented_appointment' | 'invented_agreement' | 'invented_treatment'
  | 'coverage_exercises' | 'coverage_protocol' | 'coverage_evidence' | 'objective_missing'
export type Issue = { kind: IssueKind; severity: 'high' | 'medium'; item: string; section?: SectionName; regions?: Region[]; caseRegions?: Region[] }

export type SectionName =
  | 'subjective' | 'objective' | 'assessment' | 'plan' | 'summaryForPatient'
  | 'hypotheses' | 'differentials' | 'supportingFindings' | 'findingsAgainst' | 'missingInformation' | 'suggestedAssessments' | 'redFlagsPrecautions'

type Reasoning = Partial<Record<'hypotheses' | 'differentials', string[] | string>> & Partial<Record<'supportingFindings' | 'findingsAgainst' | 'missingInformation' | 'suggestedAssessments' | 'redFlagsPrecautions', string>>

export type GeneratedOutput = {
  transcript: string
  note: { subjective?: string; objective?: string; assessment?: string; plan?: string; summaryForPatient?: string; primaryCondition?: string; clinicalReasoning?: Reasoning | null }
  /** `draft`: the exercise as the note wrote it (with its side), when matched to a database exercise. */
  exercises: { name: string; draft?: string | null; body_region?: string | null; primary_muscle?: string | null }[]
  /** `regions`: the regions of the case a paper is evidence for (/api/science/relevant). */
  papers: { title: string; relevance?: string | null; relevance_reason?: string | null; regions?: Region[] | null }[]
  protocol: { name: string; keywords?: string | null } | null
  /** Condition sheets for the other regions treated today (/api/knowledge-lookup `others`). */
  otherProtocols?: { region: Region; name: string | null }[]
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

/**
 * Regions of the condition assessed today: those of the primary condition,
 * or, when it names none, of the current statements of the assessment
 * (not its history: "pregresso intervento al ginocchio").
 */
export function conditionRegionsOf(primaryCondition: string | null | undefined, assessment: string | null | undefined): Region[] {
  const primary = regionsOf(primaryCondition)
  return primary.length ? primary : caseProfile(assessment).active
}

export type CaseView = {
  profile: CaseProfile
  /** The condition's regions, as the note names them. */
  condition: Region[]
  /** Regions of today's case: the clinician's current problem(s) plus the condition, never a region they gave only as history. */
  regions: Region[]
}

export function caseOf(transcript: string, note: Pick<GeneratedOutput['note'], 'primaryCondition' | 'assessment'>): CaseView {
  const profile = caseProfile(transcript)
  const condition = conditionRegionsOf(note.primaryCondition, note.assessment)
  const historyOnly = new Set([...profile.history, ...profile.negated])
  const regions = Array.from(new Set([...profile.active, ...condition.filter((r) => !historyOnly.has(r))]))
  return { profile, condition, regions }
}

/** Active regions that are not neighbours of each other (shoulder and upper limb count once). */
export const separateRegions = (regions: Region[]) =>
  regions.filter((r, i) => !regions.slice(0, i).some((q) => pertinentTo([q]).has(r) && pertinentTo([r]).has(q)))

/**
 * Other regions treated today, beyond the condition's (e.g. the left knee in
 * a note about a right shoulder and a left knee), with their side: they need
 * their own sheet, papers and exercises.
 */
export function otherRegionsOf(view: CaseView): { region: Region; side: CaseProfile['sides'][Region] | null }[] {
  const covered = pertinentTo(view.condition.length ? view.condition : separateRegions(view.profile.active).slice(0, 1))
  return separateRegions(view.profile.active)
    .filter((r) => !covered.has(r))
    .map((region) => ({ region, side: view.profile.sides[region] ?? null }))
}

/** Regions of today's case (see caseOf). */
export const caseRegionsOf = (transcript: string, note: Pick<GeneratedOutput['note'], 'primaryCondition' | 'assessment'>) => caseOf(transcript, note).regions

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
  const { profile, condition, regions: caseRegions } = caseOf(o.transcript, o.note)
  const history = new Set(profile.history)
  const sections = sectionsOf(o.note)
  const reference = condition.filter((r) => caseRegions.includes(r)).length ? condition.filter((r) => caseRegions.includes(r)) : caseRegions
  const others = otherRegionsOf({ profile, condition, regions: caseRegions })

  // 0. Without a recognised region nothing below can be verified by region: say so.
  if (caseRegions.length === 0) issues.push({ kind: 'region_unknown', severity: 'medium', item: '' })

  // 1. The condition assessed today is in a region of today's problem, not of the history.
  if (profile.active.length && condition.length && regionFit(condition, profile.active) === 'incompatible') {
    const asHistory = condition.some((r) => history.has(r))
    issues.push({ kind: asHistory ? 'history_as_active' : 'district', severity: 'high', item: o.note.primaryCondition || o.note.assessment || '', regions: condition, caseRegions: profile.active })
  }
  // 2. Each section: its current statements stay in today's regions (or their
  //    neighbours) and keep the side given for each region.
  const near = pertinentTo(caseRegions)
  for (const [name, text] of sections) {
    if (caseRegions.length && REGION_SECTIONS.includes(name)) {
      const named = analyzeMentions(text).filter((m) => m.status === 'active').map((m) => m.region)
      const off = Array.from(new Set(named.filter((r) => !near.has(r))))
      const asHistory = off.filter((r) => history.has(r))
      const other = off.filter((r) => !history.has(r))
      if (asHistory.length) issues.push({ kind: 'history_as_active', severity: 'high', item: name, section: name, regions: asHistory, caseRegions })
      if (other.length) issues.push({ kind: 'section_region', severity: 'medium', item: name, section: name, regions: other, caseRegions })
    }
    if (sideContradictions(text, profile).length) issues.push({ kind: 'side', severity: 'high', item: name, section: name })
  }
  // 3. Exercises: compatible, general, not verified, or incompatible.
  for (const e of o.exercises) {
    const fit = exerciseFit(e, caseRegions)
    const r = exerciseRegions(e)
    if (fit === 'incompatible') issues.push({ kind: r.some((x) => history.has(x)) ? 'history_as_active' : 'exercise', severity: 'high', item: e.name, regions: r, caseRegions })
    else if (fit === 'unknown' && caseRegions.length) issues.push({ kind: 'exercise_unverified', severity: 'medium', item: e.name })
    else if (sideContradictions(`${e.draft ?? ''} ${e.name}`, profile).length) issues.push({ kind: 'side', severity: 'medium', item: e.draft || e.name })
  }
  // 4. Papers: as classified by the search (lib/knowledge/paperRank.ts), or by their title.
  for (const p of o.papers) {
    if (p.relevance === 'unverified') {
      issues.push({ kind: 'evidence_unverified', severity: 'medium', item: p.title })
      continue
    }
    if (p.relevance === 'direct' || p.relevance === 'indirect') {
      // Shown with its level and reason; only a paper of another region without one is wrong.
      if (p.relevance_reason === 'same_mechanism_other_region') continue
      // Classified by the search against the regions treated today, which it names.
      if (p.regions?.length) continue
    }
    const fit = regionFit(regionsOf(p.title), [...reference, ...others.map((x) => x.region)])
    if (fit === 'incompatible') issues.push({ kind: 'evidence', severity: 'high', item: p.title, regions: regionsOf(p.title), caseRegions })
    else if (fit === 'unknown' && !p.relevance) issues.push({ kind: 'evidence_unverified', severity: 'medium', item: p.title })
  }
  // 5. Protocol (condition sheet).
  if (o.protocol) {
    const r = regionsOf(`${o.protocol.name} ${o.protocol.keywords ?? ''}`)
    const fit = regionFit(r, reference)
    if (fit === 'incompatible') issues.push({ kind: 'protocol', severity: 'high', item: o.protocol.name, regions: r, caseRegions })
    else if (fit === 'unknown') issues.push({ kind: 'protocol_unverified', severity: 'medium', item: o.protocol.name })
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
      for (const sentence of sentencesOf(text)) {
        for (const f of unsupportedArrangements(sentence, o.transcript)) issues.push({ kind: f.kind, severity: f.kind === 'invented_agreement' ? 'high' : 'medium', item: f.item, section: name })
      }
    }
    // Findings and test results: in the findings always, in the assessment
    // when stated as fact (a hedged hypothesis is reasoning).
    if (name === 'subjective' || name === 'objective' || name === 'assessment') {
      for (const sentence of sentencesOf(text)) {
        if (name === 'assessment' && isHedged(sentence)) continue
        for (const f of unsupportedFindings(sentence, o.transcript)) issues.push({ kind: f.kind, severity: 'high', item: f.item, section: name })
      }
    }
    for (const t of treatmentsNotInTranscript(text, o.transcript)) issues.push({ kind: 'invented_treatment', severity: 'high', item: t, section: name })
  }
  // No objective findings: said plainly, not left as an empty section.
  if (!(o.note.objective ?? '').trim()) issues.push({ kind: 'objective_missing', severity: 'medium', item: 'objective', section: 'objective' })
  // 7. More than one region treated today: exercises, condition sheets and
  //    papers for each (a region next to one already covered counts as covered).
  const separate = separateRegions(profile.active)
  if (separate.length >= 2) {
    const primary = condition.length ? condition : [separate[0]]
    for (const r of separate) {
      const near = pertinentTo([r])
      if (o.exercises.length && !o.exercises.some((e) => exerciseRegions(e).some((x) => near.has(x)))) issues.push({ kind: 'coverage_exercises', severity: 'medium', item: r })
      if (pertinentTo(primary).has(r)) continue
      if (o.protocol && !(o.otherProtocols ?? []).some((p) => p.region === r && p.name)) issues.push({ kind: 'coverage_protocol', severity: 'medium', item: r })
      if (!o.papers.some((p) => p.relevance !== 'unverified' && (p.regions ?? regionsOf(p.title)).some((x) => near.has(x)))) issues.push({ kind: 'coverage_evidence', severity: 'medium', item: r })
    }
  }
  return issues
}

/**
 * The note without facts the clinician did not give (lib/clinical/facts.ts),
 * with the list of what was removed and why.
 */
export const sanitizeGeneratedNote = <T extends { subjective?: string; objective?: string; plan?: string; summaryForPatient?: string; [k: string]: unknown }>(note: T, transcript: string) =>
  sanitizeNote(note, transcript, { measures: measuresNotInTranscript, treatments: treatmentsNotInTranscript, appointments: appointmentsNotInTranscript })
