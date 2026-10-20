#!/usr/bin/env bash
# Tests sql/2026-10-20_care_program_PROPOSED.sql on a throwaway LOCAL
# PostgreSQL with the policies live in Production (tests/sql/replica.sql, the
# 12 Oct snapshot and the applied 2026-10 files). Synthetic rows only. Never
# point this at Supabase.
#   PGHOST=/var/run/postgresql PGUSER=postgres bash tests/sql/care_program.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${TEST_DB:-phygo_care_program_test}
FILE=sql/2026-10-20_care_program_PROPOSED.sql
export PGOPTIONS="-c client_min_messages=warning"
case "${PGHOST:-}" in *supabase*) echo "Refusing to run against Supabase" >&2; exit 1;; esac
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
q() { psql -q -At -v ON_ERROR_STOP=1 -d "$DB" "$@"; }
fail=0
expect() { if [ "$2" = "$3" ]; then echo "  ok   $1"; else echo "  FAIL $1: expected $3, got $2"; fail=1; fi; }
# try <role> <user> <sql>: one action as that user, rolled back; ok or refused
try() { if psql -q -At -v ON_ERROR_STOP=1 -d "$DB" -c "begin; set local role $1; set local request.jwt.claim.sub = '$2'; $3; rollback;" >/dev/null 2>&1; then echo ok; else echo refused; fi; }
# keep <role> <user> <sql>: like try, but committed
keep() { if psql -q -At -v ON_ERROR_STOP=1 -d "$DB" -c "begin; set local role $1; set local request.jwt.claim.sub = '$2'; $3; commit;" >/dev/null 2>&1; then echo ok; else echo refused; fi; }
# val <role> <user> <sql>: one value seen by that user
val() { psql -q -At -d "$DB" -c "set role $1; set request.jwt.claim.sub = '$2'; $3" 2>/dev/null | tail -1; }

CLIN=00000000-0000-0000-0000-0000000000c1   # verified physiotherapist, owner of PA and PB
OTHER=00000000-0000-0000-0000-0000000000c2  # another verified physiotherapist, owner of PO
UNVER=00000000-0000-0000-0000-0000000000c3  # unverified, not listed, owner of PU
PAT=00000000-0000-0000-0000-0000000000a1    # My Phygo account of PA
PAT2=00000000-0000-0000-0000-0000000000a2   # My Phygo account of PB
PA=70000000-0000-0000-0000-00000000000a; PB=70000000-0000-0000-0000-00000000000b
PO=70000000-0000-0000-0000-00000000000c; PU=70000000-0000-0000-0000-00000000000d
PROG=71000000-0000-0000-0000-00000000000a; PROG2=71000000-0000-0000-0000-00000000000b
EX=72000000-0000-0000-0000-00000000000a; EX2=72000000-0000-0000-0000-00000000000b; EX3=72000000-0000-0000-0000-00000000000c

q -f tests/sql/replica.sql >/dev/null
q -f docs/security/live-clinical-rls-2026-10-12.sql >/dev/null
q -f sql/2026-10_security_clinical_rls_hardening_PROPOSED.sql >/dev/null
q -f sql/2026-10_patient_management_A_transition_list_PROPOSED.sql >/dev/null
q -f sql/2026-10_patient_management_B_policies_PROPOSED.sql >/dev/null
q -c "insert into auth.users (id) values ('$CLIN'), ('$OTHER'), ('$UNVER'), ('$PAT'), ('$PAT2');
      update profiles set professional_status = 'verified' where id in ('$CLIN', '$OTHER');
      insert into patients (id, user_id, name, patient_user_id) values
        ('$PA', '$CLIN', 'Synthetic A', '$PAT'), ('$PB', '$CLIN', 'Synthetic B', '$PAT2'),
        ('$PO', '$OTHER', 'Synthetic O', null), ('$PU', '$UNVER', 'Synthetic U', null);" >/dev/null
before=$(q -c "select md5(string_agg(t::text, ',' order by id)) from patients t")

echo "apply"
q -f "$FILE" >/dev/null
expect "existing records are unchanged" "$(q -c "select md5(string_agg(t::text, ',' order by id)) from patients t")" "$before"
expect "applying it twice is refused cleanly (tables exist), nothing half-applied" "$(if q -f "$FILE" >/dev/null 2>&1; then echo ok; else echo refused; fi)" refused
expect "  ...still exactly five tables" "$(q -c "select count(*) from pg_class where relname in ('care_programs','care_program_items','care_activity_logs','symptom_checkins','care_attention_rules') and relkind = 'r'")" 5

TODAY_DOW=$(q -c "select extract(isodow from current_date)::int")
TOMORROW_DOW=$(q -c "select extract(isodow from current_date + 1)::int")

echo "the programme: only the owning clinician writes it"
expect "the verified owner creates a programme" "$(keep authenticated $CLIN "insert into care_programs (id, patient_id, title, starts_on, rest_weekdays) values ('$PROG', '$PA', 'Synthetic programme', current_date - 7, '{$TOMORROW_DOW}')")" ok
expect "  ...and its exercises" "$(keep authenticated $CLIN "insert into care_program_items (id, program_id, kind, title, sets, reps, times_per_day, short_variant) values ('$EX', '$PROG', 'exercise', 'Synthetic bridge', 3, 10, 2, '{\"sets\": 1, \"reps\": 8}'), ('$EX2', '$PROG', 'exercise', 'Synthetic squat', 2, 8, 1, null), ('$EX3', '$PROG', 'exercise', 'Synthetic weekend walk', null, null, 1, null)")" ok
q -c "update care_program_items set weekdays = '{$TOMORROW_DOW}' where id = '$EX3'" >/dev/null
expect "a second current programme for the same patient is refused" "$(try authenticated $CLIN "insert into care_programs (patient_id, title) values ('$PA', 'Another')")" refused
expect "another clinician cannot create one for this patient" "$(try authenticated $OTHER "insert into care_programs (patient_id, title) values ('$PB', 'Not mine')")" refused
expect "an unverified clinician cannot create one, even for their own record" "$(try authenticated $UNVER "insert into care_programs (patient_id, title) values ('$PU', 'Unverified')")" refused
expect "the patient cannot create a programme" "$(try authenticated $PAT "insert into care_programs (patient_id, title, created_by) values ('$PA', 'Self-made', '$PAT')")" refused
expect "the patient cannot add an exercise" "$(try authenticated $PAT "insert into care_program_items (program_id, kind, title) values ('$PROG', 'exercise', 'Extra')")" refused
expect "the patient cannot change the dose" "$(val authenticated $PAT "with u as (update care_program_items set reps = 99 where id = '$EX' returning 1) select count(*) from u")" 0
expect "the patient cannot delete the programme" "$(val authenticated $PAT "with d as (delete from care_programs where id = '$PROG' returning 1) select count(*) from d")" 0
expect "a non-https education link is refused" "$(try authenticated $CLIN "insert into care_program_items (program_id, kind, title, education_url) values ('$PROG', 'education', 'Read', 'javascript:alert(1)')")" refused
expect "a dose above the limits is refused" "$(try authenticated $CLIN "insert into care_program_items (program_id, kind, title, reps) values ('$PROG', 'exercise', 'Too much', 500)")" refused

echo "who reads it"
expect "the patient reads their programme" "$(val authenticated $PAT "select count(*) from care_programs")" 1
expect "  ...and its exercises, with the short variant" "$(val authenticated $PAT "select count(*) from care_program_items where short_variant is not null")" 1
expect "another patient reads nothing of it" "$(val authenticated $PAT2 "select count(*) from care_program_items")" 0
expect "another clinician reads nothing of it" "$(val authenticated $OTHER "select count(*) from care_programs")" 0
expect "anonymous callers are refused" "$(try anon '' "select count(*) from care_programs")" refused

echo "recording what was done (patient)"
LOG="insert into care_activity_logs (patient_id, item_id, activity_date, slot, status"
expect "the patient records today's first session" "$(keep authenticated $PAT "$LOG) values ('$PA', '$EX', current_date, 1, 'done')")" ok
expect "the same session twice is refused (idempotent: one record)" "$(try authenticated $PAT "$LOG) values ('$PA', '$EX', current_date, 1, 'done')")" refused
expect "  ...an upsert on the same key is harmless" "$(try authenticated $PAT "$LOG) values ('$PA', '$EX', current_date, 1, 'done') on conflict on constraint care_logs_once do nothing")" ok
expect "the second prescribed session of the day" "$(try authenticated $PAT "$LOG) values ('$PA', '$EX', current_date, 2, 'partial')")" ok
expect "a third session (more than prescribed) is refused" "$(try authenticated $PAT "$LOG) values ('$PA', '$EX', current_date, 3, 'done')")" refused
expect "an activity not scheduled today is refused" "$(try authenticated $PAT "$LOG) values ('$PA', '$EX3', current_date, 1, 'done')")" refused
expect "nothing on a rest day" "$(try authenticated $PAT "$LOG) values ('$PA', '$EX2', current_date + 1, 1, 'done')")" refused
expect "yesterday can still be recorded" "$(try authenticated $PAT "$LOG) values ('$PA', '$EX2', current_date - 1, 1, 'done')")" $( [ "$(q -c "select extract(isodow from current_date - 1)::int")" = "$TOMORROW_DOW" ] && echo refused || echo ok )
expect "three days ago cannot" "$(try authenticated $PAT "$LOG) values ('$PA', '$EX2', current_date - 3, 1, 'done')")" refused
expect "the short variant, prescribed for this exercise" "$(try authenticated $PAT "$LOG, variant) values ('$PA', '$EX', current_date, 2, 'done', 'short')")" ok
expect "a short variant nobody prescribed is refused" "$(try authenticated $PAT "$LOG, variant) values ('$PA', '$EX2', current_date, 1, 'done', 'short')")" refused
expect "the patient cannot claim a device measurement" "$(try authenticated $PAT "$LOG, provenance) values ('$PA', '$EX2', current_date, 1, 'done', 'device_measured')")" refused
expect "  ...nor a clinician entry" "$(try authenticated $PAT "$LOG, provenance) values ('$PA', '$EX2', current_date, 1, 'done', 'clinician_entered')")" refused
expect "an on-device camera count is recorded as such" "$(try authenticated $PAT "$LOG, provenance, reported_reps, source_detail) values ('$PA', '$EX2', current_date, 1, 'done', 'camera_estimated', 8, '{\"model\": \"synthetic\", \"quality\": 0.9}')")" ok
expect "a patient cannot record on another patient's programme" "$(try authenticated $PAT2 "$LOG) values ('$PB', '$EX2', current_date, 1, 'done')")" refused
expect "  ...nor under another patient's record" "$(try authenticated $PAT2 "$LOG) values ('$PA', '$EX2', current_date, 1, 'done')")" refused
expect "the patient corrects today's status" "$(val authenticated $PAT "with u as (update care_activity_logs set status = 'partial', reported_reps = 7 where item_id = '$EX' and slot = 1 returning 1) select count(*) from u")" 1
expect "  ...but cannot move it to another day" "$(try authenticated $PAT "update care_activity_logs set activity_date = current_date - 1 where item_id = '$EX'")" refused
expect "records are never deleted from the browser" "$(try authenticated $PAT "delete from care_activity_logs")" refused

echo "recording (clinician)"
expect "the owner records a session in the clinic" "$(try authenticated $CLIN "$LOG, provenance) values ('$PA', '$EX2', current_date, 1, 'done', 'clinician_entered')")" ok
expect "  ...but not as the patient's own report" "$(try authenticated $CLIN "$LOG) values ('$PA', '$EX2', current_date, 1, 'done')")" refused
expect "the owner reads the patient's records" "$(val authenticated $CLIN "select count(*) from care_activity_logs")" 1
expect "another clinician reads none" "$(val authenticated $OTHER "select count(*) from care_activity_logs")" 0
expect "the server records a device measurement" "$(try service_role '' "$LOG, provenance, reported_reps, created_by) values ('$PA', '$EX2', current_date, 1, 'done', 'device_measured', 8, '$PAT')")" ok

echo "paused programme"
q -c "update care_programs set status = 'paused' where id = '$PROG'" >/dev/null
expect "nothing is recorded while the programme is paused" "$(try authenticated $PAT "$LOG) values ('$PA', '$EX2', current_date, 1, 'done')")" refused
q -c "update care_programs set status = 'active' where id = '$PROG'" >/dev/null

echo "pain and fatigue check-ins"
CK="insert into symptom_checkins (patient_id, checkin_date, pain_nrs, fatigue_nrs, note)"
expect "the patient checks in today" "$(keep authenticated $PAT "$CK values ('$PA', current_date, 4, 3, 'Synthetic note')")" ok
expect "one check-in per day (second is refused)" "$(try authenticated $PAT "$CK values ('$PA', current_date, 2, 2, null)")" refused
expect "  ...updating it is allowed" "$(val authenticated $PAT "with u as (update symptom_checkins set pain_nrs = 5 where patient_id = '$PA' returning 1) select count(*) from u")" 1
expect "a score above 10 is refused" "$(try authenticated $PAT "$CK values ('$PA', current_date - 1, 11, null, null)")" refused
expect "an empty check-in is refused" "$(try authenticated $PAT "$CK values ('$PA', current_date - 1, null, null, null)")" refused
expect "a note longer than 280 characters is refused" "$(try authenticated $PAT "$CK values ('$PA', current_date - 1, 3, null, repeat('x', 281))")" refused
expect "a check-in a week ago is refused" "$(try authenticated $PAT "$CK values ('$PA', current_date - 7, 3, null, null)")" refused
expect "a patient cannot check in for another" "$(try authenticated $PAT2 "$CK values ('$PA', current_date - 1, 3, null, null)")" refused
expect "the owner reads it" "$(val authenticated $CLIN "select pain_nrs from symptom_checkins where patient_id = '$PA'")" 5
expect "another clinician and another patient read nothing" "$(val authenticated $OTHER "select count(*) from symptom_checkins")$(val authenticated $PAT2 "select count(*) from symptom_checkins")" 00
expect "check-ins are never deleted from the browser" "$(try authenticated $PAT "delete from symptom_checkins")" refused

echo "attention rules (clinician only)"
expect "the owner sets thresholds" "$(keep authenticated $CLIN "insert into care_attention_rules (patient_id, pain_at_or_above, pain_rise_points, no_update_days) values ('$PA', 7, 2, 3)")" ok
expect "the patient does not see them" "$(val authenticated $PAT "select count(*) from care_attention_rules")" 0
expect "the patient cannot set them" "$(try authenticated $PAT "insert into care_attention_rules (patient_id, pain_at_or_above, user_id) values ('$PB', 10, '$PAT')")" refused
expect "another clinician cannot read them" "$(val authenticated $OTHER "select count(*) from care_attention_rules")" 0

echo "grants and cascade"
expect "signed-in users cannot delete activity rows (no grant)" "$(q -c "select count(*) from information_schema.role_table_grants where table_name in ('care_activity_logs','symptom_checkins') and grantee = 'authenticated' and privilege_type = 'DELETE'")" 0
expect "anonymous callers have no grant on any of them" "$(q -c "select count(*) from information_schema.role_table_grants where (table_name like 'care_%' or table_name = 'symptom_checkins') and grantee = 'anon'")" 0
expect "deleting the patient removes programme, records and check-ins" "$(q -c "delete from patients where id = '$PA'; select (select count(*) from care_programs) + (select count(*) from care_activity_logs) + (select count(*) from symptom_checkins) + (select count(*) from care_attention_rules)")" 0

echo "rollback block"
sed -n '/^--   begin;/,/^--   commit;/p' "$FILE" | sed 's/^--   //' > "${TMPDIR:-/tmp}/phygo_care_rollback.sql"
q -f "${TMPDIR:-/tmp}/phygo_care_rollback.sql" >/dev/null
expect "removes the five tables" "$(q -c "select count(*) from pg_class where relname in ('care_programs','care_program_items','care_activity_logs','symptom_checkins','care_attention_rules')")" 0
expect "keeps the patient records" "$(q -c "select count(*) from patients")" 3
expect "the migration applies again" "$(if q -f "$FILE" >/dev/null 2>&1; then echo ok; else echo refused; fi)" ok

psql -q -d postgres -c "drop database $DB" >/dev/null
[ $fail = 0 ] && echo "all care-programme checks passed" || { echo "SOME CHECKS FAILED"; exit 1; }
