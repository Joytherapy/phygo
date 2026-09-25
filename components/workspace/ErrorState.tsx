'use client'

import { AlertTriangle, RotateCw } from 'lucide-react'

export default function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl2 border border-red-500/20 bg-red-500/[0.03]">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
        <AlertTriangle size={20} />
      </span>
      <p className="text-sm font-semibold text-ink dark:text-white">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-ink/70 dark:text-white/70 border border-black/10 dark:border-white/10 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
        >
          <RotateCw size={12} />
          Retry
        </button>
      )}
    </div>
  )
}
