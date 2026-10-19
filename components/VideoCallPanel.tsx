'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Video, PhoneOff, Loader2 } from 'lucide-react'
import { refusalMessage, useVerificationStrings } from '@/lib/i18n/verificationStrings'
import { useLanguage } from '@/contexts/LanguageContext'
import { lazy } from '@/lib/lazy'
import { MY_PHYGO_STRINGS } from '@/lib/i18n/myPhygoStrings'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

type ActiveCall = {
  id: string
  room_url: string
  status: string
}

type Session = { url: string; token: string }

// The Daily call inside the page, joined with a meeting token from our server
// through Daily's documented join({ url, token }). The room is private, so its
// URL alone opens nothing. daily-js passes the token to Daily's own frame in
// that frame's address (?t=...); it never appears in this page's URL, in the
// browser history of PHYGO, or in any request to our server after it is issued.
function DailyFrame({ session, onLeft }: { session: Session; onLeft: () => void }) {
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let cancelled = false
    let frame: { destroy: () => Promise<void> } | null = null
    ;(async () => {
      const { default: DailyIframe } = await import('@daily-co/daily-js')
      if (cancelled || !container.current) return
      try {
        const f = DailyIframe.createFrame(container.current, {
          iframeStyle: { width: '100%', height: '100%', border: '0' },
          showLeaveButton: true,
        })
        frame = f
        f.on('left-meeting', onLeft)
        await f.join({ url: session.url, token: session.token })
      } catch {
        onLeft()
      }
    })()
    return () => {
      cancelled = true
      frame?.destroy().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])
  return <div ref={container} className="w-full aspect-video" />
}

// On the clinician's call page the states before and between calls sit on a
// full-size stage, so the page keeps the call's shape before it starts.
function Stage({ on, children }: { on: boolean; children: React.ReactNode }) {
  if (!on) return <>{children}</>
  return (
    <div className="relative grid aspect-video min-h-[280px] place-items-center overflow-hidden rounded-[18px] bg-black/[0.03] dark:bg-black/40">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(124,131,255,0.18), transparent 70%)' }} />
      <div className="relative flex w-full max-w-sm flex-col items-center gap-5 px-6 text-center">
        <span aria-hidden className="grid h-16 w-16 place-items-center rounded-full border border-black/[0.06] bg-white/70 text-ink/70 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-white/80">
          <Video size={24} />
        </span>
        <div className="w-full">{children}</div>
      </div>
    </div>
  )
}

export default function VideoCallPanel({
  patientId,
  canStart,
  stage = false,
}: {
  patientId: string
  canStart: boolean
  /** Show the idle states on a full-size stage (the clinician's call page). */
  stage?: boolean
}) {
  const [call, setCall] = useState<ActiveCall | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)
  // A call ended on the server whose Daily room could not be closed: the
  // clinician can try again (the server answers 200 only once the room is gone).
  const [unclosed, setUnclosed] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const t = useVerificationStrings()
  const { lang } = useLanguage()
  const v = MY_PHYGO_STRINGS[lang].video

  const loadActiveCall = async () => {
    const { data } = await supabase
      .from('video_calls')
      .select('id, room_url, status')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      // Only a call that can still be joined: rooms last one hour, and old
      // public rooms (session-…) are never reopened.
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .like('room_name', 'phygo-%')
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

  // Every join asks the server for a new token: it checks that this call is
  // ours (as the clinician or as the patient) and still active.
  const join = async (target: ActiveCall) => {
    setError(null)
    const res = await fetch('/api/video-call/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId: target.id, lang }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(refusalMessage(t, res.status, data) ?? (res.status === 410 ? v.callEnded : t.videoFailed))
      if (res.status === 410) loadActiveCall()
      return
    }
    setSession({ url: data.url, token: data.token })
  }

  const startCall = async () => {
    setStarting(true)
    setError(null)

    const res = await fetch('/api/video-call/create-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId }),
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok || !data.call) {
      console.error('Errore creazione stanza:', data.error)
      setError(refusalMessage(t, res.status, data) ?? t.videoFailed)
      setStarting(false)
      return
    }
    setCall(data.call)
    await join(data.call)
    setStarting(false)
  }

  // The clinician ends the call on the server: no new tokens, room deleted.
  const closeCall = async (callId: string) => {
    const res = await fetch('/api/video-call/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setUnclosed(null)
      setError(null)
    } else {
      setUnclosed(data.code === 'room_not_closed' ? callId : null)
      setError(data.code === 'room_not_closed' ? v.roomNotClosed : t.videoFailed)
    }
  }

  const endCall = async () => {
    if (!call) return
    setSession(null)
    if (canStart) await closeCall(call.id)
    loadActiveCall()
  }

  if (loading) {
    return (
      <Stage on={stage}>
        <div className={stage ? 'py-2 text-center' : 'rounded-2xl border border-dashed border-black/10 dark:border-white/15 py-10 text-center'}>
          <Loader2 size={18} className="mx-auto animate-spin text-ink/30 dark:text-white/30" />
        </div>
      </Stage>
    )
  }

  if (call && session) {
    return (
      <div className="rounded-2xl overflow-hidden border border-black/[0.09] dark:border-white/10">
        <DailyFrame session={session} onLeft={() => setSession(null)} />
        <div className="p-3 flex justify-end bg-white dark:bg-white/[0.03]">
          <button
            onClick={endCall}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            <PhoneOff size={13} />
            {canStart ? v.endCall : v.leaveCall}
          </button>
        </div>
      </div>
    )
  }

  if (call && !session) {
    return (
      <Stage on={stage}>
      <div>
      <button
        onClick={() => join(call)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#7C83FF]/30 bg-[#7C83FF]/10 py-4 text-sm font-semibold text-[#7C83FF] hover:bg-[#7C83FF]/15 transition-colors animate-pulse"
      >
        <Video size={16} />
        {v.joinCall}
      </button>
      {error && <p role="alert" className="text-xs text-red-500 mt-2 text-center">{error}</p>}
      </div>
      </Stage>
    )
  }

  if (!canStart) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/15 py-10 text-center">
        <p className="text-sm text-ink/55 dark:text-white/40">{v.noActiveCall}</p>
      </div>
    )
  }

  return (
    <Stage on={stage}>
    <div>
      <button
        onClick={startCall}
        disabled={starting}
        className="w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 transition-transform disabled:opacity-60"
      >
        {starting ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
        {starting ? v.starting : v.startCall}
      </button>
      {error && <p role="alert" className="text-xs text-red-500 mt-2 text-center">{error}</p>}
      {unclosed && (
        <button
          onClick={() => closeCall(unclosed)}
          className="mt-2 mx-auto flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
        >
          <PhoneOff size={13} />
          {v.closeRoom}
        </button>
      )}
    </div>
    </Stage>
  )
}