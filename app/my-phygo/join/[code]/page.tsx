'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Smartphone } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function JoinInvitePage() {
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

    const { error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const { error: redeemError } = await supabase.rpc('redeem_patient_invite', {
      invite_code: code,
    })

    if (redeemError) {
      setError(
        'Your account was created, but this invite link is invalid or expired. Please ask your physiotherapist for a new one.'
      )
      setLoading(false)
      return
    }

    router.push('/my-phygo/home')
  }

  return (
    <div className="relative max-w-sm mx-auto pt-40 pb-20 px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF] mb-6">
        <Smartphone size={22} />
      </div>

      <h1 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-white mb-2">
        Welcome to My Phygo
      </h1>
      <p className="text-sm text-ink/50 dark:text-white/50 mb-8">
        Your physiotherapist has invited you. Create your account to access your treatment plan, session history, and more.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-ink/50 dark:text-white/50">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink/50 dark:text-white/50">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-4 py-3 outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105 disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Creating your account...' : 'Create account'}
        </button>
      </form>

      <p className="text-xs text-ink/40 dark:text-white/40 mt-6 text-center">
        Already have an account?{' '}
        <a href="/my-phygo/login" className="text-[#4F7CFF] font-medium hover:underline">
          Sign in
        </a>
      </p>
    </div>
  )
}