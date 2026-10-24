import { NextResponse } from 'next/server';
import { requireVerifiedProfessional } from '@/lib/auth/sessionServer';
import { consumeHourly, HOURLY_LIMITS, limitResponse } from '@/lib/rateLimit';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { lazy } from '@/lib/lazy';
import { paperRelevance, paperScore, searchTerms } from '@/lib/knowledge/paperRank';
import { regionsOf } from '@/lib/clinical/region';

// Collega il motore clinico AI (LiveStructuring) alla libreria Scienza/PubMed
// che esiste già in Phygo (research_papers + research_summaries, alimentata
// da app/api/science/fetch-sources e app/api/science/summarize). Non è un
// database di evidenze nuovo: interroga le stesse tabelle già usate dalla
// pagina Scienza, mostrando solo i paper con status "published" (quelli già
// passati dalla revisione editoriale in science/admin/review) — mai i
// "pending_review", per non presentare come evidenza qualcosa non ancora
// controllato.

const supabase = lazy(() => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
));

const openai = lazy(() => new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));

const MAX_RESULTS = 3;
const RANK = { direct: 0, indirect: 1, unverified: 2 } as const;

export async function POST(req: Request) {
  // Clinician-only paid AI operation (OpenAI) on real clinical information: verified professional + hourly cap.
  const gate = await requireVerifiedProfessional();
  if (!gate.ok) return gate.response;
  const limited = limitResponse(await consumeHourly(`ai:science-relevant:${gate.user.id}`, HOURLY_LIMITS.noteEnrichment));
  if (limited) return limited;

  try {
    const { primaryCondition, assessment } = await req.json();

    const clinicalText: string =
      (typeof primaryCondition === 'string' && primaryCondition.trim()) ||
      (typeof assessment === 'string' && assessment.trim()) ||
      '';

    if (!clinicalText) {
      return NextResponse.json({ papers: [] });
    }

    // Stessa strategia già usata in /api/exercise-intelligence: l'AI estrae
    // poche parole chiave di ricerca in inglese (i paper sono in inglese),
    // invece di cercare la frase clinica intera parola per parola.
    let keywords: string[] = [clinicalText];
    try {
      const kwCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Extract 2-4 short English search keywords for a PubMed physiotherapy research search, from a clinical condition or assessment. Respond ONLY in valid JSON: { "keywords": ["...", "..."] }. Keywords should be clinical/anatomical terms (e.g. "rotator cuff tendinopathy", "low back pain", "ACL reconstruction"), not full sentences.',
          },
          { role: 'user', content: clinicalText },
        ],
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(kwCompletion.choices[0]?.message?.content || '{}');
      if (Array.isArray(parsed.keywords) && parsed.keywords.length > 0) {
        keywords = parsed.keywords.slice(0, 4);
      }
    } catch (kwErr) {
      console.error('science/relevant keyword extraction failed:', kwErr);
      // fallback: cerchiamo comunque con il testo grezzo
    }

    const terms = searchTerms(keywords);
    const orFilter = [...terms.phrases, ...terms.words]
      .map((k) => k.replace(/[%,()*]/g, ' ').trim())
      .filter(Boolean)
      .map((k) => `title.ilike.%${k}%,abstract.ilike.%${k}%`)
      .join(',');

    if (!orFilter) {
      return NextResponse.json({ papers: [] });
    }

    const { data: found, error } = await supabase
      .from('research_papers')
      .select(
        'id, title, abstract, authors, journal, publication_date, study_type, pmid, original_url, status, research_summaries(clinical_question, main_findings, why_it_matters, clinical_interpretation, evidence_strength)'
      )
      .eq('status', 'published')
      .or(orFilter)
      .order('publication_date', { ascending: false })
      .limit(40);

    if (error) {
      console.error('science/relevant query error:', error);
      return NextResponse.json({ papers: [] });
    }

    // Only papers pertinent to the condition (lib/knowledge/paperRank.ts):
    // direct first, then indirect (same region before another region with the
    // same mechanism), then unverified; most relevant, then newest, on a tie.
    const regions = regionsOf(`${typeof primaryCondition === 'string' ? primaryCondition : ''} ${typeof assessment === 'string' ? assessment : ''}`);
    const data = (found || [])
      .filter((p: any) => p.status === 'published')
      .map((p: any) => ({ p, score: paperScore(p, terms), relevance: paperRelevance(p, terms, regions) }))
      .filter((x) => x.score > 0 && x.relevance !== null)
      .sort((a, b) => RANK[a.relevance!.level] - RANK[b.relevance!.level] || Number(a.relevance!.reason === 'same_mechanism_other_region') - Number(b.relevance!.reason === 'same_mechanism_other_region') || b.score - a.score || String(b.p.publication_date ?? '').localeCompare(String(a.p.publication_date ?? '')))
      .slice(0, MAX_RESULTS);

    const papers = data.map(({ p, relevance }: any) => ({
      id: p.id,
      relevance: relevance.level,
      relevance_reason: relevance.reason,
      title: p.title,
      authors: p.authors,
      journal: p.journal,
      publication_date: p.publication_date,
      study_type: p.study_type,
      pmid: p.pmid,
      original_url: p.original_url,
      why_it_matters: p.research_summaries?.why_it_matters || null,
      clinical_question: p.research_summaries?.clinical_question || null,
      evidence_strength: p.research_summaries?.evidence_strength || null,
    }));

    return NextResponse.json({ papers, matchedKeywords: keywords });
  } catch (err) {
    console.error('science/relevant error:', err);
    return NextResponse.json({ papers: [] }, { status: 500 });
  }
}
