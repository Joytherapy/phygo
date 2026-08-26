'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Video, PhoneOff, Loader2 } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ActiveCall = {
  id: string
  room_url: string
  status: string
}

export default function VideoCallPanel({
  patientId,
  canStart,
}: {
  patientId: string
  canStart: boolean
}) {
  const [call, setCall] = useState<ActiveCall | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadActiveCall = async () => {
    const { data } = await supabase
      .from('video_calls')
      .select('id, room_url, status')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setCall(data || null)
    setLoading(false)
  }

  useEffect(() => {
    loadActiveCall()
    pollRef.current = setInterval(loadActiveCall, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const startCall = async () => {
    setStarting(true)
    setError(null)

    const res = await fetch('/api/video-call/create-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId }),
    })
    const data = await res.json()

    if (!res.ok) {
      console.error('Errore creazione stanza:', data.error)
      setError('Could not start the video call. Please try again.')
      setStarting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { data: newCall, error: insertError } = await supabase
      .from('video_calls')
      .insert({
        patient_id: patientId,
        room_url: data.url,
        room_name: data.name,
        created_by: user?.id,
        status: 'active',
      })
      .select('id, room_url, status')
      .single()

    if (!insertError && newCall) {
      setCall(newCall)
      setInCall(true)
    } else {
      setError('Could not save the call. Please try again.')
    }
    setStarting(false)
  }

  const endCall = async () => {
    if (!call) return
    await supabase
      .from('video_calls')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', call.id)
    setCall(null)
    setInCall(false)
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/15 py-10 text-center">
        <Loader2 size={18} className="mx-auto animate-spin text-ink/30 dark:text-white/30" />
      </div>
    )
  }

  if (call && inCall) {
    return (
      <div className="rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/10">
        <iframe
          src={call.room_url}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full aspect-video"
        />
        <div className="p-3 flex justify-end bg-white dark:bg-white/[0.03]">
          <button
            onClick={endCall}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            <PhoneOff size={13} />
            {canStart ? 'End call' : 'Leave call'}
          </button>
        </div>
      </div>
    )
  }

  if (call && !inCall) {
    return (
      <button
        onClick={() => setInCall(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#4F7CFF]/30 bg-[#4F7CFF]/10 py-4 text-sm font-semibold text-[#4F7CFF] hover:bg-[#4F7CFF]/15 transition-colors animate-pulse"
      >
        <Video size={16} />
        Join video call
      </button>
    )
  }

  if (!canStart) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/15 py-10 text-center">
        <p className="text-sm text-ink/40 dark:text-white/40">No active call right now.</p>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={startCall}
        disabled={starting}
        className="w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-[1.02] disabled:opacity-60"
        style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
      >
        {starting ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
        {starting ? 'Starting...' : 'Start Video Call'}
      </button>
      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
    </div>
  )
}