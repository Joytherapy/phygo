import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const origin = new URL(req.url).origin;

  const fetchRes = await fetch(`${origin}/api/science/fetch-sources`);
  const fetchData = await fetchRes.json();

  const summarizeRes = await fetch(`${origin}/api/science/summarize-all`);
  const summarizeData = await summarizeRes.json();

  return NextResponse.json({
    fetch: fetchData,
    summarize: summarizeData,
  });
}
