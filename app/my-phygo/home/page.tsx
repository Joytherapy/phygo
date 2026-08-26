'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { FileText, Calendar, Video, Dumbbell, ClipboardList } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type PatientRecord = {
  id: string
  name: string
  main_condition: string | null
}

type NoteRecord = {
  id: string
  assessment: string | null
  plan: string | null
  exercises: any
  summary_for_patient: string | null
  created_at: string
}

export default function MyPhygoHomePage() {
  const router = useRouter()
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [notes, setNotes] = useState<NoteRecord[]>([])
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
        .select('id, name, main_condition')
        .eq('patient_user_id', user.id)
        .single()

      if (!patientData) {
        setNoAccount(true)
        setLoading(false)
        return
      }

      setPatient(patientData)

      const { data: notesData } = await supabase
        .from('notes')
        .select('id, assessment, plan, exercises, summary_for_patient, created_at')
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false })

      setNotes(notesData || [])
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="relative pt-40 text-center text-ink/40 dark:text-white/40">Loading...</div>
    )
  }

  if (noAccount || !patient) {
    return (
      <div className="relative max-w-sm mx-auto pt-40 pb-20 px-6 text-center">
        <p className="text-sm text-ink/50 dark:text-white/50">
          Your account isn't linked to a patient record yet. Please contact your physiotherapist.
        </p>
      </div>
    )
  }

  const latestNote = notes[0]
  const exercises: any[] = Array.isArray(latestNote?.exercises) ? latestNote.exercises : []

  return (
    <div className="relative max-w-2xl mx-auto pt-40 pb-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4F7CFF] mb-2">
          Welcome back
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white">
          {patient.name}
        </h1>
        {patient.main_condition && (
          <p className="text-sm text-ink/50 dark:text-white/50 mt-2">{patient.main_condition}</p>
        )}
      </motion.div>

      <button
        disabled
        className="w-full mb-8 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-black/10 dark:border-white/15 py-4 text-sm font-semibold text-ink/40 dark:text-white/40"
      >
        <Video size={16} />
        Video call with your physio — coming soon
      </button>

      {!latestNote ? (
        <div className="rounded-[28px] border border-dashed border-black/10 dark:border-white/15 py-16 text-center">
          <p className="text-ink/40 dark:text-white/40">
            Your physiotherapist hasn't added anything yet.
          </p>
        </div>
      ) : (
        <>
          {latestNote.summary_for_patient && (
            <div className="mb-6 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-[#4F7CFF]" />
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50">
                  From your last session
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
                <Dumbbell size={14} className="text-[#32D6A0]" />
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50">
                  Your exercises
                </p>
              </div>
              <div className="grid gap-3">
                {exercises.map((ex: any, i: number) => (
                  <div
                    key={ex.internal_id || i}
                    className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4"
                  >
                    <p className="text-sm font-semibold text-ink dark:text-white">
                      {ex.name || `Exercise ${i + 1}`}
                    </p>
                    {(ex.dosing?.sets || ex.dosing?.reps) && (
                      <p className="text-xs text-ink/50 dark:text-white/50 mt-1">
                        {ex.dosing?.sets && `${ex.dosing.sets} sets`}
                        {ex.dosing?.sets && ex.dosing?.reps && ' × '}
                        {ex.dosing?.reps && `${ex.dosing.reps} reps`}
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
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50">
                Session history
              </p>
            </div>
            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4 flex items-center gap-3"
                >
                  <Calendar size={14} className="text-ink/30 dark:text-white/30 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-ink/40 dark:text-white/40">
                      {new Date(note.created_at).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-ink/70 dark:text-white/70 truncate">
                      {note.assessment || 'Session recorded'}
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