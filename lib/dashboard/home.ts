// Dashboard home: what the clinician should see first, computed from rows the
// page already reads (appointments, own notes, patients). Pure functions, so
// the rules are the same everywhere and can be tested without a browser.

export type HomeAppointment = {
  id: string
  patient_id: string
  scheduled_at: string
  duration_minutes: number | null
  session_type: 'video' | 'in_person'
  status: 'requested' | 'confirmed' | 'cancelled' | 'completed'
  requested_by: 'physio' | 'patient' | null
  patients?: { name: string } | null
}

export type HomeNote = { patient_id: string; created_at: string }

const DAY = 24 * 60 * 60 * 1000
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const endOf = (a: HomeAppointment) =>
  new Date(new Date(a.scheduled_at).getTime() + (a.duration_minutes || 30) * 60 * 1000)

/** Monday 00:00 to next Monday 00:00 (local time). */
export function weekBounds(now: Date): { start: Date; end: Date } {
  const start = startOfDay(now)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start, end }
}

export const isConfirmed = (a: HomeAppointment) => a.status === 'confirmed'
export const isToday = (a: HomeAppointment, now: Date) =>
  startOfDay(new Date(a.scheduled_at)).getTime() === startOfDay(now).getTime()

/**
 * The confirmed appointment that is in progress now, or else the next one to
 * start (today or later). null when nothing is scheduled.
 */
export function nextAppointment(rows: HomeAppointment[], now: Date): { appointment: HomeAppointment; inProgress: boolean } | null {
  const upcoming = rows
    .filter((a) => isConfirmed(a) && endOf(a) > now)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
  const first = upcoming[0]
  if (!first) return null
  return { appointment: first, inProgress: new Date(first.scheduled_at) <= now }
}

/** Today's other confirmed appointments still to come after `next`. */
export function laterToday(rows: HomeAppointment[], now: Date, nextId: string | null): HomeAppointment[] {
  return rows
    .filter((a) => isConfirmed(a) && isToday(a, now) && a.id !== nextId && new Date(a.scheduled_at) > now)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
}

/** Requests a patient sent for a time that has not passed yet, soonest first. */
export function pendingRequests(rows: HomeAppointment[], now: Date): HomeAppointment[] {
  return rows
    .filter((a) => a.status === 'requested' && a.requested_by === 'patient' && new Date(a.scheduled_at) > now)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
}

/** Most recent note date per patient. */
export function lastNoteByPatient(notes: HomeNote[]): Map<string, Date> {
  const last = new Map<string, Date>()
  for (const n of notes) {
    const d = new Date(n.created_at)
    const prev = last.get(n.patient_id)
    if (!prev || d > prev) last.set(n.patient_id, d)
  }
  return last
}

/** First upcoming confirmed appointment per patient. */
export function nextByPatient(rows: HomeAppointment[], now: Date): Map<string, Date> {
  const next = new Map<string, Date>()
  for (const a of rows) {
    if (!isConfirmed(a) || endOf(a) <= now) continue
    const d = new Date(a.scheduled_at)
    const prev = next.get(a.patient_id)
    if (!prev || d < prev) next.set(a.patient_id, d)
  }
  return next
}

/** Whole days between two dates, by calendar day. */
export const daysBetween = (from: Date, to: Date) =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY)

/**
 * Patients to get back to: last session more than `days` days ago and nothing
 * booked. Longest gap first, at most `limit`.
 */
export function followUps(
  patientIds: string[],
  lastNote: Map<string, Date>,
  next: Map<string, Date>,
  now: Date,
  days = 30,
  limit = 3,
): { patientId: string; days: number }[] {
  return patientIds
    .filter((id) => lastNote.has(id) && !next.has(id))
    .map((id) => ({ patientId: id, days: daysBetween(lastNote.get(id)!, now) }))
    .filter((f) => f.days > days)
    .sort((a, b) => b.days - a.days)
    .slice(0, limit)
}

/** Notes per week for the last `weeks` weeks (oldest first), for a sparkline. */
export function notesPerWeek(notes: HomeNote[], now: Date, weeks = 8): number[] {
  const { start } = weekBounds(now)
  const counts = new Array(weeks).fill(0)
  for (const n of notes) {
    const d = new Date(n.created_at)
    const weeksAgo = d >= start ? 0 : Math.floor((start.getTime() - startOfDay(d).getTime() - 1) / (7 * DAY)) + 1
    const idx = weeks - 1 - weeksAgo
    if (idx >= 0 && idx < weeks) counts[idx]++
  }
  return counts
}

/** Confirmed appointments per day of the current week (Monday first). */
export function appointmentsPerWeekday(rows: HomeAppointment[], now: Date): number[] {
  const { start, end } = weekBounds(now)
  const counts = new Array(7).fill(0)
  for (const a of rows) {
    const d = new Date(a.scheduled_at)
    if (!isConfirmed(a) || d < start || d >= end) continue
    counts[(d.getDay() + 6) % 7]++
  }
  return counts
}
