'use client'

// PHYGO Smart Study Panel trigger + SELECT-TEXT ACTION ROW (PHYGO Student
// Experience audit PART 4/9/11/13 — "SELECT TEXT → Copy / Highlight / Add to
// Notes / Explore with PHYGO"). Watches for a text selection made inside the
// PDF page (only while the Select tool is active, same gating as native text
// selection itself — see PdfViewer's `selectionEnabled`) and shows a small
// floating action row next to it. Nothing opens or fires automatically: per
// the Smart Study Panel's own matching rule ("silence is better than a wrong
// suggestion"), every action here only runs once the user explicitly clicks
// a button — there is no per-word auto-trigger, no hover popup.
//
// Positioned with `position: fixed` from the selection's own
// getBoundingClientRect(), so it tracks correctly regardless of the PDF
// reader's internal scroll offset or zoom level, exactly like a native
// browser "copy" selection toolbar would.
//
// REUSE, NOT DUPLICATION: Highlight and Add-to-Notes do not introduce a new
// annotation system — they create exactly the same 'highlight'/'text'
// WorkspaceAnnotation rows the rest of Workspace already renders/persists/
// undoes (HighlightData's `rects` is the same normalized-rect shape
// PdfViewer's highlight overlay already draws; the note uses
// TextAnnotationLayer's own DEFAULT_FONT_SIZE/DEFAULT_BOX_WIDTH). Copy is a
// plain `navigator.clipboard.writeText` — no new state, no new table.
// "Add to Document" already exists via the Smart Study Panel this button
// opens (studyPanel.addToDocument) and is untouched here.

import { useEffect, useRef, useState, type RefObject } from 'react'
import { BookOpen, Copy, Check, Highlighter, StickyNote } from 'lucide-react'
import { useStudyPanel } from '@/contexts/StudyPanelContext'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'

type NormalizedRect = { x: number; y: number; w: number; h: number }

export default function TextSelectionPopup({
  containerRef,
  enabled,
  highlightColor,
  onHighlight,
  onAddToNotes,
}: {
  containerRef: RefObject<HTMLElement>
  enabled: boolean
  /** Current Highlighter-tool color (PdfViewer's own `markerColor` state) —
   *  reused here so a highlight made from a text selection matches whatever
   *  color the student already has picked, instead of a second hardcoded
   *  default. */
  highlightColor: string
  /** Creates a real 'highlight' annotation from the selection's own
   *  per-line client rects, already normalized 0..1 against the page
   *  container — see PdfViewer's pageHighlights render path, which needs no
   *  changes to display these. */
  onHighlight: (rects: NormalizedRect[], text: string) => void
  /** Creates a real 'text' annotation pre-filled with the selected text,
   *  positioned just under the selection. */
  onAddToNotes: (x: number, y: number, text: string) => void
}) {
  const ui = useWorkspaceUi()
  const { openWithSelection } = useStudyPanel()
  const [popup, setPopup] = useState<{ x: number; y: number; text: string; rects: NormalizedRect[]; noteX: number; noteY: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [noted, setNoted] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) {
      setPopup(null)
      return
    }

    const handleMouseUp = (e: MouseEvent) => {
      // Ignore a click inside the popup itself — otherwise the mouseup that
      // ends the click would immediately re-evaluate the (now collapsed)
      // selection and hide it again before onClick fires.
      if (popupRef.current && popupRef.current.contains(e.target as Node)) return

      const sel = window.getSelection()
      const container = containerRef.current
      if (!sel || sel.isCollapsed || !container) {
        setPopup(null)
        return
      }
      const text = sel.toString().trim()
      const anchorNode = sel.anchorNode
      if (!text || !anchorNode || !container.contains(anchorNode)) {
        setPopup(null)
        return
      }

      const range = sel.getRangeAt(0)
      const boundingRect = range.getBoundingClientRect()
      if (boundingRect.width === 0 && boundingRect.height === 0) {
        setPopup(null)
        return
      }

      // One client rect per visual LINE the selection spans — exactly what
      // a precise, multi-line-aware highlight needs (as opposed to the
      // Highlighter drawing tool's single freehand path).
      const containerRect = container.getBoundingClientRect()
      const rects: NormalizedRect[] = Array.from(range.getClientRects())
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => ({
          x: (r.left - containerRect.left) / containerRect.width,
          y: (r.top - containerRect.top) / containerRect.height,
          w: r.width / containerRect.width,
          h: r.height / containerRect.height,
        }))
      if (rects.length === 0) {
        setPopup(null)
        return
      }

      setCopied(false)
      setNoted(false)
      setPopup({
        x: boundingRect.left + boundingRect.width / 2,
        y: boundingRect.top,
        text,
        rects,
        noteX: (boundingRect.left - containerRect.left) / containerRect.width,
        noteY: (boundingRect.bottom - containerRect.top) / containerRect.height + 0.01,
      })
    }

    const handleScroll = () => setPopup(null)

    document.addEventListener('mouseup', handleMouseUp)
    // Any scroll within the reader should hide a stale-positioned popup
    // rather than let it drift away from the text it points at.
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [enabled, containerRef])

  if (!popup) return null

  const iconBtn = 'flex h-7 w-7 items-center justify-center rounded-full text-ink/60 dark:text-white/60 hover:bg-ink/5 dark:hover:bg-white/10 hover:text-ink dark:hover:text-white transition-colors'

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

      <button
        onClick={() => {
          onHighlight(popup.rects, popup.text)
          window.getSelection()?.removeAllRanges()
          setPopup(null)
        }}
        aria-label={ui.selectionPopup.highlight}
        title={ui.selectionPopup.highlight}
        className={iconBtn}
      >
        <Highlighter size={13} style={{ color: highlightColor }} />
      </button>

      <button
        onClick={() => {
          onAddToNotes(popup.noteX, popup.noteY, popup.text)
          setNoted(true)
          window.getSelection()?.removeAllRanges()
          setTimeout(() => setPopup(null), 500)
        }}
        aria-label={noted ? ui.selectionPopup.addedToNotes : ui.selectionPopup.addToNotes}
        title={noted ? ui.selectionPopup.addedToNotes : ui.selectionPopup.addToNotes}
        className={iconBtn}
      >
        {noted ? <Check size={13} className="text-[#32D6A0]" /> : <StickyNote size={13} />}
      </button>

      <div className="mx-0.5 h-4 w-px bg-black/[0.08] dark:bg-white/10" />

      <button
        onClick={() => {
          openWithSelection(popup.text)
          window.getSelection()?.removeAllRanges()
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
