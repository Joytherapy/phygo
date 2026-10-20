#!/usr/bin/env bash
# Which notes the patient page's history query returns, by role, on a throwaway
# LOCAL PostgreSQL with the live policies (tests/sql/replica.sql and
# docs/security/live-clinical-rls-2026-10-12.sql; the notes SELECT policies are
# not changed by the applied Part B). The query is the page's own:
#   select id, created_at from notes where patient_id = <id> order by created_at desc
# Synthetic rows only. Never point this at Supabase.
#   PGHOST=/var/run/postgresql PGUSER=postgres bash tests/sql/note_history.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${TEST_DB:-phygo_note_history_test}
export PGOPTIONS="-c client_min_messages=warning"
case "${PGHOST:-}" in *supabase*) echo "Refusing to run against Supabase" >&2; exit 1;; esac
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
q() { psql -q -At -v ON_ERROR_STOP=1 -d "$DB" "$@"; }
fail=0
expect() { if [ "$2" = "$3" ]; then echo "  ok   $1"; else echo "  FAIL $1: expected $3, got $2"; fail=1; fi; }
# history <role> <user id> <patient id>: the note ids the page would list, in order
history() { psql -q -At -d "$DB" -c "set role $1; set request.jwt.claim.sub = '$2'; select coalesce(string_agg(tag, ',' order by created_at desc), 'none') from (select n.created_at, t.tag from notes n join tags t on t.id = n.id where n.patient_id = '$3' order by n.created_at desc) s" 2>/dev/null | tail -1 || echo denied; }

CLIN=00000000-0000-0000-0000-0000000000c1; OTHER=00000000-0000-0000-0000-0000000000c2; PAT=00000000-0000-0000-0000-0000000000a1
PA=40000000-0000-0000-0000-00000000000a; PB=40000000-0000-0000-0000-00000000000b

q -f tests/sql/replica.sql >/dev/null
q -f docs/security/live-clinical-rls-2026-10-12.sql >/dev/null
# The replica keeps only the columns the policies use; add the ones the page reads.
# tags: a readable label per note for the assertions (no RLS, test only).
q -c "alter table notes add column plan text, add column created_at timestamptz not null default now();
      create table tags (id uuid primary key, tag text); grant select on tags to authenticated, anon;
      insert into auth.users (id) values ('$CLIN'), ('$OTHER'), ('$PAT');
      insert into patients (id, user_id, name, patient_user_id) values ('$PA', '$CLIN', 'Synthetic A', '$PAT'), ('$PB', '$OTHER', 'Synthetic B', null);
      with n as (insert into notes (patient_id, user_id, assessment, created_at) values
          ('$PA', '$CLIN', 'Synthetic', '2026-08-11 09:30+00'),
          ('$PA', '$CLIN', 'Synthetic', '2024-03-02 08:00+00'),
          ('$PA', '$CLIN', 'Synthetic', '2026-08-14 16:45+00'),
          ('$PB', '$OTHER', 'Synthetic', '2026-08-12 10:00+00'),
          ('$PA', '$OTHER', 'Synthetic', '2026-08-13 10:00+00')
        returning id, patient_id, user_id, created_at)
      insert into tags select id, case when user_id = '$OTHER' and patient_id = '$PA' then 'foreign' when patient_id = '$PB' then 'other' else to_char(created_at at time zone 'UTC', 'YYYY-MM-DD') end from n;" >/dev/null

echo "live policies"
expect "the clinician reads every note of their patient, of any age, newest first" "$(history authenticated $CLIN $PA)" "2026-08-14,2026-08-11,2024-03-02"
expect "  ...but not a note written by another account on the same record" "$(history authenticated $CLIN $PA | grep -c foreign || true)" 0
expect "the clinician reads nothing of another clinician's patient" "$(history authenticated $CLIN $PB)" none
expect "another clinician reads nothing of this patient's notes but their own" "$(history authenticated $OTHER $PA)" foreign
expect "anonymous callers read nothing" "$(history anon '' $PA)" none
expect "the query changes nothing" "$(q -c "select count(*) from notes")" 5

echo "after PR #25 (patients no longer read notes directly)"
q -f sql/2026-10-16_patient_notes_policy_PROPOSED.sql >/dev/null 2>&1 || q -c 'drop policy if exists "Patients can read their own notes" on notes' >/dev/null
expect "the clinician's history is unchanged" "$(history authenticated $CLIN $PA)" "2026-08-14,2026-08-11,2024-03-02"
expect "the patient reads no note row" "$(history authenticated $PAT $PA)" none

psql -q -d postgres -c "drop database $DB" >/dev/null
[ $fail = 0 ] && echo "all note-history checks passed" || { echo "SOME CHECKS FAILED"; exit 1; }
