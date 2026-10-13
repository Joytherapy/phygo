-- PROPOSED - NOT APPLIED. Needs the owner's approval, and must run only AFTER:
--   1. sql/2026-10_verification_evidence_PROPOSED.sql and
--      sql/2026-10_verification_evidence_access_PROPOSED.sql are applied;
--   2. the evidence code is deployed (users see the deadline in their profile);
--   3. the privacy section and the Terms clause are published, and any
--      message to the affected users has been sent.
-- Running it starts the clock: the deadline is 60 days from the moment it runs.
--
-- Gives every account verified before documents were required (status
-- 'verified' and no approved request with a document) a deadline to send its
-- registration document. Until the deadline the account keeps everything; a
-- document with the same name, number and Order does not interrupt anything.
-- If the deadline passes without an administrator confirming the document,
-- the account keeps its data and its read access, but loses the clinical
-- functions that need verification (clinical AI, video, and creating or
-- changing patient records) until the document is confirmed.
--
-- Re-running adds nobody twice (existing rows are kept as they are).
-- Read-only preview of who would be included (run it first):
--   select p.id, p.display_name from profiles p
--   where p.professional_status = 'verified'
--     and not exists (select 1 from professional_verification_requests r
--                     where r.user_id = p.id and r.status = 'verified');
-- Extend one deadline (at most 90 days after it was added):
--   update professional_evidence_deadlines set due_at = '<date>' where user_id = '<uuid>';
-- Remove one (the account is no longer asked for a document):
--   delete from professional_evidence_deadlines where user_id = '<uuid>';
-- Rollback (nobody is asked any more):
--   delete from professional_evidence_deadlines where satisfied_at is null;

begin;

do $g$ begin
  if to_regclass('public.professional_evidence_deadlines') is null then
    raise exception 'apply sql/2026-10_verification_evidence_PROPOSED.sql first';
  end if;
  if position('professional_evidence_deadlines' in pg_get_functiondef('public.can_manage_patients()'::regprocedure)) = 0 then
    raise exception 'apply sql/2026-10_verification_evidence_access_PROPOSED.sql first: otherwise the database rules would ignore the deadline';
  end if;
end $g$;

insert into professional_evidence_deadlines (user_id, due_at, added_by, note)
select p.id, now() + interval '60 days', 'owner', 'verified before documents were required'
from profiles p
where p.professional_status = 'verified'
  and not exists (select 1 from professional_verification_requests r
                  where r.user_id = p.id and r.status = 'verified')
on conflict (user_id) do nothing;

commit;
