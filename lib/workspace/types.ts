// Shared Workspace types — used by both API routes and client components.
// Mirrors sql/2026-09_workspace_foundation.sql exactly; keep in sync.

export type WorkspaceFolder = {
  id: string
  owner_id: string
  parent_id: string | null
  name: string
  color: string | null
  starred: boolean
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type WorkspaceDocument = {
  id: string
  owner_id: string
  folder_id: string | null
  name: string
  storage_key: string
  mime_type: string
  size_bytes: number | null
  page_count: number | null
  starred: boolean
  last_opened_at: string | null
  last_page: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type WorkspaceNotebook = {
  id: string
  owner_id: string
  folder_id: string | null
  name: string
  starred: boolean
  last_opened_at: string | null
  last_page_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type NotebookPageTemplate = 'blank' | 'ruled' | 'grid' | 'dotted'

// Page size — matches GoodNotes' own "new page" picker (Size + Color +
// Template). `ratio` is width/height, used to size the blank paper element
// responsively the same way PdfViewer sizes a PDF page.
export type NotebookPageFormat = 'a4' | 'letter' | 'square'
export const NOTEBOOK_PAGE_FORMATS: Record<NotebookPageFormat, { ratio: number }> = {
  a4: { ratio: 210 / 297 },
  letter: { ratio: 8.5 / 11 },
  square: { ratio: 1 },
}

// Paper colors offered when creating/editing a notebook page — White,
// Cream, Gray, Black (the same basic set GoodNotes offers), kept as a fixed
// curated palette rather than a full picker, consistent with FOLDER_COLORS.
export const NOTEBOOK_PAGE_COLORS = ['#FFFFFF', '#FBF3DE', '#E8EAED', '#14151B'] as const

// Ink palette for the Pen/shape tools when the current page's paper is
// dark — the exact inverse of the PEN_COLORS visibility problem: a dark
// default ink is invisible on dark paper the same way a near-white one was
// invisible on a white PDF page. These are PEN_COLORS' original (pre-fix)
// light values, repurposed here where they're actually legible.
export const PEN_COLORS_ON_DARK = ['#F8FAFC', '#67E8F9', '#93C5FD', '#C4B5FD', '#FCA5A5'] as const

// `WorkspaceNotebookPage.content` is a free-form jsonb column (originally
// scoped for a future typed-note document); this pass also stores the
// page's chosen format + paper color in it, so no schema migration is
// needed to ship paper format/color pickers.
export type NotebookPageContent = {
  format?: NotebookPageFormat
  paperColor?: string
}

export type WorkspaceNotebookPage = {
  id: string
  notebook_id: string
  position: number
  template: NotebookPageTemplate
  content: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AnnotationTargetType = 'document' | 'notebook_page'
export type AnnotationType = 'highlight' | 'stroke' | 'text' | 'shape' | 'image' | 'knowledge_card'

export type HighlightData = {
  color: string
  text?: string
  rects: Array<{ x: number; y: number; w: number; h: number }> // normalized 0..1 of page size
}

export type StrokeData = {
  tool: 'pen' | 'highlighter' | 'eraser'
  color: string
  width: number
  points: Array<[number, number, number?]> // normalized 0..1 x, y, optional pressure
}

// `backgroundColor` is OPTIONAL and undefined/null by default — a text box
// starts with NO background (fully transparent, floating over the page) and
// the user opts into a solid "sticky note" background from the toolbar; see
// TEXT_BACKGROUND_COLORS below and the NO-BACKGROUND-BY-DEFAULT fix in
// TextAnnotationLayer.tsx.
export type TextAnnotationData = {
  x: number
  y: number
  body: string
  color: string
  fontSize?: number
  width?: number
  backgroundColor?: string | null
}

// An inserted/photographed image (PHYGO Workspace — "insert a photo like
// GoodNotes"). Only `x`/`y`/`width` are normalized 0..1 page-fraction
// values the user actually controls (position + horizontal size); `height`
// is deliberately NOT stored — it's derived at render time from
// naturalWidth/naturalHeight plus the page's own current pixel box, so the
// photo keeps its true aspect ratio however the page is zoomed/resized,
// the same cross-axis-scale problem `vectorEffect="non-scaling-stroke"`
// solves for ink elsewhere in Workspace. `storageKey` points into the
// existing private `workspace-files` Storage bucket, exactly like a
// document's own storage_key — resolved to a viewable URL on demand via
// GET /api/workspace/files/signed-url, never stored as a public URL.
export type ImageAnnotationData = {
  x: number
  y: number
  width: number
  storageKey: string
  naturalWidth: number
  naturalHeight: number
}

export type ShapeAnnotationData = {
  kind: 'rect' | 'line' | 'arrow' | 'ellipse'
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
}

// PHYGO Smart Study Panel — "Add to Document" pins a small reference card
// onto the current page, linked to an existing knowledge object (never a
// copy of it: only enough to render the card + reopen the source). Like
// TextAnnotationData, `height` is NOT stored — the card box auto-sizes to
// its own content, it isn't an image with a fixed aspect ratio.
// `knowledgeId` is the source row's id (currently always `knowledge_base.id`,
// stored as text to stay generic if a non-numeric-id source is added later).
export type KnowledgeCardAnnotationData = {
  x: number
  y: number
  width: number
  knowledgeType: 'condition' | 'structure' | 'test'
  knowledgeId: string
  title: string
  category: string | null
  sectionLabel: string | null
  href: string | null
}

export type WorkspaceAnnotation = {
  id: string
  owner_id: string
  target_type: AnnotationTargetType
  target_id: string
  page_number: number | null
  type: AnnotationType
  data: HighlightData | StrokeData | TextAnnotationData | ShapeAnnotationData | ImageAnnotationData | KnowledgeCardAnnotationData
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// Single source of truth for the reader's active tool, shared by the
// toolbar, the pen/shape canvas, and the text-box layer.
export type AnnotationTool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'text' | 'line' | 'rect' | 'ellipse'

export type WorkspaceTag = {
  id: string
  owner_id: string
  name: string
  created_at: string
}

export type WorkspaceItemType = 'document' | 'notebook'

export type WorkspaceBookmark = {
  id: string
  owner_id: string
  document_id: string
  page_number: number
  label: string | null
  created_at: string
}

/** Either a document or a notebook, as returned by the tree/recent/search endpoints. */
export type WorkspaceItem =
  | ({ kind: 'document' } & WorkspaceDocument)
  | ({ kind: 'notebook' } & WorkspaceNotebook)

// Translucent "marker" colors — used both by legacy rect-based highlight
// annotations and, now, as the Highlighter tool's own freehand stroke
// palette (rendered translucent + multiply-blended so they read as a real
// highlighter over the page, never a solid block).
//
// IMPORTANT: these are the RAW pen-down colors, not what ends up on the
// page — a multiply blend over white lightens whatever you feed it (result
// = 1 − opacity×(1 − color) on each channel), so a pale pastel input
// (the previous values here) comes out nearly indistinguishable from blank
// paper. Picking genuinely saturated colors is what makes the *blended*
// result still read clearly as yellow/green/blue/pink/orange rather than
// as five shades of "faint". See AnnotationCanvas's opacity constant for
// the other half of this fix.
// Expanded per user request ("aggiungi altri colori evidenziatore") — kept
// the same genuinely-saturated-color rule as the original five (see the
// comment above) so every added hue still reads clearly once multiply-
// blended, instead of washing out like a pale pastel would.
export const HIGHLIGHT_COLORS = [
  '#FFE066', // yellow
  '#5CE488', // green
  '#4FC3FF', // blue
  '#FF7FC0', // pink
  '#FFAB4A', // orange
  '#B583FF', // purple
  '#2DD4BF', // teal
  '#FF5C5C', // red/coral
] as const

// Pen/shape ink colors. IMPORTANT: PDF pages render on an opaque white
// canvas background almost universally, regardless of PHYGO's own dark
// theme — so the default (first) ink color must be dark enough to read on
// white paper. The previous default (`#F8FAFC`, near-white) was invisible
// on virtually every real document: the stroke was being drawn and saved
// correctly, it just couldn't be seen, which is exactly what "the pen
// doesn't work" looks like from the outside. Fixed by leading with a dark
// "ink" color and reusing PHYGO's own brand accents for the rest.
export const PEN_COLORS = ['#1E293B', '#4F7CFF', '#32D6A0', '#F97316', '#EF4444'] as const
export const TEXT_COLORS = ['#0F172A', '#4F7CFF', '#32D6A0', '#F97316', '#EF4444'] as const

// Optional "sticky note" backgrounds for the Text tool — NOT applied by
// default (see TextAnnotationData.backgroundColor above); the user picks one
// from the toolbar only if they actually want a filled note background. The
// dark slate option exists so a background is still usable/legible for
// light-colored text (see TEXT_COLORS / PEN_COLORS_ON_DARK).
export const TEXT_BACKGROUND_COLORS = ['#FFFFFF', '#FEF3C7', '#DBEAFE', '#DCFCE7', '#1E293B'] as const

// Predefined PHYGO folder colors — kept as a fixed, curated set (not a raw
// color wheel) so the Workspace stays visually calm; see PHYGO Workspace
// UX/UI overhaul §14. `null` means "no color" (the neutral default look).
export const FOLDER_COLORS = ['#4F7CFF', '#A855F7', '#F97316', '#EF4444', '#32D6A0', '#EAB308'] as const

// Shared luminance check — used wherever a surface color (notebook paper,
// eventually anything else user-pickable) needs to pick a legible default
// ink/line color against itself. Standard perceptual-luminance approximation.
export function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return false
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5
}
