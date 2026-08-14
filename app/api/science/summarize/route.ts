import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { paperId } = await req.json();

    if (!paperId) {
      return NextResponse.json({ error: 'paperId mancante' }, { status: 400 });
    }

    // 1. Se esiste già una sintesi per questo paper, non richiamare OpenAI (fix costi)
    const { data: existing } = await supabase
      .from('research_summaries')
      .select('id')
      .eq('paper_id', paperId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ skipped: true, message: 'Sintesi già esistente' });
    }

    // 2. Recupera i dati grezzi del paper
    const { data: paper, error: paperError } = await supabase
      .from('research_papers')
      .select('title, abstract, journal, study_type')
      .eq('id', paperId)
      .single();

    if (paperError || !paper) {
      return NextResponse.json({ error: 'Paper non trovato' }, { status: 404 });
    }

    // 3. Genera la scheda AI
    const systemPrompt = `You are an experienced physiotherapy research assistant. Summarize a scientific paper for physiotherapists using ONLY the title, abstract, journal, and study type provided. Never invent results, numbers, p-values, sample sizes, DOIs, PMIDs, or conclusions. If the abstract is missing or a field cannot be determined from the given text, write exactly "Not available from abstract" for that field.

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
  "why_it_matters": ""
}`;

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

    // 4. Salva la sintesi
    const { error: insertError } = await supabase.from('research_summaries').insert({
      paper_id: paperId,
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
    });

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ error: 'Errore salvataggio sintesi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, summary });
  } catch (err) {
    console.error('summarize error:', err);
    return NextResponse.json({ error: 'Summarize failed' }, { status: 500 });
  }
}
