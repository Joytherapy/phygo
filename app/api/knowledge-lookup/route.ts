import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireVerifiedProfessional } from '@/lib/auth/sessionServer';
import { consumeHourly, HOURLY_LIMITS } from '@/lib/rateLimit';
import { serviceClient } from '@/lib/verification';
import { lazy } from '@/lib/lazy';
import { bestCondition, conditionStated, diagnosisStatus, isRegionalSheet, REGION_SYMPTOMS, type KbRow } from '@/lib/knowledge/conditionMatch';
import { textCertainty } from '@/lib/clinical/facts';
import { analyzeMentions, REGION_WORDS, regionFit, regionsOf, type Region } from '@/lib/clinical/region';
import { caseOf, conditionRegionsOf, otherRegionsOf } from '@/lib/clinical/coherence';
import { mainSheetStatus, sheetRegions } from '@/lib/knowledge/sheetDiagnosis';

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
// Either way a sheet of another body region is never a candidate (a generic
// keyword, "tendinopatia", must not bring the Achilles sheet to a shoulder
// note); sheets of a compatible region are tried first, and a sheet whose
// region, or the condition's, is not recognised comes back marked as not
// verified, with the reason.
export async function POST(request: Request) {
  const gate = await requireVerifiedProfessional();
  if (!gate.ok) return gate.response;
  const db = serviceClient();
  if (!db) return NextResponse.json({ match: null, phases: [] }, { status: 503 });

  try {
    const { assessment, primaryCondition, lang, transcript } = await request.json();
    const said = typeof transcript === 'string' ? transcript.slice(0, 8000) : '';
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

    const conditionRegions = conditionRegionsOf(primary, text);
    const fitOf = (r: KbRow) => regionFit(sheetRegions(r), conditionRegions);
    const verified = rows.filter((r) => fitOf(r) === 'compatible');
    const unverified = rows.filter((r) => fitOf(r) === 'unknown');
    const candidates = [...verified, ...unverified];

    let match: (KbRow & Record<string, any>) | null = null;
    let matchedKeyword: string | null = null;
    let matchedBy: 'keyword' | 'ai' | null = null;
    const found = bestCondition(verified, primary, text) ?? bestCondition(unverified, primary, text);
    if (found) {
      match = found.row as KbRow & Record<string, any>;
      matchedKeyword = found.keyword;
      matchedBy = 'keyword';
    } else if (candidates.length > 0 && (await consumeHourly(`ai:knowledge-lookup:${gate.user.id}`, HOURLY_LIMITS.noteEnrichment)) === 'allowed') {
      try {
        const list = candidates.map((r) => `${r.id}\t${r.condition_name ?? ''}`).join('\n');
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
        const picked = id == null ? null : candidates.find((r) => String(r.id) === String(id)) ?? null;
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

    const inLang = (row: (KbRow & Record<string, any>) | null) => (row && lang && lang !== 'it' && row.translations?.[lang] ? { ...row, ...row.translations[lang] } : row);
    const finalMatch = inLang(match);

    // Other regions treated today (e.g. the left knee besides the right
    // shoulder): a sheet for each, among the sheets of that region only, with
    // its side. In order: a condition the clinician named for it; the regional
    // sheet for the symptom they described ("dolore al ginocchio"), never a
    // more specific diagnosis; a condition only the assessment names, or the
    // AI's choice, both marked as not verified. Otherwise none, with the reason.
    const view = caseOf(said, { primaryCondition: primary, assessment: text });
    const sentencesAbout = (source: string, region: Region) =>
      source.split(/(?<=[.;!?])\s+|\n+/).filter((sentence) => analyzeMentions(sentence).some((m) => m.region === region && m.status === 'active')).join(' ');
    const ownSheet = (r: KbRow) => regionsOf([r.condition_name, r.condition_keywords].filter(Boolean).join(' '));
    // What the clinician said of a sheet's diagnosis (lib/clinical/facts.ts
    // textCertainty, as in the note's checks). A condition they excluded, or
    // named without settling it, does not make the sheet verified.
    const statusOf = (row: KbRow, source: string, sameRegion: boolean) => diagnosisStatus(row, source, REGION_WORDS, sameRegion, textCertainty);
    const DIAGNOSIS_REASON: Partial<Record<string, string>> = { excluded: 'diagnosis_excluded', ambiguous: 'diagnosis_ambiguous' };
    const others = [];
    for (const { region, side } of otherRegionsOf(view)) {
      const pool = rows.filter((r) => ownSheet(r).length > 0 && regionFit(sheetRegions(r), [region]) === 'compatible');
      const brief = (row: KbRow & Record<string, any>) => {
        const l = inLang(row)!;
        return { id: l.id, condition_name: l.condition_name, source: l.source ?? null, source_date: l.source_date ?? null, evidence_level: l.evidence_level ?? null };
      };
      // The condition the clinician named for it, not one they excluded.
      const about = sentencesAbout(said, region);
      let stated = bestCondition(pool, '', about);
      for (let rest = pool; stated && statusOf(stated.row, about, true) === 'excluded'; ) {
        rest = rest.filter((r) => r !== stated!.row);
        stated = bestCondition(rest, '', about);
      }
      const regional = pool.filter((r) => isRegionalSheet(r, region));
      const symptom = !stated && regional.length && view.profile.active.includes(region) ? { row: regional[0] } : null;
      const fromAssessment = !stated && !symptom ? bestCondition(pool, '', sentencesAbout(text, region)) : null;
      let entry: Record<string, any> | null = null;
      if (stated) entry = { match: brief(stated.row as any), relevance: 'verified', relevanceReason: null, matchedBy: 'keyword' };
      else if (symptom) entry = { match: brief(symptom.row as any), relevance: 'verified', relevanceReason: 'symptom_only', matchedBy: 'symptom' };
      else if (fromAssessment) {
        const ok = !said || conditionStated(fromAssessment.row, said, REGION_WORDS, true);
        entry = { match: brief(fromAssessment.row as any), relevance: ok ? 'verified' : 'unverified', relevanceReason: ok ? null : 'diagnosis_not_stated', matchedBy: 'keyword' };
      } else if (pool.length && (await consumeHourly(`ai:knowledge-lookup:${gate.user.id}`, HOURLY_LIMITS.noteEnrichment)) === 'allowed') {
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'You map ONE body region of a physiotherapy note to ONE condition sheet from a fixed list (id<TAB>name, names in Italian). Answer ONLY JSON {"id": "<id from the list>"} for the sheet that covers what the therapist said about this region, or {"id": null} if none does. Never pick a diagnosis more specific than what was said; prefer a generic regional sheet when only pain or a symptom was described.',
              },
              { role: 'user', content: `Region: ${region}${side ? ` (${side})` : ''}\nWhat the therapist said about it: ${sentencesAbout(said, region) || '(nothing specific)'}\nAssessment about it: ${sentencesAbout(text, region)}\n\nList:\n${pool.map((r) => `${r.id}\t${r.condition_name ?? ''}`).join('\n')}` },
            ],
          });
          const id = JSON.parse(completion.choices[0]?.message?.content || '{}')?.id;
          const picked = id == null ? null : pool.find((r) => String(r.id) === String(id)) ?? null;
          if (picked) entry = { match: brief(picked as any), relevance: 'unverified', relevanceReason: 'ai_choice', matchedBy: 'ai' };
        } catch (aiErr) {
          console.error('knowledge-lookup: AI fallback (other region) failed:', aiErr instanceof Error ? aiErr.message : aiErr);
        }
      }
      const shown = entry?.match ? pool.find((r) => String(r.id) === String(entry!.match.id)) : null;
      const status = shown && said ? statusOf(shown, about, true) : null;
      if (entry && status && DIAGNOSIS_REASON[status]) entry = { ...entry, relevance: 'unverified', relevanceReason: DIAGNOSIS_REASON[status] };
      others.push({ region, side, ...(entry ?? { match: null, relevance: null, relevanceReason: pool.length ? 'no_matching_sheet' : 'no_sheet_for_region', matchedBy: null }), diagnosisStatus: status });
    }
    const finalPhases = lang && lang !== 'it' ? phases.map((p: any) => (p.translations?.[lang] ? { ...p, ...p.translations[lang] } : p)) : phases;

    // Not verified when the sheet's region, or the condition's, is not
    // recognised, or when the clinician did not state the sheet's condition
    // (it comes from the model's assessment, e.g. "cuffia dei rotatori" for
    // "dolore alla spalla").
    let relevance: 'verified' | 'unverified' | null = match ? (fitOf(match) === 'compatible' ? 'verified' : 'unverified') : null;
    let relevanceReason: string | null = relevance === 'unverified' ? (conditionRegions.length ? 'sheet_region_unknown' : 'case_region_unknown') : null;
    if (match && relevance === 'verified' && said && !conditionStated(match, said, REGION_WORDS, regionFit(sheetRegions(match), view.profile.active) === 'compatible')) {
      relevance = 'unverified';
      relevanceReason = 'diagnosis_not_stated';
    }

    // Two separate things: `relevance` is whether the sheet matches the case as
    // documented (its region, and its condition named by the clinician);
    // `diagnosisStatus` is what the clinician said of that diagnosis (stated,
    // suspected, excluded, ambiguous, not stated). A matching sheet never
    // confirms a diagnosis; one whose diagnosis they excluded, or named
    // without settling it, is not verified.
    const diagnosis = match && said ? mainSheetStatus(match, said, { primaryCondition: primary, assessment: text }) : null;
    if (diagnosis && DIAGNOSIS_REASON[diagnosis]) {
      relevance = 'unverified';
      relevanceReason = DIAGNOSIS_REASON[diagnosis]!;
    }

    return NextResponse.json({
      match: finalMatch || null,
      relevance,
      relevanceReason,
      diagnosisStatus: diagnosis,
      phases: finalPhases,
      evidenceLevel: match?.evidence_level || null,
      matchedKeyword,
      matchedBy,
      others,
    });
  } catch (err) {
    console.error('Knowledge lookup error:', err);
    return NextResponse.json({ match: null, phases: [] });
  }
}
