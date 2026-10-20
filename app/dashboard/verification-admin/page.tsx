'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAdminStrings } from '@/lib/i18n/adminStrings'
import { localeForLang } from '@/lib/i18n/agendaStrings'

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
  const { lang } = useLanguage()
  const a = useAdminStrings()
  const t = a.verification
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
        if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? a.common.adminOnly : body.error || t.loadError)
        setRows(body.requests ?? [])
      })
      .catch((e) => {
        setRows([])
        setError(e.message)
      })
  }, [tab, a, t])

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
      setError(body.error || t.decisionError)
      return
    }
    // Leave the list only after the server confirmed the decision.
    setRows((prev) => prev.filter((r) => r.id !== userId))
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8] dark:bg-[#050608]">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-4xl px-4 pb-20 pt-28">
        <h1 className="text-2xl font-semibold text-ink dark:text-white">{t.title}</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-white/55">
          {t.intro}
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
              {t.tabs[s]}
            </button>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p>}
        {!error && rows.length === 0 && <p className="mt-6 text-sm text-ink/60 dark:text-white/55">{t.none}</p>}
        <ul className="mt-6 space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
              <p className="font-semibold text-ink dark:text-white">{r.display_name || t.noName}</p>
              <dl className="mt-2 grid grid-cols-[10rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm text-ink/80 dark:text-white/75">
                <dt>{t.country}</dt><dd>{r.registry_country ?? '—'}</dd>
                <dt>{t.register}</dt><dd>{r.registry_name ?? '—'}</dd>
                <dt>{t.number}</dt><dd className="font-mono">{r.registration_number ?? '—'}</dd>
                <dt>{t.role}</dt><dd>{t.stages[r.practice_stage] ?? r.practice_stage}</dd>
                <dt>{t.requested}</dt><dd>{r.verification_requested_at ? new Date(r.verification_requested_at).toLocaleString(localeForLang(lang)) : '—'}</dd>
              </dl>
              {tab !== 'verified' && (
                <>
                  <label className="mt-3 block text-sm text-ink/70 dark:text-white/65">
                    {t.messageLabel}
                    <textarea
                      value={messages[r.id] ?? ''}
                      onChange={(e) => setMessages({ ...messages, [r.id]: e.target.value })}
                      maxLength={500}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button disabled={busy === r.id} onClick={() => decide(r.id, 'verified')} className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60">{a.common.approve}</button>
                    <button disabled={busy === r.id} onClick={() => decide(r.id, 'needs_info')} className="rounded-full border border-amber-500 px-4 py-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300 disabled:opacity-60">{t.askInfo}</button>
                    <button disabled={busy === r.id} onClick={() => decide(r.id, 'rejected')} className="rounded-full border border-red-500 px-4 py-1.5 text-sm font-semibold text-red-700 dark:text-red-300 disabled:opacity-60">{a.common.reject}</button>
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
