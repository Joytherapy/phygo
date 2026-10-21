// Printable documents for the patient, in one look: the home programme
// (from the programme card) and the patient booklet (from the note, see
// lib/care/patientBooklet.ts). Only what the patient needs goes in them:
// no clinical note content.
import jsPDF from 'jspdf'
import { doseLabel, type CareItem, type CareProgram } from './program'
import type { CareDict } from '@/lib/i18n/careStrings'
import type { ClinicianSignature } from './clinicianSignature'

// The PDF's built-in font covers Latin-1 only.
export const pdfText = (s: string) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/×/g, 'x')
    .replace(/…/g, '...')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/[^\x00-\xFF]/g, '')

export const fmtDate = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/')

/** The line under an exercise's name: dose, sessions per day, days. */
export function itemSummary(item: Pick<CareItem, 'sets' | 'reps' | 'duration_seconds' | 'times_per_day' | 'weekdays'>, t: Pick<CareDict['plan'], 'pdfTimesPerDay' | 'everyDay'>, weekdayNames: string[]): string {
  const days = item.weekdays.length ? item.weekdays.map((d) => weekdayNames[d - 1]).join(', ') : t.everyDay
  return [doseLabel(item), t.pdfTimesPerDay(item.times_per_day), days].filter(Boolean).join(' · ')
}

/** One exercise as printed: what the card shows, already worded. */
export type PrintExercise = { title: string; summary: string; steps: string; notes: string; short: string | null; image?: string }

const W = 210
const M = 16
const BOTTOM = 280
const LINE = 4.6
const ACCENT: [number, number, number] = [124, 131, 255]
const ACCENT_TEXT: [number, number, number] = [91, 99, 230]
const INK: [number, number, number] = [30, 30, 40]
const MUTED: [number, number, number] = [90, 90, 110]

/** A small layout helper over jsPDF: a cursor, page breaks and the shared pieces. */
export class PatientPdf {
  doc = new jsPDF({ unit: 'mm', format: 'a4' })
  y = 0

  ensure(h: number) {
    if (this.y + h > BOTTOM) {
      this.doc.addPage()
      this.y = 18
    }
  }

  header(title: string, subtitle: string, by?: string) {
    const d = this.doc
    d.setFillColor(...ACCENT)
    d.rect(0, 0, W, by ? 40 : 34, 'F')
    d.setTextColor(255, 255, 255)
    d.setFont('helvetica', 'bold')
    d.setFontSize(20)
    d.text(pdfText(title), M, 16)
    d.setFont('helvetica', 'normal')
    d.setFontSize(10.5)
    d.text(pdfText(subtitle), M, 25, { maxWidth: W - 2 * M })
    if (by) {
      d.setFont('helvetica', 'bold')
      d.text(pdfText(by), M, 32, { maxWidth: W - 2 * M })
      d.setFont('helvetica', 'normal')
    }
    d.setTextColor(...INK)
    this.y = by ? 50 : 44
  }

  /** The clinician who prepared the document, at its end. */
  signature(label: string, sig: ClinicianSignature) {
    const d = this.doc
    this.ensure(22)
    this.y += 4
    d.setDrawColor(...ACCENT)
    d.setLineWidth(0.4)
    d.line(M, this.y - 4, M + 60, this.y - 4)
    d.setLineWidth(0.2)
    d.setFontSize(9)
    d.setTextColor(...MUTED)
    d.text(pdfText(label), M, this.y)
    d.setFont('helvetica', 'bold')
    d.setFontSize(12)
    d.setTextColor(...INK)
    d.text(pdfText(sig.name), M, this.y + 6)
    d.setFont('helvetica', 'normal')
    if (sig.credentials) {
      d.setFontSize(9.5)
      d.setTextColor(...MUTED)
      d.text(pdfText(sig.credentials), M, this.y + 11, { maxWidth: W - 2 * M })
      d.setTextColor(...INK)
    }
    this.y += 16
  }

  section(n: number, title: string) {
    const d = this.doc
    this.ensure(16)
    this.y += 2
    d.setFillColor(...ACCENT)
    d.circle(M + 3, this.y - 1.4, 3.4, 'F')
    d.setTextColor(255, 255, 255)
    d.setFont('helvetica', 'bold')
    d.setFontSize(9.5)
    d.text(String(n), M + 3, this.y + 0.2, { align: 'center' })
    d.setTextColor(...INK)
    d.setFontSize(14)
    d.text(pdfText(title), M + 9, this.y + 0.4)
    d.setFont('helvetica', 'normal')
    this.y += 9
  }

  paragraph(text: string, color: [number, number, number] = INK, size = 10.5) {
    const d = this.doc
    d.setFontSize(size)
    d.setTextColor(...color)
    for (const line of d.splitTextToSize(pdfText(text), W - 2 * M) as string[]) {
      this.ensure(LINE + 1)
      d.text(line, M, this.y)
      this.y += LINE + 0.4
    }
    d.setTextColor(...INK)
    this.y += 2
  }

  exercises(list: PrintExercise[]) {
    const d = this.doc
    list.forEach((ex, index) => {
      const textX = ex.image ? M + 34 : M
      const width = W - M - textX
      d.setFontSize(10)
      const steps = ex.steps ? (d.splitTextToSize(pdfText(ex.steps), width) as string[]) : []
      const notes = ex.notes ? (d.splitTextToSize(pdfText(ex.notes), width) as string[]) : []
      const short = ex.short ? (d.splitTextToSize(pdfText(ex.short), width) as string[]) : []
      const h = Math.max(ex.image ? 34 : 0, 13 + (steps.length + notes.length + short.length) * LINE + 4)
      this.ensure(h + 4)
      const y = this.y
      d.setDrawColor(225, 227, 240)
      d.setFillColor(248, 248, 253)
      d.roundedRect(M - 3, y - 5, W - 2 * M + 6, h + 2, 3, 3, 'FD')
      if (ex.image) {
        try {
          d.addImage(ex.image, 'JPEG', M, y - 2, 28, 28)
        } catch {
          // An unreadable image is left out; the text stays.
        }
      }
      d.setFont('helvetica', 'bold')
      d.setFontSize(12.5)
      d.text(pdfText(`${index + 1}. ${ex.title}`), textX, y + 2, { maxWidth: width })
      d.setFont('helvetica', 'normal')
      d.setFontSize(10)
      d.setTextColor(...ACCENT_TEXT)
      d.text(pdfText(ex.summary), textX, y + 8, { maxWidth: width })
      d.setTextColor(60, 60, 75)
      let ty = y + 14
      for (const line of [...steps, ...notes]) {
        d.text(line, textX, ty)
        ty += LINE
      }
      d.setTextColor(16, 122, 87)
      for (const line of short) {
        d.text(line, textX, ty)
        ty += LINE
      }
      d.setTextColor(...INK)
      this.y = y + h + 6
    })
  }

  /** Where to record and when to stop: closes every patient document. */
  closing(t: Pick<CareDict['plan'], 'pdfApp' | 'pdfSafety'>, appUrl: string) {
    const d = this.doc
    d.setFontSize(10)
    const app = d.splitTextToSize(pdfText(t.pdfApp), W - 2 * M - 8) as string[]
    const safety = d.splitTextToSize(pdfText(t.pdfSafety), W - 2 * M - 8) as string[]
    this.ensure(14 + (app.length + safety.length) * 4.8 + 10)
    d.setFillColor(238, 239, 255)
    d.roundedRect(M - 3, this.y - 4, W - 2 * M + 6, 8 + (app.length + 1) * 4.8, 3, 3, 'F')
    d.text(app, M + 1, this.y + 1)
    d.setFont('helvetica', 'bold')
    d.setTextColor(...ACCENT_TEXT)
    d.text(pdfText(appUrl), M + 1, this.y + 1 + app.length * 4.8)
    d.setFont('helvetica', 'normal')
    d.setTextColor(...INK)
    this.y += 10 + (app.length + 1) * 4.8
    d.setFillColor(255, 244, 230)
    d.roundedRect(M - 3, this.y - 4, W - 2 * M + 6, 6 + safety.length * 4.8, 3, 3, 'F')
    d.setTextColor(150, 80, 0)
    d.text(safety, M + 1, this.y + 1)
    d.setTextColor(...INK)
    this.y += 8 + safety.length * 4.8
  }

  footers(text: string) {
    const d = this.doc
    const pages = d.getNumberOfPages()
    for (let p = 1; p <= pages; p++) {
      d.setPage(p)
      d.setFontSize(8.5)
      d.setTextColor(140, 140, 155)
      d.text(pdfText(text), M, 290)
      d.text(`${p}/${pages}`, W - M, 290, { align: 'right' })
    }
    d.setTextColor(...INK)
  }
}

export const LAYOUT = { W, M, LINE, ACCENT, ACCENT_TEXT, INK, MUTED }

export function buildProgramPdf(opts: {
  program: Pick<CareProgram, 'title' | 'starts_on' | 'rest_weekdays'>
  items: CareItem[]
  patientName: string
  clinician: ClinicianSignature | null
  appUrl: string
  t: CareDict['plan']
  weekdayNames: string[]
  /** JPEG data URLs by exercise_ref, for exercises of the Exercises section. */
  images: Map<string, string>
}): jsPDF {
  const { t } = opts
  const pdf = new PatientPdf()
  pdf.header(t.pdfTitle, [opts.patientName ? t.pdfFor(opts.patientName) : null, opts.program.title, t.pdfStart(fmtDate(opts.program.starts_on))].filter(Boolean).join('  ·  '), opts.clinician ? t.pdfBy(opts.clinician.name) : undefined)
  if (opts.program.rest_weekdays.length) pdf.paragraph(t.pdfRest(opts.program.rest_weekdays.map((d) => opts.weekdayNames[d - 1]).join(', ')), MUTED, 10)
  pdf.exercises(
    opts.items
      .filter((i) => i.active && i.kind === 'exercise')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        title: item.title,
        summary: itemSummary(item, t, opts.weekdayNames),
        steps: item.instructions ?? '',
        notes: item.dose_notes ?? '',
        short: item.short_variant ? `${t.pdfShort} ${[doseLabel(item.short_variant), item.short_variant.instructions].filter(Boolean).join(' - ')}` : null,
        image: item.exercise_ref ? opts.images.get(item.exercise_ref) : undefined,
      })),
  )
  pdf.closing(t, opts.appUrl)
  if (opts.clinician) pdf.signature(t.pdfYourPhysio, opts.clinician)
  pdf.footers(opts.clinician ? t.pdfFooterBy(opts.clinician.name) : t.pdfFooter)
  return pdf.doc
}

/** An image link as a square JPEG data URL for the PDF, or null if it cannot be read. */
export async function imageAsJpeg(src: string, size = 360): Promise<string | null> {
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image'))
      img.src = src
    })
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const side = Math.min(img.naturalWidth, img.naturalHeight)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size)
    return canvas.toDataURL('image/jpeg', 0.85)
  } catch {
    return null
  }
}
