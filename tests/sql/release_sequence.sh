#!/usr/bin/env bash
# Walks the release sequence of docs/security/professional-verification-rollout.md
# on a throwaway LOCAL PostgreSQL that mirrors the live roles and RLS, and
# checks, in each state, what an unverified and unlisted account can do from
# the browser (RLS). The check queries are taken from the guide itself
# (<!-- check after=N --> blocks): each must return false before its step and
# true after it. Never point this at Supabase.
#   PGHOST=/var/run/postgresql PGUSER=postgres bash tests/sql/release_sequence.sh
# The database half of each release state is checked here. The API half
# depends only on the code version: tests/release_states.test.mjs (new code,
# states S3/S4) and tests/release_states_old.sh (current code, S1/S2/S2+B).
# Scenarios: deploy succeeded, deploy failed or pending, Part B failed.
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${TEST_DB:-phygo_release_sequence}
GUIDE=docs/security/professional-verification-rollout.md
export PGOPTIONS="-c client_min_messages=warning"
case "${PGHOST:-}" in *supabase*) echo "Refusing to run against Supabase" >&2; exit 1;; esac
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
q() { psql -q -At -v ON_ERROR_STOP=1 -d "$DB" "$@"; }
fail=0
expect() { if [ "$2" = "$3" ]; then echo "  ok   $1"; else echo "  FAIL $1: expected $3, got $2"; fail=1; fi; }
# try <user> <sql>: runs one browser action as that signed-in user, rolled back; prints ok or denied
try() { if psql -q -At -v ON_ERROR_STOP=1 -d "$DB" -c "begin; set local role authenticated; set local request.jwt.claim.sub = '$1'; $2; rollback;" >/dev/null 2>&1; then echo ok; else echo denied; fi; }
# val <user> <sql>: a value seen by that user, rolled back
val() { psql -q -At -d "$DB" -c "begin; set local role authenticated; set local request.jwt.claim.sub = '$1'; $2; rollback;" | tail -1; }

# Check queries from the guide, one file per step.
CHECKS=$(mktemp -d)
python3 - "$GUIDE" "$CHECKS" <<'PY'
import re, sys
guide, out = sys.argv[1], sys.argv[2]
text = open(guide).read()
for m in re.finditer(r'<!-- check after=(\d+) -->\s*```sql\n(.*?)```', text, re.S):
    open(f"{out}/{m.group(1)}.sql", "w").write(m.group(2))
PY
check() { q -f "$CHECKS/$1.sql"; }

q -f tests/sql/replica.sql >/dev/null
q -f docs/security/live-clinical-rls-2026-10-12.sql >/dev/null
U=50000000-0000-0000-0000-000000000001   # declared professional, unverified, not listed
O=50000000-0000-0000-0000-000000000002   # another clinician (will be listed)
X=50000000-0000-0000-0000-000000000003   # any other account
PU=60000000-0000-0000-0000-000000000001; PO=60000000-0000-0000-0000-000000000002
q -c "insert into auth.users (id) values ('$U'), ('$O'), ('$X');
      insert into patients (id, user_id, name) values ('$PU', '$U', 'own'), ('$PO', '$O', 'other');
      insert into notes (patient_id, user_id, assessment) values ('$PU', '$U', 'existing'), ('$PO', '$O', 'existing');
      insert into demo_usage values ('203.0.113.7', 1);" >/dev/null

# capabilities <state> <expected: 11 values>
capabilities() {
  local st=$1; shift
  local got=(
    "$(try $U "insert into notes (patient_id, user_id) values ('$PO', '$U')")"
    "$(try $U "update patients set patient_user_id = '$X' where id = '$PU'")"
    "$(val $U "select count(*) from patients where id = '$PO'")"
    "$(try $U "update profiles set professional_status = 'verified' where id = '$U'")"
    "$(try $U "insert into patients (id, user_id, name) values (gen_random_uuid(), '$U', 'new')")"
    "$(try $U "insert into notes (patient_id, user_id) values ('$PU', '$U')")"
    "$(try $U "insert into patient_invites (patient_id, code, created_by, expires_at) values ('$PU', 'Z', '$U', now() + interval '1 day')")"
    "$(try $U "insert into video_calls (patient_id, room_url, created_by) values ('$PU', 'https://evil.example/x', '$U')")"
    "$(val $U "with d as (delete from notes where patient_id = '$PU' returning 1) select count(*) from d")"
    "$(val $U "select count(*) from notes where patient_id = '$PU'")"
    "$(try $O "insert into notes (patient_id, user_id) values ('$PO', '$O')")"
  )
  local names=(
    "U writes a note on another clinician's patient"
    "U links an arbitrary account as their patient"
    "U sees another clinician's patient (rows)"
    "U marks themselves verified"
    "U creates a patient"
    "U writes a note on their own patient"
    "U invites a person to My Phygo"
    "U adds a video-call row pointing anywhere"
    "U deletes their own note (rows deleted)"
    "U reads their own existing notes (rows)"
    "O (listed from step 5) writes a note on their own patient"
  )
  echo "state $st"
  for i in "${!names[@]}"; do expect "${names[$i]} -> $1" "${got[$i]}" "$1"; shift; done
}

# direct_writes <state> <expected x6>: more browser writes straight to Supabase on U's OWN patient
direct_writes() {
  local st=$1; shift
  local got=(
    "$(try $U "update patients set name = 'renamed' where id = '$PU'")"
    "$(try $U "update notes set assessment = 'edited' where patient_id = '$PU'")"
    "$(try $U "insert into appointments (patient_id, physio_id, requested_by, status) values ('$PU', '$U', 'physio', 'confirmed')")"
    "$(try $U "insert into patient_clinical_references (patient_id, content_type, content_id) values ('$PU', 'exercise', 'e')")"
    "$(try $U "insert into video_calls (patient_id, room_url, created_by) values ('$PU', 'https://team.daily.co/r', '$U')")"
    "$(val $U "with d as (delete from patients where id = '$PU' returning 1) select count(*) from d")"
  )
  local names=("U edits their patient" "U edits an existing note" "U schedules an appointment" "U links library content" "U adds a Daily video-call row" "U deletes their patient, cascading to notes (rows deleted)")
  echo "direct Supabase writes on own patient, $st"
  for i in "${!names[@]}"; do expect "${names[$i]} -> $1" "${got[$i]}" "$1"; shift; done
}

#                         note-other link  see-other self-verify create note-own invite video delete read  listed
capabilities S1           ok         ok    0         ok          ok     ok       ok     ok    1      1     ok

echo "steps 1-4 (each check query: false before, true after)"
files=(x sql/2026-10_security_profile_privileged_columns_PROPOSED.sql sql/2026-10_security_clinical_rls_hardening_PROPOSED.sql
       sql/2026-10_professional_verification_PROPOSED.sql sql/2026-10_patient_management_A_transition_list_PROPOSED.sql)
for n in 1 2 3 4; do
  expect "check $n is false before step $n" "$(check $n)" f
  q -f "${files[$n]}" >/dev/null
  expect "check $n is true after step $n" "$(check $n)" t
done
capabilities "S2 and S3 (same database; S3 = corrected code without Part B)" denied denied 0 denied ok ok ok ok 1 1 ok
direct_writes "S2 and S3" ok ok ok ok ok 1

echo "step 5: merge and deploy start (no database change; the current code stays live until the build is Ready)"

echo "step 6 (transition list, during the build)"
expect "check 6 is false before step 6" "$(check 6)" f
q -c "insert into professional_transition_accounts (user_id, until, added_by, note) values ('$O', now() + interval '30 days', 'owner', 'reviewed')" >/dev/null
expect "check 6 is true after step 6" "$(check 6)" t

echo "scenario: Part B fails (simulated error inside its transaction)"
sed 's/^commit;$/select 1 \/ 0;\ncommit;/' sql/2026-10_patient_management_B_policies_PROPOSED.sql > "${TMPDIR:-/tmp}/phygo_b_fails.sql"
expect "the failing copy is refused" "$(if q -f "${TMPDIR:-/tmp}/phygo_b_fails.sql" >/dev/null 2>&1; then echo applied; else echo refused; fi)" refused
expect "nothing of Part B was applied" "$(check 7)" f
capabilities "after a failed Part B (S2 database: S3 once the deploy is live)" denied denied 0 denied ok ok ok ok 1 1 ok
echo "  recovery: re-run Part B (the deploy is NOT rolled back)"

echo "step 7 (Part B)"
q -f sql/2026-10_patient_management_B_policies_PROPOSED.sql >/dev/null
expect "check 7 is true after step 7" "$(check 7)" t
capabilities "S2+B (database of S4)" denied denied 0 denied   denied denied   denied denied 0   1      ok
direct_writes "S2+B and S4" denied denied denied denied denied 0

echo "scenario: deploy fails or stays pending -> current code on the S2+B database (nothing to undo)"
expect "Part B is still applied" "$(check 7)" t
# The current pages keep working for a listed clinician in S2+B (same writes as today's UI).
expect "listed O, current UI: create a patient" "$(try $O "insert into patients (id, user_id, name) values (gen_random_uuid(), '$O', 'new')")" ok
expect "listed O, current UI: invite (created_by = self)" "$(try $O "insert into patient_invites (patient_id, code, created_by, expires_at) values ('$PO', 'C', '$O', now() + interval '1 day')")" ok
expect "listed O, current UI: video-call row with a Daily room" "$(try $O "insert into video_calls (patient_id, room_url, created_by) values ('$PO', 'https://team.daily.co/r', '$O')")" ok
expect "listed O, current UI: schedule an appointment" "$(try $O "insert into appointments (patient_id, physio_id, requested_by, status) values ('$PO', '$O', 'physio', 'confirmed')")" ok
echo "  recovery: fix the build and deploy again; the SQL stays"

echo "scenario: deploy succeeds -> S4 (database above, API: tests/release_states.test.mjs)"

echo "step 9 (demo_usage, after the deploy is live)"
expect "check 9 is false before step 9" "$(check 9)" f
q -f sql/2026-10_security_demo_usage_policies_PROPOSED.sql >/dev/null
expect "check 9 is true after step 9" "$(check 9)" t

expect "the guide has a check for steps 1-4, 6, 7 and 9" "$(ls "$CHECKS" | sort -n | tr '\n' ' ')" "1.sql 2.sql 3.sql 4.sql 6.sql 7.sql 9.sql "
rm -rf "$CHECKS"
psql -q -d postgres -c "drop database $DB" >/dev/null
[ $fail = 0 ] && echo "RELEASE SEQUENCE CHECKS PASSED" || { echo "SOME RELEASE SEQUENCE CHECKS FAILED"; exit 1; }
