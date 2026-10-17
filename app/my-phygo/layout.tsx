import PortalNavbar from '@/components/PortalNavbar'
import { LanguageProvider } from '@/contexts/LanguageContext'

// The whole patient portal follows the app's 4 languages: the same provider
// as app/dashboard (the "phygo-lang" preference, then profiles.preferred_language).
// My Phygo login/join keep their own ENTRY_STRINGS language (useEntryLang).
export default function MyPhygoLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="relative min-h-screen bg-[#f6f7f9] dark:bg-[#08090b] transition-colors">
        <PortalNavbar />
        <main id="main-content">{children}</main>
      </div>
    </LanguageProvider>
  )
}
