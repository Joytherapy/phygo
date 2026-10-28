// The synthetic world of the clinical relevance checks, shared by the content
// tests (tests/clinical-relevance.test.mjs, scripted model) and the manual
// check with the real model (scripts/clinical-relevance-live.mjs): condition
// sheets, papers, library exercises, the case matrix, and the note panel's
// sequence of API calls. Synthetic content only; nothing here is a real patient.
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

/** lib/clinical (region, facts, exerciseMatch, coherence), transpiled for Node. */
export async function loadClinical() {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-clin-'));
  const out = (f, src) => writeFileSync(join(dir, `${f}.mjs`), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
  try {
    const src = (f) => readFileSync(new URL(`../../lib/clinical/${f}.ts`, import.meta.url), 'utf8').replace("from './region'", "from './region.mjs'").replace("from './facts'", "from './facts.mjs'").replace("from './exerciseMatch'", "from './exerciseMatch.mjs'")
    for (const f of ['region', 'facts', 'exerciseMatch', 'coherence']) out(f, src(f));
    return { R: await import(join(dir, 'region.mjs')), K: await import(join(dir, 'coherence.mjs')), F: await import(join(dir, 'facts.mjs')), M: await import(join(dir, 'exerciseMatch.mjs')) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- synthetic world

export const CLIN = { id: '8f900000-0000-4000-8000-000000000001', email: 'rel@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const sheet = (id, name, keywords, en, extra = {}) => ({ id, condition_name: name, condition_keywords: keywords, translations: { en: { condition_name: en, condition_keywords: en.toLowerCase() } }, goals: `Goals for ${en}`, source: 'Synthetic guideline', source_date: '2024', evidence_level: 'moderate', ...extra });
export const KB = [
  sheet(1, 'Tendinopatia della cuffia dei rotatori', 'cuffia dei rotatori, rotator cuff', 'Rotator cuff tendinopathy'),
  sheet(2, 'Tendinopatia achillea', 'tendinopatia, tendine d’achille, achillea', 'Achilles tendinopathy'),
  sheet(3, 'Ricostruzione LCA', 'lca, legamento crociato anteriore', 'ACL reconstruction'),
  sheet(4, 'Dolore femororotuleo', 'femororotuleo, dolore anteriore di ginocchio', 'Patellofemoral pain'),
  sheet(5, 'Coxartrosi', 'coxartrosi, artrosi d’anca', 'Hip osteoarthritis'),
  sheet(6, 'Cervicalgia', 'cervicalgia, dolore al collo', 'Neck pain'),
  sheet(7, 'Lombalgia aspecifica', 'lombalgia, mal di schiena', 'Low back pain'),
  sheet(8, 'Distorsione di caviglia', 'distorsione di caviglia, distorsione caviglia', 'Ankle sprain'),
  sheet(9, 'Fascite plantare', 'fascite plantare', 'Plantar fasciitis'),
  sheet(10, 'Epicondilite laterale', 'epicondilite, gomito del tennista', 'Lateral epicondylitis'),
  sheet(11, 'Sindrome del tunnel carpale', 'tunnel carpale', 'Carpal tunnel syndrome'),
  sheet(12, 'Capsulite adesiva', 'capsulite adesiva, spalla congelata', 'Adhesive capsulitis'),
  // Sheets naming no body region: matched, but never as verified.
  sheet(13, 'Fibromialgia', 'fibromialgia', 'Fibromyalgia'),
  sheet(14, 'Tendinopatia calcifica', 'tendinopatia calcifica, calcific tendinopathy', 'Calcific tendinopathy'),
  // A generic regional sheet: what fits when only the symptom and the region are stated.
  sheet(15, 'Dolore di ginocchio aspecifico', 'gonalgia, dolore al ginocchio', 'Non-specific knee pain', { translations: { en: { condition_name: 'Non-specific knee pain', condition_keywords: 'knee pain' } } }),
];
export const PHASES = KB.flatMap((s) => [1, 2].map((n) => ({ id: `ph${s.id}-${n}`, condition_id: s.id, phase_number: n, phase_name: `${s.translations.en.condition_name} phase ${n}`, typical_duration: 'variable', phase_goals: 'goals', phase_exercises: `exercises for ${s.translations.en.condition_name}`, criteria_to_progress: 'criteria' })));
const paper = (id, title, abstract) => ({ id, status: 'published', title, abstract, publication_date: '2024-01-01', research_summaries: { why_it_matters: `why ${id}`, evidence_strength: 'moderate' } });
export const PAPERS = [
  paper('p-shoulder', 'Exercise therapy for rotator cuff tendinopathy: a randomized controlled trial', 'Adults with shoulder pain and rotator cuff tendinopathy.'),
  paper('p-leg', 'Traumatic leg pain in adolescents: a cohort study', 'Musculoskeletal pain in adolescents, including shoulder pain and knee pain after sport.'),
  paper('p-acl', 'Rehabilitation after anterior cruciate ligament reconstruction: a systematic review', 'ACL reconstruction rehabilitation of the knee.'),
  paper('p-lbp', 'Clinical practice guideline for low back pain', 'Exercise for non-specific low back pain.'),
  paper('p-generic', 'Exercise therapy for chronic musculoskeletal pain', 'Exercise and education for chronic pain.'),
  paper('p-ankle', 'Ankle sprain rehabilitation: balance training', 'Lateral ankle sprain and proprioception.'),
  // Same mechanism in another region (shown as indirect, with its reason), and
  // a paper naming no region at all (shown as unverified, never as direct).
  paper('p-achilles', 'Loading programmes in Achilles tendinopathy', 'Progressive tendon loading in tendinopathy.'),
  paper('p-tendo', 'Tendinopathy: principles of load management', 'Tendinopathy and tendon load.'),
  paper('p-pfp', 'Exercise therapy for patellofemoral pain: a systematic review', 'Hip and knee exercise for patellofemoral pain.'),
];
const lib = (n, name, region, muscle) => ({ id: `8f9a0000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`, name, region, muscle });
export const LIB = [
  lib(1, 'Shoulder external rotation with band', 'shoulders', 'infraspinatus'),
  lib(2, 'Hamstring stretch', 'thighs', 'hamstrings'),
  lib(3, 'Ankle mobility circles', 'lower legs', 'ankle'),
  lib(4, 'Scapular retraction', 'upper back', 'rhomboids'),
  lib(5, 'Single leg balance', 'legs', 'glutes'),
  lib(6, 'Stationary bike', 'cardio', null),
  lib(7, 'Knee extension', 'thighs', 'quadriceps'),
  lib(8, 'Glute bridge', 'hips', 'glutes'),
  lib(9, 'Chin tuck', 'neck', 'deep neck flexors'),
  lib(10, 'Calf raise', 'lower legs', 'gastrocnemius'),
  lib(11, 'Prone Y raise', 'shoulders', 'lower trapezius'),
  lib(12, 'Shoulder internal rotation', 'shoulders', 'subscapularis'),
];

// Each case: what the clinician said, the note the model writes (with the kind of
// off-region exercise the prompts invited), the keywords the model extracts.
export const CASES = {
  shoulderLeft: {
    transcript: 'Paziente di 45 anni con dolore alla spalla sinistra da circa un mese, dolore in elevazione oltre i 90 gradi e alla rotazione esterna contro resistenza. Sospetta problematica della cuffia dei rotatori. Oggi terapia manuale ed esercizi di rotazione esterna con elastico.',
    note: { subjective: 'Dolore alla spalla sinistra da circa un mese.', objective: 'Dolore in elevazione oltre i 90 gradi e in rotazione esterna resistita. Eseguita terapia manuale.', assessment: 'Quadro possibilmente compatibile con tendinopatia della cuffia dei rotatori della spalla sinistra.', plan: 'Esercizio progressivo per la cuffia dei rotatori della spalla sinistra.', primaryCondition: 'rotator cuff tendinopathy',
      summaryForPatient: 'Fai gli esercizi per la spalla ogni giorno, senza superare un dolore moderato.',
      clinicalReasoning: { hypotheses: ['Possibile tendinopatia della cuffia dei rotatori della spalla sinistra'], differentials: ['Considerare una radicolopatia cervicale', 'Escludere una capsulite adesiva'], supportingFindings: 'Dolore in rotazione esterna resistita.', missingInformation: 'Forza in rotazione esterna non misurata.', suggestedAssessments: 'Test di Jobe, test di Hawkins.', redFlagsPrecautions: 'Nessuna red flag apparente.' },
      exercises: ['Rotazione esterna con elastico spalla sinistra 3x12', 'Stretching pettorale alla porta 3x30s', 'Mobilità di caviglia 2x15', 'Stretching hamstring 3x30s', 'Retrazione scapolare 3x10'] },
    refined: ['Rotazione esterna con elastico spalla sinistra 3x12', 'Stretching pettorale alla porta 3x30s', 'Retrazione scapolare 3x10', 'Equilibrio monopodalico 3x30s', 'Cyclette 15 minuti', 'Mobilità di caviglia 2x15', 'Stretching hamstring 3x30s'],
    papers: ['rotator cuff tendinopathy', 'shoulder pain', 'musculoskeletal pain'],
    expect: { region: 'shoulder', sheet: 1, papers: ['p-shoulder:direct', 'p-achilles:indirect', 'p-tendo:unverified'], offRegion: ['caviglia', 'hamstring', 'monopodalico'], noIssues: true,
      // "Nessuna red flag apparente": red flags were not discussed, so they are said to be not assessed, not absent.
      // "Fai gli esercizi per la spalla ogni giorno": the AI's programme and a frequency nobody gave, as instructions.
      issues: ['invented_negative:red flag', 'unapproved_instruction:suggested_exercise'] },
  },
  supraspinatusRight: {
    transcript: 'Tendinopatia del sovraspinato alla spalla destra, dolore notturno e in abduzione.',
    note: { subjective: 'Dolore notturno alla spalla destra.', objective: 'Dolore in abduzione.', assessment: 'Possibile tendinopatia del sovraspinato, cuffia dei rotatori, spalla destra.', plan: 'Carico progressivo della cuffia.', primaryCondition: 'Tendinopatia del sovraspinato',
      exercises: ['Abduzione isometrica spalla destra 5x10s', 'Rotazione esterna con elastico 3x12'] },
    papers: ['supraspinatus tendinopathy'],
    expect: { region: 'shoulder', sheet: 1, papers: ['p-shoulder:indirect', 'p-achilles:indirect', 'p-tendo:unverified'] },
  },
  shoulderRightSideError: {
    transcript: 'Spalla destra rigida da tre mesi, sospetta capsulite adesiva.',
    note: { subjective: 'Rigidità della spalla destra da tre mesi.', objective: 'Riduzione della rotazione esterna.', assessment: 'Possibile capsulite adesiva della spalla destra.', plan: 'Mobilizzazioni della spalla sinistra e esercizi di pendolo.', primaryCondition: 'adhesive capsulitis',
      exercises: ['Esercizi di pendolo 3x1 min', 'Rotazione esterna assistita con bastone 3x10'] },
    papers: ['adhesive capsulitis'],
    expect: { region: 'shoulder', sheet: 12, issues: ['side:plan'] },
  },
  kneeRight: {
    transcript: 'Ricostruzione del legamento crociato anteriore al ginocchio destro 8 settimane fa, cammina senza stampelle, lieve gonfiore.',
    note: { subjective: 'LCA ginocchio destro operato 8 settimane fa.', objective: 'Lieve versamento, deambulazione autonoma. Flessione 120°.', assessment: 'Riabilitazione dopo ricostruzione LCA del ginocchio destro.', plan: 'Rinforzo progressivo.', primaryCondition: 'ACL reconstruction',
      exercises: ['Estensione di ginocchio in catena cinetica aperta 3x12', 'Stretching hamstring 3x30s', 'Calf raise 3x15', 'Stretching dei pettorali alla porta 3x30s'] },
    papers: ['anterior cruciate ligament reconstruction', 'knee rehabilitation'],
    expect: { region: 'knee', sheet: 3, papers: ['p-acl:direct'], offRegion: ['pettorali'], issues: ['invented:120°'] },
  },
  kneeLeft: {
    transcript: 'Dolore anteriore al ginocchio sinistro scendendo le scale, sospetto femororotuleo.',
    note: { subjective: 'Dolore anteriore al ginocchio sinistro.', objective: 'Dolore alle scale.', assessment: 'Possibile dolore femororotuleo al ginocchio sinistro.', plan: 'Rinforzo di quadricipite e anca.', primaryCondition: 'patellofemoral pain',
      exercises: ['Glute bridge 3x12', 'Estensione di ginocchio 3x12', 'Chin tuck 3x10'] },
    papers: ['patellofemoral pain'],
    expect: { region: 'knee', sheet: 4, offRegion: ['chin'] },
  },
  hipRight: {
    transcript: 'Coxartrosi dell’anca destra, dolore inguinale al cammino prolungato.',
    note: { subjective: 'Dolore inguinale destro al cammino.', objective: 'Riduzione della rotazione interna d’anca.', assessment: 'Coxartrosi dell’anca destra.', plan: 'Esercizio e educazione.', primaryCondition: 'hip osteoarthritis',
      exercises: ['Glute bridge 3x12', 'Abduzione d’anca in decubito laterale 3x12', 'Mobilità cervicale 2x10'] },
    papers: ['hip osteoarthritis'],
    expect: { region: 'hip', sheet: 5, offRegion: ['cervicale'] },
  },
  neck: {
    transcript: 'Cervicalgia da postura al computer, rigidità del collo a fine giornata.',
    note: { subjective: 'Rigidità del collo.', objective: 'Rotazione cervicale ridotta.', assessment: 'Cervicalgia aspecifica.', plan: 'Esercizio e ergonomia.', primaryCondition: 'neck pain',
      exercises: ['Chin tuck 3x10', 'Retrazione scapolare 3x10', 'Squat 3x12'] },
    papers: ['neck pain'],
    expect: { region: 'cervical', sheet: 6, offRegion: ['squat'] },
  },
  lowBack: {
    transcript: 'Lombalgia acuta da due giorni dopo aver sollevato un peso, nessuna irradiazione.',
    note: { subjective: 'Lombalgia da due giorni.', objective: 'Flessione lombare dolorosa.', assessment: 'Lombalgia aspecifica acuta.', plan: 'Rimanere attivi.', primaryCondition: 'low back pain',
      exercises: ['Cat-camel 2x10', 'Stretching hamstring 3x30s', 'Rotazione esterna spalla con elastico 3x12'] },
    papers: ['low back pain'],
    expect: { region: 'lumbar', sheet: 7, papers: ['p-lbp:direct'], offRegion: ['spalla'] },
  },
  ankleLeft: {
    transcript: 'Distorsione di caviglia sinistra in inversione una settimana fa, carico tollerato.',
    note: { subjective: 'Distorsione di caviglia sinistra.', objective: 'Edema perimalleolare.', assessment: 'Distorsione laterale di caviglia sinistra.', plan: 'Propriocezione progressiva.', primaryCondition: 'ankle sprain',
      exercises: ['Calf raise 3x15', 'Equilibrio monopodalico 3x30s', 'Elevazioni laterali del braccio 3x12'] },
    papers: ['ankle sprain'],
    expect: { region: 'ankle_foot', sheet: 8, papers: ['p-ankle:direct'], offRegion: ['braccio'] },
  },
  footRight: {
    transcript: 'Fascite plantare al piede destro, dolore al tallone ai primi passi del mattino.',
    note: { subjective: 'Dolore al tallone destro al mattino.', objective: 'Dolore alla palpazione del tallone.', assessment: 'Fascite plantare del piede destro.', plan: 'Carico progressivo.', primaryCondition: 'plantar fasciitis',
      exercises: ['Calf raise 3x15', 'Stretching della fascia plantare 3x30s'] },
    papers: ['plantar fasciitis'],
    expect: { region: 'ankle_foot', sheet: 9 },
  },
  elbowRight: {
    transcript: 'Dolore laterale al gomito destro, tennista, sospetta epicondilite.',
    note: { subjective: 'Dolore laterale al gomito destro.', objective: 'Dolore all’estensione resistita del polso.', assessment: 'Possibile epicondilite laterale del gomito destro.', plan: 'Carico eccentrico.', primaryCondition: 'lateral epicondylitis',
      exercises: ['Eccentrico degli estensori del polso 3x15', 'Squat 3x12'] },
    papers: ['lateral epicondylitis'],
    expect: { region: 'elbow', sheet: 10, offRegion: ['squat'] },
  },
  wristLeft: {
    transcript: 'Formicolio alla mano sinistra di notte, sospetto tunnel carpale al polso sinistro.',
    note: { subjective: 'Formicolio notturno mano sinistra.', objective: 'Phalen positivo riferito.', assessment: 'Possibile sindrome del tunnel carpale sinistra.', plan: 'Tutore notturno e mobilizzazioni.', primaryCondition: 'carpal tunnel syndrome',
      exercises: ['Scivolamenti tendinei delle dita 3x10', 'Calf raise 3x15'] },
    papers: ['carpal tunnel syndrome'],
    expect: { region: 'wrist_hand', sheet: 11, offRegion: ['calf'] },
  },
  multiSite: {
    transcript: 'Dolore alla spalla destra e lombalgia da due settimane, lavora in magazzino.',
    note: { subjective: 'Dolore alla spalla destra e lombalgia.', objective: '', assessment: 'Lombalgia aspecifica; dolore di spalla destra da approfondire.', plan: 'Esercizio per lombare e spalla.', primaryCondition: 'low back pain',
      exercises: ['Cat-camel 2x10', 'Rotazione esterna con elastico spalla destra 3x12', 'Mobilità di caviglia 2x15'] },
    papers: ['low back pain'],
    expect: { sheet: 7, offRegion: ['caviglia'], keep: [/spalla|shoulder/i, /cat-camel/i] },
  },
  generic: {
    transcript: 'La paziente sta meglio, continua gli esercizi, nessun dolore oggi.',
    note: { subjective: 'Nessun dolore oggi.', objective: '', assessment: 'Miglioramento clinico.', plan: 'Proseguire.', primaryCondition: '',
      exercises: ['Camminata 20 minuti'] },
    papers: ['exercise'],
    expect: { papers: [], issues: ['region_unknown:'] },
  },
  historyKnee: {
    transcript: 'Oggi lombalgia; in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico.',
    note: { subjective: 'Lombalgia da due giorni. Pregresso intervento al ginocchio sinistro, ora asintomatico.', objective: '', assessment: 'Lombalgia aspecifica.', plan: 'Esercizio e mobilità lombare.', primaryCondition: 'low back pain',
      exercises: ['Cat-camel 2x10', 'Stretching hamstring 3x30s', 'Estensione di ginocchio sinistro 3x12'] },
    papers: ['low back pain'],
    // The knee is history: its exercise is left out, saying so; the history line in the findings is fine.
    expect: { sheet: 7, offRegion: ['ginocchio'], excludedReason: { ginocchio: 'history_only' }, keep: [/cat-camel/i, /hamstring/i], noIssues: true },
  },
  colloquial: {
    transcript: 'mi fa male la spalla quando alzo il braccio, soprattutto la sera, da un paio di settimane',
    note: { subjective: 'Dolore di spalla all’elevazione del braccio.', objective: '', assessment: 'Possibile dolore di spalla correlato alla cuffia dei rotatori.', plan: 'Esercizio graduale.', primaryCondition: 'rotator cuff related shoulder pain',
      exercises: ['Rotazione esterna con elastico 3x12', 'Mobilità di caviglia 2x15'] },
    papers: ['rotator cuff', 'shoulder pain'],
    expect: { kbRelevance: ['unverified', 'diagnosis_not_stated'], region: 'shoulder', sheet: 1, papers: ['p-shoulder:direct'], offRegion: ['caviglia'] },
  },
  voiceAmbiguous: {
    transcript: 'dolore al ginocchio no scusa alla caviglia sinistra dopo una distorsione',
    note: { subjective: 'Dolore alla caviglia sinistra dopo distorsione.', objective: '', assessment: 'Distorsione di caviglia sinistra.', plan: 'Propriocezione.', primaryCondition: 'ankle sprain',
      exercises: ['Equilibrio monopodalico 3x30s', 'Calf raise 3x15'] },
    papers: ['ankle sprain'],
    expect: { sheet: 8 },
  },
  // The history region treated as today's problem in the plan.
  historyAsActive: {
    transcript: 'Oggi lombalgia; in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico.',
    note: { subjective: 'Lombalgia.', objective: '', assessment: 'Lombalgia aspecifica.', plan: 'Rinforzo del ginocchio sinistro e mobilità lombare.', primaryCondition: 'low back pain',
      exercises: ['Cat-camel 2x10'] },
    papers: ['low back pain'],
    expect: { sheet: 7, issues: ['history_as_active:plan'] },
  },
  // A secondary region the clinician describes as current: its exercises stay.
  secondaryActive: {
    transcript: 'Dolore alla spalla destra da tre settimane; riferisce anche lieve dolore lombare, trattato oggi.',
    note: { subjective: 'Dolore alla spalla destra; lieve lombalgia.', objective: '', assessment: 'Possibile dolore di spalla correlato alla cuffia dei rotatori.', plan: 'Esercizio per spalla e lombare.', primaryCondition: 'rotator cuff related shoulder pain',
      exercises: ['Rotazione esterna con elastico spalla destra 3x12', 'Cat-camel 2x10'] },
    papers: ['rotator cuff'],
    // The low back: the generic regional sheet (pain described, no diagnosis
    // named); no paper in this world, which is said, not hidden.
    expect: { sheet: 1, kbRelevance: ['unverified', 'diagnosis_not_stated'], others: [['lumbar', null, 7, 'verified', 'symptom_only']], keep: [/shoulder|spalla/i, /cat-camel/i], noIssues: true, issues: ['coverage_evidence:lumbar',
      // "Esercizio per spalla e lombare": one sentence for both is not a part for each; each is said to be undefined.
      'plan_regions:plan', 'plan_region_undefined:shoulder', 'plan_region_undefined:lumbar'], notIssues: ['coverage_protocol:lumbar'] },
  },
  // The same region negated: its exercise is left out.
  secondaryNegated: {
    transcript: 'Dolore alla spalla destra da tre settimane, nega dolore lombare.',
    note: { subjective: 'Dolore alla spalla destra.', objective: '', assessment: 'Possibile dolore di spalla correlato alla cuffia dei rotatori.', plan: 'Esercizio per la spalla.', primaryCondition: 'rotator cuff related shoulder pain',
      exercises: ['Rotazione esterna con elastico spalla destra 3x12', 'Cat-camel 2x10'] },
    papers: ['rotator cuff'],
    expect: { kbRelevance: ['unverified', 'diagnosis_not_stated'], sheet: 1, offRegion: ['cat-camel'], keep: [/shoulder|spalla/i] },
  },
  // Two regions treated in the same session, each with its own side.
  multiSiteSides: {
    transcript: 'Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi.',
    note: { subjective: 'Dolore alla spalla destra e al ginocchio sinistro.', objective: '', assessment: 'Possibile dolore di spalla correlato alla cuffia dei rotatori; dolore femororotuleo al ginocchio sinistro.', plan: 'Esercizi per la spalla destra e per il ginocchio destro.', primaryCondition: 'rotator cuff related shoulder pain',
      exercises: ['Rotazione esterna con elastico spalla destra 3x12', 'Estensione di ginocchio sinistro 3x12', 'Estensione di ginocchio destro 3x12'] },
    papers: ['rotator cuff'],
    expect: { kbRelevance: ['unverified', 'diagnosis_not_stated'], sheet: 1, keep: [/shoulder|spalla/i, /knee|ginocchio/i], issues: ['side:plan', 'side:Estensione di ginocchio destro 3x12'], notIssues: ['side:Estensione di ginocchio sinistro 3x12', 'side:Rotazione esterna con elastico spalla destra 3x12'] },
  },
  // Exercises whose region is not recognised: kept, never shown as pertinent; aerobic work is general.
  unknownExercise: {
    transcript: 'Dolore alla spalla sinistra da un mese, sospetta cuffia dei rotatori.',
    note: { subjective: 'Dolore alla spalla sinistra.', objective: '', assessment: 'Possibile tendinopatia della cuffia dei rotatori.', plan: 'Esercizio progressivo.', primaryCondition: 'rotator cuff tendinopathy',
      exercises: ['Rotazione esterna con elastico 3x12', 'Esercizio con la palla 3x10', 'Cyclette 10 minuti'] },
    papers: ['rotator cuff tendinopathy'],
    expect: { sheet: 1, keep: [/palla/i, /cyclette/i], relevance: { palla: 'unverified', cyclette: 'general', rotazione: 'compatible' }, issues: ['exercise_unverified:Esercizio con la palla 3x10'], notIssues: ['exercise_unverified:Cyclette 10 minuti'] },
  },
  // A condition sheet naming no region, for a case with one: matched, not verified.
  sheetUnverified: {
    transcript: 'Dolore alla spalla destra, tendinopatia calcifica all\u2019ecografia.',
    note: { subjective: 'Dolore alla spalla destra.', objective: '', assessment: 'Tendinopatia calcifica della spalla destra.', plan: 'Esercizio progressivo.', primaryCondition: 'calcific tendinopathy of the shoulder',
      exercises: ['Rotazione esterna con elastico spalla destra 3x12'] },
    papers: ['calcific tendinopathy'],
    expect: { sheet: 14, kbRelevance: ['unverified', 'sheet_region_unknown'], issues: ['protocol_unverified:Tendinopatia calcifica'] },
  },
  // A case without a recognised region: the sheet and the exercises are not verified.
  caseUnverified: {
    transcript: 'Fibromialgia con dolore diffuso e stanchezza.',
    note: { subjective: 'Dolore diffuso e stanchezza.', objective: '', assessment: 'Quadro compatibile con fibromialgia.', plan: 'Esercizio aerobico graduale.', primaryCondition: 'fibromyalgia',
      exercises: ['Camminata 20 minuti', 'Esercizio con la palla 3x10'] },
    papers: ['fibromyalgia'],
    expect: { sheet: 13, kbRelevance: ['unverified', 'case_region_unknown'], relevance: { camminata: 'general', palla: 'unverified' }, issues: ['region_unknown:'] },
  },
  // Errors in the text sections, one per kind, next to what is correct.
  sectionErrors: {
    transcript: 'Dolore alla spalla sinistra in elevazione da due settimane. Oggi terapia manuale. Ci rivediamo giovedì.',
    note: { subjective: 'Dolore alla spalla sinistra da due settimane.', objective: 'Dolore in elevazione. Flessione 150°. Eseguite terapia manuale e tecar.', assessment: 'Possibile dolore di spalla correlato alla cuffia dei rotatori.', plan: 'Rinforzo della cuffia dei rotatori e del ginocchio.', primaryCondition: 'rotator cuff related shoulder pain',
      summaryForPatient: 'Ci vediamo giovedì alle 18:00.',
      clinicalReasoning: { hypotheses: ['Possibile tendinopatia della cuffia della spalla destra'], differentials: ['Considerare un dolore riferito dal rachide cervicale'] },
      exercises: ['Rotazione esterna con elastico 3x12'] },
    papers: ['rotator cuff'],
    expect: {
      sheet: 1, kbRelevance: ['unverified', 'diagnosis_not_stated'],
      issues: ['invented:150°', 'invented_treatment:tecar', 'section_region:plan', 'invented_appointment:18:00', 'side:hypotheses'],
      notIssues: ['invented_treatment:terapia manuale', 'invented_appointment:giovedi', 'section_region:differentials'],
    },
  },
  // ---- Regressions from the checks with the real model (synthetic re-creations of
  // what the model wrote; `raw` is the model's note before PHYGO's checks).
  // 1. Low back pain with a knee operated years ago, asymptomatic: the model
  //    added lumbar ROM limits, "no radiculopathy", "no instability", visit
  //    frequencies and a follow-up; the history is stated as history.
  realLumbarHistory: {
    transcript: 'Oggi lombalgia da due giorni dopo aver sollevato un peso. In anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico.',
    note: {
      subjective: 'Lombalgia da due giorni insorta dopo il sollevamento di un peso. In anamnesi intervento al ginocchio sinistro cinque anni fa, attualmente asintomatico e non correlato al quadro attuale.',
      objective: 'Limitazione del ROM lombare in flessione. Assenza di segni di radicolopatia. Nessuna instabilità rilevata.',
      assessment: 'Paziente con pregresso intervento al ginocchio sinistro (asintomatico) e lombalgia attuale, possibile lombalgia meccanica aspecifica.',
      plan: 'Educazione e esercizio terapeutico graduale per il rachide lombare. Sedute due volte a settimana per quattro settimane.',
      summaryForPatient: 'Il dolore alla schiena dovrebbe migliorare con il movimento. Ci vediamo due volte a settimana e faremo un controllo tra due settimane.',
      primaryCondition: 'low back pain',
      clinicalReasoning: { hypotheses: ['Possibile lombalgia meccanica aspecifica'], missingInformation: 'Mobilità lombare e test neurologici non riportati.' },
      exercises: ['Cat-camel 2x10', 'Stretching hamstring 3x30s'],
    },
    papers: ['low back pain'],
    expect: { sheet: 7 },
  },
  // 2. Right shoulder and left knee treated today: the model added Neer and
  //    Hawkins positive, knee swelling and knee flexion limited past 90 degrees.
  realMultisite: {
    transcript: 'Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi. Dolore alla spalla in elevazione e al ginocchio scendendo le scale.',
    note: {
      subjective: 'Dolore alla spalla destra in elevazione e al ginocchio sinistro scendendo le scale.',
      objective: 'Test di Neer e Hawkins positivi a destra. Gonfiore al ginocchio sinistro. Flessione del ginocchio limitata oltre i 90 gradi.',
      assessment: 'Possibile dolore di spalla destra correlato alla cuffia dei rotatori; possibile dolore femororotuleo al ginocchio sinistro.',
      plan: 'Esercizi per la spalla destra e per il ginocchio sinistro.',
      summaryForPatient: 'Fai gli esercizi per la spalla e per il ginocchio ogni giorno.',
      primaryCondition: 'rotator cuff related shoulder pain',
      exercises: ['Rotazione esterna con elastico spalla destra 3x12', 'Estensione di ginocchio sinistro 3x12'],
    },
    papers: ['rotator cuff', 'patellofemoral pain'],
    expect: { kbRelevance: ['unverified', 'diagnosis_not_stated'], sheet: 1 },
  },
  // The same case with exercises only for the shoulder: the knee is not covered.
  realMultisiteNoKnee: {
    transcript: 'Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi. Dolore alla spalla in elevazione e al ginocchio scendendo le scale.',
    note: {
      subjective: 'Dolore alla spalla destra e al ginocchio sinistro.',
      objective: '',
      assessment: 'Possibile dolore di spalla destra correlato alla cuffia dei rotatori; possibile dolore femororotuleo al ginocchio sinistro.',
      plan: 'Esercizi per la spalla destra.',
      summaryForPatient: '',
      primaryCondition: 'rotator cuff related shoulder pain',
      exercises: ['Rotazione esterna con elastico spalla destra 3x12'],
    },
    papers: ['rotator cuff'],
    expect: { kbRelevance: ['unverified', 'diagnosis_not_stated'], sheet: 1 },
  },
  // 3. Left shoulder: the pendulum and a prone arm raise were matched to the
  //    band external rotation; the external rotation "elbow at 90°" was
  //    excluded as an elbow exercise.
  realExerciseMatch: {
    transcript: 'Dolore alla spalla sinistra da un mese, sospetta tendinopatia della cuffia dei rotatori.',
    note: {
      subjective: 'Dolore alla spalla sinistra da un mese.',
      objective: '',
      assessment: 'Possibile tendinopatia della cuffia dei rotatori della spalla sinistra.',
      plan: 'Esercizio progressivo per la spalla sinistra.',
      summaryForPatient: '',
      primaryCondition: 'rotator cuff tendinopathy',
      exercises: ['Pendolo di Codman 3x1 minuto', 'Sollevamento del braccio in posizione prona 3x10', 'Rotazione esterna con elastico, gomito a 90° al fianco 3x12'],
    },
    papers: ['rotator cuff tendinopathy'],
    expect: { sheet: 1 },
  },
  // ---- Second check with the real model (after cf0e971), re-created.
  // 1a. Left shoulder: the band external rotation "gomito vicino al corpo" was
  //     excluded as an elbow exercise.
  r4ShoulderLeft: {
    transcript: 'Paziente di 45 anni con dolore alla spalla sinistra da circa un mese, dolore in elevazione oltre i 90 gradi e alla rotazione esterna contro resistenza. Sospetta problematica della cuffia dei rotatori. Oggi terapia manuale ed esercizi di rotazione esterna con elastico.',
    note: {
      subjective: 'Dolore alla spalla sinistra da circa un mese.',
      objective: 'Dolore in elevazione oltre i 90 gradi e alla rotazione esterna contro resistenza.',
      assessment: 'Possibile tendinopatia della cuffia dei rotatori della spalla sinistra.',
      plan: 'Esercizio progressivo per la cuffia dei rotatori.',
      summaryForPatient: 'Fai gli esercizi per la spalla ogni giorno.',
      primaryCondition: 'rotator cuff tendinopathy',
      exercises: ['Rotazione esterna con elastico, gomito vicino al corpo 3x12', 'Retrazione scapolare 3x10'],
    },
    papers: ['rotator cuff tendinopathy'],
    expect: { sheet: 1 },
  },
  // 1b + 2. Low back pain with knee history: a spinal rotation mobilisation was
  //     excluded as a shoulder exercise; plank, pelvic mobility, bird-dog and
  //     lateral flexion of the spine were "not verified".
  r4HistoryKnee: {
    transcript: 'Oggi lombalgia; in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico.',
    note: {
      subjective: 'Lombalgia. In anamnesi intervento al ginocchio sinistro, ora asintomatico.',
      objective: '',
      assessment: 'Lombalgia aspecifica.',
      plan: 'Esercizio terapeutico per il rachide lombare.',
      summaryForPatient: 'Fai gli esercizi per la schiena ogni giorno.',
      primaryCondition: 'low back pain',
      exercises: ['Mobilizzazione della colonna vertebrale con rotazione 2x10', 'Plank 3x20 secondi', 'Mobilità del bacino 2x10', 'Bird-dog 3x8', 'Flessione laterale della colonna 2x10'],
    },
    papers: ['low back pain'],
    expect: { sheet: 7 },
  },
  // 3 + 4 + 5. Right shoulder and left knee, the knee without a stated diagnosis:
  //     the knee had no sheet; the adolescent traumatic leg-pain paper came out
  //     as direct for the knee; a trunk lateral flexion "for the right shoulder"
  //     was taken as a shoulder exercise.
  r4MultiSite: {
    transcript: 'Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi. Dolore alla spalla in elevazione e al ginocchio scendendo le scale.',
    note: {
      subjective: 'Dolore alla spalla destra in elevazione e al ginocchio sinistro scendendo le scale.',
      objective: '',
      assessment: 'Dolore alla spalla destra, possibile coinvolgimento della cuffia dei rotatori; ginocchio sinistro doloroso, quadro da approfondire.',
      plan: 'Esercizi per la spalla destra e per il ginocchio sinistro.',
      summaryForPatient: 'Fai gli esercizi per la spalla e per il ginocchio ogni giorno.',
      primaryCondition: 'right shoulder pain',
      clinicalReasoning: { missingInformation: 'Test clinici e misure di spalla e ginocchio non riportati.' },
      exercises: ['Rotazione esterna con elastico spalla destra 3x12', 'Estensione di ginocchio sinistro 3x12', 'Flessione laterale del tronco per la spalla destra 2x10'],
    },
    papers: ['shoulder pain', 'knee pain'],
    expect: { kbRelevance: ['unverified', 'diagnosis_not_stated'] },
  },
  // Reported objective data must stay; missing data must be said.
  r4ObjectiveReported: {
    transcript: 'Dolore al ginocchio destro dopo la corsa. Flessione 120 gradi, Lachman negativo, lieve versamento.',
    note: {
      subjective: 'Dolore al ginocchio destro dopo la corsa.',
      objective: 'Flessione 120 gradi, Lachman negativo, lieve versamento.',
      assessment: 'Dolore di ginocchio destro dopo la corsa.',
      plan: 'Carico progressivo.',
      summaryForPatient: 'Riprendi gradualmente.',
      primaryCondition: 'right knee pain',
      exercises: ['Estensione di ginocchio destro 3x12'],
    },
    papers: ['knee pain'],
    expect: {},
  },
  // ---- Third check with the real model (after eff1dbe), as the user reported it.
  // Low back pain: the model declared negative results nobody assessed (no
  // neurological compromise, no other acute condition, no red flags). The
  // clinician did say "nessuna irradiazione": that negative is documented.
  r5LowBack: {
    transcript: 'Lombalgia acuta da due giorni dopo aver sollevato un peso, nessuna irradiazione alla gamba. Oggi terapia manuale.',
    note: {
      subjective: 'Lombalgia acuta da due giorni dopo aver sollevato un peso, nessuna irradiazione alla gamba.',
      objective: '',
      assessment: 'Lombalgia acuta di origine meccanica, senza segni di compromissione neurologica né altre condizioni acute.',
      plan: 'Oggi terapia manuale. Esercizi di mobilità lombare.',
      summaryForPatient: 'Muoviti con gradualità.',
      primaryCondition: 'acute low back pain',
      exercises: ['Cat-camel 2x10'],
      clinicalReasoning: {
        hypotheses: ['Possibile lombalgia meccanica aspecifica.'],
        findingsAgainst: 'Assenza di irradiazione alla gamba.',
        redFlagsPrecautions: 'Nessuna red flag apparente dalle informazioni fornite.',
      },
    },
    papers: ['low back pain'],
    expect: {},
  },
  // Right shoulder + left knee: pain only, turned into certain diagnoses;
  // dosages the clinician never gave; a cuff exercise "with the elbow at 90°";
  // a plan naming both regions; an Achilles paper for the knee.
  r5MultiSite: {
    transcript: 'Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi. Dolore alla spalla in elevazione e al ginocchio scendendo le scale.',
    note: {
      subjective: 'Dolore alla spalla destra in elevazione e al ginocchio sinistro scendendo le scale.',
      objective: '',
      assessment: 'Condromalacia patellare al ginocchio sinistro. Tendinopatia della cuffia dei rotatori alla spalla destra.',
      plan: 'Rotazione esterna con elastico, gomito a 90 gradi, per la spalla destra: 3 serie da 12 ripetizioni. Step-down per il ginocchio sinistro, 3 volte a settimana.',
      summaryForPatient: 'Fai gli esercizi per la spalla destra e il ginocchio sinistro.',
      primaryCondition: 'chondromalacia patellae and rotator cuff tendinopathy',
      exercises: ['Rotazione esterna con elastico, gomito a 90 gradi 3x12', 'Esercizi isometrici per la cuffia dei rotatori con gomito flesso a 90 gradi 3x10', 'Step-down ginocchio sinistro 3x10'],
      clinicalReasoning: { hypotheses: ['Possibile tendinopatia della cuffia dei rotatori.', 'Possibile dolore femororotuleo.'] },
    },
    papers: ['patellar tendinopathy', 'rotator cuff tendinopathy'],
    expect: { kbRelevance: ['unverified', 'diagnosis_not_stated'] },
  },
  // ---- Fourth check with the real model (after 9fa65eb), as the user reported it.
  // Low back pain with a knee operation in the history: the model's
  // subjective kept only the low back pain.
  r6HistoryKnee: {
    transcript: 'Oggi lombalgia; in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico.',
    note: { subjective: 'Lombalgia.', objective: '', assessment: 'Lombalgia aspecifica.', plan: 'Esercizi di mobilità lombare.', summaryForPatient: 'Oggi abbiamo lavorato sulla schiena.', primaryCondition: 'low back pain', exercises: ['Cat-camel 2x10'] },
    papers: ['low back pain'],
    expect: { sheet: 7 },
  },
  // Left shoulder: the external rotation done today, written by the model
  // with other words; a patient summary telling to go on at home "come ti ho
  // mostrato" with a dose nobody gave.
  r6ShoulderLeft: {
    transcript: 'Paziente di 45 anni con dolore alla spalla sinistra da circa un mese, dolore in elevazione oltre i 90 gradi e alla rotazione esterna contro resistenza. Sospetta problematica della cuffia dei rotatori. Oggi terapia manuale ed esercizi di rotazione esterna con elastico.',
    note: {
      subjective: 'Dolore alla spalla sinistra da circa un mese, in elevazione oltre i 90 gradi e alla rotazione esterna contro resistenza.',
      objective: '',
      assessment: 'Possibile tendinopatia della cuffia dei rotatori della spalla sinistra.',
      plan: 'Oggi terapia manuale ed esercizi di rotazione esterna con elastico.',
      summaryForPatient: 'Oggi abbiamo fatto terapia manuale ed esercizi per la spalla. Continua a casa gli esercizi di extrarotazione con la banda elastica come ti ho mostrato, 3 serie da 12 ogni giorno.',
      primaryCondition: 'rotator cuff related shoulder pain',
      exercises: ['Extrarotazione della spalla sinistra con banda elastica, gomito al fianco, 3x12', 'Retrazione scapolare 3x10'],
    },
    papers: ['rotator cuff tendinopathy'],
    expect: { sheet: 1 },
  },
  // Right shoulder + left knee: the patient summary gives the AI's proposals as instructions.
  r6MultiSite: {
    transcript: 'Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi. Dolore alla spalla in elevazione e al ginocchio scendendo le scale.',
    note: {
      subjective: 'Dolore alla spalla destra in elevazione e al ginocchio sinistro scendendo le scale.',
      objective: '',
      assessment: 'Dolore alla spalla destra e al ginocchio sinistro.',
      plan: 'Esercizi per la spalla destra e per il ginocchio sinistro.',
      summaryForPatient: 'Oggi abbiamo trattato spalla e ginocchio. Fai 3 serie da 12 di rotazione esterna con elastico per la spalla destra e step-down per il ginocchio sinistro ogni giorno.',
      primaryCondition: 'right shoulder pain',
      exercises: ['Rotazione esterna con elastico 3x12', 'Step-down ginocchio sinistro 3x10'],
    },
    papers: ['shoulder pain', 'knee pain'],
    expect: {},
  },
  // ---- Fifth check with the real model (after e78336f): the two sentences of the r6 report, verbatim.
  r7HistoryKnee: {
    transcript: 'Oggi lombalgia; in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico.',
    note: {
      subjective: 'Lombalgia. In anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico.',
      objective: '',
      assessment: 'Lombalgia aspecifica. Non sono stati riportati segni di compromissione neurologica o altre condizioni acute.',
      plan: 'Esercizi di mobilità lombare.',
      summaryForPatient: 'Oggi abbiamo parlato della schiena.',
      primaryCondition: 'low back pain',
      exercises: ['Cat-camel 2x10'],
      clinicalReasoning: { hypotheses: ['Possibile lombalgia aspecifica.'], supportingFindings: 'Il paziente ha riportato lombalgia senza altre complicazioni.' },
    },
    papers: ['low back pain'],
    expect: { sheet: 7 },
  },
  // The same kind of sentences when the clinician did screen and said so: they stay.
  r7Documented: {
    transcript: 'Lombalgia acuta da due giorni. Esame neurologico negativo, nessuna irradiazione, nega febbre e disturbi sfinterici. Nessuna complicazione dopo la caduta.',
    note: {
      subjective: 'Lombalgia acuta da due giorni, nessuna irradiazione.',
      objective: 'Esame neurologico negativo.',
      assessment: 'Lombalgia acuta senza segni di compromissione neurologica. Nessuna complicazione riferita dopo la caduta.',
      plan: 'Esercizi di mobilità lombare.',
      summaryForPatient: 'Muoviti con gradualità.',
      primaryCondition: 'acute low back pain',
      exercises: ['Cat-camel 2x10'],
      clinicalReasoning: { supportingFindings: 'Esame neurologico negativo, nessuna irradiazione.', redFlagsPrecautions: 'Nessuna red flag: nega febbre e disturbi sfinterici.' },
    },
    papers: ['low back pain'],
    expect: { sheet: 7 },
  },
  // ---- The r8 live report: lumbar flexion/extension matched to "Knee extension" as verified.
  r8LumbarMobility: {
    transcript: 'Paziente con lombalgia da due settimane. Oggi esercizi di mobilità lombare in flessione ed estensione.',
    note: {
      subjective: 'Lombalgia da due settimane.',
      objective: '',
      assessment: 'Lombalgia aspecifica.',
      plan: 'Esercizi di mobilità lombare.',
      summaryForPatient: 'Oggi abbiamo lavorato sulla mobilità della schiena.',
      primaryCondition: 'low back pain',
      exercises: ['Mobilità lombare con flessione ed estensione della colonna vertebrale in posizione supina 2x10', 'Cat-camel 2x10'],
    },
    papers: ['low back pain'],
    expect: { sheet: 7 },
  },
  // ---- The r9 live report.
  // Two regions treated today, and a generic plan naming neither.
  r10MultiSitePlan: {
    transcript: 'Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi.',
    note: {
      subjective: 'Dolore alla spalla destra e al ginocchio sinistro.',
      objective: '',
      assessment: 'Dolore alla spalla destra e al ginocchio sinistro.',
      plan: 'Esercizi di rinforzo e mobilità con progressione graduale del carico. Educazione del paziente sulla gestione del dolore.',
      summaryForPatient: 'Oggi abbiamo trattato spalla e ginocchio.',
      primaryCondition: 'right shoulder pain',
      exercises: ['Rotazione esterna con elastico spalla destra 3x12', 'Estensione di ginocchio sinistro 3x12'],
    },
    papers: ['shoulder pain', 'knee pain'],
    expect: {},
  },
  // Left shoulder: an etiology inferred from the duration of the pain alone.
  r10ShoulderEtiology: {
    transcript: 'Paziente di 45 anni con dolore alla spalla sinistra da circa un mese, dolore in elevazione oltre i 90 gradi e alla rotazione esterna contro resistenza. Sospetta problematica della cuffia dei rotatori. Oggi terapia manuale ed esercizi di rotazione esterna con elastico.',
    note: {
      subjective: 'Dolore alla spalla sinistra da circa un mese, in elevazione oltre i 90 gradi e alla rotazione esterna contro resistenza.',
      objective: '',
      assessment: 'Possibile tendinopatia della cuffia dei rotatori della spalla sinistra. Il dolore persistente da un mese suggerisce una condizione infiammatoria.',
      plan: 'Oggi terapia manuale ed esercizi di rotazione esterna con elastico.',
      summaryForPatient: 'Oggi abbiamo fatto terapia manuale ed esercizi per la spalla.',
      primaryCondition: 'rotator cuff related shoulder pain',
      exercises: ['Rotazione esterna con elastico spalla sinistra 3x12'],
      clinicalReasoning: {
        hypotheses: ['Possibile tendinopatia della cuffia dei rotatori, dato il dolore in elevazione e in rotazione esterna contro resistenza.', 'Possibile processo infiammatorio, data la durata di un mese.'],
        supportingFindings: 'Dolore in elevazione e alla rotazione esterna contro resistenza; la durata di un mese è compatibile con un quadro infiammatorio.',
      },
    },
    papers: ['rotator cuff tendinopathy'],
    expect: { sheet: 1 },
  },
  // ---- The r10 live report (as described by the user; the report stays on their computer).
  // Left shoulder: causes and risk factors nobody mentioned.
  r11ShoulderCause: {
    transcript: 'Paziente di 45 anni con dolore alla spalla sinistra da circa un mese, dolore in elevazione oltre i 90 gradi e alla rotazione esterna contro resistenza. Sospetta problematica della cuffia dei rotatori. Oggi terapia manuale ed esercizi di rotazione esterna con elastico.',
    note: {
      subjective: 'Dolore alla spalla sinistra da circa un mese, in elevazione oltre i 90 gradi e alla rotazione esterna contro resistenza.',
      objective: '',
      assessment: 'Possibile tendinopatia della cuffia dei rotatori della spalla sinistra, dato il dolore in elevazione e alla rotazione esterna contro resistenza. Il dolore potrebbe essere correlato a fattori ergonomici o ad attività fisiche recenti.',
      plan: 'Oggi terapia manuale ed esercizi di rotazione esterna con elastico.',
      summaryForPatient: 'Oggi abbiamo fatto terapia manuale ed esercizi per la spalla.',
      primaryCondition: 'rotator cuff related shoulder pain',
      exercises: ['Rotazione esterna con elastico spalla sinistra 3x12'],
      clinicalReasoning: {
        hypotheses: ['Possibile tendinopatia della cuffia dei rotatori, dato il dolore in elevazione e in rotazione esterna contro resistenza.', 'Possibile sovraccarico dovuto all’attività lavorativa o sportiva.'],
        supportingFindings: 'Dolore in elevazione e alla rotazione esterna contro resistenza.',
        missingInformation: 'Attività lavorativa, postura e attività sportiva non indagate.',
      },
    },
    papers: ['rotator cuff tendinopathy'],
    expect: { sheet: 1 },
  },
  // Low back pain with a knee operation in the history: a myofascial syndrome
  // and a causal link to the old operation, neither documented.
  r11HistoryKnee: {
    transcript: 'Oggi lombalgia; in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico.',
    note: {
      subjective: 'Lombalgia. In anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico.',
      objective: '',
      assessment: 'Lombalgia aspecifica. Possibile sindrome miofasciale lombare. La lombalgia potrebbe essere correlata a compensi dovuti al pregresso intervento al ginocchio sinistro.',
      plan: 'Esercizi di mobilità lombare.',
      summaryForPatient: 'Oggi abbiamo parlato della schiena.',
      primaryCondition: 'low back pain',
      exercises: ['Cat-camel 2x10'],
      clinicalReasoning: { hypotheses: ['Possibile lombalgia aspecifica.', 'Possibile sindrome miofasciale.', 'Possibile alterazione biomeccanica secondaria al pregresso intervento al ginocchio sinistro.'] },
    },
    papers: ['low back pain'],
    expect: { sheet: 7 },
  },
  // Right shoulder + left knee: one sentence naming both regions is not a plan for each.
  r11MultiSitePlan: {
    transcript: 'Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi.',
    note: {
      subjective: 'Dolore alla spalla destra e al ginocchio sinistro.',
      objective: '',
      assessment: 'Dolore alla spalla destra e al ginocchio sinistro.',
      plan: 'Esercizi di rinforzo e mobilità per la spalla destra e il ginocchio sinistro, con progressione graduale del carico.',
      summaryForPatient: 'Oggi abbiamo trattato spalla e ginocchio.',
      primaryCondition: 'right shoulder pain',
      exercises: ['Rotazione esterna con elastico spalla destra 3x12', 'Estensione di ginocchio sinistro 3x12'],
    },
    papers: ['shoulder pain', 'knee pain'],
    expect: {},
  },
};

export const KEYWORDS = [
  // As the model extracted them: the movement words, which "Knee extension" shares.
  [/flessione ed estensione della colonna/i, ['lumbar flexion extension', 'spinal extension', 'extension']],
  [/extrarotazione/i, ['shoulder external rotation band', 'external rotation']],
  [/isometrici per la cuffia/i, ['isometric', 'rotator cuff']],
  [/step-down/i, ['step down']],
  [/colonna vertebrale con rotazione/i, ['spinal rotation mobilization', 'rotation']],
  [/plank/i, ['plank']],
  [/bacino/i, ['pelvic tilt', 'pelvic mobility']],
  [/bird/i, ['bird dog']],
  [/flessione laterale/i, ['lateral flexion', 'side bend']],
  // As the model extracted them in the real checks: a region word, or another exercise's name.
  [/pendolo/i, ['pendulum', 'shoulder']],
  [/prona/i, ['prone arm raise', 'shoulder external rotation']],
  [/rotazione esterna/i, ['shoulder external rotation band', 'external rotation']],
  [/pettoral/i, ['pectoral stretch', 'stretch']],
  [/caviglia/i, ['ankle mobility']],
  [/hamstring/i, ['hamstring stretch']],
  [/retrazione scapolare/i, ['scapular retraction']],
  [/monopodalico/i, ['single leg balance', 'balance']],
  [/cyclette/i, ['stationary bike']],
  [/estensione di ginocchio/i, ['knee extension']],
  [/calf raise/i, ['calf raise']],
  [/glute bridge/i, ['glute bridge']],
  [/chin tuck/i, ['chin tuck']],
  [/squat/i, ['squat']],
  [/cervicale/i, ['neck mobility', 'mobility']],
  [/braccio/i, ['lateral raise']],
];

/** The fake Supabase tables of this world: one verified clinician, sheets, papers, library. */
export const worldTables = () => ({
      profiles: [{ id: CLIN.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free', preferred_language: 'it' }],
      knowledge_base: KB,
      rehab_phases: PHASES,
      research_papers: PAPERS,
      exercises: LIB.map((e) => ({ id: e.id, external_id: e.name, source: 'exercise_animatic', archived_at: null, body_region: e.region, primary_muscle: e.muscle, equipment: [], tags: [] })),
      exercise_translations: LIB.map((e) => ({ exercise_id: e.id, lang: 'en', name: e.name, instructions: [`${e.name} step`], tips: null })),
      exercise_assets: [],
      exercise_cache: [
        // The older wger cache, matched by name like the library.
        { provider: 'wger', provider_id: '1', language: 'en', name: 'Hamstring stretch standing', data: { internal_id: 'wger-1', provider: 'wger', provider_id: '1', name: 'Hamstring stretch standing', primary_muscle: 'hamstrings', body_region: 'legs', media: null } },
      ],
      ask_phygo_usage: [],
});

// ---------------------------------------------------------------- calls to the app, with diagnostics

/** Secrets never shown: API keys, bearer tokens, JWTs, session cookies. */
export function redact(text) {
  return String(text ?? '')
    .replace(/sk-[A-Za-z0-9_*.-]{6,}/g, 'sk-[redatto]')
    .replace(/(bearer\s+)[^\s"',;]+/gi, '$1[redatto]')
    .replace(/eyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}/g, '[jwt redatto]')
    .replace(/((?:^|[\s;"'])sb-[\w-]+-auth-token(?:\.\d+)?=)[^;\s"']+/gi, '$1[redatto]')
    .replace(/((?:cookie|set-cookie|authorization|api[-_]?key|apikey|service[-_]role[-_]key)["']?\s*[:=]\s*["']?)[^"',;\s}]+/gi, '$1[redatto]')
}

/** A call to the app that did not return what the pipeline needs. */
export class RouteError extends Error {
  constructor(path, status, body, problem = 'risposta di errore') {
    super(`${/^[A-Z]+ /.test(path) ? '' : 'POST '}${path} → HTTP ${status} (${problem}): ${redact(typeof body === 'string' ? body : JSON.stringify(body)).slice(0, 800)}`)
    this.name = 'RouteError'
    this.path = path
    this.status = status
    this.body = body
  }
}

/**
 * A `post` for runPipeline: JSON in, JSON out; a non-2xx status or a body
 * that is not JSON is a RouteError with the status and the (redacted) body.
 */
export function jsonPost(baseUrl, cookie) {
  return async (path, body) => {
    const res = await fetch(`${baseUrl}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify(body) });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { throw new RouteError(path, res.status, text, 'corpo non JSON'); }
    if (!res.ok) throw new RouteError(path, res.status, json);
    return json;
  };
}

/**
 * What a failed call most likely means, from its status, its body, the app's
 * log (already redacted) and the last OpenAI answer seen by the stand-in.
 */
export function diagnoseFailure({ status, body, logs = '', provider = null }) {
  const text = `${JSON.stringify(body ?? '')} ${logs} ${provider ? JSON.stringify(provider) : ''}`.toLowerCase();
  // OpenAI's own answer first, when there is one: an app error 500 often hides it.
  if (provider?.status === 401 || /invalid_api_key|incorrect api key/.test(text)) return 'OpenAI ha rifiutato la chiave (401 invalid_api_key): controllare OPENAI_API_KEY_LIVE.';
  if (/insufficient_quota|exceeded your current quota/.test(text)) return 'Quota OpenAI esaurita (429 insufficient_quota): controllare piano e credito del progetto OpenAI. Una richiesta rifiutata per quota non viene addebitata.';
  if (provider?.status === 429 || /rate_limit_exceeded|rate limit reached/.test(text)) return 'Limite di frequenza OpenAI (429 rate limit): riprovare più tardi o con meno casi.';
  if (provider?.status === 404 || /model_not_found|does not exist or you do not have access/.test(text)) return 'Modello OpenAI non disponibile per questa chiave (404 model_not_found).';
  if (provider?.status === 0 || /forward failed|fetch failed|econnrefused|enotfound|etimedout|econnreset|getaddrinfo/.test(text)) return 'Rete: OpenAI non raggiungibile dal processo dello script (proxy, DNS o connessione).';
  if (provider?.status >= 500) return `OpenAI ha risposto con un errore del servizio (${provider.status}): riprovare più tardi.`;
  // Then the app's own refusals.
  if (status === 401) return 'Autenticazione del professionista rifiutata (401): l\'app non riconosce la sessione del Supabase sostitutivo. Di solito la build non è quella dello script (è legata a un altro Supabase, per esempio la build dei test): rifare `node scripts/clinical-relevance-live.mjs --build`.';
  if (status === 403) return 'Professionista non verificato (403): controllare il profilo sintetico del Supabase sostitutivo (worldTables).';
  if (status === 429) return 'Limite orario dell\'app (429): troppe richieste nell\'ultima ora per il professionista sintetico.';
  if (status === 503) return 'Servizio non disponibile (503): limite orario o verifica del profilo non disponibili (Supabase sostitutivo).';
  if (status === 400) return 'Richiesta non valida (400): controllare il caso (trascrizione vuota?).';
  if (status >= 500) return 'Errore interno della route: vedere il log di Next.js qui sotto.';
  return 'Formato della risposta inatteso: vedere il corpo qui sotto.';
}

/** The lines of the app's log worth showing for a failure, redacted. */
export function relevantLogs(logs, max = 40) {
  const lines = redact(logs).split('\n').filter((l) => l.trim());
  const hits = lines.filter((l) => /error|errore|warn|openai|401|403|429|500|quota|rate|fetch|refused|denied|unauthor/i.test(l));
  return (hits.length ? hits : lines).slice(-max).join('\n');
}

const expectShape = (path, json, ok, what) => {
  if (!ok) throw new RouteError(path, 200, json, `formato inatteso: manca ${what}`);
  return json;
};

/** The note panel's sequence (components/liveStructuring/LiveStructuring.tsx, generateRealNote). */
export async function runPipeline(post, transcript) {
  const gen = await post('/api/generate-note', { transcript, lang: 'it' });
  expectShape('/api/generate-note', gen, gen && typeof gen.note === 'object' && gen.note !== null, '`note`');
  const { note, removed } = gen;
  const science = await post('/api/science/relevant', { primaryCondition: note.primaryCondition, assessment: note.assessment, transcript });
  expectShape('/api/science/relevant', science, science && typeof science === 'object', 'un oggetto');
  const kb = await post('/api/knowledge-lookup', { assessment: note.assessment, primaryCondition: note.primaryCondition, lang: 'it', transcript });
  expectShape('/api/knowledge-lookup', kb, kb && typeof kb === 'object', 'un oggetto');
  let exercises = note.exercises;
  if ((kb.phases ?? []).length) {
    const refined = await post('/api/refine-exercises', { transcript, assessment: note.assessment, exercisesDraft: note.exercises, phases: kb.phases, lang: 'it' });
    exercises = expectShape('/api/refine-exercises', refined, refined && Array.isArray(refined.exercises), '`exercises`').exercises;
  }
  const ei = await post('/api/exercise-intelligence', { exercisesDraft: exercises, assessment: note.assessment, primaryCondition: note.primaryCondition, lang: 'it', transcript });
  expectShape('/api/exercise-intelligence', ei, ei && typeof ei === 'object', 'un oggetto');
  return { transcript, note, removed: removed ?? [], papers: science.papers ?? [], kb, exercises: ei.exercises ?? [], excluded: ei.excluded ?? [] };
}

/** checkOutput's input for one pipeline output. */
export const checkInputOf = (out) => ({
  transcript: out.transcript,
  note: out.note,
  exercises: out.exercises.map((e) => ({ name: e.name, draft: e.draft, body_region: e.body_region, primary_muscle: e.primary_muscle })),
  papers: out.papers.map((p) => ({ title: p.title, relevance: p.relevance, relevance_reason: p.relevance_reason, regions: p.regions })),
  protocol: out.kb.match ? { name: out.kb.match.condition_name, keywords: out.kb.match.condition_keywords } : null,
  otherProtocols: (out.kb.others ?? []).map((o) => ({ region: o.region, name: o.match?.condition_name ?? null })),
});
