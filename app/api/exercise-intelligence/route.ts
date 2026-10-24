import { NextResponse } from "next/server";
import { requireVerifiedProfessional } from "@/lib/auth/sessionServer";
import { consumeHourly, HOURLY_LIMITS, limitResponse } from "@/lib/rateLimit";
import OpenAI from "openai";
import { searchExercisesWithCache } from "@/lib/exercise-providers/cache";
import type { ExerciseEntry } from "@/lib/exercise-providers/types";
import { lazy } from "@/lib/lazy";
import { serviceClient } from "@/lib/verification";
import { searchLibraryExercises, specificKeywords } from "@/lib/exerciseLibrary/search";
import { exerciseFit, exerciseRegions, isGeneralActivity, regionsOf, type Fit, type Region } from "@/lib/clinical/region";
import { caseOf } from "@/lib/clinical/coherence";

const openai = lazy(() => new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));

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
  /** The exercise as the note wrote it, before it was matched to a database exercise. */
  draft: string;
  /** Its region against the case: compatible, a general activity, or not verified (region not recognised). */
  relevance: "compatible" | "general" | "unverified";
  relevance_reason: "case_region_unknown" | "exercise_region_unknown" | null;
};

/**
 * An exercise of the draft left out because it is for a body region the case
 * is not about ("off_region"), or one the clinician gave only as history.
 */
type Excluded = { name: string; reason: "off_region" | "history_only"; regions: Region[]; caseRegions: Region[] };

export async function POST(request: Request) {
  // Clinician-only paid AI operation (OpenAI) on real clinical information: verified professional + hourly cap.
  const gate = await requireVerifiedProfessional();
  if (!gate.ok) return gate.response;
  const limited = limitResponse(await consumeHourly(`ai:exercise-intelligence:${gate.user.id}`, HOURLY_LIMITS.noteEnrichment));
  if (limited) return limited;

  try {
    const { exercisesDraft, assessment, primaryCondition, lang, transcript } =
      await request.json();

    if (!Array.isArray(exercisesDraft) || exercisesDraft.length === 0) {
      return NextResponse.json({ exercises: [], excluded: [] });
    }

    const language = (lang || "en").slice(0, 2);

    // The body regions of today's case: the clinician's current problem(s)
    // plus the condition assessed, not regions given only as history
    // (lib/clinical). An exercise for another region is left out (and
    // listed, so the clinician can add it back); a draft is matched only to a
    // database exercise that is not of another region, a verified one first;
    // an exercise whose region is not recognised is kept but marked as not
    // verified, never as pertinent.
    const view = caseOf(typeof transcript === "string" ? transcript.slice(0, 8000) : "", {
      primaryCondition: typeof primaryCondition === "string" ? primaryCondition : "",
      assessment: typeof assessment === "string" ? assessment : "",
    });
    const caseRegions = view.regions;
    const history = new Set(view.profile.history);
    const excluded: Excluded[] = [];
    const RANK: Record<Fit, number> = { compatible: 0, general: 1, unknown: 2, incompatible: 3 };

    const processOne = async (draft: any): Promise<ExerciseOutput | null> => {
      const draftText: string =
        typeof draft === "string" ? draft : draft.name || String(draft);
      const draftRegions = regionsOf(draftText);
      const draftFit = exerciseFit({ name: draftText }, caseRegions);
      const exclude = (regions: Region[]) => {
        excluded.push({ name: draftText, reason: regions.some((r) => history.has(r)) ? "history_only" : "off_region", regions, caseRegions });
        return null;
      };
      if (draftFit === "incompatible") return exclude(draftRegions);

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
      const keywords: string[] = Array.isArray(parsed.keywords) && parsed.keywords.length ? parsed.keywords : [draftText];
      // Only keywords that name an exercise: "stretch" alone would match a
      // stretch of any region.
      const searchWith = specificKeywords(keywords);

      // The Exercises section first (video, steps, usable in the home
      // programme); the older wger cache only when it has nothing. The best
      // candidate whose region fits the case; a draft that names no region
      // takes the region of the exercise it names ("Chin tuck" is a neck
      // exercise), so it is left out when that region is not the case's.
      let match: ExerciseEntry | null = null;
      const pick = (candidates: ExerciseEntry[]): ExerciseEntry | null | "off_region" => {
        if (candidates.length === 0) return null;
        const fit = (c: ExerciseEntry) => exerciseFit(c, caseRegions);
        if (draftRegions.length === 0 && !isGeneralActivity(draftText) && fit(candidates[0]) === "incompatible") return "off_region";
        return candidates.filter((c) => fit(c) !== "incompatible").sort((a, b) => RANK[fit(a)] - RANK[fit(b)])[0] ?? null;
      };
      const db = serviceClient();
      if (db && searchWith.length) {
        try {
          const candidates = await searchLibraryExercises(db, searchWith, language, 5);
          const found = pick(candidates);
          if (found === "off_region") return exclude(exerciseRegions(candidates[0]));
          match = found;
        } catch (libErr) {
          console.error("Exercise library search failed:", libErr);
        }
      }
      if (!match && searchWith.length) {
        try {
          const candidates = await searchExercisesWithCache(searchWith, "en");
          const found = pick(candidates);
          if (found === "off_region") return exclude(exerciseRegions(candidates[0]));
          match = found;
        } catch (searchErr) {
          console.error("Exercise search failed:", searchErr);
        }
      }

      const dosing = {
        sets: parsed.sets ?? null,
        reps: parsed.reps ?? null,
        duration_seconds: parsed.duration_seconds ?? null,
        frequency_per_week: parsed.frequency_per_week ?? null,
        notes: parsed.notes ?? null,
      };

      // Verified when the note's text or the matched exercise is of a compatible region.
      const fits = [draftFit, ...(match ? [exerciseFit(match, caseRegions)] : [])];
      const relevance: ExerciseOutput["relevance"] = fits.includes("compatible") ? "compatible" : fits.includes("general") ? "general" : "unverified";
      const relevance_reason: ExerciseOutput["relevance_reason"] = relevance !== "unverified" ? null : caseRegions.length ? "exercise_region_unknown" : "case_region_unknown";

      if (match) {
        return {
          ...match,
          _debugKeywords: keywords,
          draft: draftText,
          relevance,
          relevance_reason,
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
        draft: draftText,
        relevance,
        relevance_reason,
        source_type: "professional",
        dosing,
        clinical_check: null,
      };
    };

    const results = (await Promise.all(
      exercisesDraft.map((draft: any) => processOne(draft))
    )).filter((r): r is ExerciseOutput => r !== null);
    // In the draft's order, whichever finished first.
    const order = exercisesDraft.map((d: any) => (typeof d === "string" ? d : d?.name || String(d)));
    excluded.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

    return NextResponse.json({ exercises: results, excluded, caseRegions, historyRegions: view.profile.history });
  } catch (err) {
    console.error("Exercise intelligence error:", err);
    return NextResponse.json({ exercises: [], excluded: [] }, { status: 500 });
  }
}
