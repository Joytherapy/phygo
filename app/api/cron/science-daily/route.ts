import { NextResponse } from 'next/server';
import { hasCronSecret } from '@/lib/auth/adminServer';
import { step } from '@/lib/scienceCron';

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

  const fetchStep = await step(`${origin}/api/science/fetch-sources`, headers);
  const summarizeStep = await step(`${origin}/api/science/summarize-all`, headers);

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
