// Workspace: the "…" menu of a folder card and its colour picker are fully
// visible and clickable, in a real browser (Playwright) against the fake
// Supabase, synthetic data only. The card used to clip them (overflow-hidden),
// so "Aggiungi ai preferiti" and "Sposta nel cestino" were cut off.
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54794);
const APP_PORT = Number(process.env.WORKSPACE_MENU_APP_PORT ?? 3794);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const U = { id: '8d000000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const folder = (n) => ({
  id: `8d100000-0000-4000-8000-00000000000${n}`, owner_id: U.id, parent_id: null, name: `Cartella ${n}`, color: null, starred: false,
  sort_order: n, created_at: '2026-09-01T09:00:00Z', updated_at: '2026-09-01T09:00:00Z', deleted_at: null,
});

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
      workspace_folders: [folder(1), folder(2), folder(3)],
      workspace_documents: [],
      workspace_notebooks: [],
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

// The element really on top at the centre of `locator` is `locator` itself
// (or inside it): not clipped away and not covered by a neighbouring card.
async function reachable(page, locator) {
  const box = await locator.boundingBox();
  assert.ok(box && box.width > 0 && box.height > 0, 'has a box');
  return locator.evaluate((el, [x, y]) => {
    const top = document.elementFromPoint(x, y);
    return !!top && (top === el || el.contains(top));
  }, [box.x + box.width / 2, box.y + box.height / 2]);
}

test('the folder menu and colour picker are not clipped by the card', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  try {
    await page.goto(`${app.url}/dashboard/workspace`);
    const card = page.getByText('Cartella 1', { exact: true });
    await card.waitFor({ timeout: 15000 });
    await card.hover();
    await page.getByRole('button', { name: 'Altre azioni' }).first().click();

    const heights = [];
    for (const label of ['Rinomina', 'Colore', 'Aggiungi ai preferiti', 'Sposta nel cestino']) {
      const item = page.getByRole('menuitem', { name: label });
      await item.waitFor();
      assert.ok(await reachable(page, item), `"${label}" is visible and clickable`);
      heights.push((await item.boundingBox()).height);
    }
    // Every entry on one line: the long labels are as tall as "Rinomina".
    assert.ok(Math.max(...heights) - Math.min(...heights) < 2, `menu rows have the same height (${heights.join(', ')})`);

    await page.getByRole('menuitem', { name: 'Colore' }).click();
    const swatch = page.getByRole('button', { name: '#A78BFA' });
    await swatch.waitFor();
    assert.ok(await reachable(page, swatch), 'colour swatches are visible and clickable');
  } finally {
    await ctx.close();
  }
});

test('in the light theme the Workspace text is dark on the light background', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'it-IT', colorScheme: 'light', reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { window.localStorage.setItem('phygo-theme', 'light'); } catch {} });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  try {
    await page.goto(`${app.url}/dashboard/workspace`);
    const heading = page.getByRole('heading', { level: 1 }).first();
    await page.getByText('Cartella 1', { exact: true }).waitFor({ timeout: 15000 });
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), false, 'the page is in the light theme');
    // Relative luminance of the heading colour: dark text, not the white of the dark theme.
    const lum = await heading.evaluate((el) => {
      const [r, g, b] = getComputedStyle(el).color.match(/[\d.]+/g).slice(0, 3).map(Number).map((c) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    });
    assert.ok(lum < 0.2, `heading is dark in the light theme (luminance ${lum.toFixed(2)})`);
  } finally {
    await ctx.close();
  }
});
