import { PatientProvider } from '@/contexts/PatientContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PatientProvider>{children}</PatientProvider>
}
