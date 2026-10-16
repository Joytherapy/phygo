// Hourly per-key request counter for paid operations (OpenAI, Daily).
//
// Storage: the existing ask_phygo_usage table (ip text PRIMARY KEY,
// request_count, window_start), so no schema change is needed. Keys are
// namespaced ("ai:<operation>:<user id>") so they never collide with Ask
// PHYGO's own "user:<id>" keys. The table has RLS on and no policies, so only
// the service-role key can use it (the anon client used before could neither
// read nor write it, which silently disabled every limit).
//
// Concurrency: every change is a compare-and-swap through PostgREST. The
// update only applies if request_count and window_start still hold the values
// that were read, and the first insert relies on the primary key; on a lost
// race the operation is retried. Concurrent requests therefore cannot push the
// counter past the limit, and no increment is lost.
//
// Fail closed: if the counter cannot be read or written (configuration
// problem, database error, persistent contention) the result is "unavailable"
// and callers answer 503 before any paid call is made.
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serviceRoleConfigProblem } from "@/lib/supabase/serverConfig";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 25;
let admin: SupabaseClient | null = null;

export type LimitResult = "allowed" | "limited" | "unavailable";

function adminClient(): SupabaseClient | null {
  const problem = serviceRoleConfigProblem();
  if (problem) {
    console.error(
      "rate limit unavailable: server configuration problem:",
      problem,
    );
    return null;
  }
  admin ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  return admin;
}

/** Counts one request for `key` against `limit` per rolling hour window. */
export async function consumeHourly(
  key: string,
  limit: number,
): Promise<LimitResult> {
  const db = adminClient();
  if (!db) return "unavailable";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0)
      await new Promise((r) =>
        setTimeout(r, Math.random() * Math.min(25 * attempt, 200)),
      );
    const now = new Date();
    const { data: row, error } = await db
      .from("ask_phygo_usage")
      .select("request_count, window_start")
      .eq("ip", key)
      .maybeSingle();
    if (error) {
      console.error("rate limit read failed:", error.message);
      return "unavailable";
    }

    if (!row) {
      const { error: insertError } = await db
        .from("ask_phygo_usage")
        .insert({ ip: key, request_count: 1, window_start: now.toISOString() });
      if (!insertError) return "allowed";
      if (insertError.code === "23505") continue; // another request created the row first
      console.error("rate limit insert failed:", insertError.message);
      return "unavailable";
    }

    const expired =
      now.getTime() - new Date(row.window_start).getTime() > WINDOW_MS;
    if (!expired && row.request_count >= limit) return "limited";

    const next = expired
      ? { request_count: 1, window_start: now.toISOString() }
      : { request_count: row.request_count + 1 };
    const { data: updated, error: updateError } = await db
      .from("ask_phygo_usage")
      .update(next)
      .eq("ip", key)
      .eq("request_count", row.request_count)
      .eq("window_start", row.window_start)
      .select("ip");
    if (updateError) {
      console.error("rate limit update failed:", updateError.message);
      return "unavailable";
    }
    if (updated && updated.length === 1) return "allowed";
    // Another request changed the row between our read and update: try again.
  }
  console.error(
    "rate limit unavailable: too much contention on",
    key.split(":").slice(0, 2).join(":"),
  );
  return "unavailable";
}

/** Maps a limit result to the response that must be returned instead of doing the work, or null to proceed. */
export function limitResponse(result: LimitResult): NextResponse | null {
  if (result === "allowed") return null;
  if (result === "limited") {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        code: "rate_limited",
      },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }
  return NextResponse.json(
    { error: "Service temporarily unavailable.", code: "limit_unavailable" },
    { status: 503 },
  );
}

/**
 * Per-user hourly limits for clinician-only paid operations. Sized for a busy
 * clinic day with headroom: one session note triggers generate-note once plus
 * one call to each enrichment route, and is sometimes regenerated.
 */
export const HOURLY_LIMITS = {
  analyzeScan: 30, // gpt-4o vision, the most expensive call; a few images per patient
  generateNote: 120,
  noteEnrichment: 120, // refine-exercises, refine-plan, exercise-intelligence, science/relevant
  videoRoom: 20, // one room per video appointment
  videoToken: 60, // one per join, for both people in the call, with reconnections
} as const;
