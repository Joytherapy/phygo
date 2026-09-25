'use client'

// Renders inserted/photographed images on a page (PHYGO Workspace — see
// InsertImageButton.tsx for how they get created) and lets the Select tool
// move/resize/delete them, mirroring TextAnnotationLayer's own drag/delete
// interaction so the two content layers feel like one system.
//
// Only `x`/`y`/`width` are stored per image (see ImageAnnotationData in
// lib/workspace/types.ts) — `height` is deliberately derived here from the
// photo's own naturalWidth/naturalHeight plus this layer's CURRENT pixel
// box (tracked via ResizeObserver, not just a one-time measurement, so it
// stays correct across zoom/format/fullscreen changes): the layer's 0..1
// coordinate space is stretched to the page's own aspect ratio, so 1
// normalized x-unit and 1 normalized y-unit are NOT the same number of
// real pixels unless the page happens to be square. Converting the
// photo's real aspect ratio through the page's own creates a `height`
// that always displays with the photo's true proportions, however the
// page itself is shaped or scaled.
//
// Image bytes live in the private `workspace-files` Storage bucket, never
// as a public URL — a signed URL is fetched on demand per storageKey via
// GET /api/workspace/files/signed-url and cached locally for this mount.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { X, GripVertical } from 'lucide-react'
import type { AnnotationTool, ImageAnnotationData, WorkspaceAnnotation } from '@/lib/workspace/types'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'

const MIN_WIDTH = 0.06
const MAX_WIDTH = 0.95

export default function ImageAnnotationLayer({
  annotations,
  tool,
  onUpdate,
  onDelete,
}: {
  annotations: WorkspaceAnnotation[] // this page's 'image' annotations only
  tool: AnnotationTool
  onUpdate: (id: string, data: Partial<ImageAnnotationData>) => void
  onDelete: (id: string) => void
}) {
  const ui = useWorkspaceUi()
  const layerRef = useRef<HTMLDivElement>(null)
  const [pageBox, setPageBox] = useState<{ width: number; height: number } | null>(null)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const fetchedKeys = useRef<Set<string>>(new Set())

  const boxesInteractive = tool === 'select'

  // Tracks this layer's own rendered pixel box for the aspect-ratio
  // conversion above — a ResizeObserver rather than a one-off measurement
  // or a window 'resize' listener, since the page's box can change for
  // reasons that aren't a window resize (switching to a differently-shaped
  // PDF page, changing notebook paper format, entering fullscreen).
  useEffect(() => {
    const el = layerRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) setPageBox({ width: rect.width, height: rect.height })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const missing = annotations
      .map((a) => (a.data as ImageAnnotationData).storageKey)
      .filter((key): key is string => Boolean(key) && !fetchedKeys.current.has(key))
    if (missing.length === 0) return
    for (const key of missing) fetchedKeys.current.add(key)
    ;(async () => {
      for (const key of missing) {
        try {
          const res = await fetch(`/api/workspace/files/signed-url?key=${encodeURIComponent(key)}`)
          const json = await res.json()
          if (res.ok && json.url) setUrls((prev) => ({ ...prev, [key]: json.url }))
        } catch {
          // best-effort — a failed sign just leaves that one image blank, not fatal
        }
      }
    })()
  }, [annotations])

  const dragState = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; currentX: number; currentY: number } | null>(null)
  const [dragPreview, setDragPreview] = useState<{ id: string; x: number; y: number } | null>(null)

  const handleDragStart = (e: ReactPointerEvent, a: WorkspaceAnnotation) => {
    e.stopPropagation()
    const data = a.data as ImageAnnotationData
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
    const data = a.data as ImageAnnotationData
    const rect = layerRef.current?.getBoundingClientRect()
    if (!rect) return
    resizeState.current = { id: a.id, startX: e.clientX, origWidth: data.width, currentWidth: data.width }
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

  const pageAspect = pageBox && pageBox.height > 0 ? pageBox.width / pageBox.height : 1

  return (
    <div ref={layerRef} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
      {annotations.map((a) => {
        const data = a.data as ImageAnnotationData
        const pos = dragPreview && dragPreview.id === a.id ? dragPreview : { x: data.x, y: data.y }
        const width = resizePreview && resizePreview.id === a.id ? resizePreview.width : data.width
        // BUGFIX (recheck pass): this used to DIVIDE by pageAspect, which is
        // backwards. Deriving normalized height from a real pixel aspect
        // ratio requires converting through pageAspect = pageBox.width /
        // pageBox.height twice in the SAME direction — pixelWidth =
        // width*pageBox.width, and we want pixelWidth/pixelHeight =
        // naturalWidth/naturalHeight, which solves to
        // height = width * (naturalHeight/naturalWidth) * pageAspect (a
        // multiplication). Dividing instead silently distorted every
        // inserted photo's aspect ratio on any non-square page (i.e.
        // virtually every real PDF or notebook page) — never caught because
        // no photo had been inserted and looked at yet this session.
        const height = data.naturalWidth > 0 ? width * (data.naturalHeight / data.naturalWidth) * pageAspect : width
        const url = urls[data.storageKey]

        return (
          <div
            key={a.id}
            className="group absolute"
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              width: `${width * 100}%`,
              height: `${height * 100}%`,
              pointerEvents: boxesInteractive ? 'auto' : 'none',
            }}
          >
            {url ? (
              <img src={url} alt="" draggable={false} className="h-full w-full rounded-md object-contain shadow-soft select-none" />
            ) : (
              <div className="h-full w-full animate-pulse rounded-md bg-ink/5 dark:bg-white/10" />
            )}

            {boxesInteractive && (
              <>
                <div className="absolute -top-8 left-0 flex items-center gap-1 rounded-lg bg-white/90 dark:bg-[#171821]/90 px-1 py-0.5 opacity-0 shadow-soft group-hover:opacity-100 transition-opacity">
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
                <div
                  onPointerDown={(e) => handleResizeStart(e, a)}
                  aria-label="Resize"
                  className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-full border-2 border-white dark:border-[#0c0d12] bg-[#4F7CFF] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ touchAction: 'none' }}
                />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
