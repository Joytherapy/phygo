'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2, FolderPlus } from 'lucide-react'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import { FOLDER_COLORS, type WorkspaceFolder } from '@/lib/workspace/types'

export default function NewFolderDialog({
  open,
  onClose,
  parentId,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  parentId: string | null
  onCreated: (folder: WorkspaceFolder) => void
}) {
  const ui = useWorkspaceUi()
  const [name, setName] = useState('')
  const [color, setColor] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError(ui.dialog.newFolderPlaceholder)
      return
    }
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/workspace/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, parent_id: parentId, color }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create folder')
      onCreated(json.folder)
      setName('')
      setColor(null)
      onClose()
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-[24px] border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#12131a] shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F7CFF]/10 text-[#4F7CFF]">
                  <FolderPlus size={15} />
                </span>
                <h2 className="text-sm font-semibold text-ink dark:text-white">{ui.dialog.newFolderTitle}</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink/40 dark:text-white/40 hover:bg-ink/5 dark:hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </div>

            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder={ui.dialog.newFolderPlaceholder}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-4 py-3 text-sm outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
            />

            <div className="mt-3 flex items-center gap-1.5">
              <button
                onClick={() => setColor(null)}
                aria-label="None"
                className={`h-5 w-5 rounded-full border-2 border-dashed ${!color ? 'border-ink dark:border-white' : 'border-black/20 dark:border-white/20'}`}
              />
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={`h-5 w-5 rounded-full border transition-transform ${color === c ? 'scale-110 border-ink dark:border-white' : 'border-black/10 dark:border-white/20'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

            <div className="mt-5 flex gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-ink/60 dark:text-white/60 border border-black/10 dark:border-white/10 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
              >
                {ui.dialog.cancel}
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {ui.dialog.create}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
