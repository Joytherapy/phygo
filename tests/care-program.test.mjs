// Care programme (D2): the clinician's "Home programme" card and the patient's
// "Today" (Daily Quest) in My Phygo.
//   - lib/care/program.ts: what a day asks for (rest days, scheduled days,
//     sessions per day, programme dates and status), adherence counts, the
//     draft taken from a note's exercises (dose copied as written, nothing
//     added), the row written for an item, and how a missing table is detected;
//   - in a real browser (Playwright) against the fake Supabase: without the
//     tables (SQL not applied) nothing is shown and nothing breaks; the
//     clinician creates the programme from the latest note; the patient sees
//     today's activities, records them as their own report, sees a short
//     version only where the clinician wrote one, and saves a 0-10 check-in;
//     a rest day shows no activity.
// What may be written is enforced by row-level security and triggers, which
// the fake does not apply: tests/sql/care_program.sh checks those on
// PostgreSQL. Synthetic people and records only. The browser part is skipped
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

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54804);
const APP_PORT = Number(process.env.CARE_PROGRAM_APP_PORT ?? 3804);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

let C; // lib/care/program.ts, transpiled
before(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-care-'));
  try {
    const source = readFileSync(new URL('../lib/care/program.ts', import.meta.url), 'utf8');
    writeFileSync(join(dir, 'program.mjs'), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
    C = await import(join(dir, 'program.mjs'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const program = (over = {}) => ({ id: 'p1', patient_id: 'pt', title: 'Synthetic', status: 'active', starts_on: '2026-10-01', ends_on: null, rest_weekdays: [], ...over });
const item = (over = {}) => ({ id: 'i1', program_id: 'p1', kind: 'exercise', title: 'Bridge', instructions: null, exercise_source: null, exercise_ref: null, sets: 3, reps: 10, duration_seconds: null, dose_notes: null, weekdays: [], times_per_day: 1, short_variant: null, education_url: null, sort_order: 0, active: true, ...over });
const log = (over = {}) => ({ item_id: 'i1', activity_date: '2026-10-20', slot: 1, status: 'done', variant: 'standard', provenance: 'patient_reported', ...over });

// 2026-10-19 is a Monday (ISO 1), 2026-10-25 a Sunday (ISO 7).
test('weekdays and dates', () => {
  assert.equal(C.isoWeekday('2026-10-19'), 1);
  assert.equal(C.isoWeekday('2026-10-25'), 7);
  assert.equal(C.addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(C.addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(C.localDate(new Date(2026, 0, 5)), '2026-01-05');
});

test('a day: rest days, scheduled days, sessions per day, dates and status', () => {
  const items = [item(), item({ id: 'i2', title: 'Walk', weekdays: [6], sort_order: 1 }), item({ id: 'i3', title: 'Twice', times_per_day: 2, sort_order: 2 }), item({ id: 'c', kind: 'checkin', title: 'Check-in', sets: null, reps: null })];
  const mon = C.planForDay(program(), items, [], '2026-10-19');
  assert.equal(mon.kind, 'day');
  assert.deepEqual(mon.tasks.map((t) => `${t.item.id}:${t.slot}`), ['i1:1', 'i3:1', 'i3:2'], 'the Saturday-only walk is not on Monday; twice a day is two sessions');
  assert.equal(mon.checkin, true);
  assert.equal(C.planForDay(program(), items, [], '2026-10-24').tasks.some((t) => t.item.id === 'i2'), true, 'the walk is on Saturday');
  assert.equal(C.planForDay(program({ rest_weekdays: [1] }), items, [], '2026-10-19').kind, 'rest');
  assert.equal(C.planForDay(program({ status: 'paused' }), items, [], '2026-10-19').kind, 'paused');
  assert.equal(C.planForDay(program({ status: 'completed' }), items, [], '2026-10-19').kind, 'none');
  assert.equal(C.planForDay(null, items, [], '2026-10-19').kind, 'none');
  assert.equal(C.planForDay(program({ starts_on: '2026-10-20' }), items, [], '2026-10-19').kind, 'outside');
  assert.equal(C.planForDay(program({ ends_on: '2026-10-18' }), items, [], '2026-10-19').kind, 'outside');
  assert.equal(C.planForDay(program(), [item({ active: false })], [], '2026-10-19').tasks.length, 0, 'a removed exercise is not shown');
});

test('progress and adherence count prescribed sessions only', () => {
  const items = [item(), item({ id: 'i2', sort_order: 1 })];
  const logs = [log({ activity_date: '2026-10-19' }), log({ item_id: 'i2', activity_date: '2026-10-19', status: 'skipped' }), log({ activity_date: '2026-10-20', status: 'partial' })];
  const day = C.planForDay(program(), items, logs, '2026-10-19');
  assert.deepEqual(C.progress(day.tasks), { done: 1, total: 2 });
  assert.deepEqual(C.adherence(program({ rest_weekdays: [3] }), items, logs, '2026-10-19', '2026-10-21'), { planned: 4, done: 2, skipped: 1, unrecorded: 1 }, 'Wednesday is a rest day');
  // A device or camera record does not hide the patient's own record of the same session, and counts when it is the only one.
  const device = C.planForDay(program(), [item()], [log({ provenance: 'device_measured', activity_date: '2026-10-19' })], '2026-10-19');
  assert.equal(device.tasks[0].log.provenance, 'device_measured');
});

test('draft from the note: dose copied as written, internal fields left out, nothing invented', () => {
  const drafts = C.draftFromNoteExercises([
    { name: 'Glute bridge', provider: 'wger', provider_id: 12, instructions: ['Lift the hips', ''], dosing: { sets: 3, reps: 10, frequency_per_week: 4, notes: 'Slowly' }, clinical_check: { flagged: true } },
    'Walk 20 minutes',
    { name: '', dosing: { sets: 9 } },
    { name: 'Too much', dosing: { sets: 99, reps: 9999 } },
    null,
  ], 'note-1');
  assert.equal(drafts.length, 3);
  assert.deepEqual([drafts[0].title, drafts[0].sets, drafts[0].reps, drafts[0].dose_notes, drafts[0].instructions, drafts[0].exercise_source, drafts[0].exercise_ref], ['Glute bridge', 3, 10, 'Slowly', 'Lift the hips', 'wger', '12']);
  assert.deepEqual([drafts[1].title, drafts[1].sets, drafts[1].exercise_source, drafts[1].exercise_ref], ['Walk 20 minutes', null, 'note', 'note-1#1']);
  assert.deepEqual([drafts[2].sets, drafts[2].reps], [null, null], 'out-of-range doses are not copied');
  for (const d of drafts) assert.equal(d.short_sets ?? d.short_reps ?? (d.short_instructions || null), null, 'no short variant is made up');
  assert.deepEqual(C.draftFromNoteExercises('not a list', 'x'), []);
});

test('item rows: the short variant only when the clinician wrote one', () => {
  const plain = C.itemRow({ ...C.blankDraft(), title: ' Squat ', sets: 2, reps: 8, times_per_day: 9 }, 'p1', 0);
  assert.equal(plain.title, 'Squat');
  assert.equal(plain.short_variant, null);
  assert.equal(plain.times_per_day, 6);
  const short = C.itemRow({ ...C.blankDraft(), title: 'Squat', short_sets: 1, short_reps: 5 }, 'p1', 1);
  assert.deepEqual(short.short_variant, { sets: 1, reps: 5, instructions: null });
  const checkin = C.itemRow({ ...C.blankDraft(), kind: 'checkin', title: 'Check-in', sets: 3 }, 'p1', 2);
  assert.deepEqual([checkin.sets, checkin.short_variant], [null, null]);
});

test('missing table detection and dose labels', () => {
  assert.equal(C.isMissingTable({ code: 'PGRST205', message: "Could not find the table 'public.care_programs'" }), true);
  assert.equal(C.isMissingTable({ code: '42P01', message: 'relation does not exist' }), true);
  assert.equal(C.isMissingTable({ code: '42501', message: 'permission denied' }), false);
  assert.equal(C.isMissingTable(null), false);
  assert.equal(C.doseLabel({ sets: 3, reps: 10 }), '3 × 10');
  assert.equal(C.doseLabel({ sets: 2, duration_seconds: 30 }), '2 × 30 s');
  assert.equal(C.doseLabel({ duration_seconds: 45 }), '45 s');
  assert.equal(C.doseLabel({ duration_seconds: 1200 }), '20 min');
  assert.equal(C.doseLabel({ duration_seconds: 90 }), '90 s');
  assert.equal(C.doseLabel({}), null);
});

// ---------------------------------------------------------------- browser

const CLIN = { id: '8f300000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const PAT = { id: '8f300000-0000-4000-8000-000000000002', email: 'patient@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const PID = '8f310000-0000-4000-8000-000000000001';
const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const TODAY = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const dow = (d) => (d.getDay() === 0 ? 7 : d.getDay());
const TODAY_DOW = dow(now);
const OTHER_DOW = TODAY_DOW === 7 ? 1 : TODAY_DOW + 1;

let fake;
let app;
let browser;
before(async () => {
  if (skip) return;
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: { 'tok-clin': CLIN, 'tok-pat': PAT },
    tables: {
      profiles: [
        { id: CLIN.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free', preferred_language: 'it' },
        { id: PAT.id, plan: 'free', preferred_language: 'it' },
      ],
      patients: [{ id: PID, user_id: CLIN.id, patient_user_id: PAT.id, name: 'Synthetic Patient', first_name: 'Synthetic', last_name: 'Patient', age: 40, main_condition: 'Synthetic low back pain', created_at: '2026-08-01T09:00:00Z' }],
      notes: [
        { id: 'n-old', user_id: CLIN.id, patient_id: PID, created_at: '2026-09-01T09:00:00Z', assessment: 'Old', exercises: ['Old exercise'] },
        { id: 'n-new', user_id: CLIN.id, patient_id: PID, created_at: '2026-10-10T09:00:00Z', assessment: 'Synthetic assessment', summary_for_patient: 'Synthetic summary',
          exercises: [{ name: 'Synthetic bridge', provider: 'wger', provider_id: 12, instructions: ['Lift the hips slowly'], dosing: { sets: 3, reps: 10 } }, 'Synthetic walk'] },
      ],
      patient_details: [], patient_clinical_references: [], appointments: [], video_calls: [], metabolic_profiles: [], professional_transition_accounts: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url, port: APP_PORT });
  browser = await playwright.chromium.launch({ executablePath: CHROMIUM });
});
after(async () => {
  await browser?.close();
  await app?.stop();
  await fake?.close();
});

async function pageAs(who) {
  const ctx = await browser.newContext({ locale: 'it-IT', viewport: { width: 1280, height: 1000 } });
  await ctx.addInitScript(() => window.localStorage.setItem('phygo-lang', 'it'));
  const user = who === 'clin' ? CLIN : PAT;
  const [name, value] = sessionCookie(`tok-${who}`, user).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}

async function waitFor(check, what, timeout = 10000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.fail(`timed out waiting for ${what}`);
}

const CARE_TABLES = ['care_programs', 'care_program_items', 'care_activity_logs', 'symptom_checkins', 'care_attention_rules'];

test('without the tables (SQL not applied) neither page shows the programme, and nothing breaks', { skip }, async () => {
  for (const t of CARE_TABLES) fake.state.missingTables.add(t);
  try {
    const clin = await pageAs('clin');
    await clin.page.goto(`${app.url}/dashboard/patients/${PID}`);
    await clin.page.getByTestId('patient-profile').waitFor({ timeout: 20000 });
    await clin.page.waitForTimeout(800);
    assert.equal(await clin.page.getByTestId('care-program-card').count(), 0);
    assert.deepEqual(clin.errors, []);
    await clin.ctx.close();

    const pat = await pageAs('pat');
    await pat.page.goto(`${app.url}/my-phygo/home`);
    await pat.page.getByRole('heading', { name: 'Synthetic Patient' }).waitFor({ timeout: 20000 });
    await pat.page.waitForTimeout(800);
    assert.equal(await pat.page.getByTestId('daily-quest').count(), 0);
    assert.deepEqual(pat.errors, []);
    await pat.ctx.close();
  } finally {
    for (const t of CARE_TABLES) fake.state.missingTables.delete(t);
  }
});

test('the clinician creates the programme from the latest note, with the dose as prescribed', { skip }, async () => {
  const { ctx, page, errors } = await pageAs('clin');
  try {
    await page.goto(`${app.url}/dashboard/patients/${PID}`);
    const card = page.getByTestId('care-program-card');
    await card.waitFor({ timeout: 20000 });
    await card.getByRole('button', { name: 'Crea dall’ultima nota' }).click();
    const drafts = card.getByTestId('care-program-draft-item');
    await drafts.first().waitFor();
    assert.equal(await drafts.count(), 2, 'both exercises of the latest note, not the older one');
    assert.equal(await drafts.nth(0).getByLabel('Nome').inputValue(), 'Synthetic bridge');
    assert.equal(await drafts.nth(0).getByLabel('Serie', { exact: true }).inputValue(), '3');
    assert.equal(await drafts.nth(0).getByLabel('Ripetizioni', { exact: true }).inputValue(), '10');
    // A short variant for the first exercise only; tomorrow is a rest day.
    await drafts.nth(0).locator('summary').click();
    await drafts.nth(0).getByLabel('Variante breve (facoltativa) Serie').fill('1');
    await drafts.nth(0).getByLabel('Variante breve (facoltativa) Ripetizioni').fill('5');
    const weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    await card.getByRole('button', { name: weekdays[OTHER_DOW - 1], exact: true }).click();
    await card.getByRole('button', { name: 'Salva programma' }).click();
    await card.getByRole('status').filter({ hasText: 'Programma salvato.' }).waitFor({ timeout: 10000 });

    const programs = fake.state.tables.care_programs;
    assert.equal(programs.length, 1);
    assert.deepEqual([programs[0].patient_id, programs[0].status, programs[0].source_note_id, programs[0].rest_weekdays], [PID, 'active', 'n-new', [OTHER_DOW]]);
    const items = fake.state.tables.care_program_items.filter((i) => i.program_id === programs[0].id);
    assert.deepEqual(items.map((i) => [i.kind, i.title, i.sets, i.reps]), [['exercise', 'Synthetic bridge', 3, 10], ['exercise', 'Synthetic walk', null, null], ['checkin', 'Check-in giornaliero di dolore e fatica', null, null]]);
    assert.deepEqual(items[0].short_variant, { sets: 1, reps: 5, instructions: null });
    assert.equal(items[1].short_variant, null, 'no short variant unless the clinician writes one');
    await card.getByTestId('care-program-items').waitFor();
    assert.match(await card.getByTestId('care-program-week').innerText(), /0 di \d+ sessioni/);
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('the patient records today, sees a short version only where prescribed, and checks in', { skip }, async () => {
  const { ctx, page, errors } = await pageAs('pat');
  try {
    await page.goto(`${app.url}/my-phygo/home`);
    const quest = page.getByTestId('daily-quest');
    await quest.waitFor({ timeout: 20000 });
    const tasks = quest.getByTestId('daily-quest-task');
    assert.equal(await tasks.count(), 2);
    assert.equal(await quest.getByTestId('daily-quest-progress').innerText(), '0 di 2');
    assert.match(await tasks.nth(0).innerText(), /3 × 10/);

    await quest.getByLabel(/Oggi ho poca voglia/).check();
    assert.match(await tasks.nth(0).innerText(), /Versione breve/);
    assert.match(await tasks.nth(0).innerText(), /1 × 5/);
    assert.match(await tasks.nth(1).getByTestId('daily-quest-no-short').innerText(), /non c’è una versione breve/);

    await tasks.nth(0).getByRole('button', { name: 'Fatto' }).click();
    await tasks.nth(0).getByTestId('daily-quest-recorded').waitFor({ timeout: 10000 });
    await tasks.nth(1).getByRole('button', { name: 'Saltato' }).click();
    await tasks.nth(1).getByTestId('daily-quest-recorded').waitFor({ timeout: 10000 });
    assert.equal(await quest.getByTestId('daily-quest-progress').innerText(), '1 di 2', 'a skipped activity is recorded but not counted as done');

    const logs = fake.state.tables.care_activity_logs;
    assert.equal(logs.length, 2);
    for (const l of logs) assert.deepEqual([l.patient_id, l.activity_date, l.slot, l.provenance], [PID, TODAY, 1, 'patient_reported']);
    assert.deepEqual(logs.map((l) => [l.status, l.variant]), [['done', 'short'], ['skipped', 'standard']]);

    // Changing an answer updates the same record (one per activity, day and session).
    await tasks.nth(1).getByRole('button', { name: 'Cambia' }).click();
    await tasks.nth(1).getByRole('button', { name: 'In parte' }).click();
    await waitFor(() => fake.state.tables.care_activity_logs.filter((l) => l.item_id === logs[1].item_id).length === 1 && fake.state.tables.care_activity_logs.find((l) => l.item_id === logs[1].item_id).status === 'partial', 'the corrected record');
    assert.equal(fake.state.tables.care_activity_logs.length, 2);

    const checkin = quest.getByTestId('symptom-checkin');
    await checkin.getByRole('button', { name: 'Dolore 4' }).click();
    await checkin.getByRole('button', { name: 'Fatica 3' }).click();
    assert.match(await checkin.innerText(), /0 = nessun dolore/);
    assert.match(await checkin.innerText(), /10 = il peggior dolore immaginabile/);
    await checkin.getByRole('button', { name: 'Salva' }).click();
    await checkin.getByRole('status').filter({ hasText: 'Check-in salvato.' }).waitFor({ timeout: 10000 });
    assert.deepEqual(fake.state.tables.symptom_checkins.map((c) => [c.patient_id, c.checkin_date, c.pain_nrs, c.fatigue_nrs]), [[PID, TODAY, 4, 3]]);
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('the clinician sees the last 7 days and the latest check-in', { skip }, async () => {
  const { ctx, page } = await pageAs('clin');
  try {
    await page.goto(`${app.url}/dashboard/patients/${PID}`);
    const card = page.getByTestId('care-program-card');
    await card.getByTestId('care-program-week').waitFor({ timeout: 20000 });
    await waitFor(async () => /2 di \d+ sessioni segnate come fatte/.test(await card.getByTestId('care-program-week').innerText()), 'the week summary');
    assert.match(await card.innerText(), /Dichiarato dal paziente/);
    assert.match(await card.innerText(), /dolore 4\/10, fatica 3\/10/);
  } finally {
    await ctx.close();
  }
});

test('on a rest day the patient sees no activity to do', { skip }, async () => {
  fake.state.tables.care_programs[0].rest_weekdays = [TODAY_DOW];
  try {
    const { ctx, page, errors } = await pageAs('pat');
    await page.goto(`${app.url}/my-phygo/home`);
    const message = page.getByTestId('daily-quest-message');
    await message.waitFor({ timeout: 20000 });
    assert.match(await message.innerText(), /giorno di riposo/);
    assert.equal(await page.getByTestId('daily-quest-task').count(), 0);
    assert.deepEqual(errors, []);
    await ctx.close();
  } finally {
    fake.state.tables.care_programs[0].rest_weekdays = [OTHER_DOW];
  }
});
