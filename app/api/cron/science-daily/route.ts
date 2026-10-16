import { NextResponse } from 'next/server';
import { hasCronSecret } from '@/lib/auth/adminServer';
import { step } from '@/lib/scienceCron';
import { GET as fetchSources } from '@/app/api/science/fetch-sources/route';
import { GET as summarizeAll } from '@/app/api/science/summarize-all/route';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // hasCronSecret() fails closed when CRON_SECRET is unset — the previous
  // inline check compared against `Bearer undefined`, which any caller
  // could send.
  if (!hasCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // The two science batch routes are admin-only (lib/auth/adminServer.ts)
  // and are the only admin routes that accept CRON_SECRET ({ allowCron: true }).
  // They run here, in this function, with the same authorization they would
  // check over HTTP (see lib/scienceCron.ts for why not over HTTP).
  const headers = { authorization: `Bearer ${process.env.CRON_SECRET}` };
  const request = (path: string) => new Request(new URL(path, req.url), { headers });

  const fetchStep = await step('fetch-sources', () => fetchSources(request('/api/science/fetch-sources')));
  const summarizeStep = await step('summarize-all', () => summarizeAll(request('/api/science/summarize-all')));

  // Same shape as before when both succeed; a failed step makes the cron
  // answer 502, so the run shows as failed in Vercel.
  return NextResponse.json(
    {
      fetch: fetchStep.ok ? fetchStep.data : fetchStep,
      summarize: summarizeStep.ok ? summarizeStep.data : summarizeStep,
    },
    { status: fetchStep.ok && summarizeStep.ok ? 200 : 502 },
  );
}
