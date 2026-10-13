# Vercel Functions in Frankfurt (`fra1`) and the Vercel plan

Status: **proposal.** This PR changes only `vercel.json` (`"regions": ["fra1"]`) and adds a measurement script. Nothing has been changed in Vercel, and no plan has been bought.

**Decision in one line:** move to Pro first (needed anyway for commercial use and an applicable DPA), then merge this PR. `fra1` on its own works on Hobby too, but it does not fix the contractual gap.

## 1. Current state (read on 13 Oct 2026)
| Item | Value | Source |
|---|---|---|
| Production function region | `iad1`, Washington DC, USA | Vercel API: Production deployment `regions` |
| Region configuration | None (`vercel.json` has no `regions`; no `preferredRegion` in the code), so Vercel's default applies | Repository |
| Supabase project | `eu-central-1`, Frankfurt, organisation on the **Pro** plan | Supabase API |
| Vercel plan | **Hobby** | Established earlier in the project; the team API does not show it. Check in Settings → Billing |
| Code that depends on the region | None (no `VERCEL_REGION`, no `preferredRegion`) | Repository |

**Consequence today:** a user in Italy reaches a function in Washington, and every database query then crosses the Atlantic again to Frankfurt. A page or API call with several queries pays that round trip several times.

## 2. What `"regions": ["fra1"]` changes
- **All** Vercel Functions run in Frankfurt, not only the document routes:
  - every API route;
  - server rendering and ISR regeneration (for example the library pages and the sitemap);
  - the daily cron.
- **Unchanged:**
  - static files (served by Vercel's global CDN);
  - the middleware (`middleware.ts`, Edge runtime, runs near the user);
  - the build;
  - environment variables;
  - every `maxDuration` and memory setting.
- **The Hobby plan allows it:** Vercel's documentation says "Hobby plans support any single region". Running *some* functions in another region (per-route regions) would need Pro, and is not proposed.
- **Tested on the real platform (13 Oct 2026):** the Preview deployment of this PR (`dpl_BJT5mwNUPrsK4bFJ5PXFrS9cqrsq`, commit `79a3a15`) built and is **Ready** with `regions: ["fra1"]` on the current plan. That proves the build and the configuration. It does not prove runtime behaviour with real data: a Preview has no Production variables, and its URL is protected by Vercel Authentication.

## 3. Compatibility
| Dependency | Where it runs | Effect of `fra1` |
|---|---|---|
| Supabase (database, Auth, Storage) | `eu-central-1` Frankfurt | **Better:** functions and database in the same metro area |
| OpenAI API | Outside the EU (US) | One transatlantic hop per AI call, small next to model latency. Processing location does not change |
| Daily (video) | Daily's API; media through Daily's own network | The room-creation API call works the same. Video routing does not depend on the Vercel region |
| Resend (e-mail) | External API | Unchanged |
| Cron (`/api/cron/science-daily`, 06:00 UTC) | Function region | Runs in `fra1`, same schedule. Its calls to the two science routes stay inside the same deployment |
| PubMed (science cron) | US | One transatlantic hop, as OpenAI |
| Middleware | Edge, near the user | Unchanged |

## 4. Performance
The gain is **expected**, not yet measured:
- **DB-heavy routes:** they should lose roughly one transatlantic round trip per database query.
- **AI routes:** they gain the same on their database calls, and pay one extra hop to OpenAI.

`scripts/measure-latency.sh` measures it with anonymous, read-only GET requests to two public endpoints that query Supabase (`/api/conditions-library/list`, `/api/search`).
1. **Before:** from a computer in Italy, run `bash scripts/measure-latency.sh https://phygo.vercel.app 20` twice.
2. **After** the `fra1` deploy, run it twice again. Ignore the first requests after the deploy, which include cold starts.
3. **Accept** if:
   - the p50 time to first byte of both endpoints does not get worse (it should drop clearly);
   - there are no new errors in Vercel → Logs;
   - Ask PHYGO, a note generation and a video room still work.

**Rollback:** revert this PR, which brings back the default region with the next deploy, or promote the previous Production deployment.

## 5. What still leaves the EU, even with `fra1`
Do not describe this as "all data stays in the EU":
- **Vercel:** requests enter Vercel's global network at the point of presence nearest the user. Vercel Inc. is a US company, and the location of its runtime logs is not verified.
- **Supabase:** the Storage CDN (Cloudflare, global) can cache copies at its edge. Supabase lists logs, backups, support access and sub-processors as part of the transfer analysis.
- **OpenAI** processes AI requests outside the EU. Its EU data residency exists only for eligible, newly created projects; not set up.
- **Daily** (video) and **Resend** (e-mail) are external US providers.
- **PubMed** (science cron): public data only.

## 6. Vercel plan and DPA (evidence, not legal advice)
- **Hobby is for personal, non-commercial use.** Vercel's documentation says the plan is limited to "non-commercial, personal use", pointing to its fair-use guidelines. A community post quoting those guidelines defines commercial use as "any Deployment that is used for the purpose of financial gain of anyone involved in any part of the production of the project". PHYGO offers paid plans, so it needs **Pro** (or Enterprise).
- **The DPA covers Pro and Enterprise.** The text of `vercel.com/legal/dpa` read through search says the addendum applies to Vercel's processing "for customers on Enterprise and Pro plans". Vercel's Terms incorporate the DPA by reference. There is **no evidence that it covers Hobby**.
- **Transfers:**
  - Vercel states that it is certified under the EU-U.S. Data Privacy Framework (its own help article). This has not been checked on dataprivacyframework.gov.
  - The DPA refers to Standard Contractual Clauses.
- **Sub-processor list:** not obtained. It is at `vercel.com/legal/sub-processors`.
- **Cost:**
  - Pro is about **20 USD per member per month**, according to third-party summaries; check `vercel.com/pricing`.
  - On Pro, active CPU and memory beyond the included amounts cost more in `fra1` than in `iad1` (about ×1.44 per Vercel's regional pricing pages). Waiting for the database or AI does not count as active CPU.

### Steps to use PHYGO professionally with an applicable DPA (owner; nothing done here)
1. In Vercel → Settings → Billing, move the team to **Pro**. This is a payment, so the owner decides.
2. Open `vercel.com/legal/dpa`. Check whether it applies automatically to Pro through the Terms, or must be signed. Save a dated PDF copy.
3. Save the current sub-processor list (`vercel.com/legal/sub-processors`).
4. Look up "Vercel" on `dataprivacyframework.gov` and note the date of the check.
5. Do the same for Supabase:
   - in Organization → Legal Documents, sign or accept the DPA and save the copy;
   - save the sub-processor list.
6. Update the privacy notice (section 6, sub-processors). Add Daily, which is missing today.

## 7. Recommendation
1. **Move to Vercel Pro.** It is needed in any case for commercial use and for an applicable DPA.
2. **Merge this PR.** Measure before and after with the script.
3. **Update the privacy notice:** functions in Frankfurt, plus the list in section 5.

`cdg1` (Paris) is also an EU region, but further from the database. `fra1` is preferred because Supabase is in Frankfurt.
