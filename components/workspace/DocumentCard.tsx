'use client'

import { useState } from 'react'
import { FileText, Star, Pencil, Trash2, Download, Check, X } from 'lucide-react'
import ItemMenu from './ItemMenu'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import type { WorkspaceDocument } from '@/lib/workspace/types'

// THIRD PASS — see FolderCard.tsx for the full rationale. Same modest
// portrait card shape, green-accented, with a slim progress bar along the
// bottom of the cover area instead of a small pie-chart badge.
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
      className="group relative flex aspect-[3/4] flex-col overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lift hover:border-black/[0.1] dark:hover:border-white/20"
    >
      <div className="relative flex flex-1 items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#32D6A0]/10 text-[#32D6A0]">
          <FileText size={26} strokeWidth={1.7} />
        </span>
        {progress !== null && (
          <div className="absolute inset-x-4 bottom-3 h-1 rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-[#32D6A0]" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {document.starred && (
        <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-[#171821] shadow-soft">
          <Star size={10} className="text-amber-400 fill-amber-400" />
        </span>
      )}

      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <ItemMenu
          actions={[
            { key: 'rename', label: ui.item.rename, icon: <Pencil size={13} />, onSelect: () => setRenaming(true) },
            { key: 'star', label: document.starred ? ui.item.unstar : ui.item.star, icon: <Star size={13} />, onSelect: onToggleStar },
            { key: 'download', label: 'Download', icon: <Download size={13} />, onSelect: onDownload },
            { key: 'delete', label: ui.item.delete, icon: <Trash2 size={13} />, onSelect: onDelete, destructive: true },
          ]}
        />
      </div>

      <div className="border-t border-black/[0.04] dark:border-white/[0.06] px-3 py-2.5">
        {renaming ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              className="w-full rounded-lg border border-[#32D6A0]/40 bg-white dark:bg-[#12131a] px-1.5 py-0.5 text-xs text-ink dark:text-white outline-none"
            />
            <button onClick={commitRename} className="text-[#32D6A0] shrink-0">
              <Check size={13} />
            </button>
            <button onClick={() => setRenaming(false)} className="text-ink/40 dark:text-white/40 shrink-0">
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-ink dark:text-white truncate text-center">{document.name}</p>
            <p className="text-[11px] text-ink/40 dark:text-white/40 text-center mt-0.5 truncate">
              {document.page_count ? `${document.last_page}/${document.page_count} ${ui.item.pages}` : ui.item.pages}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
