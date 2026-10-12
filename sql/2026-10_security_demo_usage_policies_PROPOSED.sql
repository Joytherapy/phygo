-- PROPOSED - NOT APPLIED. Needs the owner's approval before running in production.
--
-- demo_usage stores the IP address of anonymous visitors who used the old
-- note-generation demo. Its policies let anyone holding the public anon key
-- read every row (IP addresses), insert rows and update counters. After the
-- security fix, /api/generate-note requires a signed-in clinician and no
-- longer touches this table, so the anon policies serve no purpose.
--
-- Effect: the table stays (nothing is deleted); only the service role can
-- read or write it. Rollback: re-create the three policies (definitions in
-- the comments below).
--   create policy "anon can read demo_usage" on demo_usage for select to anon using (true);
--   create policy "anon can insert demo_usage" on demo_usage for insert to anon with check (true);
--   create policy "anon can update demo_usage" on demo_usage for update to anon using (true) with check (true);
-- Separately, decide whether the stored IP rows (1 on 12 Oct 2026) should be kept.

begin;
drop policy if exists "anon can read demo_usage" on demo_usage;
drop policy if exists "anon can insert demo_usage" on demo_usage;
drop policy if exists "anon can update demo_usage" on demo_usage;
commit;
