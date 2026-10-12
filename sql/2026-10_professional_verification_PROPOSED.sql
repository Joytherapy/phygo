-- PROPOSED - NOT APPLIED. Needs the owner's approval. Apply AFTER
-- 2026-10_security_profile_privileged_columns_PROPOSED.sql (PR #5) and BEFORE
-- deploying the professional-verification code.
--
-- Keeps signup and the student <-> professional switch exactly as they are
-- (profiles.practice_stage stays user-editable: it is the DECLARED role), and
-- adds a separate VERIFIED status that only PHYGO can grant.
--
--   professional_status (column already exists, values extended):
--     not_applicable  no verification requested (all 34 accounts today)
--     pending         registration details submitted, waiting for review
--     needs_info      reviewer asked for more information
--     verified        reviewed and approved by a PHYGO administrator
--     rejected        reviewed and not approved
--
-- New columns hold only what the review needs: the country, the name of the
-- professional register and the registration number (already stored in
-- profiles.registration_number), plus review metadata. No document upload,
-- no ID scans.
--
-- The client-side protection from PR #5 is extended: users can no longer
-- write any of these columns, including registration_number. Submissions
-- go through POST /api/profile/verification, which resets the status to
-- 'pending' whenever the details change, so a verified number cannot be
-- swapped silently. Existing registration_number values are kept as data and
-- are NOT treated as verified.
--
-- Rollback (data entered in the new columns is lost; export first):
--   update profiles set professional_status = 'not_applicable' where professional_status in ('needs_info', 'rejected');
--   alter table profiles drop constraint if exists profiles_professional_status_check;
--   alter table profiles add constraint profiles_professional_status_check
--     check (professional_status in ('not_applicable', 'pending', 'verified'));
--   alter table profiles drop column if exists registry_country, drop column if exists registry_name,
--     drop column if exists verification_requested_at, drop column if exists verification_reviewed_at,
--     drop column if exists verification_reviewed_by, drop column if exists verification_message;
--   then re-run 2026-10_security_profile_privileged_columns_PROPOSED.sql to restore the PR #5 trigger.

begin;

alter table profiles
  add column if not exists registry_country text,
  add column if not exists registry_name text,
  add column if not exists verification_requested_at timestamptz,
  add column if not exists verification_reviewed_at timestamptz,
  add column if not exists verification_reviewed_by text,
  add column if not exists verification_message text;

alter table profiles drop constraint if exists profiles_professional_status_check;
alter table profiles add constraint profiles_professional_status_check
  check (professional_status in ('not_applicable', 'pending', 'needs_info', 'verified', 'rejected'));

create or replace function protect_profile_privileged_columns() returns trigger
language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.plan := 'free';
      new.professional_status := 'not_applicable';
      new.registration_number := null;
      new.registry_country := null;
      new.registry_name := null;
      new.verification_requested_at := null;
      new.verification_reviewed_at := null;
      new.verification_reviewed_by := null;
      new.verification_message := null;
    elsif new.plan is distinct from old.plan
       or new.professional_status is distinct from old.professional_status
       or new.registration_number is distinct from old.registration_number
       or new.registry_country is distinct from old.registry_country
       or new.registry_name is distinct from old.registry_name
       or new.verification_requested_at is distinct from old.verification_requested_at
       or new.verification_reviewed_at is distinct from old.verification_reviewed_at
       or new.verification_reviewed_by is distinct from old.verification_reviewed_by
       or new.verification_message is distinct from old.verification_message then
      raise exception 'plan and professional verification fields can only be changed by PHYGO'
        using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect_privileged_columns on profiles;
create trigger profiles_protect_privileged_columns
  before insert or update on profiles
  for each row execute function protect_profile_privileged_columns();

commit;
