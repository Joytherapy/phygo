'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Plus, FileText } from 'lucide-react'
import Navbar from '@/components/Navbar'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Patient = {
  id: string
  name: string
  age: number | null
  main_condition: string | null
  created_at: string
}

type Note = {
  id: string
  assessment: string | null
  plan: string | null
  created_at: string
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      setPatient(patientData)

      const { data: notesData } = await supabase
        .from('notes')
        .select('id, assessment, plan, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      setNotes(notesData || [])
      setLoading(false)
    }

    load()
  }, [patientId])

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

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto pt-40 pb-20 px-6">
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
          className="flex items-start justify-between mb-10"
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' }}
            >
              <User size={24} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-white">
                {patient.name}
              </h1>
              <p className="text-sm text-ink/40 dark:text-white/40 mt-1">
                {patient.age ? `${patient.age} years old` : ''}
                {patient.age && patient.main_condition ? ' · ' : ''}
                {patient.main_condition || ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push(`/dashboard/patients/${patientId}/session`)}
            className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
          >
            <Plus size={16} />
            Generate new note
          </button>
        </motion.div>

        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4F7CFF] mb-4">
            Note history
          </p>

          {notes.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-black/10 dark:border-white/15 py-16 text-center">
              <p className="text-ink/40 dark:text-white/40">
                No notes yet for this patient.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 flex items-start gap-4 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF]">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-ink/40 dark:text-white/40 mb-1">
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-ink/70 dark:text-white/70 line-clamp-2">
                      {note.assessment || 'No assessment recorded.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
