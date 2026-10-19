'use client'

// Session notes across all patients (the dashboard's "Notes this month"
// figure opens here): the clinician's own notes, newest first, with the
// patient, the date and a short excerpt. A note opens the patient's record,
// where the full note history lives. Read-only: nothing is changed here.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, ArrowRight, FileText, NotebookPen, Search } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { Avatar, Card, InlineError } from '@/components/dashboard/HomeCards'
import { PageBackdrop, PageEyebrow, PAGE_BG, CHIP, INPUT_FOCUS, PRIMARY_BTN, HUE } from '@/components/ui/premium'
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext'
import { useHomeUi } from '@/lib/i18n/homeStrings'
import { useDashboardUi } from '@/lib/i18n/dashboardStrings'
import { lazy } from '@/lib/lazy'

const supabase = lazy(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!))

type Range = 'month' | '3m' | 'all'
type NoteRow = { id: string; patient_id: string; created_at: string; assessment: string | null; plan: string | null; summary_for_patient: string | null }
type PatientRow = { id: string; name: string; patient_user_id: string | null }

const ROW_CAP = 500
const LOCALE: Record<string, string> = { it: 'it-IT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR' }

function rangeStart(range: Range, now: Date): Date | null {
  if (range === 'all') return null
  if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  return new Date(now.getFullYear(), now.getMonth() - 2, 1)
}

export default function SessionNotesPage() {
  const h = useHomeUi()
  const t = useDashboardUi()
  const ui = useUiStrings()
  const { lang } = useLanguage()
  const [range, setRange] = useState<Range>('month')
  const [query, setQuery] = useState('')
  const [notes, setNotes] = useState<NoteRow[] | null>(null)
  const [patients, setPatients] = useState<Map<string, PatientRow>>(new Map())
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    // The list stays on screen while another period loads (no flash of
    // placeholders); the period filter below also applies to it meanwhile.
    const load = async () => {
      setFailed(false)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        let q = supabase
          .from('notes')
          .select('id, patient_id, created_at, assessment, plan, summary_for_patient')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(ROW_CAP)
        const start = rangeStart(range, new Date())
        if (start) q = q.gte('created_at', start.toISOString())
        const { data, error } = await q
        if (error) throw error
        const rows = (data ?? []) as NoteRow[]
        const ids = Array.from(new Set(rows.map((n) => n.patient_id)))
        const byId = new Map<string, PatientRow>()
        if (ids.length) {
          const { data: ps, error: pErr } = await supabase.from('patients').select('id, name, patient_user_id').in('id', ids)
          if (pErr) throw pErr
          for (const p of (ps ?? []) as PatientRow[]) byId.set(p.id, p)
        }
        if (cancelled) return
        setPatients(byId)
        setNotes(rows)
      } catch (err) {
        console.error('Session notes could not be loaded:', err)
        if (!cancelled) setFailed(true)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [range, reload])

  const visible = useMemo(() => {
    if (!notes) return null
    const start = rangeStart(range, new Date())
    const q = query.trim().toLowerCase()
    return notes.filter((n) => {
      if (start && new Date(n.created_at) < start) return false
      if (!q) return true
      return (patients.get(n.patient_id)?.name ?? '').toLowerCase().includes(q)
    })
  }, [notes, patients, range, query])

  const dateFmt = new Intl.DateTimeFormat(LOCALE[lang] ?? 'it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
  const ranges: [Range, string][] = [['month', h.notesRangeMonth], ['3m', h.notesRange3m], ['all', h.notesRangeAll]]

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors ${PAGE_BG}`}>
      <Navbar />
      <PageBackdrop />
      <main id="main-content" className="relative mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
        <Link
          href="/dashboard"
          className="-ml-2 mb-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-2 text-sm text-ink/60 transition-colors hover:text-ink dark:text-white/50 dark:hover:text-white"
        >
          <ArrowLeft size={15} aria-hidden />
          {ui.common.backToPatients}
        </Link>

        <div className="mb-7">
          <PageEyebrow icon={NotebookPen}>{h.patientsHeading}</PageEyebrow>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-[-0.035em] text-ink dark:text-white sm:text-[40px] sm:leading-[1.1]">{h.notesTitle}</h1>
          <p className="mt-2 max-w-xl text-[15px] text-ink/60 dark:text-white/55">{h.notesSubtitle}</p>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" className="inline-flex w-fit rounded-full border border-black/[0.08] bg-black/[0.02] p-1 dark:border-white/10 dark:bg-white/[0.03]">
            {ranges.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={range === key}
                onClick={() => setRange(key)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  range === key ? PRIMARY_BTN : 'text-ink/60 hover:text-ink dark:text-white/55 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">{h.notesSearch}</span>
            <Search size={14} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 dark:text-white/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={h.notesSearch}
              className={`w-full rounded-full border border-black/[0.08] bg-white/80 py-2.5 pl-9 pr-4 text-sm text-ink outline-none transition placeholder:text-ink/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/35 ${INPUT_FOCUS}`}
            />
          </label>
        </div>

        {failed ? (
          <InlineError message={h.notesLoadError} retry={t.common.retry} onRetry={() => setReload((r) => r + 1)} />
        ) : visible === null ? (
          <div role="status" className="space-y-3" aria-label={ui.common.loading}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-[24px] bg-black/[0.04] dark:bg-white/[0.05]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${HUE.mint.tile}`}>
              <FileText size={20} aria-hidden />
            </span>
            <p className="font-display text-lg font-semibold text-ink dark:text-white">{query.trim() ? h.notesNoMatch : h.notesEmptyTitle}</p>
            {!query.trim() && <p className="max-w-md text-sm text-ink/55 dark:text-white/50">{h.notesEmptyBody}</p>}
          </Card>
        ) : (
          <>
            <p className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${CHIP}`}>{h.notesCount(visible.length)}</p>
            <ul className="space-y-3" data-testid="notes-list">
              {visible.map((n) => {
                const p = patients.get(n.patient_id)
                const text = n.assessment || n.plan || n.summary_for_patient
                return (
                  <li key={n.id}>
                    <Link href={`/dashboard/patients/${n.patient_id}`} className="group block rounded-[24px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B95FF]/30">
                      <Card className="flex items-center gap-4 p-4 transition-colors group-hover:border-black/15 sm:p-5 dark:group-hover:border-white/20">
                        <Avatar name={p?.name ?? '—'} linked={!!p?.patient_user_id} size={44} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                            <p className="truncate font-semibold text-ink dark:text-white">{p?.name ?? '—'}</p>
                            <p className="text-xs text-ink/50 dark:text-white/45">{dateFmt.format(new Date(n.created_at))}</p>
                          </div>
                          <p className={`mt-1 line-clamp-2 text-sm ${text ? 'text-ink/65 dark:text-white/60' : 'italic text-ink/40 dark:text-white/35'}`}>{text || h.notesNoText}</p>
                        </div>
                        <ArrowRight size={16} aria-hidden className="shrink-0 text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-ink dark:text-white/30 dark:group-hover:text-white" />
                      </Card>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </main>
    </div>
  )
}
