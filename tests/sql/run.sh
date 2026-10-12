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

echo "patient management (PR #8, part A then part B, each applied twice)"
# Fresh actors: V verified, L listed pre-existing, X listed but expired, R listed but rejected,
# U declared professional (new / self-promoted, not listed), S student, P a patient account.
for x in v l x r u s p; do eval "${x^^}=20000000-0000-0000-0000-0000000000$(printf '%02x' "'$x")"; done
q -c "insert into auth.users (id) values ('$V'), ('$L'), ('$X'), ('$R'), ('$U'), ('$S'), ('$P');
      update profiles set professional_status = 'verified' where id = '$V';
      update profiles set professional_status = 'rejected' where id = '$R';
      update profiles set practice_stage = 'student' where id = '$S';
      insert into patients (id, user_id, name) values
        ('30000000-0000-0000-0000-000000000001', '$V', 'pV'), ('30000000-0000-0000-0000-000000000002', '$L', 'pL'),
        ('30000000-0000-0000-0000-000000000003', '$U', 'pU'), ('30000000-0000-0000-0000-000000000004', '$X', 'pX');
      update patients set patient_user_id = '$P' where id = '30000000-0000-0000-0000-000000000001';
      insert into notes (patient_id, user_id, assessment) values ('30000000-0000-0000-0000-000000000003', '$U', 'old note');" >/dev/null
PV=30000000-0000-0000-0000-000000000001; PL=30000000-0000-0000-0000-000000000002; PU=30000000-0000-0000-0000-000000000003; PX=30000000-0000-0000-0000-000000000004
for i in 1 2; do
  q -f sql/2026-10_patient_management_A_transition_list_PROPOSED.sql >/dev/null
done
expect "part A alone changes nothing: unlisted account can still create a patient" "$(as authenticated $U "insert into patients (id, user_id, name) values (gen_random_uuid(), '$U', 'tmp')")" ok
q -c "delete from patients where name = 'tmp'" >/dev/null
q -c "insert into professional_transition_accounts (user_id, until, added_by) values
        ('$L', now() + interval '30 days', 'owner'), ('$R', now() + interval '30 days', 'owner'),
        ('$S', now() + interval '30 days', 'owner'), ('$P', now() + interval '30 days', 'owner');
      insert into professional_transition_accounts (user_id, until, added_at, added_by) values ('$X', now() - interval '1 day', now() - interval '31 days', 'owner');" >/dev/null
expect "transition entries longer than 90 days are refused" "$(as service_role $U "insert into professional_transition_accounts (user_id, until, added_by) values ('$U', now() + interval '91 days', 'owner')")" denied
expect "users cannot add themselves to the transition list" "$(as authenticated $U "insert into professional_transition_accounts (user_id, until, added_by) values ('$U', now() + interval '10 days', 'me')")" denied
expect "users cannot extend their own transition entry" "$(as authenticated $L "update professional_transition_accounts set until = now() + interval '80 days' where user_id = '$L'")" denied
expect "users see only their own transition entry" "$(psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$U'; select count(*) from professional_transition_accounts")" 0
expect "a listed user sees their own entry" "$(psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$L'; select count(*) from professional_transition_accounts")" 1
expect "anon cannot call can_manage_patients" "$(as anon $U "select can_manage_patients()")" denied
cm() { psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$1'; select can_manage_patients()"; }
expect "can_manage: verified" "$(cm $V)" t
expect "can_manage: listed pre-existing" "$(cm $L)" t
expect "can_manage: listed but expired" "$(cm $X)" f
expect "can_manage: listed but rejected" "$(cm $R)" f
expect "can_manage: listed but student" "$(cm $S)" f
expect "can_manage: listed but a patient account" "$(cm $P)" f
expect "can_manage: declared professional, not listed" "$(cm $U)" f

for i in 1 2; do q -f sql/2026-10_patient_management_B_policies_PROPOSED.sql >/dev/null; done
for who in U X R S; do
  id=${!who}
  expect "$who cannot create a patient" "$(as authenticated $id "insert into patients (id, user_id, name) values (gen_random_uuid(), '$id', 'n')")" denied
done
expect "U cannot edit their existing patient" "$(as authenticated $U "update patients set name = 'x' where id = '$PU'")" denied
expect "U cannot write a note" "$(as authenticated $U "insert into notes (patient_id, user_id) values ('$PU', '$U')")" denied
expect "U cannot schedule an appointment" "$(as authenticated $U "insert into appointments (patient_id, physio_id, requested_by, status) values ('$PU', '$U', 'physio', 'confirmed')")" denied
expect "U cannot create an invitation" "$(as authenticated $U "insert into patient_invites (patient_id, code, created_by, expires_at) values ('$PU', 'U1', '$U', now() + interval '1 day')")" denied
expect "U cannot create a video call" "$(as authenticated $U "insert into video_calls (patient_id, room_url, created_by) values ('$PU', 'https://t.daily.co/a', '$U')")" denied
expect "U cannot link library content to a patient" "$(as authenticated $U "insert into patient_clinical_references (patient_id, content_type, content_id) values ('$PU', 'exercise', 'e1')")" denied
expect "U still reads their own existing patient" "$(psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$U'; select count(*) from patients")" 1
expect "U still reads their own existing note" "$(psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$U'; select count(*) from notes")" 1
expect "U can still delete their own patient record" "$(as authenticated $U "delete from patients where id = '$PU'")" ok
expect "X (expired) cannot write a note" "$(as authenticated $X "insert into notes (patient_id, user_id) values ('$PX', '$X')")" denied
for who in V L; do
  id=${!who}; pid=$([ $who = V ] && echo $PV || echo $PL)
  expect "$who can create a patient" "$(as authenticated $id "insert into patients (id, user_id, name) values (gen_random_uuid(), '$id', 'n')")" ok
  expect "$who can edit their patient" "$(as authenticated $id "update patients set name = 'renamed' where id = '$pid'")" ok
  expect "$who can write a note" "$(as authenticated $id "insert into notes (patient_id, user_id) values ('$pid', '$id')")" ok
  expect "$who can schedule" "$(as authenticated $id "insert into appointments (patient_id, physio_id, requested_by, status) values ('$pid', '$id', 'physio', 'confirmed')")" ok
  expect "$who can invite" "$(as authenticated $id "insert into patient_invites (patient_id, code, created_by, expires_at) values ('$pid', 'C$who', '$id', now() + interval '1 day')")" ok
  expect "$who can create a Daily video call" "$(as authenticated $id "insert into video_calls (patient_id, room_url, created_by) values ('$pid', 'https://t.daily.co/a', '$id')")" ok
  expect "$who can link library content" "$(as authenticated $id "insert into patient_clinical_references (patient_id, content_type, content_id) values ('$pid', 'exercise', 'e1')")" ok
done
expect "V cannot write a note on L's patient" "$(as authenticated $V "insert into notes (patient_id, user_id) values ('$PL', '$V')")" denied
expect "V cannot schedule for L's patient" "$(as authenticated $V "insert into appointments (patient_id, physio_id, requested_by, status) values ('$PL', '$V', 'physio', 'confirmed')")" denied
expect "V cannot invite for L's patient" "$(as authenticated $V "insert into patient_invites (patient_id, code, created_by, expires_at) values ('$PL', 'Z', '$V', now() + interval '1 day')")" denied
expect "V cannot see L's patient" "$(psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$V'; select count(*) from patients where id = '$PL'")" 0
expect "invitation must name the signed-in clinician as creator" "$(as authenticated $V "insert into patient_invites (patient_id, code, created_by, expires_at) values ('$PV', 'Y', '$L', now() + interval '1 day')")" denied
expect "video call must point to Daily" "$(as authenticated $V "insert into video_calls (patient_id, room_url, created_by) values ('$PV', 'https://evil.example/x', '$V')")" denied
expect "video call cannot be redirected later" "$(as authenticated $V "update video_calls set room_url = 'https://evil.example/x' where patient_id = '$PV'")" denied
expect "self-verification is still refused" "$(as authenticated $U "update profiles set professional_status = 'verified' where id = '$U'")" denied
expect "editing review fields is still refused" "$(as authenticated $U "update profiles set verification_reviewed_by = 'me' where id = '$U'")" denied
N=20000000-0000-0000-0000-0000000000ee
q -c "insert into auth.users (id) values ('$N'); update profiles set practice_stage = 'student' where id = '$N'" >/dev/null
expect "a new student switching to professional gets no patient management" "$(as authenticated $N "update profiles set practice_stage = 'professional' where id = '$N'"; cm $N)" "$(printf 'ok\nf')"
expect "and cannot create a patient" "$(as authenticated $N "insert into patients (id, user_id, name) values (gen_random_uuid(), '$N', 'n')")" denied
expect "a rejection removes access at once" "$(q -c "update profiles set professional_status = 'rejected' where id = '$L'" >/dev/null; as authenticated $L "insert into notes (patient_id, user_id) values ('$PL', '$L')")" denied
q -c "update profiles set professional_status = 'not_applicable' where id = '$L'" >/dev/null
expect "patient still reads their own notes" "$(psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$P'; select count(*) > 0 from notes")" t
expect "patient can still request an appointment" "$(as authenticated $P "insert into appointments (patient_id, requested_by, status) values ('$PV', 'patient', 'requested')")" ok
q -c "insert into patient_invites (patient_id, code, expires_at) values ('$PL', 'INV3', now() + interval '1 day')" >/dev/null
q -c "insert into auth.users (id) values ('20000000-0000-0000-0000-0000000000ff')" >/dev/null
expect "invite redemption still works" "$(as authenticated 20000000-0000-0000-0000-0000000000ff "select redeem_patient_invite('INV3')")" ok

echo "rollback of patient management (blocks from the file headers)"
sed -n '/^--   begin;/,/^--   commit;/p' sql/2026-10_patient_management_B_policies_PROPOSED.sql | sed 's/^--   //' > "${TMPDIR:-/tmp}/pm_rollback.sql"
q -f "${TMPDIR:-/tmp}/pm_rollback.sql" >/dev/null
q -c "drop function if exists can_manage_patients(); drop table if exists professional_transition_accounts;" >/dev/null
expect "after rollback an unlisted account can create patients again (PR #5 state)" "$(as authenticated $U "insert into patients (id, user_id, name) values (gen_random_uuid(), '$U', 'n')")" ok
expect "after rollback notes still need an own patient (PR #5 kept)" "$(as authenticated $U "insert into notes (patient_id, user_id) values ('$PV', '$U')")" denied
expect "after rollback self-verification is still refused" "$(as authenticated $U "update profiles set professional_status = 'verified' where id = '$U'")" denied
for i in 1 2; do q -f sql/2026-10_patient_management_A_transition_list_PROPOSED.sql >/dev/null; q -f sql/2026-10_patient_management_B_policies_PROPOSED.sql >/dev/null; done
expect "re-applies cleanly after rollback" "$(as authenticated $U "insert into notes (patient_id, user_id) values ('$PU', '$U')")" denied
sed -n '/^--   begin;/,/^--   commit;/p' sql/2026-10_patient_management_B_policies_PROPOSED.sql | sed 's/^--   //' > "${TMPDIR:-/tmp}/pm_rollback.sql"
q -f "${TMPDIR:-/tmp}/pm_rollback.sql" >/dev/null
q -c "drop function if exists can_manage_patients(); drop table if exists professional_transition_accounts;" >/dev/null

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
