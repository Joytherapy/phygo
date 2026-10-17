// Patient page note history, in a real browser (Playwright) against the fake
// Supabase (synthetic people and notes only):
//   - every note of the patient is listed, however old, newest first;
//   - the history is read in pages, so a long history is complete;
//   - no notes: the empty message; a failed load: an error with Retry, never
//     the empty message; Retry loads the history.
// Which notes a clinician may read is decided by row-level security, which the
// fake does not apply: tests/sql/note_history.sh checks it on PostgreSQL with
// the live policies.
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54721);
const APP_PORT = Number(process.env.NOTE_HISTORY_APP_PORT ?? 3721);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const U = { id: '82000000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const FULL = '82100000-0000-4000-8000-000000000001'; // notes over several years
const EMPTY = '82100000-0000-4000-8000-000000000002'; // no notes
const LONG = '82100000-0000-4000-8000-000000000003'; // a long history
const patient = (id, name) => ({ id, user_id: U.id, patient_user_id: null, name, age: 50, gender: null, main_condition: null, created_at: '2024-01-01T09:00:00Z' });
const note = (id, patientId, created_at, assessment) => ({ id, patient_id: patientId, user_id: U.id, created_at, assessment, plan: null });

let fake;
let app;
let browser;
before(async () => {
  if (skip) return;
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: { 'tok-clin': U },
    tables: {
      profiles: [{ id: U.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free' }],
      patients: [patient(FULL, 'Synthetic Full History'), patient(EMPTY, 'Synthetic No Notes'), patient(LONG, 'Synthetic Long History')],
      // Stored out of order on purpose: the page must not depend on it.
      notes: [
        note('n-aug11', FULL, '2026-08-11T09:30:00Z', 'Synthetic note of 11 August 2026'),
        note('n-2024', FULL, '2024-03-02T08:00:00Z', 'Synthetic note of March 2024'),
        note('n-aug14', FULL, '2026-08-14T16:45:00Z', 'Synthetic note of 14 August 2026'),
        note('n-2025', FULL, '2025-12-31T23:00:00Z', 'Synthetic note of December 2025'),
        ...Array.from({ length: 620 }, (_, i) => note(`long-${i}`, LONG, new Date(Date.UTC(2023, 0, 1) + i * 86400000).toISOString(), `Long ${i}`)),
      ],
      patient_clinical_references: [],
      metabolic_profiles: [],
      professional_transition_accounts: [],
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

async function openPatient(id) {
  const ctx = await browser.newContext({ locale: 'it-IT' }); // the app's default language
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  await page.goto(`${app.url}/dashboard/patients/${id}`);
  return { ctx, page };
}

test('every note of the patient is listed, however old, newest first', { skip }, async () => {
  const { ctx, page } = await openPatient(FULL);
  try {
    await page.getByText('Synthetic note of March 2024').waitFor();
    const body = await page.locator('body').innerText();
    const order = ['14 August 2026', '11 August 2026', 'December 2025', 'March 2024'].map((t) => body.indexOf(`Synthetic note of ${t}`));
    assert.ok(order.every((i) => i >= 0), 'all four notes are shown');
    assert.deepEqual([...order].sort((a, b) => a - b), order, 'newest first');
    assert.equal(await page.getByTestId('notes-error').count(), 0);
    const reads = fake.state.requests.filter((r) => r.method === 'GET' && r.path === '/rest/v1/notes');
    for (const r of reads) {
      const q = new URLSearchParams(r.search);
      assert.equal(q.get('patient_id'), `eq.${FULL}`, 'only this patient\'s notes are asked for');
      assert.ok(!q.has('created_at'), 'no date filter');
    }
  } finally {
    await ctx.close();
  }
});

test('a long history is read in pages and shown complete', { skip }, async () => {
  const before = fake.state.requests.length;
  const { ctx, page } = await openPatient(LONG);
  try {
    await page.getByText('Long 0', { exact: true }).waitFor();
    assert.equal(await page.getByText(/^Long \d+$/).count(), 620, 'all 620 notes');
    const pages = fake.state.requests.slice(before).filter((r) => r.method === 'GET' && r.path === '/rest/v1/notes');
    assert.ok(pages.length >= 2, `read in pages (${pages.length} requests)`);
  } finally {
    await ctx.close();
  }
});

test('no notes: the empty history message, not an error', { skip }, async () => {
  const { ctx, page } = await openPatient(EMPTY);
  try {
    await page.getByText('Ancora nessuna nota per questo paziente.').waitFor();
    assert.equal(await page.getByTestId('notes-error').count(), 0);
  } finally {
    await ctx.close();
  }
});

test('a failed load shows an error with Retry, never the empty message; Retry loads the history', { skip }, async () => {
  fake.state.failTables.add('notes');
  const { ctx, page } = await openPatient(FULL);
  try {
    const error = page.getByTestId('notes-error');
    await error.waitFor();
    assert.match(await error.innerText(), /Non è stato possibile caricare lo storico delle note/);
    assert.equal(await page.getByText('Ancora nessuna nota per questo paziente.').count(), 0, 'not shown as an empty history');
    assert.equal(await page.getByText('Synthetic note of 14 August 2026').count(), 0);
    fake.state.failTables.delete('notes');
    await error.getByRole('button', { name: 'Riprova' }).click();
    await page.getByText('Synthetic note of March 2024').waitFor();
    assert.equal(await error.count(), 0, 'the error is gone');
    assert.equal(fake.state.tables.notes.filter((n) => n.patient_id === FULL).length, 4, 'nothing was changed or removed');
  } finally {
    fake.state.failTables.delete('notes');
    await ctx.close();
  }
});
