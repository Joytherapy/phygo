'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Flame, ArrowRight, ArrowLeft } from 'lucide-react'
import { useUiStrings } from '@/contexts/LanguageContext'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Hub "Phygo Life" — oggi ospita solo il Profilo Metabolico, ma e' pensato
// per crescere (passi, allenamenti, sonno, wearable — vedi §15 del brief)
// senza dover cambiare questa pagina: basta aggiungere altre card.
export default function MyPhygoLifePage() {
  const router = useRouter()
  const ui = useUiStrings().myPhygoLife
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/my-phygo/login')
        return
      }
      setChecking(false)
    })
  }, [router])

  if (checking) {
    return <div className="relative pt-40 text-center text-ink/40 dark:text-white/40">…</div>
  }

  return (
    <div className="relative max-w-2xl mx-auto pt-40 pb-24 px-6">
      <a
        href="/my-phygo/home"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={13} />
        {ui.backToHome}
      </a>

      <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#6366F1] mb-2">{ui.badge}</p>
      <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white mb-2">{ui.heading}</h1>
      <p className="text-sm text-ink/50 dark:text-white/50 mb-10">{ui.subtitle}</p>

      <a
        href="/my-phygo/life/metabolic"
        className="flex items-center justify-between rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 hover:border-[#6366F1]/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6366F1]/10 text-[#6366F1]">
            <Flame size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink dark:text-white">{ui.metabolicCardTitle}</p>
            <p className="text-xs text-ink/40 dark:text-white/40">{ui.metabolicCardSubtitle}</p>
          </div>
        </div>
        <ArrowRight size={16} className="text-ink/30 dark:text-white/30 group-hover:translate-x-1 transition-transform" />
      </a>
    </div>
  )
}
