'use client'

import { createBrowserClient } from '@supabase/ssr'
import { usePathname, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { LogOut } from 'lucide-react'
import { lazy } from '@/lib/lazy'
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext'
import { useEntryLang, useSetEntryLang } from '@/lib/i18n/useEntryLang'
import Link from 'next/link'
import BrandMark from './BrandMark'
import LanguageMenu from './LanguageMenu'
import { MyAvatar, useMyProfile } from './myPhygo/MyProfileContext'
import { useMyPhygoStrings } from '@/lib/i18n/myPhygoStrings'

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
))

// On the sign-in and invitation pages the language lives in the URL (as on
// the professional login); inside the portal it is the patient's account
// preference, saved to their profile.
function EntryLanguageMenu() {
  return <LanguageMenu value={useEntryLang()} onChange={useSetEntryLang()} />
}

// The patient's photo (or initials): the way into their profile page.
function ProfileLink() {
  const { profile, email, photoUrl } = useMyProfile()
  const label = useMyPhygoStrings().profile.navLabel
  return (
    <Link
      href="/my-phygo/profile"
      aria-label={label}
      title={label}
      data-testid="portal-profile-link"
      className="ml-1 rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B95FF]"
    >
      <MyAvatar name={profile?.displayName || email} photoUrl={photoUrl} size={32} />
    </Link>
  )
}

function AccountLanguageMenu() {
  const { lang, setLang } = useLanguage()
  return <LanguageMenu value={lang} onChange={setLang} />
}

export default function PortalNavbar() {
  const router = useRouter()
  const ui = useUiStrings()
  const pathname = usePathname() ?? ''
  const isEntry = pathname.startsWith('/my-phygo/login') || pathname.startsWith('/my-phygo/join')

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/my-phygo/login')
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4">
      <nav className="w-full max-w-2xl flex items-center justify-between rounded-2xl border border-black/[0.06] bg-white/80 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_44px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:px-6 dark:border-white/[0.07] dark:bg-[#0b0c10]/70 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <Link href="/my-phygo/home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B95FF]">
          <BrandMark prefix="My" />
        </Link>

        <div className="flex items-center gap-1">
          {isEntry ? (
            <Suspense fallback={null}>
              <EntryLanguageMenu />
            </Suspense>
          ) : (
            <AccountLanguageMenu />
          )}
          <button
            onClick={handleSignOut}
            aria-label={ui.nav.signOut}
            title={ui.nav.signOut}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 hover:text-ink hover:bg-ink/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} />
          </button>
          {!isEntry && <ProfileLink />}
        </div>
      </nav>
    </header>
  )
}