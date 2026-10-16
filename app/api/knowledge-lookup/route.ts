import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { lazy } from '@/lib/lazy';

const supabase = lazy(() => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
));

export async function POST(request: Request) {
  try {
const { assessment, primaryCondition, lang } = await request.json();

    if (!assessment || typeof assessment !== 'string') {
      return NextResponse.json({ match: null });
    }

    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ match: null });
    }

const normalize = (s: string) => s.toLowerCase().replace(/['’]/g, '');
const textForMatching = primaryCondition && typeof primaryCondition === 'string' ? primaryCondition : assessment;
const assessmentLower = normalize(textForMatching);

    let matchedKeyword: string | null = null;

const match = data?.find((row) => {
  // A row without keywords cannot match (and must not break the lookup for the others).
  const keywords = String(row.condition_keywords ?? '')
  .split(',')
  .filter((k: string) => k.trim())
  .map((k: string) => normalize(k.trim()));

  const found = keywords.find((keyword: string) => assessmentLower.includes(keyword));
  if (found) {
    matchedKeyword = found;
    return true;
  }
  return false;
});


    let phases: any[] = [];
    if (match) {
      const { data: phasesData } = await supabase
        .from('rehab_phases')
        .select('*')
        .eq('condition_id', match.id)
        .order('phase_number', { ascending: true })
        .order('id', { ascending: false });
      // Same rule as the condition page: one entry per phase number, keeping
      // the most recent copy (a few protocols were imported twice).
      const seen = new Set<number>();
      phases = (phasesData || []).filter((p: any) => {
        if (seen.has(p.phase_number)) return false;
        seen.add(p.phase_number);
        return true;
      });
    }

    let finalMatch = match;
    if (match && lang && lang !== 'it' && match.translations && match.translations[lang]) {
      finalMatch = { ...match, ...match.translations[lang] };
    }

let finalPhases = phases;
if (lang && lang !== 'it') {
  finalPhases = phases.map((p: any) =>
    p.translations && p.translations[lang] ? { ...p, ...p.translations[lang] } : p
  );
}

return NextResponse.json({
  match: finalMatch || null,
  phases: finalPhases,
  evidenceLevel: match?.evidence_level || null,
  matchedKeyword: matchedKeyword || null,
});
  } catch (err) {
    console.error('Knowledge lookup error:', err);
    return NextResponse.json({ match: null });
  }
}
