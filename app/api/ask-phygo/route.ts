import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { requireUser } from "@/lib/auth/sessionServer";
import { consumeHourly, limitResponse } from "@/lib/rateLimit";
import { lazy } from "@/lib/lazy";

const openai = lazy(() => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}));

// Hourly questions per plan. Ask PHYGO is only used inside the signed-in
// dashboard, so anonymous calls are refused.
const LIMITS: Record<string, number> = {
  free: 20,
  pro: 200,
  super_pro: 100000, // di fatto illimitato
};

export async function POST(request: NextRequest) {
  // Before: the plan was read with the anon key and no session, so RLS on
  // profiles hid it and every user counted as "free"; and the counter in
  // ask_phygo_usage (RLS on, no policies) could not be read or written with
  // that key, so no limit was ever enforced, anonymous calls included.
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const { data: profile } = await gate.supabase.from("profiles").select("plan").eq("id", gate.user.id).maybeSingle();
  const plan = profile?.plan || "free";
  const limited = limitResponse(await consumeHourly(`user:${gate.user.id}`, LIMITS[plan] ?? LIMITS.free));
  if (limited) return limited;

  try {
    const { question, noteContext, lang } = await request.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Manca la domanda (question)." },
        { status: 400 }
      );
    }

    // The app's current UI language (it/en/es/fr — same value the rest of
    // Workspace already sends, e.g. via StudyPanelContext) is only a HINT:
    // the instruction below tells the model to prefer matching the
    // QUESTION's own language when the two disagree, rather than forcing a
    // language onto text that isn't actually in it.
    const LANGUAGE_NAMES: Record<string, string> = {
      it: "Italian",
      en: "English",
      es: "Spanish",
      fr: "French",
    };
    const languageName = LANGUAGE_NAMES[lang] || null;

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

Language (important — do not skip this): ALWAYS answer in the same language the user's question below is written in.${
            languageName ? ` The app's current interface language is ${languageName}, so if the question's language is ambiguous, default to ${languageName}.` : ""
          } Never answer in English just because this system prompt is written in English — that has caused this assistant to wrongly answer Italian questions in English before, and it must not happen again.

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
