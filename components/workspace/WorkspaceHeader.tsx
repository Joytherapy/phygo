'use client'

import { useState } from 'react'
import { Search, FolderPlus, BookOpen } from 'lucide-react'
import ImportPdfButton from './ImportPdfButton'
import NewFolderDialog from './NewFolderDialog'
import NewNotebookDialog from './NewNotebookDialog'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import type { WorkspaceDocument, WorkspaceFolder, WorkspaceNotebook, WorkspaceNotebookPage } from '@/lib/workspace/types'

export default function WorkspaceHeader({
  title,
  subtitle,
  folderId,
  searchQuery,
  onSearchChange,
  onFolderCreated,
  onDocumentImported,
  onNotebookCreated,
}: {
  title: string
  subtitle?: string
  folderId: string | null
  searchQuery: string
  onSearchChange: (q: string) => void
  onFolderCreated: (folder: WorkspaceFolder) => void
  onDocumentImported: (document: WorkspaceDocument) => void
  onNotebookCreated: (notebook: WorkspaceNotebook, page: WorkspaceNotebookPage) => void
}) {
  const ui = useWorkspaceUi()
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newNotebookOpen, setNewNotebookOpen] = useState(false)

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink/50 dark:text-white/50">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewFolderOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 dark:text-white/70 border border-black/10 dark:border-white/10 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
          >
            <FolderPlus size={14} />
            {ui.home.newFolder}
          </button>
          <button
            onClick={() => setNewNotebookOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 dark:text-white/70 border border-black/10 dark:border-white/10 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
          >
            <BookOpen size={14} />
            {ui.home.newNotebook}
          </button>
          <ImportPdfButton folderId={folderId} onImported={onDocumentImported} />
        </div>
      </div>

      <div className="relative mt-5">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={ui.search.placeholder}
          className="w-full max-w-sm rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
        />
      </div>

      <NewFolderDialog
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        parentId={folderId}
        onCreated={onFolderCreated}
      />
      <NewNotebookDialog
        open={newNotebookOpen}
        onClose={() => setNewNotebookOpen(false)}
        folderId={folderId}
        onCreated={onNotebookCreated}
      />
    </div>
  )
}
