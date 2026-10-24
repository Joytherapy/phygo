#!/usr/bin/env node
// Turns a VALIDATED dataset into SQL that writes only to clinical_content_drafts.
//
//   node scripts/clinical-knowledge/build-drafts-sql.mjs <dataset.json> <validation-report.json> > drafts.sql
//
// - Refuses to run if the report has any error, or does not match the dataset.
// - Upserts by (kind, slug): re-running the same file changes nothing new, and
//   a draft that was already promoted (target_id set) is never overwritten.
// - Never touches knowledge_base or rehab_protocols: publication happens later,
//   one approved record at a time, with promote_condition_draft().
import { readFileSync } from 'node:fs';

const [file, reportFile] = process.argv.slice(2);
if (!file || !reportFile) {
  console.error('usage: build-drafts-sql.mjs <dataset.json> <validation-report.json>');
  process.exit(2);
}
const data = JSON.parse(readFileSync(file, 'utf8'));
const report = JSON.parse(readFileSync(reportFile, 'utf8'));
const records = [...(data.conditions ?? []).map((item) => ({ kind: 'condition', item })), ...(data.protocols ?? []).map((item) => ({ kind: 'protocol', item }))];

const byKey = new Map(report.records.map((r) => [`${r.kind}:${r.slug}`, r]));
for (const { kind, item } of records) {
  const r = byKey.get(`${kind}:${item.slug}`);
  if (!r) throw new Error(`${kind} ${item.slug} is not in the validation report; validate this exact file first`);
  if (r.errors.length) throw new Error(`${kind} ${item.slug} has validation errors; fix them first`);
}

const q = (v) => `'${String(v).replace(/'/g, "''")}'`;
const lines = ['begin;'];
for (const { kind, item } of records) {
  const r = byKey.get(`${kind}:${item.slug}`);
  const payload = { ...item };
  delete payload.review_status;
  lines.push(
    `insert into clinical_content_drafts (kind, slug, payload, review_status, validation_report)
values (${q(kind)}, ${q(item.slug)}, ${q(JSON.stringify(payload))}::jsonb, ${q(item.review_status ?? 'draft')}, ${q(JSON.stringify({ checked_at: report.checked_at, online: report.online, warnings: r.warnings, sources: r.sources }))}::jsonb)
on conflict (kind, slug) do update
  set payload = excluded.payload, review_status = excluded.review_status, validation_report = excluded.validation_report, updated_at = now()
  where clinical_content_drafts.target_id is null and clinical_content_drafts.review_status not in ('clinically_reviewed', 'approved');`,
  );
}
lines.push('commit;');
console.log(lines.join('\n'));
