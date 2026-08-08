import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transcript, assessment, exercisesDraft, phases, lang } = await request.json();

    if (!Array.isArray(phases) || phases.length === 0) {
      return NextResponse.json({ exercises: exercisesDraft || [] });
    }

    const phasesText = phases
      .map(
        (p: any) =>
          `Phase ${p.phase_number} - ${p.phase_name} (typical duration: ${p.typical_duration}): goals: ${p.phase_goals}. Reference exercises for this phase: ${p.phase_exercises}. Criteria to progress: ${p.criteria_to_progress}.`
      )
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an experienced physiotherapist, reasoning together with a physician's clinical judgement, writing the exercise prescription for THIS patient in THIS session.

You are given: what the therapist said in this session, the clinical assessment, a draft list of exercises, and the full evidence-based rehab protocol for this condition broken into phases.

Your job: identify the current phase of recovery (using clues in the transcript about timing, symptoms, and function — do not default to phase 1 unless the transcript suggests early recovery or gives no clue), then write a richer, more specific set of exercises appropriate to that phase.

Behavior:
- Do NOT limit yourself to 2-3 generic exercises. Reason across relevant functional categories: strengthening, balance and proprioception, gait or ambulation training, joint mobility, and cardiovascular conditioning. Cardiovascular conditioning (for example stationary cycling, brisk walking, or swimming/aquatic exercise, chosen based on what is safe and appropriate for the joint and phase involved) should be actively considered and included whenever the patient's phase and precautions allow it, not only in the rare case where it seems obviously indicated — it is a routinely relevant category in rehabilitation and should not be skipped by default.
- When strengthening is relevant to a limb or joint, consider whether bilateral work is clinically appropriate (e.g. strengthening both legs after a unilateral hip or knee procedure) unless the transcript or assessment indicates a reason not to (e.g. contralateral injury).
- Always respect any precautions or contraindications mentioned in the transcript or assessment (e.g. dislocation risk, weight-bearing restrictions, surgical approach). Never prescribe an exercise that would conflict with a stated precaution.
- Use the reference exercises listed for the identified phase as a starting point, but you are expected to expand and adapt them into a fuller, more clinically realistic set for this specific patient, the way an experienced clinician would, not just copy the reference list verbatim.
- Each exercise should include practical prescription detail: sets, repetitions, and frequency, or hold time and frequency for stretches/isometrics.
- Do not invent patient facts not mentioned in the transcript or assessment.
- Respond in the same language as the transcript (use "${lang || 'it'}" as a hint if unclear).

Rehab protocol phases available:
${phasesText}

Respond ONLY in valid JSON: { "exercises": ["exercise 1 with prescription detail", "exercise 2 with prescription detail", "..."] }`,
        },
        {
          role: "user",
          content: `Transcript: ${transcript}\n\nAssessment: ${assessment || ""}\n\nDraft exercises: ${
            Array.isArray(exercisesDraft) ? exercisesDraft.join("; ") : ""
          }`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ exercises: exercisesDraft || [] });
    }

    const parsed = JSON.parse(raw);
    return NextResponse.json({ exercises: Array.isArray(parsed.exercises) ? parsed.exercises : exercisesDraft || [] });
  } catch (err) {
    console.error("Errore refine-exercises:", err);
    return NextResponse.json(
      { exercises: null, error: "Errore nella generazione degli esercizi." },
      { status: 500 }
    );
  }
}
