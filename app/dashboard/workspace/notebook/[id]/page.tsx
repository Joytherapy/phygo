'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import WorkspaceShell from '@/components/workspace/WorkspaceShell'
import ErrorState from '@/components/workspace/ErrorState'
import NotebookPageView, { type NotebookCreatableAnnotation } from '@/components/workspace/notebook/NotebookPageView'
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import { useAskContextLabel } from '@/contexts/AskContext'
import type {
  NotebookPageFormat,
  NotebookPageTemplate,
  TextAnnotationData,
  WorkspaceAnnotation,
  WorkspaceNotebook,
  WorkspaceNotebookPage,
} from '@/lib/workspace/types'

export default function WorkspaceNotebookPageRoute() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const ui = useWorkspaceUi()
  const supabase = getSupabaseBrowserClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notebook, setNotebook] = useState<WorkspaceNotebook | null>(null)
  const [pages, setPages] = useState<WorkspaceNotebookPage[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [annotations, setAnnotations] = useState<WorkspaceAnnotation[]>([])
  const [pageLoading, setPageLoading] = useState(false)
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<WorkspaceAnnotation[]>([])

  const savedTimeout = useRef<ReturnType<typeof setTimeout>>()
  const lastPageTouch = useRef<ReturnType<typeof setTimeout>>()

  const currentPage = pages[pageIndex] as WorkspaceNotebookPage | undefined

  // Tells the global Ask PHYGO panel what's open, same as the PDF document
  // page does — so a question asked while writing in a notebook still gets
  // useful context, even though this page never rendered its own Ask panel.
  useAskContextLabel(
    notebook ? `Writing in the "${notebook.name}" notebook (page ${pageIndex + 1}) in PHYGO Workspace.` : null
  )

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

    const res = await fetch(`/api/workspace/notebooks/${params.id}`)
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Notebook not found.')
      setLoading(false)
      return
    }

    const loadedNotebook: WorkspaceNotebook = json.notebook
    const loadedPages: WorkspaceNotebookPage[] = json.pages || []
    setNotebook(loadedNotebook)
    setPages(loadedPages)

    const initialIndex = Math.max(0, loadedPages.findIndex((p) => p.id === loadedNotebook.last_page_id))
    setPageIndex(initialIndex === -1 ? 0 : initialIndex)
    setLoading(false)

    fetch(`/api/workspace/notebooks/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ touch_opened: true }),
    })
  }, [params.id, router, supabase])

  useEffect(() => {
    load()
  }, [load])

  // Annotations are loaded per page (a notebook page's id IS the target_id
  // — unlike a PDF document, there's no shared parent id + page_number to
  // fetch once for every page at once) — refetched whenever the current
  // page changes, and undo/redo is scoped to whatever page is on screen.
  useEffect(() => {
    if (!currentPage) return
    setPageLoading(true)
    setUndoStack([])
    setRedoStack([])
    // Clear synchronously before the fetch resolves — otherwise the new
    // page's blank paper renders for a moment with the PREVIOUS page's
    // annotations still on screen.
    setAnnotations([])
    fetch(`/api/workspace/annotations?targetType=notebook_page&targetId=${currentPage.id}`)
      .then((res) => res.json())
      .then((json) => setAnnotations(json.annotations || []))
      .finally(() => setPageLoading(false))
  }, [currentPage?.id])

  useEffect(() => {
    if (!currentPage || !notebook) return
    clearTimeout(lastPageTouch.current)
    lastPageTouch.current = setTimeout(() => {
      fetch(`/api/workspace/notebooks/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_page_id: currentPage.id }),
      })
    }, 600)
    return () => clearTimeout(lastPageTouch.current)
  }, [currentPage?.id, notebook, params.id])

  const handleCreateAnnotation = async (annotation: NotebookCreatableAnnotation) => {
    if (!currentPage) return
    setSavingStatus('saving')
    const res = await fetch('/api/workspace/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_type: 'notebook_page',
        target_id: currentPage.id,
        type: annotation.type,
        data: annotation.data,
      }),
    })
    const json = await res.json()
    if (res.ok) {
      setAnnotations((prev) => [...prev, json.annotation])
      setUndoStack((prev) => [...prev, json.annotation.id])
      setRedoStack([])
      setSavingStatus('saved')
      clearTimeout(savedTimeout.current)
      savedTimeout.current = setTimeout(() => setSavingStatus('idle'), 1200)
    } else {
      setSavingStatus('idle')
    }
  }

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
    if (redoStack.length === 0 || !currentPage) return
    const annotation = redoStack[redoStack.length - 1]
    setRedoStack((prev) => prev.slice(0, -1))
    setSavingStatus('saving')
    const res = await fetch('/api/workspace/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_type: 'notebook_page',
        target_id: currentPage.id,
        type: annotation.type,
        data: annotation.data,
      }),
    })
    const json = await res.json()
    if (res.ok) {
      setAnnotations((prev) => [...prev, json.annotation])
      setUndoStack((prev) => [...prev, json.annotation.id])
      setSavingStatus('saved')
      clearTimeout(savedTimeout.current)
      savedTimeout.current = setTimeout(() => setSavingStatus('idle'), 1200)
    } else {
      setSavingStatus('idle')
    }
  }

  const handleChangePageSettings = async (patch: { template?: NotebookPageTemplate; format?: NotebookPageFormat; paperColor?: string }) => {
    if (!currentPage) return
    setPages((prev) =>
      prev.map((p) =>
        p.id === currentPage.id
          ? {
              ...p,
              template: patch.template ?? p.template,
              content: { ...p.content, ...(patch.format ? { format: patch.format } : {}), ...(patch.paperColor ? { paperColor: patch.paperColor } : {}) },
            }
          : p
      )
    )
    await fetch(`/api/workspace/notebooks/${params.id}/pages/${currentPage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: patch.template, format: patch.format, paper_color: patch.paperColor }),
    })
  }

  // Add/duplicate/delete all re-fetch the notebook afterward rather than
  // reconciling position shifts client-side — the pages list per notebook
  // is realistically dozens of rows, not worth the bug surface of hand
  // rolling that logic in two places (server + client).
  const handleAddPage = async () => {
    if (!currentPage) return
    const res = await fetch(`/api/workspace/notebooks/${params.id}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ after_position: currentPage.position, template: currentPage.template, format: (currentPage.content as any)?.format, paper_color: (currentPage.content as any)?.paperColor }),
    })
    const json = await res.json()
    if (!res.ok) return
    const pagesRes = await fetch(`/api/workspace/notebooks/${params.id}`)
    const pagesJson = await pagesRes.json()
    const freshPages: WorkspaceNotebookPage[] = pagesJson.pages || []
    setPages(freshPages)
    setPageIndex(Math.max(0, freshPages.findIndex((p) => p.id === json.page.id)))
  }

  const handleDuplicatePage = async () => {
    if (!currentPage) return
    const res = await fetch(`/api/workspace/notebooks/${params.id}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duplicate_from_page_id: currentPage.id }),
    })
    const json = await res.json()
    if (!res.ok) return
    const pagesRes = await fetch(`/api/workspace/notebooks/${params.id}`)
    const pagesJson = await pagesRes.json()
    const freshPages: WorkspaceNotebookPage[] = pagesJson.pages || []
    setPages(freshPages)
    setPageIndex(Math.max(0, freshPages.findIndex((p) => p.id === json.page.id)))
  }

  const handleDeletePage = async () => {
    if (!currentPage || pages.length <= 1) return
    const deletingIndex = pageIndex
    const res = await fetch(`/api/workspace/notebooks/${params.id}/pages/${currentPage.id}`, { method: 'DELETE' })
    if (!res.ok) return
    const pagesRes = await fetch(`/api/workspace/notebooks/${params.id}`)
    const pagesJson = await pagesRes.json()
    const freshPages: WorkspaceNotebookPage[] = pagesJson.pages || []
    setPages(freshPages)
    setPageIndex(Math.min(deletingIndex, freshPages.length - 1))
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

  if (error || !notebook || !currentPage) {
    return (
      <WorkspaceShell fullscreen>
        <div className="flex flex-1 items-center justify-center p-6">
          <ErrorState message={error || 'Something went wrong while opening this notebook.'} onRetry={load} />
        </div>
      </WorkspaceShell>
    )
  }

  // FULLSCREEN READING/WRITING MODE — see WorkspaceShell.tsx and the mirror
  // of this same change in the document page. The back button + title move
  // into a slim header bar inside the fullscreen container itself, and
  // NotebookPageView fills every remaining pixel below it.
  return (
    <WorkspaceShell fullscreen>
      <div className="flex items-center gap-3 border-b border-black/[0.06] dark:border-white/10 px-3 sm:px-4 py-2.5 shrink-0">
        <button
          onClick={() => router.push(notebook.folder_id ? `/dashboard/workspace/folder/${notebook.folder_id}` : '/dashboard/workspace')}
          aria-label={ui.nav.workspace}
          title={ui.nav.workspace}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display text-sm sm:text-base font-semibold tracking-tight text-ink dark:text-white truncate">
          {notebook.name}
        </h1>
      </div>

      <div className="flex-1 min-h-0">
        {pageLoading ? (
          <div className="flex h-full items-center justify-center text-ink/40 dark:text-white/40">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : (
          <NotebookPageView
            page={currentPage}
            pageIndex={pageIndex}
            pageCount={pages.length}
            annotations={annotations}
            onCreateAnnotation={handleCreateAnnotation}
            onUpdateAnnotation={handleUpdateAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            onChangePageSettings={handleChangePageSettings}
            savingStatus={savingStatus}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onPrevPage={() => setPageIndex((i) => Math.max(0, i - 1))}
            onNextPage={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
            onAddPage={handleAddPage}
            onDuplicatePage={handleDuplicatePage}
            onDeletePage={handleDeletePage}
          />
        )}
      </div>
    </WorkspaceShell>
  )
}
