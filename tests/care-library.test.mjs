// Home programme from the Exercises section:
//   - lib/care/program.ts draftFromLibraryExercise (name and steps taken, the
//     exercise id kept as reference, no dose made up) and
//     lib/care/exerciseMedia.ts (which files show an exercise);
//   - /api/my-phygo/exercise-media: signed links only for the exercises of the
//     signed-in patient's own active programme items (not another patient's,
//     not a removed item, not an exercise outside the programme), nothing for
//     an account without a patient record, 401 without a session;
//   - in a real browser (Playwright) against the fake Supabase: the clinician
//     creates the programme from the Exercises section, with the exercises
//     already linked to the patient listed first and a search over the rest;
//     the patient sees "See how it's done" and the exercise's video.
// Synthetic people, exercises and files only. The browser part is skipped
// when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs, { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54806);
const APP_PORT = Number(process.env.CARE_LIBRARY_APP_PORT ?? 3806);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

let C; // lib/care/program.ts
let M; // lib/care/exerciseMedia.ts
before(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-care-lib-'));
  try {
    for (const f of ['program', 'exerciseMedia']) {
      const source = readFileSync(new URL(`../lib/care/${f}.ts`, import.meta.url), 'utf8');
      writeFileSync(join(dir, `${f}.mjs`), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
    }
    C = await import(join(dir, 'program.mjs'));
    M = await import(join(dir, 'exerciseMedia.mjs'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a draft from the Exercises section: name, numbered steps and reference; no dose made up', () => {
  const d = C.draftFromLibraryExercise({ id: 'ex-1', name: '  Synthetic squat ', instructions: ['Feet apart', '', 'Sit back', 7] });
  assert.equal(d.title, 'Synthetic squat');
  assert.equal(d.instructions, '1. Feet apart\n2. Sit back');
  assert.deepEqual([d.exercise_source, d.exercise_ref], ['exercises', 'ex-1']);
  assert.deepEqual([d.sets, d.reps, d.duration_seconds, d.short_sets, d.short_reps, d.short_instructions, d.times_per_day], [null, null, null, null, null, '', 1]);
  assert.equal(C.draftFromLibraryExercise({ id: 'ex-2', name: 'No steps', instructions: null }).instructions, '');
  const row = C.itemRow(d, 'p1', 0);
  assert.deepEqual([row.exercise_source, row.exercise_ref, row.short_variant], ['exercises', 'ex-1', null]);
});

test('media choice: default landscape video, one vertical video, a start image', () => {
  const a = (over) => ({ exercise_id: 'e', asset_type: 'video', variant: null, is_default: false, storage_bucket: 'exercise-media', storage_key: 'k', ...over });
  const m = M.chooseMedia([
    a({ storage_key: 'other.mp4' }),
    a({ storage_key: 'main.mp4', is_default: true }),
    a({ storage_key: 'v1.mp4', variant: 'vertical' }),
    a({ storage_key: 'v2.mp4', variant: 'vertical-female' }),
    a({ asset_type: 'image_start', storage_key: 'first.jpg' }),
    a({ asset_type: 'image_start', storage_key: 'default.jpg', is_default: true }),
    a({ exercise_id: 'f', asset_type: 'image_end', storage_key: 'end.jpg' }),
  ]).get('e');
  assert.deepEqual([m.video.storage_key, m.vertical.storage_key, m.image.storage_key], ['main.mp4', 'v1.mp4', 'default.jpg']);
  assert.equal(M.isUuid('8f300000-0000-4000-8000-000000000001'), true);
  assert.equal(M.isUuid('note-1#0'), false);
  assert.equal(M.isUuid(null), false);
});

// ---------------------------------------------------------------- server and browser

const user = (n) => ({ id: `8f600000-0000-4000-8000-00000000000${n}`, email: `user${n}@test.invalid`, email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' });
const CLIN = user(1);
const PAT = user(2);
const OTHER = user(3); // another clinician's patient
const PID = '8f610000-0000-4000-8000-000000000001';
const OTHER_PID = '8f610000-0000-4000-8000-000000000002';
const EX = (n) => `8f620000-0000-4000-8000-00000000000${n}`;
const exercises = [
  { id: EX(1), name: 'Synthetic squat', muscle: 'quadriceps', region: 'legs' },
  { id: EX(2), name: 'Synthetic plank', muscle: 'core', region: 'trunk' },
  { id: EX(3), name: 'Synthetic lunge', muscle: 'glutes', region: 'legs' },
  { id: EX(4), name: 'Synthetic row', muscle: 'back', region: 'upper body' },
];

let fake;
let app;
let browser;
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: { 'tok-clin': CLIN, 'tok-pat': PAT, 'tok-other': OTHER },
    tables: {
      profiles: [
        { id: CLIN.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free', preferred_language: 'it' },
        { id: PAT.id, plan: 'free', preferred_language: 'it' },
        { id: OTHER.id, plan: 'free', preferred_language: 'it' },
      ],
      patients: [
        { id: PID, user_id: CLIN.id, patient_user_id: PAT.id, name: 'Synthetic Patient', first_name: 'Synthetic', last_name: 'Patient', age: 40, main_condition: 'Synthetic knee pain', created_at: '2026-08-01T09:00:00Z' },
        { id: OTHER_PID, user_id: '8f600000-0000-4000-8000-000000000009', patient_user_id: OTHER.id, name: 'Other Synthetic', created_at: '2026-08-01T09:00:00Z' },
      ],
      exercises: exercises.map((e) => ({ id: e.id, external_id: e.name, source: 'exercise_animatic', archived_at: null, primary_muscle: e.muscle, secondary_muscles: [], equipment: ['none'], category: 'strength', subcategory: null, body_region: e.region, difficulty: 'easy', tags: [] })),
      exercise_translations: exercises.map((e) => ({ exercise_id: e.id, lang: 'en', name: e.name, instructions: [`${e.name} step one`, `${e.name} step two`], tips: null })),
      exercise_assets: exercises.flatMap((e, i) => [
        { exercise_id: e.id, asset_type: 'video', variant: null, is_default: true, storage_bucket: 'exercise-media', storage_key: `ex${i + 1}/video.mp4` },
        { exercise_id: e.id, asset_type: 'image_start', variant: null, is_default: true, storage_bucket: 'exercise-media', storage_key: `ex${i + 1}/start.jpg` },
      ]),
      // The plank was linked to the patient from the Exercises section earlier.
      patient_clinical_references: [{ id: 'ref-1', user_id: CLIN.id, patient_id: PID, content_type: 'exercise', content_id: EX(2), payload: { label: 'Synthetic plank', section: 'Exercise Library' }, created_at: '2026-10-01T09:00:00Z' }],
      notes: [], patient_details: [], appointments: [], video_calls: [], metabolic_profiles: [], professional_transition_accounts: [],
      care_programs: [{ id: 'prog-other', patient_id: OTHER_PID, title: 'Other', status: 'active', starts_on: '2026-10-01', ends_on: null, rest_weekdays: [], created_at: '2026-10-01T09:00:00Z' }],
      care_program_items: [{ id: 'item-other', program_id: 'prog-other', kind: 'exercise', title: 'Synthetic row', exercise_source: 'exercises', exercise_ref: EX(4), weekdays: [], times_per_day: 1, sort_order: 0, active: true }],
      care_activity_logs: [], symptom_checkins: [], care_attention_rules: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url, port: APP_PORT });
  if (!skip) browser = await playwright.chromium.launch({ executablePath: CHROMIUM });
});
after(async () => {
  await browser?.close();
  await app?.stop();
  await fake?.close();
});

const cookieFor = (who) => sessionCookie(`tok-${who}`, { clin: CLIN, pat: PAT, other: OTHER }[who]);
const media = async (who) => {
  const res = await fetch(`${app.url}/api/my-phygo/exercise-media`, { headers: who ? { cookie: cookieFor(who) } : {} });
  return { status: res.status, body: await res.json() };
};

async function pageAs(who) {
  const ctx = await browser.newContext({ locale: 'it-IT', viewport: { width: 1280, height: 1000 } });
  await ctx.addInitScript(() => window.localStorage.setItem('phygo-lang', 'it'));
  const [name, value] = cookieFor(who).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}

test('exercise media: only the signed-in patient’s own programme exercises', async () => {
  assert.equal((await media(null)).status, 401);
  assert.deepEqual((await media('clin')).body.media, {}, 'an account without a patient record gets nothing');
  assert.deepEqual((await media('pat')).body.media, {}, 'no programme yet: nothing');
  const other = (await media('other')).body.media;
  assert.deepEqual(Object.keys(other), [EX(4)], 'the other patient gets their own exercise only');
  assert.match(other[EX(4)].video_url, /\/storage\/v1\/object\/sign\/exercise-media\/ex4\/video\.mp4\?token=/);
});

test('the clinician builds the programme from the Exercises section', { skip }, async () => {
  const { ctx, page, errors } = await pageAs('clin');
  try {
    await page.goto(`${app.url}/dashboard/patients/${PID}`);
    const card = page.getByTestId('care-program-card');
    await card.waitFor({ timeout: 20000 });
    await card.getByRole('button', { name: 'Crea dalla sezione Esercizi' }).click();
    const picker = card.getByTestId('care-library-picker');
    await picker.getByTestId('care-library-linked').waitFor({ timeout: 20000 });
    assert.deepEqual(await picker.getByTestId('care-library-linked').getByTestId('care-library-option').allInnerTexts().then((t) => t.map((s) => s.split('\n')[0])), ['Synthetic plank'], 'the exercise already linked to the patient comes first');
    assert.equal(await picker.getByTestId('care-library-results').getByText('Synthetic plank').count(), 0, 'listed once, not again under all exercises');
    await picker.getByTestId('care-library-linked').getByText('Synthetic plank').click();
    // Search covers name, muscle and area.
    await picker.getByPlaceholder('Cerca per nome, muscolo, zona o attrezzo').fill('quadri');
    assert.equal(await picker.getByTestId('care-library-option').count(), 1);
    await picker.getByText('Synthetic squat').click();
    await picker.getByRole('button', { name: 'Aggiungi 2 esercizi' }).click();

    const drafts = card.getByTestId('care-program-draft-item');
    assert.equal(await drafts.count(), 2);
    assert.equal(await drafts.nth(0).getByLabel('Nome').inputValue(), 'Synthetic plank');
    assert.equal(await drafts.nth(0).locator('textarea').inputValue(), '1. Synthetic plank step one\n2. Synthetic plank step two');
    assert.equal(await card.getByTestId('care-program-library-badge').count(), 2);
    assert.match(await drafts.nth(0).innerText(), /Indica tu serie, ripetizioni o durata/);
    await drafts.nth(0).getByLabel('Durata (secondi)').fill('30');
    await drafts.nth(1).getByLabel('Serie', { exact: true }).fill('3');
    await drafts.nth(1).getByLabel('Ripetizioni', { exact: true }).fill('12');

    // Already chosen exercises are not offered again.
    await card.getByRole('button', { name: 'Aggiungi dalla sezione Esercizi' }).click();
    await picker.getByTestId('care-library-results').waitFor({ timeout: 10000 });
    const offered = (await picker.getByTestId('care-library-option').allInnerTexts()).map((s) => s.split('\n')[0]);
    assert.deepEqual(offered.sort(), ['Synthetic lunge', 'Synthetic row']);
    await picker.getByRole('button', { name: 'Chiudi', exact: true }).first().click();

    await card.getByRole('button', { name: 'Salva programma' }).click();
    await card.getByRole('status').filter({ hasText: 'Programma salvato.' }).waitFor({ timeout: 10000 });
    const program = fake.state.tables.care_programs.find((p) => p.patient_id === PID);
    const items = fake.state.tables.care_program_items.filter((i) => i.program_id === program.id && i.kind === 'exercise');
    assert.deepEqual(items.map((i) => [i.title, i.exercise_source, i.exercise_ref, i.sets, i.reps, i.duration_seconds]), [
      ['Synthetic plank', 'exercises', EX(2), null, null, 30],
      ['Synthetic squat', 'exercises', EX(1), 3, 12, null],
    ]);
    await card.getByTestId('care-program-items').waitFor();
    assert.match(await card.getByTestId('care-program-items').innerText(), /Dalla sezione Esercizi/);
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('the patient sees the exercise video; a removed exercise is not served', { skip }, async () => {
  const keys = Object.keys((await media('pat')).body.media).sort();
  assert.deepEqual(keys, [EX(1), EX(2)].sort(), 'the two exercises of the programme, not the other patient’s');

  const { ctx, page, errors } = await pageAs('pat');
  try {
    await page.goto(`${app.url}/my-phygo/home`);
    const quest = page.getByTestId('daily-quest');
    await quest.waitFor({ timeout: 20000 });
    const task = quest.getByTestId('daily-quest-task').first();
    assert.match(await task.innerText(), /Synthetic plank/);
    await task.getByRole('button', { name: 'Guarda come si fa' }).click();
    const video = task.getByTestId('daily-quest-video');
    await video.waitFor();
    assert.match(await video.getAttribute('src'), /exercise-media\/ex2\/video\.mp4/);
    await task.getByRole('button', { name: 'Nascondi il video' }).click();
    assert.equal(await task.getByTestId('daily-quest-video').count(), 0);
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }

  const plank = fake.state.tables.care_program_items.find((i) => i.exercise_ref === EX(2));
  plank.active = false;
  assert.deepEqual(Object.keys((await media('pat')).body.media), [EX(1)]);
});
