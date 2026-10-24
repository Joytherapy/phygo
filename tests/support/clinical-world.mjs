// The synthetic world of the clinical relevance checks, shared by the content
// tests (tests/clinical-relevance.test.mjs, scripted model) and the manual
// check with the real model (scripts/clinical-relevance-live.mjs): condition
// sheets, papers, library exercises, the case matrix, and the note panel's
// sequence of API calls. Synthetic content only; nothing here is a real patient.
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

/** lib/clinical/region.ts and coherence.ts, transpiled for Node. */
export async function loadClinical() {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-clin-'));
  const out = (f, src) => writeFileSync(join(dir, `${f}.mjs`), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
  try {
    out('region', readFileSync(new URL('../../lib/clinical/region.ts', import.meta.url), 'utf8'));
    out('coherence', readFileSync(new URL('../../lib/clinical/coherence.ts', import.meta.url), 'utf8').replace("from './region'", "from './region.mjs'"));
    return { R: await import(join(dir, 'region.mjs')), K: await import(join(dir, 'coherence.mjs')) };
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
];
export const PHASES = KB.flatMap((s) => [1, 2].map((n) => ({ id: `ph${s.id}-${n}`, condition_id: s.id, phase_number: n, phase_name: `${s.translations.en.condition_name} phase ${n}`, typical_duration: 'variable', phase_goals: 'goals', phase_exercises: `exercises for ${s.translations.en.condition_name}`, criteria_to_progress: 'criteria' })));
const paper = (id, title, abstract) => ({ id, status: 'published', title, abstract, publication_date: '2024-01-01', research_summaries: { why_it_matters: `why ${id}`, evidence_strength: 'moderate' } });
export const PAPERS = [
  paper('p-shoulder', 'Exercise therapy for rotator cuff tendinopathy: a randomized controlled trial', 'Adults with shoulder pain and rotator cuff tendinopathy.'),
  paper('p-leg', 'Traumatic leg pain in adolescents: a cohort study', 'Musculoskeletal pain in adolescents, including shoulder pain and knee complaints after sport.'),
  paper('p-acl', 'Rehabilitation after anterior cruciate ligament reconstruction: a systematic review', 'ACL reconstruction rehabilitation of the knee.'),
  paper('p-lbp', 'Clinical practice guideline for low back pain', 'Exercise for non-specific low back pain.'),
  paper('p-generic', 'Exercise therapy for chronic musculoskeletal pain', 'Exercise and education for chronic pain.'),
  paper('p-ankle', 'Ankle sprain rehabilitation: balance training', 'Lateral ankle sprain and proprioception.'),
  // Same mechanism in another region (shown as indirect, with its reason), and
  // a paper naming no region at all (shown as unverified, never as direct).
  paper('p-achilles', 'Loading programmes in Achilles tendinopathy', 'Progressive tendon loading in tendinopathy.'),
  paper('p-tendo', 'Tendinopathy: principles of load management', 'Tendinopathy and tendon load.'),
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
    expect: { region: 'shoulder', sheet: 1, papers: ['p-shoulder:direct', 'p-achilles:indirect', 'p-tendo:unverified'], offRegion: ['caviglia', 'hamstring', 'monopodalico'], noIssues: true },
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
    expect: { region: 'shoulder', sheet: 1, papers: ['p-shoulder:direct'], offRegion: ['caviglia'] },
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
    expect: { sheet: 1, keep: [/shoulder|spalla/i, /cat-camel/i], noIssues: true },
  },
  // The same region negated: its exercise is left out.
  secondaryNegated: {
    transcript: 'Dolore alla spalla destra da tre settimane, nega dolore lombare.',
    note: { subjective: 'Dolore alla spalla destra.', objective: '', assessment: 'Possibile dolore di spalla correlato alla cuffia dei rotatori.', plan: 'Esercizio per la spalla.', primaryCondition: 'rotator cuff related shoulder pain',
      exercises: ['Rotazione esterna con elastico spalla destra 3x12', 'Cat-camel 2x10'] },
    papers: ['rotator cuff'],
    expect: { sheet: 1, offRegion: ['cat-camel'], keep: [/shoulder|spalla/i] },
  },
  // Two regions treated in the same session, each with its own side.
  multiSiteSides: {
    transcript: 'Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi.',
    note: { subjective: 'Dolore alla spalla destra e al ginocchio sinistro.', objective: '', assessment: 'Possibile dolore di spalla correlato alla cuffia dei rotatori; dolore femororotuleo al ginocchio sinistro.', plan: 'Esercizi per la spalla destra e per il ginocchio destro.', primaryCondition: 'rotator cuff related shoulder pain',
      exercises: ['Rotazione esterna con elastico spalla destra 3x12', 'Estensione di ginocchio sinistro 3x12', 'Estensione di ginocchio destro 3x12'] },
    papers: ['rotator cuff'],
    expect: { sheet: 1, keep: [/shoulder|spalla/i, /knee|ginocchio/i], issues: ['side:plan', 'side:Estensione di ginocchio destro 3x12'], notIssues: ['side:Estensione di ginocchio sinistro 3x12', 'side:Rotazione esterna con elastico spalla destra 3x12'] },
  },
  // Exercises whose region is not recognised: kept, never shown as pertinent; aerobic work is general.
  unknownExercise: {
    transcript: 'Dolore alla spalla sinistra da un mese, sospetta cuffia dei rotatori.',
    note: { subjective: 'Dolore alla spalla sinistra.', objective: '', assessment: 'Possibile tendinopatia della cuffia dei rotatori.', plan: 'Esercizio progressivo.', primaryCondition: 'rotator cuff tendinopathy',
      exercises: ['Rotazione esterna con elastico 3x12', 'Plank 3x30s', 'Cyclette 10 minuti'] },
    papers: ['rotator cuff tendinopathy'],
    expect: { sheet: 1, keep: [/plank/i, /cyclette/i], relevance: { plank: 'unverified', cyclette: 'general', rotazione: 'compatible' }, issues: ['exercise_unverified:Plank 3x30s'], notIssues: ['exercise_unverified:Cyclette 10 minuti'] },
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
      exercises: ['Camminata 20 minuti', 'Plank 3x30s'] },
    papers: ['fibromyalgia'],
    expect: { sheet: 13, kbRelevance: ['unverified', 'case_region_unknown'], relevance: { camminata: 'general', plank: 'unverified' }, issues: ['region_unknown:'] },
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
      sheet: 1,
      issues: ['invented:150°', 'invented_treatment:tecar', 'section_region:plan', 'invented_appointment:18:00', 'side:hypotheses'],
      notIssues: ['invented_treatment:terapia manuale', 'invented_appointment:giovedi', 'section_region:differentials'],
    },
  },
};

export const KEYWORDS = [
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

/** The note panel's sequence (components/liveStructuring/LiveStructuring.tsx, generateRealNote). */
export async function runPipeline(post, transcript) {
  const { note } = await post('/api/generate-note', { transcript, lang: 'it' });
  const science = await post('/api/science/relevant', { primaryCondition: note.primaryCondition, assessment: note.assessment });
  const kb = await post('/api/knowledge-lookup', { assessment: note.assessment, primaryCondition: note.primaryCondition, lang: 'it' });
  let exercises = note.exercises;
  if ((kb.phases ?? []).length) exercises = (await post('/api/refine-exercises', { transcript, assessment: note.assessment, exercisesDraft: note.exercises, phases: kb.phases, lang: 'it' })).exercises;
  const ei = await post('/api/exercise-intelligence', { exercisesDraft: exercises, assessment: note.assessment, primaryCondition: note.primaryCondition, lang: 'it', transcript });
  return { transcript, note, papers: science.papers ?? [], kb, exercises: ei.exercises ?? [], excluded: ei.excluded ?? [] };
}

/** checkOutput's input for one pipeline output. */
export const checkInputOf = (out) => ({
  transcript: out.transcript,
  note: out.note,
  exercises: out.exercises.map((e) => ({ name: e.name, draft: e.draft, body_region: e.body_region, primary_muscle: e.primary_muscle })),
  papers: out.papers.map((p) => ({ title: p.title, relevance: p.relevance, relevance_reason: p.relevance_reason })),
  protocol: out.kb.match ? { name: out.kb.match.condition_name, keywords: out.kb.match.condition_keywords } : null,
});
