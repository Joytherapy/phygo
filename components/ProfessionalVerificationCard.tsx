'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck, Clock, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
import { useVerificationStrings, type VerificationStatusKey } from '@/lib/i18n/verificationStrings'
import { useLanguage } from '@/contexts/LanguageContext'

// Profile card for professional verification. The status comes from the
// server and can only be changed by PHYGO; this card only submits the
// registration details through /api/profile/verification.

type Verification = {
  status: VerificationStatusKey
  practiceStage: 'student' | 'professional'
  registryCountry: string | null
  registryName: string | null
  registrationNumber: string | null
  message: string | null
  transitionUntil: string | null
}

const STATUS_STYLE: Record<VerificationStatusKey, string> = {
  not_applicable: 'bg-ink/[0.06] text-ink/70 dark:bg-white/[0.08] dark:text-white/70',
  pending: 'bg-amber-400/15 text-amber-800 dark:text-amber-300',
  needs_info: 'bg-amber-400/15 text-amber-800 dark:text-amber-300',
  verified: 'bg-[#32D6A0]/15 text-emerald-800 dark:text-[#5EE5B8]',
  rejected: 'bg-red-500/10 text-red-700 dark:text-red-300',
}

const inputClass =
  'w-full mt-1.5 rounded-xl border bg-white/85 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white'

export type VerificationSummary = { status: VerificationStatusKey; practiceStage: 'student' | 'professional' }

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
  const [form, setForm] = useState({ registryCountry: '', registryName: '', registrationNumber: '' })
  const [invalid, setInvalid] = useState<string[]>([])
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
          registryCountry: v.registryCountry ?? '',
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

  async function submit() {
    setState('saving')
    setInvalid([])
    try {
      const res = await fetch('/api/profile/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const body = await res.json().catch(() => ({}))
      if (res.status === 400) {
        setInvalid(body.fields ?? [])
        setState('error')
        return
      }
      if (!res.ok) {
        setState('unavailable')
        return
      }
      setData(body.verification)
      onChange?.({ status: body.verification.status, practiceStage: body.verification.practiceStage })
      setState('saved')
    } catch {
      setState('unavailable')
    }
  }

  const status: VerificationStatusKey = data?.status ?? 'not_applicable'
  const Icon = status === 'verified' ? BadgeCheck : status === 'pending' ? Clock : status === 'not_applicable' ? ShieldCheck : AlertCircle
  const field = (key: keyof typeof form) => `${inputClass} ${invalid.includes(key) ? 'border-red-400' : 'border-black/10 dark:border-white/10'}`

  if (hidden) return null

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
          {data.practiceStage === 'student' && status === 'not_applicable' && (
            <p className="mt-2 text-xs text-ink/60 dark:text-white/55">{t.studentNote}</p>
          )}
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

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <label className="text-sm font-medium text-ink/60 dark:text-white/50">
              {t.countryLabel}
              <input
                value={form.registryCountry}
                onChange={(e) => setForm({ ...form, registryCountry: e.target.value.toUpperCase().slice(0, 2) })}
                maxLength={2}
                autoComplete="country"
                aria-invalid={invalid.includes('registryCountry')}
                className={field('registryCountry')}
              />
            </label>
            <label className="text-sm font-medium text-ink/60 dark:text-white/50">
              {t.registryNameLabel}
              <input
                value={form.registryName}
                onChange={(e) => setForm({ ...form, registryName: e.target.value })}
                maxLength={120}
                placeholder={t.registryNamePlaceholder}
                aria-invalid={invalid.includes('registryName')}
                className={field('registryName')}
              />
            </label>
          </div>
          <p className="mt-1 text-xs text-ink/55 dark:text-white/40">{t.countryHint}</p>
          <label className="mt-3 block text-sm font-medium text-ink/60 dark:text-white/50">
            {t.numberLabel}
            <input
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
              maxLength={40}
              placeholder={t.numberPlaceholder}
              aria-invalid={invalid.includes('registrationNumber')}
              className={field('registrationNumber')}
            />
          </label>
          <p className="mt-2 text-xs text-ink/55 dark:text-white/40">{t.privacy}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={state === 'saving'}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
            >
              {state === 'saving' && <Loader2 size={14} className="animate-spin" aria-hidden />}
              {state === 'saving' ? t.saving : status === 'not_applicable' ? t.submit : t.resubmit}
            </button>
            <p role="status" className="text-sm">
              {state === 'saved' && <span className="text-emerald-700 dark:text-[#5EE5B8]">{t.saved}</span>}
              {state === 'error' && <span className="text-red-600 dark:text-red-300">{t.invalid}</span>}
            </p>
          </div>
        </>
      )}
    </section>
  )
}
