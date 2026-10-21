// lib/evidence.ts: the stored evidence levels (English enums, Italian words,
// ranges, free text) read into one tier each, so every page colours the same
// level the same way; unknown values are kept as written.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

let E;
before(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'phygo-ev-'));
  try {
    const src = readFileSync(new URL('../lib/evidence.ts', import.meta.url), 'utf8');
    writeFileSync(join(dir, 'evidence.mjs'), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
    E = await import(join(dir, 'evidence.mjs'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('every stored form of a level gets the same tier', () => {
  const cases = {
    strong: ['high', 'Strong', 'alta', 'Forte', 'Evidenza elevata', 'High - RCTs', 'élevée', 'fuerte'],
    moderate_high: ['moderata-alta', 'Moderate-high', 'moderate to high', 'alta-moderata'],
    moderate: ['moderate', 'Moderata', 'moderada', 'modérée', 'Moderate - cohort studies'],
    low_moderate: ['bassa-moderata', 'low-moderate', 'low to moderate'],
    weak: ['low', 'Limited', 'bassa', 'limitata', 'debole', 'very low', 'faible', 'baja', 'insufficiente'],
    consensus: ['expert consensus', 'Consenso di esperti', 'expert opinion'],
  };
  for (const [tier, values] of Object.entries(cases)) {
    for (const v of values) assert.equal(E.evidenceTier(v), tier, `${v} → ${tier}`);
  }
  assert.equal(E.evidenceTier(''), null);
  assert.equal(E.evidenceTier(null), null);
  assert.equal(E.evidenceTier('Grade B'), null, 'not recognised: no colour is guessed');
});

test('labels in the reader’s language; unknown values stay as written', () => {
  assert.equal(E.evidenceLabel('high', 'it'), 'Alta');
  assert.equal(E.evidenceLabel('moderata', 'en'), 'Moderate');
  assert.equal(E.evidenceLabel('bassa-moderata', 'fr'), 'Faible à modérée');
  assert.equal(E.evidenceLabel(' Grade B ', 'it'), 'Grade B');
  for (const tier of ['strong', 'moderate_high', 'moderate', 'low_moderate', 'weak', 'consensus', 'unknown']) {
    assert.ok(E.EVIDENCE_STYLE[tier].chip && E.EVIDENCE_RGB[tier].length === 3);
  }
});
