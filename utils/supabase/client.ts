import { createBrowserClient } from "@supabase/ssr";
import { lazy } from "@/lib/lazy";

// The client is created on first use, so pages that call this while
// rendering can be prerendered by a build without Supabase variables.
export function createClient() {
  return lazy(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
}
