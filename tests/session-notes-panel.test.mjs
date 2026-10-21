// The session notes panel (LiveStructuring) speaks the app language and still
// writes the reviewed note to the patient's record, in a real browser
// (Playwright) against the fake Supabase, synthetic data only. The AI routes
// (/api/generate-note and the lookups that follow it) are answered by the
// test itself, so no model or external service is called.
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54792);
const APP_PORT = Number(process.env.SESSION_NOTES_APP_PORT ?? 3792);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const U = { id: '8b000000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const P = '8b100000-0000-4000-8000-000000000001';

const NOTE = {
  subjective: 'Dolore lombare ridotto rispetto alla scorsa settimana.',
  objective: 'Flessione del tronco migliorata.',
  assessment: 'Lombalgia meccanica in miglioramento.',
  plan: 'Proseguire gli esercizi di stabilità.',
  summaryForPatient: 'Continua gli esercizi ogni giorno.',
  language: 'it',
};

let fake;
let app;
let browser;
before(async () => {
  if (skip) return;
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: { 'tok-clin': U },
    tables: {
      profiles: [{ id: U.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free', preferred_language: 'it' }],
      patients: [{ id: P, user_id: U.id, patient_user_id: null, name: 'Paziente Sintetico', age: 40, gender: null, main_condition: null, created_at: '2026-09-01T09:00:00Z' }],
      notes: [], appointments: [], video_calls: [], patient_clinical_references: [], metabolic_profiles: [], patient_details: [], professional_transition_accounts: [], patient_invites: [],
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

test('the notes panel is in Italian and saves the reviewed note to the patient', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const json = (body) => (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/generate-note', json({ note: NOTE }));
  await page.route('**/api/science/relevant', json({ papers: [] }));
  await page.route('**/api/knowledge-lookup', json({ match: null, phases: [] }));
  try {
    await page.goto(`${app.url}/dashboard/patients/${P}/session`);
    await page.getByRole('heading', { level: 1, name: 'Paziente Sintetico' }).waitFor({ timeout: 15000 });
    await page.getByText('Nota di sessione').first().waitFor();

    // Italian labels, no leftover English from the old panel.
    for (const label of ['Pronto', 'Rilievi', 'Valutazione', 'Piano', 'Follow-up']) {
      await page.getByText(label, { exact: true }).first().waitFor({ timeout: 10000 });
    }
    const body = await page.locator('main').innerText();
    for (const english of ['Speak naturally', 'Findings', 'Write instead', 'Upload scan', 'Save to Patient', 'Ready']) {
      assert.ok(!body.includes(english), `"${english}" should not appear in the Italian panel`);
    }
    // The marketing demo examples are not offered on the clinical page.
    assert.ok(!body.includes('Lower back pain'));

    await page.getByRole('button', { name: 'Scrivi', exact: true }).click();
    await page.getByRole('textbox', { name: 'Scrivi qui le tue osservazioni sulla seduta…' }).fill('Il paziente riferisce meno dolore lombare.');
    await page.getByRole('button', { name: 'Genera nota' }).click();

    await page.getByText('Nota pronta').waitFor({ timeout: 15000 });
    await page.getByTestId('note-assessment').getByText(NOTE.assessment).waitFor();

    assert.equal(fake.state.tables.notes.length, 0, 'nothing is saved before the clinician confirms');
    await page.getByRole('button', { name: 'Salva nella scheda' }).click();
    await page.getByRole('button', { name: 'Salvata nella scheda' }).waitFor({ timeout: 10000 });

    const saved = fake.state.tables.notes;
    assert.equal(saved.length, 1);
    assert.equal(saved[0].patient_id, P);
    assert.equal(saved[0].user_id, U.id);
    assert.equal(saved[0].assessment, NOTE.assessment);
    assert.equal(saved[0].summary_for_patient, NOTE.summaryForPatient);
  } finally {
    await ctx.close();
  }
});

test('the navbar "x" clears the current patient on the session page, and it stays cleared', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  await ctx.addInitScript(() => window.localStorage.setItem('phygo-lang', 'it'));
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(`${app.url}/dashboard/patients/${P}/session`);
    await page.getByRole('heading', { level: 1, name: 'Paziente Sintetico' }).waitFor({ timeout: 15000 });
    const clear = page.getByRole('button', { name: 'Deseleziona paziente attuale' }).first();
    await clear.waitFor({ timeout: 10000 });
    await clear.click();
    await page.waitForTimeout(1500);
    assert.equal(await page.getByRole('button', { name: 'Deseleziona paziente attuale' }).count(), 0, 'the patient is not set again by the page');
    assert.equal(await page.evaluate(() => window.sessionStorage.getItem('phygo_current_patient')), null);
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('the PHYGO World menu keeps its descriptions inside the panel', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  await ctx.addInitScript(() => window.localStorage.setItem('phygo-lang', 'it'));
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  try {
    await page.goto(`${app.url}/dashboard/patients/${P}/session`);
    await page.getByRole('heading', { level: 1, name: 'Paziente Sintetico' }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'PHYGO World' }).first().click();
    const link = page.getByRole('link', { name: /Eventi/ }).first();
    await link.waitFor({ timeout: 5000 });
    const boxes = await link.evaluate((a) => {
      const panel = a.parentElement.getBoundingClientRect();
      return [...a.querySelectorAll('p')].map((p) => ({ right: p.getBoundingClientRect().right, panel: panel.right }));
    });
    for (const b of boxes) assert.ok(b.right <= b.panel + 0.5, `text ends at ${b.right}, panel at ${b.panel}`);
  } finally {
    await ctx.close();
  }
});
