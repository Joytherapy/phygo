// One step of the daily science cron (app/api/cron/science-daily/route.ts).
export type Step = { status: number; ok: boolean; data?: unknown; error?: string };

// Calls one science batch route and never throws: a reply that is not JSON
// (for example a platform error page after a timeout) is reported with its
// status and content type instead of crashing the cron, which is how it
// failed on 12 and 15 Oct 2026 ("Unexpected token '<'"). Bodies are not
// logged.
export async function step(url: string, headers: Record<string, string>): Promise<Step> {
  let res: Response;
  try {
    res = await fetch(url, { headers, cache: 'no-store' });
  } catch {
    console.error(`science cron: ${new URL(url).pathname} unreachable`);
    return { status: 0, ok: false, error: 'unreachable' };
  }
  const type = res.headers.get('content-type') ?? '';
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) console.error(`science cron: ${new URL(url).pathname} answered ${res.status}`);
    return { status: res.status, ok: res.ok, data };
  } catch {
    console.error(`science cron: ${new URL(url).pathname} answered ${res.status} with ${type || 'no content type'}, not JSON`);
    return { status: res.status, ok: false, error: `non-JSON response (${type || 'no content type'})` };
  }
}
