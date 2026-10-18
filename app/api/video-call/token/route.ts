import { NextRequest, NextResponse } from 'next/server'
import { requireUser, requireVerifiedProfessional } from '@/lib/auth/sessionServer'
import { consumeHourly, HOURLY_LIMITS, limitResponse } from '@/lib/rateLimit'
import { serviceClient } from '@/lib/verification'
import { callAccess, DAILY_API, dailyHeaders, tokenProperties, UUID } from '@/lib/videoCall'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' }

// Issues a Daily meeting token for one call, to the two people allowed in it:
//   - the clinician whose patient it is, while verified (owner rights);
//   - the patient, signed in with their own My Phygo account.
// Only for an active call that has not expired. The token opens that room
// only and must be used within TOKEN_TTL_SECONDS; a new one is issued for
// every join. Nothing from the browser decides the room: it comes from the
// call recorded by the server. The token is never logged.
export async function POST(req: NextRequest) {
  const gate = await requireUser()
  if (!gate.ok) return gate.response
  if (!process.env.DAILY_API_KEY) return NextResponse.json({ error: 'Video calls are not configured' }, { status: 503, headers: NO_STORE })
  const db = serviceClient()
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503, headers: NO_STORE })

  const body = await req.json().catch(() => ({}))
  if (typeof body.callId !== 'string' || !UUID.test(body.callId)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400, headers: NO_STORE })
  }

  const access = await callAccess(db, gate.user.id, body.callId)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status, headers: NO_STORE })
  if (access.role === 'clinician') {
    // Patient management and video calls are for verified professionals only.
    const pro = await requireVerifiedProfessional()
    if (!pro.ok) return pro.response
  }

  const limited = limitResponse(await consumeHourly(`video-token:${gate.user.id}`, HOURLY_LIMITS.videoToken))
  if (limited) return limited

  const properties = tokenProperties(access.call.room_name, access.role, body.lang)
  const res = await fetch(`${DAILY_API}/meeting-tokens`, { method: 'POST', headers: dailyHeaders(), body: JSON.stringify({ properties }) })
  if (!res.ok) {
    console.error('Daily meeting token not issued:', res.status)
    return NextResponse.json({ error: 'Could not open the call' }, { status: 502, headers: NO_STORE })
  }
  const { token } = await res.json()
  if (typeof token !== 'string' || !token) return NextResponse.json({ error: 'Could not open the call' }, { status: 502, headers: NO_STORE })
  return NextResponse.json(
    { url: access.call.room_url, token, role: access.role, expiresAt: new Date(properties.exp * 1000).toISOString() },
    { headers: NO_STORE },
  )
}
