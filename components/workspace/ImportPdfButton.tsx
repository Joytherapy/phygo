'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import type { WorkspaceDocument } from '@/lib/workspace/types'

const MAX_FILE_BYTES = 300 * 1024 * 1024 // 300MB — generous for a scanned textbook, still bounded

// Extensions Workspace can import, mapped to the Content-Type Storage should
// record for the ORIGINAL upload. Every one of these except 'pdf' gets
// converted server-side to a real PDF (see /api/workspace/documents/convert)
// before it ever reaches the reader — so PdfViewer, annotations, bookmarks
// etc. only ever have to deal with actual PDFs, regardless of what the user
// imported.
const ALLOWED_EXTENSIONS: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  epub: 'application/epub+zip',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
}

export default function ImportPdfButton({
  folderId,
  onImported,
  variant = 'button',
  label,
}: {
  folderId: string | null
  onImported: (document: WorkspaceDocument) => void
  variant?: 'button' | 'quiet'
  label?: string
}) {
  const ui = useWorkspaceUi()
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'converting' | 'processing' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  const handleFile = async (file: File) => {
    setError(null)

    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const contentType = ALLOWED_EXTENSIONS[ext]
    if (!contentType) {
      setError(ui.import.unsupportedType)
      setStatus('error')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`File too large (max ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB).`)
      setStatus('error')
      return
    }

    setStatus('uploading')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Session expired — please sign in again.')
      setStatus('error')
      return
    }

    const isPdf = ext === 'pdf'
    const uploadKey = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('workspace-files')
      .upload(uploadKey, file, { contentType, upsert: false })

    if (uploadError) {
      setError(uploadError.message || ui.import.failed)
      setStatus('error')
      return
    }

    let finalStorageKey = uploadKey
    let finalMimeType = contentType

    if (!isPdf) {
      // Word/.pptx/.epub/image — convert to PDF server-side (LibreOffice for
      // Word/PowerPoint, Calibre for EPUB, a direct pdf-lib wrap for images)
      // so everything downstream of this point only ever sees a PDF. The
      // route also deletes the just-uploaded original, converted or not.
      setStatus('converting')
      const convRes = await fetch('/api/workspace/documents/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_key: uploadKey }),
      })
      const convJson = await convRes.json().catch(() => null)
      if (!convRes.ok) {
        setError(
          convJson?.error === 'soffice_not_found'
            ? ui.import.sofficeMissing
            : convJson?.error === 'calibre_not_found'
              ? ui.import.calibreMissing
              : ui.import.failed
        )
        setStatus('error')
        return
      }
      finalStorageKey = convJson.storage_key
      finalMimeType = convJson.mime_type
    }

    setStatus('processing')

    // Best-effort page count via pdfjs (bundled with react-pdf) — a document
    // that fails to parse here still imports fine, just without a page count
    // yet. For a native PDF we already have its bytes locally (`file`); for
    // a converted document we read back the PDF we just produced, straight
    // from Storage (RLS lets this user read their own path, same as the
    // browser client always could).
    let pageCount: number | null = null
    let finalSizeBytes = file.size
    try {
      const { pdfjs } = await import('react-pdf')
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
      let buffer: ArrayBuffer
      if (isPdf) {
        buffer = await file.arrayBuffer()
      } else {
        const { data: pdfBlob } = await supabase.storage.from('workspace-files').download(finalStorageKey)
        buffer = pdfBlob ? await pdfBlob.arrayBuffer() : new ArrayBuffer(0)
        if (pdfBlob) finalSizeBytes = pdfBlob.size
      }
      const doc = await pdfjs.getDocument({ data: buffer }).promise
      pageCount = doc.numPages
    } catch {
      // non-fatal — see comment above
    }

    const name = file.name.replace(new RegExp(`\\.${ext}$`, 'i'), '')
    const res = await fetch('/api/workspace/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        storage_key: finalStorageKey,
        mime_type: finalMimeType,
        size_bytes: finalSizeBytes,
        page_count: pageCount,
        folder_id: folderId,
      }),
    })
    const json = await res.json()

    if (!res.ok) {
      // Clean up the orphaned Storage object if the metadata row failed.
      await supabase.storage.from('workspace-files').remove([finalStorageKey])
      setError(json.error || ui.import.failed)
      setStatus('error')
      return
    }

    setStatus('idle')
    onImported(json.document)
  }

  const busy = status === 'uploading' || status === 'converting' || status === 'processing'

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        // No `accept` attribute at all — intentional, not an oversight.
        // On macOS, ANY accept value (even extension-only, e.g. ".pdf")
        // still gets Chrome to ask LaunchServices to resolve a UTType for
        // the filter, and large scanner-produced PDFs are frequently not
        // indexed with the public.pdf UTI, so the native picker greys them
        // out as unselectable even though they're valid PDFs — this is
        // exactly the reported symptom ("non sono selezionabili", only on
        // Phygo, only for heavy files), and it survived switching to an
        // extension-only accept, which rules out the MIME-type variant of
        // the filter and points at the UTType resolution itself. Dropping
        // `accept` entirely removes any OS-level filter, so no file can
        // ever be greyed out here. The allowed-extension check is still
        // enforced in handleFile() above, which runs after selection and
        // doesn't depend on macOS's file-type index.
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={
          variant === 'button'
            ? 'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-60'
            : 'inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 dark:text-white/70 border border-black/10 dark:border-white/10 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors disabled:opacity-60'
        }
        style={variant === 'button' ? { background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' } : undefined}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {busy
          ? status === 'uploading'
            ? ui.import.uploading
            : status === 'converting'
              ? ui.import.converting
              : ui.import.processing
          : label || ui.import.button}
      </button>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}
