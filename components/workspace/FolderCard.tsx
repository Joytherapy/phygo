'use client'

import { useEffect, useRef, useState } from 'react'
import { Folder, Star, Pencil, Trash2, Check, X, Palette } from 'lucide-react'
import ItemMenu from './ItemMenu'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import { FOLDER_COLORS, type WorkspaceFolder } from '@/lib/workspace/types'

// THIRD PASS on the GoodNotes-style redesign. First pass: big square covers
// with a full gradient background — user liked the organization but called
// it too showy. Second pass over-corrected into tiny flat system-style
// icons — user called that "osceno" (looks broken/empty, not like a real
// notebook app). This version is the middle ground, closer to what
// GoodNotes actually does: a modest PORTRAIT card (like a mini page, not a
// square icon), a calm flat-tinted badge (no gradient) sized to read clearly
// without dominating the tile, plain neutral card background. The grid uses
// `repeat(auto-fill, minmax(...))` (see the page files) instead of fixed
// breakpoint column counts, so a nearly-empty Workspace doesn't stretch a
// couple of tiles into giant blocks, and a full one still packs in tightly.
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
      className="group relative flex aspect-[3/4] flex-col overflow-hidden rounded-2xl border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.03] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lift hover:border-black/[0.1] dark:hover:border-white/20"
    >
      <div className="flex flex-1 items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${iconColor}17` }}>
          <Folder size={26} strokeWidth={1.7} style={{ color: iconColor }} />
        </span>
      </div>

      {folder.starred && (
        <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-[#171821] shadow-soft">
          <Star size={10} className="text-amber-400 fill-amber-400" />
        </span>
      )}

      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <ItemMenu
          actions={[
            { key: 'rename', label: ui.item.rename, icon: <Pencil size={13} />, onSelect: () => setRenaming(true) },
            { key: 'color', label: ui.item.color, icon: <Palette size={13} />, onSelect: () => setColorPickerOpen(true) },
            { key: 'star', label: folder.starred ? ui.item.unstar : ui.item.star, icon: <Star size={13} />, onSelect: onToggleStar },
            { key: 'delete', label: ui.item.delete, icon: <Trash2 size={13} />, onSelect: onDelete, destructive: true },
          ]}
        />
        {colorPickerOpen && (
          <div
            ref={colorPickerRef}
            className="absolute right-0 top-full mt-1.5 z-30 flex items-center gap-1.5 rounded-xl border border-black/[0.09] dark:border-white/10 bg-white dark:bg-[#171821] shadow-lift p-2"
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

      <div className="border-t border-black/[0.08] dark:border-white/[0.06] px-3 py-2.5">
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
            <button onClick={commitRename} className="text-[#32D6A0] shrink-0">
              <Check size={13} />
            </button>
            <button onClick={() => setRenaming(false)} className="text-ink/55 dark:text-white/40 shrink-0">
              <X size={13} />
            </button>
          </div>
        ) : (
          <p className="text-sm font-medium text-ink dark:text-white truncate text-center">{folder.name}</p>
        )}
      </div>
    </div>
  )
}
