import { PatientProvider } from '@/contexts/PatientContext'
import { LanguageProvider } from '@/contexts/LanguageContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <PatientProvider>{children}</PatientProvider>
    </LanguageProvider>
  )
}
