import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function classify(pubTypes: string[]): string {
  if (pubTypes.some((t) => /systematic review/i.test(t))) return 'Systematic Review';
  if (pubTypes.some((t) => /meta-analysis/i.test(t))) return 'Meta-analysis';
  if (pubTypes.some((t) => /randomized controlled trial/i.test(t))) return 'RCT';
  if (pubTypes.some((t) => /observational study|cohort/i.test(t))) return 'Cohort';
  if (pubTypes.some((t) => /case reports/i.test(t))) return 'Case Report';
  if (pubTypes.some((t) => /guideline|practice guideline/i.test(t))) return 'Guideline';
  return 'Other';
}

export async function GET() {
  try {
    const { data: papers, error } = await supabase
      .from('research_papers')
      .select('id, pmid')
      .or('study_type.is.null,study_type.eq.');

    if (error) {
      return NextResponse.json({ error: 'Errore lettura papers' }, { status: 500 });
    }

    if (!papers || papers.length === 0) {
      return NextResponse.json({ message: 'Nessun paper da aggiornare', updated: 0 });
    }

    let updated = 0;

    for (const paper of papers) {
      if (!paper.pmid) continue;

      const fetchRes = await fetch(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${paper.pmid}&retmode=xml`
      );
      const xmlText = await fetchRes.text();
      const pubTypeMatch = xmlText.match(/<PublicationType[^>]*>([^<]+)<\/PublicationType>/g) || [];
      const pubTypes = pubTypeMatch.map((t) => t.replace(/<[^>]+>/g, ''));
      const studyType = classify(pubTypes);

      const { error: updateError } = await supabase
        .from('research_papers')
        .update({ study_type: studyType })
        .eq('id', paper.id);

      if (!updateError) updated++;
    }

    return NextResponse.json({ updated, total: papers.length });
  } catch (err) {
    console.error('backfill-study-type error:', err);
    return NextResponse.json({ error: 'Backfill failed' }, { status: 500 });
  }
}
