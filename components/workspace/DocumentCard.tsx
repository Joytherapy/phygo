'use client'

import { useState } from 'react'
import { FileText, Star, Pencil, Trash2, Download, Check, X } from 'lucide-react'
import ItemMenu from './ItemMenu'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import type { WorkspaceDocument } from '@/lib/workspace/types'

export default function DocumentCard({
  document,
  onOpen,
  onRename,
  onToggleStar,
  onDelete,
  onDownload,
}: {
  document: WorkspaceDocument
  onOpen: () => void
  onRename: (name: string) => void
  onToggleStar: () => void
  onDelete: () => void
  onDownload: () => void
}) {
  const ui = useWorkspaceUi()
  const [renaming, setRenaming] = useState(false)
  const [draftName, setDraftName] = useState(document.name)

  const commitRename = () => {
    const trimmed = draftName.trim()
    if (trimmed && trimmed !== document.name) onRename(trimmed)
    setRenaming(false)
  }

  const progress =
    document.page_count && document.page_count > 0
      ? Math.min(100, Math.round((document.last_page / document.page_count) * 100))
      : null

  return (
    <div
      onClick={() => !renaming && onOpen()}
      className="group relative flex items-center gap-3 rounded-xl2 border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4 cursor-pointer transition-colors hover:border-[#32D6A0]/30 hover:bg-[#32D6A0]/[0.03]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#32D6A0]/10 text-[#32D6A0]">
        <FileText size={17} />
      </span>

      <div className="min-w-0 flex-1">
        {renaming ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              className="w-full rounded-lg border border-[#32D6A0]/40 bg-white dark:bg-[#12131a] px-2 py-1 text-sm text-ink dark:text-white outline-none"
            />
            <button onClick={commitRename} className="text-[#32D6A0]">
              <Check size={14} />
            </button>
            <button onClick={() => setRenaming(false)} className="text-ink/40 dark:text-white/40">
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-ink dark:text-white truncate">{document.name}</p>
            <p className="text-xs text-ink/40 dark:text-white/40 mt-0.5">
              {document.page_count
                ? `${document.last_page} / ${document.page_count} ${ui.item.pages}`
                : ui.item.pages}
              {progress !== null && ` · ${progress}%`}
            </p>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {document.starred && <Star size={13} className="text-amber-400 fill-amber-400" />}
        <ItemMenu
          actions={[
            {
              key: 'rename',
              label: ui.item.rename,
              icon: <Pencil size={13} />,
              onSelect: () => setRenaming(true),
            },
            {
              key: 'star',
              label: document.starred ? ui.item.unstar : ui.item.star,
              icon: <Star size={13} />,
              onSelect: onToggleStar,
            },
            {
              key: 'download',
              label: 'Download',
              icon: <Download size={13} />,
              onSelect: onDownload,
            },
            {
              key: 'delete',
              label: ui.item.delete,
              icon: <Trash2 size={13} />,
              onSelect: onDelete,
              destructive: true,
            },
          ]}
        />
      </div>
    </div>
  )
}
