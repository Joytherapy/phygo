#!/usr/bin/env bash
# Tests sql/2026-10-16_patient_notes_policy_PROPOSED.sql on a throwaway LOCAL
# PostgreSQL with the live policies (tests/sql/replica.sql and
# docs/security/live-clinical-rls-2026-10-12.sql). Synthetic rows only. Never
# point this at Supabase.
#   PGHOST=/var/run/postgresql PGUSER=postgres bash tests/sql/patient_notes.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${TEST_DB:-phygo_patient_notes_test}
FILE=sql/2026-10-16_patient_notes_policy_PROPOSED.sql
export PGOPTIONS="-c client_min_messages=warning"
case "${PGHOST:-}" in *supabase*) echo "Refusing to run against Supabase" >&2; exit 1;; esac
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
q() { psql -q -At -v ON_ERROR_STOP=1 -d "$DB" "$@"; }
fail=0
expect() { if [ "$2" = "$3" ]; then echo "  ok   $1"; else echo "  FAIL $1: expected $3, got $2"; fail=1; fi; }
# sees <role> <user id> <sql>: the query's single value, or "denied"
sees() { psql -q -At -d "$DB" -c "set role $1; set request.jwt.claim.sub = '$2'; $3" 2>/dev/null | tail -1 || echo denied; }

CLIN=00000000-0000-0000-0000-0000000000c1; OTHER=00000000-0000-0000-0000-0000000000c2; PAT=00000000-0000-0000-0000-0000000000a1
PA=30000000-0000-0000-0000-00000000000a; PB=30000000-0000-0000-0000-00000000000b

q -f tests/sql/replica.sql >/dev/null
q -f docs/security/live-clinical-rls-2026-10-12.sql >/dev/null
# The replica keeps only the columns the policies use; add the clinical ones the app writes.
q -c "alter table notes add column subjective text, add column clinical_reasoning jsonb, add column summary_for_patient text;
      insert into auth.users (id) values ('$CLIN'), ('$OTHER'), ('$PAT');
      insert into patients (id, user_id, name, patient_user_id) values ('$PA', '$CLIN', 'Synthetic A', '$PAT'), ('$PB', '$OTHER', 'Synthetic B', null);
      insert into notes (patient_id, user_id, assessment, subjective, clinical_reasoning, summary_for_patient) values
        ('$PA', '$CLIN', 'Synthetic assessment', 'Synthetic subjective', '{\"hypotheses\":[\"synthetic\"]}', 'Synthetic summary'),
        ('$PB', '$OTHER', 'Other assessment', 'Other subjective', null, 'Other summary');" >/dev/null

echo "live policies (before the change)"
expect "the patient reads the clinical reasoning of their notes (exposed)" "$(sees authenticated $PAT "select count(*) from notes where clinical_reasoning is not null")" 1
expect "  ...and the subjective findings (exposed)" "$(sees authenticated $PAT "select subjective from notes")" "Synthetic subjective"
expect "the patient does not read another record's notes" "$(sees authenticated $PAT "select count(*) from notes where patient_id = '$PB'")" 0

echo "with the proposed change"
q -f "$FILE" >/dev/null
expect "the patient reads no note row directly" "$(sees authenticated $PAT "select count(*) from notes")" 0
expect "the clinician still reads their own notes" "$(sees authenticated $CLIN "select count(*) from notes")" 1
expect "  ...with every column" "$(sees authenticated $CLIN "select subjective from notes")" "Synthetic subjective"
expect "another clinician still reads only their own" "$(sees authenticated $OTHER "select count(*) from notes")" 1
expect "anonymous callers read nothing" "$(sees anon '' "select count(*) from notes")" 0
expect "the server (service role) still reads the patient's notes" "$(sees service_role '' "select summary_for_patient from notes where patient_id = '$PA'")" "Synthetic summary"
expect "the clinician can still update their note" "$(sees authenticated $CLIN "with u as (update notes set summary_for_patient = 'Edited' where patient_id = '$PA' returning 1) select count(*) from u")" 1
expect "applying it twice is harmless" "$(if q -f "$FILE" >/dev/null 2>&1; then echo ok; else echo refused; fi)" ok

echo "rollback block restores the live policy"
sed -n '/^--   begin;/,/^--   commit;/p' "$FILE" | sed 's/^--   //' > "${TMPDIR:-/tmp}/phygo_notes_rollback.sql"
q -f "${TMPDIR:-/tmp}/phygo_notes_rollback.sql" >/dev/null
expect "after rollback the patient reads their notes again" "$(sees authenticated $PAT "select count(*) from notes")" 1

psql -q -d postgres -c "drop database $DB" >/dev/null
[ $fail = 0 ] && echo "all patient-notes checks passed" || { echo "SOME CHECKS FAILED"; exit 1; }
