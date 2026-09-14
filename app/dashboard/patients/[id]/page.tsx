'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, FileText, Calendar, Activity, Stethoscope, ClipboardList, Smartphone, Copy, Check, RotateCcw, Dumbbell, ClipboardCheck, MapPin, ShoppingBag, X, ChevronRight, Sparkles, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useUiStrings } from '@/contexts/LanguageContext'
import { usePatientContext } from '@/contexts/PatientContext'
import WeightTrendChart from '@/components/WeightTrendChart'
import type { AdaptiveInsightResult } from '@/lib/metabolicCalculator'

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

type MetabolicProfile = {
  id: string
  created_at: string
  weight_kg: number
  tdee: number
  calorie_target: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

// Sostituisce {placeholder} in una stringa i18n — stesso helper gia' usato
// in app/my-phygo/life/metabolic/page.tsx per la card Phygo Adapt.
function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match))
}

type ClinicalReferenceType = 'exercise' | 'clinical_test' | 'questionnaire' | 'condition' | 'anatomical_zone' | 'product' | 'metabolic_profile'

type ClinicalReference = {
  id: string
  content_type: ClinicalReferenceType
  content_id: string
  payload: { label?: string; section?: string; result?: string } | null
  created_at: string
}

const REFERENCE_TYPE_META: Record<ClinicalReferenceType, { icon: typeof Activity; color: string }> = {
  exercise: { icon: Dumbbell, color: '#32D6A0' },
  clinical_test: { icon: ClipboardCheck, color: '#4F7CFF' },
  questionnaire: { icon: ClipboardList, color: '#F59E0B' },
  condition: { icon: Stethoscope, color: '#EC4899' },
  anatomical_zone: { icon: MapPin, color: '#A855F7' },
  product: { icon: ShoppingBag, color: '#6366F1' },
  metabolic_profile: { icon: Flame, color: '#6366F1' },
}

const refTypeLabel = (type: ClinicalReferenceType, ui: ReturnType<typeof useUiStrings>) => {
  const map: Record<ClinicalReferenceType, string> = {
    exercise: ui.patients.refTypeExercise,
    clinical_test: ui.patients.refTypeClinicalTest,
    questionnaire: ui.patients.refTypeQuestionnaire,
    condition: ui.patients.refTypeCondition,
    anatomical_zone: ui.patients.refTypeBodyZone,
    product: ui.patients.refTypeProduct,
    metabolic_profile: ui.patients.refTypeMetabolicProfile,
  }
  return map[type]
}

// Not every reference type can be reliably traced back to its exact source
// item yet: `condition` ids map 1:1 to /library/condition/[idSlug], and
// clinical_test/questionnaire can at least deep-link into the right
// Clinical Toolkit tab (via ?tab=). `exercise`, `anatomical_zone` and
// `product` have no id->slug lookup or per-item detail route today, so they
// stay non-clickable rather than link somewhere wrong.
const getReferenceHref = (ref: ClinicalReference): string | null => {
  switch (ref.content_type) {
    case 'condition':
      return `/library/condition/${ref.content_id}`
    case 'clinical_test':
      return '/dashboard/clinical-tools?tab=functional'
    case 'questionnaire':
      return '/dashboard/clinical-tools?tab=pelvic-floor'
    case 'metabolic_profile':
      return '/dashboard/clinical-tools?tab=metabolic'
    default:
      return null
  }
}

const formatRefDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const formatSince = (dateStr: string, ui: ReturnType<typeof useUiStrings>) => {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days < 1) return ui.patients.sinceToday
  if (days === 1) return ui.patients.since1Day
  if (days < 30) return ui.patients.sinceDays.replace('{days}', String(days))
  const months = Math.floor(days / 30)
  if (months === 1) return ui.patients.since1Month
  if (months < 12) return ui.patients.sinceMonths.replace('{months}', String(months))
  const years = Math.floor(months / 12)
  return years === 1 ? ui.patients.since1Year : ui.patients.sinceYears.replace('{years}', String(years))
}

const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function PatientDetailPage() {
  const ui = useUiStrings()
  const params = useParams()
  const router = useRouter()
  const { setCurrentPatient } = usePatientContext()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const [metabolicHistory, setMetabolicHistory] = useState<MetabolicProfile[]>([])
  const [metabolicAdaptive, setMetabolicAdaptive] = useState<AdaptiveInsightResult | null>(null)

  const [clinicalRefs, setClinicalRefs] = useState<ClinicalReference[]>([])
  const [removingRefId, setRemovingRefId] = useState<string | null>(null)

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

      const { data: refsData, error: refsError } = await supabase
        .from('patient_clinical_references')
        .select('id, content_type, content_id, payload, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (refsError) {
        console.error('Errore caricamento riferimenti clinici:', refsError)
      }
      setClinicalRefs(refsData || [])

      // Profilo metabolico/nutrizionale — stesso endpoint gia' usato dalla
      // vista paziente in My PHYGO, qui filtrato per patientId cosi' il
      // professionista vede l'andamento nella cartella clinica invece che
      // dover aprire separatamente il Calcolatore Metabolico.
      try {
        const metabolicRes = await fetch(`/api/metabolic/save?patientId=${patientId}`)
        if (metabolicRes.ok) {
          const metabolicData = await metabolicRes.json()
          setMetabolicHistory(metabolicData.profiles || [])
          setMetabolicAdaptive(metabolicData.adaptiveInsight ?? null)
        }
      } catch (err) {
        console.error('Errore caricamento profilo metabolico:', err)
      }

      setLoading(false)
    }

    load()
  }, [patientId])

  const openInCalculator = () => {
    if (patient) setCurrentPatient({ id: patient.id, name: patient.name })
    router.push('/dashboard/clinical-tools?tab=metabolic')
  }

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
      setInviteError(ui.patients.inviteError)
    }
    setInviteLoading(false)
  }

  const copyInviteLink = async () => {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleResetPortalAccess = async () => {
    const confirmed = window.confirm(
      ui.patients.resetPortalConfirm.replace('{name}', patient?.name || '')
    )
    if (!confirmed) return

    const { error } = await supabase
      .from('patients')
      .update({ patient_user_id: null })
      .eq('id', patientId)

    if (!error) {
      setPatient((prev) => (prev ? { ...prev, patient_user_id: null } : prev))
    }
  }

  const handleRemoveClinicalRef = async (refId: string) => {
    setRemovingRefId(refId)
    const { error } = await supabase
      .from('patient_clinical_references')
      .delete()
      .eq('id', refId)

    if (!error) {
      setClinicalRefs((prev) => prev.filter((r) => r.id !== refId))
    } else {
      console.error('Errore rimozione riferimento clinico:', error)
    }
    setRemovingRefId(null)
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-white dark:bg-[#08090b]">
        <Navbar />
        <div className="pt-40 text-center text-ink/40 dark:text-white/40">{ui.common.loading}</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="relative min-h-screen bg-white dark:bg-[#08090b]">
        <Navbar />
        <div className="pt-40 text-center text-ink/40 dark:text-white/40">{ui.patients.patientNotFound}</div>
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
          {ui.common.backToPatients}
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
                    {ui.patients.yearsOld.replace('{age}', String(patient.age))}
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
                    {ui.patients.portalActive}
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
                {ui.patients.scheduleButton}
              </button>
              <button
                onClick={() => router.push(`/dashboard/patients/${patientId}/session`)}
                className="flex-1 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105"
                style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
              >
                <Plus size={16} />
                {ui.patients.generateNewNoteButton}
              </button>
            </div>

            {!patient.patient_user_id && (
              <button
                onClick={handleInvite}
                disabled={inviteLoading}
                className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold border border-black/10 dark:border-white/10 text-ink/70 dark:text-white/70 hover:border-[#4F7CFF]/40 hover:text-[#4F7CFF] transition-colors disabled:opacity-60"
              >
                <Smartphone size={16} />
                {inviteLoading ? ui.patients.generatingInvite : ui.patients.inviteToPortalButton}
              </button>
            )}

            {patient.patient_user_id && (
              <button
                onClick={handleResetPortalAccess}
                className="flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink/40 dark:text-white/40 hover:text-red-500 transition-colors self-end"
              >
                <RotateCcw size={12} />
                {ui.patients.resetPortalAccess}
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
              {ui.patients.inviteReadyHeading}
            </p>
            <p className="text-xs text-ink/50 dark:text-white/50 mb-3">
              {ui.patients.inviteShareText.replace('{name}', patient.name)}
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
                {copied ? ui.patients.copied : ui.patients.copyButton}
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
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10"
        >
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <ClipboardList size={13} className="text-[#4F7CFF]" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">
                {ui.patients.statSessions}
              </span>
            </div>
            <p className="text-2xl font-bold text-ink dark:text-white">{notes.length}</p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar size={13} className="text-[#32D6A0]" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">
                {ui.patients.statLastSession}
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
                {ui.patients.statPatientSince}
              </span>
            </div>
            <p className="text-2xl font-bold text-ink dark:text-white">{formatSince(patient.created_at, ui)}</p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Dumbbell size={13} className="text-[#EC4899]" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">
                {ui.patients.statLinkedItems}
              </span>
            </div>
            <p className="text-2xl font-bold text-ink dark:text-white">{clinicalRefs.length}</p>
          </div>
        </motion.div>

        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F7CFF]/15 to-[#4F7CFF]/5 text-[#4F7CFF]">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink dark:text-white">
                  {ui.patients.noteHistoryHeading}
                </p>
                <p className="text-xs text-ink/40 dark:text-white/40 mt-0.5">
                  {ui.patients.noteHistorySubtitle}
                </p>
              </div>
            </div>
            {notes.length > 0 && (
              <span className="shrink-0 rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF] text-xs font-bold px-2.5 py-1">
                {notes.length}
              </span>
            )}
          </div>

          {notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/15 py-14 text-center flex flex-col items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF]">
                <div className="absolute inset-0 rounded-full bg-[#4F7CFF]/20 blur-lg" />
                <FileText size={20} className="relative" />
              </div>
              <p className="text-ink/40 dark:text-white/40">
                {ui.patients.noNotesYet}
              </p>
              <p className="text-xs text-ink/30 dark:text-white/30">
                {ui.patients.generateFirstNote}
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
                  className="group rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 flex items-start gap-4 shadow-sm hover:border-[#4F7CFF]/30 hover:shadow-md transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF] group-hover:scale-105 transition-transform">
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
                      {note.assessment || ui.patients.noAssessmentRecorded}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#32D6A0]/15 to-[#32D6A0]/5 text-[#32D6A0]">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink dark:text-white">
                  {ui.patients.treatmentPlanHeading}
                </p>
                <p className="text-xs text-ink/40 dark:text-white/40 mt-0.5">
                  {ui.patients.treatmentPlanSubtitle}
                </p>
              </div>
            </div>
            {clinicalRefs.length > 0 && (
              <span className="shrink-0 rounded-full bg-[#32D6A0]/10 text-[#32D6A0] text-xs font-bold px-2.5 py-1">
                {clinicalRefs.length}
              </span>
            )}
          </div>

          {clinicalRefs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/15 py-14 text-center flex flex-col items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#32D6A0]/10 text-[#32D6A0]">
                <div className="absolute inset-0 rounded-full bg-[#32D6A0]/20 blur-lg" />
                <Dumbbell size={20} className="relative" />
              </div>
              <p className="text-ink/40 dark:text-white/40">
                {ui.patients.nothingLinkedYet.replace('{name}', patient.name)}
              </p>
              <p className="text-xs text-ink/30 dark:text-white/30 max-w-sm">
                {ui.patients.treatmentPlanHint}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clinicalRefs.map((ref, i) => {
                const meta = REFERENCE_TYPE_META[ref.content_type] || REFERENCE_TYPE_META.exercise
                const Icon = meta.icon
                const href = getReferenceHref(ref)
                return (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                    onClick={href ? () => router.push(href) : undefined}
                    role={href ? 'button' : undefined}
                    tabIndex={href ? 0 : undefined}
                    title={href ? ui.patients.openReferenceHint : undefined}
                    onKeyDown={
                      href
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              router.push(href)
                            }
                          }
                        : undefined
                    }
                    className={`rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 flex items-start gap-4 shadow-sm transition-colors ${
                      href
                        ? 'cursor-pointer hover:border-black/15 dark:hover:border-white/25 hover:bg-white/90 dark:hover:bg-white/[0.06]'
                        : 'hover:border-black/10 dark:hover:border-white/20'
                    }`}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${meta.color}1A`, color: meta.color }}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: `${meta.color}1A`, color: meta.color }}>
                          {ref.payload?.section || refTypeLabel(ref.content_type, ui)}
                        </span>
                        <span className="text-xs text-ink/40 dark:text-white/40">
                          {formatRefDate(ref.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-ink dark:text-white">
                        {ref.payload?.label || `${refTypeLabel(ref.content_type, ui)} #${ref.content_id}`}
                      </p>
                      {ref.payload?.result && (
                        <p className="text-xs text-ink/50 dark:text-white/50 mt-0.5">
                          {ref.payload.result}
                        </p>
                      )}
                    </div>
                    {href && (
                      <ChevronRight size={16} className="shrink-0 mt-1.5 text-ink/20 dark:text-white/20" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveClinicalRef(ref.id)
                      }}
                      disabled={removingRefId === ref.id}
                      className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-ink/30 dark:text-white/30 hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-40"
                      title={ui.patients.removeTitle}
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366F1]/15 to-[#6366F1]/5 text-[#6366F1]">
                <Flame size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink dark:text-white">
                  {ui.patients.nutritionHeading}
                </p>
                <p className="text-xs text-ink/40 dark:text-white/40 mt-0.5">
                  {ui.patients.nutritionSubtitle}
                </p>
              </div>
            </div>
            <button
              onClick={openInCalculator}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)' }}
            >
              <Plus size={13} />
              {metabolicHistory.length === 0 ? ui.patients.newCalculationCta : ui.patients.viewFullCalculatorCta}
            </button>
          </div>

          {metabolicHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/15 py-14 text-center flex flex-col items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#6366F1]/10 text-[#6366F1]">
                <div className="absolute inset-0 rounded-full bg-[#6366F1]/20 blur-lg" />
                <Flame size={20} className="relative" />
              </div>
              <p className="text-ink/40 dark:text-white/40">
                {ui.patients.nutritionEmpty.replace('{name}', patient.name)}
              </p>
              <p className="text-xs text-ink/30 dark:text-white/30 max-w-sm">
                {ui.patients.nutritionEmptyHint}
              </p>
            </div>
          ) : (
            <>
              {(() => {
                const latestProfile = metabolicHistory[0]
                const chronological = [...metabolicHistory].reverse()
                return (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-2">
                        {ui.patients.latestProfileLabel} · {formatRefDate(latestProfile.created_at)}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-3">
                          <p className="text-lg font-bold text-ink dark:text-white">{latestProfile.tdee}</p>
                          <p className="text-[10px] text-ink/40 dark:text-white/40">TDEE</p>
                        </div>
                        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-3">
                          <p className="text-lg font-bold text-ink dark:text-white">{latestProfile.protein_g}g</p>
                          <p className="text-[10px] text-ink/40 dark:text-white/40">{ui.metabolicCalculator.proteinLabel}</p>
                        </div>
                        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-3">
                          <p className="text-lg font-bold text-ink dark:text-white">{latestProfile.carbs_g}g</p>
                          <p className="text-[10px] text-ink/40 dark:text-white/40">{ui.metabolicCalculator.carbsLabel}</p>
                        </div>
                        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-3">
                          <p className="text-lg font-bold text-ink dark:text-white">{latestProfile.fat_g}g</p>
                          <p className="text-[10px] text-ink/40 dark:text-white/40">{ui.metabolicCalculator.fatLabel}</p>
                        </div>
                      </div>
                    </div>

                    {metabolicHistory.length >= 2 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-2">
                          {ui.patients.weightTrendHeading}
                        </p>
                        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
                          <WeightTrendChart data={chronological.map((h) => ({ date: h.created_at, weightKg: h.weight_kg }))} height={120} />
                        </div>
                      </div>
                    )}

                    {metabolicAdaptive && (
                      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={12} className="text-amber-500" />
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400">
                            {ui.metabolicCalculator.adaptiveBadge}
                          </p>
                        </div>
                        {metabolicAdaptive.available ? (
                          <>
                            <div className="flex items-baseline gap-2 mb-1">
                              <p className="text-xl font-bold text-ink dark:text-white">
                                {metabolicAdaptive.insight.impliedTdee}
                              </p>
                              <span className="text-xs font-semibold text-ink/40 dark:text-white/40">{ui.metabolicCalculator.kcalPerDaySuffix}</span>
                              {metabolicAdaptive.insight.deltaFromFormula > 20 && (
                                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  <TrendingUp size={11} /> +{metabolicAdaptive.insight.deltaFromFormula}
                                </span>
                              )}
                              {metabolicAdaptive.insight.deltaFromFormula < -20 && (
                                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                  <TrendingDown size={11} /> {metabolicAdaptive.insight.deltaFromFormula}
                                </span>
                              )}
                              {Math.abs(metabolicAdaptive.insight.deltaFromFormula) <= 20 && (
                                <Minus size={11} className="text-ink/40 dark:text-white/40" />
                              )}
                            </div>
                            <p className="text-xs text-ink/50 dark:text-white/50 leading-relaxed">
                              {interpolate(ui.metabolicCalculator.adaptiveBasedOn, {
                                days: metabolicAdaptive.insight.daysSpanned,
                                entries: metabolicAdaptive.insight.entriesUsed,
                              })}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-ink/50 dark:text-white/50 leading-relaxed">{ui.metabolicCalculator.adaptiveNotEnoughData}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}