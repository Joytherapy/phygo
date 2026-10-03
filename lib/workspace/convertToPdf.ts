// Server-only helpers that turn a non-PDF Workspace import (Word, PowerPoint,
// EPUB, or an image) into PDF bytes, so it can flow into the SAME
// PdfViewer/annotation pipeline every native PDF already uses — see
// app/api/workspace/documents/convert/route.ts for how these are called, and
// ImportPdfButton.tsx for the client-side two-step upload this supports.
//
// Two different external engines are used, each for what it's actually good
// at:
//   - Word (.docx) / PowerPoint (.pptx) go through LibreOffice headless
//     (`soffice --convert-to pdf`). There's no reliable pure-JS renderer for
//     these — especially .pptx, which needs a real slide layout engine — and
//     LibreOffice handles genuine Office documents reliably in headless mode.
//   - EPUB goes through Calibre's `ebook-convert` instead. LibreOffice DOES
//     ship an EPUB import filter, but in testing it crashed outright
//     ("Unspecified Application Error") on a syntactically valid EPUB in
//     headless mode — reproduced on multiple well-formed test files, for
//     BOTH a PDF export and a plain-text export, so it's LibreOffice's EPUB
//     *import* itself that's unreliable headless here, not a flag/filter
//     issue. Calibre is the standard, far more robust tool for ebook format
//     conversion specifically, so EPUB uses it instead.
// Images need no external engine at all and are wrapped into a single-page
// PDF directly via pdf-lib.
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PDFDocument } from 'pdf-lib'

const execFileAsync = promisify(execFile)

export class SofficeNotFoundError extends Error {
  constructor() {
    super('LibreOffice (soffice) binary not found')
    this.name = 'SofficeNotFoundError'
  }
}

export class EbookConvertNotFoundError extends Error {
  constructor() {
    super('Calibre (ebook-convert) binary not found')
    this.name = 'EbookConvertNotFoundError'
  }
}

// Checked in order before falling back to relying on PATH. Covers the
// standard macOS .app bundle (what the libreoffice.org .dmg installer
// produces) — the plain installer does NOT add `soffice` to the shell PATH,
// so without this list a fresh install would silently fail to be found.
const SOFFICE_CANDIDATE_PATHS = [
  process.env.SOFFICE_PATH,
  '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  '/opt/homebrew/bin/soffice',
  '/usr/local/bin/soffice',
  '/usr/bin/soffice', // common Linux package path, for whenever this deploys off the user's Mac
].filter((p): p is string => Boolean(p))

// Same idea for Calibre's CLI tool — the macOS .app bundle also does NOT put
// `ebook-convert` on PATH by default; it lives inside the app bundle's
// MacOS folder alongside the GUI binary.
const EBOOK_CONVERT_CANDIDATE_PATHS = [
  process.env.EBOOK_CONVERT_PATH,
  '/Applications/calibre.app/Contents/MacOS/ebook-convert',
  '/opt/homebrew/bin/ebook-convert',
  '/usr/local/bin/ebook-convert',
  '/usr/bin/ebook-convert',
].filter((p): p is string => Boolean(p))

let cachedSofficePath: string | null | undefined // undefined = not yet resolved this process lifetime
let cachedEbookConvertPath: string | null | undefined

async function resolveBinaryPath(
  candidates: string[],
  fallback: string,
  cached: string | null | undefined
): Promise<{ path: string; cached: string | null | undefined }> {
  if (cached !== undefined) {
    return { path: cached ?? fallback, cached }
  }
  for (const candidate of candidates) {
    try {
      await access(candidate)
      return { path: candidate, cached: candidate }
    } catch {
      // try next candidate
    }
  }
  // Last resort: rely on PATH (e.g. some install methods do add it there).
  // execFile below throws ENOENT if this guess is also wrong, which the
  // caller maps to the appropriate NotFoundError.
  return { path: fallback, cached: undefined }
}

async function resolveSofficePath(): Promise<string> {
  if (cachedSofficePath === null) throw new SofficeNotFoundError()
  const { path: resolved, cached } = await resolveBinaryPath(SOFFICE_CANDIDATE_PATHS, 'soffice', cachedSofficePath)
  cachedSofficePath = cached
  return resolved
}

async function resolveEbookConvertPath(): Promise<string> {
  if (cachedEbookConvertPath === null) throw new EbookConvertNotFoundError()
  const { path: resolved, cached } = await resolveBinaryPath(
    EBOOK_CONVERT_CANDIDATE_PATHS,
    'ebook-convert',
    cachedEbookConvertPath
  )
  cachedEbookConvertPath = cached
  return resolved
}

/**
 * Converts a Word (.docx) or PowerPoint (.pptx) file to PDF bytes via
 * LibreOffice headless (`soffice --convert-to pdf`).
 */
export async function convertOfficeDocToPdf(bytes: Buffer, originalExt: string): Promise<Buffer> {
  const soffice = await resolveSofficePath()
  const workDir = await mkdtemp(path.join(tmpdir(), 'phygo-convert-'))
  const inputPath = path.join(workDir, `input.${originalExt}`)
  const outputPath = path.join(workDir, 'input.pdf')

  try {
    await writeFile(inputPath, bytes)
    try {
      await execFileAsync(
        soffice,
        [
          '--headless',
          '--nologo',
          '--nofirststartwizard',
          // A throwaway profile dir per conversion — without this, a
          // conversion running while the user has LibreOffice open (or two
          // conversions overlapping) can collide on the single default
          // profile lock and hang instead of failing cleanly.
          // NOTE: single dash — `-env:` is LibreOffice's own legacy-style
          // option syntax, distinct from its GNU-style `--headless` etc.
          // `--env:...` (double dash) is silently rejected ("Error in
          // option"), which is exactly what happened during testing.
          `-env:UserInstallation=file://${workDir}/profile`,
          '--convert-to',
          'pdf',
          '--outdir',
          workDir,
          inputPath,
        ],
        { timeout: 120_000 }
      )
    } catch (err: any) {
      if (err?.code === 'ENOENT') {
        cachedSofficePath = null // stop retrying a bad cached guess on later calls
        throw new SofficeNotFoundError()
      }
      throw err
    }
    return await readFile(outputPath)
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

/**
 * Converts an EPUB file to PDF bytes via Calibre's `ebook-convert` CLI —
 * see the module-level comment for why this uses Calibre instead of
 * LibreOffice. Larger timeout than the Office path: `ebook-convert` has to
 * paginate/lay out an entire book (a real instructor manual can run to
 * hundreds of pages), which takes longer than a single Office document.
 */
export async function convertEpubToPdf(bytes: Buffer): Promise<Buffer> {
  const ebookConvert = await resolveEbookConvertPath()
  const workDir = await mkdtemp(path.join(tmpdir(), 'phygo-convert-'))
  const inputPath = path.join(workDir, 'input.epub')
  const outputPath = path.join(workDir, 'output.pdf')

  try {
    await writeFile(inputPath, bytes)
    try {
      await execFileAsync(ebookConvert, [inputPath, outputPath], { timeout: 300_000 })
    } catch (err: any) {
      if (err?.code === 'ENOENT') {
        cachedEbookConvertPath = null // stop retrying a bad cached guess on later calls
        throw new EbookConvertNotFoundError()
      }
      throw err
    }
    return await readFile(outputPath)
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

/** Wraps a JPEG/PNG image as a single-page PDF, sized to the image itself. */
export async function wrapImageAsPdf(bytes: Buffer, mimeType: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const image = mimeType === 'image/png' ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes)
  const page = pdfDoc.addPage([image.width, image.height])
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
  return Buffer.from(await pdfDoc.save())
}
