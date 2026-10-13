// Accounts verified before documents were required, and later changes:
//   - sending the document with unchanged details does not interrupt access;
//   - changed details send the account back to review;
//   - the 60-day evidence deadline (professional_evidence_deadlines);
//   - confirmation, information requests and revocation by an administrator;
//   - patient isolation (no administrator bypass);
//   - write failures leave nothing half-applied;
//   - retention by category (off unless configured).
// Synthetic data only, against the fake Supabase; the database functions and
// rules themselves are tested on PostgreSQL by tests/sql/run.sh.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { verificationRpc, latestRequestId } from './support/verification-rpc.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);
let n = 0;
const person = (email) => ({ id: `0f000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, email, email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' });
const people = {
  vera: person('vera@test.invalid'), // verified before documents, sends the same details
  carlo: person('carlo@test.invalid'), // verified before documents, deadline passed
  dora: person('dora@test.invalid'), // verified before documents, revoked
  nina: person('nina@test.invalid'), // verified, asked for a clearer document
  ugo: person('ugo@test.invalid'), // verified, changes details
  alice: person('alice@test.invalid'), // another clinician with a patient
  tess: person('tess@test.invalid'), // on the transition list, not yet verified
  admin: person('admin@test.invalid'), // in PHYGO_ADMIN_EMAILS (tests/support/app.mjs)
};
const cookie = (who) => (who ? { cookie: sessionCookie(`tok-${who}`, people[who]) } : {});
const verified = (who, number) => ({
  id: people[who].id, practice_stage: 'professional', professional_status: 'verified', plan: 'free', display_name: who,
  registry_country: 'IT', registry_name: 'OFI Lombardia', registration_number: number,
});
const DAY = 24 * 60 * 60 * 1000;
const inDays = (d) => new Date(Date.now() + d * DAY).toISOString();

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    rpc: verificationRpc,
    users: Object.fromEntries(Object.entries(people).map(([k, u]) => [`tok-${k}`, u])),
    tables: {
      profiles: [verified('vera', '1001'), verified('carlo', '1002'), verified('dora', '1003'), verified('nina', '1004'), verified('ugo', '1005'), verified('alice', '1006'), verified('admin', '1007'),
        { ...verified('tess', '1008'), professional_status: 'pending' }],
      patients: [
        { id: 'p-carlo', user_id: people.carlo.id, patient_user_id: null, name: 'Synthetic patient C' },
        { id: 'p-dora', user_id: people.dora.id, patient_user_id: null, name: 'Synthetic patient D' },
        { id: 'p-alice', user_id: people.alice.id, patient_user_id: null, name: 'Synthetic patient A' },
        { id: 'p-vera', user_id: people.vera.id, patient_user_id: null, name: 'Synthetic patient V' },
      ],
      notes: [{ id: 'n-carlo', patient_id: 'p-carlo', user_id: people.carlo.id, assessment: 'synthetic' }],
      professional_evidence_deadlines: [
        { user_id: people.vera.id, due_at: inDays(60), added_at: inDays(0), added_by: 'owner', satisfied_at: null },
        { user_id: people.carlo.id, due_at: inDays(-1), added_at: inDays(-61), added_by: 'owner', satisfied_at: null },
      ],
      metabolic_profiles: [],
      patient_clinical_references: [],
      professional_transition_accounts: [{ user_id: people.tess.id, until: inDays(30), added_at: inDays(0), added_by: 'owner', note: null }],
      professional_verification_requests: [],
      professional_verification_reviews: [],
      ask_phygo_usage: [],
      knowledge_base: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url, port: 3424, env: { DAILY_API_KEY: 'test-daily-key' } });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const call = (base, method, path, who, body) =>
  fetch(`${base}${path}`, { method, headers: { 'content-type': 'application/json', ...cookie(who) }, body: body === undefined ? undefined : JSON.stringify(body) });
const PDF = Buffer.from('%PDF-1.4\n% synthetic registration certificate\n');
const submit = (who, fields = {}) => {
  const form = new FormData();
  const all = {
    legalFirstName: 'Synthetic', legalLastName: who, registryCountry: 'IT', registryName: 'OFI Lombardia',
    registrationNumber: fake.state.tables.profiles.find((p) => p.id === people[who].id).registration_number,
    declarationAccepted: 'true', declarationVersion: '2026-10-12.v1', ...fields,
  };
  for (const [k, v] of Object.entries(all)) form.append(k, String(v));
  form.append('document', new Blob([PDF], { type: 'application/pdf' }), 'certificate.pdf');
  return fetch(`${app.url}/api/profile/verification`, { method: 'POST', headers: cookie(who), body: form });
};
// Like the administration page, a decision names the request on screen: the latest one.
const admin = (body) =>
  call(app.url, 'POST', '/api/admin/verification', 'admin', body.decision && !('requestId' in body) ? { requestId: latestRequestId(fake.state, body.userId), ...body } : body);
const profileOf = (who) => fake.state.tables.profiles.find((p) => p.id === people[who].id);
const latestOf = (who) => [...fake.state.tables.professional_verification_requests].reverse().find((r) => r.user_id === people[who].id);
const historyOf = (who) => fake.state.tables.professional_verification_reviews.filter((r) => r.user_id === people[who].id);
const deadlineOf = (who) => fake.state.tables.professional_evidence_deadlines.find((d) => d.user_id === people[who].id);
const own = async (who) => (await (await call(app.url, 'GET', '/api/profile/verification', who)).json()).verification;
// Clinical AI answers 401/403 when locked; otherwise it reaches the (refusing) OpenAI stand-in.
const clinicalAiOpen = async (who) => ![401, 403].includes((await call(app.url, 'POST', '/api/generate-note', who, { transcript: 'synthetic', lang: 'en' })).status);
const videoStatus = async (who, patientId) => (await call(app.url, 'POST', '/api/video-call/create-room', who, { patientId })).status;
const snapshot = () => JSON.stringify([fake.state.tables.profiles, fake.state.tables.professional_verification_requests, fake.state.tables.professional_verification_reviews, fake.state.tables.professional_evidence_deadlines]);

test('a verified account sending the same name, number and Order stays verified, without interruption', async () => {
  const before = await own('vera');
  assert.equal(before.status, 'verified');
  assert.equal(before.canManagePatients, true);
  assert.ok(before.evidenceDueAt, 'the deadline is shown to the user');
  assert.equal(before.evidenceOverdue, false);
  assert.equal(await clinicalAiOpen('vera'), true);

  const res = await submit('vera', { registryName: 'ofi  lombardia' }); // spaces and case do not count
  assert.equal(res.status, 200);
  const v = (await res.json()).verification;
  assert.equal(v.status, 'verified', 'account status unchanged');
  assert.equal(v.request.status, 'pending', 'the document request has its own status');
  assert.equal(v.request.whileVerified, true);
  assert.equal(v.canManagePatients, true);
  assert.equal(profileOf('vera').professional_status, 'verified');
  // Clinical functions keep working while the document is reviewed.
  assert.equal(await clinicalAiOpen('vera'), true);
  assert.equal(await videoStatus('vera', 'p-vera'), 200);

  // The administrator finds it among verified accounts with a document to check.
  const list = await (await call(app.url, 'GET', '/api/admin/verification?status=reconfirm', 'admin')).json();
  const row = list.requests.find((x) => x.id === people.vera.id);
  assert.ok(row, 'listed for confirmation');
  assert.equal(row.request.submitted_while_verified, true);
  assert.equal(row.evidenceDeadline.overdue, false);
  assert.equal((await call(app.url, 'GET', '/api/admin/verification?status=pending', 'admin')).ok, true);
  assert.ok(!(await (await call(app.url, 'GET', '/api/admin/verification?status=pending', 'admin')).json()).requests.some((x) => x.id === people.vera.id));

  // Confirmation still needs the document and a match on the official register.
  const refused = await admin({ userId: people.vera.id, decision: 'verified' });
  assert.equal(refused.status, 409);
  assert.equal((await refused.json()).code, 'registry_not_matched');
  assert.equal((await admin({ action: 'registry_check', requestId: latestOf('vera').id, result: 'match' })).status, 200);
  const confirmed = await admin({ userId: people.vera.id, decision: 'verified' });
  assert.equal(confirmed.status, 200);
  assert.equal((await confirmed.json()).outcome.action, 'confirmed');
  assert.equal(profileOf('vera').professional_status, 'verified');
  assert.equal(latestOf('vera').status, 'verified');
  assert.ok(deadlineOf('vera').satisfied_at, 'the deadline is satisfied');
  assert.deepEqual(historyOf('vera').map((h) => h.action), ['registry_check', 'confirmed']);
  const after = await own('vera');
  assert.equal(after.evidenceDueAt, null);
});

test('changed details (number or legal name) send a verified account back to review', async () => {
  assert.equal(await clinicalAiOpen('ugo'), true);
  const res = await submit('ugo', { registrationNumber: '9999' });
  assert.equal((await res.json()).verification.status, 'pending');
  assert.equal(profileOf('ugo').registration_number, '9999');
  assert.equal(latestOf('ugo').submitted_while_verified, false);
  assert.equal(await clinicalAiOpen('ugo'), false);
  // Approved again with the new number, then a different legal name also needs a new review.
  assert.equal((await admin({ action: 'registry_check', requestId: latestOf('ugo').id, result: 'match' })).status, 200);
  assert.equal((await admin({ userId: people.ugo.id, decision: 'verified' })).status, 200);
  assert.equal(await clinicalAiOpen('ugo'), true);
  const renamed = await submit('ugo', { registrationNumber: '9999', legalFirstName: 'Other' });
  assert.equal((await renamed.json()).verification.status, 'pending');
  assert.equal(await clinicalAiOpen('ugo'), false);
});

test('after the 60-day deadline: clinical functions stop, account and patient data stay', async () => {
  const v = await own('carlo');
  assert.equal(v.status, 'verified', 'the verified status keeps its meaning');
  assert.equal(v.evidenceOverdue, true);
  assert.equal(v.canManagePatients, false);
  const ai = await call(app.url, 'POST', '/api/generate-note', 'carlo', { transcript: 'synthetic', lang: 'en' });
  assert.equal(ai.status, 403);
  assert.equal((await ai.json()).code, 'verification_evidence_overdue');
  assert.equal(await videoStatus('carlo', 'p-carlo'), 403);
  // Nothing is deleted.
  assert.ok(fake.state.tables.patients.some((p) => p.id === 'p-carlo'));
  assert.ok(fake.state.tables.notes.some((x) => x.id === 'n-carlo'));
  assert.equal(profileOf('carlo').professional_status, 'verified');

  // Sending the document does not unlock anything by itself.
  assert.equal((await submit('carlo')).status, 200);
  assert.equal(profileOf('carlo').professional_status, 'verified');
  assert.equal(await clinicalAiOpen('carlo'), false);
  // The administrator's confirmation does.
  assert.equal((await admin({ action: 'registry_check', requestId: latestOf('carlo').id, result: 'match' })).status, 200);
  assert.equal((await admin({ userId: people.carlo.id, decision: 'verified' })).status, 200);
  assert.ok(deadlineOf('carlo').satisfied_at);
  assert.equal(await clinicalAiOpen('carlo'), true);
  assert.equal((await own('carlo')).canManagePatients, true);
});

test('the deadline check fails closed when it cannot be read', async () => {
  await fetch(`${fake.url}/__control/fail?table=professional_evidence_deadlines`);
  try {
    const res = await call(app.url, 'POST', '/api/generate-note', 'alice', { transcript: 'synthetic', lang: 'en' });
    assert.equal(res.status, 503);
    assert.equal((await own('alice')).canManagePatients, false);
  } finally {
    await fetch(`${fake.url}/__control/fail`);
  }
  assert.equal(await clinicalAiOpen('alice'), true);
});

test('an administrator can ask a verified account for information without interrupting it', async () => {
  assert.equal((await submit('nina')).status, 200);
  assert.equal((await admin({ userId: people.nina.id, decision: 'needs_info', message: 'Please send a clearer copy.' })).status, 200);
  const v = await own('nina');
  assert.equal(v.status, 'verified');
  assert.equal(v.request.status, 'needs_info');
  assert.equal(v.request.message, 'Please send a clearer copy.');
  assert.equal(await clinicalAiOpen('nina'), true);
});

test('revocation of an account verified before documents: recorded, access removed, data kept', async () => {
  assert.equal(await clinicalAiOpen('dora'), true);
  assert.equal((await admin({ userId: people.dora.id, decision: 'rejected', message: 'Verification revoked.' })).status, 400, 'a category is required');
  const res = await admin({ userId: people.dora.id, decision: 'rejected', message: 'Verification revoked.', rejectionCategory: 'not_in_register', internalNote: 'Not in the register on 13 Oct.' });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).outcome.action, 'revoked');
  assert.equal(profileOf('dora').professional_status, 'rejected');
  const [entry] = historyOf('dora');
  assert.equal(entry.action, 'revoked');
  assert.equal(entry.request_id, null, 'no request: the entry is tied to the account');
  assert.equal(entry.rejection_category, 'not_in_register');
  assert.equal(await clinicalAiOpen('dora'), false);
  assert.equal(await videoStatus('dora', 'p-dora'), 403);
  assert.ok(fake.state.tables.patients.some((p) => p.id === 'p-dora'), 'patient data kept');
  const v = await own('dora');
  assert.equal(v.message, 'Verification revoked.');
  assert.ok(!JSON.stringify(v).includes('Not in the register on 13 Oct.'), 'internal note not shown to the user');
});

test('a rejection ends temporary access from the transition list; a new request does not bring it back', async () => {
  assert.equal(await clinicalAiOpen('tess'), true, 'on the transition list while pending');
  assert.equal((await submit('tess')).status, 200);
  const res = await admin({ userId: people.tess.id, decision: 'rejected', message: 'Not found in the register.', rejectionCategory: 'not_in_register' });
  assert.equal(res.status, 200);
  assert.equal(await clinicalAiOpen('tess'), false);
  assert.ok(!fake.state.tables.professional_transition_accounts.some((t) => t.user_id === people.tess.id), 'removed from the transition list');
  // Sending a new request puts the status back to pending, but not the temporary access.
  assert.equal((await submit('tess')).status, 200);
  assert.equal(profileOf('tess').professional_status, 'pending');
  assert.equal(await clinicalAiOpen('tess'), false);
});

test('a decision is refused when a newer request has arrived since the page was loaded', async () => {
  const shown = latestOf('tess').id;
  assert.equal((await submit('tess')).status, 200, 'a newer request arrives');
  const before = snapshot();
  const stale = await admin({ userId: people.tess.id, requestId: shown, decision: 'needs_info', message: 'Please send a clearer copy.' });
  assert.equal(stale.status, 409);
  assert.equal((await stale.json()).code, 'stale');
  assert.equal(snapshot(), before, 'nothing was written');
  const missing = await call(app.url, 'POST', '/api/admin/verification', 'admin', { userId: people.tess.id, decision: 'needs_info', message: 'x' });
  assert.equal(missing.status, 400, 'the request on screen must be named (null when there is none)');
  assert.equal((await admin({ userId: people.tess.id, decision: 'needs_info', message: 'Please send a clearer copy.' })).status, 200, 'the latest request can be decided');
});

test('patient isolation: administrator status gives no access to other clinicians’ patients', async () => {
  const before = fake.state.requests.length;
  assert.equal((await call(app.url, 'GET', '/api/admin/verification?status=verified', 'admin')).status, 200);
  const adminCalls = fake.state.requests.slice(before);
  assert.ok(!adminCalls.some((r) => /\/rest\/v1\/(patients|notes|appointments|metabolic_profiles)$/.test(r.path)), 'the console reads no patient data');
  assert.equal(await videoStatus('admin', 'p-alice'), 404);
  assert.equal((await call(app.url, 'GET', '/api/metabolic/save?patientId=p-alice', 'admin')).status, 404);
  assert.equal(await videoStatus('vera', 'p-carlo'), 404, 'verified clinicians see only their own patients');
});

test('a failed write leaves no half-applied decision or submission', async () => {
  // Decision: the database function is one transaction; if it fails, nothing changed.
  assert.equal((await submit('alice')).status, 200);
  const state = snapshot();
  await fetch(`${fake.url}/__control/fail?table=rpc:verification_decide`);
  try {
    const res = await admin({ userId: people.alice.id, decision: 'rejected', message: 'x', rejectionCategory: 'other' });
    assert.equal(res.status, 503);
    assert.match((await res.json()).error, /nothing was changed/);
  } finally {
    await fetch(`${fake.url}/__control/fail`);
  }
  assert.equal(snapshot(), state);
  await fetch(`${fake.url}/__control/fail?table=rpc:verification_record_check`);
  try {
    assert.equal((await admin({ action: 'registry_check', requestId: latestOf('alice').id, result: 'match' })).status, 503);
  } finally {
    await fetch(`${fake.url}/__control/fail`);
  }
  assert.equal(snapshot(), state);
  // Submission: the uploaded file is removed and nothing is recorded.
  const files = fake.state.storage.size;
  await fetch(`${fake.url}/__control/fail?table=rpc:verification_submit`);
  try {
    assert.equal((await submit('alice')).status, 503);
  } finally {
    await fetch(`${fake.url}/__control/fail`);
  }
  assert.equal(fake.state.storage.size, files);
  assert.equal(snapshot(), state);
  assert.equal(profileOf('alice').professional_status, 'verified');
});

test('retention by category: off by default; when configured, files are removed and confirmed gone', async () => {
  const cron = (base) => fetch(`${base}/api/cron/verification-retention`, { headers: { authorization: 'Bearer test-cron-secret' } });
  const old = (d) => new Date(Date.now() - d * DAY).toISOString();
  // vera: an older request decided long ago (with its note), and the latest approval.
  const vera = latestOf('vera');
  const oldId = '0f100000-0000-4000-8000-000000000001';
  fake.state.tables.professional_verification_requests.push({ ...vera, id: oldId, status: 'superseded', submitted_at: old(800), decided_at: old(800), document_path: null });
  fake.state.tables.professional_verification_reviews.push({ id: 'old-entry', user_id: people.vera.id, request_id: oldId, action: 'registry_check', internal_note: 'old note', note_redacted_at: null, reviewer: 'admin@test.invalid', created_at: old(800) });
  vera.decided_at = old(31);
  const path = vera.document_path;
  const noteEntry = historyOf('vera').find((h) => h.action === 'registry_check' && h.request_id === vera.id);
  noteEntry.internal_note = 'checked on the register';
  noteEntry.created_at = old(400);

  assert.deepEqual(await (await cron(app.url)).json(), { configured: false, deleted: 0 });
  assert.ok(fake.state.storage.has(`verification-documents/${path}`));
  const on = await startApp({
    fakeUrl: fake.url, port: 3425,
    env: { VERIFICATION_DOCUMENT_RETENTION_DAYS: '30', VERIFICATION_NOTE_RETENTION_DAYS: '365', VERIFICATION_HISTORY_RETENTION_DAYS: '730' },
  });
  try {
    const report = await (await cron(on.url)).json();
    assert.equal(report.configured, true);
    assert.ok(report.deleted >= 1);
    assert.equal(report.failed, 0);
    assert.ok(report.notesRemoved >= 1);
    assert.equal(report.requestsRemoved, 1);
  } finally {
    await on.stop();
  }
  // Document: gone from storage, and the request keeps only what is needed.
  assert.equal(fake.state.storage.has(`verification-documents/${path}`), false);
  assert.ok(fake.state.requests.some((r) => r.path === '/storage/v1/object/list/verification-documents'), 'absence confirmed by listing the folder');
  const kept = latestOf('vera');
  assert.equal(kept.document_path, null);
  assert.ok(kept.document_deleted_at);
  assert.equal(kept.status, 'verified');
  assert.equal(profileOf('vera').professional_status, 'verified');
  // Note removed, entry kept.
  assert.equal(noteEntry.internal_note, null);
  assert.ok(noteEntry.note_redacted_at);
  assert.equal(noteEntry.action, 'registry_check');
  // The old request is gone; the latest approval stays.
  assert.ok(!fake.state.tables.professional_verification_requests.some((r) => r.id === oldId));
  assert.ok(fake.state.tables.professional_verification_requests.some((r) => r.id === kept.id));
});
