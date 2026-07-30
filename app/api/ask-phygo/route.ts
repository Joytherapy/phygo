import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { question, noteContext } = await request.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Manca la domanda (question)." },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
           content: `You are an experienced physiotherapist assistant giving clinical decision support to a fellow clinician during a real session.

Answer with real clinical depth, not a generic overview. Concretely this means:
- Give specific, actionable guidance: exercise progressions, loading parameters (sets/reps/frequency/tempo where relevant), red flags to rule out, differential considerations, and modifications based on symptom response.
- If the note context below mentions a specific condition, tailor the answer directly to that presentation — do not give a generic answer that could apply to any patient.
- Where there are genuinely different clinical approaches or schools of thought, briefly mention the trade-off instead of picking one silently.
- Structure longer answers with short paragraphs or a brief list when it improves clarity — do not pad with filler sentences.

Content behavior (unchanged):
- Do NOT cite specific studies, journals, statistics, or named research papers. Never invent citations.
- If you are not confident in a safe, accurate answer, say so clearly instead of guessing.
- Never provide a medical diagnosis. Frame guidance as clinical decision support only.

Current note context (may be empty): ${noteContext || "(no note context available)"}`,

        },
        {
          role: "user",
          content: question,
        },
      ],
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content;

    if (!answer) {
      return NextResponse.json(
        { error: "Nessuna risposta dal modello." },
        { status: 500 }
      );
    }

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Errore ask-phygo:", err);
    return NextResponse.json(
      { error: "Errore nella generazione della risposta." },
      { status: 500 }
    );
  }
}
