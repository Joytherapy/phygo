-- PROPOSED - NOT APPLIED. Needs the owner's approval before running in production.
--
-- demo_usage (live policy metadata, 12 Oct 2026) has three policies for the
-- anon role: SELECT using (true), INSERT with check (true), UPDATE using (true).
-- Anyone holding the public anon key can therefore read every stored IP
-- address and reset the anonymous-demo counters. After the security fix,
-- /api/generate-note requires a signed-in clinician and no code reads or
-- writes this table any more, so the anon policies serve no purpose. There
-- is no administrative workflow on this table; the service role (SQL editor,
-- server code) keeps full access because it bypasses RLS.
--
-- Effect: the table and its data stay; only the anon access is removed.
--
-- Stored IP addresses: 1 row on 12 Oct 2026. Recommendation: delete it once
-- this change is approved (data minimisation; it served only to count one
-- anonymous demo call). The DELETE is left commented out on purpose so that
-- removing data is a separate, explicit decision.
--
-- Rollback (re-creates exactly the three live policies):
--   create policy "anon can read demo_usage" on demo_usage for select to anon using (true);
--   create policy "anon can insert demo_usage" on demo_usage for insert to anon with check (true);
--   create policy "anon can update demo_usage" on demo_usage for update to anon using (true) with check (true);

begin;
drop policy if exists "anon can read demo_usage" on demo_usage;
drop policy if exists "anon can insert demo_usage" on demo_usage;
drop policy if exists "anon can update demo_usage" on demo_usage;
-- delete from demo_usage;  -- optional, see "Stored IP addresses" above
commit;
