// Public landing page (/, /it, /es, /fr) against the built app and the fake
// Supabase: structure, sign-up targets, honest pricing, the video-call rule
// and no third-party assets. Synthetic data only; no real service is contacted.
//
// Ports: FAKE_SUPABASE_PORT (default 54329, as in tests/run.sh) and
// LANDING_APP_PORT (default 3612), so this file can also run on its own next
// to other suites, e.g.
//   FAKE_SUPABASE_PORT=54611 node --test tests/landing.test.mjs
// after a test build (see tests/run.sh).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startFakeSupabase } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);
const APP_PORT = Number(process.env.LANDING_APP_PORT ?? 3612);
const PAGES = { en: '/', it: '/it', es: '/es', fr: '/fr' };
// Words for video calls in the four languages: the page may mention them only when DAILY_API_KEY is set.
const VIDEO = /video ?call|videochiamat|videollamad|visioconf/i;

let fake;
let app;
const html = {};
before(async () => {
  fake = await startFakeSupabase({ port: FAKE_PORT, tables: { knowledge_base: [], rehab_phases: [], exercises: [] } });
  app = await startApp({ fakeUrl: fake.url, port: APP_PORT }); // DAILY_API_KEY is empty in testEnv
  for (const [lang, path] of Object.entries(PAGES)) {
    const res = await fetch(`${app.url}${path}`);
    html[lang] = { status: res.status, body: await res.text() };
  }
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const decode = (s) => s.replace(/&amp;/g, '&');
const section = (body, id) => body.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`))?.[0] ?? '';

for (const lang of Object.keys(PAGES)) {
  test(`${lang}: answers 200 with one h1 and the page language`, () => {
    const { status, body } = html[lang];
    assert.equal(status, 200);
    assert.equal((body.match(/<h1[\s>]/g) ?? []).length, 1, 'exactly one h1');
    // The root layout renders <html lang="en">; the landing wrapper carries the
    // page language and HtmlLang corrects <html> after hydration (checked in a
    // browser below when Playwright is available).
    assert.match(body, new RegExp(`<div[^>]*lang="${lang}"`));
    assert.match(body, new RegExp(`hrefLang="${lang === 'en' ? 'x-default' : lang}"|hreflang="${lang === 'en' ? 'x-default' : lang}"`, 'i'));
  });

  test(`${lang}: every primary CTA leads to the existing sign-up`, () => {
    const { body } = html[lang];
    const ctas = [...body.matchAll(/<a[^>]*data-cta="primary"[^>]*>/g)].map((m) => decode(m[0].match(/href="([^"]+)"/)[1]));
    assert.ok(ctas.length >= 4, `hero, both audience paths and final CTA (found ${ctas.length})`);
    for (const href of ctas) assert.equal(href, `/login?mode=signup&lang=${lang}`);
  });

  test(`${lang}: both audience paths are present and linkable`, () => {
    const { body } = html[lang];
    for (const id of ['students', 'physiotherapists']) {
      const s = section(body, id);
      assert.ok(s, `#${id} section`);
      assert.match(s, /data-cta="primary"/, `#${id} has its own CTA`);
      assert.match(s, /role="tablist"/, `#${id} shows its screens as tabs`);
      assert.match(body, new RegExp(`href="(/${lang === 'en' ? '' : lang})?#${id}"`), `a link to #${id}`);
    }
  });

  test(`${lang}: no unfilled placeholders`, () => {
    const visible = html[lang].body.replace(/<script[\s\S]*?<\/script>/g, '');
    assert.doesNotMatch(visible, /\{\{|\{n\}|\{name\}|undefined|NaN/);
  });

  test(`${lang}: no video-call mention when DAILY_API_KEY is unset`, () => {
    const { body } = html[lang];
    const visible = body.replace(/<script[\s\S]*?<\/script>/g, '');
    assert.doesNotMatch(visible, VIDEO);
  });

  test(`${lang}: pricing offers the free account only, with no purchase button`, () => {
    const s = section(html[lang].body, 'pricing');
    assert.ok(s, 'pricing section');
    const links = [...s.matchAll(/<a[^>]*href="([^"]+)"/g)].map((m) => decode(m[1]));
    assert.deepEqual(links, [`/login?mode=signup&lang=${lang}`], 'the only link is the free sign-up');
    assert.doesNotMatch(s, /<button|<form|checkout|stripe|\/month|\/mese|\/mes|\/mois|[$€]\s?\d/i);
  });

  test(`${lang}: no third-party assets`, () => {
    const { body } = html[lang];
    const assets = [
      ...[...body.matchAll(/<(?:script|img|source|iframe|video|audio)[^>]*\s(?:src|srcSet|srcset)="([^"]+)"/g)].map((m) => m[1]),
      ...[...body.matchAll(/<link[^>]*href="([^"]+)"/g)].map((m) => m[1]),
    ].flatMap((v) => v.split(',').map((x) => x.trim().split(/\s+/)[0]));
    const external = assets.filter((u) => /^(https?:)?\/\//.test(u) && !/^https:\/\/phygo\.app(\/|$)/.test(u));
    assert.deepEqual(external, []);
    assert.doesNotMatch(body, /cdn\.|googleapis|gstatic|unpkg|jsdelivr|cdnjs/);
  });
}

test('in a browser: html lang, keyboard tabs and no horizontal scroll (skipped without Playwright)', async (t) => {
  let chromium;
  try {
    ({ chromium } = createRequire(import.meta.url)('playwright'));
  } catch {
    try {
      ({ chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright'));
    } catch {
      return t.skip('Playwright not installed');
    }
  }
  const executablePath = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  let browser;
  try {
    browser = await chromium.launch({ executablePath });
  } catch {
    return t.skip('no Chromium available');
  }
  try {
    for (const [lang, path] of Object.entries(PAGES)) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await page.goto(`${app.url}${path}`, { waitUntil: 'load' });
      await page.waitForFunction((l) => document.documentElement.lang === l, lang, { timeout: 10000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0, `${lang}: no horizontal scroll at 390px`);
      // Arrow keys move between the tabs of an audience path.
      await page.focus('#students-tab-0');
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'students-tab-1');
      assert.equal(await page.getAttribute('#students-tab-1', 'aria-selected'), 'true');
      assert.equal(await page.isHidden('#students-panel-0'), true);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
