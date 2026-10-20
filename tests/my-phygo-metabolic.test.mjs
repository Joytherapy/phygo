// My Phygo "Metabolic profile" page opens for a logged-in patient, in a real
// browser (Playwright) against the fake Supabase, synthetic data only. The page
// used to crash right after the session check (React error #310: hooks called
// after an early return).
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54793);
const APP_PORT = Number(process.env.MY_PHYGO_METABOLIC_APP_PORT ?? 3793);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const PU = { id: '8c000000-0000-4000-8000-000000000001', email: 'patient@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const PID = '8c100000-0000-4000-8000-000000000001';

let fake;
let app;
let browser;
before(async () => {
  if (skip) return;
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: { 'tok-patient': PU },
    tables: {
      profiles: [],
      patients: [{ id: PID, user_id: '8c000000-0000-4000-8000-000000000002', patient_user_id: PU.id, name: 'Paziente Sintetico', age: 41, created_at: '2026-08-01T09:00:00Z' }],
      metabolic_profiles: [],
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

test('the metabolic profile page opens for a patient without a profile yet', { skip }, async () => {
  const ctx = await browser.newContext({ locale: 'it-IT' });
  await ctx.addInitScript(() => window.localStorage.setItem('phygo-lang', 'it'));
  const [name, value] = sessionCookie('tok-patient', PU).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(`${app.url}/my-phygo/life/metabolic`);
    await page.getByText('Profilo Metabolico', { exact: true }).first().waitFor({ timeout: 20000 });
    await page.getByText('Non hai ancora calcolato il tuo profilo metabolico.').waitFor({ timeout: 10000 });
    assert.ok(!(await page.locator('body').innerText()).includes('Application error'));
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});
