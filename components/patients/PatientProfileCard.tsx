'use client'

// The patient record on the patient page: identity, contacts, emergency
// contact and clinical background, shown in sections and editable in place.
// Identity and contacts live on the patients row; the emergency contact and the
// clinical background live in patient_details, which only the owning clinician
// can read (sql/2026-10-17_patient_profile_PROPOSED.sql). Row-level security
// decides who reads and writes; the form validates first, the database again.
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ContactRound, Pencil, RotateCcw, Smartphone, Phone, HeartPulse, Users } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { lazy } from '@/lib/lazy'
import { PATIENT_PROFILE_STRINGS } from '@/lib/i18n/patientProfileStrings'
import {
  DETAIL_FIELDS,
  displayAge,
  formatItalianDate,
  formFromRecord,
  validateProfile,
  type FieldError,
  type PatientDetails,
  type PatientIdentity,
  type ProfileForm,
} from '@/lib/patients/profile'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

export type ProfilePatient = PatientIdentity & { id: string; patient_user_id: string | null }

type Props = {
  patient: ProfilePatient
  locked: boolean
  onSaved: (patient: ProfilePatient) => void
}

const card = 'rounded-[28px] border border-black/[0.09] dark:border-white/10 bg-white/90 dark:bg-white/[0.02] backdrop-blur-xl p-6 sm:p-7'
const inputCls = 'w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] px-3.5 py-2.5 text-sm text-ink dark:text-white placeholder:text-ink/30 dark:placeholder:text-white/25 focus:outline-none focus:border-[#4F7CFF]/60 focus:ring-2 focus:ring-[#4F7CFF]/15 disabled:opacity-50'

// Declared outside the component so that typing in a field never remounts it.
function Field({ label, value, empty }: { label: string; value: string | null | undefined; empty: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-white/35">{label}</dt>
      <dd className={`mt-0.5 text-sm break-words whitespace-pre-line ${value ? 'text-ink dark:text-white' : 'text-ink/35 dark:text-white/30 italic'}`}>
        {value || empty}
      </dd>
    </div>
  )
}

function Section({ icon: Icon, title, children, hint }: { icon: typeof ContactRound; title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.02] p-4 sm:p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
        <Icon size={15} className="text-[#4F7CFF]" />
        {title}
      </h3>
      {hint && <p className="mt-1 text-xs text-ink/50 dark:text-white/40">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function PatientProfileCard({ patient, locked, onSaved }: Props) {
  const { lang } = useLanguage()
  const t = PATIENT_PROFILE_STRINGS[lang] ?? PATIENT_PROFILE_STRINGS.it
  const formId = useId()

  const [details, setDetails] = useState<PatientDetails | null>(null)
  const [detailsStatus, setDetailsStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [editing, setEditing] = useState(false)
  const editingRef = useRef(false)
  editingRef.current = editing
  const [form, setForm] = useState<ProfileForm | null>(null)
  // True only when the form's clinical fields hold the loaded record: the
  // clinical part is never saved from fields that were not filled from it.
  const [detailsInForm, setDetailsInForm] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, FieldError>>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const loadDetails = useCallback(async () => {
    setDetailsStatus('loading')
    const { data, error } = await supabase
      .from('patient_details')
      .select(DETAIL_FIELDS.join(', '))
      .eq('patient_id', patient.id)
      .maybeSingle()
    if (error) {
      console.error('Errore caricamento dettagli paziente:', error.code, error.message)
      setDetailsStatus('error')
      return
    }
    const loaded = (data as PatientDetails | null) ?? null
    setDetails(loaded)
    setDetailsStatus('ready')
    // Loaded while the form is open (Retry after a failed load): its clinical
    // fields were locked and empty, so they take the loaded values now.
    if (editingRef.current) {
      setForm((f) => (f ? { ...f, ...Object.fromEntries(DETAIL_FIELDS.map((k) => [k, loaded?.[k] ?? ''])) } : f))
      setDetailsInForm(true)
    }
  }, [patient.id])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  const startEditing = () => {
    setForm(formFromRecord(patient, details))
    setDetailsInForm(detailsStatus === 'ready')
    setErrors({})
    setMessage(null)
    setEditing(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form || locked) return
    const checked = validateProfile(form)
    if (!checked.ok) {
      setErrors(checked.errors)
      return
    }
    setErrors({})
    setSaving(true)
    setMessage(null)

    const { data: updated, error } = await supabase
      .from('patients')
      .update(checked.patient)
      .eq('id', patient.id)
      .select('*')
      .single()
    if (error || !updated) {
      console.error('Errore salvataggio paziente:', error?.code, error?.message)
      setMessage({ kind: 'error', text: t.saveError })
      setSaving(false)
      return
    }

    // The clinical part is written only if it was loaded (so it is never
    // overwritten with empty fields) and only if there is something to keep.
    let detailsSaved = true
    const hasDetails = DETAIL_FIELDS.some((k) => checked.details[k] !== null)
    if (detailsInForm && detailsStatus === 'ready' && (details || hasDetails)) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: row, error: detailsError } = await supabase
        .from('patient_details')
        .upsert({ patient_id: patient.id, user_id: user?.id, ...checked.details, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
        .select(DETAIL_FIELDS.join(', '))
        .single()
      if (detailsError || !row) {
        console.error('Errore salvataggio dettagli paziente:', detailsError?.code, detailsError?.message)
        detailsSaved = false
      } else {
        setDetails(row as unknown as PatientDetails)
      }
    }

    onSaved(updated as ProfilePatient)
    setSaving(false)
    if (detailsSaved) {
      setEditing(false)
      setMessage({ kind: 'ok', text: t.saved })
    } else {
      setMessage({ kind: 'error', text: t.saveDetailsError })
    }
  }

  const set = (k: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f))

  const age = displayAge(patient)
  const ageText = age ? (age.source === 'birth_date' ? t.ageFromBirth : t.ageRecorded).replace('{age}', String(age.years)) : null
  const genderText = patient.gender === 'male' ? t.genderOptions.male : patient.gender === 'female' ? t.genderOptions.female : null
  const address = [
    [patient.address_street, patient.address_number].filter(Boolean).join(' '),
    [patient.postal_code, patient.city, patient.province ? `(${patient.province})` : ''].filter(Boolean).join(' '),
    patient.country,
  ].filter(Boolean).join(', ')

  const input = (k: keyof ProfileForm, opts: { required?: boolean; type?: string; placeholder?: string; autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; disabled?: boolean } = {}) => {
    const id = `${formId}-${k}`
    const err = errors[k]
    return (
      <div className="min-w-0">
        <label htmlFor={id} className="block text-xs font-semibold text-ink/70 dark:text-white/60 mb-1.5">
          {t.labels[k]}
          {opts.required ? <span className="text-red-500"> *</span> : <span className="font-normal text-ink/40 dark:text-white/30"> ({t.optional})</span>}
        </label>
        <input
          id={id}
          name={k}
          type={opts.type ?? 'text'}
          value={form?.[k] ?? ''}
          onChange={set(k)}
          required={opts.required}
          placeholder={opts.placeholder}
          autoComplete={opts.autoComplete ?? 'off'}
          inputMode={opts.inputMode}
          disabled={opts.disabled}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${id}-error` : undefined}
          className={`${inputCls} ${err ? 'border-red-500/60' : ''}`}
        />
        {err && <p id={`${id}-error`} className="mt-1 text-xs text-red-500">{t.errors[err]}</p>}
      </div>
    )
  }

  const area = (k: keyof PatientDetails, disabled: boolean) => {
    const id = `${formId}-${k}`
    const err = errors[k]
    return (
      <div className="min-w-0 sm:col-span-2">
        <label htmlFor={id} className="block text-xs font-semibold text-ink/70 dark:text-white/60 mb-1.5">
          {t.labels[k]} <span className="font-normal text-ink/40 dark:text-white/30">({t.optional})</span>
        </label>
        <textarea
          id={id}
          name={k}
          rows={3}
          value={form?.[k] ?? ''}
          onChange={set(k)}
          disabled={disabled}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${id}-error` : undefined}
          className={`${inputCls} resize-y`}
        />
        {err && <p id={`${id}-error`} className="mt-1 text-xs text-red-500">{t.errors[err]}</p>}
      </div>
    )
  }

  const detailsError = detailsStatus === 'error' && (
    <div role="alert" data-testid="details-error" className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-3 text-xs text-ink/70 dark:text-white/70 flex flex-wrap items-center gap-3">
      <span className="flex-1 min-w-[12rem]">{editing ? t.detailsLocked : t.loadError}</span>
      <button type="button" onClick={() => loadDetails()} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-white bg-[#4F7CFF] hover:bg-[#3D68E8]">
        <RotateCcw size={12} />
        {t.retry}
      </button>
    </div>
  )

  return (
    <div className={`mb-8 ${card}`} data-testid="patient-profile">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F7CFF]/15 to-[#4F7CFF]/5 text-[#4F7CFF]">
            <ContactRound size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink dark:text-white">{t.heading}</h2>
            <p className="text-xs text-ink/55 dark:text-white/40 mt-0.5">{t.subtitle}</p>
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            disabled={locked || detailsStatus === 'loading'}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold border border-black/10 dark:border-white/10 text-ink/70 dark:text-white/70 hover:border-[#4F7CFF]/40 hover:text-[#4F7CFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Pencil size={13} />
            {t.edit}
          </button>
        )}
      </div>

      {message && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={`mb-4 rounded-xl px-3 py-2 text-xs ${message.kind === 'error' ? 'bg-red-500/[0.06] text-red-600 dark:text-red-400' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}>
          {message.text}
        </p>
      )}

      {!editing ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section icon={ContactRound} title={t.sections.identity}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field empty={t.notProvided} label={t.labels.first_name} value={patient.first_name || (patient.last_name ? null : patient.name)} />
              <Field empty={t.notProvided} label={t.labels.last_name} value={patient.last_name} />
              <Field empty={t.notProvided} label={t.labels.birth_date} value={formatItalianDate(patient.birth_date) || null} />
              <Field empty={t.notProvided} label={t.labels.age} value={ageText} />
              <Field empty={t.notProvided} label={t.labels.gender} value={genderText} />
              <Field empty={t.notProvided} label={t.labels.main_condition} value={patient.main_condition} />
            </dl>
          </Section>
          <Section icon={Phone} title={t.sections.contacts} hint={t.accountNote}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field empty={t.notProvided} label={t.labels.phone} value={patient.phone} />
              <Field empty={t.notProvided} label={t.labels.contact_email} value={patient.contact_email} />
              <div className="sm:col-span-2"><Field empty={t.notProvided} label={t.labels.address_street} value={address || null} /></div>
            </dl>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink/55 dark:text-white/40">
              <Smartphone size={12} />
              {patient.patient_user_id ? t.accountLinked : t.accountNotLinked}
            </p>
          </Section>
          <Section icon={Users} title={t.sections.emergency}>
            {detailsStatus === 'error' ? detailsError : detailsStatus === 'loading' ? null : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field empty={t.notProvided} label={t.labels.emergency_contact_name} value={details?.emergency_contact_name} />
                <Field empty={t.notProvided} label={t.labels.emergency_contact_relation} value={details?.emergency_contact_relation} />
                <Field empty={t.notProvided} label={t.labels.emergency_contact_phone} value={details?.emergency_contact_phone} />
              </dl>
            )}
          </Section>
          <Section icon={HeartPulse} title={t.sections.clinical} hint={t.clinicalHint}>
            {detailsStatus === 'error' ? detailsError : detailsStatus === 'loading' ? null : (
              <dl className="grid grid-cols-1 gap-4">
                <Field empty={t.notProvided} label={t.labels.medical_history} value={details?.medical_history} />
                <Field empty={t.notProvided} label={t.labels.past_surgeries} value={details?.past_surgeries} />
                <Field empty={t.notProvided} label={t.labels.medications} value={details?.medications} />
                <Field empty={t.notProvided} label={t.labels.allergies} value={details?.allergies} />
                <Field empty={t.notProvided} label={t.labels.rehab_precautions} value={details?.rehab_precautions} />
              </dl>
            )}
          </Section>
        </div>
      ) : (
        <form onSubmit={save} noValidate className="space-y-4" aria-label={t.heading}>
          <p className="text-xs text-ink/55 dark:text-white/40">{t.requiredHint}</p>
          <Section icon={ContactRound} title={t.sections.identity}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {input('first_name', { required: true, autoComplete: 'off' })}
              {input('last_name', { required: true, autoComplete: 'off' })}
              {input('birth_date', { placeholder: t.birthDateFormat, inputMode: 'numeric' })}
              <div className="min-w-0">
                <label htmlFor={`${formId}-gender`} className="block text-xs font-semibold text-ink/70 dark:text-white/60 mb-1.5">
                  {t.labels.gender} <span className="font-normal text-ink/40 dark:text-white/30">({t.optional})</span>
                </label>
                <select id={`${formId}-gender`} name="gender" value={form?.gender ?? ''} onChange={set('gender')} className={inputCls}>
                  <option value="">{t.genderOptions.none}</option>
                  <option value="male">{t.genderOptions.male}</option>
                  <option value="female">{t.genderOptions.female}</option>
                </select>
              </div>
              <div className="sm:col-span-2">{input('main_condition')}</div>
            </div>
          </Section>
          <Section icon={Phone} title={t.sections.contacts} hint={t.accountNote}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {input('phone', { type: 'tel', inputMode: 'tel' })}
              {input('contact_email', { type: 'email', inputMode: 'email' })}
              {input('address_street')}
              {input('address_number')}
              {input('postal_code', { inputMode: 'numeric' })}
              {input('city')}
              {input('province')}
              {input('country')}
            </div>
          </Section>
          <Section icon={Users} title={t.sections.emergency}>
            {detailsError}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {input('emergency_contact_name', { disabled: detailsStatus !== 'ready' })}
              {input('emergency_contact_relation', { disabled: detailsStatus !== 'ready' })}
              {input('emergency_contact_phone', { type: 'tel', inputMode: 'tel', disabled: detailsStatus !== 'ready' })}
            </div>
          </Section>
          <Section icon={HeartPulse} title={t.sections.clinical} hint={t.clinicalHint}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {area('medical_history', detailsStatus !== 'ready')}
              {area('past_surgeries', detailsStatus !== 'ready')}
              {area('medications', detailsStatus !== 'ready')}
              {area('allergies', detailsStatus !== 'ready')}
              {area('rehab_precautions', detailsStatus !== 'ready')}
            </div>
          </Section>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => { setEditing(false); setErrors({}); setMessage(null) }}
              disabled={saving}
              className="rounded-full px-5 py-2.5 text-sm font-semibold border border-black/10 dark:border-white/10 text-ink/70 dark:text-white/70"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving || locked}
              className="rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
            >
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
