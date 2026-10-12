# Professional verification: rollout, transition and rollback

Covers PR #5 (security), whose SQL this depends on, and PR #7 (professional verification).
Nothing here has been applied to production. Every step needs the owner's approval.

## What changes

- **Declared role** (`profiles.practice_stage`, student / professional):
  - stays free;
  - chosen at onboarding and switchable from the profile page.
- **Verified status** (`profiles.professional_status`):
  - granted only by a PHYGO administrator, after checking the registration number by hand against the official public register;
  - typing a number only creates a `pending` request.
- **Gated features:** clinical AI and video consultations need `verified`. The routes are generate-note, analyze-scan, refine-exercises, refine-plan, exercise-intelligence, science/relevant and video-call/create-room.
- **Unchanged:** everything else keeps today's access rules.

### Access matrix

| | Visitor | Student | Declared professional, not verified (incl. pending, needs info, rejected) | Listed pre-existing account during the transition | Verified professional | Patient |
|---|---|---|---|---|---|---|
| Public site, condition library, legal pages | yes | yes | yes | yes | yes | yes |
| Dashboard: library, anatomy, exercises, quizzes, workspace | – | yes | yes | yes | yes | – (My Phygo) |
| Ask PHYGO (general questions, hourly limit) | – | yes | yes | yes | yes | – |
| Own metabolic calculator | – | yes | yes | yes | yes | own record |
| Own patient records, notes, appointments (database rules) | – | – (as before) | yes, existing workflows | yes | yes | own data only |
| Clinical AI on real cases (notes, scans, AI exercise and evidence suggestions) | – | – | **no**: 403 `verification_required` | yes, until the end date | yes | – |
| Video consultations (creating a room) | – | – | **no**: 403 `verification_required` | yes, own patients, until the end date | yes, own patients | joins only |
| Request verification | – | yes | yes | yes | yes (changing details sends it back to review) | – |
| Approve verification | – | – | – | – | – | – (administrators only) |

In every row, two protections always apply:
- **Ownership:** a clinician only reaches their own patients; anything else gets the same 404.
- **Hourly limits:** checked before any paid call; if the counter cannot be read, the request is refused.

## The transition list (pre-existing accounts)

**Today:**
- 34 accounts;
- 32 declared professionals, 1 student, 1 linked patient;
- none has a verification status or a registration number;
- the newest account was created on 25 Sep 2026.

With verification enforced, all 32 lose clinical AI until reviewed. The transition list lets the owner keep chosen existing accounts working for a bounded time.

- `PROFESSIONAL_TRANSITION_ACCOUNTS` holds the account ids (UUIDs from `auth.users.id`), comma-separated.
  - Only listed ids qualify.
  - A new account, or one that switches its declared role, never qualifies by itself.
  - Malformed entries are ignored.
- `PROFESSIONAL_TRANSITION_UNTIL` is the end of the transition, in ISO 8601, for example `2026-11-30T23:59:59Z`.
  - It is required, and it may be at most 90 days ahead.
  - Missing, invalid, past or too far ahead means **nobody is covered** (fail closed).
- A listed account still has to pass the other checks:
  - it must not be a patient;
  - it must declare itself a professional (a student is refused);
  - it must not be `rejected`. A rejection by PHYGO wins immediately.
- Listed users see in their profile that their access is temporary, and until when.
- Each use is logged: `verification transition: listed unverified account allowed until …`.

### How to populate it

1. In the Supabase SQL editor, run this **read-only** query. It lists existing declared professionals who are not patients:
   ```sql
   select p.id, u.email, u.created_at, p.professional_status
   from profiles p join auth.users u on u.id = p.id
   where p.practice_stage = 'professional'
     and u.created_at < '2026-10-13'   -- accounts that existed before the rollout
     and not exists (select 1 from patients x where x.patient_user_id = p.id)
   order by u.created_at;
   ```
2. Pick the accounts you know are real clinicians, and copy their `id` values.
   - Ids are not secrets, but they identify people.
   - Keep the list out of GitHub, PR text and chat.
3. In Vercel → Project → Settings → Environment Variables, **Production only**, set:
   - `PROFESSIONAL_TRANSITION_ACCOUNTS` = the ids, comma-separated;
   - `PROFESSIONAL_TRANSITION_UNTIL` = the end date.

   Do not set them for Preview.
4. Redeploy. Vercel applies environment variables only to new deployments.

### How to remove accounts

| Goal | How | Takes effect |
|---|---|---|
| Remove one account now | Reject it, or approve it, on `/dashboard/verification-admin` | Immediately, no redeploy |
| Remove one account from the list | Edit `PROFESSIONAL_TRANSITION_ACCOUNTS`, then redeploy | Next deployment |
| End the transition for everyone | Delete both variables and redeploy, or simply let `PROFESSIONAL_TRANSITION_UNTIL` pass | Next deployment, or automatically at the date |

## Prerequisites before deploying

- **`PHYGO_ADMIN_EMAILS` (Vercel, Production):**
  - must contain exactly the email of the authorised administrator account, and nothing else;
  - that account's email must be confirmed;
  - it is checked server-side;
  - if it is empty, nobody can review (fail closed).
  - **Checked:** the owner's account exists and its email is confirmed.
  - **Not checked:** the Vercel value. There is no Vercel access from this work, so the owner must confirm it.
- **Transition variables:** set before merging, or left empty to enforce from day one.
- **No other secret** is needed. Never copy production secrets into Preview.

## Release order (no window of unverified clinical access)

Production deploys `main` on every merge. To avoid any period in which a self-declared professional gets clinical AI, **ship PR #5 and PR #7 in one production deployment**:

1. **Database, before merging.** Each step was tested on a local replica of the live schema (`bash tests/sql/run.sh`).
   1. `sql/2026-10_security_profile_privileged_columns_PROPOSED.sql`. Safe with the current code: no client code writes `plan` or `professional_status`.
   2. `sql/2026-10_security_clinical_rls_hardening_PROPOSED.sql`. Safe with the current code: the app only creates notes for its own patients and only clears patient links.
   3. `sql/2026-10_professional_verification_PROPOSED.sql`, **immediately before step 3**.
      - It must exist before the PR #7 code runs, because the verification request and review write its new columns.
      - Until the new code is live, the old profile page cannot *change* a registration number (an unchanged one saves fine). No account has one today.
2. **Vercel Production variables:** `PHYGO_ADMIN_EMAILS` confirmed; transition variables set or empty.
3. **Code:**
   - merge PR #7 into `claude/security-audit-remediation`;
   - then merge PR #5 into `main`;
   - that gives one deployment containing both.

   PR #6 is independent and can be merged before or after.
4. **After deploying:**
   1. Smoke test as a verified administrator and as an unverified test account: one note, one scan, Ask PHYGO, one video call, and one verification request.
   2. `sql/2026-10_security_demo_usage_policies_PROPOSED.sql`. It can follow the deploy, since no code uses `demo_usage` any more. Then decide separately about the 1 stored IP row; the recommendation is to delete it.
   3. Review requests on `/dashboard/verification-admin`.
   4. Optional, only after the transition has ended: `sql/2026-10_patients_require_verification_PROPOSED.sql`. It stops unverified accounts creating **new** patient records, so listed accounts would be blocked from that too.

## Rollback

The safe states are "PR #5 + PR #7 code" with any transition list, or with none. Do **not** roll back to a deployment older than PR #5: that code lets anonymous visitors use the paid AI routes and video rooms.

- **Too few people can work:** do not revert the code.
  - Approve verified accounts, or
  - add pre-existing accounts to the transition list and redeploy.
- **Someone has access who should not:**
  - reject them in the admin page (immediate);
  - remove them from the list, or empty it, and redeploy.
- **The PR #7 code must be withdrawn:**
  - use Vercel "Instant Rollback" to an earlier deployment that already contains PR #7, or fix forward;
  - reverting only PR #7 would bring back declared-role access (PR #5 alone), which is the window this plan avoids.
- **Verification SQL:** the rollback block is in the file header, tested.
  - Use it only after the code no longer writes the new columns.
  - It restores the PR #5 trigger and does not drop it.
  - Data in the new columns is lost; export it first.
- **PR #5 SQL:** the rollback blocks are in each file header. Each one reopens the hole it closed:
  - self-upgrade of `plan` / `professional_status`;
  - notes on other clinicians' patients;
  - patient re-linking;
  - public IP reads.

  Use them only if a legitimate flow breaks, and prefer a fix forward.
