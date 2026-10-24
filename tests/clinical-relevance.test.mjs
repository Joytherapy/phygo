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
before(async () => {
  ({ R, K } = await loadClinical());
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
  assert.equal(R.exerciseFit({ name: 'Plank 3x30s' }, ['shoulder']), 'unknown', 'a region not recognised is not "general"');
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
    const found = issues.map((i) => `${i.kind}:${i.item}`);
    if (e.noIssues) assert.deepEqual(found.filter((f) => !f.startsWith('evidence_unverified:')), [], 'a coherent note has no issue in any section');
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
    if (e.kbRelevance) assert.deepEqual([out.kb.relevance, out.kb.relevanceReason], e.kbRelevance, 'the condition sheet is marked as not verified, with the reason');
    else if (out.kb.match) assert.equal(out.kb.relevance, 'verified', 'a sheet of a recognised, compatible region is verified');
    for (const x of out.exercises) {
      if (x.provider === 'exercises' || x.provider === 'wger') assert.notEqual(R.exerciseFit(x, K.caseRegionsOf(out.transcript, out.note)), 'incompatible', `matched database exercise "${x.name}" is not of another region`);
    }
  });
}

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
});

after(() => {
  if (process.env.CLINICAL_REPORT) writeFileSync(process.env.CLINICAL_REPORT, JSON.stringify(report, null, 2));
});
