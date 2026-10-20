-- PROPOSED — NOT APPLIED. Needs the owner's approval. Care programme,
-- activity log and symptom check-ins (foundation for My Phygo "Daily Quest",
-- adherence and the clinician's attention view). docs/engagement/data-model.md
-- describes every field, who reads and writes it, and why.
--
-- Additive only: five new tables, their policies and triggers. No existing
-- table, column, row, policy or function is changed. Nothing in the app uses
-- these tables until the matching code is merged.
--
-- Principles enforced here (not only in the app):
--   - Only the clinician who owns the patient record, and who may manage
--     patients (can_manage_patients()), writes the programme and its items.
--     PHYGO never assigns exercises by itself.
--   - The patient reads their own programme and records what they did, with
--     the provenance 'patient_reported' (or 'camera_estimated' for an on-device
--     count). 'device_measured' and 'clinician_entered' never come from the
--     patient's browser.
--   - What is recorded must match what was prescribed: one row per item, day
--     and slot (times_per_day); no row on a rest day or on a day the item is not
--     scheduled; only for today or yesterday. Extra sessions cannot be logged,
--     so nothing can reward doing more than prescribed.
--   - Activity rows and check-ins are never deleted from the browser (they go
--     with the patient record, ON DELETE CASCADE).
--   - Attention thresholds are set by the clinician and are not readable by
--     the patient (care_attention_rules), so reporting is not steered by them.
--
-- Depends on: can_manage_patients() (sql/2026-10_patient_management_A_*,
-- applied on 12 Oct 2026) and the live policies on patients.
--
-- Rollback (removes the tables and everything recorded in them):
--   begin;
--   drop table if exists care_activity_logs, symptom_checkins, care_attention_rules, care_program_items, care_programs cascade;
--   drop function if exists care_owns_patient(uuid), care_is_patient(uuid), care_touch_updated_at(), care_check_activity(), care_check_checkin();
--   commit;

begin;

-- Who is who for a patient record (patients' own policies still apply).
create or replace function care_owns_patient(p uuid) returns boolean
language sql stable security invoker set search_path to 'public' as $$
  select exists (select 1 from patients where id = p and user_id = auth.uid())
$$;
create or replace function care_is_patient(p uuid) returns boolean
language sql stable security invoker set search_path to 'public' as $$
  select exists (select 1 from patients where id = p and patient_user_id = auth.uid())
$$;
create or replace function care_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

-- 1. The programme the clinician prescribes.
create table care_programs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_note_id uuid references notes(id) on delete set null,
  title text not null,
  status text not null default 'active',
  starts_on date not null default current_date,
  ends_on date,
  rest_weekdays smallint[] not null default '{}', -- ISO weekdays 1 (Mon) .. 7 (Sun)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint care_programs_status check (status in ('active', 'paused', 'maintenance', 'completed')),
  constraint care_programs_dates check (ends_on is null or ends_on >= starts_on),
  constraint care_programs_rest check (rest_weekdays <@ array[1,2,3,4,5,6,7]::smallint[] and cardinality(rest_weekdays) < 7),
  constraint care_programs_lengths check (char_length(title) between 1 and 200)
);
-- One programme in use at a time (active or maintenance) per patient.
create unique index care_programs_one_current on care_programs (patient_id) where status in ('active', 'maintenance');
create trigger care_programs_touch before update on care_programs for each row execute function care_touch_updated_at();

-- 2. What the programme contains.
create table care_program_items (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references care_programs(id) on delete cascade,
  kind text not null,
  title text not null,
  instructions text,
  exercise_source text,       -- e.g. 'exercises', 'library_items', 'exercise_cache', 'note'
  exercise_ref text,          -- id in that source (no foreign key: several sources)
  sets smallint,
  reps smallint,
  duration_seconds integer,
  dose_notes text,
  weekdays smallint[] not null default '{}', -- empty = every day that is not a rest day
  times_per_day smallint not null default 1,
  short_variant jsonb,        -- written by the clinician only: {instructions, sets, reps, duration_seconds}
  education_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint care_items_kind check (kind in ('exercise', 'checkin', 'education')),
  constraint care_items_lengths check (char_length(title) between 1 and 200 and char_length(coalesce(instructions, '')) <= 4000
    and char_length(coalesce(dose_notes, '')) <= 500 and char_length(coalesce(exercise_ref, '')) <= 200 and char_length(coalesce(exercise_source, '')) <= 40),
  constraint care_items_dose check ((sets is null or sets between 1 and 20) and (reps is null or reps between 1 and 200)
    and (duration_seconds is null or duration_seconds between 1 and 14400)),
  constraint care_items_weekdays check (weekdays <@ array[1,2,3,4,5,6,7]::smallint[]),
  constraint care_items_times check (times_per_day between 1 and 6),
  constraint care_items_variant check (short_variant is null or (jsonb_typeof(short_variant) = 'object' and pg_column_size(short_variant) <= 4000)),
  constraint care_items_url check (education_url is null or education_url ~ '^https://[^[:space:]]+$')
);
create index care_program_items_program on care_program_items (program_id);

-- 3. What was done, and who says so.
create table care_activity_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  item_id uuid not null references care_program_items(id) on delete cascade,
  activity_date date not null,
  slot smallint not null default 1,
  status text not null,
  variant text not null default 'standard',
  provenance text not null default 'patient_reported',
  reported_sets smallint,
  reported_reps smallint,
  reported_duration_seconds integer,
  source_detail jsonb,        -- device / on-device counter metadata (model, version, quality); never images
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint care_logs_status check (status in ('done', 'partial', 'skipped')),
  constraint care_logs_variant check (variant in ('standard', 'short')),
  constraint care_logs_provenance check (provenance in ('patient_reported', 'camera_estimated', 'device_measured', 'clinician_entered')),
  constraint care_logs_slot check (slot between 1 and 6),
  constraint care_logs_amounts check ((reported_sets is null or reported_sets between 0 and 20) and (reported_reps is null or reported_reps between 0 and 200)
    and (reported_duration_seconds is null or reported_duration_seconds between 0 and 14400)),
  constraint care_logs_detail check (source_detail is null or (jsonb_typeof(source_detail) = 'object' and pg_column_size(source_detail) <= 2000)),
  -- Idempotency: the same activity, day and slot is recorded once per provenance.
  constraint care_logs_once unique (item_id, activity_date, slot, provenance)
);
create index care_activity_logs_patient_date on care_activity_logs (patient_id, activity_date);
create trigger care_activity_logs_touch before update on care_activity_logs for each row execute function care_touch_updated_at();

-- Only what was prescribed, when it was prescribed.
-- Runs as the caller (security invoker), so it sees only what the caller may
-- see: an item of someone else's programme reads as missing and is refused.
create or replace function care_check_activity() returns trigger
language plpgsql security invoker set search_path to 'public' as $$
declare v_program care_programs; v_item care_program_items; v_dow smallint := extract(isodow from new.activity_date);
begin
  select * into v_item from care_program_items where id = new.item_id;
  select * into v_program from care_programs where id = v_item.program_id;
  if v_program.patient_id is distinct from new.patient_id then
    raise exception 'activity does not belong to this patient''s programme' using errcode = '23514';
  end if;
  if not v_item.active or v_item.kind <> 'exercise' and new.variant = 'short' then
    raise exception 'this activity cannot be recorded' using errcode = '23514';
  end if;
  if v_program.status not in ('active', 'maintenance') then
    raise exception 'the programme is paused or completed' using errcode = '23514';
  end if;
  if new.variant = 'short' and v_item.short_variant is null then
    raise exception 'no short variant was prescribed for this activity' using errcode = '23514';
  end if;
  if new.activity_date < v_program.starts_on or (v_program.ends_on is not null and new.activity_date > v_program.ends_on) then
    raise exception 'outside the programme dates' using errcode = '23514';
  end if;
  if v_dow = any (v_program.rest_weekdays) then
    raise exception 'rest day: nothing to record' using errcode = '23514';
  end if;
  if cardinality(v_item.weekdays) > 0 and not (v_dow = any (v_item.weekdays)) then
    raise exception 'this activity is not scheduled on that day' using errcode = '23514';
  end if;
  if new.slot > v_item.times_per_day then
    raise exception 'more sessions than prescribed' using errcode = '23514';
  end if;
  -- From the browser. The patient: today or yesterday only (one day of
  -- tolerance for the time zone, as for birth dates) and never the provenances
  -- the server or the clinician own. The clinician: 'clinician_entered', not
  -- in the future.
  if current_user in ('anon', 'authenticated') then
    if care_is_patient(new.patient_id) then
      if new.activity_date < current_date - 1 or new.activity_date > current_date + 1 then
        raise exception 'only today or yesterday can be recorded' using errcode = '23514';
      end if;
      if new.provenance not in ('patient_reported', 'camera_estimated') then
        raise exception 'this provenance is not set by the patient' using errcode = '42501';
      end if;
    elsif care_owns_patient(new.patient_id) then
      if new.provenance <> 'clinician_entered' then
        raise exception 'a clinician records activity as clinician_entered' using errcode = '42501';
      end if;
      if new.activity_date > current_date + 1 then
        raise exception 'activity cannot be recorded in the future' using errcode = '23514';
      end if;
    else
      raise exception 'not allowed' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and (new.item_id, new.patient_id, new.activity_date, new.slot, new.provenance, new.created_by)
       is distinct from (old.item_id, old.patient_id, old.activity_date, old.slot, old.provenance, old.created_by) then
      raise exception 'only the status and the amounts of a record can change' using errcode = '42501';
    end if;
  end if;
  return new;
end; $$;
create trigger care_activity_logs_check before insert or update on care_activity_logs for each row execute function care_check_activity();

-- 4. Pain and fatigue, 0-10, as the patient reports them (one per day).
create table symptom_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  checkin_date date not null,
  pain_nrs smallint,
  fatigue_nrs smallint,
  note text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint symptom_checkins_scale check ((pain_nrs is null or pain_nrs between 0 and 10) and (fatigue_nrs is null or fatigue_nrs between 0 and 10)),
  constraint symptom_checkins_something check (pain_nrs is not null or fatigue_nrs is not null),
  constraint symptom_checkins_note check (char_length(coalesce(note, '')) <= 280),
  constraint symptom_checkins_once unique (patient_id, checkin_date)
);
create trigger symptom_checkins_touch before update on symptom_checkins for each row execute function care_touch_updated_at();
create or replace function care_check_checkin() returns trigger language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') then
    if new.checkin_date < current_date - 1 or new.checkin_date > current_date + 1 then
      raise exception 'only today or yesterday can be recorded' using errcode = '23514';
    end if;
    if tg_op = 'UPDATE' and (new.patient_id, new.checkin_date, new.created_by) is distinct from (old.patient_id, old.checkin_date, old.created_by) then
      raise exception 'only the values of a check-in can change' using errcode = '42501';
    end if;
  end if;
  return new;
end; $$;
create trigger symptom_checkins_check before insert or update on symptom_checkins for each row execute function care_check_checkin();

-- 5. When to draw the clinician's attention: set by the clinician, not shown to the patient.
create table care_attention_rules (
  patient_id uuid primary key references patients(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pain_at_or_above smallint,
  pain_rise_points smallint,      -- rise vs the patient's first check-in of the programme
  fatigue_at_or_above smallint,
  no_update_days smallint,        -- days without any record on a scheduled day
  updated_at timestamptz not null default now(),
  constraint care_rules_values check ((pain_at_or_above is null or pain_at_or_above between 0 and 10) and (pain_rise_points is null or pain_rise_points between 1 and 10)
    and (fatigue_at_or_above is null or fatigue_at_or_above between 0 and 10) and (no_update_days is null or no_update_days between 1 and 60))
);
create trigger care_attention_rules_touch before update on care_attention_rules for each row execute function care_touch_updated_at();

-- Grants and row-level security.
do $$ declare t text; begin
  foreach t in array array['care_programs', 'care_program_items', 'care_activity_logs', 'symptom_checkins', 'care_attention_rules'] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on %I from anon, authenticated', t);
  end loop;
end $$;
grant select, insert, update, delete on care_programs, care_program_items, care_attention_rules to authenticated;
grant select, insert, update on care_activity_logs, symptom_checkins to authenticated;
-- The server (imports, device data) works with the service role.
grant all on care_programs, care_program_items, care_activity_logs, symptom_checkins, care_attention_rules to service_role;

create policy "care programs: clinician manages own patients" on care_programs for all to authenticated
  using (care_owns_patient(patient_id))
  with check (care_owns_patient(patient_id) and created_by = auth.uid() and can_manage_patients());
create policy "care programs: patient reads own" on care_programs for select to authenticated
  using (care_is_patient(patient_id));

create policy "care items: clinician manages own patients" on care_program_items for all to authenticated
  using (exists (select 1 from care_programs p where p.id = program_id and care_owns_patient(p.patient_id)))
  with check (exists (select 1 from care_programs p where p.id = program_id and care_owns_patient(p.patient_id)) and can_manage_patients());
create policy "care items: patient reads own" on care_program_items for select to authenticated
  using (exists (select 1 from care_programs p where p.id = program_id and care_is_patient(p.patient_id)));

create policy "activity: patient records own" on care_activity_logs for insert to authenticated
  with check (care_is_patient(patient_id) and created_by = auth.uid());
create policy "activity: patient updates own" on care_activity_logs for update to authenticated
  using (care_is_patient(patient_id) and created_by = auth.uid())
  with check (care_is_patient(patient_id) and created_by = auth.uid());
create policy "activity: patient reads own" on care_activity_logs for select to authenticated
  using (care_is_patient(patient_id));
create policy "activity: clinician reads own patients" on care_activity_logs for select to authenticated
  using (care_owns_patient(patient_id));
create policy "activity: clinician records" on care_activity_logs for insert to authenticated
  with check (care_owns_patient(patient_id) and created_by = auth.uid() and can_manage_patients());

create policy "checkins: patient records own" on symptom_checkins for insert to authenticated
  with check (care_is_patient(patient_id) and created_by = auth.uid());
create policy "checkins: patient updates own" on symptom_checkins for update to authenticated
  using (care_is_patient(patient_id) and created_by = auth.uid())
  with check (care_is_patient(patient_id) and created_by = auth.uid());
create policy "checkins: patient reads own" on symptom_checkins for select to authenticated
  using (care_is_patient(patient_id));
create policy "checkins: clinician reads own patients" on symptom_checkins for select to authenticated
  using (care_owns_patient(patient_id));

create policy "attention rules: clinician only" on care_attention_rules for all to authenticated
  using (care_owns_patient(patient_id))
  with check (care_owns_patient(patient_id) and user_id = auth.uid() and can_manage_patients());

commit;

-- Check after running (expected: 5 tables, RLS on):
--   select relname, relrowsecurity from pg_class where relname in ('care_programs','care_program_items','care_activity_logs','symptom_checkins','care_attention_rules');
