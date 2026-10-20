// Clinician attention view (D3): lib/care/attention.ts and the dashboard
// "Home programmes" section with the per-patient thresholds editor.
//   - every indicator has a fixed definition: sessions done vs planned in 7
//     days; the latest check-in of the last 7 days; flags only for thresholds
//     the clinician set (none set = no flag); "no update" only when sessions
//     were planned and nothing at all was recorded;
//   - in a real browser (Playwright) against the fake Supabase: hidden without
//     the tables; flagged patients first; the thresholds editor writes only the
//     clinician's own rules row.
// Synthetic people and records only. The browser part is skipped when
// Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs, { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54805);
const APP_PORT = Number(process.env.CARE_ATTENTION_APP_PORT ?? 3805);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

let A; // lib/care/attention.ts (with ./program), transpiled
before(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-attention-'));
  try {
    for (const f of ['program', 'attention']) {
      const source = readFileSync(new URL(`../lib/care/${f}.ts`, import.meta.url), 'utf8').replace("from './program'", "from './program.mjs'");
      writeFileSync(join(dir, `${f}.mjs`), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
    }
    A = await import(join(dir, 'attention.mjs'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const TODAY = '2026-10-21'; // a Wednesday
const program = (over = {}) => ({ id: 'p1', patient_id: 'pt', title: 'Synthetic', status: 'active', starts_on: '2026-10-01', ends_on: null, rest_weekdays: [], ...over });
const item = (over = {}) => ({ id: 'i1', program_id: 'p1', kind: 'exercise', title: 'Bridge', instructions: null, exercise_source: null, exercise_ref: null, sets: 3, reps: 10, duration_seconds: null, dose_notes: null, weekdays: [], times_per_day: 1, short_variant: null, education_url: null, sort_order: 0, active: true, ...over });
const log = (date, over = {}) => ({ item_id: 'i1', activity_date: date, slot: 1, status: 'done', variant: 'standard', provenance: 'patient_reported', ...over });
const ck = (date, pain, fatigue = null) => ({ checkin_date: date, pain_nrs: pain, fatigue_nrs: fatigue });
const RULES = { pain_at_or_above: 7, pain_rise_points: 2, fatigue_at_or_above: 8, no_update_days: 3 };

test('no thresholds, no flags: only the data', () => {
  const a = A.attentionFor(program(), [item()], [], [ck('2026-10-20', 10, 10)], null, TODAY);
  assert.deepEqual(a.flags, []);
  assert.equal(a.lastCheckin.pain_nrs, 10);
  assert.deepEqual(a.week, { planned: 7, done: 0, skipped: 0, unrecorded: 7 });
});

test('pain, rise and fatigue use the latest check-in of the last 7 days', () => {
  const checkins = [ck('2026-10-02', 3), ck('2026-10-19', 8, 9)];
  const codes = A.attentionFor(program(), [item()], [log('2026-10-20')], checkins, RULES, TODAY).flags.map((f) => f.code);
  assert.deepEqual(codes, ['pain_high', 'pain_rise', 'fatigue_high']);
  const rise = A.attentionFor(program(), [item()], [log('2026-10-20')], checkins, RULES, TODAY).flags.find((f) => f.code === 'pain_rise');
  assert.deepEqual([rise.from, rise.to], [3, 8]);
  // A check-in older than 7 days raises nothing, whatever its values.
  assert.deepEqual(A.attentionFor(program(), [item()], [log('2026-10-20')], [ck('2026-10-02', 3), ck('2026-10-10', 9, 9)], RULES, TODAY).flags, []);
  // Below the threshold, or a rise smaller than set: nothing.
  assert.deepEqual(A.attentionFor(program(), [item()], [log('2026-10-20')], [ck('2026-10-02', 5), ck('2026-10-19', 6, 7)], RULES, TODAY).flags, []);
  // The rise needs an earlier check-in since the programme started.
  assert.deepEqual(A.attentionFor(program({ starts_on: '2026-10-15' }), [item()], [log('2026-10-20')], [ck('2026-10-02', 1), ck('2026-10-19', 6)], RULES, TODAY).flags, []);
});

test('"no update" only when sessions were planned and nothing at all was recorded', () => {
  const flags = (logs, over = {}) => A.attentionFor(program(over), [item()], logs, [], RULES, TODAY).flags.map((f) => f.code);
  assert.deepEqual(flags([]), ['no_update']);
  assert.deepEqual(flags([log('2026-10-19', { status: 'skipped' })]), [], 'a skipped session is an update');
  assert.deepEqual(flags([log('2026-10-21')]), ['no_update'], 'today is not part of the window: the day is not over');
  assert.deepEqual(flags([], { rest_weekdays: [6, 7, 1, 2] }), [], 'Sat–Tue were rest days: nothing was planned (window = Sat 18 – Tue 20)');
  assert.deepEqual(flags([], { status: 'maintenance' }), [], 'not raised in maintenance');
  assert.deepEqual(flags([], { starts_on: '2026-10-21' }), [], 'the programme started today');
});

test('ordering: flagged first, then the lowest share done', () => {
  const ok = A.attentionFor(program(), [item()], ['2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'].map((d) => log(d)), [], null, TODAY);
  const low = A.attentionFor(program(), [item()], [log('2026-10-20')], [], null, TODAY);
  const flagged = A.attentionFor(program(), [item()], [], [ck('2026-10-20', 9)], RULES, TODAY);
  assert.deepEqual([ok, low, flagged].sort(A.attentionOrder), [flagged, low, ok]);
});

// ---------------------------------------------------------------- browser

const CLIN = { id: '8f500000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const P1 = '8f510000-0000-4000-8000-000000000001';
const P2 = '8f510000-0000-4000-8000-000000000002';
const P3 = '8f510000-0000-4000-8000-000000000003';
const pad = (n) => String(n).padStart(2, '0');
const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n) => local(new Date(Date.now() - n * 86400000));
const itemRow = (id, program_id) => ({ id, program_id, kind: 'exercise', title: 'Synthetic exercise', instructions: null, exercise_source: null, exercise_ref: null, sets: 3, reps: 10, duration_seconds: null, dose_notes: null, weekdays: [], times_per_day: 1, short_variant: null, education_url: null, sort_order: 0, active: true });

let fake;
let app;
let browser;
before(async () => {
  if (skip) return;
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: { 'tok-clin': CLIN },
    tables: {
      profiles: [{ id: CLIN.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free', preferred_language: 'it' }],
      patients: [
        { id: P1, user_id: CLIN.id, patient_user_id: 'u1', name: 'Synthetic Steady', age: 40, main_condition: null, gender: null, created_at: '2026-08-01T09:00:00Z' },
        { id: P2, user_id: CLIN.id, patient_user_id: 'u2', name: 'Synthetic Flagged', age: 50, main_condition: null, gender: null, created_at: '2026-08-02T09:00:00Z' },
        { id: P3, user_id: CLIN.id, patient_user_id: null, name: 'Synthetic NoProgramme', age: 30, main_condition: null, gender: null, created_at: '2026-08-03T09:00:00Z' },
      ],
      notes: [], appointments: [], video_calls: [], patient_details: [], patient_clinical_references: [], metabolic_profiles: [], professional_transition_accounts: [],
      care_programs: [
        { id: 'cp1', patient_id: P1, title: 'Programma a casa', status: 'active', starts_on: daysAgo(20), ends_on: null, rest_weekdays: [], source_note_id: null, created_at: '2026-10-01T09:00:00Z' },
        { id: 'cp2', patient_id: P2, title: 'Programma a casa', status: 'active', starts_on: daysAgo(20), ends_on: null, rest_weekdays: [], source_note_id: null, created_at: '2026-10-01T09:00:00Z' },
      ],
      care_program_items: [itemRow('i1', 'cp1'), itemRow('i2', 'cp2')],
      care_activity_logs: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `l${n}`, patient_id: P1, item_id: 'i1', activity_date: daysAgo(n), slot: 1, status: 'done', variant: 'standard', provenance: 'patient_reported' })),
      symptom_checkins: [
        { id: 'c1', patient_id: P2, checkin_date: daysAgo(15), pain_nrs: 3, fatigue_nrs: 3, note: null },
        { id: 'c2', patient_id: P2, checkin_date: daysAgo(1), pain_nrs: 8, fatigue_nrs: 4, note: 'Synthetic note' },
      ],
      care_attention_rules: [{ patient_id: P2, user_id: CLIN.id, pain_at_or_above: 7, pain_rise_points: 3, fatigue_at_or_above: null, no_update_days: 3 }],
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

async function clinicianPage() {
  const ctx = await browser.newContext({ locale: 'it-IT', viewport: { width: 1280, height: 1000 } });
  await ctx.addInitScript(() => window.localStorage.setItem('phygo-lang', 'it'));
  const [name, value] = sessionCookie('tok-clin', CLIN).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}

test('the dashboard lists patients with a programme, flagged ones first, with plain definitions', { skip }, async () => {
  const { ctx, page, errors } = await clinicianPage();
  try {
    await page.goto(`${app.url}/dashboard`);
    const section = page.getByTestId('care-attention');
    await section.waitFor({ timeout: 20000 });
    const rows = section.getByTestId('care-attention-row');
    assert.equal(await rows.count(), 2, 'only patients with a programme in use');
    assert.match(await rows.nth(0).innerText(), /Synthetic Flagged/);
    const flags = await rows.nth(0).getByTestId('care-attention-flag').allInnerTexts();
    assert.deepEqual(flags, ['Dolore 8/10 (soglia 7)', 'Dolore da 3 a 8 dall’inizio', 'Nessun aggiornamento da 3 giorni']);
    assert.match(await rows.nth(1).innerText(), /Synthetic Steady/);
    assert.match(await rows.nth(1).getByTestId('care-attention-week').innerText(), /^6\/7 sessioni in 7 giorni$/);
    assert.equal(await rows.nth(1).getByTestId('care-attention-flag').count(), 0, 'no thresholds set for this patient: no flag');
    await section.getByText('Come leggere questi dati').click();
    assert.match(await section.innerText(), /Non indica un peggioramento clinico/);
    assert.equal(await rows.nth(0).locator('a').getAttribute('href'), `/dashboard/patients/${P2}`);
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('the thresholds editor saves only this patient\'s rules', { skip }, async () => {
  const { ctx, page, errors } = await clinicianPage();
  try {
    await page.goto(`${app.url}/dashboard/patients/${P1}`);
    const rules = page.getByTestId('care-attention-rules');
    await rules.waitFor({ timeout: 20000 });
    await rules.locator('summary').click();
    await rules.getByLabel('Dolore pari o superiore a').selectOption('6');
    await rules.getByLabel('Nessun aggiornamento per almeno (giorni)').selectOption('5');
    await rules.getByRole('button', { name: 'Salva soglie' }).click();
    await rules.getByRole('status').filter({ hasText: 'Soglie salvate.' }).waitFor({ timeout: 10000 });
    const row = fake.state.tables.care_attention_rules.find((r) => r.patient_id === P1);
    assert.deepEqual([row.pain_at_or_above, row.pain_rise_points, row.fatigue_at_or_above, row.no_update_days], [6, null, null, 5]);
    const other = fake.state.tables.care_attention_rules.find((r) => r.patient_id === P2);
    assert.deepEqual([other.pain_at_or_above, other.no_update_days], [7, 3], 'another patient\'s rules are untouched');
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('without the tables the dashboard has no programmes section and still works', { skip }, async () => {
  for (const t of ['care_programs', 'care_program_items', 'care_activity_logs', 'symptom_checkins', 'care_attention_rules']) fake.state.missingTables.add(t);
  const { ctx, page, errors } = await clinicianPage();
  try {
    await page.goto(`${app.url}/dashboard`);
    await page.getByText('Synthetic Steady').first().waitFor({ timeout: 20000 });
    await page.waitForTimeout(800);
    assert.equal(await page.getByTestId('care-attention').count(), 0);
    assert.deepEqual(errors, []);
  } finally {
    fake.state.missingTables.clear();
    await ctx.close();
  }
});
