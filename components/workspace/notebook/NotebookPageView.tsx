'use client'

// Blank-paper notebook page editor — "write on a blank sheet, pick the
// format and the color, like GoodNotes" (PHYGO Workspace, notebooks pass).
// Reuses the exact same annotation stack built for PDF pages
// (AnnotationCanvas, AnnotationToolbar, TextAnnotationLayer) unmodified:
// the only thing that's different from PdfViewer is what sits underneath
// that stack — a plain colored "paper" div sized to the chosen format and
// textured with a CSS ruled/grid/dotted pattern instead of a rendered PDF
// page. Annotations are still their own rows in workspace_annotations
// (target_type='notebook_page', target_id=this page's id), never baked
// into the page itself.

import { useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Settings2,
  Maximize,
  Minimize,
  Loader2,
} from 'lucide-react'
import {
  NOTEBOOK_PAGE_COLORS,
  NOTEBOOK_PAGE_FORMATS,
  PEN_COLORS,
  PEN_COLORS_ON_DARK,
  TEXT_COLORS,
  HIGHLIGHT_COLORS,
  isDarkColor,
  type AnnotationTool,
  type ImageAnnotationData,
  type NotebookPageFormat,
  type NotebookPageTemplate,
  type ShapeAnnotationData,
  type StrokeData,
  type TextAnnotationData,
  type WorkspaceAnnotation,
  type WorkspaceNotebookPage,
} from '@/lib/workspace/types'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import AnnotationCanvas from '../pdf/AnnotationCanvas'
import AnnotationToolbar from '../pdf/AnnotationToolbar'
import TextAnnotationLayer from '../pdf/TextAnnotationLayer'
import ImageAnnotationLayer from '../pdf/ImageAnnotationLayer'

export type NotebookCreatableAnnotation =
  | { type: 'stroke'; data: StrokeData }
  | { type: 'shape'; data: ShapeAnnotationData }
  | { type: 'text'; data: TextAnnotationData }
  | { type: 'image'; data: ImageAnnotationData }

// Raised from 760 to 1000 (see FULLSCREEN READING MODE on WorkspaceShell) —
// the notebook editor now gets the entire viewport instead of a max-w-6xl
// column, so the old cap was leaving real screen space unused; the page
// area scrolls vertically as needed on shorter screens, same as before.
const MAX_PAPER_WIDTH = 1000
const FORMATS: NotebookPageFormat[] = ['a4', 'letter', 'square']
const TEMPLATES: NotebookPageTemplate[] = ['blank', 'ruled', 'grid', 'dotted']

function templateBackground(template: NotebookPageTemplate, paperColor: string): string | undefined {
  const line = isDarkColor(paperColor) ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.12)'
  if (template === 'ruled') {
    return `repeating-linear-gradient(to bottom, transparent 0, transparent 31px, ${line} 31px, ${line} 32px)`
  }
  if (template === 'grid') {
    return `repeating-linear-gradient(to bottom, transparent 0, transparent 23px, ${line} 23px, ${line} 24px), repeating-linear-gradient(to right, transparent 0, transparent 23px, ${line} 23px, ${line} 24px)`
  }
  if (template === 'dotted') {
    return `radial-gradient(${line} 1px, transparent 1.5px)`
  }
  return undefined
}

export default function NotebookPageView({
  page,
  pageIndex,
  pageCount,
  annotations,
  onCreateAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onChangePageSettings,
  savingStatus,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onPrevPage,
  onNextPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
}: {
  page: WorkspaceNotebookPage
  pageIndex: number
  pageCount: number
  annotations: WorkspaceAnnotation[]
  onCreateAnnotation: (annotation: NotebookCreatableAnnotation) => void
  onUpdateAnnotation: (id: string, data: Partial<TextAnnotationData> | Partial<ImageAnnotationData>) => void
  onDeleteAnnotation: (id: string) => void
  onChangePageSettings: (patch: { template?: NotebookPageTemplate; format?: NotebookPageFormat; paperColor?: string }) => void
  savingStatus: 'idle' | 'saving' | 'saved'
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onPrevPage: () => void
  onNextPage: () => void
  onAddPage: () => void
  onDuplicatePage: () => void
  onDeletePage: () => void
}) {
  const ui = useWorkspaceUi()
  const content = (page.content || {}) as { format?: NotebookPageFormat; paperColor?: string }
  const format: NotebookPageFormat = content.format || 'a4'
  const paperColor = content.paperColor || '#FFFFFF'
  const paperIsDark = isDarkColor(paperColor)

  const [fullscreen, setFullscreen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const paperWrapRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const [tool, setTool] = useState<AnnotationTool>('select')
  // Ink defaults follow the current paper's darkness — a dark default ink
  // on dark paper is the same invisible-stroke bug PEN_COLORS' white-page
  // fix addressed, just mirrored. Re-picked only when the paper's darkness
  // actually flips (see effect below), never fighting a color the person
  // already chose themselves.
  const [inkColor, setInkColor] = useState<string>(paperIsDark ? PEN_COLORS_ON_DARK[0] : PEN_COLORS[0])
  const [textColor, setTextColor] = useState<string>(TEXT_COLORS[0])
  const [markerColor, setMarkerColor] = useState<string>(HIGHLIGHT_COLORS[0])
  const [inkWidth, setInkWidth] = useState(3.5)
  const [markerWidth, setMarkerWidth] = useState(16)
  const [eraserSize, setEraserSize] = useState(26)
  const lastPaperIsDark = useRef(paperIsDark)

  useEffect(() => {
    if (lastPaperIsDark.current === paperIsDark) return
    lastPaperIsDark.current = paperIsDark
    setInkColor(paperIsDark ? PEN_COLORS_ON_DARK[0] : PEN_COLORS[0])
  }, [paperIsDark])

  useEffect(() => {
    const update = () => setContainerWidth(containerRef.current?.clientWidth || 0)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (!settingsOpen) return
    const onClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [settingsOpen])

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else containerRef.current?.requestFullscreen()
  }

  const paperWidth = Math.min(containerWidth || 600, MAX_PAPER_WIDTH)
  const paperHeight = paperWidth / NOTEBOOK_PAGE_FORMATS[format].ratio

  // Same "currently-active drawing color/width" convention as PdfViewer —
  // AnnotationCanvas only ever draws with pen/highlighter/shape tools, so
  // the Text tool's color (textColor) is handed to TextAnnotationLayer
  // directly below rather than folded in here.
  const activeColor = tool === 'highlighter' ? markerColor : inkColor
  const activeWidth = tool === 'highlighter' ? markerWidth : inkWidth

  const formatLabel = (f: NotebookPageFormat) =>
    f === 'a4' ? ui.notebook.formatA4 : f === 'letter' ? ui.notebook.formatLetter : ui.notebook.formatSquare
  const templateLabel = (t: NotebookPageTemplate) =>
    t === 'blank' ? ui.notebook.templateBlank : t === 'ruled' ? ui.notebook.templateRuled : t === 'grid' ? ui.notebook.templateGrid : ui.notebook.templateDotted

  return (
    <div
      ref={containerRef}
      className={`h-full w-full flex flex-col bg-white dark:bg-[#0c0d12] overflow-hidden ${
        fullscreen ? 'fixed inset-0 z-[70]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/10 px-3 py-2 flex-wrap shrink-0">
        <div className="flex items-center gap-1.5 text-sm text-ink/70 dark:text-white/70">
          <button
            onClick={onPrevPage}
            disabled={pageIndex <= 0}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-ink/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="tabular-nums text-xs font-medium min-w-[64px] text-center">
            {pageIndex + 1} {ui.reader.of} {pageCount}
          </span>
          <button
            onClick={onNextPage}
            disabled={pageIndex >= pageCount - 1}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-ink/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onAddPage}
            aria-label={ui.notebook.newPage}
            title={ui.notebook.newPage}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
          >
            <Plus size={15} />
          </button>
          <button
            onClick={onDuplicatePage}
            aria-label={ui.notebook.duplicatePage}
            title={ui.notebook.duplicatePage}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
          >
            <Copy size={15} />
          </button>

          {confirmingDelete ? (
            <div className="flex items-center gap-1 rounded-lg bg-red-500/10 px-1.5 py-1">
              <span className="text-[11px] text-red-500 font-medium px-1">{ui.notebook.deletePageConfirm}</span>
              <button
                onClick={() => {
                  setConfirmingDelete(false)
                  onDeletePage()
                }}
                className="rounded-md px-2 py-1 text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                {ui.item.delete}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded-md px-1.5 py-1 text-[11px] text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10"
              >
                {ui.dialog.cancel}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              disabled={pageCount <= 1}
              aria-label={ui.notebook.deletePage}
              title={ui.notebook.deletePage}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 dark:text-white/50 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-30 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}

          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              aria-label={ui.notebook.pageSettings}
              title={ui.notebook.pageSettings}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                settingsOpen ? 'bg-[#4F7CFF]/10 text-[#4F7CFF]' : 'text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10'
              }`}
            >
              <Settings2 size={15} />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 top-full z-40 mt-1 w-64 rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#171821] shadow-lift p-3 space-y-3">
                <div>
                  <p className="text-[11px] font-medium text-ink/50 dark:text-white/50 mb-1.5">{ui.notebook.format}</p>
                  <div className="flex items-center gap-1.5">
                    {FORMATS.map((f) => (
                      <button
                        key={f}
                        onClick={() => onChangePageSettings({ format: f })}
                        className={`flex-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
                          format === f ? 'border-[#4F7CFF] bg-[#4F7CFF]/10 text-[#4F7CFF]' : 'border-black/10 dark:border-white/10 text-ink/60 dark:text-white/60'
                        }`}
                      >
                        {formatLabel(f)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-ink/50 dark:text-white/50 mb-1.5">{ui.notebook.paperColor}</p>
                  <div className="flex items-center gap-1.5">
                    {NOTEBOOK_PAGE_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => onChangePageSettings({ paperColor: c })}
                        aria-label={c}
                        className={`h-6 w-6 rounded-full border transition-transform ${
                          paperColor === c ? 'scale-110 border-[#4F7CFF]' : 'border-black/10 dark:border-white/20'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-ink/50 dark:text-white/50 mb-1.5">{ui.notebook.template}</p>
                  <div className="flex items-center gap-1.5">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t}
                        onClick={() => onChangePageSettings({ template: t })}
                        title={templateLabel(t)}
                        className={`flex-1 h-7 rounded-lg border transition-colors ${
                          page.template === t ? 'border-[#4F7CFF] ring-2 ring-[#4F7CFF]/20' : 'border-black/10 dark:border-white/10'
                        }`}
                        style={{ backgroundColor: paperColor, backgroundImage: templateBackground(t, paperColor), backgroundSize: t === 'grid' ? '8px 8px' : t === 'dotted' ? '8px 8px' : undefined }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleFullscreen}
            aria-label="Fullscreen"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
          >
            {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>

          <span className="ml-1 text-[11px] text-ink/30 dark:text-white/30 w-14 text-right flex items-center justify-end gap-1">
            {savingStatus === 'saving' && <Loader2 size={11} className="animate-spin" />}
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
          markerColor={markerColor}
          onMarkerColorChange={setMarkerColor}
          width={inkWidth}
          onWidthChange={setInkWidth}
          markerWidth={markerWidth}
          onMarkerWidthChange={setMarkerWidth}
          eraserSize={eraserSize}
          onEraserSizeChange={setEraserSize}
          onInsertImage={(data) => onCreateAnnotation({ type: 'image', data })}
          inkPalette={paperIsDark ? PEN_COLORS_ON_DARK : PEN_COLORS}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
        />
      </div>

      {/* Fills whatever height is left below the toolbars — see the same
          change (and its rationale) in PdfViewer.tsx. */}
      <div className="flex-1 min-h-0 overflow-auto flex justify-center py-6 px-4">
        <div
          ref={paperWrapRef}
          className="relative shrink-0 shadow-soft"
          style={{
            width: paperWidth,
            height: paperHeight,
            backgroundColor: paperColor,
            backgroundImage: templateBackground(page.template, paperColor),
            userSelect: 'none',
          }}
        >
          <AnnotationCanvas
            annotations={annotations.filter((a) => a.type === 'stroke' || a.type === 'shape')}
            tool={tool}
            color={activeColor}
            width={activeWidth}
            onCreateStroke={(data) => onCreateAnnotation({ type: 'stroke', data })}
            onCreateShape={(data) => onCreateAnnotation({ type: 'shape', data })}
            onDelete={onDeleteAnnotation}
            pageIsDark={paperIsDark}
            eraserSize={eraserSize}
          />
          <TextAnnotationLayer
            annotations={annotations.filter((a) => a.type === 'text')}
            tool={tool}
            color={textColor}
            onCreate={(data) => onCreateAnnotation({ type: 'text', data })}
            onUpdate={onUpdateAnnotation}
            onDelete={onDeleteAnnotation}
          />
          <ImageAnnotationLayer
            annotations={annotations.filter((a) => a.type === 'image')}
            tool={tool}
            onUpdate={onUpdateAnnotation}
            onDelete={onDeleteAnnotation}
          />
        </div>
      </div>
    </div>
  )
}
