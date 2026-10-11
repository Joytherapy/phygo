import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/adminServer";
import { seedWgerCache } from "@/lib/exercise-providers/cache";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const saved = await seedWgerCache("en");
  return NextResponse.json({ saved });
}
