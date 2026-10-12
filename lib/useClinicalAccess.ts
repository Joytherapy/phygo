'use client'

import { useEffect, useState } from 'react'

// Whether the signed-in account may manage real patients (verified, or on the
// owner's temporary transition list). Used only to explain and disable
// actions in the interface: the database rules (can_manage_patients()) and the
// API routes are what enforce it. null = not known (yet, or the check failed),
// in which case nothing is disabled and the server decides.
export type ClinicalAccess = { canManagePatients: boolean | null; transitionUntil: string | null }

let cached: Promise<ClinicalAccess> | null = null

function load(): Promise<ClinicalAccess> {
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
