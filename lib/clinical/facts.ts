// Facts in a generated note that the clinician did not give. The model is
// asked to report only what was said, but it still writes plausible exam
// findings ("ROM lombare limitato", "assenza di radicolopatia", "Neer
// positivo"), visit schedules ("ci vediamo due volte a settimana") and
// agreements that were never made. These are found deterministically, by
// concept: a finding about swelling is supported if the clinician mentioned
// swelling in any way (gonfiore, edema, versamento…), a clinical test if they
// named that test, a visit schedule if they spoke about visits.
//
// sanitizeNote() removes such statements from the parts of the note that
// report facts (findings, and the plan and patient summary for visits and
// agreements) and lists each removal with its reason, so the clinician can
// put it back. The assessment is reasoning: it is only flagged
// (lib/clinical/coherence.ts), never edited.
import { normalize } from './region'

type Group = { key: string; terms: string[] }
const group = (key: string, terms: string[]): Group => ({ key, terms })

// Examination findings, by concept (it/en/es/fr). "word*" matches any ending.
const FINDINGS: Group[] = [
  group('rom', ['rom', 'articolarita', 'escursione articolare', 'range of motion', 'range articolare', 'limitazion*', 'limitat*', 'riduzione dell*', 'riduzione del', 'mobilita ridotta', 'ridotta mobilita', 'restricted', 'limited range', 'reduced range', 'limitacion', 'restriccion', 'limitation', 'amplitude articulaire']),
  group('stiffness', ['rigidit*', 'rigido', 'rigida', 'stiff*', 'rigidez', 'raideur']),
  group('swelling', ['gonfior*', 'gonfio', 'gonfia', 'edema', 'edematos*', 'versamento', 'tumefazion*', 'swelling', 'swollen', 'effusion', 'hinchazon', 'derrame', 'gonflement', 'epanchement', 'oedeme']),
  group('radiculopathy', ['radicolopati*', 'radicolar*', 'irradiazion*', 'irradiat*', 'sciatalgi*', 'radiculopath*', 'radicular', 'radiating', 'radiculopati*', 'radiculaire']),
  group('instability', ['instabilit*', 'instabile', 'lassita', 'cedimento', 'cedimenti', 'instability', 'unstable', 'laxity', 'giving way', 'inestabilidad', 'instabilite']),
  group('neuro', ['deficit neurologic*', 'riflessi', 'riflesso', 'sensibilita', 'ipoestesi*', 'parestesi*', 'neurological', 'reflex*', 'numbness', 'tingling', 'hipoestesia', 'reflejos', 'reflexes']),
  group('strength', ['forza', 'ipostenia', 'debolezza', 'deficit di forza', 'strength', 'weakness', 'mrc', 'fuerza', 'debilidad', 'force musculaire', 'faiblesse']),
  group('atrophy', ['ipotrofi*', 'atrofi*', 'trofismo', 'atrophy', 'wasting']),
  group('crepitus', ['crepitio', 'crepitii', 'scroscio', 'crepitus']),
  group('palpation', ['palpazione', 'dolorabilita', 'tenderness', 'tender', 'palpation', 'palpacion']),
  group('gait', ['andatura', 'zoppia', 'zoppica', 'gait', 'limp*', 'cojera', 'boiterie']),
  group('bruising', ['ecchimosi', 'ematoma', 'bruising', 'hematoma', 'hematome']),
]

// Named clinical tests: a result can only come from the clinician.
const TESTS: Group[] = [
  group('neer', ['neer']), group('hawkins', ['hawkins']), group('jobe', ['jobe', 'empty can']), group('speed', ['speed test', 'test di speed']),
  group('yergason', ['yergason']), group('obrien', ['o brien', 'obrien']), group('drop arm', ['drop arm']), group('lift off', ['lift off']),
  group('belly press', ['belly press']), group('lachman', ['lachman']), group('drawer', ['cassetto anteriore', 'cassetto posteriore', 'anterior drawer', 'posterior drawer']),
  group('pivot shift', ['pivot shift']), group('mcmurray', ['mcmurray', 'mc murray']), group('thessaly', ['thessaly']), group('apley', ['apley']),
  group('valgus varus', ['stress in valgo', 'stress in varo', 'valgus stress', 'varus stress']), group('lasegue', ['lasegue', 'slr', 'straight leg raise']),
  group('slump', ['slump']), group('faber', ['faber', 'patrick']), group('fadir', ['fadir']), group('thomas', ['test di thomas', 'thomas test']),
  group('ober', ['test di ober', 'ober test']), group('trendelenburg', ['trendelenburg']), group('spurling', ['spurling']), group('ultt', ['ultt', 'ulnt']),
  group('phalen', ['phalen']), group('tinel', ['tinel']), group('finkelstein', ['finkelstein']), group('cozen', ['cozen']), group('mill', ['test di mill', 'mill test']),
  group('thompson', ['thompson', 'simmonds']), group('talar tilt', ['talar tilt']), group('kleiger', ['kleiger']), group('windlass', ['windlass']),
  group('adson', ['adson']), group('roos', ['roos']), group('gaenslen', ['gaenslen']), group('kemp', ['kemp']),
]

// Visits, follow-ups, their frequency; and agreements.
// Not "controllo" or "sessione" alone: "controllo motorio" and "sessione di esercizi" are not visits.
const VISIT_WORDS = ['sedut*', 'visit*', 'appuntament*', 'appointment*', 'rivalutazion*', 'follow up', 'followup', 'reassessment', 're assessment', 'check up', 'cita', 'citas', 'consulta', 'seance*', 'rendez vous', 'ci vediamo', 'ci rivediamo', 'ci risentiamo', 'see you', 'nos vemos', 'on se revoit', 'controllo tra', 'controllo fra', 'controllo dopo', 'prossimo controllo']
const SCHEDULE = ['settiman*', 'week*', 'mese', 'mesi', 'month*', 'giorn*', 'day*', 'semana*', 'semaine*', 'mois', 'volt*', 'times', 'prossim*', 'next', 'proxim*', 'prochain*', 'tra', 'fra', 'between', 'dopo', 'after', 'within', 'ogni', 'every', 'cada', 'chaque']
const ALWAYS_SCHEDULE = ['ci vediamo', 'ci rivediamo', 'ci risentiamo', 'see you', 'nos vemos', 'on se revoit', 'prossima seduta', 'prossimo appuntamento', 'prossimo controllo', 'prossima visita', 'next session', 'next visit', 'next appointment', 'follow up', 'followup', 'controllo tra', 'controllo fra', 'controllo dopo', 'rivalutazione tra', 'rivalutazione fra', 'rivalutazione dopo']
const AGREEMENT = ['concordat*', 'abbiamo deciso', 'abbiamo stabilito', 'abbiamo concordato', 'agreed', 'we decided', 'acordad*', 'hemos acordado', 'convenu*', 'decis* insieme']
const AGREEMENT_SAID = ['concord*', 'accordo', 'decis*', 'stabilit*', 'agree*', 'decided', 'acord*', 'convenu*']
const NUMBER_WORDS = ['una', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'dieci', 'one', 'two', 'three', 'four', 'five', 'six', 'dos', 'tres', 'cuatro', 'deux', 'trois', 'quatre']
// Hypothesis wording: a hedged sentence in the assessment is reasoning, not a finding.
const HEDGE = ['possibil*', 'probabil*', 'compatibil*', 'consider*', 'da valutare', 'da escludere', 'escluder*', 'sospett*', 'ipotes*', 'potrebbe', 'may', 'might', 'could', 'rule out', 'suggest*', 'posible', 'possible', 'evaluer', 'a valutare']

const words = (s: string) => normalize(s).trim().split(' ').filter(Boolean)
function hits(ws: string[], phrase: string): boolean {
  const pw = phrase.split(' ')
  for (let i = 0; i + pw.length <= ws.length; i++) if (pw.every((p, k) => (p.endsWith('*') ? ws[i + k].startsWith(p.slice(0, -1)) : ws[i + k] === p))) return true
  return false
}
function firstHit(ws: string[], terms: string[]): string | null {
  for (let i = 0; i < ws.length; i++) {
    for (const t of terms) {
      const pw = t.split(' ')
      if (i + pw.length <= ws.length && pw.every((p, k) => (p.endsWith('*') ? ws[i + k].startsWith(p.slice(0, -1)) : ws[i + k] === p))) return ws.slice(i, i + pw.length).join(' ')
    }
  }
  return null
}
const anyHit = (ws: string[], terms: string[]) => terms.some((t) => hits(ws, t))

export type FactKind = 'invented_finding' | 'invented_test' | 'invented_appointment' | 'invented_agreement'
export type UnsupportedFact = { kind: FactKind; item: string }

// A movement said to be reduced ("rotazione cervicale ridotta", "flexion limited") is a range-of-motion finding.
const MOVEMENT = '(flession\\w*|estension\\w*|rotazion\\w*|abduzion\\w*|adduzion\\w*|elevazion\\w*|inclinazion\\w*|mobilita|articolarita|escursione|flexion|extension|rotation|abduction|adduction|elevation|range|flexion|movilidad|mobilite)'
const REDUCED = '(ridott\\w*|limitat\\w*|reduced|limited|decreased|restricted|reducid\\w*|limitad\\w*|reduit\\w*|limite\\w*)'
const REDUCED_MOVEMENT = new RegExp(` ${MOVEMENT} (\\w+ ){0,3}${REDUCED} | ${REDUCED} (\\w+ ){0,2}${MOVEMENT} `)

/** Findings and clinical tests in a statement that the clinician did not mention, by concept. */
export function unsupportedFindings(statement: string, transcript: string): UnsupportedFact[] {
  const ws = words(statement)
  const said = words(transcript)
  const saidText = normalize(transcript)
  const out: UnsupportedFact[] = []
  for (const g of TESTS) if (anyHit(ws, g.terms) && !anyHit(said, g.terms)) out.push({ kind: 'invented_test', item: g.key })
  const rom = FINDINGS[0]
  const romSaid = anyHit(said, rom.terms) || REDUCED_MOVEMENT.test(saidText)
  for (const g of FINDINGS) {
    const hit = firstHit(ws, g.terms)
    if (hit && !(g === rom ? romSaid : anyHit(said, g.terms))) out.push({ kind: 'invented_finding', item: hit })
  }
  const reduced = normalize(statement).match(REDUCED_MOVEMENT)
  if (reduced && !romSaid && !out.some((f) => f.kind === 'invented_finding' && rom.terms.some((t) => hits(words(f.item), t)))) out.push({ kind: 'invented_finding', item: reduced[0].trim().split(' ')[0] })
  return out
}

/** Visits, follow-ups or agreements in a statement that the clinician did not mention. */
export function unsupportedArrangements(statement: string, transcript: string): UnsupportedFact[] {
  const ws = words(statement)
  const said = words(transcript)
  const out: UnsupportedFact[] = []
  const visit = firstHit(ws, ALWAYS_SCHEDULE) ?? (anyHit(ws, VISIT_WORDS) && anyHit(ws, SCHEDULE) ? firstHit(ws, VISIT_WORDS) : null)
  if (visit) {
    // Supported only if the clinician spoke about visits, and gave the same
    // numbers with the same unit ("due volte", "due settimane": "due giorni"
    // elsewhere in the transcript does not confirm "due volte a settimana").
    const saidText = ` ${said.join(' ')} `
    const numbers = ws.flatMap((w, i) => (/^\d+$/.test(w) || NUMBER_WORDS.includes(w) ? [ws[i + 1] ? `${w} ${ws[i + 1]}` : w] : []))
    if (!anyHit(said, VISIT_WORDS) || numbers.some((n) => !saidText.includes(` ${n} `))) out.push({ kind: 'invented_appointment', item: visit })
  }
  const agreed = firstHit(ws, AGREEMENT)
  if (agreed && !anyHit(said, AGREEMENT_SAID)) out.push({ kind: 'invented_agreement', item: agreed })
  return out
}

/** Whether an assessment statement is worded as a hypothesis (reasoning, not a finding). */
export const isHedged = (statement: string) => anyHit(words(statement), HEDGE)

/** Sentences of a text, keeping their punctuation. */
export const sentencesOf = (text: string) => (text.match(/[^.;!?\n]+[.;!?]*/g) ?? []).map((s) => s.trim()).filter(Boolean)

export type Removal = { section: 'subjective' | 'objective' | 'plan' | 'summaryForPatient'; text: string; kind: string; item: string }

type Note = { subjective?: string; objective?: string; plan?: string; summaryForPatient?: string; [k: string]: unknown }

/**
 * The note without the statements that report facts the clinician did not
 * give: findings, tests and measurements in the subjective and objective
 * sections, visits, follow-ups and agreements in the plan and the patient
 * summary, treatments presented as done anywhere among these. A sentence is
 * cut clause by clause (by commas), so what was said stays.
 */
export function sanitizeNote<T extends Note>(note: T, transcript: string, extra: { measures: (s: string, t: string) => string[]; treatments: (s: string, t: string) => string[]; appointments: (s: string, t: string) => string[] }): { note: T; removed: Removal[] } {
  const removed: Removal[] = []
  const out: Note = { ...note }
  const reasons = (section: Removal['section'], piece: string) => {
    const found: { kind: string; item: string }[] = []
    if (section === 'subjective' || section === 'objective') {
      found.push(...unsupportedFindings(piece, transcript))
      for (const m of extra.measures(piece, transcript)) found.push({ kind: 'invented', item: m })
    } else {
      for (const a of extra.appointments(piece, transcript)) found.push({ kind: 'invented_appointment', item: a })
      found.push(...unsupportedArrangements(piece, transcript))
    }
    for (const t of extra.treatments(piece, transcript)) found.push({ kind: 'invented_treatment', item: t })
    return found
  }
  for (const section of ['subjective', 'objective', 'plan', 'summaryForPatient'] as const) {
    const text = note[section]
    if (typeof text !== 'string' || !text.trim()) continue
    const kept: string[] = []
    for (const sentence of sentencesOf(text)) {
      const whole = reasons(section, sentence)
      if (!whole.length) {
        kept.push(sentence)
        continue
      }
      // Clause by clause, keeping the clauses that are fine.
      const end = sentence.match(/[.;!?]+$/)?.[0] ?? ''
      const clauses = sentence.replace(/[.;!?]+$/, '').split(/,\s*/)
      const good: string[] = []
      for (const clause of clauses) {
        const why = reasons(section, clause)
        if (why.length) removed.push({ section, text: clause.trim(), kind: why[0].kind, item: why[0].item })
        else good.push(clause.trim())
      }
      // A clause alone may not carry the reason (e.g. the number of a schedule): drop the sentence.
      if (good.length === clauses.length) {
        removed.push({ section, text: sentence, kind: whole[0].kind, item: whole[0].item })
        continue
      }
      if (good.length) kept.push(`${good.join(', ')}${end || '.'}`)
    }
    out[section] = kept.join(' ')
  }
  return { note: out as T, removed }
}
