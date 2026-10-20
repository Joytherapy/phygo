import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { lazy } from "@/lib/lazy";
import { requireUser } from "@/lib/auth/sessionServer";
import { serviceClient } from "@/lib/verification";
import { searchLibraryExercises } from "@/lib/exerciseLibrary/search";

const supabase = lazy(() => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
));

// Search for the note's "Add exercise": exercises of the Exercises section
// first (signed-in users only, since they carry signed media links), then the
// older wger cache as before.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 80);
  const lang = searchParams.get("lang");

  if (!q) {
    return NextResponse.json({ exercises: [] });
  }

  let library: unknown[] = [];
  const gate = await requireUser();
  const db = gate.ok ? serviceClient() : null;
  if (db) {
    try {
      library = await searchLibraryExercises(db, [q], lang || "it", 8);
    } catch (err) {
      console.error("exercise-search library error:", err instanceof Error ? err.message : err);
    }
  }

  const { data, error } = await supabase
    .from("exercise_cache")
    .select("data")
    .eq("language", "en")
    .ilike("name", `%${q}%`)
    .limit(10);

  if (error && library.length === 0) {
    console.error("exercise-search error:", error.message);
    return NextResponse.json({ exercises: [] }, { status: 500 });
  }

  return NextResponse.json({
    exercises: [...library, ...(data || []).map((row) => row.data)],
  });
}
