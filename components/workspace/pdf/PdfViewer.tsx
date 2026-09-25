'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  StretchHorizontal,
  Maximize,
  Minimize,
  PanelLeft,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Loader2,
} from 'lucide-react'
import {
  HIGHLIGHT_COLORS,
  PEN_COLORS,
  TEXT_COLORS,
  type AnnotationTool,
  type HighlightData,
  type ImageAnnotationData,
  type KnowledgeCardAnnotationData,
  type ShapeAnnotationData,
  type StrokeData,
  type TextAnnotationData,
  type WorkspaceAnnotation,
} from '@/lib/workspace/types'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import { useAsk } from '@/contexts/AskContext'
import { useStudyPanelDocumentBridge } from '@/contexts/StudyPanelContext'
import AnnotationCanvas from './AnnotationCanvas'
import AnnotationToolbar from './AnnotationToolbar'
import TextAnnotationLayer from './TextAnnotationLayer'
import ImageAnnotationLayer from './ImageAnnotationLayer'
import KnowledgeCardAnnotationLayer from './KnowledgeCardAnnotationLayer'
import TextSelectionPopup from './TextSelectionPopup'

// pdfjs ships its own worker; react-pdf re-exports the exact pdfjs build it
// bundles, so pointing the worker at the matching version on cdnjs keeps
// them in lockstep without adding a separate pdfjs-dist dependency (and the
// version mismatches that come with pinning one by hand).
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

const MIN_SCALE = 0.5
const MAX_SCALE = 2.5

export type CreatableAnnotation =
  | { type: 'highlight'; data: HighlightData }
  | { type: 'stroke'; data: StrokeData }
  | { type: 'shape'; data: ShapeAnnotationData }
  | { type: 'text'; data: TextAnnotationData }
  | { type: 'image'; data: ImageAnnotationData }
  | { type: 'knowledge_card'; data: KnowledgeCardAnnotationData }

export default function PdfViewer({
  fileUrl,
  initialPage,
  annotations,
  bookmarkedPages,
  onPageChange,
  onCreateAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onToggleBookmark,
  savingStatus,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  fileUrl: string
  initialPage: number
  annotations: WorkspaceAnnotation[]
  bookmarkedPages: Set<number>
  onPageChange: (page: number, numPages: number) => void
  onCreateAnnotation: (pageNumber: number, annotation: CreatableAnnotation) => void
  onUpdateAnnotation: (id: string, data: Partial<TextAnnotationData> | Partial<ImageAnnotationData> | Partial<KnowledgeCardAnnotationData>) => void
  onDeleteAnnotation: (id: string) => void
  onToggleBookmark: (pageNumber: number) => void
  savingStatus: 'idle' | 'saving' | 'saved'
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}) {
  const ui = useWorkspaceUi()
  // Ask PHYGO is now a site-wide floating panel (GlobalAskLauncher, mounted
  // in app/dashboard/layout.tsx) rather than something only PdfViewer knew
  // how to open — this toolbar button just toggles the same shared state,
  // no askOpen/onToggleAsk props needed from the parent page anymore.
  const { open: askOpen, toggle: toggleAsk } = useAsk()
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(Math.max(1, initialPage || 1))
  const [scale, setScale] = useState(1.1)
  const [fitWidth, setFitWidth] = useState(true)
  const [showThumbnails, setShowThumbnails] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const [tool, setTool] = useState<AnnotationTool>('select')
  const [inkColor, setInkColor] = useState<string>(PEN_COLORS[0])
  const [textColor, setTextColor] = useState<string>(TEXT_COLORS[0])
  // `null` = no background (the default — see TextAnnotationData.backgroundColor).
  const [textBackground, setTextBackground] = useState<string | null>(null)
  const [markerColor, setMarkerColor] = useState<string>(HIGHLIGHT_COLORS[0])
  const [inkWidth, setInkWidth] = useState(3.5)
  const [markerWidth, setMarkerWidth] = useState(16)
  const [eraserSize, setEraserSize] = useState(26)

  const containerRef = useRef<HTMLDivElement>(null)
  const pageWrapRef = useRef<HTMLDivElement>(null)
  const pageContainerWidth = useRef<number>(0)

  useEffect(() => {
    const update = () => {
      if (containerRef.current) pageContainerWidth.current = containerRef.current.clientWidth
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const goToPage = useCallback(
    (next: number) => {
      if (!numPages) return
      const clamped = Math.min(Math.max(1, next), numPages)
      setPageNumber(clamped)
      onPageChange(clamped, numPages)
    },
    [numPages, onPageChange]
  )

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else containerRef.current?.requestFullscreen()
  }

  const pageHighlights = useMemo(
    () => annotations.filter((a) => a.page_number === pageNumber && a.type === 'highlight'),
    [annotations, pageNumber]
  )
  const pageInk = useMemo(
    () => annotations.filter((a) => a.page_number === pageNumber && (a.type === 'stroke' || a.type === 'shape')),
    [annotations, pageNumber]
  )
  const pageText = useMemo(
    () => annotations.filter((a) => a.page_number === pageNumber && a.type === 'text'),
    [annotations, pageNumber]
  )
  const pageImages = useMemo(
    () => annotations.filter((a) => a.page_number === pageNumber && a.type === 'image'),
    [annotations, pageNumber]
  )
  const pageKnowledgeCards = useMemo(
    () => annotations.filter((a) => a.page_number === pageNumber && a.type === 'knowledge_card'),
    [annotations, pageNumber]
  )

  // PHYGO Smart Study Panel — "Add to Document" bridge. PdfViewer already
  // owns the current page number and the onCreateAnnotation callback, so it
  // registers the handler directly rather than threading pageNumber back up
  // through the document page (see contexts/StudyPanelContext.tsx).
  useStudyPanelDocumentBridge(
    useCallback(
      (match) => {
        onCreateAnnotation(pageNumber, {
          type: 'knowledge_card',
          data: {
            x: 0.08,
            y: 0.08,
            width: 0.3,
            knowledgeType: match.knowledgeType,
            knowledgeId: match.knowledgeId,
            title: match.title,
            category: match.category,
            sectionLabel: match.sectionLabel,
            href: match.href,
          },
        })
      },
      [onCreateAnnotation, pageNumber]
    )
  )

  // Native text selection is only useful with the Select tool now (so a
  // student can still copy text); every drawing tool, including the
  // Highlighter (a freehand marker as of this pass — see AnnotationCanvas),
  // owns the pointer itself and shouldn't fight the browser's own selection
  // gesture.
  const selectionEnabled = tool === 'select'

  // The currently-active drawing color/width — the ink and marker settings
  // are remembered independently so switching tools doesn't lose either
  // one, but only the active tool's pair is ever handed to the canvas.
  const activeColor = tool === 'highlighter' ? markerColor : inkColor
  const activeWidth = tool === 'highlighter' ? markerWidth : inkWidth

  // Cap raised from 900 to 1300 (see FULLSCREEN READING MODE on
  // WorkspaceShell) — the reader now gets the entire viewport width instead
  // of a max-w-6xl column shared with a sidebar, so the old cap was leaving
  // real screen space unused on a laptop or an iPad in landscape.
  const effectiveWidth = fitWidth ? Math.min(pageContainerWidth.current || 800, 1300) : undefined
  const effectiveScale = fitWidth ? undefined : scale

  return (
      <div
        ref={containerRef}
        className={`h-full w-full flex flex-col bg-white dark:bg-[#0c0d12] overflow-hidden ${
          fullscreen ? 'fixed inset-0 z-[70]' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/10 px-3 py-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowThumbnails((v) => !v)}
              aria-label={ui.reader.thumbnails}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                showThumbnails ? 'bg-[#4F7CFF]/10 text-[#4F7CFF]' : 'text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10'
              }`}
            >
              <PanelLeft size={15} />
            </button>
            <button
              onClick={() => onToggleBookmark(pageNumber)}
              aria-label={ui.reader.bookmarkPage}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
            >
              {bookmarkedPages.has(pageNumber) ? <BookmarkCheck size={15} className="text-[#4F7CFF]" /> : <Bookmark size={15} />}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-ink/70 dark:text-white/70">
            <button
              onClick={() => goToPage(pageNumber - 1)}
              disabled={pageNumber <= 1}
              aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-ink/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="tabular-nums text-xs font-medium min-w-[64px] text-center">
              {pageNumber} {ui.reader.of} {numPages ?? '…'}
            </span>
            <button
              onClick={() => goToPage(pageNumber + 1)}
              disabled={!numPages || pageNumber >= numPages}
              aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-ink/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setFitWidth(false)
                setScale((s) => Math.max(MIN_SCALE, s - 0.15))
              }}
              aria-label={ui.reader.zoomOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={() => {
                setFitWidth(false)
                setScale((s) => Math.min(MAX_SCALE, s + 0.15))
              }}
              aria-label={ui.reader.zoomIn}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={() => setFitWidth(true)}
              aria-label={ui.reader.fitWidth}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                fitWidth ? 'bg-[#4F7CFF]/10 text-[#4F7CFF]' : 'text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10'
              }`}
            >
              <StretchHorizontal size={15} />
            </button>
            <button
              onClick={toggleFullscreen}
              aria-label="Fullscreen"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
            >
              {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>
            <button
              onClick={toggleAsk}
              aria-label={ui.ask.button}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                askOpen ? 'bg-[#4F7CFF]/10 text-[#4F7CFF]' : 'text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10'
              }`}
            >
              <Sparkles size={15} />
            </button>

            <span className="ml-2 text-[11px] text-ink/30 dark:text-white/30 w-14 text-right">
              {savingStatus === 'saving' ? ui.save.saving : savingStatus === 'saved' ? ui.save.saved : ''}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <AnnotationToolbar
            tool={tool}
            onToolChange={setTool}
            inkColor={inkColor}
            onInkColorChange={setInkColor}
            textColor={textColor}
            onTextColorChange={setTextColor}
            textBackground={textBackground}
            onTextBackgroundChange={setTextBackground}
            markerColor={markerColor}
            onMarkerColorChange={setMarkerColor}
            width={inkWidth}
            onWidthChange={setInkWidth}
            markerWidth={markerWidth}
            onMarkerWidthChange={setMarkerWidth}
            eraserSize={eraserSize}
            onEraserSizeChange={setEraserSize}
            onInsertImage={(data) => onCreateAnnotation(pageNumber, { type: 'image', data })}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
          />
        </div>

        {/* Single shared <Document> instance for both the thumbnail rail and
            the main page — react-pdf supports many <Page> children under one
            <Document>, and this is exactly that case. Two separate <Document>
            instances would parse/fetch the same PDF twice (see PHYGO Workspace
            performance guidance, §36).
            `className` makes Document's own wrapper the flex-growing row
            that fills whatever height is left below the toolbars above —
            replacing the old fixed `max-h-[75vh]` guess on the scrollable
            areas below, which was tuned for the old Navbar+sidebar layout
            and left extra empty space now that the reader can use the whole
            viewport (see the FULLSCREEN READING MODE note on WorkspaceShell). */}
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages: n }) => {
            setNumPages(n)
            onPageChange(pageNumber, n)
          }}
          className="flex-1 min-h-0 flex flex-col"
          loading={
            <div className="flex items-center justify-center py-24 text-ink/40 dark:text-white/40">
              <Loader2 size={18} className="animate-spin" />
            </div>
          }
        >
          <div className="flex flex-1 min-h-0">
            {showThumbnails && numPages && (
              <div className="hidden sm:block w-32 shrink-0 border-r border-black/[0.06] dark:border-white/10 h-full overflow-y-auto p-2 space-y-2">
                {/* Windowed rather than every page at once — a 700-page
                    textbook should not mount 700 canvases simultaneously. */}
                {Array.from({ length: Math.min(31, numPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(pageNumber - 15, numPages - 30))
                  return start + i
                })
                  .filter((p) => p >= 1 && p <= numPages)
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`block w-full rounded-lg overflow-hidden border transition-colors ${
                        p === pageNumber ? 'border-[#4F7CFF]' : 'border-black/10 dark:border-white/10'
                      }`}
                    >
                      <Page pageNumber={p} width={100} renderTextLayer={false} renderAnnotationLayer={false} loading={null} />
                    </button>
                  ))}
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-auto flex justify-center py-6 px-4">
              <div ref={pageWrapRef} className="relative inline-block" style={{ userSelect: selectionEnabled ? 'auto' : 'none' }}>
                <Page
                  pageNumber={pageNumber}
                  width={effectiveWidth}
                  scale={effectiveScale}
                  renderTextLayer
                  renderAnnotationLayer={false}
                  loading={
                    <div className="flex items-center justify-center py-24 text-ink/40 dark:text-white/40">
                      <Loader2 size={18} className="animate-spin" />
                    </div>
                  }
                />

                {/* Persisted highlights overlay, absolutely positioned from
                    normalized 0..1 rects so they stay correct across zoom. */}
                {pageHighlights.map((a) => {
                  const data = a.data as HighlightData
                  return data.rects.map((r, i) => (
                    <div
                      key={`${a.id}-${i}`}
                      onDoubleClick={() => onDeleteAnnotation(a.id)}
                      title="Double-click to remove"
                      className="absolute pointer-events-auto cursor-pointer mix-blend-multiply dark:mix-blend-screen"
                      style={{
                        left: `${r.x * 100}%`,
                        top: `${r.y * 100}%`,
                        width: `${r.w * 100}%`,
                        height: `${r.h * 100}%`,
                        backgroundColor: data.color,
                        opacity: 0.45,
                      }}
                    />
                  ))
                })}

                {/* Pen strokes, highlighter marker strokes, lines,
                    rectangles, circles — its own overlay so it can own
                    pointer events independently of the highlight layer
                    above and the text layer below. */}
                <AnnotationCanvas
                  annotations={pageInk}
                  tool={tool}
                  color={activeColor}
                  width={activeWidth}
                  onCreateStroke={(data) => onCreateAnnotation(pageNumber, { type: 'stroke', data })}
                  onCreateShape={(data) => onCreateAnnotation(pageNumber, { type: 'shape', data })}
                  onDelete={onDeleteAnnotation}
                  eraserSize={eraserSize}
                />

                {/* Click-to-place text notes — its own overlay above the ink
                    canvas so it only grabs pointer events while the Text
                    tool (or Select, for editing/moving existing notes) is
                    active. */}
                <TextAnnotationLayer
                  annotations={pageText}
                  tool={tool}
                  color={textColor}
                  backgroundColor={textBackground}
                  onCreate={(data) => onCreateAnnotation(pageNumber, { type: 'text', data })}
                  onUpdate={onUpdateAnnotation}
                  onDelete={onDeleteAnnotation}
                />

                {/* Inserted/photographed images — see InsertImageButton.tsx
                    (in the toolbar above) for how they get created. Topmost
                    layer so a photo is always reachable to drag/resize/
                    delete with the Select tool, above ink and text notes. */}
                <ImageAnnotationLayer
                  annotations={pageImages}
                  tool={tool}
                  onUpdate={onUpdateAnnotation}
                  onDelete={onDeleteAnnotation}
                />

                {/* PHYGO Knowledge Cards pinned via the Smart Study Panel's
                    "Add to Document" — topmost of all content layers, same
                    reasoning as ImageAnnotationLayer above it in z-order:
                    always reachable with the Select tool. */}
                <KnowledgeCardAnnotationLayer
                  annotations={pageKnowledgeCards}
                  tool={tool}
                  onUpdate={onUpdateAnnotation}
                  onDelete={onDeleteAnnotation}
                />

                {/* The "Explore with PHYGO" trigger — watches for a text
                    selection inside this page and offers to open the Smart
                    Study Panel on it. Never auto-opens anything itself. */}
                <TextSelectionPopup containerRef={pageWrapRef} enabled={selectionEnabled} />
              </div>
            </div>
          </div>
        </Document>
      </div>
  )
}
