// Hourly per-key request counter for paid operations (OpenAI, Daily).
//
// It reuses the existing ask_phygo_usage table (columns ip, request_count,
// window_start), so no schema change is needed; keys are namespaced
// ("ai:<operation>:<user id>") so they never collide with Ask PHYGO's own
// "user:<id>" keys. That table has RLS enabled and no policies, so it can
// only be used with the service-role key: the anon client used before could
// neither read nor write it, which silently disabled every limit.
//
// The counter is a guard against abuse, not exact accounting: concurrent
// requests can occasionally slip one over the limit. If the counter itself is
// unavailable the request is allowed (authentication still applies) and the
// failure is logged, so a storage hiccup never locks clinicians out.
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serviceRoleConfigProblem } from "@/lib/supabase/serverConfig";

const WINDOW_MS = 60 * 60 * 1000;
let admin: SupabaseClient | null = null;

function adminClient(): SupabaseClient | null {
  const problem = serviceRoleConfigProblem();
  if (problem) {
    console.error(
      "rate limit disabled: server configuration problem:",
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

/** Counts one request for `key`; returns false once `limit` requests were made in the current hour. */
export async function consumeHourly(
  key: string,
  limit: number,
): Promise<boolean> {
  const db = adminClient();
  if (!db) return true;
  const now = new Date();
  const { data: row, error } = await db
    .from("ask_phygo_usage")
    .select("request_count, window_start")
    .eq("ip", key)
    .maybeSingle();
  if (error) {
    console.error("rate limit read failed:", error.message);
    return true;
  }
  if (!row) {
    const { error: insertError } = await db
      .from("ask_phygo_usage")
      .insert({ ip: key, request_count: 1, window_start: now.toISOString() });
    if (insertError)
      console.error("rate limit insert failed:", insertError.message);
    return true;
  }
  if (now.getTime() - new Date(row.window_start).getTime() > WINDOW_MS) {
    await db
      .from("ask_phygo_usage")
      .update({ request_count: 1, window_start: now.toISOString() })
      .eq("ip", key);
    return true;
  }
  if (row.request_count >= limit) return false;
  await db
    .from("ask_phygo_usage")
    .update({ request_count: row.request_count + 1 })
    .eq("ip", key);
  return true;
}

export function tooManyRequests() {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": "3600" } },
  );
}

/** Per-user hourly limits for clinician-only paid operations. */
export const HOURLY_LIMITS = {
  analyzeScan: 30,
  generateNote: 120,
  noteEnrichment: 120, // refine-exercises, refine-plan, exercise-intelligence, science/relevant, knowledge-lookup
  videoRoom: 20,
} as const;
