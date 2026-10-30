// The harness of the live check (scripts/clinical-relevance-live.mjs): when a
// call to the app fails, the run stops with the HTTP status, the body, the
// likely cause and the relevant lines of the app's log, with keys, tokens and
// cookies redacted, instead of crashing later on a missing field ("Cannot
// read properties of undefined (reading 'primaryCondition')").
// The app runs against the fake Supabase; OpenAI is simulated (no network).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';
import { CASES, CLIN, diagnoseFailure, jsonPost, redact, relevantLogs, RouteError, runPipeline, worldTables } from './support/clinical-world.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54871);
const APP_PORT = Number(process.env.HARNESS_APP_PORT ?? 3871);
const SECRET = 'sk-proj-HARNESSSECRET0123456789';

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({ port: FAKE_PORT, users: { 'tok-clin': CLIN }, tables: worldTables() });
  app = await startApp({ fakeUrl: fake.url, port: APP_PORT });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

test('secrets are never shown: API keys, bearer tokens, JWTs, session cookies', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.c2lnbmF0dXJlLXZhbHVl';
  const out = redact(`key ${SECRET} Authorization: Bearer abc.def-123 token ${jwt} cookie: sb-abcd-auth-token=base64-xyz; "apiKey":"k-123"`);
  for (const leaked of [SECRET, 'abc.def-123', jwt, 'base64-xyz', 'k-123']) assert.ok(!out.includes(leaked), `${leaked} is redacted: ${out}`);
});

test('the likely cause, from the status, the body, the log and OpenAI\'s answer', () => {
  assert.match(diagnoseFailure({ status: 401, body: { error: 'Not authenticated' } }), /--build/, 'the app does not know the session: the build is bound to another stand-in');
  assert.match(diagnoseFailure({ status: 403 }), /non verificato/);
  assert.match(diagnoseFailure({ status: 500, provider: { status: 401, code: 'invalid_api_key' } }), /OPENAI_API_KEY_LIVE/, 'OpenAI\'s answer wins over the app\'s 500');
  assert.match(diagnoseFailure({ status: 500, provider: { status: 429, code: 'insufficient_quota' } }), /Quota OpenAI esaurita/);
  assert.match(diagnoseFailure({ status: 500, provider: { status: 429, code: 'rate_limit_exceeded' } }), /Limite di frequenza OpenAI/);
  assert.match(diagnoseFailure({ status: 500, provider: { status: 0, type: 'network', code: 'ENOTFOUND' } }), /Rete/);
  assert.match(diagnoseFailure({ status: 429, body: { error: 'limit' } }), /Limite orario dell'app/);
  assert.match(diagnoseFailure({ status: 200, body: {} }), /Formato/);
});

test('a response without `note` stops the pipeline with the route, the status and the body', async () => {
  const post = async (path) => (path === '/api/generate-note' ? { error: 'qualcosa' } : {});
  await assert.rejects(runPipeline(post, 'Dolore alla spalla.'), (err) => {
    assert.ok(err instanceof RouteError, String(err));
    assert.equal(err.path, '/api/generate-note');
    assert.match(err.message, /HTTP 200 \(formato inatteso: manca `note`\): \{"error":"qualcosa"\}/);
    assert.doesNotMatch(err.message, /Cannot read properties/);
    return true;
  });
});

test('an OpenAI error (quota) reaches the run as HTTP 500 with its cause, and the log is shown without secrets', async () => {
  let provider = null;
  fake.state.openaiForward = async () => {
    provider = { status: 429, type: 'insufficient_quota', code: 'insufficient_quota' };
    return { status: 429, json: { error: { message: `You exceeded your current quota, please check your plan and billing details. (key ${SECRET})`, type: 'insufficient_quota', code: 'insufficient_quota' } } };
  };
  try {
    const post = jsonPost(app.url, sessionCookie('tok-clin', CLIN));
    await assert.rejects(runPipeline(post, CASES.shoulderLeft.transcript), (err) => {
      assert.ok(err instanceof RouteError);
      assert.deepEqual([err.path, err.status], ['/api/generate-note', 500]);
      assert.match(diagnoseFailure({ status: err.status, body: err.body, logs: app.logs(), provider }), /Quota OpenAI esaurita/);
      return true;
    });
    const logs = relevantLogs(app.logs());
    assert.match(logs, /insufficient_quota|exceeded your current quota/, 'the route\'s error is in the log shown');
    assert.ok(!logs.includes(SECRET), 'the key does not appear in the log shown');
  } finally {
    fake.state.openaiForward = null;
  }
});

test('a session the app does not accept is reported as HTTP 401, before any OpenAI call', async () => {
  let calls = 0;
  fake.state.openaiForward = async () => {
    calls++;
    return { status: 500, json: {} };
  };
  try {
    const post = jsonPost(app.url, sessionCookie('tok-unknown', CLIN));
    await assert.rejects(post('/api/generate-note', { transcript: '', lang: 'it' }), (err) => {
      assert.ok(err instanceof RouteError);
      assert.equal(err.status, 401);
      assert.match(diagnoseFailure({ status: err.status, body: err.body }), /Autenticazione del professionista/);
      return true;
    });
    assert.equal(calls, 0, 'no call to OpenAI');
    // The free check of the live script: the synthetic clinician is accepted, an empty note is refused as invalid.
    await assert.rejects(jsonPost(app.url, sessionCookie('tok-clin', CLIN))('/api/generate-note', { transcript: '', lang: 'it' }), (err) => err.status === 400);
    assert.equal(calls, 0);
  } finally {
    fake.state.openaiForward = null;
  }
});
