import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

// Server-side gate for every admin / batch-job API route (events moderation,
// library editing, science review + PubMed/OpenAI batch jobs, seeding).
// Those routes use the SERVICE ROLE key, which bypasses RLS — so this check
// is the ONLY thing standing between the public internet and those writes.
//
// There is no admin role in the database yet, so admins are configured via
// environment variables (server-side only, never NEXT_PUBLIC_):
//
//   PHYGO_ADMIN_EMAILS      comma-separated emails of admin accounts; the
//                           account's email must also be confirmed
//   CRON_SECRET             already used by Vercel Cron — accepted as a
//                           bearer token so /api/cron/science-daily can call
//                           the science batch routes
//   PHYGO_ADMIN_API_TOKEN   optional bearer token for local maintenance
//                           scripts (seed-*.js, link-*.js, tag-zones.js)
//
// Fails closed: if none of these are configured, nobody is an admin.

function parseList(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function bearerToken(req: Request): string | null {
  const header = req.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

/** True only when the request carries `Authorization: Bearer <CRON_SECRET>` and CRON_SECRET is set. */
export function hasCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  const token = bearerToken(req)
  return !!secret && !!token && safeEqual(token, secret)
}

function hasAdminApiToken(req: Request): boolean {
  const token = bearerToken(req)
  if (!token) return false
  const secrets = [process.env.CRON_SECRET, process.env.PHYGO_ADMIN_API_TOKEN].filter(
    (s): s is string => !!s
  )
  return secrets.some((secret) => safeEqual(token, secret))
}

/**
 * Returns null when the caller is an admin, otherwise a 401/403 response the
 * route should return as-is:
 *
 *   const denied = await requireAdmin(req)
 *   if (denied) return denied
 */
export async function requireAdmin(req: Request): Promise<NextResponse | null> {
  if (hasAdminApiToken(req)) return null

  const cookieStore = cookies()
  const supabase = createServerClient(
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
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const adminEmails = parseList(process.env.PHYGO_ADMIN_EMAILS)
  const email = user.email?.toLowerCase()
  const isAdmin = !!email && !!user.email_confirmed_at && adminEmails.includes(email)

  if (!isAdmin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return null
}
