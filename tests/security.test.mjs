// Security regression tests for paid AI/video operations and patient data.
// Run with tests/run.sh. Synthetic identities and records only; OpenAI and
// Daily are never contacted (OpenAI is answered by the fake server and the
// Daily key is either empty or every tested path stops before the call).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);

const people = {
  physioA: { id: 'user-physio-a', email: 'a@test.invalid', role: 'authenticated' },
  physioB: { id: 'user-physio-b', email: 'b@test.invalid', role: 'authenticated' },
  student: { id: 'user-student', email: 's@test.invalid', role: 'authenticated' },
  patient: { id: 'user-patient', email: 'p@test.invalid', role: 'authenticated' },
};
const users = Object.fromEntries(Object.entries(people).map(([k, u]) => [`tok-${k}`, u]));
const cookie = (who) => (who ? { cookie: sessionCookie(`tok-${who}`, people[who]) } : {});

// Patient P1 belongs to physio A and has a My Phygo account; P2 belongs to physio B.
const P1 = 'patient-0001';
const P2 = 'patient-0002';

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users,
    tables: {
      patients: [
        { id: P1, user_id: people.physioA.id, patient_user_id: people.patient.id, name: 'Synthetic patient 1' },
        { id: P2, user_id: people.physioB.id, patient_user_id: null, name: 'Synthetic patient 2' },
      ],
      profiles: [
        { id: people.physioA.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free' },
        { id: people.physioB.id, practice_stage: 'professional', professional_status: 'verified', plan: 'pro' },
        { id: people.student.id, practice_stage: 'student', plan: 'free' },
        { id: people.patient.id, practice_stage: 'professional', plan: 'free' },
      ],
      metabolic_profiles: [
        { id: 'm1', patient_id: P1, created_at: '2026-10-01T00:00:00Z', weight_kg: 70 },
        { id: 'm2', patient_id: P2, created_at: '2026-10-01T00:00:00Z', weight_kg: 80 },
      ],
      patient_clinical_references: [],
      ask_phygo_usage: [],
      knowledge_base: [],
      research_papers: [],
      exercise_cache: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const post = (base, path, who, body) =>
  fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...cookie(who) }, body: JSON.stringify(body ?? {}) });
const get = (base, path, who) => fetch(`${base}${path}`, { headers: cookie(who) });
const openaiCalls = () => fake.state.requests.filter((r) => r.path.startsWith('/openai/')).length;

const metabolicInput = { sex: 'female', age: 40, weightKg: 65, heightCm: 168, activityLevel: 'moderate', goal: 'maintain', macroStrategy: 'balanced' };
const AI_ROUTES = [
  ['/api/analyze-scan', { images: ['data:image/png;base64,AAAA'] }],
  ['/api/generate-note', { transcript: 'synthetic transcript', lang: 'en' }],
  ['/api/refine-exercises', { transcript: 'x', assessment: 'x', exercisesDraft: [], phases: [], lang: 'en' }],
  ['/api/refine-plan', { transcript: 'x', assessment: 'x', exercisesDraft: [], phases: [], lang: 'en' }],
  ['/api/exercise-intelligence', { primaryCondition: 'x', assessment: 'x', lang: 'en' }],
  ['/api/science/relevant', { primaryCondition: 'x', assessment: 'x' }],
];

test('anonymous callers cannot trigger any paid AI or video operation', async () => {
  const before = openaiCalls();
  for (const [path, body] of [...AI_ROUTES, ['/api/ask-phygo', { question: 'x' }], ['/api/video-call/create-room', { patientId: P1 }]]) {
    const res = await post(app.url, path, null, body);
    assert.equal(res.status, 401, `${path} must require authentication`);
    const text = await res.text();
    assert.ok(!/stack|at \w+ \(/i.test(text), `${path} must not leak internals`);
  }
  assert.equal(openaiCalls(), before, 'no OpenAI call for anonymous requests');
});

test('patient and student accounts cannot use clinician-only AI or video operations', async () => {
  const before = openaiCalls();
  for (const who of ['patient', 'student']) {
    for (const [path, body] of [...AI_ROUTES, ['/api/video-call/create-room', { patientId: P1 }]]) {
      const res = await post(app.url, path, who, body);
      assert.equal(res.status, 403, `${path} must refuse ${who} accounts`);
    }
  }
  assert.equal(openaiCalls(), before);
});

test('a clinician passes the gate and reaches the AI service', async () => {
  for (const path of ['/api/analyze-scan', '/api/generate-note']) {
    const before = openaiCalls();
    const res = await post(app.url, path, 'physioA', Object.fromEntries(AI_ROUTES)[path]);
    assert.ok(![401, 403, 429].includes(res.status), `${path} got ${res.status}`);
    // The OpenAI client retries failed calls, so the fake may see more than one attempt.
    assert.ok(openaiCalls() > before, `${path} forwarded to the (fake) AI service`);
  }
});

test('Ask PHYGO needs an account; students may use it', async () => {
  assert.equal((await post(app.url, '/api/ask-phygo', null, { question: 'x' })).status, 401);
  const before = openaiCalls();
  const res = await post(app.url, '/api/ask-phygo', 'student', { question: 'synthetic question' });
  assert.ok(![401, 403, 429].includes(res.status));
  assert.ok(openaiCalls() > before);
});

test('hourly limits are enforced before any AI call', async () => {
  const now = new Date().toISOString();
  const setUsage = (ip, request_count) => {
    const usage = fake.state.tables.ask_phygo_usage;
    const row = usage.find((r) => r.ip === ip);
    if (row) Object.assign(row, { request_count, window_start: now });
    else usage.push({ ip, request_count, window_start: now });
  };
  setUsage(`ai:analyze-scan:${people.physioA.id}`, 30);
  setUsage(`user:${people.student.id}`, 20);
  const before = openaiCalls();
  assert.equal((await post(app.url, '/api/analyze-scan', 'physioA', { images: ['x'] })).status, 429);
  assert.equal((await post(app.url, '/api/ask-phygo', 'student', { question: 'x' })).status, 429);
  assert.equal(openaiCalls(), before);
  // Counters are written with the service-role key, so they actually advance.
  const row = fake.state.tables.ask_phygo_usage.find((r) => r.ip === `ai:generate-note:${people.physioA.id}`);
  assert.ok(row && row.request_count >= 1, 'generate-note usage was recorded');
});

test('a clinician reads and writes metabolic data of their own patient only', async () => {
  assert.equal((await get(app.url, `/api/metabolic/save?patientId=${P1}`, 'physioA')).status, 200);

  const other = await get(app.url, `/api/metabolic/save?patientId=${P2}`, 'physioA');
  assert.equal(other.status, 404);
  const missing = await get(app.url, '/api/metabolic/save?patientId=does-not-exist', 'physioA');
  assert.equal(missing.status, 404);
  assert.deepEqual(await other.json(), await missing.json(), 'same answer for "not yours" and "does not exist"');

  const rowsBefore = fake.state.tables.metabolic_profiles.length;
  const write = await post(app.url, '/api/metabolic/save', 'physioA', { ...metabolicInput, patientId: P2 });
  assert.equal(write.status, 404);
  assert.equal(fake.state.tables.metabolic_profiles.length, rowsBefore, 'nothing written to another clinician’s patient');
  assert.ok(!fake.state.tables.patient_clinical_references.some((r) => r.patient_id === P2));

  const own = await post(app.url, '/api/metabolic/save', 'physioA', { ...metabolicInput, patientId: P1 });
  assert.equal(own.status, 200);
  assert.equal(fake.state.tables.metabolic_profiles.length, rowsBefore + 1);
});

test('patients keep access to their own metabolic data only', async () => {
  assert.equal((await get(app.url, '/api/metabolic/save', 'patient')).status, 200);
  assert.equal((await get(app.url, `/api/metabolic/save?patientId=${P2}`, 'patient')).status, 403);
  const res = await post(app.url, '/api/metabolic/save', 'patient', { ...metabolicInput, patientId: P2 });
  assert.equal(res.status, 200);
  const last = fake.state.tables.metabolic_profiles.at(-1);
  assert.equal(last.patient_id, P1, 'a patient always writes to their own record, whatever patientId says');
  assert.equal((await get(app.url, '/api/metabolic/save', null)).status, 401);
});

test('entries a patient keeps private are not shown to their clinician', async () => {
  const shared = await post(app.url, '/api/metabolic/save', 'patient', { ...metabolicInput, weightKg: 61 });
  const priv = await post(app.url, '/api/metabolic/save', 'patient', { ...metabolicInput, weightKg: 62, sharedWithProfessional: false });
  assert.equal(shared.status, 200);
  assert.equal(priv.status, 200);
  const weights = async (who, path) => (await (await get(app.url, path, who)).json()).profiles.map((p) => Number(p.weight_kg));
  const patientView = await weights('patient', '/api/metabolic/save');
  assert.ok(patientView.includes(61) && patientView.includes(62), 'the patient sees all of their own entries');
  const clinicianView = await weights('physioA', `/api/metabolic/save?patientId=${P1}`);
  assert.ok(clinicianView.includes(61), 'shared entry visible to the clinician');
  assert.ok(!clinicianView.includes(62), 'private entry hidden from the clinician');
  assert.ok(clinicianView.includes(70), 'entries without a patient flag (professional) stay visible');
});

test('video rooms: configuration and patient ownership are checked before Daily is called', async () => {
  // Daily not configured: a clear 503, no external call.
  assert.equal((await post(app.url, '/api/video-call/create-room', 'physioA', { patientId: P1 })).status, 503);

  const withDaily = await startApp({ fakeUrl: fake.url, port: 3414, env: { DAILY_API_KEY: 'test-daily-key-never-sent' } });
  try {
    // Physio B asking for physio A's patient: refused before any Daily request.
    assert.equal((await post(withDaily.url, '/api/video-call/create-room', 'physioB', { patientId: P1 })).status, 404);
    assert.equal((await post(withDaily.url, '/api/video-call/create-room', 'physioB', {})).status, 400);
    assert.equal((await post(withDaily.url, '/api/video-call/create-room', 'patient', { patientId: P1 })).status, 403);
    assert.ok(!/Daily room creation failed|Errore create-room/.test(withDaily.logs()), 'Daily was never called');
  } finally {
    await withDaily.stop();
  }
});

test('concurrent requests cannot exceed the hourly limit', async () => {
  // Physio B has no analyze-scan counter yet; 40 simultaneous calls against a limit of 30.
  const before = fake.state.tables.ask_phygo_usage.filter((r) => r.ip === `ai:analyze-scan:${people.physioB.id}`).length;
  assert.equal(before, 0);
  const results = await Promise.all(
    Array.from({ length: 40 }, () => post(app.url, '/api/analyze-scan', 'physioB', { images: ['data:image/png;base64,AAAA'] }).then((r) => r.status)),
  );
  const passed = results.filter((s) => ![429, 503].includes(s)).length;
  assert.equal(passed, 30, `statuses: ${results.join(',')}`);
  assert.equal(results.filter((s) => s === 429).length, 10);
  const rows = fake.state.tables.ask_phygo_usage.filter((r) => r.ip === `ai:analyze-scan:${people.physioB.id}`);
  assert.equal(rows.length, 1, 'one counter row, no duplicates');
  assert.equal(rows[0].request_count, 30, 'no increment lost or double-counted');
});

test('if the limit cannot be checked, paid calls are refused (fail closed)', async () => {
  await fetch(`${fake.url}/__control/fail?table=ask_phygo_usage`);
  try {
    const before = openaiCalls();
    const res = await post(app.url, '/api/generate-note', 'physioA', { transcript: 'x', lang: 'en' });
    assert.equal(res.status, 503);
    assert.equal((await res.json()).code, 'limit_unavailable');
    assert.equal((await post(app.url, '/api/ask-phygo', 'physioA', { question: 'x' })).status, 503);
    assert.equal(openaiCalls(), before, 'no OpenAI call without a working limit');
  } finally {
    await fetch(`${fake.url}/__control/fail`);
  }
});

test('a missing or masked service-role key also fails closed', async () => {
  for (const key of ['', `eyJ${'\u2022'.repeat(10)}`]) {
    const broken = await startApp({ fakeUrl: fake.url, port: 3415, serviceRoleKey: key });
    try {
      const before = openaiCalls();
      const res = await post(broken.url, '/api/analyze-scan', 'physioA', { images: ['x'] });
      assert.equal(res.status, 503);
      assert.equal(openaiCalls(), before);
      assert.ok(!(await res.text()).includes('\u2022'));
    } finally {
      await broken.stop();
    }
  }
});
