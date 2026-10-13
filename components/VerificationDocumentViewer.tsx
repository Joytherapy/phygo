'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { useVerificationStrings } from '@/lib/i18n/verificationStrings'

// Shows a professional verification document inside the page. The file is
// fetched from our own server route (which checks permissions and answers
// with no-store headers), kept only in memory as a blob, and released when
// the viewer closes. No Storage URL or token is ever involved.

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png']

export function useVerificationDocumentViewer() {
  const t = useVerificationStrings()
  const [doc, setDoc] = useState<{ url: string; type: string } | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const current = useRef<string | null>(null)
  // The download in progress: cancelled by close (also on unmount) or by a
  // newer open, so a late response never creates a blob nobody releases.
  const pending = useRef<AbortController | null>(null)

  const close = useCallback(() => {
    pending.current?.abort()
    pending.current = null
    if (current.current) URL.revokeObjectURL(current.current)
    current.current = null
    setDoc(null)
    setState('idle')
  }, [])

  useEffect(() => close, [close])
  useEffect(() => {
    if (!doc) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doc, close])

  const open = useCallback(
    async (endpoint: string) => {
      pending.current?.abort()
      const request = new AbortController()
      pending.current = request
      setState('loading')
      try {
        const res = await fetch(endpoint, { cache: 'no-store', credentials: 'same-origin', signal: request.signal })
        const type = (res.headers.get('content-type') ?? '').split(';')[0].trim()
        if (!res.ok || !ALLOWED.includes(type)) throw new Error(String(res.status))
        const bytes = await res.arrayBuffer()
        if (request.signal.aborted) return
        pending.current = null
        const blob = new Blob([bytes], { type })
        if (current.current) URL.revokeObjectURL(current.current)
        current.current = URL.createObjectURL(blob)
        setDoc({ url: current.current, type })
        setState('idle')
      } catch {
        if (!request.signal.aborted) setState('error')
      }
    },
    [],
  )

  const viewer = (
    <>
      {state === 'loading' && <Loader2 size={14} className="inline animate-spin text-ink/50" aria-label={t.documentLoading} />}
      {state === 'error' && <span role="alert" className="text-xs text-red-600 dark:text-red-300">{t.documentOpenFailed}</span>}
      {doc && (
        <div role="dialog" aria-modal="true" aria-label={t.viewDocument} className="fixed inset-0 z-[100] flex flex-col bg-black/70 p-4 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-end pb-2">
            <button type="button" onClick={close} autoFocus className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-ink">
              <X size={14} aria-hidden />
              {t.closeDocument}
            </button>
          </div>
          <div className="mx-auto w-full max-w-4xl flex-1 overflow-hidden rounded-xl bg-white">
            {doc.type === 'application/pdf' ? (
              <iframe src={doc.url} title={t.viewDocument} className="h-full w-full" referrerPolicy="no-referrer" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doc.url} alt={t.viewDocument} className="h-full w-full object-contain" />
            )}
          </div>
        </div>
      )}
    </>
  )

  return { open, viewer, loading: state === 'loading' }
}
