-- PROPOSED - NOT APPLIED. Needs the owner's approval before running in production.
--
-- Problem (confirmed from live policy metadata on 12 Oct 2026, not exploited):
-- the policy "Users can update own profile" lets a signed-in user update ANY
-- column of their own profiles row with the public anon key, including
--   plan                 -> self-upgrade to 'pro' / 'super_pro' (Pro Library,
--                           higher Ask PHYGO limits)
--   professional_status  -> self-mark as 'verified'
--
-- Fix: a trigger that refuses changes to these columns when the request comes
-- from a client role (anon / authenticated). The service role, the SQL editor
-- (postgres) and SECURITY DEFINER functions such as handle_new_user() are not
-- affected. Everything users legitimately edit from the app (display name,
-- bio, avatar, credentials, registration number, declared practice_stage,
-- preferred language) keeps working.
--
-- Rollback:
--   drop trigger if exists profiles_protect_privileged_columns on profiles;
--   drop function if exists protect_profile_privileged_columns();

begin;

create or replace function protect_profile_privileged_columns() returns trigger
language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.plan := 'free';
      new.professional_status := 'not_applicable';
    elsif new.plan is distinct from old.plan
       or new.professional_status is distinct from old.professional_status then
      raise exception 'plan and professional_status can only be changed by PHYGO'
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
