import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedProfessional } from "@/lib/auth/sessionServer";
import { consumeHourly, HOURLY_LIMITS, limitResponse } from "@/lib/rateLimit";
import OpenAI from "openai";
import { lazy } from "@/lib/lazy";
import { serviceClient } from "@/lib/verification";
import { protocolMode, protocolUse, type KbRow, type ProtocolMode } from "@/lib/knowledge/conditionMatch";
import { mainSheetRegionFit, mainSheetStatus } from "@/lib/knowledge/sheetDiagnosis";

const openai = lazy(() => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}));

// How the protocol is presented to the model: never as a confirmed diagnosis
// unless the clinician stated it, and even then as a reference that does not
// prove it fits this patient.
const PROTOCOL_INTRO: Record<ProtocolMode, string> = {
  stated: "the rehab protocol of the condition the therapist stated today, broken into phases. It is a reference: the diagnosis is the therapist's, but the protocol does not by itself show that every exercise suits this patient; each exercise must also fit what was found today",
  suspected: "the rehab protocol of a condition the therapist only SUSPECTS, broken into phases. It is a hypothesis, NOT a confirmed diagnosis: do not write, name or imply that the patient has this condition, and do not present the exercises as its treatment. Keep the exercises justified by the documented findings, symptoms and functional limitations, and take from the protocol only what those findings also justify",
  chosen: "a rehab protocol the therapist chose as a reference, broken into phases; the condition it is for was NOT stated in this session. Do not present it as the patient's diagnosis. Keep the exercises justified by the documented findings, symptoms and functional limitations, and use the protocol only as a reference for what those findings justify",
};

/**
 * The exercises refined with the main condition sheet's protocol, as far as
 * what the clinician said of its diagnosis allows (lib/knowledge/conditionMatch.ts
 * protocolUse), decided here and not by the caller: the sheet and its phases
 * are read from the database by id (a protocol sent by the caller is never
 * used as such), and the diagnosis status is computed from the transcript as
 * /api/knowledge-lookup does (a status sent by the caller is ignored). Not
 * usable, the draft comes back unchanged: the exercises the clinician's
 * documentation justifies, with why the protocol was not used.
 */
export async function POST(request: NextRequest) {
  // Clinician-only paid AI operation (OpenAI) on real clinical information: verified professional + hourly cap.
  const gate = await requireVerifiedProfessional();
  if (!gate.ok) return gate.response;
  const limited = limitResponse(await consumeHourly(`ai:refine-exercises:${gate.user.id}`, HOURLY_LIMITS.noteEnrichment));
  if (limited) return limited;

  try {
    const body = await request.json();
    const { transcript, assessment, exercisesDraft, lang, primaryCondition, protocolChoice } = body ?? {};
    const draft = Array.isArray(exercisesDraft) ? exercisesDraft : [];
    const said = typeof transcript === "string" ? transcript.slice(0, 8000) : "";
    const text = typeof assessment === "string" ? assessment.slice(0, 4000) : "";
    const primary = typeof primaryCondition === "string" ? primaryCondition.slice(0, 300) : "";
    const notUsed = (reason: string, status: string | null = null) => NextResponse.json({ exercises: draft, protocol: { used: false, mode: null, status, reason } });

    // The sheet: by id (older callers sent its phases, which name it).
    const id = body?.conditionId ?? (Array.isArray(body?.phases) ? body.phases[0]?.condition_id : null);
    if (id === null || id === undefined || id === "") return notUsed("no_protocol");
    const db = serviceClient();
    if (!db) return notUsed("protocol_unverifiable");
    const { data: rows, error: rowError } = await db.from("knowledge_base").select("*").eq("id", id);
    const row = (rows ?? []).find((r: any) => String(r.id) === String(id)) as (KbRow & Record<string, any>) | undefined;
    if (rowError || !row) return notUsed("no_protocol");
    const { data: phaseRows } = await db.from("rehab_phases").select("*").eq("condition_id", row.id).order("phase_number", { ascending: true });
    const phases = (phaseRows ?? []).filter((p: any) => String(p.condition_id) === String(row.id)).sort((a: any, b: any) => (a.phase_number ?? 0) - (b.phase_number ?? 0));
    if (!phases.length) return notUsed("no_protocol");

    // A protocol of another body region never reaches the model, not even by the clinician's choice.
    if (mainSheetRegionFit(row, said, { primaryCondition: primary, assessment: text }) === "incompatible") return notUsed("region_mismatch");

    const status = mainSheetStatus(row, said, { primaryCondition: primary, assessment: text });
    const mode = protocolMode(status, protocolChoice === "clinician");
    if (!mode) return notUsed(protocolUse(status) === "on_choice" ? "needs_clinician_choice" : "diagnosis_not_usable", status);

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

You are given: what the therapist said in this session, the clinical assessment, a draft list of exercises, and ${PROTOCOL_INTRO[mode]}.

Your job: identify the current phase of recovery (using clues in the transcript about timing, symptoms, and function — do not default to phase 1 unless the transcript suggests early recovery or gives no clue), then write a richer, more specific set of exercises appropriate to that phase.

Behavior:
- Do NOT limit yourself to 2-3 generic exercises. Reason across the functional categories that are relevant to the problem documented today: strengthening, joint mobility, motor control, and, where they apply to the region involved, balance and proprioception or gait training. Cardiovascular conditioning (for example stationary cycling, brisk walking, or swimming/aquatic exercise) may be added when it is safe and appropriate for the phase.
- If the transcript describes more than one body region treated today (e.g. right shoulder and left knee), keep exercises for each of them, each with its own side; the protocol phases below are for the main condition only.
- Every exercise must target a body region treated today, its neighbouring structures (e.g. scapular and thoracic work for the shoulder; hip and ankle work for the knee), or a general need the transcript supports. Do NOT add exercises for another body region (e.g. ankle mobility or hamstring stretching for a shoulder problem) unless the transcript describes a problem or goal in that region. Keep the side stated by the therapist (left/right) and never switch it.
- When strengthening a limb after a unilateral problem, work on the opposite limb may be considered only when clinically appropriate and no reason against it is given (e.g. contralateral injury).
- Always respect any precautions or contraindications mentioned in the transcript or assessment (e.g. dislocation risk, weight-bearing restrictions, surgical approach). Never prescribe an exercise that would conflict with a stated precaution.
- Use the reference exercises listed for the identified phase as a starting point, but you are expected to expand and adapt them into a fuller, more clinically realistic set for this specific patient, the way an experienced clinician would, not just copy the reference list verbatim.
- Each exercise should include practical prescription detail: sets, repetitions, and frequency, or hold time and frequency for stretches/isometrics.
- Do not invent patient facts not mentioned in the transcript or assessment.
- Respond in the same language as the transcript (use "${lang || 'it'}" as a hint if unclear).

Rehab protocol phases available (${mode === "stated" ? "for the condition the therapist stated" : mode === "suspected" ? "for a SUSPECTED condition, not confirmed" : "chosen by the therapist as a reference; condition not stated"}):
${phasesText}

Respond ONLY in valid JSON: { "exercises": ["exercise 1 with prescription detail", "exercise 2 with prescription detail", "..."] }`,
        },
        {
          role: "user",
          content: `Transcript: ${said}\n\nAssessment: ${text}\n\nDraft exercises: ${draft.join("; ")}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content;
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || !Array.isArray(parsed.exercises)) return notUsed("no_answer", status);
    return NextResponse.json({ exercises: parsed.exercises, protocol: { used: true, mode, status, reason: null } });
  } catch (err) {
    console.error("Errore refine-exercises:", err);
    return NextResponse.json(
      { exercises: null, error: "Errore nella generazione degli esercizi." },
      { status: 500 }
    );
  }
}
