'use client'

import { useState } from 'react'
import { BookOpen, Star, Pencil, Trash2, Check, X } from 'lucide-react'
import ItemMenu from './ItemMenu'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import type { WorkspaceNotebook } from '@/lib/workspace/types'

// THIRD PASS — see FolderCard.tsx for the full rationale. Same modest
// portrait card shape, blue-accented, with a thin spine strip on the left
// edge of the cover to read as a notebook rather than a flat page.
export default function NotebookCard({
  notebook,
  onOpen,
  onRename,
  onToggleStar,
  onDelete,
}: {
  notebook: WorkspaceNotebook
  onOpen: () => void
  onRename: (name: string) => void
  onToggleStar: () => void
  onDelete: () => void
}) {
  const ui = useWorkspaceUi()
  const [renaming, setRenaming] = useState(false)
  const [draftName, setDraftName] = useState(notebook.name)

  const commitRename = () => {
    const trimmed = draftName.trim()
    if (trimmed && trimmed !== notebook.name) onRename(trimmed)
    setRenaming(false)
  }

  return (
    <div
      onClick={() => !renaming && onOpen()}
      className="group relative flex aspect-[3/4] flex-col overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lift hover:border-black/[0.1] dark:hover:border-white/20"
    >
      <div className="relative flex flex-1 items-center justify-center">
        <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-[#4F7CFF]/30" />
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F7CFF]/10 text-[#4F7CFF]">
          <BookOpen size={26} strokeWidth={1.7} />
        </span>
      </div>

      {notebook.starred && (
        <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-[#171821] shadow-soft">
          <Star size={10} className="text-amber-400 fill-amber-400" />
        </span>
      )}

      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <ItemMenu
          actions={[
            { key: 'rename', label: ui.item.rename, icon: <Pencil size={13} />, onSelect: () => setRenaming(true) },
            { key: 'star', label: notebook.starred ? ui.item.unstar : ui.item.star, icon: <Star size={13} />, onSelect: onToggleStar },
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
              className="w-full rounded-lg border border-[#4F7CFF]/40 bg-white dark:bg-[#12131a] px-1.5 py-0.5 text-xs text-ink dark:text-white outline-none"
            />
            <button onClick={commitRename} className="text-[#4F7CFF] shrink-0">
              <Check size={13} />
            </button>
            <button onClick={() => setRenaming(false)} className="text-ink/40 dark:text-white/40 shrink-0">
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-ink dark:text-white truncate text-center">{notebook.name}</p>
            {notebook.last_opened_at && <p className="text-[11px] text-ink/40 dark:text-white/40 text-center mt-0.5 truncate">{ui.item.lastOpened}</p>}
          </>
        )}
      </div>
    </div>
  )
}
