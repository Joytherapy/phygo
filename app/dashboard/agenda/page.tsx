'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { Calendar, Clock, Video, MapPin, Check, X, Loader2, ArrowLeft } from 'lucide-react'
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

export default function AgendaPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

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

  const now = new Date()
  const pendingRequests = appointments.filter((a) => a.status === 'requested')
  const upcoming = appointments.filter(
    (a) => a.status === 'confirmed' && new Date(a.scheduled_at) >= now
  )

  const groupedByDay: Record<string, Appointment[]> = {}
  upcoming.forEach((a) => {
    const dayKey = new Date(a.scheduled_at).toDateString()
    if (!groupedByDay[dayKey]) groupedByDay[dayKey] = []
    groupedByDay[dayKey].push(a)
  })
  const sortedDayKeys = Object.keys(groupedByDay).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  const formatDayHeader = (dayKey: string) => {
    const d = new Date(dayKey)
    const isToday = d.toDateString() === new Date().toDateString()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = d.toDateString() === tomorrow.toDateString()
    if (isToday) return 'Today'
    if (isTomorrow) return 'Tomorrow'
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{ background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)' }}
      />

      <div className="relative max-w-3xl mx-auto pt-40 pb-24 px-6">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to patients
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4F7CFF] mb-2">
            Your schedule
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white">
            Agenda
          </h1>
        </motion.div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/15 py-16 text-center">
            <Loader2 size={20} className="mx-auto animate-spin text-ink/30 dark:text-white/30" />
          </div>
        ) : (
          <>
            {pendingRequests.length > 0 && (
              <div className="mb-8">
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
                          {new Date(req.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
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

            {sortedDayKeys.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-black/10 dark:border-white/15 py-20 text-center flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF]">
                  <Calendar size={20} />
                </div>
                <p className="text-ink/40 dark:text-white/40">No upcoming appointments.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDayKeys.map((dayKey) => (
                  <div key={dayKey}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">
                      {formatDayHeader(dayKey)}
                    </p>
                    <div className="space-y-2">
                      {groupedByDay[dayKey].map((a) => (
                        <button
                          key={a.id}
                          onClick={() => router.push(`/dashboard/patients/${a.patient_id}`)}
                          className="w-full text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4 flex items-center gap-4 hover:border-[#4F7CFF]/30 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center w-14 shrink-0">
                            <span className="text-sm font-bold text-ink dark:text-white">
                              {new Date(a.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="h-8 w-px bg-black/10 dark:bg-white/10 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-ink dark:text-white truncate">
                              {a.patients?.name || 'Patient'}
                            </p>
                            <p className="text-xs text-ink/40 dark:text-white/40 flex items-center gap-1">
                              {a.session_type === 'video' ? <Video size={11} /> : <MapPin size={11} />}
                              {a.session_type === 'video' ? 'Video call' : 'In person'}
                              {' · '}
                              {a.duration_minutes} min
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}