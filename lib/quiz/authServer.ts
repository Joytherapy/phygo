import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Same anon-key + session-cookie pattern as lib/workspace/authServer.ts —
// kept as its own small helper rather than importing the Workspace one,
// since Quiz isn't a Workspace feature and shouldn't read like it depends
// on it. quiz_attempts (the only user-owned Quiz table) relies on this for
// RLS the same way every Workspace table does.
export function getQuizServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // no-op: API routes don't need to refresh the session cookie
        },
      },
      global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
    }
  )
}

export async function requireQuizUser() {
  const supabase = getQuizServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, supabase, unauthorized: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }
  return { user, supabase, unauthorized: null as null }
}
