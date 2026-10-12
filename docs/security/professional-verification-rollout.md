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
| **3. Real patients and their clinical information:** creating, changing and **deleting** patients, notes, appointments, invitations, video calls and clinical links; metabolic data on a patient; clinical AI on real cases | **Authorised clinicians:** verified by PHYGO, or listed on the owner's time-limited transition list | Database (`can_manage_patients()` in RLS) **and** API routes (`requireVerifiedProfessional`), applying the same rule |

The declared role (student / professional) is only a preference. It never grants permission 3.

## Permission matrix

| | Visitor | Student | Declared professional, not verified, not listed (incl. pending / needs info / rejected, new and self-promoted accounts) | Listed pre-existing account, until its end date | Verified professional | Patient |
|---|---|---|---|---|---|---|
| Public resources | yes | yes | yes | yes | yes | yes |
| Educational tools, Ask PHYGO, workspace, own calculator | – | yes | yes | yes | yes | My Phygo |
| Profile, language, role switch, request verification | – | yes | yes | yes | yes | profile only |
| **See** own existing patients, notes, appointments, links | – | – | yes (only what they already created) | yes | yes | own data |
| **Create, change or delete** patients, notes, appointments; confirm requests | – | – | **no** | yes | yes | request appointments for themselves |
| **Invite** to My Phygo, reset portal access, delete invitations | – | – | **no** | yes | yes | redeem an invitation |
| **Add or remove** clinical links; metabolic data on a patient | – | – | **no** | yes | yes | own calculator |
| **Video calls** (create, change, delete) | – | – | **no** | yes | yes | join only |
| **Clinical AI on real cases** | – | – | **no** | yes | yes | – |

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

Unverified accounts can still **read** what they created. Nothing is hidden or lost; it is only frozen until verification or listing.

No server route deletes clinical data. The only path is the browser under RLS. Account deletion (which cascades through `auth.users`) is available only to the owner in Supabase.

## The transition list (a database table)

- **The table:** `professional_transition_accounts`, created by Part A of PR #8.
- **Why a table:** database rules cannot read Vercel settings, so the list lives in the database. One list and one rule (`can_manage_patients()`) govern patient management, clinical AI and video.
- **Old variables:** PR #7's `PROFESSIONAL_TRANSITION_*` environment variables are ignored and logged.
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

## Prerequisites

- **`PHYGO_ADMIN_EMAILS`** (Vercel, Production) must contain exactly the authorised administrator's confirmed email.
  - The owner's account exists and is confirmed.
  - The owner must confirm the Vercel value.
- **No other variable or secret** is needed. Never copy production secrets into Preview.

## Exactly which SQL, in which order

Apply in the Supabase SQL editor, one file at a time, in this order. Each file is a single transaction and can be re-run safely.

| # | File | When | Effect while the current code is still live |
|---|---|---|---|
| 1 | `sql/2026-10_security_profile_privileged_columns_PROPOSED.sql` | Before the deploy | Users can no longer change `plan` or `professional_status` |
| 2 | `sql/2026-10_security_clinical_rls_hardening_PROPOSED.sql` | Before the deploy | Notes only on your own patients; patient links only by invitation |
| 3 | `sql/2026-10_professional_verification_PROPOSED.sql` | Before the deploy | The current profile page cannot *change* a registration number (none exists today) |
| 4 | `sql/2026-10_patient_management_A_transition_list_PROPOSED.sql` | Before the deploy | None: adds a table and a function |
| 5 | **Owner fills the transition list** (insert statements above) | After 4, before 6 | None |
| 6 | `sql/2026-10_patient_management_B_policies_PROPOSED.sql` | **Immediately before the deploy** | Unlisted, unverified accounts can no longer create, change or delete patient data. The current pages show a generic error, for minutes only. Listed accounts are unaffected |
| — | **Deploy** (one deployment) | — | Merge #8 into #7's branch, #7 into #5's branch, then #5 into `main` |
| 7 | `sql/2026-10_security_demo_usage_policies_PROPOSED.sql` | After the deploy | Removes public read access to stored IPs; deleting the stored row is a separate decision |

- **Not part of the release:** `sql/2026-10_patient_management_R_freeze_PROPOSED.sql` is for emergencies only (see Rollback).
- **After the deploy:**
  - smoke test as a verified administrator, a listed account and an unlisted test account: one note, one scan, one video call, one appointment, one invitation, and a delete attempt;
  - then review the verification requests.
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
- **In practice:** the first release ships #5, #7 and #8 together, so production has no "#7 only" deployment to return to. Every earlier production deployment predates #5 and is **not** safe. Until a later safe release exists, a code problem means fixing forward, or deploying a revert of the #8 code commits, which leaves #7's code.
- #7's environment-variable list for AI and video should stay **empty**. In that state, listed accounts temporarily lose AI and video, but keep patient management. That is the safe direction.

**Never do these.** The SQL refuses the first three:

| Action | Why it is dangerous | Guard |
|---|---|---|
| Run PR #5's profile-protection rollback after #7/#8 | Users could mark themselves verified | Refuses with an error |
| Run PR #5's clinical-RLS rollback after #8 | It would overwrite #8's notes rules and reopen patient linking | Refuses with an error |
| `drop function can_manage_patients()` | — | PostgreSQL refuses while the rules use it |
| `drop function can_manage_patients() ... CASCADE` | It removes the rules | Not refused: never use it |
| Return the patient rules to the PR #5 version | It lets any signed-in account manage patient data | Not provided on purpose |
| Roll the code back to a deployment older than PR #7 | Clinical AI for declared professionals | — |
| Roll the code back to a deployment older than PR #5 | Paid AI and video rooms for anonymous visitors | — |

**Verification SQL rollback (step 3):**
- only for an aborted release before the deploy, because the deployed code writes its columns;
- it restores the PR #5 trigger instead of dropping it;
- it first removes rejected accounts from the transition list, so that mapping `rejected` back to `not_applicable` cannot give them access again;
- it leaves the step 6 rules in place.

All of the above is executed in `tests/sql/run.sh`.
