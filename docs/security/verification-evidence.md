# Professional verification with evidence

Status: **proposed, not applied, not deployed.**

| File | What it does |
|---|---|
| `sql/2026-10_verification_evidence_PROPOSED.sql` | Tables, history guard, atomic server functions, private bucket. **Changes nobody's access** |
| `sql/2026-10_verification_evidence_access_PROPOSED.sql` | Makes `can_manage_patients()` honour the evidence deadline. **Changes nothing while no deadline exists** |
| `sql/2026-10_verification_evidence_backfill_PROPOSED.sql` | Gives accounts verified before documents were required a 60-day deadline. **Starts the clock** |

All three need the owner's approval. The legal points at the end must be closed before release.

## What it adds to the existing flow
`profiles.professional_status` stays the **only** verified status, with the same meaning: PHYGO verified this registration. A document request has its **own** status, kept on the request.

| Piece | Role |
|---|---|
| `professional_verification_requests` | One row per submission: declaration, private document path, register check, decision, and `submitted_while_verified` |
| `professional_verification_reviews` | History of administrator actions, each with an optional internal note. Protected, see "History" |
| `professional_evidence_deadlines` | Per-account date by which an account verified before documents must have one confirmed. Users read only their own row |
| `verification_submit`, `verification_record_check`, `verification_decide` | Server-only database functions, one transaction each |
| Bucket `verification-documents` | Private, 4 MB, PDF/JPEG/PNG |
| `/api/profile/verification` (POST, multipart) | The only way to submit |
| `/api/profile/verification/document` | The user's own latest document, streamed by the server (no signed URL) |
| `/api/admin/verification` | List (also `?status=reconfirm`); record the register check; decide (approve or confirm, ask for information, reject, revoke) |
| `/api/admin/verification/document` | A document for a signed-in administrator, streamed by the server (no signed URL) |
| `/api/cron/verification-retention` | Retention by category. **Off** unless configured |

## Already-verified accounts: policy and consequences
### Rules
| Situation | Account status (`professional_status`) | Request status | Clinical functions |
|---|---|---|---|
| Verified account sends a document with the **same** legal name, number and Order (spaces and letter case aside) | Stays `verified` | `pending` (`submitted_while_verified`) | **Unchanged** |
| Verified account sends **changed** details (number, Order, country, or a legal name different from its last approved request) | `pending` | `pending` | Suspended until a new approval: the earlier verification was for other details |
| Administrator **confirms** (needs document + recorded match + same details as the profile) | Stays `verified` | `verified` | Unchanged; the deadline is marked satisfied |
| Administrator **asks for information** on a verified account | Stays `verified` | `needs_info` | **Unchanged**: the user is asked for a better document |
| Administrator records **mismatch** or **not found** | Unchanged by itself | Unchanged | Approval and confirmation are refused. The administrator then decides: ask for information, or revoke |
| Administrator **revokes** (needs a category and a message) | `rejected` | Unchanged if already decided (an approval is never rewritten) | Removed at once. No data deleted |
| Administrator **rejects or revokes** an account on the transition list | `rejected` | As above | The transition-list entry is deleted in the same transaction, so a new request (status back to `pending`) does **not** bring back temporary access. Only the owner can add it again, from the SQL editor |
| The user sends a **new request while the administrator is reviewing** the previous one | Unchanged | The newer request is open | A decision names the request shown on screen; if it is no longer the latest, it is refused (`stale`, 409) and the page reloads. A decision never lands on a request nobody opened |
| A security problem (for example, a suspected forged document or account takeover) | The administrator revokes (immediate, reversible by a new request and approval) | — | Removed at once |

### 60-day transition (accounts verified before documents were required)
- **Who:** the backfill gives a deadline 60 days from the moment it runs. It covers every verified account with no approved request. Today that is the owner's account only. Nobody else is added automatically.
- **Before the deadline:** nothing changes. The profile shows the date, in four languages. Sending the same details does not interrupt anything.
- **After the deadline, without a confirmed document:**
  - **Removed:** clinical AI, video, and creating or changing patients, notes, appointments, invitations and links (database rules and server routes alike).
  - **Kept:** the account, `professional_status = 'verified'`, and reading its own patients and notes.
  - **Deleted:** nothing.
- **When the administrator confirms the document:** everything returns at once, and the deadline is marked satisfied.

### Consequences for existing permissions and database checks (read before applying)
1. **Profile trigger** `protect_profile_privileged_columns`:
   - unchanged;
   - clients still cannot write the status or registration fields;
   - the deadline lives in a separate table, which users can only read.
2. **`can_manage_patients()`** is redefined by the access file. It changes in two ways only:
   - **Change 1:** a verified account with an unsatisfied, past deadline answers false.
   - **Change 2:** the transition list (`professional_transition_accounts`) no longer applies to **verified** accounts, as on the server already. Without this, an old list entry (the owner has one until 11 Dec 2026) would bypass a passed deadline.

   While the deadline table is empty, every answer is the same as today (tested).
3. **`requireVerifiedProfessional`** (`lib/auth/sessionServer.ts`):
   - for verified accounts it now also reads the account's own deadline row;
   - a passed deadline answers 403 `verification_evidence_overdue`;
   - an unreadable row answers 503 (fails closed). **Release order matters:** apply the evidence SQL before deploying this code, or every verified account gets a 503 on clinical functions.
4. **Patient isolation:** unchanged. Administrator status opens the console and documents only; patient records are reached only through the normal clinical rules (own patients). Tested.
5. **Emergency freeze:** once the access file is applied, undoing a freeze means re-running Part A **and then** the access file. Part A alone restores the earlier rule, which ignores the deadlines (tested).
6. **Self-review:** the owner is both an administrator and a verified account with no document. The server does not forbid an administrator from confirming their own account, and the history records who confirmed. **To decide:** accept and document it, or have a second person confirm.

## Verification is real, not self-declaration
1. **The user submits:**
   - legal first and last name, registration number and territorial Order;
   - the proof of registration;
   - the declaration, explicitly accepted, with its version and time.
2. **Uploading grants nothing:** a new or changed request is `pending`, and a document from a verified account keeps only what the account already had.
3. **The administrator compares four separate things:**
   - the declaration;
   - the document;
   - their own check on the official register, https://albo.alboweb-fnofi.net/registry/search, recorded as **match**, **mismatch** or **not found**;
   - the final decision.
4. **The database function refuses an approval or confirmation** unless:
   - the latest request is open;
   - it still has its document;
   - a **match** is recorded;
   - its details equal the profile's.
5. **Not automated:** there is no scraping and no assumed API.

## Consistent decisions
- **One transaction per call:** each submission, register check and decision is one database call. The profile, the request, the deadline and the history entry change together or not at all.
- **On failure, nothing changes:**
  - if the history write fails, nothing is changed and the administrator gets "nothing was changed" (503);
  - if a submission fails, the uploaded file is removed.
- **Documents replaced by a newer request:**
  - they are removed after the transaction;
  - if a removal fails, the path stays on the superseded request so retention can remove it later.
- **Tests:** in SQL, with forced failures (history insert, profile update), and through the API.

## History: what is and is not protected
`professional_verification_reviews` is **not** called append-only, because these paths exist:

| Path | Allowed? |
|---|---|
| Insert | Yes (server functions) |
| Update | **No**, except the documented removal of the internal note: `internal_note` set to null and `note_redacted_at` set, once |
| Direct delete or truncate | **No**. The service role has no privilege, and a trigger refuses even the owner |
| Delete with its request or account (foreign-key cascade) | **Yes**: account deletion, and retention of old requests |
| Database owner (`postgres`) | Can still drop the trigger or the table: the guard protects against application mistakes, **not** against the owner |

Each entry points at a request of the **same** account, enforced by the database, or at no request. A decision on an account with no request is still recorded; for example, the revocation of an account verified before documents.

## Document access policy
- **Bucket:**
  - private;
  - no storage policy for `anon` or `authenticated`;
  - only the server (service role) reads and writes.
- **Path:**
  - generated by the server: `<user id>/<request id>/<random uuid>.<ext>`;
  - a database constraint keeps it inside the owner's folder.
- **Reads (`lib/verificationDocument.ts`):**
  - only through the two routes above, after a server-side check: the session's owner (latest own request, any URL parameter ignored), or a **signed-in administrator** (`requireAdminSession`);
  - **no bearer token is accepted** for documents or for the verification console: neither `CRON_SECRET` nor `PHYGO_ADMIN_API_TOKEN`. `CRON_SECRET` is accepted only by the cron routes and the two science batch routes the cron calls (`requireAdmin(req, { allowCron: true })`);
  - the storage path comes from the database row and must sit in the owner's folder for that request;
  - the server reads the file with the service role, with a random `cacheNonce` and `cache: 'no-store'`, checks size and real type against the type recorded at upload, and streams it. **No signed URL, token or Storage address reaches the browser**;
  - response headers: `Cache-Control: private, no-store, max-age=0, must-revalidate`, `CDN-Cache-Control: no-store`, `Vercel-CDN-Cache-Control: no-store`, `Pragma: no-cache`, `Expires: 0`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; sandbox`, `Cross-Origin-Resource-Policy: same-origin`, `Referrer-Policy: no-referrer`, and `Content-Disposition: attachment` with a fixed, server-chosen file name (never rendered as a page of the site);
  - the interface fetches the file, keeps it only in memory (a blob) and shows it in an in-page viewer; the blob is released when the viewer closes;
  - hourly limits: 30 opens per user, 300 per administrator.
- **Upload checks, on the server:**
  - size of 4 MB or less;
  - extension in pdf, jpg, jpeg or png;
  - real type from the file's first bytes;
  - extension and content must agree.
- **What users cannot do:**
  - set a status or a register check;
  - pick a path;
  - approve themselves;
  - call the database functions (no privilege for `anon` or `authenticated`).
- **Logs:** no paths, document contents, tokens or signed URLs (tested).
- **Uploads** are stored with `cache-control: max-age=0` (Storage's default is one hour).
- **Residual, outside the application:** Supabase's Smart CDN (Pro plan) may still keep an edge copy of each server read. Every read uses a new random `cacheNonce`, so such a copy is never served again; deleting the file invalidates all copies within about a minute (Supabase documentation). This is not configurable from the application.
- **Administrators:** `PHYGO_ADMIN_EMAILS` is read only on the server, and never reaches the browser bundle (tested).

## Retention by category: proposal, nothing active
| Category | Proposed period | Why | Implementation (off) |
|---|---|---|---|
| Document file | **30 days after the final decision**; at once when replaced by a newer request | Enough for a contestation or a re-check; afterwards the decision and the register check are the evidence | `VERIFICATION_DOCUMENT_RETENTION_DAYS`. Removes through the Storage API (which deletes the stored object, not just a database row), then lists the folder to confirm the file is gone. Only then clears `document_path` and sets `document_deleted_at` |
| Internal notes in the history | **12 months** after the entry | Useful to answer questions about a decision; afterwards the decision, the check result and the category suffice | `VERIFICATION_NOTE_RETENTION_DAYS`. Removes the note and keeps the entry |
| Older requests (superseded, or replaced by a later decision) and their history | **24 months** after their decision | Contestations and repeated abuse; afterwards not needed | `VERIFICATION_HISTORY_RETENTION_DAYS`. Deletes the request and its entries (cascade). Never the latest request of an account, nor its latest approval |
| The request the current status is based on, its history entries (without notes after 12 months), and the deadline row | While the account exists | Shows on what basis clinical access is granted | — |
| Account deletion | Everything above is deleted with the account (cascade). Storage files are not reached by the database cascade | | **To do:** the app has no account-deletion feature. Today an account is deleted only from the Supabase dashboard; whoever does it must also delete the user's folder in `verification-documents` |

**Kept after a document is deleted** (strictly needed):
- the request identifiers;
- status and dates;
- the declared details;
- the declaration version;
- the register check result;
- the decision and its category.

The file, its path, and its type and size become irrelevant.

**To activate after approval:**
1. set the variables in Production;
2. add a daily cron that calls the route with `Authorization: Bearer <CRON_SECRET>`;
3. update the privacy notice with the same periods.

**What cannot be verified from here:** that Supabase Storage removes the stored object in production. The code uses the documented Storage API and confirms the file no longer appears in its folder. On the first real run, also check the bucket in the Supabase dashboard (Storage → `verification-documents`).

## Legal and privacy points to confirm before release
Drafts (unpublished, four languages each):
- `docs/legal/DRAFT_privacy-professional-verification.md`
- `docs/legal/DRAFT_terms-professional-verification.md`

Both files list what is documented today, what the owner must confirm, and what needs legal review. In short:
1. **Privacy notice:**
   - controller identity and contact;
   - legal basis;
   - processors for documents: Supabase Storage region, and Vercel function region and transfers;
   - who the authorised administrators are;
   - retention periods.

   The form links to `/privacy#professional-verification`, which **does not exist yet**. **Do not deploy before it is published.**
2. **Terms of Service:** new section 3A (duties, gradual measures, data kept, 60-day transition). It does not exclude PHYGO's liability.
3. **Declaration text:** the Italian text is the owner's. The English, Spanish and French versions need legal review. Version `2026-10-12.v1`.
4. **Retention periods:** confirm or change the table above.
5. **Communications for the 60-day transition:** in-app notice implemented (4 languages). E-mail is not implemented.
6. **Self-review** of the owner's own account (see above).
7. **Found while checking:** Daily (video) is not in the privacy notice's sub-processor list.
