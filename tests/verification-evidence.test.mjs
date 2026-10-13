// Professional verification with evidence (sql/2026-10_verification_evidence_PROPOSED.sql):
// the registration document, the administrator's check on the official
// register, decisions and their history, document access and retention.
// Synthetic data only, against the fake Supabase (tests/support/fake-supabase.mjs);
// the database rules themselves (RLS, grants, private bucket) are covered by
// tests/sql/run.sh.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { verificationRpc, latestRequestId } from './support/verification-rpc.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);
let n = 0;
const person = (email) => ({ id: `0e000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, email, email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' });
const people = {
  alice: person('alice@test.invalid'),
  bob: person('bob@test.invalid'),
  mallory: person('mallory@test.invalid'),
  admin: person('admin@test.invalid'), // in PHYGO_ADMIN_EMAILS (tests/support/app.mjs)
};
const cookie = (who) => (who ? { cookie: sessionCookie(`tok-${who}`, people[who]) } : {});
const profile = (who, status) => ({ id: people[who].id, practice_stage: 'professional', professional_status: status, plan: 'free', display_name: who });

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({
    rpc: verificationRpc,
    port: FAKE_PORT,
    users: Object.fromEntries(Object.entries(people).map(([k, u]) => [`tok-${k}`, u])),
    tables: {
      profiles: [profile('alice', 'not_applicable'), profile('bob', 'not_applicable'), profile('mallory', 'not_applicable'), profile('admin', 'verified')],
      patients: [
        { id: 'p-alice', user_id: people.alice.id, patient_user_id: null, name: 'Synthetic patient A' },
        { id: 'p-bob', user_id: people.bob.id, patient_user_id: null, name: 'Synthetic patient B' },
      ],
      metabolic_profiles: [],
      patient_clinical_references: [],
      professional_transition_accounts: [],
      professional_verification_requests: [],
      professional_verification_reviews: [],
      ask_phygo_usage: [],
      knowledge_base: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url, port: 3421, env: { DAILY_API_KEY: 'test-daily-key' } });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const call = (base, method, path, who, body) =>
  fetch(`${base}${path}`, { method, headers: { 'content-type': 'application/json', ...cookie(who) }, body: body === undefined ? undefined : JSON.stringify(body) });
const PDF = Buffer.from('%PDF-1.4\n% synthetic registration certificate\n');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const submit = (who, fields = {}, file = { bytes: PDF, name: 'certificate.pdf', type: 'application/pdf' }) => {
  const form = new FormData();
  const all = {
    legalFirstName: 'Maria', legalLastName: 'Rossi', registryCountry: 'IT', registryName: 'OFI Lombardia', registrationNumber: '1234',
    declarationAccepted: 'true', declarationVersion: '2026-10-12.v1', ...fields,
  };
  for (const [k, v] of Object.entries(all)) form.append(k, String(v));
  if (file) form.append('document', new Blob([file.bytes], { type: file.type }), file.name);
  return fetch(`${app.url}/api/profile/verification`, { method: 'POST', headers: cookie(who), body: form });
};
const requests = () => fake.state.tables.professional_verification_requests;
const latestOf = (who) => [...requests()].reverse().find((r) => r.user_id === people[who].id);
const reviewsOf = (requestId) => fake.state.tables.professional_verification_reviews.filter((r) => r.request_id === requestId);
const statusOf = (who) => fake.state.tables.profiles.find((p) => p.id === people[who].id).professional_status;
const stored = (path) => fake.state.storage.has(`verification-documents/${path}`);
// Like the administration page, a decision names the request on screen: the latest one.
const admin = (body) =>
  call(app.url, 'POST', '/api/admin/verification', 'admin', body.decision && !('requestId' in body) ? { requestId: latestRequestId(fake.state, body.userId), ...body } : body);
const clinicalAiOpen = async (who) => ![401, 403].includes((await call(app.url, 'POST', '/api/generate-note', who, { transcript: 'synthetic', lang: 'en' })).status);

test('1. matching name, surname and number: approved only after the administrator records a match', async () => {
  const res = await submit('alice');
  assert.equal(res.status, 200);
  const v = (await res.json()).verification;
  assert.equal(v.status, 'pending');
  assert.equal(v.request.status, 'pending');
  assert.equal(v.request.hasDocument, true);
  const r = latestOf('alice');
  assert.deepEqual([r.legal_first_name, r.legal_last_name, r.registration_number, r.registry_name], ['Maria', 'Rossi', '1234', 'OFI Lombardia']);
  assert.ok(r.document_path.startsWith(`${people.alice.id}/${r.id}/`), 'server-generated path in the owner folder');
  assert.ok(stored(r.document_path));
  assert.equal(r.declaration_version, '2026-10-12.v1');
  assert.ok(r.declaration_accepted_at);
  // Uploading grants nothing.
  assert.equal(await clinicalAiOpen('alice'), false);
  // The administrator sees the declaration and that a document exists, never the storage path.
  const list = await (await call(app.url, 'GET', '/api/admin/verification?status=pending', 'admin')).json();
  const row = list.requests.find((x) => x.id === people.alice.id);
  assert.equal(row.request.has_document, true);
  assert.equal(row.request.document_path, undefined);
  assert.equal(list.officialRegister, 'https://albo.alboweb-fnofi.net/registry/search');
  // Approval without a recorded match is refused.
  assert.equal((await admin({ userId: people.alice.id, decision: 'verified' })).status, 409);
  assert.equal((await admin({ action: 'registry_check', requestId: r.id, result: 'match', internalNote: 'Name and number match the register.' })).status, 200);
  assert.equal((await admin({ userId: people.alice.id, decision: 'verified' })).status, 200);
  assert.equal(statusOf('alice'), 'verified');
  assert.equal(latestOf('alice').status, 'verified');
  assert.deepEqual(reviewsOf(r.id).map((x) => x.action), ['registry_check', 'verified']);
  assert.equal(reviewsOf(r.id)[0].reviewer, 'admin@test.invalid');
  assert.equal(await clinicalAiOpen('alice'), true);
});

test('2. number not in the register or data that do not match: no approval; rejection with a category and a message', async () => {
  assert.equal((await submit('bob', { legalFirstName: 'Paolo', legalLastName: 'Bianchi', registrationNumber: '999999' })).status, 200);
  const r = latestOf('bob');
  assert.equal((await admin({ action: 'registry_check', requestId: r.id, result: 'not_found' })).status, 200);
  const refused = await admin({ userId: people.bob.id, decision: 'verified' });
  assert.equal(refused.status, 409);
  assert.equal((await refused.json()).code, 'registry_not_matched');
  assert.equal((await admin({ action: 'registry_check', requestId: r.id, result: 'mismatch' })).status, 200);
  assert.equal((await admin({ userId: people.bob.id, decision: 'verified' })).status, 409);
  assert.equal((await admin({ userId: people.bob.id, decision: 'rejected', message: 'The number is not in the register.' })).status, 400, 'a rejection needs a category');
  assert.equal((await admin({ userId: people.bob.id, decision: 'rejected', message: 'The number is not in the register.', rejectionCategory: 'not_in_register', internalNote: 'internal only' })).status, 200);
  assert.equal(statusOf('bob'), 'rejected');
  assert.equal(latestOf('bob').rejection_category, 'not_in_register');
  const own = (await (await call(app.url, 'GET', '/api/profile/verification', 'bob')).json()).verification;
  assert.equal(own.message, 'The number is not in the register.');
  assert.equal(own.request.status, 'rejected');
  const ownText = JSON.stringify(own);
  assert.ok(!ownText.includes('internal only') && !ownText.includes('admin@test.invalid'), 'no internal note or reviewer identity for the user');
  assert.equal(await clinicalAiOpen('bob'), false);
});

test('3. missing, too large or disallowed documents are refused and nothing is stored', async () => {
  const before = { rows: requests().length, files: fake.state.storage.size };
  const missing = await submit('mallory', {}, null);
  assert.equal(missing.status, 400);
  assert.equal((await missing.json()).code, 'document_missing');
  const big = Buffer.concat([PDF, Buffer.alloc(4 * 1024 * 1024)]);
  const tooLarge = await submit('mallory', {}, { bytes: big, name: 'big.pdf', type: 'application/pdf' });
  assert.equal(tooLarge.status, 413);
  for (const file of [
    { bytes: Buffer.from('just text'), name: 'fake.pdf', type: 'application/pdf' }, // wrong content
    { bytes: PNG, name: 'image.pdf', type: 'application/pdf' }, // content and extension disagree
    { bytes: Buffer.from('MZ\x90\x00'), name: 'program.png', type: 'image/png' }, // executable renamed
    { bytes: PDF, name: 'certificate.docx', type: 'application/pdf' }, // extension not allowed
  ]) {
    const res = await submit('mallory', {}, file);
    assert.equal(res.status, 400, file.name);
    assert.equal((await res.json()).code, 'document_type', file.name);
  }
  const noDeclaration = await submit('mallory', { declarationAccepted: 'false' });
  assert.equal(noDeclaration.status, 400);
  assert.ok((await noDeclaration.json()).fields.includes('declaration'));
  assert.equal(requests().length, before.rows);
  assert.equal(fake.state.storage.size, before.files);
});

test('4. a user cannot read another user’s document', async () => {
  const alice = latestOf('alice');
  // Mallory has no document; the route ignores any id or path from the client.
  assert.equal((await call(app.url, 'GET', `/api/profile/verification/document?requestId=${alice.id}&path=${encodeURIComponent(alice.document_path)}`, 'mallory')).status, 404);
  assert.equal((await call(app.url, 'GET', `/api/admin/verification/document?requestId=${alice.id}`, 'mallory')).status, 403);
  assert.equal((await call(app.url, 'GET', `/api/admin/verification/document?requestId=${alice.id}`, null)).status, 401);
  // Alice reads her own, streamed by the server (no signed URL).
  const own = await call(app.url, 'GET', '/api/profile/verification/document', 'alice');
  assert.equal(own.status, 200);
  assert.deepEqual(Buffer.from(await own.arrayBuffer()), PDF);
  assert.equal(fake.state.downloads.at(-1).path, alice.document_path);
});

test('5. a user cannot set the status, the register check or the document path', async () => {
  const alice = latestOf('alice');
  const res = await submit('mallory', {
    status: 'verified', professional_status: 'verified', registry_check: 'match', registryCheck: 'match',
    document_path: alice.document_path, documentPath: alice.document_path, decided_by: 'admin@test.invalid',
  });
  assert.equal(res.status, 200);
  const r = latestOf('mallory');
  assert.equal(r.status, 'pending');
  assert.notEqual(r.registry_check, 'match');
  assert.ok(r.document_path.startsWith(`${people.mallory.id}/${r.id}/`));
  assert.equal(statusOf('mallory'), 'pending');
  assert.equal((await admin({ userId: people.mallory.id, decision: 'verified' })).status, 409, 'still no match recorded');
  // Replacing the document opens a new review; the old open request is superseded and its file removed.
  const first = r;
  assert.equal((await submit('mallory')).status, 200);
  assert.equal(requests().find((x) => x.id === first.id).status, 'superseded');
  assert.equal(stored(first.document_path), false);
});

test('6. a non-administrator cannot record a check or approve, not even for themselves', async () => {
  const r = latestOf('mallory');
  assert.equal((await call(app.url, 'POST', '/api/admin/verification', 'mallory', { action: 'registry_check', requestId: r.id, result: 'match' })).status, 403);
  assert.equal((await call(app.url, 'POST', '/api/admin/verification', 'mallory', { userId: people.mallory.id, decision: 'verified' })).status, 403);
  assert.equal((await call(app.url, 'GET', '/api/admin/verification', 'mallory')).status, 403);
  assert.equal(statusOf('mallory'), 'pending');
});

test('7. the administrator opens the document only through the permission check, streamed with no-store', async () => {
  const r = latestOf('mallory');
  const signed = fake.state.signRequests.length;
  const res = await call(app.url, 'GET', `/api/admin/verification/document?requestId=${r.id}`, 'admin');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'private, no-store, max-age=0, must-revalidate');
  assert.equal(res.headers.get('content-type'), 'application/pdf');
  assert.deepEqual(Buffer.from(await res.arrayBuffer()), PDF);
  assert.equal(fake.state.signRequests.length, signed, 'no signed URL is created');
  assert.equal((await call(app.url, 'GET', '/api/admin/verification/document?requestId=not-a-uuid', 'admin')).status, 400);
});

test('8. a rejected user can apply again; a verified user can be revoked', async () => {
  assert.equal((await submit('bob', { legalFirstName: 'Paolo', legalLastName: 'Bianchi', registrationNumber: '4321' })).status, 200);
  assert.equal(statusOf('bob'), 'pending');
  const r = latestOf('bob');
  assert.equal((await admin({ action: 'registry_check', requestId: r.id, result: 'match' })).status, 200);
  assert.equal((await admin({ userId: people.bob.id, decision: 'verified' })).status, 200);
  assert.equal(await clinicalAiOpen('bob'), true);
  assert.equal((await admin({ userId: people.bob.id, decision: 'rejected', message: 'Verification revoked.', rejectionCategory: 'other' })).status, 200);
  assert.equal(statusOf('bob'), 'rejected');
  assert.equal(reviewsOf(r.id).at(-1).action, 'revoked');
  assert.equal(await clinicalAiOpen('bob'), false);
});

test('9. documents are deleted only when a retention period is configured, keeping status and audit', async () => {
  const r = latestOf('alice');
  r.decided_at = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
  const cron = (base, auth) => fetch(`${base}/api/cron/verification-retention`, { headers: auth ? { authorization: `Bearer ${auth}` } : {} });
  assert.equal((await cron(app.url)).status, 401);
  // Not configured (as in production today): nothing is deleted.
  const off = await (await cron(app.url, 'test-cron-secret')).json();
  assert.deepEqual(off, { configured: false, deleted: 0 });
  assert.ok(stored(r.document_path));
  const withRetention = await startApp({ fakeUrl: fake.url, port: 3422, env: { VERIFICATION_DOCUMENT_RETENTION_DAYS: '30' } });
  try {
    const on = await (await cron(withRetention.url, 'test-cron-secret')).json();
    assert.equal(on.configured, true);
    assert.equal(on.deleted, 1);
  } finally {
    await withRetention.stop();
  }
  const path = r.document_path;
  const after = latestOf('alice');
  assert.equal(after.document_path, null);
  assert.ok(after.document_deleted_at);
  assert.equal(stored(path ?? ''), false);
  assert.equal(after.status, 'verified', 'the decision stays');
  assert.equal(statusOf('alice'), 'verified');
  assert.deepEqual(reviewsOf(after.id).map((x) => x.action), ['registry_check', 'verified'], 'the audit trail stays');
  assert.equal((await call(app.url, 'GET', '/api/profile/verification/document', 'alice')).status, 404);
});

test('9b. retention reads past the 1,000-row page limit, and still keeps each account’s latest request', async () => {
  // Synthetic rows for an account that has no other data in this test.
  const zed = '0e000000-0000-4000-8000-00000000zzzz'.replace(/z/g, '9');
  const old = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const N = 1100;
  const reqs = fake.state.tables.professional_verification_requests;
  for (let i = 0; i < N; i++) {
    reqs.push({ id: `0e000000-0000-4000-8000-${String(i).padStart(12, '0')}`, user_id: zed, status: 'superseded', submitted_at: old(900 - i / 10000), decided_at: old(800), document_path: null });
  }
  const latestZed = { id: '0e000000-0000-4000-8000-999999999999', user_id: zed, status: 'rejected', submitted_at: old(850), decided_at: old(800), document_path: null };
  reqs.push(latestZed);
  const reviews = fake.state.tables.professional_verification_reviews;
  for (let i = 0; i < N; i++) {
    reviews.push({ id: `0d000000-0000-4000-8000-${String(i).padStart(12, '0')}`, user_id: zed, request_id: null, action: 'registry_check', internal_note: 'synthetic note', note_redacted_at: null, created_at: old(400), reviewer: 'admin@test.invalid' });
  }
  const others = reqs.filter((r) => r.user_id !== zed).length;
  const withRetention = await startApp({ fakeUrl: fake.url, port: 3423, env: { VERIFICATION_NOTE_RETENTION_DAYS: '365', VERIFICATION_HISTORY_RETENTION_DAYS: '730' } });
  try {
    const res = await (await fetch(`${withRetention.url}/api/cron/verification-retention`, { headers: { authorization: 'Bearer test-cron-secret' } })).json();
    assert.equal(res.notesRemoved, N, 'every old note, not only the first 1,000');
    assert.equal(res.requestsRemoved, N, 'every older request, not only the first 1,000');
  } finally {
    await withRetention.stop();
  }
  // Deletions replace the fake's arrays: read the tables again.
  const after = fake.state.tables.professional_verification_requests;
  assert.deepEqual(after.filter((r) => r.user_id === zed).map((r) => r.id), [latestZed.id], 'the latest request of the account stays');
  assert.equal(after.filter((r) => r.user_id !== zed).length, others, 'other accounts untouched (recent decisions)');
  assert.equal(fake.state.tables.professional_verification_reviews.filter((r) => r.user_id === zed && r.internal_note).length, 0);
});

test('10. verification grants nothing on another clinician’s patients', async () => {
  assert.equal(statusOf('alice'), 'verified');
  assert.equal((await call(app.url, 'POST', '/api/video-call/create-room', 'alice', { patientId: 'p-bob' })).status, 404);
  assert.equal((await call(app.url, 'GET', '/api/metabolic/save?patientId=p-bob', 'alice')).status, 404);
  assert.equal((await call(app.url, 'POST', '/api/video-call/create-room', 'alice', { patientId: 'p-alice' })).status, 200, 'own patient');
});

test('the administrator list is server-side only: PHYGO_ADMIN_EMAILS never reaches the browser bundle', () => {
  const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
  const leaked = walk('.next/static').filter((f) => f.endsWith('.js') && readFileSync(f, 'utf8').includes('admin@test.invalid'));
  assert.deepEqual(leaked, []);
});
