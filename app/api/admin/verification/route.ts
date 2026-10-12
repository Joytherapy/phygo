import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/adminServer";
import { REVIEW_DECISIONS, serviceClient, type ReviewDecision } from "@/lib/verification";

// Manual review of professional registrations by a PHYGO administrator
// (PHYGO_ADMIN_EMAILS, see lib/auth/adminServer.ts). The administrator checks
// the number against the official public register of the stated country;
// nothing here claims an automatic registry check.

const LIST_FIELDS =
  "id, display_name, practice_stage, professional_status, registry_country, registry_name, registration_number, verification_requested_at, verification_reviewed_at, verification_reviewed_by, verification_message";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  const { data, error } = await db
    .from("profiles")
    .select(LIST_FIELDS)
    .eq("professional_status", status)
    .order("verification_requested_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const db = serviceClient();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { userId?: unknown; decision?: unknown; message?: unknown };
  const decision = body.decision as ReviewDecision;
  if (typeof body.userId !== "string" || !REVIEW_DECISIONS.includes(decision)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) || null : null;
  if (decision !== "verified" && !message) {
    // The user must be told why, or what is missing.
    return NextResponse.json({ error: "A message for the user is required" }, { status: 400 });
  }

  const { data: target } = await db.from("profiles").select("professional_status, registration_number").eq("id", body.userId).maybeSingle();
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (decision === "verified" && !target.registration_number) {
    return NextResponse.json({ error: "No registration details to verify" }, { status: 409 });
  }

  const { data, error } = await db
    .from("profiles")
    .update({
      professional_status: decision,
      verification_reviewed_at: new Date().toISOString(),
      verification_reviewed_by: await reviewerLabel(req),
      verification_message: message,
    })
    .eq("id", body.userId)
    .select(LIST_FIELDS)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  return NextResponse.json({ request: data });
}

/** The reviewing administrator's e-mail, or "api-token" for server-to-server calls. */
async function reviewerLabel(req: Request): Promise<string> {
  if (/^Bearer\s+/i.test(req.headers.get("authorization") ?? "")) return "api-token";
  const cookieStore = cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { get: (name: string) => cookieStore.get(name)?.value },
  });
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? "admin";
}
