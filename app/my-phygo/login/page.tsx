'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Smartphone } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MyPhygoLoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Incorrect email or password. Please try again.')
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
        Welcome back
      </h1>
      <p className="text-sm text-ink/50 dark:text-white/50 mb-8">
        Sign in to access your My Phygo portal.
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
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}