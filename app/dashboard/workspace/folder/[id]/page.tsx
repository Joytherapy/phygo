'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronRight, FolderOpen, Loader2 } from 'lucide-react'
import WorkspaceShell from '@/components/workspace/WorkspaceShell'
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader'
import FolderCard from '@/components/workspace/FolderCard'
import DocumentCard from '@/components/workspace/DocumentCard'
import NotebookCard from '@/components/workspace/NotebookCard'
import EmptyState from '@/components/workspace/EmptyState'
import ErrorState from '@/components/workspace/ErrorState'
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import type { WorkspaceDocument, WorkspaceFolder, WorkspaceNotebook } from '@/lib/workspace/types'

export default function WorkspaceFolderPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const ui = useWorkspaceUi()
  const supabase = getSupabaseBrowserClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [folder, setFolder] = useState<WorkspaceFolder | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<WorkspaceFolder[]>([])
  const [subfolders, setSubfolders] = useState<WorkspaceFolder[]>([])
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([])
  const [notebooks, setNotebooks] = useState<WorkspaceNotebook[]>([])
  const [searchQuery, setSearchQuery] = useState('')

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

    const { data: current, error: folderError } = await supabase
      .from('workspace_folders')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (folderError) {
      setError(folderError.message)
      setLoading(false)
      return
    }
    if (!current) {
      setError('Folder not found.')
      setLoading(false)
      return
    }

    // Walk up parent_id to build clickable breadcrumbs (capped at 10 levels
    // — Workspace folders are a personal study hierarchy, not meant to nest
    // that deep in practice).
    const chain: WorkspaceFolder[] = [current]
    let cursor = current.parent_id
    let guard = 0
    while (cursor && guard < 10) {
      const { data: parent } = await supabase
        .from('workspace_folders')
        .select('*')
        .eq('id', cursor)
        .eq('owner_id', user.id)
        .maybeSingle()
      if (!parent) break
      chain.unshift(parent)
      cursor = parent.parent_id
      guard++
    }

    const [subRes, docsRes, notebooksRes] = await Promise.all([
      supabase
        .from('workspace_folders')
        .select('*')
        .eq('owner_id', user.id)
        .eq('parent_id', current.id)
        .is('deleted_at', null)
        .order('name', { ascending: true }),
      supabase
        .from('workspace_documents')
        .select('*')
        .eq('owner_id', user.id)
        .eq('folder_id', current.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false }),
      supabase
        .from('workspace_notebooks')
        .select('*')
        .eq('owner_id', user.id)
        .eq('folder_id', current.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false }),
    ])

    setFolder(current)
    setBreadcrumbs(chain)
    setSubfolders(subRes.data || [])
    setDocuments(docsRes.data || [])
    setNotebooks(notebooksRes.data || [])
    setLoading(false)
  }, [params.id, router, supabase])

  useEffect(() => {
    load()
  }, [load])

  const filteredSubfolders = searchQuery
    ? subfolders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : subfolders
  const filteredDocuments = searchQuery
    ? documents.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : documents
  const filteredNotebooks = searchQuery
    ? notebooks.filter((nb) => nb.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : notebooks

  const toggleFolderStar = async (f: WorkspaceFolder) => {
    setSubfolders((prev) => prev.map((x) => (x.id === f.id ? { ...x, starred: !x.starred } : x)))
    await fetch(`/api/workspace/folders/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: !f.starred }),
    })
  }

  const renameFolder = async (f: WorkspaceFolder, name: string) => {
    setSubfolders((prev) => prev.map((x) => (x.id === f.id ? { ...x, name } : x)))
    await fetch(`/api/workspace/folders/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  const deleteFolder = async (f: WorkspaceFolder) => {
    setSubfolders((prev) => prev.filter((x) => x.id !== f.id))
    await fetch(`/api/workspace/folders/${f.id}`, { method: 'DELETE' })
  }

  const changeFolderColor = async (f: WorkspaceFolder, color: string | null) => {
    setSubfolders((prev) => prev.map((x) => (x.id === f.id ? { ...x, color } : x)))
    await fetch(`/api/workspace/folders/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color }),
    })
  }

  const toggleDocumentStar = async (d: WorkspaceDocument) => {
    setDocuments((prev) => prev.map((x) => (x.id === d.id ? { ...x, starred: !x.starred } : x)))
    await fetch(`/api/workspace/documents/${d.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: !d.starred }),
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

  const toggleNotebookStar = async (nb: WorkspaceNotebook) => {
    setNotebooks((prev) => prev.map((x) => (x.id === nb.id ? { ...x, starred: !x.starred } : x)))
    await fetch(`/api/workspace/notebooks/${nb.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: !nb.starred }),
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

  if (error || !folder) {
    return (
      <WorkspaceShell>
        <ErrorState message={error || 'Folder not found.'} onRetry={load} />
      </WorkspaceShell>
    )
  }

  return (
    <WorkspaceShell>
      <nav className="flex items-center flex-wrap gap-1.5 text-sm text-ink/50 dark:text-white/50 mb-4">
        <button onClick={() => router.push('/dashboard/workspace')} className="hover:text-ink dark:hover:text-white transition-colors">
          {ui.folder.root}
        </button>
        {breadcrumbs.map((b) => (
          <span key={b.id} className="flex items-center gap-1.5">
            <ChevronRight size={13} className="text-ink/25 dark:text-white/25" />
            <button
              onClick={() => router.push(`/dashboard/workspace/folder/${b.id}`)}
              className={`flex items-center gap-1.5 hover:text-ink dark:hover:text-white transition-colors ${
                b.id === folder.id ? 'text-ink dark:text-white font-medium' : ''
              }`}
            >
              {b.color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: b.color }} />}
              {b.name}
            </button>
          </span>
        ))}
      </nav>

      <WorkspaceHeader
        title={folder.name}
        folderId={folder.id}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFolderCreated={(f) => setSubfolders((prev) => [...prev, f])}
        onDocumentImported={(d) => {
          setDocuments((prev) => [d, ...prev])
          router.push(`/dashboard/workspace/document/${d.id}`)
        }}
        onNotebookCreated={(nb) => {
          setNotebooks((prev) => [nb, ...prev])
          router.push(`/dashboard/workspace/notebook/${nb.id}`)
        }}
      />

      {filteredSubfolders.length === 0 && filteredDocuments.length === 0 && filteredNotebooks.length === 0 ? (
        <EmptyState icon={FolderOpen} title={ui.folder.empty} />
      ) : (
        <div className="space-y-8">
          {/* FOLDERS-FIRST DESIGN (Student Experience audit PART 10) — same
              fix as the Workspace home page: subfolders get their own
              labeled section instead of being interleaved with notebooks/
              documents in one undifferentiated grid. */}
          {filteredSubfolders.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-ink/50 dark:text-white/50 uppercase tracking-wide mb-3">
                {ui.folder.folders}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredSubfolders.map((f) => (
                  <FolderCard
                    key={f.id}
                    folder={f}
                    onOpen={() => router.push(`/dashboard/workspace/folder/${f.id}`)}
                    onRename={(name) => renameFolder(f, name)}
                    onToggleStar={() => toggleFolderStar(f)}
                    onDelete={() => deleteFolder(f)}
                    onColorChange={(color) => changeFolderColor(f, color)}
                  />
                ))}
              </div>
            </section>
          )}

          {(filteredNotebooks.length > 0 || filteredDocuments.length > 0) && (
            <section>
              <h2 className="text-sm font-semibold text-ink/50 dark:text-white/50 uppercase tracking-wide mb-3">
                {ui.folder.documents}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredNotebooks.map((nb) => (
                  <NotebookCard
                    key={nb.id}
                    notebook={nb}
                    onOpen={() => router.push(`/dashboard/workspace/notebook/${nb.id}`)}
                    onRename={(name) => renameNotebook(nb, name)}
                    onToggleStar={() => toggleNotebookStar(nb)}
                    onDelete={() => deleteNotebook(nb)}
                  />
                ))}
                {filteredDocuments.map((d) => (
                  <DocumentCard
                    key={d.id}
                    document={d}
                    onOpen={() => router.push(`/dashboard/workspace/document/${d.id}`)}
                    onRename={(name) => renameDocument(d, name)}
                    onToggleStar={() => toggleDocumentStar(d)}
                    onDelete={() => deleteDocument(d)}
                    onDownload={() => downloadDocument(d)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </WorkspaceShell>
  )
}
