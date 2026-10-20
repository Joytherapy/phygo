'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MoreHorizontal } from 'lucide-react'
import { useDashboardUi } from '@/lib/i18n/dashboardStrings'

export type ItemMenuAction = {
  key: string
  label: string
  icon: React.ReactNode
  onSelect: () => void
  destructive?: boolean
}

// Shared "..." action menu for FolderCard/DocumentCard — every action here is
// wired to a real handler by the caller; this component never invents one.
export default function ItemMenu({ actions, onOpenChange }: { actions: ItemMenuAction[]; onOpenChange?: (open: boolean) => void }) {
  const t = useDashboardUi()
  const [open, setOpen] = useState(false)

  // Lets the card lift itself above its neighbours while the menu is open.
  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', handler)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={t.workspace.moreActions}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className="-m-1.5 flex h-10 w-10 items-center justify-center rounded-full text-ink/55 dark:text-white/40 hover:bg-ink/5 dark:hover:bg-white/10 hover:text-ink dark:hover:text-white transition-colors"
      >
        <MoreHorizontal size={16} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            role="menu"
            className="absolute right-0 top-full mt-1.5 z-30 min-w-[12.5rem] rounded-2xl border border-black/[0.06] bg-white/95 p-1.5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#121319]/95 dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            {actions.map((a) => (
              <button
                key={a.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  a.onSelect()
                }}
                className={`w-full flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  a.destructive
                    ? 'text-red-500 hover:bg-red-500/10'
                    : 'text-ink/70 dark:text-white/70 hover:bg-ink/5 dark:hover:bg-white/10'
                }`}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
