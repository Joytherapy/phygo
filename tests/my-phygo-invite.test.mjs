// My Phygo invitations never link the wrong account, in a real browser
// (Playwright) against the fake Supabase, synthetic data only.
// The bug: the invitation page redeemed the code with whatever session the
// browser had. With the physiotherapist signed in (testing their own link),
// the physiotherapist's account was linked as the patient. Now the page asks
// to sign out first, signs out before creating the account, and redeems only
// with the new account's own session. A clinician's account opening My Phygo
// sees a notice instead of patient data and cannot change the shared profile.
// Sign-up, sign-out and the redeem call are answered in the browser and
// recorded. Skipped when Playwright/Chromium are not installed.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54803);
const APP_PORT = Number(process.env.MY_PHYGO_INVITE_APP_PORT ?? 3803);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const CLIN = { id: '8f200000-0000-4000-8000-000000000001', email: 'physio@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const PAT = { id: '8f200000-0000-4000-8000-000000000002', email: 'patient@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const NEW = { id: '8f200000-0000-4000-8000-000000000003', email: 'new-patient@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated', aud: 'authenticated' };
const P_SELF = '8f210000-0000-4000-8000-000000000001'; // linked to its own clinician (the bug's result)
const P_PAT = '8f210000-0000-4000-8000-000000000002';

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
        { id: CLIN.id, display_name: 'dr andrea', bio: 'Professional bio', avatar_url: 'https://example.invalid/a.png', practice_stage: 'professional', professional_status: 'verified', plan: 'free', preferred_language: 'it' },
        { id: PAT.id, display_name: 'Dott.ssa Anna Rossi', bio: null, avatar_url: null, practice_stage: 'professional', plan: 'free', preferred_language: 'it' },
      ],
      patients: [
        { id: P_SELF, user_id: CLIN.id, patient_user_id: CLIN.id, name: 'Synthetic Self', age: 40, created_at: '2026-08-01T09:00:00Z' },
        { id: P_PAT, user_id: '8f200000-0000-4000-8000-000000000009', patient_user_id: PAT.id, name: 'Synthetic Patient', age: 33, created_at: '2026-08-01T09:00:00Z' },
      ],
      notes: [], patient_clinical_references: [], appointments: [], video_sessions: [], video_calls: [],
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

// A page with sign-up / sign-out / redeem answered in the browser and recorded.
async function joinPage({ as, signUp }) {
  const ctx = await browser.newContext({ locale: 'it-IT' });
  await ctx.addInitScript(() => window.localStorage.setItem('phygo-lang', 'it'));
  if (as) {
    const [name, value] = sessionCookie(as === 'clin' ? 'tok-clin' : 'tok-pat', as === 'clin' ? CLIN : PAT).split(/=(.*)/s);
    await ctx.addCookies([{ name, value, url: app.url }]);
  }
  const calls = [];
  await ctx.route('**/auth/v1/logout**', (route) => {
    calls.push({ what: 'logout', auth: route.request().headers().authorization ?? null });
    return route.fulfill({ status: 204, body: '' });
  });
  await ctx.route('**/auth/v1/signup**', (route) => {
    calls.push({ what: 'signup', auth: route.request().headers().authorization ?? null });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(signUp) });
  });
  await ctx.route('**/rest/v1/rpc/redeem_patient_invite**', (route) => {
    calls.push({ what: 'redeem', auth: route.request().headers().authorization ?? null });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(P_PAT) });
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, calls, errors };
}

async function fillAndSubmit(page) {
  await page.getByLabel('Email').fill(NEW.email);
  await page.getByLabel('Password').fill('synthetic-pass-123');
  await page.getByRole('button', { name: 'Crea account' }).click();
}

test('a signed-in physiotherapist opening an invitation is asked to sign out, and nothing is redeemed', { skip }, async () => {
  const { ctx, page, calls, errors } = await joinPage({ as: 'clin', signUp: {} });
  try {
    await page.goto(`${app.url}/my-phygo/join/SYNTH-CODE?lang=it`);
    const notice = page.getByTestId('join-signed-in');
    await notice.waitFor({ timeout: 20000 });
    assert.match(await notice.innerText(), /Sei connesso come physio@test\.invalid/);
    assert.equal(await page.getByRole('button', { name: 'Crea account' }).count(), 0, 'no form while another account is signed in');
    await page.getByRole('button', { name: 'Esci e continua' }).click();
    await page.getByRole('button', { name: 'Crea account' }).waitFor({ timeout: 10000 });
    assert.deepEqual(calls.map((c) => c.what), ['logout']);
    assert.ok(!calls.some((c) => c.what === 'redeem'));
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('when sign-up opens no new session (existing or unconfirmed e-mail) the invitation is not used', { skip }, async () => {
  // What Supabase answers for an e-mail that already has an account: a user, no session.
  const { ctx, page, calls, errors } = await joinPage({ signUp: { id: NEW.id, email: NEW.email, aud: 'authenticated', role: 'authenticated', identities: [] } });
  try {
    await page.goto(`${app.url}/my-phygo/join/SYNTH-CODE?lang=it`);
    await page.getByRole('button', { name: 'Crea account' }).waitFor({ timeout: 20000 });
    await fillAndSubmit(page);
    await page.getByRole('alert').filter({ hasText: 'l’invito non è stato usato' }).waitFor({ timeout: 10000 });
    assert.ok(calls.some((c) => c.what === 'signup'));
    assert.ok(!calls.some((c) => c.what === 'redeem'), 'never redeemed without the new account’s session');
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('the invitation is redeemed only with the new account’s own session', { skip }, async () => {
  const session = { access_token: 'tok-new', refresh_token: 'refresh-new', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: NEW };
  const { ctx, page, calls } = await joinPage({ signUp: session });
  try {
    await page.goto(`${app.url}/my-phygo/join/SYNTH-CODE?lang=it`);
    await page.getByRole('button', { name: 'Crea account' }).waitFor({ timeout: 20000 });
    await fillAndSubmit(page);
    await page.waitForURL(/\/my-phygo\/(home|login)/, { timeout: 15000 });
    const redeem = calls.find((c) => c.what === 'redeem');
    assert.ok(redeem, 'redeemed');
    assert.equal(redeem.auth, 'Bearer tok-new');
    const order = calls.map((c) => c.what);
    assert.ok(order.indexOf('logout') < order.indexOf('signup'), 'any previous session is signed out before sign-up');
  } finally {
    await ctx.close();
  }
});

test('a clinician account in My Phygo sees a notice, no patient data, and cannot change its profile', { skip }, async () => {
  const { ctx, page, errors } = await joinPage({ as: 'clin', signUp: {} });
  const writes = [];
  page.on('request', (r) => { if (r.url().includes('/rest/v1/profiles') && r.method() === 'PATCH') writes.push(r.url()); });
  try {
    await page.goto(`${app.url}/my-phygo/home`);
    await page.getByTestId('clinician-notice').waitFor({ timeout: 20000 });
    const body = await page.locator('body').innerText();
    assert.match(body, /Questo è il tuo account professionale/);
    assert.ok(!body.includes('Synthetic Self') && !body.includes('dr andrea'), 'no patient record and no professional name shown');
    assert.equal(await page.getByTestId('portal-profile-link').count(), 0);

    await page.goto(`${app.url}/my-phygo/profile`);
    await page.getByTestId('clinician-notice').waitFor({ timeout: 20000 });
    assert.equal(await page.getByRole('button', { name: 'Salva' }).count(), 0);
    const prof = fake.state.tables.profiles.find((r) => r.id === CLIN.id);
    assert.equal(prof.bio, 'Professional bio');
    assert.equal(prof.avatar_url, 'https://example.invalid/a.png');
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('initials leave out titles ("Dott.ssa Anna Rossi" is AR)', { skip }, async () => {
  const { ctx, page } = await joinPage({ as: 'pat', signUp: {} });
  try {
    await page.goto(`${app.url}/my-phygo/home`);
    const link = page.getByTestId('portal-profile-link');
    await link.waitFor({ timeout: 20000 });
    await page.waitForFunction(() => document.querySelector('[data-testid="portal-profile-link"]')?.textContent?.trim() === 'AR', null, { timeout: 10000 });
  } finally {
    await ctx.close();
  }
});
