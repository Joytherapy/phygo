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
let G; // region
before(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-kb-'));
  const out = (f, src) => writeFileSync(join(dir, `${f}.mjs`), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
  try {
    out('conditionMatch', readFileSync(new URL('../lib/knowledge/conditionMatch.ts', import.meta.url), 'utf8'));
    out('region', readFileSync(new URL('../lib/clinical/region.ts', import.meta.url), 'utf8'));
    out('paperRank', readFileSync(new URL('../lib/knowledge/paperRank.ts', import.meta.url), 'utf8').replace("from './conditionMatch'", "from './conditionMatch.mjs'").replace("from '../clinical/region'", "from './region.mjs'"));
    K = await import(join(dir, 'conditionMatch.mjs'));
    R = await import(join(dir, 'paperRank.mjs'));
    G = await import(join(dir, 'region.mjs'));
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

test('a diagnosis is stated only by the clinician; a generic regional sheet names only the region\'s pain', () => {
  const row = (condition_name, condition_keywords = '') => ({ id: 1, condition_name, condition_keywords });
  const cuff = row('Tendinopatia della cuffia dei rotatori', 'cuffia dei rotatori, rotator cuff');
  assert.equal(K.conditionStated(cuff, 'dolore alla spalla destra in elevazione', G.REGION_WORDS, true), false, 'pain in the shoulder does not state a cuff tendinopathy');
  assert.equal(K.conditionStated(cuff, 'sospetta cuffia dei rotatori', G.REGION_WORDS, true), true);
  assert.equal(K.conditionStated(cuff, 'tendinopatia del sovraspinato', G.REGION_WORDS, true), true, 'the condition word of the sheet, same region');
  assert.equal(K.conditionStated(cuff, 'tendinopatia achillea', G.REGION_WORDS, false), false, 'the condition word alone, in another region, is not enough');
  assert.equal(K.conditionStated(row('Dolore femororotuleo', 'femororotuleo, dolore anteriore di ginocchio'), 'dolore al ginocchio scendendo le scale', G.REGION_WORDS, true), false);
  for (const [name, region, want] of [['Dolore di ginocchio aspecifico', 'knee', true], ['Lombalgia aspecifica', 'lumbar', true], ['Cervicalgia', 'cervical', true], ['Dolore femororotuleo', 'knee', false], ['Coxartrosi', 'hip', false], ['Tendinopatia della cuffia dei rotatori', 'shoulder', false], ['Lombalgia aspecifica', 'knee', false]]) {
    assert.equal(K.isRegionalSheet(row(name), region), want, `${name} (${region})`);
  }
});

test('papers: a population or a mechanism the case does not state is not claimed', () => {
  const leg = 'Traumatic leg pain in adolescents: a cohort study';
  assert.deepEqual(R.unstatedQualifiers(leg, 'Dolore al ginocchio sinistro scendendo le scale'), ['adolescents', 'trauma']);
  assert.deepEqual(R.unstatedQualifiers(leg, 'Ragazzo di 15 anni, dolore al ginocchio dopo una caduta'), [], 'age and fall stated');
  assert.deepEqual(R.unstatedQualifiers('Rehabilitation after anterior cruciate ligament reconstruction', 'Ricostruzione LCA sei settimane fa'), []);
  assert.deepEqual(R.unstatedQualifiers('Rehabilitation after anterior cruciate ligament reconstruction', 'Dolore al ginocchio'), ['surgery']);
  assert.deepEqual(R.unstatedQualifiers('Knee pain in older adults', 'Paziente di 72 anni con gonalgia'), [], 'an age in the range counts');
  assert.deepEqual(R.unstatedQualifiers('Exercise therapy for patellofemoral pain', 'dolore al ginocchio'), [], 'no population, no mechanism');
});

test('papers: "same region" means the same region; a neighbouring one is never claimed as it', () => {
  const terms = R.searchTerms(['patellar tendinopathy', 'knee pain']);
  const achilles = R.paperRelevance({ title: 'Loading programmes in Achilles tendinopathy', abstract: 'Progressive tendon loading in tendinopathy.' }, terms, ['knee']);
  assert.ok(achilles && achilles.reason !== 'same_region' && achilles.level !== 'direct', JSON.stringify(achilles));
  assert.deepEqual(achilles, { level: 'indirect', reason: 'same_mechanism_other_region' }, 'the shared mechanism, said as such');
  const calf = R.paperRelevance({ title: 'Calf strength and knee pain in runners', abstract: 'Knee pain.' }, terms, ['knee']);
  assert.ok(calf && calf.reason !== 'adjacent_region', 'a paper that names the knee is about the knee');
  const hip = R.paperRelevance({ title: 'Hip muscle strength in tendinopathy', abstract: 'Hip strength.' }, terms, ['knee']);
  assert.notEqual(hip?.reason, 'same_region', `the hip is near the knee, not the knee (${JSON.stringify(hip)})`);
  const thigh = R.paperRelevance({ title: 'Quadriceps strength after injury', abstract: 'Knee pain and quadriceps.' }, terms, ['knee']);
  assert.ok(!thigh || thigh.level !== 'direct', JSON.stringify(thigh));
});

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
