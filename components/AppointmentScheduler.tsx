'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Video, MapPin, Check, X, Loader2, Plus, Sparkles, CalendarX } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAgendaUi, localeForLang } from '@/lib/i18n/agendaStrings'
import { useDashboardUi } from '@/lib/i18n/dashboardStrings'
import { MY_PHYGO_STRINGS } from '@/lib/i18n/myPhygoStrings'
import { cancelAppointment } from '@/lib/appointments'
import { lazy } from '@/lib/lazy'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

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
  const { lang } = useLanguage()
  const ui = useAgendaUi()
  const t = useDashboardUi()
  const locale = localeForLang(lang)
  const sched = MY_PHYGO_STRINGS[lang].scheduler
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [sessionType, setSessionType] = useState<'video' | 'in_person'>('video')
  const [saving, setSaving] = useState(false)
  const [justConfirmed, setJustConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

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
      setError(ui.common.saveError)
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    setStatusError(null)
    const { error: updateError } = await supabase.from('appointments').update({ status }).eq('id', id)
    // A refused update (e.g. database rules) used to fail silently.
    if (updateError) setStatusError(t.agenda.statusError)
    await loadAppointments()
  }

  // Clinician only (mode 'physio'); the database allows it only for the
  // clinician's own patients and only when can_manage_patients() is true.
  const handleCancel = async (id: string) => {
    setCancelling(true)
    setCancelError(null)
    const ok = await cancelAppointment(supabase, id)
    setCancelling(false)
    if (!ok) {
      setCancelError(ui.cancelFlow.cancelError)
      return
    }
    setConfirmingCancel(false)
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
    if (isToday) return { top: ui.common.today.toUpperCase(), bottom: d.getDate().toString() }
    if (isTomorrow) return { top: ui.common.tomorrow.toUpperCase(), bottom: d.getDate().toString() }
    return {
      top: d.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase(),
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
          style={{ background: 'linear-gradient(135deg, #7C83FF 0%, #8B5CF6 100%)' }}
        >
          <div className="relative rounded-[22px] bg-white dark:bg-[#0e0f12] p-5 overflow-hidden">
            <div
              className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-[0.12] blur-2xl"
              style={{ background: 'linear-gradient(135deg, #7C83FF 0%, #8B5CF6 100%)' }}
            />
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-[#7C83FF]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7C83FF]">{ui.scheduler.nextAppointment}</p>
            </div>
            <p className="text-xl font-bold text-ink dark:text-white">
              {new Date(nextAppointment.scheduled_at).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-ink/60 dark:text-white/60">
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {new Date(nextAppointment.scheduled_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex items-center gap-1.5">
                {nextAppointment.session_type === 'video' ? <Video size={13} /> : <MapPin size={13} />}
                {nextAppointment.session_type === 'video' ? ui.common.videoCall : ui.common.inPerson}
              </span>
            </div>
            {mode === 'physio' &&
              (confirmingCancel ? (
                <div className="relative mt-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                  <p className="text-sm font-semibold text-ink dark:text-white">{ui.cancelFlow.confirmQuestion}</p>
                  <p className="text-xs text-ink/60 dark:text-white/50 mt-1 mb-3">{ui.cancelFlow.confirmDetail}</p>
                  {cancelError && <p className="text-xs text-red-500 mb-3">{cancelError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setConfirmingCancel(false)
                        setCancelError(null)
                      }}
                      disabled={cancelling}
                      className="flex-1 rounded-full py-2 text-xs font-semibold text-ink/60 dark:text-white/60 border border-black/10 dark:border-white/10 disabled:opacity-50"
                    >
                      {ui.cancelFlow.keep}
                    </button>
                    <button
                      onClick={() => handleCancel(nextAppointment.id)}
                      disabled={cancelling}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {cancelling && <Loader2 size={12} className="animate-spin" />}
                      {ui.cancelFlow.confirmYes}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(true)}
                  className="relative mt-2 -ml-2 flex min-h-[40px] items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                >
                  <CalendarX size={13} />
                  {ui.cancelFlow.cancelAppointment}
                </button>
              ))}
          </div>
        </motion.div>
      )}

      {mode === 'physio' && pendingRequests.length > 0 && (
        <div className="mb-4 space-y-2">
          {statusError && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
              {statusError}
            </p>
          )}
          {pendingRequests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white">
                  {ui.scheduler.requestedPrefix} {new Date(req.scheduled_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })} · {new Date(req.scheduled_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-ink/60 dark:text-white/50">{req.session_type === 'video' ? ui.common.videoCall : ui.common.inPerson}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => updateStatus(req.id, 'confirmed')}
                  aria-label={t.agenda.confirmRequest}
                  title={t.agenda.confirmRequest}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white hover:scale-110 transition-transform"
                >
                  <Check size={15} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(req.id, 'cancelled')}
                  aria-label={t.agenda.declineRequest}
                  title={t.agenda.declineRequest}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white hover:scale-110 transition-transform"
                >
                  <X size={15} aria-hidden />
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
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-ink/55 dark:text-white/40 hover:text-ink dark:hover:text-white transition-colors"
            >
              <Plus size={13} />
              {mode === 'physio' ? ui.scheduler.scheduleAnother : ui.scheduler.requestAnother}
            </motion.button>
          ) : (
            <motion.button
              key="cta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPicker(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 shadow-[0_10px_30px_rgba(124,131,255,0.35)] transition-transform hover:scale-[1.015]"
            >
              <Plus size={16} />
              {mode === 'physio' ? ui.scheduler.scheduleAppointment : ui.scheduler.requestAppointment}
            </motion.button>
          )
        ) : (
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="rounded-[24px] border border-black/[0.09] dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-2xl p-5 shadow-xl relative overflow-hidden"
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
                    style={{ background: 'linear-gradient(135deg, #7C83FF 0%, #8B5CF6 100%)' }}
                  >
                    <Check size={26} strokeWidth={3} />
                  </motion.div>
                  <p className="text-sm font-semibold text-ink dark:text-white">
                    {mode === 'physio' ? ui.scheduler.appointmentScheduled : ui.scheduler.requestSent}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-xs font-semibold uppercase tracking-wide text-ink/55 dark:text-white/40 mb-3">
              {ui.scheduler.chooseADay}
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
                        ? 'text-white shadow-[0_6px_16px_rgba(124,131,255,0.4)] scale-105'
                        : 'text-ink/60 dark:text-white/60 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.07] dark:hover:bg-white/10'
                    }`}
                    style={isSelected ? { background: 'linear-gradient(135deg, #7C83FF 0%, #8B5CF6 100%)' } : undefined}
                  >
                    <span className="text-[9px] font-bold tracking-wide opacity-80">{label.top}</span>
                    <span className="text-lg font-bold">{label.bottom}</span>
                  </button>
                )
              })}
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-ink/55 dark:text-white/40 mb-2">
              {ui.scheduler.morning}
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {MORNING_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                    selectedSlot === slot
                      ? 'border-transparent text-white shadow-md scale-[1.03]'
                      : 'border-black/10 dark:border-white/10 text-ink/60 dark:text-white/60 hover:border-black/15 dark:hover:border-white/20'
                  }`}
                  style={selectedSlot === slot ? { background: 'linear-gradient(135deg, #7C83FF 0%, #8B5CF6 100%)' } : undefined}
                >
                  {slot}
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-ink/55 dark:text-white/40 mb-2">
              {ui.scheduler.afternoon}
            </p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {AFTERNOON_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                    selectedSlot === slot
                      ? 'border-transparent text-white shadow-md scale-[1.03]'
                      : 'border-black/10 dark:border-white/10 text-ink/60 dark:text-white/60 hover:border-black/15 dark:hover:border-white/20'
                  }`}
                  style={selectedSlot === slot ? { background: 'linear-gradient(135deg, #7C83FF 0%, #8B5CF6 100%)' } : undefined}
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
                    ? 'border-[#7C83FF] bg-[#7C83FF]/10 shadow-soft'
                    : 'border-black/10 dark:border-white/10'
                }`}
              >
                <Video size={20} className={sessionType === 'video' ? 'text-[#7C83FF]' : 'text-ink/55 dark:text-white/40'} />
                <span className={`text-sm font-semibold ${sessionType === 'video' ? 'text-[#7C83FF]' : 'text-ink/60 dark:text-white/60'}`}>
                  {ui.common.video}
                </span>
                <span className="text-[10px] text-ink/55 dark:text-white/40">{ui.scheduler.fromAnywhere}</span>
              </button>
              <button
                onClick={() => setSessionType('in_person')}
                className={`flex flex-col items-center gap-1.5 rounded-2xl py-4 border transition-all ${
                  sessionType === 'in_person'
                    ? 'border-[#7C83FF] bg-[#7C83FF]/10 shadow-soft'
                    : 'border-black/10 dark:border-white/10'
                }`}
              >
                <MapPin size={20} className={sessionType === 'in_person' ? 'text-[#7C83FF]' : 'text-ink/55 dark:text-white/40'} />
                <span className={`text-sm font-semibold ${sessionType === 'in_person' ? 'text-[#7C83FF]' : 'text-ink/60 dark:text-white/60'}`}>
                  {ui.common.inPersonShort}
                </span>
                <span className="text-[10px] text-ink/55 dark:text-white/40">{ui.scheduler.atTheClinic}</span>
              </button>
            </div>

            {selectedSlot && (
              <div className="mb-4 rounded-xl bg-black/[0.03] dark:bg-white/5 px-4 py-2.5 text-center">
                <p className="text-xs font-medium text-ink/70 dark:text-white/70">
                  {isTodaySelected ? ui.common.today : selectedDay.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}, {selectedSlot} · {sessionType === 'video' ? ui.common.videoCall : ui.common.inPerson} · 30 min
                </p>
              </div>
            )}

            {error && <p className="text-xs text-red-500 mb-3 text-center">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => { setShowPicker(false); setSelectedSlot(null); setError(null) }}
                className="flex-1 rounded-full py-2.5 text-sm font-semibold text-ink/60 dark:text-white/60 border border-black/10 dark:border-white/10"
              >
                {ui.common.cancel}
              </button>
              <button
                onClick={handleConfirmSlot}
                disabled={!selectedSlot || saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 disabled:opacity-50 transition-transform shadow-[0_6px_20px_rgba(124,131,255,0.3)]"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {mode === 'physio' ? ui.common.confirm : ui.scheduler.sendRequest}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55 dark:text-white/40 mb-2">{ui.scheduler.history}</p>
          <div className="space-y-1.5">
            {history.slice(0, 5).map((a) => (
              <div key={a.id} className="rounded-xl border border-black/[0.09] dark:border-white/10 px-3 py-2.5 flex items-center justify-between text-xs">
                <span className="text-ink/60 dark:text-white/60 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      a.status === 'completed' ? 'bg-emerald-500' : a.status === 'confirmed' ? 'bg-[#7C83FF]' : 'bg-ink/20 dark:bg-white/20'
                    }`}
                  />
                  {new Date(a.scheduled_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })} · {a.session_type === 'video' ? ui.common.video : ui.common.inPersonShort}
                </span>
                <span className="text-ink/30 dark:text-white/30">{sched.status[a.status] ?? a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
