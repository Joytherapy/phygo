// My Phygo profile: the patient sets the name they see, a personal goal and a
// photo, in a real browser (Playwright) against the fake Supabase, synthetic
// data only. The photo goes to the private 'patient-avatars' bucket, in the
// patient's own folder, and is shown through a signed URL; without the bucket
// (SQL not applied yet) the page says so and name and goal still save.
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54801);
const APP_PORT = Number(process.env.MY_PHYGO_PROFILE_APP_PORT ?? 3801);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const PU = { id: '8d000000-0000-4000-8000-000000000001', email: 'patient@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const PID = '8d100000-0000-4000-8000-000000000001';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const AVATAR_KEY = `patient-avatars/${PU.id}/avatar.jpg`;

let fake;
let app;
let browser;
before(async () => {
  if (skip) return;
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: { 'tok-patient': PU },
    tables: {
      profiles: [{ id: PU.id, display_name: null, bio: null, avatar_url: null, preferred_language: 'it' }],
      patients: [{ id: PID, user_id: '8d000000-0000-4000-8000-000000000002', patient_user_id: PU.id, name: 'Paziente Sintetico', age: 41, created_at: '2026-08-01T09:00:00Z' }],
      notes: [],
      patient_clinical_references: [],
      appointments: [],
      video_sessions: [],
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

const profileRow = () => fake.state.tables.profiles.find((r) => r.id === PU.id);

async function patientPage() {
  const ctx = await browser.newContext({ locale: 'it-IT' });
  await ctx.addInitScript(() => window.localStorage.setItem('phygo-lang', 'it'));
  const [name, value] = sessionCookie('tok-patient', PU).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}

async function waitFor(check, what, timeout = 10000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.fail(`timed out waiting for ${what}`);
}

test('the patient saves the name they see and a goal, and the home shows both', { skip }, async () => {
  const { ctx, page, errors } = await patientPage();
  try {
    await page.goto(`${app.url}/my-phygo/profile`);
    await page.getByRole('heading', { name: 'Personalizza il tuo profilo' }).waitFor({ timeout: 20000 });
    await page.getByLabel('Come vuoi essere chiamato/a').fill('Sintetica');
    await page.getByLabel('Il mio obiettivo').fill('Tornare a correre 5 km');
    await page.getByRole('button', { name: 'Salva' }).click();
    await page.getByRole('status').filter({ hasText: 'Profilo salvato' }).waitFor({ timeout: 10000 });
    assert.equal(profileRow().display_name, 'Sintetica');
    assert.equal(profileRow().bio, 'Tornare a correre 5 km');
    // The clinician's record of the patient is untouched.
    assert.equal(fake.state.tables.patients[0].name, 'Paziente Sintetico');

    await page.goto(`${app.url}/my-phygo/home`);
    await page.getByRole('heading', { name: 'Sintetica' }).waitFor({ timeout: 20000 });
    const goal = page.getByTestId('my-goal');
    await goal.waitFor({ timeout: 10000 });
    assert.match(await goal.innerText(), /Tornare a correre 5 km/);
    await goal.getByRole('link', { name: 'Modifica' }).click();
    await page.waitForURL('**/my-phygo/profile');
    await waitFor(async () => (await page.getByLabel('Il mio obiettivo').inputValue()) === 'Tornare a correre 5 km', 'the saved goal in the form');
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('a photo is stored privately in the patient folder, shown via a signed URL, and can be removed', { skip }, async () => {
  const { ctx, page, errors } = await patientPage();
  try {
    await page.goto(`${app.url}/my-phygo/profile`);
    await page.getByRole('button', { name: 'Aggiungi una foto' }).waitFor({ timeout: 20000 });

    // A wrong format is refused before anything is uploaded.
    await page.getByTestId('photo-input').setInputFiles({ name: 'anim.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') });
    await page.getByRole('alert').filter({ hasText: 'Formato non supportato' }).waitFor({ timeout: 10000 });
    assert.equal(fake.state.storage.objects.size, 0);

    await page.getByTestId('photo-input').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG });
    await page.getByRole('button', { name: 'Cambia foto' }).waitFor({ timeout: 15000 });
    assert.deepEqual([...fake.state.storage.objects.keys()], [AVATAR_KEY]);
    assert.equal(profileRow().avatar_url, `${PU.id}/avatar.jpg`);

    const navImg = page.getByTestId('portal-profile-link').locator('img');
    await navImg.waitFor({ timeout: 10000 });
    const src = await navImg.getAttribute('src');
    assert.match(src, /\/storage\/v1\/object\/sign\/patient-avatars\//, 'shown through a signed URL');
    assert.doesNotMatch(src, /\/object\/public\//, 'never a public URL');

    await page.getByRole('button', { name: 'Rimuovi' }).click();
    await page.getByRole('button', { name: 'Aggiungi una foto' }).waitFor({ timeout: 10000 });
    assert.equal(fake.state.storage.objects.size, 0);
    assert.equal(profileRow().avatar_url, null);
    await waitFor(async () => (await navImg.count()) === 0, 'the navbar to drop the photo');
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('without the photo bucket the page says photos are not active yet, and name and goal still save', { skip }, async () => {
  fake.state.storage.missingBuckets.add('patient-avatars');
  const { ctx, page, errors } = await patientPage();
  try {
    await page.goto(`${app.url}/my-phygo/profile`);
    await page.getByRole('button', { name: 'Aggiungi una foto' }).waitFor({ timeout: 20000 });
    await page.getByTestId('photo-input').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG });
    await page.getByRole('alert').filter({ hasText: 'non è ancora attivo' }).waitFor({ timeout: 15000 });
    assert.equal(fake.state.storage.objects.size, 0);
    assert.equal(profileRow().avatar_url, null);

    await page.getByLabel('Come vuoi essere chiamato/a').fill('Sintetica Due');
    await page.getByRole('button', { name: 'Salva' }).click();
    await page.getByRole('status').filter({ hasText: 'Profilo salvato' }).waitFor({ timeout: 10000 });
    assert.equal(profileRow().display_name, 'Sintetica Due');
    assert.deepEqual(errors, []);
  } finally {
    fake.state.storage.missingBuckets.delete('patient-avatars');
    await ctx.close();
  }
});

test('the profile page sends a signed-out visitor to the My Phygo login', { skip }, async () => {
  const ctx = await browser.newContext({ locale: 'it-IT' });
  const page = await ctx.newPage();
  try {
    await page.goto(`${app.url}/my-phygo/profile`);
    await page.waitForURL('**/my-phygo/login**', { timeout: 20000 });
  } finally {
    await ctx.close();
  }
});
