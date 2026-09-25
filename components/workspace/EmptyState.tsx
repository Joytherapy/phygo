'use client'

import type { LucideIcon } from 'lucide-react'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl2 border border-dashed border-black/10 dark:border-white/10">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF] mb-4">
        <Icon size={20} />
      </span>
      <p className="text-sm font-semibold text-ink dark:text-white">{title}</p>
      {description && (
        <p className="mt-1.5 text-xs text-ink/50 dark:text-white/50 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
