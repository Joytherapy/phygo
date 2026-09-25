'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MoreHorizontal } from 'lucide-react'

export type ItemMenuAction = {
  key: string
  label: string
  icon: React.ReactNode
  onSelect: () => void
  destructive?: boolean
}

// Shared "..." action menu for FolderCard/DocumentCard — every action here is
// wired to a real handler by the caller; this component never invents one.
export default function ItemMenu({ actions }: { actions: ItemMenuAction[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        aria-label="More actions"
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-ink/40 dark:text-white/40 hover:bg-ink/5 dark:hover:bg-white/10 hover:text-ink dark:hover:text-white transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-full mt-1.5 w-44 z-20 rounded-xl2 border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#171821] shadow-lift p-1.5"
          >
            {actions.map((a) => (
              <button
                key={a.key}
                onClick={() => {
                  setOpen(false)
                  a.onSelect()
                }}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
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
