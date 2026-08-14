import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Cerca su PubMed studi recenti di fisioterapia (query di test)
    const searchRes = await fetch(
      'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=physiotherapy+rehabilitation&retmax=8&sort=date&retmode=json'
    );
    const searchData = await searchRes.json();
    const pmids: string[] = searchData.esearchresult?.idlist || [];

    if (pmids.length === 0) {
      return NextResponse.json({ imported: 0, message: 'Nessun PMID trovato' });
    }

    // 2. Recupera i dettagli (titolo, autori, journal, abstract) per quei PMID
    const summaryRes = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`
    );
    const summaryData = await summaryRes.json();

    const fetchRes = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    );
    const xmlText = await fetchRes.text();

    // 3. Recupera l'id della fonte "PubMed" già inserita
    const { data: source } = await supabase
      .from('research_sources')
      .select('id')
      .eq('source_type', 'pubmed')
      .single();

    let imported = 0;

    for (const pmid of pmids) {
      const item = summaryData.result?.[pmid];
      if (!item) continue;

      // Estrae l'abstract dal blocco XML corrispondente a questo PMID (parsing semplice)
      const articleBlock = xmlText.split(`<PMID Version="1">${pmid}</PMID>`)[1] || '';
      const abstractMatch = articleBlock
        .split('</AbstractText>')[0]
        ?.split(/<AbstractText[^>]*>/)?.[1];
      const abstract = abstractMatch ? abstractMatch.trim() : null;

      const authors = (item.authors || [])
        .map((a: { name: string }) => a.name)
        .join(', ');

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
