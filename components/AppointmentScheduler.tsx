'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Video, MapPin, Check, X, Loader2, Plus, Sparkles } from 'lucide-react'

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

const MORNING_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
const AFTERNOON_SLOTS = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00']

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
  const [justConfirmed, setJustConfirmed] = useState(false)
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
      setSaving(false)
      setJustConfirmed(true)
      await loadAppointments()
      setTimeout(() => {
        setJustConfirmed(false)
        setShowPicker(false)
        setSelectedSlot(null)
      }, 1400)
    } else {
      setError('Could not save the appointment. Please try again.')
      setSaving(false)
    }
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

  const isTodaySelected = selectedDay.toDateString() === new Date().toDateString()

  const formatDayShort = (d: Date) => {
    const isToday = d.toDateString() === new Date().toDateString()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = d.toDateString() === tomorrow.toDateString()
    if (isToday) return { top: 'TODAY', bottom: d.getDate().toString() }
    if (isTomorrow) return { top: 'TMRW', bottom: d.getDate().toString() }
    return {
      top: d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
      bottom: d.getDate().toString(),
    }
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
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-4 overflow-hidden rounded-[24px] p-[1.5px]"
          style={{ background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' }}
        >
          <div className="relative rounded-[22px] bg-white dark:bg-[#0e0f12] p-5 overflow-hidden">
            <div
              className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-[0.12] blur-2xl"
              style={{ background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' }}
            />
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-[#4F7CFF]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4F7CFF]">Next appointment</p>
            </div>
            <p className="text-xl font-bold text-ink dark:text-white">
              {new Date(nextAppointment.scheduled_at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-ink/60 dark:text-white/60">
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {new Date(nextAppointment.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex items-center gap-1.5">
                {nextAppointment.session_type === 'video' ? <Video size={13} /> : <MapPin size={13} />}
                {nextAppointment.session_type === 'video' ? 'Video call' : 'In person'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {mode === 'physio' && pendingRequests.length > 0 && (
        <div className="mb-4 space-y-2">
          {pendingRequests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white">
                  Requested: {new Date(req.scheduled_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} at {new Date(req.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-ink/50 dark:text-white/50">{req.session_type === 'video' ? 'Video call' : 'In person'}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => updateStatus(req.id, 'confirmed')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white hover:scale-110 transition-transform"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => updateStatus(req.id, 'cancelled')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:scale-110 transition-transform"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!showPicker ? (
          nextAppointment && nextAppointment.status === 'confirmed' ? (
            <motion.button
              key="cta-secondary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPicker(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-ink/40 dark:text-white/40 hover:text-[#4F7CFF] transition-colors"
            >
              <Plus size={13} />
              {mode === 'physio' ? 'Schedule another appointment' : 'Request another appointment'}
            </motion.button>
          ) : (
            <motion.button
              key="cta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPicker(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-[1.015]"
              style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
            >
              <Plus size={16} />
              {mode === 'physio' ? 'Schedule Appointment' : 'Request Appointment'}
            </motion.button>
          )
        ) : (
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="rounded-[24px] border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-2xl p-5 shadow-xl relative overflow-hidden"
          >
            <AnimatePresence>
              {justConfirmed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/95 dark:bg-[#0e0f12]/95 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="flex h-14 w-14 items-center justify-center rounded-full text-white"
                    style={{ background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' }}
                  >
                    <Check size={26} strokeWidth={3} />
                  </motion.div>
                  <p className="text-sm font-semibold text-ink dark:text-white">
                    {mode === 'physio' ? 'Appointment scheduled' : 'Request sent'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">
              Choose a day
            </p>
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {days.map((d) => {
                const label = formatDayShort(d)
                const isSelected = d.toDateString() === selectedDay.toDateString()
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => setSelectedDay(d)}
                    className={`shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl transition-all ${
                      isSelected
                        ? 'text-white shadow-[0_6px_16px_rgba(79,124,255,0.4)] scale-105'
                        : 'text-ink/60 dark:text-white/60 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.07] dark:hover:bg-white/10'
                    }`}
                    style={isSelected ? { background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' } : undefined}
                  >
                    <span className="text-[9px] font-bold tracking-wide opacity-80">{label.top}</span>
                    <span className="text-lg font-bold">{label.bottom}</span>
                  </button>
                )
              })}
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-2">
              Morning
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {MORNING_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                    selectedSlot === slot
                      ? 'border-transparent text-white shadow-md scale-[1.03]'
                      : 'border-black/10 dark:border-white/10 text-ink/60 dark:text-white/60 hover:border-[#4F7CFF]/40'
                  }`}
                  style={selectedSlot === slot ? { background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' } : undefined}
                >
                  {slot}
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-2">
              Afternoon
            </p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {AFTERNOON_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                    selectedSlot === slot
                      ? 'border-transparent text-white shadow-md scale-[1.03]'
                      : 'border-black/10 dark:border-white/10 text-ink/60 dark:text-white/60 hover:border-[#4F7CFF]/40'
                  }`}
                  style={selectedSlot === slot ? { background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' } : undefined}
                >
                  {slot}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => setSessionType('video')}
                className={`flex flex-col items-center gap-1.5 rounded-2xl py-4 border transition-all ${
                  sessionType === 'video'
                    ? 'border-[#4F7CFF] bg-[#4F7CFF]/10 shadow-sm'
                    : 'border-black/10 dark:border-white/10'
                }`}
              >
                <Video size={20} className={sessionType === 'video' ? 'text-[#4F7CFF]' : 'text-ink/40 dark:text-white/40'} />
                <span className={`text-sm font-semibold ${sessionType === 'video' ? 'text-[#4F7CFF]' : 'text-ink/60 dark:text-white/60'}`}>
                  Video
                </span>
                <span className="text-[10px] text-ink/40 dark:text-white/40">From anywhere</span>
              </button>
              <button
                onClick={() => setSessionType('in_person')}
                className={`flex flex-col items-center gap-1.5 rounded-2xl py-4 border transition-all ${
                  sessionType === 'in_person'
                    ? 'border-[#4F7CFF] bg-[#4F7CFF]/10 shadow-sm'
                    : 'border-black/10 dark:border-white/10'
                }`}
              >
                <MapPin size={20} className={sessionType === 'in_person' ? 'text-[#4F7CFF]' : 'text-ink/40 dark:text-white/40'} />
                <span className={`text-sm font-semibold ${sessionType === 'in_person' ? 'text-[#4F7CFF]' : 'text-ink/60 dark:text-white/60'}`}>
                  In Person
                </span>
                <span className="text-[10px] text-ink/40 dark:text-white/40">At the clinic</span>
              </button>
            </div>

            {selectedSlot && (
              <div className="mb-4 rounded-xl bg-black/[0.03] dark:bg-white/5 px-4 py-2.5 text-center">
                <p className="text-xs font-medium text-ink/70 dark:text-white/70">
                  {isTodaySelected ? 'Today' : selectedDay.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}, {selectedSlot} · {sessionType === 'video' ? 'Video call' : 'In person'} · 30 min
                </p>
              </div>
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
                className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-transform hover:scale-[1.02] shadow-[0_6px_20px_rgba(79,124,255,0.3)]"
                style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {mode === 'physio' ? 'Confirm' : 'Send Request'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-2">History</p>
          <div className="space-y-1.5">
            {history.slice(0, 5).map((a) => (
              <div key={a.id} className="rounded-xl border border-black/[0.06] dark:border-white/10 px-3 py-2.5 flex items-center justify-between text-xs">
                <span className="text-ink/60 dark:text-white/60 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      a.status === 'completed' ? 'bg-emerald-500' : a.status === 'confirmed' ? 'bg-[#4F7CFF]' : 'bg-ink/20 dark:bg-white/20'
                    }`}
                  />
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