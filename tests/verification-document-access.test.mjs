// Access to professional verification documents (lib/verificationDocument.ts):
//   - only the owner or a signed-in administrator; CRON_SECRET or an API
//     token alone never opens a document or the verification console;
//   - the server streams the file: no signed URL, token or Storage
//     credential reaches the browser;
//   - ids, paths, file names and extra parameters from the client cannot
//     redirect the read;
//   - responses forbid caching; nothing sensitive reaches the logs;
//   - retention still deletes; verification gives no access to other
//     clinicians' patients.
// Synthetic data only, against the fake Supabase (no real service).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { verificationRpc } from './support/verification-rpc.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);
let n = 0;
const person = (email) => ({ id: `0d000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, email, email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' });
const people = {
  anna: person('anna@test.invalid'), // professional with a document
  bruno: person('bruno@test.invalid'), // professional with a document
  carla: person('carla@test.invalid'), // no document
  admin: person('admin@test.invalid'), // in PHYGO_ADMIN_EMAILS (tests/support/app.mjs)
};
const CRON = 'test-cron-secret'; // CRON_SECRET in tests/support/app.mjs
const API_TOKEN = 'test-admin-token'; // PHYGO_ADMIN_API_TOKEN in tests/support/app.mjs
const profile = (who, status = 'verified') => ({
  id: people[who].id, practice_stage: 'professional', professional_status: status, plan: 'free', display_name: who,
  registry_country: 'IT', registry_name: 'OFI Lombardia', registration_number: `N-${who}`,
});

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    rpc: verificationRpc,
    users: Object.fromEntries(Object.entries(people).map(([k, u]) => [`tok-${k}`, u])),
    tables: {
      profiles: [profile('anna', 'not_applicable'), profile('bruno', 'not_applicable'), profile('carla', 'not_applicable'), profile('admin')],
      patients: [
        { id: 'p-anna', user_id: people.anna.id, patient_user_id: null, name: 'Synthetic patient A' },
        { id: 'p-bruno', user_id: people.bruno.id, patient_user_id: null, name: 'Synthetic patient B' },
      ],
      metabolic_profiles: [],
      patient_clinical_references: [],
      professional_transition_accounts: [],
      professional_verification_requests: [],
      professional_verification_reviews: [],
      professional_evidence_deadlines: [],
      ask_phygo_usage: [],
      knowledge_base: [],
      research_papers: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url, port: 3426, env: { DAILY_API_KEY: 'test-daily-key' } });
  // Anna and Bruno submit their documents through the normal route.
  assert.equal((await submit('anna', ANNA_PDF)).status, 200);
  assert.equal((await submit('bruno', BRUNO_PNG, 'certificate.png', 'image/png')).status, 200);
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const ANNA_PDF = Buffer.from('%PDF-1.4\n% synthetic certificate ANNA-SECRET-CONTENT\n');
const BRUNO_PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('BRUNO-SECRET-CONTENT')]);
const cookie = (who) => (who ? { cookie: sessionCookie(`tok-${who}`, people[who]) } : {});
const get = (path, { who, bearer, headers = {} } = {}) =>
  fetch(`${app.url}${path}`, { headers: { ...cookie(who), ...(bearer ? { authorization: `Bearer ${bearer}` } : {}), ...headers } });
const submit = (who, bytes, name = 'certificate.pdf', type = 'application/pdf') => {
  const form = new FormData();
  const fields = { legalFirstName: 'Synthetic', legalLastName: who, registryCountry: 'IT', registryName: 'OFI Lombardia', registrationNumber: `N-${who}`, declarationAccepted: 'true', declarationVersion: '2026-10-12.v1' };
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append('document', new Blob([bytes], { type }), name);
  return fetch(`${app.url}/api/profile/verification`, { method: 'POST', headers: cookie(who), body: form });
};
const requestOf = (who) => [...fake.state.tables.professional_verification_requests].reverse().find((r) => r.user_id === people[who].id);
const adminDoc = (requestId) => `/api/admin/verification/document?requestId=${requestId}`;
const OWN = '/api/profile/verification/document';
const body = async (res) => Buffer.from(await res.arrayBuffer());
const NO_STORE = 'private, no-store, max-age=0, must-revalidate';

function assertNoStore(res, label) {
  assert.equal(res.headers.get('cache-control'), NO_STORE, `${label}: Cache-Control`);
  assert.equal(res.headers.get('pragma'), 'no-cache', `${label}: Pragma`);
  assert.equal(res.headers.get('expires'), '0', `${label}: Expires`);
  assert.equal(res.headers.get('cdn-cache-control'), 'no-store', `${label}: CDN-Cache-Control`);
  assert.equal(res.headers.get('vercel-cdn-cache-control'), 'no-store', `${label}: Vercel-CDN-Cache-Control`);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff', `${label}: nosniff`);
}

test('CRON_SECRET alone opens no document and no verification console', async () => {
  const anna = requestOf('anna');
  for (const bearer of [CRON, API_TOKEN]) {
    const res = await get(adminDoc(anna.id), { bearer });
    assert.equal(res.status, 401, `document with ${bearer === CRON ? 'CRON_SECRET' : 'API token'}`);
    assert.ok(!(await body(res)).includes('ANNA-SECRET-CONTENT'));
    assert.equal((await get('/api/admin/verification?status=pending', { bearer })).status, 401, 'console list');
    const decide = await fetch(`${app.url}/api/admin/verification`, {
      method: 'POST', headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' },
      body: JSON.stringify({ userId: people.anna.id, decision: 'verified' }),
    });
    assert.equal(decide.status, 401, 'decision');
  }
  // A token does not upgrade a non-administrator session either.
  assert.equal((await get(adminDoc(anna.id), { who: 'carla', bearer: CRON })).status, 403);
  // Other admin routes no longer accept CRON_SECRET; the science batch route the cron calls still does.
  assert.equal((await get('/api/library/admin', { bearer: CRON })).status, 401);
  // (summarize-all with no papers: no OpenAI or network call.)
  assert.equal((await get('/api/science/summarize-all', { bearer: CRON })).status, 200, 'science batch route used by the cron');
  assert.equal(fake.state.tables.profiles.find((p) => p.id === people.anna.id).professional_status, 'pending', 'nothing was decided');
});

test('a signed-in administrator opens the document, streamed by the server', async () => {
  const anna = requestOf('anna');
  const signed = fake.state.signRequests.length;
  const res = await get(adminDoc(anna.id), { who: 'admin' });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/pdf');
  assert.equal(res.headers.get('content-disposition'), 'attachment; filename="phygo-verification-document.pdf"');
  assert.deepEqual(await body(res), ANNA_PDF);
  assert.equal(fake.state.signRequests.length, signed, 'no signed URL is created');
  // The server read used the service key and a fresh cache nonce, never reused.
  const reads = fake.state.downloads.filter((d) => d.path === anna.document_path);
  assert.ok(reads.at(-1).auth?.startsWith('Bearer '));
  assert.match(reads.at(-1).search, /cacheNonce=[0-9a-f-]{36}/);
  await get(adminDoc(anna.id), { who: 'admin' });
  const nonces = fake.state.downloads.filter((d) => d.path === anna.document_path).map((d) => d.search);
  assert.equal(new Set(nonces).size, nonces.length, 'each read has its own nonce');
});

test('a professional opens only their own document; another user cannot open it', async () => {
  const anna = requestOf('anna');
  const bruno = requestOf('bruno');
  const own = await get(OWN, { who: 'bruno' });
  assert.equal(own.status, 200);
  assert.equal(own.headers.get('content-type'), 'image/png');
  assert.equal(own.headers.get('content-disposition'), 'attachment; filename="phygo-verification-document.png"');
  assert.deepEqual(await body(own), BRUNO_PNG);
  // Carla has no document: 404, whatever she adds to the URL.
  for (const q of [
    `?requestId=${anna.id}`,
    `?path=${encodeURIComponent(anna.document_path)}`,
    `?userId=${people.anna.id}&requestId=${anna.id}&path=${encodeURIComponent(anna.document_path)}&file=x.pdf`,
  ]) {
    const res = await get(OWN + q, { who: 'carla' });
    assert.equal(res.status, 404, q);
    assert.ok(!(await body(res)).includes('ANNA-SECRET-CONTENT'));
  }
  // Bruno asking for Anna's ids still receives only his own file.
  const tampered = await get(`${OWN}?requestId=${anna.id}&path=${encodeURIComponent(anna.document_path)}`, { who: 'bruno' });
  assert.deepEqual(await body(tampered), BRUNO_PNG);
  // The administrator route refuses non-administrators, even with Bruno's own request id.
  assert.equal((await get(adminDoc(bruno.id), { who: 'bruno' })).status, 403);
  assert.equal((await get(adminDoc(anna.id), { who: 'bruno' })).status, 403);
  assert.equal((await get(adminDoc(anna.id))).status, 401);
});

test('changing requestId, path, file name or parameters does not bypass the checks', async () => {
  const anna = requestOf('anna');
  for (const q of [
    'not-a-uuid',
    `${anna.id}/../../${people.bruno.id}`,
    encodeURIComponent(anna.document_path),
    `${anna.id}&requestId=${requestOf('bruno').id}`, // two ids
    '',
  ]) {
    const res = await get(`/api/admin/verification/document?requestId=${q}`, { who: 'admin' });
    assert.equal(res.status, 400, q);
    assertNoStore(res, `error ${q}`);
  }
  assert.equal((await get(adminDoc('0d000000-0000-4000-8000-999999999999'), { who: 'admin' })).status, 404, 'unknown request');
  // Extra path or file parameters are ignored: the row decides which file is read.
  const res = await get(`${adminDoc(anna.id)}&path=${encodeURIComponent(requestOf('bruno').document_path)}&filename=evil.html`, { who: 'admin' });
  assert.deepEqual(await body(res), ANNA_PDF);
  assert.equal(res.headers.get('content-disposition'), 'attachment; filename="phygo-verification-document.pdf"');
  // Defence in depth: a stored path outside the owner's folder, or a stored file
  // that no longer matches its recorded type, is never served.
  const row = requestOf('anna');
  const original = row.document_path;
  try {
    row.document_path = requestOf('bruno').document_path;
    const moved = await get(adminDoc(row.id), { who: 'admin' });
    assert.equal(moved.status, 500);
    assert.ok(!(await body(moved)).includes('BRUNO-SECRET-CONTENT'));
  } finally {
    row.document_path = original;
  }
  const stored = fake.state.storage.get(`verification-documents/${original}`);
  const bytes = stored.bytes;
  try {
    stored.bytes = Buffer.from('<html><script>alert(1)</script></html>');
    const swapped = await get(adminDoc(row.id), { who: 'admin' });
    assert.equal(swapped.status, 500);
    assert.ok(!(await body(swapped)).includes('<script>'));
  } finally {
    stored.bytes = bytes;
  }
});

test('document responses forbid caching and are never rendered as a page', async () => {
  for (const [path, who] of [[adminDoc(requestOf('anna').id), 'admin'], [OWN, 'bruno']]) {
    const res = await get(path, { who });
    assert.equal(res.status, 200);
    assertNoStore(res, path);
    assert.equal(res.headers.get('content-security-policy'), "default-src 'none'; frame-ancestors 'none'; sandbox");
    assert.equal(res.headers.get('cross-origin-resource-policy'), 'same-origin');
    assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
    assert.match(res.headers.get('content-disposition'), /^attachment; filename="phygo-verification-document\.(pdf|png)"$/);
    assert.equal(res.headers.get('etag'), null, 'no validator that would allow a cached copy to be reused');
    await res.arrayBuffer();
  }
  // Errors are not cacheable either.
  assertNoStore(await get(OWN, { who: 'carla' }), 'own 404');
  assertNoStore(await get(adminDoc(requestOf('anna').id), { who: 'carla' }), 'admin 403');
  // Uploads are stored with max-age=0 instead of Storage's default of one hour.
  assert.equal(fake.state.storage.get(`verification-documents/${requestOf('anna').document_path}`).cacheControl, 'max-age=0');
});

test('no signed URL, token or document content reaches the logs or the JSON APIs', async () => {
  const logs = app.logs();
  for (const secret of ['ANNA-SECRET-CONTENT', 'BRUNO-SECRET-CONTENT', 'token=', CRON, API_TOKEN, requestOf('anna').document_path, requestOf('bruno').document_path]) {
    assert.ok(!logs.includes(secret), `logs contain ${secret}`);
  }
  const ownStatus = JSON.stringify(await (await get('/api/profile/verification', { who: 'anna' })).json());
  const list = JSON.stringify(await (await get('/api/admin/verification?status=pending', { who: 'admin' })).json());
  for (const text of [ownStatus, list]) {
    assert.ok(!text.includes(requestOf('anna').document_path), 'no storage path');
    assert.ok(!/signedURL|signedUrl|token=|\/storage\/v1\//i.test(text), 'no signed URL or Storage address');
  }
});

test('retention still deletes the file, and the document route then answers 404', async () => {
  const anna = requestOf('anna');
  // Approve Anna, then make the decision old enough for a 30-day retention.
  assert.equal((await fetch(`${app.url}/api/admin/verification`, { method: 'POST', headers: { ...cookie('admin'), 'content-type': 'application/json' }, body: JSON.stringify({ action: 'registry_check', requestId: anna.id, result: 'match' }) })).status, 200);
  assert.equal((await fetch(`${app.url}/api/admin/verification`, { method: 'POST', headers: { ...cookie('admin'), 'content-type': 'application/json' }, body: JSON.stringify({ userId: people.anna.id, decision: 'verified' }) })).status, 200);
  anna.decided_at = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
  const path = anna.document_path;
  const cron = (base) => fetch(`${base}/api/cron/verification-retention`, { headers: { authorization: `Bearer ${CRON}` } });
  assert.deepEqual(await (await cron(app.url)).json(), { configured: false, deleted: 0 }, 'off by default');
  const withRetention = await startApp({ fakeUrl: fake.url, port: 3427, env: { VERIFICATION_DOCUMENT_RETENTION_DAYS: '30' } });
  try {
    const report = await (await cron(withRetention.url)).json();
    assert.equal(report.deleted, 1);
    assert.equal(report.failed, 0);
  } finally {
    await withRetention.stop();
  }
  assert.equal(fake.state.storage.has(`verification-documents/${path}`), false);
  assert.equal(requestOf('anna').document_path, null);
  assert.equal((await get(adminDoc(anna.id), { who: 'admin' })).status, 404);
  assert.equal((await get(OWN, { who: 'anna' })).status, 404);
});

test('verification gives no access to other clinicians’ patients', async () => {
  assert.equal(fake.state.tables.profiles.find((p) => p.id === people.anna.id).professional_status, 'verified');
  const post = (who, path, payload) => fetch(`${app.url}${path}`, { method: 'POST', headers: { ...cookie(who), 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  assert.equal((await post('anna', '/api/video-call/create-room', { patientId: 'p-bruno' })).status, 404);
  assert.equal((await get('/api/metabolic/save?patientId=p-bruno', { who: 'anna' })).status, 404);
  assert.equal((await post('admin', '/api/video-call/create-room', { patientId: 'p-anna' })).status, 404, 'administrator status gives no patient access');
  assert.equal((await get('/api/metabolic/save?patientId=p-anna', { who: 'admin' })).status, 404);
  assert.equal((await post('anna', '/api/video-call/create-room', { patientId: 'p-anna' })).status, 200, 'own patient');
});
