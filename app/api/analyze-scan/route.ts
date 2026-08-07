import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LANGUAGE_NAMES: Record<string, string> = {
  "it-IT": "Italian",
  "en-US": "English",
  "es-ES": "Spanish",
  "fr-FR": "French",
};

export async function POST(req: NextRequest) {
  try {
    const { images, language, context } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    const languageName = LANGUAGE_NAMES[language] || "English";
    const hasContext = typeof context === "string" && context.trim().length > 0;

    const contextInstruction = hasContext
      ? "The physiotherapist has provided this known clinical context about the patient: \"" +
        context.trim() +
        "\". Use this context to guide your interpretation of the image. If the visual findings are consistent with this context, favor that interpretation. Only contradict the provided context if there is clear, unambiguous visual evidence against it, and explain why."
      : "IMPORTANT: No clinical context was provided about the patient. You are NOT allowed to assert a single confident diagnosis or interpretation in this case, even if one interpretation seems likely to you. This is a strict formatting requirement, not a suggestion. Your response MUST include a section formatted exactly like this, using these exact words as a heading: 'Possible interpretations (most to least likely):' followed by a numbered list of the 2 or 3 most plausible interpretations of what is visible, each in one short sentence. Do not write a single free-form diagnostic sentence instead of this list. After the list, add one sentence noting that clinical context or the radiologist's report would be needed to narrow it down.";

    const systemPrompt = [
      "You are a clinical assistant helping a physiotherapist review one or more diagnostic documents, such as an X-ray, MRI, or CT scan, and possibly a separate photo of a handwritten or printed referral note or clinical report. If more than one image is provided, treat them as parts of the same case and cross-reference information between them, for example using text from a referral note photo to inform your reading of an X-ray image.",
      "Examine the image carefully and systematically before writing your summary.",
      "Specifically check for and mention, if visible: bone alignment and any fracture lines, joint space narrowing or widening, signs of dislocation or subluxation, soft tissue swelling or effusion, hardware such as plates, screws, or prosthetic implants, osteophytes or subchondral sclerosis, and any asymmetry compared to normal anatomy.",
      contextInstruction,
      "If the document contains any handwritten or printed text, such as a doctor's note, referral letter, or clinical report, read that text carefully and incorporate the relevant clinical information from it into your summary alongside your observations of the image itself.",
      "Write a clear, structured, professional summary covering what is visible and clinically relevant, not a vague generic description.",
      "Never state a single diagnosis as certain fact when the image is genuinely ambiguous. Do not speculate about findings that are not visible in the image.",
      "If the image is unclear, low quality, or not a medical document, say so plainly.",
      "Write your entire response in " + languageName + ".",
      "Always end with a sentence, in " + languageName + ", meaning: this is a supporting summary only, clinical judgment remains with the treating professional.",
    ].join(" ");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            ...images.map((img: string) => ({
              type: "image_url" as const,
              image_url: { url: img, detail: "high" as const },
            })),
            {
              type: "text" as const,
              text:
                images.length > 1
                  ? "Please provide a thorough, structured summary combining all the provided documents for a physiotherapy session note."
                  : "Please provide a thorough, structured summary of this diagnostic document for a physiotherapy session note.",
            },
          ],
        },
      ],
      max_tokens: 450,
    });

    const summary = response.choices[0]?.message?.content ?? "";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("analyze-scan error:", error);
    return NextResponse.json(
      { error: "Failed to analyze document" },
      { status: 500 }
    );
  }
}
