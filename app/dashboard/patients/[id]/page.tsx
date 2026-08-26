'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, FileText, Calendar, Activity, Stethoscope, ClipboardList, Smartphone, Copy, Check } from 'lucide-react'
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
  gender: string | null
  created_at: string
  patient_user_id: string | null
}

const avatarGradient = (gender: string | null) => {
  if (gender === 'male') return 'linear-gradient(135deg, #4F7CFF 0%, #6E8FFF 100%)'
  if (gender === 'female') return 'linear-gradient(135deg, #F472B6 0%, #C084FC 100%)'
  return 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
}


type Note = {
  id: string
  assessment: string | null
  plan: string | null
  created_at: string
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const formatSince = (dateStr: string) => {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days < 1) return 'Today'
  if (days === 1) return '1 day'
  if (days < 30) return `${days} days`
  const months = Math.floor(days / 30)
  if (months === 1) return '1 month'
  if (months < 12) return `${months} months`
  const years = Math.floor(months / 12)
  return years === 1 ? '1 year' : `${years} years`
}

const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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

  const handleInvite = async () => {
    setInviteLoading(true)
    setInviteError(null)
    const code = generateInviteCode()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('patient_invites').insert({
      patient_id: patientId,
      code,
      created_by: user?.id,
      expires_at: expiresAt,
    })

    if (!error) {
      setInviteLink(`${window.location.origin}/my-phygo/join/${code}`)
    } else {
      console.error('Errore creazione invito:', error)
      setInviteError('Could not create invite. Please try again.')
    }
    setInviteLoading(false)
  }

  const copyInviteLink = async () => {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

  const lastSessionDate = notes.length > 0 ? new Date(notes[0].created_at) : null

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6)0%, rgba(50,214,160,0.5) 100%)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
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
          className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white text-lg font-bold shadow-[0_8px_24px_rgba(79,124,255,0.35)]"
              style={{ background: avatarGradient(patient.gender) }}
            >
              {getInitials(patient.name)}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-white">
                {patient.name}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {patient.age && (
                  <span className="text-sm text-ink/40 dark:text-white/40">
                    {patient.age} years old
                  </span>
                )}
                {patient.main_condition && (
                  <span className="inline-flex items-center gap-1.5rounded-full bg-[#4F7CFF]/10 px-3 py-1 text-xs font-semibold text-[#4F7CFF]">
                    <Stethoscope size={11} />
                    {patient.main_condition}
                  </span>
                )}
                {patient.patient_user_id && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Smartphone size={11} />
                    Portal active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard/agenda')}
                className="flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-ink/70 dark:text-white/70 border border-black/10 dark:border-white/10 hover:border-[#4F7CFF]/40 transition-colors"
              >
                <Calendar size={16} />
                Schedule
              </button>
              <button
                onClick={() => router.push(`/dashboard/patients/${patientId}/session`)}
                className="flex-1 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105"
                style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
              >
                <Plus size={16} />
                Generate new note
              </button>
            </div>

            {!patient.patient_user_id && (
              <button
                onClick={handleInvite}
                disabled={inviteLoading}
                className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold border border-black/10 dark:border-white/10 text-ink/70 dark:text-white/70 hover:border-[#4F7CFF]/40 hover:text-[#4F7CFF] transition-colors disabled:opacity-60"
              >
                <Smartphone size={16} />
                {inviteLoading ? 'Generating...' : 'Invite to Portal'}
              </button>
            )}
          </div>
        </motion.div>

        {inviteLink && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-[#4F7CFF]/20 bg-[#4F7CFF]/5 p-5"
          >
            <p className="text-sm font-semibold text-ink dark:text-white mb-1">
              Invite link ready — valid for 7 days
            </p>
            <p className="text-xs text-ink/50 dark:text-white/50 mb-3">
              Share this with {patient.name} so they can access their My Phygo portal.
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 outline-none text-ink/70 dark:text-white/70"
              />
              <button
                onClick={copyInviteLink}
                className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors"
                style={{ background: copied ? '#32D6A0' : '#4F7CFF' }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </motion.div>
        )}

        {inviteError && (
          <p className="mb-8 text-xs text-red-500">{inviteError}</p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-10"
        >
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <ClipboardList size={13} className="text-[#4F7CFF]" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">
                Sessions
              </span>
            </div>
            <p className="text-2xl font-bold text-ink dark:text-white">{notes.length}</p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar size={13} className="text-[#32D6A0]" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">
                Last session
              </span>
            </div>
            <p className="text-2xl font-bold text-ink dark:text-white">
              {lastSessionDate ? lastSessionDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—'}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Activity size={13} className="text-amber-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">
                Patient since
              </span>
            </div>
            <p className="text-2xl font-bold text-ink dark:text-white">{formatSince(patient.created_at)}</p>
          </div>
        </motion.div>

        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4F7CFF] mb-4">
            Note history
          </p>

          {notes.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-black/10 dark:border-white/15 py-16 text-center flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF]">
                <FileText size={20} />
              </div>
              <p className="text-ink/40 dark:text-white/40">
                No notes yet for this patient.
              </p>
              <p className="text-xs text-ink/30 dark:text-white/30">
                Generate the first session note to start their history.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="rounded-2xl border border-black/[0.06]dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 flex items-start gap-4 shadow-sm hover:border-[#4F7CFF]/30 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF]">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-ink/40 dark:text-white/40 mb-1">
                      {new Date(note.created_at).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-ink/70 dark:text-white/70 line-clamp-2">
                      {note.assessment || 'No assessment recorded.'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}