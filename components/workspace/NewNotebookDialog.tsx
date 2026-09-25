'use client'

// "New notebook" dialog — the GoodNotes-style paper picker (Size + Color +
// Template) shown once, up front, when a notebook (and its first blank
// page) is created. Each of these can still be changed later per-page from
// inside the notebook editor (see NotebookPageView's page-settings popover).

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2, BookOpen } from 'lucide-react'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import {
  NOTEBOOK_PAGE_COLORS,
  isDarkColor,
  type NotebookPageFormat,
  type NotebookPageTemplate,
  type WorkspaceNotebook,
  type WorkspaceNotebookPage,
} from '@/lib/workspace/types'

const FORMATS: NotebookPageFormat[] = ['a4', 'letter', 'square']
const TEMPLATES: NotebookPageTemplate[] = ['blank', 'ruled', 'grid', 'dotted']

export default function NewNotebookDialog({
  open,
  onClose,
  folderId,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  folderId: string | null
  onCreated: (notebook: WorkspaceNotebook, page: WorkspaceNotebookPage) => void
}) {
  const ui = useWorkspaceUi()
  const [name, setName] = useState('')
  const [format, setFormat] = useState<NotebookPageFormat>('a4')
  const [paperColor, setPaperColor] = useState<string>(NOTEBOOK_PAGE_COLORS[0])
  const [template, setTemplate] = useState<NotebookPageTemplate>('blank')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatLabel = (f: NotebookPageFormat) =>
    f === 'a4' ? ui.notebook.formatA4 : f === 'letter' ? ui.notebook.formatLetter : ui.notebook.formatSquare

  const templateLabel = (t: NotebookPageTemplate) =>
    t === 'blank' ? ui.notebook.templateBlank : t === 'ruled' ? ui.notebook.templateRuled : t === 'grid' ? ui.notebook.templateGrid : ui.notebook.templateDotted

  const reset = () => {
    setName('')
    setFormat('a4')
    setPaperColor(NOTEBOOK_PAGE_COLORS[0])
    setTemplate('blank')
    setError(null)
  }

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError(ui.dialog.newNotebookPlaceholder)
      return
    }
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/workspace/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, folder_id: folderId, format, paper_color: paperColor, template }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create notebook')
      onCreated(json.notebook, json.page)
      reset()
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
                  <BookOpen size={15} />
                </span>
                <h2 className="text-sm font-semibold text-ink dark:text-white">{ui.dialog.newNotebookTitle}</h2>
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
              placeholder={ui.dialog.newNotebookPlaceholder}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-4 py-3 text-sm outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
            />

            <div className="mt-4">
              <p className="text-xs font-medium text-ink/50 dark:text-white/50 mb-1.5">{ui.notebook.format}</p>
              <div className="flex items-center gap-1.5">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                      format === f
                        ? 'border-[#4F7CFF] bg-[#4F7CFF]/10 text-[#4F7CFF]'
                        : 'border-black/10 dark:border-white/10 text-ink/60 dark:text-white/60 hover:bg-ink/5 dark:hover:bg-white/10'
                    }`}
                  >
                    {formatLabel(f)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-ink/50 dark:text-white/50 mb-1.5">{ui.notebook.paperColor}</p>
              <div className="flex items-center gap-1.5">
                {NOTEBOOK_PAGE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPaperColor(c)}
                    aria-label={c}
                    className={`h-7 w-7 rounded-full border transition-transform ${
                      paperColor === c ? 'scale-110 border-[#4F7CFF]' : 'border-black/10 dark:border-white/20'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-ink/50 dark:text-white/50 mb-1.5">{ui.notebook.template}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {TEMPLATES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    title={templateLabel(t)}
                    className={`flex h-12 items-center justify-center rounded-lg border overflow-hidden transition-colors ${
                      template === t ? 'border-[#4F7CFF] ring-2 ring-[#4F7CFF]/20' : 'border-black/10 dark:border-white/10'
                    }`}
                    style={{ backgroundColor: paperColor }}
                  >
                    <TemplateSwatch template={t} dark={isDarkColor(paperColor)} />
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

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

function TemplateSwatch({ template, dark }: { template: NotebookPageTemplate; dark: boolean }) {
  const lineColor = dark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.25)'
  if (template === 'blank') return null
  if (template === 'ruled') {
    return (
      <div className="w-full h-full flex flex-col justify-evenly px-1.5 py-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-px w-full" style={{ backgroundColor: lineColor }} />
        ))}
      </div>
    )
  }
  if (template === 'grid') {
    return (
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: '7px 7px',
        }}
      />
    )
  }
  return (
    <div
      className="w-full h-full"
      style={{ backgroundImage: `radial-gradient(${lineColor} 1px, transparent 1px)`, backgroundSize: '7px 7px' }}
    />
  )
}
