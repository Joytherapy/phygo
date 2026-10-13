// Professional-verification sections of /privacy and /terms (4 languages):
//   - the site text is generated from the drafts in docs/legal and is in sync;
//   - nothing is published until every value is set in every language AND the
//     legal review is approved (lib/i18n/legal/verificationValues.ts);
//   - once ready, no placeholder is left, the privacy section has the anchor
//     the verification form links to, §3A follows §3 and §12 names the law;
//   - the pages built today show no placeholder and no verification section.
// Synthetic values only; no network.
// When the texts are published (values filled and LEGAL_REVIEW_APPROVED set),
// the two "today" checks below fail on purpose: update them in that same
// commit, so a publication is always a deliberate, reviewed change.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { startFakeSupabase } from './support/fake-supabase.mjs';
import { startApp } from './support/app.mjs';

const LANGS = ['it', 'en', 'es', 'fr'];
const KEYS = ['CONTROLLER', 'PRIVACY_CONTACT', 'DPO_SENTENCE', 'ADMINS', 'LEGAL_BASIS', 'FUNCTION_REGION', 'TRANSFER_SAFEGUARDS', 'RETENTION_DOCUMENT', 'RETENTION_NOTES', 'RETENTION_HISTORY', 'TRANSITION_DAYS', 'GOVERNING_LAW', 'PROCESSOR_AGREEMENTS', 'AUTH_EMAIL_PROVIDER', 'OPENAI_RETENTION'];
const sample = (lang) => Object.fromEntries(KEYS.map((k) => [k, k === 'DPO_SENTENCE' ? '' : `Synthetic ${k} ${lang}`]));
const SAMPLE = Object.fromEntries(LANGS.map((l) => [l, sample(l)]));

// Compile the three legal modules to plain ES modules in a temp folder.
let dir;
let mod;
before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'phygo-legal-'));
  for (const name of ['withVerification', 'verification.generated', 'verificationValues']) {
    const source = readFileSync(`lib/i18n/legal/${name}.ts`, 'utf8');
    const out = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
      .replace(/from '\.\/(withVerification|verification\.generated|verificationValues)'/g, "from './$1.mjs'");
    writeFileSync(join(dir, `${name}.mjs`), out);
  }
  mod = await import(join(dir, 'withVerification.mjs'));
});
after(() => dir && rmSync(dir, { recursive: true, force: true }));

// A minimal dictionary with the section titles the function looks for.
const dict = () => ({
  privacy: { sections: Array.from({ length: 15 }, (_, i) => ({ title: `${i + 1}. P`, blocks: [i === 5 ? 'Resend (transactional email delivery)' : 'x'] })) },
  terms: { sections: Array.from({ length: 13 }, (_, i) => ({ title: `${i + 1}. T`, blocks: [i === 11 ? '[jurisdiction to be confirmed]' : 'x'] })) },
  contact: {},
  contents: '',
});

test('the site text is generated from the current drafts', () => {
  execFileSync(process.execPath, ['scripts/legal/build-verification-texts.mjs', '--check'], { stdio: 'pipe' });
});

test('nothing is published until every value is set and the legal review is approved', () => {
  const empty = { it: {}, en: {}, es: {}, fr: {} };
  const missingOne = structuredClone(SAMPLE);
  delete missingOne.fr.RETENTION_NOTES;
  const blankOne = structuredClone(SAMPLE);
  blankOne.es.CONTROLLER = '  ';
  for (const [name, v, approved] of [
    ['as committed today', undefined, undefined],
    ['no values, approved', empty, true],
    ['all values, not approved', SAMPLE, false],
    ['one value missing in one language', missingOne, true],
    ['one value blank', blankOne, true],
  ]) {
    const d = dict();
    assert.equal(mod.withVerification(d, 'it', v, approved), d, name);
  }
  assert.equal(mod.verificationTextsReady(), false, 'the committed values are not ready');
});

test('once ready: no placeholder left, the anchor, §3A after §3 and the governing law', () => {
  for (const lang of LANGS) {
    const out = mod.withVerification(dict(), lang, SAMPLE, true);
    const text = JSON.stringify(out);
    assert.ok(!text.includes('{{'), `${lang}: no placeholder left`);
    assert.ok(!/ {2}/.test(text) && !text.includes(' .'), `${lang}: the empty DPO sentence leaves no gap`);
    const privacy = out.privacy.sections.at(-1);
    assert.equal(privacy.id, 'professional-verification', `${lang}: anchor used by the verification form`);
    assert.match(privacy.title, /^16\. /);
    assert.ok(text.includes(`Synthetic CONTROLLER ${lang}`));
    assert.match(out.terms.sections[3].title, /^3A\. /, `${lang}: §3A follows §3`);
    assert.deepEqual(out.terms.sections.find((s) => s.title.startsWith('12.')).blocks, [`Synthetic GOVERNING_LAW ${lang}`]);
    assert.ok(!text.includes('[jurisdiction'), `${lang}: §12 placeholder replaced`);
    // Privacy §6 and §7 are the rewritten ones: Daily and dictation named, Resend gone.
    assert.equal(out.privacy.sections.length, 16);
    assert.match(out.privacy.sections[5].title, /^6\. /);
    assert.match(out.privacy.sections[6].title, /^7\. /);
    const providers = JSON.stringify(out.privacy.sections[5]);
    assert.ok(providers.includes('Daily') && providers.includes('OpenAI') && !providers.includes('Resend'), `${lang}: §6 lists the providers in the code`);
    assert.ok(providers.includes('Google') && providers.includes('Apple'), `${lang}: §6 explains dictation`);
  }
});

let fake;
let app;
test('the pages built today show no placeholder and no verification section', async () => {
  fake = await startFakeSupabase({ port: Number(process.env.FAKE_SUPABASE_PORT ?? 54329), tables: {} });
  app = await startApp({ fakeUrl: fake.url, port: 3432 });
  try {
    for (const path of ['/privacy', '/terms', '/it/privacy', '/it/terms', '/es/privacy', '/fr/terms']) {
      const res = await fetch(`${app.url}${path}`);
      assert.equal(res.status, 200, path);
      const html = await res.text();
      assert.ok(!html.includes('{{'), `${path}: no placeholder`);
      assert.ok(!html.includes('id="professional-verification"'), `${path}: not published yet`);
    }
  } finally {
    await app.stop();
    await fake.close();
  }
});
