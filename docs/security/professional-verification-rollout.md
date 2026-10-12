# Professional verification: rollout, transition and rollback

This guide covers three PRs:
- **PR #5 (security):** its SQL is what the other two build on.
- **PR #7 (professional verification):** stacked on #5.
- **PR #8 (patient management):** stacked on #7.

> **Released on 12 Oct 2026.** Steps 1–10 below were completed in production, with the owner's approval.
>
> - **Code:** PR #5 (with #7 and #8) merged into `main` as `71586f1`. Production deployment `dpl_CBCQv4DdiWm623YKNxjbSw66weWT`, Ready on `phygo.vercel.app`. PR #9 (cancel appointment) followed as `99c365d`.
> - **Database:**
>   - the six SQL files were applied from the SQL editor, in the order of this guide, as the exact versions listed under "SQL file versions (checksums)";
>   - check queries 1, 2, 3, 4, 4b, 7 and 9 all returned `true`.
> - **Migration history:** the same six files are recorded in Supabase's migration history, with their exact text (checksums identical):
>
>   | Version | Name |
>   |---|---|
>   | `20261012181100` | `security_profile_privileged_columns` |
>   | `20261012181300` | `security_clinical_rls_hardening` |
>   | `20261012181500` | `professional_verification` |
>   | `20261012181700` | `patient_management_a_transition_list` |
>   | `20261012182100` | `patient_management_b_policies` |
>   | `20261012182600` | `security_demo_usage_policies` |
>
>   The versions are approximate times; nothing was re-run to record them.
> - **Transition list:** one entry, the owner's account, until 11 Dec 2026 (step 4b). The owner's official verification is to be completed before that date.
> - **Step 8 check:** an anonymous `GET /api/profile/verification` answered `401`.
> - **Smoke test (step 10):**
>   - **anonymous call to an AI route:** `401`;
>   - **owner:** the verification console loads, and an appointment was created on an own patient;
>   - **unverified, unlisted test account:**
>     - "Admin access required" on the console;
>     - verification notice shown, and "New patient" disabled.
>
>   The metabolic 404 for another clinician's patient is covered by the automated tests only.
> - **Not part of the release:**
>   - the freeze file was not applied;
>   - the stored IP row in `demo_usage` was not part of the SQL file; the owner deleted it separately on 12 Oct 2026 (data minimisation), and the table is now empty;
>   - video calls stay unavailable until `DAILY_API_KEY` is set in Production.
>
> The `PROPOSED - NOT APPLIED` headers inside the SQL files are historical. The files were applied exactly as they are, and they are kept unchanged so that their checksums keep matching what was applied and recorded.

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

**Outcome of the review of 12 Oct 2026 (checklist C):** only the owner's account is listed. The other 31 declared professionals were judged test accounts and are not listed. They keep read access to their existing data and can request verification normally.

1. **The owner's account: step 4b**, before the merge (see "The owner's account" below). The script is in step 4b.
2. **Any other reviewed account:** use this all-or-nothing script at step 6.
   - Put the approved emails in `approved` and your name in `reviewer`.
   - If even one email is wrong, already listed, a student, a patient or rejected, **nothing** is saved and the error says so. Fix the list and run it again.
   - Keep the emails out of GitHub and chat.

   <!-- list-insert -->
   ```sql
   do $$
   declare
     approved text[] := array[
       'email-approvata-1@esempio.it',
       'email-approvata-2@esempio.it'
     ];
     reviewer text := 'IL TUO NOME';
     inserted int;
   begin
     insert into professional_transition_accounts (user_id, until, added_by, note)
     select p.id, now() + interval '60 days', reviewer, 'pre-existing clinician, reviewed ' || current_date
     from auth.users u
     join profiles p on p.id = u.id
     where lower(u.email) in (select lower(trim(e)) from unnest(approved) e)
       and p.practice_stage = 'professional'
       and p.professional_status <> 'rejected'
       and not exists (select 1 from patients x where x.patient_user_id = p.id)
     on conflict (user_id) do nothing;
     get diagnostics inserted = row_count;
     if inserted <> cardinality(approved) then
       raise exception 'Inserted % of % approved accounts: NOTHING was saved. Check the emails (typo, student, patient, rejected, or already listed).', inserted, cardinality(approved);
     end if;
   end $$;
   ```
3. **To remove an account immediately,** do either of these. Neither needs a redeploy.
   - reject it on `/dashboard/verification-admin`;
   - run `delete from professional_transition_accounts where user_id = '<id>';`
4. **To end the transition,** run `delete from professional_transition_accounts;`, or let the dates pass.

### The owner's account

The owner is a physiotherapist and PHYGO's only administrator. The account must keep every professional function through the release. Today it is **not verified** (`not_applicable`), like every account.

**Two separate permissions; neither implies the other:**

| What | Granted by |
|---|---|
| Administration: verification console, library editing, events, science review | `PHYGO_ADMIN_EMAILS` (Production) + confirmed email. Independent of the professional status and of the list. These routes touch profiles, library, events and science tables only; never patients or notes. |
| Clinical functions on the owner's **own** patients: create, edit or delete patients, notes (exercise programs are saved in notes), appointments, invitations, video calls, library links; clinical AI and document generation; video rooms; metabolic data on a patient | **verified, or listed** (`can_manage_patients()` in the database; `requireVerifiedProfessional` on the server) |
| Reading own patients and notes; exercise library, protocols, clinical tools, Ask PHYGO, workspace | any signed-in account |

So being the administrator never opens clinical data, and no general bypass is added: the owner's access goes through the same list and the same rules as everyone else, and covers **only the owner's own patients**.

**How the access stays continuous:**
1. **Step 4b, before the merge:** the owner's row is inserted for 60 days. The current code ignores the table, so this changes nothing yet.
2. **Do not merge** until the step 4b check returns `true` and the review query shows the row.
3. When the new code goes live (step 8) and when Part B is applied (step 7), the row is already there: no interruption, in either order.

**Official verification, within the 60 days** (after the release):
1. On the profile page, submit country, register and registration number. The status becomes `pending`, and the listed access continues (`pending` + listed is allowed; tested).
2. Check the number on the **official public register** of the profession.
3. Approve the request on `/dashboard/verification-admin`. The console records the reviewer's email. The code does not stop an administrator from approving their own account: this approval is the owner's self-certification against the official register.
4. Check that the profile shows **verified**. Then the list row is no longer needed; you can delete it or let it expire. A verified account does not even read the list, so a temporary failure to read it no longer affects the owner.

**Risks that remain:**
- **Never choose "Rejected" on your own account.** A rejection wins over the list immediately.
- **If the list cannot be read** (for example a Supabase error), the new code refuses every unverified account with 503, the owner included, until verification is done. This is fail-closed by design.
- **When the row expires** (60 days), access to clinical functions stops unless the account is verified. To extend, delete the row and insert a new one: a row can last at most 90 days from when it was added.

## Release checklist

Complete items A–D and F, including the review and preparation of the transition list, **before step 1** of the SQL sequence. Item E follows the deploy.

**A. `PHYGO_ADMIN_EMAILS` in Production**
- [x] Open Vercel → Project → Settings → Environment Variables, filtered on **Production**.
- [x] The value contains **only** the authorised administrator's email, exactly as registered (one address, no typos, no extra addresses).
- [x] Preview and Development do not hold the production value. If Preview needs an administrator, use a separate test account. *(It is assigned to Production only.)*
- [x] In Supabase, that email belongs to an existing account whose email is confirmed. The owner's account was checked on 12 Oct 2026 (exists, confirmed).
- [x] Checked on 12 Oct 2026 (read-only, value not copied anywhere): the Production value is exactly one address, the owner's account email, with no extra spaces; it is set for Production only.
- [x] If the variable is empty or wrong, nobody can review requests (fail closed). Fix it before the deploy. *(It is correct.)*

**B. Old transition variables removed**
- [x] `PROFESSIONAL_TRANSITION_ACCOUNTS`, `PROFESSIONAL_TRANSITION_UNTIL` and `PROFESSIONAL_VERIFICATION_MODE` are **absent** in Production (and in Preview and Development). *(Vercel connector, 12 Oct 2026.)*
- [x] No code version uses them (tested: a valid old list plus `grace` grants nothing, in #7 and #8). Removing them keeps the configuration honest and avoids confusion.

**C. Manual review of the transition list** (before the release window; the owner's row is pasted at step 4b, any other reviewed accounts at step 6)
- [x] Run the candidate query (above) and go through **every** row personally.
- [x] Add an account only if all of these hold:
  - you know the person and that they practise as a physiotherapist;
  - the email belongs to them;
  - they have real use (patients or notes) or a concrete reason to keep working during the review.
- [x] If you can confirm someone on the official public register now, **verify them** on `/dashboard/verification-admin` instead of listing them.
- [x] Do not add:
  - accounts you cannot identify;
  - test accounts;
  - students;
  - patient accounts;
  - accounts with no activity. These can request verification normally.
- [x] Use `until` ≤ 60 days, `added_by` = your name, and a `note` saying why the account was kept.
- [ ] After inserting, compare the table with your reviewed list using this read-only query:
  <!-- list-review -->
  ```sql
  select u.email,
    t.until::date as scadenza,
    t.added_by,
    t.note
    from professional_transition_accounts t
    join auth.users u on u.id = t.user_id
    order by u.email;
  ```
- [x] Done on 12 Oct 2026: only the owner's account is to be listed (step 4b). No other account.
- [ ] Keep ids and emails out of GitHub, PRs and chat.

**F. Vercel checks** (see "Vercel: what is known, and what the owner must check")
- [x] The cause of the Preview failure has been read in the build logs and is the missing-variables case. Anything else stops the release. *(Vercel connector, 12 Oct 2026: PR #5, #7 and #8.)*
- [x] The latest Production deployment of `main` is **Ready** and current. *(Vercel connector, 12 Oct 2026: `ca11624`. Look again on the day of the release.)*
- [x] The required variables exist for Production (names only). *(Vercel connector, 12 Oct 2026.)*

**D. No production secrets in Preview**
- [x] Preview uses its own values, or none. Nothing is copied from Production. *(Preview has none.)*
- [x] **Project variables**, checked read-only on 12 Oct 2026 (names and environments only, no values): all 6 variables (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `PHYGO_ADMIN_EMAILS`) are assigned to **Production only**. None is in Preview or Development. There are no custom environments and no branch-specific Preview variables. `DAILY_API_KEY`, `PHYGO_ADMIN_API_TOKEN` and email-service credentials are not set in any environment. The code reads no email credentials: sign-in emails are sent by Supabase.
- [x] **Shared variables**, checked manually by the owner in the Vercel dashboard on 12 Oct 2026: project **phygo** → Settings → Environment Variables → **Shared** shows "No shared variables linked"; the **Project** tab shows the six variables above, assigned to Production only. A team-level shared variable reaches a project only if it is linked to it, so none reaches PHYGO's Preview. (The Vercel connector cannot list shared variables; this part could only be checked in the dashboard.)
- [x] **D passed on 12 Oct 2026.** No production secret is available to Preview, from the project or from the team. Repeat it if variables are added or linked before the release.

**E. After the deploy (smoke test)**
- [ ] The administrator opens `/dashboard/verification-admin` and the list loads.
- [ ] The owner, listed at step 4b, creates a note and an appointment on one of their **own** patients. Video call: only if `DAILY_API_KEY` is configured; otherwise the expected answer is "Video calls are not configured" (see "Known limitation: video calls").
- [ ] A non-admin test account gets "forbidden" there.
- [ ] As a verified or listed account, and as an unlisted test account, try: one note, one scan, one video call, one appointment, one invitation, and one delete. The unlisted account must be refused each time. While `DAILY_API_KEY` is absent, the listed or verified account gets "Video calls are not configured" for the video call; the unlisted account must still get 403 first.

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

Production deploys `main` automatically. The release combines two independent changes:
- the **code** (API routes);
- the **database** rules (RLS, which govern writes made directly from the browser to Supabase).

What an **unverified, unlisted account** can do in each state. Also shown: what a visitor with no account can do.

| State | Code | Database | Other clinicians' patients | Own patients: direct browser writes | Clinical AI | Video (Daily rooms) |
|---|---|---|---|---|---|---|
| **S1: today** | current `main` | live | **Yes:** metabolic data of any patient by id, read and write (service-role API); notes onto their patients; link any account as "own patient" | **Yes:** create, change, delete everything, incl. video-call rows pointing to any URL | **Yes, even without an account** (6 routes, plus Ask PHYGO without a working limit) | **Yes, even without an account** |
| **S2: after SQL 1–4** | current `main` | + profile protection, clinical RLS, verification, Part A | **Yes, via the API only:** metabolic data by id. Notes and linking are **closed** | **Yes** | **Yes, even without an account** | **Yes, even without an account** |
| **S2+B: SQL incl. Part B, current code** | current `main` | + list + Part B | **Yes, via the API only:** metabolic data by id | **No** (read-only), except metabolic writes through the current API | **Yes, even without an account** | **Yes, even without an account** |
| **S3: corrected code, without Part B** | #5+#7+#8 | SQL 1–4 | **No** | **Yes:** create, change, delete own patients and their records; invitations; video-call rows to any URL. Metabolic writes through the API: **no** | **No** (verified or listed only) | **No** |
| **S4: target** | #5+#7+#8 | all | **No** | **No** (read-only) | **No** | **No** |

**Evidence (executable)**

| What | Test |
|---|---|
| API half of S1, S2 and S2+B (current code) | `bash tests/release_states_old.sh`: all 9 risky capabilities **open** |
| API half of S3 and S4 (new code) | `tests/release_states.test.mjs`, part of `bash tests/run.sh`: all 9 **closed**, own-patient metabolic reads open by design |
| Database half of every state, including direct Supabase writes on own patients, and the failure scenarios | `bash tests/sql/release_sequence.sh` |

**Test isolation.** In every Node process of these tests (the app, its workers and the test runner), `fetch` and every TCP/TLS connection to a non-loopback host are refused and logged before any name lookup, and no proxy variable is passed. `tests/network-guard.test.mjs` proves this for fetch, http, https, net and tls, using only addresses that can never reach a real service.
- **Documented limits** (in `tests/support/no-external-network.cjs`): explicit `node:dns` lookups, UDP, non-Node child processes, and the build step, which downloads Google Fonts.
- **Daily:** the current code's hard-coded Daily URL is attempted and blocked.

**Ordering of the states**
- **S2 ⊂ S1:** SQL 1–4 only close things.
- **S2+B ⊂ S2 and S3 ⊂ S2:** each closes one of S2's two exposures.
- **S4 ⊂ all.**
- **S2+B and S3 are not comparable:** each leaves open a different exposure.

### Comparing the two exposures

| | API exposure (S2+B: current code) | Browser-write exposure (S3: no Part B) |
|---|---|---|
| Who can use it | **Anyone, without an account** (AI, video, Ask PHYGO); any signed-in non-patient account (metabolic API) | Any signed-in account; signing up is free and the role defaults to "professional" |
| Whose data | **Any patient's** metabolic data, given its id (read and write); writes also add clinical links the patient sees in My Phygo | **Only patients the account itself owns**; nothing of other clinicians |
| What it costs or harms | Paid OpenAI and Daily usage, with no account and no limit; confidentiality and integrity of health data across clinicians | Unverified clinical records; an invitation sent to a real person who accepts it; a video-call link pointing elsewhere. All of this needs the attacker to recruit the patient first (social engineering) |
| How easy | Trivial for AI and video (one request). The metabolic path needs a patient id: random UUIDs, never shown to other accounts by the app, so only a leaked id works | Easy for one's own records; harming a third party takes several steps and the victim's cooperation |
| Status today | Exists today (S1) | Exists today (S1), and it is how the 13 existing clinicians work now |

**Assessment:** the API exposure is the **more severe** one.
- It is reachable without an account, it costs money per request, and it is the only path to **other clinicians'** patients.
- The browser-write exposure stays inside the account's own records and needs social engineering to reach anyone else.

Both exist today. The release must close both; the order decides which closes first.

### Chosen sequence: start the deploy right after SQL 1–4, apply the list and Part B during the build

- **The API exposure ends only when the corrected code is live.** No SQL can close it. So the deploy should **not wait** for anything that is not a technical prerequisite.
- **Part B and the list are not prerequisites of the code.** They can go in while the build runs. The new code works with or without Part B; listed accounts simply get AI access once the list exists.
- **SQL 1–4 *are* prerequisites, so they come before the merge:**
  - without step 1, the new code would accept a self-set `verified` status;
  - without step 3, the verification request cannot be stored;
  - without step 4, unverified accounts get 503 instead of the transition rules.
- **The manual review of the list is done *before* the release window** (checklist C), and the insert statements are prepared in advance. In the window, steps 4b and 6 are pastes.
- **The owner's row goes in at step 4b, before the merge.** The current code ignores the table, so inserting early costs nothing, and the owner's access never depends on how fast the build is.

Resulting order:

| Step | What | State while it runs |
|---|---|---|
| 1–4 | SQL 1–4, a few minutes | S1 → **S2** |
| 4b | Owner's row on the list; do not merge until its check is `true` | S2 |
| 5 | Merge PR #5 into `main`: the production build starts; the current code stays live until the build is **Ready** | S2 |
| 6–7 | **During the build:** any other reviewed accounts (none after the 12 Oct review), then Part B | **S2+B** |
| 8 | The build becomes Ready and live | **S4** |
| 9 | `demo_usage` SQL, only now | S4 |

If the build is faster than steps 6–7, production passes briefly through **S3** instead of S2+B. Both are strictly better than S2, and both end at S4 a few minutes later.

**The remaining risk window is real.** The API exposure lasts from now until the build is live: the time until the release, plus the 1–4 SQL steps and the build. The browser-write exposure lasts until Part B. The plan shortens both windows; it cannot remove them. Applying SQL 1–2 **earlier**, on approval, closes notes on other clinicians' patients, re-linking and self-upgrade today. They are safe with the current code, as tested.

**Optional, if your Vercel plan offers it:** with automatic assignment of the production domain turned off, you can build first, then run SQL 1–7, then promote. That shrinks every window to seconds. This was not verified here; the owner must check it.

### Scenarios and recovery (never back to code older than #5)

| Scenario | State reached | What stays open | Recovery |
|---|---|---|---|
| **Deploy succeeds** (normal case) | S4 | Nothing of the above; own-patient reads by design | Step 9, smoke test |
| **Deploy fails or stays pending** (build error, queued, building) | S2+B: Vercel keeps the current code live | The API exposure only (as today); browser writes closed | Keep the SQL. Fix the build and deploy again. If it cannot be fixed the same day, watch OpenAI and Daily usage and rotate the keys if abused. Do not run step 9 |
| **Part B fails** (error in the SQL editor; its transaction is rolled back) | S3 once the deploy is live (S2 before) | Own-patient browser writes only; the API is protected by the new code | **Let the deploy go live**: S3 is strictly better than S2. Read the error, fix the cause, re-run Part B. Do not roll the code back |
| **Deploy live, application misbehaves** | S4 | — | Fix forward. Instant Rollback to the previous deployment would return to the current code on the S2+B database: the API exposure would reopen, so use it only as a last resort |

## Known limitation: video calls

- **`DAILY_API_KEY` is not set** for PHYGO in any environment: not among the project's variables (Vercel connector), and no shared variable is linked to the project (dashboard, owner). Checked 12 Oct 2026.
- **So video calls are not configured.** This is a **known functional limitation** of the release, not a security issue. The new code answers `503 Video calls are not configured` and makes no call to Daily. Everything else works without it.
- **To enable video calls later:** add `DAILY_API_KEY` to **Production only**. This is a separate Vercel change and needs the owner's explicit approval. It is not part of this release.

## Vercel: what was checked, and how

Vercel access was added during the preparation, on 12 Oct 2026. Two sources were used, and the guide says which one each result comes from.

**Through the Vercel connector** (read-only tools; no value read, except where stated):
- **Preview failures:** the build logs of the failed Preview deployments of PR #5, #7 and #8 stop at "Collecting page data" with `supabaseUrl is required`. That is the missing-variables case: Preview has no variables. It is not a code error.
- **Production:** the latest Production deployment of `main` (`ca11624`) is **Ready** and current. An earlier Production failure was caused by `CRON_SECRET` having spaces around its value; it was fixed and redeployed.
- **Project variables (names and environments only):** six, all assigned to **Production only**. No custom environments, no branch-specific Preview variables. `DAILY_API_KEY`, `PHYGO_ADMIN_API_TOKEN` and the old transition variables are absent.
- **One change, approved by the owner:** Preview was removed from `OPENAI_API_KEY`. Its value and its Production assignment were not touched.
- **`PHYGO_ADMIN_EMAILS`:** its value was read once, at the owner's request, only to compare it with the owner's account (it matches: one address, Production only). It was not copied anywhere.
- **Not possible with the connector:** listing team-level shared variables. The connector only offers a tool that returns a shared variable's decrypted value, by id, and it was not used.

**Checked manually by the owner in the Vercel dashboard:**
- **Shared variables:** project **phygo** → Settings → Environment Variables → **Shared** shows "No shared variables linked".
- **Project tab:** it shows the six variables, assigned to Production only, matching the connector.

**Before this access** (11–12 Oct), only GitHub was available. Every PR branch showed "Deployment has failed" since PR #1, with no error text in the bot comments. That is why the local reproduction below was made.

**Reproduced locally** (dummy values only, no real service):

| Build of | Environment | Result |
|---|---|---|
| `main` (`ca11624`) and PR #8 | no environment variables | fails, identically for both, at "collect page data" (`Missing credentials … OPENAI_API_KEY` / `supabaseUrl is required`) |
| `main` and PR #8 | the 4 core variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`) | passes, for both |
| `main` and PR #8 | without `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` | fails, for both |

The two versions have the same `.env.example` variable names. The only new variable the code reads is the optional, test-only `DAILY_API_BASE_URL`.

**What this proves:**
- PR #8 needs no build-time variable that `main` does not already need.
- A build without those variables fails exactly like the Preview builds.

**What it does not prove:**
- that the Preview failures have this cause;
- that the Production build will pass. Only Vercel's logs and a real build can show that (other causes exist: limits, Node version, settings).

**Owner checks, before the release window**

Items 1 and 2 were done through the connector on 12 Oct 2026 (see above). On the day of the release, look again at item 2: the latest Production deployment must still be Ready. Item 3 is still optional.

1. **Read the cause of a Preview failure.** Open Vercel → project **phygo** → **Deployments** → the failed Preview of PR #8 → **Build Logs**.

   | What the log shows | Meaning | Action |
   |---|---|---|
   | `Failed to collect page data` with `supabaseUrl is required` or `Missing credentials … OPENAI_API_KEY` | Environment variables missing in **Preview** | Not a code failure. To get working Previews, give Preview its **own non-production** values (a separate Supabase project); never copy Production secrets |
   | `Type error`, `Module not found`, `Failed to compile`, or anything else | A different problem | **Stop the release** and report the log text |

2. **Check that Production can build.**
   - In **Deployments**, filter on **Production**: the latest Production deployment, for `main` `ca11624`, should be **Ready** and current. If it is **Error**, production is already not deploying: fix that first.
   - In **Settings → Environment Variables**, the variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` and `PHYGO_ADMIN_EMAILS` must exist for **Production**. Check names only, not values.
   - If both hold, the release build has the same requirements as a build that already succeeds. It is still confirmed only by the real build at step 5.

3. **Optional:** check whether automatic assignment of the production domain can be turned off. That lets you build first and promote afterwards (see "Chosen sequence").

**Which checks are local and which depend on Vercel**

| Check | Where |
|---|---|
| SQL replica, release sequence, API state matrix (old and new code), network guard, builds with dummy variables | **Local**, in this repository's tests, no real services |
| Cause of the Preview failures; latest Production deployment Ready; project variables (names and environments) | **Vercel connector**, read-only (done 12 Oct 2026) |
| Shared variables linked to the project | **Vercel dashboard**, owner (done 12 Oct 2026) |
| Whether the new deployment is Ready and current, at step 8 | **Vercel dashboard** (owner) or the connector, read-only |
| Which code the production domain serves | The step 8 GET (owner, after the deploy) |

## Exactly which SQL, in which order

Each check query is read-only and must return **`true`** before you move on. The same queries are executed by `tests/sql/release_sequence.sh`: before their step they return `false`, after it they return `true`.

**Preparation (no production change)**
- Checklist A–D and F done (F: Vercel checks).
- **The transition list reviewed and its insert statements prepared** (checklist C).
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

**Step 4.** Apply `sql/2026-10_patient_management_A_transition_list_PROPOSED.sql`.

<!-- check after=4 -->
```sql
select to_regclass('public.professional_transition_accounts') is not null
   and to_regprocedure('public.can_manage_patients()') is not null;
```

**Step 4b. The owner's account on the list, before the merge.** In the script below, replace `SCRIVI-QUI-LA-TUA-EMAIL` with the owner's email (only in the SQL editor, never in GitHub). It inserts that one account for 60 days, or nothing.

<!-- owner-insert -->
```sql
do $$
declare
  my_email text := 'SCRIVI-QUI-LA-TUA-EMAIL';
  inserted int;
begin
  insert into professional_transition_accounts (user_id, until, added_by, note)
  select p.id, now() + interval '60 days', 'owner', 'PHYGO owner, physiotherapist; official verification to follow'
  from auth.users u
  join profiles p on p.id = u.id
  where lower(u.email) = lower(trim(my_email))
    and u.email_confirmed_at is not null
    and p.practice_stage = 'professional'
    and p.professional_status <> 'rejected'
    and not exists (select 1 from patients x where x.patient_user_id = p.id)
  on conflict (user_id) do nothing;
  get diagnostics inserted = row_count;
  if inserted <> 1 then
    raise exception 'NOTHING was saved: account not found, email not confirmed, not an eligible professional, or already listed.';
  end if;
end $$;
```

Then run the check below. In it, replace `SCRIVI-QUI-LA-TUA-EMAIL` with **the same email** used in the script. It looks at the owner's row only, whatever else is on the list: it returns `true` only if that row exists and ends more than 59 days from now. **If it is not `true`, do not merge.** The script saves nothing on error, so it can be corrected and run again. The review query of checklist C then shows the whole list.

<!-- check after=4b -->
```sql
select exists (
  select 1
    from professional_transition_accounts t
    join auth.users u on u.id = t.user_id
   where lower(u.email) = lower(trim('SCRIVI-QUI-LA-TUA-EMAIL'))
     and t.until > now() + interval '59 days'
);
```

**Step 5. Start the deploy.** Merge PR #5 into `main`. The production build starts, and the current code stays live until the build is Ready. Go straight to step 6.

**Step 6.** Insert any other reviewed accounts with the all-or-nothing script ("How to populate it"). After the 12 Oct review there are none: skip the insert. Then run the review query below: it shows who becomes read-only at step 7. The owner's account must **not** appear in it.

```sql
-- Review (not a check): accounts that own patients and will become read-only at step 7.
select u.email, count(*) as patients
from patients x join auth.users u on u.id = x.user_id join profiles p on p.id = x.user_id
where p.professional_status <> 'verified'
  and not exists (select 1 from professional_transition_accounts t where t.user_id = x.user_id and t.until > now())
group by u.email order by patients desc;
```

**Step 7.** Apply `sql/2026-10_patient_management_B_policies_PROPOSED.sql`. If it fails, see "Part B fails" above: let the deploy continue.

<!-- check after=7 -->
```sql
select count(*) = 18 from pg_policies
where schemaname = 'public'
  and (coalesce(qual, '') like '%can_manage_patients%' or coalesce(with_check, '') like '%can_manage_patients%');
```

**Step 8. Deploy live.** Confirm both of these:
1. **Vercel:** in **Deployments**, the deployment of the merge commit shows environment **Production**, status **Ready**, and is the **current** production deployment (production domain assigned).
2. **The live site answers like the new code.** This is one anonymous GET, with no side effect and no paid call:
   ```bash
   curl -s -o /dev/null -w '%{http_code}\n' https://<production-domain>/api/profile/verification
   ```
   - `401` means the new code is serving: state **S4**.
   - `404` means the current code is still serving.

   `<production-domain>` is the domain shown in Vercel; the code's `SITE_URL` is `https://phygo.vercel.app`. **Do not** use an AI route as the check: with the current code, an anonymous call to `/api/generate-note` would be a real paid request.

If the deployment fails or stays pending, see the scenarios above.

**Step 9.** Apply `sql/2026-10_security_demo_usage_policies_PROPOSED.sql`, only once the new code is live. The current demo code treats an unreadable counter as "allowed".

<!-- check after=9 -->
```sql
select not exists (select 1 from pg_policies where tablename = 'demo_usage' and 'anon' = any (roles));
```

**Step 10.** Checklist E (smoke test). Repeat the API spot checks against production:
- anonymous calls to an AI route get 401;
- an unlisted account gets 403 `verification_required`;
- metabolic data of another clinician's patient gets 404.

Then review the verification requests.

**Other notes**
- **Not part of the release:** `sql/2026-10_patient_management_R_freeze_PROPOSED.sql` is for emergencies only (see Rollback).
- **PR #6** (exercise library) is independent and can go before or after.

## Rollback that never reopens access

**Safety floor:** once steps 1–4, 6 and 7 are applied, the **database** protects patient data whatever the application code does. Every rollback below keeps those steps in place.

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
- Under #7's code, every patient write still goes through the step 7 rules (Part B).
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
- it leaves the Part B rules in place.

All of the above is executed in `tests/sql/run.sh`.
