// Professional verification: declared role vs verified status, the bounded
// transition list for pre-existing accounts (table
// professional_transition_accounts), and patient management, tested at the API level
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
const inDays = (d) => new Date(Date.now() + d * DAY).toISOString();
// The owner's list: explicit account ids with an end date (rows added from the SQL editor).
const listed = ['legacy', 'legacyRejected', 'legacyStudent', 'patient'].map((who) => ({ user_id: people[who].id, until: inDays(30), added_by: 'owner' }));
const APP_ENV = { DAILY_API_KEY: 'test-daily-key' }; // calls go to the Daily stand-in (DAILY_API_BASE_URL)

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
      professional_transition_accounts: listed,
    },
  });
  app = await startApp({ fakeUrl: fake.url, env: APP_ENV });
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
const listRow = (who) => fake.state.tables.professional_transition_accounts.find((r) => r.user_id === people[who].id);
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
  assert.match((await room.json()).call.room_url, /^https:\/\/test\.invalid\//);
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

test('the transition list fails closed: expired, too long, unreadable, or set the old way', async () => {
  const entry = listRow('legacy');
  try {
    entry.until = inDays(-1);
    await assertLockedOut(app.url, 'legacy', 'not_applicable');
    entry.until = inDays(120); // the database refuses this; the server ignores it too
    await assertLockedOut(app.url, 'legacy', 'not_applicable');
    assert.equal((await (await call(app.url, 'GET', '/api/profile/verification', 'legacy')).json()).verification.transitionUntil, null);
    entry.until = inDays(30);
    await fetch(`${fake.url}/__control/fail?table=professional_transition_accounts`);
    const before = providerCalls();
    const res = await call(app.url, 'POST', '/api/generate-note', 'legacy', NOTE);
    assert.equal(res.status, 503, 'list unreadable: refused, not allowed through');
    assert.deepEqual(providerCalls(), before);
  } finally {
    entry.until = inDays(30);
    await fetch(`${fake.url}/__control/fail`);
  }
  // The environment variables of the first version are ignored.
  const other = await startApp({
    fakeUrl: fake.url,
    port: 3416,
    env: { ...APP_ENV, PROFESSIONAL_TRANSITION_ACCOUNTS: people.declared.id, PROFESSIONAL_TRANSITION_UNTIL: inDays(30), PROFESSIONAL_VERIFICATION_MODE: 'grace' },
  });
  try {
    await assertLockedOut(other.url, 'declared', 'not_applicable');
    assert.match(other.logs(), /PROFESSIONAL_TRANSITION_ACCOUNTS is no longer used/);
  } finally {
    await other.stop();
  }
});

test('reading existing metabolic data: own patients only; adding needs verification or the list', async () => {
  // Intended rule (same as notes, appointments and links under RLS): an
  // unverified, unlisted clinician keeps READ access to the existing records of
  // their own patients, but cannot add to them.
  const read = (who, id) => call(app.url, 'GET', `/api/metabolic/save${id ? `?patientId=${id}` : ''}`, who);
  assert.equal((await read('declared', 'p-declared')).status, 200, 'unverified: reads own patient');
  assert.equal((await read('declared', 'p-legacy')).status, 404, 'unverified: not another clinician’s patient');
  assert.equal((await read('declared', 'p-unknown')).status, 404, 'missing and not-yours look the same');
  const before = fake.state.tables.metabolic_profiles.length;
  assert.equal((await call(app.url, 'POST', '/api/metabolic/save', 'declared', { ...metabolic, patientId: 'p-declared' })).status, 403, 'unverified: cannot add');
  assert.equal(fake.state.tables.metabolic_profiles.length, before);
  assert.equal((await read('legacy', 'p-legacy')).status, 200, 'listed: reads own patient');
  assert.equal((await read('legacy', 'p-declared')).status, 404, 'listed: not another clinician’s patient');
  // Patients always read their own record, and only it.
  assert.equal((await read('patient')).status, 200, 'patient: own record');
  assert.equal((await read('patient', 'p-declared')).status, 403, 'patient: not someone else’s record');
  assert.equal((await read(null, 'p-declared')).status, 401, 'anonymous');
});

test('no server route deletes clinical data (deletion only goes through the database rules)', async () => {
  // Patient records, notes, appointments, invitations, calls and clinical links
  // are deleted only from the browser under RLS (tests/sql/run.sh). The
  // service-role routes that touch patient data expose no DELETE.
  for (const path of ['/api/metabolic/save', '/api/video-call/create-room', '/api/profile/verification', '/api/generate-note']) {
    for (const who of ['declared', 'verified']) {
      const res = await call(app.url, 'DELETE', path, who);
      assert.equal(res.status, 405, `${who} DELETE ${path}`);
    }
  }
});

test('patient management: clinical data on a real patient needs verification or the list', async () => {
  const saved = () => fake.state.tables.metabolic_profiles.length;
  // Unverified, unlisted professional with an existing patient of their own.
  let before = saved();
  const res = await call(app.url, 'POST', '/api/metabolic/save', 'declared', { ...metabolic, patientId: 'p-declared' });
  assert.equal(res.status, 403);
  assert.equal((await res.json()).code, 'verification_required');
  assert.equal(saved(), before, 'nothing written');
  // The personal calculator (no patient) stays open.
  assert.equal((await call(app.url, 'POST', '/api/metabolic/save', 'declared', metabolic)).status, 200);
  // Listed and verified accounts can, for their own patients only.
  assert.equal((await call(app.url, 'POST', '/api/metabolic/save', 'legacy', { ...metabolic, patientId: 'p-legacy' })).status, 200);
  before = saved();
  assert.equal((await call(app.url, 'POST', '/api/metabolic/save', 'legacy', { ...metabolic, patientId: 'p-declared' })).status, 404, 'another clinician’s patient');
  assert.equal(saved(), before);
  // What the interface is told (it only explains and disables; the database enforces).
  const can = async (who) => (await (await call(app.url, 'GET', '/api/profile/verification', who)).json()).verification.canManagePatients;
  assert.equal(await can('declared'), false);
  assert.equal(await can('legacy'), true);
  assert.equal(await can('admin'), true); // verified
  assert.equal(await can('legacyRejected'), false);
  assert.equal(await can('legacyStudent'), false);
  assert.equal(await can('student'), false);
});

test('owner path: the administrator is listed before the release, then verified from the register, with no general bypass', async () => {
  // The owner is a physiotherapist and the only PHYGO administrator. Before the
  // release the account is unverified; the guide lists it at step 4b, before
  // the merge, and the official verification follows within the 60 days.
  const owner = row('admin');
  const saved = { ...owner };
  const patients = fake.state.tables.patients;
  const list = fake.state.tables.professional_transition_accounts;
  const dropListRow = () => { const i = list.findIndex((r) => r.user_id === people.admin.id); if (i >= 0) list.splice(i, 1); };
  patients.push({ id: 'p-owner', user_id: people.admin.id, patient_user_id: null, name: 'Synthetic owner patient' });
  const opens = async () => {
    const res = await call(app.url, 'POST', '/api/generate-note', 'admin', NOTE);
    return ![401, 403, 429, 503].includes(res.status);
  };
  try {
    Object.assign(owner, { professional_status: 'not_applicable', registry_country: null, registry_name: null, registration_number: null });

    // Being the administrator grants no clinical access.
    await assertLockedOut(app.url, 'admin', 'not_applicable');
    assert.equal((await call(app.url, 'GET', '/api/admin/verification', 'admin')).status, 200, 'the console does not depend on the professional status');

    // Step 4b: listed for 60 days -> clinical functions on the owner's own patients.
    list.push({ user_id: people.admin.id, until: inDays(60), added_by: 'owner' });
    assert.equal(await opens(), true, 'clinical AI');
    const dailyBefore = providerCalls().daily;
    assert.equal((await call(app.url, 'POST', '/api/video-call/create-room', 'admin', { patientId: 'p-owner' })).status, 200, 'video room, own patient');
    assert.equal(providerCalls().daily, dailyBefore + 1);
    assert.equal((await call(app.url, 'POST', '/api/metabolic/save', 'admin', { ...metabolic, patientId: 'p-owner' })).status, 200, 'metabolic data, own patient');
    // ...and still nothing on another clinician's patient.
    assert.equal((await call(app.url, 'POST', '/api/video-call/create-room', 'admin', { patientId: 'p-declared' })).status, 404);
    assert.equal((await call(app.url, 'GET', '/api/metabolic/save?patientId=p-declared', 'admin')).status, 404);

    // Official verification: the request makes the status pending; the listed access continues.
    const req = await call(app.url, 'POST', '/api/profile/verification', 'admin', { registryCountry: 'IT', registryName: 'Synthetic register', registrationNumber: 'O-1' });
    assert.equal((await req.json()).verification.status, 'pending');
    assert.equal(await opens(), true, 'pending + listed: no interruption');

    // Approval on the console, after checking the official register; recorded with the reviewer.
    assert.equal((await call(app.url, 'POST', '/api/admin/verification', 'admin', { userId: people.admin.id, decision: 'verified' })).status, 200);
    assert.equal(row('admin').professional_status, 'verified');
    assert.equal(row('admin').verification_reviewed_by, 'admin@test.invalid');

    // Verified: the list row is no longer needed, and the list is not even read.
    dropListRow();
    await fetch(`${fake.url}/__control/fail?table=professional_transition_accounts`);
    assert.equal(await opens(), true, 'verified: independent of the transition list');
  } finally {
    await fetch(`${fake.url}/__control/fail`);
    dropListRow();
    patients.splice(patients.findIndex((p) => p.id === 'p-owner'), 1);
    Object.keys(owner).forEach((k) => delete owner[k]);
    Object.assign(owner, saved);
  }
});
