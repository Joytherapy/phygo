// Clinical relevance of everything generated from a note, end to end through
// the real API routes (the same order as the note panel: note → papers →
// condition sheet and protocol → refined exercises → exercise matching), with
// scripted model answers and a synthetic knowledge base, papers and exercise
// library. The scripted answers reproduce the kind of output seen in the app
// (e.g. a left-shoulder note whose exercises include ankle mobility and
// hamstring stretching), so the tests show what the pipeline does with it.
//
// Criteria, fixed before running (lib/clinical/coherence.ts checks the ones
// that can be checked mechanically; the rest are listed as human review):
//   1. pertinence to the input   2. anatomical coherence   3. coherence across sections
//   4. pertinence of papers      5. pertinence of exercises  6. protocol fit
//   7. no invented findings      8. practical use (human review)
// Acceptance in this suite: no exercise, paper or protocol from a region
// outside the case (and its neighbours) unless the note names that region;
// no exercise swapped for a database exercise of another region; no paper
// kept only for generic words; a wrong side or an unsupported measurement is
// detected and shown. Synthetic content only; no real model is called.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54809);
const APP_PORT = Number(process.env.CLINICAL_APP_PORT ?? 3809);

let R; // lib/clinical/region.ts
let K; // lib/clinical/coherence.ts
before(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-clin-'));
  const out = (f, src) => writeFileSync(join(dir, `${f}.mjs`), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
  try {
    out('region', readFileSync(new URL('../lib/clinical/region.ts', import.meta.url), 'utf8'));
    out('coherence', readFileSync(new URL('../lib/clinical/coherence.ts', import.meta.url), 'utf8').replace("from './region'", "from './region.mjs'"));
    R = await import(join(dir, 'region.mjs'));
    K = await import(join(dir, 'coherence.mjs'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------- unit: regions and sides

test('regions and sides are read from the clinician’s words in four languages', () => {
  const cases = [
    ['Dolore alla spalla sinistra, sospetta cuffia dei rotatori', ['shoulder']],
    ['left shoulder pain on abduction', ['shoulder']],
    ['Lesione LCA ginocchio destro', ['knee']],
    ['coxartrosi anca destra', ['hip']],
    ['cervicalgia con rigidità del collo', ['cervical']],
    ['lombalgia acuta', ['lumbar']],
    ['distorsione di caviglia sinistra', ['ankle_foot']],
    ['fascite plantare piede destro', ['ankle_foot']],
    ['epicondilite gomito destro', ['elbow']],
    ['tunnel carpale polso sinistro', ['wrist_hand']],
    ['dolor de hombro derecho', ['shoulder']],
    ['douleur au genou gauche', ['knee']],
    ['Stretching hamstring 3x30s', ['thigh']],
    ['Mobilità di caviglia 2x15', ['ankle_foot']],
    ['Cyclette 15 minuti', []],
    ['Flessione dorsale di caviglia in carico', ['ankle_foot']],
  ];
  for (const [text, expected] of cases) assert.deepEqual(R.regionsOf(text), expected, text);
  assert.equal(R.caseSide('dolore alla spalla sinistra'), 'left');
  assert.equal(R.caseSide('ginocchio dx'), 'right');
  assert.equal(R.caseSide('dolore bilaterale alle ginocchia, destra e sinistra'), null);
  assert.equal(R.contradictsSide('Rinforzo della cuffia della spalla destra', 'left'), true);
  assert.equal(R.contradictsSide('Rinforzo della cuffia', 'left'), false);
  assert.equal(R.fitsCase(['thigh'], ['knee']), true, 'hamstrings belong to a knee programme');
  assert.equal(R.fitsCase(['thoracic'], ['shoulder']), true, 'thoracic work belongs to a shoulder programme');
  assert.equal(R.fitsCase(['ankle_foot'], ['shoulder']), false);
  assert.equal(R.fitsCase(['thigh'], ['shoulder']), false);
  assert.equal(R.fitsCase([], ['shoulder']), true, 'general conditioning is not judged by region');
});

test('measurements that the clinician did not give are detected', () => {
  assert.deepEqual(K.measuresNotInTranscript('Flessione 120°, NRS 6/10', 'dolore in flessione, NRS 6/10'), ['120°']);
  assert.deepEqual(K.measuresNotInTranscript('ROM 90 gradi', 'elevazione dolorosa oltre i 90 gradi'), []);
});

test('appointments and treatments "done" that the clinician did not give are detected', () => {
  assert.deepEqual(K.appointmentsNotInTranscript('Ci vediamo giovedì alle 18:00, poi il 12 novembre.', 'ci rivediamo giovedì'), ['12 novembre', '18:00']);
  assert.deepEqual(K.appointmentsNotInTranscript('NRS 6/10, 2-3 volte a settimana per 4 settimane.', 'NRS 6/10'), [], 'scores and doses are not dates');
  assert.deepEqual(K.treatmentsNotInTranscript('Eseguite terapia manuale e tecar.', 'oggi terapia manuale'), ['tecar']);
  assert.deepEqual(K.treatmentsNotInTranscript('Si propone tecar nelle prossime sedute.', 'oggi terapia manuale'), [], 'a proposal is not presented as done');
  assert.deepEqual(K.treatmentsNotInTranscript('Eseguita valutazione della tensione muscolare.', ''), [], '"tens" is a whole word');
});

// ---------------------------------------------------------------- synthetic world

const CLIN = { id: '8f900000-0000-4000-8000-000000000001', email: 'rel@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const sheet = (id, name, keywords, en, extra = {}) => ({ id, condition_name: name, condition_keywords: keywords, translations: { en: { condition_name: en, condition_keywords: en.toLowerCase() } }, goals: `Goals for ${en}`, source: 'Synthetic guideline', source_date: '2024', evidence_level: 'moderate', ...extra });
const KB = [
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
];
const PHASES = KB.flatMap((s) => [1, 2].map((n) => ({ id: `ph${s.id}-${n}`, condition_id: s.id, phase_number: n, phase_name: `${s.translations.en.condition_name} phase ${n}`, typical_duration: 'variable', phase_goals: 'goals', phase_exercises: `exercises for ${s.translations.en.condition_name}`, criteria_to_progress: 'criteria' })));
const paper = (id, title, abstract) => ({ id, status: 'published', title, abstract, publication_date: '2024-01-01', research_summaries: { why_it_matters: `why ${id}`, evidence_strength: 'moderate' } });
const PAPERS = [
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
const LIB = [
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
const CASES = {
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
    note: { subjective: 'Lombalgia; pregresso intervento al ginocchio sinistro.', objective: '', assessment: 'Lombalgia aspecifica.', plan: 'Esercizio.', primaryCondition: 'low back pain',
      exercises: ['Cat-camel 2x10', 'Stretching hamstring 3x30s'] },
    papers: ['low back pain'],
    expect: { sheet: 7 },
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

const KEYWORDS = [
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

let fake;
let app;
let current = null; // the case being run
const prompts = { note: [], refine: [] };

function answer(system, user) {
  const c = CASES[current];
  if (system.includes('physiotherapist writing clinical documentation')) {
    prompts.note.push(system);
    return { summaryForPatient: '', clinicalReasoning: {}, ...c.note, language: 'it' };
  }
  if (system.includes('PubMed physiotherapy research search')) return { keywords: c.papers };
  if (system.includes('writing the exercise prescription for THIS patient')) {
    prompts.refine.push(system);
    return { exercises: c.refined ?? c.note.exercises };
  }
  if (system.includes('search keywords for a physiotherapy exercise database')) {
    const draft = (user.match(/written by the therapist: "([^"]*)"/) ?? [])[1] ?? '';
    const hit = KEYWORDS.find(([re]) => re.test(draft));
    return { keywords: hit ? hit[1] : [draft], sets: null, reps: null, duration_seconds: null, frequency_per_week: null, notes: null };
  }
  if (system.includes('ONE condition sheet')) return { id: null };
  return undefined;
}

before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: { 'tok-clin': CLIN },
    tables: {
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
    },
  });
  fake.state.openai = answer;
  app = await startApp({ fakeUrl: fake.url, port: APP_PORT });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const post = async (path, body) => {
  const res = await fetch(`${app.url}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: sessionCookie('tok-clin', CLIN) }, body: JSON.stringify(body) });
  return res.json();
};

/** The note panel's sequence (components/liveStructuring/LiveStructuring.tsx, generateRealNote). */
async function runPipeline(name) {
  current = name;
  const { transcript } = CASES[name];
  const { note } = await post('/api/generate-note', { transcript, lang: 'it' });
  const science = await post('/api/science/relevant', { primaryCondition: note.primaryCondition, assessment: note.assessment });
  const kb = await post('/api/knowledge-lookup', { assessment: note.assessment, primaryCondition: note.primaryCondition, lang: 'it' });
  let exercises = note.exercises;
  if ((kb.phases ?? []).length) exercises = (await post('/api/refine-exercises', { transcript, assessment: note.assessment, exercisesDraft: note.exercises, phases: kb.phases, lang: 'it' })).exercises;
  const ei = await post('/api/exercise-intelligence', { exercisesDraft: exercises, assessment: note.assessment, primaryCondition: note.primaryCondition, lang: 'it', transcript });
  return { transcript, note, papers: science.papers ?? [], kb, exercises: ei.exercises ?? [], excluded: ei.excluded ?? [] };
}

const report = [];
const check = (name, out) => {
  const issues = K.checkOutput({
    transcript: out.transcript,
    note: out.note,
    exercises: out.exercises.map((e) => ({ name: e.name, body_region: e.body_region, primary_muscle: e.primary_muscle })),
    papers: out.papers.map((p) => ({ title: p.title, relevance: p.relevance, relevance_reason: p.relevance_reason })),
    protocol: out.kb.match ? { name: out.kb.match.condition_name, keywords: out.kb.match.condition_keywords } : null,
  });
  report.push({ name, issues: issues.map((i) => `${i.kind}:${i.item}`), exercises: out.exercises.map((e) => `${e.name} [${e.provider}]`), excluded: out.excluded.map((e) => e.name), papers: out.papers.map((p) => `${p.id}:${p.relevance ?? '-'}`), sheet: out.kb.match?.id ?? null });
  return issues;
};

for (const name of Object.keys(CASES)) {
  test(`case ${name}: every section stays on the case`, async () => {
    const out = await runPipeline(name);
    const issues = check(name, out);
    const e = CASES[name].expect;
    const blocking = issues.filter((i) => ['exercise', 'evidence', 'protocol', 'district'].includes(i.kind));
    assert.deepEqual(blocking.map((i) => `${i.kind}: ${i.item}`), [], 'nothing from another region reaches the output');
    if (e.sheet !== undefined) assert.equal(out.kb.match?.id ?? null, e.sheet, 'the condition sheet (and its protocol) of this case');
    if (e.papers) assert.deepEqual(out.papers.map((p) => `${p.id}:${p.relevance}`), e.papers, 'only papers pertinent to the case, each with its level');
    for (const p of out.papers) if (p.relevance !== 'direct') assert.ok(p.relevance_reason, `"${p.title}" says why it is ${p.relevance}`);
    const found = issues.map((i) => `${i.kind}:${i.item}`);
    if (e.noIssues) assert.deepEqual(found.filter((f) => !f.startsWith('evidence_unverified:')), [], 'a coherent note has no issue in any section');
    for (const want of e.issues ?? []) assert.ok(found.includes(want), `"${want}" is detected (found: ${found.join(' | ')})`);
    for (const not of e.notIssues ?? []) assert.ok(!found.includes(not), `"${not}" is not reported: the clinician said it`);
    for (const word of e.offRegion ?? []) {
      assert.ok(!out.exercises.some((x) => `${x.name} ${x.draft ?? ''}`.toLowerCase().includes(word)), `"${word}" is not in the programme`);
      assert.ok(out.excluded.some((x) => x.name.toLowerCase().includes(word)), `"${word}" is listed as excluded, with its reason`);
    }
    for (const re of e.keep ?? []) assert.ok(out.exercises.some((x) => re.test(x.name)), `${re} is kept (the clinician named that region)`);
    for (const x of out.exercises) {
      if (x.provider === 'exercises' || x.provider === 'wger') assert.ok(R.fitsCase(R.exerciseRegions(x), K.caseRegionsOf(out.transcript, out.note)), `matched database exercise "${x.name}" fits the case`);
    }
  });
}

test('the screenshot case in detail: no hamstring/ankle swap, no leg paper', async () => {
  const out = await runPipeline('shoulderLeft');
  const pect = out.exercises.find((x) => /pettorale/i.test(x.name));
  assert.ok(pect, 'the pectoral stretch stays');
  assert.notEqual(pect.provider, 'exercises', 'it is not swapped for a database exercise of another region (e.g. "Hamstring stretch")');
  assert.ok(out.exercises.some((x) => x.provider === 'exercises' && x.name === 'Shoulder external rotation with band'), 'the external rotation is matched to the right database exercise');
  assert.ok(!out.papers.some((p) => p.id === 'p-leg'), 'the adolescent leg-pain paper is not presented as evidence');
  assert.ok(!out.papers.some((p) => p.id === 'p-generic'), 'a paper sharing only generic words is not presented as evidence');
  assert.equal(out.papers[0].id, 'p-shoulder', 'the direct evidence comes first');
  assert.deepEqual(out.papers.filter((p) => p.relevance === 'direct').map((p) => p.id), ['p-shoulder'], 'only the rotator cuff paper is presented as direct');
  assert.equal(out.papers.find((p) => p.id === 'p-achilles')?.relevance_reason, 'same_mechanism_other_region', 'another region is shown only with the shared mechanism as its reason');
});

test('cases in a row do not leak into each other (shoulder, knee, hip)', async () => {
  const a = await runPipeline('shoulderLeft');
  const b = await runPipeline('kneeRight');
  const c = await runPipeline('hipRight');
  assert.deepEqual([a.kb.match?.id, b.kb.match?.id, c.kb.match?.id], [1, 3, 5]);
  assert.ok(!b.papers.some((p) => p.id === 'p-shoulder') && !c.papers.some((p) => p.id === 'p-acl'));
  assert.ok(!b.exercises.some((x) => /spalla|pettoral/i.test(x.name)) && !c.exercises.some((x) => /ginocchio/i.test(x.name)));
});

test('the prompts no longer push other-region exercises', () => {
  const note = prompts.note.at(-1) ?? '';
  const refine = prompts.refine.at(-1) ?? '';
  assert.ok(note && refine, 'both prompts were used');
  assert.doesNotMatch(note, /hamstrings|gastrocnemius|stair gait|side-stepping/i, 'no lower-limb examples as defaults');
  assert.doesNotMatch(refine, /should not be skipped by default|both legs/i, 'no categories forced regardless of the case');
  assert.match(note + refine, /region/i, 'the region of today’s case is stated as the limit');
});

after(() => {
  if (process.env.CLINICAL_REPORT) writeFileSync(process.env.CLINICAL_REPORT, JSON.stringify(report, null, 2));
});
