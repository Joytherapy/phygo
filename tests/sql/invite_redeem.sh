#!/usr/bin/env bash
# Tests sql/2026-10-16_patient_invite_redeem_PROPOSED.sql on a throwaway LOCAL
# PostgreSQL with the live definitions (tests/sql/replica.sql). Synthetic ids
# only. Never point this at Supabase.
#   PGHOST=/var/run/postgresql PGUSER=postgres bash tests/sql/invite_redeem.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${TEST_DB:-phygo_invite_test}
FILE=sql/2026-10-16_patient_invite_redeem_PROPOSED.sql
export PGOPTIONS="-c client_min_messages=warning"
case "${PGHOST:-}" in *supabase*) echo "Refusing to run against Supabase" >&2; exit 1;; esac
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
q() { psql -q -At -v ON_ERROR_STOP=1 -d "$DB" "$@"; }
fail=0
expect() { if [ "$2" = "$3" ]; then echo "  ok   $1"; else echo "  FAIL $1: expected $3, got $2"; fail=1; fi; }
# redeem <role> <user id or empty> <code>: ok or refused
redeem() { if psql -q -At -d "$DB" -c "set role $1; set request.jwt.claim.sub = '$2'; select redeem_patient_invite('$3')" >/dev/null 2>&1; then echo ok; else echo refused; fi; }
linked() { q -c "select coalesce(patient_user_id::text, 'none') from patients where id = '$1'"; }
reset() {
  q -c "delete from patient_invites; update patients set patient_user_id = null;
        insert into patient_invites (patient_id, code, expires_at) values
          ('$PA', 'FIRST', now() + interval '7 days'), ('$PA', 'SECOND', now() + interval '7 days'),
          ('$PA', 'OLD', now() - interval '1 day'), ('$PB', 'OTHER', now() + interval '7 days');" >/dev/null
}

CLIN=00000000-0000-0000-0000-0000000000c1; PAT=00000000-0000-0000-0000-0000000000a1
INTRUDER=00000000-0000-0000-0000-0000000000e1; NEWPAT=00000000-0000-0000-0000-0000000000a2
PA=20000000-0000-0000-0000-00000000000a; PB=20000000-0000-0000-0000-00000000000b

q -f tests/sql/replica.sql >/dev/null
q -f docs/security/live-clinical-rls-2026-10-12.sql >/dev/null
q -c "insert into auth.users (id) values ('$CLIN'), ('$PAT'), ('$INTRUDER'), ('$NEWPAT'); -- the signup trigger adds the profiles
      insert into patients (id, user_id, name) values ('$PA', '$CLIN', 'Synthetic A'), ('$PB', '$CLIN', 'Synthetic B');" >/dev/null

echo "live function (before the fix)"
reset
expect "the patient redeems the first link" "$(redeem authenticated $PAT FIRST)" ok
expect "a second open link moves the record to someone else (vulnerable)" "$(redeem authenticated $INTRUDER SECOND)" ok
expect "  ...and the record now belongs to the intruder" "$(linked $PA)" "$INTRUDER"
reset
expect "anonymous callers can run it (vulnerable)" "$(redeem anon '' FIRST)" ok
expect "  ...which unlinks the record and burns the invitation" "$(q -c "select coalesce(patient_user_id::text,'none') || ' ' || (used_at is not null) from patients p join patient_invites i on i.patient_id = p.id where i.code = 'FIRST'")" "none true"

echo "with the proposed function"
q -f "$FILE" >/dev/null
reset
expect "anonymous callers cannot run it" "$(redeem anon '' FIRST)" refused
expect "a signed-in role without a user is refused" "$(redeem authenticated '' FIRST)" refused
expect "  ...and the invitation is still open" "$(q -c "select used_at is null from patient_invites where code = 'FIRST'")" t
expect "an expired code is refused" "$(redeem authenticated $PAT OLD)" refused
expect "an unknown code is refused" "$(redeem authenticated $PAT NOPE)" refused
expect "the patient redeems the first link" "$(redeem authenticated $PAT FIRST)" ok
expect "  ...the record is linked to the patient" "$(linked $PA)" "$PAT"
expect "  ...the patient's other open links are closed" "$(q -c "select used_at is not null from patient_invites where code = 'SECOND'")" t
expect "  ...another record's links are untouched" "$(q -c "select used_at is null from patient_invites where code = 'OTHER'")" t
expect "the second link no longer works for anyone" "$(redeem authenticated $INTRUDER SECOND)" refused
q -c "insert into patient_invites (patient_id, code, expires_at) values ('$PA', 'LATER', now() + interval '7 days')" >/dev/null
expect "a code created while the record is linked cannot move it" "$(redeem authenticated $INTRUDER LATER)" refused
expect "  ...the record still belongs to the patient" "$(linked $PA)" "$PAT"
expect "  ...and that code is still open" "$(q -c "select used_at is null from patient_invites where code = 'LATER'")" t
expect "the same patient redeeming again is harmless" "$(redeem authenticated $PAT LATER)" ok
expect "  ...still linked to the patient" "$(linked $PA)" "$PAT"
q -c "update patients set patient_user_id = null where id = '$PA';
      insert into patient_invites (patient_id, code, expires_at) values ('$PA', 'RELINK', now() + interval '7 days')" >/dev/null
expect "after the clinician unlinks, a new invitation links a new account" "$(redeem authenticated $NEWPAT RELINK)" ok
expect "  ...linked to the new account" "$(linked $PA)" "$NEWPAT"
q -c "insert into patient_invites (patient_id, code, expires_at) values ('$PB', 'SELF', now() + interval '7 days'), ('$PB', 'SECONDREC', now() + interval '7 days')" >/dev/null
expect "a clinician cannot link themselves to their own record" "$(redeem authenticated $CLIN SELF)" refused
expect "an account already on one record cannot take a second one" "$(redeem authenticated $NEWPAT SECONDREC)" refused
expect "  ...the second record stays unlinked" "$(linked $PB)" none
expect "the redeeming account becomes a patient" "$(q -c "select role from profiles where id = '$NEWPAT'")" patient

echo "two codes for the same record redeemed at the same time"
reset
race() { psql -q -At -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '$1'; begin; select redeem_patient_invite('$2'); select pg_sleep(1); commit;" >"${TMPDIR:-/tmp}/phygo_race_$2.out" 2>&1 && echo ok || echo refused; }
race $PAT FIRST > "${TMPDIR:-/tmp}/phygo_race_a" & race $INTRUDER SECOND > "${TMPDIR:-/tmp}/phygo_race_b" & wait
expect "exactly one of the two wins" "$(cat "${TMPDIR:-/tmp}/phygo_race_a" "${TMPDIR:-/tmp}/phygo_race_b" | sort | tr '\n' ' ')" "ok refused "
expect "  ...no deadlock" "$(cat "${TMPDIR:-/tmp}"/phygo_race_*.out | grep -c deadlock || true)" 0
expect "  ...the record has one owner, the winner" "$(linked $PA | grep -cE "^($PAT|$INTRUDER)$")" 1

echo "rollback block restores the live definition"
sed -n '/^--   begin;/,/^--   commit;/p' "$FILE" | sed 's/^--   //' > "${TMPDIR:-/tmp}/phygo_invite_rollback.sql"
q -f "${TMPDIR:-/tmp}/phygo_invite_rollback.sql" >/dev/null
reset
redeem authenticated $PAT FIRST >/dev/null
expect "after rollback the old behaviour is back" "$(redeem authenticated $INTRUDER SECOND)" ok
expect "the proposal applies again after a rollback" "$(if q -f "$FILE" >/dev/null 2>&1; then echo ok; else echo refused; fi)" ok

psql -q -d postgres -c "drop database $DB" >/dev/null
[ $fail = 0 ] && echo "all invite checks passed" || { echo "SOME CHECKS FAILED"; exit 1; }
