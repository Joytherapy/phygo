import { NextRequest, NextResponse } from 'next/server'
import { ownsPatient, requireProfessional } from '@/lib/auth/sessionServer'
import { consumeHourly, HOURLY_LIMITS, limitResponse } from '@/lib/rateLimit'

// Creates a paid Daily.co room for one of the signed-in clinician's own
// patients. Rooms are created only by the clinician; patients join them from
// My Phygo through the video_calls row (RLS: their own calls only).
export async function POST(req: NextRequest) {
  const gate = await requireProfessional()
  if (!gate.ok) return gate.response

  if (!process.env.DAILY_API_KEY) {
    return NextResponse.json({ error: 'Video calls are not configured' }, { status: 503 })
  }

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

    const roomName = `session-${patientId}-${Date.now()}`

    const res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
          enable_chat: true,
          enable_screenshare: true,
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Daily room creation failed:', errText)
      return NextResponse.json({ error: 'Could not create video room' }, { status: 500 })
    }

    const data = await res.json()

    return NextResponse.json({ url: data.url, name: data.name })
  } catch (err) {
    console.error('Errore create-room:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}