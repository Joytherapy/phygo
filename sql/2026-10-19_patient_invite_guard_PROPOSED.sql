-- PROPOSED — NOT APPLIED. Needs the owner's approval. Patient invitations
-- must never link a clinician's account.
--
-- Problem (seen in Production on 19 Oct 2026 with the owner's own account):
-- redeem_patient_invite() links the patient record to whoever is signed in
-- (auth.uid()). The My Phygo invitation page created the new account and then
-- redeemed the code, but when no new session was opened (the e-mail already
-- had an account, or needed confirmation) the browser still carried the
-- physiotherapist's session, so the physiotherapist's account was linked as
-- the patient. A linked account counts as a patient everywhere: the dashboard
-- redirects it to My Phygo and the clinician APIs answer 403. The invitation
-- is used up, so the real patient can no longer join with it.
--
-- The app no longer redeems with any session but the new account's (PR
-- "Inviti My Phygo"). This file makes the database refuse it too:
--
-- 1. redeem_patient_invite() refuses when the caller
--      - is not signed in;
--      - is the record's own clinician;
--      - owns any patient record (a clinician's account);
--      - is a professional account that is verified or awaiting verification.
--    Everything else is unchanged: valid code, not used, not expired; the
--    record is linked to the caller, the code is marked used, the caller's
--    profiles.role becomes 'patient'. A new invitation still moves a record
--    to the new patient account, as today (that is how a physiotherapist
--    gives a patient a fresh account).
--
-- 2. REPAIR, once: unlinks every record linked to its own clinician's account
--    (never legitimate) and gives those clinicians back role 'physio'. Patient
--    accounts are not touched. After this the dashboard works again; the
--    physiotherapist then sends that patient a new invitation.
--
-- Before running, how many records are affected (expected: 1 or more if the
-- problem happened, 0 otherwise):
--   select count(*) from patients where patient_user_id = user_id;
--
-- Rollback (restores the previous function; the repaired links stay repaired):
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
--   commit;

begin;

create or replace function redeem_patient_invite(invite_code text) returns uuid
language plpgsql security definer set search_path to 'public' as $$
declare
  v_me uuid := auth.uid();
  v_invite_id uuid;
  v_patient_id uuid;
  v_owner uuid;
begin
  if v_me is null then
    raise exception 'Sign in to accept an invitation' using errcode = '42501';
  end if;

  select i.id, i.patient_id, p.user_id into v_invite_id, v_patient_id, v_owner
    from patient_invites i
    join patients p on p.id = i.patient_id
    where i.code = invite_code and i.used_at is null and i.expires_at > now()
    for update of i;
  if v_patient_id is null then
    raise exception 'Invalid or expired invite code';
  end if;

  -- A clinician's account is never linked as a patient.
  if v_owner = v_me
     or exists (select 1 from patients where user_id = v_me)
     or exists (select 1 from profiles where id = v_me and professional_status in ('verified', 'pending')) then
    raise exception 'A clinician account cannot accept a patient invitation' using errcode = '42501';
  end if;

  update patients set patient_user_id = v_me where id = v_patient_id;
  update patient_invites set used_at = now() where id = v_invite_id;
  update profiles set role = 'patient' where id = v_me;
  return v_patient_id;
end; $$;

revoke all on function redeem_patient_invite(text) from public, anon;
grant execute on function redeem_patient_invite(text) to authenticated;

-- REPAIR: records linked to their own clinician's account.
update patients set patient_user_id = null where patient_user_id = user_id;
update profiles p set role = 'physio'
  where p.role = 'patient'
    and exists (select 1 from patients x where x.user_id = p.id)
    and not exists (select 1 from patients y where y.patient_user_id = p.id);

commit;

-- Check after running (expected: 0):
--   select count(*) from patients where patient_user_id = user_id;
