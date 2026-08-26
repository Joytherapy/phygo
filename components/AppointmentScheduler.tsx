'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Calendar, Clock, Video, MapPin, Check, X, Loader2, Plus } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Appointment = {
  id: string
  scheduled_at: string
  duration_minutes: number
  session_type: 'video' | 'in_person'
  status: 'requested' | 'confirmed' | 'cancelled' | 'completed'
  requested_by: 'physio' | 'patient'
}

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00']

function nextDays(n: number) {
  const days: Date[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

export default function AppointmentScheduler({
  patientId,
  mode,
}: {
  patientId: string
  mode: 'physio' | 'patient'
}) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [sessionType, setSessionType] = useState<'video' | 'in_person'>('video')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const days = nextDays(14)

  const loadAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('id, scheduled_at, duration_minutes, session_type, status, requested_by')
      .eq('patient_id', patientId)
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: true })
    setAppointments(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const handleConfirmSlot = async () => {
    if (!selectedSlot) return
    setSaving(true)
    setError(null)

    const [hours, minutes] = selectedSlot.split(':').map(Number)
    const scheduledAt = new Date(selectedDay)
    scheduledAt.setHours(hours, minutes, 0, 0)

    let physioId: string | null = null

    if (mode === 'physio') {
      const { data: { user } } = await supabase.auth.getUser()
      physioId = user?.id || null
    } else {
      const { data: patientRow } = await supabase
        .from('patients')
        .select('user_id')
        .eq('id', patientId)
        .single()
      physioId = patientRow?.user_id || null
    }

    const { error: insertError } = await supabase.from('appointments').insert({
      patient_id: patientId,
      physio_id: physioId,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: 30,
      session_type: sessionType,
      status: mode === 'physio' ? 'confirmed' : 'requested',
      requested_by: mode,
    })

    if (!insertError) {
      setShowPicker(false)
      setSelectedSlot(null)
      await loadAppointments()
    } else {
      setError('Could not save the appointment. Please try again.')
    }
    setSaving(false)
  }

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    await supabase.from('appointments').update({ status }).eq('id', id)
    await loadAppointments()
  }

  const now = new Date()
  const upcoming = appointments.filter((a) => new Date(a.scheduled_at) >= now && a.status !== 'cancelled')
  const nextAppointment = upcoming.find((a) => a.status === 'confirmed') || upcoming[0]
  const pendingRequests = appointments.filter((a) => a.status === 'requested')
  const history = appointments.filter((a) => new Date(a.scheduled_at) < now || a.status === 'completed')

  const formatDayLabel = (d: Date) => {
    const isToday = d.toDateString() === new Date().toDateString()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = d.toDateString() === tomorrow.toDateString()
    if (isToday) return 'Today'
    if (isTomorrow) return 'Tomorrow'
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/15 py-10 text-center">
        <Loader2 size={18} className="mx-auto animate-spin text-ink/30 dark:text-white/30" />
      </div>
    )
  }

  return (
    <div>
      {nextAppointment && nextAppointment.status === 'confirmed' && (
        <div className="mb-4 rounded-2xl border border-[#4F7CFF]/20 bg-gradient-to-br from-[#4F7CFF]/10 to-[#32D6A0]/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-[#4F7CFF]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4F7CFF]">Next appointment</p>
          </div>
          <p className="text-lg font-bold text-ink dark:text-white">
            {new Date(nextAppointment.scheduled_at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="flex items-center gap-3 mt-1 text-sm text-ink/60 dark:text-white/60">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {new Date(nextAppointment.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1">
              {nextAppointment.session_type === 'video' ? <Video size={12} /> : <MapPin size={12} />}
              {nextAppointment.session_type === 'video' ? 'Video call' : 'In person'}
            </span>
          </div>
        </div>
      )}

      {mode === 'physio' && pendingRequests.length > 0 && (
        <div className="mb-4 space-y-2">
          {pendingRequests.map((req) => (
            <div key={req.id} className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white">
                  Requested: {new Date(req.scheduled_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} at {new Date(req.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-ink/50 dark:text-white/50">{req.session_type === 'video' ? 'Video call' : 'In person'}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => updateStatus(req.id, 'confirmed')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => updateStatus(req.id, 'cancelled')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showPicker ? (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.3)] transition-transform hover:scale-[1.02]"
          style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
        >
          <Plus size={16} />
          {mode === 'physio' ? 'Schedule Appointment' : 'Request Appointment'}
        </button>
      ) : (
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {days.map((d) => (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDay(d)}
                className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                  d.toDateString() === selectedDay.toDateString()
                    ? 'text-white'
                    : 'text-ink/60 dark:text-white/60 bg-black/5 dark:bg-white/5'
                }`}
                style={
                  d.toDateString() === selectedDay.toDateString()
                    ? { background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }
                    : undefined
                }
              >
                {formatDayLabel(d)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-xl py-2 text-xs font-semibold border transition-colors ${
                  selectedSlot === slot
                    ? 'border-[#4F7CFF] text-[#4F7CFF] bg-[#4F7CFF]/10'
                    : 'border-black/10 dark:border-white/10 text-ink/60 dark:text-white/60'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSessionType('video')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                sessionType === 'video'
                  ? 'border-[#4F7CFF] text-[#4F7CFF] bg-[#4F7CFF]/10'
                  : 'border-black/10 dark:border-white/10 text-ink/50 dark:text-white/50'
              }`}
            >
              <Video size={14} />
              Video
            </button>
            <button
              onClick={() => setSessionType('in_person')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                sessionType === 'in_person'
                  ? 'border-[#4F7CFF] text-[#4F7CFF] bg-[#4F7CFF]/10'
                  : 'border-black/10 dark:border-white/10 text-ink/50 dark:text-white/50'
              }`}
            >
              <MapPin size={14} />
              In Person
            </button>
          </div>

          {selectedSlot && (
            <p className="text-xs text-ink/50 dark:text-white/50 mb-3 text-center">
              {formatDayLabel(selectedDay)}, {selectedSlot} · {sessionType === 'video' ? 'Video call' : 'In person'} · 30 min
            </p>
          )}

          {error && <p className="text-xs text-red-500 mb-3 text-center">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => { setShowPicker(false); setSelectedSlot(null); setError(null) }}
              className="flex-1 rounded-full py-2.5 text-sm font-semibold text-ink/60 dark:text-white/60 border border-black/10 dark:border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSlot}
              disabled={!selectedSlot || saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-transform hover:scale-[1.02]"
              style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {mode === 'physio' ? 'Confirm' : 'Send Request'}
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-2">History</p>
          <div className="space-y-1.5">
            {history.slice(0, 5).map((a) => (
              <div key={a.id} className="rounded-xl border border-black/[0.06] dark:border-white/10 px-3 py-2 flex items-center justify-between text-xs">
                <span className="text-ink/60 dark:text-white/60">
                  {new Date(a.scheduled_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {a.session_type === 'video' ? 'Video' : 'In person'}
                </span>
                <span className="text-ink/30 dark:text-white/30 capitalize">{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}