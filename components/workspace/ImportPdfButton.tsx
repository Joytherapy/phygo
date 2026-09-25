'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import type { WorkspaceDocument } from '@/lib/workspace/types'

const MAX_FILE_BYTES = 300 * 1024 * 1024 // 300MB — generous for a scanned textbook, still bounded

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
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  const handleFile = async (file: File) => {
    setError(null)

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError(ui.import.onlyPdf)
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

    const storageKey = `${user.id}/${crypto.randomUUID()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('workspace-files')
      .upload(storageKey, file, { contentType: 'application/pdf', upsert: false })

    if (uploadError) {
      setError(uploadError.message || ui.import.failed)
      setStatus('error')
      return
    }

    setStatus('processing')

    // Best-effort page count via pdfjs (bundled with react-pdf) — a book that
    // fails to parse here still imports fine, just without a page count yet.
    let pageCount: number | null = null
    try {
      const { pdfjs } = await import('react-pdf')
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
      const buffer = await file.arrayBuffer()
      const doc = await pdfjs.getDocument({ data: buffer }).promise
      pageCount = doc.numPages
    } catch {
      // non-fatal — see comment above
    }

    const name = file.name.replace(/\.pdf$/i, '')
    const res = await fetch('/api/workspace/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        storage_key: storageKey,
        mime_type: 'application/pdf',
        size_bytes: file.size,
        page_count: pageCount,
        folder_id: folderId,
      }),
    })
    const json = await res.json()

    if (!res.ok) {
      // Clean up the orphaned Storage object if the metadata row failed.
      await supabase.storage.from('workspace-files').remove([storageKey])
      setError(json.error || ui.import.failed)
      setStatus('error')
      return
    }

    setStatus('idle')
    onImported(json.document)
  }

  const busy = status === 'uploading' || status === 'processing'

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
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
        {busy ? (status === 'uploading' ? ui.import.uploading : ui.import.processing) : label || ui.import.button}
      </button>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}
