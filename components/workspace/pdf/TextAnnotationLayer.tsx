'use client'

// Click-to-place text notes directly on a PDF page (PHYGO Workspace UX/UI
// overhaul §7): with the Text tool active, clicking empty page space drops
// an editable box at that point; existing boxes stay editable/movable/
// deletable whenever the Text or Select tool is active, so a student can
// come back later and fix a note without re-selecting the tool that made it.
// Stored as its own 'text' annotation row (TextAnnotationData: x, y, body,
// color, fontSize) — never text baked into the PDF itself.

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { X, GripVertical } from 'lucide-react'
import type { AnnotationTool, TextAnnotationData, WorkspaceAnnotation } from '@/lib/workspace/types'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'

// Exported so TextSelectionPopup's "Add to Notes" action (SELECT TEXT → ADD
// TO NOTES, PHYGO Student Experience audit PART 9/13) can create a text
// annotation with the exact same defaults a manually-placed note gets,
// instead of guessing its own values.
export const DEFAULT_FONT_SIZE = 14
export const DEFAULT_BOX_WIDTH = 0.26 // normalized fraction of page width for a fresh note

// Word-style sizes offered by the toolbar's size menu and stepped through by
// the A-/A+ buttons (on the toolbar and on each note).
export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]
export const MIN_FONT_SIZE = FONT_SIZES[0]
export const MAX_FONT_SIZE = FONT_SIZES[FONT_SIZES.length - 1]
/** The next size up (dir 1) or down (dir -1) in FONT_SIZES from `current`. */
export function stepFontSize(current: number, dir: 1 | -1): number {
  if (dir === 1) return FONT_SIZES.find((s) => s > current) ?? MAX_FONT_SIZE
  return [...FONT_SIZES].reverse().find((s) => s < current) ?? MIN_FONT_SIZE
}
const MIN_BOX_PX = 90 // narrowest a box can be dragged to

export default function TextAnnotationLayer({
  annotations,
  tool,
  color,
  backgroundColor,
  fontSize,
  onCreate,
  onUpdate,
  onDelete,
  onSelectNote,
}: {
  annotations: WorkspaceAnnotation[] // this page's 'text' annotations only
  tool: AnnotationTool
  color: string
  /** Currently selected toolbar background for a NEW note — `null` means no
   *  background (the default). Existing notes each keep their own persisted
   *  `data.backgroundColor` regardless of what's currently selected. */
  backgroundColor: string | null
  /** Font size (px) a NEW note is created at — AnnotationToolbar's Text-tool
   *  "Aa" picker. An existing note keeps its own persisted `data.fontSize`
   *  regardless of what's currently selected (same rule as backgroundColor
   *  above), and can be resized afterwards with its own A-/A+ buttons. */
  fontSize: number
  onCreate: (data: TextAnnotationData) => void
  onUpdate: (id: string, data: Partial<TextAnnotationData>) => void
  onDelete: (id: string) => void
  /** A note was selected (its font size) or the selection cleared (null), so
   *  the toolbar's size menu can show the selected note's size, as in Word.
   *  While a note is selected, a size chosen in the toolbar applies to it. */
  onSelectNote?: (fontSize: number | null) => void
}) {
  const ui = useWorkspaceUi()
  const layerRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<{ x: number; y: number; body: string; width?: number; height?: number } | null>(null)
  const dragState = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; currentX: number; currentY: number } | null>(null)
  const [dragPreview, setDragPreview] = useState<{ id: string; x: number; y: number } | null>(null)
  const [resizePreview, setResizePreview] = useState<{ id: string; width: number; height?: number } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const select = (a: WorkspaceAnnotation | null) => {
    setSelectedId(a ? a.id : null)
    onSelectNote?.(a ? ((a.data as TextAnnotationData).fontSize ?? DEFAULT_FONT_SIZE) : null)
  }

  // A size picked in the toolbar while a note is selected resizes that note's
  // text. Selecting a note first syncs the toolbar to the note's own size, so
  // that change is a no-op here (same size) and never rewrites the note.
  const annotationsRef = useRef(annotations)
  annotationsRef.current = annotations
  const lastFontSize = useRef(fontSize)
  useEffect(() => {
    if (lastFontSize.current === fontSize) return
    lastFontSize.current = fontSize
    if (!selectedId) return
    const note = annotationsRef.current.find((a) => a.id === selectedId)
    if (note && ((note.data as TextAnnotationData).fontSize ?? DEFAULT_FONT_SIZE) !== fontSize) onUpdate(selectedId, { fontSize })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize])

  // The selection goes away with the note, or when no tool can edit notes.
  useEffect(() => {
    if (selectedId && !annotations.some((a) => a.id === selectedId)) select(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations, selectedId])

  const layerActive = tool === 'text'
  const boxesInteractive = tool === 'text' || tool === 'select'
  useEffect(() => {
    if (!boxesInteractive && selectedId) select(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxesInteractive])

  const handleLayerClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!layerActive || e.target !== layerRef.current) return
    select(null)
    const rect = layerRef.current!.getBoundingClientRect()
    setDraft({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height, body: '' })
  }

  const commitDraft = () => {
    if (!draft) return
    const body = draft.body.trim()
    setDraft(null)
    if (body) {
      const data: TextAnnotationData = { x: draft.x, y: draft.y, body, color, fontSize, width: draft.width ?? DEFAULT_BOX_WIDTH, backgroundColor }
      if (draft.height !== undefined) data.height = draft.height
      onCreate(data)
    }
  }

  const resizeNote = (a: WorkspaceAnnotation, dir: 1 | -1) => {
    const current = (a.data as TextAnnotationData).fontSize ?? DEFAULT_FONT_SIZE
    const next = stepFontSize(current, dir)
    if (next === current) return
    onUpdate(a.id, { fontSize: next })
    if (selectedId === a.id) onSelectNote?.(next)
  }

  // Drag the right edge (width), the bottom edge (height) or the corner
  // (both). Sizes are stored as page fractions like x/y, so a box keeps its
  // proportions on any zoom; one update is saved when the drag ends.
  const handleResizeStart = (e: ReactPointerEvent, a: WorkspaceAnnotation, axis: 'x' | 'y' | 'xy') => {
    e.stopPropagation()
    e.preventDefault()
    const rect = layerRef.current?.getBoundingClientRect()
    const box = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect()
    if (!rect || !box) return
    select(a)
    const startX = e.clientX
    const startY = e.clientY
    const origW = box.width / rect.width
    const origH = box.height / rect.height
    const data = a.data as TextAnnotationData
    const minH = ((data.fontSize ?? DEFAULT_FONT_SIZE) * 1.5 + 34) / rect.height
    let next: { id: string; width: number; height?: number } = { id: a.id, width: data.width ?? DEFAULT_BOX_WIDTH, height: data.height }
    const move = (ev: PointerEvent) => {
      const width = axis === 'y' ? next.width : Math.min(1 - data.x, Math.max(MIN_BOX_PX / rect.width, origW + (ev.clientX - startX) / rect.width))
      const height = axis === 'x' ? next.height : Math.min(1 - data.y, Math.max(minH, origH + (ev.clientY - startY) / rect.height))
      next = { id: a.id, width, height }
      setResizePreview(next)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setResizePreview(null)
      const patch: Partial<TextAnnotationData> = { width: next.width }
      if (next.height !== undefined) patch.height = next.height
      onUpdate(a.id, patch)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const handleDragStart = (e: ReactPointerEvent, annotation: WorkspaceAnnotation) => {
    e.stopPropagation()
    const data = annotation.data as TextAnnotationData
    const rect = layerRef.current?.getBoundingClientRect()
    if (!rect) return
    dragState.current = { id: annotation.id, startX: e.clientX, startY: e.clientY, origX: data.x, origY: data.y, currentX: data.x, currentY: data.y }
    const move = (ev: PointerEvent) => {
      const state = dragState.current
      const r = layerRef.current?.getBoundingClientRect()
      if (!state || !r) return
      const dx = (ev.clientX - state.startX) / r.width
      const dy = (ev.clientY - state.startY) / r.height
      const x = Math.min(1, Math.max(0, state.origX + dx))
      const y = Math.min(1, Math.max(0, state.origY + dy))
      state.currentX = x
      state.currentY = y
      setDragPreview({ id: state.id, x, y })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const state = dragState.current
      dragState.current = null
      setDragPreview(null)
      if (state) onUpdate(state.id, { x: state.currentX, y: state.currentY })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // Dragging used to require hitting the tiny grip icon that only appears
  // on hover — easy to miss, especially on a long scientific document where
  // a note might be one of dozens. Now the whole note (its border/padding/
  // background) starts a drag too, so "move this note" doesn't depend on
  // first finding a 12px icon. The textarea and the header's own buttons
  // (grip, delete) are excluded so typing, text selection, and delete still
  // work exactly as before — this only fires for a pointerdown that lands on
  // the note's own background/border, i.e. the part with nothing else to do.
  const handleBoxPointerDown = (e: ReactPointerEvent<HTMLDivElement>, annotation: WorkspaceAnnotation) => {
    if (!boxesInteractive) return
    if (selectedId !== annotation.id) select(annotation)
    const target = e.target as HTMLElement
    if (target.closest('textarea, button, [data-resize]')) return
    handleDragStart(e, annotation)
  }

  // Same "drag anywhere on the box" idea as handleBoxPointerDown above, but
  // for the note that's still being typed (the `draft`, before its first
  // blur turns it into a real saved annotation). This didn't exist before —
  // the draft box had no drag handling at all, so trying to reposition a
  // note right after writing in it did nothing: any click on the box's
  // border just blurred the textarea, which *commits* the draft (unmounting
  // this box and mounting a real annotation in its place), destroying the
  // gesture before it could move anything. `e.preventDefault()` on the
  // pointerdown stops that default focus-shift/blur, so starting a drag from
  // the border no longer commits (or loses focus from) the note you're still
  // writing — you can keep typing after moving it, exactly like before.
  // The box being written can be resized too (same edges and corner as a
  // saved note). preventDefault keeps the focus, and the text, in the box.
  const handleDraftResizeStart = (e: ReactPointerEvent, axis: 'x' | 'y' | 'xy') => {
    e.stopPropagation()
    e.preventDefault()
    const rect = layerRef.current?.getBoundingClientRect()
    const box = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect()
    if (!rect || !box || !draft) return
    const startX = e.clientX
    const startY = e.clientY
    const origW = box.width / rect.width
    const origH = box.height / rect.height
    const minH = (fontSize * 1.5 + 16) / rect.height
    const { x: dx0, y: dy0 } = draft
    const move = (ev: PointerEvent) => {
      setDraft((d) => {
        if (!d) return d
        const next = { ...d }
        if (axis !== 'y') next.width = Math.min(1 - dx0, Math.max(MIN_BOX_PX / rect.width, origW + (ev.clientX - startX) / rect.width))
        if (axis !== 'x') next.height = Math.min(1 - dy0, Math.max(minH, origH + (ev.clientY - startY) / rect.height))
        return next
      })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const handleDraftPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('textarea, [data-resize]')) return
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const origX = draft?.x ?? 0
    const origY = draft?.y ?? 0
    const move = (ev: PointerEvent) => {
      const r = layerRef.current?.getBoundingClientRect()
      if (!r) return
      const dx = (ev.clientX - startX) / r.width
      const dy = (ev.clientY - startY) / r.height
      const x = Math.min(1, Math.max(0, origX + dx))
      const y = Math.min(1, Math.max(0, origY + dy))
      setDraft((d) => (d ? { ...d, x, y } : d))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      ref={layerRef}
      onClick={handleLayerClick}
      className="absolute inset-0"
      style={{ pointerEvents: layerActive ? 'auto' : 'none', cursor: layerActive ? 'text' : undefined }}
    >
      {annotations.map((a) => {
        const data = a.data as TextAnnotationData
        const pos = dragPreview && dragPreview.id === a.id ? dragPreview : { x: data.x, y: data.y }
        const size = resizePreview && resizePreview.id === a.id ? resizePreview : { width: data.width ?? DEFAULT_BOX_WIDTH, height: data.height }
        const selected = boxesInteractive && selectedId === a.id
        const noteFontSize = data.fontSize ?? DEFAULT_FONT_SIZE
        // NO BACKGROUND BY DEFAULT (per user request): a note with no
        // persisted `backgroundColor` renders fully transparent — just the
        // text floating over the page — with a border that only appears on
        // hover/focus as an editing affordance. A note WITH a chosen
        // background keeps a visible box at all times, like a sticky note.
        const bg = data.backgroundColor ?? null
        const handle = 'absolute z-10 opacity-0 group-hover:opacity-100 transition-opacity'
        return (
          <div
            key={a.id}
            data-testid="text-note"
            data-selected={selected ? 'true' : undefined}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => handleBoxPointerDown(e, a)}
            className={`group absolute flex flex-col rounded-lg backdrop-blur-sm transition-colors ${
              selected
                ? 'border border-[#8B95FF] ring-2 ring-[#8B95FF]/30'
                : bg
                ? 'border border-black/10 dark:border-white/15 shadow-soft'
                : 'border border-transparent hover:border-black/10 dark:hover:border-white/15 focus-within:border-black/20 dark:focus-within:border-white/20'
            } ${bg ? 'shadow-soft' : ''}`}
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              width: `${size.width * 100}%`,
              height: size.height !== undefined ? `${size.height * 100}%` : undefined,
              pointerEvents: boxesInteractive ? 'auto' : 'none',
              minWidth: MIN_BOX_PX,
              backgroundColor: bg ?? 'transparent',
              cursor: boxesInteractive ? 'grab' : undefined,
            }}
          >
            {boxesInteractive && (
              // Floating bar above the box, in its own dark style so it reads
              // on white and dark paper alike (the page is not themed).
              <div
                className={`absolute -top-8 left-0 z-20 flex h-7 items-center gap-0.5 rounded-lg bg-[#121319]/95 px-1 text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] ring-1 ring-white/10 transition-opacity ${
                  selected ? 'opacity-100' : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100'
                }`}
              >
                <button
                  onPointerDown={(e) => handleDragStart(e, a)}
                  aria-label="Move"
                  className="flex h-6 w-6 items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'none' }}
                >
                  <GripVertical size={13} />
                </button>
                <span className="mx-0.5 h-4 w-px bg-white/15" />
                <button
                  onClick={() => resizeNote(a, -1)}
                  disabled={noteFontSize <= MIN_FONT_SIZE}
                  aria-label={ui.annotate.textSmaller}
                  title={ui.annotate.textSmaller}
                  className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-semibold leading-none text-white/75 hover:bg-white/10 hover:text-white disabled:opacity-30"
                >
                  A−
                </button>
                <span className="min-w-[1.6rem] text-center text-[11px] font-semibold tabular-nums text-white/90" aria-label={ui.annotate.textSize}>
                  {noteFontSize}
                </span>
                <button
                  onClick={() => resizeNote(a, 1)}
                  disabled={noteFontSize >= MAX_FONT_SIZE}
                  aria-label={ui.annotate.textBigger}
                  title={ui.annotate.textBigger}
                  className="flex h-6 w-6 items-center justify-center rounded text-[13px] font-semibold leading-none text-white/75 hover:bg-white/10 hover:text-white disabled:opacity-30"
                >
                  A+
                </button>
                <span className="mx-0.5 h-4 w-px bg-white/15" />
                <button
                  onClick={() => onDelete(a.id)}
                  aria-label={ui.item.delete}
                  className="flex h-6 w-6 items-center justify-center rounded text-white/60 hover:bg-red-500/20 hover:text-red-300"
                >
                  <X size={13} />
                </button>
              </div>
            )}
            <textarea
              defaultValue={data.body}
              readOnly={!boxesInteractive}
              // Lets NoteSelectionPopup (see that file) find "a real note's
              // text box" among every other textarea/input on the page —
              // selecting text INSIDE a textarea never shows up in
              // window.getSelection() (that's a form-control-only quirk of
              // the Selection API), so that popup can't reuse
              // TextSelectionPopup's own range-based detection and instead
              // has to specifically look for this marker on
              // document.activeElement.
              data-note-textarea="true"
              onFocus={() => {
                if (selectedId !== a.id) select(a)
              }}
              onBlur={(e) => {
                const body = e.target.value.trim()
                if (body && body !== data.body) onUpdate(a.id, { body })
              }}
              rows={2}
              className={`w-full resize-none bg-transparent px-2 py-1.5 text-sm outline-none ${size.height !== undefined ? 'min-h-0 flex-1' : ''}`}
              style={{ color: data.color, fontSize: noteFontSize, lineHeight: 1.35, cursor: boxesInteractive ? 'text' : undefined }}
            />
            {boxesInteractive && (
              <>
                {/* Resize handles: right edge = width, bottom edge = height, corner = both. */}
                <span
                  data-resize="x"
                  onPointerDown={(e) => handleResizeStart(e, a, 'x')}
                  className={`${handle} -right-1 top-3 bottom-3 w-2 cursor-ew-resize ${selected ? 'opacity-100' : ''}`}
                  style={{ touchAction: 'none' }}
                >
                  <span className="absolute inset-y-0 left-1/2 my-auto h-6 w-1 -translate-x-1/2 rounded-full bg-[#8B95FF]/70" />
                </span>
                <span
                  data-resize="y"
                  onPointerDown={(e) => handleResizeStart(e, a, 'y')}
                  className={`${handle} -bottom-1 left-3 right-3 h-2 cursor-ns-resize ${selected ? 'opacity-100' : ''}`}
                  style={{ touchAction: 'none' }}
                >
                  <span className="absolute inset-x-0 top-1/2 mx-auto h-1 w-6 -translate-y-1/2 rounded-full bg-[#8B95FF]/70" />
                </span>
                <span
                  data-resize="xy"
                  role="button"
                  aria-label={ui.annotate.resizeBox}
                  title={ui.annotate.resizeBox}
                  onPointerDown={(e) => handleResizeStart(e, a, 'xy')}
                  className={`${handle} -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-full border-2 border-white bg-[#8B95FF] shadow dark:border-[#0c0d12] ${selected ? 'opacity-100' : ''}`}
                  style={{ touchAction: 'none' }}
                />
              </>
            )}
          </div>
        )
      })}

      {draft && (
        <div
          // Mirrors the currently-selected background so what's shown while
          // typing matches what gets saved: a dashed outline (no fill) when
          // no background is selected (the default), a solid preview box
          // when the user picked one from the toolbar.
          onPointerDown={handleDraftPointerDown}
          data-testid="text-draft"
          className={`absolute flex flex-col rounded-lg backdrop-blur-sm ${
            backgroundColor ? 'border border-[#7C83FF]/40 shadow-lift' : 'border border-dashed border-[#7C83FF]/50'
          }`}
          style={{
            left: `${draft.x * 100}%`,
            top: `${draft.y * 100}%`,
            width: `${(draft.width ?? DEFAULT_BOX_WIDTH) * 100}%`,
            height: draft.height !== undefined ? `${draft.height * 100}%` : undefined,
            pointerEvents: 'auto',
            minWidth: 90,
            backgroundColor: backgroundColor ?? 'transparent',
            cursor: 'grab',
          }}
        >
          <textarea
            autoFocus
            value={draft.body}
            onChange={(e) => setDraft((d) => (d ? { ...d, body: e.target.value } : d))}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setDraft(null)
            }}
            rows={2}
            placeholder={ui.annotate.textPlaceholder}
            className={`w-full resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-ink/30 dark:placeholder:text-white/30 ${draft.height !== undefined ? 'min-h-0 flex-1' : ''}`}
            style={{ color, fontSize, lineHeight: 1.35, cursor: 'text' }}
          />
          {/* Resize handles while writing: right edge, bottom edge, corner. */}
          <span
            data-resize="x"
            onPointerDown={(e) => handleDraftResizeStart(e, 'x')}
            className="absolute -right-1 top-3 bottom-3 z-10 w-2 cursor-ew-resize"
            style={{ touchAction: 'none' }}
          >
            <span className="absolute inset-y-0 left-1/2 my-auto h-6 w-1 -translate-x-1/2 rounded-full bg-[#8B95FF]/70" />
          </span>
          <span
            data-resize="y"
            onPointerDown={(e) => handleDraftResizeStart(e, 'y')}
            className="absolute -bottom-1 left-3 right-3 z-10 h-2 cursor-ns-resize"
            style={{ touchAction: 'none' }}
          >
            <span className="absolute inset-x-0 top-1/2 mx-auto h-1 w-6 -translate-y-1/2 rounded-full bg-[#8B95FF]/70" />
          </span>
          <span
            data-resize="xy"
            role="button"
            aria-label={ui.annotate.resizeBox}
            title={ui.annotate.resizeBox}
            onPointerDown={(e) => handleDraftResizeStart(e, 'xy')}
            className="absolute -bottom-1.5 -right-1.5 z-10 h-3.5 w-3.5 cursor-nwse-resize rounded-full border-2 border-white bg-[#8B95FF] shadow dark:border-[#0c0d12]"
            style={{ touchAction: 'none' }}
          />
        </div>
      )}
    </div>
  )
}
