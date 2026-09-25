'use client'

// Renders "PHYGO Knowledge Cards" pinned onto a page via the Smart Study
// Panel's "Add to Document" action — a small reference card linked to an
// existing PHYGO knowledge object, movable/resizable/deletable exactly like
// an inserted image (mirrors ImageAnnotationLayer's own drag/resize
// interaction), but with auto-sized height instead of a fixed aspect ratio
// (mirrors TextAnnotationLayer's box instead — see KnowledgeCardAnnotationData
// in lib/workspace/types.ts for why `height` isn't stored).
//
// The card never embeds the knowledge object's own content — only enough to
// render itself (title/category/sectionLabel/href) plus a link back to the
// source. Clicking the card's own body re-opens the Smart Study Panel on
// that knowledge object so the student can read the full sections again
// without needing to re-select text.

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { X, GripVertical, BookOpen, ExternalLink } from 'lucide-react'
import type { AnnotationTool, KnowledgeCardAnnotationData, WorkspaceAnnotation } from '@/lib/workspace/types'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import { useStudyPanel } from '@/contexts/StudyPanelContext'

const MIN_WIDTH = 0.14
const MAX_WIDTH = 0.6
const DEFAULT_WIDTH = 0.3

export default function KnowledgeCardAnnotationLayer({
  annotations,
  tool,
  onUpdate,
  onDelete,
}: {
  annotations: WorkspaceAnnotation[] // this page's 'knowledge_card' annotations only
  tool: AnnotationTool
  onUpdate: (id: string, data: Partial<KnowledgeCardAnnotationData>) => void
  onDelete: (id: string) => void
}) {
  const ui = useWorkspaceUi()
  const { openWithSelection } = useStudyPanel()
  const layerRef = useRef<HTMLDivElement>(null)

  const boxesInteractive = tool === 'select'

  const dragState = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; currentX: number; currentY: number } | null>(null)
  const [dragPreview, setDragPreview] = useState<{ id: string; x: number; y: number } | null>(null)

  const handleDragStart = (e: ReactPointerEvent, a: WorkspaceAnnotation) => {
    e.stopPropagation()
    const data = a.data as KnowledgeCardAnnotationData
    const rect = layerRef.current?.getBoundingClientRect()
    if (!rect) return
    dragState.current = { id: a.id, startX: e.clientX, startY: e.clientY, origX: data.x, origY: data.y, currentX: data.x, currentY: data.y }
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

  const resizeState = useRef<{ id: string; startX: number; origWidth: number; currentWidth: number } | null>(null)
  const [resizePreview, setResizePreview] = useState<{ id: string; width: number } | null>(null)

  const handleResizeStart = (e: ReactPointerEvent, a: WorkspaceAnnotation) => {
    e.stopPropagation()
    const data = a.data as KnowledgeCardAnnotationData
    const rect = layerRef.current?.getBoundingClientRect()
    if (!rect) return
    resizeState.current = { id: a.id, startX: e.clientX, origWidth: data.width || DEFAULT_WIDTH, currentWidth: data.width || DEFAULT_WIDTH }
    const move = (ev: PointerEvent) => {
      const state = resizeState.current
      const r = layerRef.current?.getBoundingClientRect()
      if (!state || !r) return
      const dx = (ev.clientX - state.startX) / r.width
      const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, state.origWidth + dx))
      state.currentWidth = width
      setResizePreview({ id: state.id, width })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const state = resizeState.current
      resizeState.current = null
      setResizePreview(null)
      if (state) onUpdate(state.id, { width: state.currentWidth })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div ref={layerRef} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
      {annotations.map((a) => {
        const data = a.data as KnowledgeCardAnnotationData
        const pos = dragPreview && dragPreview.id === a.id ? dragPreview : { x: data.x, y: data.y }
        const width = resizePreview && resizePreview.id === a.id ? resizePreview.width : data.width || DEFAULT_WIDTH
        const sectionLabel = data.category ? (ui.studyPanel.systems as Record<string, string>)[data.category] || data.category : data.sectionLabel

        return (
          <div
            key={a.id}
            className="group absolute rounded-xl border border-[#4F7CFF]/20 bg-white/95 dark:bg-[#171821]/95 backdrop-blur-sm shadow-soft"
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              width: `${width * 100}%`,
              pointerEvents: boxesInteractive ? 'auto' : 'none',
              minWidth: 140,
            }}
          >
            {boxesInteractive && (
              <div className="flex items-center justify-between px-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

            <button
              onClick={() => openWithSelection(data.title)}
              className="w-full text-left px-3 py-2.5"
              style={{ pointerEvents: boxesInteractive ? 'auto' : 'none' }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <BookOpen size={11} className="text-[#4F7CFF] shrink-0" />
                {sectionLabel && <span className="text-[10px] font-medium uppercase tracking-wide text-[#4F7CFF]">{sectionLabel}</span>}
              </div>
              <p className="text-xs font-semibold text-ink dark:text-white leading-snug">{data.title}</p>
              {data.href && (
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-ink/40 dark:text-white/40">
                  {ui.studyPanel.openInPhygo} <ExternalLink size={9} />
                </span>
              )}
            </button>

            {boxesInteractive && (
              <div
                onPointerDown={(e) => handleResizeStart(e, a)}
                aria-label="Resize"
                className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-full border-2 border-white dark:border-[#0c0d12] bg-[#4F7CFF] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ touchAction: 'none' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
