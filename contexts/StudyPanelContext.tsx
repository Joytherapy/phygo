'use client'

// PHYGO Smart Study Panel — global provider, mirrors AskContext's own
// "site-wide floating feature, one shared open/closed state" shape (see
// contexts/AskContext.tsx) rather than something owned by PdfViewer or the
// document page. Mounted once in app/dashboard/layout.tsx alongside
// AskProvider; <StudyPanel/> (the UI) is rendered once, globally, by the
// same layout — so opening it from inside a PDF page never feels like
// leaving that page, exactly as the feature spec requires ("I am still
// inside my book").
//
// "Add to Document" is the one action that needs to reach back INTO
// whatever document is currently open (to create a 'knowledge_card'
// annotation on the current page) — this context can't do that itself, so
// it exposes a small registration bridge (registerAddToDocumentHandler)
// that app/dashboard/workspace/document/[id]/page.tsx calls into, the same
// registration pattern AskContext uses for contextLabel. When no document
// page has registered a handler (e.g. nothing is open, or a future
// notebook integration hasn't wired one yet), "Add to Document" simply
// doesn't render — never a broken button.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

export type StudyPanelSection = { key: string; body: string }

export type StudyPanelMatch = {
  knowledgeType: 'condition' | 'structure' | 'test'
  knowledgeId: string
  title: string
  category: string | null
  sectionLabel: string | null
  href: string | null
  evidenceLevel: string | null
  source: string | null
  sections: StudyPanelSection[]
}

export type StudyPanelStatus = 'idle' | 'loading' | 'found' | 'empty' | 'error'
export type StudyPanelSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type AddToDocumentHandler = (match: StudyPanelMatch) => void

type StudyPanelContextValue = {
  open: boolean
  selectionText: string | null
  status: StudyPanelStatus
  match: StudyPanelMatch | null
  openWithSelection: (text: string) => void
  close: () => void
  canAddToDocument: boolean
  addToDocument: () => void
  addedToDocument: boolean
  savedKnowledgeIds: Set<string>
  saveStatus: StudyPanelSaveStatus
  saveToWorkspace: () => Promise<void>
  removeFromWorkspace: () => Promise<void>
  registerAddToDocumentHandler: (fn: AddToDocumentHandler | null) => void
}

const StudyPanelContext = createContext<StudyPanelContextValue | null>(null)

export function StudyPanelProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const [selectionText, setSelectionText] = useState<string | null>(null)
  const [status, setStatus] = useState<StudyPanelStatus>('idle')
  const [match, setMatch] = useState<StudyPanelMatch | null>(null)
  const [addedToDocument, setAddedToDocument] = useState(false)
  const [savedKnowledgeIds, setSavedKnowledgeIds] = useState<Set<string>>(new Set())
  const [saveStatus, setSaveStatus] = useState<StudyPanelSaveStatus>('idle')

  const addHandlerRef = useRef<AddToDocumentHandler | null>(null)
  const requestSeq = useRef(0)

  const registerAddToDocumentHandler = useCallback((fn: AddToDocumentHandler | null) => {
    addHandlerRef.current = fn
  }, [])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  const openWithSelection = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const seq = ++requestSeq.current
      setOpen(true)
      setSelectionText(trimmed)
      setStatus('loading')
      setMatch(null)
      setAddedToDocument(false)
      setSaveStatus('idle')

      fetch(`/api/workspace/knowledge-resolve?text=${encodeURIComponent(trimmed)}&lang=${lang}`)
        .then((res) => res.json())
        .then((json) => {
          if (seq !== requestSeq.current) return // a newer selection superseded this one
          if (json?.match) {
            setMatch(json.match)
            setStatus('found')
          } else {
            setStatus('empty')
          }
        })
        .catch(() => {
          if (seq !== requestSeq.current) return
          setStatus('error')
        })
    },
    [lang]
  )

  const addToDocument = useCallback(() => {
    if (!match || !addHandlerRef.current) return
    addHandlerRef.current(match)
    setAddedToDocument(true)
  }, [match])

  const saveToWorkspace = useCallback(async () => {
    if (!match) return
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/workspace/knowledge-saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledge_type: match.knowledgeType,
          knowledge_id: match.knowledgeId,
          title: match.title,
          category: match.category,
          section_label: match.sectionLabel,
          href: match.href,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      setSavedKnowledgeIds((prev) => new Set(prev).add(match.knowledgeId))
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }, [match])

  const removeFromWorkspace = useCallback(async () => {
    if (!match) return
    // The list endpoint doesn't hand back the save's own row id here (only
    // the knowledgeId this panel knows about), so resolve it first — this
    // is a rare action (undoing a save), not worth caching a full id map for.
    try {
      const res = await fetch('/api/workspace/knowledge-saves')
      const json = await res.json()
      const row = (json.saves || []).find((s: any) => s.knowledge_type === match.knowledgeType && s.knowledge_id === match.knowledgeId)
      if (row) await fetch(`/api/workspace/knowledge-saves/${row.id}`, { method: 'DELETE' })
      setSavedKnowledgeIds((prev) => {
        const next = new Set(prev)
        next.delete(match.knowledgeId)
        return next
      })
      setSaveStatus('idle')
    } catch {
      setSaveStatus('error')
    }
  }, [match])

  const value = useMemo(
    () => ({
      open,
      selectionText,
      status,
      match,
      openWithSelection,
      close,
      canAddToDocument: Boolean(match && addHandlerRef.current),
      addToDocument,
      addedToDocument,
      savedKnowledgeIds,
      saveStatus,
      saveToWorkspace,
      removeFromWorkspace,
      registerAddToDocumentHandler,
    }),
    [open, selectionText, status, match, openWithSelection, close, addToDocument, addedToDocument, savedKnowledgeIds, saveStatus, saveToWorkspace, removeFromWorkspace, registerAddToDocumentHandler]
  )

  return <StudyPanelContext.Provider value={value}>{children}</StudyPanelContext.Provider>
}

export function useStudyPanel() {
  const ctx = useContext(StudyPanelContext)
  if (!ctx) throw new Error('useStudyPanel must be used within StudyPanelProvider')
  return ctx
}

/** Call from a document page to let "Add to Document" reach its
 *  handleCreateAnnotation — clears itself automatically on unmount/
 *  navigation so a stale handler never lingers, same lifecycle as
 *  useAskContextLabel. */
export function useStudyPanelDocumentBridge(handler: AddToDocumentHandler | null) {
  const { registerAddToDocumentHandler } = useStudyPanel()
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  // A stable wrapper is registered once per mount (not re-registered every
  // render); it always calls through to whatever `handler` currently is via
  // the ref, so the document page doesn't need to memoize
  // handleCreateAnnotation itself for this to work.
  const stableRef = useRef<AddToDocumentHandler>((match) => handlerRef.current?.(match))

  useEffect(() => {
    registerAddToDocumentHandler(handler ? stableRef.current : null)
    return () => registerAddToDocumentHandler(null)
  }, [Boolean(handler), registerAddToDocumentHandler])
}
