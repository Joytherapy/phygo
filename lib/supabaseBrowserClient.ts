'use client'

// Single shared browser Supabase client for the whole app. Historically every
// component created its own `createBrowserClient(...)` inline (see the
// PHYGO strategic audit, §11) — harmless on its own, but it's the same root
// cause as the API-route fetch-cache duplication that caused the pelvic-floor
// image caching bug fixed on 2026-09-20. All new Workspace code imports this
// single instance instead of constructing its own.
//
// Existing pre-Workspace code is left untouched (out of scope for this
// change) — this file only prevents the pattern from spreading further.

import { createBrowserClient } from '@supabase/ssr'
import { lazy } from '@/lib/lazy'

// Created on first use (lib/lazy.ts), so a page can call this while
// rendering and still be prerendered by a build without Supabase variables.
const client = lazy(() =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
)

export function getSupabaseBrowserClient() {
  return client
}
