// Professional verification: declared role vs verified status, tested at the
// API level (server-side authorization, not the interface). Synthetic users
// only; OpenAI is the fake server, Daily is never configured.
// The database rule that stops users from writing their own status is tested
// separately in tests/sql/run.sh.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);
const confirmed = '2026-01-01T00:00:00Z';
const person = (id, email) => ({ id, email, email_confirmed_at: confirmed, role: 'authenticated' });
const people = {
  student: person('u-student', 'student@test.invalid'),
  switched: person('u-switched', 'switched@test.invalid'), // was a student, switched the declared role
  pending: person('u-pending', 'pending@test.invalid'),
  needsInfo: person('u-needs-info', 'needs@test.invalid'),
  rejected: person('u-rejected', 'rejected@test.invalid'),
  verified: person('u-verified', 'verified@test.invalid'),
  newcomer: person('u-newcomer', 'new@test.invalid'),
  patient: person('u-patient', 'patient@test.invalid'),
  admin: person('u-admin', 'admin@test.invalid'), // listed in PHYGO_ADMIN_EMAILS by tests/support/app.mjs
};
const users = Object.fromEntries(Object.entries(people).map(([k, u]) => [`tok-${k}`, u]));
const cookie = (who) => (who ? { cookie: sessionCookie(`tok-${who}`, people[who]) } : {});
const profile = (who, practice_stage, professional_status, extra = {}) => ({
  id: people[who].id, practice_stage, professional_status, plan: 'free', display_name: who, ...extra,
});

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users,
    tables: {
      profiles: [
        profile('student', 'student', 'not_applicable'),
        profile('switched', 'professional', 'not_applicable'),
        profile('pending', 'professional', 'pending', { registry_country: 'IT', registry_name: 'Synthetic register', registration_number: 'T-100' }),
        profile('needsInfo', 'professional', 'needs_info', { registration_number: 'T-200', verification_message: 'Synthetic: please add the register name' }),
        profile('rejected', 'professional', 'rejected', { registration_number: 'T-300', verification_message: 'Synthetic: number not found' }),
        profile('verified', 'professional', 'verified', { registry_country: 'IT', registry_name: 'Synthetic register', registration_number: 'T-400' }),
        profile('newcomer', 'professional', 'not_applicable'),
        profile('patient', 'professional', 'not_applicable'),
        profile('admin', 'professional', 'verified'),
      ],
      patients: [
        { id: 'p-verified', user_id: people.verified.id, patient_user_id: people.patient.id, name: 'Synthetic patient' },
        { id: 'p-pending', user_id: people.pending.id, patient_user_id: null, name: 'Synthetic patient 2' },
      ],
      metabolic_profiles: [],
      patient_clinical_references: [],
      ask_phygo_usage: [],
      knowledge_base: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url });
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
const openaiCalls = () => fake.state.requests.filter((r) => r.path.startsWith('/openai/')).length;
const NOTE = { transcript: 'synthetic transcript', lang: 'en' };
const status = (who) => fake.state.tables.profiles.find((p) => p.id === people[who].id).professional_status;
const metabolic = { sex: 'female', age: 40, weightKg: 65, heightCm: 168, activityLevel: 'moderate', goal: 'maintain', macroStrategy: 'balanced' };

test('public and educational features stay open', async () => {
  assert.equal((await fetch(`${app.url}/library/condition`)).status, 200, 'public condition library, no account');
  const before = openaiCalls();
  const ask = await call(app.url, 'POST', '/api/ask-phygo', 'student', { question: 'synthetic' });
  assert.ok(![401, 403, 429].includes(ask.status), `student can use Ask PHYGO (got ${ask.status})`);
  assert.ok(openaiCalls() > before);
  const calc = await call(app.url, 'POST', '/api/metabolic/save', 'student', metabolic);
  assert.equal(calc.status, 200, 'personal metabolic calculation works for a student');
});

test('a student cannot use professional-only operations', async () => {
  const res = await call(app.url, 'POST', '/api/generate-note', 'student', NOTE);
  assert.equal(res.status, 403);
});

test('switching the declared role does not grant verified access', async () => {
  const res = await call(app.url, 'POST', '/api/generate-note', 'switched', NOTE);
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.code, 'verification_required');
  assert.equal(body.verificationStatus, 'not_applicable');
  // Still free to explore and use general features.
  assert.ok(![401, 403].includes((await call(app.url, 'POST', '/api/ask-phygo', 'switched', { question: 'x' })).status));
});

test('pending, needs-info and rejected requests stay locked, with a clear status', async () => {
  const before = openaiCalls();
  for (const [who, expected] of [['pending', 'pending'], ['needsInfo', 'needs_info'], ['rejected', 'rejected']]) {
    for (const path of ['/api/generate-note', '/api/analyze-scan']) {
      const res = await call(app.url, 'POST', path, who, path.endsWith('scan') ? { images: ['x'] } : NOTE);
      assert.equal(res.status, 403, `${who} on ${path}`);
      assert.equal((await res.json()).verificationStatus, expected);
    }
    const own = await (await call(app.url, 'GET', '/api/profile/verification', who)).json();
    assert.equal(own.verification.status, expected);
  }
  const msg = await (await call(app.url, 'GET', '/api/profile/verification', 'rejected')).json();
  assert.equal(msg.verification.message, 'Synthetic: number not found', 'the user sees why');
  assert.equal(openaiCalls(), before, 'no AI call for unverified accounts');
});

test('a verified professional can use clinical AI, only for their own patients', async () => {
  const before = openaiCalls();
  const res = await call(app.url, 'POST', '/api/generate-note', 'verified', NOTE);
  assert.ok(![401, 403, 429, 503].includes(res.status), `got ${res.status}`);
  assert.ok(openaiCalls() > before);
  assert.equal((await call(app.url, 'GET', '/api/metabolic/save?patientId=p-verified', 'verified')).status, 200);
  assert.equal((await call(app.url, 'GET', '/api/metabolic/save?patientId=p-pending', 'verified')).status, 404, 'another clinician’s patient');
  // Video: passes the verification gate and stops at the missing Daily configuration.
  assert.equal((await call(app.url, 'POST', '/api/video-call/create-room', 'verified', { patientId: 'p-verified' })).status, 503);
});

test('patients cannot use professional operations or request verification', async () => {
  assert.equal((await call(app.url, 'POST', '/api/generate-note', 'patient', NOTE)).status, 403);
  assert.equal((await call(app.url, 'POST', '/api/profile/verification', 'patient', { registryCountry: 'IT', registryName: 'x register', registrationNumber: '1' })).status, 403);
});

test('users cannot set their own status through the API', async () => {
  assert.equal((await call(app.url, 'POST', '/api/profile/verification', null, {})).status, 401);
  const res = await call(app.url, 'POST', '/api/profile/verification', 'newcomer', {
    registryCountry: 'it', registryName: 'Synthetic register', registrationNumber: 'N-1',
    status: 'verified', professional_status: 'verified', professionalStatus: 'verified',
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).verification.status, 'pending', 'a request is always pending review');
  assert.equal(status('newcomer'), 'pending');
  assert.equal(fake.state.tables.profiles.find((p) => p.id === people.newcomer.id).registry_country, 'IT');
  const bad = await call(app.url, 'POST', '/api/profile/verification', 'newcomer', { registryCountry: 'Italy', registryName: '', registrationNumber: '<script>' });
  assert.equal(bad.status, 400);
  assert.deepEqual((await bad.json()).fields.sort(), ['registrationNumber', 'registryCountry', 'registryName']);
});

test('changing a verified number sends it back to review; re-sending the same does not', async () => {
  const same = await call(app.url, 'POST', '/api/profile/verification', 'verified', { registryCountry: 'IT', registryName: 'Synthetic register', registrationNumber: 'T-400' });
  assert.equal((await same.json()).verification.status, 'verified');
  const changed = await call(app.url, 'POST', '/api/profile/verification', 'verified', { registryCountry: 'IT', registryName: 'Synthetic register', registrationNumber: 'T-401' });
  assert.equal((await changed.json()).verification.status, 'pending');
  assert.equal((await call(app.url, 'POST', '/api/generate-note', 'verified', NOTE)).status, 403, 'locked again until re-reviewed');
});

test('only an administrator can review, and the decision takes effect', async () => {
  assert.equal((await call(app.url, 'GET', '/api/admin/verification', null)).status, 401);
  assert.equal((await call(app.url, 'GET', '/api/admin/verification', 'verified')).status, 403);
  assert.equal((await call(app.url, 'POST', '/api/admin/verification', 'pending', { userId: people.pending.id, decision: 'verified' })).status, 403, 'users cannot approve themselves');

  const list = await (await call(app.url, 'GET', '/api/admin/verification?status=pending', 'admin')).json();
  assert.ok(list.requests.some((r) => r.id === people.pending.id));

  assert.equal((await call(app.url, 'POST', '/api/admin/verification', 'admin', { userId: people.needsInfo.id, decision: 'rejected' })).status, 400, 'a rejection needs a message');
  const approve = await call(app.url, 'POST', '/api/admin/verification', 'admin', { userId: people.pending.id, decision: 'verified' });
  assert.equal(approve.status, 200);
  const row = fake.state.tables.profiles.find((p) => p.id === people.pending.id);
  assert.equal(row.professional_status, 'verified');
  assert.equal(row.verification_reviewed_by, 'admin@test.invalid');
  assert.ok(![401, 403].includes((await call(app.url, 'POST', '/api/generate-note', 'pending', NOTE)).status), 'unlocked after approval');

  const noNumber = await call(app.url, 'POST', '/api/admin/verification', 'admin', { userId: people.student.id, decision: 'verified' });
  assert.equal(noNumber.status, 409, 'cannot verify an account without registration details');
});

test('grace mode keeps declared professionals working during the transition', async () => {
  const grace = await startApp({ fakeUrl: fake.url, port: 3416, env: { PROFESSIONAL_VERIFICATION_MODE: 'grace' } });
  try {
    assert.ok(![401, 403].includes((await call(grace.url, 'POST', '/api/generate-note', 'switched', NOTE)).status));
    assert.equal((await call(grace.url, 'POST', '/api/generate-note', 'student', NOTE)).status, 403, 'students still excluded');
    assert.equal((await call(grace.url, 'POST', '/api/generate-note', 'patient', NOTE)).status, 403, 'patients still excluded');
    assert.match(grace.logs(), /verification grace mode: unverified professional allowed/);
  } finally {
    await grace.stop();
  }
});
