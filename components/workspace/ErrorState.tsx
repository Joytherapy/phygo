'use client'

import { AlertTriangle, RotateCw } from 'lucide-react'
import { useDashboardUi } from '@/lib/i18n/dashboardStrings'

// Shared load-error state (Workspace, dashboard home, Agenda, libraries):
// announced to screen readers and always offers a way out (Retry) instead of
// leaving the page on a spinner or an empty list that looks like "no data".
export default function ErrorState({
  title,
  message,
  onRetry,
}: {
  title?: string
  message: string
  onRetry?: () => void
}) {
  const t = useDashboardUi()
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl2 border border-red-500/20 bg-red-500/[0.03]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
        <AlertTriangle size={20} aria-hidden />
      </span>
      {title && <p className="text-base font-semibold text-ink dark:text-white mb-1">{title}</p>}
      <p className={title ? 'text-sm text-ink/65 dark:text-white/60 max-w-md' : 'text-sm font-semibold text-ink dark:text-white max-w-md'}>
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-ink/80 dark:text-white/80 border border-black/15 dark:border-white/15 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
        >
          <RotateCw size={14} aria-hidden />
          {t.common.retry}
        </button>
      )}
    </div>
  )
}
