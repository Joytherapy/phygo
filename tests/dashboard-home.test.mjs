// Dashboard home ("what do I do now?"):
//   - lib/dashboard/home.ts: next appointment (in progress or next to start),
//     later today, pending patient requests, last session per patient,
//     follow-ups, weekly counters;
//   - in a real browser (Playwright) against the fake Supabase, synthetic data
//     only: the next patient card with its actions, a patient's request
//     confirmed from the to-do list, a follow-up suggestion, and the new
//     patient form with first name, surname and date of birth.
// Browser tests are skipped when Playwright/Chromium are not installed.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs, { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54781);
const APP_PORT = Number(process.env.DASHBOARD_HOME_APP_PORT ?? 3781);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

let H; // lib/dashboard/home.ts, transpiled
before(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-home-'));
  try {
    const source = readFileSync(new URL('../lib/dashboard/home.ts', import.meta.url), 'utf8');
    writeFileSync(join(dir, 'home.mjs'), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
    H = await import(join(dir, 'home.mjs'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const NOW = new Date(2026, 9, 21, 11, 0); // Wed 21 Oct 2026, 11:00 local
const at = (d, h, m = 0) => new Date(2026, 9, d, h, m).toISOString();
const appt = (id, patient, iso, extra = {}) => ({ id, patient_id: patient, scheduled_at: iso, duration_minutes: 30, session_type: 'in_person', status: 'confirmed', requested_by: 'physio', ...extra });

test('next appointment: the one in progress first, else the next to start; cancelled and past ones ignored', () => {
  const rows = [appt('past', 'a', at(21, 9)), appt('now', 'b', at(21, 10, 45)), appt('later', 'c', at(21, 15)), appt('req', 'd', at(21, 12), { status: 'requested' })];
  assert.deepEqual(H.nextAppointment(rows, NOW), { appointment: rows[1], inProgress: true });
  const r2 = [appt('later', 'c', at(21, 15)), appt('tomorrow', 'e', at(22, 9))];
  assert.equal(H.nextAppointment(r2, NOW).appointment.id, 'later');
  assert.equal(H.nextAppointment(r2, NOW).inProgress, false);
  assert.equal(H.nextAppointment([appt('tomorrow', 'e', at(22, 9))], NOW).appointment.id, 'tomorrow');
  assert.equal(H.nextAppointment([appt('past', 'a', at(21, 9))], NOW), null);
});

test('later today, pending requests and the week counters', () => {
  const rows = [appt('n', 'a', at(21, 12)), appt('l1', 'b', at(21, 15)), appt('l2', 'c', at(21, 17)), appt('tm', 'd', at(22, 9)),
    appt('r1', 'e', at(23, 10), { status: 'requested', requested_by: 'patient', session_type: 'video' }),
    appt('r-old', 'f', at(20, 10), { status: 'requested', requested_by: 'patient' }),
    appt('r-own', 'g', at(23, 11), { status: 'requested', requested_by: 'physio' }),
    appt('mon', 'h', at(19, 9))];
  assert.deepEqual(H.laterToday(rows, NOW, 'n').map((a) => a.id), ['l1', 'l2']);
  assert.deepEqual(H.pendingRequests(rows, NOW).map((a) => a.id), ['r1'], 'only future requests sent by the patient');
  assert.deepEqual(H.appointmentsPerWeekday(rows, NOW), [1, 0, 3, 1, 0, 0, 0], 'confirmed only, Monday first');
  const { start, end } = H.weekBounds(NOW);
  assert.equal(start.getDate(), 19);
  assert.equal(end.getDate(), 26);
});

test('last session per patient and follow-ups: over 30 days ago and nothing booked, longest gap first', () => {
  const notes = [{ patient_id: 'a', created_at: at(1, 9) }, { patient_id: 'a', created_at: at(20, 9) }, { patient_id: 'b', created_at: new Date(2026, 7, 1).toISOString() }, { patient_id: 'c', created_at: new Date(2026, 8, 1).toISOString() }, { patient_id: 'd', created_at: new Date(2026, 6, 1).toISOString() }];
  const last = H.lastNoteByPatient(notes);
  assert.equal(last.get('a').getDate(), 20);
  const next = H.nextByPatient([appt('x', 'd', at(23, 9))], NOW);
  const f = H.followUps(['a', 'b', 'c', 'd', 'e'], last, next, NOW);
  assert.deepEqual(f.map((x) => x.patientId), ['b', 'c'], 'a is recent, d is booked, e has no notes');
  assert.equal(f[0].days, H.daysBetween(new Date(2026, 7, 1), NOW));
  assert.deepEqual(H.notesPerWeek([{ patient_id: 'a', created_at: at(20, 9) }, { patient_id: 'a', created_at: at(12, 9) }, { patient_id: 'a', created_at: at(18, 9) }], NOW, 3), [0, 2, 1]);
});

/* ---------- browser ---------- */

const U = { id: '89000000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated', user_metadata: { display_name: 'Synthetic' } };
const P1 = '89100000-0000-4000-8000-000000000001';
const P2 = '89100000-0000-4000-8000-000000000002';
const P3 = '89100000-0000-4000-8000-000000000003';
const inMinutes = (m) => new Date(Date.now() + m * 60000).toISOString();
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

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
      patients: [
        { id: P1, user_id: U.id, patient_user_id: 'linked-user', name: 'Giulia Sintetica', first_name: 'Giulia', last_name: 'Sintetica', birth_date: '1990-01-01', age: 30, gender: 'female', main_condition: 'Lombalgia', created_at: daysAgo(90) },
        { id: P2, user_id: U.id, patient_user_id: null, name: 'Luca Sintetico', age: 50, gender: 'male', main_condition: null, created_at: daysAgo(200) },
        { id: P3, user_id: U.id, patient_user_id: null, name: 'Sara Sintetica', age: 28, gender: 'female', main_condition: null, created_at: daysAgo(100) },
      ],
      notes: [
        { id: 'n1', user_id: U.id, patient_id: P1, created_at: daysAgo(3) },
        { id: 'n2', user_id: U.id, patient_id: P2, created_at: daysAgo(45) },
      ],
      appointments: [
        { id: 'a-next', patient_id: P1, physio_id: U.id, scheduled_at: inMinutes(40), duration_minutes: 30, session_type: 'video', status: 'confirmed', requested_by: 'physio' },
        { id: 'a-req', patient_id: P3, physio_id: U.id, scheduled_at: inMinutes(60 * 48), duration_minutes: 30, session_type: 'in_person', status: 'requested', requested_by: 'patient' },
      ],
      professional_transition_accounts: [],
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

async function openDashboard(viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport, locale: 'it-IT', reducedMotion: 'reduce' });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  await page.goto(`${app.url}/dashboard`);
  return { page, close: () => ctx.close() };
}

test('next patient: name, time, video, last session, and the actions open the session and the record', { skip }, async () => {
  const { page, close } = await openDashboard();
  try {
    const card = page.getByTestId('next-patient');
    await card.waitFor({ timeout: 15000 });
    // The last session comes from the notes, which may arrive after the appointments.
    await card.getByText('3 giorni fa').waitFor({ timeout: 15000 });
    const text = await card.innerText();
    // Near midnight the appointment 40 minutes from now falls on tomorrow.
    const sameDay = new Date(Date.now() + 40 * 60000).getDate() === new Date().getDate();
    assert.match(text, sameDay ? /Prossimo paziente/i : /Prossimo appuntamento/i);
    assert.match(text, /Giulia Sintetica/);
    if (sameDay) assert.match(text, /Tra \d+ min/);
    assert.match(text, /Videochiamata/);
    assert.match(text, /3 giorni fa/, 'last session from the notes');
    assert.equal(await card.getByRole('link', { name: 'Inizia seduta' }).getAttribute('href'), `/dashboard/patients/${P1}/session`);
    assert.equal(await card.getByRole('link', { name: 'Apri scheda' }).getAttribute('href'), `/dashboard/patients/${P1}`);
    if (sameDay) assert.match(await page.getByTestId('brief').innerText(), /1 appuntamento oggi/);
    assert.match(await page.getByTestId('brief').innerText(), /1 richiesta da confermare/);
  } finally {
    await close();
  }
});

test('to do: a patient request is confirmed in one tap; a patient not seen for 45 days is suggested', { skip }, async () => {
  const { page, close } = await openDashboard();
  try {
    const todo = page.getByTestId('todo');
    await todo.getByText('Sara Sintetica').waitFor({ timeout: 15000 });
    assert.match(await todo.innerText(), /Luca Sintetico[\s\S]*Ultima seduta 45 giorni fa/);
    await todo.getByRole('button', { name: 'Conferma: Sara Sintetica' }).click();
    await page.waitForFunction(() => !document.querySelector('[data-testid="todo"]')?.textContent?.includes('Sara Sintetica'), null, { timeout: 15000 });
    assert.equal(fake.state.tables.appointments.find((a) => a.id === 'a-req').status, 'confirmed');
  } finally {
    await close();
  }
});

test('new patient: first name and surname required, date of birth checked, the record is saved with them', { skip }, async () => {
  const { page, close } = await openDashboard({ width: 390, height: 844 });
  try {
    await page.getByText('Giulia Sintetica').first().waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Nuovo paziente' }).last().click();
    await page.locator('#np-first').fill('Marta');
    await page.locator('#np-birth').fill('31/02/1990');
    const before = fake.state.tables.patients.length;
    await page.getByRole('button', { name: 'Salva paziente' }).click();
    await page.locator('#np-last-error').waitFor();
    await page.locator('#np-birth-error').waitFor();
    assert.match(await page.locator('#np-birth-error').innerText(), /non esiste/);
    assert.equal(fake.state.tables.patients.length, before, 'nothing written');
    await page.locator('#np-last').fill('Sintetica');
    await page.locator('#np-birth').fill('14/03/1979');
    await page.locator('#np-phone').fill('+39 333 123 4567');
    await page.getByRole('button', { name: 'Salva paziente' }).click();
    await page.getByText('Marta Sintetica').waitFor({ timeout: 15000 });
    const row = fake.state.tables.patients.find((r) => r.name === 'Marta Sintetica');
    assert.equal(row.first_name, 'Marta');
    assert.equal(row.last_name, 'Sintetica');
    assert.equal(row.birth_date, '1979-03-14');
    assert.equal(typeof row.age, 'number');
    assert.equal(row.phone, '+39 333 123 4567');
    assert.equal(row.user_id, U.id);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'no horizontal scroll on a phone');
    // The page clips overflow, so check that the cards themselves fit the screen.
    for (const id of ['next-patient', 'todo']) {
      const box = await page.getByTestId(id).boundingBox();
      assert.ok(box && box.x >= 0 && box.x + box.width <= 390, `${id} fits a 390 px screen (${box?.x}+${box?.width})`);
    }
  } finally {
    await close();
  }
});
