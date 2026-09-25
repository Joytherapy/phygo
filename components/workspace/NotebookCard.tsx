'use client'

import { useState } from 'react'
import { BookOpen, Star, Pencil, Trash2, Check, X } from 'lucide-react'
import ItemMenu from './ItemMenu'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import type { WorkspaceNotebook } from '@/lib/workspace/types'

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
      className="group relative flex items-center gap-3 rounded-xl2 border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4 cursor-pointer transition-colors hover:border-[#4F7CFF]/30 hover:bg-[#4F7CFF]/[0.03]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4F7CFF]/10 text-[#4F7CFF]">
        <BookOpen size={17} />
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
              className="w-full rounded-lg border border-[#4F7CFF]/40 bg-white dark:bg-[#12131a] px-2 py-1 text-sm text-ink dark:text-white outline-none"
            />
            <button onClick={commitRename} className="text-[#4F7CFF]">
              <Check size={14} />
            </button>
            <button onClick={() => setRenaming(false)} className="text-ink/40 dark:text-white/40">
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-ink dark:text-white truncate">{notebook.name}</p>
            {notebook.last_opened_at && <p className="text-xs text-ink/40 dark:text-white/40 mt-0.5">{ui.item.lastOpened}</p>}
          </>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {notebook.starred && <Star size={13} className="text-amber-400 fill-amber-400" />}
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
              label: notebook.starred ? ui.item.unstar : ui.item.star,
              icon: <Star size={13} />,
              onSelect: onToggleStar,
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
