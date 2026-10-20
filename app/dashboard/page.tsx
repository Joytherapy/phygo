'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Users, Search, AlertCircle, Sparkles, FileText, CalendarDays, Smartphone } from 'lucide-react'
import Navbar from '@/components/Navbar'
import ClinicalAccessNotice from '@/components/ClinicalAccessNotice'
import ErrorState from '@/components/workspace/ErrorState'
import {
  Card, ACCENT, PRIMARY_BTN, NextPatientCard, NoUpcomingCard, TodoCard, StatTile, Sparkline, Bars, Ring, PatientCard, Skeleton, InlineError,
  type NextView, type TodoItem,
} from '@/components/dashboard/HomeCards'
import { useClinicalLocked } from '@/lib/useClinicalAccess'
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext'
import { useDashboardUi } from '@/lib/i18n/dashboardStrings'
import { useHomeUi } from '@/lib/i18n/homeStrings'
import { localeForLang } from '@/lib/i18n/agendaStrings'
import { PATIENT_PROFILE_STRINGS } from '@/lib/i18n/patientProfileStrings'
import {
  ageFromBirthDate, composeName, displayAge, isValidEmail, isValidPhone, parseItalianDate, type FieldError,
} from '@/lib/patients/profile'
import {
  appointmentsPerWeekday, daysBetween, followUps, isConfirmed, isToday, lastNoteByPatient, laterToday, nextAppointment,
  nextByPatient, notesPerWeek, pendingRequests, weekBounds, type HomeAppointment, type HomeNote,
} from '@/lib/dashboard/home'
import { lazy } from '@/lib/lazy'
import CareAttention from '@/components/dashboard/CareAttention'
import { PageBackdrop, PAGE_BG, HUE } from '@/components/ui/premium'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

type Patient = {
  id: string
  name: string
  first_name?: string | null
  last_name?: string | null
  birth_date?: string | null
  age: number | null
  main_condition: string | null
  gender: string | null
  patient_user_id?: string | null
  created_at: string
}

// Each block is loading (undefined), unavailable because its query failed
// (null), or real data. Never a placeholder number.
type Loaded<T> = T | null | undefined

// PostgREST returns at most this many rows per request (max-rows).
const ROW_CAP = 1000

const INPUT_CLASS =
  'w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.03] px-4 py-3 outline-none transition focus:border-[#8B95FF] focus:ring-4 focus:ring-[#8B95FF]/15 text-ink dark:text-white aria-[invalid=true]:border-red-500/60'

const EMPTY_FORM = { first: '', last: '', birth: '', gender: '', condition: '', phone: '', email: '' }
type NewForm = typeof EMPTY_FORM
type FormErrors = Partial<Record<keyof NewForm, FieldError>>

function validateNew(f: NewForm, today: Date): FormErrors {
  const e: FormErrors = {}
  if (!f.first.trim()) e.first = 'required'
  if (!f.last.trim()) e.last = 'required'
  if (f.first.trim().length > 100) e.first = 'too_long'
  if (f.last.trim().length > 100) e.last = 'too_long'
  if (f.birth.trim()) {
    const p = parseItalianDate(f.birth, today)
    if (!p.ok) e.birth = p.error
  }
  if (f.phone.trim() && !isValidPhone(f.phone.trim())) e.phone = 'phone'
  if (f.email.trim() && !isValidEmail(f.email.trim())) e.email = 'email'
  return e
}

export default function DashboardPage() {
  const ui = useUiStrings()
  const t = useDashboardUi()
  const h = useHomeUi()
  const { lang } = useLanguage()
  const p = PATIENT_PROFILE_STRINGS[lang]
  const locale = localeForLang(lang)
  const locked = useClinicalLocked()

  const [patients, setPatients] = useState<Patient[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [appointments, setAppointments] = useState<Loaded<HomeAppointment[]>>(undefined)
  const [notes, setNotes] = useState<Loaded<HomeNote[]>>(undefined)
  const [now, setNow] = useState<Date | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [busyRequest, setBusyRequest] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewForm>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const loadPatients = useCallback(async () => {
    setLoadState('loading')
    try {
      const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setPatients(data || [])
      setLoadState('ready')
    } catch (err) {
      console.error('Patients could not be loaded:', err)
      setLoadState('error')
    }
  }, [])

  // From the start of this week (for the week counter) onwards; the database
  // rules return only this clinician's appointments, as in the Agenda.
  const loadAppointments = useCallback(async () => {
    setAppointments(undefined)
    const from = weekBounds(new Date()).start
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, patient_id, scheduled_at, duration_minutes, session_type, status, requested_by, patients(name)')
        .neq('status', 'cancelled')
        .gte('scheduled_at', from.toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(ROW_CAP)
      if (error) throw error
      setAppointments(((data as unknown as HomeAppointment[]) || []).filter((a) => new Date(a.scheduled_at) >= from && a.status !== 'cancelled'))
    } catch (err) {
      console.error('Appointments could not be loaded:', err)
      setAppointments(null)
    }
  }, [])

  // The clinician's own notes of the last year: last session per patient,
  // notes this month and the weekly trend.
  const loadNotes = useCallback(async (uid: string) => {
    const since = new Date()
    since.setFullYear(since.getFullYear() - 1)
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('patient_id, created_at')
        .eq('user_id', uid)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(ROW_CAP)
      if (error) throw error
      setNotes(((data as HomeNote[]) || []).filter((n) => new Date(n.created_at) >= since))
    } catch (err) {
      console.error('Notes could not be loaded:', err)
      setNotes(null)
    }
  }, [])

  useEffect(() => {
    setNow(new Date())
    const tick = setInterval(() => setNow(new Date()), 60_000)
    loadPatients()
    loadAppointments()
    supabase.auth.getUser().then(
      ({ data: { user } }) => {
        setDisplayName(user?.user_metadata?.display_name || null)
        if (user) {
          loadNotes(user.id)
        } else setNotes(null)
      },
      () => setNotes(null)
    )
    return () => clearInterval(tick)
  }, [loadPatients, loadAppointments, loadNotes])

  const answerRequest = async (id: string, status: 'confirmed' | 'cancelled') => {
    setBusyRequest(id)
    setRequestError(null)
    try {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Appointment request could not be updated:', err)
      setRequestError(h.requestError)
    }
    setBusyRequest(null)
    await loadAppointments()
  }

  const setField = (k: keyof NewForm, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (formErrors[k]) setFormErrors((e) => ({ ...e, [k]: undefined }))
  }

  const toggleForm = () => {
    setShowForm((v) => !v)
    setCreateError(null)
    setFormErrors({})
  }

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (locked || saving) return
    const today = new Date()
    const errors = validateNew(form, today)
    setFormErrors(errors)
    if (Object.keys(errors).length) return
    setSaving(true)
    setCreateError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCreateError(t.home.createError)
        return
      }
      const birth = form.birth.trim() ? parseItalianDate(form.birth, today) : null
      const birthIso = birth && birth.ok ? birth.iso : null
      const { error } = await supabase.from('patients').insert({
        user_id: user.id,
        first_name: form.first.trim(),
        last_name: form.last.trim(),
        name: composeName(form.first, form.last),
        birth_date: birthIso,
        age: birthIso ? ageFromBirthDate(birthIso, today) : null,
        gender: form.gender || null,
        main_condition: form.condition.trim() || null,
        phone: form.phone.trim() || null,
        contact_email: form.email.trim() || null,
      })

      if (error) {
        console.error('Patient could not be created:', error)
        // 42501: refused by the database rules (can_manage_patients()).
        setCreateError(error.code === '42501' ? t.home.createDenied : t.home.createError)
        return
      }

      setForm(EMPTY_FORM)
      setShowForm(false)
      await loadPatients()
    } catch (err) {
      console.error('Patient could not be created:', err)
      setCreateError(t.common.networkError)
    } finally {
      setSaving(false)
    }
  }

  /* ---------- derived views ---------- */

  const byId = useMemo(() => new Map(patients.map((pt) => [pt.id, pt])), [patients])
  const lastNote = useMemo(() => (notes ? lastNoteByPatient(notes) : null), [notes])
  const nextOf = useMemo(() => (appointments && now ? nextByPatient(appointments, now) : null), [appointments, now])

  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const dayLabel = (d: Date) => {
    if (!now) return ''
    const diff = daysBetween(now, d)
    if (diff === 0) return h.today
    if (diff === 1) return h.tomorrow
    return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  }
  const detailOf = (pt: Patient | undefined) => {
    if (!pt) return ''
    const age = displayAge({ birth_date: pt.birth_date ?? null, age: pt.age })
    return [age ? ui.patients.yearsOld.replace('{age}', String(age.years)) : '', pt.main_condition || ''].filter(Boolean).join(' · ')
  }
  const lastLabelOf = (id: string) => {
    if (notes === undefined) return '…'
    if (!lastNote || !now) return '—'
    const d = lastNote.get(id)
    return d ? h.daysAgo(daysBetween(d, now)) : h.noSessionsYet
  }
  const nameOf = (a: HomeAppointment) => byId.get(a.patient_id)?.name || a.patients?.name || '—'

  const next = appointments && now ? nextAppointment(appointments, now) : null
  let nextView: NextView | null = null
  if (next && now) {
    const a = next.appointment
    const pt = byId.get(a.patient_id)
    const start = new Date(a.scheduled_at)
    const minutes = Math.max(1, Math.round((start.getTime() - now.getTime()) / 60000))
    nextView = {
      patientId: a.patient_id,
      name: nameOf(a),
      detail: detailOf(pt),
      time: time(a.scheduled_at),
      dayLabel: dayLabel(start),
      duration: h.minutes(a.duration_minutes || 30),
      status: next.inProgress ? h.inProgress : isToday(a, now) ? h.startsIn(minutes) : dayLabel(start),
      inProgress: next.inProgress,
      video: a.session_type === 'video',
      typeLabel: a.session_type === 'video' ? h.video : h.inPerson,
      lastSession: lastLabelOf(a.patient_id),
      linked: !!pt?.patient_user_id,
      linkedLabel: pt?.patient_user_id ? h.myPhygoOn : h.myPhygoOff,
    }
  }
  const later =
    appointments && now
      ? laterToday(appointments, now, next?.appointment.id ?? null).map((a) => ({ id: a.id, time: time(a.scheduled_at), name: nameOf(a), patientId: a.patient_id }))
      : []

  const requests = appointments && now ? pendingRequests(appointments, now) : []
  const todayCount = appointments && now ? appointments.filter((a) => isConfirmed(a) && isToday(a, now)).length : null

  let todo: TodoItem[] | undefined
  if (appointments !== undefined && notes !== undefined && loadState !== 'loading' && now) {
    todo = [
      ...requests.map((a) => {
        const when = `${dayLabel(new Date(a.scheduled_at))} ${time(a.scheduled_at)}`
        return { kind: 'request' as const, id: a.id, name: nameOf(a), text: a.session_type === 'video' ? h.requestVideo(when) : h.requestInPerson(when) }
      }),
      ...(lastNote && nextOf
        ? followUps(patients.map((pt) => pt.id).filter((pid) => !requests.some((r) => r.patient_id === pid)), lastNote, nextOf, now).map((f) => ({
            kind: 'followup' as const,
            id: `f-${f.patientId}`,
            patientId: f.patientId,
            name: byId.get(f.patientId)?.name || '—',
            text: h.followUp(f.days),
          }))
        : []),
    ]
  }

  const monthStart = now ? new Date(now.getFullYear(), now.getMonth(), 1) : null
  const patientsValue: Loaded<number> = loadState === 'loading' ? undefined : loadState === 'error' ? null : patients.length
  const newThisMonth = monthStart ? patients.filter((pt) => new Date(pt.created_at) >= monthStart).length : 0
  const notesMonth: Loaded<number> = notes === undefined ? undefined : notes === null || !monthStart ? null : notes.filter((n) => new Date(n.created_at) >= monthStart).length
  const weekCount: Loaded<number> =
    appointments === undefined || !now ? undefined : appointments === null ? null : appointmentsPerWeekday(appointments, now).reduce((s, v) => s + v, 0)
  const linkedCount = patients.filter((pt) => pt.patient_user_id).length
  const linkedValue: Loaded<number> = patientsValue === undefined ? undefined : patientsValue === null ? null : linkedCount

  const greetingTime = !now ? null : now.getHours() < 12 ? ui.patients.greetingMorning : now.getHours() < 18 ? ui.patients.greetingAfternoon : ui.patients.greetingEvening
  const dateLine = now ? now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) : ''

  const filteredPatients = patients.filter((pt) => pt.name.toLowerCase().includes(search.trim().toLowerCase()))

  const newPatientButton = (extra: string) => (
    <button
      type="button"
      onClick={toggleForm}
      disabled={locked}
      aria-expanded={showForm}
      aria-controls="new-patient-form"
      className={`flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-5 min-h-[46px] text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${PRIMARY_BTN} ${extra}`}
    >
      {showForm ? <X size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
      {showForm ? ui.patients.cancel : ui.patients.newPatient}
    </button>
  )

  const field = (k: keyof NewForm, label: string, opts: { required?: boolean; placeholder?: string; type?: string; inputMode?: 'numeric' | 'tel' | 'email'; autoComplete?: string } = {}) => (
    <div>
      <label htmlFor={`np-${k}`} className="text-sm font-medium text-ink/70 dark:text-white/60">
        {label}
        {opts.required && <span aria-hidden className="text-[#7C83FF]"> *</span>}
      </label>
      <input
        id={`np-${k}`}
        type={opts.type || 'text'}
        inputMode={opts.inputMode}
        required={opts.required}
        autoComplete={opts.autoComplete || 'off'}
        placeholder={opts.placeholder}
        value={form[k]}
        onChange={(e) => setField(k, e.target.value)}
        aria-invalid={formErrors[k] ? true : undefined}
        aria-describedby={formErrors[k] ? `np-${k}-error` : undefined}
        className={INPUT_CLASS}
      />
      {formErrors[k] && (
        <p id={`np-${k}-error`} className="mt-1 text-xs text-red-600 dark:text-red-300">
          {p.errors[formErrors[k]!]}
        </p>
      )}
    </div>
  )

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors ${PAGE_BG}`}>
      <Navbar />

      <PageBackdrop />

      <main id="main-content" className="relative mx-auto max-w-6xl px-4 pb-28 pt-28 sm:px-6 sm:pb-20 sm:pt-36">
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-7 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50 dark:text-white/45">
              <span className="h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(139,149,255,0.8)]" style={{ background: ACCENT }} />
              {dateLine || ui.patients.eyebrow}
            </p>
            <h1 className="mt-3 break-words font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink dark:text-white sm:text-5xl lg:text-[60px]">
              {/* The gradient is clipped to the text box: the extra bottom padding keeps
                  descenders (the "y" of "joy", "g", "p") inside it. */}
              <span className="-mb-[0.18em] inline-block bg-gradient-to-b from-ink to-ink/70 bg-clip-text pb-[0.18em] text-transparent dark:from-white dark:to-white/55">
                {greetingTime ? (displayName ? `${greetingTime}, ${displayName}` : greetingTime) : ui.patients.greetingDefault}
              </span>
              <span className="-mb-[0.18em] inline-block bg-gradient-to-r from-[#A5B4FF] to-[#A78BFA] bg-clip-text pb-[0.18em] text-transparent">.</span>
            </h1>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-ink/60 dark:text-white/55" data-testid="brief">
              {todayCount === null ? (
                <span>{ui.patients.subtitle}</span>
              ) : (
                <>
                  <span>{todayCount ? <b className="font-semibold text-ink dark:text-white">{h.briefAppointments(todayCount)}</b> : h.briefNoAppointments}</span>
                  {requests.length > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {h.briefRequests(requests.length)}
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
          <div className="hidden sm:flex">{newPatientButton('')}</div>
        </motion.header>

        <ClinicalAccessNotice />

        <AnimatePresence>
          {showForm && (
            <motion.form
              id="new-patient-form"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onSubmit={handleCreatePatient}
              noValidate
              className="mb-8 overflow-hidden"
            >
              <Card glow className="space-y-5 p-5 sm:p-8">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink dark:text-white">{h.newPatientTitle}</h2>
                  <p className="mt-1 text-xs text-ink/55 dark:text-white/50">{p.requiredHint}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {field('first', p.labels.first_name, { required: true, autoComplete: 'off' })}
                  {field('last', p.labels.last_name, { required: true })}
                  {field('birth', p.labels.birth_date, { placeholder: p.birthDateFormat, inputMode: 'numeric' })}
                  <div role="group" aria-labelledby="np-gender-label">
                    <p id="np-gender-label" className="text-sm font-medium text-ink/70 dark:text-white/60">{p.labels.gender}</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {[
                        { value: 'male', label: p.genderOptions.male },
                        { value: 'female', label: p.genderOptions.female },
                        { value: '', label: p.genderOptions.none },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setField('gender', opt.value)}
                          aria-pressed={form.gender === opt.value}
                          className={`min-h-[44px] rounded-xl border px-4 text-sm font-medium transition-colors ${
                            form.gender === opt.value ? `border-transparent ${PRIMARY_BTN}` : 'border-black/10 text-ink/70 dark:border-white/10 dark:text-white/60'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2">{field('condition', p.labels.main_condition)}</div>
                  {field('phone', p.labels.phone, { type: 'tel', inputMode: 'tel' })}
                  {field('email', p.labels.contact_email, { type: 'email', inputMode: 'email' })}
                </div>
                <p className="text-xs text-ink/50 dark:text-white/45">{h.newPatientHint}</p>
                {createError && (
                  <p role="alert" data-testid="create-patient-error" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                    <span>{createError}</span>
                  </p>
                )}
                <button
                  type="submit"
                  disabled={saving || locked}
                  className={`min-h-[46px] rounded-2xl px-7 text-sm font-semibold transition-all disabled:opacity-60 ${PRIMARY_BTN}`}
                >
                  {saving ? ui.patients.savingButton : ui.patients.savePatientButton}
                </button>
              </Card>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mb-6 sm:hidden">{newPatientButton('w-full')}</div>

        {/* focus: what happens next, and what is waiting */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="grid gap-4 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            {appointments === undefined || !now ? (
              <Card className="space-y-4 p-6 sm:p-7">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-14 w-2/3" />
                <Skeleton className="h-11 w-1/2" />
              </Card>
            ) : appointments === null ? (
              <Card className="p-6">
                <InlineError message={h.appointmentsError} retry={t.common.retry} onRetry={loadAppointments} />
              </Card>
            ) : nextView ? (
              <NextPatientCard
                title={next && isToday(next.appointment, now) ? h.nextPatient : h.nextAppointment}
                view={nextView}
                later={later}
                labels={{ startSession: h.startSession, startVideoCall: h.startVideoCall, openRecord: h.openRecord, lastSession: h.lastSession, laterToday: h.laterToday, openAgenda: h.openAgenda }}
              />
            ) : (
              <NoUpcomingCard title={h.noUpcomingTitle} body={h.noUpcomingBody} cta={h.openAgenda} />
            )}
          </div>
          <div className="min-w-0 lg:col-span-4">
            <TodoCard
              title={h.todo}
              items={appointments === null ? [] : todo}
              empty={h.todoEmpty}
              busyId={busyRequest}
              error={requestError}
              labels={{ accept: h.accept, decline: h.decline }}
              onAnswer={answerRequest}
            />
          </div>
        </motion.div>

        {/* counters: real figures only */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 [&>*]:min-w-0">
          <StatTile index={0} icon={Users} hue="iris" href="#patients" label={h.statPatients} value={patientsValue} extra={newThisMonth ? h.statNewThisMonth(newThisMonth) : undefined} unavailable={t.common.unavailable} loading={ui.common.loading} />
          <StatTile
            index={1}
            icon={FileText}
            hue="mint"
            label={h.statNotesThisMonth}
            value={notesMonth}
            href="/dashboard/notes"
            chart={notes && now ? <Sparkline id="notes-spark" color={HUE.mint.solid} values={notesPerWeek(notes, now)} /> : undefined}
            unavailable={t.common.unavailable}
            loading={ui.common.loading}
          />
          <StatTile
            index={2}
            icon={CalendarDays}
            hue="amber"
            label={h.statWeekAppointments}
            value={weekCount}
            href="/dashboard/agenda"
            chart={appointments && now ? <Bars color={HUE.amber.solid} values={appointmentsPerWeekday(appointments, now)} highlight={(now.getDay() + 6) % 7} /> : undefined}
            unavailable={t.common.unavailable}
            loading={ui.common.loading}
          />
          <StatTile
            index={3}
            icon={Smartphone}
            hue="sky"
            label={h.statOnMyPhygo}
            value={linkedValue}
            href="#patients"
            extra={patientsValue ? h.statOfTotal(patientsValue) : undefined}
            chart={patientsValue ? <span className="text-ink dark:text-white"><Ring part={linkedCount} total={patientsValue} from="#93D2F7" to="#4AA6E0" /></span> : undefined}
            unavailable={t.common.unavailable}
            loading={ui.common.loading}
          />
        </motion.div>

        <CareAttention patients={loadState === 'ready' ? patients : null} />

        {/* patients */}
        <section id="patients" className="mt-10 scroll-mt-28" aria-labelledby="patients-heading">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="patients-heading" className="font-display text-xl font-bold tracking-tight text-ink dark:text-white">
              {h.patientsHeading}
              {loadState === 'ready' && patients.length > 0 && <span className="ml-2 font-mono text-sm font-medium text-ink/40 dark:text-white/35">{patients.length}</span>}
            </h2>
            {loadState !== 'error' && (patients.length > 0 || loadState === 'loading') && (
              <div className="relative sm:w-80">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 dark:text-white/40" aria-hidden />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={ui.patients.searchPlaceholder}
                  aria-label={ui.patients.searchPlaceholder}
                  className="min-h-[44px] w-full rounded-2xl border border-black/[0.08] bg-white/80 pl-11 pr-4 text-sm text-ink outline-none backdrop-blur-xl transition focus:border-[#8B95FF] focus:ring-4 focus:ring-[#8B95FF]/15 dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
                />
              </div>
            )}
          </div>

          {loadState === 'loading' ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              <span className="sr-only" role="status">{ui.common.loading}</span>
              {[0, 1, 2].map((i) => (
                <Card key={i} className="space-y-3 p-4">
                  <Skeleton className="h-11 w-2/3" />
                  <Skeleton className="h-12" />
                </Card>
              ))}
            </div>
          ) : loadState === 'error' ? (
            <ErrorState title={t.home.loadErrorTitle} message={t.home.loadErrorBody} onRetry={loadPatients} />
          ) : patients.length === 0 ? (
            <Card className="px-6 py-14 text-center">
              <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-black/[0.06] bg-black/[0.03] text-ink/70 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/80">
                <Users size={20} aria-hidden />
              </span>
              <p className="text-ink/70 dark:text-white/60">{ui.patients.noPatientsYet}</p>
              {!locked && !showForm && (
                <button type="button" onClick={toggleForm} className={`mt-5 hidden min-h-[44px] items-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-all sm:inline-flex ${PRIMARY_BTN}`}>
                  <Sparkles size={15} aria-hidden />
                  {t.home.addFirstPatient}
                </button>
              )}
            </Card>
          ) : filteredPatients.length === 0 ? (
            <Card className="px-6 py-14 text-center">
              <p className="break-words text-ink/70 dark:text-white/60">{ui.patients.noPatientsMatch.replace('{search}', search)}</p>
            </Card>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPatients.map((pt, i) => {
                const nx = nextOf?.get(pt.id)
                return (
                  <motion.li key={pt.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 20) * 0.03 }}>
                    <PatientCard
                      id={pt.id}
                      name={pt.name}
                      detail={detailOf(pt)}
                      lastLabel={h.lastSession}
                      last={lastLabelOf(pt.id)}
                      nextLabel={h.nextSession}
                      next={appointments === undefined ? '…' : nx ? `${dayLabel(nx)} ${nx.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}` : '—'}
                      linked={!!pt.patient_user_id}
                      linkedLabel={pt.patient_user_id ? h.myPhygoOn : h.myPhygoOff}
                    />
                  </motion.li>
                )
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
