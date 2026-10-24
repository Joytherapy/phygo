-- Clinical knowledge standardization, step 3 of 3: rehab_phases integrity.
-- Requires steps 1 and 2.
--
-- Found on 12 October 2026 (read-only queries, see docs/clinical-knowledge):
--   a) Three protocols were imported twice: conditions 6, 57 and 83 carry the
--      same phases two times (same number, name and text). Public pages show
--      every phase twice.
--   b) Phases 111-113 still point at condition 36 (COPD), which merge_16th
--      deleted in favour of 117. Condition 117 has no phases of its own, so
--      the COPD protocol is currently invisible.
--   c) Phase 196 has no condition at all.
--   d) rehab_phases.condition_id has no foreign key, which is how (b) and (c)
--      happened.
--
-- What this does:
--   - backs up every row it changes or removes in _backup_2026_10_rehab_phases;
--   - deletes only exact duplicates, keeping the newest copy. Condition 57
--     phase 2 has two DIFFERENT versions: both are kept for clinical review;
--   - repoints phases of a retired condition to its redirect target, only when
--     the target has no phases of its own;
--   - removes phases with no condition;
--   - adds the missing foreign key with ON DELETE RESTRICT, so a future merge
--     cannot delete a condition and silently orphan its protocol again;
--   - creates the protocol record for any condition that just gained phases.
--
-- Safe to run more than once. Rollback: 2026-10_clinical_knowledge_03_rollback.sql

begin;

create table if not exists _backup_2026_10_rehab_phases (
  id bigint primary key,
  created_at timestamptz,
  phase_number bigint,
  phase_name text,
  phase_criteria_to_start text,
  typical_duration text,
  phase_goals text,
  phase_exercises text,
  criteria_to_progress text,
  condition_id bigint,
  translations jsonb,
  backup_reason text not null check (backup_reason in ('exact_duplicate', 'repointed', 'no_condition')),
  backed_up_at timestamptz not null default now()
);
alter table _backup_2026_10_rehab_phases enable row level security;

-- a) exact duplicates
with ranked as (
  select id,
         row_number() over (
           partition by condition_id, phase_number, phase_name,
             md5(concat_ws('|', phase_criteria_to_start, typical_duration, phase_goals, phase_exercises, criteria_to_progress))
           order by id desc
         ) as rn
  from rehab_phases
  where condition_id is not null
)
insert into _backup_2026_10_rehab_phases
  (id, created_at, phase_number, phase_name, phase_criteria_to_start, typical_duration, phase_goals,
   phase_exercises, criteria_to_progress, condition_id, translations, backup_reason)
select r.id, r.created_at, r.phase_number, r.phase_name, r.phase_criteria_to_start, r.typical_duration, r.phase_goals,
       r.phase_exercises, r.criteria_to_progress, r.condition_id, r.translations, 'exact_duplicate'
from rehab_phases r join ranked x on x.id = r.id
where x.rn > 1
on conflict (id) do nothing;

delete from rehab_phases r
using _backup_2026_10_rehab_phases b
where b.id = r.id and b.backup_reason = 'exact_duplicate';

-- b) phases of retired conditions -> redirect target (only if it has none)
insert into _backup_2026_10_rehab_phases
  (id, created_at, phase_number, phase_name, phase_criteria_to_start, typical_duration, phase_goals,
   phase_exercises, criteria_to_progress, condition_id, translations, backup_reason)
select r.id, r.created_at, r.phase_number, r.phase_name, r.phase_criteria_to_start, r.typical_duration, r.phase_goals,
       r.phase_exercises, r.criteria_to_progress, r.condition_id, r.translations, 'repointed'
from rehab_phases r
join condition_redirects cr on cr.old_id = r.condition_id
where not exists (select 1 from knowledge_base k where k.id = r.condition_id)
  and not exists (select 1 from rehab_phases r2 where r2.condition_id = cr.new_id)
on conflict (id) do nothing;

update rehab_phases r
set condition_id = cr.new_id
from condition_redirects cr
where cr.old_id = r.condition_id
  and not exists (select 1 from knowledge_base k where k.id = r.condition_id)
  and not exists (select 1 from rehab_phases r2 where r2.condition_id = cr.new_id);

-- c) phases with no condition
insert into _backup_2026_10_rehab_phases
  (id, created_at, phase_number, phase_name, phase_criteria_to_start, typical_duration, phase_goals,
   phase_exercises, criteria_to_progress, condition_id, translations, backup_reason)
select id, created_at, phase_number, phase_name, phase_criteria_to_start, typical_duration, phase_goals,
       phase_exercises, criteria_to_progress, condition_id, translations, 'no_condition'
from rehab_phases
where condition_id is null
on conflict (id) do nothing;

delete from rehab_phases where condition_id is null;

-- Anything still orphaned has no known redirect: stop instead of guessing.
do $$
declare n int;
begin
  select count(*) into n from rehab_phases r
  where not exists (select 1 from knowledge_base k where k.id = r.condition_id);
  if n > 0 then
    raise exception '% rehab_phases rows still point at a missing condition; resolve them before adding the foreign key', n;
  end if;
end $$;

-- d) foreign key
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'rehab_phases_condition_id_fkey') then
    alter table rehab_phases
      add constraint rehab_phases_condition_id_fkey
      foreign key (condition_id) references knowledge_base (id) on delete restrict;
  end if;
end $$;

-- e) protocol records for conditions that gained phases in (b)
select backfill_legacy_protocols();

commit;
