-- PHYGO Role-Aware architecture (Student vs Professional), applied 2026-09-20.
-- Mirrors exactly what was run against the live project via the Supabase
-- migration tool (migration name: profiles_role_aware).
--
-- IMPORTANT — naming: profiles.role ALREADY EXISTS and means ACCOUNT CATEGORY
-- ('physio' | 'patient', enforced by profiles_role_check) — it distinguishes
-- a practitioner-side account from a person receiving care through the
-- separate /my-phygo patient portal. It is a different dimension from what
-- this feature calls "Student vs Professional", so it is left untouched and
-- two new, independent columns are added instead:
--
--   practice_stage       'student' | 'professional'   — career stage; drives
--                         primary navigation (components/Navbar.tsx) and the
--                         landing/redirect logic (middleware.ts)
--   professional_status  'not_applicable' | 'pending' | 'verified' — reserved
--                         for a future professional-verification workflow;
--                         not yet used by any feature
--
-- Existing physio rows default to practice_stage='professional' (no behavior
-- change for any current physio account). registration_number (already on
-- profiles) is reused as-is for the professional registration/albo number —
-- no new column needed for it.

alter table profiles
  add column if not exists practice_stage text not null default 'professional'
    check (practice_stage in ('student', 'professional')),
  add column if not exists professional_status text not null default 'not_applicable'
    check (professional_status in ('not_applicable', 'pending', 'verified'));

update profiles set practice_stage = 'professional' where role = 'physio' and practice_stage is null;
update profiles set professional_status = 'not_applicable' where professional_status is null;
