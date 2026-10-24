// After "Generate note": the condition sheet with its rehab phases and the
// Science papers.
//   - lib/knowledge/conditionMatch.ts: names and keywords in every language,
//     matched as whole words against the primary condition (often English)
//     and the assessment; generic words alone never match;
//   - lib/knowledge/paperRank.ts: a whole phrase and the title count more;
//   - /api/knowledge-lookup against the fake Supabase: reads past the first
//     1000 sheets, matches an English primary condition through the stored
//     translations, returns the sheet's phases, and answers "no match" when
//     nothing fits (the AI fallback is unavailable in tests);
//   - /api/science/relevant: only approved ("published") papers, most
//     relevant first.
// Synthetic content only.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { startFakeSupabase, sessionCookie } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54808);
const APP_PORT = Number(process.env.KNOWLEDGE_APP_PORT ?? 3808);

let K; // conditionMatch
let R; // paperRank
before(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-kb-'));
  const out = (f, src) => writeFileSync(join(dir, `${f}.mjs`), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
  try {
    out('conditionMatch', readFileSync(new URL('../lib/knowledge/conditionMatch.ts', import.meta.url), 'utf8'));
    out('region', readFileSync(new URL('../lib/clinical/region.ts', import.meta.url), 'utf8'));
    out('paperRank', readFileSync(new URL('../lib/knowledge/paperRank.ts', import.meta.url), 'utf8').replace("from './conditionMatch'", "from './conditionMatch.mjs'").replace("from '../clinical/region'", "from './region.mjs'"));
    K = await import(join(dir, 'conditionMatch.mjs'));
    R = await import(join(dir, 'paperRank.mjs'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const shoulder = { id: 's1', condition_name: 'Tendinopatia della cuffia dei rotatori', condition_keywords: 'cuffia dei rotatori, tendinopatia cuffia', translations: { en: { condition_name: 'Rotator cuff tendinopathy', condition_keywords: 'rotator cuff, rotator cuff tendinopathy' } } };
const back = { id: 'b1', condition_name: 'Lombalgia aspecifica', condition_keywords: 'lombalgia, mal di schiena, dolore', translations: { en: { condition_name: 'Non-specific low back pain', condition_keywords: 'low back pain' } } };
const hip = { id: 'h1', condition_name: 'Artrosi d’anca', condition_keywords: 'hip, coxartrosi', translations: null };

test('a sheet is found in any language, as whole words; generic words alone do not match', () => {
  assert.equal(K.bestCondition([back, shoulder], 'Rotator cuff tendinopathy', 'Dolore alla spalla').row.id, 's1', 'English primary condition, Italian sheet');
  assert.equal(K.bestCondition([back, shoulder], '', 'Possibile lombalgia aspecifica da sovraccarico').row.id, 'b1', 'found in the assessment');
  assert.equal(K.bestCondition([back, shoulder], 'Dolore', 'dolore'), null, '"dolore" alone is too generic');
  assert.equal(K.bestCondition([hip], 'chip fracture', ''), null, 'whole words only');
  const both = K.bestCondition([back, shoulder], 'low back pain', 'also rotator cuff irritation');
  assert.equal(both.row.id, 'b1', 'the primary condition weighs more than the assessment');
  assert.equal(K.normalizeText('Artrosi d’anca'), 'artrosi danca');
});

test('papers: whole phrase and title first', () => {
  const terms = R.searchTerms(['rotator cuff tendinopathy']);
  assert.deepEqual(terms.phrases, ['rotator cuff tendinopathy']);
  assert.ok(terms.words.includes('rotator') && terms.words.includes('tendinopathy'));
  const phraseInTitle = R.paperScore({ title: 'Exercise for rotator cuff tendinopathy', abstract: '' }, terms);
  const wordsInAbstract = R.paperScore({ title: 'Shoulder pain trial', abstract: 'rotator muscles and tendinopathy' }, terms);
  assert.ok(phraseInTitle > wordsInAbstract && wordsInAbstract > 0);
  assert.equal(R.paperScore({ title: 'Knee osteoarthritis', abstract: 'quadriceps' }, terms), 0);
});

test('papers: direct, indirect with its reason, unverified, or not shown', () => {
  const terms = R.searchTerms(['rotator cuff tendinopathy', 'shoulder pain', 'musculoskeletal pain']);
  assert.ok(!terms.phrases.includes('musculoskeletal pain'), 'a phrase of generic words only is not a search term');
  const shoulder = ['shoulder'];
  const rel = (title, abstract = '', regions = shoulder) => R.paperRelevance({ title, abstract }, terms, regions);
  assert.deepEqual(rel('Exercise for rotator cuff tendinopathy'), { level: 'direct', reason: 'same_condition' });
  assert.deepEqual(rel('Subacromial pain: a randomised trial', 'Patients with rotator cuff tendinopathy'), { level: 'direct', reason: 'same_region' });
  assert.deepEqual(rel('Shoulder tendinopathy and sleep', 'tendinopathy'), { level: 'indirect', reason: 'same_region' });
  // A relevant mechanism in a paper about another region: kept, with the reason said.
  assert.deepEqual(rel('Loading programmes in Achilles tendinopathy', 'tendinopathy'), { level: 'indirect', reason: 'same_mechanism_other_region' });
  // Another region, sharing only a mention of shoulder pain in the abstract: not shown.
  assert.equal(rel('Traumatic leg pain in adolescents', 'including shoulder pain and knee complaints'), null);
  assert.equal(rel('Exercise therapy for chronic musculoskeletal pain', 'Exercise and education'), null, 'generic words only');
  // Region not recognised: shown as unverified, never as direct.
  assert.deepEqual(rel('Tendinopathy: principles of load', 'tendinopathy and rotator mechanics'), { level: 'unverified', reason: 'paper_region_unknown' });
  assert.deepEqual(rel('Exercise for rotator cuff tendinopathy', '', []), { level: 'unverified', reason: 'case_region_unknown' });
});

// ---------------------------------------------------------------- routes

const CLIN = { id: '8f800000-0000-4000-8000-000000000001', email: 'kb@test.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated' };
const filler = Array.from({ length: 1060 }, (_, i) => ({ id: `a${String(i).padStart(4, '0')}`, condition_name: `Synthetic condition ${i}`, condition_keywords: `synthetic keyword ${i}`, translations: null }));
// Sorted by id, the shoulder sheet comes after the first 1000 rows.
const target = { ...shoulder, id: 'z0001', goals: 'Synthetic goals', source: 'Synthetic guideline', source_date: '2023' };

let fake;
let app;
before(async () => {
  fake = await startFakeSupabase({
    port: FAKE_PORT,
    users: { 'tok-clin': CLIN },
    tables: {
      profiles: [{ id: CLIN.id, practice_stage: 'professional', professional_status: 'verified', plan: 'free', preferred_language: 'it' }],
      knowledge_base: [...filler, target],
      rehab_phases: [
        { id: 'p2', condition_id: 'z0001', phase_number: 2, phase_name: 'Synthetic loading', translations: null },
        { id: 'p1', condition_id: 'z0001', phase_number: 1, phase_name: 'Synthetic protection', translations: { en: { phase_name: 'Synthetic protection (en)' } } },
        { id: 'px', condition_id: 'a0001', phase_number: 1, phase_name: 'Other sheet' },
      ],
      research_papers: [
        { id: 'r1', status: 'published', title: 'Shoulder trial', abstract: 'Load for rotator tendons', publication_date: '2024-01-01', research_summaries: { why_it_matters: 'Synthetic why 1', evidence_strength: 'moderate' } },
        { id: 'r2', status: 'published', title: 'Rotator cuff tendinopathy: exercise review', abstract: '', publication_date: '2020-01-01', research_summaries: { why_it_matters: 'Synthetic why 2', evidence_strength: 'high' } },
        { id: 'r3', status: 'pending_review', title: 'Rotator cuff tendinopathy exercise trial', abstract: 'rotator cuff tendinopathy', publication_date: '2025-01-01', research_summaries: null },
        { id: 'r4', status: 'published', title: 'Knee osteoarthritis education', abstract: 'quadriceps', publication_date: '2025-01-01', research_summaries: null },
      ],
      ask_phygo_usage: [],
    },
  });
  app = await startApp({ fakeUrl: fake.url, port: APP_PORT });
});
after(async () => {
  await app?.stop();
  await fake?.close();
});

const post = async (path, body, who = 'clin') => {
  const res = await fetch(`${app.url}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...(who ? { cookie: sessionCookie('tok-clin', CLIN) } : {}) }, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => null) };
};

test('knowledge lookup: past the first 1000 sheets, through translations, with its phases', async () => {
  assert.equal((await post('/api/knowledge-lookup', { assessment: 'x' }, null)).status, 401);
  const res = await post('/api/knowledge-lookup', { primaryCondition: 'Rotator cuff tendinopathy', assessment: 'Dolore anteriore di spalla', lang: 'it' });
  assert.equal(res.status, 200);
  assert.equal(res.body.match?.id, 'z0001');
  assert.equal(res.body.matchedBy, 'keyword');
  assert.deepEqual(res.body.phases.map((p) => p.phase_name), ['Synthetic protection', 'Synthetic loading'], 'this sheet’s phases, in order');
  const en = await post('/api/knowledge-lookup', { primaryCondition: 'rotator cuff', assessment: '', lang: 'en' });
  assert.equal(en.body.match.condition_name, 'Rotator cuff tendinopathy', 'the sheet in the note’s language');
  assert.equal(en.body.phases[0].phase_name, 'Synthetic protection (en)');
  const none = await post('/api/knowledge-lookup', { primaryCondition: 'Synthetic unknown thing', assessment: 'nothing that matches' });
  assert.deepEqual([none.status, none.body.match, none.body.phases], [200, null, []]);
});

test('relevant papers: approved only, most relevant first', async () => {
  // The fake OpenAI is unavailable, so the route searches with the condition text itself.
  const res = await post('/api/science/relevant', { primaryCondition: 'rotator cuff tendinopathy', assessment: '' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.papers.map((p) => p.id), ['r2', 'r1'], 'phrase in the title first; the paper under review and the unrelated one are left out');
  assert.equal(res.body.papers[0].why_it_matters, 'Synthetic why 2');
});
