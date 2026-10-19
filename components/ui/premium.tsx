// The app's premium look, shared by every clinician page: monochrome
// surfaces, one accent (periwinkle to violet, the colours of the PHYGO mark)
// for small focus details, and the main action in ink on light and white on
// dark, as on the landing page. Class strings live here (a folder Tailwind
// scans) so every page uses exactly the same ones.

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export const ACCENT = 'linear-gradient(135deg, #A5B4FF 0%, #7C83FF 50%, #A78BFA 100%)'
export const ACCENT_SOLID = '#8B95FF'

/**
 * Six soft hues next to the accent, all at the same lightness so none shouts.
 * They carry meaning (a kind of appointment, a figure, a folder), never
 * decoration: every screen stays mostly neutral.
 */
export type Hue = 'iris' | 'violet' | 'sky' | 'mint' | 'amber' | 'coral'
export const HUE: Record<Hue, { solid: string; tile: string; gradient: string }> = {
  iris: { solid: '#8B95FF', gradient: 'linear-gradient(135deg, #A5B4FF 0%, #7C83FF 100%)', tile: 'bg-[#8B95FF]/[0.12] text-[#5B63E6] ring-1 ring-inset ring-[#8B95FF]/25 dark:text-[#B4BCFF]' },
  violet: { solid: '#A78BFA', gradient: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%)', tile: 'bg-[#A78BFA]/[0.12] text-[#7C5CE0] ring-1 ring-inset ring-[#A78BFA]/25 dark:text-[#C9B8FF]' },
  sky: { solid: '#5BB8F0', gradient: 'linear-gradient(135deg, #93D2F7 0%, #4AA6E0 100%)', tile: 'bg-[#5BB8F0]/[0.12] text-[#2B86C4] ring-1 ring-inset ring-[#5BB8F0]/25 dark:text-[#93D2F7]' },
  mint: { solid: '#4FC79B', gradient: 'linear-gradient(135deg, #86E0BE 0%, #3FAE88 100%)', tile: 'bg-[#4FC79B]/[0.12] text-[#23936B] ring-1 ring-inset ring-[#4FC79B]/25 dark:text-[#86E0BE]' },
  amber: { solid: '#F0B44C', gradient: 'linear-gradient(135deg, #F7CF85 0%, #E39E2B 100%)', tile: 'bg-[#F0B44C]/[0.14] text-[#A86F0C] ring-1 ring-inset ring-[#F0B44C]/30 dark:text-[#F7CF85]' },
  coral: { solid: '#F2879A', gradient: 'linear-gradient(135deg, #F8B3C0 0%, #E66A80 100%)', tile: 'bg-[#F2879A]/[0.13] text-[#C94A62] ring-1 ring-inset ring-[#F2879A]/25 dark:text-[#F8B3C0]' },
}

export const PAGE_BG = 'bg-[#f7f7f8] dark:bg-[#050608]'

export const PRIMARY_BTN =
  'bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90'

export const SECONDARY_BTN =
  'border border-black/[0.08] bg-white text-ink hover:border-black/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white dark:hover:border-white/25'

/** A glass card: the surface every section sits on. */
export const SURFACE =
  'relative overflow-hidden rounded-[24px] border border-black/[0.06] bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_44px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.055] dark:to-white/[0.018] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'

/** A small surface inside a card (a figure, a row). */
export const TILE = 'rounded-2xl border border-black/[0.05] bg-black/[0.02] dark:border-white/[0.06] dark:bg-white/[0.03]'

/** A neutral square holding an icon. */
export const ICON_TILE =
  'border border-black/[0.06] bg-black/[0.03] text-ink/70 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/80'

/** A neutral pill (status, tag, count). */
export const CHIP =
  'border border-black/[0.06] bg-black/[0.03] text-ink/70 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/75'

/** Focus ring and border for inputs. */
export const INPUT_FOCUS = 'focus:border-[#8B95FF] focus:ring-4 focus:ring-[#8B95FF]/15'

/** Aurora, grain and a faint grid behind a page: decoration only. */
export function PageBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -left-48 -top-64 h-[640px] w-[860px] rounded-full opacity-[0.14] blur-[130px] dark:opacity-[0.22]" style={{ background: 'radial-gradient(circle, #6366F1, transparent 65%)' }} />
      <div className="absolute -right-56 -top-48 h-[560px] w-[720px] rounded-full opacity-[0.08] blur-[130px] dark:opacity-[0.14]" style={{ background: 'radial-gradient(circle, #A78BFA, transparent 65%)' }} />
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        className="absolute inset-0 hidden opacity-40 dark:block"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, #000 25%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, #000 25%, transparent 70%)',
        }}
      />
    </div>
  )
}

/** Small label above a page title: an accent icon and an uppercase word. */
export function PageEyebrow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/55 dark:text-white/55">
      <span className="grid h-5 w-5 place-items-center rounded-md text-white shadow-[0_4px_12px_-4px_rgba(124,131,255,0.8)]" style={{ background: ACCENT }}>
        <Icon size={11} aria-hidden />
      </span>
      {children}
    </p>
  )
}
