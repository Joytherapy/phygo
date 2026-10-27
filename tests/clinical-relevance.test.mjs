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
import { writeFileSync } from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';
import { CASES, CLIN, KEYWORDS, checkInputOf, loadClinical, runPipeline, worldTables } from './support/clinical-world.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54809);
const APP_PORT = Number(process.env.CLINICAL_APP_PORT ?? 3809);

let R; // lib/clinical/region.ts
let K; // lib/clinical/coherence.ts
let F; // lib/clinical/facts.ts
let M; // lib/clinical/exerciseMatch.ts
before(async () => {
  ({ R, K, F, M } = await loadClinical());
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
    ['Riferisce anche lieve dolore lombare', ['lumbar']],
  ];
  for (const [text, expected] of cases) assert.deepEqual(R.regionsOf(text), expected, text);
});

test('four outcomes: compatible, general activity, not recognised, incompatible', () => {
  assert.equal(R.regionFit(['thigh'], ['knee']), 'compatible', 'hamstrings belong to a knee programme');
  assert.equal(R.regionFit(['thoracic'], ['shoulder']), 'compatible', 'thoracic work belongs to a shoulder programme');
  assert.equal(R.regionFit(['ankle_foot'], ['shoulder']), 'incompatible');
  assert.equal(R.regionFit(['thigh'], ['shoulder']), 'incompatible');
  // An item naming no region is not pertinent by default.
  assert.equal(R.regionFit([], ['shoulder']), 'unknown');
  assert.equal(R.regionFit(['knee'], []), 'unknown', 'a case without a recognised region verifies nothing');
  assert.equal(R.exerciseFit({ name: 'Cyclette 15 minuti' }, ['shoulder']), 'general', 'aerobic work is general by nature');
  assert.equal(R.exerciseFit({ name: 'Camminata veloce 20 minuti' }, ['lumbar']), 'general');
  assert.equal(R.exerciseFit({ name: 'Esercizio con la palla 3x10' }, ['shoulder']), 'unknown', 'a region not recognised is not "general"');
  assert.equal(R.exerciseFit({ name: 'Burpee', body_region: 'whole-body' }, ['wrist_hand']), 'unknown', 'whole-body is not general');
  assert.equal(R.exerciseFit({ name: 'Walking lunges' }, ['shoulder']), 'incompatible', 'a region named wins over "walking"');
  assert.equal(R.exerciseFit({ name: 'Hamstring stretch', body_region: 'hamstrings' }, ['shoulder']), 'incompatible');
});

test('today\u2019s problem is told apart from history, negations and dictation corrections', () => {
  const p = (t) => R.caseProfile(t);
  // Remote history: not part of the case.
  assert.deepEqual(p('Oggi lombalgia; in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico.'), { active: ['lumbar'], history: ['knee'], negated: [], sides: {} });
  assert.deepEqual(p('Pregressa distorsione di caviglia destra, oggi dolore al ginocchio destro.').history, ['ankle_foot']);
  assert.deepEqual(p('In passato frattura di polso sinistro. Dolore alla spalla destra da due settimane.').active, ['shoulder']);
  // Active problem even with an old event, or when not resolved.
  assert.deepEqual(p('Dolore al ginocchio destro operato cinque anni fa.').active, ['knee']);
  assert.deepEqual(p('Dolore alla spalla sinistra non risolto dopo infiltrazione.').active, ['shoulder']);
  assert.deepEqual(p('Rispetto alla seduta precedente il dolore alla spalla sinistra è ridotto.').active, ['shoulder'], '"precedente" alone is not history');
  // Secondary region, described as current, vs negated.
  assert.deepEqual(p('Dolore alla spalla destra da tre settimane; riferisce anche lieve dolore lombare, trattato oggi.').active, ['shoulder', 'lumbar']);
  assert.deepEqual(p('Dolore alla spalla destra, nega dolore lombare.'), { active: ['shoulder'], history: [], negated: ['lumbar'], sides: { shoulder: 'right' } });
  // Dictation self-correction.
  assert.deepEqual(p('dolore al ginocchio no scusa alla caviglia sinistra dopo una distorsione'), { active: ['ankle_foot'], history: [], negated: [], sides: { ankle_foot: 'left' } });
});

test('each side belongs to the region it was said with', () => {
  assert.deepEqual(R.caseProfile('Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi.').sides, { shoulder: 'right', knee: 'left' });
  assert.deepEqual(R.caseProfile('left shoulder pain and right knee pain').sides, { shoulder: 'left', knee: 'right' });
  assert.deepEqual(R.caseProfile('Dolore bilaterale alle ginocchia').sides, { knee: 'both' });
  // The side of a history region does not become the side of the case.
  assert.deepEqual(R.caseProfile('Dolore al ginocchio destro; in anamnesi intervento al ginocchio sinistro, ora asintomatico.').sides, { knee: 'right' });
  const multi = R.caseProfile('Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi.');
  assert.deepEqual(R.sideContradictions('Esercizi per la spalla destra e per il ginocchio sinistro.', multi), []);
  assert.deepEqual(R.sideContradictions('Esercizi per la spalla destra e per il ginocchio destro.', multi), ['knee'], 'only the region with the wrong side');
  const left = R.caseProfile('Dolore alla spalla sinistra da un mese.');
  assert.deepEqual(R.sideContradictions('Rinforzo della cuffia della spalla destra.', left), ['shoulder']);
  assert.deepEqual(R.sideContradictions('Rinforzo della cuffia.', left), []);
  assert.deepEqual(R.sideContradictions('Pregresso intervento alla spalla destra.', left), [], 'a history statement in the note is not today\u2019s side');
  assert.deepEqual(R.sideContradictions('Lato destro dolente.', left), ['shoulder'], 'a side without a region, against a one-sided case');
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
    tables: worldTables(),
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

const runCase = (name) => {
  current = name;
  return runPipeline(post, CASES[name].transcript);
};

const report = [];
const check = (name, out) => {
  const issues = K.checkOutput(checkInputOf(out));
  report.push({ name, issues: issues.map((i) => `${i.kind}:${i.item}`), exercises: out.exercises.map((e) => `${e.name} [${e.provider}]`), excluded: out.excluded.map((e) => e.name), papers: out.papers.map((p) => `${p.id}:${p.relevance ?? '-'}`), sheet: out.kb.match?.id ?? null });
  return issues;
};

for (const name of Object.keys(CASES)) {
  test(`case ${name}: every section stays on the case`, async () => {
    const out = await runCase(name);
    const issues = check(name, out);
    const e = CASES[name].expect;
    const blocking = issues.filter((i) => ['exercise', 'evidence', 'protocol', 'district'].includes(i.kind));
    assert.deepEqual(blocking.map((i) => `${i.kind}: ${i.item}`), [], 'nothing from another region reaches the output');
    if (e.sheet !== undefined) assert.equal(out.kb.match?.id ?? null, e.sheet, 'the condition sheet (and its protocol) of this case');
    if (e.papers) assert.deepEqual(out.papers.map((p) => `${p.id}:${p.relevance}`), e.papers, 'only papers pertinent to the case, each with its level');
    for (const p of out.papers) if (p.relevance !== 'direct') assert.ok(p.relevance_reason, `"${p.title}" says why it is ${p.relevance}`);
    // What PHYGO took out of the note counts as caught, like a check shown in the panel.
    const found = [...issues.map((i) => `${i.kind}:${i.item}`), ...out.removed.map((r) => `${r.kind}:${r.item}`)];
    if (e.noIssues) assert.deepEqual(found.filter((f) => !f.startsWith('evidence_unverified:') && f !== 'objective_missing:objective' && !(e.issues ?? []).includes(f)), [], 'a coherent note has no other issue in any section');
    for (const want of e.issues ?? []) assert.ok(found.includes(want), `"${want}" is detected (found: ${found.join(' | ')})`);
    for (const not of e.notIssues ?? []) assert.ok(!found.includes(not), `"${not}" is not reported: the clinician said it`);
    for (const word of e.offRegion ?? []) {
      assert.ok(!out.exercises.some((x) => `${x.name} ${x.draft ?? ''}`.toLowerCase().includes(word)), `"${word}" is not in the programme`);
      assert.ok(out.excluded.some((x) => x.name.toLowerCase().includes(word)), `"${word}" is listed as excluded, with its reason`);
    }
    for (const re of e.keep ?? []) assert.ok(out.exercises.some((x) => re.test(`${x.name} ${x.draft ?? ''}`)), `${re} is kept`);
    for (const [word, reason] of Object.entries(e.excludedReason ?? {})) assert.equal(out.excluded.find((x) => x.name.toLowerCase().includes(word))?.reason, reason, `"${word}" is excluded as ${reason}`);
    for (const [word, level] of Object.entries(e.relevance ?? {})) assert.equal(out.exercises.find((x) => x.draft.toLowerCase().includes(word))?.relevance, level, `"${word}" is ${level}`);
    for (const x of out.exercises) if (x.relevance === 'unverified') assert.ok(x.relevance_reason, `"${x.draft}" says why it is not verified`);
    if (e.others) assert.deepEqual((out.kb.others ?? []).map((o) => [o.region, o.side, o.match?.id ?? null, o.relevance, o.relevanceReason]), e.others, 'a sheet for each other region treated today, with its side and why');
    if (e.kbRelevance) assert.deepEqual([out.kb.relevance, out.kb.relevanceReason], e.kbRelevance, 'the condition sheet is marked as not verified, with the reason');
    else if (out.kb.match) assert.equal(out.kb.relevance, 'verified', 'a sheet of a recognised, compatible region is verified');
    for (const x of out.exercises) {
      if (x.provider === 'exercises' || x.provider === 'wger') assert.notEqual(R.exerciseFit(x, K.caseRegionsOf(out.transcript, out.note)), 'incompatible', `matched database exercise "${x.name}" is not of another region`);
    }
  });
}

test('facts the clinician did not give: findings and tests by concept, visits and agreements; no false alarms', () => {
  const said = 'Lombalgia da due giorni, nessuna irradiazione. Ci rivediamo giovedì.';
  const kinds = (s, t = said) => F.unsupportedFindings(s, t).map((f) => `${f.kind}:${f.item}`);
  assert.deepEqual(kinds('Assenza di radicolopatia.'), [], 'the clinician spoke about radiation: a statement about it is supported');
  assert.deepEqual(kinds('Nessuna instabilità.'), ['invented_finding:instabilita'], 'a negative finding not given is still a finding');
  assert.deepEqual(kinds('Rotazione cervicale ridotta.'), ['invented_finding:rotazione'], 'a reduced movement is a range-of-motion finding');
  assert.deepEqual(kinds('Lachman negativo, edema assente.'), ['invented_test:lachman', 'invented_finding:edema']);
  assert.deepEqual(kinds('Edema perimalleolare.', 'caviglia gonfia dopo la distorsione'), [], 'swelling said in other words');
  const arr = (s, t = said) => F.unsupportedArrangements(s, t).map((f) => `${f.kind}:${f.item}`);
  assert.deepEqual(arr('Sedute due volte a settimana per un mese.'), ['invented_appointment:sedute'], 'no visit numbers were given');
  assert.deepEqual(arr('Ci vediamo giovedì.'), [], 'the clinician said it');
  assert.deepEqual(arr('Esercizi di controllo motorio 3 volte a settimana.'), [], 'an exercise frequency and "controllo motorio" are not visits');
  assert.deepEqual(arr('Abbiamo concordato un ciclo di tecar.'), ['invented_agreement:abbiamo concordato']);
  assert.ok(F.isHedged('Possibile radicolopatia da escludere.') && !F.isHedged('Assenza di radicolopatia.'));
  // Cleaning: only what was not said goes, clause by clause, and is listed.
  const { note, removed } = K.sanitizeGeneratedNote({ objective: 'Dolore in flessione, Lachman positivo. ROM conservato.', plan: 'Esercizio progressivo. Rivalutazione tra due settimane.', summaryForPatient: 'Ci vediamo giovedì.' }, 'dolore in flessione del ginocchio, ci rivediamo giovedì');
  assert.deepEqual([note.objective, note.plan, note.summaryForPatient], ['Dolore in flessione.', 'Esercizio progressivo.', 'Ci vediamo giovedì.']);
  assert.deepEqual(removed.map((r) => `${r.section}:${r.kind}:${r.text}`), ['objective:invented_test:Lachman positivo', 'objective:invented_finding:ROM conservato', 'plan:invented_appointment:Rivalutazione tra due settimane']);
});

test('exercises: a position is not a region; a match needs the same movement', () => {
  assert.deepEqual(R.exerciseTextRegions('Rotazione esterna con elastico, gomito a 90° al fianco'), ['shoulder', 'hip'], '"gomito a 90°" is the position: only the movement says where');
  assert.deepEqual(R.exerciseTextRegions('Flessione del gomito con manubrio'), ['elbow'], 'an elbow exercise stays one');
  assert.deepEqual(R.exerciseTextRegions('Ponte con ginocchia flesse'), ['hip'], '"ginocchia flesse" is the position, the bridge works on the hip');
  assert.equal(M.isRegionOnlyKeyword('shoulder'), true);
  assert.equal(M.isRegionOnlyKeyword('shoulder external rotation'), false);
  assert.equal(M.checkMatch('Rotazione esterna con elastico', ['external rotation'], 'Shoulder external rotation with band'), 'verified');
  assert.equal(M.checkMatch('Pendolo di Codman', ['pendulum'], 'Shoulder external rotation with band'), 'conflict');
  assert.equal(M.checkMatch('Sollevamento del braccio in posizione prona', ['shoulder external rotation'], 'Shoulder external rotation with band'), 'conflict');
  assert.equal(M.checkMatch('Sollevamento del braccio in posizione prona', ['prone y raise'], 'Prone Y raise'), 'verified');
  assert.equal(M.checkMatch('Chin tuck 3x10', ['chin tuck'], 'Chin tuck'), 'verified');
  assert.equal(M.checkMatch('Esercizio X', ['band row'], 'Band pull apart'), 'unverified', 'a shared word without a known movement is not a match');
});

// ---------------------------------------------------------------- regressions from the real model
// Each reproduces, with synthetic content and a scripted model, what the real
// model wrote in a check the user ran (see CASES.real*).

/** The checks on the model's note as written (before PHYGO's own clean-up). */
const rawIssues = (name) => K.checkOutput({ transcript: CASES[name].transcript, note: CASES[name].note, exercises: [], papers: [], protocol: null }).map((i) => `${i.kind}:${i.item}${i.section ? `@${i.section}` : ''}`);

test('real model, low back pain with knee history: invented findings and visits are caught, the history is not a false alarm', async () => {
  const raw = rawIssues('realLumbarHistory');
  for (const want of ['invented_finding:limitazione@objective', 'invented_finding:radicolopatia@objective', 'invented_finding:instabilita@objective']) assert.ok(raw.includes(want), `${want} (found: ${raw.join(' | ')})`);
  assert.ok(raw.some((i) => i.startsWith('invented_appointment:') && i.endsWith('@summaryForPatient')), `the follow-up in the patient summary (found: ${raw.join(' | ')})`);
  assert.ok(raw.some((i) => i.startsWith('invented_appointment:') && i.endsWith('@plan')), `the visit frequency in the plan (found: ${raw.join(' | ')})`);
  assert.ok(!raw.some((i) => i.startsWith('history_as_active') || i.startsWith('side:') || i.startsWith('section_region')), `history stated as history is not an error (found: ${raw.join(' | ')})`);

  const out = await runCase('realLumbarHistory');
  // The note shown keeps only what the clinician said; what was removed is listed, with the reason.
  assert.doesNotMatch(out.note.objective, /ROM|radicolopat|instabilit/i);
  assert.doesNotMatch(out.note.summaryForPatient, /vediamo|controllo tra|settiman/i);
  assert.doesNotMatch(out.note.plan, /sedute|settiman/i);
  assert.match(out.note.plan, /esercizio terapeutico graduale/i, 'the rest of the plan stays');
  assert.match(out.note.subjective, /anamnesi intervento al ginocchio sinistro/i, 'the reported history stays');
  for (const [section, re] of [['objective', /ROM/], ['objective', /radicolopatia/], ['objective', /instabilit/], ['summaryForPatient', /vediamo/], ['plan', /Sedute/]]) {
    assert.ok(out.removed.some((r) => r.section === section && re.test(r.text) && r.kind && r.item), `${section}: "${re}" removed with a reason`);
  }
  const issues = check('realLumbarHistory', out).map((i) => i.kind);
  assert.ok(!issues.includes('history_as_active') && !issues.includes('invented_finding') && !issues.includes('invented_appointment'), `nothing left to flag (found: ${issues.join(', ')})`);
});

test('real model, right shoulder + left knee: every invented finding is caught; sheets, papers and exercises cover both regions', async () => {
  const raw = rawIssues('realMultisite');
  for (const want of ['invented_test:neer@objective', 'invented_test:hawkins@objective', 'invented_finding:gonfiore@objective', 'invented_finding:limitata@objective', 'invented:90 gradi@objective']) assert.ok(raw.includes(want), `${want} (found: ${raw.join(' | ')})`);
  const out = await runCase('realMultisite');
  assert.equal(out.note.objective.trim(), '', 'no objective finding was reported: none is shown');
  assert.equal(out.removed.filter((r) => r.section === 'objective').length, 3);
  // Protocol: the shoulder sheet, and for the other region treated today the
  // generic knee sheet, with its side: the clinician described knee pain, the
  // patellofemoral diagnosis is only the model's.
  assert.equal(out.kb.match?.id, 1);
  assert.deepEqual((out.kb.others ?? []).map((o) => [o.region, o.side, o.match?.id ?? null, o.relevance]), [['knee', 'left', 15, 'verified']]);
  // Evidence for each region.
  const ids = out.papers.map((p) => p.id);
  assert.ok(ids.includes('p-shoulder') && ids.includes('p-pfp'), `papers for both regions (got ${ids.join(', ')})`);
  const kinds = check('realMultisite', out).map((i) => `${i.kind}:${i.item}`);
  assert.ok(!kinds.some((k) => k.startsWith('coverage') || k.startsWith('side:')), `both regions covered, sides right (found: ${kinds.join(' | ')})`);

  const noKnee = check('realMultisiteNoKnee', await runCase('realMultisiteNoKnee')).map((i) => `${i.kind}:${i.item}`);
  assert.ok(noKnee.includes('coverage_exercises:knee'), `a region treated today without exercises is flagged (found: ${noKnee.join(' | ')})`);
});

test('real model, left shoulder: exercises matched by movement, region and side, not by a shared word', async () => {
  const out = await runCase('realExerciseMatch');
  const byDraft = (re) => out.exercises.find((x) => re.test(x.draft));
  const pendulum = byDraft(/pendolo/i);
  const prone = byDraft(/prona/i);
  const er = byDraft(/rotazione esterna/i);
  assert.ok(pendulum && prone && er, `all three stay in the programme (excluded: ${out.excluded.map((x) => x.name).join(', ')})`);
  assert.notEqual(pendulum.name, 'Shoulder external rotation with band', 'the pendulum is not swapped for the external rotation');
  assert.notEqual(prone.name, 'Shoulder external rotation with band', 'the prone raise is not swapped for the external rotation');
  assert.equal(er.name, 'Shoulder external rotation with band', '"elbow at 90°" is a position, not the region: the external rotation is matched');
  assert.equal(er.relevance, 'compatible');
  assert.equal(pendulum.relevance, 'compatible', 'the pendulum is a shoulder exercise');
  assert.equal(prone.match_status, 'unverified', 'the database suggestion for the prone raise moves differently: not trusted');
});

// ---------------------------------------------------------------- second check with the real model (after cf0e971)

test('real model 2, left shoulder: "gomito vicino al corpo" is a position, the external rotation is a shoulder exercise', async () => {
  const out = await runCase('r4ShoulderLeft');
  assert.deepEqual(out.excluded.map((x) => `${x.name}:${x.reason}`), [], 'nothing excluded');
  const er = out.exercises.find((x) => /rotazione esterna/i.test(x.draft));
  assert.equal(er?.name, 'Shoulder external rotation with band');
  assert.equal(er?.relevance, 'compatible');
});

test('real model 2, low back pain: spine, pelvis and core exercises are recognised; none is excluded or left "not verified"', async () => {
  const out = await runCase('r4HistoryKnee');
  assert.deepEqual(out.excluded.map((x) => `${x.name}:${x.reason}:${x.regions.join('/')}`), [], 'the spinal rotation is not a shoulder exercise');
  const byDraft = Object.fromEntries(out.exercises.map((x) => [x.draft, x]));
  for (const d of ['Mobilizzazione della colonna vertebrale con rotazione 2x10', 'Plank 3x20 secondi', 'Mobilità del bacino 2x10', 'Bird-dog 3x8', 'Flessione laterale della colonna 2x10']) {
    assert.equal(byDraft[d]?.relevance, 'compatible', `${d}: ${byDraft[d]?.relevance} ${byDraft[d]?.relevance_reason ?? ''}`);
  }
  assert.notEqual(byDraft['Mobilizzazione della colonna vertebrale con rotazione 2x10'].name, 'Shoulder internal rotation', 'not swapped for a shoulder exercise sharing "rotation"');
});

test('real model 2, right shoulder + left knee: a sheet for each region with its side, no diagnosis more specific than stated; papers checked for population and mechanism; a trunk exercise "for the shoulder" is not a shoulder exercise', async () => {
  const out = await runCase('r4MultiSite');
  // The knee: only pain is stated, so the generic knee sheet, verified; never a more specific diagnosis.
  const knee = (out.kb.others ?? []).find((o) => o.region === 'knee');
  assert.ok(knee, 'the knee is searched as a region treated today');
  assert.equal(knee.side, 'left');
  assert.equal(knee.match?.id, 15, `knee sheet: ${JSON.stringify(knee.match)}`);
  assert.equal(knee.relevance, 'verified');
  // The shoulder: "cuffia dei rotatori" is the model's hypothesis, not what was said.
  assert.equal(out.kb.relevance, 'unverified');
  assert.equal(out.kb.relevanceReason, 'diagnosis_not_stated');
  // Adolescents and trauma are not in the case: the leg-pain paper is not direct evidence.
  const leg = out.papers.find((p) => p.id === 'p-leg');
  assert.ok(!leg || leg.relevance === 'unverified', `p-leg: ${leg?.relevance} ${leg?.relevance_reason ?? ''}`);
  if (leg) assert.equal(leg.relevance_reason, 'population_or_mechanism_not_stated');
  // The trunk lateral flexion works the trunk, whatever it is written "for".
  const trunk = out.excluded.find((x) => /flessione laterale del tronco/i.test(x.name));
  assert.ok(trunk && !out.exercises.some((x) => /tronco/i.test(x.draft)), 'left out of the programme, with its reason');
  assert.deepEqual(trunk.regions, ['lumbar']);
  const kinds = check('r4MultiSite', out).map((i) => `${i.kind}:${i.item}`);
  assert.ok(!kinds.includes('coverage_protocol:knee'), `the knee has its sheet (found: ${kinds.join(' | ')})`);
});

test('reported objective data stay in the note; when none was reported, the panel says so', async () => {
  const out = await runCase('r4ObjectiveReported');
  assert.equal(out.note.objective, 'Flessione 120 gradi, Lachman negativo, lieve versamento.');
  assert.deepEqual(out.removed, []);
  const kinds = check('r4ObjectiveReported', out).map((i) => i.kind);
  assert.ok(!kinds.some((k) => k.startsWith('invented')), kinds.join(', '));
  const none = check('r4HistoryKnee', await runCase('r4HistoryKnee')).map((i) => i.kind);
  assert.ok(none.includes('objective_missing'), `an empty objective is stated (found: ${none.join(', ')})`);
});

// ---------------------------------------------------------------- third check with the real model (after eff1dbe)

test('real model 3, low back pain: no negative result that was not assessed; the documented one stays', async () => {
  const raw = rawIssues('r5LowBack');
  assert.ok(raw.some((x) => x.startsWith('invented_negative:') && x.endsWith('@assessment')), `the negative in the assessment is caught (found: ${raw.join(' | ')})`);
  assert.ok(raw.some((x) => x.startsWith('invented_negative:') && x.endsWith('@redFlagsPrecautions')), 'the absence of red flags is caught');
  assert.ok(!raw.some((x) => x.startsWith('invented_negative:') && x.endsWith('@findingsAgainst')), '"assenza di irradiazione" was said: not an invented negative');
  const out = await runCase('r5LowBack');
  assert.match(out.note.assessment, /^Lombalgia acuta di origine meccanica/, 'what is supported stays');
  assert.doesNotMatch(out.note.assessment, /neurolog|condizioni acute/i, 'no "no neurological signs / no other acute condition"');
  assert.doesNotMatch(out.note.clinicalReasoning.redFlagsPrecautions, /nessuna red flag/i);
  assert.match(out.note.clinicalReasoning.redFlagsPrecautions, /non indagat/i, 'red flags not assessed: said so, not declared absent');
  assert.equal(out.note.clinicalReasoning.findingsAgainst, 'Assenza di irradiazione alla gamba.', 'a documented negative is kept');
  assert.match(out.note.subjective, /nessuna irradiazione/);
  const removed = out.removed.map((r) => `${r.section}:${r.kind}`);
  assert.ok(removed.includes('assessment:invented_negative') && removed.includes('redFlagsPrecautions:invented_negative'), removed.join(', '));
  const kinds = check('r5LowBack', out).map((i) => i.kind);
  assert.ok(!kinds.includes('invented_negative'), `nothing left to flag (found: ${kinds.join(', ')})`);
});

test('real model 3, right shoulder + left knee: pain is not turned into certain diagnoses', async () => {
  const raw = rawIssues('r5MultiSite');
  assert.ok(raw.some((x) => x.startsWith('unconfirmed_diagnosis:') && x.endsWith('@assessment')), `found: ${raw.join(' | ')}`);
  const out = await runCase('r5MultiSite');
  const parts = F.sentencesOf(out.note.assessment);
  assert.equal(parts.length, 2);
  for (const p of parts) assert.match(p, /^Ipotesi da confermare: /, `labelled as a hypothesis: ${p}`);
  assert.ok(out.removed.some((r) => r.section === 'assessment' && r.kind === 'unconfirmed_diagnosis' && r.replacement?.startsWith('Ipotesi da confermare')), 'listed, with what replaced it');
  const kinds = check('r5MultiSite', out).map((i) => i.kind);
  assert.ok(!kinds.includes('unconfirmed_diagnosis'), kinds.join(', '));
  // In the message to the patient an unstated diagnosis is taken out, not labelled.
  const { note: toPatient, removed } = K.sanitizeGeneratedNote({ language: 'it', summaryForPatient: 'Hai una condromalacia patellare. Oggi abbiamo trattato spalla e ginocchio.' }, CASES.r5MultiSite.transcript);
  assert.equal(toPatient.summaryForPatient, 'Oggi abbiamo trattato spalla e ginocchio.');
  assert.deepEqual(removed.map((r) => `${r.section}:${r.kind}:${r.replacement ?? ''}`), ['summaryForPatient:unconfirmed_diagnosis_removed:']);
  assert.deepEqual(F.unsupportedNegatives('Nessun segno di allarme riferito.', CASES.r5LowBack.transcript).map((f) => f.kind), ['invented_negative']);
  // Hedged hypotheses stay as they are.
  assert.deepEqual(out.note.clinicalReasoning.hypotheses, ['Possibile tendinopatia della cuffia dei rotatori.', 'Possibile dolore femororotuleo.']);
});

test('real model 3: exercises and dosages the clinician did not give are generated suggestions', async () => {
  const t = CASES.r5MultiSite.transcript;
  for (const d of CASES.r5MultiSite.note.exercises) assert.deepEqual(F.exerciseOrigin(d, t), { origin: 'suggested', dosage: 'suggested' }, d);
  const said = 'Dolore alla spalla sinistra da un mese. Oggi abbiamo fatto rotazione esterna con elastico 3x12 e pendolo di Codman. A casa proseguirà con la retrazione scapolare.';
  assert.deepEqual(F.exerciseOrigin('Rotazione esterna con elastico 3x12', said), { origin: 'performed', dosage: 'stated' });
  assert.deepEqual(F.exerciseOrigin('Pendolo di Codman', said), { origin: 'performed', dosage: null });
  assert.deepEqual(F.exerciseOrigin('Retrazione scapolare 3x10', said), { origin: 'stated', dosage: 'suggested' }, 'named for home, the dose is not the clinician\'s');
  assert.deepEqual(F.exerciseOrigin('Chin tuck 3x10', said), { origin: 'suggested', dosage: 'suggested' });
  assert.equal(F.dosingOrigin({ sets: 3, reps: 12, duration_seconds: null, frequency_per_week: null }, said), 'stated');
  assert.equal(F.dosingOrigin({ sets: 3, reps: 12, duration_seconds: null, frequency_per_week: 5 }, said), 'suggested', 'a frequency nobody gave');
  assert.equal(F.dosingOrigin({ sets: null, reps: null, duration_seconds: null, frequency_per_week: null }, said), null);
  // The plan: a dose the clinician did not give is labelled, not attributed to them.
  const raw = rawIssues('r5MultiSite');
  assert.ok(raw.some((x) => x.startsWith('generated_dosage:') && x.endsWith('@plan')), `found: ${raw.join(' | ')}`);
  const out = await runCase('r5MultiSite');
  for (const p of F.sentencesOf(out.note.plan)) assert.match(p, /^Proposta generata, da confermare: /, p);
  assert.ok(!check('r5MultiSite', out).some((i) => i.kind === 'generated_dosage'));
  // Said dosage is not relabelled.
  assert.deepEqual(F.unstatedDosage('Rotazione esterna 3x12 oggi.', said), []);
});

test('real model 3: a cuff exercise "con gomito flesso a 90 gradi" is a shoulder exercise; the plan naming both regions is not off-region; an Achilles paper is not knee evidence', async () => {
  assert.deepEqual(R.exerciseTextRegions('Esercizi isometrici per la cuffia dei rotatori con gomito flesso a 90 gradi 3x10'), ['shoulder'], 'the purpose tells the region when nothing else does');
  assert.deepEqual(R.exerciseTextRegions('Flessione laterale del tronco per la spalla destra'), ['lumbar'], 'a named target still wins over the purpose');
  const out = await runCase('r5MultiSite');
  const iso = out.exercises.find((x) => /isometrici/i.test(x.draft));
  assert.equal(iso?.relevance, 'compatible', `${iso?.relevance} ${iso?.relevance_reason ?? ''}`);
  assert.ok(!out.excluded.length, out.excluded.map((x) => x.name).join(', '));
  const kinds = check('r5MultiSite', out).map((i) => `${i.kind}:${i.item}`);
  assert.ok(!kinds.includes('section_region:plan'), `"gomito a 90 gradi" in the plan is a position (found: ${kinds.join(' | ')})`);
  const achilles = out.papers.find((p) => p.id === 'p-achilles');
  assert.ok(achilles, 'the Achilles paper is found by "tendinopathy"');
  assert.notEqual(achilles.relevance_reason, 'same_region');
  assert.notEqual(achilles.relevance, 'direct');
  assert.ok(!(achilles.regions ?? []).includes('knee'), `not counted as knee evidence: ${JSON.stringify(achilles.regions)}`);
});

test('multi-region notes: the plan check finds real omissions and real off-region statements, not positions', () => {
  const t = CASES.r5MultiSite.transcript;
  const run = (plan) => K.checkOutput({ transcript: t, note: { objective: 'x', assessment: 'Dolore alla spalla destra e al ginocchio sinistro.', plan, primaryCondition: 'right shoulder pain' }, exercises: [], papers: [], protocol: null }).map((i) => `${i.kind}:${i.kind === 'section_region' ? i.regions.join('/') : i.item}`).filter((x) => /^(section_region|coverage_plan|side)/.test(x));
  assert.deepEqual(run('Rotazione esterna con elastico, gomito a 90 gradi, per la spalla destra; step-down per il ginocchio sinistro.'), []);
  assert.deepEqual(run('Rotazione esterna con elastico per la spalla destra.'), ['coverage_plan:knee'], 'a region treated today that the plan leaves out');
  assert.deepEqual(run('Esercizi per la spalla destra e il ginocchio sinistro; propriocezione della caviglia e rinforzo del gomito.'), ['section_region:elbow'], 'a region really named as treated stays flagged');
  assert.deepEqual(run('Esercizi per la spalla destra e il ginocchio destro.'), ['side:plan']);
});

test('anatomical mapping: no false region from a word that names another structure', () => {
  assert.deepEqual(R.regionsOf('dolore al collo del piede'), ['ankle_foot']);
  assert.deepEqual(R.regionsOf('frattura del collo del femore'), ['hip']);
  assert.deepEqual(R.regionsOf('femoral neck fracture'), ['hip']);
  assert.deepEqual(R.regionsOf('frattura del piatto tibiale'), ['knee']);
  assert.deepEqual(R.regionsOf('sindrome della bandelletta ileotibiale'), ['thigh']);
  assert.deepEqual(R.regionsOf('Loading programmes in Achilles tendinopathy'), ['ankle_foot']);
});

// ---------------------------------------------------------------- fourth check with the real model (after 9fa65eb)

test('real model 4, history: a past operation the clinician reported stays in the note, as history only', async () => {
  const out = await runCase('r6HistoryKnee');
  assert.match(out.note.subjective, /^Lombalgia\./);
  assert.match(out.note.subjective, /in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico/i, `the reported history is kept: ${out.note.subjective}`);
  assert.ok(out.removed.some((r) => r.section === 'subjective' && r.kind === 'history_added' && /ginocchio sinistro/.test(r.replacement ?? '')), 'listed as added, so it can be taken out');
  // History, never today's problem: no knee sheet, protocol, exercise or check.
  const view = K.caseOf(out.transcript, out.note);
  assert.deepEqual(view.profile.active, ['lumbar']);
  assert.ok(R.caseProfile(out.note.subjective).history.includes('knee'), 'the knee is history in the subjective too');
  assert.equal(out.kb.match?.id, 7);
  assert.deepEqual((out.kb.others ?? []).map((o) => o.region), [], 'no sheet for the knee');
  assert.ok(!out.exercises.some((x) => R.exerciseRegions(x).includes('knee')), 'no knee exercise');
  const kinds = check('r6HistoryKnee', out).map((i) => `${i.kind}:${i.item}`);
  assert.ok(!kinds.some((k) => /^(history_as_active|section_region|district|coverage_)/.test(k)), kinds.join(' | '));
  // A note that already keeps the history is not changed.
  const kept = K.sanitizeGeneratedNote({ language: 'it', subjective: 'Lombalgia. Pregresso intervento al ginocchio sinistro, ora asintomatico.' }, CASES.r6HistoryKnee.transcript);
  assert.deepEqual(kept.removed, []);
});

test('real model 4: an exercise done today is "performed" whatever the wording; its dose stays the AI\'s when not given', () => {
  const t = CASES.r6ShoulderLeft.transcript;
  for (const d of ['Extrarotazione della spalla sinistra con banda elastica, gomito al fianco, 3x12', 'Rotazioni esterne con theraband 3 serie da 12', 'External rotation with resistance band 3x12', 'Esercizi di rotazione esterna della spalla con elastico, gomito vicino al corpo, 3x12']) {
    assert.deepEqual(F.exerciseOrigin(d, t), { origin: 'performed', dosage: 'suggested' }, d);
  }
  assert.deepEqual(F.exerciseOrigin('Rotazione esterna con elastico', t), { origin: 'performed', dosage: null });
  // Prudent when it is not the same exercise.
  assert.deepEqual(F.exerciseOrigin('Rotazione interna con elastico 3x12', t).origin, 'suggested', 'another movement');
  assert.deepEqual(F.exerciseOrigin('Rotazione esterna con manubrio 3x10', t).origin, 'suggested', 'another tool');
  assert.deepEqual(F.exerciseOrigin('Rotazione esterna dell\'anca con elastico 3x10', t).origin, 'suggested', 'another region');
  assert.deepEqual(F.exerciseOrigin('Retrazione scapolare 3x10', t).origin, 'suggested');
  assert.deepEqual(F.exerciseOrigin('Rotazione esterna con elastico 3x12', 'Dolore alla spalla sinistra. Oggi non abbiamo fatto esercizi di rotazione esterna con elastico.').origin, 'suggested', 'said as not done');
  assert.deepEqual(F.exerciseOrigin('Rotazione esterna con elastico 3x12', 'Dolore alla spalla sinistra. Potremmo proporre esercizi di rotazione esterna con elastico.').origin, 'stated', 'named, not done');
});

test('real model 4: the patient summary does not turn the AI\'s proposals into a prescription', async () => {
  const out = await runCase('r6ShoulderLeft');
  assert.match(out.note.summaryForPatient, /^Oggi abbiamo fatto terapia manuale ed esercizi per la spalla\./, 'what was done today stays');
  assert.doesNotMatch(out.note.summaryForPatient, /come ti ho mostrato|3 serie|ogni giorno/i, out.note.summaryForPatient);
  assert.match(out.note.summaryForPatient, /ti confermerà/i, 'the home exercises are left for the clinician to confirm');
  const r = out.removed.find((x) => x.section === 'summaryForPatient' && x.kind === 'unapproved_instruction');
  assert.ok(r && /come ti ho mostrato/.test(r.text) && r.replacement, 'listed, with what replaced it, so it can be restored on purpose');
  const multi = await runCase('r6MultiSite');
  assert.doesNotMatch(multi.note.summaryForPatient, /3 serie|step-down|ogni giorno/i, multi.note.summaryForPatient);
  assert.match(multi.note.summaryForPatient, /^Oggi abbiamo trattato spalla e ginocchio\./);
  for (const o of [out, multi]) {
    const kinds = check('r6', o).map((i) => i.kind);
    assert.ok(!kinds.includes('unapproved_instruction'), kinds.join(', '));
  }
  // Raw drafts are flagged.
  assert.ok(rawIssues('r6ShoulderLeft').some((x) => x.startsWith('unapproved_instruction:') && x.endsWith('@summaryForPatient')));
  // A home programme the clinician did give stays, with their dose.
  const said = 'Dolore alla spalla sinistra. Oggi esercizi di rotazione esterna con elastico. A casa proseguirà con la retrazione scapolare 3x10.';
  const kept = K.sanitizeGeneratedNote({ language: 'it', summaryForPatient: 'A casa continua con la retrazione scapolare, 3 serie da 10.', exercises: ['Retrazione scapolare 3x10'] }, said);
  assert.equal(kept.note.summaryForPatient, 'A casa continua con la retrazione scapolare, 3 serie da 10.');
  assert.deepEqual(kept.removed, []);
});

test('real model 4: "verified" is the sheet matching the documented case, never a confirmed diagnosis', async () => {
  const shoulder = await runCase('r6ShoulderLeft');
  assert.equal(shoulder.kb.match?.id, 1);
  assert.equal(shoulder.kb.relevance, 'verified', 'the sheet matches the condition the clinician named');
  assert.equal(shoulder.kb.diagnosisStatus, 'suspected', '"Sospetta problematica della cuffia": a suspicion, not a diagnosis');
  const stated = await runCase('supraspinatusRight');
  assert.equal(stated.kb.diagnosisStatus, 'stated');
  const pain = await runCase('r4MultiSite');
  assert.equal(pain.kb.diagnosisStatus, 'not_stated');
  const knee = (pain.kb.others ?? []).find((o) => o.region === 'knee');
  assert.deepEqual([knee?.relevance, knee?.relevanceReason, knee?.diagnosisStatus], ['verified', 'symptom_only', 'not_stated'], 'a matching generic sheet, and no diagnosis');
});

test('the screenshot case in detail: no hamstring/ankle swap, no leg paper', async () => {
  const out = await runCase('shoulderLeft');
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
  const a = await runCase('shoulderLeft');
  const b = await runCase('kneeRight');
  const c = await runCase('hipRight');
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
  assert.doesNotMatch(note, /structures to rule out|sensible frequency\/timeline/i, 'no invitation to add findings or a visit timeline');
  assert.match(note, /never add a finding/i, 'objective findings only as reported');
  assert.match(note, /visit frequency/i, 'no appointments or visit frequency that were not agreed');
  assert.match(note, /every past condition/i, 'reported history is kept, as history');
  assert.match(note, /not yet approved/i, 'the patient summary does not present proposals as prescribed');
  assert.doesNotMatch(note, /may appear briefly in "subjective" if relevant/, 'history is no longer optional');
});

after(() => {
  if (process.env.CLINICAL_REPORT) writeFileSync(process.env.CLINICAL_REPORT, JSON.stringify(report, null, 2));
});
