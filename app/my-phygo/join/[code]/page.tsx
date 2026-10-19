'use client'

import { Suspense, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Smartphone } from 'lucide-react'
import { useEntryLang } from '@/lib/i18n/useEntryLang'
import { ENTRY_STRINGS, localizeAuthError } from '@/lib/i18n/entryStrings'
import { myPhygoLoginHref } from '@/lib/i18n/landingStrings'
import { lazy } from '@/lib/lazy'
import { rememberLanguage } from '@/lib/i18n/rememberLanguage'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

export default function JoinInvitePage() {
  return (
    <Suspense fallback={null}>
      <JoinInvite />
    </Suspense>
  )
}

function JoinInvite() {
  const lang = useEntryLang()
  const t = ENTRY_STRINGS[lang].portal
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // If the sign-in service cannot be reached (or is not configured, as in
    // Vercel Previews), say so instead of leaving the button on "Please wait".
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password })

      if (signUpError) {
        setError(signUpError.name === 'AuthRetryableFetchError'
          ? ENTRY_STRINGS[lang].login.serviceUnavailable
          : localizeAuthError(signUpError.message, ENTRY_STRINGS[lang].login))
        setLoading(false)
        return
      }

      const { error: redeemError } = await supabase.rpc('redeem_patient_invite', {
        invite_code: code,
      })

      if (redeemError) {
        setError(t.inviteInvalid)
        setLoading(false)
        return
      }

      await rememberLanguage(supabase, lang)
      router.push('/my-phygo/home')
    } catch (err) {
      console.error('Sign-in unavailable:', err instanceof Error ? err.message : err)
      setError(ENTRY_STRINGS[lang].login.serviceUnavailable)
      setLoading(false)
    }
  }

  return (
    <div className="relative max-w-sm mx-auto pt-40 pb-20 px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/75 mb-6">
        <Smartphone size={22} />
      </div>

      <h1 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-white mb-2">
        {t.joinTitle}
      </h1>
      <p className="text-sm text-ink/60 dark:text-white/50 mb-8">
        {t.joinSub}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="join-email" className="text-sm font-medium text-ink/60 dark:text-white/55">{t.email}</label>
          <input
            id="join-email"
            autoComplete="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#8B95FF] focus:ring-4 focus:ring-[#8B95FF]/15 text-ink dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="join-password" className="text-sm font-medium text-ink/60 dark:text-white/55">{t.password}</label>
          <input
            id="join-password"
            autoComplete="new-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#8B95FF] focus:ring-4 focus:ring-[#8B95FF]/15 text-ink dark:text-white"
          />
        </div>

        {error && <p role="alert" className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 transition-transform disabled:opacity-60"
          
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? t.creating : t.create}
        </button>
      </form>

      <p className="text-xs text-ink/55 dark:text-white/40 mt-6 text-center">
        {t.haveAccount}{' '}
        <a href={myPhygoLoginHref(lang)} className="text-[#5B63E6] dark:text-[#A5B4FF] font-medium hover:underline">
          {t.signIn}
        </a>
      </p>
    </div>
  )
}