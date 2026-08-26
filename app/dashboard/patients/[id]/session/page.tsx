'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { ArrowLeft, Video } from 'lucide-react'
import Navbar from '@/components/Navbar'
import LiveStructuring from '@/components/liveStructuring/LiveStructuring'
import { usePatientContext } from '@/contexts/PatientContext'
import VideoCallPanel from '@/components/VideoCallPanel'
import AppointmentScheduler from '@/components/AppointmentScheduler'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Patient = {
  id: string
  name: string
}

export default function PatientSessionPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const { setCurrentPatient } = usePatientContext()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'session' | 'video'>('session')
  const [savedMessage, setSavedMessage] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, name')
        .eq('id', patientId)
        .single()

      if (data) {
        setPatient(data)
        setCurrentPatient({ id: data.id, name: data.name })
      }
      setLoading(false)
    }
    load()
  }, [patientId, setCurrentPatient])

  if (loading) {
    return (
      <div className="relative min-h-screen bg-white dark:bg-[#08090b]">
        <Navbar />
        <div className="pt-40 text-center text-ink/40 dark:text-white/40">Loading...</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="relative min-h-screen bg-white dark:bg-[#08090b]">
        <Navbar />
        <div className="pt-40 text-center text-ink/40 dark:text-white/40">Patient not found.</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div className="relative max-w-4xl mx-auto pt-40 pb-20 px-6">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push(`/dashboard/patients/${patientId}`)}
          className="flex items-center gap-1.5 text-sm text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to {patient.name}
        </motion.button>

        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => setTab('session')}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab === 'session'
                ? 'text-white'
                : 'text-ink/50 dark:text-white/50 border border-black/10 dark:border-white/10'
            }`}
            style={tab === 'session' ? { background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' } : undefined}
          >
            Session Note
          </button>
          <button
            onClick={() => setTab('video')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab === 'video'
                ? 'text-white'
                : 'text-ink/50 dark:text-white/50 border border-black/10 dark:border-white/10'
            }`}
            style={tab === 'video' ? { background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' } : undefined}
          >
            <Video size={14} />
            Video Call
          </button>
        </div>

        {savedMessage && (
          <div className="mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
            Note saved to {patient.name}'s record.
          </div>
        )}

        {tab === 'session' && (
          <>
            <AppointmentScheduler patientId={patientId} mode="physio" />

            <div className="flex items-center gap-3 my-8">
              <div className="h-px flex-1 bg-black/[0.06] dark:bg-white/10" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/30 dark:text-white/30">
                Session Note
              </p>
              <div className="h-px flex-1 bg-black/[0.06] dark:bg-white/10" />
            </div>

            <LiveStructuring
              instanceId={`session-${patientId}`}
              variant="full"
              patientId={patientId}
              onSaved={() => setSavedMessage(true)}
            />
          </>
        )}

        {tab === 'video' && (
          <VideoCallPanel patientId={patientId} canStart={true} />
        )}
      </div>
    </div>
  )
}