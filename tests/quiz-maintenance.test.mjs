// /api/quiz/verify-batch spends an OpenAI request and deletes shared quiz
// questions the model rejects. It is a maintenance tool: administrators only.
// Before this change any signed-in account (sign-up is open) could call it.
// Synthetic accounts and questions; OpenAI is the fake server.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);
const person = (n, email) => ({ id: `0e100000-0000-4000-8000-00000000000${n}`, email, email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' });
const people = {
  admin: person(1, 'admin@test.invalid'),
  physio: person(2, 'physio@test.invalid'),
  student: person(3, 'student@test.invalid'),
  patient: person(4, 'patient@test.invalid'),
};
const cookie = (who) => (who ? { cookie: sessionCookie(`tok-${who}`, people[who]) } : {});
const question = { id: 'q1', subject: 'anatomy', difficulty: 'easy', language: 'it', question: 'Synthetic question', options: ['a', 'b', 'c', 'd'], correct_index: 0, explanation: null, verified_at: null };

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: Object.fromEntries(Object.entries(people).map(([k, u]) => [`tok-${k}`, u])),
    tables: {
      profiles: [
        { id: people.physio.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free' },
        { id: people.student.id, practice_stage: 'student', plan: 'free' },
        { id: people.patient.id, practice_stage: 'patient', plan: 'free' },
      ],
      quiz_questions: [question],
    },
  });
  app = await startApp({ fakeUrl: fake.url, port: 3442 });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const verify = (who, headers = {}) =>
  fetch(`${app.url}/api/quiz/verify-batch`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...cookie(who), ...headers },
    body: JSON.stringify({ subject: 'anatomy', difficulty: 'easy', language: 'it' }),
  });
const openaiCalls = () => fake.state.requests.filter((r) => r.path.startsWith('/openai/')).length;

test('visitors and ordinary accounts are refused before OpenAI or the question pool is touched', async () => {
  const before = openaiCalls();
  assert.equal((await verify(null)).status, 401);
  for (const who of ['physio', 'student', 'patient']) assert.equal((await verify(who)).status, 403, who);
  assert.equal((await verify(null, { authorization: 'Bearer wrong-token' })).status, 401);
  assert.equal(openaiCalls(), before, 'no OpenAI request');
  assert.deepEqual(fake.state.tables.quiz_questions.map((q) => q.id), ['q1'], 'no question deleted');
});

test('an administrator passes the gate and the batch reaches the AI service', async () => {
  const before = openaiCalls();
  const res = await verify('admin');
  // The fake OpenAI always answers 500 (tests never reach a real model), so the
  // route reports 502 after the call; what matters here is that it got there.
  assert.ok(![401, 403].includes(res.status), `not refused (${res.status})`);
  assert.ok(openaiCalls() > before, 'the batch reached the (fake) AI service');
});
