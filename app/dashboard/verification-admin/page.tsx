'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useVerificationStrings } from '@/lib/i18n/verificationStrings'

// Internal admin page for reviewing professional verification requests.
// Access is enforced by /api/admin/verification (requireAdmin); this page
// only shows what that API returns. It keeps four things apart: the user's
// declaration, the document received, the administrator's own check on the
// official register, and the final decision. Nothing is checked automatically.

type Review = { id: string; action: string; registry_check: string | null; rejection_category: string | null; internal_note: string | null; reviewer: string; created_at: string }
type EvidenceRequest = {
  id: string
  status: string
  legal_first_name: string
  legal_last_name: string
  registry_country: string
  registry_name: string
  registration_number: string
  has_document: boolean
  document_mime: string | null
  document_size: number | null
  document_deleted_at: string | null
  declaration_version: string
  declaration_accepted_at: string
  submitted_at: string
  registry_check: 'not_checked' | 'match' | 'mismatch' | 'not_found'
  registry_checked_at: string | null
  registry_checked_by: string | null
}
type Row = {
  id: string
  display_name: string | null
  practice_stage: string
  professional_status: string
  verification_requested_at: string | null
  request: EvidenceRequest | null
  history: Review[]
}

const TABS = ['pending', 'needs_info', 'verified', 'rejected'] as const
const CATEGORIES = ['not_in_register', 'data_mismatch', 'document_unreadable', 'document_not_valid', 'other'] as const
const box = 'mt-3 rounded-xl border border-black/10 dark:border-white/10 p-3'
const h3 = 'text-xs font-semibold uppercase tracking-wide text-ink/55 dark:text-white/45'

export default function VerificationAdminPage() {
  const t = useVerificationStrings()
  const [tab, setTab] = useState<(typeof TABS)[number]>('pending')
  const [rows, setRows] = useState<Row[]>([])
  const [register, setRegister] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const load = () => {
    setError(null)
    fetch(`/api/admin/verification?status=${tab}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? t.aAdminRequired : body.error || 'Error')
        setRows(body.requests ?? [])
        setRegister(body.officialRegister ?? '')
      })
      .catch((e) => {
        setRows([])
        setError(e.message)
      })
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [tab])

  async function post(payload: Record<string, unknown>, key: string) {
    setBusy(key)
    setError(null)
    const res = await fetch('/api/admin/verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const body = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) {
      setError(body.error || 'Error')
      return false
    }
    load()
    return true
  }

  async function openDocument(requestId: string) {
    const res = await fetch(`/api/admin/verification/document?requestId=${encodeURIComponent(requestId)}`)
    const body = await res.json().catch(() => ({}))
    if (res.ok && body.url) window.open(body.url, '_blank', 'noopener,noreferrer')
    else setError(body.error || 'Error')
  }

  const checkLabel = (c: string) => (c === 'match' ? t.aMatch : c === 'mismatch' ? t.aMismatch : c === 'not_found' ? t.aNotFound : t.aNotChecked)

  return (
    <div className="min-h-screen bg-[#f6f7f9] dark:bg-[#08090b]">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-4xl px-4 pb-20 pt-28">
        <h1 className="text-2xl font-semibold text-ink dark:text-white">{t.aTitle}</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-white/55">{t.aIntro}</p>
        <div className="mt-6 flex flex-wrap gap-2" role="tablist">
          {TABS.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={tab === s}
              onClick={() => setTab(s)}
              className={`rounded-full px-3 py-1.5 text-sm ${tab === s ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'border border-black/10 dark:border-white/15 text-ink/70 dark:text-white/70'}`}
            >
              {t.status[s]}
            </button>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p>}
        {!error && rows.length === 0 && <p className="mt-6 text-sm text-ink/60 dark:text-white/55">{t.aNoRequests}</p>}
        <ul className="mt-6 space-y-5">
          {rows.map((r) => {
            const q = r.request
            const open = q && ['pending', 'needs_info'].includes(q.status)
            return (
              <li key={r.id} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
                <p className="font-semibold text-ink dark:text-white">{r.display_name || '—'}</p>
                {!q && <p className="mt-2 text-sm text-ink/60 dark:text-white/55">{t.aLegacy}</p>}
                {q && (
                  <>
                    <section className={box} aria-label={t.aDeclaration}>
                      <h3 className={h3}>{t.aDeclaration}</h3>
                      <dl className="mt-2 grid grid-cols-[11rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm text-ink/80 dark:text-white/75">
                        <dt>{t.legalFirstNameLabel}</dt><dd>{q.legal_first_name}</dd>
                        <dt>{t.legalLastNameLabel}</dt><dd>{q.legal_last_name}</dd>
                        <dt>{t.numberLabel}</dt><dd className="font-mono">{q.registration_number}</dd>
                        <dt>{t.orderLabel}</dt><dd>{q.registry_name} ({q.registry_country})</dd>
                        <dt>{t.declarationTitle}</dt><dd>{q.declaration_version} · {new Date(q.declaration_accepted_at).toLocaleString()}</dd>
                      </dl>
                    </section>
                    <section className={box} aria-label={t.aDocument}>
                      <h3 className={h3}>{t.aDocument}</h3>
                      {q.has_document ? (
                        <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink/80 dark:text-white/75">
                          <span>{q.document_mime} · {q.document_size ? Math.ceil(q.document_size / 1024) : 0} KB</span>
                          <button onClick={() => openDocument(q.id)} className="rounded-full border border-[#4F7CFF]/40 px-3 py-1 text-xs font-semibold text-[#4F7CFF]">{t.aOpenDocument}</button>
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-ink/60 dark:text-white/55">{q.document_deleted_at ? t.documentRemoved : t.aNoDocument}</p>
                      )}
                    </section>
                    <section className={box} aria-label={t.aRegistry}>
                      <h3 className={h3}>{t.aRegistry}</h3>
                      <p className="mt-2 text-sm text-ink/80 dark:text-white/75">
                        <strong>{checkLabel(q.registry_check)}</strong>
                        {q.registry_checked_at && ` · ${new Date(q.registry_checked_at).toLocaleString()} · ${q.registry_checked_by ?? ''}`}
                      </p>
                      {open && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {register && (
                            <a href={register} target="_blank" rel="noopener noreferrer" className="rounded-full border border-black/10 dark:border-white/15 px-3 py-1 text-xs font-semibold text-ink/80 dark:text-white/80">{t.aOpenRegister}</a>
                          )}
                          {(['match', 'mismatch', 'not_found'] as const).map((c) => (
                            <button key={c} disabled={busy === q.id} onClick={() => post({ action: 'registry_check', requestId: q.id, result: c, internalNote: notes[r.id] ?? '' }, q.id)} className="rounded-full border border-black/10 dark:border-white/15 px-3 py-1 text-xs font-semibold text-ink/80 dark:text-white/80 disabled:opacity-60">
                              {checkLabel(c)}
                            </button>
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                )}
                <section className={box} aria-label={t.aDecision}>
                  <h3 className={h3}>{t.aDecision}</h3>
                  <p className="mt-2 text-sm text-ink/80 dark:text-white/75">{t.status[r.professional_status as keyof typeof t.status] ?? r.professional_status}</p>
                  <label className="mt-2 block text-sm text-ink/70 dark:text-white/65">
                    {t.aMessage}
                    <textarea value={messages[r.id] ?? ''} onChange={(e) => setMessages({ ...messages, [r.id]: e.target.value })} maxLength={500} rows={2} className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
                  </label>
                  <label className="mt-2 block text-sm text-ink/70 dark:text-white/65">
                    {t.aNote}
                    <textarea value={notes[r.id] ?? ''} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} maxLength={1000} rows={2} className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
                  </label>
                  <label className="mt-2 block text-sm text-ink/70 dark:text-white/65">
                    {t.aCategory}
                    <select value={categories[r.id] ?? ''} onChange={(e) => setCategories({ ...categories, [r.id]: e.target.value })} className="mt-1 block rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
                      <option value="">—</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{t.aCategories[c]}</option>)}
                    </select>
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {open && (
                      <>
                        <button disabled={busy === r.id || q?.registry_check !== 'match' || !q?.has_document} title={q?.registry_check !== 'match' ? t.aIntro : undefined} onClick={() => post({ userId: r.id, decision: 'verified', message: messages[r.id] ?? '', internalNote: notes[r.id] ?? '' }, r.id)} className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40">{t.aApprove}</button>
                        <button disabled={busy === r.id} onClick={() => post({ userId: r.id, decision: 'needs_info', message: messages[r.id] ?? '', internalNote: notes[r.id] ?? '' }, r.id)} className="rounded-full border border-amber-500 px-4 py-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300 disabled:opacity-60">{t.aAskInfo}</button>
                      </>
                    )}
                    {r.professional_status !== 'rejected' && (
                      <button disabled={busy === r.id} onClick={() => post({ userId: r.id, decision: 'rejected', message: messages[r.id] ?? '', rejectionCategory: categories[r.id] || null, internalNote: notes[r.id] ?? '' }, r.id)} className="rounded-full border border-red-500 px-4 py-1.5 text-sm font-semibold text-red-700 dark:text-red-300 disabled:opacity-60">
                        {r.professional_status === 'verified' ? t.aRevoke : t.aReject}
                      </button>
                    )}
                  </div>
                </section>
                {r.history.length > 0 && (
                  <section className={box} aria-label={t.aHistory}>
                    <h3 className={h3}>{t.aHistory}</h3>
                    <ul className="mt-2 space-y-1 text-xs text-ink/70 dark:text-white/65">
                      {r.history.map((h) => (
                        <li key={h.id}>
                          {new Date(h.created_at).toLocaleString()} · {h.reviewer} · {h.action}
                          {h.registry_check && ` (${checkLabel(h.registry_check)})`}
                          {h.rejection_category && ` · ${t.aCategories[h.rejection_category as (typeof CATEGORIES)[number]] ?? h.rejection_category}`}
                          {h.internal_note && ` · ${h.internal_note}`}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
