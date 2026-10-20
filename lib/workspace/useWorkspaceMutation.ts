'use client'

import { useCallback, useState } from 'react'
import { useDashboardUi } from '@/lib/i18n/dashboardStrings'

// Workspace lists update optimistically (rename, star, colour, move to trash,
// restore, delete forever) and then call the API. Before, the API answer was
// never checked: a refused or failed request left the screen showing a change
// the server never made. mutate() checks it; on failure it shows a visible
// message and reloads the list from the server, so what is on screen is what
// is stored.
export function useWorkspaceMutation(reload: () => unknown) {
  const t = useDashboardUi()
  const [actionError, setActionError] = useState<string | null>(null)

  const mutate = useCallback(
    async (url: string, init?: RequestInit): Promise<boolean> => {
      let ok = false
      try {
        ok = (await fetch(url, init)).ok
      } catch {
        ok = false
      }
      if (ok) return true
      setActionError(t.workspace.actionFailed)
      reload()
      return false
    },
    [reload, t]
  )

  const dismissActionError = useCallback(() => setActionError(null), [])

  return { mutate, actionError, dismissActionError }
}
