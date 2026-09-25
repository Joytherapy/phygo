'use client'

// Makes "Ask PHYGO" a site-wide feature instead of something that only
// existed inside the PDF reader toolbar. Before this, AskPhygoPanel was
// mounted locally by app/dashboard/workspace/document/[id]/page.tsx, with
// its own `askOpen` state and its own toggle button inside PdfViewer's own
// row — so it simply didn't exist anywhere else (not in a notebook, not on
// any other dashboard page). AskProvider wraps the whole dashboard (see
// app/dashboard/layout.tsx) so a single open/closed state — and a single
// panel, rendered once by GlobalAskLauncher.tsx — is reachable from any
// page via useAsk(), with no per-page plumbing required.
//
// `contextLabel` lets a page (optionally) tell the global panel what it's
// currently looking at, e.g. "Studying \"<document>\" in PHYGO Workspace.",
// the same context PdfViewer used to build by hand for its local panel —
// see useAskContextLabel below. A page that doesn't call it just leaves the
// question generic, which is still a completely fine way to use Ask
// (nothing in Workspace REQUIRES a document to be open).

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type AskContextValue = {
  open: boolean
  toggle: () => void
  close: () => void
  contextLabel: string | null
  setContextLabel: (label: string | null) => void
}

const AskContext = createContext<AskContextValue | null>(null)

export function AskProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [contextLabel, setContextLabelState] = useState<string | null>(null)

  // Stable identity ([] deps) so useAskContextLabel's effect below never
  // re-fires just because this provider itself re-rendered.
  const setContextLabel = useCallback((label: string | null) => setContextLabelState(label), [])
  const toggle = useCallback(() => setOpen((v) => !v), [])
  const close = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({ open, toggle, close, contextLabel, setContextLabel }),
    [open, toggle, close, contextLabel, setContextLabel]
  )

  return <AskContext.Provider value={value}>{children}</AskContext.Provider>
}

export function useAsk() {
  const ctx = useContext(AskContext)
  if (!ctx) throw new Error('useAsk must be used within AskProvider')
  return ctx
}

/** Call from any page to tell the global Ask panel what's currently open —
 *  clears itself automatically on unmount/navigation so a stale label never
 *  lingers once the user leaves that page. Pass null to explicitly clear. */
export function useAskContextLabel(label: string | null) {
  const { setContextLabel } = useAsk()
  useEffect(() => {
    setContextLabel(label)
    return () => setContextLabel(null)
  }, [label, setContextLabel])
}
