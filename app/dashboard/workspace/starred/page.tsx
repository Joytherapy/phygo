'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Star } from 'lucide-react'
import WorkspaceShell from '@/components/workspace/WorkspaceShell'
import FolderCard from '@/components/workspace/FolderCard'
import DocumentCard from '@/components/workspace/DocumentCard'
import NotebookCard from '@/components/workspace/NotebookCard'
import EmptyState from '@/components/workspace/EmptyState'
import ErrorState from '@/components/workspace/ErrorState'
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import type { WorkspaceDocument, WorkspaceFolder, WorkspaceNotebook } from '@/lib/workspace/types'

export default function WorkspaceStarredPage() {
  const router = useRouter()
  const ui = useWorkspaceUi()
  const supabase = getSupabaseBrowserClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([])
  const [notebooks, setNotebooks] = useState<WorkspaceNotebook[]>([])

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
        .eq('starred', true)
        .is('deleted_at', null)
        .order('name', { ascending: true }),
      supabase
        .from('workspace_documents')
        .select('*')
        .eq('owner_id', user.id)
        .eq('starred', true)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false }),
      supabase
        .from('workspace_notebooks')
        .select('*')
        .eq('owner_id', user.id)
        .eq('starred', true)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false }),
    ])

    if (f.error || d.error || n.error) {
      setError(f.error?.message || d.error?.message || n.error?.message || 'Failed to load')
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

  const unstarFolder = async (f: WorkspaceFolder) => {
    setFolders((prev) => prev.filter((x) => x.id !== f.id))
    await fetch(`/api/workspace/folders/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: false }),
    })
  }

  const renameFolder = async (f: WorkspaceFolder, name: string) => {
    setFolders((prev) => prev.map((x) => (x.id === f.id ? { ...x, name } : x)))
    await fetch(`/api/workspace/folders/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  const deleteFolder = async (f: WorkspaceFolder) => {
    setFolders((prev) => prev.filter((x) => x.id !== f.id))
    await fetch(`/api/workspace/folders/${f.id}`, { method: 'DELETE' })
  }

  const changeFolderColor = async (f: WorkspaceFolder, color: string | null) => {
    setFolders((prev) => prev.map((x) => (x.id === f.id ? { ...x, color } : x)))
    await fetch(`/api/workspace/folders/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color }),
    })
  }

  const unstarDocument = async (d: WorkspaceDocument) => {
    setDocuments((prev) => prev.filter((x) => x.id !== d.id))
    await fetch(`/api/workspace/documents/${d.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: false }),
    })
  }

  const renameDocument = async (d: WorkspaceDocument, name: string) => {
    setDocuments((prev) => prev.map((x) => (x.id === d.id ? { ...x, name } : x)))
    await fetch(`/api/workspace/documents/${d.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  const deleteDocument = async (d: WorkspaceDocument) => {
    setDocuments((prev) => prev.filter((x) => x.id !== d.id))
    await fetch(`/api/workspace/documents/${d.id}`, { method: 'DELETE' })
  }

  const downloadDocument = async (d: WorkspaceDocument) => {
    const res = await fetch(`/api/workspace/documents/${d.id}/signed-url`)
    const json = await res.json()
    if (json.url) window.open(json.url, '_blank')
  }

  const unstarNotebook = async (nb: WorkspaceNotebook) => {
    setNotebooks((prev) => prev.filter((x) => x.id !== nb.id))
    await fetch(`/api/workspace/notebooks/${nb.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: false }),
    })
  }

  const renameNotebook = async (nb: WorkspaceNotebook, name: string) => {
    setNotebooks((prev) => prev.map((x) => (x.id === nb.id ? { ...x, name } : x)))
    await fetch(`/api/workspace/notebooks/${nb.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  const deleteNotebook = async (nb: WorkspaceNotebook) => {
    setNotebooks((prev) => prev.filter((x) => x.id !== nb.id))
    await fetch(`/api/workspace/notebooks/${nb.id}`, { method: 'DELETE' })
  }

  if (loading) {
    return (
      <WorkspaceShell>
        <div className="flex items-center justify-center py-24 text-ink/40 dark:text-white/40">
          <Loader2 size={18} className="animate-spin" />
        </div>
      </WorkspaceShell>
    )
  }

  if (error) {
    return (
      <WorkspaceShell>
        <ErrorState message={error} onRetry={load} />
      </WorkspaceShell>
    )
  }

  return (
    <WorkspaceShell>
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-white mb-8">{ui.nav.starred}</h1>

      {folders.length === 0 && documents.length === 0 && notebooks.length === 0 ? (
        <EmptyState icon={Star} title={ui.nav.starred} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {folders.map((f) => (
            <FolderCard
              key={f.id}
              folder={f}
              onOpen={() => router.push(`/dashboard/workspace/folder/${f.id}`)}
              onRename={(name) => renameFolder(f, name)}
              onToggleStar={() => unstarFolder(f)}
              onDelete={() => deleteFolder(f)}
              onColorChange={(color) => changeFolderColor(f, color)}
            />
          ))}
          {notebooks.map((nb) => (
            <NotebookCard
              key={nb.id}
              notebook={nb}
              onOpen={() => router.push(`/dashboard/workspace/notebook/${nb.id}`)}
              onRename={(name) => renameNotebook(nb, name)}
              onToggleStar={() => unstarNotebook(nb)}
              onDelete={() => deleteNotebook(nb)}
            />
          ))}
          {documents.map((d) => (
            <DocumentCard
              key={d.id}
              document={d}
              onOpen={() => router.push(`/dashboard/workspace/document/${d.id}`)}
              onRename={(name) => renameDocument(d, name)}
              onToggleStar={() => unstarDocument(d)}
              onDelete={() => deleteDocument(d)}
              onDownload={() => downloadDocument(d)}
            />
          ))}
        </div>
      )}
    </WorkspaceShell>
  )
}
