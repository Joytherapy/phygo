-- PROPOSED - NOT APPLIED. EMERGENCY USE ONLY, with the owner's approval (PR #8).
--
-- Emergency stop for patient management. Use it if you suspect that someone
-- can create, change or delete patient data who should not, and you need to
-- stop it at once while the cause is investigated.
--
-- Effect: can_manage_patients() answers false for everyone, so every
-- browser CREATE, CHANGE or DELETE on patients, notes, appointments,
-- invitations, video calls and clinical links is refused, including for
-- verified clinicians. Nothing is deleted and nothing is opened:
--   - clinicians still READ their own records;
--   - patients keep My Phygo, appointment requests and invite redemption
--     (their policies do not use this function);
--   - the server routes (clinical AI, video rooms, metabolic data) keep their
--     own check: verified or listed accounts only. To stop those as well for a
--     given account, reject it or delete its transition entry.
--
-- Undo (back to normal): re-run 2026-10_patient_management_A_transition_list_PROPOSED.sql,
-- which re-creates the normal function. The transition list is untouched.

begin;

create or replace function can_manage_patients() returns boolean
language sql stable security definer set search_path = public as $$
  select false;
$$;
revoke all on function can_manage_patients() from public, anon;
grant execute on function can_manage_patients() to authenticated;

commit;
