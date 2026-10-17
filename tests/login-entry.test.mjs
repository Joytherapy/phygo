// Entering the app from the landing page, in a real browser (Playwright)
// against the fake Supabase (synthetic accounts only):
//   - every sign-up and log-in link of a landing page carries its language, so
//     the login page opens in the language the visitor was reading, whatever
//     the browser language (an English landing on an Italian browser used to
//     open the sign-up page in Italian);
//   - when the sign-in service cannot be reached, the login pages say so and
//     the button comes back, instead of staying on "Please wait" forever.
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54761);
const APP_PORT = Number(process.env.LOGIN_ENTRY_APP_PORT ?? 3761);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

let fake;
let app;
let browser;
before(async () => {
  if (skip) return;
  fake = await startFakeSupabase({ port: FAKE_PORT, users: {}, tables: { conditions: [], exercises: [], profiles: [] } });
  app = await startApp({ fakeUrl: fake.url, port: APP_PORT });
  browser = await playwright.chromium.launch({ executablePath: CHROMIUM });
});
after(async () => {
  await browser?.close();
  await app?.stop();
  await fake?.close();
});

// A visitor whose browser is in Italian and who never chose a language.
const italianBrowser = () => browser.newContext({ locale: 'it-IT', extraHTTPHeaders: { 'Accept-Language': 'it-IT,it;q=0.9' } });

for (const [path, lang] of [['/', 'en'], ['/it', 'it'], ['/es', 'es'], ['/fr', 'fr']]) {
  test(`landing ${path}: every sign-up and log-in link carries lang=${lang}`, { skip }, async () => {
    const ctx = await italianBrowser();
    try {
      const page = await ctx.newPage();
      await page.goto(`${app.url}${path}`);
      const hrefs = await page.$$eval('a[href*="login"]', (as) => as.map((a) => a.getAttribute('href')));
      assert.ok(hrefs.length >= 3, `the page has its entry links (${hrefs.length})`);
      for (const href of hrefs) assert.match(href, new RegExp(`[?&]lang=${lang}(&|$)`), href);
    } finally {
      await ctx.close();
    }
  });
}

test('the English landing\'s main button opens the sign-up page in English on an Italian browser', { skip }, async () => {
  const ctx = await italianBrowser();
  try {
    const page = await ctx.newPage();
    await page.goto(`${app.url}/`);
    await page.locator('main a[href*="mode=signup"]').first().click();
    await page.waitForURL(/\/login/);
    await page.getByRole('heading', { level: 1 }).waitFor();
    const heading = await page.getByRole('heading', { level: 1 }).innerText();
    const body = await page.locator('body').innerText();
    assert.doesNotMatch(body, /Attendi|Accedi|Registrati|Crea il tuo account/, `not Italian (${heading})`);
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
  } finally {
    await ctx.close();
  }
});

test('login: if the sign-in service cannot be reached, the page says so and the button comes back', { skip }, async () => {
  const ctx = await browser.newContext({ locale: 'en-GB' });
  try {
    const page = await ctx.newPage();
    await page.route('**/auth/v1/**', (route) => route.abort('connectionrefused'));
    await page.goto(`${app.url}/login?lang=en`);
    await page.getByLabel(/email/i).fill('nobody@test.invalid');
    await page.getByLabel(/password/i).fill('synthetic-password');
    await page.locator('form button[type="submit"]').click();
    await page.getByRole('alert').getByText("Sign-in isn't available right now.", { exact: false }).waitFor({ timeout: 15000 });
    assert.doesNotMatch(await page.locator('form button[type="submit"]').innerText(), /wait/i, 'not stuck on "Please wait"');
  } finally {
    await ctx.close();
  }
});

test('My Phygo login: the same when the service cannot be reached', { skip }, async () => {
  const ctx = await browser.newContext({ locale: 'en-GB' });
  try {
    const page = await ctx.newPage();
    await page.route('**/auth/v1/token**', (route) => route.abort('connectionrefused'));
    await page.goto(`${app.url}/my-phygo/login?lang=en`);
    await page.locator('input[type="email"]').fill('nobody@test.invalid');
    await page.locator('input[type="password"]').fill('synthetic-password');
    await page.locator('form button[type="submit"]').click();
    await page.getByText("Sign-in isn't available right now.", { exact: false }).waitFor({ timeout: 15000 });
    assert.equal(await page.locator('form button[type="submit"]').isDisabled(), false, 'the button comes back');
  } finally {
    await ctx.close();
  }
});
