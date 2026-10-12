-- Clinical knowledge standardization, step 2 of 3: redirects for merged conditions.
--
-- The 18 duplicate merges of September 2026 (migrations merge_7 ... merge_18th)
-- deleted the retired knowledge_base rows. Their public pages
-- (/library/condition/<id>-<slug> and the en/es/fr versions) now return 404,
-- and anything still pointing at those ids lost its link. This table records
-- where each retired id went, so pages can redirect permanently and data
-- that still carries an old id can be repointed (step 3 does that for
-- rehab_phases).
--
-- Every row below comes from the merge_map / DELETE statements stored in
-- supabase_migrations.schema_migrations; nothing is inferred.
-- A row is only inserted while the old id is gone and the new id exists.
-- Safe to run more than once. Rollback: drop table condition_redirects;

begin;

create table if not exists condition_redirects (
  old_id bigint primary key,
  new_id bigint not null references knowledge_base (id) on delete cascade,
  reason text not null default 'merged_duplicate',
  source_migration text,
  created_at timestamptz not null default now(),
  check (old_id <> new_id)
);

alter table condition_redirects enable row level security;
drop policy if exists "Public read access" on condition_redirects;
create policy "Public read access" on condition_redirects for select using (true);

insert into condition_redirects (old_id, new_id, source_migration)
select v.old_id, v.new_id, v.source_migration
from (values
  (123, 32,  'merge_7_duplicate_conditions'),
  (127, 57,  'merge_7_duplicate_conditions'),
  (139, 337, 'merge_7_duplicate_conditions'),
  (140, 335, 'merge_7_duplicate_conditions'),
  (142, 13,  'merge_7_duplicate_conditions'),
  (214, 329, 'merge_7_duplicate_conditions'),
  (283, 80,  'merge_7_duplicate_conditions'),
  (376, 9,   'merge_8th_duplicate_spondilite_v3'),
  (112, 306, 'merge_9th_duplicate_pop'),
  (269, 342, 'merge_10th_duplicate_concussion'),
  (236, 325, 'merge_11th_duplicate_scheuermann'),
  (311, 39,  'merge_12th_duplicate_asma'),
  (240, 323, 'merge_13th_duplicate_costocondrite'),
  (482, 28,  'merge_14th_duplicate_radicolopatia_cervicale'),
  (438, 65,  'merge_15th_duplicate_ddh_dca'),
  (36,  117, 'merge_16th_duplicate_bpco'),
  (320, 383, 'merge_17th_duplicate_tvp_vte'),
  (340, 449, 'merge_18th_duplicate_tmd')
) as v (old_id, new_id, source_migration)
where exists (select 1 from knowledge_base k where k.id = v.new_id)
  and not exists (select 1 from knowledge_base k where k.id = v.old_id)
on conflict (old_id) do nothing;

commit;
