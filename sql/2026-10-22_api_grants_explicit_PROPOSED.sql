-- PROPOSED — explicit Data API privileges for the tables created by files in
-- sql/ that granted nothing (or nothing to service_role).
--
-- Why: from 30 Oct 2026 Supabase no longer gives new tables in `public`
-- automatic privileges for anon / authenticated / service_role. Tables that
-- already exist in Production keep theirs, so Production is not affected; but
-- re-running the creating files on a new project, a preview branch or a local
-- database would leave these tables unreachable and break the features below.
-- This file states what the app actually needs, so a rebuild works and the
-- intent is written down. Least privilege: only the operations the code uses
-- (see the comment on each block); row-level security (already in the
-- creating files) still decides which rows.
--
-- Safe in Production: it only GRANTs. A privilege already held is unchanged;
-- nothing is revoked here (revocations need the Production grant listing first
-- and go in a separate, reviewed file). Re-runnable.
--
-- Tested on a local PostgreSQL without default privileges, i.e. the behaviour
-- after 30 Oct: tests/sql/api_grants.sh.

begin;

-- Workspace (notebooks, documents, annotations, tags, bookmarks, study saves):
-- each signed-in user reads and writes only their own rows (RLS: owner_id =
-- auth.uid()), from the browser and from API routes with the user's session.
grant select, insert, update, delete on
  workspace_folders, workspace_notebooks, workspace_notebook_pages, workspace_documents,
  workspace_annotations, workspace_tags, workspace_item_tags, workspace_bookmarks,
  workspace_knowledge_saves
  to authenticated;
grant all on
  workspace_folders, workspace_notebooks, workspace_notebook_pages, workspace_documents,
  workspace_annotations, workspace_tags, workspace_item_tags, workspace_bookmarks,
  workspace_knowledge_saves
  to service_role;

-- Quiz: a student records and reads their own attempts with their session
-- (app/api/quiz/submit, app/api/quiz/progress; RLS quiz_attempts_owner).
-- Questions, with their answer keys, are read and written by the server only.
grant select, insert on quiz_attempts to authenticated;
grant all on quiz_attempts to service_role;
grant all on quiz_questions to service_role;

-- Metabolic profiles (patient health data): server only
-- (app/api/metabolic/save, service role; RLS denies every client).
grant all on metabolic_profiles to service_role;

-- Translations of reference content. condition_translations is read with the
-- anon key by the public landing pages (lib/landing/landingData.ts); both
-- tables are written by the server only (lib/conditionTranslation.ts,
-- lib/contentTranslation.ts). Their ids come from sequences (bigserial).
grant select on condition_translations to anon;
grant all on condition_translations, content_translations to service_role;
grant usage, select on sequence condition_translations_id_seq, content_translations_id_seq to service_role;

-- Tables whose files granted the browser what it needs but nothing to the
-- server: give the service role the same reach it has on every other table,
-- for server jobs and admin maintenance (sessionServer reads the transition
-- list with the user's session; nothing else changes for clients).
grant all on patient_details, professional_transition_accounts to service_role;

commit;
