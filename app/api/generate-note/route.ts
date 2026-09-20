import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEMO_LIMIT = 1;

async function isLoggedIn() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // no-op: not needed for a read-only check
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

async function checkDemoLimit(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("demo_usage")
    .select("count")
    .eq("ip", ip)
    .maybeSingle();

  if (data && data.count >= DEMO_LIMIT) {
    return false;
  }

  if (data) {
    await supabase
      .from("demo_usage")
      .update({ count: data.count + 1, last_used: new Date().toISOString() })
      .eq("ip", ip);
  } else {
    await supabase.from("demo_usage").insert({ ip, count: 1 });
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const loggedIn = await isLoggedIn();

    if (!loggedIn) {
      const allowed = await checkDemoLimit(request);
      if (!allowed) {
        return NextResponse.json(
          {
            error: "demo_limit_reached",
            message:
              "You've already tried the free demo. Sign up to keep using Phygo on unlimited patients.",
          },
          { status: 403 }
        );
      }
    }

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
- "Assessment" should read like clinical reasoning: the likely clinical picture, contributing factors, and prognosis considerations where reasonable. The Assessment MUST always explicitly name the specific condition, diagnosis, or procedure being treated (e.g. "total hip replacement", "rotator cuff tendinopathy") — never describe it only in generic terms like "post-operative recovery" without naming what surgery or condition it refers to.
- "Plan" should be structured in phases where appropriate (e.g. acute/early phase vs progression phase), including approach, rationale, and a sensible frequency/timeline.
- "Exercises" should include enough prescription detail to be usable: sets, reps, and frequency for each exercise, not just a name.

Content behavior:
- For "subjective", "objective" and "assessment": use ONLY what the therapist actually said. Do not invent patient facts, symptoms, or findings that were not mentioned.
- For "plan" and "exercises": you MAY go beyond a literal restatement. Based on the condition described, propose a reasonable, clinically sound and reasonably thorough treatment approach, consistent with common physiotherapy practice for that condition — even if the therapist didn't list it in detail. This is a draft for the practitioner to review, adjust, or discard.
- Exercises must be scaled to the patient current functional stage as described in the transcript, for any condition being treated, not generic beginner-level exercises regardless of progress made. When the transcript indicates the patient is advanced in recovery (e.g. walks without aids, mild or no pain, good tolerance), propose a broader and more varied set of exercises appropriate to the condition, not just the same 2-3 basic exercises repeated. Gradually introduce more challenging and complementary variants when the clinical picture justifies it, for example (illustrative only, always adapt to the specific condition): bridge progressions (single-leg, weighted at the ankle), isometrics for hamstrings or quadriceps, gastrocnemius strengthening, gluteus medius work (e.g. lateral or side-stepping), stair gait training, balance progression (e.g. eyes-closed, light obstacles). Always account for any precautions, contraindications, or specific risks mentioned (e.g. dislocation risk, post-surgical restrictions) when selecting exercises.
- Exercises must not be limited to a small fixed number of isolated movements. Reason in terms of functional categories relevant to the condition being treated - for example: muscular strengthening, balance/proprioception, gait/ambulation, joint mobility, cardiovascular conditioning (e.g. stationary bike, treadmill if appropriate) - and select one or more genuinely appropriate exercises for each relevant category, based on the patient's functional stage. Not every category applies in every case: use clinical judgement to decide which are relevant for THIS condition and THIS stage. Reason with the practical expertise of an experienced physiotherapist combined with a broader clinical framing, as a physician would when considering the patient's overall picture rather than just the isolated exercise. The goal is a complete and clinically credible exercise plan, not a minimal checklist.
- CRITICAL: if the transcript mentions more than one condition, identify the ONE that is the primary reason for TODAY'S session. Name ONLY that condition in "assessment". Any other condition mentioned (past surgery, old injury, unrelated diagnosis) is background history only — it may appear briefly in "subjective" if relevant, but must NEVER be treated as the diagnosis being assessed today.
- Additionally, output a field "primaryCondition" containing ONLY the name of the condition being treated today (2-6 words, e.g. "chronic low back pain"). This field must NEVER include any other condition, history, or past diagnosis — it is used for internal matching only.
- Do NOT cite specific studies, journals, statistics, or named research papers. Never invent citations or fabricate evidence. You may draw on general, widely accepted clinical practice without naming a specific source.

Clinical reasoning (separate from "assessment"):
- In addition to "assessment" above, also produce a distinct "clinicalReasoning" object. Its job is to show the reasoning process itself, not restate the conclusion.
- You are clinical DECISION SUPPORT, never an autonomous diagnostician. Every sentence in this object must use cautious, hedged language: "possible", "may be consistent with", "consider", "further assessment may be appropriate". Never state a hypothesis as a confirmed fact, and never word it as if you examined the patient yourself.
- "hypotheses": 1-3 possible clinical hypotheses consistent with what was described, ordered most to least likely, each one sentence, each clearly hedged (e.g. "Possible subacromial pain syndrome given painful arc and weakness on resisted abduction").
- "differentials": other conditions or structures worth considering or ruling out, even if less likely than the leading hypothesis — same hedged phrasing. Empty array if genuinely none apply.
- "supportingFindings": which of the reported or observed findings support the leading hypothesis, in one or two sentences.
- "findingsAgainst": findings that are missing, or that would argue against the leading hypothesis, if any. An honest empty string is correct when nothing argues against it — do not invent a counterpoint.
- "missingInformation": clinically relevant information NOT present in the transcript that would help confirm or refine the picture (e.g. a specific ROM measurement, an outcome measure score, a detail of symptom irritability). Be specific to this case, not a generic checklist.
- "suggestedAssessments": additional tests, special orthopedic tests, or outcome measures that could reasonably be performed next to clarify the picture.
- "redFlagsPrecautions": any red flags or precautions relevant to this specific presentation. Never leave this empty by omission — if nothing concerning is apparent from what was described, say so explicitly (e.g. "No red flags apparent from the information provided") rather than leaving it blank.

Respond ALWAYS and ONLY in valid JSON, with this exact structure:
{
  "subjective": "what the patient reports",
  "objective": "clinical exam findings, in clinical register, including relevant differential considerations",
  "assessment": "clinical reasoning, likely picture, contributing factors",
  "plan": "structured, phased treatment plan with brief rationale",
  "exercises": ["exercise 1 with sets/reps/frequency", "exercise 2 with sets/reps/frequency", "exercise 3 with sets/reps/frequency — add more items if clinically appropriate, the array length is NOT fixed at 3"],
  "summaryForPatient": "short, simple message to send the patient via WhatsApp — plain language, not clinical jargon",
  "clinicalReasoning": {
    "hypotheses": ["possible hypothesis 1, hedged", "possible hypothesis 2, hedged — omit if only one is reasonable"],
    "differentials": ["differential to consider, hedged", "..."],
    "supportingFindings": "findings that support the leading hypothesis",
    "findingsAgainst": "findings missing or against the leading hypothesis, or empty string if none",
    "missingInformation": "specific clinically relevant information not mentioned in the transcript",
    "suggestedAssessments": "additional tests or outcome measures that could clarify the picture",
    "redFlagsPrecautions": "red flags/precautions for this presentation, or an explicit statement that none are apparent"
  }
  If the transcript references standard clinical precautions generically without listing them (e.g. "the usual hip precautions", "the three golden rules"), and the context makes the specific condition clear (e.g. total hip arthroplasty), you may state the standard, widely-recognized precautions explicitly as a reasonable clinical default (e.g. avoid hip flexion beyond 90 degrees, avoid adduction past midline, avoid excessive internal/external rotation) — but always phrase this as a draft for the therapist to confirm against the specific surgical approach, never as a fact the patient stated.
"language": "the two-letter ISO code of the language you detected and used for this entire response (it, en, es, fr, or others)",
  "primaryCondition": "short name of only today's main condition, no history",

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
