# Release plan: Preview build, EU region, professional verification with documents

One sequence for code, privacy, European configuration, SQL, deployment and final checks.
- **Owner:** decides, pays, runs SQL in the Supabase SQL Editor, approves merges.
- **Claude:** prepares, tests and verifies; runs no SQL on Production; changes no Vercel setting.

The decisions are listed in `DECISIONS.md` (D1–D12).

## Where things stand (13 Oct 2026, afternoon)
| Item | State |
|---|---|
| PR #14: `CRON_SECRET` limited, personal admin session | **In Production** (`5f3ac65`). Admin consoles checked by the owner. The first real cron run after it is checked on 14 Oct |
| PR #15: build without secrets (fixes every Vercel Preview) | **In Production** (`bb98c85`, deployment Ready, no build or runtime errors). Previews now build |
| PR #16: Functions in `fra1`, analysis of the Vercel plan and DPA | **Draft**, Preview Ready (first deployment with `fra1`). Waits on D5 |
| PR #13: verification with documents | **Draft**, up to date with `main`, Preview Ready. 86/86 integration tests, SQL suite passing, 27 browser checks. Four review findings fixed (see below). Waits on the legal texts |
| Privacy section and Terms §3A (IT, EN, ES, FR) | **Drafts complete**, with placeholders for D1–D11. **PR #17** (draft, on PR #3) puts them in the site from the drafts; they appear only when every value is set and the review is approved |
| Provider inventory (what each provider receives) | `docs/infra/providers-and-transfers.md` in PR #16. Fixes: **PR #18** (random video room name, no patient id), **PR #19** (pdf.js worker from our domain, no cdnjs). Decisions D13–D15 |

## Dependencies
```
#15 ──────────────────────────────┐ (green Previews for #13 and #16)
D5 Pro ─► D6 DPAs ─► #16 fra1 ─► D7/D8 ─┐
D1 D2 D3 D4 D9 D10 D11 ─────────────────┼─► fill texts ─► D12 lawyer ─► texts in the app ─► #13 release
                                        │
#13 code (done) ────────────────────────┘
```
Independent of the owner's decisions, done in parallel: #15, the drafts, tests, the procedures below.

## Sequence
### Phase A: no decisions needed
1. ~~Merge PR #15~~ **Done** (`bb98c85`). Build log clean, no runtime errors. Still to do: the owner's browser checks (home, library, dashboard, Ask PHYGO, one clinical AI action).
2. ~~Merge `main` into PR #13 and PR #16~~ **Done**. Both Previews are Ready.
3. **14 Oct, 06:00 UTC:** the first cron after #14. Read-only log check within the hour (Claude): no 401 or 403 on `science-daily`, `fetch-sources`, `summarize-all`.

### Phase B: plan and region (D5–D8)
4. **Owner:**
   - move the team to Vercel Pro;
   - save Vercel's DPA and sub-processor list;
   - accept or sign Supabase's DPA and save its sub-processor list;
   - check the Data Privacy Framework listing.
5. **Owner, before the change:** `bash scripts/measure-latency.sh https://phygo.vercel.app 20`, twice.
6. **Merge PR #16** (owner approval). After the deploy:
   - run the script again, twice;
   - check Ask PHYGO, a note, a video room, and the logs;
   - roll back if anything breaks: revert #16.

### Phase C: legal texts (D1–D4, D9–D12)
7. **Owner:** the values for D1–D4 and D9–D11.
8. **Claude:**
   - fill the placeholders in the four languages;
   - a check that no `{{` remains;
   - update the privacy notice's sub-processor section (add Daily; Supabase Storage and the CDN; the function region).
9. **Lawyer:** reviews the Italian version (D12).
10. **Claude:** fills `lib/i18n/legal/verificationValues.ts` in PR #17 and sets `LEGAL_REVIEW_APPROVED`. That publishes, in four languages:
    - the `/privacy#professional-verification` section, which the form already links to;
    - Terms §3A;
    - §12, governing law.

    The same commit updates the two "not published yet" tests. Tests and browser checks follow. Order: PR #3, then PR #13, then PR #17, in the same release window.

### Phase D: PR #13 in Production
11. **Owner:** run `sql/2026-10_verification_evidence_PROPOSED.sql` in the SQL Editor, **before** the deploy (the code fails closed without these tables). Check its checksum in the guide first. Then run the read-only checks from the guide. The file changes nobody's access.
12. **Merge PR #13** (owner approval). Wait until the deploy is Ready.
13. **Owner:** run `sql/2026-10_verification_evidence_access_PROPOSED.sql`. It changes nothing while no deadline exists.
14. **Final checks:** see below.
15. **Later, separately:**
    - **Retention (after D9):**
      - set `VERIFICATION_DOCUMENT_RETENTION_DAYS=30`, `VERIFICATION_NOTE_RETENTION_DAYS=365` and `VERIFICATION_HISTORY_RETENTION_DAYS=730` in Production;
      - add the daily cron in a small PR;
      - first run with checks, including the Storage bucket in the Supabase dashboard.
    - **60-day transition (after D10):** the owner runs the read-only preview from `..._backfill_PROPOSED.sql`, then the backfill. The owner's account gets 60 days; the owner sends their own document and confirms it from the register.

## Review findings fixed before release (13 Oct)
An independent review of PR #13 found no critical issue. Four were fixed, each with a test that fails without the fix:
1. **Rejected account on the transition list** (medium): a new request made the status `pending` again, which gave back temporary patient management. Now a rejection or revocation also deletes the transition-list entry, in the same transaction.
2. **Decision on a request nobody opened** (low): the console now sends the id of the request on screen; a newer one makes the database refuse (`stale`) and the page reloads.
3. **Document left in browser memory** (low): leaving the page while a document loads now cancels the download; no blob is created afterwards.
4. **Retention past 1,000 rows** (low): every list is now read in pages before anything changes (tested with 1,100 rows).

## Final checks after PR #13
| Check | Who | Expected |
|---|---|---|
| Owner's account, profile | Owner | Badge "Verificato"; verification card with no error |
| Owner sends their own document (same name, number and Order) | Owner | Account stays "Verificato"; request "In controllo"; clinical functions still work |
| Console → "Verificati: documento da controllare" | Owner | The request appears, with "Account già verificato: resta attivo durante il controllo" |
| Open the document in the console | Owner | The viewer opens inside the page. In the browser's Network tab the document request answers `Cache-Control: private, no-store…` and no `supabase.co/storage` request appears |
| Record "Corrisponde", then "Conferma la validità" | Owner | Request "Confermata"; history shows the check and the confirmation with the owner's e-mail |
| `/privacy#professional-verification` and Terms §3A, in four languages | Owner | Visible, with no placeholder left |
| Retention route | Claude (logs) | `configured: false` until step 15 |
| Vercel → Logs, 1 hour after the deploy | Claude | No new errors |

## Rollback
| Step | Rollback |
|---|---|
| #15, #16, #13 (code) | Promote the previous Production deployment |
| SQL 1 | Use its guarded rollback block. It refuses while requests exist, so evidence is not lost |
| SQL 2 | Re-run Part A (`2026-10_patient_management_A_transition_list_PROPOSED.sql`) |
| Backfill | `delete from professional_evidence_deadlines where satisfied_at is null;` |
| Retention | Remove the three variables (the route answers `configured: false`) |
