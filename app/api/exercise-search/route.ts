import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ exercises: [] });
  }

  const { data, error } = await supabase
    .from("exercise_cache")
    .select("data")
    .eq("language", "en")
    .ilike("name", `%${q}%`)
    .limit(10);

  if (error) {
    console.error("exercise-search error:", error.message);
    return NextResponse.json({ exercises: [] }, { status: 500 });
  }

  return NextResponse.json({
    exercises: (data || []).map((row) => row.data),
  });
}
