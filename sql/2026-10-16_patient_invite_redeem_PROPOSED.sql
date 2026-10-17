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
--   - a clinician cannot link themselves to their own record, and an account
--     already linked to another record is refused (the app shows one record per
--     patient account: My Phygo and the middleware assume it);
--   - redeeming a code expires the patient's other open codes;
--   - the record row is locked first, so two codes redeemed at once cannot
--     deadlock or both win;
--   - search_path = public, pg_temp and schema-qualified names;
--   - EXECUTE only for authenticated.
-- Redeeming again with the same account stays harmless (same answer).
-- Same name, signature, return value and messages for invalid codes. The join
-- page in this PR signs the patient in before redeeming (an anonymous call is
-- now refused instead of silently unlinking the record).
-- Before applying: run the read-only checks in docs/security/invite-redeem-release.md.
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

create or replace function public.redeem_patient_invite(invite_code text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user uuid := auth.uid();
  v_patient_id uuid;
  v_linked uuid;
  v_clinician uuid;
begin
  if v_user is null then
    raise exception 'Sign in to accept the invitation' using errcode = '42501';
  end if;

  select i.patient_id into v_patient_id
  from public.patient_invites i
  where i.code = invite_code and i.used_at is null and i.expires_at > now();
  if v_patient_id is null then raise exception 'Invalid or expired invite code'; end if;

  -- Lock the record first (one lock order for every caller), then re-check the code.
  select p.patient_user_id, p.user_id into v_linked, v_clinician
  from public.patients p where p.id = v_patient_id for update;
  perform 1 from public.patient_invites i
  where i.code = invite_code and i.patient_id = v_patient_id
    and i.used_at is null and i.expires_at > now();
  if not found then raise exception 'Invalid or expired invite code'; end if;

  -- Same message as an unknown code: says nothing about the record.
  if (v_linked is not null and v_linked <> v_user)          -- record belongs to someone else
     or v_clinician = v_user                                -- clinician on own record
     or exists (select 1 from public.patients x             -- account already on another record
                where x.patient_user_id = v_user and x.id <> v_patient_id) then
    raise exception 'Invalid or expired invite code';
  end if;

  update public.patients set patient_user_id = v_user where id = v_patient_id;
  update public.patient_invites set used_at = now()
  where patient_id = v_patient_id and used_at is null;
  update public.profiles set role = 'patient' where id = v_user;
  return v_patient_id;
end; $$;

revoke execute on function public.redeem_patient_invite(text) from public, anon;
grant execute on function public.redeem_patient_invite(text) to authenticated;

commit;
