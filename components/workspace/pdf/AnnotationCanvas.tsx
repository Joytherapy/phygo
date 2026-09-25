'use client'

// Freehand pen + straight-line/shape annotation layer for the PDF reader.
// Sits directly above the <Page> as an absolutely-positioned SVG, using a
// 0..1 viewBox so every stored coordinate is already normalized (matches the
// highlight-overlay convention in PdfViewer.tsx) and survives zoom/fit-width
// changes without any conversion on read. `vectorEffect="non-scaling-stroke"`
// keeps stroke width in real screen pixels regardless of that 0..1 scaling.
//
// PEN FIX (PHYGO Workspace UX/UI overhaul §4/§48-5): the previous version
// tracked the stroke purely through React's onPointerMove/onPointerUp on the
// <svg> element plus `setPointerCapture`. That is unreliable across
// browsers/devices — Safari (desktop and iPadOS, i.e. exactly the Apple
// Pencil case this brief calls out) has known inconsistencies delivering
// captured pointer events back to an SVG element once the physical pointer
// drifts outside its bounds mid-stroke, which reads to the user as "the pen
// stops drawing" or "the line breaks". Fixed by attaching pointermove/
// pointerup on `window` for the duration of a stroke instead of relying on
// capture — window-level listeners keep receiving events regardless of what
// element is physically under the pointer. `touch-action: none` plus
// `preventDefault()` on pointerdown stop the browser from treating the
// stroke as a scroll/selection gesture on touch and pen input.
//
// This never touches the original PDF — annotations are their own rows in
// `workspace_annotations` (type 'stroke' | 'shape'), exactly like highlights.
//
// HIGHLIGHTER-AS-MARKER: the Highlighter tool is a freehand drag stroke —
// same pointer-tracking path as the pen — rendered translucent with a
// multiply/screen blend so it reads like a real marker dragged over the
// page, on text, images or handwriting alike (not limited to selectable
// PDF text). Stored as a 'stroke' annotation with `data.tool ===
// 'highlighter'`; only the rendering differs from a pen stroke.
//
// HIGHLIGHTER VISIBILITY FIX: two separate bugs made the highlighter read
// as barely-there ("the colors don't show up well"):
//   1. BLEND MODE WAS KEYED TO THE WRONG THING. The blend mode used to be
//      `mix-blend-multiply dark:mix-blend-screen` — a Tailwind dark-MODE
//      variant, i.e. it switched based on PHYGO's own UI theme. But a PDF
//      page is opaque white basically always, independent of UI theme (see
//      the PEN FIX note above) — so with the app in dark mode, every
//      highlight on every PDF got SCREEN-blended onto a WHITE background,
//      and screen-over-white is white regardless of the source color: the
//      highlighter became functionally invisible. Fixed by driving the
//      blend mode off the actual page/paper darkness (the new `pageIsDark`
//      prop below), never off the app's own theme.
//   2. THE COLORS THEMSELVES WERE TOO PALE. Multiply-blending a color over
//      white lightens it further (result = 1 − opacity×(1 − color) per
//      channel) — starting from an already-pale pastel left almost no
//      visible difference from blank paper. HIGHLIGHT_COLORS (in
//      lib/workspace/types.ts) now starts from genuinely saturated colors,
//      and HIGHLIGHT_OPACITY below is tuned so the blended result still
//      reads clearly as its color rather than as a faint tint.
//
// SMOOTHING (PHYGO Workspace, ink-quality pass): "the writing isn't smooth"
// had two separate causes, both fixed here, and both apply to every
// freehand stroke — live preview AND the persisted render, so what you see
// while drawing is exactly what gets saved:
//
//   1. GEOMETRY — raw pointer samples were connected with straight `L`
//      segments, which reads as visibly faceted/polygonal. `smoothPath()`
//      now fits a Catmull-Rom spline through the sampled points and
//      converts it to cubic Bézier segments: unlike a simple midpoint
//      approximation, this passes exactly through every recorded point
//      while keeping the tangent continuous across segments, which is what
//      actually reads as "smooth, natural ink" rather than "smoothed
//      polygon". `MIN_POINT_DISTANCE` still drops samples that barely moved
//      from the last one, so pointer jitter doesn't inject near-duplicate
//      points that would locally re-introduce tiny kinks.
//
//   2. MOTION/PERFORMANCE — a stroke used to call setState (and therefore
//      re-render, including recomputing every OTHER annotation's smoothed
//      path) on every single native pointermove event. Fixed two ways:
//        - pointer moves are now batched to one flush per animation frame
//          (`requestAnimationFrame`), using `PointerEvent.
//          getCoalescedEvents()` to still capture every sample the browser
//          delivered between frames.
//        - the list of already-existing annotations is memoized (`useMemo`)
//          so it is NOT recomputed on every one of those per-frame updates.
//
// SPEED/FLUIDITY PASS (PHYGO Workspace, "faster than GoodNotes"): even with
// (1) and (2) above, the in-progress stroke still lived in `useState` —
// meaning every animation frame during a stroke ran a full React re-render.
// Fixed by taking the live preview OUT of React state entirely: the preview
// <path>/<line>/<rect>/<ellipse> elements are refs, and `flushPending()`
// writes straight to their DOM attributes (`el.setAttribute(...)`) every
// animation frame — no `setState`, no re-render, no reconciliation, for the
// entire duration of a stroke. React only re-enters the picture once, at
// `finish()`, to persist the completed stroke as a real annotation. The
// preview elements are always mounted (whichever one matches the current
// `tool`) with degenerate/hidden initial geometry, so the refs are
// guaranteed to exist by the time a stroke can start.
//
// REAL ERASER (adjustable size + actually partial): the eraser used to work
// by rendering an invisible, thick "hit" path on top of every stroke/shape
// and deleting the WHOLE annotation on click — so erasing necessarily took
// the entire line, never just a piece of it, and had no size control at
// all (a click either landed on the hit path or it didn't). Replaced with a
// real drag-based eraser, matching how GoodNotes' eraser actually behaves:
//   - The eraser tool now runs its own pointer-tracking session (separate
//     from the drawing one above, since erasing doesn't create a stroke/
//     shape) — a circular (elliptical in normalized-space, to account for a
//     non-square viewBox scale) hit area of `eraserSize` on-screen pixels
//     follows the pointer, sized by the new adjustable `eraserSize` prop.
//   - For a freehand stroke, every ORIGINAL sampled point that falls inside
//     the eraser's area as it passes over is individually removed — not the
//     whole stroke. What's left is split into runs of surviving consecutive
//     points; each run (if long enough to be a line at all) becomes its own
//     new stroke annotation on release, so drawing a line and erasing its
//     middle leaves two separate strokes behind, exactly like tearing a gap
//     in it. A stroke that's touched but not fully covered keeps most of
//     its shape; one that's fully covered simply disappears.
//   - A shape (line/rect/ellipse) isn't split — geometrically that would be
//     a much bigger feature for little real benefit — but is still deleted
//     only once actually touched by the eraser's area (tested against
//     sampled points along its outline), which is at least size-aware
//     rather than an all-or-nothing single-pixel click.
//   - Exactly like the drawing pass above, none of this touches React state
//     while dragging: touched annotations' DOM elements are looked up via a
//     ref registry (`annotationElRefs`) and mutated directly every frame
//     (rewriting a stroke's `d` to its currently-surviving runs, or hiding
//     a fully-touched shape), and the actual delete/recreate calls to the
//     parent only fire once, on release. A per-annotation bounding-box
//     cache (computed once per erase drag, not per frame) skips the
//     expensive point-by-point test for anything nowhere near the eraser,
//     so this stays fast even on a page with many strokes.
//   - A soft circle outline follows the pointer whenever the eraser tool is
//     active (even before you start dragging) so the adjustable size is
//     actually visible, not just a number in the toolbar.
//
// LONG-STROKE FIX (PHYGO Workspace, "faster/more fluid than GoodNotes"):
// even with the SPEED/FLUIDITY PASS above (no React state during a stroke),
// the live preview still called `smoothPath(points)` on every single RAF
// flush — and that function rebuilds the ENTIRE Catmull-Rom curve from
// scratch every time, over the FULL point list so far. For a short flick
// that's free; for a long continuous stroke (underlining a paragraph,
// drawing a long diagram line — easily 200-500+ sampled points) each frame
// got progressively more expensive as the stroke grew, so the pen would
// visibly get LAGGIER the longer you kept drawing without lifting — exactly
// the opposite of how a native app like GoodNotes feels (constant-time per
// frame, however long the stroke runs).
//
// Fixed by baking the path incrementally instead of recomputing it: once a
// point's Catmull-Rom segment has all four points it needs (i.e. two points
// AFTER it have already arrived, so its true tangent is known), that
// segment is computed exactly once and appended to a persistent `committedD`
// string kept in the stroke's own state — never touched again. Only the
// still-"provisional" tail (at most the last one or two segments, whose
// final shape can still be nudged by the next incoming point) is recomputed
// each frame. That makes every frame's cost O(1) regardless of how many
// points the stroke has accumulated so far, instead of the old O(total
// points so far). `catmullSegment()` below is the same math `smoothPath()`
// already used, just factored out so both the incremental live-preview path
// and the one-shot persisted-render path (smoothPath itself, used for
// already-saved strokes and for the eraser's stroke-splitting rewrite,
// neither of which run every animation frame) share one implementation.

import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { AnnotationTool, ShapeAnnotationData, StrokeData, WorkspaceAnnotation } from '@/lib/workspace/types'

const MIN_DRAG = 0.004 // ignore near-zero drags (accidental clicks) in normalized units
const DRAWING_TOOLS: AnnotationTool[] = ['pen', 'highlighter', 'line', 'rect', 'ellipse']
const FREEHAND_TOOLS: AnnotationTool[] = ['pen', 'highlighter']
const MIN_POINT_DISTANCE = 0.0015 // normalized units — filters mouse/trackpad jitter, not real motion
const MIN_POINT_DISTANCE_SQ = MIN_POINT_DISTANCE * MIN_POINT_DISTANCE
// See HIGHLIGHTER VISIBILITY FIX above — high enough that the multiply-
// blended result still reads as a clear, saturated color rather than a
// faint tint, low enough that text underneath stays legible.
const HIGHLIGHT_OPACITY = 0.6

type Point = { x: number; y: number }
type Bbox = { minX: number; minY: number; maxX: number; maxY: number }

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

// Catmull-Rom → cubic Bézier smoothing (see SMOOTHING/GEOMETRY note above).
// Accepts either [x, y, pressure?] tuples (StrokeData.points' exact shape)
// or {x, y} objects (the live in-progress point list) via a small normalizer.
// Passes exactly through every sampled point while keeping the curve's
// tangent continuous across segments (standard 1/6-tangent-scale Catmull-Rom
// conversion), which is what makes freehand ink read as smooth rather than
// as a "smoothed" but still visibly-cornered polyline.
// One Catmull-Rom→Bézier segment from p1 to p2, using its neighbors p0/p3
// for tangent info (see LONG-STROKE FIX above for why this is split out).
function catmullSegment(p0: Point, p1: Point, p2: Point, p3: Point): string {
  const c1x = p1.x + (p2.x - p0.x) / 6
  const c1y = p1.y + (p2.y - p0.y) / 6
  const c2x = p2.x - (p3.x - p1.x) / 6
  const c2y = p2.y - (p3.y - p1.y) / 6
  return ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
}

function smoothPath(rawPoints: Array<[number, number, number?] | Point>): string {
  const pts: Point[] = rawPoints.map((p) => (Array.isArray(p) ? { x: p[0], y: p[1] } : p))
  if (pts.length < 2) return ''
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`
  }

  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    d += catmullSegment(p0, p1, p2, p3)
  }
  return d
}

function setLineAttrs(el: SVGLineElement, start: Point, end: Point) {
  el.setAttribute('x1', String(start.x))
  el.setAttribute('y1', String(start.y))
  el.setAttribute('x2', String(end.x))
  el.setAttribute('y2', String(end.y))
}

function setRectAttrs(el: SVGRectElement, start: Point, end: Point) {
  el.setAttribute('x', String(Math.min(start.x, end.x)))
  el.setAttribute('y', String(Math.min(start.y, end.y)))
  el.setAttribute('width', String(Math.abs(end.x - start.x)))
  el.setAttribute('height', String(Math.abs(end.y - start.y)))
}

function setEllipseAttrs(el: SVGEllipseElement, start: Point, end: Point) {
  const w = Math.abs(end.x - start.x)
  const h = Math.abs(end.y - start.y)
  el.setAttribute('cx', String(Math.min(start.x, end.x) + w / 2))
  el.setAttribute('cy', String(Math.min(start.y, end.y) + h / 2))
  el.setAttribute('rx', String(w / 2))
  el.setAttribute('ry', String(h / 2))
}

// --- REAL ERASER helpers (see note at top of file) --------------------

// Splits a point list that may contain `null` "erased" gaps into runs of
// consecutive surviving points, dropping any run too short to be a line.
function splitRuns(points: Array<Point | null>): Point[][] {
  const runs: Point[][] = []
  let current: Point[] = []
  for (const p of points) {
    if (p) {
      current.push(p)
    } else if (current.length >= 2) {
      runs.push(current)
      current = []
    } else {
      current = []
    }
  }
  if (current.length >= 2) runs.push(current)
  return runs
}

function strokeBbox(points: Array<[number, number, number?]>): Bbox {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const pt of points) {
    if (pt[0] < minX) minX = pt[0]
    if (pt[0] > maxX) maxX = pt[0]
    if (pt[1] < minY) minY = pt[1]
    if (pt[1] > maxY) maxY = pt[1]
  }
  return { minX, minY, maxX, maxY }
}

function shapeBbox(data: ShapeAnnotationData): Bbox {
  return {
    minX: Math.min(data.x1, data.x2),
    minY: Math.min(data.y1, data.y2),
    maxX: Math.max(data.x1, data.x2),
    maxY: Math.max(data.y1, data.y2),
  }
}

// Cheap early-out: is the eraser (expanded by its own radius) anywhere near
// this annotation's bounding box? Lets a page with many strokes skip the
// expensive point-by-point test for everything the eraser isn't near.
function bboxNear(b: Bbox, p: Point, rx: number, ry: number): boolean {
  return p.x + rx >= b.minX && p.x - rx <= b.maxX && p.y + ry >= b.minY && p.y - ry <= b.maxY
}

function withinEllipse(p: Point, center: Point, rx: number, ry: number): boolean {
  const dx = (p.x - center.x) / rx
  const dy = (p.y - center.y) / ry
  return dx * dx + dy * dy <= 1
}

// A coarse set of points along a shape's own outline, used to test whether
// the eraser's area actually touches it (see REAL ERASER note — shapes are
// deleted whole, but only once genuinely touched, not on a single-pixel
// click).
function shapeSamplePoints(data: ShapeAnnotationData): Point[] {
  if (data.kind === 'line') {
    return [
      { x: data.x1, y: data.y1 },
      { x: data.x2, y: data.y2 },
      { x: (data.x1 + data.x2) / 2, y: (data.y1 + data.y2) / 2 },
    ]
  }
  const x = Math.min(data.x1, data.x2)
  const y = Math.min(data.y1, data.y2)
  const w = Math.abs(data.x2 - data.x1)
  const h = Math.abs(data.y2 - data.y1)
  if (data.kind === 'rect') {
    const pts: Point[] = []
    const STEPS = 8
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS
      pts.push({ x: x + t * w, y })
      pts.push({ x: x + t * w, y: y + h })
      pts.push({ x, y: y + t * h })
      pts.push({ x: x + w, y: y + t * h })
    }
    return pts
  }
  // ellipse
  const cx = x + w / 2
  const cy = y + h / 2
  const rx = w / 2
  const ry = h / 2
  const pts: Point[] = []
  const STEPS = 16
  for (let i = 0; i < STEPS; i++) {
    const a = (i / STEPS) * Math.PI * 2
    pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) })
  }
  return pts
}

export default function AnnotationCanvas({
  annotations,
  tool,
  color,
  width,
  onCreateStroke,
  onCreateShape,
  onDelete,
  pageIsDark = false,
  eraserSize = 26,
}: {
  annotations: WorkspaceAnnotation[] // this page's 'stroke' + 'shape' annotations only
  tool: AnnotationTool
  color: string
  width: number
  onCreateStroke: (data: StrokeData) => void
  onCreateShape: (data: ShapeAnnotationData) => void
  onDelete: (id: string) => void
  /** Is the underlying page/paper dark? Picks the highlighter's blend mode
   *  (see HIGHLIGHTER blend-mode note above) — NOT the app's own light/dark
   *  theme, which is unrelated to the page being annotated. Defaults false:
   *  a PDF page is opaque white essentially always, regardless of PHYGO's
   *  UI theme (see the PEN FIX note at the top of this file), so PdfViewer
   *  never needs to pass this. NotebookPageView passes its paper's own
   *  computed darkness. */
  pageIsDark?: boolean
  /** On-screen DIAMETER (px) of the eraser's circular hit area — see the
   *  REAL ERASER note above. Adjustable from the toolbar. */
  eraserSize?: number
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  // The four possible live-preview elements — see SPEED/FLUIDITY PASS above.
  // Exactly one is relevant for the current `tool`; all four stay mounted
  // (hidden) so their refs are always ready before a stroke can start.
  const freehandPreviewRef = useRef<SVGPathElement>(null)
  const linePreviewRef = useRef<SVGLineElement>(null)
  const rectPreviewRef = useRef<SVGRectElement>(null)
  const ellipsePreviewRef = useRef<SVGEllipseElement>(null)
  const eraserCursorRef = useRef<SVGEllipseElement>(null)

  // Mutable in-progress-stroke state for the window-level listeners below,
  // which are attached once per stroke and must always see the latest value
  // without re-subscribing on every pointer move (that would drop frames).
  // Never fed to React state — see SPEED/FLUIDITY PASS above — so `points`
  // is mutated in place rather than copied on every accepted sample.
  // `committedD`/`segCommitted` are the LONG-STROKE FIX's incremental-build
  // state for the freehand case (unused/left at their initial values for
  // line/rect/ellipse, which don't need it — see flushPending below).
  const stateRef = useRef<{
    start: Point
    points: Point[]
    tool: AnnotationTool
    committedD: string
    segCommitted: number
  } | null>(null)
  // Coalesced points collected since the last animation-frame flush — see
  // the MOTION/PERFORMANCE note above.
  const pendingPointsRef = useRef<Point[]>([])
  const rafRef = useRef<number | null>(null)

  // --- REAL ERASER state (see note at top of file) ---
  // Direct-DOM registry of every rendered stroke/shape element, keyed by
  // annotation id, so the eraser drag can rewrite/hide the right element
  // every frame without going through React.
  const annotationElRefs = useRef<Map<string, SVGGraphicsElement>>(new Map())
  const eraseTouchedStrokesRef = useRef<Map<string, { points: Array<Point | null>; original: StrokeData }>>(new Map())
  const eraseTouchedShapeIdsRef = useRef<Set<string>>(new Set())
  const eraseBboxCacheRef = useRef<Map<string, Bbox>>(new Map())
  const erasePendingRef = useRef<Point[]>([])
  const eraseRafRef = useRef<number | null>(null)

  const isDrawingTool = DRAWING_TOOLS.includes(tool)
  const eraserActive = tool === 'eraser'

  const toNormalized = (clientX: number, clientY: number): Point | null => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return null
    return { x: clamp01((clientX - rect.left) / rect.width), y: clamp01((clientY - rect.top) / rect.height) }
  }

  // Applies whatever points have accumulated in `pendingPointsRef` since the
  // last frame straight to the relevant preview element's DOM attributes —
  // no React state, no re-render (see SPEED/FLUIDITY PASS above).
  const flushPending = () => {
    rafRef.current = null
    const state = stateRef.current
    const pending = pendingPointsRef.current
    pendingPointsRef.current = []
    if (!state || pending.length === 0) return

    if (FREEHAND_TOOLS.includes(state.tool)) {
      const points = state.points
      for (const p of pending) {
        const last = points[points.length - 1]
        const dx = p.x - last.x
        const dy = p.y - last.y
        // Drop samples that barely moved from the last recorded point — see
        // the SMOOTHING note at the top of this file. Only affects
        // mid-stroke sampling density, never the stroke's start (always
        // recorded on pointerdown) or its overall extent.
        if (dx * dx + dy * dy < MIN_POINT_DISTANCE_SQ) continue
        points.push(p)
      }

      // See LONG-STROKE FIX above. Below 3 points, mirror smoothPath()'s own
      // small-N special cases exactly (so the live preview never visibly
      // differs from what finish() will persist); at 3+ points, bake
      // permanently-settled segments once and only recompute the short
      // still-provisional tail every frame.
      if (points.length < 3) {
        if (freehandPreviewRef.current) {
          freehandPreviewRef.current.setAttribute('d', smoothPath(points))
        }
      } else {
        while (points.length - state.segCommitted >= 3) {
          const i = state.segCommitted
          const p0 = points[i - 1] ?? points[i]
          const p1 = points[i]
          const p2 = points[i + 1]
          const p3 = points[i + 2]
          state.committedD += catmullSegment(p0, p1, p2, p3)
          state.segCommitted++
        }
        let tail = ''
        for (let i = state.segCommitted; i <= points.length - 2; i++) {
          const p0 = points[i - 1] ?? points[i]
          const p1 = points[i]
          const p2 = points[i + 1]
          const p3 = points[i + 2] ?? p2
          tail += catmullSegment(p0, p1, p2, p3)
        }
        if (freehandPreviewRef.current) {
          freehandPreviewRef.current.setAttribute('d', state.committedD + tail)
        }
      }
    } else {
      const end = pending[pending.length - 1]
      state.points[1] = end
      if (state.tool === 'line' && linePreviewRef.current) {
        setLineAttrs(linePreviewRef.current, state.start, end)
      } else if (state.tool === 'rect' && rectPreviewRef.current) {
        setRectAttrs(rectPreviewRef.current, state.start, end)
      } else if (state.tool === 'ellipse' && ellipsePreviewRef.current) {
        setEllipseAttrs(ellipsePreviewRef.current, state.start, end)
      }
    }
  }

  const hidePreviews = () => {
    if (freehandPreviewRef.current) freehandPreviewRef.current.style.display = 'none'
    if (linePreviewRef.current) linePreviewRef.current.style.display = 'none'
    if (rectPreviewRef.current) rectPreviewRef.current.style.display = 'none'
    if (ellipsePreviewRef.current) ellipsePreviewRef.current.style.display = 'none'
  }

  const finish = () => {
    // Apply any still-pending coalesced points before reading the final
    // list, so the last few samples before pointerup are never dropped.
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      flushPending()
    }

    const state = stateRef.current
    stateRef.current = null
    pendingPointsRef.current = []
    window.removeEventListener('pointermove', handleWindowMove)
    window.removeEventListener('pointerup', handleWindowUp)
    window.removeEventListener('pointercancel', handleWindowUp)
    // The finished stroke is about to be persisted and re-rendered as a
    // normal (memoized) annotation instead — hide whichever preview
    // element was standing in for it while it was in progress.
    hidePreviews()
    if (!state) return

    const { start, points, tool: activeTool } = state
    if (FREEHAND_TOOLS.includes(activeTool)) {
      if (points.length < 2) return
      onCreateStroke({ tool: activeTool as 'pen' | 'highlighter', color, width, points: points.map((p): [number, number] => [p.x, p.y]) })
      return
    }

    const end = points[1] || start
    const dx = Math.abs(end.x - start.x)
    const dy = Math.abs(end.y - start.y)
    if (dx < MIN_DRAG && dy < MIN_DRAG) return // treat as an accidental click, not a shape

    const kind = activeTool === 'line' ? 'line' : activeTool === 'rect' ? 'rect' : activeTool === 'ellipse' ? 'ellipse' : null
    if (!kind) return
    onCreateShape({ kind, x1: start.x, y1: start.y, x2: end.x, y2: end.y, color, width })
  }

  const handleWindowMove = (e: PointerEvent) => {
    if (!stateRef.current) return
    // getCoalescedEvents() returns every raw sample the OS/browser batched
    // since the last dispatched event (can be several on a fast stylus
    // stroke) — collecting all of them keeps full curve fidelity even
    // though we only flush to the DOM once per animation frame.
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : []
    const source = events.length > 0 ? events : [e]
    for (const evt of source) {
      const p = toNormalized(evt.clientX, evt.clientY)
      if (p) pendingPointsRef.current.push(p)
    }
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(flushPending)
    }
  }

  const handleWindowUp = () => finish()

  // --- REAL ERASER handlers (see note at top of file) ---

  // Runs the actual hit-test + live visual update for one batch of eraser
  // samples (a single point at pointerdown, or several coalesced samples
  // per animation frame while dragging). Reads `annotations` (the current
  // prop) directly rather than a snapshot, since it doesn't change mid-drag
  // in practice (no other create/delete happens while erasing).
  const processEraseSamples = (samples: Point[]) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0 || samples.length === 0) return
    const rx = eraserSize / 2 / rect.width
    const ry = eraserSize / 2 / rect.height

    for (const a of annotations) {
      if (a.type === 'stroke') {
        const data = a.data as StrokeData
        if (!data.points || data.points.length < 2) continue

        let bbox = eraseBboxCacheRef.current.get(a.id)
        if (!bbox) {
          bbox = strokeBbox(data.points)
          eraseBboxCacheRef.current.set(a.id, bbox)
        }
        if (!samples.some((s) => bboxNear(bbox!, s, rx, ry))) continue

        let working = eraseTouchedStrokesRef.current.get(a.id)
        if (!working) {
          working = { points: data.points.map((pt): Point => ({ x: pt[0], y: pt[1] })), original: data }
          eraseTouchedStrokesRef.current.set(a.id, working)
        }

        let changed = false
        for (let i = 0; i < working.points.length; i++) {
          const wp = working.points[i]
          if (!wp) continue
          for (const s of samples) {
            if (withinEllipse(wp, s, rx, ry)) {
              working.points[i] = null
              changed = true
              break
            }
          }
        }
        if (changed) {
          const el = annotationElRefs.current.get(a.id) as SVGPathElement | undefined
          if (el) {
            const runs = splitRuns(working.points)
            el.setAttribute('d', runs.map((run) => smoothPath(run)).join(' '))
          }
        }
      } else if (a.type === 'shape') {
        if (eraseTouchedShapeIdsRef.current.has(a.id)) continue
        const data = a.data as ShapeAnnotationData

        let bbox = eraseBboxCacheRef.current.get(a.id)
        if (!bbox) {
          bbox = shapeBbox(data)
          eraseBboxCacheRef.current.set(a.id, bbox)
        }
        if (!samples.some((s) => bboxNear(bbox!, s, rx, ry))) continue

        const touched = shapeSamplePoints(data).some((sp) => samples.some((s) => withinEllipse(sp, s, rx, ry)))
        if (touched) {
          eraseTouchedShapeIdsRef.current.add(a.id)
          const el = annotationElRefs.current.get(a.id)
          if (el) el.style.display = 'none'
        }
      }
    }
  }

  const flushErase = () => {
    eraseRafRef.current = null
    const pending = erasePendingRef.current
    erasePendingRef.current = []
    if (pending.length > 0) processEraseSamples(pending)
  }

  const finishErase = () => {
    if (eraseRafRef.current != null) {
      cancelAnimationFrame(eraseRafRef.current)
      flushErase()
    }
    window.removeEventListener('pointermove', handleEraseWindowMove)
    window.removeEventListener('pointerup', handleEraseWindowUp)
    window.removeEventListener('pointercancel', handleEraseWindowUp)

    // Commit: shapes that were touched are deleted outright; strokes that
    // were touched are replaced by whatever surviving runs are left (zero,
    // one, or several — see REAL ERASER note above).
    for (const id of eraseTouchedShapeIdsRef.current) onDelete(id)
    for (const [id, working] of eraseTouchedStrokesRef.current) {
      const runs = splitRuns(working.points)
      onDelete(id)
      for (const run of runs) {
        onCreateStroke({
          tool: working.original.tool,
          color: working.original.color,
          width: working.original.width,
          points: run.map((p): [number, number] => [p.x, p.y]),
        })
      }
    }

    eraseTouchedStrokesRef.current = new Map()
    eraseTouchedShapeIdsRef.current = new Set()
    eraseBboxCacheRef.current = new Map()
  }

  const handleEraseWindowMove = (e: PointerEvent) => {
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : []
    const source = events.length > 0 ? events : [e]
    for (const evt of source) {
      const p = toNormalized(evt.clientX, evt.clientY)
      if (p) erasePendingRef.current.push(p)
    }
    if (eraseRafRef.current == null) {
      eraseRafRef.current = requestAnimationFrame(flushErase)
    }
  }

  const handleEraseWindowUp = () => finishErase()

  const updateEraserCursor = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    const cursor = eraserCursorRef.current
    if (!rect || !cursor || rect.width === 0 || rect.height === 0) return
    const p = toNormalized(clientX, clientY)
    if (!p) return
    cursor.setAttribute('cx', String(p.x))
    cursor.setAttribute('cy', String(p.y))
    cursor.setAttribute('rx', String(eraserSize / 2 / rect.width))
    cursor.setAttribute('ry', String(eraserSize / 2 / rect.height))
    cursor.style.display = ''
  }

  const hideEraserCursor = () => {
    if (eraserCursorRef.current) eraserCursorRef.current.style.display = 'none'
  }

  // Reference the handlers via a stable identity so add/removeEventListener
  // target the same function — defined once per render is fine here since
  // they're only (de)registered from handlePointerDown/finish, not on every
  // render.
  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (eraserActive) {
      const p = toNormalized(e.clientX, e.clientY)
      if (!p) return
      e.preventDefault()
      eraseTouchedStrokesRef.current = new Map()
      eraseTouchedShapeIdsRef.current = new Set()
      eraseBboxCacheRef.current = new Map()
      erasePendingRef.current = []
      processEraseSamples([p])
      window.addEventListener('pointermove', handleEraseWindowMove)
      window.addEventListener('pointerup', handleEraseWindowUp)
      window.addEventListener('pointercancel', handleEraseWindowUp)
      return
    }

    if (!isDrawingTool) return
    e.preventDefault()
    const p = toNormalized(e.clientX, e.clientY)
    if (!p) return
    // Freehand tools grow `points` one sample at a time (pushed in
    // flushPending); shape tools keep it fixed at [start, end] and just
    // overwrite index 1 every frame — see flushPending/finish above.
    stateRef.current = {
      start: p,
      points: FREEHAND_TOOLS.includes(tool) ? [p] : [p, p],
      tool,
      committedD: `M ${p.x} ${p.y}`,
      segCommitted: 0,
    }
    pendingPointsRef.current = []

    // Show + initialize this stroke's preview element directly via its DOM
    // ref — nothing about starting a stroke should wait for a React
    // re-render (see SPEED/FLUIDITY PASS above).
    if (FREEHAND_TOOLS.includes(tool) && freehandPreviewRef.current) {
      freehandPreviewRef.current.style.display = ''
      freehandPreviewRef.current.setAttribute('d', `M ${p.x} ${p.y}`)
    } else if (tool === 'line' && linePreviewRef.current) {
      linePreviewRef.current.style.display = ''
      setLineAttrs(linePreviewRef.current, p, p)
    } else if (tool === 'rect' && rectPreviewRef.current) {
      rectPreviewRef.current.style.display = ''
      setRectAttrs(rectPreviewRef.current, p, p)
    } else if (tool === 'ellipse' && ellipsePreviewRef.current) {
      ellipsePreviewRef.current.style.display = ''
      setEllipseAttrs(ellipsePreviewRef.current, p, p)
    }

    window.addEventListener('pointermove', handleWindowMove)
    window.addEventListener('pointerup', handleWindowUp)
    window.addEventListener('pointercancel', handleWindowUp)
  }

  // Callback-ref factory registering each rendered annotation's own DOM
  // element for the eraser to mutate directly — see REAL ERASER note above.
  const registerAnnotationEl = (id: string) => (el: SVGGraphicsElement | null) => {
    if (el) annotationElRefs.current.set(id, el)
    else annotationElRefs.current.delete(id)
  }

  const renderShape = (a: WorkspaceAnnotation) => {
    if (a.type === 'stroke') {
      const data = a.data as StrokeData
      if (!data.points || data.points.length < 2) return null
      const d = smoothPath(data.points)
      const isMarker = data.tool === 'highlighter'
      return (
        <path
          key={a.id}
          ref={registerAnnotationEl(a.id)}
          d={d}
          fill="none"
          stroke={data.color}
          strokeWidth={data.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity={isMarker ? HIGHLIGHT_OPACITY : 1}
          className={isMarker ? (pageIsDark ? 'mix-blend-screen' : 'mix-blend-multiply') : undefined}
          style={{ pointerEvents: 'none' }}
        />
      )
    }

    if (a.type === 'shape') {
      const data = a.data as ShapeAnnotationData
      if (data.kind === 'line') {
        return (
          <line
            key={a.id}
            ref={registerAnnotationEl(a.id)}
            x1={data.x1}
            y1={data.y1}
            x2={data.x2}
            y2={data.y2}
            stroke={data.color}
            strokeWidth={data.width}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ pointerEvents: 'none' }}
          />
        )
      }
      const x = Math.min(data.x1, data.x2)
      const y = Math.min(data.y1, data.y2)
      const w = Math.abs(data.x2 - data.x1)
      const h = Math.abs(data.y2 - data.y1)
      if (data.kind === 'rect') {
        return (
          <rect
            key={a.id}
            ref={registerAnnotationEl(a.id)}
            x={x}
            y={y}
            width={w}
            height={h}
            fill="none"
            stroke={data.color}
            strokeWidth={data.width}
            vectorEffect="non-scaling-stroke"
            style={{ pointerEvents: 'none' }}
          />
        )
      }
      return (
        <ellipse
          key={a.id}
          ref={registerAnnotationEl(a.id)}
          cx={x + w / 2}
          cy={y + h / 2}
          rx={w / 2}
          ry={h / 2}
          fill="none"
          stroke={data.color}
          strokeWidth={data.width}
          vectorEffect="non-scaling-stroke"
          style={{ pointerEvents: 'none' }}
        />
      )
    }
    return null
  }

  // Memoized so a per-frame update to the in-progress stroke never
  // recomputes every OTHER annotation's smoothed path — see the
  // MOTION/PERFORMANCE note at the top of this file. Now that both drawing
  // AND erasing live entirely outside React state (see SPEED/FLUIDITY PASS
  // and REAL ERASER above), this component doesn't re-render at all during
  // either gesture — the memo stays as a guard against a future reason for
  // this component to re-render mid-gesture becoming an accidental perf
  // regression again.
  const renderedAnnotations = useMemo(
    () => annotations.map(renderShape),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [annotations, pageIsDark]
  )

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      style={{
        pointerEvents: isDrawingTool || eraserActive ? 'auto' : 'none',
        touchAction: isDrawingTool || eraserActive ? 'none' : undefined,
        cursor: eraserActive ? 'none' : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={eraserActive ? (e) => updateEraserCursor(e.clientX, e.clientY) : undefined}
      onPointerLeave={eraserActive ? hideEraserCursor : undefined}
    >
      {renderedAnnotations}

      {/* Live preview elements — see SPEED/FLUIDITY PASS above. Always
          mounted (one per tool family) so their refs exist before a stroke
          can start; hidden via `display: none` until handlePointerDown
          shows the relevant one, and updated imperatively from then on. */}
      {FREEHAND_TOOLS.includes(tool) && (
        <path
          ref={freehandPreviewRef}
          d=""
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity={tool === 'highlighter' ? HIGHLIGHT_OPACITY : 0.85}
          className={tool === 'highlighter' ? (pageIsDark ? 'mix-blend-screen' : 'mix-blend-multiply') : undefined}
          style={{ display: 'none', pointerEvents: 'none' }}
        />
      )}
      {tool === 'line' && (
        <line
          ref={linePreviewRef}
          x1={0}
          y1={0}
          x2={0}
          y2={0}
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.85}
          style={{ display: 'none', pointerEvents: 'none' }}
        />
      )}
      {tool === 'rect' && (
        <rect
          ref={rectPreviewRef}
          x={0}
          y={0}
          width={0}
          height={0}
          fill="none"
          stroke={color}
          strokeWidth={width}
          vectorEffect="non-scaling-stroke"
          opacity={0.85}
          style={{ display: 'none', pointerEvents: 'none' }}
        />
      )}
      {tool === 'ellipse' && (
        <ellipse
          ref={ellipsePreviewRef}
          cx={0}
          cy={0}
          rx={0}
          ry={0}
          fill="none"
          stroke={color}
          strokeWidth={width}
          vectorEffect="non-scaling-stroke"
          opacity={0.85}
          style={{ display: 'none', pointerEvents: 'none' }}
        />
      )}

      {/* Eraser cursor — a soft circle that follows the pointer whenever
          the eraser tool is active, sized to the actual `eraserSize` so the
          adjustable size (see REAL ERASER note above) is visible, not just
          a number in the toolbar. Native cursor is hidden via the <svg>'s
          own `cursor: none` above so this doesn't double up with it. */}
      {eraserActive && (
        <ellipse
          ref={eraserCursorRef}
          cx={0}
          cy={0}
          rx={0}
          ry={0}
          fill="rgba(148,163,184,0.25)"
          stroke="rgba(71,85,105,0.7)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          style={{ display: 'none', pointerEvents: 'none' }}
        />
      )}
    </svg>
  )
}
