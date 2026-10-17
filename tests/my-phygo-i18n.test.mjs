// My Phygo (patient portal) in the app's 4 languages, in a real browser
// (Playwright) against the fake Supabase: for it/en/es/fr (the "phygo-lang"
// preference), /my-phygo/home and /my-phygo/shop show their texts, the
// appointment and video-call panels and the dates in that language, and the
// old hard-coded English texts are gone in it/es/fr. What the clinician wrote
// (name, summary, exercise names) is shown as it is in every language.
// Synthetic account and records only. Skipped when Playwright/Chromium are
// not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54741);
const APP_PORT = Number(process.env.MY_PHYGO_I18N_APP_PORT ?? 3741);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const PATIENT_USER = { id: '84000000-0000-4000-8000-000000000001', email: 'patient@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const CLINICIAN_ID = '84000000-0000-4000-8000-000000000002';
const PATIENT_ID = '84100000-0000-4000-8000-000000000001';

// Data written by the clinician: shown untranslated in every language.
const DATA = ['Synthetic Patient', 'Synthetic summary for the patient.', 'Synthetic bridge', 'Synthetic assessment'];

const EXPECT = {
  it: {
    home: ['Bentornato/a', '41 anni', 'Profilo metabolico', 'Scopri le attrezzature', 'Dall\'ultima seduta', 'I tuoi esercizi',
      '3 serie × 10 ripetizioni', 'Esercizio 2', '1 serie × 1 ripetizione', 'Storico delle sedute', 'Seduta registrata',
      'Nessuna chiamata attiva al momento.', 'Prossimo appuntamento', 'Completato', 'Consigliati per te'],
    dates: [/15 set 2026/, /marzo/],
    shop: ['Indietro', 'Attrezzatura', 'Negozio', 'Attrezzature selezionate per supportare il tuo recupero.', 'prodotti selezionati',
      'Tutti ·', 'Pavimento Pelvico', 'Vedi su Amazon', 'Foam Roller ad Alta Densità'],
  },
  en: {
    home: ['Welcome back', '41 years old', 'Metabolic profile', 'Browse equipment', 'From your last session', 'Your exercises',
      '3 sets × 10 reps', 'Exercise 2', '1 set × 1 rep', 'Session history', 'Session recorded',
      'No active call right now.', 'Next appointment', 'Completed', 'Recommended for you'],
    dates: [/Sep 15, 2026/, /March/],
    shop: ['Back', 'Equipment', 'Shop', 'Equipment picks that support your recovery.', 'curated picks',
      'All ·', 'Pelvic Floor', 'View on Amazon', 'High-Density Foam Roller'],
  },
  es: {
    home: ['Bienvenido/a de nuevo', '41 años', 'Perfil metabólico', 'Explorar equipamiento', 'De tu última sesión', 'Tus ejercicios',
      '3 series × 10 repeticiones', 'Ejercicio 2', '1 serie × 1 repetición', 'Historial de sesiones', 'Sesión registrada',
      'No hay ninguna llamada activa en este momento.', 'Próxima cita', 'Completada', 'Recomendados para ti'],
    dates: [/15 sept?\.? 2026/, /marzo/],
    shop: ['Volver', 'Equipamiento', 'Tienda', 'Equipamiento seleccionado para apoyar tu recuperación.', 'productos seleccionados',
      'Todos ·', 'Foam Roller de Alta Densidad', 'Ver en Amazon'],
  },
  fr: {
    home: ['Bon retour', '41 ans', 'Profil métabolique', 'Découvrir les équipements', 'De votre dernière séance', 'Vos exercices',
      '3 séries × 10 répétitions', 'Exercice 2', '1 série × 1 répétition', 'Historique des séances', 'Séance enregistrée',
      'Aucun appel en cours pour le moment.', 'Prochain rendez-vous', 'Terminé', 'Recommandés pour vous'],
    dates: [/15 sept\.? 2026/, /mars/],
    shop: ['Retour', 'Boutique', 'Une sélection d’équipements pour accompagner votre rétablissement.',
      'Rouleau de Massage Haute Densité'],
  },
};

// The texts that used to be hard-coded in English.
const ENGLISH_HOME = ['Welcome back', 'years old', 'Metabolic profile', 'Your calorie target and macros for today', 'Browse equipment',
  'Explore products that support your recovery', 'Recommended for you', 'From your last session', 'Your exercises', '3 sets', '10 reps',
  'Exercise 2', 'Session history', 'Session recorded', 'No active call right now.', 'Join video call', 'Next appointment', 'completed', 'Completed'];
const ENGLISH_SHOP = ['Back', 'Equipment picks that support your recovery.', 'curated picks', 'All ·', 'Pelvic Floor', 'Low Back',
  'Body Composition', 'View on Amazon', 'High-Density Foam Roller'];

let fake;
let app;
let browser;
before(async () => {
  if (skip) return;
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: { 'tok-patient': PATIENT_USER },
    tables: {
      // No profiles row for the patient: the language comes from "phygo-lang".
      profiles: [],
      patients: [{ id: PATIENT_ID, user_id: CLINICIAN_ID, patient_user_id: PATIENT_USER.id, name: 'Synthetic Patient', age: 41, main_condition: 'Synthetic knee pain', created_at: '2026-08-01T09:00:00Z' }],
      notes: [
        {
          id: '84200000-0000-4000-8000-000000000001', patient_id: PATIENT_ID, user_id: CLINICIAN_ID, created_at: '2026-09-15T10:00:00Z',
          assessment: 'Synthetic assessment', plan: 'Synthetic plan', summary_for_patient: 'Synthetic summary for the patient.',
          exercises: [{ internal_id: 'ex-1', name: 'Synthetic bridge', dosing: { sets: 3, reps: 10 } }, { internal_id: 'ex-2', dosing: { sets: 1, reps: 1 } }],
        },
        { id: '84200000-0000-4000-8000-000000000002', patient_id: PATIENT_ID, user_id: CLINICIAN_ID, created_at: '2026-08-20T10:00:00Z', assessment: null, plan: null, summary_for_patient: null, exercises: [] },
      ],
      patient_clinical_references: [
        { id: '84300000-0000-4000-8000-000000000001', patient_id: PATIENT_ID, content_type: 'product', created_at: '2026-09-15T10:00:00Z', payload: { name: 'Synthetic resistance band', amazonUrl: 'https://example.invalid/band', price: '€10' } },
      ],
      appointments: [
        { id: '84400000-0000-4000-8000-000000000001', patient_id: PATIENT_ID, physio_id: CLINICIAN_ID, scheduled_at: '2030-03-12T10:00:00Z', duration_minutes: 30, session_type: 'video', status: 'confirmed', requested_by: 'physio' },
        { id: '84400000-0000-4000-8000-000000000002', patient_id: PATIENT_ID, physio_id: CLINICIAN_ID, scheduled_at: '2026-09-01T10:00:00Z', duration_minutes: 30, session_type: 'in_person', status: 'completed', requested_by: 'physio' },
      ],
      // No active call.
      video_calls: [],
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

async function open(lang, path) {
  const ctx = await browser.newContext({ locale: 'en-US', timezoneId: 'UTC' });
  await ctx.addInitScript((l) => window.localStorage.setItem('phygo-lang', l), lang);
  const [name, value] = sessionCookie('tok-patient', PATIENT_USER).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  await page.goto(`${app.url}${path}`);
  return { ctx, page };
}

// Waits until every expected text is on the page (the language is applied
// after mount, the panels load on their own), then returns the text of <main>.
// textContent, not innerText: several labels are shown in CSS uppercase.
const MAIN_TEXT = () => (document.querySelector('main')?.textContent ?? '').replace(/\s+/g, ' ');
async function mainTextWhenReady(page, expected) {
  try {
    await page.waitForFunction(
      (texts) => {
        const t = (document.querySelector('main')?.textContent ?? '').replace(/\s+/g, ' ');
        return texts.every((x) => t.includes(x));
      },
      expected,
      { timeout: 20000 },
    );
  } catch {
    const text = await page.evaluate(MAIN_TEXT).catch(() => '');
    const missing = expected.filter((x) => !text.includes(x));
    assert.fail(`missing ${JSON.stringify(missing)} in:\n${text}`);
  }
  return page.evaluate(MAIN_TEXT);
}

for (const lang of ['it', 'en', 'es', 'fr']) {
  test(`My Phygo home in ${lang}: portal texts, appointments, video call and dates`, { skip }, async () => {
    const { ctx, page } = await open(lang, '/my-phygo/home');
    try {
      const text = await mainTextWhenReady(page, [...EXPECT[lang].home, ...DATA]);
      for (const re of EXPECT[lang].dates) assert.match(text, re, `date in ${lang}`);
      if (lang !== 'en') {
        for (const en of ENGLISH_HOME) assert.ok(!text.includes(en), `English "${en}" still shown in ${lang}`);
        assert.doesNotMatch(text, /Sep 15, 2026|March/, `English dates in ${lang}`);
      } else {
        for (const itText of EXPECT.it.home) assert.ok(!text.includes(itText), `Italian "${itText}" still shown in en`);
      }
      assert.ok(text.includes('Synthetic resistance band'), 'the clinician-recommended product name is shown as it is');
    } finally {
      await ctx.close();
    }
  });

  test(`My Phygo shop in ${lang}: heading, categories, products and links`, { skip }, async () => {
    const { ctx, page } = await open(lang, '/my-phygo/shop');
    try {
      const text = await mainTextWhenReady(page, EXPECT[lang].shop);
      if (lang !== 'en') {
        for (const en of ENGLISH_SHOP) assert.ok(!text.includes(en), `English "${en}" still shown in ${lang}`);
      }
    } finally {
      await ctx.close();
    }
  });
}
