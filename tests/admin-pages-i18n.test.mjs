// The internal admin pages (verification requests, science queue, Pro Library
// items, events) follow the app language instead of a mix of hard-coded
// English and Italian. Real browser (Playwright) against the fake Supabase;
// the admin APIs are answered in the browser with synthetic rows, so this
// checks only the texts (who may use those APIs is tested server-side in
// tests/verification.test.mjs and friends).
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54802);
const APP_PORT = Number(process.env.ADMIN_I18N_APP_PORT ?? 3802);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const ADMIN = { id: '8f100000-0000-4000-8000-000000000001', email: 'admin@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };

const API = {
  '/api/admin/verification': { requests: [{ id: 'r1', display_name: 'Synthetic Physio', practice_stage: 'professional', professional_status: 'pending', registry_country: 'IT', registry_name: 'Albo sintetico', registration_number: 'TEST-0001', verification_requested_at: '2026-10-01T09:00:00Z', verification_message: null }] },
  '/api/science/list': { papers: [{ id: 'p1', title: 'Synthetic study', authors: null, journal: 'Test Journal', publication_date: '2026', study_type: 'RCT', original_url: 'https://example.invalid/p1', status: 'pending_review', relevance_score: 7 }] },
  '/api/library/admin': { categories: [{ id: 'c1', name: 'Cat', slug: 'cat' }], subcategories: [{ id: 's1', category_id: 'c1', name: 'Sub', slug: 'sub' }], items: [{ id: 'i1', subcategory_id: 's1', title: 'Synthetic item', goal: '', level: 'Gentle', body_position: 'Seated', equipment: 'None', steps: [], reps_duration: '', easier_option: '', harder_option: '', tip: '', safety_note: '', sort_order: 0 }] },
  '/api/events/admin': { events: [{ id: 'e1', title: 'Synthetic congress', description: null, event_type: 'conference', category: 'physiotherapy', location_type: 'online', country: null, city: null, start_date: '2026-11-20T09:00:00Z', official_url: null, registration_url: null, is_free: true, price: null, currency: null, status: 'upcoming', verification_status: 'unverified', moderation_status: 'pending_review', is_featured: false }] },
};

let fake;
let app;
let browser;
before(async () => {
  if (skip) return;
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: { 'tok-admin': ADMIN },
    tables: {
      profiles: [{ id: ADMIN.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free', preferred_language: null }],
      patients: [], notes: [], appointments: [], video_calls: [], patient_clinical_references: [], professional_transition_accounts: [],
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

async function adminPage(lang) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((l) => window.localStorage.setItem('phygo-lang', l), lang);
  const [name, value] = sessionCookie('tok-admin', ADMIN).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  await ctx.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (API[path] && route.request().method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(API[path]) });
    return route.continue();
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}

const EXPECT = {
  it: {
    '/dashboard/verification-admin': ['Richieste di verifica professionale', 'In attesa', 'Fisioterapista', 'Chiedi informazioni', 'Approva', 'Rifiuta'],
    '/dashboard/science-admin': ['Coda di revisione Science', '1 studio in attesa di revisione.', 'Punteggio: 7', 'Apri l’originale'],
    '/dashboard/library-admin': ['Pro Library — Gestione contenuti', '1 contenuto in totale.', 'Nuovo contenuto', 'Dolce'],
    '/dashboard/world/events-admin': ['Gestione eventi', 'Da revisionare · 1', 'Metti in evidenza', 'Segna come annullato', 'Elimina'],
  },
  fr: {
    '/dashboard/verification-admin': ['Demandes de vérification professionnelle', 'En attente', 'Kinésithérapeute', 'Demander des informations'],
    '/dashboard/science-admin': ['File de revue Science', '1 étude en attente de revue.'],
    '/dashboard/library-admin': ['Pro Library — Gestion des contenus', '1 contenu au total.', 'Doux'],
    '/dashboard/world/events-admin': ['Gestion des événements', 'À examiner · 1', 'Mettre à la une'],
  },
};
// English words the old pages showed whatever the language.
const LEFTOVERS = ['Approve', 'Reject', 'Ask for information', 'No display name', 'studies awaiting review', 'items total', 'New item', 'Pending review', 'Unfeature', 'Nothing here right now'];

for (const lang of Object.keys(EXPECT)) {
  test(`admin pages are in ${lang}`, { skip }, async () => {
    const { ctx, page, errors } = await adminPage(lang);
    try {
      for (const [path, texts] of Object.entries(EXPECT[lang])) {
        await page.goto(`${app.url}${path}`);
        await page.getByText(texts[0], { exact: true }).first().waitFor({ timeout: 20000 });
        await page.getByText(/Synthetic/).first().waitFor({ timeout: 10000 });
        const body = await page.locator('main, body').first().innerText();
        for (const text of texts) assert.ok(body.includes(text), `${path} (${lang}) shows "${text}"`);
        for (const word of LEFTOVERS) assert.ok(!body.includes(word), `${path} (${lang}) has no leftover "${word}"`);
      }
      assert.deepEqual(errors, []);
    } finally {
      await ctx.close();
    }
  });
}
