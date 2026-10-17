#!/usr/bin/env bash
# Tests sql/2026-10-17_patient_profile_PROPOSED.sql on a throwaway LOCAL
# PostgreSQL with the policies live in Production: the 12 Oct snapshot plus the
# applied PR #5 hardening and Part A/B (tests/sql/replica.sql,
# docs/security/live-clinical-rls-2026-10-12.sql, sql/2026-10_*). Synthetic
# rows only. Never point this at Supabase.
#   PGHOST=/var/run/postgresql PGUSER=postgres bash tests/sql/patient_profile.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${TEST_DB:-phygo_patient_profile_test}
FILE=sql/2026-10-17_patient_profile_PROPOSED.sql
export PGOPTIONS="-c client_min_messages=warning"
case "${PGHOST:-}" in *supabase*) echo "Refusing to run against Supabase" >&2; exit 1;; esac
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
q() { psql -q -At -v ON_ERROR_STOP=1 -d "$DB" "$@"; }
fail=0
expect() { if [ "$2" = "$3" ]; then echo "  ok   $1"; else echo "  FAIL $1: expected $3, got $2"; fail=1; fi; }
# try <role> <user> <sql>: one action as that user, rolled back; ok or refused
try() { if psql -q -At -v ON_ERROR_STOP=1 -d "$DB" -c "begin; set local role $1; set local request.jwt.claim.sub = '$2'; $3; rollback;" >/dev/null 2>&1; then echo ok; else echo refused; fi; }
# rows <role> <user> <sql>: the number of rows the statement affects or returns, rolled back
rows() { psql -q -At -d "$DB" -c "begin; set local role $1; set local request.jwt.claim.sub = '$2'; with r as ($3) select count(*) from r; rollback;" 2>/dev/null | grep -E '^[0-9]+$' | head -1 || echo refused; }
# val <role> <user> <sql>: one value seen by that user
val() { psql -q -At -d "$DB" -c "set role $1; set request.jwt.claim.sub = '$2'; $3" 2>/dev/null | tail -1; }

CLIN=00000000-0000-0000-0000-0000000000c1   # verified physiotherapist, owner of PA
OTHER=00000000-0000-0000-0000-0000000000c2  # another verified physiotherapist, owner of PB
UNVER=00000000-0000-0000-0000-0000000000c3  # unverified, not listed, owner of PU
PAT=00000000-0000-0000-0000-0000000000a1    # My Phygo account linked to PA
PAT2=00000000-0000-0000-0000-0000000000a2   # My Phygo account linked to PB
PA=50000000-0000-0000-0000-00000000000a; PB=50000000-0000-0000-0000-00000000000b; PU=50000000-0000-0000-0000-00000000000c

q -f tests/sql/replica.sql >/dev/null
q -f docs/security/live-clinical-rls-2026-10-12.sql >/dev/null
q -f sql/2026-10_security_clinical_rls_hardening_PROPOSED.sql >/dev/null
q -f sql/2026-10_patient_management_A_transition_list_PROPOSED.sql >/dev/null
q -f sql/2026-10_patient_management_B_policies_PROPOSED.sql >/dev/null
# The replica keeps only the columns the policies use; add the ones the app has today.
q -c "alter table patients add column if not exists age int, add column if not exists gender text,
        add column if not exists main_condition text, add column if not exists created_at timestamptz not null default now();" >/dev/null
q -c "insert into auth.users (id) values ('$CLIN'), ('$OTHER'), ('$UNVER'), ('$PAT'), ('$PAT2');
      update profiles set professional_status = 'verified' where id in ('$CLIN', '$OTHER');
      update profiles set practice_stage = 'student' where id in ('$PAT', '$PAT2');
      insert into patients (id, user_id, name, age, gender, main_condition, patient_user_id) values
        ('$PA', '$CLIN', 'Synthetic Rossi', 47, 'female', 'Synthetic low back pain', '$PAT'),
        ('$PB', '$OTHER', 'Synthetic Bianchi', 30, null, null, '$PAT2'),
        ('$PU', '$UNVER', 'Synthetic Verdi', null, null, null, null);" >/dev/null
before=$(q -c "select md5(string_agg(t::text, ',' order by id)) from (select id, user_id, name, age, gender, main_condition, patient_user_id, created_at from patients) t")

echo "apply"
q -f "$FILE" >/dev/null
expect "existing records are unchanged (name, age, gender, condition, links)" "$(q -c "select md5(string_agg(t::text, ',' order by id)) from (select id, user_id, name, age, gender, main_condition, patient_user_id, created_at from patients) t")" "$before"
expect "  ...and the new fields start empty" "$(q -c "select count(*) from patients where coalesce(first_name, last_name, birth_date::text, phone, contact_email, city) is not null")" 0
expect "applying it twice is harmless" "$(if q -f "$FILE" >/dev/null 2>&1; then echo ok; else echo refused; fi)" ok

echo "identity and contacts (patients)"
UPD="update patients set first_name = 'Anna', last_name = 'Rossi', name = 'Anna Rossi', birth_date = '1979-03-14', phone = '+39 333 123 4567', contact_email = 'anna@example.invalid', city = 'Pisa', province = 'PI', postal_code = '56100' where id = '$PA' returning 1"
expect "the verified owner saves them" "$(rows authenticated $CLIN "$UPD")" 1
expect "another clinician changes nothing" "$(rows authenticated $OTHER "$UPD")" 0
expect "the linked patient changes nothing" "$(rows authenticated $PAT "$UPD")" 0
expect "an unverified clinician cannot change their own record" "$(try authenticated $UNVER "update patients set phone = '+39 333 000 0000' where id = '$PU'")" refused
q -c "update patients set first_name = 'Anna', last_name = 'Rossi', name = 'Anna Rossi', birth_date = '1979-03-14', phone = '+39 333 123 4567', contact_email = 'anna@example.invalid' where id = '$PA'" >/dev/null
expect "the owner reads them" "$(val authenticated $CLIN "select contact_email from patients where id = '$PA'")" "anna@example.invalid"
expect "the linked patient reads their own row, as today" "$(val authenticated $PAT "select first_name || ' ' || last_name from patients where id = '$PA'")" "Anna Rossi"
expect "another patient reads nothing of it" "$(val authenticated $PAT2 "select count(*) from patients where id = '$PA'")" 0
expect "another clinician reads nothing of it" "$(val authenticated $OTHER "select count(*) from patients where id = '$PA'")" 0
expect "anonymous callers read nothing" "$(val anon '' "select count(*) from patients")" 0
expect "a date of birth in the future is refused" "$(try authenticated $CLIN "update patients set birth_date = current_date + 2 where id = '$PA'")" refused
expect "  ...with one day of tolerance for time zones (local today vs UTC)" "$(try authenticated $CLIN "update patients set birth_date = current_date + 1 where id = '$PA'")" ok
expect "a date of birth before 1900 is refused" "$(try authenticated $CLIN "update patients set birth_date = '1899-12-31' where id = '$PA'")" refused
expect "today is accepted" "$(try authenticated $CLIN "update patients set birth_date = current_date where id = '$PA'")" ok
expect "a malformed e-mail is refused" "$(try authenticated $CLIN "update patients set contact_email = 'not-an-email' where id = '$PA'")" refused
expect "a malformed phone number is refused" "$(try authenticated $CLIN "update patients set phone = 'call me' where id = '$PA'")" refused
expect "the old age stays for records without a date of birth" "$(q -c "select age from patients where id = '$PB'")" 30
expect "resetting portal access (an existing update) still works" "$(rows authenticated $CLIN "update patients set patient_user_id = patient_user_id where id = '$PA' returning 1")" 1

echo "clinical background and emergency contact (patient_details)"
INS="insert into patient_details (patient_id, user_id, allergies, medications, emergency_contact_name, emergency_contact_phone) values ('$PA', '$CLIN', 'Synthetic allergy', 'Synthetic drug', 'Synthetic contact', '+39 333 765 4321')"
expect "the verified owner creates them" "$(try authenticated $CLIN "$INS")" ok
q -c "$INS" >/dev/null
expect "the verified owner updates them" "$(rows authenticated $CLIN "update patient_details set rehab_precautions = 'Synthetic precaution' where patient_id = '$PA' returning 1")" 1
expect "the owner reads them" "$(val authenticated $CLIN "select allergies from patient_details where patient_id = '$PA'")" "Synthetic allergy"
expect "the linked patient reads nothing" "$(val authenticated $PAT "select count(*) from patient_details")" 0
expect "another patient reads nothing" "$(val authenticated $PAT2 "select count(*) from patient_details")" 0
expect "another clinician reads nothing" "$(val authenticated $OTHER "select count(*) from patient_details")" 0
expect "anonymous callers cannot read the table" "$(try anon '' "select * from patient_details")" refused
expect "another clinician cannot change them" "$(rows authenticated $OTHER "update patient_details set allergies = 'x' where patient_id = '$PA' returning 1")" 0
expect "another clinician cannot create them for this patient" "$(try authenticated $OTHER "insert into patient_details (patient_id, user_id) values ('$PA', '$OTHER')")" refused
expect "nobody can create them in someone else's name" "$(try authenticated $CLIN "insert into patient_details (patient_id, user_id) values ('$PB', '$CLIN')")" refused
expect "the linked patient cannot create or change them" "$(try authenticated $PAT "insert into patient_details (patient_id, user_id) values ('$PA', '$PAT')")" refused
expect "an unverified clinician cannot create them" "$(try authenticated $UNVER "insert into patient_details (patient_id, user_id) values ('$PU', '$UNVER')")" refused
expect "signed-in users have only select, insert and update on the table" "$(q -c "select string_agg(privilege_type, ',' order by privilege_type) from information_schema.role_table_grants where table_name = 'patient_details' and grantee = 'authenticated'")" "INSERT,SELECT,UPDATE"
expect "nobody deletes them from the browser" "$(rows authenticated $CLIN "delete from patient_details where patient_id = '$PA' returning 1")" refused
expect "a malformed emergency phone is refused" "$(try authenticated $CLIN "update patient_details set emergency_contact_phone = 'x' where patient_id = '$PA'")" refused
expect "they go with the patient (cascade)" "$(q -c "delete from patients where id = '$PA'; select count(*) from patient_details where patient_id = '$PA'")" 0

echo "rollback block"
sed -n '/^--   begin;/,/^--   commit;/p' "$FILE" | sed 's/^--   //' > "${TMPDIR:-/tmp}/phygo_profile_rollback.sql"
q -f "${TMPDIR:-/tmp}/phygo_profile_rollback.sql" >/dev/null
expect "removes the new columns" "$(q -c "select count(*) from information_schema.columns where table_name = 'patients' and column_name in ('first_name','birth_date','contact_email')")" 0
expect "removes the table" "$(q -c "select to_regclass('public.patient_details') is null")" t
expect "keeps the existing records" "$(q -c "select count(*) from patients")" 2
expect "the migration applies again" "$(if q -f "$FILE" >/dev/null 2>&1; then echo ok; else echo refused; fi)" ok

psql -q -d postgres -c "drop database $DB" >/dev/null
[ $fail = 0 ] && echo "all patient-profile checks passed" || { echo "SOME CHECKS FAILED"; exit 1; }
