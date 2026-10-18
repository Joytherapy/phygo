// Language on the way in and inside the app, in a real browser (Playwright)
// against the fake Supabase (synthetic accounts only), on an Italian browser:
//   - a professional who signs in from the English site lands on an English
//     dashboard: the language chosen on the site or on the login page is saved
//     to the account (profiles.preferred_language, which defaults to 'it');
//   - signing in without choosing a language leaves the account's as it is;
//   - the login page, the invitation page and the My Phygo portal each have a
//     language menu; inside the portal the choice is saved to the patient's
//     profile.
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54771);
const APP_PORT = Number(process.env.LANGUAGE_SWITCHER_APP_PORT ?? 3771);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const CLIN = { id: '87000000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const PAT = { id: '87000000-0000-4000-8000-000000000002', email: 'patient@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };

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
        { id: PAT.id, practice_stage: 'patient', plan: 'free', preferred_language: 'it' },
      ],
      patients: [{ id: '87100000-0000-4000-8000-000000000001', user_id: CLIN.id, patient_user_id: PAT.id, name: 'Synthetic Patient', age: 40, gender: null, main_condition: null, created_at: '2026-08-01T09:00:00Z' }],
      notes: [], appointments: [], video_calls: [], patient_clinical_references: [], metabolic_profiles: [], professional_transition_accounts: [], conditions: [], exercises: [],
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

const italianBrowser = () => browser.newContext({ locale: 'it-IT', extraHTTPHeaders: { 'Accept-Language': 'it-IT,it;q=0.9' } });
const profileOf = (id) => fake.state.tables.profiles.find((r) => r.id === id);
const setProfileLang = (id, lang) => { profileOf(id).preferred_language = lang; };

// The fake has no password sign-in: answer it with a session for the synthetic clinician.
async function fakePasswordSignIn(page, token, user) {
  await page.route('**/auth/v1/token**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ access_token: token, refresh_token: `refresh-${token}`, token_type: 'bearer', expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, user }),
  }));
}

async function signIn(page, path) {
  await fakePasswordSignIn(page, 'tok-clin', CLIN);
  await page.goto(`${app.url}${path}`);
  await page.locator('input[type="email"]').fill(CLIN.email);
  await page.locator('input[type="password"]').fill('synthetic-password');
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
}

test('professional login from the English site: the dashboard opens in English and the account keeps it', { skip }, async () => {
  setProfileLang(CLIN.id, 'it');
  const ctx = await italianBrowser();
  try {
    const page = await ctx.newPage();
    await signIn(page, '/login?lang=en');
    assert.equal(profileOf(CLIN.id).preferred_language, 'en');
    await page.locator('nav').getByText('Patients', { exact: true }).first().waitFor({ timeout: 15000 });
    await page.reload();
    await page.locator('nav').getByText('Patients', { exact: true }).first().waitFor({ timeout: 15000 });
    assert.equal(await page.locator('nav').getByText('Pazienti', { exact: true }).count(), 0, 'not Italian after a reload');
  } finally {
    await ctx.close();
  }
});

test('professional login without a chosen language leaves the account language as it is', { skip }, async () => {
  setProfileLang(CLIN.id, 'fr');
  const ctx = await italianBrowser();
  try {
    const page = await ctx.newPage();
    await signIn(page, '/login');
    assert.equal(profileOf(CLIN.id).preferred_language, 'fr');
  } finally {
    await ctx.close();
  }
});

test('login page: the language menu switches the page and is saved on sign-in', { skip }, async () => {
  setProfileLang(CLIN.id, 'it');
  const ctx = await italianBrowser();
  try {
    const page = await ctx.newPage();
    await page.goto(`${app.url}/login`);
    await page.getByRole('heading', { level: 1, name: 'Bentornato' }).waitFor();
    await page.getByTestId('language-menu').selectOption('es');
    await page.waitForURL(/[?&]lang=es/);
    await page.getByRole('heading', { level: 1, name: 'Te damos la bienvenida de nuevo' }).waitFor();
    await signIn(page, '/login?lang=es');
    assert.equal(profileOf(CLIN.id).preferred_language, 'es');
  } finally {
    await ctx.close();
  }
});

test('invitation page: opens in the browser language and has a language menu', { skip }, async () => {
  const ctx = await italianBrowser();
  try {
    const page = await ctx.newPage();
    await page.goto(`${app.url}/my-phygo/join/SYNTH-CODE`);
    await page.getByRole('heading', { level: 1, name: 'Benvenuto in My Phygo' }).waitFor();
    await page.getByTestId('language-menu').selectOption('en');
    await page.waitForURL(/\/my-phygo\/join\/SYNTH-CODE\?lang=en/);
    await page.getByRole('heading', { level: 1, name: 'Welcome to My Phygo' }).waitFor();
  } finally {
    await ctx.close();
  }
});

test('My Phygo portal: the language menu changes the portal and saves the patient\'s choice', { skip }, async () => {
  setProfileLang(PAT.id, 'it');
  const ctx = await italianBrowser();
  try {
    const [name, value] = sessionCookie('tok-pat', PAT).split(/=(.*)/s);
    await ctx.addCookies([{ name, value, url: app.url }]);
    const page = await ctx.newPage();
    await page.goto(`${app.url}/my-phygo/home`);
    await page.getByText('Bentornato/a').first().waitFor({ timeout: 15000 });
    await page.getByTestId('language-menu').selectOption('fr');
    await page.getByText('Bon retour').first().waitFor();
    for (let i = 0; i < 50 && profileOf(PAT.id).preferred_language !== 'fr'; i++) await new Promise((r) => setTimeout(r, 100));
    assert.equal(profileOf(PAT.id).preferred_language, 'fr');
    await page.reload();
    await page.getByText('Bon retour').first().waitFor({ timeout: 15000 });
  } finally {
    await ctx.close();
  }
});
