import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transcript, assessment, planDraft, phases, lang } = await request.json();

    if (!Array.isArray(phases) || phases.length === 0) {
      return NextResponse.json({ plan: planDraft || "" });
    }

    const phasesText = phases
      .map(
        (p: any) =>
          `Phase ${p.phase_number} - ${p.phase_name} (typical duration: ${p.typical_duration}): goals: ${p.phase_goals}. Exercises: ${p.phase_exercises}. Criteria to progress: ${p.criteria_to_progress}.`
      )
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an experienced physiotherapist writing the "Plan" section of a clinical note. You are given: what the therapist said in this session, the clinical assessment, a draft plan, and the full evidence-based rehab protocol for this condition, broken into phases.

Your job: write a SHORT, CONCRETE plan describing only what to do with THIS patient in THIS session and the immediately following 1-2 sessions — not the entire rehab path from the beginning.

Behavior:
- Read the transcript carefully for any clue about where the patient currently is in their recovery (e.g. "week 4 post-op", "3 months in", "just had surgery yesterday", "already walking without aids"). Use this to pick the MOST APPROPRIATE phase from the list below — do not default to phase 1 unless the transcript suggests the patient is early in recovery or gives no clue at all.
- If the transcript gives no clue about timing, use your clinical judgement based on what the therapist described (symptoms, function) to pick the closest matching phase, and briefly note the assumption.
- Do NOT restate the entire rehab protocol. Only describe what applies to the current and next 1-2 sessions: which exercises to do now, at what frequency, and what to watch for before progressing.
- End with one short sentence pointing to the full phased protocol below for reference. This closing sentence MUST be written in the same language as the rest of your response (the example "See the full rehab protocol below for later phases." is in English only to illustrate the idea — translate it, do not copy it verbatim).
- Respond in the same language as the transcript (use "${lang || 'it'}" as a hint if unclear).
- Do not invent patient facts not mentioned in the transcript or assessment.

Rehab protocol phases available:
${phasesText}

Respond ONLY in valid JSON: { "plan": "the refined plan text" }`,
        },
        {
          role: "user",
          content: `Transcript: ${transcript}\n\nAssessment: ${assessment || ""}\n\nDraft plan: ${planDraft || ""}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ plan: planDraft || "" });
    }

    const parsed = JSON.parse(raw);
    return NextResponse.json({ plan: parsed.plan || planDraft || "" });
  } catch (err) {
    console.error("Errore refine-plan:", err);
    return NextResponse.json({ plan: null, error: "Errore nella generazione del piano." }, { status: 500 });
  }
}
