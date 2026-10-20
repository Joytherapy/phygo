// The app's top bar never overlaps itself: at every width between phone and
// desktop, with a current patient selected, the logo, the links and the
// right-hand controls sit side by side and no link wraps onto two lines.
// Real browser (Playwright) against the fake Supabase, synthetic data only.
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54797);
const APP_PORT = Number(process.env.NAVBAR_APP_PORT ?? 3800);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const U = { id: '90000000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const P = { id: '90100000-0000-4000-8000-000000000001', name: 'Paziente Sintetico Lungo' };

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
      patients: [{ id: P.id, user_id: U.id, patient_user_id: null, name: P.name, age: 40, created_at: '2026-09-01T09:00:00Z' }],
      notes: [], appointments: [], video_calls: [], professional_transition_accounts: [],
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

for (const width of [780, 820, 860, 900, 960, 1024, 1130, 1280, 1440]) {
  test(`top bar does not overlap at ${width}px with a current patient`, { skip }, async () => {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, locale: 'it-IT', reducedMotion: 'reduce' });
    await ctx.addInitScript((p) => { try { sessionStorage.setItem('phygo_current_patient', JSON.stringify(p)); } catch {} }, P);
    const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
    await ctx.addCookies([{ name, value, url: app.url }]);
    const page = await ctx.newPage();
    try {
      await page.goto(`${app.url}/dashboard`);
      await page.locator('header nav').first().waitFor({ timeout: 15000 });
      await page.waitForTimeout(800);
      const layout = await page.evaluate(() => {
        const nav = document.querySelector('header nav');
        const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
        const parts = [...nav.children].filter(visible).map((el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right }; });
        const links = [...nav.querySelectorAll('a, button')].filter(visible).map((el) => ({ text: el.textContent.trim(), height: el.getBoundingClientRect().height, lines: Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight || '20')) }));
        return { parts, links, overflow: nav.scrollWidth > nav.clientWidth + 1 };
      });
      for (let i = 1; i < layout.parts.length; i++) {
        assert.ok(layout.parts[i - 1].right <= layout.parts[i].left + 1, `parts ${i - 1} and ${i} overlap at ${width}px: ${JSON.stringify(layout.parts)}`);
      }
      assert.equal(layout.overflow, false, `the bar overflows at ${width}px`);
      for (const l of layout.links.filter((l) => l.text)) {
        assert.ok(l.height <= 44, `"${l.text}" wraps at ${width}px (height ${l.height})`);
      }
    } finally {
      await ctx.close();
    }
  });
}
