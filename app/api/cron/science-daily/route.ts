import { NextResponse } from 'next/server';
import { hasCronSecret } from '@/lib/auth/adminServer';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // hasCronSecret() fails closed when CRON_SECRET is unset — the previous
  // inline check compared against `Bearer undefined`, which any caller
  // could send.
  if (!hasCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const origin = new URL(req.url).origin;
  // The two science batch routes are admin-only (lib/auth/adminServer.ts)
  // and are the only admin routes that accept CRON_SECRET ({ allowCron: true }).
  const headers = { authorization: `Bearer ${process.env.CRON_SECRET}` };

  const fetchRes = await fetch(`${origin}/api/science/fetch-sources`, { headers });
  const fetchData = await fetchRes.json();

  const summarizeRes = await fetch(`${origin}/api/science/summarize-all`, { headers });
  const summarizeData = await summarizeRes.json();

  return NextResponse.json({
    fetch: fetchData,
    summarize: summarizeData,
  });
}
