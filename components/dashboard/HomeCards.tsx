'use client'

// Building blocks of the dashboard home: the glass card, the next-patient
// focus card, the to-do list, the counters with their small charts and the
// patient cards. Data comes from app/dashboard/page.tsx; nothing here queries.

import Link from 'next/link'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Clock, MapPin, Play, UserRound, Video, X, AlertCircle, RotateCcw, CalendarClock } from 'lucide-react'


// Premium palette: monochrome surfaces and one accent (periwinkle to violet,
// the colours of the PHYGO mark), used sparingly for focus details.
export const ACCENT = 'linear-gradient(135deg, #A5B4FF 0%, #7C83FF 50%, #A78BFA 100%)'
export const ACCENT_SOLID = '#8B95FF'
// The main action: ink on light, white on dark, as on the landing page.
export const PRIMARY_BTN =
  'bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90'

const EDGE_MASK = {
  padding: 1,
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMaskComposite: 'xor',
  maskComposite: 'exclude',
} as const

export function Card({ children, className = '', glow = false, ...rest }: { children: ReactNode; className?: string; glow?: boolean } & React.HTMLAttributes<HTMLElement>) {
  // Pointer position for the spotlight (CSS variables, no re-render).
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - r.top}px`)
  }
  return (
    <section
      {...rest}
      onPointerMove={onPointerMove}
      className={`group/card relative min-w-0 overflow-hidden rounded-[24px] border border-black/[0.06] bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_44px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.055] dark:to-white/[0.018] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${className}`}
    >
      {/* soft light following the pointer (dark theme) */}
      <span aria-hidden className="phygo-spotlight pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 dark:block" />
      {/* thin light edge, brighter at the top-left corner */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[24px] opacity-0 dark:opacity-100"
        style={{
          ...EDGE_MASK,
          background: glow
            ? 'linear-gradient(140deg, rgba(165,180,255,0.35), transparent 38%, transparent 68%, rgba(167,139,250,0.2))'
            : 'linear-gradient(140deg, rgba(255,255,255,0.14), transparent 35%, transparent 75%, rgba(255,255,255,0.05))',
        }}
      />
      {/* the focus card: a slow light running around its edge */}
      {glow && <span aria-hidden className="phygo-edge-light pointer-events-none absolute inset-0 rounded-[24px] opacity-50 dark:opacity-90" style={EDGE_MASK} />}
      {children}
    </section>
  )
}

export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (!parts[0]) return '··'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ name, linked, size = 44 }: { name: string; linked: boolean; size?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full p-[2px]"
      style={{ width: size, height: size, background: linked ? 'conic-gradient(from 210deg, #A5B4FF, #7C83FF, #A78BFA, #A5B4FF)' : 'rgba(127,127,127,0.22)' }}
    >
      <span className="grid h-full w-full place-items-center rounded-full bg-[#f4f4f6] text-[13px] font-semibold tracking-wide text-ink dark:bg-[#111218] dark:text-white">
        {initials(name)}
      </span>
    </span>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`block animate-pulse rounded-lg bg-ink/10 dark:bg-white/10 ${className}`} />
}

export function InlineError({ message, retry, onRetry }: { message: string; retry: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-sm text-red-700 dark:text-red-300">
      <AlertCircle size={16} aria-hidden className="shrink-0" />
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onRetry} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-red-500/30 px-3 text-xs font-semibold">
        <RotateCcw size={13} aria-hidden />
        {retry}
      </button>
    </div>
  )
}

/* ---------- next patient ---------- */

export type NextView = {
  patientId: string
  name: string
  detail: string
  time: string
  dayLabel: string
  duration: string
  status: string
  inProgress: boolean
  video: boolean
  typeLabel: string
  lastSession: string
  linked: boolean
  linkedLabel: string
}

export function NextPatientCard({
  title,
  view,
  later,
  labels,
}: {
  title: string
  view: NextView
  later: { id: string; time: string; name: string; patientId: string }[]
  labels: { startSession: string; openRecord: string; lastSession: string; laterToday: string; openAgenda: string }
}) {
  return (
    <Card glow className="p-5 sm:p-7" data-testid="next-patient">
      <div aria-hidden className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full opacity-[0.18] blur-3xl dark:opacity-30" style={{ background: 'radial-gradient(circle, #7C83FF, transparent 65%)' }} />
      <div className="relative flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-black/[0.03] px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-ink/70 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/75">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
          {title}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${view.inProgress ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200' : 'text-ink/65 dark:text-white/65'}`}>
          {view.inProgress ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> : <Clock size={12} aria-hidden />}
          {view.status}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-xs text-ink/55 dark:text-white/55">
          {view.video ? <Video size={12} aria-hidden /> : <MapPin size={12} aria-hidden />}
          {view.typeLabel}
        </span>
      </div>

      <div className="relative mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={view.name} linked={view.linked} size={60} />
          <div className="min-w-0">
            <p className="truncate font-display text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-3xl">{view.name}</p>
            {view.detail && <p className="mt-0.5 truncate text-sm text-ink/60 dark:text-white/55">{view.detail}</p>}
          </div>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="font-display text-3xl font-semibold tracking-tight tabular-nums text-ink dark:bg-gradient-to-b dark:from-white dark:to-white/60 dark:bg-clip-text dark:text-transparent sm:text-[40px]">{view.time}</p>
          <p className="text-xs text-ink/55 dark:text-white/50">{view.dayLabel} · {view.duration}</p>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2 sm:max-w-md">
        <div className="rounded-2xl border border-black/[0.04] bg-black/[0.02] px-3.5 py-2.5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/45 dark:text-white/40">{labels.lastSession}</p>
          <p className="mt-0.5 text-sm font-semibold text-ink dark:text-white">{view.lastSession}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.04] bg-black/[0.02] px-3.5 py-2.5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/45 dark:text-white/40">My Phygo</p>
          <p className={`mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold ${view.linked ? 'text-ink dark:text-white' : 'text-ink/55 dark:text-white/50'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${view.linked ? 'bg-emerald-400' : 'border border-current'}`} />
            {view.linkedLabel}
          </p>
        </div>
      </div>

      <div className="relative mt-6 flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/dashboard/patients/${view.patientId}/session`}
          className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold transition-all ${PRIMARY_BTN}`}
        >
          <Play size={15} aria-hidden />
          {labels.startSession}
        </Link>
        <Link
          href={`/dashboard/patients/${view.patientId}`}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-black/[0.08] bg-white px-6 text-sm font-semibold text-ink transition-colors hover:border-black/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white dark:hover:border-white/25"
        >
          <UserRound size={15} aria-hidden />
          {labels.openRecord}
        </Link>
      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-4 dark:border-white/[0.07]">
        {later.length > 0 && <span className="mr-1 text-xs font-semibold text-ink/55 dark:text-white/50">{labels.laterToday}</span>}
        {later.map((l) => (
          <Link
            key={l.id}
            href={`/dashboard/patients/${l.patientId}`}
            className="inline-flex min-h-[34px] items-center gap-2 rounded-full border border-black/[0.07] px-3 text-xs text-ink/70 transition-colors hover:border-black/20 dark:border-white/[0.08] dark:text-white/70 dark:hover:border-white/25"
          >
            <span className="font-mono font-semibold text-ink dark:text-white">{l.time}</span>
            {l.name}
          </Link>
        ))}
        <Link href="/dashboard/agenda" className="ml-auto inline-flex min-h-[34px] items-center gap-1 text-xs font-semibold text-ink/70 hover:text-ink dark:text-white/70 dark:hover:text-white">
          {labels.openAgenda}
          <ArrowRight size={13} aria-hidden />
        </Link>
      </div>
    </Card>
  )
}

export function NoUpcomingCard({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <Card glow className="flex flex-col items-start justify-center p-6 sm:p-8" data-testid="next-patient-empty">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-black/[0.06] bg-black/[0.03] text-ink/70 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/80">
        <CalendarClock size={20} aria-hidden />
      </span>
      <p className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white">{title}</p>
      <p className="mt-2 max-w-md text-sm text-ink/60 dark:text-white/55">{body}</p>
      <Link
        href="/dashboard/agenda"
        className={`mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-all ${PRIMARY_BTN}`}
      >
        {cta}
        <ArrowRight size={14} aria-hidden />
      </Link>
    </Card>
  )
}

/* ---------- to do ---------- */

export type TodoItem =
  | { kind: 'request'; id: string; name: string; text: string }
  | { kind: 'followup'; id: string; patientId: string; name: string; text: string }

export function TodoCard({
  title,
  items,
  empty,
  busyId,
  error,
  labels,
  onAnswer,
}: {
  title: string
  items: TodoItem[] | undefined
  empty: string
  busyId: string | null
  error: string | null
  labels: { accept: string; decline: string }
  onAnswer: (id: string, status: 'confirmed' | 'cancelled') => void
}) {
  return (
    <Card className="p-5 sm:p-6" data-testid="todo">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-ink dark:text-white">{title}</h2>
        {items && items.length > 0 && <span className="font-mono text-xs text-ink/45 dark:text-white/40">{items.length}</span>}
      </div>
      {error && <p role="alert" className="mb-2 text-xs text-red-600 dark:text-red-300">{error}</p>}
      {items === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-sm text-ink/55 dark:text-white/50">{empty}</p>
      ) : (
        <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-3">
              <span
                aria-hidden
                className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-black/[0.06] bg-black/[0.03] text-[11px] font-semibold text-ink/75 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/80"
              >
                {initials(it.name)}
                <span className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-[#0b0c10] ${it.kind === 'request' ? 'bg-amber-400' : 'bg-[#8B95FF]'}`} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink dark:text-white">{it.name}</p>
                <p className="truncate text-xs text-ink/55 dark:text-white/50">{it.text}</p>
              </div>
              {it.kind === 'request' ? (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === it.id}
                    onClick={() => onAnswer(it.id, 'confirmed')}
                    aria-label={`${labels.accept}: ${it.name}`}
                    title={labels.accept}
                    className={`grid h-10 w-10 place-items-center rounded-xl transition-all disabled:opacity-50 ${PRIMARY_BTN}`}
                  >
                    <Check size={15} aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={busyId === it.id}
                    onClick={() => onAnswer(it.id, 'cancelled')}
                    aria-label={`${labels.decline}: ${it.name}`}
                    title={labels.decline}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-black/[0.08] text-ink/55 transition-colors hover:border-black/20 hover:text-ink disabled:opacity-50 dark:border-white/[0.1] dark:text-white/55 dark:hover:border-white/25 dark:hover:text-white"
                  >
                    <X size={15} aria-hidden />
                  </button>
                </div>
              ) : (
                <Link
                  href={`/dashboard/patients/${it.patientId}`}
                  aria-label={it.name}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-black/[0.08] text-ink/55 transition-colors hover:border-black/20 hover:text-ink dark:border-white/[0.1] dark:text-white/55 dark:hover:border-white/25 dark:hover:text-white"
                >
                  <ArrowRight size={15} aria-hidden />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/* ---------- counters ---------- */

// Counts up to the figure once it arrives; shows it at once for people who
// prefer reduced motion.
function CountUp({ value }: { value: number }) {
  const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [shown, setShown] = useState(() => (reduced() ? value : 0))
  const from = useRef(shown)
  useEffect(() => {
    if (reduced()) {
      setShown(value)
      from.current = value
      return
    }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 700)
      setShown(Math.round(a + (value - a) * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(step)
      else from.current = value
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{shown}</>
}

export function StatTile({
  index,
  label,
  value,
  extra,
  chart,
  href,
  unavailable,
  loading,
}: {
  index: number
  label: string
  value: number | null | undefined
  extra?: string
  chart?: ReactNode
  href?: string
  unavailable: string
  loading: string
}) {
  const inner = (
    <>
      <p className="text-xs text-ink/55 dark:text-white/50">{label}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="font-display text-[34px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-ink dark:text-white" data-stat={index}>
          {value === undefined ? (
            <span className="block h-8 w-12 animate-pulse rounded-md bg-ink/10 dark:bg-white/10" aria-label={loading} />
          ) : value === null ? (
            <span title={unavailable} aria-label={unavailable}>—</span>
          ) : (
            <CountUp value={value} />
          )}
        </p>
        {extra && value !== undefined && value !== null && <span className="font-mono text-[11px] text-ink/45 dark:text-white/45">{extra}</span>}
      </div>
      {chart && value !== undefined && value !== null && <div className="pointer-events-none absolute bottom-4 right-4 hidden sm:block" aria-hidden>{chart}</div>}
    </>
  )
  const cls = 'relative block h-full p-4 sm:p-5'
  return (
    <Card className="h-full">
      {href ? (
        <Link href={href} className={`${cls} rounded-[24px] transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]`}>
          {inner}
        </Link>
      ) : (
        <div className={cls}>{inner}</div>
      )}
    </Card>
  )
}

export function Sparkline({ values, color = ACCENT_SOLID, id }: { values: number[]; color?: string; id: string }) {
  const w = 110
  const h = 40
  const max = Math.max(1, ...values)
  const step = values.length > 1 ? w / (values.length - 1) : w
  const pts = values.map((v, i) => [i * step, h - 4 - (v / max) * (h - 10)] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h}Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Bars({ values, highlight }: { values: number[]; highlight: number }) {
  const max = Math.max(1, ...values)
  return (
    <svg width={7 * 15} height={40} viewBox={`0 0 ${7 * 15} 40`}>
      {values.map((v, i) => {
        const bh = Math.max(4, (v / max) * 36)
        return <rect key={i} x={i * 15 + 1} y={40 - bh} width={11} height={bh} rx={3} fill={i === highlight ? ACCENT_SOLID : 'currentColor'} opacity={i === highlight ? 1 : 0.12 + 0.18 * (v / max)} />
      })}
    </svg>
  )
}

export function Ring({ part, total }: { part: number; total: number }) {
  const r = 16
  const c = 2 * Math.PI * r
  const frac = total ? part / total : 0
  return (
    <svg width={42} height={42} viewBox="0 0 42 42">
      <defs>
        <linearGradient id="ring-g">
          <stop offset="0" stopColor="#A5B4FF" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <circle cx="21" cy="21" r={r} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="5" />
      <circle cx="21" cy="21" r={r} fill="none" stroke="url(#ring-g)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(frac * c).toFixed(1)} ${c.toFixed(1)}`} transform="rotate(-90 21 21)" />
    </svg>
  )
}

/* ---------- patient card ---------- */

export function PatientCard({
  id,
  name,
  detail,
  lastLabel,
  last,
  nextLabel,
  next,
  linked,
  linkedLabel,
}: {
  id: string
  name: string
  detail: string
  lastLabel: string
  last: string
  nextLabel: string
  next: string
  linked: boolean
  linkedLabel: string
}) {
  return (
    <Link
      href={`/dashboard/patients/${id}`}
      className="group block rounded-[20px] border border-black/[0.06] bg-white/90 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.045] dark:to-white/[0.015] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-white/20"
    >
      <div className="flex items-center gap-3">
        <Avatar name={name} linked={linked} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink dark:text-white">{name}</p>
          {detail && <p className="truncate text-xs text-ink/55 dark:text-white/50">{detail}</p>}
        </div>
        <ArrowRight size={15} aria-hidden className="shrink-0 text-ink/25 transition-all group-hover:translate-x-0.5 group-hover:text-ink dark:text-white/25 dark:group-hover:text-white" />
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-black/[0.025] px-3 py-2 dark:bg-white/[0.03]">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45 dark:text-white/40">{lastLabel}</p>
          <p className="mt-0.5 truncate text-[13px] font-semibold text-ink dark:text-white">{last}</p>
        </div>
        <div className="rounded-xl bg-black/[0.025] px-3 py-2 dark:bg-white/[0.03]">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45 dark:text-white/40">{nextLabel}</p>
          <p className="mt-0.5 truncate text-[13px] font-semibold text-ink dark:text-white">{next}</p>
        </div>
      </div>
      <p className={`mt-3 inline-flex items-center gap-1.5 text-[11.5px] ${linked ? 'text-ink/70 dark:text-white/70' : 'text-ink/40 dark:text-white/35'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${linked ? 'bg-emerald-400' : 'border border-current'}`} />
        {linkedLabel}
      </p>
    </Link>
  )
}
