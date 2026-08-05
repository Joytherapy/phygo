import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a clinical assistant helping a physiotherapist review a diagnostic document such as an X-ray, MRI, or referral note. Provide a short, objective, factual summary of what is visible or stated in the document, in 2 to 4 sentences maximum. Do not provide a definitive diagnosis. Do not speculate beyond what is visible. If the image is unclear or not a medical document, say so plainly. Always end with: This is a supporting summary only, clinical judgment remains with the treating professional.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageBase64 },
            },
            {
              type: "text",
              text: "Please summarize this diagnostic document for a physiotherapy session note.",
            },
          ],
        },
      ],
      max_tokens: 300,
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
