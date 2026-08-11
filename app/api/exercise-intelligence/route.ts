import { NextResponse } from "next/server";
import OpenAI from "openai";
import { searchExercisesWithCache } from "@/lib/exercise-providers/cache";
import type { ExerciseEntry } from "@/lib/exercise-providers/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ExerciseOutput = ExerciseEntry & {
  source_type: "professional" | "ai_suggested";
  dosing: {
    sets: number | null;
    reps: number | null;
    duration_seconds: number | null;
    frequency_per_week: number | null;
    notes: string | null;
  };
  clinical_check: {
    flagged: boolean;
    reason: string | null;
  } | null;
  _debugKeywords?: string[];
};

export async function POST(request: Request) {
  try {
    const { exercisesDraft, assessment, primaryCondition, lang } =
      await request.json();

    if (!Array.isArray(exercisesDraft) || exercisesDraft.length === 0) {
      return NextResponse.json({ exercises: [] });
    }

    const language = (lang || "en").slice(0, 2);

    const processOne = async (draft: any): Promise<ExerciseOutput> => {
      const draftText: string =
        typeof draft === "string" ? draft : draft.name || String(draft);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You extract search keywords for a physiotherapy exercise database from a short exercise description written by a therapist. Respond ONLY in valid JSON: { "keywords": ["...", "..."], "sets": number or null, "reps": number or null, "duration_seconds": number or null, "frequency_per_week": number or null, "notes": "brief dosing note or null" }. Keywords should be 1-3 short English terms describing the exercise itself (e.g. "shoulder external rotation", "bridge", "plank"), not the condition.`,
          },
          {
            role: "user",
            content: `Exercise as written by the therapist: "${draftText}"\nClinical context: ${
              primaryCondition || assessment || ""
            }`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(
        completion.choices[0].message.content || "{}"
      );
      const keywords: string[] = parsed.keywords || [draftText];

      let match: ExerciseEntry | null = null;
      try {
        const candidates = await searchExercisesWithCache(keywords, "en");
        match = candidates[0] || null;
      } catch (searchErr) {
        console.error("Exercise search failed:", searchErr);
      }

      const dosing = {
        sets: parsed.sets ?? null,
        reps: parsed.reps ?? null,
        duration_seconds: parsed.duration_seconds ?? null,
        frequency_per_week: parsed.frequency_per_week ?? null,
        notes: parsed.notes ?? null,
      };

      if (match) {
        return {
          ...match,
          _debugKeywords: keywords,
          source_type: "professional",
          dosing,
          clinical_check: null,
        };
      }

      return {
        internal_id: `custom-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        _debugKeywords: keywords,
        provider: "custom",
        provider_id: null,
        name: draftText,
        description: null,
        instructions: null,
        body_region: null,
        primary_muscle: null,
        secondary_muscles: null,
        equipment: null,
        difficulty: null,
        category: null,
        tags: null,
        media: null,
        license: null,
        language,
        source_type: "professional",
        dosing,
        clinical_check: null,
      };
    };

    const results: ExerciseOutput[] = await Promise.all(
      exercisesDraft.map((draft: any) => processOne(draft))
    );

    return NextResponse.json({ exercises: results });
  } catch (err) {
    console.error("Exercise intelligence error:", err);
    return NextResponse.json({ exercises: [] }, { status: 500 });
  }
}
