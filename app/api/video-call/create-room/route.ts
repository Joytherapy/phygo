import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { patientId } = await req.json()

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 })
    }

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