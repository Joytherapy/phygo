#!/usr/bin/env bash
# Data API privileges after Supabase's 30 Oct 2026 change, on a throwaway LOCAL
# PostgreSQL. New tables here get no privileges unless granted (local
# PostgreSQL never had Supabase's default privileges): exactly the behaviour of
# a new Supabase project, preview branch or local reset after that date.
#   1. The repo files that create tables are applied as they are; the gaps are
#      shown (e.g. a signed-in user cannot use the workspace).
#   2. sql/2026-10-22_api_grants_explicit_PROPOSED.sql closes them with least
#      privilege; row-level security still separates users; anon gets nothing
#      but the public translations; applying it twice is harmless.
#   3. sql/2026-10-22_exercise_cache_no_anon_writes_PROPOSED.sql, on a copy of
#      the Production policies: anon can still read the cache, no longer write.
# Dashboard-only tables are stubbed with "grant all", as Production had them
# before 30 Oct. Synthetic rows only. Never point this at Supabase.
#   PGHOST=/var/run/postgresql PGUSER=postgres bash tests/sql/api_grants.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${TEST_DB:-phygo_api_grants_test}
export PGOPTIONS="-c client_min_messages=warning"
case "${PGHOST:-}" in *supabase*) echo "Refusing to run against Supabase" >&2; exit 1;; esac
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
q() { psql -q -At -v ON_ERROR_STOP=1 -d "$DB" "$@"; }
fail=0
expect() { if [ "$2" = "$3" ]; then echo "  ok   $1"; else echo "  FAIL $1: expected $3, got $2"; fail=1; fi; }
try() { if psql -q -At -v ON_ERROR_STOP=1 -d "$DB" -c "begin; set local role $1; set local request.jwt.claim.sub = '$2'; $3; rollback;" >/dev/null 2>&1; then echo ok; else echo refused; fi; }
val() { psql -q -At -d "$DB" -c "set role $1; set request.jwt.claim.sub = '$2'; $3" 2>/dev/null | tail -1; }
priv() { q -c "select has_table_privilege('$1', '$2', '$3')"; }

U1=00000000-0000-0000-0000-0000000000e1
U2=00000000-0000-0000-0000-0000000000e2

# Production-like base: roles, auth, the dashboard tables (grant all, as before 30 Oct).
q -f tests/sql/replica.sql >/dev/null
q <<'SQL' >/dev/null
create table knowledge_base (id integer primary key);
create table exercise_cache (provider text, provider_id text, language text, name text, data jsonb, cached_at timestamptz,
  primary key (provider, provider_id, language));
grant all on knowledge_base, exercise_cache to anon, authenticated, service_role;
alter table exercise_cache enable row level security;
-- The three policies live in Production (pg_policies, 21 Oct 2026).
create policy "anon can insert exercise_cache" on exercise_cache for insert to anon with check (true);
create policy "anon can read exercise_cache" on exercise_cache for select to anon using (true);
create policy "anon can update exercise_cache" on exercise_cache for update to anon using (true) with check (true);
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
SQL
q -f docs/security/live-clinical-rls-2026-10-12.sql >/dev/null
q -f sql/2026-10_security_clinical_rls_hardening_PROPOSED.sql >/dev/null
q -f sql/2026-10_patient_management_A_transition_list_PROPOSED.sql >/dev/null
q -f sql/2026-10_patient_management_B_policies_PROPOSED.sql >/dev/null
q -f sql/2026-10-17_patient_profile_PROPOSED.sql >/dev/null
q -c "drop table metabolic_profiles cascade" >/dev/null   # the replica stub; created for real by its repo file below

# The repo files that create tables, as they are.
for f in sql/2026-09_workspace_foundation.sql sql/2026-09_workspace_study_panel.sql sql/2026-09_quiz_foundation.sql \
         sql/2026-09_metabolic_profiles.sql sql/2026-09_condition_translations.sql sql/2026-09_i18n_foundation.sql; do
  q -f "$f" >/dev/null
done
q -c "insert into auth.users (id) values ('$U1'), ('$U2')" >/dev/null

echo "1. Repo files alone, after 30 Oct (the gaps)"
expect "a signed-in user cannot create a workspace folder" "$(try authenticated $U1 "insert into workspace_folders (owner_id, name) values ('$U1', 'x')")" refused
expect "a student cannot record a quiz attempt" "$(try authenticated $U1 "insert into quiz_attempts (owner_id, subject, difficulty, total_questions, correct_count) values ('$U1', 's', 'easy', 1, 1)")" refused
expect "the server cannot save a metabolic profile" "$(priv service_role metabolic_profiles insert)" f
expect "the landing page cannot read condition translations" "$(priv anon condition_translations select)" f
expect "the server has nothing on patient details" "$(priv service_role patient_details select)" f

echo "2. With sql/2026-10-22_api_grants_explicit_PROPOSED.sql"
q -f sql/2026-10-22_api_grants_explicit_PROPOSED.sql >/dev/null
expect "applying it twice is harmless" "$(if q -f sql/2026-10-22_api_grants_explicit_PROPOSED.sql >/dev/null 2>&1; then echo ok; else echo refused; fi)" ok
WS="workspace_folders workspace_notebooks workspace_notebook_pages workspace_documents workspace_annotations workspace_tags workspace_item_tags workspace_bookmarks workspace_knowledge_saves"
ws_ok=ok; for t in $WS; do for p in select insert update delete; do [ "$(priv authenticated $t $p)" = t ] || ws_ok="missing $p on $t"; done; [ "$(priv anon $t select)" = f ] || ws_ok="anon reads $t"; [ "$(priv service_role $t insert)" = t ] || ws_ok="service missing on $t"; done
expect "workspace: signed-in users read/write, anon nothing, server all" "$ws_ok" ok
expect "a user creates their own folder" "$(try authenticated $U1 "insert into workspace_folders (owner_id, name) values ('$U1', 'mine')")" ok
expect "a user cannot create a folder for someone else" "$(try authenticated $U1 "insert into workspace_folders (owner_id, name) values ('$U2', 'theirs')")" refused
q -c "insert into workspace_folders (owner_id, name) values ('$U2', 'private of U2')" >/dev/null
expect "a user does not see another user's folders" "$(val authenticated $U1 "select count(*) from workspace_folders where owner_id = '$U2'")" 0
expect "anon cannot read the workspace" "$(try anon '' "select * from workspace_folders")" refused
expect "a student records an attempt" "$(try authenticated $U1 "insert into quiz_attempts (owner_id, subject, difficulty, total_questions, correct_count) values ('$U1', 's', 'easy', 1, 1)")" ok
expect "a student cannot change attempts (insert/select only)" "$(priv authenticated quiz_attempts update)" f
expect "students cannot read questions with their answers" "$(priv authenticated quiz_questions select)" f
expect "anon cannot read questions" "$(priv anon quiz_questions select)" f
expect "the server writes questions" "$(priv service_role quiz_questions insert)" t
expect "metabolic profiles: server only" "$(priv service_role metabolic_profiles insert)/$(priv authenticated metabolic_profiles select)/$(priv anon metabolic_profiles select)" t/f/f
expect "the landing page reads condition translations" "$(priv anon condition_translations select)" t
expect "nobody but the server writes translations" "$(priv anon condition_translations insert)/$(priv authenticated content_translations insert)/$(priv anon content_translations select)" f/f/f
q -c "insert into knowledge_base values (1)" >/dev/null
expect "the server adds a translation (sequence usable)" "$(try service_role '' "insert into condition_translations (condition_id, lang, condition_name, source_hash) values (1, 'en', 'x', 'h')")" ok
expect "the server reaches patient details and the transition list" "$(priv service_role patient_details select)/$(priv service_role professional_transition_accounts insert)" t/t
expect "anon still has nothing on patient details" "$(priv anon patient_details select)" f

echo "3. With sql/2026-10-22_exercise_cache_no_anon_writes_PROPOSED.sql"
expect "today anon can write the cache" "$(try anon '' "insert into exercise_cache (provider, provider_id, language, name) values ('wger', '1', 'en', 'fake')")" ok
q -f sql/2026-10-22_exercise_cache_no_anon_writes_PROPOSED.sql >/dev/null
expect "applying it twice is harmless" "$(if q -f sql/2026-10-22_exercise_cache_no_anon_writes_PROPOSED.sql >/dev/null 2>&1; then echo ok; else echo refused; fi)" ok
q -c "insert into exercise_cache (provider, provider_id, language, name) values ('wger', '2', 'en', 'real')" >/dev/null
expect "anon can no longer insert" "$(try anon '' "insert into exercise_cache (provider, provider_id, language, name) values ('wger', '3', 'en', 'fake')")" refused
expect "anon can no longer overwrite" "$(try anon '' "update exercise_cache set name = 'fake' where provider_id = '2'")" refused
expect "anon still reads the cache" "$(val anon '' "select name from exercise_cache where provider_id = '2'")" real
expect "the server writes the cache" "$(try service_role '' "insert into exercise_cache (provider, provider_id, language, name) values ('wger', '4', 'en', 'ok')")" ok

psql -q -d postgres -c "drop database $DB" >/dev/null
[ $fail = 0 ] && echo "ALL OK" || { echo "FAILURES"; exit 1; }
