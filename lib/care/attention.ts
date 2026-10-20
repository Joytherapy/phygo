// What the clinician's attention view shows for one patient with a home
// programme. Every indicator is a plain fact with a fixed definition, computed
// only from recorded data; thresholds come from the clinician
// (care_attention_rules) and with no threshold there is no flag. Nothing here
// is a clinical judgement: inactivity is reported as "no update", never as a
// worsening, and adherence is what the patient reported.
import { addDays, adherence, type ActivityLog, type CareItem, type CareProgram } from './program'

export type AttentionRules = {
  pain_at_or_above: number | null
  pain_rise_points: number | null
  fatigue_at_or_above: number | null
  no_update_days: number | null
}

export type Checkin = { checkin_date: string; pain_nrs: number | null; fatigue_nrs: number | null }

export type Flag =
  // Latest check-in of the last 7 days: pain at or above the clinician's threshold.
  | { code: 'pain_high'; value: number; threshold: number; date: string }
  // Latest pain of the last 7 days minus the first pain recorded since the programme started.
  | { code: 'pain_rise'; from: number; to: number; points: number }
  // Latest check-in of the last 7 days: fatigue at or above the clinician's threshold.
  | { code: 'fatigue_high'; value: number; threshold: number; date: string }
  // The N days before today had scheduled sessions and not a single record.
  | { code: 'no_update'; days: number }

export type Attention = {
  week: { planned: number; done: number; skipped: number; unrecorded: number }
  lastCheckin: Checkin | null
  flags: Flag[]
}

export const RULE_COLUMNS = 'patient_id, pain_at_or_above, pain_rise_points, fatigue_at_or_above, no_update_days'

export function attentionFor(
  program: CareProgram,
  items: CareItem[],
  logs: ActivityLog[],
  checkins: Checkin[],
  rules: AttentionRules | null,
  today: string,
): Attention {
  const week = adherence(program, items, logs, addDays(today, -6), today)
  const sorted = [...checkins].sort((a, b) => (a.checkin_date < b.checkin_date ? -1 : 1))
  const lastCheckin = sorted.length ? sorted[sorted.length - 1] : null
  const recent = lastCheckin && lastCheckin.checkin_date >= addDays(today, -6) ? lastCheckin : null
  const flags: Flag[] = []

  if (rules?.pain_at_or_above != null && recent?.pain_nrs != null && recent.pain_nrs >= rules.pain_at_or_above) {
    flags.push({ code: 'pain_high', value: recent.pain_nrs, threshold: rules.pain_at_or_above, date: recent.checkin_date })
  }
  if (rules?.pain_rise_points != null && recent?.pain_nrs != null) {
    const first = sorted.find((c) => c.checkin_date >= program.starts_on && c.pain_nrs != null && c.checkin_date < recent.checkin_date)
    if (first && recent.pain_nrs - (first.pain_nrs as number) >= rules.pain_rise_points) {
      flags.push({ code: 'pain_rise', from: first.pain_nrs as number, to: recent.pain_nrs, points: rules.pain_rise_points })
    }
  }
  if (rules?.fatigue_at_or_above != null && recent?.fatigue_nrs != null && recent.fatigue_nrs >= rules.fatigue_at_or_above) {
    flags.push({ code: 'fatigue_high', value: recent.fatigue_nrs, threshold: rules.fatigue_at_or_above, date: recent.checkin_date })
  }
  if (rules?.no_update_days != null && program.status === 'active') {
    const from = addDays(today, -rules.no_update_days)
    const to = addDays(today, -1)
    const window = adherence(program, items, logs, from, to)
    const anyRecord = logs.some((l) => l.activity_date >= from && l.activity_date <= to)
    if (window.planned > 0 && !anyRecord) flags.push({ code: 'no_update', days: rules.no_update_days })
  }
  return { week, lastCheckin, flags }
}

/** Patients with a flag first, then the lowest share of sessions marked as done. */
export function attentionOrder(a: Attention, b: Attention): number {
  if (a.flags.length !== b.flags.length) return b.flags.length - a.flags.length
  const share = (x: Attention) => (x.week.planned ? x.week.done / x.week.planned : 1)
  return share(a) - share(b)
}
