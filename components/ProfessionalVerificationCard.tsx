'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck, Clock, AlertCircle, Loader2, ShieldCheck, FileText, ShieldAlert } from 'lucide-react'
import { useVerificationStrings, type VerificationStatusKey } from '@/lib/i18n/verificationStrings'
import { useLanguage } from '@/contexts/LanguageContext'

// Profile card for professional verification. The status comes from the
// server and can only be changed by PHYGO; this card only submits a request
// (legal name, registration number, territorial Order and a proof of
// registration) through /api/profile/verification. Sending a document grants
// nothing: an administrator checks it against the official register by hand.

// Must match DECLARATION_VERSION in lib/verificationEvidence.ts.
const DECLARATION_VERSION = '2026-10-12.v1'
const MAX_BYTES = 4 * 1024 * 1024
const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

type Verification = {
  status: VerificationStatusKey
  practiceStage: 'student' | 'professional'
  registryCountry: string | null
  registryName: string | null
  registrationNumber: string | null
  message: string | null
  transitionUntil: string | null
  request: {
    status: string
    legalFirstName: string
    legalLastName: string
    submittedAt: string
    hasDocument: boolean
    documentDeleted: boolean
    message: string | null
  } | null
}

export type VerificationSummary = { status: VerificationStatusKey; practiceStage: 'student' | 'professional' }

const STATUS_STYLE: Record<VerificationStatusKey, string> = {
  not_applicable: 'bg-ink/[0.06] text-ink/70 dark:bg-white/[0.08] dark:text-white/70',
  pending: 'bg-amber-400/15 text-amber-800 dark:text-amber-300',
  needs_info: 'bg-amber-400/15 text-amber-800 dark:text-amber-300',
  verified: 'bg-[#32D6A0]/15 text-emerald-800 dark:text-[#5EE5B8]',
  rejected: 'bg-red-500/10 text-red-700 dark:text-red-300',
}

const inputClass =
  'w-full mt-1.5 rounded-xl border bg-white/85 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white'

type Form = { legalFirstName: string; legalLastName: string; registryCountry: string; registryName: string; registrationNumber: string }

/**
 * onChange: called with the status when it loads and after each submission,
 * so the page can show the badge next to the profile photo.
 * hidden: keeps the card mounted (it still loads the status) without
 * rendering it; the page hides it once the account is verified.
 */
export default function ProfessionalVerificationCard({
  onChange,
  hidden = false,
}: {
  onChange?: (v: VerificationSummary) => void
  hidden?: boolean
} = {}) {
  const t = useVerificationStrings()
  const { lang } = useLanguage()
  const [data, setData] = useState<Verification | null>(null)
  const [form, setForm] = useState<Form>({ legalFirstName: '', legalLastName: '', registryCountry: 'IT', registryName: '', registrationNumber: '' })
  const [file, setFile] = useState<File | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [invalid, setInvalid] = useState<string[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [state, setState] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'unavailable'>('loading')

  useEffect(() => {
    let cancelled = false
    fetch('/api/profile/verification')
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status))
        const body = await res.json()
        if (cancelled) return
        const v = body.verification as Verification
        setData(v)
        onChange?.({ status: v.status, practiceStage: v.practiceStage })
        setForm({
          legalFirstName: v.request?.legalFirstName ?? '',
          legalLastName: v.request?.legalLastName ?? '',
          registryCountry: v.registryCountry ?? 'IT',
          registryName: v.registryName ?? '',
          registrationNumber: v.registrationNumber ?? '',
        })
        setState('idle')
      })
      .catch(() => !cancelled && setState('unavailable'))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Client-side checks only help the user; the server checks everything again.
  function review() {
    const missing: string[] = []
    if (!form.legalFirstName.trim()) missing.push('legalFirstName')
    if (!form.legalLastName.trim()) missing.push('legalLastName')
    if (!/^[A-Z]{2}$/.test(form.registryCountry)) missing.push('registryCountry')
    if (form.registryName.trim().length < 2) missing.push('registryName')
    if (!form.registrationNumber.trim()) missing.push('registrationNumber')
    let fe: string | null = null
    if (!file) fe = t.documentMissing
    else if (file.size > MAX_BYTES) fe = t.documentTooLarge
    else if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) fe = t.documentType
    if (!accepted) missing.push('declaration')
    setInvalid(missing)
    setFileError(fe)
    if (missing.length || fe) {
      setState('error')
      return
    }
    setState('idle')
    setStep('review')
  }

  async function submit() {
    if (!file) return
    setState('saving')
    const body = new FormData()
    Object.entries(form).forEach(([k, v]) => body.append(k, v))
    body.append('declarationAccepted', 'true')
    body.append('declarationVersion', DECLARATION_VERSION)
    body.append('document', file)
    try {
      const res = await fetch('/api/profile/verification', { method: 'POST', body })
      const json = await res.json().catch(() => ({}))
      if (res.status === 400 || res.status === 413) {
        setInvalid(json.fields ?? [])
        setFileError(json.code === 'document_too_large' ? t.documentTooLarge : json.code === 'document_type' ? t.documentType : json.code === 'document_missing' ? t.documentMissing : null)
        setStep('form')
        setState('error')
        return
      }
      if (!res.ok) {
        setState('unavailable')
        return
      }
      const v = json.verification as Verification
      setData(v)
      onChange?.({ status: v.status, practiceStage: v.practiceStage })
      setFile(null)
      setAccepted(false)
      setStep('form')
      setState('saved')
    } catch {
      setState('unavailable')
    }
  }

  async function openOwnDocument() {
    const res = await fetch('/api/profile/verification/document')
    const json = await res.json().catch(() => ({}))
    if (res.ok && json.url) window.open(json.url, '_blank', 'noopener,noreferrer')
  }

  if (hidden) return null

  const status: VerificationStatusKey = data?.status ?? 'not_applicable'
  const Icon = status === 'verified' ? BadgeCheck : status === 'pending' ? Clock : status === 'not_applicable' ? ShieldCheck : AlertCircle
  const field = (key: string) => `${inputClass} ${invalid.includes(key) ? 'border-red-400' : 'border-black/10 dark:border-white/10'}`
  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: key === 'registryCountry' ? e.target.value.toUpperCase().slice(0, 2) : e.target.value })

  return (
    <section id="professional-verification" aria-labelledby="verification-title" className="rounded-2xl border border-[#4F7CFF]/20 bg-[#4F7CFF]/[0.04] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="verification-title" className="text-sm font-semibold text-ink dark:text-white flex items-center gap-1.5">
          <ShieldCheck size={15} className="text-[#4F7CFF]" />
          {t.title}
        </h2>
        {state !== 'loading' && state !== 'unavailable' && (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>
            <Icon size={12} aria-hidden />
            {t.status[status]}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-ink/70 dark:text-white/70">{t.intro}</p>

      {state === 'loading' && <Loader2 size={16} className="mt-4 animate-spin text-ink/40" aria-hidden />}
      {state === 'unavailable' && <p className="mt-4 text-sm text-red-600 dark:text-red-300">{t.unavailable}</p>}

      {data && state !== 'loading' && (
        <>
          <p className="mt-3 text-sm text-ink/80 dark:text-white/75">{t.statusHelp[status]}</p>
          {status !== 'verified' && <p className="mt-2 text-xs text-ink/60 dark:text-white/55">{t.unlocks}</p>}
          {data.transitionUntil && (
            <p className="mt-2 rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
              {t.transition.replace('{date}', new Date(data.transitionUntil).toLocaleDateString(lang, { dateStyle: 'long' }))}
            </p>
          )}
          {data.message && (status === 'needs_info' || status === 'rejected') && (
            <div className="mt-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] p-3">
              <p className="text-xs font-semibold text-ink/70 dark:text-white/65">{t.reviewerMessage}</p>
              <p className="mt-1 text-sm text-ink dark:text-white whitespace-pre-line">{data.message}</p>
            </div>
          )}
          {data.request && (data.request.hasDocument || data.request.documentDeleted) && (
            <p className="mt-3 text-xs text-ink/60 dark:text-white/55">
              {data.request.hasDocument ? (
                <button type="button" onClick={openOwnDocument} className="inline-flex items-center gap-1 font-semibold text-[#4F7CFF] hover:underline">
                  <FileText size={12} aria-hidden />
                  {t.viewDocument}
                </button>
              ) : (
                t.documentRemoved
              )}
            </p>
          )}

          {step === 'form' ? (
            <>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-ink/60 dark:text-white/50">
                  {t.legalFirstNameLabel}
                  <input value={form.legalFirstName} onChange={set('legalFirstName')} maxLength={80} autoComplete="given-name" aria-invalid={invalid.includes('legalFirstName')} className={field('legalFirstName')} />
                </label>
                <label className="text-sm font-medium text-ink/60 dark:text-white/50">
                  {t.legalLastNameLabel}
                  <input value={form.legalLastName} onChange={set('legalLastName')} maxLength={80} autoComplete="family-name" aria-invalid={invalid.includes('legalLastName')} className={field('legalLastName')} />
                </label>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <label className="text-sm font-medium text-ink/60 dark:text-white/50">
                  {t.countryLabel}
                  <input value={form.registryCountry} onChange={set('registryCountry')} maxLength={2} autoComplete="country" aria-invalid={invalid.includes('registryCountry')} className={field('registryCountry')} />
                </label>
                <label className="text-sm font-medium text-ink/60 dark:text-white/50">
                  {t.orderLabel}
                  <input value={form.registryName} onChange={set('registryName')} maxLength={120} placeholder={t.orderPlaceholder} aria-invalid={invalid.includes('registryName')} className={field('registryName')} />
                </label>
              </div>
              <p className="mt-1 text-xs text-ink/55 dark:text-white/40">{t.countryHint}</p>
              <label className="mt-3 block text-sm font-medium text-ink/60 dark:text-white/50">
                {t.numberLabel}
                <input value={form.registrationNumber} onChange={set('registrationNumber')} maxLength={40} placeholder={t.numberPlaceholder} aria-invalid={invalid.includes('registrationNumber')} className={field('registrationNumber')} />
              </label>

              <label className="mt-4 block text-sm font-medium text-ink/60 dark:text-white/50">
                {t.documentLabel}
                <input
                  type="file"
                  accept={ACCEPT}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  aria-invalid={!!fileError}
                  className={`${inputClass} ${fileError ? 'border-red-400' : 'border-black/10 dark:border-white/10'} file:mr-3 file:rounded-full file:border-0 file:bg-[#4F7CFF]/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#4F7CFF]`}
                />
              </label>
              <p className="mt-1 text-xs text-ink/55 dark:text-white/40">{t.documentHint}</p>
              {fileError && <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fileError}</p>}
              <p className="mt-3 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
                {t.documentWarning}
              </p>

              <fieldset className={`mt-4 rounded-xl border p-3 ${invalid.includes('declaration') ? 'border-red-400' : 'border-black/10 dark:border-white/10'}`}>
                <legend className="px-1 text-xs font-semibold text-ink/70 dark:text-white/65">{t.declarationTitle}</legend>
                <p className="text-xs leading-relaxed text-ink/75 dark:text-white/70">{t.declarationText}</p>
                <label className="mt-2 flex items-start gap-2 text-sm text-ink dark:text-white">
                  <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1" />
                  {t.declarationAccept}
                </label>
                {invalid.includes('declaration') && <p className="mt-1 text-xs text-red-600 dark:text-red-300">{t.declarationRequired}</p>}
              </fieldset>
              <p className="mt-2 text-xs">
                <a href="/privacy#professional-verification" target="_blank" rel="noopener" className="font-semibold text-[#4F7CFF] hover:underline">
                  {t.privacyLink}
                </a>
              </p>
              <p className="mt-2 text-xs text-ink/55 dark:text-white/40">{t.privacy}</p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={review}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
                >
                  {t.continue}
                </button>
                <p role="status" className="text-sm">
                  {state === 'saved' && <span className="text-emerald-700 dark:text-[#5EE5B8]">{t.saved}</span>}
                  {state === 'error' && <span className="text-red-600 dark:text-red-300">{t.invalid}</span>}
                </p>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-[#4F7CFF]/25 bg-white/80 dark:bg-white/[0.03] p-4" aria-live="polite">
              <p className="text-sm font-semibold text-ink dark:text-white">{t.reviewTitle}</p>
              <p className="mt-1 text-xs text-ink/60 dark:text-white/55">{t.reviewHint}</p>
              <dl className="mt-3 grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-ink/55 dark:text-white/45">{t.legalFirstNameLabel}</dt><dd className="text-ink dark:text-white">{form.legalFirstName}</dd>
                <dt className="text-ink/55 dark:text-white/45">{t.legalLastNameLabel}</dt><dd className="text-ink dark:text-white">{form.legalLastName}</dd>
                <dt className="text-ink/55 dark:text-white/45">{t.countryLabel}</dt><dd className="text-ink dark:text-white">{form.registryCountry}</dd>
                <dt className="text-ink/55 dark:text-white/45">{t.orderLabel}</dt><dd className="text-ink dark:text-white">{form.registryName}</dd>
                <dt className="text-ink/55 dark:text-white/45">{t.numberLabel}</dt><dd className="font-mono text-ink dark:text-white">{form.registrationNumber}</dd>
                <dt className="text-ink/55 dark:text-white/45">{t.fileLabel}</dt><dd className="text-ink dark:text-white break-all">{file?.name} · {file ? Math.ceil(file.size / 1024) : 0} KB</dd>
                <dt className="text-ink/55 dark:text-white/45">{t.declarationTitle}</dt><dd className="text-ink dark:text-white">✓ {DECLARATION_VERSION}</dd>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => setStep('form')} disabled={state === 'saving'} className="rounded-full border border-black/10 dark:border-white/15 px-4 py-2 text-sm font-semibold text-ink/70 dark:text-white/70 disabled:opacity-60">
                  {t.edit}
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={state === 'saving'}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
                >
                  {state === 'saving' && <Loader2 size={14} className="animate-spin" aria-hidden />}
                  {state === 'saving' ? t.saving : t.sendRequest}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
