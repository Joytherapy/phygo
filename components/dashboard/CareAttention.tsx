'use client'

// Dashboard: the clinician's patients with a home programme in use, flagged
// ones first. Each line is plain recorded data with a stated definition (see
// lib/care/attention.ts and the "How to read this" list): sessions marked as
// done vs planned in 7 days, the latest check-in, and flags only for the
// thresholds the clinician set. No diagnosis, no interpretation of inactivity.
// Hidden until the care programme tables exist.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Activity, AlertTriangle, ChevronRight, Info } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { lazy } from '@/lib/lazy'
import { CARE_STRINGS } from '@/lib/i18n/careStrings'
import { ITEM_COLUMNS, LOG_COLUMNS, PROGRAM_COLUMNS, addDays, isMissingTable, localDate, type ActivityLog, type CareItem, type CareProgram } from '@/lib/care/program'
import { RULE_COLUMNS, attentionFor, attentionOrder, type Attention, type AttentionRules, type Checkin, type Flag } from '@/lib/care/attention'
import { Avatar, Card } from '@/components/dashboard/HomeCards'

const supabase = lazy(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!))

type Row = { patientId: string; name: string; linked: boolean; program: CareProgram; attention: Attention }

export default function CareAttention({ patients }: { patients: { id: string; name: string; patient_user_id?: string | null }[] | null }) {
  const { lang } = useLanguage()
  const t = (CARE_STRINGS[lang] ?? CARE_STRINGS.it).attention
  const [state, setState] = useState<'loading' | 'hidden' | 'error' | 'ready'>('loading')
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    if (!patients) return
    let cancelled = false
    ;(async () => {
      const ids = patients.map((p) => p.id)
      if (ids.length === 0) return setState('hidden')
      const { data: programsData, error } = await supabase.from('care_programs').select(PROGRAM_COLUMNS).in('patient_id', ids).in('status', ['active', 'maintenance'])
      if (cancelled) return
      if (isMissingTable(error)) return setState('hidden')
      if (error) {
        console.error('care attention: programmes failed:', error.code)
        return setState('error')
      }
      const programs = ((programsData ?? []) as unknown as CareProgram[]).filter((p) => ids.includes(p.patient_id) && (p.status === 'active' || p.status === 'maintenance'))
      if (programs.length === 0) {
        setRows([])
        return setState('ready')
      }
      const today = localDate(new Date())
      const since = addDays(today, -60)
      const pids = programs.map((p) => p.patient_id)
      const [itemsRes, logsRes, checkinsRes, rulesRes] = await Promise.all([
        supabase.from('care_program_items').select(ITEM_COLUMNS).in('program_id', programs.map((p) => p.id)),
        supabase.from('care_activity_logs').select(`patient_id, ${LOG_COLUMNS}`).in('patient_id', pids).gte('activity_date', since),
        supabase.from('symptom_checkins').select('patient_id, checkin_date, pain_nrs, fatigue_nrs').in('patient_id', pids).gte('checkin_date', since),
        supabase.from('care_attention_rules').select(RULE_COLUMNS).in('patient_id', pids),
      ])
      if (cancelled) return
      const failed = itemsRes.error ?? logsRes.error ?? checkinsRes.error ?? rulesRes.error
      if (failed) {
        console.error('care attention: details failed:', failed.code)
        return setState('error')
      }
      const items = (itemsRes.data ?? []) as unknown as CareItem[]
      const logs = ((logsRes.data ?? []) as unknown as (ActivityLog & { patient_id: string })[]).filter((l) => l.activity_date >= since)
      const checkins = ((checkinsRes.data ?? []) as unknown as (Checkin & { patient_id: string })[]).filter((c) => c.checkin_date >= since)
      const rules = (rulesRes.data ?? []) as unknown as (AttentionRules & { patient_id: string })[]
      const built: Row[] = programs.map((program) => {
        const patient = patients.find((p) => p.id === program.patient_id)!
        return {
          patientId: program.patient_id,
          name: patient.name,
          linked: !!patient.patient_user_id,
          program,
          attention: attentionFor(
            program,
            items.filter((i) => i.program_id === program.id),
            logs.filter((l) => l.patient_id === program.patient_id),
            checkins.filter((c) => c.patient_id === program.patient_id),
            rules.find((r) => r.patient_id === program.patient_id) ?? null,
            today,
          ),
        }
      })
      built.sort((a, b) => attentionOrder(a.attention, b.attention))
      setRows(built)
      setState('ready')
    })()
    return () => {
      cancelled = true
    }
  }, [patients])

  if (state === 'hidden' || state === 'loading') return null

  const flagText = (f: Flag) =>
    f.code === 'pain_high' ? t.flags.pain_high(f.value, f.threshold)
      : f.code === 'pain_rise' ? t.flags.pain_rise(f.from, f.to)
      : f.code === 'fatigue_high' ? t.flags.fatigue_high(f.value, f.threshold)
      : t.flags.no_update(f.days)

  return (
    <section className="mt-10" aria-labelledby="care-attention-heading" data-testid="care-attention">
      <div className="mb-4">
        <h2 id="care-attention-heading" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-ink dark:text-white">
          <Activity size={18} className="text-[#7C83FF]" aria-hidden />
          {t.heading}
        </h2>
        <p className="mt-1 text-sm text-ink/55 dark:text-white/45">{t.subtitle}</p>
      </div>

      {state === 'error' && <Card className="p-5"><p role="alert" className="text-sm text-red-600 dark:text-red-400">{t.loadError}</p></Card>}
      {state === 'ready' && rows.length === 0 && <Card className="p-5"><p className="text-sm text-ink/60 dark:text-white/55">{t.empty}</p></Card>}

      {state === 'ready' && rows.length > 0 && (
        <Card className="divide-y divide-black/[0.06] p-0 dark:divide-white/[0.07]">
          <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
            {rows.map((r) => {
              const { week, lastCheckin, flags } = r.attention
              return (
                <li key={r.patientId} data-testid="care-attention-row">
                  <Link href={`/dashboard/patients/${r.patientId}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                    <Avatar name={r.name} linked={r.linked} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink dark:text-white">{r.name}</p>
                      <p className="mt-0.5 text-xs text-ink/55 dark:text-white/45">
                        <span data-testid="care-attention-week">{week.planned ? t.week(week.done, week.planned) : t.weekNone}</span>
                        {' · '}
                        {lastCheckin
                          ? t.lastCheckin(lastCheckin.pain_nrs == null ? '—' : `${lastCheckin.pain_nrs}/10`, lastCheckin.fatigue_nrs == null ? '—' : `${lastCheckin.fatigue_nrs}/10`, lastCheckin.checkin_date.split('-').reverse().slice(0, 2).join('/'))
                          : t.noCheckin}
                        {r.program.status === 'maintenance' && ` · ${t.paused}`}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {flags.length === 0 ? (
                          <span className="text-[11px] text-ink/40 dark:text-white/35">{t.noFlags}</span>
                        ) : (
                          flags.map((f) => (
                            <span key={f.code} data-testid="care-attention-flag" className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                              <AlertTriangle size={11} aria-hidden />
                              {flagText(f)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <span className="sr-only">{t.open}</span>
                    <ChevronRight size={16} className="shrink-0 text-ink/30 dark:text-white/30" aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
          <details className="px-5 py-3.5">
            <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-ink/60 dark:text-white/55"><Info size={13} aria-hidden />{t.howToRead}</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-ink/55 dark:text-white/45">
              {t.definitions.map((d) => <li key={d}>{d}</li>)}
            </ul>
          </details>
        </Card>
      )}
    </section>
  )
}
