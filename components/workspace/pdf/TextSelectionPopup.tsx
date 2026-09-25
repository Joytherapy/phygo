'use client'

// PHYGO Smart Study Panel — the trigger. Watches for a text selection made
// inside the PDF page (only while the Select tool is active, same gating as
// native text selection itself — see PdfViewer's `selectionEnabled`) and
// shows a small "Explore with PHYGO" button next to it. Nothing opens
// automatically: per the feature's own matching rule ("silence is better
// than a wrong suggestion"), the panel only opens once the user explicitly
// clicks this button — there is no per-word auto-trigger, no hover popup.
//
// Positioned with `position: fixed` from the selection's own
// getBoundingClientRect(), so it tracks correctly regardless of the PDF
// reader's internal scroll offset or zoom level, exactly like a native
// browser "copy" selection toolbar would.

import { useEffect, useRef, useState, type RefObject } from 'react'
import { BookOpen } from 'lucide-react'
import { useStudyPanel } from '@/contexts/StudyPanelContext'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'

export default function TextSelectionPopup({ containerRef, enabled }: { containerRef: RefObject<HTMLElement>; enabled: boolean }) {
  const ui = useWorkspaceUi()
  const { openWithSelection } = useStudyPanel()
  const [popup, setPopup] = useState<{ x: number; y: number; text: string } | null>(null)
  const popupRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!enabled) {
      setPopup(null)
      return
    }

    const handleMouseUp = (e: MouseEvent) => {
      // Ignore a click on the popup button itself — otherwise the mouseup
      // that ends the click would immediately re-evaluate the (now
      // collapsed) selection and hide it again before onClick fires.
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

      const rect = sel.getRangeAt(0).getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        setPopup(null)
        return
      }
      setPopup({ x: rect.left + rect.width / 2, y: rect.top, text })
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

  return (
    <button
      ref={popupRef}
      onClick={() => {
        openWithSelection(popup.text)
        window.getSelection()?.removeAllRanges()
        setPopup(null)
      }}
      className="fixed z-[82] flex items-center gap-1.5 -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-full px-3 py-1.5 text-xs font-medium text-white shadow-lift transition-transform hover:scale-105"
      style={{ left: popup.x, top: popup.y, background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
    >
      <BookOpen size={12} />
      {ui.studyPanel.explore}
    </button>
  )
}
