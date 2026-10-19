'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, FileText, Calendar, Activity, Stethoscope, ClipboardList, Smartphone, Copy, Check, RotateCcw, Dumbbell, ClipboardCheck, MapPin, ShoppingBag, X, ChevronRight, UserRound, Sparkles, Flame, TrendingUp, TrendingDown, Minus, Video } from 'lucide-react'
import Navbar from '@/components/Navbar'
import ClinicalAccessNotice from '@/components/ClinicalAccessNotice'
import { useClinicalLocked } from '@/lib/useClinicalAccess'
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext'
import LanguageMenu from '@/components/LanguageMenu'
import type { AppLang } from '@/lib/i18n/uiStrings'
import { usePatientContext } from '@/contexts/PatientContext'
import WeightTrendChart from '@/components/WeightTrendChart'
import type { AdaptiveInsightResult } from '@/lib/metabolicCalculator'
import { lazy } from '@/lib/lazy'
import PatientProfileCard from '@/components/patients/PatientProfileCard'
import { displayAge, type PatientIdentity } from '@/lib/patients/profile'
import { PageBackdrop, PageEyebrow, PAGE_BG, PRIMARY_BTN, SECONDARY_BTN, CHIP, ICON_TILE } from '@/components/ui/premium'
import { Avatar, Card } from '@/components/dashboard/HomeCards'
import { useHomeUi } from '@/lib/i18n/homeStrings'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

// select('*'): the record, with the identity and contact columns of
// sql/2026-10-17_patient_profile_PROPOSED.sql once applied (null until then).
type Patient = PatientIdentity & {
  id: string
  created_at: string
  patient_user_id: string | null
}


type Note = {
  id: string
  assessment: string | null
  plan: string | null
  created_at: string
}

// The whole history, read in pages so that no note is left out whatever its
// age (PostgREST answers at most "max rows" per request, 1000 by default, and
// a project may set it lower). Each page starts after the rows already
// received and the reading stops only at an empty page, so a lower server
// limit never cuts the history short; the order has a tie-breaker (id) so
// pages never overlap or skip, duplicates are dropped, and a page cap stops a
// server that would ignore the range. Row-level security decides which notes
// come back: the clinician's own notes on their own patient ("Users can view
// their own notes").
const NOTES_PAGE_SIZE = 500
const NOTES_MAX_PAGES = 200

// Newest first; notes with the same timestamp keep a stable order.
const sortNotesNewestFirst = (rows: Note[]) =>
  [...rows].sort((a, b) => {
    const diff = Date.parse(b.created_at) - Date.parse(a.created_at)
    if (diff) return diff
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0
  })

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
  exercise: { icon: Dumbbell, color: '#8B95FF' },
  clinical_test: { icon: ClipboardCheck, color: '#A78BFA' },
  questionnaire: { icon: ClipboardList, color: '#94A3B8' },
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
  const h = useHomeUi()
  const params = useParams()
  const router = useRouter()
  const locked = useClinicalLocked()
  const { setCurrentPatient } = usePatientContext()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  // 'error' is a failed load, never shown as an empty history.
  const [notesStatus, setNotesStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loading, setLoading] = useState(true)

  const [metabolicHistory, setMetabolicHistory] = useState<MetabolicProfile[]>([])
  const [metabolicAdaptive, setMetabolicAdaptive] = useState<AdaptiveInsightResult | null>(null)

  const [clinicalRefs, setClinicalRefs] = useState<ClinicalReference[]>([])
  const [removingRefId, setRemovingRefId] = useState<string | null>(null)

  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  // The invitation opens in the patient's language (?lang=); it starts as the
  // clinician's and can be changed before the link is shared.
  const { lang: clinicianLang } = useLanguage()
  const [inviteLang, setInviteLang] = useState<AppLang | null>(null)
  const inviteLink = inviteCode
    ? `${window.location.origin}/my-phygo/join/${inviteCode}?lang=${inviteLang ?? clinicianLang}`
    : null
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const loadNotes = useCallback(async () => {
    setNotesStatus('loading')
    const byId = new Map<string, Note>()
    let received = 0
    for (let page = 0; page < NOTES_MAX_PAGES; page++) {
      const { data, error } = await supabase
        .from('notes')
        .select('id, assessment, plan, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(received, received + NOTES_PAGE_SIZE - 1)
      if (error) {
        console.error('Errore caricamento storico note:', error.code, error.message)
        setNotesStatus('error')
        return
      }
      if (!data || data.length === 0) break
      received += data.length
      for (const n of data as Note[]) byId.set(n.id, n)
    }
    setNotes(sortNotesNewestFirst([...byId.values()]))
    setNotesStatus('ready')
  }, [patientId])

  useEffect(() => {
    const load = async () => {
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      setPatient(patientData)

      await loadNotes()

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
  }, [patientId, loadNotes])

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
      setInviteCode(code)
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
    if (locked) return
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
        <div className="pt-40 text-center text-ink/55 dark:text-white/40">{ui.patients.patientNotFound}</div>
      </div>
    )
  }

  const lastSessionDate = notes.length > 0 ? new Date(notes[0].created_at) : null

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors ${PAGE_BG}`}>
      <Navbar />
      <PageBackdrop />

      <div className="relative max-w-4xl mx-auto pt-40 pb-20 px-6">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-ink/60 dark:text-white/50 hover:text-ink dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          {ui.common.backToPatients}
        </motion.button>

        <ClinicalAccessNotice />

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8"
        >
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={patient.name} linked={!!patient.patient_user_id} size={72} />
            <div className="min-w-0">
              <PageEyebrow icon={UserRound}>{h.patientRecord}</PageEyebrow>
              <h1 className="mt-1.5 break-words font-display text-3xl font-semibold tracking-[-0.035em] text-ink dark:text-white sm:text-[40px] sm:leading-[1.1]">
                {patient.name}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {displayAge(patient) && (
                  <span className="text-sm text-ink/55 dark:text-white/40">
                    {ui.patients.yearsOld.replace('{age}', String(displayAge(patient)!.years))}
                  </span>
                )}
                {patient.main_condition && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${CHIP}`}>
                    <Stethoscope size={11} />
                    {patient.main_condition}
                  </span>
                )}
                {patient.patient_user_id && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${CHIP}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
                className={`flex min-h-[46px] items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors ${SECONDARY_BTN}`}
              >
                <Calendar size={16} />
                {ui.patients.scheduleButton}
              </button>
              {patient.patient_user_id && (
                <button
                  onClick={() => router.push(`/dashboard/patients/${patientId}/call`)}
                  disabled={locked}
                  className={`flex min-h-[46px] items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${SECONDARY_BTN}`}
                >
                  <Video size={16} />
                  {h.videoCall}
                </button>
              )}
              <button
                onClick={() => router.push(`/dashboard/patients/${patientId}/session`)}
                disabled={locked}
                className="flex-1 flex min-h-[46px] items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Plus size={16} />
                {ui.patients.generateNewNoteButton}
              </button>
            </div>

            {!patient.patient_user_id && (
              <button
                onClick={handleInvite}
                disabled={inviteLoading || locked}
                className={`flex min-h-[46px] items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold transition-colors disabled:opacity-60 ${SECONDARY_BTN}`}
              >
                <Smartphone size={16} />
                {inviteLoading ? ui.patients.generatingInvite : ui.patients.inviteToPortalButton}
              </button>
            )}

            {patient.patient_user_id && (
              <button
                onClick={handleResetPortalAccess}
                disabled={locked}
                className="disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink/55 dark:text-white/40 hover:text-red-500 transition-colors self-end"
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
            className="mb-8 rounded-[24px] border border-black/[0.06] bg-white/90 p-5 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.04]"
          >
            <p className="text-sm font-semibold text-ink dark:text-white mb-1">
              {ui.patients.inviteReadyHeading}
            </p>
            <p className="text-xs text-ink/60 dark:text-white/50 mb-3">
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
                className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${copied ? 'bg-emerald-500 text-white' : PRIMARY_BTN}`}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? ui.patients.copied : ui.patients.copyButton}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-ink/60 dark:text-white/50">
              <span>{ui.patients.inviteLanguageLabel}</span>
              <LanguageMenu value={inviteLang ?? clinicianLang} onChange={setInviteLang} />
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
          {[
            { icon: ClipboardList, label: ui.patients.statSessions, value: notesStatus === 'ready' ? String(notes.length) : '—' },
            { icon: Calendar, label: ui.patients.statLastSession, value: lastSessionDate ? lastSessionDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—' },
            { icon: Activity, label: ui.patients.statPatientSince, value: formatSince(patient.created_at, ui) },
            { icon: Dumbbell, label: ui.patients.statLinkedItems, value: String(clinicalRefs.length) },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="p-4 sm:p-5">
              <div className="flex items-center gap-2.5">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${ICON_TILE}`}>
                  <Icon size={14} aria-hidden />
                </span>
                <span className="min-w-0 truncate text-[12px] font-medium text-ink/60 dark:text-white/50">{label}</span>
              </div>
              <p className="mt-3 font-display text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-ink dark:text-white">{value}</p>
            </Card>
          ))}
        </motion.div>

        <PatientProfileCard
          patient={patient}
          locked={locked}
          onSaved={(updated) => setPatient((p) => (p ? { ...p, ...updated } : p))}
        />

        <div className="rounded-[24px] border border-black/[0.06] bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_44px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.055] dark:to-white/[0.018] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-black/[0.03] text-ink/70 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/80">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink dark:text-white">
                  {ui.patients.noteHistoryHeading}
                </p>
                <p className="text-xs text-ink/55 dark:text-white/40 mt-0.5">
                  {ui.patients.noteHistorySubtitle}
                </p>
              </div>
            </div>
            {notesStatus === 'ready' && notes.length > 0 && (
              <span className="shrink-0 rounded-full bg-black/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/75 text-xs font-bold px-2.5 py-1">
                {notes.length}
              </span>
            )}
          </div>

          {notesStatus === 'loading' ? (
            <div role="status" className="rounded-2xl border border-black/[0.05] bg-black/[0.015] dark:border-white/[0.06] dark:bg-white/[0.02] py-14 text-center text-sm text-ink/55 dark:text-white/40">
              {ui.common.loading}
            </div>
          ) : notesStatus === 'error' ? (
            <div role="alert" data-testid="notes-error" className="rounded-2xl border border-red-500/25 bg-red-500/[0.04] py-10 px-6 text-center flex flex-col items-center gap-3">
              <p className="text-sm text-ink/70 dark:text-white/70">{ui.patients.notesLoadError}</p>
              <button
                type="button"
                onClick={() => loadNotes()}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 transition-colors"
              >
                <RotateCcw size={13} />
                {ui.patients.notesRetry}
              </button>
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-2xl border border-black/[0.05] bg-black/[0.015] dark:border-white/[0.06] dark:bg-white/[0.02] py-14 text-center flex flex-col items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/75">
                <FileText size={20} className="relative" />
              </div>
              <p className="text-ink/55 dark:text-white/40">
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
                  className="group rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] p-5 flex items-start gap-4 shadow-soft hover:border-black/15 dark:hover:border-white/20 hover:shadow-md transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/75 group-hover:scale-105 transition-transform">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-ink/55 dark:text-white/40 mb-1">
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

        <div className="mt-8 rounded-[24px] border border-black/[0.06] bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_44px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.055] dark:to-white/[0.018] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-black/[0.03] text-ink/70 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/80">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink dark:text-white">
                  {ui.patients.treatmentPlanHeading}
                </p>
                <p className="text-xs text-ink/55 dark:text-white/40 mt-0.5">
                  {ui.patients.treatmentPlanSubtitle}
                </p>
              </div>
            </div>
            {clinicalRefs.length > 0 && (
              <span className="shrink-0 rounded-full bg-black/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/75 text-xs font-bold px-2.5 py-1">
                {clinicalRefs.length}
              </span>
            )}
          </div>

          {clinicalRefs.length === 0 ? (
            <div className="rounded-2xl border border-black/[0.05] bg-black/[0.015] dark:border-white/[0.06] dark:bg-white/[0.02] py-14 text-center flex flex-col items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/75">
                <Dumbbell size={20} className="relative" />
              </div>
              <p className="text-ink/55 dark:text-white/40">
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
                    className={`rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] p-5 flex items-start gap-4 shadow-soft transition-colors ${
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
                        <span className="text-xs text-ink/55 dark:text-white/40">
                          {formatRefDate(ref.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-ink dark:text-white">
                        {ref.payload?.label || `${refTypeLabel(ref.content_type, ui)} #${ref.content_id}`}
                      </p>
                      {ref.payload?.result && (
                        <p className="text-xs text-ink/60 dark:text-white/50 mt-0.5">
                          {ref.payload.result}
                        </p>
                      )}
                    </div>
                    {href && (
                      <ChevronRight size={16} className="shrink-0 mt-1.5 text-ink/20 dark:text-white/20" />
                    )}
                    {!locked && (
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
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[24px] border border-black/[0.06] bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_44px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.055] dark:to-white/[0.018] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-black/[0.03] text-ink/70 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/80">
                <Flame size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink dark:text-white">
                  {ui.patients.nutritionHeading}
                </p>
                <p className="text-xs text-ink/55 dark:text-white/40 mt-0.5">
                  {ui.patients.nutritionSubtitle}
                </p>
              </div>
            </div>
            <button
              onClick={openInCalculator}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 transition-transform"
            >
              <Plus size={13} />
              {metabolicHistory.length === 0 ? ui.patients.newCalculationCta : ui.patients.viewFullCalculatorCta}
            </button>
          </div>

          {metabolicHistory.length === 0 ? (
            <div className="rounded-2xl border border-black/[0.05] bg-black/[0.015] dark:border-white/[0.06] dark:bg-white/[0.02] py-14 text-center flex flex-col items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/75">
                <Flame size={20} className="relative" />
              </div>
              <p className="text-ink/55 dark:text-white/40">
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
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/55 dark:text-white/40 mb-2">
                        {ui.patients.latestProfileLabel} · {formatRefDate(latestProfile.created_at)}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-2xl border border-black/[0.05] bg-black/[0.02] dark:border-white/[0.06] dark:bg-white/[0.03] p-3">
                          <p className="text-lg font-bold text-ink dark:text-white">{latestProfile.tdee}</p>
                          <p className="text-[10px] text-ink/55 dark:text-white/40">TDEE</p>
                        </div>
                        <div className="rounded-2xl border border-black/[0.05] bg-black/[0.02] dark:border-white/[0.06] dark:bg-white/[0.03] p-3">
                          <p className="text-lg font-bold text-ink dark:text-white">{latestProfile.protein_g}g</p>
                          <p className="text-[10px] text-ink/55 dark:text-white/40">{ui.metabolicCalculator.proteinLabel}</p>
                        </div>
                        <div className="rounded-2xl border border-black/[0.05] bg-black/[0.02] dark:border-white/[0.06] dark:bg-white/[0.03] p-3">
                          <p className="text-lg font-bold text-ink dark:text-white">{latestProfile.carbs_g}g</p>
                          <p className="text-[10px] text-ink/55 dark:text-white/40">{ui.metabolicCalculator.carbsLabel}</p>
                        </div>
                        <div className="rounded-2xl border border-black/[0.05] bg-black/[0.02] dark:border-white/[0.06] dark:bg-white/[0.03] p-3">
                          <p className="text-lg font-bold text-ink dark:text-white">{latestProfile.fat_g}g</p>
                          <p className="text-[10px] text-ink/55 dark:text-white/40">{ui.metabolicCalculator.fatLabel}</p>
                        </div>
                      </div>
                    </div>

                    {metabolicHistory.length >= 2 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/55 dark:text-white/40 mb-2">
                          {ui.patients.weightTrendHeading}
                        </p>
                        <div className="rounded-2xl border border-black/[0.05] bg-black/[0.02] dark:border-white/[0.06] dark:bg-white/[0.03] p-4">
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
                              <span className="text-xs font-semibold text-ink/55 dark:text-white/40">{ui.metabolicCalculator.kcalPerDaySuffix}</span>
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
                                <Minus size={11} className="text-ink/55 dark:text-white/40" />
                              )}
                            </div>
                            <p className="text-xs text-ink/60 dark:text-white/50 leading-relaxed">
                              {interpolate(ui.metabolicCalculator.adaptiveBasedOn, {
                                days: metabolicAdaptive.insight.daysSpanned,
                                entries: metabolicAdaptive.insight.entriesUsed,
                              })}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-ink/60 dark:text-white/50 leading-relaxed">{ui.metabolicCalculator.adaptiveNotEnoughData}</p>
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