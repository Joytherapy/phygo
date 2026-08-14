import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WINDOW_MS = 60 * 60 * 1000; // finestra di 1 ora

const LIMITS: Record<string, number> = {
  anonymous: 5,
  free: 20,
  pro: 200,
  super_pro: 100000, // di fatto illimitato
};

async function getPlan(): Promise<{ key: string; plan: string }> {
  const cookieStore = cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return { key: "anonymous", plan: "anonymous" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan || "free";
  return { key: `user:${user.id}`, plan };
}

async function checkRateLimit(
  key: string,
  plan: string
): Promise<boolean> {
  const now = new Date();
  const limit = LIMITS[plan] ?? LIMITS.free;

  const { data: existing } = await supabase
    .from("ask_phygo_usage")
    .select("*")
    .eq("ip", key)
    .single();

  if (!existing) {
    await supabase.from("ask_phygo_usage").insert({
      ip: key,
      request_count: 1,
      window_start: now.toISOString(),
    });
    return true;
  }

  const windowStart = new Date(existing.window_start);
  const elapsed = now.getTime() - windowStart.getTime();

  if (elapsed > WINDOW_MS) {
    await supabase
      .from("ask_phygo_usage")
      .update({ request_count: 1, window_start: now.toISOString() })
      .eq("ip", key);
    return true;
  }

  if (existing.request_count >= limit) {
    return false;
  }

  await supabase
    .from("ask_phygo_usage")
    .update({ request_count: existing.request_count + 1 })
    .eq("ip", key);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { key, plan } = await getPlan();

    let rateLimitKey = key;
    if (key === "anonymous") {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown";
      rateLimitKey = `ip:${ip}`;
    }

    const allowed = await checkRateLimit(rateLimitKey, plan);
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Too many requests. Please wait a bit before asking again.",
        },
        { status: 429 }
      );
    }

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
