// The patient booklet, built from the note the clinician has just reviewed:
// what we saw today (the patient summary), the recovery path (the rehab
// phases of the protocol, with "you are here" where the clinician says so),
// the exercises with images, dose and days, the evidence the programme rests
// on, and when to get in touch. Subjective, objective, assessment and
// clinical reasoning never go in it; nor do the protocol's red-flag lists,
// which are written for clinicians.
import type jsPDF from 'jspdf'
import { doseLabel, weekdaysForFrequency } from './program'
import { LAYOUT, PatientPdf, fmtDate, pdfText, type PrintExercise } from './programPdf'
import type { CareDict } from '@/lib/i18n/careStrings'

export type BookletPhase = { number: number; name: string; duration: string | null; goals: string | null; progressWhen: string | null }
export type BookletPaper = { title: string; journal: string | null; year: string | null; strength: string | null; why: string | null }
export type BookletSections = { summary: boolean; path: boolean; exercises: boolean; evidence: boolean }

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** The note's rehab phases as the booklet prints them. */
export function bookletPhases(phases: unknown): BookletPhase[] {
  if (!Array.isArray(phases)) return []
  return phases
    .filter((p) => p && typeof p === 'object' && s(p.phase_name))
    .map((p) => ({ number: Number(p.phase_number) || 0, name: s(p.phase_name), duration: s(p.typical_duration) || null, goals: s(p.phase_goals) || null, progressWhen: s(p.criteria_to_progress) || null }))
    .sort((a, b) => a.number - b.number)
}

/** The papers shown in the note's evidence block, as references. */
export function bookletPapers(papers: unknown): BookletPaper[] {
  if (!Array.isArray(papers)) return []
  return papers
    .filter((p) => p && typeof p === 'object' && s(p.title))
    .slice(0, 5)
    .map((p) => ({ title: s(p.title), journal: s(p.journal) || null, year: s(p.publication_date).slice(0, 4) || null, strength: s(p.evidence_strength) || null, why: s(p.why_it_matters) || null }))
}

/** The note's reviewed exercises as printed: dose and days as the clinician left them. */
export function bookletExercises(entries: unknown, t: Pick<CareDict['plan'], 'pdfTimesPerDay' | 'everyDay'>, weekdayNames: string[], images: Map<string, string>): PrintExercise[] {
  if (!Array.isArray(entries)) return []
  return entries.flatMap((e, i): PrintExercise[] => {
    if (typeof e === 'string') return s(e) ? [{ title: s(e), summary: t.everyDay, steps: '', notes: '', short: null }] : []
    if (!e || typeof e !== 'object' || !s(e.name)) return []
    const dosing = e.dosing && typeof e.dosing === 'object' ? e.dosing : {}
    const days = weekdaysForFrequency(Number.isInteger(dosing.frequency_per_week) ? dosing.frequency_per_week : null)
    const steps = Array.isArray(e.instructions) ? e.instructions.map(s).filter(Boolean).map((x: string, n: number) => `${n + 1}. ${x}`).join('\n') : s(e.description)
    return [{
      title: s(e.name),
      summary: [doseLabel(dosing), days.length ? days.map((d) => weekdayNames[d - 1]).join(', ') : t.everyDay].filter(Boolean).join(' · '),
      steps,
      notes: s(dosing.notes),
      short: null,
      image: images.get(String(e.internal_id ?? i)),
    }]
  })
}

export function buildPatientBooklet(opts: {
  patientName: string
  date: string
  summary: string
  phases: BookletPhase[]
  currentPhase: number | null
  exercises: PrintExercise[]
  papers: BookletPaper[]
  guideline: { name: string; source: string; date: string | null } | null
  sections: BookletSections
  appUrl: string
  t: CareDict['booklet']
  plan: CareDict['plan']
}): jsPDF {
  const { t } = opts
  const { M, W, INK, MUTED, ACCENT, ACCENT_TEXT } = LAYOUT
  const pdf = new PatientPdf()
  const d = pdf.doc
  pdf.header(t.title, [opts.patientName ? opts.plan.pdfFor(opts.patientName) : null, fmtDate(opts.date)].filter(Boolean).join('  ·  '))
  let n = 0

  if (opts.sections.summary && opts.summary.trim()) {
    pdf.section(++n, t.summary)
    pdf.paragraph(opts.summary)
  }

  if (opts.sections.path && opts.phases.length) {
    pdf.section(++n, t.path)
    for (const phase of opts.phases) {
      const here = opts.currentPhase === phase.number
      d.setFontSize(10)
      const width = W - 2 * M - 14
      const body = [
        phase.goals ? `${t.goals}: ${phase.goals}` : null,
        phase.progressWhen ? `${t.progressWhen}: ${phase.progressWhen}` : null,
      ].filter(Boolean).flatMap((x) => d.splitTextToSize(pdfText(x as string), width) as string[])
      const h = 10 + body.length * LAYOUT.LINE + 2
      pdf.ensure(h + 4)
      const y = pdf.y
      d.setDrawColor(here ? ACCENT[0] : 225, here ? ACCENT[1] : 227, here ? ACCENT[2] : 240)
      d.setFillColor(here ? 240 : 250, here ? 241 : 250, 255)
      d.setLineWidth(here ? 0.6 : 0.2)
      d.roundedRect(M - 3, y - 5, W - 2 * M + 6, h, 3, 3, 'FD')
      d.setLineWidth(0.2)
      d.setFillColor(...ACCENT)
      d.circle(M + 3, y - 0.6, 3.6, 'F')
      d.setTextColor(255, 255, 255)
      d.setFont('helvetica', 'bold')
      d.setFontSize(10)
      d.text(String(phase.number || ''), M + 3, y + 1, { align: 'center' })
      d.setTextColor(...INK)
      d.setFontSize(11.5)
      d.text(pdfText(phase.name), M + 10, y + 0.6, { maxWidth: W - 2 * M - 50 })
      d.setFont('helvetica', 'normal')
      d.setFontSize(9.5)
      d.setTextColor(...MUTED)
      if (here) {
        d.setFont('helvetica', 'bold')
        d.setTextColor(...ACCENT_TEXT)
        d.text(pdfText(t.youAreHere), W - M, y + 0.6, { align: 'right' })
        d.setFont('helvetica', 'normal')
      } else if (phase.duration) {
        d.text(pdfText(phase.duration), W - M, y + 0.6, { align: 'right', maxWidth: 45 })
      }
      d.setTextColor(60, 60, 75)
      d.setFontSize(10)
      let ty = y + 6.5
      for (const line of body) {
        d.text(line, M + 10, ty)
        ty += LAYOUT.LINE
      }
      d.setTextColor(...INK)
      pdf.y = y + h + 3
    }
    pdf.y += 2
  }

  if (opts.sections.exercises && opts.exercises.length) {
    pdf.section(++n, t.exercises)
    pdf.exercises(opts.exercises)
  }

  if (opts.sections.evidence && (opts.papers.length || opts.guideline)) {
    pdf.section(++n, t.evidence)
    pdf.paragraph(t.evidenceIntro, MUTED, 10)
    opts.papers.forEach((p, i) => {
      pdf.paragraph(`${i + 1}. ${p.title}${[p.journal, p.year].filter(Boolean).length ? ` (${[p.journal, p.year].filter(Boolean).join(', ')})` : ''}`, INK, 10)
      if (p.why) pdf.paragraph(p.why, MUTED, 9.5)
      if (p.strength) pdf.paragraph(t.strength(p.strength), ACCENT_TEXT, 9)
    })
    if (opts.guideline) pdf.paragraph(t.guideline(opts.guideline.name, [opts.guideline.source, opts.guideline.date].filter(Boolean).join(', ')), MUTED, 9.5)
  }

  pdf.section(++n, t.contact)
  pdf.closing(opts.plan, opts.appUrl)
  pdf.footers(opts.plan.pdfFooter)
  return d
}
