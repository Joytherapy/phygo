import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export async function GET() {
  try {
    const { data, error } = await supabase
      .from('research_papers')
      .select('id, title, authors, journal, publication_date, study_type, original_url, status, research_summaries(clinical_question, main_findings, why_it_matters)')
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
