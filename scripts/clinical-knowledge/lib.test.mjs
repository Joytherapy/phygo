// node --test scripts/clinical-knowledge/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIndex, findDuplicates, normalizeName, titleMatches, validateCondition, validateProtocol, verifySourceOnline } from './lib.mjs';

const library = JSON.parse(readFileSync(new URL('./test/fixtures/knowledge_base.json', import.meta.url), 'utf8'));
const without = (...ids) => buildIndex(library.filter((c) => !ids.includes(c.id)));

// Synthetic content only: these tests check structure, not clinical text.
const src = (supports, extra = {}) => ({ citation: 'Synthetic citation for tests', source_type: 'guideline', pmid: '12345678', supports, ...extra });
const fullCondition = (over = {}) => ({
  slug: 'test-condition',
  condition_name: 'Test condition alpha',
  specialty: 'musculoskeletal',
  body_region: 'knee',
  evidence_level: 'moderate',
  review_status: 'source_checked',
  clinical_presentation: 'x', assessment_considerations: 'x', clinical_tests: 'x', red_flags: 'x', differential_diagnosis: 'x',
  contraindications: 'x', goals: 'x', typical_exercises: 'x', progression_criteria: 'x', outcome_measures: 'x', return_to_activity_criteria: 'x',
  sources: [src(['clinical_presentation', 'assessment_considerations', 'clinical_tests', 'red_flags', 'differential_diagnosis', 'contraindications', 'goals', 'typical_exercises', 'progression_criteria', 'outcome_measures', 'return_to_activity_criteria'])],
  ...over,
});

test('normalizeName keeps hyphenated names and drops descriptive tails', () => {
  assert.equal(normalizeName('Sindrome di Guillain-Barré'), 'sindrome di guillain barre');
  assert.equal(normalizeName('Sindrome di Sjogren — esercizio fisico'), 'sindrome di sjogren');
});

test('catches the duplicates that reached the live library', () => {
  // #646 duplicates #46 with the words in another order.
  assert.deepEqual(findDuplicates({ condition_name: 'Neuropatia Diabetica Periferica' }, without(646)).exact.map((d) => d.id), [46]);
  // #473 duplicates #423 with a different descriptive tail.
  assert.ok(findDuplicates({ condition_name: 'Sindrome di Sjogren — esercizio fisico' }, without(473)).exact.some((d) => d.id === 423));
});

test('distinct conditions with similar names are only flagged for review', () => {
  const r = findDuplicates({ condition_name: 'Tendinopatia del Tibiale Anteriore' }, without(169));
  assert.equal(r.exact.length, 0);
  assert.ok(r.near.some((d) => d.id === 161)); // posterior tibialis: similar name, different condition
});

test('a complete, sourced record passes', () => {
  const r = validateCondition(fullCondition(), buildIndex([]));
  assert.deepEqual(r.errors, []);
});

test('a draft may be incomplete, but only as a draft', () => {
  const draft = { slug: 'draft-only', condition_name: 'Test condition beta', specialty: 'neurology' };
  assert.deepEqual(validateCondition(draft, buildIndex([])).errors, []);
  assert.ok(validateCondition({ ...draft, review_status: 'source_checked' }, buildIndex([])).errors.length > 5);
});

test('imports cannot claim clinical review or approval', () => {
  for (const s of ['clinically_reviewed', 'approved']) {
    assert.ok(validateCondition(fullCondition({ review_status: s }), buildIndex([])).errors.some((e) => e.at.endsWith('review_status')));
  }
});

test('not applicable needs a reason and is never allowed for safety fields', () => {
  const noReason = validateCondition(fullCondition({ return_to_activity_criteria: '', field_status: { return_to_activity_criteria: { status: 'not_applicable' } } }), buildIndex([]));
  assert.ok(noReason.errors.some((e) => e.msg.includes('needs a reason')));
  const safety = validateCondition(fullCondition({ red_flags: '', field_status: { red_flags: { status: 'not_applicable', reason: 'n/a' } } }), buildIndex([]));
  assert.ok(safety.errors.some((e) => e.msg.includes('safety fields')));
});

test('every filled field must be backed by a source', () => {
  const r = validateCondition(fullCondition({ sources: [src(['goals'])] }), buildIndex([]));
  assert.ok(r.errors.some((e) => e.at.endsWith('red_flags') && e.msg.includes('no source')));
});

test('placeholders block anything beyond draft', () => {
  const r = validateCondition(fullCondition({ goals: 'DA VERIFICARE' }), buildIndex([]));
  assert.ok(r.errors.some((e) => e.msg.includes('placeholder')));
});

test('sources need a checkable identifier', () => {
  const r = validateCondition(fullCondition({ sources: [{ citation: 'x', source_type: 'guideline', supports: ['goals'] }] }), buildIndex([]));
  assert.ok(r.errors.some((e) => e.msg.includes('pmid, doi or url')));
});

test('protocols: ordered phases, real exercise ids, linked conditions', () => {
  const base = {
    slug: 'test-protocol', title: 'Test protocol', condition_ids: [1], review_status: 'draft',
    phases: [
      { phase_number: 1, phase_name: 'A', phase_goals: 'x', criteria_to_progress: 'x', exercises: [{ exercise_id: '00000000-0000-4000-8000-000000000001', dosage: '3x10' }] },
      { phase_number: 2, phase_name: 'B', phase_goals: 'x', exercises: [{ exercise_id: '00000000-0000-4000-8000-000000000002', dosage: '3x10' }] },
    ],
  };
  const ok = validateProtocol(base, new Set([1]));
  assert.deepEqual(ok.errors, []);
  assert.ok(ok.warnings.some((w) => w.msg.includes('same dosage')));
  const bad = validateProtocol({ ...base, condition_ids: [999], phases: [{ ...base.phases[0], phase_number: 2, exercises: [{ exercise_id: 'squat' }] }] }, new Set([1]));
  assert.ok(bad.errors.some((e) => e.msg.includes('does not exist')));
  assert.ok(bad.errors.some((e) => e.msg.includes('phase_number must be 1')));
  assert.ok(bad.errors.some((e) => e.msg.includes('exercise library')));
});

test('online check rejects identifiers that name a different paper', async () => {
  const fake = (title) => async () => ({ ok: true, status: 200, json: async () => ({ result: { 12345678: { title } } }) });
  const s = { citation: 'Exercise therapy for knee osteoarthritis: a systematic review', pmid: '12345678' };
  assert.equal((await verifySourceOnline(s, fake('Exercise therapy for knee osteoarthritis: a systematic review.'))).ok, true);
  assert.equal((await verifySourceOnline(s, fake('Dietary sodium and blood pressure in adults'))).ok, false);
  assert.equal(titleMatches('A B C', ''), false);
});
