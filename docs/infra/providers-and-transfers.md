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

## Checklist for the three sensitive flows
Public sources were searched on 13 Oct 2026. Several official pages could not be opened from the work environment, so many points come from search excerpts. **Every point marked "unconfirmed" must be checked on the live page before anything is written in the privacy notice.** No agreement or safeguard is stated here as existing unless there is evidence for it.

### 1. Dictation in the live session (browser Web Speech API)
| | |
|---|---|
| **Data** | The audio of the session, with the clinician's and the patient's voices, while dictation is on. Also the language setting. The transcript comes back to the browser and goes into the note |
| **Purpose** | Turning speech into text for the session note |
| **Who receives it** | It depends on the browser, not on PHYGO. The code uses the default mode, which does not force on-device processing. **Chrome:** Google's servers, per Google's archived 2014 Chrome privacy notice and a Chromium thread; no current statement on retention found. **Edge:** Microsoft's Azure service; Microsoft's own documentation says voice data leaves the machine. **Safari:** probably Apple's servers (third-party tests; **unconfirmed**). **Firefox:** not supported on desktop (**unconfirmed**) |
| **Contract** | None between PHYGO and Google, Apple or Microsoft for this. No terms for website operators were found (**unconfirmed**, but consistent with this being a browser feature) |
| **Still to verify / decide** | (a) The current Chrome privacy whitepaper and Google privacy policy on speech audio. (b) Chrome 139+ offers on-device recognition (`processLocally = true`), but MDN marks it experimental and the language pack may be missing; Android is **unconfirmed**. Option: use it where available and otherwise ask the user to type. (c) Disclose it in the privacy notice: the PR #17 draft does, without describing the vendors' terms. Decision D13 |

### 2. Clinical text, images and documents sent to OpenAI
| | |
|---|---|
| **Data** | Session transcripts and SOAP notes. The note sent with Ask PHYGO from the patient session. Scan analysis: X-ray, MRI and referral photos (base64, `detail: "high"`), which may show names or ids printed on them. Also non-personal library content for translation |
| **Purpose** | Clinical documentation support, image description and question answering. These features are reserved for verified professionals, except Ask PHYGO |
| **What OpenAI says** (search excerpts of OpenAI's "Your data" page and DPA) | API data is not used for training unless the customer opts in. Abuse-monitoring logs are kept up to 30 days. Zero data retention needs OpenAI's approval through sales, and images flagged as possible child sexual abuse material are kept even then. The DPA (v.010126) is accepted by using the service and includes the EU Standard Contractual Clauses, modules 2 and 3. EU data residency needs a **new** project, `eu.api.openai.com`, and modified abuse monitoring or zero data retention; support for `gpt-4o` / `gpt-4o-mini` there is **unconfirmed**. **No Data Privacy Framework listing for OpenAI was found** |
| **Still to verify / decide** | (a) The DPA applies to the PHYGO account. Save a dated copy. (b) No data-sharing opt-in in the OpenAI dashboard. (c) Whether to ask for zero data retention, and whether to use an EU project (D15). (d) A data protection impact assessment for health data and images (lawyer). (e) A line in the scan screen telling users to crop names and ids |

### 3. Audio and video of video consultations (Daily)
| | |
|---|---|
| **Data** | The live audio, video and chat of clinician and patient, both IP addresses, and the room name. Since PR #18 the room name is random, with no patient id |
| **Purpose** | Remote physiotherapy consultations |
| **What Daily says** (search excerpts) | The DPA is part of the Terms of Service, and a signed copy is available on request. The EU SCCs are included. Its sub-processors (AWS, Cloudflare, Twilio and others) are listed as in the USA. Recording only happens if enabled. Logs and metrics are kept 1–3 days on standard plans. Daily **says** it is certified under the Data Privacy Framework; this was not confirmed on the official list. A `geo` setting can keep the call server in Frankfurt (`eu-central-1`); the default is **unconfirmed**. A BAA (US health-data agreement) is available through a Healthcare add-on |
| **Today in the code** | Rooms are **public**: anyone with the URL can join during the hour the room exists. No `geo` is set. No recording is enabled |
| **Still to verify / decide** | (a) Save the DPA and ask for a signed copy. (b) Check the DPF listing. (c) Confirm in the Daily dashboard that recording is not enabled at domain level. (d) Private rooms with meeting tokens: PR in preparation, decision D14. (e) Whether to set `geo` to Frankfurt; that is an account setting, so the owner decides |
