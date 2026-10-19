'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { ArrowLeft, Video } from 'lucide-react'
import Navbar from '@/components/Navbar'
import LiveStructuring from '@/components/liveStructuring/LiveStructuring'
import { usePatientContext } from '@/contexts/PatientContext'
import ClinicalAccessNotice from '@/components/ClinicalAccessNotice'
import { useClinicalLocked } from '@/lib/useClinicalAccess'
import AppointmentScheduler from '@/components/AppointmentScheduler'
import { useUiStrings } from '@/contexts/LanguageContext'
import { useDashboardUi } from '@/lib/i18n/dashboardStrings'
import ErrorState from '@/components/workspace/ErrorState'
import { lazy } from '@/lib/lazy'
import { PageBackdrop, PAGE_BG, SECONDARY_BTN, CHIP } from '@/components/ui/premium'
import { useHomeUi } from '@/lib/i18n/homeStrings'
import { Card } from '@/components/dashboard/HomeCards'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

type Patient = {
  id: string
  name: string
  patient_user_id: string | null
}

export default function PatientSessionPage() {
  const ui = useUiStrings()
  const t = useDashboardUi()
  const h = useHomeUi()
  const params = useParams()
  const router = useRouter()
  const locked = useClinicalLocked()
  const patientId = params.id as string

  const { setCurrentPatient } = usePatientContext()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [savedMessage, setSavedMessage] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoadFailed(false)
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, patient_user_id')
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
      <div className={`relative min-h-screen ${PAGE_BG}`}>
        <Navbar />
        <div className="pt-40 text-center text-ink/55 dark:text-white/40">{ui.common.loading}</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className={`relative min-h-screen ${PAGE_BG}`}>
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
    <div className={`relative min-h-screen overflow-hidden transition-colors ${PAGE_BG}`}>
      <Navbar />
      <PageBackdrop />

      <main id="main-content" className="relative max-w-4xl mx-auto pt-28 sm:pt-36 pb-20 px-4 sm:px-6">
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

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${CHIP}`}>
              {ui.patients.sessionNoteTab}
            </p>
            <h1 className="mt-3 break-words font-display text-3xl font-semibold tracking-[-0.03em] text-ink dark:text-white sm:text-4xl">{patient.name}</h1>
          </div>
          {patient.patient_user_id && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/patients/${patientId}/call`)}
              disabled={locked}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${SECONDARY_BTN}`}
            >
              <Video size={16} aria-hidden />
              {h.startVideoCall}
            </button>
          )}
        </div>

        <ClinicalAccessNotice />

        {savedMessage && (
          <div role="status" className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            {ui.patients.noteSavedMessage.replace('{name}', patient.name)}
          </div>
        )}

        {!locked && (
          <Card className="mb-6 p-4 sm:p-6">
            <AppointmentScheduler patientId={patientId} mode="physio" />
          </Card>
        )}

        <Card className="p-4 sm:p-6">
          <LiveStructuring
            instanceId={`session-${patientId}`}
            variant="full"
            patientId={patientId}
            onSaved={() => setSavedMessage(true)}
          />
        </Card>
      </main>
    </div>
  )
}
