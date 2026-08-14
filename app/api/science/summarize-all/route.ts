import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = `You are an experienced physiotherapy research assistant. Summarize a scientific paper for physiotherapists using ONLY the title, abstract, journal, and study type provided. Never invent results, numbers, p-values, sample sizes, DOIs, PMIDs, or conclusions. If a field cannot be determined from the given text, write exactly "Not available from abstract".

Also assign a "relevance_score" from 0 to 100: how relevant and useful this study is specifically for a practicing physiotherapist's clinical decision-making (consider: direct clinical applicability, methodological rigor implied by study type, and whether the abstract gives enough usable detail). This is Phygo's own proprietary score, not an official scientific rating — be honest and conservative, do not inflate scores when the abstract is thin.

Return ONLY valid JSON with these exact keys, no markdown, no preamble:
{
  "clinical_question": "",
  "study_design": "",
  "population": "",
  "intervention": "",
  "comparator": "",
  "outcomes": "",
  "main_findings": "",
  "clinical_interpretation": "",
  "evidence_strength": "",
  "why_it_matters": "",
  "relevance_score": 0
}`;

const AUTO_PUBLISH_TYPES = ['Systematic Review', 'Meta-analysis', 'RCT'];
const AUTO_PUBLISH_THRESHOLD = 70;

async function summarizeOne(paper: {
  id: string;
  title: string;
  abstract: string | null;
  journal: string | null;
  study_type: string | null;
}) {
  const userPrompt = `Title: ${paper.title}
Journal: ${paper.journal || 'Not available'}
Study type: ${paper.study_type || 'Not available'}
Abstract: ${paper.abstract || 'Not available'}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const raw = completion.choices[0].message.content || '{}';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const summary = JSON.parse(cleaned);
  const relevanceScore = Math.max(0, Math.min(100, Number(summary.relevance_score) || 0));

  const { error: summaryError } = await supabase.from('research_summaries').upsert({
    paper_id: paper.id,
    clinical_question: summary.clinical_question,
    study_design: summary.study_design,
    population: summary.population,
    intervention: summary.intervention,
    comparator: summary.comparator,
    outcomes: summary.outcomes,
    main_findings: summary.main_findings,
    clinical_interpretation: summary.clinical_interpretation,
    evidence_strength: summary.evidence_strength,
    why_it_matters: summary.why_it_matters,
  }, { onConflict: 'paper_id' });

  if (summaryError) {
    console.error(`Errore insert research_summaries per paper ${paper.id}:`, JSON.stringify(summaryError));
  }

  const isTopTierType = AUTO_PUBLISH_TYPES.includes(paper.study_type || '');
  const shouldAutoPublish = isTopTierType && relevanceScore >= AUTO_PUBLISH_THRESHOLD;

  const { error: paperError } = await supabase
    .from('research_papers')
    .update({
      relevance_score: relevanceScore,
      status: shouldAutoPublish ? 'published' : 'pending_review',
    })
    .eq('id', paper.id);

  if (paperError) {
    console.error(`Errore update research_papers per paper ${paper.id}:`, JSON.stringify(paperError));
  }

  return {
    id: paper.id,
    success: !summaryError && !paperError,
    relevanceScore,
    autoPublished: shouldAutoPublish,
    summaryError: summaryError?.message || null,
    paperError: paperError?.message || null,
  };
}

export async function GET() {
  try {
    const { data: papers, error } = await supabase
      .from('research_papers')
      .select('id, title, abstract, journal, study_type, relevance_score, research_summaries(id)');

    if (error) {
      return NextResponse.json({ error: 'Errore lettura papers' }, { status: 500 });
    }

    const toSummarize = (papers || []).filter(
      (p: any) =>
        !p.research_summaries || p.research_summaries.length === 0 || p.relevance_score === null
    );

    if (toSummarize.length === 0) {
      return NextResponse.json({ message: 'Tutti i paper hanno già una sintesi', processed: 0 });
    }

    const results = await Promise.all(toSummarize.map(summarizeOne));

    return NextResponse.json({ processed: results.length, results });
  } catch (err) {
    console.error('summarize-all error:', err);
    return NextResponse.json({ error: 'Summarize-all failed' }, { status: 500 });
  }
}
