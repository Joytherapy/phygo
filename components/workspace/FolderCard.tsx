'use client'

import { useEffect, useRef, useState } from 'react'
import { Folder, Star, Pencil, Trash2, Check, X, Palette } from 'lucide-react'
import ItemMenu from './ItemMenu'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import { FOLDER_COLORS, type WorkspaceFolder } from '@/lib/workspace/types'

export default function FolderCard({
  folder,
  onOpen,
  onRename,
  onToggleStar,
  onDelete,
  onColorChange,
}: {
  folder: WorkspaceFolder
  onOpen: () => void
  onRename: (name: string) => void
  onToggleStar: () => void
  onDelete: () => void
  onColorChange: (color: string | null) => void
}) {
  const ui = useWorkspaceUi()
  const [renaming, setRenaming] = useState(false)
  const [draftName, setDraftName] = useState(folder.name)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!colorPickerOpen) return
    const onClick = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) setColorPickerOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [colorPickerOpen])

  const commitRename = () => {
    const trimmed = draftName.trim()
    if (trimmed && trimmed !== folder.name) onRename(trimmed)
    setRenaming(false)
  }

  const iconColor = folder.color || '#4F7CFF'

  return (
    <div
      onClick={() => !renaming && onOpen()}
      className="group relative flex items-center gap-3 rounded-xl2 border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4 cursor-pointer transition-colors hover:border-[#4F7CFF]/30 hover:bg-[#4F7CFF]/[0.03]"
      style={folder.color ? { borderColor: `${folder.color}40` } : undefined}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${iconColor}1A`, color: iconColor }}
      >
        <Folder size={17} />
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
            <button onClick={commitRename} className="text-[#32D6A0]">
              <Check size={14} />
            </button>
            <button onClick={() => setRenaming(false)} className="text-ink/40 dark:text-white/40">
              <X size={14} />
            </button>
          </div>
        ) : (
          <p className="text-sm font-semibold text-ink dark:text-white truncate">{folder.name}</p>
        )}
      </div>

      <div className="relative flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {folder.starred && <Star size={13} className="text-amber-400 fill-amber-400" />}
        <ItemMenu
          actions={[
            {
              key: 'rename',
              label: ui.item.rename,
              icon: <Pencil size={13} />,
              onSelect: () => setRenaming(true),
            },
            {
              key: 'color',
              label: ui.item.color,
              icon: <Palette size={13} />,
              onSelect: () => setColorPickerOpen(true),
            },
            {
              key: 'star',
              label: folder.starred ? ui.item.unstar : ui.item.star,
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

        {colorPickerOpen && (
          <div
            ref={colorPickerRef}
            className="absolute right-0 top-full mt-1.5 z-30 flex items-center gap-1.5 rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#171821] shadow-lift p-2"
          >
            <button
              onClick={() => {
                onColorChange(null)
                setColorPickerOpen(false)
              }}
              aria-label="None"
              className={`h-5 w-5 rounded-full border-2 border-dashed ${!folder.color ? 'border-ink dark:border-white' : 'border-black/20 dark:border-white/20'}`}
            />
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  onColorChange(c)
                  setColorPickerOpen(false)
                }}
                aria-label={c}
                className={`h-5 w-5 rounded-full border transition-transform ${folder.color === c ? 'scale-110 border-ink dark:border-white' : 'border-black/10 dark:border-white/20'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
