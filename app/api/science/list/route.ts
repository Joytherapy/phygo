import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { lazy } from '@/lib/lazy';
import { requireAdmin } from '@/lib/auth/adminServer';

export const dynamic = 'force-dynamic';

const supabase = lazy(() => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
));

// The Evidence Hub shows published papers only. Papers waiting for review
// (?status=pending_review) are listed for administrators, for the review page;
// rejected papers are never listed.
export async function GET(req: Request) {
  const wanted = new URL(req.url).searchParams.get('status') ?? 'published';
  if (wanted !== 'published' && wanted !== 'pending_review') {
    return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
  }
  if (wanted === 'pending_review') {
    const denied = await requireAdmin(req);
    if (denied) return denied;
  }

  try {
    const { data, error } = await supabase
      .from('research_papers')
      .select('id, title, authors, journal, publication_date, study_type, original_url, status, research_summaries(clinical_question, main_findings, why_it_matters)')
      .eq('status', wanted)
      .order('publication_date', { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Errore lettura papers' }, { status: 500 });
    }

    return NextResponse.json({ papers: data });
  } catch (err) {
    console.error('list error:', err);
    return NextResponse.json({ error: 'List failed' }, { status: 500 });
  }
}
