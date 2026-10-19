'use client'

// The video call as its own page: the call takes the stage, and the session
// notes sit beside it so the clinician can dictate or type while talking.
// The call itself (private Daily room, server-issued token, end/close rules)
// is unchanged: it is VideoCallPanel, as before.

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Video, PanelRightOpen, PanelRightClose, Smartphone } from 'lucide-react'
import Navbar from '@/components/Navbar'
import ClinicalAccessNotice from '@/components/ClinicalAccessNotice'
import VideoCallPanel from '@/components/VideoCallPanel'
import LiveStructuring from '@/components/liveStructuring/LiveStructuring'
import ErrorState from '@/components/workspace/ErrorState'
import { Card, Avatar } from '@/components/dashboard/HomeCards'
import { PageBackdrop, PageEyebrow, PAGE_BG, SECONDARY_BTN } from '@/components/ui/premium'
import { usePatientContext } from '@/contexts/PatientContext'
import { useUiStrings } from '@/contexts/LanguageContext'
import { useDashboardUi } from '@/lib/i18n/dashboardStrings'
import { useHomeUi } from '@/lib/i18n/homeStrings'
import { useClinicalLocked } from '@/lib/useClinicalAccess'
import { lazy } from '@/lib/lazy'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

type Patient = { id: string; name: string; patient_user_id: string | null }

export default function PatientCallPage() {
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
  const [showNotes, setShowNotes] = useState(true)
  const [savedMessage, setSavedMessage] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoadFailed(false)
      const { data, error } = await supabase.from('patients').select('id, name, patient_user_id').eq('id', patientId).single()
      if (data) {
        setPatient(data)
        setCurrentPatient({ id: data.id, name: data.name })
      } else if (error && error.code !== 'PGRST116') {
        console.error('Patient could not be loaded:', error)
        setLoadFailed(true)
      }
      setLoading(false)
    }
    load()
  }, [patientId, setCurrentPatient, reloadKey])

  const shell = (children: React.ReactNode) => (
    <div className={`relative min-h-screen overflow-hidden transition-colors ${PAGE_BG}`}>
      <Navbar />
      <PageBackdrop />
      {children}
    </div>
  )

  if (loading) return shell(<div className="relative pt-40 text-center text-ink/55 dark:text-white/40">{ui.common.loading}</div>)

  if (!patient) {
    return shell(
      <main id="main-content" className="relative mx-auto max-w-xl px-4 pt-40">
        {loadFailed ? (
          <ErrorState title={t.home.loadErrorTitle} message={t.home.loadErrorBody} onRetry={() => { setLoading(true); setReloadKey((k) => k + 1) }} />
        ) : (
          <p className="text-center text-ink/55 dark:text-white/40">{ui.patients.patientNotFound}</p>
        )}
      </main>
    )
  }

  const linked = !!patient.patient_user_id

  return shell(
    <main id="main-content" className="relative mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pt-36">
      <button
        type="button"
        onClick={() => router.push(`/dashboard/patients/${patientId}`)}
        className="-ml-2 mb-4 inline-flex min-h-[40px] max-w-full items-center gap-1.5 rounded-full px-2 text-sm text-ink/60 transition-colors hover:text-ink dark:text-white/50 dark:hover:text-white"
      >
        <ArrowLeft size={15} className="shrink-0" aria-hidden />
        {ui.patients.backToPatientName.replace('{name}', patient.name)}
      </button>

      <div className="mb-7 flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={patient.name} linked={linked} size={56} />
          <div className="min-w-0">
            <PageEyebrow icon={Video}>{h.videoCall}</PageEyebrow>
            <h1 className="mt-1.5 break-words font-display text-3xl font-semibold tracking-[-0.035em] text-ink dark:text-white sm:text-[40px] sm:leading-[1.1]">{patient.name}</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowNotes((v) => !v)}
          aria-pressed={showNotes}
          className={`hidden min-h-[44px] items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors lg:inline-flex ${SECONDARY_BTN}`}
        >
          {showNotes ? <PanelRightClose size={16} aria-hidden /> : <PanelRightOpen size={16} aria-hidden />}
          {showNotes ? h.hideNotes : h.showNotes}
        </button>
      </div>

      <ClinicalAccessNotice />

      <div className={`grid items-start gap-4 ${showNotes ? 'lg:grid-cols-[minmax(0,1fr)_420px]' : ''}`}>
        <Card glow className="p-3 sm:p-4" data-testid="call-stage">
          {linked ? (
            <VideoCallPanel patientId={patientId} canStart={!locked} stage stageBadge={h.privateRoom} />
          ) : (
            <div className="flex flex-col items-start gap-4 p-4 sm:p-6" data-testid="call-needs-portal">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-black/[0.06] bg-black/[0.03] text-ink/70 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/80">
                <Smartphone size={20} aria-hidden />
              </span>
              <p className="max-w-md text-sm text-ink/70 dark:text-white/70">{h.videoNeedsPortal}</p>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/patients/${patientId}`)}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-5 text-sm font-semibold ${SECONDARY_BTN}`}
              >
                {h.openRecord}
              </button>
            </div>
          )}
        </Card>

        {showNotes && (
          <Card className="p-5 sm:p-6" data-testid="call-notes">
            <h2 className="font-display text-lg font-semibold tracking-[-0.01em] text-ink dark:text-white">{h.callNotes}</h2>
            <p className="mb-5 mt-1 text-[13px] leading-relaxed text-ink/55 dark:text-white/50">{h.callNotesHint}</p>
            {savedMessage && (
              <p role="status" className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                {ui.patients.noteSavedMessage.replace('{name}', patient.name)}
              </p>
            )}
            {!locked && (
              <LiveStructuring instanceId={`call-${patientId}`} variant="full" compact={showNotes} patientId={patientId} onSaved={() => setSavedMessage(true)} />
            )}
          </Card>
        )}
      </div>
    </main>
  )
}
