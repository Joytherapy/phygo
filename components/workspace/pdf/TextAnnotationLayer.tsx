'use client'

// Click-to-place text notes directly on a PDF page (PHYGO Workspace UX/UI
// overhaul §7): with the Text tool active, clicking empty page space drops
// an editable box at that point; existing boxes stay editable/movable/
// deletable whenever the Text or Select tool is active, so a student can
// come back later and fix a note without re-selecting the tool that made it.
// Stored as its own 'text' annotation row (TextAnnotationData: x, y, body,
// color, fontSize) — never text baked into the PDF itself.

import { useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { X, GripVertical } from 'lucide-react'
import type { AnnotationTool, TextAnnotationData, WorkspaceAnnotation } from '@/lib/workspace/types'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'

const DEFAULT_FONT_SIZE = 14
const DEFAULT_BOX_WIDTH = 0.26 // normalized fraction of page width for a fresh note

export default function TextAnnotationLayer({
  annotations,
  tool,
  color,
  onCreate,
  onUpdate,
  onDelete,
}: {
  annotations: WorkspaceAnnotation[] // this page's 'text' annotations only
  tool: AnnotationTool
  color: string
  onCreate: (data: TextAnnotationData) => void
  onUpdate: (id: string, data: Partial<TextAnnotationData>) => void
  onDelete: (id: string) => void
}) {
  const ui = useWorkspaceUi()
  const layerRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<{ x: number; y: number; body: string } | null>(null)
  const dragState = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; currentX: number; currentY: number } | null>(null)
  const [dragPreview, setDragPreview] = useState<{ id: string; x: number; y: number } | null>(null)

  const layerActive = tool === 'text'
  const boxesInteractive = tool === 'text' || tool === 'select'

  const handleLayerClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!layerActive || e.target !== layerRef.current) return
    const rect = layerRef.current!.getBoundingClientRect()
    setDraft({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height, body: '' })
  }

  const commitDraft = () => {
    if (!draft) return
    const body = draft.body.trim()
    setDraft(null)
    if (body) onCreate({ x: draft.x, y: draft.y, body, color, fontSize: DEFAULT_FONT_SIZE, width: DEFAULT_BOX_WIDTH })
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
        return (
          <div
            key={a.id}
            onClick={(e) => e.stopPropagation()}
            className="group absolute rounded-lg border border-black/10 dark:border-white/15 bg-white/90 dark:bg-[#171821]/90 backdrop-blur-sm shadow-soft"
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              width: `${(data.width ?? DEFAULT_BOX_WIDTH) * 100}%`,
              pointerEvents: boxesInteractive ? 'auto' : 'none',
              minWidth: 90,
            }}
          >
            {boxesInteractive && (
              <div className="flex items-center justify-between px-1.5 pt-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                <button
                  onPointerDown={(e) => handleDragStart(e, a)}
                  aria-label="Move"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink/30 dark:text-white/30 hover:text-ink dark:hover:text-white cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'none' }}
                >
                  <GripVertical size={12} />
                </button>
                <button
                  onClick={() => onDelete(a.id)}
                  aria-label={ui.item.delete}
                  className="flex h-5 w-5 items-center justify-center rounded text-ink/30 dark:text-white/30 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <textarea
              defaultValue={data.body}
              readOnly={!boxesInteractive}
              onBlur={(e) => {
                const body = e.target.value.trim()
                if (body && body !== data.body) onUpdate(a.id, { body })
              }}
              rows={2}
              className="w-full resize-none bg-transparent px-2 pb-2 pt-1 text-sm outline-none"
              style={{ color: data.color, fontSize: data.fontSize ?? DEFAULT_FONT_SIZE }}
            />
          </div>
        )
      })}

      {draft && (
        <div
          className="absolute rounded-lg border border-[#4F7CFF]/40 bg-white/95 dark:bg-[#171821]/95 shadow-lift"
          style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${DEFAULT_BOX_WIDTH * 100}%`, pointerEvents: 'auto', minWidth: 90 }}
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
            className="w-full resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-ink/30 dark:placeholder:text-white/30"
            style={{ color, fontSize: DEFAULT_FONT_SIZE }}
          />
        </div>
      )}
    </div>
  )
}
