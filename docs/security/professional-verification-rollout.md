# Professional verification: rollout and rollback (PR #7)

Covers PR #7 (professional verification), stacked on PR #5. **The full release guide is PR #8's version of this file.** PR #8 adds:
- the time-limited transition list (a database table);
- the patient-management rules;
- the exact SQL order.

PR #7 is meant to ship in the same deployment as #5 and #8. Nothing here has been applied to production. Every step needs the owner's approval.

## What PR #7 changes

- **Declared role** (`profiles.practice_stage`, student / professional):
  - stays free;
  - chosen at onboarding and switchable from the profile page.
- **Verified status** (`profiles.professional_status`):
  - granted only by a PHYGO administrator, after checking the registration number by hand against the official public register;
  - typing a number only creates a `pending` request.
- **What needs verification in this code version** (**verified accounts only**):
  - clinical AI: generate-note, analyze-scan, refine-exercises, refine-plan, exercise-intelligence, science/relevant;
  - video rooms: video-call/create-room;
  - metabolic data on a patient: `/api/metabolic/save` with a `patientId`.
- **Temporary access for pre-existing accounts:** this code version grants none. It comes only from PR #8's database list.

### Old environment variables: remove them

An earlier draft of this PR used `PROFESSIONAL_TRANSITION_ACCOUNTS` and `PROFESSIONAL_TRANSITION_UNTIL` (and before that `PROFESSIONAL_VERIFICATION_MODE`).

- **In code:** **no version of the code grants anything through them**, neither this one nor PR #8. If they are set, they are ignored and a warning is logged. So a stale value cannot open clinical access, even after a code rollback to this version.
- **In Vercel:** remove them from Production (and from every environment) before the release anyway, so the configuration matches the code.

## Prerequisites before deploying

- **`PHYGO_ADMIN_EMAILS` (Vercel, Production):**
  - exactly the authorised administrator's email, and nothing else;
  - that account's email must be confirmed;
  - if it is empty, nobody can review (fail closed).
  - **Checked:** the owner's account exists and is confirmed.
  - **Not checked:** the Vercel value. The owner must confirm it.
- **Not set:** `PROFESSIONAL_TRANSITION_ACCOUNTS`, `PROFESSIONAL_TRANSITION_UNTIL`, `PROFESSIONAL_VERIFICATION_MODE`.
- **No other secret** is needed. Never copy production secrets into Preview.

## SQL of this PR

`sql/2026-10_professional_verification_PROPOSED.sql`:
- apply it after PR #5's SQL, and before the deploy;
- its header holds a tested rollback block. Use it only for an aborted release: it restores the PR #5 trigger and never drops it.

## Rollback

- **Do not roll back to a deployment older than PR #5:** it lets anonymous visitors use paid AI routes and video rooms.
- **Rolling the code back to this version is safe** once PR #8's database rules are applied:
  - every browser write to patient data still goes through those rules;
  - the only service-role write of patient data, `/api/metabolic/save`, requires verification here too;
  - clinical AI and video become verified-only, which is the safe direction for accounts on PR #8's list.
