'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Loader2 } from 'lucide-react'
import WorkspaceShell from '@/components/workspace/WorkspaceShell'
import ErrorState from '@/components/workspace/ErrorState'
import { useAskContextLabel } from '@/contexts/AskContext'
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import type { WorkspaceAnnotation, WorkspaceDocument } from '@/lib/workspace/types'
import type { CreatableAnnotation } from '@/components/workspace/pdf/PdfViewer'

// react-pdf touches `window`/canvas at import time, so it can't run during
// SSR — loaded client-only, same pattern as any browser-only visualization
// elsewhere in the app (e.g. the react-three-fiber anatomy views).
const PdfViewer = dynamic(() => import('@/components/workspace/pdf/PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-24 text-ink/40 dark:text-white/40">
      <Loader2 size={18} className="animate-spin" />
    </div>
  ),
})

export default function WorkspaceDocumentPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const ui = useWorkspaceUi()
  const supabase = getSupabaseBrowserClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [document, setDocument] = useState<WorkspaceDocument | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<WorkspaceAnnotation[]>([])
  const [bookmarks, setBookmarks] = useState<{ id: string; page_number: number }[]>([])
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Ask PHYGO is now the global floating panel (GlobalAskLauncher) — this
  // just tells it what's currently open, so a question asked while reading
  // this document still gets the same "Studying X" context it used to,
  // without this page needing to render or manage the panel itself.
  useAskContextLabel(document ? `Studying "${document.name}" in PHYGO Workspace.` : null)

  // Undo/redo covers every annotation type (highlight, pen stroke, line,
  // shape) through the same generic create/delete calls — a single history,
  // kept in memory for this reading session (not persisted across reloads).
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<WorkspaceAnnotation[]>([])

  const savedTimeout = useRef<ReturnType<typeof setTimeout>>()
  const pageChangeTimeout = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const [docRes, urlRes] = await Promise.all([
      fetch(`/api/workspace/documents/${params.id}`),
      fetch(`/api/workspace/documents/${params.id}/signed-url`),
    ])
    const docJson = await docRes.json()
    const urlJson = await urlRes.json()

    if (!docRes.ok) {
      setError(docJson.error || 'Document not found.')
      setLoading(false)
      return
    }
    if (!urlRes.ok) {
      setError(urlJson.error || 'Could not open this document.')
      setLoading(false)
      return
    }

    const [annRes, bmRes] = await Promise.all([
      fetch(`/api/workspace/annotations?targetType=document&targetId=${params.id}`),
      supabase
        .from('workspace_bookmarks')
        .select('id, page_number')
        .eq('owner_id', user.id)
        .eq('document_id', params.id),
    ])
    const annJson = await annRes.json()

    setDocument(docJson.document)
    setFileUrl(urlJson.url)
    setAnnotations(annRes.ok ? annJson.annotations : [])
    setBookmarks(bmRes.data || [])
    setLoading(false)

    // Mark as opened "now" — the read side of Continue Studying / Recent.
    fetch(`/api/workspace/documents/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ touch_opened: true }),
    })
  }, [params.id, router, supabase])

  useEffect(() => {
    load()
    return () => {
      clearTimeout(savedTimeout.current)
      clearTimeout(pageChangeTimeout.current)
    }
  }, [load])

  const handlePageChange = (page: number, numPages: number) => {
    clearTimeout(pageChangeTimeout.current)
    pageChangeTimeout.current = setTimeout(() => {
      setSavingStatus('saving')
      const patch: Record<string, unknown> = { last_page: page }
      if (document && !document.page_count) patch.page_count = numPages
      fetch(`/api/workspace/documents/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).then(() => {
        setSavingStatus('saved')
        clearTimeout(savedTimeout.current)
        savedTimeout.current = setTimeout(() => setSavingStatus('idle'), 1500)
      })
    }, 600)
  }

  // Generic create path for every annotation type — highlight (text
  // selection), pen stroke, straight line, rectangle, ellipse. Each one is
  // still its own row in workspace_annotations (type 'highlight'|'stroke'|
  // 'shape'), never a modification of the original PDF.
  const handleCreateAnnotation = async (pageNumber: number, annotation: CreatableAnnotation) => {
    setSavingStatus('saving')
    const res = await fetch('/api/workspace/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_type: 'document',
        target_id: params.id,
        page_number: pageNumber,
        type: annotation.type,
        data: annotation.data,
      }),
    })
    const json = await res.json()
    if (res.ok) {
      setAnnotations((prev) => [...prev, json.annotation])
      setUndoStack((prev) => [...prev, json.annotation.id])
      setRedoStack([]) // a fresh action invalidates whatever could have been redone
      setSavingStatus('saved')
      savedTimeout.current = setTimeout(() => setSavingStatus('idle'), 1200)
    } else {
      setSavingStatus('idle')
    }
  }

  // Partial-data update path — used by the Text tool for editing a note's
  // body and for dragging a note to a new position. Same generic PATCH
  // route as everything else in workspace_annotations; merges into the
  // existing `data` object client-side for an instant optimistic update.
  const handleUpdateAnnotation = async (id: string, data: Record<string, unknown>) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, data: { ...a.data, ...data } } : a)))
    setSavingStatus('saving')
    const res = await fetch(`/api/workspace/annotations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { ...(annotations.find((a) => a.id === id)?.data || {}), ...data } }),
    })
    if (res.ok) {
      setSavingStatus('saved')
      clearTimeout(savedTimeout.current)
      savedTimeout.current = setTimeout(() => setSavingStatus('idle'), 1200)
    } else {
      setSavingStatus('idle')
    }
  }

  const handleDeleteAnnotation = async (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
    await fetch(`/api/workspace/annotations/${id}`, { method: 'DELETE' })
  }

  const handleUndo = async () => {
    if (undoStack.length === 0) return
    const id = undoStack[undoStack.length - 1]
    const removed = annotations.find((a) => a.id === id)
    setUndoStack((prev) => prev.slice(0, -1))
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
    if (removed) setRedoStack((prev) => [...prev, removed])
    await fetch(`/api/workspace/annotations/${id}`, { method: 'DELETE' })
  }

  const handleRedo = async () => {
    if (redoStack.length === 0) return
    const annotation = redoStack[redoStack.length - 1]
    setRedoStack((prev) => prev.slice(0, -1))
    setSavingStatus('saving')
    const res = await fetch('/api/workspace/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_type: 'document',
        target_id: params.id,
        page_number: annotation.page_number,
        type: annotation.type,
        data: annotation.data,
      }),
    })
    const json = await res.json()
    if (res.ok) {
      setAnnotations((prev) => [...prev, json.annotation])
      setUndoStack((prev) => [...prev, json.annotation.id])
      setSavingStatus('saved')
      savedTimeout.current = setTimeout(() => setSavingStatus('idle'), 1200)
    } else {
      setSavingStatus('idle')
    }
  }

  const handleToggleBookmark = async (pageNumber: number) => {
    const existing = bookmarks.find((b) => b.page_number === pageNumber)
    if (existing) {
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id))
      await supabase.from('workspace_bookmarks').delete().eq('id', existing.id)
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !document) return
      const { data } = await supabase
        .from('workspace_bookmarks')
        .insert({ owner_id: user.id, document_id: document.id, page_number: pageNumber })
        .select('id, page_number')
        .single()
      if (data) setBookmarks((prev) => [...prev, data])
    }
  }

  if (loading) {
    return (
      <WorkspaceShell fullscreen>
        <div className="flex flex-1 items-center justify-center text-ink/40 dark:text-white/40">
          <Loader2 size={18} className="animate-spin" />
        </div>
      </WorkspaceShell>
    )
  }

  if (error || !document || !fileUrl) {
    return (
      <WorkspaceShell fullscreen>
        <div className="flex flex-1 items-center justify-center p-6">
          <ErrorState message={error || 'Something went wrong while opening this document.'} onRetry={load} />
        </div>
      </WorkspaceShell>
    )
  }

  // FULLSCREEN READING MODE (see WorkspaceShell.tsx): the back button + title
  // that used to sit above the reader, inside the normal Navbar+sidebar
  // column, are now a slim header bar INSIDE the fullscreen container
  // itself — the only chrome left above the document — with PdfViewer
  // filling every remaining pixel below it.
  return (
    <WorkspaceShell fullscreen>
      <div className="flex items-center gap-3 border-b border-black/[0.06] dark:border-white/10 px-3 sm:px-4 py-2.5 shrink-0">
        <button
          onClick={() => router.push(document.folder_id ? `/dashboard/workspace/folder/${document.folder_id}` : '/dashboard/workspace')}
          aria-label={ui.nav.workspace}
          title={ui.nav.workspace}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display text-sm sm:text-base font-semibold tracking-tight text-ink dark:text-white truncate">
          {document.name}
        </h1>
      </div>

      <div className="flex-1 min-h-0">
        <PdfViewer
          fileUrl={fileUrl}
          initialPage={document.last_page || 1}
          annotations={annotations}
          bookmarkedPages={new Set(bookmarks.map((b) => b.page_number))}
          onPageChange={handlePageChange}
          onCreateAnnotation={handleCreateAnnotation}
          onUpdateAnnotation={handleUpdateAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
          onToggleBookmark={handleToggleBookmark}
          savingStatus={savingStatus}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>
    </WorkspaceShell>
  )
}
