'use client'

// Student vs Professional theming (see app/globals.css --brand-from/--brand-to
// and html[data-role="student"]). A tiny, additive provider mirroring
// PatientContext/LanguageContext: it fetches profiles.practice_stage once
// per session and sets data-role on <html> so any component's CSS can react
// via var(--brand-from)/var(--brand-to) or the [data-role] selector, without
// every component needing its own Supabase round-trip or prop-drilling.
//
// Defaults to 'professional' (the original, unchanged brand colors) until
// the profile row loads, so nothing shifts color for the vast majority of
// existing (professional) accounts while this resolves — same fallback
// convention already used for practiceStage in Navbar.tsx.

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type PracticeStage = 'student' | 'professional'

type RoleThemeContextValue = {
  practiceStage: PracticeStage
}

const defaultValue: RoleThemeContextValue = { practiceStage: 'professional' }

const RoleThemeContext = createContext<RoleThemeContextValue>(defaultValue)

export function RoleThemeProvider({ children }: { children: ReactNode }) {
  const [practiceStage, setPracticeStage] = useState<PracticeStage>('professional')

  useEffect(() => {
    let cancelled = false

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return
      supabase
        .from('profiles')
        .select('practice_stage')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled && (data?.practice_stage === 'student' || data?.practice_stage === 'professional')) {
            setPracticeStage(data.practice_stage)
          }
        })
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-role', practiceStage)
  }, [practiceStage])

  return <RoleThemeContext.Provider value={{ practiceStage }}>{children}</RoleThemeContext.Provider>
}

export function useRoleTheme() {
  return useContext(RoleThemeContext)
}
