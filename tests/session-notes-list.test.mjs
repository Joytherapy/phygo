// The dashboard's "Notes this month" figure opens the session notes page,
// in a real browser (Playwright) against the fake Supabase, synthetic data
// only: the clinician's own notes newest first (never another clinician's),
// filtered by period and by patient, each opening the patient's record.
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54798);
const APP_PORT = Number(process.env.NOTES_LIST_APP_PORT ?? 3802);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const U = { id: '91000000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const OTHER = '91000000-0000-4000-8000-000000000002';
const A = '91100000-0000-4000-8000-00000000000a';
const B = '91100000-0000-4000-8000-00000000000b';
const C = '91100000-0000-4000-8000-00000000000c';
const now = new Date();
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 30).toISOString();
const ago = (days) => new Date(now.getTime() - days * 86400000).toISOString();
const recent = new Date(now.getTime() - 60000).toISOString();

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
      patients: [
        { id: A, user_id: U.id, patient_user_id: null, name: 'Anna Rossi', age: 40, created_at: ago(300) },
        { id: B, user_id: U.id, patient_user_id: 'synthetic-user', name: 'Bruno Bianchi', age: 50, created_at: ago(300) },
        { id: C, user_id: OTHER, patient_user_id: null, name: 'Carla Altrui', age: 60, created_at: ago(300) },
      ],
      notes: [
        { id: 'n1', user_id: U.id, patient_id: A, created_at: recent, assessment: 'Lombalgia in miglioramento.', plan: null, summary_for_patient: null },
        { id: 'n2', user_id: U.id, patient_id: B, created_at: monthStart, assessment: null, plan: 'Rinforzo quadricipite.', summary_for_patient: null },
        { id: 'n3', user_id: U.id, patient_id: A, created_at: ago(50), assessment: 'Valutazione di controllo.', plan: null, summary_for_patient: null },
        { id: 'n4', user_id: U.id, patient_id: B, created_at: ago(200), assessment: 'Prima valutazione.', plan: null, summary_for_patient: null },
        { id: 'n5', user_id: OTHER, patient_id: C, created_at: recent, assessment: 'Nota di un altro fisioterapista.', plan: null, summary_for_patient: null },
      ],
      appointments: [], video_calls: [], professional_transition_accounts: [], patient_clinical_references: [], metabolic_profiles: [], patient_details: [], patient_invites: [],
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

test('"Notes this month" opens the session notes, filtered by period and patient', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const rows = () => page.getByTestId('notes-list').locator('li');
  const countIs = async (n) => {
    for (let i = 0; i < 50; i++) {
      if ((await rows().count()) === n) return;
      await page.waitForTimeout(100);
    }
    assert.equal(await rows().count(), n);
  };
  try {
    await page.goto(`${app.url}/dashboard`);
    await page.getByRole('link', { name: /Note questo mese/ }).click({ timeout: 20000 });
    await page.waitForURL(/\/dashboard\/notes$/);
    await page.getByRole('heading', { level: 1, name: 'Note di seduta' }).waitFor();

    // This month: the two notes of this month, newest first; never another clinician's.
    await page.getByTestId('notes-list').waitFor({ timeout: 15000 });
    await countIs(2);
    const text = await page.getByTestId('notes-list').innerText();
    assert.ok(text.indexOf('Anna Rossi') < text.indexOf('Bruno Bianchi'), 'newest first');
    assert.match(text, /Lombalgia in miglioramento\./);
    assert.match(text, /Rinforzo quadricipite\./, 'falls back to the plan when there is no assessment');
    assert.ok(!(await page.locator('main').innerText()).includes('Carla Altrui'), "another clinician's note is not shown");

    await page.getByRole('tab', { name: 'Ultimi 3 mesi' }).click();
    await page.getByText('Valutazione di controllo.').waitFor();
    await countIs(3);
    await page.getByRole('tab', { name: 'Tutte' }).click();
    await page.getByText('Prima valutazione.').waitFor();
    await countIs(4);

    await page.getByRole('searchbox').fill('bianchi');
    await countIs(2);
    await page.getByRole('searchbox').fill('nessuno');
    await page.getByText('Nessuna nota per questo paziente nel periodo scelto.').waitFor();
    await page.getByRole('searchbox').fill('');

    // A note opens the patient's record.
    await rows().first().getByRole('link').click();
    await page.waitForURL(new RegExp(`/dashboard/patients/${A}$`));
  } finally {
    await ctx.close();
  }
});

test('the patients figure jumps to the patient list', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  try {
    await page.goto(`${app.url}/dashboard`);
    await page.getByRole('link', { name: /^Pazienti\s*\d/ }).first().click({ timeout: 20000 });
    await page.waitForURL(/\/dashboard#patients$/);
    // Scrolled to the list: it is at the top, or the page cannot scroll any further.
    await page.waitForTimeout(300);
    const pos = await page.locator('#patients').evaluate((el) => ({
      top: el.getBoundingClientRect().top,
      scrolled: window.scrollY,
      atBottom: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2,
    }));
    assert.ok(pos.scrolled > 0 && (pos.top < 160 || pos.atBottom), `scrolled to the patient list (${JSON.stringify(pos)})`);
  } finally {
    await ctx.close();
  }
});
