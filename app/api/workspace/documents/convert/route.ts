import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/lib/workspace/authServer'
import {
  convertOfficeDocToPdf,
  convertEpubToPdf,
  wrapImageAsPdf,
  SofficeNotFoundError,
  EbookConvertNotFoundError,
} from '@/lib/workspace/convertToPdf'

// POST /api/workspace/documents/convert -> { storage_key: string, mime_type: 'application/pdf' }
//
// Second step of importing a non-PDF Workspace document (Word/.docx,
// PowerPoint/.pptx, EPUB, or an image) — see ImportPdfButton.tsx. The client
// has already uploaded the ORIGINAL file to Storage under its own extension;
// this route downloads those bytes, converts them to PDF, uploads the PDF
// under a new key, and deletes the original. The client then runs the exact
// same page-count + POST /api/workspace/documents flow it already used for
// native PDFs, just pointed at the new key — so the rest of Workspace
// (reader, annotations, bookmarks) never needs to know a document didn't
// start out as a PDF.
//
// Word/.docx and PowerPoint/.pptx go through LibreOffice; EPUB goes through
// Calibre instead — see the doc comment in convertToPdf.ts for why EPUB
// specifically needs a different engine (LibreOffice's own EPUB import was
// unreliable in headless testing).
const OFFICE_EXTENSIONS = new Set(['docx', 'pptx'])
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png'])

export async function POST(req: NextRequest) {
  const { user, supabase, unauthorized } = await requireWorkspaceUser()
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => null)
  const storageKey = typeof body?.storage_key === 'string' ? body.storage_key : ''

  if (!storageKey || !storageKey.startsWith(`${user.id}/`)) {
    // Same defense-in-depth as /api/workspace/documents POST: only ever act
    // on a path storage RLS would actually let this user touch.
    return NextResponse.json({ error: 'invalid storage_key' }, { status: 400 })
  }

  const ext = storageKey.split('.').pop()?.toLowerCase() || ''
  if (!OFFICE_EXTENSIONS.has(ext) && ext !== 'epub' && !IMAGE_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 400 })
  }

  const { data: downloaded, error: downloadError } = await supabase.storage.from('workspace-files').download(storageKey)
  if (downloadError || !downloaded) {
    return NextResponse.json({ error: downloadError?.message || 'download_failed' }, { status: 500 })
  }
  const originalBytes = Buffer.from(await downloaded.arrayBuffer())

  let pdfBytes: Buffer
  try {
    if (IMAGE_EXTENSIONS.has(ext)) {
      pdfBytes = await wrapImageAsPdf(originalBytes, ext === 'png' ? 'image/png' : 'image/jpeg')
    } else if (ext === 'epub') {
      pdfBytes = await convertEpubToPdf(originalBytes)
    } else {
      pdfBytes = await convertOfficeDocToPdf(originalBytes, ext)
    }
  } catch (err) {
    // Clean up the uploaded original even on failure — no orphaned Storage object.
    await supabase.storage.from('workspace-files').remove([storageKey])
    if (err instanceof SofficeNotFoundError) {
      return NextResponse.json({ error: 'soffice_not_found' }, { status: 503 })
    }
    if (err instanceof EbookConvertNotFoundError) {
      return NextResponse.json({ error: 'calibre_not_found' }, { status: 503 })
    }
    console.error('workspace document conversion failed', err)
    return NextResponse.json({ error: 'conversion_failed' }, { status: 500 })
  }

  const pdfKey = `${user.id}/${crypto.randomUUID()}.pdf`
  const { error: uploadError } = await supabase.storage
    .from('workspace-files')
    .upload(pdfKey, pdfBytes, { contentType: 'application/pdf', upsert: false })

  // Always clean up the original non-PDF object once we have (or failed to
  // get) the PDF version — it's never referenced by anything after this.
  await supabase.storage.from('workspace-files').remove([storageKey])

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message || 'upload_failed' }, { status: 500 })
  }

  return NextResponse.json({ storage_key: pdfKey, mime_type: 'application/pdf' })
}
