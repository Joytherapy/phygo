'use client'

import { BadgeCheck, GraduationCap, ShieldCheck } from 'lucide-react'
import { useVerificationStrings } from '@/lib/i18n/verificationStrings'
import type { VerificationSummary } from '@/components/ProfessionalVerificationCard'

// Small status badge shown next to the profile photo:
//   verified professional -> lit (green), not verified -> off (grey, with the
//   review status), student -> its own badge. Display only: the status comes
//   from the server and only PHYGO can change it.
export default function VerificationBadge({
  summary,
  onClick,
  expanded,
}: {
  summary: VerificationSummary | null
  onClick?: () => void
  expanded?: boolean
}) {
  const t = useVerificationStrings()
  if (!summary) return null

  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border'
  let className: string
  let Icon = ShieldCheck
  let label: string
  if (summary.practiceStage === 'student') {
    className = `${base} border-violet-400/30 bg-violet-500/10 text-violet-700 dark:text-violet-300`
    Icon = GraduationCap
    label = t.badgeStudent
  } else if (summary.status === 'verified') {
    className = `${base} border-[#32D6A0]/40 bg-[#32D6A0]/15 text-emerald-800 dark:text-[#5EE5B8] shadow-[0_0_12px_rgba(50,214,160,0.35)]`
    Icon = BadgeCheck
    label = t.badgeVerified
  } else {
    className = `${base} border-black/10 dark:border-white/15 bg-ink/[0.04] dark:bg-white/[0.04] text-ink/55 dark:text-white/45`
    label = summary.status === 'not_applicable' ? t.badgeNotVerified : `${t.badgeNotVerified} · ${t.status[summary.status]}`
  }

  const content = (
    <>
      <Icon size={13} aria-hidden />
      {label}
    </>
  )
  if (!onClick) return <span className={className}>{content}</span>
  return (
    <button type="button" onClick={onClick} aria-expanded={expanded} aria-controls="professional-verification" className={`${className} hover:opacity-90`} title={expanded ? t.hideDetails : t.showDetails}>
      {content}
    </button>
  )
}
