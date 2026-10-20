'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FileText, Calendar, Dumbbell, ClipboardList, ShoppingBag, ExternalLink, ArrowRight, Flame, Target } from 'lucide-react'
import VideoCallPanel from '@/components/VideoCallPanel'
import AppointmentScheduler from '@/components/AppointmentScheduler'
import { lazy } from '@/lib/lazy'
import { useLanguage } from '@/contexts/LanguageContext'
import { localeForLang } from '@/lib/i18n/agendaStrings'
import { MY_PHYGO_STRINGS } from '@/lib/i18n/myPhygoStrings'
import { MyAvatar, useMyProfile } from '@/components/myPhygo/MyProfileContext'
import ClinicianNotice from '@/components/myPhygo/ClinicianNotice'
import DailyQuest from '@/components/myPhygo/DailyQuest'
const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

type PatientRecord = {
  id: string
  name: string
  age: number | null
  main_condition: string | null
}

// Only what was written for the patient (lib/myPhygo/patientNote.ts): the
// clinician's findings, assessment, plan and reasoning are not sent here.
type NoteRecord = {
  id: string
  exercises: any
  summary_for_patient: string | null
  created_at: string
}

type RecommendedProduct = {
  id: string
  payload: { name: string; amazonUrl: string; price: string } | null
}

export default function MyPhygoHomePage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const t = MY_PHYGO_STRINGS[lang].home
  const tp = MY_PHYGO_STRINGS[lang].profile
  const { profile, photoUrl, isClinician } = useMyProfile()
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [notes, setNotes] = useState<NoteRecord[]>([])
  const [products, setProducts] = useState<RecommendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [noAccount, setNoAccount] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/my-phygo/login')
        return
      }

      const { data: patientData } = await supabase
        .from('patients')
        .select('id, name, age, main_condition')
        .eq('patient_user_id', user.id)
        .single()

      if (!patientData) {
        setNoAccount(true)
        setLoading(false)
        return
      }

      setPatient(patientData)

      const notesRes = await fetch('/api/my-phygo/notes', { cache: 'no-store' }).catch(() => null)
      const notesData = notesRes?.ok ? (await notesRes.json().catch(() => ({}))).notes : null

      setNotes(notesData || [])

      const { data: productsData } = await supabase
        .from('patient_clinical_references')
        .select('id, payload')
        .eq('patient_id', patientData.id)
        .eq('content_type', 'product')
        .order('created_at', { ascending: false })

      setProducts(productsData || [])
      setLoading(false)
    }

    load()
  }, [router])

  if (isClinician) return <ClinicianNotice />

  if (loading || isClinician === null) {
    return (
      <div className="relative pt-40 text-center text-ink/55 dark:text-white/40">{t.loading}</div>
    )
  }

  if (noAccount || !patient) {
    return (
      <div className="relative max-w-sm mx-auto pt-40 pb-20 px-6 text-center">
        <p className="text-sm text-ink/60 dark:text-white/50">
          {t.notLinked}
        </p>
      </div>
    )
  }

  const latestNote = notes[0]
  const displayName = profile?.displayName || patient.name
  const exercises: any[] = Array.isArray(latestNote?.exercises) ? latestNote.exercises : []

  return (
    <div className="relative max-w-2xl mx-auto pt-40 pb-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#6B73F0] dark:text-[#A5B4FF] mb-2">
          {t.welcomeBack}
        </p>
        <div className="flex items-center gap-4">
          <Link href="/my-phygo/profile" aria-label={tp.navLabel} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B95FF]">
            <MyAvatar name={displayName} photoUrl={photoUrl} size={56} />
          </Link>
          <h1 className="min-w-0 break-words font-display text-4xl font-bold tracking-tight text-ink dark:text-white">
            {displayName}
          </h1>
        </div>
        {patient.age && (
          <p className="text-sm text-ink/60 dark:text-white/50 mt-2">{t.yearsOld(patient.age)}</p>
        )}
      </motion.div>

      {profile?.goal && (
        <div data-testid="my-goal" className="mb-8 flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-white/90 p-5 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C83FF] to-[#A78BFA] text-white">
            <Target size={16} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/50 dark:text-white/45">{tp.yourGoal}</p>
            <p className="mt-1 break-words text-[15px] font-medium leading-snug text-ink dark:text-white">{profile.goal}</p>
          </div>
          <Link href="/my-phygo/profile" className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-[#6B73F0] transition-colors hover:bg-[#7C83FF]/10 dark:text-[#A5B4FF]">
            {tp.editGoal}
          </Link>
        </div>
      )}

      <DailyQuest patientId={patient.id} />

      <div className="mb-8">
        <AppointmentScheduler patientId={patient.id} mode="patient" />
      </div>

      <div className="mb-8">
        <VideoCallPanel patientId={patient.id} canStart={false} />
      </div>

      <a
        href="/my-phygo/life/metabolic"
        className="mb-3 flex items-center justify-between rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] p-5 hover:border-black/15 dark:hover:border-white/20 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/75">
            <Flame size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink dark:text-white">{t.metabolicTitle}</p>
            <p className="text-xs text-ink/55 dark:text-white/40">{t.metabolicSubtitle}</p>
          </div>
        </div>
        <ArrowRight size={16} className="text-ink/30 dark:text-white/30 group-hover:translate-x-1 transition-transform" />
      </a>

      <a
        href="/my-phygo/shop"
        className="mb-8 flex items-center justify-between rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] p-5 hover:border-black/15 dark:hover:border-white/20 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/75">
            <ShoppingBag size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink dark:text-white">{t.shopTitle}</p>
            <p className="text-xs text-ink/55 dark:text-white/40">{t.shopSubtitle}</p>
          </div>
        </div>
        <ArrowRight size={16} className="text-ink/30 dark:text-white/30 group-hover:translate-x-1 transition-transform" />
      </a>

      {products.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={14} className="text-[#7C83FF]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/60 dark:text-white/50">
              {t.recommendedForYou}
            </p>
          </div>
          <div className="grid gap-3">
            {products.map((ref) => (
              ref.payload && (
                <a
                  key={ref.id}
                  href={ref.payload.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] p-4 flex items-center gap-3 hover:border-black/15 dark:hover:border-white/20 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/75">
                    <ShoppingBag size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink dark:text-white truncate">
                      {ref.payload.name}
                    </p>
                    <p className="text-xs text-ink/55 dark:text-white/40">{ref.payload.price}</p>
                  </div>
                  <ExternalLink size={14} className="text-ink/30 dark:text-white/30 shrink-0" />
                </a>
              )
            ))}
          </div>
        </div>
      )}

      {!latestNote ? (
        <div className="rounded-[28px] border border-dashed border-black/10 dark:border-white/15 py-16 text-center">
          <p className="text-ink/55 dark:text-white/40">
            {t.nothingYet}
          </p>
        </div>
      ) : (
        <>
          {latestNote.summary_for_patient && (
            <div className="mb-6 rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] p-5">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-[#7C83FF]" />
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/60 dark:text-white/50">
                  {t.fromLastSession}
                </p>
              </div>
              <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                {latestNote.summary_for_patient}
              </p>
            </div>
          )}

          {exercises.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell size={14} className="text-[#7C83FF]" />
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/60 dark:text-white/50">
                  {t.yourExercises}
                </p>
              </div>
              <div className="grid gap-3">
                {exercises.map((ex: any, i: number) => (
                  <div
                    key={ex.internal_id || i}
                    className="rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] p-4"
                  >
                    <p className="text-sm font-semibold text-ink dark:text-white">
                      {ex.name || t.exerciseFallback(i + 1)}
                    </p>
                    {(ex.dosing?.sets || ex.dosing?.reps) && (
                      <p className="text-xs text-ink/60 dark:text-white/50 mt-1">
                        {ex.dosing?.sets && t.sets(ex.dosing.sets)}
                        {ex.dosing?.sets && ex.dosing?.reps && ' × '}
                        {ex.dosing?.reps && t.reps(ex.dosing.reps)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList size={14} className="text-amber-500" />
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/60 dark:text-white/50">
                {t.sessionHistory}
              </p>
            </div>
            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] p-4 flex items-center gap-3"
                >
                  <Calendar size={14} className="text-ink/30 dark:text-white/30 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-ink/55 dark:text-white/40">
                      {new Date(note.created_at).toLocaleDateString(localeForLang(lang), {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-ink/70 dark:text-white/70 truncate">
                      {note.summary_for_patient || t.sessionRecorded}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}