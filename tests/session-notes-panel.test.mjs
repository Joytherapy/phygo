// The session notes panel (LiveStructuring) speaks the app language and still
// writes the reviewed note to the patient's record, in a real browser
// (Playwright) against the fake Supabase, synthetic data only. The AI routes
// (/api/generate-note and the lookups that follow it) are answered by the
// test itself, so no model or external service is called.
// Skipped when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54792);
const APP_PORT = Number(process.env.SESSION_NOTES_APP_PORT ?? 3792);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

const U = { id: '8b000000-0000-4000-8000-000000000001', email: 'clinician@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const P = '8b100000-0000-4000-8000-000000000001';

const NOTE = {
  subjective: 'Dolore lombare ridotto rispetto alla scorsa settimana.',
  objective: 'Flessione del tronco migliorata.',
  assessment: 'Lombalgia meccanica in miglioramento.',
  plan: 'Proseguire gli esercizi di stabilità.',
  summaryForPatient: 'Continua gli esercizi ogni giorno.',
  language: 'it',
};

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
      patients: [{ id: P, user_id: U.id, patient_user_id: null, name: 'Paziente Sintetico', age: 40, gender: null, main_condition: null, created_at: '2026-09-01T09:00:00Z' }],
      notes: [], appointments: [], video_calls: [], patient_clinical_references: [], metabolic_profiles: [], patient_details: [], professional_transition_accounts: [], patient_invites: [],
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

test('the notes panel is in Italian and saves the reviewed note to the patient', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const json = (body) => (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/generate-note', json({ note: NOTE }));
  await page.route('**/api/science/relevant', json({ papers: [] }));
  await page.route('**/api/knowledge-lookup', json({ match: null, phases: [] }));
  try {
    await page.goto(`${app.url}/dashboard/patients/${P}/session`);
    await page.getByRole('heading', { level: 1, name: 'Paziente Sintetico' }).waitFor({ timeout: 15000 });
    await page.getByText('Nota di sessione').first().waitFor();

    // Italian labels, no leftover English from the old panel.
    for (const label of ['Pronto', 'Rilievi', 'Valutazione', 'Piano', 'Follow-up']) {
      await page.getByText(label, { exact: true }).first().waitFor({ timeout: 10000 });
    }
    const body = await page.locator('main').innerText();
    for (const english of ['Speak naturally', 'Findings', 'Write instead', 'Upload scan', 'Save to Patient', 'Ready']) {
      assert.ok(!body.includes(english), `"${english}" should not appear in the Italian panel`);
    }
    // The marketing demo examples are not offered on the clinical page.
    assert.ok(!body.includes('Lower back pain'));

    await page.getByRole('button', { name: 'Scrivi', exact: true }).click();
    await page.getByRole('textbox', { name: 'Scrivi qui le tue osservazioni sulla seduta…' }).fill('Il paziente riferisce meno dolore lombare.');
    await page.getByRole('button', { name: 'Genera nota' }).click();

    await page.getByText('Nota pronta').waitFor({ timeout: 15000 });
    await page.getByTestId('note-assessment').getByText(NOTE.assessment).waitFor();

    assert.equal(fake.state.tables.notes.length, 0, 'nothing is saved before the clinician confirms');
    await page.getByRole('button', { name: 'Salva nella scheda' }).click();
    await page.getByRole('button', { name: 'Salvata nella scheda' }).waitFor({ timeout: 10000 });

    const saved = fake.state.tables.notes;
    assert.equal(saved.length, 1);
    assert.equal(saved[0].patient_id, P);
    assert.equal(saved[0].user_id, U.id);
    assert.equal(saved[0].assessment, NOTE.assessment);
    assert.equal(saved[0].summary_for_patient, NOTE.summaryForPatient);
  } finally {
    await ctx.close();
  }
});

test('the coherence checks say what was left out and why, keep what the clinician chose, and let an exercise be added back', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const json = (body) => (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  // The screenshot case, synthetic: left shoulder, the draft with an ankle
  // exercise, and a plan that names the other side.
  const note = {
    subjective: 'Dolore alla spalla sinistra da un mese.',
    objective: 'Dolore in rotazione esterna resistita.',
    assessment: 'Possibile tendinopatia della cuffia dei rotatori.',
    plan: 'Rinforzo progressivo della spalla destra.',
    summaryForPatient: 'Esercizi ogni giorno.',
    primaryCondition: 'rotator cuff tendinopathy',
    exercises: ['Rotazione esterna con elastico 3x12', 'Mobilità di caviglia 2x15'],
    language: 'it',
  };
  const dosing = { sets: 3, reps: 12, duration_seconds: null, frequency_per_week: null, notes: null };
  let sent = null;
  await page.route('**/api/generate-note', json({ note }));
  await page.route('**/api/science/relevant', json({ papers: [] }));
  // A condition sheet naming no body region: shown, marked as not verified.
  await page.route('**/api/knowledge-lookup', json({
    match: { id: 14, condition_name: 'Tendinopatia calcifica', condition_keywords: 'tendinopatia calcifica', goals: 'Obiettivi sintetici', clinical_tests: 'Test sintetici', red_flags: 'Nessuna', typical_exercises: 'Esercizi sintetici', source: 'Linea guida sintetica', source_date: '2024' },
    phases: [], relevance: 'unverified', relevanceReason: 'sheet_region_unknown',
  }));
  await page.route('**/api/exercise-intelligence', (route) => {
    sent = JSON.parse(route.request().postData() || '{}');
    return json({
      exercises: [
        { internal_id: 'exercises-1', provider: 'exercises', provider_id: 'e1', name: 'Shoulder external rotation with band', draft: 'Rotazione esterna con elastico 3x12', body_region: 'shoulder', primary_muscle: 'Infraspinatus', media: null, source_type: 'professional', dosing, clinical_check: null, relevance: 'compatible', relevance_reason: null },
        // Region not recognised: kept, never shown as pertinent.
        { internal_id: 'custom-ball', provider: 'custom', provider_id: null, name: 'Esercizio con la palla 3x10', draft: 'Esercizio con la palla 3x10', body_region: null, primary_muscle: null, media: null, source_type: 'professional', dosing, clinical_check: null, relevance: 'unverified', relevance_reason: 'exercise_region_unknown' },
      ],
      excluded: [{ name: 'Mobilità di caviglia 2x15', reason: 'off_region', regions: ['ankle_foot'], caseRegions: ['shoulder'] }],
    })(route);
  });
  // An exercise the clinician picks by hand from the database, of another region on purpose.
  await page.route('**/api/exercise-search*', json({ exercises: [{ internal_id: 'exercises-2', provider: 'exercises', provider_id: 'e2', name: 'Hamstring stretch', body_region: 'hamstrings', primary_muscle: 'Hamstrings', media: null }] }));
  // Optional screenshots of the panel for review (below the sticky navbar).
  const shots = process.env.COHERENCE_SCREENSHOTS;
  const shoot = async (locator, file) => {
    if (!shots) return;
    await locator.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 140));
    const box = await locator.boundingBox();
    await page.screenshot({ path: `${shots}/${file}`, clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 } });
  };
  try {
    await page.goto(`${app.url}/dashboard/patients/${P}/session`);
    await page.getByRole('heading', { level: 1, name: 'Paziente Sintetico' }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Scrivi', exact: true }).click();
    const said = 'Dolore alla spalla sinistra da un mese, dolore in rotazione esterna resistita.';
    await page.getByRole('textbox', { name: 'Scrivi qui le tue osservazioni sulla seduta…' }).fill(said);
    await page.getByRole('button', { name: 'Genera nota' }).click();
    await page.getByText('Nota pronta').waitFor({ timeout: 15000 });

    const checks = page.getByTestId('coherence-checks');
    await checks.getByText('Controlli di coerenza').waitFor({ timeout: 10000 });
    assert.equal(sent.transcript, said, 'the clinician’s words go with the exercises, as the reference for region and side');
    const cards = page.getByTestId('note-exercise');
    const excluded = checks.getByTestId('excluded-exercise');

    // What does not match, and why.
    await checks.locator('li[data-kind="side"]').getByText('Piano: il lato non corrisponde a quello che hai indicato.').waitFor();
    await checks.getByText('Esercizi non inseriti nel programma, con il motivo').waitFor();
    assert.equal(await excluded.count(), 1);
    assert.match(await excluded.innerText(), /Mobilità di caviglia 2x15[\s\S]*Distretto dell'esercizio: caviglia e piede\. Distretto del caso: spalla\./);
    assert.equal(await cards.count(), 2, 'the excluded exercise is not in the exercises');
    // Not recognised: kept, marked as not verified with the reason, in the card and in the checks.
    await cards.nth(1).getByTestId('exercise-unverified').getByText('Pertinenza non verificata: il distretto dell’esercizio non è riconosciuto. Decidi tu se tenerlo.').waitFor();
    await checks.locator('li[data-kind="exercise_unverified"]').getByText('"Esercizio con la palla 3x10": pertinenza non verificata', { exact: false }).waitFor();
    assert.equal(await cards.first().getByTestId('exercise-unverified').count(), 0, 'a recognised, compatible exercise is not marked');
    // The sheet without a recognisable region: shown, not verified.
    await page.getByTestId('insight-unverified').getByText('Pertinenza non verificata: la scheda non indica un distretto riconoscibile.').waitFor();
    await checks.locator('li[data-kind="protocol_unverified"]').waitFor();
    // A note exercise matched to a database exercise says what the note wrote.
    await cards.first().getByText('Dalla nota: Rotazione esterna con elastico 3x12').waitFor();
    await shoot(checks, 'coherence-1-after-generation.png');

    // The clinician adds an exercise of another region by hand: it is kept as
    // chosen and only flagged, never removed.
    await page.getByRole('button', { name: 'Aggiungi esercizio' }).click();
    await page.getByRole('textbox', { name: 'Cerca esercizi (es. plank, ponte, squat)…' }).fill('hamstring');
    await page.getByRole('button', { name: /Hamstring stretch/ }).click();
    assert.equal(await cards.count(), 3);
    await checks.locator('li[data-kind="exercise"]').getByText('"Hamstring stretch" riguarda un distretto diverso da quello del caso.').waitFor();

    // Added back on purpose: it moves from the excluded list to the exercises,
    // nothing else changes.
    await excluded.getByRole('button', { name: 'Aggiungi comunque' }).click();
    await excluded.first().waitFor({ state: 'detached' });
    assert.equal(await cards.count(), 4);
    assert.deepEqual(await cards.evaluateAll((els) => els.map((e) => e.querySelector('p')?.textContent)), ['Shoulder external rotation with band', 'Esercizio con la palla 3x10', 'Hamstring stretch', 'Mobilità di caviglia 2x15']);
    await checks.locator('li[data-kind="exercise"]').getByText('"Mobilità di caviglia 2x15" riguarda un distretto diverso da quello del caso.').waitFor();
    await shoot(checks, 'coherence-2-after-choices.png');
    await shoot(cards.first().locator('xpath=..'), 'coherence-3-exercises.png');

    await page.getByRole('button', { name: 'Salva nella scheda' }).click();
    await page.getByRole('button', { name: 'Salvata nella scheda' }).waitFor({ timeout: 10000 });
    const saved = fake.state.tables.notes.at(-1);
    assert.deepEqual((saved.exercises ?? []).map((e) => (typeof e === 'string' ? e : e.name)), ['Shoulder external rotation with band', 'Esercizio con la palla 3x10', 'Hamstring stretch', 'Mobilità di caviglia 2x15'], 'what the clinician chose is saved, nothing lost');
  } finally {
    await ctx.close();
  }
});

test('coherence checks with two regions treated today and one only in history: sides per region, history not treated as current', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const json = (body) => (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  const said = 'Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi. In anamnesi frattura del polso destro, ora asintomatica.';
  const note = {
    // The history line in the findings is correct; the plan's sides are correct;
    // one hypothesis has the knee on the wrong side; the plan treats the wrist (history) as current.
    subjective: 'Dolore alla spalla destra e al ginocchio sinistro. Pregressa frattura del polso destro, ora asintomatica.',
    objective: 'Dolore in elevazione della spalla e alle scale.',
    assessment: 'Possibile dolore di spalla correlato alla cuffia dei rotatori; possibile dolore femororotuleo.',
    plan: 'Esercizi per la spalla destra e per il ginocchio sinistro. Rinforzo del polso.',
    summaryForPatient: 'Esercizi ogni giorno.',
    primaryCondition: 'rotator cuff related shoulder pain',
    clinicalReasoning: { hypotheses: ['Possibile dolore femororotuleo al ginocchio destro'] },
    exercises: ['Rotazione esterna con elastico spalla destra 3x12', 'Estensione di ginocchio sinistro 3x12', 'Flessori del polso 3x12'],
    language: 'it',
  };
  const dosing = { sets: 3, reps: 12, duration_seconds: null, frequency_per_week: null, notes: null };
  await page.route('**/api/generate-note', json({ note }));
  await page.route('**/api/science/relevant', json({ papers: [] }));
  await page.route('**/api/knowledge-lookup', json({ match: null, phases: [] }));
  await page.route('**/api/exercise-intelligence', json({
    exercises: [
      { internal_id: 'exercises-1', provider: 'exercises', provider_id: 'e1', name: 'Shoulder external rotation with band', draft: 'Rotazione esterna con elastico spalla destra 3x12', body_region: 'shoulder', primary_muscle: 'Infraspinatus', media: null, source_type: 'professional', dosing, clinical_check: null, relevance: 'compatible', relevance_reason: null },
      { internal_id: 'exercises-7', provider: 'exercises', provider_id: 'e7', name: 'Knee extension', draft: 'Estensione di ginocchio sinistro 3x12', body_region: 'thighs', primary_muscle: 'Quadriceps', media: null, source_type: 'professional', dosing, clinical_check: null, relevance: 'compatible', relevance_reason: null },
    ],
    excluded: [{ name: 'Flessori del polso 3x12', reason: 'history_only', regions: ['wrist_hand'], caseRegions: ['shoulder', 'knee'] }],
  }));
  const shots = process.env.COHERENCE_SCREENSHOTS;
  try {
    await page.goto(`${app.url}/dashboard/patients/${P}/session`);
    await page.getByRole('heading', { level: 1, name: 'Paziente Sintetico' }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Scrivi', exact: true }).click();
    await page.getByRole('textbox', { name: 'Scrivi qui le tue osservazioni sulla seduta…' }).fill(said);
    await page.getByRole('button', { name: 'Genera nota' }).click();
    await page.getByText('Nota pronta').waitFor({ timeout: 15000 });
    const checks = page.getByTestId('coherence-checks');
    await checks.getByText('Controlli di coerenza').waitFor({ timeout: 10000 });

    // The wrist is history: its exercise is left out saying so, and the plan is flagged for treating it as current.
    const excluded = checks.getByTestId('excluded-exercise');
    assert.equal(await excluded.count(), 1);
    assert.match(await excluded.innerText(), /Flessori del polso 3x12[\s\S]*polso e mano: indicato solo in anamnesi, non come problema attuale\./);
    await checks.locator('li[data-kind="history_as_active"]').getByText('Piano (polso e mano): tratta come problema attuale un distretto che hai indicato solo in anamnesi.').waitFor();
    // Sides per region: only the hypothesis with the knee on the wrong side.
    const sides = await checks.locator('li[data-kind="side"]').allInnerTexts();
    assert.deepEqual(sides, ['Ipotesi cliniche: il lato non corrisponde a quello che hai indicato.'], 'the plan (right shoulder, left knee) and the history line are not flagged');
    assert.equal(await checks.locator('li[data-kind="section_region"]').count(), 0, 'the history line in the findings is not an error');
    // Both regions of today keep their exercises, with no warning on them.
    const cards = page.getByTestId('note-exercise');
    assert.equal(await cards.count(), 2);
    assert.equal(await page.getByTestId('exercise-unverified').count(), 0);
    assert.equal(await checks.locator('li[data-kind="exercise"], li[data-kind="exercise_unverified"]').count(), 0);
    if (shots) {
      await checks.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 140));
      const box = await checks.boundingBox();
      await page.screenshot({ path: `${shots}/coherence-4-history-multisite.png`, clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 } });
    }
  } finally {
    await ctx.close();
  }
});

test('statements the clinician did not give are taken out and listed, and can be restored; unverified library matches are not applied', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const json = (body) => (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  const said = 'Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi. Dolore alla spalla in elevazione e al ginocchio scendendo le scale.';
  // As /api/generate-note returns it: already without the invented findings and follow-up, which are listed.
  const note = {
    subjective: 'Dolore alla spalla destra in elevazione e al ginocchio sinistro scendendo le scale.',
    objective: '',
    assessment: 'Possibile dolore di spalla destra correlato alla cuffia dei rotatori; possibile dolore femororotuleo al ginocchio sinistro.',
    plan: 'Esercizi per la spalla destra e per il ginocchio sinistro.',
    summaryForPatient: 'Fai gli esercizi ogni giorno.',
    primaryCondition: 'rotator cuff related shoulder pain',
    exercises: ['Pendolo di Codman 3x1 minuto', 'Estensione di ginocchio sinistro 3x12'],
    language: 'it',
  };
  const removed = [
    { section: 'objective', text: 'Test di Neer e Hawkins positivi a destra', kind: 'invented_test', item: 'neer' },
    { section: 'objective', text: 'Gonfiore al ginocchio sinistro', kind: 'invented_finding', item: 'gonfiore' },
    { section: 'summaryForPatient', text: 'Ci vediamo due volte a settimana', kind: 'invented_appointment', item: 'ci vediamo' },
  ];
  const dosing = { sets: 3, reps: 12, duration_seconds: null, frequency_per_week: null, notes: null };
  const suggestion = { internal_id: 'exercises-9', provider: 'exercises', provider_id: 'e9', name: 'Pendulum swing', body_region: 'shoulder', primary_muscle: 'Deltoid', media: null };
  await page.route('**/api/generate-note', json({ note, removed }));
  await page.route('**/api/science/relevant', json({ papers: [] }));
  await page.route('**/api/knowledge-lookup', json({
    match: { id: 1, condition_name: 'Tendinopatia della cuffia dei rotatori', condition_keywords: 'cuffia dei rotatori', goals: 'g', clinical_tests: 't', red_flags: 'r', typical_exercises: 'e', source: 'Linea guida sintetica', source_date: '2024' },
    // The clinician said "dolore alla spalla": the cuff sheet comes from the
    // assessment. For the knee, pain was described: the generic sheet.
    phases: [], relevance: 'unverified', relevanceReason: 'diagnosis_not_stated',
    others: [{ region: 'knee', side: 'left', match: { id: 15, condition_name: 'Dolore di ginocchio aspecifico' }, relevance: 'verified', relevanceReason: 'symptom_only' }],
  }));
  await page.route('**/api/exercise-intelligence', json({
    exercises: [
      { internal_id: 'custom-p', provider: 'custom', provider_id: null, name: 'Pendolo di Codman 3x1 minuto', draft: 'Pendolo di Codman 3x1 minuto', body_region: null, primary_muscle: null, media: null, source_type: 'professional', dosing, clinical_check: null, relevance: 'compatible', relevance_reason: null, match_status: 'unverified', suggested_match: suggestion },
      { internal_id: 'exercises-7', provider: 'exercises', provider_id: 'e7', name: 'Knee extension', draft: 'Estensione di ginocchio sinistro 3x12', body_region: 'thighs', primary_muscle: 'Quadriceps', media: null, source_type: 'professional', dosing, clinical_check: null, relevance: 'compatible', relevance_reason: null, match_status: 'verified', suggested_match: null },
    ],
    excluded: [],
  }));
  try {
    await page.goto(`${app.url}/dashboard/patients/${P}/session`);
    await page.getByRole('heading', { level: 1, name: 'Paziente Sintetico' }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Scrivi', exact: true }).click();
    await page.getByRole('textbox', { name: 'Scrivi qui le tue osservazioni sulla seduta…' }).fill(said);
    await page.getByRole('button', { name: 'Genera nota' }).click();
    await page.getByText('Nota pronta').waitFor({ timeout: 15000 });
    const checks = page.getByTestId('coherence-checks');
    await checks.getByText('Controlli di coerenza').waitFor({ timeout: 10000 });

    // What was taken out, where and why.
    const list = checks.getByTestId('removed-fact');
    assert.equal(await list.count(), 3);
    await checks.getByText('Tolto dalla bozza perché non risulta da ciò che hai detto').waitFor();
    assert.match(await list.nth(0).innerText(), /Test di Neer e Hawkins positivi a destra[\s\S]*Oggettivo · test non nominato/);
    assert.match(await list.nth(2).innerText(), /Ci vediamo due volte a settimana[\s\S]*Sintesi per il paziente · appuntamento o frequenza delle visite non concordati/);
    assert.doesNotMatch(await page.getByTestId('note-findings').innerText(), /Neer|Gonfiore/, 'not in the note');

    // The main sheet is not claimed as the diagnosis; the other region treated
    // today has its side, its sheet and why that sheet.
    await page.getByTestId('insight-unverified').getByText('la diagnosi della scheda non risulta da ciò che hai detto', { exact: false }).waitFor();
    await page.getByTestId('other-regions').getByText('ginocchio (lato sinistro): Dolore di ginocchio aspecifico', { exact: false }).waitFor();
    await page.getByTestId('other-region-reason').getByText('scheda generica del distretto (hai descritto il sintomo, non una diagnosi)', { exact: false }).waitFor();
    // No objective finding stated: said so, not left silently empty.
    await checks.locator('li[data-kind="objective_missing"]').getByText('Nessun rilievo obiettivo riferito', { exact: false }).waitFor();

    // The library suggestion is not applied by itself; taking it is the clinician's choice.
    const cards = page.getByTestId('note-exercise');
    await cards.first().getByTestId('match-unverified').getByText('Corrispondenza in libreria non verificata', { exact: false }).waitFor();
    assert.equal(await cards.first().locator('p').first().innerText(), 'Pendolo di Codman 3x1 minuto');
    await cards.first().getByRole('button', { name: 'Usa «Pendulum swing»' }).click();
    await cards.first().locator('p').first().getByText('Pendulum swing').waitFor();
    await cards.first().getByText('Dalla nota: Pendolo di Codman 3x1 minuto').waitFor();

    // Restored on purpose: back in its section, off the list; the clinician then saves.
    await list.nth(1).getByRole('button', { name: 'Ripristina' }).click();
    assert.equal(await list.count(), 2);
    await page.getByTestId('note-findings').getByText('Gonfiore al ginocchio sinistro').waitFor();
    await checks.locator('li[data-kind="objective_missing"]').waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Salva nella scheda' }).click();
    await page.getByRole('button', { name: 'Salvata nella scheda' }).waitFor({ timeout: 10000 });
    const saved = fake.state.tables.notes.at(-1);
    assert.match(saved.objective ?? '', /Gonfiore al ginocchio sinistro/, 'the restored finding is saved');
    assert.doesNotMatch(saved.objective ?? '', /Neer/, 'what stayed out is not saved');
    assert.doesNotMatch(saved.summary_for_patient ?? '', /vediamo/);
    assert.deepEqual((saved.exercises ?? []).map((e) => (typeof e === 'string' ? e : e.name)), ['Pendulum swing', 'Knee extension']);
  } finally {
    await ctx.close();
  }
});

test('the navbar "x" clears the current patient on the session page, and it stays cleared', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  await ctx.addInitScript(() => window.localStorage.setItem('phygo-lang', 'it'));
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(`${app.url}/dashboard/patients/${P}/session`);
    await page.getByRole('heading', { level: 1, name: 'Paziente Sintetico' }).waitFor({ timeout: 15000 });
    const clear = page.getByRole('button', { name: 'Deseleziona paziente attuale' }).first();
    await clear.waitFor({ timeout: 10000 });
    await clear.click();
    await page.waitForTimeout(1500);
    assert.equal(await page.getByRole('button', { name: 'Deseleziona paziente attuale' }).count(), 0, 'the patient is not set again by the page');
    assert.equal(await page.evaluate(() => window.sessionStorage.getItem('phygo_current_patient')), null);
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('the PHYGO World menu keeps its descriptions inside the panel', { skip }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'it-IT', reducedMotion: 'reduce' });
  await ctx.addInitScript(() => window.localStorage.setItem('phygo-lang', 'it'));
  const [name, value] = sessionCookie('tok-clin', U).split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  try {
    await page.goto(`${app.url}/dashboard/patients/${P}/session`);
    await page.getByRole('heading', { level: 1, name: 'Paziente Sintetico' }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'PHYGO World' }).first().click();
    const link = page.getByRole('link', { name: /Eventi/ }).first();
    await link.waitFor({ timeout: 5000 });
    const boxes = await link.evaluate((a) => {
      const panel = a.parentElement.getBoundingClientRect();
      return [...a.querySelectorAll('p')].map((p) => ({ right: p.getBoundingClientRect().right, panel: panel.right }));
    });
    for (const b of boxes) assert.ok(b.right <= b.panel + 0.5, `text ends at ${b.right}, panel at ${b.panel}`);
  } finally {
    await ctx.close();
  }
});
