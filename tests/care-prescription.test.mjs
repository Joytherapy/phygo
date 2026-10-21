// One prescription, three outputs: the exercises reviewed in the note become
// the home programme and the patient's printable programme.
//   - lib/care/program.ts: "N times a week" as days, days kept in item rows;
//   - lib/care/fromNote.ts against the fake Supabase: with no programme one is
//     created from the note (dose and days copied, check-in added); with one in
//     use the note's dose updates the same exercise, a new exercise is added,
//     nothing is removed, a note without a dose leaves the dose as it was;
//   - lib/care/programPdf.ts: Latin-1 text and the line under each exercise;
//   - lib/care/patientBooklet.ts: the booklet built from a note holds summary,
//     recovery path with "you are here", exercises and evidence, and none of
//     the clinical note or the protocol's red flags;
//   - /api/exercise-search: Exercises-section results first (with video) for a
//     signed-in user, none without a session;
//   - /api/care/exercise-media: only the clinician who owns the patient;
//   - in a real browser: per-exercise days in the editor, and the patient PDF.
// Synthetic people, exercises and files only. The browser part is skipped
// when Playwright/Chromium are not installed on this machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs, { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54807);
const APP_PORT = Number(process.env.CARE_PRESCRIPTION_APP_PORT ?? 3807);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let playwright = null;
for (const [base, name] of [[process.cwd() + '/', 'playwright'], ['/opt/node22/lib/node_modules/', 'playwright'], ['/opt/node-tools/', 'playwright-core']]) {
  try {
    playwright = createRequire(base)(name);
    break;
  } catch {}
}
const skip = !playwright || !fs.existsSync(CHROMIUM) ? 'Playwright/Chromium not available' : false;

let C; // lib/care/program.ts
let F; // lib/care/fromNote.ts
let P; // lib/care/programPdf.ts
let B; // lib/care/patientBooklet.ts
let S; // lib/care/clinicianSignature.ts
before(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-care-rx-'));
  const out = (f, src) => writeFileSync(join(dir, `${f}.mjs`), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
  const read = (f) => readFileSync(new URL(`../lib/care/${f}.ts`, import.meta.url), 'utf8');
  try {
    out('program', read('program'));
    out('fromNote', read('fromNote').replace("from './program'", "from './program.mjs'"));
    // jsPDF is handed in from here (the transpiled files live outside node_modules' reach).
    globalThis.__jsPDF = (await import('jspdf')).jsPDF;
    out('programPdf', read('programPdf').replace(/^import jsPDF from 'jspdf'$/m, 'const jsPDF = globalThis.__jsPDF').replace("from './program'", "from './program.mjs'"));
    out('patientBooklet', read('patientBooklet').replace("from './programPdf'", "from './programPdf.mjs'").replace("from './program'", "from './program.mjs'"));
    C = await import(join(dir, 'program.mjs'));
    F = await import(join(dir, 'fromNote.mjs'));
    P = await import(join(dir, 'programPdf.mjs'));
    B = await import(join(dir, 'patientBooklet.mjs'));
    out('clinicianSignature', read('clinicianSignature'));
    S = await import(join(dir, 'clinicianSignature.mjs'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('times a week become days the clinician can change; days are kept in item rows', () => {
  assert.deepEqual(C.weekdaysForFrequency(3), [1, 3, 5]);
  assert.deepEqual(C.weekdaysForFrequency(2), [2, 5]);
  assert.deepEqual(C.weekdaysForFrequency(7), [], 'every day');
  assert.deepEqual(C.weekdaysForFrequency(null), []);
  assert.deepEqual(C.cleanWeekdays([5, 1, 1, 9, 'x', 3]), [1, 3, 5]);
  const [d] = C.draftFromNoteExercises([{ name: 'Bridge', dosing: { sets: 3, reps: 10, frequency_per_week: 3 } }], 'n1');
  assert.deepEqual(d.weekdays, [1, 3, 5]);
  assert.deepEqual(C.itemRow(d, 'p', 0).weekdays, [1, 3, 5]);
  assert.deepEqual(C.itemRow({ ...C.blankDraft(), kind: 'checkin', title: 'c', weekdays: [1] }, 'p', 0).weekdays, [], 'the check-in is daily');
  const lib = C.draftFromNoteExercises([{ name: 'Squat', provider: 'exercises', provider_id: 'ex-1', dosing: {} }], 'n1')[0];
  assert.deepEqual([lib.exercise_source, lib.exercise_ref], ['exercises', 'ex-1'], 'a note exercise from the Exercises section keeps its reference (and so its video)');
});

test('a note without a dose does not wipe the dose already in the programme', () => {
  assert.deepEqual(F.doseUpdate({ ...C.blankDraft(), title: 'x' }), {});
  assert.deepEqual(F.doseUpdate({ ...C.blankDraft(), title: 'x', sets: 2, weekdays: [2] }), { sets: 2, reps: null, duration_seconds: null, weekdays: [2] });
});

test('PDF text: Latin-1 only, and the line under each exercise', () => {
  assert.equal(P.pdfText('Ponte – 3 × 10 “lento” ✓'), 'Ponte - 3 x 10 "lento" ');
  const t = { pdfTimesPerDay: (n) => `${n} volte al giorno`, everyDay: 'Tutti i giorni' };
  const names = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  assert.equal(P.itemSummary({ sets: 3, reps: 10, duration_seconds: null, times_per_day: 2, weekdays: [1, 3, 5] }, t, names), '3 × 10 · 2 volte al giorno · Lun, Mer, Ven');
  assert.equal(P.itemSummary({ sets: null, reps: null, duration_seconds: 1200, times_per_day: 1, weekdays: [] }, t, names), '20 min · 1 volte al giorno · Tutti i giorni');
});

test('the patient booklet: summary, path with "you are here", exercises, evidence; nothing clinical', async () => {
  const { CARE_STRINGS } = await importStrings();
  const it = CARE_STRINGS.it;
  const phases = B.bookletPhases([
    { id: 'b', phase_number: 2, phase_name: 'Synthetic strength phase', typical_duration: '3-6 weeks', phase_goals: 'Build strength', phase_exercises: 'Clinician list', criteria_to_progress: 'Pain under 3/10' },
    { id: 'a', phase_number: 1, phase_name: 'Synthetic calm phase', typical_duration: '0-2 weeks', phase_goals: 'Calm the pain', criteria_to_progress: 'Walk without pain' },
    { phase_number: 3 },
  ]);
  assert.deepEqual(phases.map((p) => p.number), [1, 2], 'ordered; a phase without a name is left out');
  const papers = B.bookletPapers([{ title: 'Synthetic trial of exercise', journal: 'Synthetic Journal', publication_date: '2024-05-01', evidence_strength: 'moderate', why_it_matters: 'Exercise helps synthetic knees' }, { title: '' }]);
  assert.deepEqual(papers.map((p) => [p.title, p.year]), [['Synthetic trial of exercise', '2024']]);
  const exercises = B.bookletExercises([
    { internal_id: 'e1', name: 'Synthetic squat', instructions: ['Sit back', 'Stand up'], dosing: { sets: 3, reps: 10, frequency_per_week: 3, notes: 'Slowly' } },
    'Synthetic walk',
  ], it.plan, it.clinician.weekdays, new Map());
  assert.deepEqual(exercises.map((e) => [e.title, e.summary, e.steps]), [['Synthetic squat', '3 × 10 · Lun, Mer, Ven', '1. Sit back\n2. Stand up'], ['Synthetic walk', 'Tutti i giorni', '']]);

  const build = (sections) => B.buildPatientBooklet({
    patientName: 'Synthetic Patient', date: '2026-10-20', summary: 'Your synthetic knee is irritated; we start gently.',
    phases, currentPhase: 1, exercises, papers, guideline: { name: 'Synthetic knee pain', source: 'Synthetic guideline', date: '2023' },
    sections, appUrl: 'https://example.invalid/my-phygo/home', t: it.booklet, plan: it.plan,
  }).output();
  const all = build({ summary: true, path: true, exercises: true, evidence: true });
  assert.equal(all.slice(0, 5), '%PDF-');
  for (const text of ['Il tuo percorso', 'Cosa abbiamo visto oggi', 'Your synthetic knee is irritated', 'Il tuo percorso di recupero', 'Synthetic calm phase', 'Sei qui', 'Walk without pain', 'I tuoi esercizi', 'Synthetic squat', 'Su cosa si basa il tuo programma', 'Synthetic trial of exercise', 'Synthetic guideline', 'Quando contattarmi', 'contatta il tuo fisioterapista']) {
    assert.ok(all.includes(text), `the booklet shows: ${text}`);
  }
  assert.ok(!all.includes('Clinician list'), 'the protocol\'s clinician exercise list stays out');
  const some = build({ summary: true, path: false, exercises: true, evidence: false });
  assert.ok(!some.includes('Synthetic calm phase') && !some.includes('Synthetic trial of exercise'), 'sections the clinician unticks stay out');
  assert.ok(some.includes('Synthetic squat'));

  // Signed by the clinician: header, signature and footer; never an e-mail address.
  const signature = S.signatureFrom({ display_name: ' Dott.ssa Synthetic Clinician ', credentials: [{ id: '1', label: 'Fisioterapista OMPT' }, { label: '' }, 'MSc'] });
  assert.deepEqual(signature, { name: 'Dott.ssa Synthetic Clinician', credentials: 'Fisioterapista OMPT, MSc' });
  assert.equal(S.signatureFrom({ display_name: '' }, ''), null);
  assert.deepEqual(S.signatureFrom(null, 'Meta Name'), { name: 'Meta Name', credentials: '' });
  const signed = B.buildPatientBooklet({
    patientName: 'Synthetic Patient', clinician: signature, date: '2026-10-20', summary: 'x', phases: [], currentPhase: null, exercises, papers: [], guideline: null,
    sections: { summary: true, path: true, exercises: true, evidence: true }, appUrl: 'https://example.invalid/my-phygo/home', t: it.booklet, plan: it.plan,
  }).output();
  for (const text of ['A cura di Dott.ssa Synthetic Clinician', 'Il tuo fisioterapista', 'Fisioterapista OMPT, MSc', 'Preparato da Dott.ssa Synthetic Clinician con PHYGO']) {
    assert.ok(signed.includes(text), `signed booklet shows: ${text}`);
  }
});

async function importStrings() {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-care-strings-'));
  try {
    const src = readFileSync(new URL('../lib/i18n/careStrings.ts', import.meta.url), 'utf8');
    writeFileSync(join(dir, 'careStrings.mjs'), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
    return await import(join(dir, 'careStrings.mjs'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- against the fake

const user = (n) => ({ id: `8f700000-0000-4000-8000-00000000000${n}`, email: `rx${n}@test.invalid`, email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' });
const CLIN = user(1);
const PAT = user(2);
const OTHER = user(3);
const PID = '8f710000-0000-4000-8000-000000000001';
const EX = (n) => `8f720000-0000-4000-8000-00000000000${n}`;

let fake;
let app;
let browser;
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: { 'tok-clin': CLIN, 'tok-pat': PAT, 'tok-other': OTHER },
    tables: {
      profiles: [
        { id: CLIN.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free', preferred_language: 'it' },
        { id: PAT.id, plan: 'free', preferred_language: 'it' },
        { id: OTHER.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free', preferred_language: 'it' },
      ],
      patients: [{ id: PID, user_id: CLIN.id, patient_user_id: PAT.id, name: 'Synthetic Patient', first_name: 'Synthetic', last_name: 'Patient', age: 40, main_condition: 'Synthetic knee pain', created_at: '2026-08-01T09:00:00Z' }],
      exercises: [
        { id: EX(1), external_id: 'Squat', source: 'exercise_animatic', archived_at: null, primary_muscle: 'quadriceps', body_region: 'legs', equipment: [], tags: [] },
        { id: EX(2), external_id: 'Wall squat', source: 'exercise_animatic', archived_at: null, primary_muscle: 'quadriceps', body_region: 'legs', equipment: [], tags: [] },
        { id: EX(3), external_id: 'Old squat', source: 'exercise_animatic', archived_at: '2026-01-01T00:00:00Z', primary_muscle: 'quadriceps', body_region: 'legs', equipment: [], tags: [] },
      ],
      exercise_translations: [
        { exercise_id: EX(1), lang: 'en', name: 'Synthetic squat', instructions: ['Sit back', 'Stand up'], tips: null },
        { exercise_id: EX(2), lang: 'en', name: 'Synthetic wall squat hold', instructions: ['Lean on the wall'], tips: null },
        { exercise_id: EX(3), lang: 'en', name: 'Synthetic squat archived', instructions: [], tips: null },
      ],
      exercise_assets: [
        { exercise_id: EX(1), asset_type: 'video', variant: null, is_default: true, storage_bucket: 'exercise-media', storage_key: 'rx1/video.mp4' },
        { exercise_id: EX(1), asset_type: 'image_start', variant: null, is_default: true, storage_bucket: 'exercise-media', storage_key: 'rx1/start.jpg' },
      ],
      exercise_cache: [],
      notes: [], patient_details: [], patient_clinical_references: [], appointments: [], video_calls: [], metabolic_profiles: [], professional_transition_accounts: [],
      care_programs: [], care_program_items: [], care_activity_logs: [], symptom_checkins: [], care_attention_rules: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url, port: APP_PORT });
  if (!skip) browser = await playwright.chromium.launch({ executablePath: CHROMIUM });
});
after(async () => {
  await browser?.close();
  await app?.stop();
  await fake?.close();
});

const cookieFor = (who) => sessionCookie(`tok-${who}`, { clin: CLIN, pat: PAT, other: OTHER }[who]);
const get = async (path, who) => {
  const res = await fetch(`${app.url}${path}`, { headers: who ? { cookie: cookieFor(who) } : {} });
  return { status: res.status, body: await res.json().catch(() => null) };
};

test('from the note to the home programme: created, then updated without losing anything', async () => {
  const db = createClient(fake.url, 'test-service-key', { auth: { persistSession: false } });
  const note1 = [
    { name: 'Synthetic squat', provider: 'exercises', provider_id: EX(1), instructions: ['Sit back'], dosing: { sets: 3, reps: 10, frequency_per_week: 3, notes: 'Slowly' } },
    { name: 'Synthetic walk', provider: 'custom', provider_id: null, dosing: { duration_seconds: 1200 } },
  ];
  const first = await F.syncProgrammeFromNote(db, { patientId: PID, noteId: 'note-1', exercises: note1, title: 'Programma a casa', checkinTitle: 'Check-in' });
  assert.deepEqual([first.kind, first.added], ['created', 2]);
  const program = fake.state.tables.care_programs.find((p) => p.patient_id === PID);
  assert.deepEqual([program.status, program.source_note_id], ['active', 'note-1']);
  const rows = () => fake.state.tables.care_program_items.filter((i) => i.program_id === program.id);
  assert.deepEqual(rows().map((i) => [i.kind, i.title, i.exercise_source, i.exercise_ref, i.sets, i.reps, i.duration_seconds, i.weekdays]), [
    ['exercise', 'Synthetic squat', 'exercises', EX(1), 3, 10, null, [1, 3, 5]],
    ['exercise', 'Synthetic walk', 'note', 'note-1#1', null, null, 1200, []],
    ['checkin', 'Check-in', null, null, null, null, null, []],
  ]);

  // Next session: more reps for the squat, a new exercise, the walk not mentioned.
  const note2 = [
    { name: 'Synthetic squat', provider: 'exercises', provider_id: EX(1), dosing: { sets: 3, reps: 15, frequency_per_week: 2 } },
    { name: 'Synthetic wall squat hold', provider: 'exercises', provider_id: EX(2), dosing: { duration_seconds: 30 } },
  ];
  const second = await F.syncProgrammeFromNote(db, { patientId: PID, noteId: 'note-2', exercises: note2, title: 'x', checkinTitle: 'x' });
  assert.deepEqual([second.kind, second.added, second.changed], ['updated', 1, 1]);
  assert.equal(fake.state.tables.care_programs.filter((p) => p.patient_id === PID).length, 1, 'still one programme');
  const squat = rows().find((i) => i.exercise_ref === EX(1));
  assert.deepEqual([squat.sets, squat.reps, squat.weekdays, squat.dose_notes], [3, 15, [2, 5], 'Slowly'], 'new dose and days; the note left the notes out, so they stay');
  assert.ok(rows().some((i) => i.title === 'Synthetic walk' && i.active), 'an exercise not in the new note is not removed');
  assert.ok(rows().some((i) => i.exercise_ref === EX(2) && i.duration_seconds === 30));
  assert.equal(fake.state.tables.care_programs[0].source_note_id, 'note-2');

  // A note with the same exercise and no dose changes nothing.
  const third = await F.syncProgrammeFromNote(db, { patientId: PID, noteId: 'note-3', exercises: ['Synthetic walk'], title: 'x', checkinTitle: 'x' });
  assert.deepEqual([third.kind, third.added, third.changed], ['updated', 0, 0]);
  assert.equal(rows().find((i) => i.title === 'Synthetic walk').duration_seconds, 1200);

  assert.equal((await F.syncProgrammeFromNote(db, { patientId: PID, noteId: null, exercises: [], title: 'x', checkinTitle: 'x' })).kind, 'empty');
  fake.state.missingTables.add('care_programs');
  try {
    assert.equal((await F.syncProgrammeFromNote(db, { patientId: PID, noteId: null, exercises: ['A'], title: 'x', checkinTitle: 'x' })).kind, 'missing');
  } finally {
    fake.state.missingTables.delete('care_programs');
  }
});

test('note search: Exercises-section results first, with video, for signed-in users only', async () => {
  const signedIn = await get('/api/exercise-search?q=squat&lang=en', 'clin');
  assert.equal(signedIn.status, 200);
  const lib = signedIn.body.exercises.filter((e) => e.provider === 'exercises');
  assert.deepEqual(lib.map((e) => e.provider_id), [EX(1), EX(2)], 'shortest match first; the archived exercise is left out');
  assert.match(lib[0].media.video_url, /\/storage\/v1\/object\/sign\/exercise-media\/rx1\/video\.mp4/);
  assert.deepEqual(lib[0].instructions, ['Sit back', 'Stand up']);
  const anonymous = await get('/api/exercise-search?q=squat&lang=en', null);
  assert.equal(anonymous.body.exercises.filter((e) => e.provider === 'exercises').length, 0);
});

test('clinician media for the printable programme: owner only', async () => {
  assert.equal((await get(`/api/care/exercise-media?patient=${PID}`, null)).status, 401);
  assert.equal((await get('/api/care/exercise-media?patient=not-an-id', 'clin')).status, 400);
  assert.equal((await get(`/api/care/exercise-media?patient=${PID}`, 'other')).status, 404, 'another clinician');
  assert.equal((await get(`/api/care/exercise-media?patient=${PID}`, 'pat')).status, 404, 'the patient uses their own endpoint');
  const owner = await get(`/api/care/exercise-media?patient=${PID}`, 'clin');
  assert.equal(owner.status, 200);
  assert.deepEqual(Object.keys(owner.body.media), [EX(1)]);
  assert.match(owner.body.media[EX(1)].image_url, /rx1\/start\.jpg/);
});

test('the clinician sets days per exercise and downloads the patient PDF', { skip }, async () => {
  const ctx = await browser.newContext({ locale: 'it-IT', viewport: { width: 1280, height: 1000 }, acceptDownloads: true });
  await ctx.addInitScript(() => window.localStorage.setItem('phygo-lang', 'it'));
  const [name, value] = cookieFor('clin').split(/=(.*)/s);
  await ctx.addCookies([{ name, value, url: app.url }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(`${app.url}/dashboard/patients/${PID}`);
    const card = page.getByTestId('care-program-card');
    await card.getByTestId('care-program-items').waitFor({ timeout: 20000 });
    assert.match(await card.getByTestId('care-program-items').innerText(), /Synthetic squat[^\n]*Mar, Ven/);

    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), card.getByRole('button', { name: 'PDF per il paziente' }).click()]);
    const file = await download.path();
    const pdf = readFileSync(file);
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    const text = pdf.toString('latin1');
    assert.match(text, /Il tuo programma a casa/);
    assert.match(text, /Synthetic squat/);
    assert.doesNotMatch(text, /Synthetic knee pain/, 'no clinical content in the patient PDF');

    await card.getByRole('button', { name: 'Modifica' }).click();
    const first = card.getByTestId('care-program-draft-item').first();
    const days = first.getByTestId('care-program-item-days');
    assert.equal(await days.getByRole('button', { name: 'Giorni Mar' }).getAttribute('aria-pressed'), 'true');
    await days.getByRole('button', { name: 'Giorni Sab' }).click();
    await card.getByRole('button', { name: 'Salva programma' }).click();
    await card.getByRole('status').filter({ hasText: 'Programma salvato.' }).waitFor({ timeout: 10000 });
    assert.deepEqual(fake.state.tables.care_program_items.find((i) => i.exercise_ref === EX(1) && i.active).weekdays, [2, 5, 6]);
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});
