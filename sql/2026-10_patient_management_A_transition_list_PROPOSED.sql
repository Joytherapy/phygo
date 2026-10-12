-- PROPOSED - NOT APPLIED. Needs the owner's approval. Part A of 2 (PR #8).
-- Apply AFTER 2026-10_professional_verification_PROPOSED.sql (PR #7).
-- Harmless on its own: it adds a table and a function, and changes no
-- existing access. Part B (the policies) uses them.
--
-- 1. professional_transition_accounts: the explicit, time-limited list of
--    PRE-EXISTING accounts that keep clinical access while their verification
--    is reviewed. It replaces the PROFESSIONAL_TRANSITION_* environment
--    variables of PR #7, because database rules (which protect patient
--    records written directly from the browser) cannot read Vercel settings.
--    One list now governs patient management, clinical AI and video.
--      - Only the owner adds rows, from the SQL editor (or service role).
--        Users can read their own row (to see until when) and nothing else.
--      - Nobody is added automatically: not new accounts, not role switches.
--      - Each entry ends at `until`, at most 90 days after it was added.
--
-- 2. can_manage_patients(): true when the signed-in account may manage real
--    patients and their clinical data:
--      declared professional (not student), not a patient account, and
--      professional_status = 'verified'
--      OR listed in professional_transition_accounts, not expired, and not
--         'rejected' (a PHYGO rejection always wins).
--    No argument: it only ever answers for auth.uid(), so it cannot be used
--    to look up other people's status.
--
-- Add an account (example; ids from auth.users, see the rollout guide):
--   insert into professional_transition_accounts (user_id, until, added_by, note)
--   values ('<uuid>', now() + interval '60 days', 'owner', 'pre-existing clinician');
-- Remove one:   delete from professional_transition_accounts where user_id = '<uuid>';
-- End for all:  delete from professional_transition_accounts;
--
-- Rollback (apply Part B's rollback first; export the list if needed):
--   drop function if exists can_manage_patients();
--   drop table if exists professional_transition_accounts;

begin;

create table if not exists professional_transition_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  until timestamptz not null,
  added_at timestamptz not null default now(),
  added_by text not null,
  note text,
  constraint professional_transition_max_90_days check (until <= added_at + interval '90 days')
);
alter table professional_transition_accounts enable row level security;
drop policy if exists "Users can see their own transition entry" on professional_transition_accounts;
create policy "Users can see their own transition entry" on professional_transition_accounts
  for select using (user_id = auth.uid());
revoke all on professional_transition_accounts from anon, authenticated;
grant select on professional_transition_accounts to authenticated;

create or replace function can_manage_patients() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.practice_stage = 'professional'
      and not exists (select 1 from patients x where x.patient_user_id = p.id)
      and (
        p.professional_status = 'verified'
        or (p.professional_status <> 'rejected'
            and exists (select 1 from professional_transition_accounts t
                        where t.user_id = p.id and t.until > now()))
      )
  );
$$;
revoke all on function can_manage_patients() from public, anon;
grant execute on function can_manage_patients() to authenticated;

commit;
