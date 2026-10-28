// Facts in a generated note that the clinician did not give. The model is
// asked to report only what was said, but it still writes plausible exam
// findings ("ROM lombare limitato", "assenza di radicolopatia", "Neer
// positivo"), visit schedules ("ci vediamo due volte a settimana") and
// agreements that were never made. These are found deterministically, by
// concept: a finding about swelling is supported if the clinician mentioned
// swelling in any way (gonfiore, edema, versamento…), a clinical test if they
// named that test, a visit schedule if they spoke about visits.
//
// The same holds for negative results: "no neurological signs", "no red
// flags", "no other acute condition" are results, and a result the clinician
// did not give is not a negative one, it is not assessed. Three things are kept
// apart: a negative the clinician stated ("nessuna irradiazione"), which
// stays; something not mentioned, which is never turned into a negative; and,
// where it matters (red flags), an explicit "not assessed".
//
// A diagnosis the clinician did not state is a hypothesis: written as a fact
// ("Condromalacia patellare al ginocchio sinistro") it is labelled as a
// hypothesis to confirm. A dose (sets, repetitions, frequency) the clinician
// did not give is a generated suggestion, labelled as such in the plan and
// told apart on each exercise (exerciseOrigin, dosingOrigin).
//
// History the clinician reported ("in anamnesi intervento al ginocchio
// sinistro, ora asintomatico") stays in the subjective section as history: if
// the draft leaves it out, it is added back in the clinician's words. It never
// becomes today's problem (lib/clinical/region.ts reads it as history).
//
// The message to the patient does not turn the AI's proposals into a
// prescription: an exercise the clinician did not do or name, a dose they did
// not give, a home programme or a demonstration they did not mention are
// taken out of it, and the patient is told that the clinician will confirm
// the home exercises.
//
// sanitizeNote() removes or labels such statements in the parts of the note
// that report facts and lists each change with its reason, so the clinician
// can undo it. In the assessment only negatives are removed and certain
// diagnoses labelled; the rest of the reasoning is flagged
// (lib/clinical/coherence.ts), never edited.
import { movesOf } from './exerciseMatch'
import { analyzeMentions, caseProfile, exerciseTextRegions, normalize, regionFit, regionsOf, REGION_WORDS } from './region'

type Group = { key: string; terms: string[] }
const group = (key: string, terms: string[]): Group => ({ key, terms })

// Examination findings, by concept (it/en/es/fr). "word*" matches any ending.
const FINDINGS: Group[] = [
  group('rom', ['rom', 'articolarita', 'escursione articolare', 'range of motion', 'range articolare', 'limitazion*', 'limitat*', 'riduzione dell*', 'riduzione del', 'mobilita ridotta', 'ridotta mobilita', 'restricted', 'limited range', 'reduced range', 'limitacion', 'restriccion', 'limitation', 'amplitude articulaire']),
  group('stiffness', ['rigidit*', 'rigido', 'rigida', 'stiff*', 'rigidez', 'raideur']),
  group('swelling', ['gonfior*', 'gonfio', 'gonfia', 'edema', 'edematos*', 'versamento', 'tumefazion*', 'swelling', 'swollen', 'effusion', 'hinchazon', 'derrame', 'gonflement', 'epanchement', 'oedeme']),
  group('radiculopathy', ['radicolopati*', 'radicolar*', 'irradiazion*', 'irradiat*', 'sciatalgi*', 'radiculopath*', 'radicular', 'radiating', 'radiculopati*', 'radiculaire']),
  group('instability', ['instabilit*', 'instabile', 'lassita', 'cedimento', 'cedimenti', 'instability', 'unstable', 'laxity', 'giving way', 'inestabilidad', 'instabilite']),
  group('neuro', ['neurolog*', 'deficit neurologic*', 'riflessi', 'riflesso', 'sensibilita', 'ipoestesi*', 'parestesi*', 'neurological', 'reflex*', 'numbness', 'tingling', 'hipoestesia', 'reflejos', 'reflexes']),
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

// What a negative statement can be about beyond the findings above.
const NEGATIVE_CONCEPTS: Group[] = [
  group('red flags', ['red flag*', 'redflag*', 'bandier* ross*', 'segn* di allarme', 'segnal* di allarme', 'segn* d allarme', 'segnal* d allarme', 'campanell* d allarme', 'warning sign*', 'serious patholog*', 'patologi* grav*', 'banderas rojas', 'signos de alarma', 'drapeaux rouges', 'signes d alerte', 'cauda equina', 'anestesia a sella', 'saddle an*', 'incontinenz*', 'incontinence', 'ritenzione urinaria', 'urinary retention', 'febbre', 'fever', 'calo ponderale', 'perdita di peso', 'weight loss']),
  group('complications', ['complicazion*', 'complicanz*', 'altr* complicazion*', 'altr* problem*', 'altr* problematic*', 'altr* sintom*', 'altro da segnalare', 'nient altro', 'nulla di rilevante', 'nulla da segnalare', 'nulla di particolare', 'complication*', 'other problem*', 'other symptom*', 'nothing else', 'complicacion*', 'otros problemas', 'otros sintomas', 'autres problemes', 'autres symptomes']),
  group('other conditions', ['altre condizioni', 'altra condizione', 'condizion* acut*', 'altre patologie', 'altra patologia', 'patologi* acut*', 'patologi* sistemic*', 'cause specifiche', 'causa specifica', 'other condition*', 'acute condition*', 'specific cause*', 'systemic', 'otras condiciones', 'otra condicion', 'autres conditions', 'autre condition']),
]
// Words that make a statement negative ("senza", "nessun", "negativo"…)…
const NEGATION = ['nessun', 'nessuna', 'nessuno', 'assenza', 'assente', 'assenti', 'senza', 'non ci sono', 'non c e', 'non si rilev*', 'non si evidenzi*', 'non si osserv*', 'non present*', 'non apparent*', 'non evident*', 'negativ*', 'esclus*', 'none', 'no', 'absence', 'absent', 'without', 'negative', 'not present', 'sin', 'ningun', 'ninguna', 'ausencia', 'ausente', 'aucun', 'aucune', 'sans', 'negatif', 'non sono stat* riportat*', 'non sono stat* rilevat*', 'non sono stat* evidenziat*', 'non sono stat* osservat*', 'non sono stat* riferit*', 'non e stat* riportat*', 'non e stat* rilevat*', 'non e stat* riferit*', 'non risult*', 'non emerg*', 'nessun altro', 'nessuna altra', 'nient altro', 'nulla di', 'niente di', 'no signs', 'no evidence', 'not reported', 'none reported', 'no other', 'nothing else', 'sin otras', 'sin otros', 'sans autre*']
// …unless it says what is still to check, or that it was not assessed. "Non
// riferito" and "not reported" are not enough: "non sono stati riportati segni
// neurologici" reads as a negative result.
const STILL_OPEN = ['da escludere', 'escluder*', 'rule out', 'da valutare', 'da indagare', 'da verificare', 'to be assessed', 'descartar', 'a exclure', 'non valutat*', 'non indagat*', 'non documentat*', 'not assessed', 'not documented', 'no evaluad*', 'non evalue*', 'da approfondire', 'to be explored', 'non documenta*', 'does not document', 'no documenta', 'ne documente pas', 'por valorar', 'a approfondir', 'considerar*', 'consider*']

// Causes, by concept: an etiology needs the clinician to have spoken of it.
// The duration of the pain ("da un mese", "persistente", "cronico") is a
// reported fact, not evidence of a cause.
const ETIOLOGIES: Group[] = [
  group('inflammatory', ['infiammator*', 'infiammazion*', 'flogos*', 'flogistic*', 'inflammat*', 'inflamator*', 'inflamacion*', 'inflammatoire*']),
  group('degenerative', ['degenerativ*', 'degenerazion*', 'degenerat*', 'degeneratif*']),
  group('infectious', ['infettiv*', 'infezion*', 'infect*', 'infeccios*', 'infeccion*', 'infectieu*']),
  group('rheumatic', ['reumatic*', 'reumatolog*', 'rheumat*', 'rhumatism*']),
  group('neuropathic', ['neuropatic*', 'neuropath*', 'neuropatico']),
  group('autoimmune', ['autoimmun*', 'autoinmun*', 'auto immun*']),
  group('metabolic', ['metabolic*', 'metabolique*']),
]
const DURATION_WORDS = ['persistent*', 'persistenz*', 'persiste*', 'cronic*', 'chronic*', 'prolungat*', 'protratt*', 'perdurant*', 'durata', 'duration', 'long standing', 'duracion', 'duree', 'persistant*']
const DURATION_SPAN = /(?:^| )(?:da|per|from|for|desde|depuis|di|of)(?: circa| piu di| oltre| about| over)? (?:un|una|uno|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|alcun[ie]|qualche|divers[ie]|a|an|one|two|three|four|five|six|several|few|\d+) ?(?:giorn\w*|settiman\w*|mes[ei]|ann[io]|days?|weeks?|months?|years?|dias?|semanas?|mes(?:es)?|anos?|jours?|semaines?|mois|ans?)(?: |$)|(?:^| )\d+ ?(?:month|week|year|day)s?(?: |$)|(?:^| )(?:one|two|three|four|five|six|un|una) ?(?:month|week|year|mese|settimana|anno)(?: |$)/

/**
 * A cause (inflammatory, degenerative, infectious…) that a statement draws
 * from the duration of the symptoms ("il dolore persistente da un mese
 * suggerisce una condizione infiammatoria") when the clinician did not speak
 * of that cause. A cause to consider or rule out is not such an inference.
 */
export function unsupportedEtiology(statement: string, transcript: string): UnsupportedFact[] {
  const ws = words(statement)
  // "La durata … da sola non indica una causa …": the opposite of an inference.
  if (anyHit(ws, STILL_OPEN) || anyHit(ws, ['da sola non', 'da solo non', 'alone does not', 'por si sola no', 'ne suffit pas'])) return []
  const text = ` ${ws.join(' ')} `
  if (!anyHit(ws, DURATION_WORDS) && !DURATION_SPAN.test(text)) return []
  const said = words(transcript)
  const out: UnsupportedFact[] = []
  for (const g of ETIOLOGIES) {
    const hit = firstHit(ws, g.terms)
    if (hit && !anyHit(said, g.terms)) out.push({ kind: 'unsupported_etiology', item: hit, concept: g.key })
  }
  return out
}

// Causes and risk factors, by concept: named as a cause of the problem
// ("potrebbe essere correlato a fattori ergonomici"), they need the clinician
// to have mentioned them.
const CAUSE_FACTORS: Group[] = [
  group('ergonomic', ['ergonomi*', 'postazion*', 'postur*', 'posture*']),
  group('activity', ['attivita fisic*', 'attivita sportiv*', 'sport*', 'allenament*', 'training', 'physical activit*', 'actividad fisica', 'activite physique', 'activites physiques']),
  group('overuse', ['sovraccaric*', 'overuse', 'overload*', 'uso eccessivo', 'movimenti ripetitiv*', 'gesti ripetitiv*', 'ripetitiv*', 'repetitive*', 'sobrecarga', 'surmenage', 'surcharge']),
  group('work', ['lavor*', 'attivita lavorativ*', 'occupazional*', 'work*', 'occupation*', 'job', 'trabajo', 'travail']),
  group('trauma', ['trauma*', 'cadut*', 'fall', 'falls', 'incident*', 'infortun*', 'injur*', 'caida', 'chute']),
  group('lifting', ['sollevament* di pes*', 'sollevare pes*', 'lifting', 'heavy lifting']),
  group('lifestyle', ['sedentari*', 'stress', 'sonno', 'sleep', 'obesit*', 'sovrappeso', 'overweight', 'fumo', 'smoking']),
]
// What makes a factor a cause in a statement.
const CAUSAL_LINK = ['correlat*', 'dovut*', 'causat*', 'legat*', 'secondari*', 'scatenat*', 'favorit*', 'attribuibil*', 'riconducibil*', 'derivant*', 'conseguenz*', 'a causa', 'per via', 'fattor*', 'related', 'due to', 'caused', 'triggered', 'secondary', 'associated with', 'attributable', 'factor*', 'relacionad*', 'debid*', 'causad*', 'lie a', 'lies a', 'du a', 'dus a']
// The clinician linking two things: the causal words, or one following the other.
const SAID_LINK = [...CAUSAL_LINK, 'dopo', 'da quando', 'in seguito', 'seguito', 'since', 'after', 'despues', 'depuis', 'apres']

/** Causes or risk factors a statement gives for the problem that the clinician did not mention. */
export function unsupportedCauses(statement: string, transcript: string): UnsupportedFact[] {
  const ws = words(statement)
  if (anyHit(ws, STILL_OPEN) || !anyHit(ws, CAUSAL_LINK)) return []
  const said = words(transcript)
  for (const g of CAUSE_FACTORS) {
    const hit = firstHit(ws, g.terms)
    if (hit && !anyHit(said, g.terms)) return [{ kind: 'unsupported_cause', item: hit, concept: 'cause' }]
  }
  return []
}

/**
 * A link a statement draws between today's problem and the history (a region
 * the clinician gave only as history: "la lombalgia potrebbe essere correlata
 * a compensi dovuti al pregresso intervento al ginocchio"), when the clinician
 * did not link them.
 */
export function historyLinks(statement: string, transcript: string): UnsupportedFact[] {
  const ws = words(statement)
  if (anyHit(ws, STILL_OPEN) || !anyHit(ws, CAUSAL_LINK)) return []
  const profile = caseProfile(transcript)
  const pastOnly = profile.history.filter((r) => !profile.active.includes(r))
  const regions = regionsOf(statement).filter((r) => pastOnly.includes(r))
  if (!regions.length && !(pastOnly.length && anyHit(ws, ['pregress*', 'anamnes*', 'in passato', 'previous surgery', 'past surgery', 'antecedent*']))) return []
  // The clinician made the link: a sentence of theirs ties the two.
  const linked = sentencesOf(transcript).some((x) => anyHit(words(x), SAID_LINK) && regionsOf(x).some((r) => pastOnly.includes(r)) && !analyzeMentions(x).every((m) => m.status !== 'active'))
  return linked ? [] : [{ kind: 'history_link', item: regions[0] ?? 'history', concept: 'history' }]
}

// Hypotheses that rest on findings of their own: without any of them in what
// the clinician said, the hypothesis has nothing to stand on, however hedged.
// The clinician's own hypothesis ("sospetta sindrome miofasciale") stays: it
// is theirs, not the model's. A mention that is negated ("esclusa una sindrome
// miofasciale", "nessun punto trigger") supports nothing.
const HYPOTHESIS_NEEDS: { key: string; terms: string[]; findings: string[] }[] = [
  { key: 'myofascial', terms: ['miofascial*', 'myofascial*', 'trigger point*', 'punti trigger', 'punto trigger'], findings: ['trigger', 'trigger point*', 'punt* trigger', 'dolorabilit*', 'palpazion*', 'contrattur*', 'tension* muscolar*', 'banderell*', 'taut band*', 'tender*', 'palpation', 'puntos gatillo', 'points gachette'] },
]
// Words that negate what follows them in a clause, or what precedes them.
const NEGATED_BEFORE = ['non', 'nessun', 'nessuna', 'nessuno', 'senza', 'assenza', 'assente', 'assenti', 'esclus*', 'negativ*', 'nega', 'no', 'not', 'without', 'absent', 'absence', 'sin', 'sans', 'aucun', 'aucune', 'ningun', 'ninguna']
const NEGATED_AFTER = ['assent*', 'negativ*', 'esclus*', 'non rilevat*', 'non presenti', 'not found', 'absent', 'ausent*', 'absents']

/** Whether the clinician said one of these, not negated (in its clause, before or right after it). */
function saidAffirmatively(transcript: string, terms: string[]): boolean {
  for (const clause of transcript.split(/[.;,!?\n]+/)) {
    const ws = words(clause)
    for (let i = 0; i < ws.length; i++) {
      const hit = terms.find((t) => { const pw = t.split(' '); return i + pw.length <= ws.length && pw.every((p, k) => (p.endsWith('*') ? ws[i + k].startsWith(p.slice(0, -1)) : ws[i + k] === p)) })
      if (!hit) continue
      const end = i + hit.split(' ').length
      if (anyHit(ws.slice(0, i), NEGATED_BEFORE) || anyHit(ws.slice(end, end + 4), NEGATED_AFTER)) continue
      return true
    }
  }
  return false
}

/**
 * Hypotheses a statement makes that the clinician's words do not support:
 * neither the findings it rests on (reported, not negated) nor the
 * clinician's own hypothesis. A mere mention of the syndrome by the model is
 * not a finding.
 */
export function unsupportedHypotheses(statement: string, transcript: string): UnsupportedFact[] {
  const ws = words(statement)
  // "Ipotesi … non sostenuta dai reperti riferiti": the opposite of proposing it.
  if (anyHit(ws, STILL_OPEN) || anyHit(ws, ['non sostenut*', 'not supported', 'no sustentad*', 'non etaye*'])) return []
  return HYPOTHESIS_NEEDS.filter((h) => anyHit(ws, h.terms) && !saidAffirmatively(transcript, h.findings) && !saidAffirmatively(transcript, h.terms)).map((h) => ({ kind: 'unsupported_hypothesis' as const, item: firstHit(ws, h.terms) ?? h.key, concept: h.key }))
}

/** Every inference of a statement that the clinician's words do not support (cause, link, hypothesis). */
export function unsupportedInferences(statement: string, transcript: string): UnsupportedFact[] {
  return [...unsupportedEtiology(statement, transcript), ...unsupportedCauses(statement, transcript), ...historyLinks(statement, transcript), ...unsupportedHypotheses(statement, transcript)]
}

// Diagnoses, by concept: named in the note as a fact, they need the clinician
// to have stated them (not only suspected). Symptom labels (lombalgia,
// cervicalgia, gonalgia, dolore) are not diagnoses.
const DIAGNOSES: Group[] = [
  group('tendinopathy', ['tendinopati*', 'tendinit*', 'tendinos*', 'tendinite', 'tendinopathy', 'tendinitis', 'tendinosis', 'tendinopathie']),
  group('chondromalacia', ['condromalaci*', 'chondromalaci*']),
  group('patellofemoral', ['femororotul*', 'femoro rotul*', 'patellofemoral', 'patello femoral', 'femoropatelar', 'femoro patellaire']),
  group('impingement', ['impingement', 'conflitto subacromiale', 'sindrome da conflitto', 'subacromial pain syndrome', 'pinzamiento', 'conflit sous acromial']),
  group('tear', ['lesion*', 'rottur*', 'lacerazion*', 'tear', 'tears', 'rupture', 'rotura', 'desgarro', 'dechirure']),
  group('capsulitis', ['capsulit*', 'spalla congelata', 'frozen shoulder']),
  group('bursitis', ['borsit*', 'bursit*']),
  group('osteoarthritis', ['artrosi', 'osteoartrosi', 'coxartrosi', 'gonartrosi', 'osteoarthritis', 'arthrosis', 'artrosis', 'arthrose', 'coxarthrose', 'gonarthrose']),
  group('disc', ['ernia', 'ernie', 'discopati*', 'protrusion*', 'disc herniation', 'herniated disc', 'hernia discal', 'hernie discale']),
  group('radicular', ['radicolopati*', 'sciatalgi*', 'lombosciatalgi*', 'cervicobrachialgi*', 'radiculopath*', 'sciatica', 'radiculopatia', 'ciatica', 'sciatique']),
  group('sprain', ['distorsion*', 'sprain', 'esguince', 'entorse']),
  group('fracture', ['frattur*', 'fracture*', 'fractura*']),
  group('epicondylitis', ['epicondilit*', 'epicondylit*', 'epitrocleit*', 'epicondylalgi*', 'gomito del tennista', 'tennis elbow']),
  group('fasciitis', ['fascit*', 'fasciit*', 'fascitis']),
  group('carpal tunnel', ['tunnel carpale', 'carpal tunnel', 'tunel carpiano', 'canal carpien']),
  group('meniscus', ['meniscopati*', 'meniscopath*']),
  group('stenosis', ['stenosi', 'stenosis', 'estenosis', 'stenose']),
  group('spondylolisthesis', ['spondilolis*', 'spondylolis*', 'espondilolis*']),
  group('dyskinesia', ['discinesi*', 'dyskinesi*', 'discinesia']),
  group('fibromyalgia', ['fibromialgi*', 'fibromyalgi*']),
  group('whiplash', ['colpo di frusta', 'whiplash', 'latigazo']),
  group('de quervain', ['de quervain']),
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
const HEDGE = ['possibil*', 'probabil*', 'compatibil*', 'consider*', 'da valutare', 'da escludere', 'escluder*', 'sospett*', 'ipotes*', 'potrebbe', 'may', 'might', 'could', 'rule out', 'suggest*', 'posible', 'possible', 'evaluer', 'a valutare', 'da confermare', 'to be confirmed', 'por confirmar', 'a confirmer', 'non confermat*', 'unconfirmed', 'not confirmed', 'hypothesis', 'hipotesis', 'hypothese', 'proposta generata', 'generated suggestion', 'sugerencia generada', 'suggestion generee']

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

export type FactKind = 'invented_finding' | 'invented_test' | 'invented_appointment' | 'invented_agreement' | 'invented_negative' | 'unsupported_etiology' | 'unsupported_cause' | 'history_link' | 'unsupported_hypothesis'
export type UnsupportedFact = { kind: FactKind; item: string; concept?: string }

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

/**
 * Negative results in a statement ("senza segni di compromissione
 * neurologica", "nessuna red flag") about something the clinician did not
 * mention at all: not a documented negative, an unassessed one. `findings`:
 * also the examination findings (for the sections where unsupportedFindings
 * does not already look for them).
 */
export function unsupportedNegatives(statement: string, transcript: string, findings = true): UnsupportedFact[] {
  const ws = words(statement)
  if (!anyHit(ws, NEGATION) || anyHit(ws, STILL_OPEN)) return []
  const said = words(transcript)
  const out: UnsupportedFact[] = []
  for (const g of [...(findings ? FINDINGS : []), ...NEGATIVE_CONCEPTS]) {
    const hit = firstHit(ws, g.terms)
    if (hit && !anyHit(said, g.terms)) out.push({ kind: 'invented_negative', item: hit, concept: g.key })
  }
  return out
}

/**
 * Diagnoses a statement names that the clinician did not state as such: not
 * said at all, or only suspected ("sospetta cuffia" does not state a
 * tendinopathy, "sospetta tendinopatia" does not state it as certain).
 */
export function unstatedDiagnoses(statement: string, transcript: string): string[] {
  const ws = words(statement)
  const firm = sentencesOf(transcript).filter((s) => !isHedged(s)).map(words)
  const out: string[] = []
  for (const g of DIAGNOSES) {
    const hit = firstHit(ws, g.terms)
    if (hit && !firm.some((f) => anyHit(f, g.terms))) out.push(hit)
  }
  return out
}

// Doses: "3x12", "3 serie", "12 ripetizioni", "10 minuti", "3 volte".
const NUMBER_WORD: Record<string, string> = { uno: '1', una: '1', due: '2', tre: '3', quattro: '4', cinque: '5', sei: '6', sette: '7', otto: '8', nove: '9', dieci: '10', dodici: '12', quindici: '15', venti: '20', trenta: '30', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', ten: '10', twelve: '12', fifteen: '15', twenty: '20', thirty: '30', dos: '2', tres: '3', cuatro: '4', cinco: '5', diez: '10', doce: '12', deux: '2', trois: '3', quatre: '4', cinq: '5', dix: '10', douze: '12' }
const UNIT: [RegExp, string][] = [
  [/^(serie|set|sets|series)$/, 'sets'], [/^(ripetizion\w*|rip|reps?|repetitions?|repeticion\w*)$/, 'reps'],
  [/^(minut\w*|min)$/, 'min'], [/^(second\w*|sec|s|segund\w*)$/, 'sec'], [/^(volt\w*|times|veces|fois)$/, 'times'],
]
/** The doses in a text, each as the forms that state it ("3x12" is "3 sets" and "12 reps"). */
function dosesOf(text: string): { text: string; forms: string[][] }[] {
  const ws = words(text).map((w) => NUMBER_WORD[w] ?? w)
  const out: { text: string; forms: string[][] }[] = []
  ws.forEach((w, i) => {
    const nxm = w.match(/^(\d+)x(\d+)$/)
    if (nxm) out.push({ text: w, forms: [[`${nxm[1]}x${nxm[2]}`], [`${nxm[1]} sets`, `${nxm[2]} reps`]] })
    else if (/^\d+$/.test(w) && ws[i + 1] === 'x' && /^\d+$/.test(ws[i + 2] ?? '')) out.push({ text: `${w}x${ws[i + 2]}`, forms: [[`${w}x${ws[i + 2]}`], [`${w} sets`, `${ws[i + 2]} reps`]] })
    else if (/^\d+$/.test(w)) {
      const unit = UNIT.find(([re]) => re.test(ws[i + 1] ?? ''))?.[1]
      if (unit) out.push({ text: `${w} ${ws[i + 1]}`, forms: [[`${w} ${unit}`]] })
    }
  })
  return out
}
/** Every form of every dose a text gives. */
function doseForms(text: string): Set<string> {
  const set = new Set<string>()
  for (const d of dosesOf(text)) for (const form of d.forms) for (const f of form) set.add(f)
  // "3x12" also says "3 sets" and "12 reps".
  for (const f of Array.from(set)) { const m = f.match(/^(\d+)x(\d+)$/); if (m) { set.add(`${m[1]} sets`); set.add(`${m[2]} reps`) } }
  return set
}
const stated = (forms: string[][], said: Set<string>) => forms.some((form) => form.every((f) => said.has(f)))

/** Doses in a statement that the clinician did not give. */
export function unstatedDosage(statement: string, transcript: string): string[] {
  const said = doseForms(transcript)
  return dosesOf(statement).filter((d) => !stated(d.forms, said)).map((d) => d.text)
}

/** Whether a structured dose (sets, reps, seconds, sessions a week) is the clinician's: null when there is none. */
export function dosingOrigin(dosing: { sets?: number | null; reps?: number | null; duration_seconds?: number | null; frequency_per_week?: number | null } | null | undefined, transcript: string): 'stated' | 'suggested' | null {
  if (!dosing) return null
  const said = doseForms(transcript)
  const need: string[][][] = []
  if (dosing.sets) need.push([[`${dosing.sets} sets`]])
  if (dosing.reps) need.push([[`${dosing.reps} reps`]])
  if (dosing.duration_seconds) need.push([[`${dosing.duration_seconds} sec`], ...(dosing.duration_seconds % 60 === 0 ? [[`${dosing.duration_seconds / 60} min`]] : [])])
  if (dosing.frequency_per_week) need.push([[`${dosing.frequency_per_week} times`]])
  if (!need.length) return null
  return need.every((forms) => stated(forms, said)) ? 'stated' : 'suggested'
}

// What an exercise named in the transcript was: done today, or named for later.
const EXERCISE_CONTEXT = ['eserciz*', 'oggi', 'fatto', 'fatti', 'fatta', 'fatte', 'abbiamo', 'eseguit*', 'svolt*', 'effettuat*', 'lavorat*', 'proseguir*', 'continu*', 'a casa', 'domicilio', 'assegnat*', 'prescritt*', 'consigliat*', 'exercise*', 'today', 'did', 'done', 'performed', 'home', 'ejercicio*', 'hoy', 'exercice*', 'aujourd hui']
const DONE = ['oggi', 'eseguit*', 'svolt*', 'effettuat*', 'fatto', 'fatti', 'fatta', 'fatte', 'abbiamo lavorato', 'today', 'performed', 'did', 'done', 'hoy', 'realizad*', 'hecho', 'aujourd hui', 'effectue*']
const LATER = ['a casa', 'domicilio', 'proseguir*', 'continuer*', 'da fare', 'prescri*', 'assegn*', 'consigli*', 'propost*', 'propon*', 'prossim*', 'at home', 'home', 'will', 'should', 'next', 'en casa', 'a la maison', 'maison']
const NOT_IDENTITY = new Set(['esercizi', 'esercizio', 'exercise', 'exercises', 'ejercicio', 'ejercicios', 'exercice', 'exercices', 'serie', 'series', 'sets', 'ripetizioni', 'reps', 'volte', 'times', 'minuti', 'minutes', 'secondi', 'seconds', 'settimana', 'week', 'giorno', 'day', 'gradi', 'degrees', 'sinistro', 'sinistra', 'destro', 'destra', 'left', 'right', 'izquierdo', 'izquierda', 'derecho', 'derecha', 'gauche', 'droit', 'droite', 'della', 'delle', 'degli', 'dello', 'with', 'avec', 'para', 'pour'])

// Tools, by concept: one exercise is written "con elastico", "con banda
// elastica", "with a theraband".
const TOOLS: Group[] = [
  group('band', ['elastic*', 'banda', 'bande', 'band', 'bands', 'theraband', 'thera band', 'tubing', 'goma', 'resistance band']),
  group('weight', ['manubri*', 'peso', 'pesi', 'pesetti', 'dumbbell*', 'weight*', 'kettlebell*', 'mancuerna*', 'haltere*']),
  group('cable', ['cavo', 'cavi', 'cable*', 'poulie']),
  group('ball', ['palla', 'pallone', 'fitball', 'ball', 'pelota', 'balle', 'ballon']),
  group('stick', ['bastone', 'bastoncino', 'stick', 'baston', 'baton']),
  group('wall', ['muro', 'parete', 'wall', 'pared', 'mur']),
  group('pulley', ['carrucola', 'pulley', 'polea']),
]
const toolsOf = (ws: string[]) => new Set(TOOLS.filter((g) => anyHit(ws, g.terms)).map((g) => g.key))
// "Oggi non abbiamo fatto esercizi": not done, and not a programme either.
const NOT_DONE = ['non abbiamo', 'non ha fatto', 'non ha eseguito', 'non eseguit*', 'non svolt*', 'non fatt*', 'senza esercizi', 'did not', 'didn t', 'not done', 'no hicimos', 'no se hizo', 'n avons pas']
// Known movements, without "mobility" (too broad to say which exercise).
const specificMoves = (text: string) => new Set(Array.from(movesOf(text)).filter((m) => m !== 'mobility'))

/**
 * Where an exercise of the note comes from: done today as the clinician said
 * ('performed'), named by them for later ('stated'), or proposed by the model
 * ('suggested'); and whether its dose is the clinician's ('stated'), the
 * model's ('suggested'), or absent (null). The two are separate: an exercise
 * done today keeps a suggested dose when the clinician gave none.
 *
 * An exercise is the clinician's when a sentence of theirs about exercises
 * names the same activity, whatever the wording: the same known movements
 * ("extrarotazione", "rotazioni esterne", "external rotation" are one
 * movement), no different tool ("banda elastica" and "theraband" are an
 * elastic, a dumbbell is not) and no other region (a hip rotation is not the
 * shoulder's). Without a known movement, its own words must be there. In
 * doubt it is the model's: another movement, another tool, another region, a
 * sentence saying it was not done.
 */
export function exerciseOrigin(draft: string, transcript: string): { origin: 'performed' | 'stated' | 'suggested'; dosage: 'stated' | 'suggested' | null } {
  const doses = dosesOf(draft)
  const dosage = doses.length ? (unstatedDosage(draft, transcript).length ? 'suggested' : 'stated') : null
  const draftMoves = specificMoves(draft)
  const draftTools = toolsOf(words(draft))
  const draftRegions = exerciseTextRegions(draft)
  const caseRegions = caseProfile(transcript).active
  const stem = (w: string) => w.slice(0, 5)
  const all = words(draft).filter((w) => w.length >= 4 && !/\d/.test(w) && !NOT_IDENTITY.has(w))
  const own = all.filter((w) => !REGION_WORDS.has(w))
  // Its own words; an exercise named only by structures ("pendolo di Codman") by those.
  const identity = own.length ? own : all
  let found: string[] | null = null
  for (const sentence of sentencesOf(transcript)) {
    const sw = words(sentence)
    if (!anyHit(sw, EXERCISE_CONTEXT) || anyHit(sw, NOT_DONE)) continue
    let same: boolean
    if (draftMoves.size) {
      const said = movesOf(sentence)
      const tools = toolsOf(sw)
      const where = regionsOf(sentence).length ? regionsOf(sentence) : caseRegions
      same = Array.from(draftMoves).every((m) => said.has(m))
        && (!draftTools.size || !tools.size || Array.from(draftTools).some((t) => tools.has(t)))
        && (!draftRegions.length || !where.length || regionFit(draftRegions, where) !== 'incompatible')
    } else {
      const stems = new Set(sw.map(stem))
      const matched = identity.filter((w) => stems.has(stem(w))).length
      same = identity.length > 0 && matched >= Math.min(2, identity.length) && matched / identity.length >= 0.5
    }
    if (!same) continue
    // Done today, in a sentence that is not a proposal or a hypothesis.
    if (anyHit(sw, DONE) && !anyHit(sw, LATER) && !isHedged(sentence)) return { origin: 'performed', dosage }
    found = sw
  }
  if (found) return { origin: 'stated', dosage }
  return { origin: 'suggested', dosage: dosage && 'suggested' }
}

// ---------------------------------------------------------------- the message to the patient

const EXERCISE_WORDS = ['eserciz*', 'exercise*', 'ejercicio*', 'exercice*', 'allenament*', 'training', 'routine']
const HOME_CLAIM = ['a casa', 'a domicilio', 'at home', 'en casa', 'a la maison', 'continua*', 'prosegui*', 'ripet*', 'repeat*', 'repite', 'repete', 'keep doing', 'carry on', 'sigue', 'continue*']
const HOME_SAID = ['a casa', 'domicili*', 'at home', 'home', 'en casa', 'maison', 'compit*', 'assegnat*', 'prescritt*', 'consegnat*', 'proseguir*', 'continuer*']
const SHOWN_CLAIM = ['come ti ho mostrato', 'come ti ho insegnato', 'come ti ho spiegato', 'come ti ho fatto vedere', 'come abbiamo visto', 'come abbiamo provato', 'come visto', 'as i showed', 'as i showed you', 'as shown', 'as we practised', 'as we practiced', 'como te mostre', 'como te ensene', 'comme je t ai montre', 'comme vu']
const SHOWN_SAID = ['mostrat*', 'insegnat*', 'spiegat*', 'fatto vedere', 'dimostrat*', 'provat*', 'showed', 'shown', 'taught', 'demonstrat*', 'practi*', 'mostre', 'ensene', 'montre']
const FREQUENCY = ['ogni giorno', 'tutti i giorni', 'al giorno', 'quotidian*', 'ogni sera', 'ogni mattina', 'a settimana', 'alla settimana', 'daily', 'every day', 'per day', 'a day', 'a week', 'per week', 'cada dia', 'todos los dias', 'al dia', 'par jour', 'chaque jour', 'tous les jours', 'par semaine']
// The sentence PHYGO writes in place of instructions not approved yet.
const CONFIRM = ['conferm*', 'confirm*']

/**
 * Why a sentence of the message to the patient presents as prescribed what
 * the clinician has not approved: a home programme or a demonstration they
 * did not mention, an exercise only the AI proposed, a dose or frequency they
 * did not give. `exercises`: the note's exercises as written.
 */
export function unapprovedInstructions(sentence: string, transcript: string, exercises: string[] = []): string[] {
  const ws = words(sentence)
  if (anyHit(ws, CONFIRM)) return []
  const said = words(transcript)
  const moves = specificMoves(sentence)
  const named = exercises.filter((e) => Array.from(specificMoves(e)).some((m) => moves.has(m)))
  const dose = unstatedDosage(sentence, transcript)
  const frequency = FREQUENCY.filter((f) => hits(ws, f) && !hits(said, f))
  if (!anyHit(ws, EXERCISE_WORDS) && !named.length && !dosesOf(sentence).length && !frequency.length) return []
  const out: string[] = []
  if (anyHit(ws, SHOWN_CLAIM) && !anyHit(said, SHOWN_SAID)) out.push('demonstration_not_documented')
  else if (anyHit(ws, HOME_CLAIM) && !anyHit(said, HOME_SAID)) out.push('home_programme_not_documented')
  const suggested = (e: string) => exerciseOrigin(e, transcript).origin === 'suggested'
  if (named.some(suggested)) out.push('suggested_exercise')
  // "Fai gli esercizi ogni giorno": an instruction about the programme, which holds AI proposals.
  else if (!named.length && anyHit(ws, EXERCISE_WORDS) && !anyHit(ws, DONE) && exercises.some(suggested)) out.push('suggested_exercise')
  if (dose.length || frequency.length) out.push('generated_dosage')
  return out
}

// ---------------------------------------------------------------- history

const HISTORY_MARKERS = ['anamnesi', 'anamnestic*', 'pregress*', 'in passato', 'storia di', 'history of', 'past medical', 'previous surgery', 'antecedent*', 'antecedentes', 'antecedents']
const clausesOf = (text: string) => text.split(/[.;!?\n]+/).map((c) => c.trim()).filter(Boolean)

/**
 * The history the clinician reported (a past region or event: "in anamnesi
 * intervento al ginocchio sinistro cinque anni fa, ora asintomatico") that
 * the subjective section does not keep, in the clinician's words.
 */
export function historyNotKept(subjective: string, transcript: string): { text: string; item: string }[] {
  const kept = analyzeMentions(subjective)
  const keptStems = new Set(words(subjective).map((w) => w.slice(0, 5)))
  const out: { text: string; item: string }[] = []
  for (const whole of clausesOf(transcript)) {
    // From the part that is history to the end ("Mal di schiena da due giorni, in passato episodi simili risolti").
    const parts = whole.split(/,\s*/)
    const from = parts.findIndex((p) => anyHit(words(p), HISTORY_MARKERS) || analyzeMentions(p).some((m) => m.status === 'history'))
    if (from < 0) continue
    const clause = parts.slice(from).join(', ')
    const past = analyzeMentions(clause).filter((m) => m.status === 'history')
    if (!past.length && !anyHit(words(clause), HISTORY_MARKERS)) continue
    // Kept: its region named as history in the subjective, or most of its words there.
    if (past.length && past.every((m) => kept.some((k) => k.region === m.region && k.status === 'history'))) continue
    const content = words(clause).filter((w) => w.length >= 4 && !/^\d+$/.test(w))
    if (content.length && content.filter((w) => keptStems.has(w.slice(0, 5))).length / content.length >= 0.6) continue
    out.push({ text: `${clause.charAt(0).toUpperCase()}${clause.slice(1)}.`, item: past[0]?.region ?? 'history' })
  }
  return out
}

/** Whether an assessment statement is worded as a hypothesis (reasoning, not a finding). */
export const isHedged = (statement: string) => anyHit(words(statement), HEDGE)

/** Sentences of a text, keeping their punctuation. */
export const sentencesOf = (text: string) => (text.match(/[^.;!?\n]+[.;!?]*/g) ?? []).map((s) => s.trim()).filter(Boolean)

export type RemovalSection = 'subjective' | 'objective' | 'assessment' | 'plan' | 'summaryForPatient' | 'hypotheses' | 'supportingFindings' | 'findingsAgainst' | 'redFlagsPrecautions'
/**
 * A change to the draft: `text` was taken out of `section`, or, when
 * `replacement` is given, replaced by it (a diagnosis or a dose labelled as a
 * hypothesis or a suggestion; red flags said to be not assessed).
 */
export type Removal = { section: RemovalSection; text: string; kind: string; item: string; replacement?: string }

type Reasoning = { supportingFindings?: string; findingsAgainst?: string; redFlagsPrecautions?: string; [k: string]: unknown }
type Note = { subjective?: string; objective?: string; assessment?: string; plan?: string; summaryForPatient?: string; language?: unknown; exercises?: unknown; clinicalReasoning?: Reasoning | null; [k: string]: unknown }

const LABEL = {
  diagnosis: { it: 'Ipotesi da confermare: ', en: 'Hypothesis to be confirmed: ', es: 'Hipótesis por confirmar: ', fr: 'Hypothèse à confirmer : ' },
  dosage: { it: 'Proposta generata, da confermare: ', en: 'Generated suggestion, to be confirmed: ', es: 'Sugerencia generada, por confirmar: ', fr: 'Suggestion générée, à confirmer : ' },
  homeExercises: {
    it: 'Il tuo fisioterapista ti confermerà quali esercizi fare a casa.',
    en: 'Your physiotherapist will confirm which exercises to do at home.',
    es: 'Tu fisioterapeuta te confirmará qué ejercicios hacer en casa.',
    fr: 'Votre kinésithérapeute vous confirmera les exercices à faire à la maison.',
  },
  redFlags: {
    it: 'Red flag non indagate: non risultano da ciò che è stato riferito, da valutare.',
    en: 'Red flags not assessed: not in what was reported, to be checked.',
    es: 'Banderas rojas no evaluadas: no constan en lo referido, por valorar.',
    fr: 'Drapeaux rouges non évalués : absents de ce qui a été rapporté, à vérifier.',
  },
} as const
type Lang = keyof typeof LABEL.diagnosis
// What a negative result nobody assessed becomes: said as not documented, by concept.
const NOT_DOCUMENTED: Record<string, Record<Lang, string>> = {
  neuro: { it: 'La trascrizione non documenta una valutazione neurologica; da approfondire se indicato.', en: 'The transcript does not document a neurological assessment; to be explored if indicated.', es: 'La transcripción no documenta una valoración neurológica; por valorar si está indicado.', fr: 'La transcription ne documente pas d’examen neurologique ; à approfondir si indiqué.' },
  radiculopathy: { it: 'La trascrizione non documenta una valutazione dei segni radicolari; da approfondire se indicato.', en: 'The transcript does not document an assessment of radicular signs; to be explored if indicated.', es: 'La transcripción no documenta una valoración de signos radiculares; por valorar si está indicado.', fr: 'La transcription ne documente pas d’évaluation des signes radiculaires ; à approfondir si indiqué.' },
  'red flags': { it: 'La trascrizione non documenta uno screening delle red flag; da approfondire se indicato.', en: 'The transcript does not document a red flag screening; to be explored if indicated.', es: 'La transcripción no documenta un cribado de banderas rojas; por valorar si está indicado.', fr: 'La transcription ne documente pas de dépistage des drapeaux rouges ; à approfondir si indiqué.' },
  'other conditions': { it: 'La trascrizione non documenta l’esclusione di altre condizioni; da approfondire se indicato.', en: 'The transcript does not document that other conditions were ruled out; to be explored if indicated.', es: 'La transcripción no documenta que se hayan descartado otras condiciones; por valorar si está indicado.', fr: 'La transcription ne documente pas l’exclusion d’autres affections ; à approfondir si indiqué.' },
  complications: { it: 'La trascrizione non documenta l’assenza di complicazioni; da approfondire se indicato.', en: 'The transcript does not document the absence of complications; to be explored if indicated.', es: 'La transcripción no documenta la ausencia de complicaciones; por valorar si está indicado.', fr: 'La transcription ne documente pas l’absence de complications ; à approfondir si indiqué.' },
}
// What an etiology drawn from the duration alone becomes.
const CAUSE: Record<string, Record<Lang, string>> = {
  inflammatory: { it: 'infiammatoria', en: 'an inflammatory', es: 'inflamatoria', fr: 'inflammatoire' },
  degenerative: { it: 'degenerativa', en: 'a degenerative', es: 'degenerativa', fr: 'dégénérative' },
  infectious: { it: 'infettiva', en: 'an infectious', es: 'infecciosa', fr: 'infectieuse' },
  rheumatic: { it: 'reumatica', en: 'a rheumatic', es: 'reumática', fr: 'rhumatismale' },
  neuropathic: { it: 'neuropatica', en: 'a neuropathic', es: 'neuropática', fr: 'neuropathique' },
  autoimmune: { it: 'autoimmune', en: 'an autoimmune', es: 'autoinmune', fr: 'auto-immune' },
  metabolic: { it: 'metabolica', en: 'a metabolic', es: 'metabólica', fr: 'métabolique' },
}
const durationNotCause = (concept: string, lang: Lang) => {
  const c = CAUSE[concept]?.[lang] ?? concept
  return {
    it: `La durata dei sintomi da sola non indica una causa ${c}; da approfondire se indicato.`,
    en: `The duration of the symptoms alone does not indicate ${c} cause; to be explored if indicated.`,
    es: `La duración de los síntomas por sí sola no indica una causa ${c}; por valorar si está indicado.`,
    fr: `La durée des symptômes ne suffit pas à indiquer une cause ${c} ; à approfondir si indiqué.`,
  }[lang]
}
const ETIOLOGY_SECTIONS = new Set(['subjective', 'objective', 'assessment', 'summaryForPatient', 'hypotheses', 'supportingFindings', 'findingsAgainst'])
// What an unsupported cause, link or hypothesis becomes.
const INFERENCE_NOTE: Record<string, Record<Lang, string>> = {
  cause: { it: 'La trascrizione non documenta cause o fattori di rischio; da indagare se indicato.', en: 'The transcript does not document causes or risk factors; to be explored if indicated.', es: 'La transcripción no documenta causas ni factores de riesgo; por valorar si está indicado.', fr: 'La transcription ne documente pas de cause ni de facteur de risque ; à approfondir si indiqué.' },
  history: { it: 'La trascrizione non documenta un legame tra il problema attuale e l’anamnesi; da valutare se indicato.', en: 'The transcript does not document a link between today’s problem and the history; to be assessed if indicated.', es: 'La transcripción no documenta una relación entre el problema actual y los antecedentes; por valorar si está indicado.', fr: 'La transcription ne documente pas de lien entre le problème actuel et les antécédents ; à approfondir si indiqué.' },
  myofascial: { it: 'Ipotesi di sindrome miofasciale non sostenuta dai reperti riferiti; da valutare se indicato.', en: 'Myofascial syndrome hypothesis not supported by the reported findings; to be assessed if indicated.', es: 'Hipótesis de síndrome miofascial no sustentada por los hallazgos referidos; por valorar si está indicado.', fr: 'Hypothèse de syndrome myofascial non étayée par les constats rapportés ; à approfondir si indiqué.' },
}
const inferenceNote = (f: UnsupportedFact, lang: Lang) => (f.kind === 'unsupported_etiology' ? durationNotCause(f.concept!, lang) : INFERENCE_NOTE[f.concept!]?.[lang] ?? INFERENCE_NOTE.cause[lang])

const notDocumented = (concept: string, item: string, lang: Lang) =>
  NOT_DOCUMENTED[concept]?.[lang] ?? { it: `La trascrizione non documenta questa valutazione (${item}); da approfondire se indicato.`, en: `The transcript does not document this assessment (${item}); to be explored if indicated.`, es: `La transcripción no documenta esta valoración (${item}); por valorar si está indicado.`, fr: `La transcription ne documente pas cette évaluation (${item}) ; à approfondir si indiqué.` }[lang]
// Where a negative result starts in a sentence ("Il paziente ha riportato lombalgia | senza altre complicazioni").
const NEGATIVE_START = /(?:^|[\s,])(senza|né|e\s+nessun\w*|nessun\w*|in\s+assenza|assenza\s+di|non\s+(?:sono|è|e)\s+stat\w*|non\s+risult\w*|non\s+emerg\w*|non\s+si\s+\w+|without|with\s+no|and\s+no|no\s+(?:signs?|evidence|other)|sin|sans|aucun\w*)(?=[\s,]|$)/i

const langOf = (l: unknown): Lang => (l === 'en' || l === 'es' || l === 'fr' ? l : 'it')
// "Condromalacia patellare…" → "Ipotesi da confermare: condromalacia patellare…" (an acronym keeps its case).
const labelled = (label: string, sentence: string) => `${label}${/^[A-ZÀ-Ý]{2}/.test(sentence) ? sentence : sentence.charAt(0).toLowerCase() + sentence.slice(1)}`

/**
 * The note without the statements that report facts the clinician did not
 * give, and with what it presents as certain but was not stated labelled:
 * - findings, tests and measurements in the subjective and objective sections;
 * - visits, follow-ups and agreements in the plan and the patient summary;
 * - treatments presented as done in these;
 * - negative results nobody assessed, in these, in the assessment and in the
 *   reasoning (findings for and against, red flags): never kept as a result,
 *   reworded as not documented ("La trascrizione non documenta una
 *   valutazione neurologica; da approfondire se indicato"); the part of the
 *   sentence that was said stays ("Il paziente ha riportato lombalgia");
 * - a diagnosis written as a fact but not stated by the clinician, labelled
 *   as a hypothesis to confirm (subjective, objective, assessment), or taken
 *   out of the message to the patient;
 * - a dose the clinician did not give, in the plan, labelled as a generated
 *   suggestion;
 * - in the message to the patient, instructions the clinician has not
 *   approved (an AI exercise, a dose, a home programme or a demonstration not
 *   mentioned): taken out, the first replaced by "your physiotherapist will
 *   confirm the home exercises";
 * - history the clinician reported but the subjective section leaves out:
 *   added back, in their words, as history.
 * A sentence is cut clause by clause (by commas), so what was said stays.
 */
export function sanitizeNote<T extends Note>(note: T, transcript: string, extra: { measures: (s: string, t: string) => string[]; treatments: (s: string, t: string) => string[]; appointments: (s: string, t: string) => string[] }): { note: T; removed: Removal[] } {
  const removed: Removal[] = []
  const out: Note = { ...note }
  const lang = langOf(note.language)
  const exercises = Array.isArray(note.exercises) ? note.exercises.map((e) => (typeof e === 'string' ? e : String((e as { name?: unknown })?.name ?? ''))) : []
  let confirmSaid = false
  const reasons = (section: RemovalSection, piece: string) => {
    const found: { kind: string; item: string; concept?: string }[] = []
    if (section === 'subjective' || section === 'objective') {
      found.push(...unsupportedFindings(piece, transcript))
      for (const m of extra.measures(piece, transcript)) found.push({ kind: 'invented', item: m })
      found.push(...unsupportedNegatives(piece, transcript, false))
    } else if (section === 'plan' || section === 'summaryForPatient') {
      for (const a of extra.appointments(piece, transcript)) found.push({ kind: 'invented_appointment', item: a })
      found.push(...unsupportedArrangements(piece, transcript))
      found.push(...unsupportedNegatives(piece, transcript, false))
    } else {
      found.push(...unsupportedNegatives(piece, transcript))
    }
    if (section === 'subjective' || section === 'objective' || section === 'plan' || section === 'summaryForPatient') {
      for (const t of extra.treatments(piece, transcript)) found.push({ kind: 'invented_treatment', item: t })
    }
    return found
  }
  const clean = (section: RemovalSection, text: string): string => {
    const kept: string[] = []
    // The concepts already said to be not documented in this section, once each.
    const reworded = new Set<string>(section === 'redFlagsPrecautions' ? ['red flags'] : [])
    for (const sentence of sentencesOf(text)) {
      // A cause drawn from the duration alone, a cause or risk factor nobody
      // mentioned, a link to the history the clinician did not make, a
      // hypothesis without its findings: said not to be documented.
      const cause = ETIOLOGY_SECTIONS.has(section) ? unsupportedInferences(sentence, transcript) : []
      if (cause.length) {
        const keyOf = (c: UnsupportedFact) => `${c.kind}:${c.concept}`
        const notes = cause.filter((c, i) => cause.findIndex((d) => keyOf(d) === keyOf(c)) === i && !reworded.has(keyOf(c))).map((c) => { reworded.add(keyOf(c)); return inferenceNote(c, lang) })
        const replacement = notes.join(' ')
        removed.push({ section, text: sentence, kind: cause[0].kind, item: cause[0].item, ...(replacement ? { replacement } : {}) })
        if (replacement) kept.push(replacement)
        continue
      }
      const whole = reasons(section, sentence)
      let result: string | null = sentence
      // A negative result nobody assessed: the said part stays, the rest is
      // reworded as not documented; the original is kept for undo.
      if (whole.length && whole.every((w) => w.kind === 'invented_negative')) {
        const end = sentence.match(/[.;!?]+$/)?.[0] ?? '.'
        const good: string[] = []
        for (const clause of sentence.replace(/[.;!?]+$/, '').split(/,\s*/)) {
          if (!reasons(section, clause).length) { good.push(clause.trim()); continue }
          const at = clause.search(NEGATIVE_START)
          const before = at > 0 ? clause.slice(0, at).trim() : ''
          if (before.split(/\s+/).length >= 2 && !reasons(section, before).length) good.push(before)
        }
        const said = good.length ? `${good.join(', ')}${end}` : ''
        const notes = Array.from(new Set(whole.map((w) => w.concept ?? w.item))).filter((c) => !reworded.has(c)).map((c) => { reworded.add(c); return notDocumented(c, whole.find((w) => (w.concept ?? w.item) === c)!.item, lang) })
        const replacement = [said, ...notes].filter(Boolean).join(' ')
        removed.push({ section, text: sentence, kind: 'invented_negative', item: whole[0].item, ...(replacement ? { replacement } : {}) })
        if (replacement) kept.push(replacement)
        continue
      }
      if (whole.length) {
        // Clause by clause, keeping the clauses that are fine.
        const end = sentence.match(/[.;!?]+$/)?.[0] ?? ''
        const clauses = sentence.replace(/[.;!?]+$/, '').split(/,\s*/)
        const good: string[] = []
        const cut: Removal[] = []
        for (const clause of clauses) {
          const why = reasons(section, clause)
          if (why.length) cut.push({ section, text: clause.trim(), kind: why[0].kind, item: why[0].item })
          else good.push(clause.trim())
        }
        // A clause alone may not carry the reason (e.g. the number of a schedule): drop the sentence.
        if (good.length === clauses.length) {
          removed.push({ section, text: sentence, kind: whole[0].kind, item: whole[0].item })
          result = null
        } else {
          removed.push(...cut)
          result = good.length ? `${good.join(', ')}${end || '.'}` : null
        }
      }
      if (result === null) continue
      // Said as certain, not stated: labelled, with the original kept for undo;
      // in the message to the patient it is taken out instead.
      if (section === 'summaryForPatient' && !isHedged(result)) {
        const dx = unstatedDiagnoses(result, transcript)
        if (dx.length) {
          removed.push({ section, text: result, kind: 'unconfirmed_diagnosis_removed', item: dx[0] })
          continue
        }
      }
      // Instructions to the patient that the clinician has not approved.
      if (section === 'summaryForPatient') {
        const why = unapprovedInstructions(result, transcript, exercises)
        if (why.length) {
          const replacement = confirmSaid ? undefined : LABEL.homeExercises[lang]
          removed.push({ section, text: result, kind: 'unapproved_instruction', item: why[0], ...(replacement ? { replacement } : {}) })
          if (!replacement) continue
          confirmSaid = true
          result = replacement
        }
      }
      if ((section === 'subjective' || section === 'objective' || section === 'assessment') && !isHedged(result)) {
        const dx = unstatedDiagnoses(result, transcript)
        if (dx.length) {
          const replacement = labelled(LABEL.diagnosis[lang], result)
          removed.push({ section, text: result, kind: 'unconfirmed_diagnosis', item: dx[0], replacement })
          result = replacement
        }
      }
      if (section === 'plan' && !isHedged(result)) {
        const dose = unstatedDosage(result, transcript)
        if (dose.length) {
          const replacement = labelled(LABEL.dosage[lang], result)
          removed.push({ section, text: result, kind: 'generated_dosage', item: dose[0], replacement })
          result = replacement
        }
      }
      kept.push(result)
    }
    return kept.join(' ')
  }
  for (const section of ['subjective', 'objective', 'assessment', 'plan', 'summaryForPatient'] as const) {
    const text = note[section]
    if (typeof text === 'string' && text.trim()) out[section] = clean(section, text)
  }
  // History the clinician reported stays, as history.
  const missing = historyNotKept(out.subjective ?? '', transcript)
  if (missing.length) {
    const added = missing.map((m) => m.text).join(' ')
    out.subjective = [String(out.subjective ?? '').trim(), added].filter(Boolean).join(' ')
    for (const m of missing) removed.push({ section: 'subjective', text: '', kind: 'history_added', item: m.item, replacement: m.text })
  }
  const reasoning = note.clinicalReasoning
  if (reasoning && typeof reasoning === 'object') {
    const r: Reasoning = { ...reasoning }
    for (const section of ['supportingFindings', 'findingsAgainst', 'redFlagsPrecautions'] as const) {
      const text = reasoning[section]
      if (typeof text !== 'string' || !text.trim()) continue
      const before = removed.length
      let cleaned = clean(section, text)
      // Red flags not discussed: said so, never declared absent.
      if (section === 'redFlagsPrecautions' && removed.length > before) cleaned = [LABEL.redFlags[lang], cleaned].filter(Boolean).join(' ')
      r[section] = cleaned
    }
    // Hypotheses, one by one: one the clinician's words do not support is replaced.
    if (Array.isArray(reasoning.hypotheses)) {
      r.hypotheses = (reasoning.hypotheses as unknown[]).map((h) => {
        if (typeof h !== 'string') return h
        const cause = unsupportedInferences(h, transcript)
        if (!cause.length) return h
        const replacement = inferenceNote(cause[0], lang)
        removed.push({ section: 'hypotheses', text: h, kind: cause[0].kind, item: cause[0].item, replacement })
        return replacement
      })
    }
    out.clinicalReasoning = r
  }
  return { note: out as T, removed }
}
