#!/usr/bin/env bash
# Tests the clinical-knowledge migrations on a throwaway LOCAL database.
# Never point this at Supabase: it drops and recreates the database it is given.
#
#   PGHOST=/var/run/postgresql PGPORT=5432 PGUSER=postgres ./run.sh
#
# Checks: each step applies cleanly, re-running all steps changes nothing,
# the expected rows are fixed (numbers from the 12 October 2026 baseline),
# the draft gate refuses unapproved content, and every rollback restores the
# previous state.
set -euo pipefail
cd "$(dirname "$0")"
SQL=../../../sql
DB=${TEST_DB:-phygo_ck_test}
export PGOPTIONS="-c client_min_messages=warning"
case "${PGHOST:-}" in *supabase*) echo "Refusing to run against Supabase" >&2; exit 1;; esac

psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
run() { psql -q -v ON_ERROR_STOP=1 -d "$DB" "$@" >/dev/null; }
val() { psql -At -v ON_ERROR_STOP=1 -d "$DB" -c "$1"; }
fail=0
check() { # label, sql, expected
  local got; got=$(val "$2")
  if [ "$got" = "$3" ]; then echo "  ok   $1 = ${got:0:40}"; else echo "  FAIL $1: expected $3, got $got"; fail=1; fi
}

run -f replica-schema.sql
node make-fixtures.mjs > /tmp/ck_fixtures.sql
run -f /tmp/ck_fixtures.sql

echo "baseline"
check "conditions" "select count(*) from knowledge_base" 626
check "phases" "select count(*) from rehab_phases" 254
check "distinct condition ids in phases" "select count(distinct condition_id) from rehab_phases" 75
COLS="select string_agg(table_name || '.' || column_name, ',' order by table_name, column_name) from information_schema.columns where table_schema = 'public' and table_name in ('knowledge_base', 'rehab_phases', 'condition_translations')"
BASE_COLS=$(val "$COLS")

apply_all() {
  run -f $SQL/2026-10_clinical_knowledge_01_schema.sql
  run -f $SQL/2026-10_clinical_knowledge_02_condition_redirects.sql
  run -f $SQL/2026-10_clinical_knowledge_03_phase_integrity.sql
}
after_all() {
  check "conditions unchanged" "select count(*) from knowledge_base" 626
  check "conditions pending clinical review" "select count(*) from knowledge_base where review_status = 'clinical_review_pending'" 626
  check "translations marked machine_generated" "select count(*) from condition_translations where translation_status = 'machine_generated'" 626
  check "redirects" "select count(*) from condition_redirects" 18
  check "phases after cleanup" "select count(*) from rehab_phases" 245
  check "backed-up rows" "select count(*) from _backup_2026_10_rehab_phases" 12
  check "exact duplicates removed" "select count(*) from _backup_2026_10_rehab_phases where backup_reason = 'exact_duplicate'" 8
  check "COPD phases now on #117" "select count(*) from rehab_phases where condition_id = 117" 3
  check "condition 57 keeps both versions of phase 2" "select count(*) from rehab_phases where condition_id = 57 and phase_number = 2" 2
  check "duplicate phase numbers left (only 57/2)" "select count(*) from (select condition_id, phase_number from rehab_phases group by 1,2 having count(*) > 1) x" 1
  check "protocols" "select count(*) from rehab_protocols" 75
  check "protocol-condition links" "select count(*) from rehab_protocol_conditions" 75
  check "phases without protocol" "select count(*) from rehab_phases where protocol_id is null" 0
  check "foreign key present" "select count(*) from pg_constraint where conname = 'rehab_phases_condition_id_fkey'" 1
  check "anon cannot run promote" "select has_function_privilege('anon', 'promote_condition_draft(text)', 'execute')" f
}

echo "apply steps 1-3"
apply_all; after_all
echo "apply steps 1-3 again (idempotency)"
apply_all; after_all

echo "import pipeline (validate -> drafts SQL, twice)"
node ../validate.mjs ../examples/dataset.example.json --index fixtures/knowledge_base.json --report /tmp/ck_report.json >/dev/null
node ../build-drafts-sql.mjs ../examples/dataset.example.json /tmp/ck_report.json > /tmp/ck_drafts.sql
run -f /tmp/ck_drafts.sql
run -f /tmp/ck_drafts.sql
check "drafts staged" "select count(*) from clinical_content_drafts" 2
check "library untouched by import" "select count(*) from knowledge_base" 626
run -c "delete from clinical_content_drafts"

echo "draft gate"
run -c "insert into clinical_content_drafts (kind, slug, payload) values ('condition', 'test-condition', '{\"condition_name\":\"Test\",\"synonyms\":[\"a\",\"b\"],\"sources\":[{\"citation\":\"X\"}]}')"
if psql -q -v ON_ERROR_STOP=1 -d "$DB" -c "select promote_condition_draft('test-condition')" >/dev/null 2>&1; then
  echo "  FAIL unapproved draft was published"; fail=1
else
  echo "  ok   unapproved draft refused"
fi
check "nothing published" "select count(*) from knowledge_base" 626
run -c "update clinical_content_drafts set review_status = 'approved', reviewed_by = 'test' where slug = 'test-condition'"
first=$(val "select promote_condition_draft('test-condition')")
second=$(val "select promote_condition_draft('test-condition')")
check "approved draft published once" "select count(*) from knowledge_base where slug = 'test-condition'" 1
[ "$first" = "$second" ] && echo "  ok   promote is idempotent ($first)" || { echo "  FAIL promote returned $first then $second"; fail=1; }
check "synonyms copied" "select array_to_string(synonyms, ',') from knowledge_base where slug = 'test-condition'" "a,b"
run -c "delete from knowledge_base where slug = 'test-condition'; delete from clinical_content_drafts"

echo "rollback step 3"
run -f $SQL/2026-10_clinical_knowledge_03_rollback.sql
check "phases restored" "select count(*) from rehab_phases" 254
check "COPD phases back on #36" "select count(*) from rehab_phases where condition_id = 36" 3
check "phase without condition back" "select count(*) from rehab_phases where condition_id is null" 1
check "protocols back to 74" "select count(*) from rehab_protocols" 74
check "foreign key removed" "select count(*) from pg_constraint where conname = 'rehab_phases_condition_id_fkey'" 0

echo "re-apply step 3 after rollback"
run -f $SQL/2026-10_clinical_knowledge_03_phase_integrity.sql
check "phases" "select count(*) from rehab_phases" 245
check "protocols" "select count(*) from rehab_protocols" 75

echo "full rollback"
run -f $SQL/2026-10_clinical_knowledge_03_rollback.sql
run -c "drop table condition_redirects"
run -f $SQL/2026-10_clinical_knowledge_01_rollback.sql
check "phases" "select count(*) from rehab_phases" 254
check "new tables gone" "select count(*) from information_schema.tables where table_name in ('rehab_protocols','clinical_sources','clinical_content_drafts','condition_redirects')" 0
check "original columns restored exactly" "$COLS" "$BASE_COLS"

psql -q -d postgres -c "drop database $DB" >/dev/null
[ $fail = 0 ] && echo "ALL CHECKS PASSED" || { echo "SOME CHECKS FAILED"; exit 1; }
