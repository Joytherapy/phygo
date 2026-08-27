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
} from 'lucide-react'
import Navbar from '@/components/Navbar'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

const SLOTS = Array.from({ length: TOTAL_ROWS }, (_, i) => {
  const totalMinutes = START_HOUR * 60 + i * 30
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return {
    hour,
    minute,
    isHour: minute === 0,
    display: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: minute === 0 ? undefined : '2-digit' }),
  }
})

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
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
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
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({})
  useEffect(() => {
    setMounted(true)
  }, [])

  const loadAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, patient_id, scheduled_at, duration_minutes, session_type, status, patients(name)')
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: true })

    if (!error) {
      setAppointments((data as any) || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    await supabase.from('appointments').update({ status }).eq('id', id)
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
    const startStr = start.toLocaleDateString(undefined, { day: 'numeric', month: sameMonth ? undefined : 'short' })
    const endStr = end.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    return `${startStr} – ${endStr}`
  }

  const openAddModal = (day: Date, slotIndex: number) => {
    setAddDay(day)
    setAddSlotIndex(slotIndex)
    setAddSessionType('video')
    setPatientQuery('')
    setPatientResults([])
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
    const { data } = await supabase
      .from('patients')
      .select('id, name')
      .ilike('name', `%${text.trim()}%`)
      .limit(6)
    setPatientResults(data || [])
    setSearchingPatients(false)
  }

  const handleConfirmAdd = async () => {
    if (!selectedPatient || !addDay) return
    setAddSaving(true)
    setAddError(null)

    const slot = SLOTS[addSlotIndex]
    const scheduledAt = new Date(addDay)
    scheduledAt.setHours(slot.hour, slot.minute, 0, 0)

    const { data: { user } } = await supabase.auth.getUser()

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
      setAddError('Could not save the appointment. Please try again.')
    }
    setAddSaving(false)
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{ background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)' }}
      />

      <div className="relative max-w-6xl mx-auto pt-40 pb-24 px-6">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to patients
        </motion.button>

        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4F7CFF] mb-2">
              Your schedule
            </p>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white">
              Schedule
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openAddModal(weekDays[0], 4)}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(79,124,255,0.35)] transition-transform hover:scale-[1.03]"
              style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
            >
              <Plus size={14} />
              New appointment
            </button>
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 dark:border-white/10 text-ink/60 dark:text-white/60 hover:border-[#4F7CFF]/40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-full px-4 py-2 text-xs font-semibold text-ink/60 dark:text-white/60 border border-black/10 dark:border-white/10 hover:border-[#4F7CFF]/40 transition-colors"
            >
              {mounted ? weekLabel() : '···'}
            </button>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 dark:border-white/10 text-ink/60 dark:text-white/60 hover:border-[#4F7CFF]/40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {loading || !mounted ? (
          <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/15 py-16 text-center">
            <Loader2 size={20} className="mx-auto animate-spin text-ink/30 dark:text-white/30" />
          </div>
        ) : (
          <>
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-3">
                  Pending requests
                </p>
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink dark:text-white truncate">
                          {req.patients?.name || 'Patient'}
                        </p>
                        <p className="text-xs text-ink/50 dark:text-white/50">
                          {new Date(req.scheduled_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} at{' '}
                          {new Date(req.scheduled_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          {' · '}
                          {req.session_type === 'video' ? 'Video call' : 'In person'}
                        </p>
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
              </div>
            )}

            <div className="rounded-[24px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <div style={{ minWidth: 900 }}>
                  <div className="flex border-b border-black/[0.06] dark:border-white/10">
                    <div className="w-16 shrink-0" />
                    {weekDays.map((d) => (
                      <div
                        key={d.toISOString()}
                        className={`flex-1 text-center py-3 border-l border-black/[0.06] dark:border-white/10 ${
                          isToday(d) ? 'bg-[#4F7CFF]/5' : ''
                        }`}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">
                          {d.toLocaleDateString(undefined, { weekday: 'short' })}
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            isToday(d) ? 'text-[#4F7CFF]' : 'text-ink dark:text-white'
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
                            className="absolute right-2 -translate-y-1/2 text-[10px] font-medium text-ink/30 dark:text-white/30"
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
                          className={`flex-1 relative border-l border-black/[0.06] dark:border-white/10 cursor-pointer group/col ${
                            isToday(d) ? 'bg-[#4F7CFF]/[0.03]' : ''
                          }`}
                        >
                          {SLOTS.map((_, i) => (
                            <div
                              key={i}
                              className="absolute left-0 right-0 border-t border-black/[0.03] dark:border-white/[0.05] group-hover/col:bg-[#4F7CFF]/[0.02]"
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
                                  router.push(`/dashboard/patients/${a.patient_id}`)
                                }}
                                className="absolute left-1 right-1 rounded-lg px-2 py-1 text-left overflow-hidden text-white shadow-sm hover:shadow-md hover:scale-[1.02] transition-all z-10"
                                style={{
                                  top,
                                  height,
                                  background:
                                    a.session_type === 'video'
                                      ? 'linear-gradient(135deg, #4F7CFF 0%, #6E8FFF 100%)'
                                      : 'linear-gradient(135deg, #32D6A0 0%, #22B888 100%)',
                                }}
                              >
                                <p className="text-[11px] font-bold leading-tight truncate">
                                  {start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                </p>
                                <p className="text-[11px] leading-tight truncate opacity-95">
                                  {a.patients?.name || 'Patient'}
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

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #4F7CFF 0%, #6E8FFF 100%)' }}
                />
                <span className="text-xs text-ink/50 dark:text-white/50">Video call</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #32D6A0 0%, #22B888 100%)' }}
                />
                <span className="text-xs text-ink/50 dark:text-white/50">In person</span>
              </div>
              <span className="text-xs text-ink/30 dark:text-white/30">· Click an empty slot to add an appointment</span>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && addDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-[24px] border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#12131a] shadow-2xl p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4F7CFF] mb-1">
                New appointment
              </p>
              <p className="text-sm font-bold text-ink dark:text-white mb-4">
                {addDay.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>

              <div className="mb-4">
                <label className="text-xs font-medium text-ink/50 dark:text-white/50 mb-1.5 block">
                  Time
                </label>
                <select
                  value={addSlotIndex}
                  onChange={(e) => setAddSlotIndex(Number(e.target.value))}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] px-3 py-2.5 text-sm outline-none focus:border-[#4F7CFF] text-ink dark:text-white"
                >
                  {SLOTS.map((slot, i) => (
                    <option key={i} value={i}>
                      {slot.display}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium text-ink/50 dark:text-white/50 mb-1.5 block">
                  Patient
                </label>
                {selectedPatient ? (
                  <div className="flex items-center gap-2 rounded-xl border border-[#4F7CFF]/30 bg-[#4F7CFF]/5 px-3 py-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4F7CFF]/15 text-[#4F7CFF]">
                      <User size={12} />
                    </span>
                    <span className="text-sm font-medium text-ink dark:text-white flex-1 truncate">
                      {selectedPatient.name}
                    </span>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="text-ink/30 dark:text-white/30 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30" />
                    <input
                      autoFocus
                      type="text"
                      value={patientQuery}
                      onChange={(e) => searchPatients(e.target.value)}
                      placeholder="Search patient..."
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#4F7CFF] text-ink dark:text-white"
                    />
                    {searchingPatients && (
                      <p className="text-[11px] text-ink/40 dark:text-white/40 mt-1.5">Searching...</p>
                    )}
                    {!searchingPatients && patientQuery && patientResults.length === 0 && (
                      <p className="text-[11px] text-ink/40 dark:text-white/40 mt-1.5">No patients found.</p>
                    )}
                    {patientResults.length > 0 && (
                      <div className="mt-1.5 space-y-0.5 max-h-40 overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 p-1">
                        {patientResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSelectedPatient(p)
                              setPatientResults([])
                            }}
                            className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#4F7CFF]/10 transition-colors"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4F7CFF]/15 text-[#4F7CFF]">
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
                  onClick={() => setAddSessionType('video')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                    addSessionType === 'video'
                      ? 'border-[#4F7CFF] text-[#4F7CFF] bg-[#4F7CFF]/10'
                      : 'border-black/10 dark:border-white/10 text-ink/50 dark:text-white/50'
                  }`}
                >
                  <Video size={14} />
                  Video
                </button>
                <button
                  onClick={() => setAddSessionType('in_person')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                    addSessionType === 'in_person'
                      ? 'border-[#4F7CFF] text-[#4F7CFF] bg-[#4F7CFF]/10'
                      : 'border-black/10 dark:border-white/10 text-ink/50 dark:text-white/50'
                  }`}
                >
                  <MapPin size={14} />
                  In Person
                </button>
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium text-ink/50 dark:text-white/50 mb-1.5 block">
                  Note (optional)
                </label>
                <textarea
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  rows={2}
                  placeholder="Anything to remember about this session..."
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] px-3 py-2.5 text-sm outline-none focus:border-[#4F7CFF] text-ink dark:text-white resize-none"
                />
              </div>

              {addError && <p className="text-xs text-red-500 mb-3 text-center">{addError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-full py-2.5 text-sm font-semibold text-ink/60 dark:text-white/60 border border-black/10 dark:border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAdd}
                  disabled={!selectedPatient || addSaving}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-transform hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
                >
                  {addSaving && <Loader2 size={14} className="animate-spin" />}
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}