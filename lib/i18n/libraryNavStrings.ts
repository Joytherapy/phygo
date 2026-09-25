// Small, additive dictionary for the "Library" nav dropdown's new
// category/search UI (see components/LibraryNavMenu.tsx) — kept as its own
// file rather than appended into the large shared lib/i18n/uiStrings.ts,
// same convention already used for Workspace/Agenda/Role copy this session.
'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { AppLang } from '@/lib/i18n/uiStrings'

interface LibraryNavDict {
  searchPlaceholder: string
  noResults: string
  categories: {
    bodySystems: string
    anatomyMovement: string
    emergencyTools: string
  }
}

const it: LibraryNavDict = {
  searchPlaceholder: 'Cerca una sezione…',
  noResults: 'Nessuna sezione trovata.',
  categories: {
    bodySystems: 'Sistemi corporei',
    anatomyMovement: 'Anatomia & Movimento',
    emergencyTools: 'Emergenza & Strumenti',
  },
}

const en: LibraryNavDict = {
  searchPlaceholder: 'Search a section…',
  noResults: 'No sections found.',
  categories: {
    bodySystems: 'Body Systems',
    anatomyMovement: 'Anatomy & Movement',
    emergencyTools: 'Emergency & Tools',
  },
}

const es: LibraryNavDict = {
  searchPlaceholder: 'Buscar una sección…',
  noResults: 'No se encontraron secciones.',
  categories: {
    bodySystems: 'Sistemas corporales',
    anatomyMovement: 'Anatomía y movimiento',
    emergencyTools: 'Emergencia y herramientas',
  },
}

const fr: LibraryNavDict = {
  searchPlaceholder: 'Rechercher une section…',
  noResults: 'Aucune section trouvée.',
  categories: {
    bodySystems: 'Systèmes du corps',
    anatomyMovement: 'Anatomie & Mouvement',
    emergencyTools: 'Urgence & Outils',
  },
}

export const LIBRARY_NAV_STRINGS: Record<AppLang, LibraryNavDict> = { it, en, es, fr }

export function useLibraryNavUi() {
  const { lang } = useLanguage()
  return LIBRARY_NAV_STRINGS[lang]
}
