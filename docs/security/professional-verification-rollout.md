# Professional verification: rollout, transition and rollback

Covers three PRs:
- **PR #5 (security):** its SQL the others depend on.
- **PR #7 (professional verification):** stacked on #5.
- **PR #8 (patient management):** stacked on #7.

Nothing here has been applied to production. Every step needs the owner's approval.

## Three separate permissions

| Permission | Who | Enforced by |
|---|---|---|
| **1. Public clinical and educational resources:** public site, condition library, legal pages | Everyone, no account | Nothing to enforce (public content) |
| **2. General signed-in features and settings:** library, anatomy, exercises, quizzes, workspace, Ask PHYGO, own metabolic calculator, profile, language, declared role, requesting verification | Any signed-in account (patients use My Phygo) | Sign-in (`requireUser`), per-owner RLS, hourly limits |
| **3. Real patients and their clinical information:** creating and changing patients, notes, appointments, invitations, video calls, clinical links, metabolic data on a patient; clinical AI on real cases | **Authorised clinicians:** verified by PHYGO, or listed on the owner's time-limited transition list | Database (`can_manage_patients()` in RLS) **and** API routes (`requireVerifiedProfessional`), using the same rule |

**The declared role (student / professional) is only a preference.** It never grants permission 3.

## Permission matrix

| | Visitor | Student | Declared professional, not verified, not listed (incl. pending / needs info / rejected, new and self-promoted accounts) | Listed pre-existing account, until its end date | Verified professional | Patient |
|---|---|---|---|---|---|---|
| Public resources | yes | yes | yes | yes | yes | yes |
| Educational tools, Ask PHYGO, workspace, own calculator | – | yes | yes | yes | yes | My Phygo |
| Profile, language, role switch, request verification | – | yes | yes | yes | yes | profile only |
| **See** own existing patients, notes, appointments, links | – | – | yes (what they already created) | yes | yes | own data |
| **Delete** own existing patients and records | – | – | yes | yes | yes | – |
| **Create or change** patients, notes, appointments; confirm requests | – | – | **no** | yes | yes | request appointments for themselves |
| **Invite** a patient to My Phygo, reset portal access | – | – | **no** | yes | yes | redeem an invitation |
| **Link** library content to a patient; metabolic data on a patient | – | – | **no** | yes | yes | own calculator |
| **Video calls** (create a room and a call) | – | – | **no** | yes | yes | join only |
| **Clinical AI on real cases** | – | – | **no** | yes | yes | – |

Two protections apply in every column:
- **Ownership:** a clinician reaches only their own patients (`patients.user_id = auth.uid()`). It is checked by RLS and, for service-role routes, in the route (`ownsPatient`, `clinicianOwnsPatient`). "Missing" and "not yours" give the same 404.
- **Hourly limits:** checked before any paid call, and fail closed.

Why reads and deletes stay open to unverified accounts: they only touch what that account itself created. They expose nothing new, nothing disappears suddenly, and the account can clean up.

## The transition list (PR #8: a database table)

- **Why a table:** patient records are written directly from the browser under RLS. Database rules cannot read Vercel environment variables, so the list is the table `professional_transition_accounts`, created by `sql/2026-10_patient_management_A_transition_list_PROPOSED.sql`.
- **One list, one rule:** the same list and the same rule (`can_manage_patients()`) govern patient management, clinical AI and video. PR #7's `PROFESSIONAL_TRANSITION_*` environment variables are no longer used; if set, they are ignored and logged.
- **Who can change it:** only the owner adds rows, from the Supabase SQL editor. Users can read their own row (to see until when) and cannot insert, change or extend anything.
- **Nobody qualifies automatically:** a new account or a role switch never adds a row.
- **Each entry ends at `until`,** at most 90 days after it was added; a check constraint enforces this.
- **A listed account must still:**
  - declare itself a professional;
  - not be a patient account;
  - not be `rejected`. A rejection wins immediately.

### Today's data (read-only, 12 Oct 2026)

| Item | Count |
|---|---|
| Accounts | 34: 32 declared professionals, 1 student, 1 linked patient |
| Verified accounts or registration numbers | 0 |
| Patients | 18, owned by 13 accounts |
| Notes | 2 accounts have notes |
| Appointments | 1 |
| Video calls | 4 |
| Open invitations | 0 |

### How to populate it

1. Find the candidates with this read-only query in the SQL editor. It lists existing declared professionals, with the number of patients each one has:
   ```sql
   select p.id, u.email, u.created_at,
          (select count(*) from patients x where x.user_id = p.id) as patients
   from profiles p join auth.users u on u.id = p.id
   where p.practice_stage = 'professional'
     and u.created_at < '2026-10-13'
     and not exists (select 1 from patients x where x.patient_user_id = p.id)
   order by patients desc, u.created_at;
   ```
2. Add only the accounts you know are real clinicians. Keep the ids out of GitHub and chat.
   ```sql
   insert into professional_transition_accounts (user_id, until, added_by, note)
   values ('<id>', now() + interval '60 days', 'owner', 'pre-existing clinician');
   ```
3. To remove an account immediately, either:
   - reject it on `/dashboard/verification-admin`, or
   - run `delete from professional_transition_accounts where user_id = '<id>'`.

   Neither needs a redeploy.
4. To end the transition, run `delete from professional_transition_accounts;`, or let the dates pass.

## Prerequisites before deploying

- **`PHYGO_ADMIN_EMAILS` (Vercel, Production):** exactly the authorised administrator's email, which must be confirmed. The owner's account exists and is confirmed; the Vercel value itself must be confirmed by the owner.
- **No other variable or secret is needed.** Never copy production secrets into Preview.

## Release sequence

Goals: no window of unauthorised clinical access, and no sudden loss for listed accounts.

| Step | When | What | Effect while the old code is still live |
|---|---|---|---|
| 1 | Any time before | `sql/2026-10_security_profile_privileged_columns_PROPOSED.sql` (#5) | None for legitimate use; blocks self-upgrade and self-verification |
| 2 | Any time before | `sql/2026-10_security_clinical_rls_hardening_PROPOSED.sql` (#5) | None for legitimate use; notes only on your own patients, links only by invitation |
| 3 | Any time before | `sql/2026-10_professional_verification_PROPOSED.sql` (#7) | The old profile page cannot *change* a registration number; nobody has one today |
| 4 | Any time before | `sql/2026-10_patient_management_A_transition_list_PROPOSED.sql` (#8) | None: it adds a table and a function |
| 5 | Before step 6 | **Fill the transition list** (above) | None |
| 6 | Immediately before step 7 | `sql/2026-10_patient_management_B_policies_PROPOSED.sql` (#8) | Unlisted, unverified accounts can no longer create or change patient data (the old page shows a generic error); listed accounts are unaffected |
| 7 | — | **One deployment:** merge #8 into #7's branch, #7 into #5's branch, then #5 into `main` | Clinical AI, video and patient management all follow the same rule |
| 8 | After | `sql/2026-10_security_demo_usage_policies_PROPOSED.sql` (#5); decide about the stored IP row | — |
| 9 | After | Smoke test as a verified administrator, a listed account and an unlisted test account; review requests | — |

PR #6 (exercise library) is independent and can go before or after.

If PR #8 is **not** adopted:
- PR #7 alone keeps its environment-variable list for clinical AI and video;
- patient records stay governed by the PR #5 rules (own patients only, no verification).

## Rollback

The safe states are "#5 + #7 (+ #8)". Never roll back to a deployment older than PR #5: that code lets anonymous visitors use paid AI routes and video rooms.

- **Too few people can work:** do not revert. Add them to the transition list (immediate) or approve them.
- **Someone has access who should not:** reject them (immediate) or delete their list row (immediate).
- **PR #8 policies must be withdrawn:**
  - run the rollback block in the header of Part B, which returns to the PR #5 rules;
  - then drop Part A's function and table;
  - both blocks are tested in `tests/sql/run.sh`.

  The #8 code tolerates the missing table only by refusing unverified users (503), so roll the code back to a #7 deployment at the same time.
- **Verification SQL:** the rollback block is in the file header and tested. Use it only after the code no longer writes its columns. It restores the PR #5 trigger and never drops it.
- **PR #5 SQL:** the rollback blocks are in the file headers. Each reopens the hole it closed, so prefer a fix forward.
