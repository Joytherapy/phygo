// Integration tests for the exercise library API (/api/exercise-library/list).
// Run with tests/run.sh, which builds the app against the fake Supabase first.
// Everything is synthetic: no real database, storage, OpenAI or user data.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);

// 1,205 active exercises (more than one 1,000-row PostgREST page), plus rows
// that must NOT be listed: 3 archived and 2 from another source.
const ACTIVE = 1205;
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const exercises = [];
const translations = [];
const assets = [];
const hash = (t) => createHash('sha256').update([t.name, t.instructions, t.tips].map((v) => v ?? '').join('|||')).digest('hex');
for (let n = 1; n <= ACTIVE + 5; n++) {
  const archived = n > ACTIVE && n <= ACTIVE + 3;
  const otherSource = n > ACTIVE + 3;
  exercises.push({
    id: id(n),
    source: otherSource ? 'wger' : 'exercise_animatic',
    external_id: `test_exercise_${n}`,
    primary_muscle: n % 2 ? 'quadriceps' : 'deltoid',
    secondary_muscles: [],
    equipment: n % 3 ? ['bodyweight'] : ['band'],
    category: 'strength',
    subcategory: null,
    body_region: n % 2 ? 'lower_body' : 'upper_body',
    difficulty: 'beginner',
    tags: n % 10 === 0 ? ['cardio-hiit'] : [],
    archived_at: archived ? '2026-10-01T00:00:00Z' : null,
  });
  const en = { exercise_id: id(n), lang: 'en', name: `Test exercise ${n}`, instructions: `Step ${n}`, tips: null };
  translations.push(en, { ...en, lang: 'it', name: `Esercizio di prova ${n}`, source_hash: hash(en) });
  // Exercises 1-5 only have a vertical video (as 17 real exercises do); the rest have a default one.
  const verticalOnly = n <= 5;
  if (!verticalOnly) assets.push({ exercise_id: id(n), asset_type: 'video', variant: '720p', is_default: true, storage_bucket: 'exercise-media', storage_key: `videos/${n}.mp4` });
  assets.push({ exercise_id: id(n), asset_type: 'video', variant: 'vertical', is_default: false, storage_bucket: 'exercise-media', storage_key: `videos/${n}-v.mp4` });
  assets.push({ exercise_id: id(n), asset_type: 'image_start', variant: null, is_default: true, storage_bucket: 'exercise-media', storage_key: `images/${n}-start.jpg` });
}

const physio = { id: 'user-physio', email: 'physio@test.invalid', role: 'authenticated' };
const student = { id: 'user-student', email: 'student@test.invalid', role: 'authenticated' };
const users = { 'tok-physio': physio, 'tok-student': student };
const cookie = { physio: sessionCookie('tok-physio', physio), student: sessionCookie('tok-student', student) };

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users,
    tables: {
      exercises,
      exercise_translations: translations,
      exercise_assets: assets,
      profiles: [
        { id: physio.id, practice_stage: 'professional', plan: 'free' },
        { id: student.id, practice_stage: 'student', plan: 'free' },
      ],
      patients: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const list = (who, lang = 'en') =>
  fetch(`${app.url}/api/exercise-library/list?lang=${lang}`, { headers: who ? { cookie: cookie[who] } : {} });

test('anonymous requests are rejected', async () => {
  const res = await list(null);
  assert.equal(res.status, 401);
});

test('a physiotherapist gets every active exercise, across PostgREST pages', async () => {
  const res = await list('physio');
  assert.equal(res.status, 200);
  const { exercises: out } = await res.json();
  assert.equal(out.length, ACTIVE);
  assert.equal(new Set(out.map((e) => e.id)).size, ACTIVE, 'no duplicates');
  assert.ok(!out.some((e) => e.id === id(ACTIVE + 1)), 'archived exercises are excluded');
  assert.ok(!out.some((e) => e.id === id(ACTIVE + 5)), 'other sources are excluded');
  // The listing reads in pages of 1,000: offsets 0 and 1000 must both be requested.
  const pages = fake.state.requests.filter((r) => r.path === '/rest/v1/exercises').map((r) => new URLSearchParams(r.search).get('offset'));
  assert.ok(pages.includes('0') && pages.includes('1000'), `paged reads, got offsets ${pages}`);
});

test('every exercise has a playable, signed video reference', async () => {
  const { exercises: out } = await (await list('physio')).json();
  const withoutVideo = out.filter((e) => !e.video_url && !e.video_vertical_url);
  assert.equal(withoutVideo.length, 0);
  const verticalOnly = out.find((e) => e.id === id(1));
  assert.equal(verticalOnly.video_url, null);
  assert.match(verticalOnly.video_vertical_url, /exercise-media\/videos\/1-v\.mp4\?token=/);
  const regular = out.find((e) => e.id === id(100));
  assert.match(regular.video_url, /exercise-media\/videos\/100\.mp4\?token=/);
  assert.match(regular.image_start_url, /images\/100-start\.jpg/);
});

test('a student gets the same library', async () => {
  const res = await list('student');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).exercises.length, ACTIVE);
});

test('cached translations are used without calling OpenAI', async () => {
  const before = fake.state.requests.filter((r) => r.path.startsWith('/openai/')).length;
  const { exercises: out } = await (await list('physio', 'it')).json();
  assert.equal(out.find((e) => e.id === id(42)).name, 'Esercizio di prova 42');
  assert.equal(fake.state.requests.filter((r) => r.path.startsWith('/openai/')).length, before);
});

test('a database failure is reported as an error, never as an empty library', async () => {
  await fetch(`${fake.url}/__control/fail?table=exercise_assets`);
  try {
    const res = await list('physio');
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.ok(body.error, 'error message present');
    assert.equal(body.exercises, undefined);
  } finally {
    await fetch(`${fake.url}/__control/fail`);
  }
});

test('a masked service-role key is reported as a configuration problem', async () => {
  const broken = await startApp({ fakeUrl: fake.url, port: 3412, serviceRoleKey: `eyJ${'•'.repeat(12)}` });
  try {
    const sent = fake.state.requests.length;
    const res = await fetch(`${broken.url}/api/exercise-library/list?lang=en`, { headers: { cookie: cookie.physio } });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.code, 'server_config');
    assert.ok(!JSON.stringify(body).includes('•'), 'the key is never echoed');
    // Only the session check reached Supabase; no exercise query was attempted with the broken key.
    assert.ok(fake.state.requests.slice(sent).every((r) => r.path === '/auth/v1/user'));
    assert.match(broken.logs(), /SUPABASE_SERVICE_ROLE_KEY contains "•" characters/);
  } finally {
    await broken.stop();
  }
});
