import { PatientProvider } from '@/contexts/PatientContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AskProvider } from '@/contexts/AskContext'
import { RoleThemeProvider } from '@/contexts/RoleThemeContext'
import { StudyPanelProvider } from '@/contexts/StudyPanelContext'
import GlobalAskLauncher from '@/components/workspace/GlobalAskLauncher'
import StudyPanel from '@/components/workspace/StudyPanel'

// AskProvider + GlobalAskLauncher make "Ask PHYGO" a site-wide feature
// (floating button + slide-over panel, on every dashboard page) instead of
// something that only existed inside the PDF reader — see
// contexts/AskContext.tsx for the full story.
//
// RoleThemeProvider sets html[data-role] from profiles.practice_stage so
// CSS across the dashboard can read var(--brand-from)/var(--brand-to) for a
// Student vs Professional accent — see app/globals.css and
// contexts/RoleThemeContext.tsx.
//
// StudyPanelProvider + <StudyPanel/> mount the PHYGO Smart Study Panel the
// same way — one shared instance, one shared open/closed state, reachable
// from any page (in practice: from PdfViewer's TextSelectionPopup) without
// the document page needing to render or manage the panel itself. See
// contexts/StudyPanelContext.tsx.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <RoleThemeProvider>
        <PatientProvider>
          <AskProvider>
            <StudyPanelProvider>
              {children}
              <GlobalAskLauncher />
              <StudyPanel />
            </StudyPanelProvider>
          </AskProvider>
        </PatientProvider>
      </RoleThemeProvider>
    </LanguageProvider>
  )
}
