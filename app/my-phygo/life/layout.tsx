import { LanguageProvider } from '@/contexts/LanguageContext'

// Il resto del portale My PHYGO e' oggi hardcoded in inglese (nessun
// LanguageProvider su app/my-phygo), ma Phygo Life deve rispettare le 4
// lingue del sito come richiesto esplicitamente per questa feature — quindi
// avvolge solo questo sottoalbero con lo stesso provider gia' usato da
// app/dashboard, senza toccare le altre pagine del portale paziente.
export default function LifeLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>
}
