-- Rollback for 2026-10_clinical_knowledge_03_phase_integrity.sql.
-- Restores every row from _backup_2026_10_rehab_phases exactly as it was and
-- removes the foreign key. The backup table is kept; drop it by hand once the
-- rollback is confirmed.

begin;

alter table rehab_phases drop constraint if exists rehab_phases_condition_id_fkey;

-- Repointed phases go back to their original (deleted) condition id.
update rehab_phases r
set condition_id = b.condition_id, protocol_id = null
from _backup_2026_10_rehab_phases b
where b.id = r.id and b.backup_reason = 'repointed';

-- Deleted rows come back with their original ids.
insert into rehab_phases
  (id, created_at, phase_number, phase_name, phase_criteria_to_start, typical_duration, phase_goals,
   phase_exercises, criteria_to_progress, condition_id, translations)
overriding system value
select b.id, b.created_at, b.phase_number, b.phase_name, b.phase_criteria_to_start, b.typical_duration, b.phase_goals,
       b.phase_exercises, b.criteria_to_progress, b.condition_id, b.translations
from _backup_2026_10_rehab_phases b
where b.backup_reason in ('exact_duplicate', 'no_condition')
  and not exists (select 1 from rehab_phases r where r.id = b.id);

-- Restored duplicates belong to the same protocol as their twins.
update rehab_phases r
set protocol_id = p.id
from rehab_protocols p
where p.legacy_condition_id = r.condition_id and r.protocol_id is null;

-- Protocols created by step 3 that no longer have phases.
delete from rehab_protocols p
where p.legacy_condition_id is not null
  and not exists (select 1 from rehab_phases r where r.protocol_id = p.id);

commit;
