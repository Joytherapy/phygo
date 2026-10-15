'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// Whether the signed-in account may manage real patients (verified, or on the
// owner's temporary transition list). Used only to explain and disable
// actions in the interface: the database rules (can_manage_patients()) and the
// API routes are what enforce it. null = not known (yet, or the check failed),
// in which case nothing is disabled and the server decides.
export type ClinicalAccess = { canManagePatients: boolean | null; transitionUntil: string | null }

let cached: Promise<ClinicalAccess> | null = null
let watching = false

// The answer belongs to one account: forget it when someone signs in or out,
// so the next account in the same tab does not inherit the previous one's
// locked or unlocked interface.
function forgetOnAccountChange() {
  if (watching || typeof window === 'undefined') return
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return
  watching = true
  createBrowserClient(url, key).auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') cached = null
  })
}

function load(): Promise<ClinicalAccess> {
  forgetOnAccountChange()
  cached ??= fetch('/api/profile/verification')
    .then(async (res) => {
      if (!res.ok) throw new Error(String(res.status))
      const v = (await res.json()).verification
      return { canManagePatients: typeof v?.canManagePatients === 'boolean' ? v.canManagePatients : null, transitionUntil: v?.transitionUntil ?? null }
    })
    .catch(() => {
      cached = null
      return { canManagePatients: null, transitionUntil: null }
    })
  return cached
}

export function useClinicalAccess(): ClinicalAccess {
  const [access, setAccess] = useState<ClinicalAccess>({ canManagePatients: null, transitionUntil: null })
  useEffect(() => {
    let active = true
    load().then((a) => active && setAccess(a))
    return () => {
      active = false
    }
  }, [])
  return access
}

/** True only when the server said this account may not manage patients. */
export function useClinicalLocked(): boolean {
  return useClinicalAccess().canManagePatients === false
}
