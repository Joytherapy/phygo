// Administrator authorization (lib/auth/adminServer.ts):
//   - CRON_SECRET is accepted only by the cron route and the two science
//     batch routes the cron calls; it opens nothing else;
//   - the professional verification console accepts only a signed-in
//     administrator, never a bearer token;
//   - wrong or missing credentials are refused everywhere;
//   - the daily cron and normal administrator sessions keep working.
// Synthetic data only, against the fake Supabase; the network guard refuses
// any external host (the cron's PubMed request is blocked locally).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);
const CRON = 'test-cron-secret'; // CRON_SECRET in tests/support/app.mjs
const API_TOKEN = 'test-admin-token'; // PHYGO_ADMIN_API_TOKEN in tests/support/app.mjs
const person = (n, email, confirmed = true) => ({
  id: `0c000000-0000-4000-8000-00000000000${n}`, email, email_confirmed_at: confirmed ? '2026-01-01T00:00:00Z' : null, role: 'authenticated',
});
const people = {
  admin: person(1, 'admin@test.invalid'), // in PHYGO_ADMIN_EMAILS
  user: person(2, 'user@test.invalid'), // signed in, not an administrator
  unconfirmed: person(3, 'admin@test.invalid', false), // administrator e-mail, not confirmed
  applicant: person(4, 'applicant@test.invalid'),
};

// Every route guarded by requireAdmin / requireAdminSession, with a method it exports.
const ADMIN_ROUTES = [
  ['GET', '/api/admin/verification'],
  ['POST', '/api/admin/verification'],
  ['GET', '/api/admin/seed-exercises'],
  ['GET', '/api/library/admin'],
  ['POST', '/api/library/admin'],
  ['DELETE', '/api/library/admin'],
  ['GET', '/api/library/admin/zones'],
  ['POST', '/api/library/admin/zones'],
  ['GET', '/api/events/admin'],
  ['POST', '/api/events/admin'],
  ['PATCH', '/api/events/admin/0c000000-0000-4000-8000-000000000099'],
  ['DELETE', '/api/events/admin/0c000000-0000-4000-8000-000000000099'],
  ['POST', '/api/science/summarize'],
  ['POST', '/api/science/admin/review'],
  ['GET', '/api/science/republish-check'],
  ['GET', '/api/science/backfill-study-type'],
  ['GET', '/api/science/fetch-sources'],
  ['GET', '/api/science/summarize-all'],
];
const CRON_ALLOWED = new Set(['/api/science/fetch-sources', '/api/science/summarize-all']);

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: Object.fromEntries(Object.entries(people).map(([k, u]) => [`tok-${k}`, u])),
    tables: {
      profiles: [
        { id: people.admin.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free', display_name: 'Admin' },
        { id: people.user.id, practice_stage: 'professional', professional_status: 'not_applicable', plan: 'free', display_name: 'User' },
        { id: people.applicant.id, practice_stage: 'professional', professional_status: 'pending', plan: 'free', display_name: 'Applicant', registry_country: 'IT', registry_name: 'Synthetic register', registration_number: 'T-1' },
      ],
      research_papers: [],
      events: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url, port: 3430 });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const call = (method, path, { who, bearer, body } = {}) =>
  fetch(`${app.url}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(who ? { cookie: sessionCookie(`tok-${who}`, people[who]) } : {}),
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
    },
    body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(body ?? {}),
  });
const writes = () => fake.state.requests.filter((r) => ['POST', 'PATCH', 'DELETE'].includes(r.method) && r.path.startsWith('/rest/v1/')).length;

test('without credentials, with a wrong token or as a non-administrator, every admin route refuses', async () => {
  const before = writes();
  for (const [method, path] of ADMIN_ROUTES) {
    assert.equal((await call(method, path)).status, 401, `${method} ${path} without credentials`);
    assert.equal((await call(method, path, { bearer: 'wrong-token' })).status, 401, `${method} ${path} with a wrong token`);
    assert.equal((await call(method, path, { bearer: `${CRON}x` })).status, 401, `${method} ${path} with an almost-right CRON_SECRET`);
    assert.equal((await call(method, path, { who: 'user' })).status, 403, `${method} ${path} as a non-administrator`);
    assert.equal((await call(method, path, { who: 'unconfirmed' })).status, 403, `${method} ${path} with an unconfirmed administrator e-mail`);
  }
  assert.equal(writes(), before, 'no refused request wrote anything');
});

test('CRON_SECRET opens only the two science batch routes the cron calls', async () => {
  const before = writes();
  for (const [method, path] of ADMIN_ROUTES) {
    if (CRON_ALLOWED.has(path)) continue;
    assert.equal((await call(method, path, { bearer: CRON })).status, 401, `${method} ${path} with CRON_SECRET`);
  }
  // A token never upgrades a non-administrator session either.
  assert.equal((await call('GET', '/api/admin/verification', { who: 'user', bearer: CRON })).status, 403);
  assert.equal(writes(), before, 'nothing was written');
  // summarize-all with no papers makes no OpenAI or network call.
  const res = await call('GET', '/api/science/summarize-all', { bearer: CRON });
  assert.equal(res.status, 200);
});

test('the verification console accepts only a signed-in administrator, never a token', async () => {
  for (const bearer of [CRON, API_TOKEN]) {
    assert.equal((await call('GET', '/api/admin/verification?status=pending', { bearer })).status, 401, 'list');
    assert.equal((await call('POST', '/api/admin/verification', { bearer, body: { userId: people.applicant.id, decision: 'rejected', message: 'x' } })).status, 401, 'decision');
  }
  assert.equal(fake.state.tables.profiles.find((p) => p.id === people.applicant.id).professional_status, 'pending', 'no decision was recorded');
});

test('a signed-in administrator keeps working, and decisions carry their identity', async () => {
  const list = await call('GET', '/api/admin/verification?status=pending', { who: 'admin' });
  assert.equal(list.status, 200);
  assert.ok((await list.json()).requests.some((r) => r.id === people.applicant.id));
  for (const path of ['/api/library/admin', '/api/events/admin']) {
    assert.ok(![401, 403].includes((await call('GET', path, { who: 'admin' })).status), `GET ${path}`);
  }
  const decision = await call('POST', '/api/admin/verification', { who: 'admin', body: { userId: people.applicant.id, decision: 'needs_info', message: 'Please add the register name.' } });
  assert.equal(decision.status, 200);
  const applicant = fake.state.tables.profiles.find((p) => p.id === people.applicant.id);
  assert.equal(applicant.professional_status, 'needs_info');
  assert.equal(applicant.verification_reviewed_by, 'admin@test.invalid', 'attributed to the person, never "api-token"');
});

test('PHYGO_ADMIN_API_TOKEN still works for maintenance routes (not for verification)', async () => {
  assert.ok(![401, 403].includes((await call('GET', '/api/library/admin', { bearer: API_TOKEN })).status));
});

test('the daily cron still runs: it needs CRON_SECRET and its calls to the batch routes are authorized', async () => {
  assert.equal((await call('GET', '/api/cron/science-daily')).status, 401);
  assert.equal((await call('GET', '/api/cron/science-daily', { bearer: 'wrong-token' })).status, 401);
  assert.equal((await call('GET', '/api/cron/science-daily', { bearer: API_TOKEN })).status, 401, 'the API token is not a cron secret');
  assert.equal((await call('GET', '/api/cron/science-daily', { who: 'admin' })).status, 401, 'a session is not a cron secret');
  const res = await call('GET', '/api/cron/science-daily', { bearer: CRON });
  const body = await res.json();
  // Both forwarded calls passed the authorization check. fetch-sources then stops
  // at PubMed, which the test network guard blocks (a 500 in JSON), so the run is
  // reported as failed (502) with that step's status; summarize-all finds no papers.
  assert.equal(res.status, 502);
  assert.equal(body.fetch.status, 500);
  assert.equal(body.fetch.data?.error, 'Import failed');
  assert.ok(![401, 403].includes(body.fetch.status), 'fetch-sources accepted CRON_SECRET');
  assert.notEqual(body.summarize?.error, 'unauthorized');
  assert.match(String(body.summarize?.message), /sintesi/);
});

test('the cron reports a reply that is not JSON, or an exception, instead of crashing', async () => {
  // lib/scienceCron.ts compiled to plain JavaScript, against handlers that
  // answer an HTML error page, a JSON error, or throw.
  const { default: ts } = await import('typescript');
  const { mkdtempSync, readFileSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'phygo-cron-'));
  try {
    const out = ts.transpileModule(readFileSync('lib/scienceCron.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
    writeFileSync(join(dir, 'scienceCron.mjs'), out);
    const { step } = await import(join(dir, 'scienceCron.mjs'));
    const html = await step('html', async () => new Response('<!DOCTYPE html><html><body>Authentication Required</body></html>', { status: 401, headers: { 'content-type': 'text/html' } }));
    assert.deepEqual(html, { status: 401, ok: false, error: 'non-JSON response (text/html)' }, 'no exception: status and type are reported');
    const json = await step('json', async () => Response.json({ error: 'Import failed' }, { status: 500 }));
    assert.deepEqual(json, { status: 500, ok: false, data: { error: 'Import failed' } });
    const thrown = await step('throws', async () => { throw new Error('boom'); });
    assert.deepEqual(thrown, { status: 0, ok: false, error: 'exception' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the cron runs the batch routes in its own function, never over HTTP to its deployment URL', async () => {
  // On 12, 15 and 16 Oct 2026 the cron fetched its own generated deployment URL,
  // which Vercel's Standard Deployment Protection answers with an HTML login
  // page: the batch routes were never reached. The test environment has no
  // deployment protection, so this is checked on the source.
  const { readFileSync } = await import('node:fs');
  const source = readFileSync('app/api/cron/science-daily/route.ts', 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(/, 'no fetch() in the cron route');
  assert.doesNotMatch(readFileSync('lib/scienceCron.ts', 'utf8'), /\bfetch\s*\(/, 'no fetch() in its helper');
  assert.doesNotMatch(source, /VERCEL_URL/, 'no generated deployment URL');
  assert.match(source, /from '@\/app\/api\/science\/fetch-sources\/route'/);
  assert.match(source, /from '@\/app\/api\/science\/summarize-all\/route'/);
});

test('a maintenance token set to the same value as CRON_SECRET does not reopen the other admin routes', async () => {
  // Misconfiguration guard: PHYGO_ADMIN_API_TOKEN equal to CRON_SECRET.
  const same = await startApp({ fakeUrl: fake.url, port: 3431, env: { PHYGO_ADMIN_API_TOKEN: CRON } });
  try {
    const get = (path) => fetch(`${same.url}${path}`, { headers: { authorization: `Bearer ${CRON}` } });
    assert.equal((await get('/api/library/admin')).status, 401, 'maintenance route');
    assert.equal((await get('/api/admin/verification')).status, 401, 'verification console');
    assert.equal((await get('/api/science/summarize-all')).status, 200, 'the cron route still works');
  } finally {
    await same.stop();
  }
});
