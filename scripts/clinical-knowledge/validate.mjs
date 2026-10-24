#!/usr/bin/env node
// Validates an import file before anything reaches the database.
//
//   node scripts/clinical-knowledge/validate.mjs <dataset.json> --index <existing-index.json> [--verify-online] [--report out.json]
//
// dataset.json: { "conditions": [...], "protocols": [...] } following
//   docs/clinical-knowledge/README.md (examples in scripts/clinical-knowledge/examples).
// existing-index.json: output of export-index.sql (id, condition_name,
//   condition_keywords, synonyms) taken from the live library on the day of the import.
// --verify-online: looks every PMID up on PubMed and every DOI on Crossref and
//   fails when an identifier does not exist or names a different paper.
//
// Exit code 1 when there is any error. Warnings (similar names, drafts with
// missing fields) never block, but must be read by the reviewer.
import { readFileSync, writeFileSync } from 'node:fs';
import { buildIndex, findDuplicates, validateCondition, validateProtocol, verifySourceOnline } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const file = args.find((a) => !a.startsWith('--') && a !== opt('--index') && a !== opt('--report'));
if (!file || !opt('--index')) {
  console.error('usage: validate.mjs <dataset.json> --index <existing-index.json> [--verify-online] [--report out.json]');
  process.exit(2);
}

const data = JSON.parse(readFileSync(file, 'utf8'));
const existing = JSON.parse(readFileSync(opt('--index'), 'utf8'));
const index = buildIndex(existing);
const conditionIds = new Set(existing.map((c) => c.id));
const conditions = data.conditions ?? [];
const protocols = data.protocols ?? [];
const results = [];

// Duplicates inside the file itself (two new records for the same condition).
const inFile = buildIndex(conditions.map((c, i) => ({ id: `file[${i}]`, condition_name: c.condition_name, synonyms: c.synonyms })));
const slugs = new Set();

conditions.forEach((c, i) => {
  const r = validateCondition(c, index, `conditions[${i}]`);
  for (const d of findDuplicates(c, inFile).exact) if (d.id !== `file[${i}]`) r.error(`conditions[${i}]`, `same condition as ${d.id} in this file`);
  if (slugs.has(c.slug)) r.error(`conditions[${i}].slug`, 'used twice in this file');
  slugs.add(c.slug);
  results.push({ kind: 'condition', slug: c.slug, item: c, ...r });
});
protocols.forEach((p, i) => {
  const r = validateProtocol(p, conditionIds, `protocols[${i}]`);
  results.push({ kind: 'protocol', slug: p.slug, item: p, ...r });
});

if (args.includes('--verify-online')) {
  for (const r of results) {
    for (const [j, s] of (r.item.sources ?? []).entries()) {
      try {
        const v = await verifySourceOnline(s);
        s.verification = v;
        if (v.ok === false) r.errors.push({ at: `${r.kind}:${r.slug}.sources[${j}]`, msg: v.reason });
        if (v.ok === null) r.warnings.push({ at: `${r.kind}:${r.slug}.sources[${j}]`, msg: v.reason });
      } catch (err) {
        r.errors.push({ at: `${r.kind}:${r.slug}.sources[${j}]`, msg: `could not verify: ${err.message}` });
      }
    }
  }
}

let errors = 0;
for (const r of results) {
  const status = r.item.review_status ?? 'draft';
  console.log(`\n${r.kind} ${r.slug} [${status}] — ${r.errors.length} error(s), ${r.warnings.length} warning(s)`);
  for (const e of r.errors) console.log(`  ERROR ${e.at}: ${e.msg}`);
  for (const w of r.warnings) console.log(`  warn  ${w.at}: ${w.msg}`);
  errors += r.errors.length;
}
console.log(`\n${results.length} record(s), ${errors} error(s).`);

const report = opt('--report');
if (report) {
  writeFileSync(
    report,
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        online: args.includes('--verify-online'),
        records: results.map(({ kind, slug, errors: e, warnings: w, item }) => ({ kind, slug, errors: e, warnings: w, sources: item.sources ?? [] })),
      },
      null,
      2,
    ),
  );
}
process.exit(errors ? 1 : 0);
