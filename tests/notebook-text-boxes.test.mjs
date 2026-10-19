// Notebook text boxes, in a real browser (Playwright) against the fake
// Supabase, synthetic data only:
//   - a selected note takes the size chosen in the toolbar (Word-style menu
//     and A+), and the toolbar shows the selected note's own size;
//   - the box can be resized by dragging its corner, and the new width and
//     height are saved on the annotation.
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54796);
const APP_PORT = Number(process.env.NOTEBOOK_TEXT_APP_PORT ?? 3799);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const U = { id: '8f000000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const NB = '8f100000-0000-4000-8000-000000000001';
const PAGE = '8f200000-0000-4000-8000-000000000001';
const NOTE = '8f300000-0000-4000-8000-000000000001';
const T = '2026-09-01T09:00:00Z';

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
      workspace_notebooks: [{ id: NB, owner_id: U.id, folder_id: null, name: 'Quaderno sintetico', starred: false, last_opened_at: T, last_page_id: PAGE, created_at: T, updated_at: T, deleted_at: null }],
      workspace_notebook_pages: [{ id: PAGE, notebook_id: NB, position: 0, template: 'blank', content: {}, created_at: T, updated_at: T }],
      workspace_annotations: [{
        id: NOTE, owner_id: U.id, target_type: 'notebook_page', target_id: PAGE, page_number: null, type: 'text', created_at: T, updated_at: T, deleted_at: null,
        data: { x: 0.1, y: 0.1, body: 'Nota sintetica', color: '#0F172A', fontSize: 14, width: 0.26 },
      }],
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

const saved = () => fake.state.tables.workspace_annotations.find((a) => a.id === NOTE).data;
async function until(check, label) {
  for (let i = 0; i < 50; i++) {
    if (check()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.fail(`timed out waiting for ${label}`);
}

test('a selected note follows the toolbar size and can be resized from its corner', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'it-IT', reducedMotion: 'reduce' });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  try {
    await page.goto(`${app.url}/dashboard/workspace/notebook/${NB}`);
    const note = page.getByTestId('text-note').first();
    await note.waitFor({ timeout: 20000 });
    await page.getByRole('button', { name: 'Testo', exact: true }).click();

    // Selecting the note shows its own size in the toolbar.
    await note.locator('textarea').click();
    const sizeMenu = page.getByRole('combobox', { name: 'Dimensione testo' });
    await sizeMenu.waitFor();
    assert.equal(await sizeMenu.inputValue(), '14');
    assert.equal(await note.getAttribute('data-selected'), 'true');

    // Word-style menu, then A+ (24 -> 28), applied to the selected note.
    await sizeMenu.selectOption('24');
    await until(() => saved().fontSize === 24, 'fontSize 24 saved');
    assert.equal(await note.locator('textarea').evaluate((el) => getComputedStyle(el).fontSize), '24px');
    await page.getByTestId('text-size-controls').getByRole('button', { name: 'Ingrandisci testo' }).click();
    await until(() => saved().fontSize === 28, 'fontSize 28 saved');
    assert.equal(saved().body, 'Nota sintetica', 'the text itself is untouched');

    // The note's own bar (above the box) is readable on the white page and its A+ works.
    const noteBigger = note.getByRole('button', { name: 'Ingrandisci testo' });
    const contrast = await noteBigger.evaluate((el) => {
      const lum = (c) => {
        const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4));
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      let bg = el;
      while (bg && getComputedStyle(bg).backgroundColor.match(/[\d.]+/g)?.[3] === '0') bg = bg.parentElement;
      const a = lum(getComputedStyle(el).color);
      const b = lum(getComputedStyle(bg).backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    assert.ok(contrast >= 3, `note controls are readable (contrast ${contrast.toFixed(1)})`);
    await noteBigger.click();
    await until(() => saved().fontSize === 32, 'fontSize 32 saved from the note bar');
    assert.equal(await sizeMenu.inputValue(), '32', 'the toolbar follows the selected note');

    // Drag the corner: wider and taller, saved as page fractions.
    const before = await note.boundingBox();
    const corner = note.getByRole('button', { name: 'Ridimensiona riquadro' });
    await note.hover();
    const c = await corner.boundingBox();
    await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
    await page.mouse.down();
    await page.mouse.move(c.x + 160, c.y + 120, { steps: 8 });
    await page.mouse.up();
    await until(() => typeof saved().height === 'number', 'height saved');
    const after = await note.boundingBox();
    assert.ok(after.width > before.width + 100, `box is wider (${before.width} -> ${after.width})`);
    assert.ok(after.height > before.height + 80, `box is taller (${before.height} -> ${after.height})`);
    assert.ok(saved().width > 0.26 && saved().height > 0 && saved().height < 1, 'width and height saved as page fractions');
    assert.equal(saved().fontSize, 32, 'resizing the box keeps the text size');
  } finally {
    await ctx.close();
  }
});
