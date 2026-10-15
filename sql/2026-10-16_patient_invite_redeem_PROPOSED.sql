-- PROPOSED — NOT APPLIED. My Phygo invitations: one record, one person.
--
-- Problem (live function, copied in tests/sql/replica.sql):
--   - redeem_patient_invite() sets patients.patient_user_id even when the
--     record is already linked to someone. The clinician creates a new 7-day
--     code on every "Invite" click and older codes are never revoked, so a
--     second, forwarded or leaked link silently moves the record (notes,
--     appointments, video calls) to whoever redeems it, and disconnects the
--     real patient;
--   - EXECUTE is granted to authenticated but never revoked from PUBLIC, so
--     anonymous callers can run it too (a hit then sets patient_user_id to
--     NULL and uses up the invitation).
--
-- Change:
--   - only a signed-in account can redeem;
--   - a record already linked to another account is refused (the clinician
--     unlinks first, as in the patient page, then invites again);
--   - redeeming a code expires the patient's other open codes;
--   - EXECUTE only for authenticated.
-- Redeeming again with the same account stays harmless (same answer).
-- Nothing else changes: same name, signature, return value and messages for
-- invalid codes, so the current My Phygo join page keeps working.
--
-- Apply in the Supabase SQL editor, in one transaction. Tested on a local
-- PostgreSQL copy of the live definitions: tests/sql/invite_redeem.sh.
--
-- Rollback (restores the live definition):
--   begin;
--   create or replace function redeem_patient_invite(invite_code text) returns uuid language plpgsql security definer set search_path to 'public' as $$
--   declare v_patient_id uuid; v_invite_id uuid;
--   begin
--     select id, patient_id into v_invite_id, v_patient_id from patient_invites where code = invite_code and used_at is null and expires_at > now();
--     if v_patient_id is null then raise exception 'Invalid or expired invite code'; end if;
--     update patients set patient_user_id = auth.uid() where id = v_patient_id;
--     update patient_invites set used_at = now() where id = v_invite_id;
--     update profiles set role = 'patient' where id = auth.uid();
--     return v_patient_id;
--   end; $$;
--   grant execute on function redeem_patient_invite(text) to public;
--   commit;

begin;

create or replace function redeem_patient_invite(invite_code text) returns uuid
language plpgsql security definer set search_path to 'public' as $$
declare
  v_patient_id uuid;
  v_invite_id uuid;
  v_linked uuid;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Sign in to accept the invitation' using errcode = '42501';
  end if;

  select id, patient_id into v_invite_id, v_patient_id
  from patient_invites
  where code = invite_code and used_at is null and expires_at > now()
  for update;
  if v_patient_id is null then raise exception 'Invalid or expired invite code'; end if;

  select patient_user_id into v_linked from patients where id = v_patient_id for update;
  if v_linked is not null and v_linked <> v_user then
    -- Same message as an unknown code: says nothing about the record.
    raise exception 'Invalid or expired invite code';
  end if;

  update patients set patient_user_id = v_user where id = v_patient_id;
  -- This code and every other open code for the same record.
  update patient_invites set used_at = now()
  where patient_id = v_patient_id and used_at is null;
  update profiles set role = 'patient' where id = v_user;
  return v_patient_id;
end; $$;

revoke execute on function redeem_patient_invite(text) from public, anon;
grant execute on function redeem_patient_invite(text) to authenticated;

commit;
