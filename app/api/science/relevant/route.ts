import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Collega il motore clinico AI (LiveStructuring) alla libreria Scienza/PubMed
// che esiste già in Phygo (research_papers + research_summaries, alimentata
// da app/api/science/fetch-sources e app/api/science/summarize). Non è un
// database di evidenze nuovo: interroga le stesse tabelle già usate dalla
// pagina Scienza, mostrando solo i paper con status "published" (quelli già
// passati dalla revisione editoriale in science/admin/review) — mai i
// "pending_review", per non presentare come evidenza qualcosa non ancora
// controllato.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_RESULTS = 3;

export async function POST(req: Request) {
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

    const orFilter = keywords
      .map((k) => k.replace(/[%,]/g, ' ').trim())
      .filter(Boolean)
      .map((k) => `title.ilike.%${k}%,abstract.ilike.%${k}%`)
      .join(',');

    if (!orFilter) {
      return NextResponse.json({ papers: [] });
    }

    const { data, error } = await supabase
      .from('research_papers')
      .select(
        'id, title, authors, journal, publication_date, study_type, pmid, original_url, research_summaries(clinical_question, main_findings, why_it_matters, clinical_interpretation, evidence_strength)'
      )
      .eq('status', 'published')
      .or(orFilter)
      .order('publication_date', { ascending: false })
      .limit(MAX_RESULTS);

    if (error) {
      console.error('science/relevant query error:', error);
      return NextResponse.json({ papers: [] });
    }

    const papers = (data || []).map((p: any) => ({
      id: p.id,
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
