// Care programme (sql/2026-10-20_care_program_PROPOSED.sql, docs/engagement/data-model.md):
// the plain logic shared by the clinician's programme card and the patient's
// Daily Quest. What may be recorded is decided again by the database: these
// helpers only decide what to show.

export type ProgramStatus = 'active' | 'paused' | 'maintenance' | 'completed'
export type ItemKind = 'exercise' | 'checkin' | 'education'
export type LogStatus = 'done' | 'partial' | 'skipped'
export type Provenance = 'patient_reported' | 'camera_estimated' | 'device_measured' | 'clinician_entered'

export type ShortVariant = { instructions?: string | null; sets?: number | null; reps?: number | null; duration_seconds?: number | null }

export type CareProgram = {
  id: string
  patient_id: string
  title: string
  status: ProgramStatus
  starts_on: string // YYYY-MM-DD
  ends_on: string | null
  rest_weekdays: number[] // ISO 1 (Mon) .. 7 (Sun)
  source_note_id?: string | null
}

export type CareItem = {
  id: string
  program_id: string
  kind: ItemKind
  title: string
  instructions: string | null
  exercise_source: string | null
  exercise_ref: string | null
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  dose_notes: string | null
  weekdays: number[]
  times_per_day: number
  short_variant: ShortVariant | null
  education_url: string | null
  sort_order: number
  active: boolean
}

export type ActivityLog = {
  id?: string
  item_id: string
  activity_date: string
  slot: number
  status: LogStatus
  variant: 'standard' | 'short'
  provenance: Provenance
}

export type SymptomCheckin = { checkin_date: string; pain_nrs: number | null; fatigue_nrs: number | null; note: string | null }

export const PROGRAM_COLUMNS = 'id, patient_id, title, status, starts_on, ends_on, rest_weekdays, source_note_id'
export const ITEM_COLUMNS =
  'id, program_id, kind, title, instructions, exercise_source, exercise_ref, sets, reps, duration_seconds, dose_notes, weekdays, times_per_day, short_variant, education_url, sort_order, active'
export const LOG_COLUMNS = 'id, item_id, activity_date, slot, status, variant, provenance'

/** The table is not there yet (SQL not applied): the feature stays hidden. */
export function isMissingTable(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  return error.code === 'PGRST205' || error.code === '42P01' || /could not find the table|does not exist/i.test(error.message ?? '')
}

/** YYYY-MM-DD of a date in the browser's own time zone (the patient's day). */
export function localDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** ISO weekday (1 = Monday .. 7 = Sunday) of a YYYY-MM-DD date. */
export function isoWeekday(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return day === 0 ? 7 : day
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + days))
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`
}

export type DayPlan =
  | { kind: 'none' } // no programme in use
  | { kind: 'paused' }
  | { kind: 'outside' } // before the start or after the end
  | { kind: 'rest' }
  | { kind: 'day'; tasks: Task[]; checkin: boolean; education: CareItem[] }

export type Task = { item: CareItem; slot: number; log: ActivityLog | null }

/** What the programme asks for on one day. Exercises become one task per
 *  prescribed session (times_per_day); check-ins and education are listed
 *  apart. Never more than prescribed. */
export function planForDay(program: CareProgram | null, items: CareItem[], logs: ActivityLog[], date: string): DayPlan {
  if (!program || program.status === 'completed') return { kind: 'none' }
  if (program.status === 'paused') return { kind: 'paused' }
  if (date < program.starts_on || (program.ends_on && date > program.ends_on)) return { kind: 'outside' }
  const dow = isoWeekday(date)
  if (program.rest_weekdays.includes(dow)) return { kind: 'rest' }
  const today = items
    .filter((i) => i.active && (i.weekdays.length === 0 || i.weekdays.includes(dow)))
    .sort((a, b) => a.sort_order - b.sort_order)
  const tasks: Task[] = []
  for (const item of today.filter((i) => i.kind === 'exercise')) {
    for (let slot = 1; slot <= Math.max(1, item.times_per_day); slot++) {
      const log =
        logs.find((l) => l.item_id === item.id && l.activity_date === date && l.slot === slot && l.provenance === 'patient_reported') ??
        logs.find((l) => l.item_id === item.id && l.activity_date === date && l.slot === slot) ??
        null
      tasks.push({ item, slot, log })
    }
  }
  return { kind: 'day', tasks, checkin: today.some((i) => i.kind === 'checkin'), education: today.filter((i) => i.kind === 'education') }
}

/** Done and partial count as recorded; skipped is recorded but not done. */
export function progress(tasks: Task[]): { done: number; total: number } {
  return { done: tasks.filter((t) => t.log && t.log.status !== 'skipped').length, total: tasks.length }
}

/** Planned vs recorded over a period (adherence as the patient reports it):
 *  every scheduled session of every day counts once. */
export function adherence(program: CareProgram | null, items: CareItem[], logs: ActivityLog[], from: string, to: string) {
  let planned = 0
  let done = 0
  let skipped = 0
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const plan = planForDay(program, items, logs, d)
    if (plan.kind !== 'day') continue
    planned += plan.tasks.length
    done += plan.tasks.filter((t) => t.log && t.log.status !== 'skipped').length
    skipped += plan.tasks.filter((t) => t.log?.status === 'skipped').length
  }
  return { planned, done, skipped, unrecorded: planned - done - skipped }
}

export type DraftItem = {
  kind: ItemKind
  title: string
  instructions: string
  exercise_source: string | null
  exercise_ref: string | null
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  dose_notes: string
  times_per_day: number
  short_sets: number | null
  short_reps: number | null
  short_instructions: string
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const int = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null)

/** A starting point from the note's exercises, for the clinician to review:
 *  the prescribed dose is copied as written, nothing is added. */
export function draftFromNoteExercises(exercises: unknown, noteId: string | null): DraftItem[] {
  if (!Array.isArray(exercises)) return []
  return exercises.flatMap((ex, index): DraftItem[] => {
    const base = { kind: 'exercise' as const, times_per_day: 1, short_sets: null, short_reps: null, short_instructions: '' }
    if (typeof ex === 'string') {
      const title = ex.trim()
      return title ? [{ ...base, title: title.slice(0, 200), instructions: '', exercise_source: noteId ? 'note' : null, exercise_ref: noteId ? `${noteId}#${index}` : null, sets: null, reps: null, duration_seconds: null, dose_notes: '' }] : []
    }
    if (!ex || typeof ex !== 'object') return []
    const e = ex as Record<string, any>
    const title = str(e.name)
    if (!title) return []
    const dosing = e.dosing && typeof e.dosing === 'object' ? e.dosing : {}
    const steps = Array.isArray(e.instructions) ? e.instructions.filter((s: unknown) => typeof s === 'string' && s.trim()).join('\n') : ''
    const provider = str(e.provider)
    const providerId = e.provider_id == null ? '' : String(e.provider_id)
    return [{
      ...base,
      title: title.slice(0, 200),
      instructions: (steps || str(e.description)).slice(0, 4000),
      exercise_source: provider && providerId ? provider : noteId ? 'note' : null,
      exercise_ref: provider && providerId ? providerId : noteId ? `${noteId}#${index}` : null,
      sets: int(dosing.sets, 1, 20),
      reps: int(dosing.reps, 1, 200),
      duration_seconds: int(dosing.duration_seconds, 1, 14400),
      dose_notes: str(dosing.notes).slice(0, 500),
    }]
  })
}

export function blankDraft(): DraftItem {
  return { kind: 'exercise', title: '', instructions: '', exercise_source: null, exercise_ref: null, sets: null, reps: null, duration_seconds: null, dose_notes: '', times_per_day: 1, short_sets: null, short_reps: null, short_instructions: '' }
}

/** The row to insert for a draft item; the short variant only if the clinician wrote one. */
export function itemRow(d: DraftItem, programId: string, sortOrder: number) {
  const hasShort = d.short_sets != null || d.short_reps != null || d.short_instructions.trim() !== ''
  return {
    program_id: programId,
    kind: d.kind,
    title: d.title.trim().slice(0, 200),
    instructions: d.instructions.trim() || null,
    exercise_source: d.exercise_source,
    exercise_ref: d.exercise_ref,
    sets: d.kind === 'exercise' ? d.sets : null,
    reps: d.kind === 'exercise' ? d.reps : null,
    duration_seconds: d.kind === 'exercise' ? d.duration_seconds : null,
    dose_notes: d.dose_notes.trim() || null,
    times_per_day: d.kind === 'exercise' ? Math.min(6, Math.max(1, d.times_per_day)) : 1,
    short_variant: d.kind === 'exercise' && hasShort ? { sets: d.short_sets, reps: d.short_reps, instructions: d.short_instructions.trim() || null } : null,
    weekdays: [] as number[],
    sort_order: sortOrder,
    active: true,
  }
}

/** "3 × 10", "2 × 30 s", "20 min": the dose as prescribed, or null when none was given. */
export function doseLabel(x: { sets?: number | null; reps?: number | null; duration_seconds?: number | null }): string | null {
  const secs = x.duration_seconds
  const time = secs == null ? null : secs >= 60 && secs % 60 === 0 ? `${secs / 60} min` : `${secs} s`
  const per = x.reps != null ? String(x.reps) : time
  if (x.sets != null && per) return `${x.sets} × ${per}`
  if (x.sets != null) return `${x.sets} ×`
  return per
}
