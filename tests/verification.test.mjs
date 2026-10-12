// Professional verification: declared role vs verified status, and the bounded
// transition list for pre-existing accounts, tested at the API level
// (server-side authorization, not the interface). Synthetic users only;
// OpenAI and Daily are stand-ins on the fake server, so every call to them is
// recorded and none leaves this machine.
// The database rule that stops users from writing their own status is tested
// separately in tests/sql/run.sh.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);
const confirmed = '2026-01-01T00:00:00Z';
let n = 0;
const person = (email) => ({ id: `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, email, email_confirmed_at: confirmed, role: 'authenticated' });
const people = {
  student: person('student@test.invalid'),
  newcomer: person('new@test.invalid'), // registers today as a student, then switches to professional
  declared: person('declared@test.invalid'), // declared professional, never verified, not on the list
  pending: person('pending@test.invalid'),
  needsInfo: person('needs@test.invalid'),
  rejected: person('rejected@test.invalid'),
  verified: person('verified@test.invalid'),
  legacy: person('legacy@test.invalid'), // pre-existing professional on the transition list
  legacyRejected: person('legacy-rejected@test.invalid'), // on the list, then rejected by PHYGO
  legacyStudent: person('legacy-student@test.invalid'), // on the list, but declares themselves a student
  patient: person('patient@test.invalid'), // on the list by mistake: still a patient
  admin: person('admin@test.invalid'), // listed in PHYGO_ADMIN_EMAILS by tests/support/app.mjs
};
const users = Object.fromEntries(Object.entries(people).map(([k, u]) => [`tok-${k}`, u]));
const cookie = (who) => (who ? { cookie: sessionCookie(`tok-${who}`, people[who]) } : {});
const profile = (who, practice_stage, professional_status, extra = {}) => ({
  id: people[who].id, practice_stage, professional_status, plan: 'free', display_name: who, ...extra,
});
const DAY = 24 * 60 * 60 * 1000;
const transitionEnv = (until) => ({
  // Listed explicitly by id; the stray entry shows malformed values are ignored.
  PROFESSIONAL_TRANSITION_ACCOUNTS: [people.legacy, people.legacyRejected, people.legacyStudent, people.patient].map((p) => p.id.toUpperCase()).join(', ') + ', not-an-id',
  PROFESSIONAL_TRANSITION_UNTIL: until,
  DAILY_API_KEY: 'test-daily-key', // calls go to the Daily stand-in (DAILY_API_BASE_URL)
});

let fake;
let app; // runs with an active transition list, as it would during the rollout
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users,
    tables: {
      profiles: [
        profile('student', 'student', 'not_applicable'),
        profile('newcomer', 'student', 'not_applicable'),
        profile('declared', 'professional', 'not_applicable'),
        profile('pending', 'professional', 'pending', { registry_country: 'IT', registry_name: 'Synthetic register', registration_number: 'T-100' }),
        profile('needsInfo', 'professional', 'needs_info', { registration_number: 'T-200', verification_message: 'Synthetic: please add the register name' }),
        profile('rejected', 'professional', 'rejected', { registration_number: 'T-300', verification_message: 'Synthetic: number not found' }),
        profile('verified', 'professional', 'verified', { registry_country: 'IT', registry_name: 'Synthetic register', registration_number: 'T-400' }),
        profile('legacy', 'professional', 'not_applicable'),
        profile('legacyRejected', 'professional', 'rejected', { registration_number: 'T-500', verification_message: 'Synthetic: not registered' }),
        profile('legacyStudent', 'student', 'not_applicable'),
        profile('patient', 'professional', 'not_applicable'),
        profile('admin', 'professional', 'verified'),
      ],
      patients: [
        { id: 'p-verified', user_id: people.verified.id, patient_user_id: people.patient.id, name: 'Synthetic patient' },
        { id: 'p-pending', user_id: people.pending.id, patient_user_id: null, name: 'Synthetic patient 2' },
        { id: 'p-legacy', user_id: people.legacy.id, patient_user_id: null, name: 'Synthetic patient 3' },
        { id: 'p-declared', user_id: people.declared.id, patient_user_id: null, name: 'Synthetic patient 4' },
      ],
      metabolic_profiles: [],
      patient_clinical_references: [],
      ask_phygo_usage: [],
      knowledge_base: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url, env: transitionEnv(new Date(Date.now() + 30 * DAY).toISOString()) });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const call = (base, method, path, who, body) =>
  fetch(`${base}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...cookie(who) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const count = (prefix) => fake.state.requests.filter((r) => r.path.startsWith(prefix)).length;
const providerCalls = () => ({ openai: count('/openai/'), daily: count('/daily/') });
const NOTE = { transcript: 'synthetic transcript', lang: 'en' };
const row = (who) => fake.state.tables.profiles.find((p) => p.id === people[who].id);
const metabolic = { sex: 'female', age: 40, weightKg: 65, heightCm: 168, activityLevel: 'moderate', goal: 'maintain', macroStrategy: 'balanced' };
// Every protected operation, with a body that would otherwise be accepted.
const PROTECTED = [
  ['/api/generate-note', NOTE],
  ['/api/analyze-scan', { images: ['x'] }],
  ['/api/refine-exercises', { note: 'synthetic' }],
  ['/api/refine-plan', { note: 'synthetic' }],
  ['/api/exercise-intelligence', { note: 'synthetic' }],
  ['/api/science/relevant', { note: 'synthetic' }],
  ['/api/video-call/create-room', { patientId: 'p-declared' }],
];

/** Calls every protected operation as `who` on `base`; each must be refused with 403 and reach neither OpenAI nor Daily. */
async function assertLockedOut(base, who, expectedStatus) {
  const before = providerCalls();
  for (const [path, body] of PROTECTED) {
    const res = await call(base, 'POST', path, who, body);
    assert.equal(res.status, 403, `${who} on ${path}`);
    const json = await res.json();
    if (expectedStatus) {
      assert.equal(json.code, 'verification_required', `${who} on ${path}`);
      assert.equal(json.verificationStatus, expectedStatus, `${who} on ${path}`);
    }
  }
  assert.deepEqual(providerCalls(), before, `no OpenAI or Daily call for ${who}`);
}

test('public and educational features stay open', async () => {
  assert.equal((await fetch(`${app.url}/library/condition`)).status, 200, 'public condition library, no account');
  const before = providerCalls().openai;
  const ask = await call(app.url, 'POST', '/api/ask-phygo', 'student', { question: 'synthetic' });
  assert.ok(![401, 403, 429].includes(ask.status), `student can use Ask PHYGO (got ${ask.status})`);
  assert.ok(providerCalls().openai > before);
  assert.equal((await call(app.url, 'POST', '/api/metabolic/save', 'student', metabolic)).status, 200, 'personal metabolic calculation');
  assert.ok(![401, 403].includes((await call(app.url, 'POST', '/api/ask-phygo', 'declared', { question: 'x' })).status), 'unverified professionals explore too');
});

test('1. an explicitly listed existing account keeps its temporary access', async () => {
  const before = providerCalls();
  const note = await call(app.url, 'POST', '/api/generate-note', 'legacy', NOTE);
  assert.ok(![401, 403, 429, 503].includes(note.status), `got ${note.status}`);
  assert.ok(providerCalls().openai > before.openai, 'reached the AI');

  const room = await call(app.url, 'POST', '/api/video-call/create-room', 'legacy', { patientId: 'p-legacy' });
  assert.equal(room.status, 200);
  assert.match((await room.json()).url, /^https:\/\/test\.invalid\//);
  assert.equal(providerCalls().daily, before.daily + 1);

  // Patient ownership still applies during the transition.
  const dailyBefore = providerCalls().daily;
  assert.equal((await call(app.url, 'POST', '/api/video-call/create-room', 'legacy', { patientId: 'p-declared' })).status, 404);
  assert.equal((await call(app.url, 'GET', '/api/metabolic/save?patientId=p-declared', 'legacy')).status, 404);
  assert.equal(providerCalls().daily, dailyBefore, 'no room for another clinician’s patient');

  // Rate limits still apply during the transition.
  const usage = fake.state.tables.ask_phygo_usage;
  const key = `ai:generate-note:${people.legacy.id}`;
  const counter = usage.find((r) => r.ip === key) ?? usage[usage.push({ ip: key }) - 1];
  Object.assign(counter, { request_count: 120, window_start: new Date().toISOString() });
  const openaiBefore = providerCalls().openai;
  assert.equal((await call(app.url, 'POST', '/api/generate-note', 'legacy', NOTE)).status, 429);
  assert.equal(providerCalls().openai, openaiBefore);

  // The user sees that the access is temporary, and until when.
  const own = await (await call(app.url, 'GET', '/api/profile/verification', 'legacy')).json();
  assert.equal(own.verification.status, 'not_applicable');
  assert.ok(Date.parse(own.verification.transitionUntil) > Date.now());
  assert.match(app.logs(), /verification transition: listed unverified account allowed until/);
});

test('2. a new account is refused even after switching its declared role to physiotherapist', async () => {
  await assertLockedOut(app.url, 'newcomer'); // still a student: professional account required
  // The free role switch, as the profile page does it (allowed by RLS).
  const patch = await fetch(`${fake.url}/rest/v1/profiles?id=eq.${people.newcomer.id}`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ practice_stage: 'professional' }),
  });
  assert.equal(patch.status, 200);
  assert.equal(row('newcomer').practice_stage, 'professional');
  await assertLockedOut(app.url, 'newcomer', 'not_applicable');
  // Submitting registration details does not unlock anything either.
  const req = await call(app.url, 'POST', '/api/profile/verification', 'newcomer', { registryCountry: 'IT', registryName: 'Synthetic register', registrationNumber: 'N-9' });
  const v = (await req.json()).verification;
  assert.equal(v.status, 'pending');
  assert.equal(v.transitionUntil, null, 'not covered by the transition');
  await assertLockedOut(app.url, 'newcomer', 'pending');
  // A declared professional who was never listed is refused the same way.
  await assertLockedOut(app.url, 'declared', 'not_applicable');
});

test('3. a student cannot bypass the restriction by changing their profile', async () => {
  const res = await call(app.url, 'POST', '/api/profile/verification', 'student', {
    registryCountry: 'it', registryName: 'Synthetic register', registrationNumber: 'S-1',
    status: 'verified', professional_status: 'verified', professionalStatus: 'verified', practice_stage: 'professional',
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).verification.status, 'pending', 'a request is always pending review');
  assert.equal(row('student').professional_status, 'pending');
  assert.equal(row('student').practice_stage, 'student', 'the API does not change the declared role');
  await assertLockedOut(app.url, 'student');
  // Being on the transition list does not help a student either.
  await assertLockedOut(app.url, 'legacyStudent');
  // Invalid details are rejected field by field.
  const bad = await call(app.url, 'POST', '/api/profile/verification', 'student', { registryCountry: 'Italy', registryName: '', registrationNumber: '<script>' });
  assert.equal(bad.status, 400);
  assert.deepEqual((await bad.json()).fields.sort(), ['registrationNumber', 'registryCountry', 'registryName']);
});

test('4. pending, needs-info, rejected and unverified accounts stay locked unless listed', async () => {
  for (const [who, status] of [['pending', 'pending'], ['needsInfo', 'needs_info'], ['rejected', 'rejected'], ['declared', 'not_applicable']]) {
    await assertLockedOut(app.url, who, status);
    const own = await (await call(app.url, 'GET', '/api/profile/verification', who)).json();
    assert.equal(own.verification.status, status);
    assert.equal(own.verification.transitionUntil, null);
  }
  const msg = await (await call(app.url, 'GET', '/api/profile/verification', 'rejected')).json();
  assert.equal(msg.verification.message, 'Synthetic: number not found', 'the user sees why');
  // A rejection by PHYGO wins over the transition list.
  await assertLockedOut(app.url, 'legacyRejected', 'rejected');
});

test('5. a verified professional can use clinical functions, for their own patients only', async () => {
  const before = providerCalls();
  const res = await call(app.url, 'POST', '/api/generate-note', 'verified', NOTE);
  assert.ok(![401, 403, 429, 503].includes(res.status), `got ${res.status}`);
  assert.ok(providerCalls().openai > before.openai);
  assert.equal((await call(app.url, 'GET', '/api/metabolic/save?patientId=p-verified', 'verified')).status, 200);
  assert.equal((await call(app.url, 'GET', '/api/metabolic/save?patientId=p-pending', 'verified')).status, 404, 'another clinician’s patient');
  assert.equal((await call(app.url, 'POST', '/api/video-call/create-room', 'verified', { patientId: 'p-verified' })).status, 200);
  assert.equal(providerCalls().daily, before.daily + 1);
  assert.equal((await call(app.url, 'POST', '/api/video-call/create-room', 'verified', { patientId: 'p-pending' })).status, 404);
  assert.equal(providerCalls().daily, before.daily + 1, 'no room for another clinician’s patient');
});

test('6. patients are refused everywhere, even if listed by mistake, and never reach OpenAI or Daily', async () => {
  await assertLockedOut(app.url, 'patient');
  assert.equal((await call(app.url, 'POST', '/api/profile/verification', 'patient', { registryCountry: 'IT', registryName: 'x register', registrationNumber: '1' })).status, 403);
  const before = providerCalls();
  for (const [path, body] of PROTECTED) assert.equal((await call(app.url, 'POST', path, null, body)).status, 401, `anonymous on ${path}`);
  assert.deepEqual(providerCalls(), before);
});

test('changing a verified number sends it back to review; re-sending the same does not', async () => {
  const same = await call(app.url, 'POST', '/api/profile/verification', 'verified', { registryCountry: 'IT', registryName: 'Synthetic register', registrationNumber: 'T-400' });
  assert.equal((await same.json()).verification.status, 'verified');
  const changed = await call(app.url, 'POST', '/api/profile/verification', 'verified', { registryCountry: 'IT', registryName: 'Synthetic register', registrationNumber: 'T-401' });
  assert.equal((await changed.json()).verification.status, 'pending');
  await assertLockedOut(app.url, 'verified', 'pending');
});

test('only an administrator can review, and the decision takes effect', async () => {
  assert.equal((await call(app.url, 'GET', '/api/admin/verification', null)).status, 401);
  assert.equal((await call(app.url, 'GET', '/api/admin/verification', 'legacy')).status, 403);
  assert.equal((await call(app.url, 'POST', '/api/admin/verification', 'pending', { userId: people.pending.id, decision: 'verified' })).status, 403, 'users cannot approve themselves');

  const list = await (await call(app.url, 'GET', '/api/admin/verification?status=pending', 'admin')).json();
  assert.ok(list.requests.some((r) => r.id === people.pending.id));

  assert.equal((await call(app.url, 'POST', '/api/admin/verification', 'admin', { userId: people.needsInfo.id, decision: 'rejected' })).status, 400, 'a rejection needs a message');
  const approve = await call(app.url, 'POST', '/api/admin/verification', 'admin', { userId: people.pending.id, decision: 'verified' });
  assert.equal(approve.status, 200);
  assert.equal(row('pending').professional_status, 'verified');
  assert.equal(row('pending').verification_reviewed_by, 'admin@test.invalid');
  assert.ok(![401, 403].includes((await call(app.url, 'POST', '/api/generate-note', 'pending', NOTE)).status), 'unlocked after approval');

  assert.equal((await call(app.url, 'POST', '/api/admin/verification', 'admin', { userId: people.declared.id, decision: 'verified' })).status, 409, 'cannot verify an account without registration details');
});

test('metabolic data on a real patient needs verification or the list (service-role route)', async () => {
  const saved = () => fake.state.tables.metabolic_profiles.length;
  const before = saved();
  const res = await call(app.url, 'POST', '/api/metabolic/save', 'declared', { ...metabolic, patientId: 'p-declared' });
  assert.equal(res.status, 403);
  assert.equal((await res.json()).code, 'verification_required');
  assert.equal(saved(), before, 'nothing written');
  assert.equal((await call(app.url, 'GET', '/api/metabolic/save?patientId=p-declared', 'declared')).status, 200, 'own existing data stays readable');
  assert.equal((await call(app.url, 'POST', '/api/metabolic/save', 'declared', metabolic)).status, 200, 'personal calculator');
  assert.equal((await call(app.url, 'POST', '/api/metabolic/save', 'legacy', { ...metabolic, patientId: 'p-legacy' })).status, 200, 'listed account');
});

test('the transition list fails closed when it has ended, has no valid end date, or is too long', async () => {
  const configs = [
    ['ended', transitionEnv(new Date(Date.now() - DAY).toISOString())],
    ['more than 90 days ahead', transitionEnv(new Date(Date.now() + 120 * DAY).toISOString())],
    // The old blanket switch is ignored, and a list without an end date does nothing.
    ['no end date, old grace switch set', { ...transitionEnv(''), PROFESSIONAL_VERIFICATION_MODE: 'grace' }],
  ];
  let port = 3416;
  for (const [label, env] of configs) {
    const other = await startApp({ fakeUrl: fake.url, port: port++, env });
    try {
      await assertLockedOut(other.url, 'legacy', 'not_applicable');
      await assertLockedOut(other.url, 'declared', 'not_applicable');
      const own = await (await call(other.url, 'GET', '/api/profile/verification', 'legacy')).json();
      assert.equal(own.verification.transitionUntil, null, label);
      if (label.includes('grace')) assert.match(other.logs(), /PROFESSIONAL_VERIFICATION_MODE is no longer supported/);
    } finally {
      await other.stop();
    }
  }
});
