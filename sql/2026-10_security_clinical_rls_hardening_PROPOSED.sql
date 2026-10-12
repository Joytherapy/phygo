-- PROPOSED - NOT APPLIED. Needs the owner's approval before running in production.
--
-- Two gaps in the live RLS policies (metadata read on 12 Oct 2026, not exploited):
--
-- 1. notes: "Users can insert their own notes" only checks auth.uid() = user_id.
--    A signed-in clinician can insert a note whose patient_id belongs to ANOTHER
--    clinician's patient; that patient then sees it in My Phygo ("Patients can
--    read their own notes"). Same for UPDATE, which has no WITH CHECK.
--    Fix: the patient must be one of the caller's own patients.
--
-- 2. patients: INSERT/UPDATE let the owner set patient_user_id (and change
--    user_id) freely. Setting patient_user_id to another account's id makes
--    that account count as a patient everywhere (middleware redirect, 403 on
--    clinician APIs). Only redeem_patient_invite() (SECURITY DEFINER) should
--    link a patient account; the app itself only ever clears the link
--    ("reset portal access" sets it to null).
--    Fix: client roles may clear patient_user_id but not set it, and may not
--    move a patient to another clinician.
--
-- Existing data and legitimate flows are unchanged: creating patients and
-- notes for your own patients, editing them, resetting portal access, and
-- redeeming invites.
--
-- Rollback (re-creates the live definitions):
--   drop policy if exists "Users can insert their own notes" on notes;
--   create policy "Users can insert their own notes" on notes for insert with check (auth.uid() = user_id);
--   drop policy if exists "Users can update their own notes" on notes;
--   create policy "Users can update their own notes" on notes for update using (auth.uid() = user_id);
--   drop trigger if exists patients_protect_links on patients;
--   drop function if exists protect_patient_links();

begin;

drop policy if exists "Users can insert their own notes" on notes;
create policy "Users can insert their own notes" on notes for insert
  with check (auth.uid() = user_id and patient_id in (select id from patients where user_id = auth.uid()));

drop policy if exists "Users can update their own notes" on notes;
create policy "Users can update their own notes" on notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and patient_id in (select id from patients where user_id = auth.uid()));

create or replace function protect_patient_links() returns trigger
language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' and new.patient_user_id is not null then
      raise exception 'patient_user_id is set only by redeeming an invite' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' then
      if new.user_id is distinct from old.user_id then
        raise exception 'a patient cannot be moved to another clinician' using errcode = '42501';
      end if;
      if new.patient_user_id is distinct from old.patient_user_id and new.patient_user_id is not null then
        raise exception 'patient_user_id is set only by redeeming an invite' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists patients_protect_links on patients;
create trigger patients_protect_links
  before insert or update on patients
  for each row execute function protect_patient_links();

commit;
