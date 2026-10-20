// The PHYGO logo and wordmark look the same in the landing header, the
// dashboard and My Phygo: same image size and shape, same text, font, size and
// weight. In a real browser (Playwright) against the fake Supabase (synthetic
// accounts only). Skipped when Playwright/Chromium are not installed.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54751);
const APP_PORT = Number(process.env.BRAND_MARK_APP_PORT ?? 3751);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const CLIN = { id: '84000000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const PAT = { id: '84000000-0000-4000-8000-000000000002', email: 'patient@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };

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
        { id: CLIN.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free' },
        { id: PAT.id, practice_stage: 'patient', plan: 'free' },
      ],
      patients: [{ id: '84100000-0000-4000-8000-000000000001', user_id: CLIN.id, patient_user_id: PAT.id, name: 'Synthetic Patient', age: 40, gender: null, main_condition: null, created_at: '2026-08-01T09:00:00Z' }],
      notes: [], appointments: [], video_calls: [], patient_clinical_references: [], metabolic_profiles: [], professional_transition_accounts: [],
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

// The brand in the page header: the image next to the PHYGO text, measured as rendered.
async function brandOf(path, who, scope = 'header') {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  try {
    if (who) {
      const [name, value] = sessionCookie(`tok-${who}`, who === 'clin' ? CLIN : PAT).split(/=(.*)/s);
      await ctx.addCookies([{ name, value, url: app.url }]);
    }
    const page = await ctx.newPage();
    await page.goto(`${app.url}${path}`);
    const img = page.locator(`${scope} img[src="/logo-mark.png"]`).first();
    await img.waitFor();
    return await img.evaluate((el) => {
      const text = el.nextElementSibling ?? el.parentElement;
      const t = getComputedStyle(text);
      const r = el.getBoundingClientRect();
      return {
        width: Math.round(r.width),
        height: Math.round(r.height),
        radius: getComputedStyle(el).borderRadius,
        word: (text.textContent ?? '').trim().split(/\s+/).pop(),
        fontSize: t.fontSize,
        fontWeight: t.fontWeight,
        fontFamily: t.fontFamily,
      };
    });
  } finally {
    await ctx.close();
  }
}

test('dashboard and My Phygo headers show the logo and wordmark exactly as the landing page', { skip }, async () => {
  const landing = await brandOf('/');
  assert.equal(landing.word, 'PHYGO');
  const dashboard = await brandOf('/dashboard', 'clin');
  const portal = await brandOf('/my-phygo/home', 'pat');
  for (const [where, b] of [['dashboard', dashboard], ['My Phygo', portal]]) {
    assert.deepEqual(b, landing, `${where} brand = landing brand`);
  }
});

// On the sign-in card the heading already names PHYGO ("Log in to your PHYGO
// account"), so the card shows the mark alone, larger, instead of "P" + "PHYGO".
test('the login card shows the mark alone, labelled PHYGO for screen readers', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  try {
    const page = await ctx.newPage();
    await page.goto(`${app.url}/login?lang=en`);
    const img = page.locator('main img[src="/logo-mark.png"]').first();
    await img.waitFor();
    const info = await img.evaluate((el) => ({
      alt: el.getAttribute('alt'),
      width: Math.round(el.getBoundingClientRect().width),
      siblingText: (el.parentElement?.textContent ?? '').trim(),
    }));
    assert.equal(info.alt, 'PHYGO');
    assert.ok(info.width >= 44, `mark is larger than the 28px header mark (got ${info.width}px)`);
    assert.equal(info.siblingText, '', 'no wordmark next to the mark');
    assert.match(await page.locator('main').innerText(), /PHYGO/, 'the card copy still names PHYGO');
  } finally {
    await ctx.close();
  }
});
