'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Smartphone } from 'lucide-react'
import { useEntryLang } from '@/lib/i18n/useEntryLang'
import { ENTRY_STRINGS } from '@/lib/i18n/entryStrings'
import { loginHref } from '@/lib/i18n/landingStrings'
import { lazy } from '@/lib/lazy'
import { rememberLanguage } from '@/lib/i18n/rememberLanguage'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

export default function MyPhygoLoginPage() {
  return (
    <Suspense fallback={null}>
      <MyPhygoLogin />
    </Suspense>
  )
}

function MyPhygoLogin() {
  const router = useRouter()
  const lang = useEntryLang()
  const t = ENTRY_STRINGS[lang].portal

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
    let signInError: unknown = null
    try {
      signInError = (await supabase.auth.signInWithPassword({ email, password })).error
    } catch (err) {
      console.error('Sign-in unavailable:', err instanceof Error ? err.message : err)
      setError(ENTRY_STRINGS[lang].login.serviceUnavailable)
      setLoading(false)
      return
    }

    if (signInError) {
      setError((signInError as { name?: string }).name === 'AuthRetryableFetchError' ? ENTRY_STRINGS[lang].login.serviceUnavailable : t.loginError)
      setLoading(false)
      return
    }

    await rememberLanguage(supabase, lang)
    router.push('/my-phygo/home')
  }

  return (
    <div className="relative max-w-sm mx-auto pt-40 pb-20 px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/75 mb-6">
        <Smartphone size={22} />
      </div>

      <h1 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-white mb-2">
        {t.loginTitle}
      </h1>
      <p className="text-sm text-ink/60 dark:text-white/50 mb-8">
        {t.loginSub}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="portal-email" className="text-sm font-medium text-ink/60 dark:text-white/55">{t.email}</label>
          <input
            id="portal-email"
            autoComplete="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#8B95FF] focus:ring-4 focus:ring-[#8B95FF]/15 text-ink dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="portal-password" className="text-sm font-medium text-ink/60 dark:text-white/55">{t.password}</label>
          <input
            id="portal-password"
            autoComplete="current-password"
            type="password"
            required
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
          {loading ? t.signingIn : t.signIn}
        </button>
      </form>

      <p className="mt-8 text-center text-xs leading-relaxed text-ink/60 dark:text-white/55">{t.noAccountHint}</p>
      <p className="mt-3 text-center text-xs">
        <a href={loginHref(lang)} className="font-medium text-[#5B63E6] dark:text-[#A5B4FF] hover:underline">
          {t.professionalLink}
        </a>
      </p>
    </div>
  )
}