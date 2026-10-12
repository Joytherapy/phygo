#!/usr/bin/env bash
# Tests the proposed security SQL on a throwaway LOCAL PostgreSQL that mirrors
# the live roles and RLS policies. Never point this at Supabase.
#   PGHOST=/var/run/postgresql PGUSER=postgres bash tests/sql/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${TEST_DB:-phygo_security_test}
export PGOPTIONS="-c client_min_messages=warning"
case "${PGHOST:-}" in *supabase*) echo "Refusing to run against Supabase" >&2; exit 1;; esac
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
q() { psql -q -At -v ON_ERROR_STOP=1 -d "$DB" "$@"; }
fail=0
A=00000000-0000-0000-0000-00000000000a; B=00000000-0000-0000-0000-00000000000b; C=00000000-0000-0000-0000-00000000000c
D=00000000-0000-0000-0000-00000000000d; E=00000000-0000-0000-0000-00000000000e
PA=10000000-0000-0000-0000-00000000000a; PB=10000000-0000-0000-0000-00000000000b
# as <role> <user id> <sql>: runs one statement as a Supabase client role; prints ok or denied
as() { if psql -q -At -d "$DB" -c "set role $1; set request.jwt.claim.sub = '$2'; $3" >/dev/null 2>&1; then echo ok; else echo denied; fi; }
expect() { if [ "$2" = "$3" ]; then echo "  ok   $1"; else echo "  FAIL $1: expected $3, got $2"; fail=1; fi; }

q -f tests/sql/replica.sql >/dev/null
q -f docs/security/live-clinical-rls-2026-10-12.sql >/dev/null
q -c "insert into auth.users (id) values ('$A'), ('$B'), ('$C');
      insert into patients (id, user_id, name) values ('$PA', '$A', 'Synthetic A'), ('$PB', '$B', 'Synthetic B');
      insert into demo_usage values ('203.0.113.7', 1);
      insert into patient_invites (patient_id, code, expires_at) values ('$PA', 'INV1', now() + interval '1 day');" >/dev/null

echo "live policies (before the proposed fixes)"
expect "user can raise own plan (vulnerable)" "$(as authenticated $A "update profiles set plan = 'super_pro' where id = '$A'")" ok
expect "user can self-verify (vulnerable)" "$(as authenticated $A "update profiles set professional_status = 'verified' where id = '$A'")" ok
expect "A can write a note on B's patient (vulnerable)" "$(as authenticated $A "insert into notes (patient_id, user_id) values ('$PB', '$A')")" ok
expect "A can link any account as patient (vulnerable)" "$(as authenticated $A "update patients set patient_user_id = '$C' where id = '$PA'")" ok
expect "anon can read stored IPs (vulnerable)" "$(psql -q -At -d "$DB" -c "set role anon; select count(*) from demo_usage")" 1
q -c "update profiles set plan = 'free', professional_status = 'not_applicable'; update patients set patient_user_id = null; delete from notes;" >/dev/null

echo "apply proposed fixes (twice, to check they are re-runnable)"
for i in 1 2; do
  q -f sql/2026-10_security_profile_privileged_columns_PROPOSED.sql >/dev/null
  q -f sql/2026-10_security_clinical_rls_hardening_PROPOSED.sql >/dev/null
  q -f sql/2026-10_security_demo_usage_policies_PROPOSED.sql >/dev/null
done

echo "after the fixes"
expect "signup still creates a free, unverified profile" "$(q -c "insert into auth.users (id) values ('$D'); select plan || '/' || professional_status from profiles where id = '$D'")" "free/not_applicable"
expect "onboarding role choice still works" "$(as authenticated $D "update profiles set practice_stage = 'student' where id = '$D'")" ok
expect "language preference still saves" "$(as authenticated $D "update profiles set preferred_language = 'en' where id = '$D'")" ok
expect "profile page save still works" "$(as authenticated $D "update profiles set display_name = 'D', bio = 'b', avatar_url = 'a.png', credentials = '[]', registration_number = null where id = '$D'")" ok
expect "plan change refused" "$(as authenticated $A "update profiles set plan = 'pro' where id = '$A'")" denied
expect "self-verification refused" "$(as authenticated $A "update profiles set professional_status = 'verified' where id = '$A'")" denied
expect "editing own profile still works" "$(as authenticated $A "update profiles set display_name = 'Dr Test', registration_number = 'X1', practice_stage = 'student' where id = '$A'")" ok
expect "switching back to professional still works" "$(as authenticated $A "update profiles set practice_stage = 'professional' where id = '$A'")" ok
expect "service role can still set plan" "$(as service_role $A "update profiles set plan = 'pro' where id = '$A'")" ok
expect "note on another clinician's patient refused" "$(as authenticated $A "insert into notes (patient_id, user_id) values ('$PB', '$A')")" denied
expect "note on own patient works" "$(as authenticated $A "insert into notes (patient_id, user_id, assessment) values ('$PA', '$A', 'x')")" ok
expect "moving a note to another clinician's patient refused" "$(as authenticated $A "update notes set patient_id = '$PB' where user_id = '$A'")" denied
expect "linking an arbitrary account as patient refused" "$(as authenticated $A "update patients set patient_user_id = '$C' where id = '$PA'")" denied
expect "creating a patient pre-linked to an account refused" "$(as authenticated $A "insert into patients (id, user_id, name, patient_user_id) values (gen_random_uuid(), '$A', 'x', '$C')")" denied
expect "moving a patient to another clinician refused" "$(as authenticated $A "update patients set user_id = '$B' where id = '$PA'")" denied
expect "creating own patients still works" "$(as authenticated $A "insert into patients (id, user_id, name) values (gen_random_uuid(), '$A', 'New')")" ok
expect "redeeming an invite still links the patient" "$(as authenticated $C "select redeem_patient_invite('INV1')")" ok
expect "patient account is linked" "$(q -c "select patient_user_id from patients where id = '$PA'")" "$C"
expect "reset portal access (set to null) still works" "$(as authenticated $A "update patients set patient_user_id = null where id = '$PA'")" ok
expect "anon can no longer read stored IPs" "$(psql -q -At -d "$DB" -c "set role anon; select count(*) from demo_usage")" 0
expect "stored IP row kept (deletion is a separate decision)" "$(q -c "select count(*) from demo_usage")" 1

echo "professional verification (sql/2026-10_professional_verification_PROPOSED.sql, applied twice)"
q -f sql/2026-10_professional_verification_PROPOSED.sql >/dev/null
q -f sql/2026-10_professional_verification_PROPOSED.sql >/dev/null
expect "user cannot set own status to verified" "$(as authenticated $B "update profiles set professional_status = 'verified' where id = '$B'")" denied
expect "user cannot write the registration number directly" "$(as authenticated $B "update profiles set registration_number = 'R-1' where id = '$B'")" denied
expect "user cannot write review fields" "$(as authenticated $B "update profiles set verification_reviewed_by = 'me' where id = '$B'")" denied
expect "declared role switch still works" "$(as authenticated $B "update profiles set practice_stage = 'student' where id = '$B'")" ok
expect "profile editing still works" "$(as authenticated $B "update profiles set display_name = 'B' where id = '$B'")" ok
expect "new statuses accepted for the service role" "$(as service_role $B "update profiles set professional_status = 'needs_info', registration_number = 'R-1' where id = '$B'")" ok
expect "unknown status refused by the check constraint" "$(as service_role $B "update profiles set professional_status = 'super' where id = '$B'")" denied
expect "signup still works; new profile has no registration or review data" "$(q -c "insert into auth.users (id) values ('$E'); select plan || '/' || professional_status || '/' || coalesce(registration_number, '-') || '/' || coalesce(registry_country, '-') from profiles where id = '$E'")" "free/not_applicable/-/-"
expect "onboarding role choice and language still save" "$(as authenticated $E "update profiles set practice_stage = 'professional', preferred_language = 'fr' where id = '$E'")" ok
expect "new profile page save (no registration number) works" "$(as authenticated $B "update profiles set display_name = 'B', bio = 'b', avatar_url = 'a.png', credentials = '[]' where id = '$B'")" ok
expect "old profile page save with the same number still works" "$(as authenticated $B "update profiles set display_name = 'B2', registration_number = 'R-1' where id = '$B'")" ok
expect "old profile page save with a changed number is refused (deploy right after)" "$(as authenticated $B "update profiles set display_name = 'B3', registration_number = 'R-2' where id = '$B'")" denied
q -c "insert into patient_invites (patient_id, code, expires_at) values ('$PB', 'INV2', now() + interval '1 day')" >/dev/null
expect "invite redemption still works (role set by the function)" "$(as authenticated $E "select redeem_patient_invite('INV2')")" ok
expect "redeemed account is a patient" "$(q -c "select role from profiles where id = '$E'")" patient

echo "optional: new patients require a verified professional"
q -f sql/2026-10_patients_require_verification_PROPOSED.sql >/dev/null
q -c "update profiles set professional_status = 'not_applicable' where id = '$A'" >/dev/null
expect "unverified clinician cannot create a new patient" "$(as authenticated $A "insert into patients (id, user_id, name) values (gen_random_uuid(), '$A', 'x')")" denied
expect "unverified clinician keeps their existing patients" "$(as authenticated $A "update patients set name = 'Renamed' where id = '$PA'")" ok
expect "unverified clinician can still write notes for existing patients" "$(as authenticated $A "insert into notes (patient_id, user_id) values ('$PA', '$A')")" ok
q -c "update profiles set professional_status = 'verified' where id = '$A'" >/dev/null
expect "verified clinician can create patients" "$(as authenticated $A "insert into patients (id, user_id, name) values (gen_random_uuid(), '$A', 'x')")" ok
expect "anon cannot call the helper" "$(as anon $A "select is_verified_professional('$A')")" denied
q -c "drop policy if exists \"Users can insert their own patients\" on patients; create policy \"Users can insert their own patients\" on patients for insert with check (auth.uid() = user_id); drop function if exists is_verified_professional(uuid);" >/dev/null

echo "rollback of the verification migration (block from its header)"
q -c "update profiles set professional_status = 'rejected', registry_country = 'IT' where id = '$B'" >/dev/null
sed -n '/^--   begin;/,/^--   commit;/p' sql/2026-10_professional_verification_PROPOSED.sql | sed 's/^--   //' > "${TMPDIR:-/tmp}/verification_rollback.sql"
q -f "${TMPDIR:-/tmp}/verification_rollback.sql" >/dev/null
expect "review columns removed" "$(q -c "select count(*) from information_schema.columns where table_name = 'profiles' and column_name like 'registry_%'")" 0
expect "new statuses mapped back" "$(q -c "select professional_status from profiles where id = '$B'")" not_applicable
expect "live constraint restored" "$(as service_role $B "update profiles set professional_status = 'needs_info' where id = '$B'")" denied
expect "profile editing works after rollback" "$(as authenticated $B "update profiles set display_name = 'B4', registration_number = 'R-9' where id = '$B'")" ok
expect "self-verification still refused after rollback" "$(as authenticated $B "update profiles set professional_status = 'verified' where id = '$B'")" denied
q -f sql/2026-10_professional_verification_PROPOSED.sql >/dev/null
expect "verification migration re-applies after rollback" "$(as authenticated $B "update profiles set registration_number = 'R-10' where id = '$B'")" denied

echo "rollback (from the comments in each file)"
q -c "drop trigger if exists profiles_protect_privileged_columns on profiles; drop function if exists protect_profile_privileged_columns();
      drop policy if exists \"Users can insert their own notes\" on notes; create policy \"Users can insert their own notes\" on notes for insert with check (auth.uid() = user_id);
      drop policy if exists \"Users can update their own notes\" on notes; create policy \"Users can update their own notes\" on notes for update using (auth.uid() = user_id);
      drop trigger if exists patients_protect_links on patients; drop function if exists protect_patient_links();
      create policy \"anon can read demo_usage\" on demo_usage for select to anon using (true);
      create policy \"anon can insert demo_usage\" on demo_usage for insert to anon with check (true);
      create policy \"anon can update demo_usage\" on demo_usage for update to anon using (true) with check (true);" >/dev/null
expect "rollback restores live behaviour (plan)" "$(as authenticated $A "update profiles set plan = 'free' where id = '$A'")" ok
expect "rollback restores live behaviour (demo_usage)" "$(psql -q -At -d "$DB" -c "set role anon; select count(*) from demo_usage")" 1

psql -q -d postgres -c "drop database $DB" >/dev/null
[ $fail = 0 ] && echo "ALL SQL CHECKS PASSED" || { echo "SOME SQL CHECKS FAILED"; exit 1; }
