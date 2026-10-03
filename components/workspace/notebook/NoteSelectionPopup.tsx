'use client'

// PHYGO Smart Study Panel trigger for NOTEBOOK notes — the notebook
// equivalent of components/workspace/pdf/TextSelectionPopup.tsx, which only
// ever watches window.getSelection() and therefore only ever works over
// real PDF text (rendered by react-pdf as plain DOM text nodes). A
// notebook's own written notes live inside a <textarea> (see
// TextAnnotationLayer's `data-note-textarea` marker), and selecting text
// INSIDE a textarea/input is a completely different, form-control-only
// selection model — it never appears in window.getSelection() at all, in
// any browser — so it needs its own detection here rather than reusing
// TextSelectionPopup's Range-based logic.
//
// Deliberately narrower than TextSelectionPopup: no Highlight/Add-to-Notes
// (there's no sensible meaning for "highlight a fragment of this note" or
// "add a note about this note" the way there is for a PDF page), just Copy
// and "Explore with PHYGO" — the one thing the user actually asked for
// here. Same "nothing auto-fires" principle as the PDF popup: this only
// ever appears after a real, deliberate text selection, never while typing.

import { useEffect, useRef, useState, type RefObject } from 'react'
import { BookOpen, Copy, Check } from 'lucide-react'
import { useStudyPanel } from '@/contexts/StudyPanelContext'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'

export default function NoteSelectionPopup({
  containerRef,
  enabled,
}: {
  containerRef: RefObject<HTMLElement>
  /** Same gating convention as TextSelectionPopup: only while the Select
   *  tool is active (the only tool under which a note's textarea isn't
   *  itself capturing the pointer for something else). */
  enabled: boolean
}) {
  const ui = useWorkspaceUi()
  const { openWithSelection } = useStudyPanel()
  const [popup, setPopup] = useState<{ x: number; y: number; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) {
      setPopup(null)
      return
    }

    const checkSelection = (e: Event) => {
      // Ignore an event that landed on the popup itself — otherwise the
      // mouseup that ends a click on one of its own buttons would
      // re-evaluate (now-blurred) state and hide it before onClick fires.
      if (popupRef.current && e.target instanceof Node && popupRef.current.contains(e.target)) return

      const container = containerRef.current
      const el = document.activeElement as HTMLTextAreaElement | null
      if (!container || !el || el.dataset.noteTextarea !== 'true' || !container.contains(el)) {
        setPopup(null)
        return
      }

      const start = el.selectionStart
      const end = el.selectionEnd
      if (start == null || end == null || start === end) {
        setPopup(null)
        return
      }

      const text = el.value.slice(start, end).trim()
      if (!text) {
        setPopup(null)
        return
      }

      const rect = el.getBoundingClientRect()
      setCopied(false)
      setPopup({ x: rect.left + rect.width / 2, y: rect.top, text })
    }

    // 'mouseup' covers a drag-selection, 'keyup' covers a keyboard one
    // (Shift+Arrow, Shift+Home, double-click already fires its own mouseup).
    document.addEventListener('mouseup', checkSelection)
    document.addEventListener('keyup', checkSelection)
    const handleScroll = () => setPopup(null)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mouseup', checkSelection)
      document.removeEventListener('keyup', checkSelection)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [enabled, containerRef])

  if (!popup) return null

  const iconBtn =
    'flex h-7 w-7 items-center justify-center rounded-full text-ink/60 dark:text-white/60 hover:bg-ink/5 dark:hover:bg-white/10 hover:text-ink dark:hover:text-white transition-colors'

  return (
    <div
      ref={popupRef}
      className="fixed z-[82] flex items-center gap-0.5 -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-full bg-white dark:bg-[#171821] border border-black/[0.06] dark:border-white/10 shadow-lift p-1"
      style={{ left: popup.x, top: popup.y }}
    >
      <button
        onClick={() => {
          navigator.clipboard?.writeText(popup.text).catch(() => {})
          setCopied(true)
          setTimeout(() => setCopied(false), 1400)
        }}
        aria-label={copied ? ui.selectionPopup.copied : ui.selectionPopup.copy}
        title={copied ? ui.selectionPopup.copied : ui.selectionPopup.copy}
        className={iconBtn}
      >
        {copied ? <Check size={13} className="text-[#32D6A0]" /> : <Copy size={13} />}
      </button>

      <div className="mx-0.5 h-4 w-px bg-black/[0.08] dark:bg-white/10" />

      <button
        onClick={() => {
          openWithSelection(popup.text)
          setPopup(null)
        }}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white transition-transform hover:scale-105"
        style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
      >
        <BookOpen size={12} />
        {ui.studyPanel.explore}
      </button>
    </div>
  )
}
