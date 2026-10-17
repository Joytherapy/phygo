// One step of the daily science cron (app/api/cron/science-daily/route.ts).
export type Step = { status: number; ok: boolean; data?: unknown; error?: string };

// Runs one science batch route handler in the same function and never throws:
// an exception, or a reply that is not JSON, is reported with its status and
// content type instead of crashing the cron. Bodies are not logged.
//
// The handlers are called directly, not over HTTP. The cron used to fetch its
// own deployment URL (phygo-<hash>.vercel.app), which Vercel's Standard
// Deployment Protection answers with its HTML login page: on 12, 15 and 16 Oct
// 2026 the two batch routes were never reached ("Unexpected token '<'", and no
// log line for either route in the same minute).
export async function step(name: string, run: () => Promise<Response>): Promise<Step> {
  let res: Response;
  try {
    res = await run();
  } catch {
    console.error(`science cron: ${name} threw`);
    return { status: 0, ok: false, error: 'exception' };
  }
  const type = res.headers.get('content-type') ?? '';
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) console.error(`science cron: ${name} answered ${res.status}`);
    return { status: res.status, ok: res.ok, data };
  } catch {
    console.error(`science cron: ${name} answered ${res.status} with ${type || 'no content type'}, not JSON`);
    return { status: res.status, ok: false, error: `non-JSON response (${type || 'no content type'})` };
  }
}
