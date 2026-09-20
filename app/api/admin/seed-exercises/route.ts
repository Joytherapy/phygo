import { NextResponse } from "next/server";
import { seedWgerCache } from "@/lib/exercise-providers/cache";

export const dynamic = 'force-dynamic';

export async function GET() {
  const saved = await seedWgerCache("en");
  return NextResponse.json({ saved });
}
