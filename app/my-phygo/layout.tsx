import PortalNavbar from '@/components/PortalNavbar'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { PageBackdrop } from '@/components/ui/premium'

// The whole patient portal follows the app's 4 languages: the same provider
// as app/dashboard (the "phygo-lang" preference, then profiles.preferred_language).
// My Phygo login/join keep their own ENTRY_STRINGS language (useEntryLang).
export default function MyPhygoLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#f7f7f8] dark:bg-[#050608] transition-colors">
        <PageBackdrop />
        <PortalNavbar />
        <main id="main-content" className="relative">{children}</main>
      </div>
    </LanguageProvider>
  )
}
