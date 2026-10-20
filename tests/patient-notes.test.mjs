// What a patient receives of their session notes (GET /api/my-phygo/notes):
// only the summary written for them, the exercises without internal fields,
// the id and the date. Never the clinician's findings, assessment, plan or the
// AI-drafted clinical reasoning; never another patient's notes; nothing without
// a session. Synthetic people and notes, against the fake Supabase.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);
const person = (n, email) => ({ id: `0f100000-0000-4000-8000-00000000000${n}`, email, email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' });
const people = {
  clinician: person(1, 'clinician@test.invalid'),
  patientOne: person(2, 'p1@test.invalid'),
  patientTwo: person(3, 'p2@test.invalid'),
  unlinked: person(4, 'nobody@test.invalid'),
};
const cookie = (who) => (who ? { cookie: sessionCookie(`tok-${who}`, people[who]) } : {});
const P1 = '0f200000-0000-4000-8000-000000000001';
const P2 = '0f200000-0000-4000-8000-000000000002';
const INTERNAL = {
  subjective: 'Synthetic subjective findings',
  objective: 'Synthetic objective findings',
  assessment: 'Synthetic assessment',
  plan: 'Synthetic plan',
  clinical_reasoning: { hypotheses: ['Synthetic hypothesis'], differentials: ['Synthetic differential'], redFlags: ['Synthetic red flag'] },
  language: 'it',
};
const reviewedExercise = {
  internal_id: 'wger-1', provider: 'wger', provider_id: '1', name: 'Glute bridge', description: 'Lie on your back', instructions: ['Lift the hips', ''],
  media: { image_url: 'https://example.invalid/bridge.png', gif_url: 'javascript:alert(1)', video_url: null },
  dosing: { sets: 3, reps: 10, duration_seconds: null, frequency_per_week: 4, notes: 'Slowly' },
  source_type: 'ai_suggested', clinical_check: { flagged: true, reason: 'Synthetic internal check' }, _debugKeywords: ['bridge'],
};

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: Object.fromEntries(Object.entries(people).map(([k, u]) => [`tok-${k}`, u])),
    tables: {
      profiles: [],
      patients: [
        { id: P1, user_id: people.clinician.id, patient_user_id: people.patientOne.id, name: 'Synthetic patient 1' },
        { id: P2, user_id: people.clinician.id, patient_user_id: people.patientTwo.id, name: 'Synthetic patient 2' },
      ],
      notes: [
        { id: 'n1', patient_id: P1, user_id: people.clinician.id, created_at: '2026-10-01T10:00:00Z', summary_for_patient: 'Older summary', exercises: ['Bridge, 3x10, daily', '  '], ...INTERNAL },
        { id: 'n2', patient_id: P1, user_id: people.clinician.id, created_at: '2026-10-08T10:00:00Z', summary_for_patient: 'Latest summary', exercises: [reviewedExercise, { name: '' }, null], ...INTERNAL },
        { id: 'n3', patient_id: P2, user_id: people.clinician.id, created_at: '2026-10-09T10:00:00Z', summary_for_patient: 'Other patient', exercises: [], ...INTERNAL },
      ],
    },
  });
  app = await startApp({ fakeUrl: fake.url, port: 3443 });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const notes = (who) => fetch(`${app.url}/api/my-phygo/notes`, { headers: cookie(who) });

test('no notes without a session', async () => {
  assert.equal((await notes(null)).status, 401);
});

test('the patient receives only the fields written for them, newest first', async () => {
  const res = await notes('patientOne');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('cache-control') ?? '', /no-store/);
  const body = await res.json();
  assert.deepEqual(body.notes.map((n) => n.id), ['n2', 'n1']);
  for (const n of body.notes) assert.deepEqual(Object.keys(n).sort(), ['created_at', 'exercises', 'id', 'summary_for_patient']);
  const text = JSON.stringify(body);
  for (const leak of ['Synthetic subjective', 'Synthetic objective', 'Synthetic assessment', 'Synthetic plan', 'Synthetic hypothesis', 'Synthetic differential', 'Synthetic red flag', 'Synthetic internal check', people.clinician.id, 'clinical_check', '_debugKeywords', 'source_type']) {
    assert.ok(!text.includes(leak), `not sent: ${leak}`);
  }
});

test('exercises: plain strings kept, reviewed ones reduced to what the patient needs, empty ones dropped', async () => {
  const [latest, older] = (await (await notes('patientOne')).json()).notes;
  assert.deepEqual(older.exercises, ['Bridge, 3x10, daily']);
  assert.deepEqual(latest.exercises, [
    {
      name: 'Glute bridge',
      description: 'Lie on your back',
      instructions: ['Lift the hips'],
      media: { image_url: 'https://example.invalid/bridge.png', gif_url: null, video_url: null },
      dosing: { sets: 3, reps: 10, duration_seconds: null, frequency_per_week: 4, notes: 'Slowly' },
    },
  ]);
});

test('the patient record comes from the session: no other patient\'s notes, whatever the request says', async () => {
  const two = (await (await notes('patientTwo')).json()).notes;
  assert.deepEqual(two.map((n) => n.id), ['n3']);
  const spoofed = await fetch(`${app.url}/api/my-phygo/notes?patient_id=${P1}`, { headers: cookie('patientTwo') });
  assert.deepEqual((await spoofed.json()).notes.map((n) => n.id), ['n3']);
  assert.deepEqual((await (await notes('unlinked')).json()).notes, [], 'an account linked to no record gets nothing');
  assert.deepEqual((await (await notes('clinician')).json()).notes, [], 'a clinician is not a patient of their own records');
});

test('the notes query asks only for the patient columns, never select=*', () => {
  const reads = fake.state.requests.filter((r) => r.method === 'GET' && r.path === '/rest/v1/notes');
  assert.ok(reads.length > 0);
  for (const r of reads) {
    const select = new URLSearchParams(r.search).get('select');
    assert.equal(select, 'id,created_at,summary_for_patient,exercises');
  }
});
