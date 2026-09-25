'use client'

// Contextual, responsive annotation toolbar (PHYGO Workspace UX/UI overhaul
// §2/§3/§33): a short row of "essential" tools that are always visible
// (Select, Pen, Highlighter, Eraser, Text), a "More" overflow for secondary
// shape tools (Line, Rectangle, Ellipse), Undo/Redo, and a contextual
// color+thickness row that only appears for the tool that's actually active
// — never a wall of buttons for every tool at once.

import { useEffect, useRef, useState } from 'react'
import { MousePointer2, Pencil, Highlighter, Eraser, Type, Minus, Square, Circle, MoreHorizontal, Undo2, Redo2 } from 'lucide-react'
import { HIGHLIGHT_COLORS, PEN_COLORS, TEXT_COLORS, type AnnotationTool, type ImageAnnotationData } from '@/lib/workspace/types'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import InsertImageButton from './InsertImageButton'

const WIDTHS = [2, 3.5, 5.5]
// Deliberately thicker than the pen widths above — a highlighter is a broad
// marker, not a fine line.
const MARKER_WIDTHS = [10, 16, 24]
// Eraser diameter in on-screen pixels (see AnnotationCanvas's `eraserSize`
// prop) — deliberately much larger than any ink width since it needs to
// comfortably straddle a stroke to erase it, not just graze it.
const ERASER_SIZES = [14, 26, 44]
const MORE_TOOLS: AnnotationTool[] = ['line', 'rect', 'ellipse']

export default function AnnotationToolbar({
  tool,
  onToolChange,
  inkColor,
  onInkColorChange,
  textColor,
  onTextColorChange,
  markerColor,
  onMarkerColorChange,
  width,
  onWidthChange,
  markerWidth,
  onMarkerWidthChange,
  eraserSize,
  onEraserSizeChange,
  onInsertImage,
  inkPalette = PEN_COLORS,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  tool: AnnotationTool
  onToolChange: (t: AnnotationTool) => void
  inkColor: string
  onInkColorChange: (c: string) => void
  textColor: string
  onTextColorChange: (c: string) => void
  markerColor: string
  onMarkerColorChange: (c: string) => void
  width: number
  onWidthChange: (w: number) => void
  markerWidth: number
  onMarkerWidthChange: (w: number) => void
  /** On-screen diameter (px) of the eraser's circular hit area — see
   *  AnnotationCanvas's REAL ERASER note. */
  eraserSize: number
  onEraserSizeChange: (s: number) => void
  /** Uploads a photo (gallery or camera) and hands back ready-to-persist
   *  annotation data — see InsertImageButton.tsx. Insertion is a one-shot
   *  action, not a persistent tool like Pen/Text, so it isn't part of the
   *  `tool` state machine. */
  onInsertImage: (data: ImageAnnotationData) => void
  /** Pen/shape swatches — defaults to PEN_COLORS (tuned for white PDF pages).
   *  The notebook editor passes PEN_COLORS_ON_DARK when the current page's
   *  paper is dark, so the default ink is never invisible-on-invisible. */
  inkPalette?: readonly string[]
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}) {
  const ui = useWorkspaceUi()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!moreOpen) return
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [moreOpen])

  const btn = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
      active ? 'bg-[#4F7CFF]/10 text-[#4F7CFF]' : 'text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10'
    }`

  const isInkTool = tool === 'pen' || tool === 'line' || tool === 'rect' || tool === 'ellipse'
  const isHighlighter = tool === 'highlighter'
  const isEraser = tool === 'eraser'
  const isText = tool === 'text'
  const moreActive = MORE_TOOLS.includes(tool)

  const moreLabel = tool === 'line' ? ui.annotate.line : tool === 'rect' ? ui.annotate.rectangle : tool === 'ellipse' ? ui.annotate.ellipse : null

  return (
    <div className="flex items-center gap-1 border-b border-black/[0.06] dark:border-white/10 px-3 py-2 flex-wrap">
      {/* Essential tools — always visible, desktop and mobile alike (§33) */}
      <button onClick={() => onToolChange('select')} aria-label={ui.annotate.select} title={ui.annotate.select} className={btn(tool === 'select')}>
        <MousePointer2 size={15} />
      </button>
      <button onClick={() => onToolChange('pen')} aria-label={ui.annotate.pen} title={ui.annotate.pen} className={btn(tool === 'pen')}>
        <Pencil size={15} />
      </button>
      <button onClick={() => onToolChange('highlighter')} aria-label={ui.annotate.highlighter} title={ui.annotate.highlighter} className={btn(isHighlighter)}>
        <Highlighter size={15} />
      </button>
      <button onClick={() => onToolChange('eraser')} aria-label={ui.annotate.eraser} title={ui.annotate.eraser} className={btn(tool === 'eraser')}>
        <Eraser size={15} />
      </button>
      <button onClick={() => onToolChange('text')} aria-label={ui.annotate.text} title={ui.annotate.text} className={btn(isText)}>
        <Type size={15} />
      </button>
      <InsertImageButton onInsert={onInsertImage} />

      {/* Secondary shape tools, tucked under "More" so the primary row stays
          short and legible on mobile (§33). */}
      <div className="relative" ref={moreRef}>
        <button onClick={() => setMoreOpen((v) => !v)} aria-label={ui.annotate.shape} title={ui.annotate.shape} className={btn(moreActive || moreOpen)}>
          <MoreHorizontal size={15} />
        </button>
        {moreOpen && (
          <div className="absolute left-0 top-full z-40 mt-1 flex items-center gap-1 rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#171821] shadow-lift p-1">
            <button
              onClick={() => {
                onToolChange('line')
                setMoreOpen(false)
              }}
              aria-label={ui.annotate.line}
              title={ui.annotate.line}
              className={btn(tool === 'line')}
            >
              <Minus size={15} />
            </button>
            <button
              onClick={() => {
                onToolChange('rect')
                setMoreOpen(false)
              }}
              aria-label={ui.annotate.rectangle}
              title={ui.annotate.rectangle}
              className={btn(tool === 'rect')}
            >
              <Square size={15} />
            </button>
            <button
              onClick={() => {
                onToolChange('ellipse')
                setMoreOpen(false)
              }}
              aria-label={ui.annotate.ellipse}
              title={ui.annotate.ellipse}
              className={btn(tool === 'ellipse')}
            >
              <Circle size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="mx-1 h-5 w-px bg-black/[0.08] dark:bg-white/10" />

      <button onClick={onUndo} disabled={!canUndo} aria-label={ui.annotate.undo} title={ui.annotate.undo} className={`${btn(false)} disabled:opacity-30`}>
        <Undo2 size={15} />
      </button>
      <button onClick={onRedo} disabled={!canRedo} aria-label={ui.annotate.redo} title={ui.annotate.redo} className={`${btn(false)} disabled:opacity-30`}>
        <Redo2 size={15} />
      </button>

      {moreActive && <span className="ml-1 hidden sm:inline text-[11px] text-ink/30 dark:text-white/30">{moreLabel}</span>}

      {/* Contextual settings — only for the tool that's actually active,
          never all at once (§3). */}
      {isInkTool && (
        <>
          <div className="mx-1 h-5 w-px bg-black/[0.08] dark:bg-white/10" />
          <div className="flex items-center gap-1">
            {inkPalette.map((c) => (
              <button
                key={c}
                onClick={() => onInkColorChange(c)}
                aria-label={c}
                className={`h-5 w-5 rounded-full border transition-transform ${inkColor === c ? 'scale-110 border-ink dark:border-white' : 'border-black/10 dark:border-white/20'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="mx-1 h-5 w-px bg-black/[0.08] dark:bg-white/10" />
          <div className="flex items-center gap-1">
            {WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => onWidthChange(w)}
                aria-label={`${ui.annotate.thickness} ${w}`}
                title={`${ui.annotate.thickness} ${w}`}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  width === w ? 'bg-[#4F7CFF]/10' : 'hover:bg-ink/5 dark:hover:bg-white/10'
                }`}
              >
                <span
                  className="rounded-full"
                  style={{ width: Math.max(4, w * 2), height: Math.max(4, w * 2), backgroundColor: width === w ? '#4F7CFF' : 'currentColor', opacity: width === w ? 1 : 0.4 }}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {isHighlighter && (
        <>
          <div className="mx-1 h-5 w-px bg-black/[0.08] dark:bg-white/10" />
          <div className="flex items-center gap-1">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onMarkerColorChange(c)}
                aria-label={c}
                className={`h-5 w-5 rounded-full border transition-transform ${markerColor === c ? 'scale-110 border-ink dark:border-white' : 'border-black/10 dark:border-white/20'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="mx-1 h-5 w-px bg-black/[0.08] dark:bg-white/10" />
          <div className="flex items-center gap-1">
            {MARKER_WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => onMarkerWidthChange(w)}
                aria-label={`${ui.annotate.thickness} ${w}`}
                title={`${ui.annotate.thickness} ${w}`}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  markerWidth === w ? 'bg-[#4F7CFF]/10' : 'hover:bg-ink/5 dark:hover:bg-white/10'
                }`}
              >
                <span
                  className="rounded-sm"
                  style={{ width: Math.max(6, w * 0.7), height: Math.max(6, w * 0.5), backgroundColor: markerWidth === w ? '#4F7CFF' : 'currentColor', opacity: markerWidth === w ? 1 : 0.4 }}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {isEraser && (
        <>
          <div className="mx-1 h-5 w-px bg-black/[0.08] dark:bg-white/10" />
          <div className="flex items-center gap-1">
            {ERASER_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => onEraserSizeChange(s)}
                aria-label={`${ui.annotate.eraserSize} ${s}`}
                title={`${ui.annotate.eraserSize} ${s}`}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  eraserSize === s ? 'bg-[#4F7CFF]/10' : 'hover:bg-ink/5 dark:hover:bg-white/10'
                }`}
              >
                <span
                  className="rounded-full border-2"
                  style={{
                    width: Math.min(22, Math.max(6, s * 0.55)),
                    height: Math.min(22, Math.max(6, s * 0.55)),
                    borderColor: eraserSize === s ? '#4F7CFF' : 'currentColor',
                    opacity: eraserSize === s ? 1 : 0.4,
                  }}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {isText && (
        <>
          <div className="mx-1 h-5 w-px bg-black/[0.08] dark:bg-white/10" />
          <div className="flex items-center gap-1">
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onTextColorChange(c)}
                aria-label={c}
                className={`h-5 w-5 rounded-full border transition-transform ${textColor === c ? 'scale-110 border-ink dark:border-white' : 'border-black/10 dark:border-white/20'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
