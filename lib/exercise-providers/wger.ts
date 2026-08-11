import type {
  ExerciseProvider,
  ExerciseEntry,
  ExerciseSearchCriteria,
} from "./types";

const WGER_BASE = "https://wger.de/api/v2";

function normalizeWgerExercise(raw: any, language: string): ExerciseEntry {
  const translation =
    raw.translations?.find((t: any) => t.language === langCodeToId(language)) ||
    raw.translations?.[0] ||
    {};

  const images = raw.images || [];

  return {
    internal_id: `wger-${raw.id}`,
    provider: "wger",
    provider_id: String(raw.id),
    name: translation.name || raw.name || "Unnamed exercise",
    description: stripHtml(translation.description) || null,
    instructions: null,
    body_region: raw.category?.name || null,
    primary_muscle: raw.muscles?.[0]?.name || null,
    secondary_muscles: raw.muscles_secondary?.map((m: any) => m.name) || null,
    equipment: raw.equipment?.map((e: any) => e.name) || null,
    difficulty: null,
    category: raw.category?.name || null,
    tags: null,
    media: {
      image_url: images[0]?.image || null,
      gif_url: null,
      video_url: null,
    },
    license: "CC-BY-SA",
    language,
  };
}

function stripHtml(html: string | undefined): string | null {
  if (!html) return null;
  return html.replace(/<[^>]*>/g, "").trim() || null;
}

function langCodeToId(language: string): number {
  const map: Record<string, number> = { en: 2, it: 12, es: 4, fr: 8 };
  return map[language] || 2;
}

export class WgerProvider implements ExerciseProvider {
  async searchExercises(criteria: ExerciseSearchCriteria): Promise<ExerciseEntry[]> {
    const term = criteria.keywords?.join(" ") || "";
    const language = criteria.language || "en";
    const url = `${WGER_BASE}/exercise/search/?term=${encodeURIComponent(
      term
    )}&language=${langCodeToId(language)}&format=json`;

    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    const results = data.suggestions || [];
    const entries: ExerciseEntry[] = [];

    for (const s of results.slice(0, 10)) {
      const baseId = s.data?.base_id;
      if (!baseId) continue;
      const full = await this.getExercise(String(baseId), language);
      if (full) entries.push(full);
    }

    return entries;
  }

  async getExercise(providerId: string, language = "en"): Promise<ExerciseEntry | null> {
    const url = `${WGER_BASE}/exerciseinfo/${providerId}/?format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const raw = await res.json();
    return normalizeWgerExercise(raw, language);
  }

  async getExercisesByBodyPart(bodyPart: string, language = "en"): Promise<ExerciseEntry[]> {
    return this.searchExercises({ keywords: [bodyPart], language });
  }

  async getExercisesByGoal(goal: string, language = "en"): Promise<ExerciseEntry[]> {
    return this.searchExercises({ keywords: [goal], language });
  }
}
