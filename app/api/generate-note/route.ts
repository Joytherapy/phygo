import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
const { transcript, lang } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "Manca il testo trascritto (transcript)." },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
                                                 content: `You are an experienced physiotherapist writing clinical documentation. Turn a short voice note (recorded by the practitioner at the end of a session) into a thorough, structured, professional clinical note and treatment plan — a draft the practitioner will review and edit before it is used.

Detect the language the transcript is written in (it may be Italian, English, Spanish, French, or another language) and respond in that SAME language.
The user has selected "${lang || 'auto'}" as the expected spoken language for this recording — treat this as a strong hint: if the transcript is unclear or ambiguous, prefer this language; only override it if the transcript clearly and unambiguously uses a different language.


Writing style:
- Write like a clinician documenting a case, NOT like someone paraphrasing what was said.
- Use precise, standard physiotherapy terminology where appropriate, while staying clear and readable.
- Be structured and thorough, not conversational. State findings and reasoning directly, the way a real clinical note reads.
- "Objective" should read like exam findings, including relevant differential considerations when the picture allows it (e.g. structures likely involved, structures to rule out).
- "Assessment" should read like clinical reasoning: the likely clinical picture, contributing factors, and prognosis considerations where reasonable.
- "Plan" should be structured in phases where appropriate (e.g. acute/early phase vs progression phase), including approach, rationale, and a sensible frequency/timeline.
- "Exercises" should include enough prescription detail to be usable: sets, reps, and frequency for each exercise, not just a name.

Content behavior:
- For "subjective", "objective" and "assessment": use ONLY what the therapist actually said. Do not invent patient facts, symptoms, or findings that were not mentioned.
- For "plan" and "exercises": you MAY go beyond a literal restatement. Based on the condition described, propose a reasonable, clinically sound and reasonably thorough treatment approach, consistent with common physiotherapy practice for that condition — even if the therapist didn't list it in detail. This is a draft for the practitioner to review, adjust, or discard.
- Do NOT cite specific studies, journals, statistics, or named research papers. Never invent citations or fabricate evidence. You may draw on general, widely accepted clinical practice without naming a specific source.

Respond ALWAYS and ONLY in valid JSON, with this exact structure:
{
  "subjective": "what the patient reports",
  "objective": "clinical exam findings, in clinical register, including relevant differential considerations",
  "assessment": "clinical reasoning, likely picture, contributing factors",
  "plan": "structured, phased treatment plan with brief rationale",
  "exercises": ["exercise 1 with sets/reps/frequency", "exercise 2 with sets/reps/frequency", "exercise 3 with sets/reps/frequency"],
  "summaryForPatient": "short, simple message to send the patient via WhatsApp — plain language, not clinical jargon"
  "language": "the two-letter ISO code of the language you detected and used for this entire response (it, en, es, fr, or others)",

}

If a field truly cannot be inferred even loosely from the transcript and condition, leave it as an empty string.`,



        },
        {
          role: "user",
          content: transcript,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Nessuna risposta dal modello." },
        { status: 500 }
      );
    }

    const note = JSON.parse(raw);
    return NextResponse.json({ note });
  } catch (err) {
    console.error("Errore generate-note:", err);
    return NextResponse.json(
      { error: "Errore nella generazione della nota." },
      { status: 500 }
    );
  }
}
