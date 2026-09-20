'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PortalNavbar() {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/my-phygo/login')
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4">
      <nav className="w-full max-w-2xl flex items-center justify-between rounded-xl2 px-4 sm:px-6 py-3 glass-strong shadow-soft">
        <div className="flex items-center gap-2.5 font-display font-semibold text-lg tracking-tight text-ink dark:text-white">
          <img
            src="/logo-mark.png"
            alt="Phygo"
            className="h-10 w-10 rounded-lg object-cover shadow-soft"
          />
          My Phygo
        </div>

        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 hover:text-ink hover:bg-ink/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </nav>
    </header>
  )
}