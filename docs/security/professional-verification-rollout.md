# Professional verification: rollout, transition and rollback

This guide covers three PRs:
- **PR #5 (security):** its SQL is what the other two build on.
- **PR #7 (professional verification):** stacked on #5.
- **PR #8 (patient management):** stacked on #7.

Nothing here has been applied to production. Every step needs the owner's explicit approval.

## Three separate permissions

| Permission | Who | Enforced by |
|---|---|---|
| **1. Public clinical and educational resources:** public site, condition library, legal pages | Everyone, no account | Nothing to enforce (public content) |
| **2. General signed-in features and settings:** library, anatomy, exercises, quizzes, workspace, Ask PHYGO, own metabolic calculator, profile, language, declared role, requesting verification | Any signed-in account; patients use My Phygo | Sign-in (`requireUser`), per-owner RLS, hourly limits |
| **3. Real patients and their clinical information:** creating, changing and **deleting** patients, notes, appointments, invitations, video calls and clinical links; **adding** metabolic data on a patient; clinical AI on real cases | **Authorised clinicians:** verified by PHYGO, or listed on the owner's time-limited transition list | Database (`can_manage_patients()` in RLS) **and** API routes (`requireVerifiedProfessional`), applying the same rule |

The declared role (student / professional) is only a preference. It never grants permission 3.

**Reading is deliberately separate from permission 3.** A clinician account keeps **read** access to the existing records of **its own** patients even without verification:
- patients;
- notes;
- appointments;
- clinical links;
- metabolic data.

Those records are already that account's own. Reading them reveals nothing new and avoids a sudden loss of access. Everything that creates, changes or deletes needs permission 3.

## Permission matrix

| | Visitor | Student | Declared professional, not verified, not listed (incl. pending / needs info / rejected, new and self-promoted accounts) | Listed pre-existing account, until its end date | Verified professional | Patient |
|---|---|---|---|---|---|---|
| Public resources | yes | yes | yes | yes | yes | yes |
| Educational tools, Ask PHYGO, workspace, own calculator | – | yes | yes | yes | yes | My Phygo |
| Profile, language, role switch, request verification | – | yes | yes | yes | yes | profile only |
| **Read** the existing records of their **own** patients: patients, notes, appointments, clinical links, metabolic data* | – | – | yes (own patients only; read-only) | yes | yes | their own record, all entries |
| **Create, change or delete** patients, notes, appointments; confirm requests | – | – | **no** | yes | yes | request appointments for themselves |
| **Invite** to My Phygo, reset portal access, delete invitations | – | – | **no** | yes | yes | redeem an invitation |
| **Add or remove** clinical links; **add** metabolic data on a patient | – | – | **no** | yes | yes | add their own entries (shared or private) |
| **Video calls** (create, change, delete) | – | – | **no** | yes | yes | join only |
| **Clinical AI on real cases** | – | – | **no** | yes | yes | – |

\* **Metabolic data** (`/api/metabolic/save`):
- **Who sees what:**
  - a clinician sees the entries entered by professionals, plus the entries the patient chose to share;
  - entries the patient saved as private (`shared_with_professional = false`) are visible only to the patient.
- **Who can add:** only verified or listed clinicians, for their own patients, can add an entry; the personal calculator (no patient) is open to every account.
- **Tests:** these rules are covered by `tests/security.test.mjs` and `tests/verification.test.mjs`.

Two protections apply in every column:
- **Ownership:** a clinician reaches only their own patients (`patients.user_id = auth.uid()`). It is checked by RLS, and in the code of the service-role routes (`ownsPatient`, `clinicianOwnsPatient`). "Missing" and "not yours" give the same 404.
- **Hourly limits:** checked before any paid call; if the counter cannot be read, the request is refused.

### Deletion and cascades

The live foreign keys were read on 12 Oct 2026.

**Deleting a patient** cascades to all its:
- notes;
- appointments;
- invitations;
- video calls;
- clinical links;
- metabolic profiles.

**Deleting a note** keeps its clinical links and clears their `note_id`.

PostgreSQL runs cascades without checking RLS. That is why the DELETE on `patients` itself requires `can_manage_patients()`: only an authorised clinician can start a cascade. Every child table also needs it for direct deletes.

Unverified accounts can still **read** the existing records of their own patients. Nothing is hidden or lost; it is only frozen until verification or listing.

No server route deletes clinical data. The only path is the browser under RLS. Account deletion (which cascades through `auth.users`) is available only to the owner in Supabase.

## The transition list (a database table)

- **The table:** `professional_transition_accounts`, created by Part A of PR #8.
- **Why a table:** database rules cannot read Vercel settings, so the list lives in the database. One list and one rule (`can_manage_patients()`) govern patient management, clinical AI and video.
- **Old variables:** `PROFESSIONAL_TRANSITION_ACCOUNTS`, `PROFESSIONAL_TRANSITION_UNTIL` and `PROFESSIONAL_VERIFICATION_MODE` grant nothing in **any** code version, #7 included. If set, they are ignored and logged. They must still be removed from Vercel (checklist item B), so the configuration matches the code.
- **Who can change it:** only the owner adds rows, from the Supabase SQL editor. Users can read their own row, and nothing else.
- **No automatic entries:** a new account or a role switch never adds a row.
- **Each entry ends at `until`,** at most 90 days after it was added (a check constraint).
- **A listed account must also:**
  - declare itself a professional;
  - not be a patient account;
  - not be `rejected`. A rejection wins immediately.

Today (read-only, 12 Oct 2026):

| Item | Count |
|---|---|
| Accounts | 34: 32 declared professionals, 1 student, 1 linked patient |
| Verified accounts | 0 |
| Patients | 18, owned by 13 accounts |
| Accounts with notes | 2 |
| Appointments | 1 |
| Video calls | 4 |
| Open invitations | 0 |

### How to populate it

1. Find the candidates with this read-only query:
   ```sql
   select p.id, u.email, u.created_at,
          (select count(*) from patients x where x.user_id = p.id) as patients
   from profiles p join auth.users u on u.id = p.id
   where p.practice_stage = 'professional'
     and u.created_at < '2026-10-13'
     and not exists (select 1 from patients x where x.patient_user_id = p.id)
   order by patients desc, u.created_at;
   ```
2. Add only the accounts you know are real clinicians, one statement per account. Keep the ids out of GitHub and chat.
   ```sql
   insert into professional_transition_accounts (user_id, until, added_by, note)
   values ('<id>', now() + interval '60 days', 'owner', 'pre-existing clinician');
   ```
3. To remove an account immediately, do either of these. Neither needs a redeploy.
   - reject it on `/dashboard/verification-admin`;
   - run `delete from professional_transition_accounts where user_id = '<id>';`
4. To end the transition, run `delete from professional_transition_accounts;`, or let the dates pass.

## Release checklist

Complete items A–D **before step 6** of the SQL sequence. Item E follows the deploy.

**A. `PHYGO_ADMIN_EMAILS` in Production**
- [ ] Open Vercel → Project → Settings → Environment Variables, filtered on **Production**.
- [ ] The value contains **only** the authorised administrator's email, exactly as registered (one address, no typos, no extra addresses).
- [ ] Preview and Development do not hold the production value. If Preview needs an administrator, use a separate test account.
- [ ] In Supabase, that email belongs to an existing account whose email is confirmed. The owner's account was checked on 12 Oct 2026 (exists, confirmed); the Vercel value itself must be confirmed by the owner.
- [ ] If the variable is empty or wrong, nobody can review requests (fail closed). Fix it before the deploy.

**B. Old transition variables removed**
- [ ] `PROFESSIONAL_TRANSITION_ACCOUNTS`, `PROFESSIONAL_TRANSITION_UNTIL` and `PROFESSIONAL_VERIFICATION_MODE` are **absent** in Production (and in Preview and Development).
- [ ] No code version uses them (tested: a valid old list plus `grace` grants nothing, in #7 and #8). Removing them keeps the configuration honest and avoids confusion.

**C. Manual review of the transition list** (before step 6)
- [ ] Run the candidate query (above) and go through **every** row personally.
- [ ] Add an account only if all of these hold:
  - you know the person and that they practise as a physiotherapist;
  - the email belongs to them;
  - they have real use (patients or notes) or a concrete reason to keep working during the review.
- [ ] If you can confirm someone on the official public register now, **verify them** on `/dashboard/verification-admin` instead of listing them.
- [ ] Do not add:
  - accounts you cannot identify;
  - test accounts;
  - students;
  - patient accounts;
  - accounts with no activity. These can request verification normally.
- [ ] Use `until` ≤ 60 days, `added_by` = your name, and a `note` saying why the account was kept.
- [ ] After inserting, compare the table with your reviewed list using this read-only query:
  ```sql
  select u.email, t.until, t.added_by, t.note
  from professional_transition_accounts t join auth.users u on u.id = t.user_id
  order by u.email;
  ```
- [ ] Keep ids and emails out of GitHub, PRs and chat.

**D. No production secrets in Preview**
- [ ] Preview uses its own values, or none. Nothing is copied from Production.

**E. After the deploy (smoke test)**
- [ ] The administrator opens `/dashboard/verification-admin` and the list loads.
- [ ] A non-admin test account gets "forbidden" there.
- [ ] As a verified or listed account, and as an unlisted test account, try: one note, one scan, one video call, one appointment, one invitation, and one delete. The unlisted account must be refused each time.

## SQL file versions (checksums)

Apply each file in the Supabase SQL editor, one at a time, in the order given under "Exactly which SQL, in which order". Each file is a single transaction and can be re-run safely.

**Use these exact file versions.** They are the versions on PR #8's branch, and after the merges on `main`. The same versions are now also on PR #5's and PR #7's branches (byte-identical):
- the PR #5 files contain the **guarded rollback blocks**, which refuse to run once #7/#8 are applied;
- the PR #7 file's rollback removes rejected accounts from the transition list first.

Before pasting a file into the SQL editor, you can check it on your Mac with `shasum -a 256 <file>`:

| File | SHA-256 |
|---|---|
| `sql/2026-10_security_profile_privileged_columns_PROPOSED.sql` | `a32b5689f859c2bde1d342df4b5d58d2cd1092c2a52389f50fa48d5eafd5f813` |
| `sql/2026-10_security_clinical_rls_hardening_PROPOSED.sql` | `72010012c78a5d5c3c880c8f05dd9174a45da21356a12ddbfe6cd2d6ca24083f` |
| `sql/2026-10_professional_verification_PROPOSED.sql` | `9581dcfec095906c6f0bd3178ec987d9250c1d924e8702bf069030a822e2c26a` |
| `sql/2026-10_patient_management_A_transition_list_PROPOSED.sql` | `1ce386f64585a9f9007288c1ef5a1cd5cf7aae7b4acf7e71045aa97d60e7a72a` |
| `sql/2026-10_patient_management_B_policies_PROPOSED.sql` | `1f732a5aad9a5c3e944d95443eceada5e5e806cdf116f39ecfa9f67b47660d70` |
| `sql/2026-10_security_demo_usage_policies_PROPOSED.sql` | `3f0c6f26d2569784601c63a683fdcc77a48128c267477d6b33697859437ae599` |
| `sql/2026-10_patient_management_R_freeze_PROPOSED.sql` (emergency only) | `ab13dabed7c3d80a23c51eb57e1a50eda574308a8aa9149ce21fb72305d6b7de` |

If a file changes after this table, the table must be updated in the same commit.

## Release states

Production deploys `main` automatically. The current code (`main` at `ca11624`) **is not protected by any SQL** for the API holes below. They exist today and end **only when the corrected code is live**. The database rules (RLS) protect browser writes; the API holes come from service-role routes and from routes without authentication.

What an **unverified, unlisted account** can do in each state. Also shown: what a visitor with no account can do.

| | Code | Database | Other clinicians' patients | Own patients (browser writes) | Clinical AI | Video (Daily rooms) |
|---|---|---|---|---|---|---|
| **S1: today** | current `main` | live | **Yes:** read/write metabolic data of any patient by id (`/api/metabolic/save`, service role), incl. entries the patient kept private; write notes onto their patients; link any account as "own patient" | **Yes:** create, change, delete everything, incl. video-call rows pointing to any URL | **Yes, even without an account:** 6 routes; Ask PHYGO with no working limit | **Yes, even without an account:** creates Daily rooms |
| **S2: after SQL 1–4** | current `main` | + profile protection, clinical RLS, verification, Part A | **Yes, via the API only:** metabolic data by id. Notes on others' patients and linking are **closed** | **Yes** (no Part B yet) | **Yes, even without an account** | **Yes, even without an account** |
| **S2+B: after the list and Part B** (recommended intermediate) | current `main` | + list + Part B | **Yes, via the API only:** metabolic data by id (service role bypasses RLS) | **No:** read-only. Metabolic writes through the current API are still possible, because the service role bypasses RLS | **Yes, even without an account** | **Yes, even without an account** |
| S3: corrected code, no Part B (**not recommended**) | #5+#7+#8 | SQL 1–4 | **No** | **Yes:** create, change, delete, incl. video-call rows to any URL. Metabolic data via the API: **no** | **No** (verified or listed only) | **No** |
| **S4: target** | #5+#7+#8 | all | **No** | **No**: read-only | **No** | **No** |

**Evidence**
- **API holes in S1, S2 and S2+B:** the security tests run against the code of `main` fail on 10 of 12 checks. That covers anonymous AI and video, Ask PHYGO limits, the metabolic IDOR, private entries, and fail-open limits.
- **Database capabilities** in every state are checked step by step by `tests/sql/release_sequence.sh`.
- **S3 and S4 code behaviour** is covered by the integration tests on the PR branches.

### Chosen sequence: Part B first, then the deploy, immediately

- **The API holes last until the deploy, whatever the order.** No SQL closes them, because they come from the service role and from routes without authentication.
- **Part B only adds protection.** Applied before the deploy, it closes browser writes earlier. Applied after, it leaves state S3 open for the time between deploy and Part B.
- **So "Part B first, then the deploy" is never more exposed than the reverse.** At every moment its exposure is the same or smaller. S2+B is strictly less exposed than S1 and S2, and the target S4 follows.
- **There is still a window.** From now until the corrected code is live, the S1/S2 API holes remain open. The release cannot remove that window; it can only shorten it. Do the steps below without pauses, and do not start the release window until everything is ready.

**Temporary extra protections, assessed:**

| Option | What it does | Assessment |
|---|---|---|
| A database trigger blocking metabolic writes to other clinicians' patients | Closes only the *write* half of the metabolic IDOR in S2 | Does not close reads, AI or video; adds a new permanent object for a window of minutes. **Not recommended** |
| Removing `OPENAI_API_KEY` / `DAILY_API_KEY` from Production | Stops paid abuse | Breaks AI and video for everyone, and needs a redeploy anyway. If you can redeploy, deploy the fix. **Only if abuse is seen now, together with rotating the keys** |
| Applying `demo_usage` SQL early | — | **Harmful before the deploy:** the current demo code treats an unreadable counter as "allowed", so anonymous generate-note would lose even its per-IP limit. It stays after the deploy |
| **Vercel: build the production deployment first, then make it live** (only if your plan offers it; check whether automatic assignment of the production domain can be turned off) | The new build is ready before Part B, and making it live takes seconds | **Best, if available.** It shortens S2+B to seconds and removes the risk that the build fails after Part B. It is a Vercel setting the owner must check and change; it was not verified here |
| Applying SQL 1–2 **now**, ahead of the release window | Closes notes on other clinicians' patients, patient re-linking and self-upgrade today | **Recommended if you approve it.** It is tested with the current code (all legitimate flows keep working). It does not touch the API holes |

### If the deploy fails or stays pending
- **Build fails, or is queued or building:** Vercel keeps the current deployment live until a new one is Ready. You stay in **S2+B**:
  - patient browser writes are protected;
  - the API holes are the same as today.
- **Do not revert the SQL:** S2+B is strictly better than S1 and S2. Fix the build and redeploy.
- **If the deploy cannot be completed the same day:** stay in S2+B and keep watching OpenAI and Daily usage. If you see abuse, rotate the keys.
- **The deploy is live but the application misbehaves:** prefer fixing forward.
  - Vercel "Instant Rollback" to the previous deployment returns to the **current code with the new database**, which is state S2+B. Patient writes stay protected, but the API holes reopen.
  - Use it only if the new deployment is unusable and no fix can ship quickly.
- **Part B fails in the SQL editor:** the transaction is rolled back and nothing changes. **Do not deploy.** Investigate, re-run Part B, and deploy only after its check query returns `true`.

## Exactly which SQL, in which order

Each check query is read-only and must return **`true`** before you move on. The same queries are executed by `tests/sql/release_sequence.sh`: before their step they return `false`, after it they return `true`.

**Preparation (no production change)**
- Checklist A–D done.
- The merges **#8 → #7's branch** and **#7 → #5's branch** done; these do not deploy production.
- PR #5 ready to merge into `main`. `main` is still `ca11624`, an ancestor of #8, so the merge brings exactly the tested code.

**Step 1.** Apply `sql/2026-10_security_profile_privileged_columns_PROPOSED.sql`. *Can also be applied earlier, see above.*

<!-- check after=1 -->
```sql
select exists (select 1 from pg_trigger where tgname = 'profiles_protect_privileged_columns');
```

**Step 2.** Apply `sql/2026-10_security_clinical_rls_hardening_PROPOSED.sql`. *Can also be applied earlier.*

<!-- check after=2 -->
```sql
select exists (select 1 from pg_trigger where tgname = 'patients_protect_links')
   and exists (select 1 from pg_policies where tablename = 'notes'
               and policyname = 'Users can insert their own notes' and with_check like '%patients%');
```

**Step 3.** Apply `sql/2026-10_professional_verification_PROPOSED.sql`. From here, the current profile page cannot *change* a registration number; nobody has one today.

<!-- check after=3 -->
```sql
select exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'profiles' and column_name = 'registry_country')
   and pg_get_constraintdef((select oid from pg_constraint where conname = 'profiles_professional_status_check')) like '%rejected%';
```

**Step 4.** Apply `sql/2026-10_patient_management_A_transition_list_PROPOSED.sql`. It adds a table and a function and changes nothing else.

<!-- check after=4 -->
```sql
select to_regclass('public.professional_transition_accounts') is not null
   and to_regprocedure('public.can_manage_patients()') is not null;
```

**Step 5.** Fill the transition list after the manual review (checklist C). Then:
- check that the list is not empty;
- review who will become **read-only**: accounts that own patients and are neither verified nor listed. Each one must be a deliberate decision.

<!-- check after=5 -->
```sql
select count(*) > 0 from professional_transition_accounts where until > now();
```
```sql
-- Review (not a check): accounts that own patients and will become read-only at step 6.
select u.email, count(*) as patients
from patients x join auth.users u on u.id = x.user_id join profiles p on p.id = x.user_id
where p.professional_status <> 'verified'
  and not exists (select 1 from professional_transition_accounts t where t.user_id = x.user_id and t.until > now())
group by u.email order by patients desc;
```

**Step 6.** Apply `sql/2026-10_patient_management_B_policies_PROPOSED.sql`. State **S2+B**. Go straight to step 7.

<!-- check after=6 -->
```sql
select count(*) = 18 from pg_policies
where schemaname = 'public'
  and (coalesce(qual, '') like '%can_manage_patients%' or coalesce(with_check, '') like '%can_manage_patients%');
```

**Step 7. Deploy.** Merge PR #5 into `main`; production deploys automatically.
- Wait until the deployment is **Ready** and serving the production domain.
- With the optional Vercel setting, build first and promote here.
- State **S4**. If the deploy fails or stays pending, see above.

**Step 8.** Apply `sql/2026-10_security_demo_usage_policies_PROPOSED.sql` (only now; see "Applying `demo_usage` SQL early" above).

<!-- check after=8 -->
```sql
select not exists (select 1 from pg_policies where tablename = 'demo_usage' and 'anon' = any (roles));
```

**Step 9.** Checklist E (smoke test). Repeat the security spot checks against production:
- anonymous calls to an AI route get 401;
- an unlisted account gets 403 `verification_required`;
- metabolic data of another clinician's patient gets 404.

Then review the verification requests.

**Other notes**
- **Not part of the release:** `sql/2026-10_patient_management_R_freeze_PROPOSED.sql` is for emergencies only (see Rollback).
- **PR #6** (exercise library) is independent and can go before or after.

## Rollback that never reopens access

**Safety floor:** once steps 1–6 are applied, the **database** protects patient data whatever the application code does. Every rollback below keeps steps 1–6 in place.

| Problem | What to do | Takes effect |
|---|---|---|
| The wrong person has access | Reject them in the admin page, or `delete from professional_transition_accounts where user_id = '<id>'` | Immediately |
| A legitimate clinician is blocked | Add them to the list, or approve them | Immediately |
| Suspected over-permission in the patient rules (emergency stop) | Apply `sql/2026-10_patient_management_R_freeze_PROPOSED.sql` | Immediately |
| The application misbehaves after the deploy | Roll the **code** back (Vercel) only to a deployment that contains **PR #7 or later**, or fix forward | Next deployment |

**What the emergency stop (freeze) does:**
- every browser create, change or delete on patient tables is refused, **for everyone**, verified clinicians included;
- clinicians still read their own records;
- patients keep My Phygo, appointment requests and invitation redemption;
- the server routes (clinical AI, video, metabolic data) keep their own check: verified or listed only;
- to undo it, re-run Part A (step 4). The list is untouched.

**Why a code rollback to PR #7 is safe:**
- Under #7's code, every patient write still goes through the step 6 rules.
- The only service-role write of patient data (`/api/metabolic/save`) now requires verification in #7 too. It was added to #7 for this reason.
- **In practice:** the first release ships #5, #7 and #8 together, so production has no "#7 only" deployment to return to. Every earlier production deployment predates #5. Until a later safe release exists, a code problem means fixing forward, or deploying a revert of the #8 code commits, which leaves #7's code.
- **Last resort:** Vercel "Instant Rollback" to the previous deployment brings back today's code on top of the new database, which is state **S2+B** (see Release states):
  - patient browser writes stay protected;
  - the API holes (anonymous AI and video, metabolic data by id) are open again.

  It is not safe; use it only if the new deployment is unusable and no fix can ship quickly, and keep the time short.
- **No transition in #7's code:** it grants no temporary access at all; the old environment variables are ignored, as tested. After a code rollback to #7, clinical AI and video are verified-only. Listed accounts keep patient management through the database list. That is the safe direction, and it does not depend on what is left in Vercel.

**Never do these.** The SQL refuses the first four:

| Action | Why it is dangerous | Guard |
|---|---|---|
| Run PR #5's profile-protection rollback after #7/#8 | Users could mark themselves verified | Refuses with an error |
| Run PR #5's clinical-RLS rollback after #8 | It would overwrite #8's notes rules and reopen patient linking | Refuses with an error |
| Run Part A's rollback block after Part B | It would remove the function the patient rules depend on | Refuses with an error |
| `drop function can_manage_patients()` | — | PostgreSQL refuses while the rules use it |
| `drop function can_manage_patients() ... CASCADE` | It removes the rules | Not refused: never use it |
| Return the patient rules to the PR #5 version | It lets any signed-in account manage patient data | Not provided on purpose |
| Roll the code back to a deployment older than PR #7 | Clinical AI for declared professionals | — |
| Roll the code back to a deployment older than PR #5 | Paid AI and video rooms for anonymous visitors, and metabolic data by id (state S2+B) | — (last resort only, see above) |

**Verification SQL rollback (step 3):**
- only for an aborted release before the deploy, because the deployed code writes its columns;
- it restores the PR #5 trigger instead of dropping it;
- it first removes rejected accounts from the transition list, so that mapping `rejected` back to `not_applicable` cannot give them access again;
- it leaves the step 6 rules in place.

All of the above is executed in `tests/sql/run.sh`.
