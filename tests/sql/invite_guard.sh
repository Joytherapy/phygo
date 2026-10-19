#!/usr/bin/env bash
# Tests sql/2026-10-19_patient_invite_guard_PROPOSED.sql on a throwaway LOCAL
# PostgreSQL with the policies live in Production (tests/sql/replica.sql, the
# 12 Oct snapshot and the applied 2026-10 files). Synthetic rows only. Never
# point this at Supabase.
#   PGHOST=/var/run/postgresql PGUSER=postgres bash tests/sql/invite_guard.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${TEST_DB:-phygo_invite_guard_test}
FILE=sql/2026-10-19_patient_invite_guard_PROPOSED.sql
export PGOPTIONS="-c client_min_messages=warning"
case "${PGHOST:-}" in *supabase*) echo "Refusing to run against Supabase" >&2; exit 1;; esac
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
q() { psql -q -At -v ON_ERROR_STOP=1 -d "$DB" "$@"; }
fail=0
expect() { if [ "$2" = "$3" ]; then echo "  ok   $1"; else echo "  FAIL $1: expected $3, got $2"; fail=1; fi; }
# redeem <user> <code>: redeems as that signed-in user (empty user = anonymous); ok or refused
redeem() {
  local role=authenticated; [ -z "$1" ] && role=anon
  if psql -q -At -v ON_ERROR_STOP=1 -d "$DB" -c "set role $role; set request.jwt.claim.sub = '$1'; select redeem_patient_invite('$2');" >/dev/null 2>&1; then echo ok; else echo refused; fi
}
linked() { q -c "select coalesce(patient_user_id::text, 'none') from patients where id = '$1'"; }

CLIN=00000000-0000-0000-0000-0000000000c1   # verified physiotherapist, owner of PA, PB
NEWPHYSIO=00000000-0000-0000-0000-0000000000c2  # professional awaiting verification, no patients yet
PAT=00000000-0000-0000-0000-0000000000a1    # new patient account
PAT2=00000000-0000-0000-0000-0000000000a2   # another patient account
PA=60000000-0000-0000-0000-00000000000a; PB=60000000-0000-0000-0000-00000000000b; PC=60000000-0000-0000-0000-00000000000c

q -f tests/sql/replica.sql >/dev/null
q -f docs/security/live-clinical-rls-2026-10-12.sql >/dev/null
q -f sql/2026-10_security_clinical_rls_hardening_PROPOSED.sql >/dev/null
q -f sql/2026-10_patient_management_A_transition_list_PROPOSED.sql >/dev/null
q -f sql/2026-10_patient_management_B_policies_PROPOSED.sql >/dev/null
q -c "insert into auth.users (id) values ('$CLIN'), ('$NEWPHYSIO'), ('$PAT'), ('$PAT2');
      update profiles set professional_status = 'verified' where id = '$CLIN';
      update profiles set professional_status = 'pending' where id = '$NEWPHYSIO';
      insert into patients (id, user_id, name) values ('$PA', '$CLIN', 'Synthetic A'), ('$PB', '$CLIN', 'Synthetic B'), ('$PC', '$CLIN', 'Synthetic C');
      insert into patient_invites (patient_id, code, expires_at) values
        ('$PA', 'SELF', now() + interval '1 day'), ('$PB', 'GOOD', now() + interval '1 day'),
        ('$PB', 'AGAIN', now() + interval '1 day'), ('$PC', 'OLD', now() - interval '1 day'),
        ('$PC', 'PENDING', now() + interval '1 day');" >/dev/null

echo "live function (before the fix): the bug"
expect "the clinician's own session links the clinician as the patient" "$(redeem $CLIN SELF)" ok
expect "  ...the record now points to the clinician" "$(linked $PA)" "$CLIN"
expect "  ...and the clinician's role became 'patient'" "$(q -c "select role from profiles where id = '$CLIN'")" patient

echo "apply (function + repair)"
expect "affected records before" "$(q -c "select count(*) from patients where patient_user_id = user_id")" 1
q -f "$FILE" >/dev/null
expect "the self-link is removed" "$(linked $PA)" none
expect "the clinician is 'physio' again" "$(q -c "select role from profiles where id = '$CLIN'")" physio
expect "affected records after" "$(q -c "select count(*) from patients where patient_user_id = user_id")" 0
expect "applying it twice is harmless" "$(if q -f "$FILE" >/dev/null 2>&1; then echo ok; else echo refused; fi)" ok

echo "redeeming after the fix"
q -c "insert into patient_invites (patient_id, code, expires_at) values ('$PA', 'SELF2', now() + interval '1 day')" >/dev/null
expect "the record's own clinician is refused" "$(redeem $CLIN SELF2)" refused
expect "  ...the record stays unlinked" "$(linked $PA)" none
expect "  ...and the invitation stays usable" "$(q -c "select used_at is null from patient_invites where code = 'SELF2'")" t
expect "a professional awaiting verification is refused" "$(redeem $NEWPHYSIO PENDING)" refused
expect "anonymous callers are refused" "$(redeem '' GOOD)" refused
expect "a new patient account is linked" "$(redeem $PAT GOOD)" ok
expect "  ...to that record" "$(linked $PB)" "$PAT"
expect "  ...the code is used up" "$(redeem $PAT2 GOOD)" refused
expect "  ...and the patient's role is 'patient'" "$(q -c "select role from profiles where id = '$PAT'")" patient
expect "a patient account then cannot accept a code as if it were a clinician (it owns no patients)" "$(q -c "select count(*) from patients where user_id = '$PAT'")" 0
expect "an expired code is refused" "$(redeem $PAT2 OLD)" refused
expect "a new invitation moves the record to a new patient account, as before" "$(redeem $PAT2 AGAIN)" ok
expect "  ...now linked to the new account" "$(linked $PB)" "$PAT2"
expect "the repair never touched patient accounts" "$(q -c "select count(*) from profiles where id in ('$PAT', '$PAT2') and role = 'patient'")" 2

echo "rollback block"
sed -n '/^--   begin;/,/^--   commit;/p' "$FILE" | sed 's/^--   //' > "${TMPDIR:-/tmp}/phygo_invite_rollback.sql"
q -f "${TMPDIR:-/tmp}/phygo_invite_rollback.sql" >/dev/null
q -c "insert into patient_invites (patient_id, code, expires_at) values ('$PC', 'BACK', now() + interval '1 day')" >/dev/null
expect "restores the previous behaviour" "$(redeem $CLIN BACK)" ok
expect "the fix applies again (and repairs again)" "$(if q -f "$FILE" >/dev/null 2>&1; then echo ok; else echo refused; fi)" ok
expect "  ...self-links repaired" "$(q -c "select count(*) from patients where patient_user_id = user_id")" 0

psql -q -d postgres -c "drop database $DB" >/dev/null
[ $fail = 0 ] && echo "all invite-guard checks passed" || { echo "SOME CHECKS FAILED"; exit 1; }
