-- PROPOSED - NOT APPLIED. Optional, separate decision. Apply after
-- 2026-10_professional_verification_PROPOSED.sql.
--
-- Today any signed-in account can create patient records from the browser
-- (policy "Users can insert their own patients"). With this change, creating
-- a NEW real patient record requires a verified professional. Everything
-- else is unchanged: existing patients stay readable and editable by their
-- clinician, notes/appointments for existing patients keep working, and
-- patients keep their My Phygo access.
--
-- Why it is a separate decision: it changes what declared-but-unverified
-- professionals can do (34 accounts, none verified today). Recommended only
-- once existing professionals have had time to submit their registration
-- details and they have been reviewed.
--
-- Rollback:
--   drop policy if exists "Users can insert their own patients" on patients;
--   create policy "Users can insert their own patients" on patients for insert with check (auth.uid() = user_id);
--   drop function if exists is_verified_professional(uuid);

begin;

create or replace function is_verified_professional(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = uid and professional_status = 'verified');
$$;
revoke all on function is_verified_professional(uuid) from public, anon;
grant execute on function is_verified_professional(uuid) to authenticated;

drop policy if exists "Users can insert their own patients" on patients;
create policy "Users can insert their own patients" on patients for insert
  with check (auth.uid() = user_id and is_verified_professional(auth.uid()));

commit;
