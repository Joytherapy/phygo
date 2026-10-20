// "Put in the home programme" from a saved note: the exercises the clinician
// reviewed in the note (AI suggestion, evidence, then their edits) become the
// patient's home programme without being typed again. With no programme in
// use, one is created; with one in use, exercises already in it get the
// note's dose and days, new ones are added, and nothing is removed (an older
// exercise the clinician keeps stays). Row-level security and triggers apply
// as for any write from the programme card.
import type { SupabaseClient } from '@supabase/supabase-js'
import { ITEM_COLUMNS, PROGRAM_COLUMNS, blankDraft, draftFromNoteExercises, isMissingTable, itemRow, localDate, type CareItem, type CareProgram, type DraftItem } from './program'

export type SyncResult =
  | { kind: 'created'; programId: string; added: number }
  | { kind: 'updated'; programId: string; added: number; changed: number }
  | { kind: 'empty' }
  | { kind: 'missing' }
  | { kind: 'error'; where: string; code?: string }

const sameExercise = (item: Pick<CareItem, 'title' | 'exercise_source' | 'exercise_ref'>, d: DraftItem) =>
  (!!d.exercise_ref && d.exercise_source !== 'note' && item.exercise_source === d.exercise_source && item.exercise_ref === d.exercise_ref) ||
  item.title.trim().toLowerCase() === d.title.trim().toLowerCase()

/**
 * What changes for an exercise already in the programme: only what the note
 * states (dose, notes, days). What the note leaves out keeps the value the
 * programme had, so an earlier dose is never wiped by a note without one.
 */
export function doseUpdate(d: DraftItem): Record<string, unknown> {
  const row = itemRow(d, '', 0)
  const out: Record<string, unknown> = {}
  if (row.sets != null || row.reps != null || row.duration_seconds != null) Object.assign(out, { sets: row.sets, reps: row.reps, duration_seconds: row.duration_seconds })
  if (row.dose_notes) out.dose_notes = row.dose_notes
  if (row.weekdays.length > 0) out.weekdays = row.weekdays
  return out
}

export async function syncProgrammeFromNote(
  db: SupabaseClient,
  opts: { patientId: string; noteId: string | null; exercises: unknown; title: string; checkinTitle: string },
): Promise<SyncResult> {
  const drafts = draftFromNoteExercises(opts.exercises, opts.noteId)
  if (drafts.length === 0) return { kind: 'empty' }

  const { data, error } = await db
    .from('care_programs')
    .select(PROGRAM_COLUMNS)
    .eq('patient_id', opts.patientId)
    .in('status', ['active', 'maintenance', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
  if (isMissingTable(error)) return { kind: 'missing' }
  if (error) return { kind: 'error', where: 'load', code: error.code }
  const current = ((data ?? []) as unknown as CareProgram[])[0] ?? null

  if (!current) {
    const { data: created, error: createError } = await db
      .from('care_programs')
      .insert({ patient_id: opts.patientId, status: 'active', source_note_id: opts.noteId, title: opts.title.slice(0, 200), starts_on: localDate(new Date()), rest_weekdays: [] })
      .select(PROGRAM_COLUMNS)
      .single()
    if (createError || !created) return { kind: 'error', where: 'create', code: createError?.code }
    const id = (created as unknown as CareProgram).id
    const rows = drafts.map((d, i) => itemRow(d, id, i))
    rows.push(itemRow({ ...blankDraft(), kind: 'checkin', title: opts.checkinTitle }, id, rows.length))
    const { error: itemsError } = await db.from('care_program_items').insert(rows)
    if (itemsError) {
      // Never leave a programme without its activities.
      await db.from('care_programs').delete().eq('id', id)
      return { kind: 'error', where: 'items', code: itemsError.code }
    }
    return { kind: 'created', programId: id, added: drafts.length }
  }

  const { data: itemsData, error: itemsError } = await db.from('care_program_items').select(ITEM_COLUMNS).eq('program_id', current.id)
  if (itemsError) return { kind: 'error', where: 'items', code: itemsError.code }
  const items = ((itemsData ?? []) as unknown as CareItem[]).filter((i) => i.program_id === current.id && i.kind === 'exercise' && i.active)
  let next = Math.max(-1, ...((itemsData ?? []) as unknown as CareItem[]).map((i) => i.sort_order ?? 0)) + 1
  let added = 0
  let changed = 0
  for (const d of drafts) {
    const existing = items.find((i) => sameExercise(i, d))
    const update = existing ? doseUpdate(d) : null
    if (existing && Object.keys(update!).length === 0) continue
    const res = existing
      ? await db.from('care_program_items').update(update!).eq('id', existing.id)
      : await db.from('care_program_items').insert(itemRow(d, current.id, next++))
    if (res.error) return { kind: 'error', where: existing ? 'update' : 'insert', code: res.error.code }
    if (existing) changed++
    else added++
  }
  if (opts.noteId) await db.from('care_programs').update({ source_note_id: opts.noteId }).eq('id', current.id)
  return { kind: 'updated', programId: current.id, added, changed }
}
