// The global "Ask PHYGO" panel opened from a page without a document (the
// dashboard) speaks in general terms, not about "this document", in a real
// browser (Playwright) against the fake Supabase, synthetic data only.
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54795);
const APP_PORT = Number(process.env.ASK_PANEL_APP_PORT ?? 3798);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const U = { id: '8e000000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };

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
      patients: [], notes: [], appointments: [], video_calls: [], professional_transition_accounts: [],
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

test('Ask PHYGO from the dashboard does not talk about "this document"', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  try {
    await page.goto(`${app.url}/dashboard`);
    await page.getByRole('button', { name: 'Chiedi a PHYGO' }).first().click({ timeout: 15000 });
    await page.getByText('Chiedi a PHYGO un dubbio clinico', { exact: false }).waitFor({ timeout: 10000 });
    const input = page.getByPlaceholder('Chiedi qualcosa a PHYGO…');
    await input.waitFor();
    const panelText = await page.locator('body').innerText();
    assert.ok(!panelText.includes('questo documento'), 'no mention of "this document" without a document open');
  } finally {
    await ctx.close();
  }
});
