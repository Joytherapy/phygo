# Data API privileges and the Supabase change of 30 Oct 2026

From 30 Oct 2026, tables newly created in `public` no longer get automatic
privileges for `anon`, `authenticated` and `service_role`. Existing tables keep
theirs. Audit of 21–22 Oct 2026, read-only on Production (table list, security
advisors, migration history, branches, and the `pg_policies` listing the owner
ran in the SQL editor).

## Production

- Not broken by the change: every table the app uses already exists.
- Clinical tables (`patients`, `notes`, `appointments`, `patient_invites`,
  `video_calls`, `patient_clinical_references`, `profiles`): every policy
  needs `auth.uid()`, so `anon` sees and changes no row. A clinician reaches
  only their own patients, and writes also need `can_manage_patients()`. A
  patient reaches only their own record, calls, appointments and references.
  The policies are written `TO public`. Restricting them to `authenticated`, or
  revoking `anon` on these tables, would add a second layer. That is still to
  decide, once the grant listing (query 1 below) is known.
- `exercise_cache`: the `anon` insert and update policies are `true`. Anyone
  with the public key could write the cache that feeds the exercises suggested
  in notes. The fix has two parts:
  1. writes go through the service role (`lib/exercise-providers/cache.ts`);
  2. then `sql/2026-10-22_exercise_cache_no_anon_writes_PROPOSED.sql` removes
     the policies.
- The security advisors report `handle_new_user()`, `rls_auto_enable()` and
  `redeem_patient_invite()` as SECURITY DEFINER functions executable by `anon`.
  `handle_new_user()` has no fixed `search_path`. To fix after query 3.

## Rebuilding (new project, preview branch, local reset)

- There is no migration pipeline: no `supabase/` directory, no CI and no
  branches. About 75 tables, including the clinical ones, exist only in the
  dashboard.
- Several files in `sql/` create tables without granting anything. After
  30 Oct, a rebuild from them would leave the workspace, quiz, metabolic
  profiles and translations unreachable.
  `sql/2026-10-22_api_grants_explicit_PROPOSED.sql` states the least
  privileges the code needs. It only grants, so it changes nothing in
  Production.
- `tests/sql/api_grants.sh` reproduces the post-change behaviour on a local
  PostgreSQL:
  1. the gaps with the files as they are;
  2. the grants and the row separation after the proposed file;
  3. the `exercise_cache` fix.
- From now on, every file that creates a table also writes its GRANTs and
  policies, as `sql/2026-10-20_care_program_PROPOSED.sql` does. Nothing relies
  on default privileges.

## Production-only checks (read-only queries, SQL editor)

1. Grants per role: `information_schema.role_table_grants` for `anon`,
   `authenticated` and `service_role` in `public`.
2. Default privileges: `pg_default_acl`.
3. Functions: `pg_proc` (`prosecdef`, `proconfig`, `proacl`) in `public`.
4. Dashboard: Settings → API → Exposed schemas (expected: `public`,
   `graphql_public`).
