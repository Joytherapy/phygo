'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Video,
  MapPin,
  Check,
  X,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  User,
  Clock,
  CalendarX,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import ClinicalAccessNotice from '@/components/ClinicalAccessNotice'
import { useClinicalLocked } from '@/lib/useClinicalAccess'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAgendaUi, localeForLang } from '@/lib/i18n/agendaStrings'
import { useDashboardUi } from '@/lib/i18n/dashboardStrings'
import ErrorState from '@/components/workspace/ErrorState'
import { cancelAppointment } from '@/lib/appointments'
import { lazy } from '@/lib/lazy'
import { PageBackdrop } from '@/components/ui/premium'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

type Appointment = {
  id: string
  patient_id: string
  scheduled_at: string
  duration_minutes: number
  session_type: 'video' | 'in_person'
  status: 'requested' | 'confirmed' | 'cancelled' | 'completed'
  patients: { name: string } | null
}

type PatientOption = { id: string; name: string }

const START_HOUR = 7
const END_HOUR = 21
const ROW_HEIGHT = 44
const TOTAL_ROWS = (END_HOUR - START_HOUR) * 2
// Slot preselected when adding from a day (not from a clicked slot): 09:00.
const DEFAULT_SLOT = (9 - START_HOUR) * 2

function buildSlots(locale: string) {
  return Array.from({ length: TOTAL_ROWS }, (_, i) => {
    const totalMinutes = START_HOUR * 60 + i * 30
    const hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60
    const d = new Date()
    d.setHours(hour, minute, 0, 0)
    return {
      hour,
      minute,
      isHour: minute === 0,
      display: d.toLocaleTimeString(locale, { hour: 'numeric', minute: minute === 0 ? undefined : '2-digit' }),
    }
  })
}

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

export default function AgendaPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const ui = useAgendaUi()
  const t = useDashboardUi()
  const locked = useClinicalLocked()
  const locale = localeForLang(lang)
  const SLOTS = buildSlots(locale)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [searchError, setSearchError] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [mounted, setMounted] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [addDay, setAddDay] = useState<Date | null>(null)
  const [addSlotIndex, setAddSlotIndex] = useState(18)
  const [addSessionType, setAddSessionType] = useState<'video' | 'in_person'>('video')
  const [patientQuery, setPatientQuery] = useState('')
  const [patientResults, setPatientResults] = useState<PatientOption[]>([])
  const [searchingPatients, setSearchingPatients] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null)
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addNote, setAddNote] = useState('')
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({})
  useEffect(() => {
    setMounted(true)
  }, [])

  // A failed load shows an error with Retry instead of an empty calendar that
  // would read as "no appointments".
  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, patient_id, scheduled_at, duration_minutes, session_type, status, patients(name)')
        .neq('status', 'cancelled')
        .order('scheduled_at', { ascending: true })
      if (error) throw error
      setAppointments((data as any) || [])
      setLoadError(false)
    } catch (err) {
      console.error('Appointments could not be loaded:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  const retryLoad = () => {
    setLoading(true)
    loadAppointments()
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    if (locked || updatingId) return
    setUpdatingId(id)
    setStatusError(null)
    try {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Appointment request could not be updated:', err)
      setStatusError(t.agenda.statusError)
    }
    await loadAppointments()
    setUpdatingId(null)
  }

  // Escape closes whichever dialog is open (not while a cancellation is running).
  useEffect(() => {
    if (!showAddModal && !selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (showAddModal && !addSaving) setShowAddModal(false)
      else if (selected && !cancelling) setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showAddModal, selected, addSaving, cancelling])

  const openDetails = (a: Appointment) => {
    setSelected(a)
    setConfirmingCancel(false)
    setCancelError(null)
  }

  const closeDetails = () => {
    if (cancelling) return
    setSelected(null)
  }

  const handleCancelSelected = async () => {
    if (!selected || locked) return
    setCancelling(true)
    setCancelError(null)
    const ok = await cancelAppointment(supabase, selected.id)
    setCancelling(false)
    if (!ok) {
      setCancelError(ui.cancelFlow.cancelError)
      return
    }
    setSelected(null)
    await loadAppointments()
  }

  const pendingRequests = appointments.filter((a) => a.status === 'requested')
  const confirmedAppointments = appointments.filter((a) => a.status === 'confirmed')

  const monday = getMonday(new Date())
  monday.setDate(monday.getDate() + weekOffset * 7)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString()

  const appointmentsForDay = (d: Date) =>
    confirmedAppointments.filter((a) => new Date(a.scheduled_at).toDateString() === d.toDateString())

  const weekLabel = () => {
    const start = weekDays[0]
    const end = weekDays[6]
    const sameMonth = start.getMonth() === end.getMonth()
    const startStr = start.toLocaleDateString(locale, { day: 'numeric', month: sameMonth ? undefined : 'short' })
    const endStr = end.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    return `${startStr} – ${endStr}`
  }

  const openAddModal = (day: Date, slotIndex: number) => {
    if (locked) return
    setAddDay(day)
    setAddSlotIndex(slotIndex)
    setAddSessionType('video')
    setPatientQuery('')
    setPatientResults([])
    setSearchError(false)
    setSelectedPatient(null)
    setAddError(null)
    setAddNote('')
    setShowAddModal(true)
  }

  const handleColumnClick = (day: Date, e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    const index = Math.min(Math.max(Math.floor(offsetY / ROW_HEIGHT), 0), TOTAL_ROWS - 1)
    openAddModal(day, index)
  }

  const searchPatients = async (text: string) => {
    setPatientQuery(text)
    if (!text.trim()) {
      setPatientResults([])
      return
    }
    setSearchingPatients(true)
    setSearchError(false)
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name')
        .ilike('name', `%${text.trim()}%`)
        .limit(6)
      if (error) throw error
      setPatientResults(data || [])
    } catch (err) {
      console.error('Patient search failed:', err)
      setPatientResults([])
      setSearchError(true)
    } finally {
      setSearchingPatients(false)
    }
  }

  const handleConfirmAdd = async () => {
    if (!selectedPatient || !addDay) return
    setAddSaving(true)
    setAddError(null)

    const slot = SLOTS[addSlotIndex]
    const scheduledAt = new Date(addDay)
    scheduledAt.setHours(slot.hour, slot.minute, 0, 0)

    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

    const { error } = await supabase.from('appointments').insert({
      patient_id: selectedPatient.id,
      physio_id: user?.id,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: 30,
      session_type: addSessionType,
            status: 'confirmed',
      requested_by: 'physio',
      notes: addNote.trim() || null,
    })

    if (!error) {
      setShowAddModal(false)
      await loadAppointments()
    } else {
      setAddError(ui.common.saveError)
    }
    setAddSaving(false)
  }

  return (
    <div className="relative min-h-screen bg-[#f7f7f8] dark:bg-[#050608] overflow-hidden transition-colors">
      <Navbar />

      <PageBackdrop />

      <main id="main-content" className="relative max-w-6xl mx-auto pt-32 sm:pt-40 pb-24 px-4 sm:px-6">
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push('/dashboard')}
          className="-ml-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-2 text-sm text-ink/60 dark:text-white/50 hover:text-ink dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={15} aria-hidden />
          {ui.page.backToPatients}
        </motion.button>

        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7C83FF] mb-2">
              {ui.page.eyebrow}
            </p>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white">
              {ui.page.title}
            </h1>
          </div>

          <div className="flex w-full sm:w-auto flex-col-reverse sm:flex-row sm:items-center gap-2">
            <button
              type="button"
              onClick={() => openAddModal(weekDays.find(isToday) ?? weekDays[0], DEFAULT_SLOT)}
              disabled={locked}
              className="flex min-h-[40px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 shadow-[0_6px_16px_rgba(124,131,255,0.35)] transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Plus size={14} aria-hidden />
              {ui.page.newAppointment}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekOffset(weekOffset - 1)}
                aria-label={t.agenda.previousWeek}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 dark:border-white/10 text-ink/70 dark:text-white/70 hover:border-black/15 dark:hover:border-white/20 transition-colors"
              >
                <ChevronLeft size={16} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                title={t.agenda.backToThisWeek}
                aria-live="polite"
                className="min-h-[40px] flex-1 sm:flex-none whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold text-ink/70 dark:text-white/70 border border-black/10 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 transition-colors"
              >
                {mounted ? weekLabel() : '···'}
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset(weekOffset + 1)}
                aria-label={t.agenda.nextWeek}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 dark:border-white/10 text-ink/70 dark:text-white/70 hover:border-black/15 dark:hover:border-white/20 transition-colors"
              >
                <ChevronRight size={16} aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <ClinicalAccessNotice />

        {loading || !mounted ? (
          <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/15 py-16 text-center" aria-busy="true">
            <Loader2 size={20} className="mx-auto animate-spin text-ink/30 dark:text-white/30" aria-hidden />
          </div>
        ) : loadError ? (
          <ErrorState message={t.agenda.loadError} onRetry={retryLoad} />
        ) : (
          <>
            {statusError && (
              <p role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {statusError}
              </p>
            )}
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-3">
                  {ui.page.pendingRequests}
                </p>
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink dark:text-white truncate">
                          {req.patients?.name || ui.common.patientFallback}
                        </p>
                        <p className="text-xs text-ink/60 dark:text-white/50">
                          {new Date(req.scheduled_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                          {' · '}
                          {new Date(req.scheduled_at).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
                          {' · '}
                          {req.session_type === 'video' ? ui.common.videoCall : ui.common.inPerson}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateStatus(req.id, 'confirmed')}
                          disabled={locked || updatingId !== null}
                          aria-label={`${t.agenda.confirmRequest}: ${req.patients?.name || ui.common.patientFallback}`}
                          title={t.agenda.confirmRequest}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {updatingId === req.id ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Check size={15} aria-hidden />}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(req.id, 'cancelled')}
                          disabled={locked || updatingId !== null}
                          aria-label={`${t.agenda.declineRequest}: ${req.patients?.name || ui.common.patientFallback}`}
                          title={t.agenda.declineRequest}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <X size={15} aria-hidden />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phones: the 7-column grid needs ~900px and hid most days behind a
                sideways scroll, so small screens get the same week as a list. */}
            <ol className="md:hidden space-y-3" data-testid="agenda-week-list">
              {weekDays.map((d) => {
                const dayAppointments = appointmentsForDay(d)
                const dayLabel = d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
                return (
                  <li
                    key={d.toISOString()}
                    className={`rounded-2xl border bg-white/95 dark:bg-white/[0.03] p-3 ${
                      isToday(d) ? 'border-[#7C83FF]/40' : 'border-black/[0.09] dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 pl-1">
                      <p className={`text-sm font-semibold capitalize ${isToday(d) ? 'text-[#7C83FF]' : 'text-ink dark:text-white'}`}>
                        {dayLabel}
                        {isToday(d) && (
                          <span className="ml-2 rounded-full bg-[#7C83FF]/15 px-2 py-0.5 text-[11px] font-semibold normal-case">{ui.common.today}</span>
                        )}
                      </p>
                      {!locked && (
                        <button
                          type="button"
                          onClick={() => openAddModal(d, DEFAULT_SLOT)}
                          aria-label={t.agenda.addOnDay.replace('{day}', dayLabel)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/60 dark:text-white/60 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
                        >
                          <Plus size={16} aria-hidden />
                        </button>
                      )}
                    </div>
                    {dayAppointments.length === 0 ? (
                      <p className="pl-1 pb-1 text-xs text-ink/50 dark:text-white/40">{t.agenda.noAppointmentsDay}</p>
                    ) : (
                      <ul className="mt-1 space-y-1.5">
                        {dayAppointments.map((a) => (
                          <li key={a.id}>
                            <button
                              type="button"
                              onClick={() => openDetails(a)}
                              className="flex w-full min-h-[48px] items-center gap-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] px-3 py-2 text-left hover:border-black/15 dark:hover:border-white/20 transition-colors"
                            >
                              <span
                                className="h-8 w-1 shrink-0 rounded-full"
                                style={{ background: a.session_type === 'video' ? '#7C83FF' : '#94A3B8' }}
                                aria-hidden
                              />
                              <span className="w-12 shrink-0 text-sm font-bold tabular-nums text-ink dark:text-white">
                                {new Date(a.scheduled_at).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-ink dark:text-white">
                                  {a.patients?.name || ui.common.patientFallback}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-ink/60 dark:text-white/50">
                                  {a.session_type === 'video' ? <Video size={12} aria-hidden /> : <MapPin size={12} aria-hidden />}
                                  {a.session_type === 'video' ? ui.common.videoCall : ui.common.inPerson}
                                  {' · '}
                                  {a.duration_minutes}′
                                </span>
                              </span>
                              <ChevronRight size={16} className="shrink-0 text-ink/30 dark:text-white/30" aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ol>

            <div className="hidden md:block rounded-[24px] border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <div style={{ minWidth: 900 }}>
                  <div className="flex border-b border-black/[0.09] dark:border-white/10">
                    <div className="w-16 shrink-0" />
                    {weekDays.map((d) => (
                      <div
                        key={d.toISOString()}
                        className={`flex-1 text-center py-3 border-l border-black/[0.09] dark:border-white/10 ${
                          isToday(d) ? 'bg-[#7C83FF]/5' : ''
                        }`}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/60 dark:text-white/50">
                          {d.toLocaleDateString(locale, { weekday: 'short' })}
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            isToday(d) ? 'text-[#7C83FF]' : 'text-ink dark:text-white'
                          }`}
                        >
                          {d.getDate()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex relative" style={{ height: TOTAL_ROWS * ROW_HEIGHT }}>
                    <div className="w-16 shrink-0 relative">
                      {SLOTS.map((slot, i) =>
                        slot.isHour ? (
                          <div
                            key={i}
                            className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-ink/45 dark:text-white/40"
                            style={{ top: i * ROW_HEIGHT }}
                          >
                            {slot.display}
                          </div>
                        ) : null
                      )}
                    </div>

                    {weekDays.map((d) => {
                      const dayAppointments = appointmentsForDay(d)
                      return (
                        <div
                          key={d.toISOString()}
                          onClick={(e) => handleColumnClick(d, e)}
                          className={`flex-1 relative border-l border-black/[0.09] dark:border-white/10 cursor-pointer group/col ${
                            isToday(d) ? 'bg-[#7C83FF]/[0.03]' : ''
                          }`}
                        >
                          {SLOTS.map((_, i) => (
                            <div
                              key={i}
                              className="absolute left-0 right-0 border-t border-black/[0.05] dark:border-white/[0.05] group-hover/col:bg-[#7C83FF]/[0.02]"
                              style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                            />
                          ))}

                          {dayAppointments.map((a) => {
                            const start = new Date(a.scheduled_at)
                            const minutesFromStart = (start.getHours() - START_HOUR) * 60 + start.getMinutes()
                            const top = (minutesFromStart / 30) * ROW_HEIGHT
                            const height = Math.max((a.duration_minutes / 30) * ROW_HEIGHT - 3, 22)

                            if (minutesFromStart < 0 || minutesFromStart >= TOTAL_ROWS * 30) return null

                            return (
                              <button
                                key={a.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openDetails(a)
                                }}
                                className="absolute left-1 right-1 rounded-lg px-2 py-1 text-left overflow-hidden text-white shadow-soft hover:shadow-md hover:scale-[1.02] transition-all z-10"
                                style={{
                                  top,
                                  height,
                                  background:
                                    a.session_type === 'video'
                                      ? 'linear-gradient(135deg, #7C83FF 0%, #8B5CF6 100%)'
                                      : 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
                                }}
                              >
                                <p className="text-[11px] font-bold leading-tight truncate">
                                  {start.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
                                </p>
                                <p className="text-[11px] leading-tight truncate opacity-95">
                                  {a.patients?.name || ui.common.patientFallback}
                                </p>
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #7C83FF 0%, #8B5CF6 100%)' }}
                />
                <span className="text-xs text-ink/60 dark:text-white/50">{ui.common.videoCall}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)' }}
                />
                <span className="text-xs text-ink/60 dark:text-white/50">{ui.common.inPerson}</span>
              </div>
              {!locked && <span className="hidden md:inline text-xs text-ink/50 dark:text-white/40">{ui.page.legendHint}</span>}
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {showAddModal && addDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-appointment-title"
              className="w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[24px] border border-black/[0.09] dark:border-white/10 bg-white dark:bg-[#12131a] shadow-2xl p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7C83FF] mb-1">
                {ui.modal.newAppointmentEyebrow}
              </p>
              <p id="new-appointment-title" className="text-sm font-bold text-ink dark:text-white mb-4">
                {addDay.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>

              <div className="mb-4">
                <label htmlFor="appt-time" className="text-xs font-medium text-ink/60 dark:text-white/50 mb-1.5 block">
                  {ui.modal.timeLabel}
                </label>
                <select
                  id="appt-time"
                  value={addSlotIndex}
                  onChange={(e) => setAddSlotIndex(Number(e.target.value))}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.03] px-3 py-2.5 text-sm outline-none focus:border-[#7C83FF] text-ink dark:text-white"
                >
                  {SLOTS.map((slot, i) => (
                    <option key={i} value={i}>
                      {slot.display}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium text-ink/60 dark:text-white/50 mb-1.5 block">
                  {ui.modal.patientLabel}
                </label>
                {selectedPatient ? (
                  <div className="flex items-center gap-2 rounded-xl border border-[#7C83FF]/30 bg-[#7C83FF]/5 px-3 py-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7C83FF]/15 text-[#7C83FF]">
                      <User size={12} />
                    </span>
                    <span className="text-sm font-medium text-ink dark:text-white flex-1 truncate">
                      {selectedPatient.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      aria-label={t.agenda.removePatient}
                      className="-my-2 -mr-2 flex h-10 w-10 items-center justify-center rounded-full text-ink/40 dark:text-white/40 hover:text-red-500 transition-colors"
                    >
                      <X size={14} aria-hidden />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30" />
                    <input
                      autoFocus
                      type="text"
                      aria-label={ui.modal.patientLabel}
                      value={patientQuery}
                      onChange={(e) => searchPatients(e.target.value)}
                      placeholder={ui.modal.searchPlaceholder}
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.03] pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#7C83FF] text-ink dark:text-white"
                    />
                    {searchingPatients && (
                      <p className="text-[11px] text-ink/55 dark:text-white/40 mt-1.5">{ui.modal.searching}</p>
                    )}
                    {!searchingPatients && searchError && (
                      <p role="alert" className="text-xs text-red-500 mt-1.5">{t.agenda.searchError}</p>
                    )}
                    {!searchingPatients && !searchError && patientQuery && patientResults.length === 0 && (
                      <p className="text-[11px] text-ink/55 dark:text-white/40 mt-1.5">{ui.modal.noPatientsFound}</p>
                    )}
                    {patientResults.length > 0 && (
                      <div className="mt-1.5 space-y-0.5 max-h-40 overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 p-1">
                        {patientResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(p)
                              setPatientResults([])
                            }}
                            className="w-full flex min-h-[40px] items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#7C83FF]/10 transition-colors"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7C83FF]/15 text-[#7C83FF]">
                              <User size={12} />
                            </span>
                            <span className="text-sm font-medium text-ink dark:text-white truncate">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                  type="button"
                  aria-pressed={addSessionType === 'video'}
                  onClick={() => setAddSessionType('video')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                    addSessionType === 'video'
                      ? 'border-[#7C83FF] text-[#7C83FF] bg-[#7C83FF]/10'
                      : 'border-black/10 dark:border-white/10 text-ink/60 dark:text-white/50'
                  }`}
                >
                  <Video size={14} />
                  {ui.common.video}
                </button>
                <button
                  type="button"
                  aria-pressed={addSessionType === 'in_person'}
                  onClick={() => setAddSessionType('in_person')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                    addSessionType === 'in_person'
                      ? 'border-[#7C83FF] text-[#7C83FF] bg-[#7C83FF]/10'
                      : 'border-black/10 dark:border-white/10 text-ink/60 dark:text-white/50'
                  }`}
                >
                  <MapPin size={14} />
                  {ui.common.inPersonShort}
                </button>
              </div>

              <div className="mb-4">
                <label htmlFor="appt-note" className="text-xs font-medium text-ink/60 dark:text-white/50 mb-1.5 block">
                  {ui.modal.noteLabel}
                </label>
                <textarea
                  id="appt-note"
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  rows={2}
                  placeholder={ui.modal.notePlaceholder}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.03] px-3 py-2.5 text-sm outline-none focus:border-[#7C83FF] text-ink dark:text-white resize-none"
                />
              </div>

              {addError && <p role="alert" className="text-xs text-red-500 mb-3 text-center">{addError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-full py-2.5 text-sm font-semibold text-ink/60 dark:text-white/60 border border-black/10 dark:border-white/10"
                >
                  {ui.common.cancel}
                </button>
                <button
                  onClick={handleConfirmAdd}
                  disabled={!selectedPatient || addSaving}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 disabled:opacity-50 transition-transform"
                >
                  {addSaving && <Loader2 size={14} className="animate-spin" />}
                  {ui.common.confirm}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={closeDetails}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="appointment-details-title"
              className="w-full max-w-sm rounded-[24px] border border-black/[0.09] dark:border-white/10 bg-white dark:bg-[#12131a] shadow-2xl p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7C83FF] mb-1">
                {ui.cancelFlow.detailsEyebrow}
              </p>
              <p id="appointment-details-title" className="text-sm font-bold text-ink dark:text-white">
                {selected.patients?.name || ui.common.patientFallback}
              </p>
              <div className="mt-2 mb-5 space-y-1.5 text-sm text-ink/60 dark:text-white/60">
                <p className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {new Date(selected.scheduled_at).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock size={13} />
                  {new Date(selected.scheduled_at).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
                </p>
                <p className="flex items-center gap-1.5">
                  {selected.session_type === 'video' ? <Video size={13} /> : <MapPin size={13} />}
                  {selected.session_type === 'video' ? ui.common.videoCall : ui.common.inPerson}
                </p>
              </div>

              {confirmingCancel ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                  <p className="text-sm font-semibold text-ink dark:text-white">{ui.cancelFlow.confirmQuestion}</p>
                  <p className="text-xs text-ink/60 dark:text-white/50 mt-1 mb-3">{ui.cancelFlow.confirmDetail}</p>
                  {cancelError && <p role="alert" className="text-xs text-red-500 mb-3">{cancelError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmingCancel(false)}
                      disabled={cancelling}
                      className="flex-1 rounded-full py-2.5 text-sm font-semibold text-ink/60 dark:text-white/60 border border-black/10 dark:border-white/10 disabled:opacity-50"
                    >
                      {ui.cancelFlow.keep}
                    </button>
                    <button
                      onClick={handleCancelSelected}
                      disabled={cancelling || locked}
                      className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {cancelling && <Loader2 size={14} className="animate-spin" />}
                      {ui.cancelFlow.confirmYes}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/patients/${selected.patient_id}`)}
                    className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 transition-transform"
                  >
                    <User size={14} />
                    {ui.cancelFlow.openPatient}
                  </button>
                  {!locked && (
                    <button
                      onClick={() => setConfirmingCancel(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/5 transition-colors"
                    >
                      <CalendarX size={14} />
                      {ui.cancelFlow.cancelAppointment}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
