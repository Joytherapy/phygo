// Core clinical flows that had no functional coverage:
//   - the protocol shown in a session note (/api/knowledge-lookup): each rehab
//     phase once, keeping the most recent copy; a row without keywords neither
//     breaks the lookup nor matches everything;
//   - the Evidence Hub (/api/science/list): published papers only; papers
//     waiting for review only for an administrator; rejected papers never;
//   - PubMed dates (lib/science/pubDate.ts): unusual values ("2026 Spring")
//     no longer abort the daily import.
// Synthetic rows only, against the fake Supabase; no network.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);
const people = {
  admin: { id: '0c100000-0000-4000-8000-000000000001', email: 'admin@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' },
  physio: { id: '0c100000-0000-4000-8000-000000000002', email: 'physio@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' },
};
const cookie = (who) => (who ? { cookie: sessionCookie(`tok-${who}`, people[who]) } : {});

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: Object.fromEntries(Object.entries(people).map(([k, u]) => [`tok-${k}`, u])),
    tables: {
      knowledge_base: [
        // Listed first on purpose: a row without keywords, and one whose list ends with a comma.
        { id: 1, condition_name: 'No keywords', condition_keywords: null },
        { id: 2, condition_name: 'Trailing comma', condition_keywords: 'ankle sprain, ' },
        { id: 6, condition_name: 'Frozen shoulder', condition_keywords: 'frozen shoulder, adhesive capsulitis' },
      ],
      rehab_phases: [
        // Protocol 6 was imported twice: phase 1 appears twice; the newer copy (higher id) wins.
        { id: 10, condition_id: 6, phase_number: 1, phase_name: 'Old copy of phase 1' },
        { id: 11, condition_id: 6, phase_number: 2, phase_name: 'Phase 2' },
        { id: 20, condition_id: 6, phase_number: 1, phase_name: 'Phase 1' },
        { id: 30, condition_id: 2, phase_number: 1, phase_name: 'Ankle phase 1' },
      ],
      research_papers: [
        { id: 'r-pub', title: 'Published trial', status: 'published', publication_date: '2026-09-01' },
        { id: 'r-pend', title: 'Pending review', status: 'pending_review', publication_date: '2026-09-02' },
        { id: 'r-rej', title: 'Rejected paper', status: 'rejected', publication_date: '2026-09-03' },
      ],
    },
  });
  app = await startApp({ fakeUrl: fake.url, port: 3441 });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const lookup = (body) =>
  fetch(`${app.url}/api/knowledge-lookup`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());

test('session note protocol: each phase once, the most recent copy, in order', async () => {
  const out = await lookup({ assessment: 'Patient with frozen shoulder, 6 weeks', lang: 'it' });
  assert.equal(out.match?.id, 6);
  assert.deepEqual(out.phases.map((p) => p.phase_number), [1, 2]);
  assert.equal(out.phases[0].phase_name, 'Phase 1', 'the newer copy of phase 1 is kept');
});

test('session note protocol: a row without keywords or with an empty keyword matches nothing', async () => {
  // Before: null keywords threw (every lookup answered "no match"), and the
  // empty keyword after the trailing comma matched any text.
  const out = await lookup({ assessment: 'Low back pain after lifting', lang: 'it' });
  assert.equal(out.match, null);
  assert.equal((await lookup({ assessment: 'Acute ankle sprain', lang: 'it' })).match?.id, 2, 'real keywords still match');
});

const list = (query = '', who) => fetch(`${app.url}/api/science/list${query}`, { headers: cookie(who) });

test('Evidence Hub: published papers only, for everyone', async () => {
  for (const who of [null, 'physio', 'admin']) {
    const res = await list('', who);
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json()).papers.map((p) => p.id), ['r-pub'], `as ${who ?? 'visitor'}`);
  }
});

test('papers waiting for review: administrators only; rejected papers are never listed', async () => {
  assert.equal((await list('?status=pending_review')).status, 401);
  assert.equal((await list('?status=pending_review', 'physio')).status, 403);
  const res = await list('?status=pending_review', 'admin');
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).papers.map((p) => p.id), ['r-pend']);
  assert.equal((await list('?status=rejected', 'admin')).status, 400);
});

test('PubMed dates: unusual values give a date or null, never an exception', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-pubdate-'));
  try {
    const source = readFileSync('lib/science/pubDate.ts', 'utf8');
    writeFileSync(join(dir, 'pubDate.mjs'), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
    const { parsePubDate } = await import(join(dir, 'pubDate.mjs'));
    assert.ok(Number.isNaN(new Date('2026 Spring').getTime()), 'the value that used to abort the import');
    assert.equal(parsePubDate('2026 Mar 15'), '2026-03-15');
    assert.equal(parsePubDate('2026 Mar'), '2026-03-01');
    assert.equal(parsePubDate('2026'), '2026-01-01');
    assert.equal(parsePubDate('2026 Spring'), '2026-03-01');
    assert.equal(parsePubDate('2025 Dec-2026 Jan'), '2025-12-01');
    assert.equal(parsePubDate('2026 Feb 31'), '2026-02-01');
    assert.equal(parsePubDate('2026/03/15'), '2026-03-15');
    assert.equal(parsePubDate('2026-03-15'), '2026-03-15');
    assert.equal(parsePubDate(''), null);
    assert.equal(parsePubDate(undefined), null);
    assert.equal(parsePubDate('Spring'), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
