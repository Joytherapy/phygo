'use client'

// My Phygo "Today" (Daily Quest): what the clinician's programme asks for
// today, the dose as prescribed, and a way to record honestly what was done.
// Nothing is assigned or changed here: rest days show no activity, "Low energy
// today" shows a short version only where the clinician prepared one, and a
// recorded tick is the patient's own report (provenance 'patient_reported').
// The database refuses anything the programme does not allow
// (sql/2026-10-20_care_program_PROPOSED.sql). Until that SQL is applied the
// tables do not exist and this section is not shown.
import { useCallback, useEffect, useState } from 'react'
import { BatteryLow, Check, CheckCircle2, ExternalLink, Moon, Sun } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { CARE_STRINGS } from '@/lib/i18n/careStrings'
import { myPhygoSupabase as supabase } from '@/components/myPhygo/MyProfileContext'
import {
  ITEM_COLUMNS,
  LOG_COLUMNS,
  PROGRAM_COLUMNS,
  doseLabel,
  isMissingTable,
  localDate,
  planForDay,
  progress,
  type ActivityLog,
  type CareItem,
  type CareProgram,
  type LogStatus,
  type Task,
} from '@/lib/care/program'
import { PRIMARY_BTN, SECONDARY_BTN } from '@/components/ui/premium'

const card = 'rounded-2xl border border-black/[0.06] bg-white/90 p-5 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035]'

export default function DailyQuest({ patientId }: { patientId: string }) {
  const { lang } = useLanguage()
  const t = (CARE_STRINGS[lang] ?? CARE_STRINGS.it).patient
  const [state, setState] = useState<'loading' | 'hidden' | 'ready'>('loading')
  const [program, setProgram] = useState<CareProgram | null>(null)
  const [items, setItems] = useState<CareItem[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [lowEnergy, setLowEnergy] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const today = localDate(new Date())

  const load = useCallback(async () => {
    const { data, error: programError } = await supabase
      .from('care_programs')
      .select(PROGRAM_COLUMNS)
      .eq('patient_id', patientId)
      .in('status', ['active', 'maintenance', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
    if (isMissingTable(programError) || programError) {
      if (programError && !isMissingTable(programError)) console.error('daily quest: load failed:', programError.code)
      return setState('hidden')
    }
    const current = ((data ?? []) as unknown as CareProgram[])[0] ?? null
    if (!current) return setState('hidden')
    const [itemsRes, logsRes] = await Promise.all([
      supabase.from('care_program_items').select(ITEM_COLUMNS).eq('program_id', current.id).order('sort_order'),
      supabase.from('care_activity_logs').select(LOG_COLUMNS).eq('patient_id', patientId).eq('activity_date', today),
    ])
    if (itemsRes.error || logsRes.error) {
      console.error('daily quest: details failed:', itemsRes.error?.code ?? logsRes.error?.code)
      return setState('hidden')
    }
    setProgram(current)
    setItems((itemsRes.data ?? []) as unknown as CareItem[])
    setLogs(((logsRes.data ?? []) as unknown as ActivityLog[]).filter((l) => l.activity_date === today))
    setState('ready')
  }, [patientId, today])

  useEffect(() => {
    load()
  }, [load])

  if (state !== 'ready' || !program) return null

  const plan = planForDay(program, items, logs, today)
  const showShort = (task: Task) => lowEnergy && !!task.item.short_variant

  const record = async (task: Task, status: LogStatus) => {
    const key = `${task.item.id}:${task.slot}`
    setBusy(key)
    setError(null)
    const row = {
      patient_id: patientId,
      item_id: task.item.id,
      activity_date: today,
      slot: task.slot,
      status,
      variant: showShort(task) && status !== 'skipped' ? 'short' : 'standard',
      provenance: 'patient_reported',
    }
    // One record per activity, day and session: a repeated tap updates it.
    const { data, error: saveError } = await supabase
      .from('care_activity_logs')
      .upsert(row, { onConflict: 'item_id,activity_date,slot,provenance' })
      .select(LOG_COLUMNS)
      .single()
    setBusy(null)
    if (saveError || !data) {
      console.error('daily quest: record failed:', saveError?.code)
      return setError(key)
    }
    setEditing(null)
    setLogs((prev) => [...prev.filter((l) => !(l.item_id === task.item.id && l.slot === task.slot && l.provenance === 'patient_reported')), data as unknown as ActivityLog])
  }

  const header = (count?: { done: number; total: number }) => (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink dark:text-white">
          <Sun size={17} className="text-[#7C83FF]" aria-hidden />
          {t.heading}
        </h2>
        <p className="text-xs text-ink/55 dark:text-white/45">{t.subtitle}</p>
      </div>
      {count && count.total > 0 && (
        <span data-testid="daily-quest-progress" className="rounded-full bg-[#7C83FF]/10 px-3 py-1 text-sm font-semibold tabular-nums text-[#5B63E6] dark:text-[#A5B4FF]">
          {t.progress(count.done, count.total)}
        </span>
      )}
    </div>
  )

  if (plan.kind === 'rest' || plan.kind === 'paused' || plan.kind === 'outside' || plan.kind === 'none') {
    const text = plan.kind === 'rest' ? t.rest : plan.kind === 'paused' ? t.paused : t.outside
    return (
      <section className={`${card} mb-8`} data-testid="daily-quest">
        {header()}
        <p className="flex items-center gap-2 text-sm text-ink/70 dark:text-white/65" data-testid="daily-quest-message">
          <Moon size={15} className="shrink-0 text-ink/40 dark:text-white/40" aria-hidden />
          {text}
        </p>
      </section>
    )
  }

  const count = progress(plan.tasks)

  return (
    <section className={`${card} mb-8`} data-testid="daily-quest" aria-label={t.heading}>
      {header(count)}
      {plan.tasks.length === 0 && !plan.checkin && <p className="text-sm text-ink/60 dark:text-white/55">{t.nothing}</p>}

      {plan.tasks.length > 0 && (
        <label className="mb-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-black/[0.03] px-3.5 py-2.5 text-sm text-ink/80 dark:bg-white/[0.04] dark:text-white/75">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#7C83FF]" checked={lowEnergy} onChange={(e) => setLowEnergy(e.target.checked)} />
          <span>
            <span className="inline-flex items-center gap-1.5 font-semibold"><BatteryLow size={14} aria-hidden />{t.lowEnergy}</span>
            <span className="mt-0.5 block text-xs text-ink/55 dark:text-white/45">{t.lowEnergyHint}</span>
          </span>
        </label>
      )}

      <ul className="space-y-3">
        {plan.tasks.map((task) => {
          const key = `${task.item.id}:${task.slot}`
          const short = showShort(task)
          const dose = short ? doseLabel(task.item.short_variant ?? {}) : doseLabel(task.item)
          const instructions = short ? task.item.short_variant?.instructions || task.item.instructions : task.item.instructions
          const recorded = task.log && editing !== key
          return (
            <li key={key} data-testid="daily-quest-task" className="rounded-xl border border-black/[0.06] p-4 dark:border-white/[0.08]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink dark:text-white">{task.item.title}</p>
                  <p className="mt-0.5 text-sm text-ink/60 dark:text-white/55">
                    {short && <span className="mr-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">{t.shortDose}</span>}
                    {[dose, task.item.times_per_day > 1 ? t.session(task.slot) : null].filter(Boolean).join(' · ')}
                  </p>
                  {instructions && <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-ink/55 dark:text-white/45">{instructions}</p>}
                  {task.item.dose_notes && <p className="mt-1 text-xs text-ink/50 dark:text-white/40">{task.item.dose_notes}</p>}
                  {lowEnergy && !task.item.short_variant && !recorded && <p data-testid="daily-quest-no-short" className="mt-2 text-xs text-amber-700 dark:text-amber-300">{t.noShort}</p>}
                </div>
              </div>
              {recorded ? (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span data-testid="daily-quest-recorded" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={15} aria-hidden />
                    {t.recorded[task.log!.status]}
                  </span>
                  <button type="button" onClick={() => setEditing(key)} className="text-xs font-semibold text-ink/55 underline dark:text-white/50">{t.change}</button>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                  {(['done', 'partial', 'skipped'] as LogStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={busy === key}
                      onClick={() => record(task, status)}
                      className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition disabled:opacity-50 sm:px-4 ${status === 'done' ? PRIMARY_BTN : SECONDARY_BTN}`}
                    >
                      {status === 'done' && <Check size={14} aria-hidden />}
                      {t.status[status]}
                    </button>
                  ))}
                </div>
              )}
              {error === key && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{t.saveError}</p>}
            </li>
          )
        })}
      </ul>

      {plan.tasks.length > 0 && count.done === count.total && <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">{t.allDone}</p>}
      {plan.tasks.length > 0 && <p className="mt-4 text-xs text-ink/45 dark:text-white/40">{t.honest}</p>}

      {plan.education.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/40">{t.education}</p>
          <ul className="space-y-2">
            {plan.education.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink dark:text-white">{e.title}</span>
                {e.education_url && (
                  <a href={e.education_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B63E6] dark:text-[#A5B4FF]">
                    {t.open}<ExternalLink size={12} aria-hidden />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.checkin && <SymptomCheckin patientId={patientId} date={today} />}
    </section>
  )
}

function Scale({ label, anchors, value, onChange, testId }: { label: string; anchors: [string, string]; value: number | null; onChange: (v: number) => void; testId: string }) {
  return (
    <fieldset className="mt-3" data-testid={testId}>
      <legend className="text-sm font-semibold text-ink dark:text-white">{label}{value != null && <span className="ml-1.5 tabular-nums text-[#5B63E6] dark:text-[#A5B4FF]">{value}/10</span>}</legend>
      <div className="mt-2 grid grid-cols-11 gap-1">
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            aria-label={`${label} ${n}`}
            onClick={() => onChange(n)}
            className={`h-9 rounded-lg text-sm font-semibold tabular-nums transition ${value === n ? PRIMARY_BTN : 'bg-black/[0.04] text-ink/70 hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/[0.1]'}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between gap-2 text-[11px] text-ink/45 dark:text-white/40">
        <span>{anchors[0]}</span>
        <span className="text-right">{anchors[1]}</span>
      </div>
    </fieldset>
  )
}

function SymptomCheckin({ patientId, date }: { patientId: string; date: string }) {
  const { lang } = useLanguage()
  const t = (CARE_STRINGS[lang] ?? CARE_STRINGS.it).patient
  const [pain, setPain] = useState<number | null>(null)
  const [fatigue, setFatigue] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    supabase
      .from('symptom_checkins')
      .select('checkin_date, pain_nrs, fatigue_nrs, note')
      .eq('patient_id', patientId)
      .eq('checkin_date', date)
      .then(({ data }) => {
        const row = ((data ?? []) as any[]).find((r) => r.checkin_date === date)
        if (row) {
          setPain(row.pain_nrs)
          setFatigue(row.fatigue_nrs)
          setNote(row.note ?? '')
        }
      })
  }, [patientId, date])

  const save = async () => {
    if (pain == null && fatigue == null) return
    setStatus('saving')
    const { error } = await supabase
      .from('symptom_checkins')
      .upsert({ patient_id: patientId, checkin_date: date, pain_nrs: pain, fatigue_nrs: fatigue, note: note.trim().slice(0, 280) || null }, { onConflict: 'patient_id,checkin_date' })
    if (error) {
      console.error('check-in: save failed:', error.code)
      return setStatus('error')
    }
    setStatus('saved')
  }

  return (
    <div className="mt-6 border-t border-black/[0.06] pt-5 dark:border-white/[0.08]" data-testid="symptom-checkin">
      <p className="font-semibold text-ink dark:text-white">{t.checkinTitle}</p>
      <Scale label={t.pain} anchors={t.painAnchors} value={pain} onChange={(v) => { setPain(v); setStatus('idle') }} testId="checkin-pain" />
      <Scale label={t.fatigue} anchors={t.fatigueAnchors} value={fatigue} onChange={(v) => { setFatigue(v); setStatus('idle') }} testId="checkin-fatigue" />
      <label className="mt-3 block">
        <span className="mb-1 block text-xs text-ink/55 dark:text-white/45">{t.note}</span>
        <input value={note} maxLength={280} onChange={(e) => { setNote(e.target.value); setStatus('idle') }} className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-[#7C83FF]/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" disabled={(pain == null && fatigue == null) || status === 'saving'} onClick={save} className={`inline-flex min-h-[40px] items-center rounded-full px-5 text-sm font-semibold disabled:opacity-50 ${PRIMARY_BTN}`}>
          {t.saveCheckin}
        </button>
        {status === 'saved' && <span role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t.checkinSaved}</span>}
        {status === 'error' && <span role="alert" className="text-sm text-red-600 dark:text-red-400">{t.saveError}</span>}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink/50 dark:text-white/40">{t.checkinHint}</p>
    </div>
  )
}
