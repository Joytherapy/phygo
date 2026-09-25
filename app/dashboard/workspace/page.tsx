'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileText, FolderOpen, Loader2 } from 'lucide-react'
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

export default function WorkspaceHomePage() {
  const router = useRouter()
  const ui = useWorkspaceUi()
  const supabase = getSupabaseBrowserClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([])
  const [notebooks, setNotebooks] = useState<WorkspaceNotebook[]>([])
  const [recent, setRecent] = useState<WorkspaceDocument[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    folders: WorkspaceFolder[]
    documents: WorkspaceDocument[]
    notebooks: WorkspaceNotebook[]
  } | null>(null)

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

    const [foldersRes, documentsRes, notebooksRes, recentRes] = await Promise.all([
      supabase
        .from('workspace_folders')
        .select('*')
        .eq('owner_id', user.id)
        .is('parent_id', null)
        .is('deleted_at', null)
        .order('name', { ascending: true }),
      supabase
        .from('workspace_documents')
        .select('*')
        .eq('owner_id', user.id)
        .is('folder_id', null)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false }),
      supabase
        .from('workspace_notebooks')
        .select('*')
        .eq('owner_id', user.id)
        .is('folder_id', null)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false }),
      supabase
        .from('workspace_documents')
        .select('*')
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .not('last_opened_at', 'is', null)
        .order('last_opened_at', { ascending: false })
        .limit(6),
    ])

    if (foldersRes.error || documentsRes.error || notebooksRes.error || recentRes.error) {
      setError(
        foldersRes.error?.message || documentsRes.error?.message || notebooksRes.error?.message || recentRes.error?.message || 'Failed to load Workspace'
      )
      setLoading(false)
      return
    }

    setFolders(foldersRes.data || [])
    setDocuments(documentsRes.data || [])
    setNotebooks(notebooksRes.data || [])
    setRecent(recentRes.data || [])
    setLoading(false)
  }, [router, supabase])

  useEffect(() => {
    load()
  }, [load])

  // Workspace-wide search (not folder-scoped) — filenames + folder names,
  // per the V1 search scope in the implementation brief §23.
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setSearchResults(null)
      return
    }
    const timeout = setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const [f, d, n] = await Promise.all([
        supabase
          .from('workspace_folders')
          .select('*')
          .eq('owner_id', user.id)
          .is('deleted_at', null)
          .ilike('name', `%${q}%`)
          .limit(20),
        supabase
          .from('workspace_documents')
          .select('*')
          .eq('owner_id', user.id)
          .is('deleted_at', null)
          .ilike('name', `%${q}%`)
          .limit(20),
        supabase
          .from('workspace_notebooks')
          .select('*')
          .eq('owner_id', user.id)
          .is('deleted_at', null)
          .ilike('name', `%${q}%`)
          .limit(20),
      ])
      setSearchResults({ folders: f.data || [], documents: d.data || [], notebooks: n.data || [] })
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, supabase])

  const toggleFolderStar = async (folder: WorkspaceFolder) => {
    setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, starred: !f.starred } : f)))
    await fetch(`/api/workspace/folders/${folder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: !folder.starred }),
    })
  }

  const renameFolder = async (folder: WorkspaceFolder, name: string) => {
    setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, name } : f)))
    await fetch(`/api/workspace/folders/${folder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  const deleteFolder = async (folder: WorkspaceFolder) => {
    setFolders((prev) => prev.filter((f) => f.id !== folder.id))
    await fetch(`/api/workspace/folders/${folder.id}`, { method: 'DELETE' })
  }

  const changeFolderColor = async (folder: WorkspaceFolder, color: string | null) => {
    setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, color } : f)))
    await fetch(`/api/workspace/folders/${folder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color }),
    })
  }

  const toggleDocumentStar = async (doc: WorkspaceDocument) => {
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, starred: !d.starred } : d)))
    await fetch(`/api/workspace/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: !doc.starred }),
    })
  }

  const renameDocument = async (doc: WorkspaceDocument, name: string) => {
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, name } : d)))
    await fetch(`/api/workspace/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  const deleteDocument = async (doc: WorkspaceDocument) => {
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    await fetch(`/api/workspace/documents/${doc.id}`, { method: 'DELETE' })
  }

  const downloadDocument = async (doc: WorkspaceDocument) => {
    const res = await fetch(`/api/workspace/documents/${doc.id}/signed-url`)
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

  if (error) {
    return (
      <WorkspaceShell>
        <ErrorState message={error} onRetry={load} />
      </WorkspaceShell>
    )
  }

  const continueDoc = recent.find((d) => d.page_count && d.page_count > 0) || recent[0]

  return (
    <WorkspaceShell>
      <WorkspaceHeader
        title={ui.home.title}
        subtitle={ui.home.subtitle}
        folderId={null}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFolderCreated={(f) => setFolders((prev) => [...prev, f])}
        onDocumentImported={(d) => {
          setDocuments((prev) => [d, ...prev])
          router.push(`/dashboard/workspace/document/${d.id}`)
        }}
        onNotebookCreated={(nb) => {
          setNotebooks((prev) => [nb, ...prev])
          router.push(`/dashboard/workspace/notebook/${nb.id}`)
        }}
      />

      {searchResults ? (
        <section>
          <h2 className="text-sm font-semibold text-ink/50 dark:text-white/50 uppercase tracking-wide mb-3">
            {ui.search.resultsIn} Workspace
          </h2>
          {searchResults.folders.length === 0 && searchResults.documents.length === 0 && searchResults.notebooks.length === 0 ? (
            <p className="text-sm text-ink/40 dark:text-white/40">{ui.search.noResults}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchResults.folders.map((f) => (
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
              {searchResults.notebooks.map((nb) => (
                <NotebookCard
                  key={nb.id}
                  notebook={nb}
                  onOpen={() => router.push(`/dashboard/workspace/notebook/${nb.id}`)}
                  onRename={(name) => renameNotebook(nb, name)}
                  onToggleStar={() => toggleNotebookStar(nb)}
                  onDelete={() => deleteNotebook(nb)}
                />
              ))}
              {searchResults.documents.map((d) => (
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
          )}
        </section>
      ) : (
        <div className="space-y-10">
          {continueDoc && (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-sm font-semibold text-ink/50 dark:text-white/50 uppercase tracking-wide mb-3">
                {ui.home.continueReading}
              </h2>
              <div
                onClick={() => router.push(`/dashboard/workspace/document/${continueDoc.id}`)}
                className="cursor-pointer rounded-[28px] border border-[#4F7CFF]/20 bg-gradient-to-br from-[#4F7CFF]/[0.06] to-[#32D6A0]/[0.06] p-6 flex items-center gap-5 hover:border-[#4F7CFF]/40 transition-colors"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-white/10 text-[#4F7CFF] shadow-soft">
                  <FileText size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-ink dark:text-white truncate">{continueDoc.name}</p>
                  <p className="text-xs text-ink/50 dark:text-white/50 mt-1">
                    {continueDoc.page_count
                      ? `${ui.reader.page} ${continueDoc.last_page} ${ui.reader.of} ${continueDoc.page_count}`
                      : ui.item.lastOpened}
                  </p>
                </div>
                <span className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-white" style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}>
                  {ui.item.open}
                </span>
              </div>
            </motion.section>
          )}

          {recent.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-ink/50 dark:text-white/50 uppercase tracking-wide mb-3">
                {ui.home.recent}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recent.map((d) => (
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

          {folders.length === 0 && documents.length === 0 && notebooks.length === 0 ? (
            <EmptyState icon={FolderOpen} title={ui.home.empty} />
          ) : (
            <>
              {/* FOLDERS-FIRST DESIGN (Student Experience audit PART 10):
                  folders used to be interleaved in the same grid as
                  notebooks/documents under one "Folders" heading — visually
                  a folder read as "just another file" with a slightly
                  different icon. Split into two clearly separate, clearly
                  labeled sections so a folder is immediately recognizable as
                  a CONTAINER, never confused with the files inside it. */}
              {folders.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-ink/50 dark:text-white/50 uppercase tracking-wide mb-3">
                    {ui.folder.folders}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {folders.map((f) => (
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

              {(notebooks.length > 0 || documents.length > 0) && (
                <section>
                  <h2 className="text-sm font-semibold text-ink/50 dark:text-white/50 uppercase tracking-wide mb-3">
                    {ui.folder.documents}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {notebooks.map((nb) => (
                      <NotebookCard
                        key={nb.id}
                        notebook={nb}
                        onOpen={() => router.push(`/dashboard/workspace/notebook/${nb.id}`)}
                        onRename={(name) => renameNotebook(nb, name)}
                        onToggleStar={() => toggleNotebookStar(nb)}
                        onDelete={() => deleteNotebook(nb)}
                      />
                    ))}
                    {documents.map((d) => (
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
            </>
          )}
        </div>
      )}
    </WorkspaceShell>
  )
}
