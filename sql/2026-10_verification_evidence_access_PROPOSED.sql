-- PROPOSED - NOT APPLIED. Needs the owner's approval. Apply AFTER
-- 2026-10_verification_evidence_PROPOSED.sql and BEFORE
-- 2026-10_verification_evidence_backfill_PROPOSED.sql.
--
-- Makes the database rules for patient records honour the evidence deadline
-- (professional_evidence_deadlines), exactly as the server does for clinical
-- AI and video (lib/auth/sessionServer.ts, requireVerifiedProfessional).
-- It redefines can_manage_patients(), which every patient-management policy
-- of Part B uses. Two changes, nothing else:
--   1. a verified account whose deadline has passed without a confirmed
--      document (satisfied_at is null and due_at <= now()) is no longer
--      allowed to create, change or delete patient records. Reading its own
--      patients and notes is not affected (those select policies do not call
--      can_manage_patients()), and nothing is deleted;
--   2. the transition list (professional_transition_accounts) no longer
--      applies to verified accounts, as on the server already: an expired
--      deadline cannot be bypassed by an old list entry.
-- While professional_evidence_deadlines is empty (until the backfill), the
-- answer is the same as today for every account.
--
-- After this file, the emergency freeze (..._R_freeze_PROPOSED.sql) is undone
-- by re-running Part A AND then this file: Part A alone restores the earlier
-- rule, which ignores the deadlines.
--
-- Rollback: re-run sql/2026-10_patient_management_A_transition_list_PROPOSED.sql
-- (it restores the previous definition; the deadline rows stay, and the
-- server still enforces them for clinical AI and video).

begin;

do $g$ begin
  if to_regclass('public.professional_evidence_deadlines') is null then
    raise exception 'apply sql/2026-10_verification_evidence_PROPOSED.sql first';
  end if;
  if to_regclass('public.professional_transition_accounts') is null then
    raise exception 'Part A (professional_transition_accounts) is missing';
  end if;
end $g$;

create or replace function can_manage_patients() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.practice_stage = 'professional'
      and not exists (select 1 from patients x where x.patient_user_id = p.id)
      and (
        (p.professional_status = 'verified'
         and not exists (select 1 from professional_evidence_deadlines d
                         where d.user_id = p.id and d.satisfied_at is null and d.due_at <= now()))
        or (p.professional_status not in ('verified', 'rejected')
            and exists (select 1 from professional_transition_accounts t
                        where t.user_id = p.id and t.until > now()))
      )
  );
$$;
revoke all on function can_manage_patients() from public, anon;
grant execute on function can_manage_patients() to authenticated;

commit;
