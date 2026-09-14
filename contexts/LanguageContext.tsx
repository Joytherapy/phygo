'use client'

// Account-level language preference for the whole dashboard, mirroring how
// PatientContext works: a small provider wrapped around app/dashboard so
// every page can read the current language and switch it from anywhere
// (e.g. the account menu in Navbar).
//
// The preference is persisted to profiles.preferred_language (see
// sql/2026-09_i18n_foundation.sql) so it's the same across devices, with a
// localStorage mirror so the UI doesn't flash back to Italian for a moment
// on every page load while the Supabase round-trip is in flight.

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { AppLang, APP_LANGS, UI_STRINGS } from '@/lib/i18n/uiStrings'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STORAGE_KEY = 'phygo-lang'

type LanguageContextValue = {
  lang: AppLang
  setLang: (lang: AppLang) => void
  /** True once the real preference (profile or localStorage) has been checked at least once — useful to avoid a flash of the wrong language on first paint if you need it, though the default 'it' is always a safe first paint. */
  ready: boolean
}

const defaultValue: LanguageContextValue = {
  lang: 'it',
  setLang: () => {},
  ready: false,
}

const LanguageContext = createContext<LanguageContextValue>(defaultValue)

function isAppLang(v: unknown): v is AppLang {
  return typeof v === 'string' && (APP_LANGS as string[]).includes(v)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLang>('it')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isAppLang(stored)) setLangState(stored)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) {
        setReady(true)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .maybeSingle()

      if (!cancelled && isAppLang(data?.preferred_language)) {
        setLangState(data!.preferred_language as AppLang)
        window.localStorage.setItem(STORAGE_KEY, data!.preferred_language as string)
      }
      if (!cancelled) setReady(true)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const setLang = (next: AppLang) => {
    setLangState(next)
    window.localStorage.setItem(STORAGE_KEY, next)

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .update({ preferred_language: next })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) console.error('Errore salvataggio lingua preferita:', error)
        })
    })
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, ready }}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

/** Convenience hook for UI-chrome strings (nav labels, field headers, common buttons) — see lib/i18n/uiStrings.ts for the full dictionary. */
export function useUiStrings() {
  const { lang } = useLanguage()
  return UI_STRINGS[lang]
}
