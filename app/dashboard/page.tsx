'use client'

import { useCallback, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Users, FileText, CalendarDays, Search, ChevronRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ClinicalAccessNotice from '@/components/ClinicalAccessNotice'
import ErrorState from '@/components/workspace/ErrorState'
import { useClinicalLocked } from '@/lib/useClinicalAccess'
import { useUiStrings } from '@/contexts/LanguageContext'
import { useDashboardUi } from '@/lib/i18n/dashboardStrings'
import { lazy } from '@/lib/lazy'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

type Patient = {
  id: string
  name: string
  age: number | null
  main_condition: string | null
  gender: string | null
  created_at: string
}

// A statistic is either still loading (undefined), unavailable because its
// query failed (null), or a real count. It is never a placeholder number.
type Stat = number | null | undefined

// PostgREST returns at most this many rows per request (max-rows), so a
// count that reaches it is shown as "1000+" instead of a wrong exact figure.
const COUNT_CAP = 1000

const avatarGradient = (gender: string | null) => {
  if (gender === 'male') return 'linear-gradient(135deg, #4F7CFF 0%, #6E8FFF 100%)'
  if (gender === 'female') return 'linear-gradient(135deg, #F472B6 0%, #C084FC 100%)'
  return 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (!parts[0]) return '··'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const STAT_STYLES = [
  'linear-gradient(135deg, #4F7CFF 0%, #6E8FFF 100%)',
  'linear-gradient(135deg, #32D6A0 0%, #22B888 100%)',
  'linear-gradient(135deg, #F472B6 0%, #C084FC 100%)',
]

const BRAND_GRADIENT = 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)'
const INPUT_CLASS =
  'w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white'

export default function DashboardPage() {
  const ui = useUiStrings()
  const t = useDashboardUi()
  const locked = useClinicalLocked()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [notesThisMonth, setNotesThisMonth] = useState<Stat>(undefined)
  const [appointmentsToday, setAppointmentsToday] = useState<Stat>(undefined)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [condition, setCondition] = useState('')
  const [gender, setGender] = useState('')
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [hour, setHour] = useState<number | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const greetingTime =
    hour === null ? null : hour < 12 ? ui.patients.greetingMorning : hour < 18 ? ui.patients.greetingAfternoon : ui.patients.greetingEvening

  const loadPatients = useCallback(async () => {
    setLoadState('loading')
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setPatients(data || [])
      setLoadState('ready')
    } catch (err) {
      console.error('Patients could not be loaded:', err)
      setLoadState('error')
    }
  }, [])

  // Real counts only, read through the same client and database rules as the
  // rest of this page: the clinician's own notes written this calendar month,
  // and their confirmed appointments today (as shown in the Agenda).
  const loadStats = useCallback(async (userId: string) => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const [notesRes, apptRes] = await Promise.all([
      supabase
        .from('notes')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', monthStart.toISOString())
        .limit(COUNT_CAP)
        .then((r) => r, (error) => ({ data: null, error })),
      supabase
        .from('appointments')
        .select('scheduled_at')
        .eq('status', 'confirmed')
        .gte('scheduled_at', dayStart.toISOString())
        .lt('scheduled_at', dayEnd.toISOString())
        .then((r) => r, (error) => ({ data: null, error })),
    ])

    if (notesRes.error || !notesRes.data) setNotesThisMonth(null)
    else setNotesThisMonth(notesRes.data.filter((n: { created_at: string }) => new Date(n.created_at) >= monthStart).length)

    if (apptRes.error || !apptRes.data) setAppointmentsToday(null)
    else
      setAppointmentsToday(
        apptRes.data.filter((a: { scheduled_at: string }) => {
          const d = new Date(a.scheduled_at)
          return d >= dayStart && d < dayEnd
        }).length
      )
  }, [])

  useEffect(() => {
    setHour(new Date().getHours())
    loadPatients()
    supabase.auth.getUser().then(
      ({ data: { user } }) => {
        setDisplayName(user?.user_metadata?.display_name || null)
        if (user) loadStats(user.id)
        else {
          setNotesThisMonth(null)
          setAppointmentsToday(null)
        }
      },
      () => {
        setNotesThisMonth(null)
        setAppointmentsToday(null)
      }
    )
  }, [loadPatients, loadStats])

  const toggleForm = () => {
    setShowForm((v) => !v)
    setCreateError(null)
  }

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (locked || saving) return
    setSaving(true)
    setCreateError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCreateError(t.home.createError)
        return
      }

      const { error } = await supabase.from('patients').insert({
        user_id: user.id,
        name,
        age: age ? parseInt(age) : null,
        main_condition: condition || null,
        gender: gender || null,
      })

      if (error) {
        console.error('Patient could not be created:', error)
        // 42501: refused by the database rules (can_manage_patients()).
        setCreateError(error.code === '42501' ? t.home.createDenied : t.home.createError)
        return
      }

      setName('')
      setAge('')
      setCondition('')
      setGender('')
      setShowForm(false)
      await loadPatients()
    } catch (err) {
      console.error('Patient could not be created:', err)
      setCreateError(t.common.networkError)
    } finally {
      setSaving(false)
    }
  }

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  )

  const stats: { icon: typeof Users; label: string; value: Stat; href?: string }[] = [
    { icon: Users, label: ui.patients.statPatients, value: loadState === 'loading' ? undefined : loadState === 'error' ? null : patients.length },
    { icon: FileText, label: ui.patients.statNotesThisMonth, value: notesThisMonth },
    { icon: CalendarDays, label: t.home.statAppointmentsToday, value: appointmentsToday, href: '/dashboard/agenda' },
  ]

  const newPatientButton = (extra: string) => (
    <button
      type="button"
      onClick={toggleForm}
      disabled={locked}
      aria-expanded={showForm}
      aria-controls="new-patient-form"
      className={`flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 min-h-[44px] text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${extra}`}
      style={{ background: BRAND_GRADIENT }}
    >
      {showForm ? <X size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
      {showForm ? ui.patients.cancel : ui.patients.newPatient}
    </button>
  )

  return (
    <div className="relative min-h-screen bg-[#f6f7f9] dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background:
            'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(244,114,182,0.35) 50%, rgba(50,214,160,0.5) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
        }}
      />

      <main id="main-content" className="relative max-w-4xl mx-auto pt-32 sm:pt-40 pb-28 sm:pb-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-start justify-between gap-6 mb-10 sm:mb-12"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ background: 'linear-gradient(90deg, #4F7CFF, #32D6A0)' }}
              />
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4F7CFF]">
                {ui.patients.eyebrow}
              </p>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-ink dark:text-white break-words">
              {greetingTime ? (displayName ? `${greetingTime}, ${displayName}` : greetingTime) : ui.patients.greetingDefault}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]">.</span>
            </h1>
            <p className="text-base text-ink/60 dark:text-white/50 mt-3">
              {ui.patients.subtitle}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 pt-8">{newPatientButton('')}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-3 sm:gap-4 mb-8"
        >
          {stats.map((stat, i) => {
            const inner = (
              <>
                <div
                  className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-25 blur-2xl transition-transform duration-500 group-hover:scale-125"
                  style={{ background: STAT_STYLES[i] }}
                />
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-soft mb-3"
                  style={{ background: STAT_STYLES[i] }}
                >
                  <stat.icon size={16} aria-hidden />
                </div>
                <p className="relative font-display text-2xl font-bold text-ink dark:text-white tabular-nums" data-stat={i}>
                  {stat.value === undefined ? (
                    <span className="block h-8 w-10 rounded-md bg-ink/10 dark:bg-white/10 animate-pulse" aria-label={ui.common.loading} />
                  ) : stat.value === null ? (
                    <span title={t.common.unavailable} aria-label={t.common.unavailable}>—</span>
                  ) : stat.value >= COUNT_CAP ? (
                    `${COUNT_CAP}+`
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="relative text-xs leading-snug text-ink/60 dark:text-white/50 mt-0.5">{stat.label}</p>
              </>
            )
            const cls =
              'group relative block rounded-2xl border border-black/[0.09] dark:border-white/10 bg-white/90 dark:bg-white/[0.03] backdrop-blur-xl p-4 sm:p-5 shadow-soft hover:shadow-lg transition-shadow duration-300 overflow-hidden'
            return stat.href ? (
              <Link key={i} href={stat.href} className={`${cls} hover:border-[#4F7CFF]/30`}>
                {inner}
              </Link>
            ) : (
              <div key={i} className={cls}>
                {inner}
              </div>
            )
          })}
        </motion.div>

        <ClinicalAccessNotice />

        <div className="mb-6 sm:hidden">{newPatientButton('w-full')}</div>

        <AnimatePresence>
          {showForm && (
            <motion.form
              id="new-patient-form"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onSubmit={handleCreatePatient}
              className="mb-10 rounded-[28px] border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.04] backdrop-blur-2xl shadow-2xl p-5 sm:p-8 space-y-5 overflow-hidden"
            >
              <div>
                <label htmlFor="np-name" className="text-sm font-medium text-ink/70 dark:text-white/60">
                  {ui.patients.formNameLabel}
                </label>
                <input
                  id="np-name"
                  type="text"
                  required
                  autoFocus
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div role="group" aria-labelledby="np-gender-label">
                <p id="np-gender-label" className="text-sm font-medium text-ink/70 dark:text-white/60">
                  {ui.patients.formGenderLabel}
                </p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {[
                    { value: 'male', label: ui.patients.genderMale },
                    { value: 'female', label: ui.patients.genderFemale },
                    { value: '', label: ui.patients.genderNotSpecified },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setGender(opt.value)}
                      aria-pressed={gender === opt.value}
                      className={`rounded-full px-4 py-2 min-h-[40px] text-sm font-medium border transition-colors ${
                        gender === opt.value
                          ? 'text-white border-transparent'
                          : 'text-ink/70 dark:text-white/60 border-black/10 dark:border-white/10'
                      }`}
                      style={gender === opt.value ? { background: BRAND_GRADIENT } : undefined}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="np-age" className="text-sm font-medium text-ink/70 dark:text-white/60">
                  {ui.patients.formAgeLabel}
                </label>
                <input
                  id="np-age"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={130}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="np-condition" className="text-sm font-medium text-ink/70 dark:text-white/60">
                  {ui.patients.formConditionLabel}
                </label>
                <input
                  id="np-condition"
                  type="text"
                  autoComplete="off"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              {createError && (
                <p
                  role="alert"
                  data-testid="create-patient-error"
                  className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                  <span>{createError}</span>
                </p>
              )}
              <button
                type="submit"
                disabled={saving || locked}
                className="rounded-full px-7 py-3 min-h-[44px] text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
                style={{ background: BRAND_GRADIENT }}
              >
                {saving ? ui.patients.savingButton : ui.patients.savePatientButton}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {loadState !== 'error' && (patients.length > 0 || loadState === 'loading') && (
          <div className="relative mb-6">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 dark:text-white/40" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ui.patients.searchPlaceholder}
              aria-label={ui.patients.searchPlaceholder}
              className="w-full rounded-full border border-black/[0.09] dark:border-white/10 bg-white/90 dark:bg-white/[0.03] backdrop-blur-xl pl-11 pr-4 py-3 text-sm outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
            />
          </div>
        )}

        {loadState === 'loading' ? (
          <div className="space-y-2" aria-busy="true">
            <span className="sr-only" role="status">{ui.common.loading}</span>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.02] px-4 py-3.5 flex items-center gap-3.5"
              >
                <div className="h-10 w-10 rounded-full bg-ink/10 dark:bg-white/10 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 max-w-full rounded bg-ink/10 dark:bg-white/10 animate-pulse" />
                  <div className="h-2.5 w-24 rounded bg-ink/[0.07] dark:bg-white/[0.07] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : loadState === 'error' ? (
          <ErrorState title={t.home.loadErrorTitle} message={t.home.loadErrorBody} onRetry={loadPatients} />
        ) : patients.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-black/15 dark:border-white/15 py-16 px-6 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF]">
              <Users size={20} aria-hidden />
            </span>
            <p className="text-ink/70 dark:text-white/60">{ui.patients.noPatientsYet}</p>
            {!locked && !showForm && (
              <button
                type="button"
                onClick={toggleForm}
                className="mt-5 hidden sm:inline-flex items-center gap-2 rounded-full px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white"
                style={{ background: BRAND_GRADIENT }}
              >
                <Plus size={16} aria-hidden />
                {t.home.addFirstPatient}
              </button>
            )}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-black/15 dark:border-white/15 py-16 px-6 text-center">
            <p className="text-ink/70 dark:text-white/60 break-words">
              {ui.patients.noPatientsMatch.replace('{search}', search)}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredPatients.map((patient, i) => (
              <li key={patient.id}>
                <Link href={`/dashboard/patients/${patient.id}`} className="block rounded-2xl">
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 20) * 0.03 }}
                    whileHover={{ y: -2 }}
                    className="group w-full rounded-2xl border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.03] backdrop-blur-xl px-4 py-3.5 flex items-center gap-3.5 shadow-soft transition-all hover:shadow-lg hover:border-[#4F7CFF]/30 cursor-pointer"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold shadow-soft"
                      style={{ background: avatarGradient(patient.gender) }}
                      aria-hidden
                    >
                      {getInitials(patient.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink dark:text-white truncate">{patient.name}</p>
                      {(patient.age || patient.main_condition) && (
                        <p className="text-xs text-ink/60 dark:text-white/50 truncate">
                          {patient.age ? ui.patients.yearsOld.replace('{age}', String(patient.age)) : ''}
                          {patient.age && patient.main_condition ? ' · ' : ''}
                          {patient.main_condition || ''}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      size={16}
                      aria-hidden
                      className="shrink-0 text-ink/30 dark:text-white/30 transition-all group-hover:text-[#4F7CFF] group-hover:translate-x-0.5"
                    />
                  </motion.div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
