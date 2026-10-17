-- PROPOSED — NOT APPLIED. Needs the owner's approval. Patient record: identity,
-- contacts, clinical background.
--
-- Additive only: new nullable columns and one new table. No existing column,
-- row, policy or function is changed or removed; existing patients keep name,
-- age, gender and main_condition exactly as they are (no backfill is needed).
--
-- 1. patients: identity and the patient's own contact details.
--      first_name, last_name  — name stays the display name the rest of the app
--                               uses; the app writes it as "first_name last_name"
--                               whenever the record is edited;
--      birth_date             — the age is computed from it in the app; the old
--                               age column stays for records without a date of
--                               birth, and the app refreshes it on every save;
--      phone, contact_email   — contact_email is NOT the e-mail of the patient's
--                               My Phygo account (that lives in auth.users and
--                               is linked through patient_user_id);
--      address_street, address_number, postal_code, city, province, country.
--    These columns follow the existing row policies on patients: the clinician
--    who owns the record reads them, changing them needs can_manage_patients()
--    (Part B), and the patient linked to the record (patient_user_id) can read
--    their own row as today ("Patients can read their own record"): it is their
--    own name, date of birth and contacts. No other patient can read them.
--
-- 2. patient_details: what only the clinician may read (one row per patient).
--      emergency contact (a third person's data) and the clinical background:
--      medical_history, past_surgeries, medications, allergies,
--      rehab_precautions. The main condition stays in patients.main_condition;
--      session findings stay in notes (not duplicated here).
--    Row policies: read by the owning clinician; insert and update by the owning
--    clinician when can_manage_patients(); no policy for the linked patient or
--    anyone else; no DELETE policy (the row goes with the patient: ON DELETE
--    CASCADE). anon has no grants.
--
-- Checks (database side, so no client can store malformed values):
--   birth_date between 1900-01-01 and today (a trigger, because a CHECK cannot
--   refer to the current date); e-mail and phone shapes; length limits.
--
-- Order: apply this BEFORE deploying the code of this PR. The code reads the
-- new columns and table; until they exist the profile section shows an error
-- and saving is refused, and nothing else on the page changes.
-- Tested on a local PostgreSQL copy of the live policies:
--   tests/sql/patient_profile.sh
--
-- Rollback (only if no data has been entered yet: it removes the new columns
-- and the table WITH their contents):
--   begin;
--   drop table if exists public.patient_details;
--   drop trigger if exists patients_birth_date_not_future on public.patients;
--   drop function if exists public.patients_birth_date_not_future();
--   alter table public.patients
--     drop constraint if exists patients_contact_email_format,
--     drop constraint if exists patients_phone_format,
--     drop constraint if exists patients_birth_date_range,
--     drop constraint if exists patients_profile_lengths,
--     drop column if exists first_name, drop column if exists last_name,
--     drop column if exists birth_date, drop column if exists phone,
--     drop column if exists contact_email, drop column if exists address_street,
--     drop column if exists address_number, drop column if exists postal_code,
--     drop column if exists city, drop column if exists province,
--     drop column if exists country;
--   commit;

begin;

alter table public.patients
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists birth_date date,
  add column if not exists phone text,
  add column if not exists contact_email text,
  add column if not exists address_street text,
  add column if not exists address_number text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists province text,
  add column if not exists country text;

alter table public.patients
  drop constraint if exists patients_birth_date_range,
  add constraint patients_birth_date_range check (birth_date is null or birth_date >= date '1900-01-01'),
  drop constraint if exists patients_contact_email_format,
  add constraint patients_contact_email_format check (contact_email is null or contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  drop constraint if exists patients_phone_format,
  add constraint patients_phone_format check (phone is null or phone ~ '^\+?[0-9 ().-]{6,25}$'),
  drop constraint if exists patients_profile_lengths,
  add constraint patients_profile_lengths check (
    coalesce(char_length(first_name), 0) <= 100 and coalesce(char_length(last_name), 0) <= 100
    and coalesce(char_length(contact_email), 0) <= 254
    and coalesce(char_length(address_street), 0) <= 200 and coalesce(char_length(address_number), 0) <= 20
    and coalesce(char_length(postal_code), 0) <= 12 and coalesce(char_length(city), 0) <= 100
    and coalesce(char_length(province), 0) <= 60 and coalesce(char_length(country), 0) <= 60);

-- A date of birth in the future is refused when it is written (existing rows
-- have no date of birth, so nothing is checked retroactively). The database
-- day is UTC, while the clinician's "today" is local (Italy is UTC+1/+2): one
-- day of tolerance, so a date of birth entered as "today" just after local
-- midnight is not refused; the app itself refuses future dates in local time.
create or replace function public.patients_birth_date_not_future() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.birth_date is not null and new.birth_date > current_date + 1 then
    raise exception 'birth_date cannot be in the future' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists patients_birth_date_not_future on public.patients;
create trigger patients_birth_date_not_future
  before insert or update of birth_date on public.patients
  for each row execute function public.patients_birth_date_not_future();

create table if not exists public.patient_details (
  patient_id uuid primary key references public.patients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emergency_contact_name text,
  emergency_contact_relation text,
  emergency_contact_phone text,
  medical_history text,
  past_surgeries text,
  medications text,
  allergies text,
  rehab_precautions text,
  updated_at timestamptz not null default now(),
  constraint patient_details_emergency_phone_format check (emergency_contact_phone is null or emergency_contact_phone ~ '^\+?[0-9 ().-]{6,25}$'),
  constraint patient_details_lengths check (
    coalesce(char_length(emergency_contact_name), 0) <= 200 and coalesce(char_length(emergency_contact_relation), 0) <= 100
    and coalesce(char_length(medical_history), 0) <= 5000 and coalesce(char_length(past_surgeries), 0) <= 5000
    and coalesce(char_length(medications), 0) <= 5000 and coalesce(char_length(allergies), 0) <= 5000
    and coalesce(char_length(rehab_precautions), 0) <= 5000)
);

alter table public.patient_details enable row level security;
-- Exactly select/insert/update for signed-in users (row policies below), nothing
-- for anon; Supabase's default privileges (delete, truncate, references,
-- trigger) are removed.
revoke all on public.patient_details from anon, authenticated;
grant select, insert, update on public.patient_details to authenticated;

drop policy if exists "Physios read details of their own patients" on public.patient_details;
create policy "Physios read details of their own patients" on public.patient_details for select
  using (auth.uid() = user_id and patient_id in (select id from public.patients where user_id = auth.uid()));
drop policy if exists "Verified physios create details of their own patients" on public.patient_details;
create policy "Verified physios create details of their own patients" on public.patient_details for insert
  with check (auth.uid() = user_id
              and patient_id in (select id from public.patients where user_id = auth.uid())
              and can_manage_patients());
drop policy if exists "Verified physios update details of their own patients" on public.patient_details;
create policy "Verified physios update details of their own patients" on public.patient_details for update
  using (auth.uid() = user_id and patient_id in (select id from public.patients where user_id = auth.uid()))
  with check (auth.uid() = user_id
              and patient_id in (select id from public.patients where user_id = auth.uid())
              and can_manage_patients());

commit;
