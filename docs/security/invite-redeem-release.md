# My Phygo invitations: release procedure

Applies `sql/2026-10-16_patient_invite_redeem_PROPOSED.sql`. **The owner runs every step** in the Supabase SQL editor. All the queries below are read-only, except step 3 (apply) and the optional repair in step 5. They return definitions and counts only: no names, e-mails or clinical data.

## 0. Order
1. Deploy the code of this PR first: the join page signs in before redeeming, and unlinking withdraws open codes.
   - With the old code still live, an anonymous redemption (sign-up with "Confirm email" on) is refused instead of silently unlinking the record.
   - The patient sees "invite invalid" and can ask for a new link. Nothing is exposed.
2. Then run steps 1–4 below in one sitting.

## 1. Pre-flight (save the output)
```sql
-- 1a. Function: one overload, owner, security definer, settings, body fingerprint
select p.oid::regprocedure, p.proowner::regrole, r.rolsuper, r.rolbypassrls, p.prosecdef, p.proconfig, md5(p.prosrc)
from pg_proc p join pg_roles r on r.oid = p.proowner where p.proname = 'redeem_patient_invite';
select pg_get_functiondef('public.redeem_patient_invite(text)'::regprocedure);
-- expected: the same body as tests/sql/replica.sql; if it differs, STOP and report it

-- 1b. Grants (keep this output: it is the exact state the rollback restores)
select proacl from pg_proc where proname = 'redeem_patient_invite';
select r, has_function_privilege(r, 'public.redeem_patient_invite(text)', 'execute')
from unnest(array['anon', 'authenticated', 'service_role']) r;

-- 1c. Tables, triggers and policies involved
select relname, relowner::regrole, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace and relname in ('patients', 'patient_invites', 'profiles');
select tgrelid::regclass, tgname, tgenabled from pg_trigger
where not tgisinternal and tgrelid in ('public.profiles'::regclass, 'public.patients'::regclass, 'public.patient_invites'::regclass);
select tablename, policyname, cmd from pg_policies where tablename in ('patients', 'patient_invites') order by 1, 2;

-- 1d. Data state (counts only)
select count(*) filter (where n > 1) as records_with_several_open_codes
from (select patient_id, count(*) n from patient_invites where used_at is null and expires_at > now() group by 1) s;
select count(distinct i.patient_id) as linked_records_with_open_codes
from patient_invites i join patients p on p.id = i.patient_id
where i.used_at is null and i.expires_at > now() and p.patient_user_id is not null;
select count(*) as accounts_on_several_records
from (select patient_user_id from patients where patient_user_id is not null group by 1 having count(*) > 1) s;
select count(*) as clinicians_linked_to_own_record from patients where patient_user_id = user_id;
select count(*) as records_with_two_or_more_used_codes
from (select patient_id from patient_invites where used_at is not null group by 1 having count(*) > 1) s;
```
- **Not zero** for `accounts_on_several_records`, `clinicians_linked_to_own_record` or `records_with_two_or_more_used_codes`: these records may have been re-linked. Review them by record id with the clinician before going on.
- **"Confirm email"** (Supabase → Authentication → Providers → Email): note whether it is on. When it is on, the patient confirms the e-mail, reopens the link and enters the same e-mail and password. The new join page handles this.

## 2. Snapshot for the rollback
- Copy the output of 1a (`pg_get_functiondef`) and 1b (`proacl`).
- The rollback block in the SQL file restores the live definition with `grant ... to public`. If 1b showed explicit entries for `anon` or `authenticated`, re-grant them as they were.

## 3. Apply
Paste the whole file `sql/2026-10-16_patient_invite_redeem_PROPOSED.sql` (it runs in one transaction).

## 4. Verify
```sql
-- same owner and security definer; search_path=public, pg_temp; a different md5
select p.proowner::regrole, p.prosecdef, p.proconfig, md5(p.prosrc) from pg_proc p where p.proname = 'redeem_patient_invite';
-- anon f, authenticated t, service_role t
select r, has_function_privilege(r, 'public.redeem_patient_invite(text)', 'execute')
from unnest(array['anon', 'authenticated', 'service_role']) r;
-- both must fail, and nothing changes (rollback)
begin; set local role anon; select public.redeem_patient_invite('NOPE'); rollback;           -- permission denied
begin; set local role authenticated; select public.redeem_patient_invite('NOPE'); rollback;  -- "Sign in to accept the invitation"
```
Then do an end-to-end check with **synthetic** data only:
1. Create a test patient.
2. Invite them and join with a test e-mail.
3. Check that a second link for the same patient is refused.
4. Unlink the patient, then delete the test patient.

## 5. Optional repair (only after reading 1d)
Withdraws open codes on records that are already linked. Old links can then no longer re-link them:
```sql
update patient_invites set used_at = now()
where used_at is null and patient_id in (select id from patients where patient_user_id is not null);
```

## Rollback
Run the block in the header of the SQL file (between `begin;` and `commit;`), then restore the grants from step 2.

The rollback does not reopen the codes the new function closed: those links were already superseded.
