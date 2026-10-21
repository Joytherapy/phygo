-- PROPOSED — the exercise cache can no longer be written with the public key.
--
-- Production today (pg_policies, read on 21 Oct 2026): "anon can insert
-- exercise_cache" (WITH CHECK true) and "anon can update exercise_cache"
-- (USING true, WITH CHECK true). Anyone holding the public anon key — it is in
-- every browser — could insert or overwrite cached exercises (names, steps,
-- image links), which are suggested in clinical notes, saved in them and shown
-- to patients. Integrity issue, not a data leak.
--
-- APPLY ONLY AFTER the code that writes the cache with the service role is
-- live (lib/exercise-providers/cache.ts); before that, the note's exercise
-- matching would stop refreshing the cache (reads keep working either way).
--
-- Reading stays public (the cache is reference content). Re-runnable.
-- Tested locally: tests/sql/api_grants.sh.
-- Rollback: recreate the two policies and re-grant insert, update to anon.

begin;
drop policy if exists "anon can insert exercise_cache" on exercise_cache;
drop policy if exists "anon can update exercise_cache" on exercise_cache;
revoke insert, update, delete, truncate, references, trigger on exercise_cache from anon, authenticated;
grant select on exercise_cache to anon;
grant all on exercise_cache to service_role;
commit;
