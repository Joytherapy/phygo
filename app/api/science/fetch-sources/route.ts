import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const searchRes = await fetch(
      'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=(physical+therapy%5BTitle%2FAbstract%5D+OR+physiotherapy%5BTitle%2FAbstract%5D+OR+%22exercise+therapy%22%5BTitle%2FAbstract%5D+OR+%22musculoskeletal+rehabilitation%22%5BTitle%2FAbstract%5D)+AND+(randomized+controlled+trial%5BPublication+Type%5D+OR+systematic+review%5BPublication+Type%5D+OR+meta-analysis%5BPublication+Type%5D)+NOT+(cancer%5BTitle%5D+OR+oncology%5BTitle%5D+OR+tumor%5BTitle%5D)&retmax=10&sort=date&retmode=json'
    );
    const searchData = await searchRes.json();
    const pmids: string[] = searchData.esearchresult?.idlist || [];

    if (pmids.length === 0) {
      return NextResponse.json({ imported: 0, message: 'Nessun PMID trovato' });
    }

    const summaryRes = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`
    );
    const summaryData = await summaryRes.json();

    const fetchRes = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    );
    const xmlText = await fetchRes.text();

    const { data: source } = await supabase
      .from('research_sources')
      .select('id')
      .eq('source_type', 'pubmed')
      .single();

    let imported = 0;

    for (const pmid of pmids) {
      const item = summaryData.result?.[pmid];
      if (!item) continue;

      const articleBlock = xmlText.split(`<PMID Version="1">${pmid}</PMID>`)[1] || '';
      const abstractMatch = articleBlock
        .split('</AbstractText>')[0]
        ?.split(/<AbstractText[^>]*>/)?.[1];
      const abstract = abstractMatch ? abstractMatch.trim() : null;

      const authors = (item.authors || [])
        .map((a: { name: string }) => a.name)
        .join(', ');

      const pubTypeMatch = articleBlock.match(/<PublicationType[^>]*>([^<]+)<\/PublicationType>/g) || [];
      const pubTypes = pubTypeMatch.map((t: string) => t.replace(/<[^>]+>/g, ''));
      let studyType = 'Other';
      if (pubTypes.some((t: string) => /systematic review/i.test(t))) studyType = 'Systematic Review';
      else if (pubTypes.some((t: string) => /meta-analysis/i.test(t))) studyType = 'Meta-analysis';
      else if (pubTypes.some((t: string) => /randomized controlled trial/i.test(t))) studyType = 'RCT';
      else if (pubTypes.some((t: string) => /observational study|cohort/i.test(t))) studyType = 'Cohort';
      else if (pubTypes.some((t: string) => /case reports/i.test(t))) studyType = 'Case Report';
      else if (pubTypes.some((t: string) => /guideline|practice guideline/i.test(t))) studyType = 'Guideline';

      const { error } = await supabase.from('research_papers').upsert(
        {
          source_id: source?.id,
          title: item.title,
          authors,
          journal: item.fulljournalname || item.source,
          publication_date: item.pubdate ? new Date(item.pubdate).toISOString().split('T')[0] : null,
          pmid,
          abstract,
          original_url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          study_type: studyType,
          status: 'pending_review',
        },
        { onConflict: 'pmid', ignoreDuplicates: true }
      );

      if (!error) imported++;
    }

    return NextResponse.json({ imported, totalFound: pmids.length });
  } catch (err) {
    console.error('fetch-sources error:', err);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
