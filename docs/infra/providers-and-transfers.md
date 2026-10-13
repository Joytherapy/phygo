# Providers that receive data, from the code (13 Oct 2026)

What each external provider actually receives, read from the code on `main` (`bb98c85`). For the privacy notice (section 6 "Sub-processors", section 7 "Transfers") and for the DPAs (decision D6). Read-only review: no service was contacted.

## Inventory
| Provider | Called from | Personal or health data it receives | Evidence | Contract / transfer today |
|---|---|---|---|---|
| **Supabase** (database, Auth, Storage) | Server and browser | Everything: accounts, patients, notes, files, verification documents | `middleware.ts`, `app/api/profile/verification/route.ts` | Project in `eu-central-1` (Frankfurt). DPA to accept (D6). US company |
| **Vercel** | All traffic | Every request, logs, IP. Functions in `iad1` (USA) until PR #16 | `vercel.json` | DPA only on Pro/Enterprise (D5, D6) |
| **OpenAI** (Chat Completions: `gpt-4o-mini`, `gpt-4o`) | Server only | **Clinical text:** session transcripts (`generate-note`), the SOAP note sent with Ask PHYGO from the patient session, assessment and condition. **Images:** X-ray, MRI and referral photos at `detail: "high"` (`analyze-scan`), which may show names or ids printed on them | `app/api/generate-note/route.ts`, `app/api/analyze-scan/route.ts:55-66`, `components/liveStructuring/LiveStructuring.tsx:811` | Default US endpoint; no EU residency configured. Zero data retention not verifiable from code. DPA: to accept in the OpenAI account |
| **Daily** (video) | Server creates the room; audio and video go browser ↔ Daily | Live audio and video, chat, IP of clinician and patient. **Until PR #18:** the patient id in the room name | `app/api/video-call/create-room/route.ts` | Not named in the privacy notice. DPA: to accept in the Daily account |
| **Browser speech service** (Chrome → Google, Safari → Apple) | **Browser** | **Live session audio** for dictation (`SpeechRecognition`, continuous, not on-device) | `components/liveStructuring/LiveStructuring.tsx:233-235, 603-676` | **No contract between PHYGO and Google/Apple for this.** Not disclosed. See D13 |
| **Cloudflare cdnjs** | Browser | IP and user agent (pdf.js worker for the Workspace PDF viewer) | `components/workspace/pdf/PdfViewer.tsx:47` | Not disclosed. **Removed by PR #19** |
| **NCBI PubMed**, **wger.de** | Server | No personal data (fixed queries; exercise keywords) | `app/api/science/fetch-sources/route.ts`, `lib/exercise-providers/wger.ts` | Nothing to do |

**Named in the privacy notice but not in the code:** Resend. Sign-up and password e-mails are sent by Supabase Auth; which SMTP service it uses is set in the Supabase dashboard, not in the code (owner to check).

**Not used:** payments (no Stripe or other), analytics or error tracking (no GA, PostHog, Sentry, Vercel Analytics), Google Fonts at runtime (self-hosted by `next/font`).

## What the current privacy notice gets wrong (online today)
1. **Missing providers:** Daily (patient audio and video), the browser speech service, Cloudflare cdnjs.
2. **Resend is listed but not used** by the code.
3. **OpenAI is described as "note generation" only.** It also receives clinical images and the note sent with Ask PHYGO.
4. "**Voice transcripts**" suggests that PHYGO transcribes. In fact the browser's vendor does, under its own terms.
5. "**Bound by a Data Processing Agreement**" is not yet true for Vercel (Hobby), and is unverified for the others (D6).
6. "**Billing data**": no payment provider exists in the code.

## Checked and found correct
- **Ask PHYGO** accepts a note context from any signed-in account. The only screen that sends a real clinical note is the patient session, and that screen and the note-generation route already require a verified professional. The other screens send section labels only. Not an access problem.
- **Clinical AI routes** (`generate-note`, `analyze-scan`, `refine-*`, `exercise-intelligence`) all require a verified professional.

## Actions
| # | Action | Who | Status |
|---|---|---|---|
| 1 | Random Daily room name, no patient id | Claude | **PR #18** (tests pass) |
| 2 | Private Daily rooms with a meeting token for clinician and patient (today anyone with the URL can join while the room exists, 1 hour) | Claude, after the owner agrees (D14) | Proposal |
| 3 | Dictation: disclose the browser vendor, or move transcription to our server under a DPA (D13) | Owner decides | Proposal |
| 4 | OpenAI: accept the DPA; consider zero data retention and an EU-residency project; tell users not to photograph names on scans, or crop them (D15) | Owner | Proposal |
| 5 | Serve the pdf.js worker from our own domain (removes cdnjs) | Claude | **PR #19** (tests and browser check pass) |
| 6 | Rewrite privacy sections 6 and 7 with this table, after D5–D8 and D13–D15 | Claude drafts, lawyer reviews | Waits on the decisions |
