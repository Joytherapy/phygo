'use client'

// "Home programme" on the patient page: the programme the patient finds every
// day in My Phygo (Daily Quest). Only the clinician writes it; it starts from
// the latest note's exercises, copied as prescribed, and the clinician decides
// rest days, sessions per day and an optional short variant. Row-level
// security and triggers enforce the same rules (sql/2026-10-20_care_program_PROPOSED.sql);
// until that SQL is applied the tables do not exist and this card stays hidden.
import { useCallback, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CalendarCheck, Pause, Play, Flag, Plus, Trash2, Pencil, Leaf } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { lazy } from '@/lib/lazy'
import { CARE_STRINGS } from '@/lib/i18n/careStrings'
import {
  ITEM_COLUMNS,
  LOG_COLUMNS,
  PROGRAM_COLUMNS,
  addDays,
  adherence,
  blankDraft,
  doseLabel,
  draftFromNoteExercises,
  isMissingTable,
  itemRow,
  localDate,
  type ActivityLog,
  type CareItem,
  type CareProgram,
  type DraftItem,
  type ProgramStatus,
} from '@/lib/care/program'
import { PRIMARY_BTN, SECONDARY_BTN } from '@/components/ui/premium'

const supabase = lazy(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!))

const card = 'rounded-[24px] border border-black/[0.06] bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_44px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.055] dark:to-white/[0.018] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-6 sm:p-7'
const inputCls = 'w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] px-3.5 py-2.5 text-sm text-ink dark:text-white placeholder:text-ink/30 dark:placeholder:text-white/25 focus:outline-none focus:border-[#7C83FF]/60 focus:ring-2 focus:ring-[#7C83FF]/15 disabled:opacity-50'
const labelCls = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink/50 dark:text-white/40'

type EditorItem = DraftItem & { id?: string }
type Draft = { title: string; starts_on: string; rest_weekdays: number[]; items: EditorItem[]; checkin: boolean; source_note_id: string | null }

const numOrNull = (v: string, max: number) => {
  const n = Number(v)
  return v.trim() === '' || !Number.isInteger(n) || n < 1 ? null : Math.min(n, max)
}

export default function CareProgramCard({ patientId, locked }: { patientId: string; locked: boolean }) {
  const { lang } = useLanguage()
  const t = (CARE_STRINGS[lang] ?? CARE_STRINGS.it).clinician
  const [state, setState] = useState<'loading' | 'missing' | 'error' | 'ready'>('loading')
  const [program, setProgram] = useState<CareProgram | null>(null)
  const [items, setItems] = useState<CareItem[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [lastCheckin, setLastCheckin] = useState<{ checkin_date: string; pain_nrs: number | null; fatigue_nrs: number | null } | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    setState('loading')
    const { data, error } = await supabase
      .from('care_programs')
      .select(PROGRAM_COLUMNS)
      .eq('patient_id', patientId)
      .in('status', ['active', 'maintenance', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
    if (isMissingTable(error)) return setState('missing')
    if (error) {
      console.error('care programme: load failed:', error.code)
      return setState('error')
    }
    const current = ((data ?? []) as unknown as CareProgram[])[0] ?? null
    setProgram(current)
    if (current) {
      const since = addDays(localDate(new Date()), -6)
      const [itemsRes, logsRes, checkinRes] = await Promise.all([
        supabase.from('care_program_items').select(ITEM_COLUMNS).eq('program_id', current.id).order('sort_order'),
        supabase.from('care_activity_logs').select(LOG_COLUMNS).eq('patient_id', patientId).gte('activity_date', since),
        supabase.from('symptom_checkins').select('checkin_date, pain_nrs, fatigue_nrs').eq('patient_id', patientId).order('checkin_date', { ascending: false }).limit(1),
      ])
      if (itemsRes.error || logsRes.error) {
        console.error('care programme: details failed:', itemsRes.error?.code ?? logsRes.error?.code)
        return setState('error')
      }
      setItems((itemsRes.data ?? []) as unknown as CareItem[])
      setLogs(((logsRes.data ?? []) as unknown as ActivityLog[]).filter((l) => l.activity_date >= since))
      setLastCheckin(((checkinRes.data ?? []) as any[])[0] ?? null)
    } else {
      setItems([])
      setLogs([])
      setLastCheckin(null)
    }
    setState('ready')
  }, [patientId])

  useEffect(() => {
    load()
  }, [load])

  if (state === 'missing') return null

  const startFromNote = async () => {
    setMessage(null)
    const { data } = await supabase.from('notes').select('id, exercises, created_at').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(1)
    const note = ((data ?? []) as any[])[0] ?? null
    const fromNote = draftFromNoteExercises(note?.exercises, note?.id ?? null)
    setNotice(fromNote.length ? null : t.noExercisesInNote)
    setDraft({ title: t.defaultTitle, starts_on: localDate(new Date()), rest_weekdays: [], items: fromNote.length ? fromNote : [blankDraft()], checkin: true, source_note_id: note?.id ?? null })
  }

  const startBlank = () => {
    setMessage(null)
    setNotice(null)
    setDraft({ title: t.defaultTitle, starts_on: localDate(new Date()), rest_weekdays: [], items: [blankDraft()], checkin: true, source_note_id: null })
  }

  const startEdit = () => {
    if (!program) return
    setMessage(null)
    setNotice(null)
    const exercises = items.filter((i) => i.active && i.kind === 'exercise')
    setDraft({
      title: program.title,
      starts_on: program.starts_on,
      rest_weekdays: program.rest_weekdays,
      checkin: items.some((i) => i.active && i.kind === 'checkin'),
      source_note_id: program.source_note_id ?? null,
      items: exercises.map((i) => ({
        id: i.id,
        kind: 'exercise',
        title: i.title,
        instructions: i.instructions ?? '',
        exercise_source: i.exercise_source,
        exercise_ref: i.exercise_ref,
        sets: i.sets,
        reps: i.reps,
        duration_seconds: i.duration_seconds,
        dose_notes: i.dose_notes ?? '',
        times_per_day: i.times_per_day,
        short_sets: i.short_variant?.sets ?? null,
        short_reps: i.short_variant?.reps ?? null,
        short_instructions: i.short_variant?.instructions ?? '',
      })),
    })
  }

  const setItem = (index: number, patch: Partial<EditorItem>) =>
    setDraft((d) => (d ? { ...d, items: d.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) } : d))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft || locked) return
    if (draft.items.some((i) => !i.title.trim())) return setMessage({ kind: 'error', text: t.needName })
    setSaving(true)
    setMessage(null)
    const fail = (where: string, error: { code?: string } | null) => {
      console.error(`care programme: ${where} failed:`, error?.code)
      setSaving(false)
      setMessage({ kind: 'error', text: t.saveError })
    }
    const fields = { title: draft.title.trim().slice(0, 200) || t.defaultTitle, starts_on: draft.starts_on, rest_weekdays: draft.rest_weekdays }

    if (!program) {
      const { data: created, error } = await supabase
        .from('care_programs')
        .insert({ patient_id: patientId, status: 'active', source_note_id: draft.source_note_id, ...fields })
        .select(PROGRAM_COLUMNS)
        .single()
      if (error || !created) return fail('create', error)
      const rows = draft.items.map((d, i) => itemRow(d, (created as any).id, i))
      if (draft.checkin) rows.push({ ...itemRow({ ...blankDraft(), kind: 'checkin', title: t.checkinsOn }, (created as any).id, rows.length) })
      const { error: itemsError } = await supabase.from('care_program_items').insert(rows)
      if (itemsError) {
        // Never leave a programme without its activities.
        await supabase.from('care_programs').delete().eq('id', (created as any).id)
        return fail('items', itemsError)
      }
    } else {
      const { error } = await supabase.from('care_programs').update(fields).eq('id', program.id)
      if (error) return fail('update', error)
      const keptIds = new Set(draft.items.filter((i) => i.id).map((i) => i.id))
      for (const [i, d] of draft.items.entries()) {
        const row = itemRow(d, program.id, i)
        const res = d.id ? await supabase.from('care_program_items').update(row).eq('id', d.id) : await supabase.from('care_program_items').insert(row)
        if (res.error) return fail('item', res.error)
      }
      // Removed exercises are switched off, never deleted: their history stays.
      for (const old of items.filter((i) => i.kind === 'exercise' && i.active && !keptIds.has(i.id))) {
        const res = await supabase.from('care_program_items').update({ active: false }).eq('id', old.id)
        if (res.error) return fail('deactivate', res.error)
      }
      const checkin = items.find((i) => i.kind === 'checkin')
      if (checkin && checkin.active !== draft.checkin) {
        const res = await supabase.from('care_program_items').update({ active: draft.checkin }).eq('id', checkin.id)
        if (res.error) return fail('checkin', res.error)
      } else if (!checkin && draft.checkin) {
        const res = await supabase.from('care_program_items').insert(itemRow({ ...blankDraft(), kind: 'checkin', title: t.checkinsOn }, program.id, draft.items.length))
        if (res.error) return fail('checkin', res.error)
      }
    }
    setSaving(false)
    setDraft(null)
    setMessage({ kind: 'ok', text: t.saved })
    load()
  }

  const setStatus = async (status: ProgramStatus) => {
    if (!program || locked) return
    const { error } = await supabase.from('care_programs').update({ status }).eq('id', program.id)
    if (error) {
      console.error('care programme: status failed:', error.code)
      return setMessage({ kind: 'error', text: t.saveError })
    }
    load()
  }

  const today = localDate(new Date())
  const week = adherence(program, items, logs, addDays(today, -6), today)
  const exercises = items.filter((i) => i.active && i.kind === 'exercise')
  const checkinOn = items.some((i) => i.active && i.kind === 'checkin')

  return (
    <section className={`mb-8 ${card}`} data-testid="care-program-card" aria-labelledby="care-program-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C83FF] to-[#A78BFA] text-white">
            <CalendarCheck size={18} aria-hidden />
          </div>
          <div>
            <h2 id="care-program-heading" className="font-display text-lg font-semibold text-ink dark:text-white">{t.heading}</h2>
            <p className="text-xs text-ink/55 dark:text-white/45">{t.subtitle}</p>
          </div>
        </div>
        {program && !draft && (
          <span data-testid="care-program-status" className="rounded-full bg-black/[0.04] px-3 py-1 text-xs font-semibold text-ink/70 dark:bg-white/[0.06] dark:text-white/70">
            {t.status[program.status]}
          </span>
        )}
      </div>

      {state === 'loading' && <p className="mt-5 text-sm text-ink/50 dark:text-white/40">…</p>}
      {state === 'error' && (
        <p className="mt-5 text-sm text-red-600 dark:text-red-400">
          {t.loadError}{' '}
          <button type="button" onClick={load} className="font-semibold underline">{t.retry}</button>
        </p>
      )}

      {state === 'ready' && !program && !draft && (
        <div className="mt-5">
          <p className="text-sm text-ink/60 dark:text-white/55">{t.empty}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={locked} onClick={startFromNote} className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-50 ${PRIMARY_BTN}`}>
              <CalendarCheck size={15} aria-hidden /> {t.createFromNote}
            </button>
            <button type="button" disabled={locked} onClick={startBlank} className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-50 ${SECONDARY_BTN}`}>
              {t.createBlank}
            </button>
          </div>
        </div>
      )}

      {state === 'ready' && program && !draft && (
        <div className="mt-5 space-y-4">
          <p className="font-semibold text-ink dark:text-white">{program.title}</p>
          <ul className="space-y-2" data-testid="care-program-items">
            {exercises.map((i) => (
              <li key={i.id} className="rounded-xl border border-black/[0.06] px-4 py-3 text-sm dark:border-white/[0.08]">
                <span className="font-medium text-ink dark:text-white">{i.title}</span>
                <span className="text-ink/55 dark:text-white/45"> · {doseLabel(i) ?? t.noDose} · {t.sessionsPerDay(i.times_per_day)}</span>
                {i.short_variant && <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400"><Leaf size={12} aria-hidden />{t.shortAvailable}</span>}
              </li>
            ))}
          </ul>
          {program.rest_weekdays.length > 0 && (
            <p className="text-xs text-ink/55 dark:text-white/45">{t.restDays}: {program.rest_weekdays.map((d) => t.weekdays[d - 1]).join(', ')}</p>
          )}
          {checkinOn && <p className="text-xs text-ink/55 dark:text-white/45">{t.checkinsOn}</p>}
          <div className="rounded-xl bg-black/[0.03] px-4 py-3 dark:bg-white/[0.04]">
            <p data-testid="care-program-week" className="text-sm font-semibold text-ink dark:text-white">{week.planned ? t.last7(week.done, week.planned) : t.last7None}</p>
            <p className="mt-0.5 text-xs text-ink/50 dark:text-white/40">{t.selfReported}</p>
            {lastCheckin && (
              <p className="mt-1.5 text-xs text-ink/65 dark:text-white/55">
                {t.lastCheckin(lastCheckin.pain_nrs == null ? '—' : `${lastCheckin.pain_nrs}/10`, lastCheckin.fatigue_nrs == null ? '—' : `${lastCheckin.fatigue_nrs}/10`, lastCheckin.checkin_date.split('-').reverse().join('/'))}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={locked} onClick={startEdit} className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold disabled:opacity-50 ${SECONDARY_BTN}`}><Pencil size={14} aria-hidden />{t.edit}</button>
            {program.status === 'paused' ? (
              <button type="button" disabled={locked} onClick={() => setStatus('active')} className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold disabled:opacity-50 ${SECONDARY_BTN}`}><Play size={14} aria-hidden />{t.resume}</button>
            ) : (
              <button type="button" disabled={locked} onClick={() => setStatus('paused')} className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold disabled:opacity-50 ${SECONDARY_BTN}`}><Pause size={14} aria-hidden />{t.pause}</button>
            )}
            {program.status === 'active' && (
              <button type="button" disabled={locked} onClick={() => setStatus('maintenance')} className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold disabled:opacity-50 ${SECONDARY_BTN}`}>{t.toMaintenance}</button>
            )}
            <button type="button" disabled={locked} onClick={() => setStatus('completed')} className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold disabled:opacity-50 ${SECONDARY_BTN}`}><Flag size={14} aria-hidden />{t.complete}</button>
          </div>
        </div>
      )}

      {draft && (
        <form onSubmit={save} className="mt-5 space-y-5" data-testid="care-program-editor">
          {notice && <p className="rounded-xl bg-amber-500/10 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">{notice}</p>}
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <label>
              <span className={labelCls}>{t.titleLabel}</span>
              <input className={inputCls} value={draft.title} maxLength={200} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>
            <label>
              <span className={labelCls}>{t.startLabel}</span>
              <input type="date" className={inputCls} value={draft.starts_on} onChange={(e) => setDraft({ ...draft, starts_on: e.target.value || localDate(new Date()) })} />
            </label>
          </div>
          <fieldset>
            <legend className={labelCls}>{t.restDays}</legend>
            <div className="flex flex-wrap gap-1.5">
              {t.weekdays.map((label, i) => {
                const day = i + 1
                const on = draft.rest_weekdays.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDraft({ ...draft, rest_weekdays: on ? draft.rest_weekdays.filter((d) => d !== day) : draft.rest_weekdays.length < 6 ? [...draft.rest_weekdays, day].sort() : draft.rest_weekdays })}
                    className={`min-h-[36px] min-w-[48px] rounded-full px-3 text-xs font-semibold transition ${on ? PRIMARY_BTN : SECONDARY_BTN}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-xs text-ink/50 dark:text-white/40">{t.restHint}</p>
          </fieldset>

          <div className="space-y-4">
            {draft.items.map((it, index) => (
              <fieldset key={index} className="rounded-2xl border border-black/[0.07] p-4 dark:border-white/[0.08]" data-testid="care-program-draft-item">
                <div className="flex items-center justify-between gap-2">
                  <legend className="text-sm font-bold text-ink dark:text-white">{t.exerciseN(index + 1)}</legend>
                  {draft.items.length > 1 && (
                    <button type="button" onClick={() => setDraft({ ...draft, items: draft.items.filter((_, i) => i !== index) })} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                      <Trash2 size={13} aria-hidden />{t.remove}
                    </button>
                  )}
                </div>
                <div className="mt-3 grid gap-3">
                  <label>
                    <span className={labelCls}>{t.name}</span>
                    <input className={inputCls} value={it.title} maxLength={200} onChange={(e) => setItem(index, { title: e.target.value })} />
                  </label>
                  <label>
                    <span className={labelCls}>{t.instructions}</span>
                    <textarea className={`${inputCls} resize-y`} rows={2} maxLength={4000} value={it.instructions} onChange={(e) => setItem(index, { instructions: e.target.value })} />
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <label><span className={labelCls}>{t.sets}</span><input inputMode="numeric" className={inputCls} value={it.sets ?? ''} onChange={(e) => setItem(index, { sets: numOrNull(e.target.value, 20) })} /></label>
                    <label><span className={labelCls}>{t.reps}</span><input inputMode="numeric" className={inputCls} value={it.reps ?? ''} onChange={(e) => setItem(index, { reps: numOrNull(e.target.value, 200) })} /></label>
                    <label><span className={labelCls}>{t.duration}</span><input inputMode="numeric" className={inputCls} value={it.duration_seconds ?? ''} onChange={(e) => setItem(index, { duration_seconds: numOrNull(e.target.value, 14400) })} /></label>
                    <label>
                      <span className={labelCls}>{t.timesPerDay}</span>
                      <select className={inputCls} value={it.times_per_day} onChange={(e) => setItem(index, { times_per_day: Number(e.target.value) })}>
                        {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                  </div>
                  <label>
                    <span className={labelCls}>{t.doseNotes}</span>
                    <input className={inputCls} maxLength={500} value={it.dose_notes} onChange={(e) => setItem(index, { dose_notes: e.target.value })} />
                  </label>
                  <details className="rounded-xl bg-black/[0.02] px-3 py-2 dark:bg-white/[0.03]" open={it.short_sets != null || it.short_reps != null || !!it.short_instructions}>
                    <summary className="cursor-pointer text-xs font-semibold text-ink/70 dark:text-white/65">{t.shortVariant}</summary>
                    <p className="mt-1.5 text-xs text-ink/50 dark:text-white/40">{t.shortHint}</p>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <label><span className={labelCls}>{t.sets}</span><input aria-label={`${t.shortVariant} ${t.sets}`} inputMode="numeric" className={inputCls} value={it.short_sets ?? ''} onChange={(e) => setItem(index, { short_sets: numOrNull(e.target.value, 20) })} /></label>
                      <label><span className={labelCls}>{t.reps}</span><input aria-label={`${t.shortVariant} ${t.reps}`} inputMode="numeric" className={inputCls} value={it.short_reps ?? ''} onChange={(e) => setItem(index, { short_reps: numOrNull(e.target.value, 200) })} /></label>
                    </div>
                    <label className="mt-2 block"><span className={labelCls}>{t.instructions}</span><input className={inputCls} maxLength={500} value={it.short_instructions} onChange={(e) => setItem(index, { short_instructions: e.target.value })} /></label>
                  </details>
                </div>
              </fieldset>
            ))}
            <button type="button" onClick={() => setDraft({ ...draft, items: [...draft.items, blankDraft()] })} className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${SECONDARY_BTN}`}>
              <Plus size={14} aria-hidden />{t.addExercise}
            </button>
          </div>

          <label className="flex items-start gap-2.5 text-sm text-ink/80 dark:text-white/75">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#7C83FF]" checked={draft.checkin} onChange={(e) => setDraft({ ...draft, checkin: e.target.checked })} />
            {t.dailyCheckin}
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={saving || locked} className={`inline-flex min-h-[42px] items-center rounded-full px-5 text-sm font-semibold disabled:opacity-50 ${PRIMARY_BTN}`}>{saving ? t.saving : t.save}</button>
            <button type="button" onClick={() => { setDraft(null); setMessage(null) }} className={`inline-flex min-h-[42px] items-center rounded-full px-5 text-sm font-semibold ${SECONDARY_BTN}`}>{t.cancel}</button>
          </div>
        </form>
      )}

      {message && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={`mt-4 text-sm ${message.kind === 'error' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {message.text}
        </p>
      )}
    </section>
  )
}
