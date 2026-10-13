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
# block <file>: the rollback block from a migration header (between "--   begin;" and "--   commit;")
block() { sed -n '/^--   begin;/,/^--   commit;/p' "$1" | sed 's/^--   //' > "${TMPDIR:-/tmp}/phygo_block.sql"; echo "${TMPDIR:-/tmp}/phygo_block.sql"; }
# runs <file>: executes a SQL file as the owner; prints ok or refused
runs() { if q -f "$1" >/dev/null 2>&1; then echo ok; else echo refused; fi; }
expect() { if [ "$2" = "$3" ]; then echo "  ok   $1"; else echo "  FAIL $1: expected $3, got $2"; fail=1; fi; }

echo "SQL files match the checksums in the release guide"
while read -r f sum; do
  expect "$f matches the guide" "$(sha256sum "$f" | cut -d' ' -f1)" "$sum"
done < <(grep -oE '`sql/[^`]+\.sql`[^|]*\| `[0-9a-f]{64}`' docs/security/professional-verification-rollout.md | sed -E 's/`(sql\/[^`]+)`.*`([0-9a-f]{64})`/\1 \2/')
expect "the guide lists every 2026-10 SQL file" "$(grep -cE '`sql/2026-10_[^`]+\.sql`[^|]*\| `[0-9a-f]{64}`' docs/security/professional-verification-rollout.md)" "$(ls sql/2026-10_*.sql | wc -l | tr -d ' ')"

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

echo "rollback of the PR #5 changes (blocks from the file headers), then re-applied"
expect "privileged-columns rollback runs before PR #7/#8" "$(runs "$(block sql/2026-10_security_profile_privileged_columns_PROPOSED.sql)")" ok
expect "clinical-RLS rollback runs before PR #8" "$(runs "$(block sql/2026-10_security_clinical_rls_hardening_PROPOSED.sql)")" ok
q -c "create policy \"anon can read demo_usage\" on demo_usage for select to anon using (true);
      create policy \"anon can insert demo_usage\" on demo_usage for insert to anon with check (true);
      create policy \"anon can update demo_usage\" on demo_usage for update to anon using (true) with check (true);" >/dev/null
expect "rollback restores live behaviour (plan)" "$(as authenticated $A "update profiles set plan = 'free' where id = '$A'")" ok
expect "rollback restores live behaviour (notes)" "$(as authenticated $A "insert into notes (patient_id, user_id) values ('$PB', '$A')")" ok
expect "rollback restores live behaviour (demo_usage)" "$(psql -q -At -d "$DB" -c "set role anon; select count(*) from demo_usage")" 1
q -c "delete from notes where patient_id = '$PB' and user_id = '$A'; update profiles set plan = 'free';" >/dev/null
for f in profile_privileged_columns clinical_rls_hardening demo_usage_policies; do q -f sql/2026-10_security_${f}_PROPOSED.sql >/dev/null; done
expect "re-applied: self-upgrade refused again" "$(as authenticated $A "update profiles set plan = 'pro' where id = '$A'")" denied

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
expect "Part A rollback runs before Part B (aborted release)" "$(runs "$(block sql/2026-10_patient_management_A_transition_list_PROPOSED.sql)")" ok
expect "Part A rollback removed the table and the function" "$(q -c "select (to_regclass('public.professional_transition_accounts') is null) and (to_regprocedure('public.can_manage_patients()') is null)")" t
for i in 1 2; do q -f sql/2026-10_patient_management_A_transition_list_PROPOSED.sql >/dev/null; done
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
expect "U cannot delete their own patient (it would cascade to notes)" "$(as authenticated $U "delete from patients where id = '$PU'"; q -c "select count(*) from patients where id = '$PU'")" "$(printf 'ok\n1')"
expect "U cannot delete their own note" "$(as authenticated $U "delete from notes where patient_id = '$PU'"; q -c "select count(*) from notes where patient_id = '$PU'")" "$(printf 'ok\n1')"
q -c "insert into appointments (patient_id, physio_id, requested_by, status) values ('$PU', '$U', 'physio', 'confirmed');
      insert into patient_invites (patient_id, code, created_by, expires_at) values ('$PU', 'UOLD', '$U', now() + interval '1 day');
      insert into video_calls (patient_id, room_url, created_by) values ('$PU', 'https://t.daily.co/u', '$U');
      insert into patient_clinical_references (patient_id, content_type, content_id) values ('$PU', 'exercise', 'old');" >/dev/null
for t in appointments patient_invites video_calls patient_clinical_references; do
  expect "U cannot delete own $t" "$(as authenticated $U "delete from $t where patient_id = '$PU'"; q -c "select count(*) from $t where patient_id = '$PU'")" "$(printf 'ok\n1')"
done
q -c "insert into patients (id, user_id, name) values ('30000000-0000-0000-0000-0000000000aa', '$R', 'pR')" >/dev/null
expect "R (rejected, listed) cannot delete their patient" "$(as authenticated $R "delete from patients where user_id = '$R'"; q -c "select count(*) from patients where user_id = '$R'")" "$(printf 'ok\n1')"
expect "X (expired) cannot delete a note" "$(q -c "insert into notes (patient_id, user_id) values ('$PX', '$X')" >/dev/null; as authenticated $X "delete from notes where patient_id = '$PX'"; q -c "select count(*) from notes where patient_id = '$PX'")" "$(printf 'ok\n1')"
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
for who in V L; do
  id=${!who}; pid=$([ $who = V ] && echo $PV || echo $PL)
  nid=$(q -c "insert into notes (patient_id, user_id) values ('$pid', '$id') returning id")
  rid=$(q -c "insert into patient_clinical_references (patient_id, note_id, content_type, content_id) values ('$pid', '$nid', 'exercise', 'n') returning id")
  expect "$who can delete a note" "$(as authenticated $id "delete from notes where id = '$nid'"; q -c "select count(*) from notes where id = '$nid'")" "$(printf 'ok\n0')"
  expect "$who: deleting a note keeps its clinical link, with note_id cleared" "$(q -c "select count(*) || '/' || count(note_id) from patient_clinical_references where id = '$rid'")" "1/0"
  expect "$who can delete an appointment" "$(as authenticated $id "delete from appointments where patient_id = '$pid' and requested_by = 'physio'"; q -c "select count(*) from appointments where patient_id = '$pid' and requested_by = 'physio'")" "$(printf 'ok\n0')"
  expect "$who can delete a clinical link" "$(as authenticated $id "delete from patient_clinical_references where patient_id = '$pid'"; q -c "select count(*) from patient_clinical_references where patient_id = '$pid'")" "$(printf 'ok\n0')"
done
# Cascade: an authorised clinician deletes a whole patient; every child row goes with it.
PC=30000000-0000-0000-0000-0000000000cc
q -c "insert into patients (id, user_id, name) values ('$PC', '$L', 'to delete');
      insert into notes (id, patient_id, user_id) values ('40000000-0000-0000-0000-0000000000cc', '$PC', '$L');
      insert into appointments (patient_id, physio_id, requested_by, status) values ('$PC', '$L', 'physio', 'confirmed');
      insert into patient_invites (patient_id, code, created_by, expires_at) values ('$PC', 'CC', '$L', now() + interval '1 day');
      insert into video_calls (patient_id, room_url, created_by) values ('$PC', 'https://t.daily.co/c', '$L');
      insert into patient_clinical_references (patient_id, note_id, content_type, content_id) values ('$PC', '40000000-0000-0000-0000-0000000000cc', 'exercise', 'c');
      insert into metabolic_profiles (patient_id) values ('$PC');" >/dev/null
expect "U cannot delete another clinician's patient" "$(as authenticated $U "delete from patients where id = '$PC'"; q -c "select count(*) from patients where id = '$PC'")" "$(printf 'ok\n1')"
expect "L (listed) can delete their patient" "$(as authenticated $L "delete from patients where id = '$PC'")" ok
expect "cascade removed every child row" "$(q -c "select (select count(*) from notes where patient_id = '$PC') + (select count(*) from appointments where patient_id = '$PC') + (select count(*) from patient_invites where patient_id = '$PC') + (select count(*) from video_calls where patient_id = '$PC') + (select count(*) from patient_clinical_references where patient_id = '$PC') + (select count(*) from metabolic_profiles where patient_id = '$PC')")" 0
expect "V cannot write a note on L's patient" "$(as authenticated $V "insert into notes (patient_id, user_id) values ('$PL', '$V')")" denied
expect "V cannot schedule for L's patient" "$(as authenticated $V "insert into appointments (patient_id, physio_id, requested_by, status) values ('$PL', '$V', 'physio', 'confirmed')")" denied
expect "V cannot invite for L's patient" "$(as authenticated $V "insert into patient_invites (patient_id, code, created_by, expires_at) values ('$PL', 'Z', '$V', now() + interval '1 day')")" denied
# Cancelling an appointment: the statement lib/appointments.ts sends (status -> 'cancelled', returning id).
# Success = exactly one row returned; a refusal returns no row or an error, and the row stays unchanged.
cancel() { psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$1'; update appointments set status = 'cancelled' where id = '$2' returning id" 2>/dev/null | grep -c . ; }
status_of() { q -c "select status from appointments where id = '$1'"; }
AL=50000000-0000-0000-0000-0000000000a1; AU=50000000-0000-0000-0000-0000000000a2; AV=50000000-0000-0000-0000-0000000000a3
q -c "insert into appointments (id, patient_id, physio_id, requested_by, status) values
        ('$AL', '$PL', '$L', 'physio', 'confirmed'), ('$AU', '$PU', '$U', 'physio', 'confirmed'), ('$AV', '$PV', '$V', 'physio', 'confirmed')" >/dev/null
expect "V cannot cancel an appointment of L's patient" "$(cancel $V $AL)/$(status_of $AL)" "0/confirmed"
expect "U (not verified, not listed) cannot cancel their own appointment" "$(cancel $U $AU)/$(status_of $AU)" "0/confirmed"
expect "the patient cannot cancel a confirmed appointment as a clinician would" "$(cancel $P $AV)/$(status_of $AV)" "0/confirmed"
expect "L (listed) cancels their own appointment: one row, kept as cancelled" "$(cancel $L $AL)/$(status_of $AL)" "1/cancelled"
expect "V (verified) cancels their own appointment" "$(cancel $V $AV)/$(status_of $AV)" "1/cancelled"
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

echo "emergency stop (sql/2026-10_patient_management_R_freeze_PROPOSED.sql), then undo"
q -f sql/2026-10_patient_management_R_freeze_PROPOSED.sql >/dev/null
for who in V L; do
  id=${!who}; pid=$([ $who = V ] && echo $PV || echo $PL)
  expect "frozen: $who cannot write a note" "$(as authenticated $id "insert into notes (patient_id, user_id) values ('$pid', '$id')")" denied
  expect "frozen: $who cannot create a patient" "$(as authenticated $id "insert into patients (id, user_id, name) values (gen_random_uuid(), '$id', 'n')")" denied
  expect "frozen: $who cannot delete their patient" "$(as authenticated $id "delete from patients where id = '$pid'"; q -c "select count(*) from patients where id = '$pid'")" "$(printf 'ok\n1')"
  expect "frozen: $who still reads their patients" "$(psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$id'; select count(*) > 0 from patients")" t
done
expect "frozen: U still refused" "$(as authenticated $U "insert into patients (id, user_id, name) values (gen_random_uuid(), '$U', 'n')")" denied
expect "frozen: patient still reads own notes" "$(psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$P'; select count(*) > 0 from notes")" t
expect "frozen: patient can still request an appointment" "$(as authenticated $P "insert into appointments (patient_id, requested_by, status) values ('$PV', 'patient', 'requested')")" ok
q -f sql/2026-10_patient_management_A_transition_list_PROPOSED.sql >/dev/null
expect "undo (re-run Part A): V can write again" "$(as authenticated $V "insert into notes (patient_id, user_id) values ('$PV', '$V')")" ok
expect "undo keeps the list: L can write again" "$(as authenticated $L "insert into notes (patient_id, user_id) values ('$PL', '$L')")" ok
expect "undo does not open U" "$(as authenticated $U "insert into notes (patient_id, user_id) values ('$PU', '$U')")" denied

echo "unsafe rollbacks are refused once PR #8 is applied"
expect "PR #5 privileged-columns rollback refuses" "$(runs "$(block sql/2026-10_security_profile_privileged_columns_PROPOSED.sql)")" refused
expect "PR #5 clinical-RLS rollback refuses" "$(runs "$(block sql/2026-10_security_clinical_rls_hardening_PROPOSED.sql)")" refused
expect "Part A rollback refuses once Part B is applied" "$(runs "$(block sql/2026-10_patient_management_A_transition_list_PROPOSED.sql)")" refused
expect "after the refused Part A rollback: table and function still there" "$(q -c "select (to_regclass('public.professional_transition_accounts') is not null) and (to_regprocedure('public.can_manage_patients()') is not null)")" t
expect "can_manage_patients() cannot be dropped while the rules use it" "$(runs <(echo "drop function can_manage_patients();"))" refused
expect "after the refused attempts: self-verification still refused" "$(as authenticated $U "update profiles set professional_status = 'verified' where id = '$U'")" denied
expect "after the refused attempts: U still cannot create patients" "$(as authenticated $U "insert into patients (id, user_id, name) values (gen_random_uuid(), '$U', 'n')")" denied
expect "after the refused attempts: notes on another clinician's patient still refused" "$(as authenticated $V "insert into notes (patient_id, user_id) values ('$PL', '$V')")" denied

echo "rollback of the verification migration (block from its header)"
q -c "update profiles set professional_status = 'rejected', registry_country = 'IT' where id = '$B'" >/dev/null
expect "before: R is listed but rejected" "$(cm $R)" f
sed -n '/^--   begin;/,/^--   commit;/p' sql/2026-10_professional_verification_PROPOSED.sql | sed 's/^--   //' > "${TMPDIR:-/tmp}/verification_rollback.sql"
q -f "${TMPDIR:-/tmp}/verification_rollback.sql" >/dev/null
expect "review columns removed" "$(q -c "select count(*) from information_schema.columns where table_name = 'profiles' and column_name like 'registry_%'")" 0
expect "new statuses mapped back" "$(q -c "select professional_status from profiles where id = '$B'")" not_applicable
expect "a rejected account was removed from the list, so it does not regain access" "$(q -c "select count(*) from professional_transition_accounts where user_id = '$R'"; cm $R)" "$(printf '0\nf')"
expect "listed accounts that were not rejected keep their entry" "$(cm $L)" t
expect "patient-management rules still in place after the verification rollback" "$(as authenticated $U "insert into patients (id, user_id, name) values (gen_random_uuid(), '$U', 'n')")" denied
expect "live constraint restored" "$(as service_role $B "update profiles set professional_status = 'needs_info' where id = '$B'")" denied
expect "profile editing works after rollback" "$(as authenticated $B "update profiles set display_name = 'B4', registration_number = 'R-9' where id = '$B'")" ok
expect "self-verification still refused after rollback" "$(as authenticated $B "update profiles set professional_status = 'verified' where id = '$B'")" denied
q -f sql/2026-10_professional_verification_PROPOSED.sql >/dev/null
expect "verification migration re-applies after rollback" "$(as authenticated $B "update profiles set registration_number = 'R-10' where id = '$B'")" denied

echo "verification evidence (sql/2026-10_verification_evidence_PROPOSED.sql, applied twice)"
EV=sql/2026-10_verification_evidence_PROPOSED.sql
EA=sql/2026-10_verification_evidence_access_PROPOSED.sql
EB=sql/2026-10_verification_evidence_backfill_PROPOSED.sql
BEFORE_EVIDENCE="$(cm $V)$(cm $L)$(cm $U)$(cm $R)"
for i in 1 2; do q -f $EV >/dev/null; done
expect "the evidence file alone changes nobody's access (V, L, U, R)" "$(cm $V)$(cm $L)$(cm $U)$(cm $R)" "$BEFORE_EVIDENCE"
expect "the three tables have RLS on; only the deadline table has a policy" "$(q -c "select count(*) filter (where c.relrowsecurity) || '/' || (select count(*) from pg_policies where tablename in ('professional_verification_requests', 'professional_verification_reviews', 'professional_evidence_deadlines')) from pg_class c where c.relname in ('professional_verification_requests', 'professional_verification_reviews', 'professional_evidence_deadlines')")" "3/1"
# svc <sql>: runs as the service role (the server); prints the result, or the error code / reason
svc() { local out; if out=$(psql -q -At -v ON_ERROR_STOP=1 -d "$DB" -c "set role service_role; $1" 2>&1); then echo "$out"; else echo "$out" | grep -oE 'verification:[a-z_]+|permission denied|cannot be [a-z]+|removed only with|violates [a-z ]+constraint|simulated [a-z ]+failure' | head -1; fi; }
# submit <user> <request id> <first> <last> <order> <number>: the server's call after uploading the document
submit() { svc "select verification_submit('$1', '$2', '$3', '$4', 'IT', '$5', '$6', '$1/$2/doc.pdf', 'application/pdf', 1000, 'v1')->>'kept_verified'"; }
decide() { svc "select verification_decide('$1', '$2', $3, $4, 'internal note', 'admin@test.invalid')->>'action'"; }
check() { svc "select verification_record_check('$1', '$2', null, 'admin@test.invalid')"; }
status() { q -c "select professional_status from profiles where id = '$1'"; }
rstatus() { q -c "select status from professional_verification_requests where id = '$1'"; }
actions() { q -c "select string_agg(action, ',' order by created_at, action) from professional_verification_reviews where user_id = '$1'"; }
reviews() { q -c "select count(*) from professional_verification_reviews"; }
q -c "update profiles set professional_status = 'verified', registry_country = 'IT', registry_name = 'OFI Lombardia', registration_number = '1234' where id = '$V'" >/dev/null
RV1=61000000-0000-0000-0000-000000000001; RV2=61000000-0000-0000-0000-000000000002; RV3=61000000-0000-0000-0000-000000000003

echo "  already verified accounts"
expect "same name, number and Order (spaces and case aside): stays verified" "$(submit $V $RV1 Maria Rossi 'ofi  lombardia' 1234)/$(status $V)/$(cm $V)" "true/verified/t"
expect "its request is open and marked as sent while verified" "$(rstatus $RV1)/$(q -c "select submitted_while_verified from professional_verification_requests where id = '$RV1'")" "pending/t"
expect "confirmation without a recorded match is refused" "$(decide $V verified null null)" "verification:registry_not_matched"
expect "the refused confirmation changed nothing" "$(status $V)/$(rstatus $RV1)/$(reviews)" "verified/pending/0"
check $RV1 match >/dev/null
expect "after a match the administrator confirms validity" "$(decide $V verified null null)/$(status $V)/$(rstatus $RV1)" "confirmed/verified/verified"
expect "history: register check, then confirmation" "$(actions $V)" "registry_check,confirmed"
expect "a different legal name sends the account back to review" "$(submit $V $RV2 Marta Rossi 'OFI Lombardia' 1234)/$(status $V)/$(cm $V)" "false/pending/f"
expect "a newer request supersedes the open one and returns its file for deletion" "$(svc "select verification_submit('$V', '$RV3', 'Marta', 'Rossi', 'IT', 'OFI Lombardia', '1234', '$V/$RV3/doc.pdf', 'application/pdf', 1000, 'v1')->>'superseded_paths'")/$(rstatus $RV2)" "[\"$V/$RV2/doc.pdf\"]/superseded"
check $RV3 match >/dev/null
expect "the new details are approved after a match" "$(decide $V verified null null)/$(status $V)" "verified/verified"
q -c "update profiles set registration_number = '9999' where id = '$U'; update profiles set professional_status = 'verified', registry_country = 'IT', registry_name = 'OFI Lombardia', registration_number = '5555' where id = '$L'" >/dev/null
expect "needs_info on a verified account keeps it verified (no interruption)" "$(decide $V needs_info "'Please send a clearer copy.'" null)/$(status $V)/$(cm $V)" "needs_info/verified/t"
expect "a decided request is not rewritten by later decisions" "$(rstatus $RV3)" "verified"
RU=61000000-0000-0000-0000-000000000004
submit $U $RU Ugo Neri 'OFI Lazio' 9999 >/dev/null

echo "  decisions are complete or not applied at all"
q -c "create function phygo_test_fail() returns trigger language plpgsql as \$\$ begin raise exception 'simulated history failure'; end \$\$;
      create trigger phygo_test_fail before insert on professional_verification_reviews for each row execute function phygo_test_fail();" >/dev/null
BEFORE="$(status $V)/$(rstatus $RV3)/$(reviews)/$(q -c "select coalesce(verification_message, '-') from profiles where id = '$V'")"
expect "a failed history write aborts the revocation" "$(decide $V rejected "'Revoked.'" "'other'")" "simulated history failure"
expect "profile, request and history unchanged after the failure" "$(status $V)/$(rstatus $RV3)/$(reviews)/$(q -c "select coalesce(verification_message, '-') from profiles where id = '$V'")" "$BEFORE"
expect "a failed history write aborts the register check" "$(check $RU match)/$(q -c "select registry_check from professional_verification_requests where id = '$RU'")" "simulated history failure/not_checked"
RF=61000000-0000-0000-0000-0000000000f1
q -c "drop trigger phygo_test_fail on professional_verification_reviews;
      create trigger phygo_test_fail before update on profiles for each row execute function phygo_test_fail();" >/dev/null
expect "a failed profile write aborts the submission" "$(submit $U $RF Ugo Neri 'OFI Lazio' 9999)/$(q -c "select count(*) from professional_verification_requests where id = '$RF'")" "simulated history failure/0"
q -c "drop trigger phygo_test_fail on profiles; drop function phygo_test_fail();" >/dev/null
expect "a message is required to ask for information or reject" "$(decide $V rejected null "'other'")" "verification:message_required"
expect "a rejection needs a category" "$(decide $V rejected "'No.'" null)" "verification:category_required"
expect "unknown decisions are refused" "$(decide $V approved null null)" "verification:invalid_decision"
check $RU match >/dev/null
q -c "update professional_verification_requests set document_path = null where id = '$RU'" >/dev/null
expect "approval without the document is refused" "$(decide $U verified null null)" "verification:no_document"
q -c "update professional_verification_requests set document_path = '$U/$RU/doc.pdf' where id = '$RU'; update profiles set registration_number = '0000' where id = '$U'" >/dev/null
expect "approval is refused when the profile no longer matches the request" "$(decide $U verified null null)" "verification:details_changed"
q -c "update profiles set registration_number = '9999' where id = '$U'" >/dev/null
expect "the revocation of a verified account is recorded" "$(decide $V rejected "'Verification revoked.'" "'other'")/$(status $V)/$(cm $V)" "revoked/rejected/f"
expect "the revocation points at the latest request, which keeps its approval" "$(q -c "select request_id from professional_verification_reviews where user_id = '$V' and action = 'revoked'")/$(rstatus $RV3)" "$RV3/verified"
expect "an account verified before documents can be revoked, with history" "$(decide $L rejected "'Not in the register.'" "'not_in_register'")/$(q -c "select coalesce(request_id::text, 'none') || '/' || rejection_category from professional_verification_reviews where user_id = '$L'")" "revoked/none/not_in_register"
q -c "update profiles set professional_status = 'not_applicable' where id = '$L'" >/dev/null

echo "  the history is protected"
HV=$(q -c "select id from professional_verification_reviews where user_id = '$V' and action = 'confirmed'")
expect "the server cannot change a history entry" "$(svc "update professional_verification_reviews set action = 'verified' where id = '$HV'")" "cannot be changed"
expect "the server cannot rewrite an internal note" "$(svc "update professional_verification_reviews set internal_note = 'edited' where id = '$HV'")" "cannot be changed"
expect "the server cannot delete history entries" "$(svc "delete from professional_verification_reviews where id = '$HV'")" "permission denied"
expect "even the owner cannot delete an entry directly" "$(runs <(echo "delete from professional_verification_reviews where id = '$HV';"))" refused
expect "even the owner cannot truncate the history" "$(runs <(echo "truncate professional_verification_reviews;"))" refused
expect "the note can be removed once at the end of its retention" "$(svc "update professional_verification_reviews set internal_note = null, note_redacted_at = now() where id = '$HV' returning action")" "confirmed"
expect "a removed note cannot be redacted again or changed" "$(svc "update professional_verification_reviews set note_redacted_at = now() where id = '$HV'")" "cannot be changed"
expect "an entry cannot point at another account's request" "$(svc "insert into professional_verification_reviews (user_id, request_id, action, reviewer) values ('$U', '$RV3', 'verified', 'x')")" "violates foreign key constraint"
for who in V U; do
  id=${!who}
  expect "$who cannot read verification requests, even their own" "$(as authenticated $id "select count(*) from professional_verification_requests")" denied
  expect "$who cannot read the review history" "$(as authenticated $id "select count(*) from professional_verification_reviews")" denied
  expect "$who cannot insert a request directly" "$(as authenticated $id "insert into professional_verification_requests (user_id, legal_first_name, legal_last_name, registry_country, registry_name, registration_number, declaration_version, declaration_accepted_at) values ('$id', 'A', 'B', 'IT', 'OFI', '1', 'v1', now())")" denied
  expect "$who cannot change a status or a register check" "$(as authenticated $id "update professional_verification_requests set status = 'verified', registry_check = 'match' where user_id = '$id'")" denied
  expect "$who cannot point a request at another document" "$(as authenticated $id "update professional_verification_requests set document_path = '$U/x/y.pdf'")" denied
  expect "$who cannot call the submission function" "$(as authenticated $id "select verification_submit('$id', gen_random_uuid(), 'A', 'B', 'IT', 'OFI', '1', null, null, null, 'v1')")" denied
  expect "$who cannot record a register check" "$(as authenticated $id "select verification_record_check('$RU', 'match', null, 'me')")" denied
  expect "$who cannot decide, not even on themselves" "$(as authenticated $id "select verification_decide('$id', 'verified', null, null, null, 'me')")" denied
  expect "$who cannot create or extend an evidence deadline" "$(as authenticated $id "insert into professional_evidence_deadlines (user_id, due_at, added_by) values ('$id', now() + interval '10 days', 'me')")" denied
done
expect "anon cannot read requests or call the functions" "$(as anon $V "select count(*) from professional_verification_requests")/$(as anon $V "select verification_decide('$V', 'verified', null, null, null, 'x')")" "denied/denied"
expect "even the server cannot store a document path outside the owner's folder" "$(svc "insert into professional_verification_requests (user_id, legal_first_name, legal_last_name, registry_country, registry_name, registration_number, document_path, declaration_version, declaration_accepted_at) values ('$V', 'A', 'B', 'IT', 'OFI', '1', '$U/x/y.pdf', 'v1', now())")" "violates check constraint"
expect "unknown check results are refused" "$(svc "update professional_verification_requests set registry_check = 'probably' where id = '$RV3'")" "violates check constraint"
expect "documents of another type are refused" "$(svc "update professional_verification_requests set document_mime = 'text/html' where id = '$RV3'")" "violates check constraint"
expect "bucket is private, 4 MB, PDF/JPEG/PNG only" "$(q -c "select public || '/' || file_size_limit || '/' || array_to_string(allowed_mime_types, ',') from storage.buckets where id = 'verification-documents'")" "false/4194304/application/pdf,image/jpeg,image/png"
expect "no storage policy mentions the verification bucket" "$(q -c "select count(*) from pg_policies where schemaname = 'storage' and (coalesce(qual, '') || coalesce(with_check, '')) like '%verification-documents%'")" 0
q -c "insert into storage.objects (bucket_id, name) values ('verification-documents', '$V/$RV3/doc.pdf')" >/dev/null
expect "V cannot list or read verification documents, even their own" "$(psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$V'; select count(*) from storage.objects where bucket_id = 'verification-documents'")" 0
expect "U cannot read another user's verification document" "$(psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$U'; select count(*) from storage.objects where bucket_id = 'verification-documents'")" 0
expect "a user cannot upload into the verification bucket directly" "$(as authenticated $V "insert into storage.objects (bucket_id, name) values ('verification-documents', '$V/x/new.pdf')")" denied
expect "a user cannot delete a verification document" "$(as authenticated $V "delete from storage.objects where bucket_id = 'verification-documents'"; q -c "select count(*) from storage.objects where bucket_id = 'verification-documents'")" "$(printf 'ok\n1')"
expect "the workspace bucket keeps working for its owner" "$(as authenticated $V "insert into storage.objects (bucket_id, name) values ('workspace-files', '$V/notes.pdf')")" ok
expect "retention of an old request removes it with its history (documented path)" "$(svc "delete from professional_verification_requests where id = '$RV2' returning status"; q -c "select count(*) from professional_verification_reviews where request_id = '$RV2'")" "$(printf 'superseded\n0')"

echo "  60-day evidence deadline (access file, then backfill)"
G1=70000000-0000-0000-0000-000000000001; G2=70000000-0000-0000-0000-000000000002; G3=70000000-0000-0000-0000-000000000003; G4=70000000-0000-0000-0000-000000000004
PG2=70000000-0000-0000-0000-0000000000b2
q -c "insert into auth.users (id) values ('$G1'), ('$G2'), ('$G3'), ('$G4');
      update profiles set professional_status = 'verified', registry_country = 'IT', registry_name = 'OFI Toscana', registration_number = 'G' || right(id::text, 1) where id in ('$G1', '$G2', '$G3', '$G4');
      insert into patients (id, user_id, name) values ('$PG2', '$G2', 'Synthetic G2');
      insert into notes (patient_id, user_id, assessment) values ('$PG2', '$G2', 'kept');
      insert into professional_evidence_deadlines (user_id, due_at, added_by) values ('$G1', now() + interval '60 days', 'owner');
      insert into professional_evidence_deadlines (user_id, due_at, added_at, added_by) values
        ('$G2', now() - interval '1 day', now() - interval '61 days', 'owner'),
        ('$G4', now() - interval '1 day', now() - interval '61 days', 'owner');
      insert into professional_evidence_deadlines (user_id, due_at, added_at, added_by, satisfied_at) values ('$G3', now() - interval '1 day', now() - interval '61 days', 'owner', now() - interval '5 days');
      insert into professional_transition_accounts (user_id, until, added_by) values ('$G4', now() + interval '30 days', 'owner');" >/dev/null
expect "deadlines longer than 90 days are refused" "$(svc "update professional_evidence_deadlines set due_at = added_at + interval '91 days' where user_id = '$G1'")" "violates check constraint"
expect "users see only their own deadline" "$(psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$G2'; select count(*) from professional_evidence_deadlines")" 1
expect "users cannot clear their own deadline" "$(as authenticated $G2 "update professional_evidence_deadlines set satisfied_at = now() where user_id = '$G2'")" denied
expect "before the access file the database does not apply deadlines" "$(cm $G2)" t
expect "the backfill refuses before the access file" "$(runs $EB)" refused
for i in 1 2; do q -f $EA >/dev/null; done
expect "deadline in the future: unchanged" "$(cm $G1)" t
expect "deadline passed without a confirmed document: no patient management" "$(cm $G2)" f
expect "deadline passed but document confirmed: unchanged" "$(cm $G3)" t
expect "a transition-list entry cannot bypass a passed deadline" "$(cm $G4)" f
expect "the transition list still works for unverified accounts" "$(q -c "update profiles set professional_status = 'not_applicable' where id = '$L'" >/dev/null; cm $L)" t
expect "a rejection still wins over the list" "$(cm $R)" f
expect "past the deadline the account still reads its patients and notes" "$(psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$G2'; select (select count(*) from patients) || '/' || (select count(*) from notes)")" "1/1"
expect "past the deadline it cannot create or change patients or notes" "$(as authenticated $G2 "insert into patients (id, user_id, name) values (gen_random_uuid(), '$G2', 'n')")/$(as authenticated $G2 "insert into notes (patient_id, user_id) values ('$PG2', '$G2')")/$(as authenticated $G2 "delete from patients where id = '$PG2'"; q -c "select count(*) from patients where id = '$PG2'")" "denied/denied/ok
1"
expect "nothing was deleted and the account stays verified" "$(q -c "select (select count(*) from notes where patient_id = '$PG2') || '/' || professional_status from profiles where id = '$G2'")" "1/verified"
RG2=61000000-0000-0000-0000-0000000000a2
expect "sending the same document details keeps the account verified but still restricted" "$(submit $G2 $RG2 Gina Verdi 'OFI Toscana' G2)/$(status $G2)/$(cm $G2)" "true/verified/f"
check $RG2 match >/dev/null
expect "once the administrator confirms, access returns and the deadline is satisfied" "$(decide $G2 verified null null)/$(cm $G2)/$(q -c "select satisfied_at is not null from professional_evidence_deadlines where user_id = '$G2'")" "confirmed/t/t"
expect "V cannot see another clinician's patient (no admin bypass)" "$(psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$V'; select count(*) from patients where id = '$PG2'")" 0
q -f sql/2026-10_patient_management_R_freeze_PROPOSED.sql >/dev/null
expect "freeze still stops everyone" "$(cm $G1)" f
q -f sql/2026-10_patient_management_A_transition_list_PROPOSED.sql >/dev/null
expect "undo with Part A alone would ignore the deadline (documented: re-run the access file too)" "$(cm $G4)" t
q -f $EA >/dev/null
expect "after re-running the access file the deadline applies again" "$(cm $G4)/$(cm $G1)" "f/t"

q -c "insert into auth.users (id) values ('70000000-0000-0000-0000-000000000005'); update profiles set professional_status = 'verified' where id = '70000000-0000-0000-0000-000000000005'" >/dev/null
expect "backfill: preview lists only verified accounts without an approved document" "$(q -c "select count(*) from profiles p where p.professional_status = 'verified' and not exists (select 1 from professional_verification_requests r where r.user_id = p.id and r.status = 'verified') and not exists (select 1 from professional_evidence_deadlines d where d.user_id = p.id)")" 1
q -f $EB >/dev/null
expect "backfill adds a 60-day deadline to the new legacy account" "$(q -c "select round(extract(epoch from due_at - now()) / 86400) from professional_evidence_deadlines where user_id = '70000000-0000-0000-0000-000000000005'")" 60
expect "backfill leaves existing deadlines as they were" "$(q -c "select count(*) from professional_evidence_deadlines where due_at < now()")" 3
expect "backfill skips accounts with an approved document" "$(q -c "select count(*) from professional_evidence_deadlines d join professional_verification_requests r on r.user_id = d.user_id and r.status = 'verified' where d.added_at > now() - interval '1 minute'")" 0
expect "re-running the backfill adds nobody twice" "$(q -f $EB >/dev/null; q -c "select count(*) from professional_evidence_deadlines")" 5
expect "the new account keeps access until its deadline" "$(cm 70000000-0000-0000-0000-000000000005)" t

echo "  rollbacks"
expect "the evidence rollback refuses while requests exist" "$(runs "$(block $EV)")" refused
expect "after the refused rollback requests, history and deadlines are intact" "$(q -c "select (select count(*) > 0 from professional_verification_requests) and (select count(*) > 0 from professional_verification_reviews) and (select count(*) = 5 from professional_evidence_deadlines)")" t
expect "deleting an account removes its requests, history and deadline (cascade)" "$(q -c "delete from auth.users where id = '$G2'" >/dev/null; q -c "select (select count(*) from professional_verification_requests where user_id = '$G2') + (select count(*) from professional_verification_reviews where user_id = '$G2') + (select count(*) from professional_evidence_deadlines where user_id = '$G2')")" 0
q -f sql/2026-10_patient_management_A_transition_list_PROPOSED.sql >/dev/null
expect "access rollback (re-run Part A) restores the earlier rule" "$(cm $G4)" t
q -f $EA >/dev/null

psql -q -d postgres -c "drop database $DB" >/dev/null
[ $fail = 0 ] && echo "ALL SQL CHECKS PASSED" || { echo "SOME SQL CHECKS FAILED"; exit 1; }
