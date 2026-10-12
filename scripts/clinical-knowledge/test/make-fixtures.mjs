// Turns the JSON fixtures into INSERT statements for the replica database.
// knowledge_base.json: id, name and keywords of every condition (public data).
// rehab_phases.json: real ids, numbers, names and condition ids; the long text
// fields are stored as md5 fingerprints, which is all the duplicate check needs.
import { readFileSync } from 'node:fs';

const dir = new URL('./fixtures/', import.meta.url);
const kb = JSON.parse(readFileSync(new URL('knowledge_base.json', dir), 'utf8'));
const phases = JSON.parse(readFileSync(new URL('rehab_phases.json', dir), 'utf8'));
const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

const out = ['begin;'];
for (const c of kb) {
  out.push(`insert into knowledge_base (id, condition_name, condition_keywords) overriding system value values (${c.id}, ${q(c.condition_name)}, ${q(c.condition_keywords)});`);
  out.push(`insert into condition_translations (condition_id, lang, condition_name, source_hash) values (${c.id}, 'en', ${q(c.condition_name)}, 'fixture');`);
}
for (const p of phases) {
  out.push(
    `insert into rehab_phases (id, created_at, phase_number, phase_name, phase_criteria_to_start, typical_duration, phase_goals, phase_exercises, criteria_to_progress, condition_id, translations) overriding system value values (${p.id}, ${q(p.c)}, ${p.n ?? 'null'}, ${q(p.name)}, ${q(p.s)}, ${q(p.d)}, ${q(p.g)}, ${q(p.e)}, ${q(p.p)}, ${p.cid ?? 'null'}, ${p.t ? `'{"en":{}}'` : `'{}'`});`,
  );
}
out.push("insert into exercises (source, external_id) values ('fixture', 'a'), ('fixture', 'b');");
// Rows were inserted with explicit ids; move the identity counters past them as in production.
out.push("select setval(pg_get_serial_sequence('knowledge_base', 'id'), (select max(id) from knowledge_base));");
out.push("select setval(pg_get_serial_sequence('rehab_phases', 'id'), (select max(id) from rehab_phases));");
out.push('commit;');
console.log(out.join('\n'));
