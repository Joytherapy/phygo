import { createClient } from "@supabase/supabase-js";
import type { ExerciseEntry } from "./types";
import { WgerProvider } from "./wger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const wgerProvider = new WgerProvider();

export async function getCachedExercise(
  provider: string,
  providerId: string,
  language: string
): Promise<ExerciseEntry | null> {
  const { data } = await supabase
    .from("exercise_cache")
    .select("data")
    .eq("provider", provider)
    .eq("provider_id", providerId)
    .eq("language", language)
    .maybeSingle();

  if (data?.data) return data.data as ExerciseEntry;
  return null;
}

export async function saveCachedExercise(
  provider: string,
  providerId: string,
  language: string,
  entry: ExerciseEntry
): Promise<void> {
  await supabase.from("exercise_cache").upsert(
    {
      provider,
      provider_id: providerId,
      language,
      name: entry.name,
      data: entry,
      cached_at: new Date().toISOString(),
    },
    { onConflict: "provider,provider_id,language" }
  );
}

export async function searchExercisesWithCache(
  keywords: string[],
  language: string = "en"
): Promise<ExerciseEntry[]> {
  const cleanKeywords = keywords.map((k) => k.trim()).filter(Boolean);
  if (cleanKeywords.length === 0) return [];

  for (const keyword of cleanKeywords) {
    const { data } = await supabase
      .from("exercise_cache")
      .select("data")
      .eq("language", language)
      .ilike("name", `%${keyword}%`)
      .limit(5);

    if (data && data.length > 0) {
      return data.map((row) => row.data as ExerciseEntry);
    }
  }

  return [];
}

export async function seedWgerCache(
  language: string = "en",
  onProgress?: (done: number, total: number) => void
): Promise<number> {
  let offset = 0;
  let total = 0;
  let saved = 0;
  const limit = 50;

  do {
    const res = await fetch(
      `https://wger.de/api/v2/exercise/?format=json&limit=${limit}&offset=${offset}`
    );
    if (!res.ok) break;
    const page = await res.json();
    total = page.count || 0;

    for (const item of page.results || []) {
      const entry = await wgerProvider.getExercise(String(item.id), language);
      if (entry) {
        await saveCachedExercise("wger", String(item.id), language, entry);
        saved++;
      }
      if (onProgress) onProgress(saved, total);
    }

    offset += limit;
  } while (offset < total);

  return saved;
}

export async function getExerciseWithCache(
  providerId: string,
  language: string = "en"
): Promise<ExerciseEntry | null> {
  const cached = await getCachedExercise("wger", providerId, language);
  if (cached) return cached;

  const fresh = await wgerProvider.getExercise(providerId, language);
  if (fresh) {
    await saveCachedExercise("wger", providerId, language, fresh);
  }
  return fresh;
}
