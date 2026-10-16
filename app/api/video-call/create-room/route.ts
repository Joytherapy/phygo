import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ownsPatient, requireVerifiedProfessional } from '@/lib/auth/sessionServer'
import { consumeHourly, HOURLY_LIMITS, limitResponse } from '@/lib/rateLimit'
import { serviceClient } from '@/lib/verification'
import { DAILY_API, dailyHeaders, ROOM_NAME, roomNameFor, roomProperties } from '@/lib/videoCall'

// Creates a private Daily room for one of the signed-in clinician's own
// patients, and records the call on the server (video_calls), so the room a
// token is later issued for is never one the browser chose. Nobody can join
// the room without a meeting token from /api/video-call/token.
export async function POST(req: NextRequest) {
  const gate = await requireVerifiedProfessional()
  if (!gate.ok) return gate.response

  if (!process.env.DAILY_API_KEY) {
    return NextResponse.json({ error: 'Video calls are not configured' }, { status: 503 })
  }
  const db = serviceClient()
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })

  try {
    const { patientId } = await req.json()

    if (!patientId || typeof patientId !== 'string') {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 })
    }

    // Same answer for "does not exist" and "not yours", so ids cannot be probed.
    if (!(await ownsPatient(gate.supabase, gate.user.id, patientId))) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const limited = limitResponse(await consumeHourly(`ai:video-room:${gate.user.id}`, HOURLY_LIMITS.videoRoom))
    if (limited) return limited

    // The call id is chosen here and the room is named after it with a keyed
    // hash (lib/videoCall.ts): Daily never receives the patient's id, the URL
    // cannot be guessed, and a row naming another call's room gets no token.
    const callId = randomUUID()
    const roomName = roomNameFor(callId)

    const res = await fetch(`${DAILY_API}/rooms`, {
      method: 'POST',
      headers: dailyHeaders(),
      body: JSON.stringify({ name: roomName, ...roomProperties() }),
    })

    if (!res.ok) {
      console.error('Daily room creation failed:', res.status)
      return NextResponse.json({ error: 'Could not create video room' }, { status: 500 })
    }

    const data = await res.json()
    // A new call replaces any earlier active one for this patient (a call left
    // with Daily's own Leave button, a closed tab, or an old public room), so a
    // stale row never hides the new call.
    const { data: previous } = await db
      .from('video_calls')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .select('room_name')
    for (const p of previous ?? []) {
      if (ROOM_NAME.test(p.room_name ?? '')) {
        await fetch(`${DAILY_API}/rooms/${encodeURIComponent(p.room_name)}`, { method: 'DELETE', headers: dailyHeaders() }).catch(() => {})
      }
    }
    const { data: call, error } = await db
      .from('video_calls')
      .insert({ id: callId, patient_id: patientId, room_url: data.url, room_name: data.name, created_by: gate.user.id, status: 'active' })
      .select('id, room_url, status')
      .single()
    if (error || !call) {
      // No record, no call: remove the room so it cannot be used.
      await fetch(`${DAILY_API}/rooms/${encodeURIComponent(roomName)}`, { method: 'DELETE', headers: dailyHeaders() }).catch(() => {})
      console.error('video call not recorded:', error?.message)
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    return NextResponse.json({ call: { id: call.id, room_url: call.room_url, status: call.status } })
  } catch (err) {
    console.error('Errore create-room:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
