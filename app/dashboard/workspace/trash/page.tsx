'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2, Folder, FileText, BookOpen, RotateCcw, X } from 'lucide-react'
import WorkspaceShell from '@/components/workspace/WorkspaceShell'
import EmptyState from '@/components/workspace/EmptyState'
import ErrorState from '@/components/workspace/ErrorState'
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import { useDashboardUi } from '@/lib/i18n/dashboardStrings'
import { useWorkspaceMutation } from '@/lib/workspace/useWorkspaceMutation'
import type { WorkspaceDocument, WorkspaceFolder, WorkspaceNotebook } from '@/lib/workspace/types'

export default function WorkspaceTrashPage() {
  const router = useRouter()
  const ui = useWorkspaceUi()
  const t = useDashboardUi()
  const supabase = getSupabaseBrowserClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([])
  const [notebooks, setNotebooks] = useState<WorkspaceNotebook[]>([])
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

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

    const [f, d, n] = await Promise.all([
      supabase
        .from('workspace_folders')
        .select('*')
        .eq('owner_id', user.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),
      supabase
        .from('workspace_documents')
        .select('*')
        .eq('owner_id', user.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),
      supabase
        .from('workspace_notebooks')
        .select('*')
        .eq('owner_id', user.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),
    ])

    if (f.error || d.error || n.error) {
      console.error('Trash could not be loaded:', f.error || d.error || n.error)
      setError('load_failed')
      setLoading(false)
      return
    }

    setFolders(f.data || [])
    setDocuments(d.data || [])
    setNotebooks(n.data || [])
    setLoading(false)
  }, [router, supabase])

  useEffect(() => {
    load()
  }, [load])

  const { mutate, actionError, dismissActionError } = useWorkspaceMutation(load)

  const restoreFolder = async (f: WorkspaceFolder) => {
    setFolders((prev) => prev.filter((x) => x.id !== f.id))
    await mutate(`/api/workspace/folders/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    })
  }

  const restoreDocument = async (d: WorkspaceDocument) => {
    setDocuments((prev) => prev.filter((x) => x.id !== d.id))
    await mutate(`/api/workspace/documents/${d.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    })
  }

  const deleteForeverFolder = async (f: WorkspaceFolder) => {
    setFolders((prev) => prev.filter((x) => x.id !== f.id))
    setConfirmingDeleteId(null)
    await mutate(`/api/workspace/folders/${f.id}?permanent=1`, { method: 'DELETE' })
  }

  const deleteForeverDocument = async (d: WorkspaceDocument) => {
    setDocuments((prev) => prev.filter((x) => x.id !== d.id))
    setConfirmingDeleteId(null)
    await mutate(`/api/workspace/documents/${d.id}?permanent=1`, { method: 'DELETE' })
  }

  const restoreNotebook = async (nb: WorkspaceNotebook) => {
    setNotebooks((prev) => prev.filter((x) => x.id !== nb.id))
    await mutate(`/api/workspace/notebooks/${nb.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    })
  }

  const deleteForeverNotebook = async (nb: WorkspaceNotebook) => {
    setNotebooks((prev) => prev.filter((x) => x.id !== nb.id))
    setConfirmingDeleteId(null)
    await mutate(`/api/workspace/notebooks/${nb.id}?permanent=1`, { method: 'DELETE' })
  }

  if (loading) {
    return (
      <WorkspaceShell actionError={actionError} onDismissActionError={dismissActionError}>
        <div className="flex items-center justify-center py-24 text-ink/55 dark:text-white/40">
          <Loader2 size={18} className="animate-spin" />
        </div>
      </WorkspaceShell>
    )
  }

  if (error) {
    return (
      <WorkspaceShell actionError={actionError} onDismissActionError={dismissActionError}>
        <ErrorState message={t.workspace.loadError} onRetry={load} />
      </WorkspaceShell>
    )
  }

  const empty = folders.length === 0 && documents.length === 0 && notebooks.length === 0

  return (
    <WorkspaceShell actionError={actionError} onDismissActionError={dismissActionError}>
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-white mb-8">{ui.nav.trash}</h1>

      {empty ? (
        <EmptyState icon={Trash2} title={ui.nav.trash} />
      ) : (
        <div className="space-y-2">
          {folders.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-xl2 border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.03] p-3.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4F7CFF]/10 text-[#4F7CFF]">
                <Folder size={15} />
              </span>
              <p className="min-w-0 flex-1 text-sm font-medium text-ink dark:text-white truncate">{f.name}</p>
              <TrashActions
                confirming={confirmingDeleteId === f.id}
                onRestore={() => restoreFolder(f)}
                onAskDelete={() => setConfirmingDeleteId(f.id)}
                onCancelDelete={() => setConfirmingDeleteId(null)}
                onConfirmDelete={() => deleteForeverFolder(f)}
                ui={ui}
              />
            </div>
          ))}
          {notebooks.map((nb) => (
            <div
              key={nb.id}
              className="flex items-center gap-3 rounded-xl2 border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.03] p-3.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4F7CFF]/10 text-[#4F7CFF]">
                <BookOpen size={15} />
              </span>
              <p className="min-w-0 flex-1 text-sm font-medium text-ink dark:text-white truncate">{nb.name}</p>
              <TrashActions
                confirming={confirmingDeleteId === nb.id}
                onRestore={() => restoreNotebook(nb)}
                onAskDelete={() => setConfirmingDeleteId(nb.id)}
                onCancelDelete={() => setConfirmingDeleteId(null)}
                onConfirmDelete={() => deleteForeverNotebook(nb)}
                ui={ui}
              />
            </div>
          ))}
          {documents.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-xl2 border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.03] p-3.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#32D6A0]/10 text-[#32D6A0]">
                <FileText size={15} />
              </span>
              <p className="min-w-0 flex-1 text-sm font-medium text-ink dark:text-white truncate">{d.name}</p>
              <TrashActions
                confirming={confirmingDeleteId === d.id}
                onRestore={() => restoreDocument(d)}
                onAskDelete={() => setConfirmingDeleteId(d.id)}
                onCancelDelete={() => setConfirmingDeleteId(null)}
                onConfirmDelete={() => deleteForeverDocument(d)}
                ui={ui}
              />
            </div>
          ))}
        </div>
      )}
    </WorkspaceShell>
  )
}

function TrashActions({
  confirming,
  onRestore,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  ui,
}: {
  confirming: boolean
  onRestore: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  ui: ReturnType<typeof useWorkspaceUi>
}) {
  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-red-500 font-medium mr-1">{ui.item.deleteForever}?</span>
        <button
          type="button"
          onClick={onConfirmDelete}
          className="min-h-[40px] rounded-full px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
        >
          {ui.item.deleteForever}
        </button>
        <button
          type="button"
          onClick={onCancelDelete}
          aria-label={ui.dialog.cancel}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink/55 dark:text-white/40 hover:bg-ink/5 dark:hover:bg-white/10"
        >
          <X size={14} aria-hidden />
        </button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={onRestore}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink/60 dark:text-white/60 border border-black/10 dark:border-white/10 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
      >
        <RotateCcw size={12} />
        {ui.item.restore}
      </button>
      <button
        type="button"
        onClick={onAskDelete}
        aria-label={ui.item.deleteForever}
        title={ui.item.deleteForever}
        className="flex h-10 w-10 items-center justify-center rounded-full text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-colors"
      >
        <Trash2 size={14} aria-hidden />
      </button>
    </div>
  )
}
