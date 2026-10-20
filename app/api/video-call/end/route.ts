import { NextRequest, NextResponse } from 'next/server'
import { requireVerifiedProfessional } from '@/lib/auth/sessionServer'
import { serviceClient } from '@/lib/verification'
import { callAccess, deleteRoom, ROOM_NAME, UUID } from '@/lib/videoCall'

// Ends a call: only the clinician whose patient it is. The call is marked
// ended first (no new tokens), then the Daily room is deleted, which also
// disconnects everyone and closes it to tokens issued earlier. If Daily does
// not delete the room, the answer says so (502) and the clinician can end the
// same call again to retry: a 200 always means the room is gone.
export async function POST(req: NextRequest) {
  const gate = await requireVerifiedProfessional()
  if (!gate.ok) return gate.response
  const db = serviceClient()
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  const body = await req.json().catch(() => ({}))
  if (typeof body.callId !== 'string' || !UUID.test(body.callId)) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  // Expired, old public and already ended calls can be ended too, so a stale row
  // never blocks a new call and a room left open can be closed again.
  const access = await callAccess(db, gate.user.id, body.callId, Date.now(), { toEnd: true })
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  if (access.role !== 'clinician') return NextResponse.json({ error: 'Call not found' }, { status: 404 })

  if (access.call.status === 'active') {
    const { error } = await db.from('video_calls').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', access.call.id)
    if (error) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  if (process.env.DAILY_API_KEY && ROOM_NAME.test(access.call.room_name ?? '')) {
    const closed = await deleteRoom(access.call.room_name)
    if (!closed.ok) {
      console.error('video call ended, Daily room not deleted:', closed.status)
      return NextResponse.json(
        { error: 'The call has ended, but the video room could not be closed. Try again.', code: 'room_not_closed' },
        { status: 502 },
      )
    }
  }
  return NextResponse.json({ ok: true })
}
