// What /api/knowledge-lookup says of the diagnosis of the sheet it shows,
// read from what the clinician said, mention by mention with the same
// classification as the note's clean-up (lib/clinical/facts.ts
// textCertainty): stated (affirmed), suspected (uncertain), excluded
// (negated), ambiguous (named, not settled), not_stated. A sheet whose
// condition the clinician excluded, or only named without settling it, is
// not verified. The response keeps its fields.
// The app runs against the fake Supabase with the synthetic sheets of
// tests/support/clinical-world.mjs; no model is called (keyword matches only).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';
import { CLIN, jsonPost, worldTables } from './support/clinical-world.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54873);
const APP_PORT = Number(process.env.DIAGNOSIS_APP_PORT ?? 3873);

let fake;
let app;
let post;
before(async () => {
  fake = await startFakeSupabase({ port: FAKE_PORT, users: { 'tok-clin': CLIN }, tables: worldTables() });
  app = await startApp({ fakeUrl: fake.url, port: APP_PORT });
  post = jsonPost(app.url, sessionCookie('tok-clin', CLIN));
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const CUFF = { primaryCondition: 'Rotator cuff tendinopathy', assessment: 'Tendinopatia della cuffia dei rotatori della spalla destra.', lang: 'it' };
const lookup = (transcript, body = CUFF) => post('/api/knowledge-lookup', { ...body, transcript });
const sheet = (kb) => [kb.match?.id ?? null, kb.relevance, kb.relevanceReason, kb.diagnosisStatus];

test('the sheet\'s diagnosis: stated, suspected, excluded, not confirmed, ambiguous', async () => {
  const CASES = [
    // Affirmed: the sheet matches the case, the diagnosis is the clinician's.
    ['Dolore alla spalla destra. Tendinopatia della cuffia dei rotatori confermata.', [1, 'verified', null, 'stated']],
    ['Right shoulder pain. Rotator cuff tendinopathy is confirmed.', [1, 'verified', null, 'stated']],
    // Suspected, or not confirmed: still a hypothesis.
    ['Dolore alla spalla destra. Sospetta tendinopatia della cuffia dei rotatori.', [1, 'verified', null, 'suspected']],
    ['Dolore alla spalla destra. Tendinopatia della cuffia dei rotatori non confermata.', [1, 'verified', null, 'suspected']],
    ['Dolore alla spalla destra. Non si può escludere una tendinopatia della cuffia dei rotatori.', [1, 'verified', null, 'suspected']],
    ['Right shoulder pain. A rotator cuff tendinopathy cannot be ruled out.', [1, 'verified', null, 'suspected']],
    // Excluded: never "stated", and the sheet is not verified for this case.
    ['Dolore alla spalla destra. Esclusa tendinopatia della cuffia dei rotatori.', [1, 'unverified', 'diagnosis_excluded', 'excluded']],
    ['Dolore alla spalla destra. Nessuna evidenza di tendinopatia della cuffia dei rotatori.', [1, 'unverified', 'diagnosis_excluded', 'excluded']],
    ['Right shoulder pain. Rotator cuff tendinopathy ruled out.', [1, 'unverified', 'diagnosis_excluded', 'excluded']],
    // Ambiguous: named by someone else, or both suspected and excluded.
    ['Dolore alla spalla destra. Il paziente chiede se ha una tendinopatia della cuffia dei rotatori.', [1, 'unverified', 'diagnosis_ambiguous', 'ambiguous']],
    ['Sospetta tendinopatia della cuffia dei rotatori. Dopo i test tendinopatia della cuffia dei rotatori esclusa.', [1, 'unverified', 'diagnosis_ambiguous', 'ambiguous']],
    // Not named by the clinician: from the generated assessment, as before.
    ['Dolore alla spalla destra in elevazione.', [1, 'unverified', 'diagnosis_not_stated', 'not_stated']],
  ];
  const got = [];
  for (const [said] of CASES) got.push([said, sheet(await lookup(said))]);
  assert.deepEqual(got, CASES);
});

test('several diagnoses with different polarity in one sentence: each sheet gets its own', async () => {
  // The cuff tendinopathy is confirmed, the capsulitis next to it excluded.
  assert.deepEqual(sheet(await lookup('Esclusa capsulite adesiva, tendinopatia della cuffia dei rotatori della spalla destra confermata.')), [1, 'verified', null, 'stated']);
  assert.deepEqual(sheet(await lookup('Tendinopatia della cuffia dei rotatori confermata ed esclusa capsulite adesiva della spalla destra.')), [1, 'verified', null, 'stated']);
  // Another region in the same sentence: the knee's ACL tear is excluded, so
  // the knee does not get the ACL sheet as a stated diagnosis; it gets the
  // sheet of what was said plainly ("dolore al ginocchio").
  const both = await lookup('Tendinopatia della cuffia dei rotatori della spalla destra confermata, dolore al ginocchio sinistro con lesione del legamento crociato anteriore esclusa.');
  const knee = (both.others ?? []).find((o) => o.region === 'knee');
  // Suspected for the knee, affirmed for the shoulder.
  const suspected = await lookup('Tendinopatia della cuffia dei rotatori della spalla destra confermata, sospetta lesione del legamento crociato anteriore al ginocchio sinistro.');
  const kneeSuspected = (suspected.others ?? []).find((o) => o.region === 'knee');
  const other = (o) => [o?.match?.id ?? null, o?.relevance, o?.relevanceReason, o?.diagnosisStatus];
  assert.deepEqual(
    { both: [sheet(both), other(knee)], suspected: [sheet(suspected), other(kneeSuspected)] },
    { both: [[1, 'verified', null, 'stated'], [15, 'verified', null, 'stated']], suspected: [[1, 'verified', null, 'stated'], [3, 'verified', null, 'suspected']] },
  );
});

test('the response keeps its fields; the new values are the only change', async () => {
  const kb = await lookup('Dolore alla spalla destra. Esclusa tendinopatia della cuffia dei rotatori. Dolore al ginocchio sinistro.');
  assert.deepEqual(Object.keys(kb).sort(), ['diagnosisStatus', 'evidenceLevel', 'match', 'matchedBy', 'matchedKeyword', 'others', 'phases', 'relevance', 'relevanceReason']);
  assert.deepEqual(Object.keys(kb.others[0]).sort(), ['diagnosisStatus', 'match', 'matchedBy', 'region', 'relevance', 'relevanceReason', 'side']);
  assert.deepEqual([kb.matchedBy, kb.matchedKeyword, kb.phases.map((p) => p.id)], ['keyword', 'rotator cuff tendinopathy', ['ph1-1', 'ph1-2']]);
  for (const v of [kb.diagnosisStatus, ...kb.others.map((o) => o.diagnosisStatus)]) assert.ok([null, 'stated', 'suspected', 'excluded', 'ambiguous', 'not_stated'].includes(v), String(v));
  // Without a transcript, no diagnosis status, as before.
  const none = await post('/api/knowledge-lookup', CUFF);
  assert.deepEqual([none.diagnosisStatus, none.relevance], [null, 'verified']);
});
