'use client'

// "Insert a photo, like GoodNotes" (PHYGO Workspace) — a small popover with
// two ways in: pick an existing photo (any file input) or take one now
// (a file input with `capture="environment"`, which opens the device's own
// camera app directly on phone/tablet — where this feature actually matters
// most, same as GoodNotes' own camera button. On desktop, `capture` is
// simply ignored by the browser and it falls back to the normal file
// picker — a graceful degrade, not a broken button; a true live in-app
// desktop webcam capture would need its own getUserMedia-based modal and
// is a bigger separate feature if it's ever wanted beyond this).
//
// Uploads straight to the existing private `workspace-files` Storage
// bucket — same bucket, same `<owner_id>/<uuid>.<ext>` key shape, same
// browser-direct-upload pattern already used for importing a PDF (see
// ImportPdfButton.tsx) — then hands the caller a ready-to-persist
// ImageAnnotationData; it doesn't create the annotation row itself (that's
// the same onCreateAnnotation path every other tool already uses).

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Camera, Upload, Loader2 } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'
import type { ImageAnnotationData } from '@/lib/workspace/types'

const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25MB — a phone photo is a few MB; generous, still bounded
const DEFAULT_WIDTH = 0.35 // normalized fraction of page width for a freshly inserted photo

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ width: 1, height: 1 }) // non-fatal — the image still inserts, just without a known aspect ratio
    }
    img.src = url
  })
}

export default function InsertImageButton({ onInsert }: { onInsert: (data: ImageAnnotationData) => void }) {
  const ui = useWorkspaceUi()
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const handleFile = async (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError(ui.annotate.imageOnly)
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(ui.annotate.fileTooLarge.replace('{max}', String(Math.round(MAX_FILE_BYTES / 1024 / 1024))))
      return
    }

    setBusy(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError(ui.annotate.sessionExpired)
      setBusy(false)
      return
    }

    const dims = await readImageDimensions(file)
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const storageKey = `${user.id}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('workspace-files')
      .upload(storageKey, file, { contentType: file.type || 'image/jpeg', upsert: false })

    setBusy(false)
    if (uploadError) {
      setError(uploadError.message || ui.import.failed)
      return
    }

    onInsert({
      storageKey,
      naturalWidth: dims.width,
      naturalHeight: dims.height,
      x: Math.max(0, 0.5 - DEFAULT_WIDTH / 2),
      y: 0.12,
      width: DEFAULT_WIDTH,
    })
  }

  return (
    <div className="relative" ref={menuRef}>
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      <button
        onClick={() => setMenuOpen((v) => !v)}
        disabled={busy}
        aria-label={ui.annotate.insertImage}
        title={ui.annotate.insertImage}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          menuOpen ? 'bg-[#4F7CFF]/10 text-[#4F7CFF]' : 'text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10'
        } disabled:opacity-50`}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
      </button>

      {menuOpen && (
        <div className="absolute left-0 top-full z-40 mt-1 w-48 rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#171821] shadow-lift p-1">
          <button
            onClick={() => {
              setMenuOpen(false)
              galleryInputRef.current?.click()
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink/70 dark:text-white/70 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
          >
            <Upload size={14} /> {ui.annotate.uploadPhoto}
          </button>
          <button
            onClick={() => {
              setMenuOpen(false)
              cameraInputRef.current?.click()
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink/70 dark:text-white/70 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
          >
            <Camera size={14} /> {ui.annotate.takePhoto}
          </button>
        </div>
      )}

      {error && <p className="absolute left-0 top-full mt-1 w-52 text-[11px] text-red-500 z-40">{error}</p>}
    </div>
  )
}
