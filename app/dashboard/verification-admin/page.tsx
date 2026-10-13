'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

// Internal admin page for reviewing professional verification requests.
// Access is enforced by /api/admin/verification (requireAdmin); this page
// only shows what that API returns. Check each registration number by hand
// against the official public register of the stated country before
// approving: PHYGO has no automatic registry integration.

type Request = {
  id: string
  display_name: string | null
  practice_stage: string
  professional_status: string
  registry_country: string | null
  registry_name: string | null
  registration_number: string | null
  verification_requested_at: string | null
  verification_message: string | null
}

const TABS = ['pending', 'needs_info', 'verified', 'rejected'] as const

export default function VerificationAdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('pending')
  const [rows, setRows] = useState<Request[]>([])
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    fetch(`/api/admin/verification?status=${tab}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? 'Admin access required.' : body.error || 'Could not load requests.')
        setRows(body.requests ?? [])
      })
      .catch((e) => {
        setRows([])
        setError(e.message)
      })
  }, [tab])

  async function decide(userId: string, decision: 'verified' | 'rejected' | 'needs_info') {
    setBusy(userId)
    setError(null)
    const res = await fetch('/api/admin/verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, decision, message: messages[userId] ?? '' }),
    })
    const body = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) {
      setError(body.error || 'Decision not saved.')
      return
    }
    // Leave the list only after the server confirmed the decision.
    setRows((prev) => prev.filter((r) => r.id !== userId))
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] dark:bg-[#08090b]">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-4xl px-4 pb-20 pt-28">
        <h1 className="text-2xl font-semibold text-ink dark:text-white">Professional verification requests</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-white/55">
          Check each number against the official public register of the stated country. Rejections and requests for
          more information need a message for the user.
        </p>
        <div className="mt-6 flex flex-wrap gap-2" role="tablist">
          {TABS.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={tab === s}
              onClick={() => setTab(s)}
              className={`rounded-full px-3 py-1.5 text-sm ${tab === s ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'border border-black/10 dark:border-white/15 text-ink/70 dark:text-white/70'}`}
            >
              {s}
            </button>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p>}
        {!error && rows.length === 0 && <p className="mt-6 text-sm text-ink/60 dark:text-white/55">No requests.</p>}
        <ul className="mt-6 space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
              <p className="font-semibold text-ink dark:text-white">{r.display_name || 'No display name'}</p>
              <dl className="mt-2 grid grid-cols-[10rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm text-ink/80 dark:text-white/75">
                <dt>Country</dt><dd>{r.registry_country ?? '—'}</dd>
                <dt>Register</dt><dd>{r.registry_name ?? '—'}</dd>
                <dt>Number</dt><dd className="font-mono">{r.registration_number ?? '—'}</dd>
                <dt>Declared role</dt><dd>{r.practice_stage}</dd>
                <dt>Requested</dt><dd>{r.verification_requested_at ? new Date(r.verification_requested_at).toLocaleString() : '—'}</dd>
              </dl>
              {tab !== 'verified' && (
                <>
                  <label className="mt-3 block text-sm text-ink/70 dark:text-white/65">
                    Message to the user (required to reject or ask for information)
                    <textarea
                      value={messages[r.id] ?? ''}
                      onChange={(e) => setMessages({ ...messages, [r.id]: e.target.value })}
                      maxLength={500}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button disabled={busy === r.id} onClick={() => decide(r.id, 'verified')} className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60">Approve</button>
                    <button disabled={busy === r.id} onClick={() => decide(r.id, 'needs_info')} className="rounded-full border border-amber-500 px-4 py-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300 disabled:opacity-60">Ask for information</button>
                    <button disabled={busy === r.id} onClick={() => decide(r.id, 'rejected')} className="rounded-full border border-red-500 px-4 py-1.5 text-sm font-semibold text-red-700 dark:text-red-300 disabled:opacity-60">Reject</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
