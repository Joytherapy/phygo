import { NextRequest, NextResponse } from 'next/server'
import { requireVerifiedProfessional } from '@/lib/auth/sessionServer'
import { serviceClient } from '@/lib/verification'
import { callAccess, DAILY_API, dailyHeaders, ROOM_NAME, UUID } from '@/lib/videoCall'

// Ends a call: only the clinician whose patient it is. The call is marked
// ended (no new tokens) and the Daily room is deleted, which also closes it
// to tokens issued earlier.
export async function POST(req: NextRequest) {
  const gate = await requireVerifiedProfessional()
  if (!gate.ok) return gate.response
  const db = serviceClient()
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  const body = await req.json().catch(() => ({}))
  if (typeof body.callId !== 'string' || !UUID.test(body.callId)) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  // Expired and old public calls can be ended too, so they never block a new call.
  const access = await callAccess(db, gate.user.id, body.callId, Date.now(), { toEnd: true })
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  if (access.role !== 'clinician') return NextResponse.json({ error: 'Call not found' }, { status: 404 })

  const { error } = await db.from('video_calls').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', access.call.id)
  if (error) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  if (process.env.DAILY_API_KEY && ROOM_NAME.test(access.call.room_name ?? '')) {
    const res = await fetch(`${DAILY_API}/rooms/${encodeURIComponent(access.call.room_name)}`, { method: 'DELETE', headers: dailyHeaders() }).catch(() => null)
    // The room also expires on its own within the hour.
    if (!res?.ok) console.error('Daily room not deleted:', res?.status ?? 'network error')
  }
  return NextResponse.json({ ok: true })
}
