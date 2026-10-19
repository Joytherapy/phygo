// The video call has its own page (/dashboard/patients/[id]/call), separate
// from the session note, in a real browser (Playwright) against the fake
// Supabase, synthetic data only:
//   - a patient on My Phygo: the patient page and the note page offer the
//     video call; the call page shows the call and the session notes beside it;
//   - a patient not on My Phygo: no video call button, and the call page
//     explains that the patient must join My Phygo first;
//   - the note page no longer has a video call tab.
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54791);
const APP_PORT = Number(process.env.VIDEO_CALL_PAGE_APP_PORT ?? 3791);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const U = { id: '8a000000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const LINKED = '8a100000-0000-4000-8000-000000000001';
const UNLINKED = '8a100000-0000-4000-8000-000000000002';

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
        { id: LINKED, user_id: U.id, patient_user_id: 'synthetic-patient-user', name: 'Paziente Collegato', age: 40, gender: null, main_condition: null, created_at: '2026-09-01T09:00:00Z' },
        { id: UNLINKED, user_id: U.id, patient_user_id: null, name: 'Paziente Senza Portale', age: 50, gender: null, main_condition: null, created_at: '2026-09-01T09:00:00Z' },
      ],
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

async function open(path) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  await page.goto(`${app.url}${path}`);
  return { page, close: () => ctx.close() };
}

test('patient on My Phygo: the patient page offers the video call, which opens its own page with notes beside it', { skip }, async () => {
  const { page, close } = await open(`/dashboard/patients/${LINKED}`);
  try {
    await page.getByRole('heading', { level: 1, name: 'Paziente Collegato' }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Videochiamata' }).click();
    await page.waitForURL(new RegExp(`/dashboard/patients/${LINKED}/call$`));
    await page.getByTestId('call-stage').getByRole('button', { name: 'Avvia videochiamata' }).waitFor({ timeout: 15000 });
    await page.getByTestId('call-notes').getByText('Appunti della seduta').waitFor();
    assert.equal(await page.getByTestId('call-needs-portal').count(), 0);
    // The notes can be hidden to give the call the whole width.
    await page.getByRole('button', { name: 'Nascondi appunti' }).click();
    assert.equal(await page.getByTestId('call-notes').count(), 0);
  } finally {
    await close();
  }
});

test('patient not on My Phygo: no video call button; the call page explains why', { skip }, async () => {
  const { page, close } = await open(`/dashboard/patients/${UNLINKED}`);
  try {
    await page.getByRole('heading', { level: 1, name: 'Paziente Senza Portale' }).waitFor({ timeout: 15000 });
    assert.equal(await page.getByRole('button', { name: 'Videochiamata' }).count(), 0);
    await page.goto(`${app.url}/dashboard/patients/${UNLINKED}/call`);
    await page.getByTestId('call-needs-portal').waitFor({ timeout: 15000 });
    assert.match(await page.getByTestId('call-needs-portal').innerText(), /My Phygo/);
    assert.equal(await page.getByRole('button', { name: 'Avvia videochiamata' }).count(), 0);
  } finally {
    await close();
  }
});

test('the note page has no video call tab; it links to the call page instead', { skip }, async () => {
  const { page, close } = await open(`/dashboard/patients/${LINKED}/session`);
  try {
    await page.getByRole('heading', { level: 1, name: 'Paziente Collegato' }).waitFor({ timeout: 15000 });
    assert.equal(await page.locator('button[aria-pressed]', { hasText: 'Videochiamata' }).count(), 0, 'no tab');
    await page.getByRole('button', { name: 'Avvia videochiamata' }).click();
    await page.waitForURL(new RegExp(`/dashboard/patients/${LINKED}/call$`));
  } finally {
    await close();
  }
});

test('on a phone the call stage and its button fit the screen', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'it-IT', reducedMotion: 'reduce' });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  try {
    await page.goto(`${app.url}/dashboard/patients/${LINKED}/call`);
    const button = page.getByTestId('call-stage').getByRole('button', { name: 'Avvia videochiamata' });
    await button.waitFor({ timeout: 15000 });
    const stage = await page.getByTestId('call-stage').boundingBox();
    const box = await button.boundingBox();
    assert.ok(stage.x >= 0 && stage.x + stage.width <= 390, `stage inside the screen (${stage.x}, ${stage.width})`);
    assert.ok(box.x >= stage.x && box.x + box.width <= stage.x + stage.width, `button inside the stage (${box.x}, ${box.width})`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'no horizontal scroll');
  } finally {
    await ctx.close();
  }
});
