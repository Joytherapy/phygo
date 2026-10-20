// The printable home programme for the patient: only what the patient needs
// (exercises, dose, days, sessions, the short version the clinician wrote,
// where to record it, when to stop). No clinical note content goes in it.
import jsPDF from 'jspdf'
import { doseLabel, type CareItem, type CareProgram } from './program'
import type { CareDict } from '@/lib/i18n/careStrings'

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

const fmtDate = (iso: string) => iso.split('-').reverse().join('/')

/** The line under an exercise's name: dose, sessions per day, days. */
export function itemSummary(item: Pick<CareItem, 'sets' | 'reps' | 'duration_seconds' | 'times_per_day' | 'weekdays'>, t: Pick<CareDict['plan'], 'pdfTimesPerDay' | 'everyDay'>, weekdayNames: string[]): string {
  const days = item.weekdays.length ? item.weekdays.map((d) => weekdayNames[d - 1]).join(', ') : t.everyDay
  return [doseLabel(item), t.pdfTimesPerDay(item.times_per_day), days].filter(Boolean).join(' · ')
}

export function buildProgramPdf(opts: {
  program: Pick<CareProgram, 'title' | 'starts_on' | 'rest_weekdays'>
  items: CareItem[]
  patientName: string
  appUrl: string
  t: CareDict['plan']
  weekdayNames: string[]
  /** JPEG data URLs by exercise_ref, for exercises of the Exercises section. */
  images: Map<string, string>
}): jsPDF {
  const { t } = opts
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const M = 16
  const bottom = 280
  let y = 0

  const header = () => {
    doc.setFillColor(124, 131, 255)
    doc.rect(0, 0, W, 34, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text(pdfText(t.pdfTitle), M, 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    const sub = [t.pdfFor(opts.patientName), opts.program.title, t.pdfStart(fmtDate(opts.program.starts_on))].filter(Boolean).join('  ·  ')
    doc.text(pdfText(sub), M, 25, { maxWidth: W - 2 * M })
    doc.setTextColor(30, 30, 40)
    y = 44
  }
  const ensure = (h: number) => {
    if (y + h > bottom) {
      doc.addPage()
      y = 18
    }
  }
  header()

  if (opts.program.rest_weekdays.length) {
    doc.setFontSize(10)
    doc.setTextColor(90, 90, 110)
    doc.text(pdfText(t.pdfRest(opts.program.rest_weekdays.map((d) => opts.weekdayNames[d - 1]).join(', '))), M, y)
    doc.setTextColor(30, 30, 40)
    y += 8
  }

  const exercises = opts.items.filter((i) => i.active && i.kind === 'exercise').sort((a, b) => a.sort_order - b.sort_order)
  exercises.forEach((item, index) => {
    const image = item.exercise_ref ? opts.images.get(item.exercise_ref) : undefined
    const textX = image ? M + 34 : M
    const width = W - M - textX
    doc.setFontSize(10)
    const steps = item.instructions ? doc.splitTextToSize(pdfText(item.instructions), width) : []
    const short = item.short_variant
      ? doc.splitTextToSize(pdfText(`${t.pdfShort} ${[doseLabel(item.short_variant), item.short_variant.instructions].filter(Boolean).join(' - ')}`), width)
      : []
    const notes = item.dose_notes ? doc.splitTextToSize(pdfText(item.dose_notes), width) : []
    const textH = 7 + 6 + (steps.length + notes.length + short.length) * 4.6 + 4
    const h = Math.max(image ? 34 : 0, textH)
    ensure(h + 4)

    doc.setDrawColor(225, 227, 240)
    doc.setFillColor(248, 248, 253)
    doc.roundedRect(M - 3, y - 5, W - 2 * M + 6, h + 2, 3, 3, 'FD')
    if (image) {
      try {
        doc.addImage(image, 'JPEG', M, y - 2, 28, 28)
      } catch {
        // An unreadable image is left out; the text stays.
      }
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12.5)
    doc.text(pdfText(`${index + 1}. ${item.title}`), textX, y + 2, { maxWidth: width })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(91, 99, 230)
    doc.text(pdfText(itemSummary(item, t, opts.weekdayNames)), textX, y + 8, { maxWidth: width })
    doc.setTextColor(60, 60, 75)
    let ty = y + 14
    for (const line of [...steps, ...notes]) {
      doc.text(line, textX, ty)
      ty += 4.6
    }
    if (short.length) {
      doc.setTextColor(16, 122, 87)
      for (const line of short) {
        doc.text(line, textX, ty)
        ty += 4.6
      }
    }
    doc.setTextColor(30, 30, 40)
    y += h + 6
  })

  const app = doc.splitTextToSize(pdfText(t.pdfApp), W - 2 * M - 8)
  const safety = doc.splitTextToSize(pdfText(t.pdfSafety), W - 2 * M - 8)
  ensure(14 + (app.length + safety.length) * 4.8 + 10)
  doc.setFillColor(238, 239, 255)
  doc.roundedRect(M - 3, y - 4, W - 2 * M + 6, 8 + (app.length + 1) * 4.8, 3, 3, 'F')
  doc.setFontSize(10)
  doc.text(app, M + 1, y + 1)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(91, 99, 230)
  doc.text(pdfText(opts.appUrl), M + 1, y + 1 + app.length * 4.8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 30, 40)
  y += 10 + (app.length + 1) * 4.8
  doc.setFillColor(255, 244, 230)
  doc.roundedRect(M - 3, y - 4, W - 2 * M + 6, 6 + safety.length * 4.8, 3, 3, 'F')
  doc.setTextColor(150, 80, 0)
  doc.text(safety, M + 1, y + 1)

  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFontSize(8.5)
    doc.setTextColor(140, 140, 155)
    doc.text(pdfText(t.pdfFooter), M, 290)
    doc.text(`${p}/${pages}`, W - M, 290, { align: 'right' })
  }
  return doc
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
