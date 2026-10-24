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
import type { ClinicianSignature } from './clinicianSignature'
import { EVIDENCE_RGB, evidenceLabel, evidenceTier } from '@/lib/evidence'

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
  clinician: ClinicianSignature | null
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
  lang?: string
}): jsPDF {
  const { t } = opts
  const { M, W, INK, MUTED, ACCENT, ACCENT_TEXT } = LAYOUT
  const pdf = new PatientPdf()
  const d = pdf.doc
  pdf.header(t.title, [opts.patientName ? opts.plan.pdfFor(opts.patientName) : null, fmtDate(opts.date)].filter(Boolean).join('  ·  '), opts.clinician ? opts.plan.pdfBy(opts.clinician.name) : undefined)
  let n = 0

  if (opts.sections.summary && opts.summary.trim()) {
    pdf.section(++n, t.summary)
    pdf.paragraph(opts.summary)
  }

  if (opts.sections.path && opts.phases.length) {
    pdf.section(++n, t.path)
    pdf.paragraph(t.pathIndicative, MUTED, 10)
    // Each phase: number, name ("you are here" on the right when it is the
    // current one), the typical duration on its own line, then goals and when
    // to progress. Lines are placed one by one (pdf.ensure), so long texts
    // wrap and break across pages without ever overlapping; a coloured rule
    // on the left groups the phase, thicker for the current one.
    const textX = M + 10
    const width = W - M - textX
    const line = (text: string, size: number, color: [number, number, number], bold = false, here = false) => {
      d.setFont('helvetica', bold ? 'bold' : 'normal')
      d.setFontSize(size)
      const lines = d.splitTextToSize(pdfText(text), width) as string[]
      for (const l of lines) {
        pdf.ensure(LAYOUT.LINE + 1)
        d.setDrawColor(...ACCENT)
        d.setLineWidth(here ? 1.4 : 0.5)
        d.line(M + 3, pdf.y - 3.6, M + 3, pdf.y + 1.2)
        d.setLineWidth(0.2)
        d.setTextColor(...color)
        d.text(l, textX, pdf.y)
        pdf.y += size >= 11 ? 5.4 : LAYOUT.LINE + 0.2
      }
      d.setFont('helvetica', 'normal')
    }
    for (const phase of opts.phases) {
      const here = opts.currentPhase === phase.number
      pdf.ensure(16)
      d.setFillColor(...ACCENT)
      d.circle(M + 3, pdf.y - 1.4, 3.6, 'F')
      d.setTextColor(255, 255, 255)
      d.setFont('helvetica', 'bold')
      d.setFontSize(10)
      d.text(String(phase.number || ''), M + 3, pdf.y + 0.2, { align: 'center' })
      if (here) {
        const label = pdfText(t.youAreHere)
        d.setFontSize(9)
        const w = d.getTextWidth(label) + 6
        d.setFillColor(...ACCENT)
        d.roundedRect(W - M - w, pdf.y - 4.4, w, 6, 3, 3, 'F')
        d.setTextColor(255, 255, 255)
        d.text(label, W - M - w / 2, pdf.y - 0.3, { align: 'center' })
      }
      d.setFont('helvetica', 'normal')
      const nameWidth = here ? width - 28 : width
      d.setFont('helvetica', 'bold')
      d.setFontSize(11.5)
      d.setTextColor(...INK)
      const nameLines = d.splitTextToSize(pdfText(phase.name), nameWidth) as string[]
      for (const l of nameLines) {
        d.text(l, textX, pdf.y)
        pdf.y += 5.4
      }
      d.setFont('helvetica', 'normal')
      if (phase.duration) line(phase.duration, 9, MUTED, false, here)
      if (phase.goals) line(`${t.goals}: ${phase.goals}`, 10, [60, 60, 75], false, here)
      if (phase.progressWhen) line(`${t.progressWhen}: ${phase.progressWhen}`, 10, [60, 60, 75], false, here)
      d.setTextColor(...INK)
      pdf.y += 5
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
      // The level in the colour it has everywhere in the app (lib/evidence.ts).
      if (p.strength) pdf.paragraph(t.strength(evidenceLabel(p.strength, opts.lang ?? 'it')), EVIDENCE_RGB[evidenceTier(p.strength) ?? 'unknown'], 9.5)
    })
    if (opts.guideline) pdf.paragraph(t.guideline(opts.guideline.name, [opts.guideline.source, opts.guideline.date].filter(Boolean).join(', ')), MUTED, 9.5)
  }

  pdf.section(++n, t.contact)
  pdf.closing(opts.plan, opts.appUrl)
  if (opts.clinician) pdf.signature(opts.plan.pdfYourPhysio, opts.clinician)
  pdf.footers(opts.clinician ? opts.plan.pdfFooterBy(opts.clinician.name) : opts.plan.pdfFooter)
  return d
}
