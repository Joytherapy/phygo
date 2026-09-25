'use client'

// PHYGO Smart Study Panel — the panel UI itself. Mounted ONCE, globally, in
// app/dashboard/layout.tsx (same "one shared instance, driven by context"
// pattern as GlobalAskLauncher/AskPhygoPanel — see contexts/StudyPanelContext.tsx
// for why). Opens beside whatever page is already open; nothing here ever
// navigates the page away or unmounts the document underneath it, so the
// PDF's own scroll/zoom/page/annotation state is untouched while this is open.
//
// Deliberately NOT a chat interface — see the feature's own priority order
// (PHYGO Knowledge first; "Ask PHYGO"-style Q&A stays a separate, existing
// feature). This shows exactly one resolved knowledge object at a time, with
// two actions on it: pin a reference card onto the current document page, or
// save a personal reference to it independent of any document.

import { useEffect, useState } from 'react'
import { BookOpen, X, Loader2, ExternalLink, Check, Bookmark, BookmarkCheck, Pin } from 'lucide-react'
import { useStudyPanel } from '@/contexts/StudyPanelContext'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'

export default function StudyPanel() {
  const ui = useWorkspaceUi()
  const {
    open,
    selectionText,
    status,
    match,
    close,
    canAddToDocument,
    addToDocument,
    addedToDocument,
    savedKnowledgeIds,
    saveStatus,
    saveToWorkspace,
    removeFromWorkspace,
  } = useStudyPanel()

  const isSaved = Boolean(match && savedKnowledgeIds.has(match.knowledgeId))

  const [note, setNote] = useState('')
  const [noteStatus, setNoteStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // A fresh match (new selection, or panel reopened on a different one)
  // always starts with an empty note draft — never carries over a previous
  // knowledge object's note.
  useEffect(() => {
    setNote('')
    setNoteStatus('idle')
  }, [match?.knowledgeId])

  const saveNote = async () => {
    if (!match) return
    setNoteStatus('saving')
    try {
      const res = await fetch('/api/workspace/knowledge-saves')
      const json = await res.json()
      const row = (json.saves || []).find((s: any) => s.knowledge_type === match.knowledgeType && s.knowledge_id === match.knowledgeId)
      if (row) {
        await fetch(`/api/workspace/knowledge-saves/${row.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personal_note: note }),
        })
      }
      setNoteStatus('saved')
    } catch {
      setNoteStatus('idle')
    }
  }

  if (!open) return null

  const sectionLabel = match?.category ? (ui.studyPanel.systems as Record<string, string>)[match.category] || match.category : null

  return (
    <>
      {/* Backdrop — click to dismiss, mobile-only, same convention as
          GlobalAskLauncher (desktop just has the panel sit beside page
          content without blocking it). */}
      <div className="fixed inset-0 z-[76] bg-black/20 sm:hidden" onClick={close} />
      <div className="fixed inset-y-0 right-0 z-[81] w-full sm:w-96 p-0 sm:p-4">
        <div className="flex h-full w-full flex-col rounded-none sm:rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#0c0d12] overflow-hidden shadow-lift">
          <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/10 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-white min-w-0">
              <BookOpen size={15} className="text-[#4F7CFF] shrink-0" />
              <span className="truncate">{ui.studyPanel.title}</span>
            </div>
            <button
              onClick={close}
              aria-label={ui.studyPanel.close}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {selectionText && (
            <div className="px-4 py-2.5 border-b border-black/[0.06] dark:border-white/10 shrink-0">
              <p className="text-[10px] uppercase tracking-wide text-ink/30 dark:text-white/30 mb-0.5">{ui.studyPanel.selectionLabel}</p>
              <p className="text-xs text-ink/60 dark:text-white/60 line-clamp-2 italic">&ldquo;{selectionText}&rdquo;</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {status === 'loading' && (
              <p className="flex items-center gap-1.5 text-sm text-ink/40 dark:text-white/40">
                <Loader2 size={13} className="animate-spin" /> {ui.studyPanel.loading}
              </p>
            )}

            {status === 'empty' && <p className="text-sm text-ink/40 dark:text-white/40">{ui.studyPanel.empty}</p>}
            {status === 'error' && <p className="text-sm text-red-500">{ui.studyPanel.error}</p>}

            {status === 'found' && match && (
              <>
                <div>
                  {sectionLabel && (
                    <span className="inline-block mb-1.5 rounded-full bg-[#4F7CFF]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#4F7CFF]">
                      {sectionLabel}
                    </span>
                  )}
                  <h2 className="font-display text-base font-semibold tracking-tight text-ink dark:text-white">{match.title}</h2>
                  {match.href && (
                    <a
                      href={match.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#4F7CFF] hover:underline"
                    >
                      {ui.studyPanel.openInPhygo} <ExternalLink size={11} />
                    </a>
                  )}
                </div>

                {match.sections.map((s) => (
                  <div key={s.key}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-1">
                      {(ui.studyPanel.sections as Record<string, string>)[s.key] || s.key}
                    </h3>
                    <p className="text-sm text-ink/70 dark:text-white/70 whitespace-pre-wrap">{s.body}</p>
                  </div>
                ))}

                {isSaved && (
                  <div className="pt-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 mb-1">{ui.studyPanel.myNote}</h3>
                    <textarea
                      value={note}
                      onChange={(e) => {
                        setNote(e.target.value)
                        setNoteStatus('idle')
                      }}
                      onBlur={saveNote}
                      placeholder={ui.studyPanel.myNotePlaceholder}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/5 px-3 py-2 text-sm text-ink dark:text-white placeholder:text-ink/30 dark:placeholder:text-white/30 focus:outline-none focus:border-[#4F7CFF]/40"
                    />
                    {noteStatus === 'saved' && <p className="mt-1 text-[11px] text-ink/30 dark:text-white/30">{ui.studyPanel.noteSaved}</p>}
                  </div>
                )}
              </>
            )}
          </div>

          {status === 'found' && match && (
            <div className="border-t border-black/[0.06] dark:border-white/10 p-3 space-y-2 shrink-0">
              {canAddToDocument && (
                <button
                  onClick={addToDocument}
                  disabled={addedToDocument}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-60 transition-opacity"
                  style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
                >
                  {addedToDocument ? <Check size={14} /> : <Pin size={14} />}
                  {addedToDocument ? ui.studyPanel.addedToDocument : ui.studyPanel.addToDocument}
                </button>
              )}
              <button
                onClick={isSaved ? removeFromWorkspace : saveToWorkspace}
                disabled={saveStatus === 'saving'}
                className="flex w-full items-center justify-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/10 px-4 py-2 text-sm font-medium text-ink dark:text-white hover:bg-ink/5 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                {saveStatus === 'saving' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isSaved ? (
                  <BookmarkCheck size={14} className="text-[#4F7CFF]" />
                ) : (
                  <Bookmark size={14} />
                )}
                {isSaved ? ui.studyPanel.savedToWorkspace : ui.studyPanel.saveToWorkspace}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
