import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireVerifiedProfessional } from '@/lib/auth/sessionServer';
import { consumeHourly, HOURLY_LIMITS } from '@/lib/rateLimit';
import { serviceClient } from '@/lib/verification';
import { lazy } from '@/lib/lazy';
import { bestCondition, type KbRow } from '@/lib/knowledge/conditionMatch';

export const dynamic = 'force-dynamic';

const openai = lazy(() => new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
const PAGE = 1000;

// The condition sheet and rehab phases for a note (LiveStructuring, after
// "Generate note"). Every sheet is read (the table has more rows than one
// PostgREST page), and names and keywords in every language are matched
// against both the primary condition and the assessment
// (lib/knowledge/conditionMatch.ts). Only when nothing matches, the AI is
// asked to pick one of the existing sheets by name, or none: it never writes
// clinical content, and an id it returns that is not in the list is ignored.
export async function POST(request: Request) {
  const gate = await requireVerifiedProfessional();
  if (!gate.ok) return gate.response;
  const db = serviceClient();
  if (!db) return NextResponse.json({ match: null, phases: [] }, { status: 503 });

  try {
    const { assessment, primaryCondition, lang } = await request.json();
    const primary = typeof primaryCondition === 'string' ? primaryCondition.slice(0, 300) : '';
    const text = typeof assessment === 'string' ? assessment.slice(0, 4000) : '';
    if (!primary && !text) return NextResponse.json({ match: null, phases: [] });

    const rows: (KbRow & Record<string, any>)[] = [];
    for (let page = 0; ; page++) {
      const { data, error } = await db.from('knowledge_base').select('*').order('id', { ascending: true }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) {
        console.error('knowledge-lookup: read failed:', error.code, error.message);
        return NextResponse.json({ match: null, phases: [] });
      }
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
    }

    let match: (KbRow & Record<string, any>) | null = null;
    let matchedKeyword: string | null = null;
    let matchedBy: 'keyword' | 'ai' | null = null;
    const found = bestCondition(rows, primary, text);
    if (found) {
      match = found.row as KbRow & Record<string, any>;
      matchedKeyword = found.keyword;
      matchedBy = 'keyword';
    } else if (rows.length > 0 && (await consumeHourly(`ai:knowledge-lookup:${gate.user.id}`, HOURLY_LIMITS.noteEnrichment)) === 'allowed') {
      try {
        const list = rows.map((r) => `${r.id}\t${r.condition_name ?? ''}`).join('\n');
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You map a physiotherapy note to ONE condition sheet from a fixed list (id<TAB>name, names in Italian). Answer ONLY JSON {"id": "<id from the list>"} for the sheet that clearly covers the condition treated today, or {"id": null} if none clearly does. Never guess loosely.',
            },
            { role: 'user', content: `Primary condition: ${primary}\nAssessment: ${text.slice(0, 1500)}\n\nList:\n${list}` },
          ],
        });
        const id = JSON.parse(completion.choices[0]?.message?.content || '{}')?.id;
        const picked = id == null ? null : rows.find((r) => String(r.id) === String(id)) ?? null;
        if (picked) {
          match = picked;
          matchedKeyword = picked.condition_name ?? null;
          matchedBy = 'ai';
        }
      } catch (aiErr) {
        console.error('knowledge-lookup: AI fallback failed:', aiErr instanceof Error ? aiErr.message : aiErr);
      }
    }

    let phases: any[] = [];
    if (match) {
      const { data: phasesData, error: phasesError } = await db
        .from('rehab_phases')
        .select('*')
        .eq('condition_id', match.id)
        .order('phase_number', { ascending: true });
      if (phasesError) console.error('knowledge-lookup: phases failed:', phasesError.code, phasesError.message);
      phases = (phasesData ?? []).filter((p: any) => String(p.condition_id) === String(match!.id)).sort((a: any, b: any) => (a.phase_number ?? 0) - (b.phase_number ?? 0));
    }

    const finalMatch = match && lang && lang !== 'it' && match.translations?.[lang] ? { ...match, ...match.translations[lang] } : match;
    const finalPhases = lang && lang !== 'it' ? phases.map((p: any) => (p.translations?.[lang] ? { ...p, ...p.translations[lang] } : p)) : phases;

    return NextResponse.json({
      match: finalMatch || null,
      phases: finalPhases,
      evidenceLevel: match?.evidence_level || null,
      matchedKeyword,
      matchedBy,
    });
  } catch (err) {
    console.error('Knowledge lookup error:', err);
    return NextResponse.json({ match: null, phases: [] });
  }
}
