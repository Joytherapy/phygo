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
import ClinicalAccessNotice from '@/components/ClinicalAccessNotice'
import { useClinicalLocked } from '@/lib/useClinicalAccess'
import AppointmentScheduler from '@/components/AppointmentScheduler'
import { useUiStrings } from '@/contexts/LanguageContext'
import { useDashboardUi } from '@/lib/i18n/dashboardStrings'
import ErrorState from '@/components/workspace/ErrorState'
import { lazy } from '@/lib/lazy'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

type Patient = {
  id: string
  name: string
}

export default function PatientSessionPage() {
  const ui = useUiStrings()
  const t = useDashboardUi()
  const params = useParams()
  const router = useRouter()
  const locked = useClinicalLocked()
  const patientId = params.id as string

  const { setCurrentPatient } = usePatientContext()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [tab, setTab] = useState<'session' | 'video'>('session')
  const [savedMessage, setSavedMessage] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoadFailed(false)
      const { data, error } = await supabase
        .from('patients')
        .select('id, name')
        .eq('id', patientId)
        .single()

      if (data) {
        setPatient(data)
        setCurrentPatient({ id: data.id, name: data.name })
      } else if (error && error.code !== 'PGRST116') {
        // PGRST116 = no such patient (or not yours). Anything else is a failed
        // request and gets Retry instead of a misleading "patient not found".
        console.error('Patient could not be loaded:', error)
        setLoadFailed(true)
      }
      setLoading(false)
    }
    load()
  }, [patientId, setCurrentPatient, reloadKey])

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#f6f7f9] dark:bg-[#08090b]">
        <Navbar />
        <div className="pt-40 text-center text-ink/55 dark:text-white/40">{ui.common.loading}</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="relative min-h-screen bg-[#f6f7f9] dark:bg-[#08090b]">
        <Navbar />
        <main id="main-content" className="max-w-xl mx-auto px-4 pt-40">
          {loadFailed ? (
            <ErrorState
              message={t.home.loadErrorBody}
              onRetry={() => {
                setLoading(true)
                setReloadKey((k) => k + 1)
              }}
            />
          ) : (
            <p className="text-center text-ink/60 dark:text-white/50">{ui.patients.patientNotFound}</p>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#f6f7f9] dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <main id="main-content" className="relative max-w-4xl mx-auto pt-32 sm:pt-40 pb-20 px-4 sm:px-6">
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push(`/dashboard/patients/${patientId}`)}
          className="-ml-2 inline-flex min-h-[40px] max-w-full items-center gap-1.5 rounded-full px-2 text-sm text-ink/60 dark:text-white/50 hover:text-ink dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={15} className="shrink-0" aria-hidden />
          {ui.patients.backToPatientName.replace('{name}', patient.name)}
        </motion.button>

        <div className="flex flex-wrap items-center gap-2 mb-8" role="group">
          <button
            type="button"
            aria-pressed={tab === 'session'}
            onClick={() => setTab('session')}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab === 'session'
                ? 'text-white'
                : 'text-ink/60 dark:text-white/50 border border-black/10 dark:border-white/10'
            }`}
            style={tab === 'session' ? { background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' } : undefined}
          >
            {ui.patients.sessionNoteTab}
          </button>
          <button
            type="button"
            aria-pressed={tab === 'video'}
            onClick={() => setTab('video')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab === 'video'
                ? 'text-white'
                : 'text-ink/60 dark:text-white/50 border border-black/10 dark:border-white/10'
            }`}
            style={tab === 'video' ? { background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' } : undefined}
          >
            <Video size={14} />
            {ui.patients.videoCallTab}
          </button>
        </div>

        <ClinicalAccessNotice />

        {savedMessage && (
          <div role="status" className="mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
            {ui.patients.noteSavedMessage.replace('{name}', patient.name)}
          </div>
        )}

        {tab === 'session' && (
          <>
            {!locked && <AppointmentScheduler patientId={patientId} mode="physio" />}

            <div className="flex items-center gap-3 my-8">
              <div className="h-px flex-1 bg-black/[0.06] dark:bg-white/10" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/30 dark:text-white/30">
                {ui.patients.sessionNoteTab}
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
          <VideoCallPanel patientId={patientId} canStart={!locked} />
        )}
      </main>
    </div>
  )
}