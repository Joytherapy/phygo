// What the API lets an unverified account (or a visitor with no account) do,
// for the two code versions of the release plan
// (docs/security/professional-verification-rollout.md, "Release states"):
//
//   RELEASE_CODE=new (default): the code of this branch (states S3 and S4)
//   RELEASE_CODE=old:           the current production code, run by
//                               tests/release_states_old.sh (states S1, S2, S2+B)
//
// The API does not depend on the database rules (the fake server has no RLS),
// so this file covers the API half of each state; tests/sql/release_sequence.sh
// covers the database half. OpenAI and Daily are local stand-ins; any request
// to a real host is blocked and logged by tests/support/no-external-network.cjs.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { verificationRpc } from './support/verification-rpc.mjs';
import { startApp } from './support/app.mjs';

const CODE = process.env.RELEASE_CODE === 'old' ? 'old' : 'new';
const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);
const user = (id, email) => ({ id, email, email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' });
const U = user('70000000-0000-4000-8000-000000000001', 'unverified@test.invalid'); // declared professional, not verified, not listed
const O = user('70000000-0000-4000-8000-000000000002', 'other@test.invalid'); // another clinician
const cookie = (who) => (who ? { cookie: sessionCookie(`tok-${who.email}`, who) } : {});
const metabolic = { sex: 'female', age: 40, weightKg: 65, heightCm: 168, activityLevel: 'moderate', goal: 'maintain', macroStrategy: 'balanced' };

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({
    rpc: verificationRpc,
    port: FAKE_PORT,
    users: { [`tok-${U.email}`]: U, [`tok-${O.email}`]: O },
    tables: {
      profiles: [
        { id: U.id, practice_stage: 'professional', professional_status: 'not_applicable', plan: 'free' },
        { id: O.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free' },
      ],
      patients: [
        { id: 'p-own', user_id: U.id, patient_user_id: null, name: 'Synthetic own patient' },
        { id: 'p-other', user_id: O.id, patient_user_id: null, name: 'Synthetic other patient' },
      ],
      metabolic_profiles: [
        { id: 'm-other', patient_id: 'p-other', entered_by: 'professional', shared_with_professional: true, weight_kg: 80, created_at: '2026-10-01T00:00:00Z' },
      ],
      patient_clinical_references: [],
      professional_transition_accounts: [],
      ask_phygo_usage: [],
      demo_usage: [],
      knowledge_base: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url, env: { DAILY_API_KEY: 'test-daily-key' } });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const call = (method, path, who, body) =>
  fetch(`${app.url}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...cookie(who) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const openai = () => fake.state.requests.filter((r) => r.path.startsWith('/openai/')).length;
// A Daily attempt is either a call to the local stand-in or a blocked request to the real host.
const daily = () =>
  fake.state.requests.filter((r) => r.path.startsWith('/daily/')).length +
  (app.logs().match(/blocked external request to api\.daily\.co/g) ?? []).length;
const reaches = async (counter, fn) => {
  const before = counter();
  await fn();
  await new Promise((r) => setTimeout(r, 50));
  return counter() > before;
};
const rows = (patientId) => fake.state.tables.metabolic_profiles.filter((m) => m.patient_id === patientId).length;

// [capability, how to observe it, open in the old code, open in the new code]
const CAPABILITIES = [
  ['visitor without an account: clinical AI (generate-note) reaches OpenAI', () => reaches(openai, () => call('POST', '/api/generate-note', null, { transcript: 'synthetic', lang: 'en' })), true, false],
  ['visitor without an account: clinical AI (analyze-scan) reaches OpenAI', () => reaches(openai, () => call('POST', '/api/analyze-scan', null, { images: ['x'] })), true, false],
  ['visitor without an account: Ask PHYGO reaches OpenAI', () => reaches(openai, () => call('POST', '/api/ask-phygo', null, { question: 'synthetic' })), true, false],
  ['visitor without an account: a Daily room is requested', () => reaches(daily, () => call('POST', '/api/video-call/create-room', null, { patientId: 'p-other' })), true, false],
  ['unverified account: clinical AI reaches OpenAI', () => reaches(openai, () => call('POST', '/api/generate-note', U, { transcript: 'synthetic', lang: 'en' })), true, false],
  ['unverified account: a Daily room is requested for its own patient', () => reaches(daily, () => call('POST', '/api/video-call/create-room', U, { patientId: 'p-own' })), true, false],
  ['unverified account: reads metabolic data of another clinician’s patient', async () => {
    const res = await call('GET', '/api/metabolic/save?patientId=p-other', U);
    return res.status === 200 && ((await res.json()).profiles ?? []).length > 0;
  }, true, false],
  ['unverified account: writes metabolic data on another clinician’s patient', async () => {
    const before = rows('p-other');
    await call('POST', '/api/metabolic/save', U, { ...metabolic, patientId: 'p-other' });
    return rows('p-other') > before;
  }, true, false],
  ['unverified account: writes metabolic data on its own patient', async () => {
    const before = rows('p-own');
    await call('POST', '/api/metabolic/save', U, { ...metabolic, patientId: 'p-own' });
    return rows('p-own') > before;
  }, true, false],
  ['unverified account: reads metabolic data of its own patient (intended in both)', async () => (await call('GET', '/api/metabolic/save?patientId=p-own', U)).status === 200, true, true],
];

for (const [name, observe, openOld, openNew] of CAPABILITIES) {
  const expected = CODE === 'old' ? openOld : openNew;
  test(`[${CODE} code] ${name}: ${expected ? 'OPEN' : 'closed'}`, async () => {
    assert.equal(await observe(), expected);
  });
}

// Deploy marker used by the release guide (step 8) to tell which code is live:
// one anonymous GET, no side effect, no paid call. The new code answers 401
// (the route exists and needs an account); the current code has no such route.
test(`[${CODE} code] deploy marker: anonymous GET /api/profile/verification answers ${CODE === 'old' ? 404 : 401}`, async () => {
  const before = { openai: openai(), daily: daily(), requests: fake.state.requests.length };
  const res = await fetch(`${app.url}/api/profile/verification`);
  assert.equal(res.status, CODE === 'old' ? 404 : 401);
  assert.equal(openai(), before.openai);
  assert.equal(daily(), before.daily);
});

test(`[${CODE} code] no request ever left this machine`, () => {
  // Blocked attempts are logged; they never reach the real host.
  const blocked = app.logs().match(/blocked external request to [^\s]+/g) ?? [];
  if (CODE === 'new') assert.deepEqual(blocked, [], 'the new code does not even try to reach a real host');
  else for (const b of blocked) assert.match(b, /api\.daily\.co$/, 'only the old hard-coded Daily URL is attempted, and blocked');
});
