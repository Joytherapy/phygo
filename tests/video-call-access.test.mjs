// Private video calls (lib/videoCall.ts, /api/video-call/*): who can get a
// Daily meeting token, for which room, for how long.
//   - rooms are private, at most 2 people, closed at expiry; names carry
//     nothing about the patient; the call is recorded by the server;
//   - the clinician gets a token only for their own patients' calls, and only
//     while verified; the patient only for their own calls, signed in;
//   - no token without a session, for another patient or clinician, for an
//     ended, expired or old public call; a new token for every request,
//     within the hourly limit; the browser cannot choose the room.
// What these tests cannot show: that Daily itself refuses a private room
// without a token, an expired token, or a deleted room. That needs a real
// Daily account (see the PR).
// Synthetic people and patients only, against the fake Supabase and the
// Daily stand-in; the network guard refuses any real host.
import { test, before, after } from 'node:test';
import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);
let n = 0;
const person = (email) => ({ id: `0d100000-0000-4000-8000-${String(++n).padStart(12, '0')}`, email, email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' });
const people = {
  physioA: person('a@test.invalid'), // verified, patients P1 and P2
  physioB: person('b@test.invalid'), // verified, patient P3
  physioU: person('u@test.invalid'), // not verified, patient P4
  patientOne: person('p1@test.invalid'), // My Phygo account of P1
  patientTwo: person('p2@test.invalid'), // My Phygo account of P2 (same clinician as P1)
};
const P = (k) => `0d200000-0000-4000-8000-00000000000${k}`;
const NAME = /^phygo-[0-9a-f]{32}$/;
const DAILY_KEY = 'test-daily-key-never-sent';
// The server's rule (lib/videoCall.ts roomNameFor): the room is named after the call id with a keyed hash.
const roomNameFor = (callId) => `phygo-${createHmac('sha256', DAILY_KEY).update(`phygo-room:${callId}`).digest('hex').slice(0, 32)}`;
const pro = (who, status) => ({ id: people[who].id, practice_stage: 'professional', professional_status: status, plan: 'free', display_name: who });

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: Object.fromEntries(Object.entries(people).map(([k, u]) => [`tok-${k}`, u])),
    tables: {
      profiles: [
        pro('physioA', 'verified'), pro('physioB', 'verified'), pro('physioU', 'pending'),
        { id: people.patientOne.id, practice_stage: 'patient', plan: 'free', display_name: 'P1' },
        { id: people.patientTwo.id, practice_stage: 'patient', plan: 'free', display_name: 'P2' },
      ],
      patients: [
        { id: P(1), user_id: people.physioA.id, patient_user_id: people.patientOne.id, name: 'Synthetic patient 1' },
        { id: P(2), user_id: people.physioA.id, patient_user_id: people.patientTwo.id, name: 'Synthetic patient 2' },
        { id: P(3), user_id: people.physioB.id, patient_user_id: null, name: 'Synthetic patient 3' },
        { id: P(4), user_id: people.physioU.id, patient_user_id: null, name: 'Synthetic patient 4' },
      ],
      video_calls: [],
      professional_transition_accounts: [],
      ask_phygo_usage: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url, port: 3435, env: { DAILY_API_KEY: DAILY_KEY } });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const post = (path, who, body) =>
  fetch(`${app.url}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(who ? { cookie: sessionCookie(`tok-${who}`, people[who]) } : {}) },
    body: JSON.stringify(body ?? {}),
  });
const token = (who, callId, extra = {}) => post('/api/video-call/token', who, { callId, lang: 'it', ...extra });
const tokensIssued = () => fake.state.daily.tokens.length;
const start = async (who, patientId) => {
  const res = await post('/api/video-call/create-room', who, { patientId });
  assert.equal(res.status, 200, `${who} starts a call for ${patientId}`);
  return (await res.json()).call;
};
const addCall = (patientId, fields = {}) => {
  const id = crypto.randomUUID();
  const row = { id, patient_id: patientId, room_name: roomNameFor(id), status: 'active', created_at: new Date().toISOString(), ...fields };
  row.room_url ??= `https://test.invalid/${row.room_name}`;
  fake.state.tables.video_calls.push(row);
  return row;
};

let callP1;
test('a new room is private, for two people, closed at expiry, and recorded by the server', async () => {
  const before = fake.state.daily.rooms.length;
  callP1 = await start('physioA', P(1));
  const room = fake.state.daily.rooms.at(-1);
  assert.equal(fake.state.daily.rooms.length, before + 1);
  assert.equal(room.privacy, 'private');
  assert.equal(room.properties.max_participants, 2);
  assert.equal(room.properties.eject_at_room_exp, true);
  assert.equal(room.properties.enable_knocking, false, 'no way in without a token');
  const ttl = room.properties.exp - Date.now() / 1000;
  assert.ok(ttl > 3500 && ttl <= 3600, `room open for one hour (${ttl}s)`);
  assert.match(room.name, NAME);
  assert.equal(room.name, roomNameFor(callP1.id), 'the room is bound to this call');
  assert.ok(!JSON.stringify(room).includes(P(1)) && !JSON.stringify(callP1).includes(P(1)), 'no patient id in the room or its URL');
  const row = fake.state.tables.video_calls.find((c) => c.id === callP1.id);
  assert.equal(row.room_name, room.name, 'the call is recorded with the room the server created');
  assert.equal(row.created_by, people.physioA.id);
  assert.equal(row.status, 'active');
  assert.ok(!('token' in callP1), 'creating a room returns no token');
});

test('no token without a session, for an invalid id or an unknown call', async () => {
  const before = tokensIssued();
  assert.equal((await token(null, callP1.id)).status, 401);
  assert.equal((await token('physioA', 'not-a-uuid')).status, 400);
  assert.equal((await token('physioA', crypto.randomUUID())).status, 404);
  assert.equal(tokensIssued(), before, 'Daily was not asked for a token');
});

test('the clinician of the patient gets an owner token for that room only, valid for a few minutes', async () => {
  const res = await token('physioA', callP1.id);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('cache-control') ?? '', /no-store/);
  const body = await res.json();
  assert.equal(body.role, 'clinician');
  assert.equal(body.url, callP1.room_url);
  const props = fake.state.daily.tokens.at(-1);
  assert.equal(props.room_name, fake.state.tables.video_calls.find((c) => c.id === callP1.id).room_name, 'bound to this room (a token without room_name opens every room)');
  assert.equal(props.is_owner, true);
  const ttl = props.exp - Date.now() / 1000;
  assert.ok(ttl > 0 && ttl <= 600, `short time to join (${ttl}s)`);
  assert.ok(props.nbf <= Date.now() / 1000);
  assert.ok(!('eject_at_token_exp' in props), 'the room, not the token, ends the call');
  assert.equal(props.user_name, 'Fisioterapista', 'a role, never a name or an e-mail');
  assert.ok(!JSON.stringify(props).includes('@') && !JSON.stringify(props).includes(people.physioA.id) && !JSON.stringify(props).includes(P(1)));
});

test('the patient, signed in, gets a non-owner token for their own call', async () => {
  const res = await token('patientOne', callP1.id);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).role, 'patient');
  const props = fake.state.daily.tokens.at(-1);
  assert.equal(props.is_owner, false);
  assert.equal(props.user_name, 'Paziente');
  assert.ok(!JSON.stringify(props).includes(people.patientOne.id) && !JSON.stringify(props).includes(P(1)));
});

test('another patient, another clinician or an unverified clinician gets nothing', async () => {
  const before = tokensIssued();
  assert.equal((await token('patientTwo', callP1.id)).status, 404, 'a patient of the same clinician');
  assert.equal((await token('physioB', callP1.id)).status, 404, 'another verified clinician');
  // The unverified clinician's own call (written directly: they cannot create rooms).
  assert.equal((await post('/api/video-call/create-room', 'physioU', { patientId: P(4) })).status, 403);
  const own = addCall(P(4));
  const res = await token('physioU', own.id);
  assert.equal(res.status, 403);
  assert.equal((await res.json()).code, 'verification_required');
  // Same answers for the clinician's other calls.
  const callP3 = await start('physioB', P(3));
  assert.equal((await token('physioA', callP3.id)).status, 404);
  assert.equal((await token('patientOne', callP3.id)).status, 404);
  assert.equal(tokensIssued(), before, 'Daily was not asked for any of these');
});

test('the room comes from the server record, never from the request', async () => {
  const otherRoom = `phygo-${crypto.randomUUID()}`;
  const res = await token('physioA', callP1.id, { roomName: otherRoom, room_name: otherRoom, url: `https://test.invalid/${otherRoom}` });
  assert.equal(res.status, 200);
  assert.notEqual(fake.state.daily.tokens.at(-1).room_name, otherRoom);
  assert.equal((await res.json()).url, callP1.room_url);
});

test('repeated requests: a new token each time, within the hourly limit', async () => {
  const before = tokensIssued();
  const a = await (await token('patientOne', callP1.id)).json();
  const b = await (await token('patientOne', callP1.id)).json();
  assert.notEqual(a.token, b.token, 'a new token for every join');
  assert.equal(tokensIssued(), before + 2);
  // At the limit, refused before Daily is asked.
  const key = `video-token:${people.patientOne.id}`;
  const usage = fake.state.tables.ask_phygo_usage.find((r) => r.ip === key);
  usage.request_count = 60;
  const limited = await token('patientOne', callP1.id);
  assert.equal(limited.status, 429);
  assert.equal(tokensIssued(), before + 2);
  usage.request_count = 0;
});

test('no token for an expired call or an old public room', async () => {
  const before = tokensIssued();
  const expired = addCall(P(1), { created_at: new Date(Date.now() - 61 * 60 * 1000).toISOString() });
  assert.equal((await token('physioA', expired.id)).status, 410);
  assert.equal((await token('patientOne', expired.id)).status, 410);
  const legacy = addCall(P(1), { room_name: `session-${P(1)}-1791880000000` });
  assert.equal((await token('physioA', legacy.id)).status, 410, 'rooms created before this change were public');
  assert.equal(tokensIssued(), before);
});

test('ending a call: only its clinician; then no token for anyone, and the room is deleted', async () => {
  assert.equal((await post('/api/video-call/end', 'patientOne', { callId: callP1.id })).status, 403, 'the patient can leave, not end');
  assert.equal((await post('/api/video-call/end', 'physioB', { callId: callP1.id })).status, 404, 'another clinician');
  assert.equal(fake.state.tables.video_calls.find((c) => c.id === callP1.id).status, 'active');
  const roomName = fake.state.tables.video_calls.find((c) => c.id === callP1.id).room_name;
  const res = await post('/api/video-call/end', 'physioA', { callId: callP1.id });
  assert.equal(res.status, 200);
  assert.equal(fake.state.tables.video_calls.find((c) => c.id === callP1.id).status, 'ended');
  assert.ok(fake.state.daily.deleted.includes(roomName), 'the Daily room is deleted');
  const before = tokensIssued();
  assert.equal((await token('physioA', callP1.id)).status, 410);
  assert.equal((await token('patientOne', callP1.id)).status, 410);
  assert.equal(tokensIssued(), before);
});

test('a row naming another call\'s room gets no token (clinicians can still write video_calls from the browser)', async () => {
  // Physio B learns the name of a live room of physio A and records it on their own patient.
  const victim = addCall(P(2));
  const forged = addCall(P(3), { room_name: victim.room_name, room_url: victim.room_url });
  const before = tokensIssued();
  assert.equal((await token('physioB', forged.id)).status, 410, 'the room does not belong to this call id');
  const wrongUrl = addCall(P(3));
  wrongUrl.room_url = `https://test.invalid/${victim.room_name}`;
  assert.equal((await token('physioB', wrongUrl.id)).status, 410, 'the URL must be the call\'s own room');
  assert.equal(tokensIssued(), before, 'Daily was not asked for a token');
});

test('a stale call never blocks the clinician: it can be ended, and a new call replaces it', async () => {
  const stale = addCall(P(1), { created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() });
  const legacy = addCall(P(1), { room_name: `session-${P(1)}-1791880000000` });
  assert.equal((await token('physioA', stale.id)).status, 410, 'no token for it');
  assert.equal((await post('/api/video-call/end', 'physioA', { callId: stale.id })).status, 200, 'but the clinician can end it');
  assert.equal(fake.state.tables.video_calls.find((c) => c.id === stale.id).status, 'ended');
  assert.ok(!fake.state.daily.deleted.includes(legacy.room_name));
  const fresh = await start('physioA', P(1));
  assert.equal(fake.state.tables.video_calls.find((c) => c.id === legacy.id).status, 'ended', 'starting a call ends the older active ones');
  const active = fake.state.tables.video_calls.filter((c) => c.patient_id === P(1) && c.status === 'active');
  assert.deepEqual(active.map((c) => c.id), [fresh.id], 'one active call per patient');
  assert.equal((await post('/api/video-call/end', 'patientOne', { callId: fresh.id })).status, 403, 'the patient still cannot end it');
});

test('Daily refuses to delete the room: the call still ends, the clinician is told, and can close the room again', async () => {
  const call = await start('physioA', P(2));
  const roomName = fake.state.tables.video_calls.find((c) => c.id === call.id).room_name;
  const attempts = () => fake.state.daily.deleteAttempts.filter((n) => n === roomName).length;
  fake.state.daily.deleteFailures.push(500, 500);
  const res = await post('/api/video-call/end', 'physioA', { callId: call.id });
  assert.equal(res.status, 502, 'never a 200 while the room is still open');
  assert.equal((await res.json()).code, 'room_not_closed');
  assert.equal(attempts(), 2, 'deletion is tried twice');
  assert.ok(!fake.state.daily.deleted.includes(roomName));
  const row = fake.state.tables.video_calls.find((c) => c.id === call.id);
  assert.equal(row.status, 'ended', 'no new token in the meantime');
  const endedAt = row.ended_at;
  const before = tokensIssued();
  assert.equal((await token('physioA', call.id)).status, 410);
  assert.equal((await token('patientTwo', call.id)).status, 410);
  assert.equal(tokensIssued(), before, 'Daily was not asked for a token');
  // Ending the same call again only retries the room.
  assert.equal((await post('/api/video-call/end', 'patientTwo', { callId: call.id })).status, 403, 'the patient still cannot end it');
  assert.equal((await post('/api/video-call/end', 'physioB', { callId: call.id })).status, 404, 'nor another clinician');
  const retry = await post('/api/video-call/end', 'physioA', { callId: call.id });
  assert.equal(retry.status, 200);
  assert.ok(fake.state.daily.deleted.includes(roomName), 'the room is deleted on retry');
  assert.equal(fake.state.tables.video_calls.find((c) => c.id === call.id).ended_at, endedAt, 'the end time is kept');
});

test('closing the room: one transient refusal is retried, and a room Daily no longer has counts as closed', async () => {
  const call = await start('physioA', P(2));
  const roomName = fake.state.tables.video_calls.find((c) => c.id === call.id).room_name;
  fake.state.daily.deleteFailures.push(503);
  assert.equal((await post('/api/video-call/end', 'physioA', { callId: call.id })).status, 200);
  assert.ok(fake.state.daily.deleted.includes(roomName), 'deleted on the second attempt');
  const gone = await start('physioA', P(2));
  fake.state.daily.deleteFailures.push(404);
  assert.equal((await post('/api/video-call/end', 'physioA', { callId: gone.id })).status, 200, 'already gone (404) is closed');
  assert.equal(fake.state.tables.video_calls.find((c) => c.id === gone.id).status, 'ended');
});
