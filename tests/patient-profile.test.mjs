// Patient record (identity, contacts, clinical background) on the patient page.
//   - lib/patients/profile.ts: Italian dates, age from the date of birth (and
//     the old age when there is none), validation of e-mail, phone, postcode,
//     province, required name and surname, empty optional fields stored as null;
//   - in a real browser (Playwright) against the fake Supabase: an existing
//     record with only name and age is shown without losing anything; the form
//     refuses invalid values before any request; saving writes the patient row
//     and the clinician-only details, then shows them; a failed load of the
//     clinical part never lets the form overwrite it; a failed save is visible.
// Who may read and write these fields is decided by row-level security, which
// the fake does not apply: tests/sql/patient_profile.sh checks it on PostgreSQL.
// Synthetic people and records only. The browser part is skipped when
// Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs, { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54731);
const APP_PORT = Number(process.env.PATIENT_PROFILE_APP_PORT ?? 3731);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

let P; // lib/patients/profile.ts, transpiled
before(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-profile-'));
  try {
    const source = readFileSync(new URL('../lib/patients/profile.ts', import.meta.url), 'utf8');
    writeFileSync(join(dir, 'profile.mjs'), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
    P = await import(join(dir, 'profile.mjs'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const TODAY = new Date(2026, 9, 17); // 17 Oct 2026, local time

test('dates of birth: Italian format in and out, impossible, future and pre-1900 dates refused', () => {
  assert.deepEqual(P.parseItalianDate('14/03/1979', TODAY), { ok: true, iso: '1979-03-14' });
  assert.deepEqual(P.parseItalianDate(' 4/3/1979 ', TODAY), { ok: true, iso: '1979-03-04' });
  assert.deepEqual(P.parseItalianDate('29/02/2024', TODAY), { ok: true, iso: '2024-02-29' }, 'leap day');
  assert.deepEqual(P.parseItalianDate('17/10/2026', TODAY), { ok: true, iso: '2026-10-17' }, 'today');
  assert.deepEqual(P.parseItalianDate('29/02/2023', TODAY), { ok: false, error: 'invalid' });
  assert.deepEqual(P.parseItalianDate('31/04/1990', TODAY), { ok: false, error: 'invalid' });
  assert.deepEqual(P.parseItalianDate('00/01/1990', TODAY), { ok: false, error: 'invalid' });
  assert.deepEqual(P.parseItalianDate('18/10/2026', TODAY), { ok: false, error: 'future' });
  assert.deepEqual(P.parseItalianDate('31/12/1899', TODAY), { ok: false, error: 'too_old' });
  for (const bad of ['1979-03-14', '14/03/79', '14 marzo 1979', '', 'abc']) assert.equal(P.parseItalianDate(bad, TODAY).ok, false, bad);
  assert.equal(P.formatItalianDate('1979-03-14'), '14/03/1979');
  assert.equal(P.formatItalianDate(null), '');
});

test('age: from the date of birth, updated on the birthday; the old age only when there is no date', () => {
  assert.equal(P.ageFromBirthDate('1979-10-17', TODAY), 47, 'birthday today');
  assert.equal(P.ageFromBirthDate('1979-10-18', TODAY), 46, 'birthday tomorrow');
  assert.equal(P.ageFromBirthDate('1979-10-16', TODAY), 47);
  assert.equal(P.ageFromBirthDate('1979-10-18', new Date(2026, 9, 18)), 47, 'one day later it moves on by itself');
  assert.deepEqual(P.displayAge({ birth_date: '1979-03-14', age: 30 }, TODAY), { years: 47, source: 'birth_date' }, 'the date wins over the old field');
  assert.deepEqual(P.displayAge({ birth_date: null, age: 52 }, TODAY), { years: 52, source: 'recorded' });
  assert.equal(P.displayAge({ birth_date: null, age: null }, TODAY), null);
});

const emptyForm = () => ({
  first_name: 'Anna', last_name: 'Rossi', birth_date: '', gender: '', main_condition: '', phone: '', contact_email: '',
  address_street: '', address_number: '', postal_code: '', city: '', province: '', country: '',
  emergency_contact_name: '', emergency_contact_relation: '', emergency_contact_phone: '',
  medical_history: '', past_surgeries: '', medications: '', allergies: '', rehab_precautions: '',
});

test('validation: required name and surname, e-mail, phone, Italian postcode and province', () => {
  const r = P.validateProfile({ ...emptyForm(), first_name: ' ', last_name: '', contact_email: 'anna@', phone: '12', postal_code: '5610', province: 'Pisa', emergency_contact_phone: 'x', birth_date: '31/02/1980' }, TODAY);
  assert.equal(r.ok, false);
  assert.deepEqual(r.errors, { first_name: 'required', last_name: 'required', contact_email: 'email', phone: 'phone', postal_code: 'postal_code', province: 'province', emergency_contact_phone: 'phone', birth_date: 'invalid' });
  const abroad = P.validateProfile({ ...emptyForm(), country: 'France', postal_code: '75008', province: 'Île-de-France' }, TODAY);
  assert.equal(abroad.ok, true, 'outside Italy the postcode and province rules are not Italian');
  for (const phone of ['+39 333 123 4567', '050 123456', '(050) 12-34-56', '+44 20 7946 0958']) assert.ok(P.isValidPhone(phone), phone);
  for (const phone of ['12345', '+39 333 123 4567 890 12', 'tel 333']) assert.ok(!P.isValidPhone(phone), phone);
});

test('what is written: empty optional fields become null, the name is composed, the old age is kept without a date of birth', () => {
  const noDate = P.validateProfile({ ...emptyForm(), first_name: ' Anna ', last_name: ' Maria  Rossi', phone: '+39 333 123 4567', province: 'pi' }, TODAY);
  assert.equal(noDate.ok, true);
  assert.equal(noDate.patient.name, 'Anna Maria Rossi');
  assert.equal(noDate.patient.birth_date, null);
  assert.ok(!('age' in noDate.patient), 'without a date of birth the old age is not touched');
  assert.equal(noDate.patient.contact_email, null);
  assert.equal(noDate.patient.province, 'PI');
  assert.ok(Object.values(noDate.details).every((v) => v === null));
  const withDate = P.validateProfile({ ...emptyForm(), birth_date: '14/03/1979', allergies: ' Synthetic allergy ' }, TODAY);
  assert.equal(withDate.patient.birth_date, '1979-03-14');
  assert.equal(withDate.patient.age, 47, 'the age column is refreshed from the date');
  assert.equal(withDate.details.allergies, 'Synthetic allergy');
});

test('a record from before this change: its name fills the first-name field, nothing is invented', () => {
  const f = P.formFromRecord({ name: 'Mario Bianchi', first_name: null, last_name: null, birth_date: null, age: 61, gender: 'male', main_condition: 'Synthetic', phone: null, contact_email: null, address_street: null, address_number: null, postal_code: null, city: null, province: null, country: null }, null);
  assert.equal(f.first_name, 'Mario Bianchi');
  assert.equal(f.last_name, '');
  assert.equal(f.birth_date, '');
  assert.equal(f.gender, 'male');
  assert.equal(f.main_condition, 'Synthetic');
});

// --- in the browser ---------------------------------------------------------

const U = { id: '83000000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const LEGACY = '83100000-0000-4000-8000-000000000001'; // created before this change: name and age only
const FULL = '83100000-0000-4000-8000-000000000002'; // details exist
const legacyRow = { id: LEGACY, user_id: U.id, patient_user_id: null, name: 'Synthetic Legacy', age: 52, gender: 'female', main_condition: 'Synthetic shoulder pain', created_at: '2026-08-01T09:00:00Z' };
const fullRow = {
  id: FULL, user_id: U.id, patient_user_id: '83200000-0000-4000-8000-000000000001', name: 'Anna Rossi', first_name: 'Anna', last_name: 'Rossi',
  birth_date: '1979-03-14', age: 47, gender: 'female', main_condition: 'Synthetic low back pain', phone: '+39 333 123 4567',
  contact_email: 'anna.contact@example.invalid', address_street: 'Via Synthetic', address_number: '1', postal_code: '56100', city: 'Pisa',
  province: 'PI', country: 'Italia', created_at: '2026-08-01T09:00:00Z',
};

let fake;
let app;
let browser;
before(async () => {
  if (skip) return;
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: { 'tok-clin': U },
    primaryKeys: { patient_details: 'patient_id' },
    tables: {
      profiles: [{ id: U.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free' }],
      patients: [legacyRow, fullRow],
      patient_details: [{ patient_id: FULL, user_id: U.id, allergies: 'Synthetic allergy', medications: 'Synthetic drug', emergency_contact_name: 'Synthetic Contact', emergency_contact_relation: 'Sister', emergency_contact_phone: '+39 333 765 4321', medical_history: null, past_surgeries: null, rehab_precautions: null }],
      notes: [],
      patient_clinical_references: [],
      metabolic_profiles: [],
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

async function openPatient(id, viewport) {
  const ctx = await browser.newContext({ locale: 'it-IT', viewport });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  await page.goto(`${app.url}/dashboard/patients/${id}`);
  const card = page.getByTestId('patient-profile');
  await card.getByRole('button', { name: 'Modifica' }).waitFor();
  await card.getByText('Informazioni cliniche').first().waitFor();
  return { ctx, page, card };
}
const writes = (path) => fake.state.requests.filter((r) => r.path === path && ['PATCH', 'POST'].includes(r.method));

test('an existing record with only name and age is shown as it is, nothing lost', { skip }, async () => {
  const { ctx, card } = await openPatient(LEGACY);
  try {
    const text = await card.innerText();
    assert.match(text, /Synthetic Legacy/);
    assert.match(text, /52 anni \(età indicata, senza data di nascita\)/);
    assert.match(text, /Synthetic shoulder pain/);
    assert.match(text, /Non indicato/);
    assert.match(text, /Accesso a My PHYGO: non collegato/);
    assert.equal(writes('/rest/v1/patients').length + writes('/rest/v1/patient_details').length, 0, 'opening the page writes nothing');
  } finally {
    await ctx.close();
  }
});

test('invalid values are refused in the form, before anything is sent', { skip }, async () => {
  const { ctx, page, card } = await openPatient(LEGACY);
  try {
    await card.getByRole('button', { name: 'Modifica' }).click();
    assert.equal(await page.getByLabel(/^Nome/).first().inputValue(), 'Synthetic Legacy', 'the old name is offered as first name');
    await page.getByLabel(/^Data di nascita/).fill('31/02/1980');
    await page.getByLabel(/^Email di contatto/).fill('not-an-email');
    await page.getByLabel(/^Telefono/).first().fill('12');
    const before = writes('/rest/v1/patients').length;
    await card.getByRole('button', { name: 'Salva' }).click();
    for (const msg of ['Campo obbligatorio.', 'Questa data non esiste.', 'Inserisci un indirizzo email valido.', 'Inserisci un numero di telefono valido']) {
      await card.getByText(msg, { exact: false }).first().waitFor();
    }
    assert.equal(await page.getByLabel(/^Cognome/).getAttribute('aria-invalid'), 'true');
    await page.getByLabel(/^Data di nascita/).fill('01/01/2099');
    await card.getByRole('button', { name: 'Salva' }).click();
    await card.getByText('La data di nascita non può essere nel futuro.').waitFor();
    assert.equal(writes('/rest/v1/patients').length, before, 'nothing was sent');
  } finally {
    await ctx.close();
  }
});

test('saving writes the record and the clinical part, then shows them; the age comes from the date of birth', { skip }, async () => {
  const { ctx, page, card } = await openPatient(LEGACY);
  try {
    await card.getByRole('button', { name: 'Modifica' }).click();
    await page.getByLabel(/^Nome/).first().fill('Lucia');
    await page.getByLabel(/^Cognome/).fill('Verdi');
    await page.getByLabel(/^Data di nascita/).fill('05/06/1970');
    await page.getByLabel(/^Email di contatto/).fill('lucia.contact@example.invalid');
    await page.getByLabel(/^Telefono/).first().fill('+39 050 123456');
    await page.getByLabel(/^CAP/).fill('56100');
    await page.getByLabel(/^Città/).fill('Pisa');
    await page.getByLabel(/^Provincia/).fill('pi');
    await page.getByLabel(/^Allergie/).fill('Synthetic allergy to latex');
    await page.getByLabel(/^Precauzioni riabilitative/).fill('Synthetic precaution');
    await card.getByRole('button', { name: 'Salva' }).click();
    await card.getByText('Dati del paziente salvati.').waitFor();

    const row = fake.state.tables.patients.find((p) => p.id === LEGACY);
    assert.equal(row.name, 'Lucia Verdi', 'the display name used elsewhere follows');
    assert.equal(row.first_name, 'Lucia');
    assert.equal(row.birth_date, '1970-06-05');
    assert.equal(row.province, 'PI');
    assert.equal(row.gender, 'female', 'untouched fields are kept');
    assert.equal(row.main_condition, 'Synthetic shoulder pain');
    assert.equal(row.user_id, U.id);
    const patch = writes('/rest/v1/patients').at(-1);
    assert.equal(new URLSearchParams(patch.search).get('id'), `eq.${LEGACY}`, 'only this record is updated');
    const details = fake.state.tables.patient_details.find((d) => d.patient_id === LEGACY);
    assert.equal(details.user_id, U.id);
    assert.equal(details.allergies, 'Synthetic allergy to latex');
    assert.equal(details.medications, null);

    const text = await card.innerText();
    assert.match(text, /05\/06\/1970/);
    const expectedAge = new Date().getFullYear() - 1970 - (new Date() < new Date(new Date().getFullYear(), 5, 5) ? 1 : 0);
    assert.match(text, new RegExp(`${expectedAge} anni`));
    assert.match(text, /lucia\.contact@example\.invalid/);
    assert.match(text, /Synthetic allergy to latex/);
    assert.match(text, /56100 Pisa \(PI\)/);
  } finally {
    await ctx.close();
  }
});

test('the contact e-mail is kept apart from the My Phygo account', { skip }, async () => {
  const { ctx, card } = await openPatient(FULL);
  try {
    const text = await card.innerText();
    assert.match(text, /anna\.contact@example\.invalid/);
    assert.match(text, /non è l'account con cui il paziente accede a My PHYGO/);
    assert.match(text, /Accesso a My PHYGO: collegato/);
    assert.match(text, /Synthetic Contact/);
    assert.match(text, /Synthetic allergy/);
  } finally {
    await ctx.close();
  }
});

test('if the clinical part fails to load it cannot be overwritten; the rest still saves', { skip }, async () => {
  fake.state.failTables.add('patient_details');
  const ctx = await browser.newContext({ locale: 'it-IT' });
  try {
    const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
    await ctx.addCookies([{ name, value, url: app.url }]);
    const page = await ctx.newPage();
    await page.goto(`${app.url}/dashboard/patients/${FULL}`);
    const card = page.getByTestId('patient-profile');
    await card.getByTestId('details-error').first().waitFor();
    assert.match(await card.innerText(), /Non è stato possibile caricare le informazioni cliniche/);
    await card.getByRole('button', { name: 'Modifica' }).click();
    assert.equal(await page.getByLabel(/^Allergie/).isDisabled(), true, 'clinical fields are locked');
    await page.getByLabel(/^Città/).fill('Lucca');
    const before = writes('/rest/v1/patient_details').length;
    await card.getByRole('button', { name: 'Salva' }).click();
    await card.getByText('Dati del paziente salvati.').waitFor();
    assert.equal(writes('/rest/v1/patient_details').length, before, 'the clinical part was not written');
    assert.equal(fake.state.tables.patient_details.find((d) => d.patient_id === FULL).allergies, 'Synthetic allergy', 'and is intact');
    assert.equal(fake.state.tables.patients.find((p) => p.id === FULL).city, 'Lucca');
  } finally {
    fake.state.failTables.delete('patient_details');
    await ctx.close();
  }
});

test('a refused save is visible and nothing shown changes', { skip }, async () => {
  const { ctx, page, card } = await openPatient(FULL);
  try {
    await card.getByRole('button', { name: 'Modifica' }).click();
    await page.getByLabel(/^Città/).fill('Firenze');
    fake.state.failTables.add('patients');
    await card.getByRole('button', { name: 'Salva' }).click();
    await card.getByText('Non è stato possibile salvare. I dati precedenti non sono stati modificati.', { exact: false }).waitFor();
    assert.notEqual(fake.state.tables.patients.find((p) => p.id === FULL).city, 'Firenze');
    assert.equal(await page.getByLabel(/^Città/).inputValue(), 'Firenze', 'the form keeps what was typed');
  } finally {
    fake.state.failTables.delete('patients');
    await ctx.close();
  }
});

test('on a phone the sections stack and nothing overflows', { skip }, async () => {
  const { ctx, page, card } = await openPatient(FULL, { width: 375, height: 800 });
  try {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 0, `no horizontal scroll (${overflow}px)`);
    await card.getByRole('button', { name: 'Modifica' }).click();
    const box = await page.getByLabel(/^Cognome/).boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= 375, 'fields fit the screen');
  } finally {
    await ctx.close();
  }
});
