// Dashboard home and Agenda states, in a real browser (Playwright) against the
// fake Supabase (synthetic data only):
//   - no invented statistics: the "active plans" tile (= number of patients)
//     is gone, and "notes this month" comes from a real, own-notes query;
//   - a failed patients query shows an error with Retry, not "no patients yet";
//   - a refused patient insert shows a visible message instead of failing silently;
//   - a failed appointments query shows an error, not an empty calendar.
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54711);
const APP_PORT = Number(process.env.DASHBOARD_STATES_APP_PORT ?? 3712);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const base of [process.cwd() + '/', '/opt/node22/lib/node_modules/']) {
  try {
    playwright = createRequire(base)('playwright');
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const U = {
  id: '81000000-0000-4000-8000-000000000001',
  email: 'clinician@test.invalid',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  role: 'authenticated',
  user_metadata: { display_name: 'Synthetic Clinician' },
};
const now = new Date();
const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 12).toISOString();
const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 15, 12).toISOString();

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
      patients: [
        { id: 'p1', user_id: U.id, patient_user_id: null, name: 'Synthetic Patient One', age: 40, gender: 'female', main_condition: 'synthetic', created_at: thisMonth },
        { id: 'p2', user_id: U.id, patient_user_id: null, name: 'Synthetic Patient Two', age: null, gender: null, main_condition: null, created_at: thisMonth },
      ],
      // Two of the clinician's notes this month, one older (the fake ignores
      // the date filter, so the page's own date check is what keeps it out).
      notes: [
        { id: 'n1', user_id: U.id, patient_id: 'p1', created_at: thisMonth },
        { id: 'n2', user_id: U.id, patient_id: 'p2', created_at: thisMonth },
        { id: 'n3', user_id: U.id, patient_id: 'p1', created_at: lastYear },
      ],
      appointments: [],
      professional_transition_accounts: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url, port: APP_PORT });
  browser = await playwright.chromium.launch({ executablePath: CHROMIUM, args: ['--no-proxy-server'] });
});
after(async () => {
  await browser?.close();
  await app?.stop();
  await fake?.close();
});

async function openPage(path) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const [name, ...value] = sessionCookie('tok-clin', U).split('=');
  await ctx.addCookies([{ name, value: value.join('='), url: app.url }]);
  // Only the app and the fake Supabase on 127.0.0.1 are reachable.
  await ctx.route('**/*', (r) => (new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort()));
  const page = await ctx.newPage();
  await page.goto(app.url + path, { waitUntil: 'domcontentloaded' });
  return { page, close: () => ctx.close() };
}
const control = (q) => fetch(`${fake.url}/__control/fail${q}`);

test('dashboard home: real counts only, no invented "active plans" tile', { skip }, async () => {
  await control('');
  const { page, close } = await openPage('/dashboard');
  try {
    await page.getByText('Synthetic Patient One').waitFor();
    await page.waitForFunction(() => document.querySelector('[data-stat="1"]')?.textContent?.trim() === '2');
    const body = await page.textContent('body');
    assert.doesNotMatch(body, /Piani attivi|Active plans/);
    assert.equal((await page.textContent('[data-stat="0"]')).trim(), '2', 'patients tile = patients loaded');
    // The notes count is read for the signed-in clinician's own notes, from this month on.
    const notesReq = fake.state.requests.find((r) => r.path === '/rest/v1/notes');
    assert.ok(notesReq, 'notes were queried');
    const q = new URLSearchParams(notesReq.search);
    assert.equal(q.get('user_id'), `eq.${U.id}`);
    assert.match(q.get('created_at') ?? '', /^gte\./);
    // No horizontal overflow on a phone.
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  } finally {
    await close();
  }
});

test('dashboard home: a failed patients query shows an error with Retry, not "no patients yet"', { skip }, async () => {
  await control('?table=patients');
  const { page, close } = await openPage('/dashboard');
  try {
    const alert = page.getByRole('alert').filter({ hasText: /\S/ });
    await alert.waitFor();
    assert.match(await alert.textContent(), /Impossibile caricare i pazienti/);
    assert.doesNotMatch(await page.textContent('body'), /Ancora nessun paziente/);
    // Retry recovers once the database answers again.
    await control('');
    await page.getByRole('button', { name: 'Riprova' }).click();
    await page.getByText('Synthetic Patient One').waitFor();
  } finally {
    await control('');
    await close();
  }
});

test('dashboard home: a refused patient insert is reported, the form stays open', { skip }, async () => {
  await control('');
  const { page, close } = await openPage('/dashboard');
  try {
    await page.getByText('Synthetic Patient One').waitFor();
    await control('?table=patients');
    await page.getByRole('button', { name: 'Nuovo paziente' }).last().click();
    await page.locator('#np-first').fill('Synthetic');
    await page.locator('#np-last').fill('Patient Three');
    await page.getByRole('button', { name: 'Salva paziente' }).click();
    const err = page.getByTestId('create-patient-error');
    await err.waitFor();
    assert.match(await err.textContent(), /non è stato salvato/);
    assert.equal(await page.locator('#np-last').inputValue(), 'Patient Three', 'typed data is kept');
  } finally {
    await control('');
    await close();
  }
});

test('agenda: a failed appointments query shows an error, not an empty calendar', { skip }, async () => {
  await control('?table=appointments');
  const { page, close } = await openPage('/dashboard/agenda');
  try {
    const alert = page.getByRole('alert').filter({ hasText: /\S/ });
    await alert.waitFor();
    assert.match(await alert.textContent(), /Impossibile caricare gli appuntamenti/);
    assert.equal(await page.getByTestId('agenda-week-list').count(), 0);
  } finally {
    await control('');
    await close();
  }
});
