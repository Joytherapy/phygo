'use client'

// Thin client for the EXISTING /api/ask-phygo endpoint (OpenAI-backed, with
// its own plan-based rate limiting already in production — see
// app/api/ask-phygo/route.ts). Deliberately not a new AI integration: this
// reuses the same model call, the same per-plan hourly limits ("credits"),
// and the same OPENAI_API_KEY already configured for the rest of PHYGO,
// rather than standing up a parallel/duplicate AI system for Workspace.
//
// SITE-WIDE PASS: this used to be mounted only inside the PDF document page,
// with `documentName` required — meaning Ask effectively didn't exist
// anywhere else in Workspace (not in a notebook, not on any other page).
// It's now rendered once, globally, by GlobalAskLauncher.tsx (mounted in
// app/dashboard/layout.tsx) — so `documentName` became optional context
// instead: a page CAN still tell it what's currently open via
// useAskContextLabel() (see contexts/AskContext.tsx), but Ask works with no
// context at all too, since nothing about it actually requires a document.
//
// V1 scope: a single Q&A thread, kept in memory for this reading session
// only (not persisted) — no new DB table for chat history yet.

import { useState } from 'react'
import { Sparkles, Send, X, Loader2 } from 'lucide-react'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'

type Turn = { question: string; answer?: string; error?: string }

export default function AskPhygoPanel({ contextLabel, onClose }: { contextLabel?: string | null; onClose: () => void }) {
  const ui = useWorkspaceUi()
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [loading, setLoading] = useState(false)

  const ask = async () => {
    const q = question.trim()
    if (!q || loading) return
    setQuestion('')
    setLoading(true)
    setTurns((prev) => [...prev, { question: q }])

    try {
      const res = await fetch('/api/ask-phygo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, noteContext: contextLabel || 'Using PHYGO Workspace.' }),
      })
      const json = await res.json()
      setTurns((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (res.status === 429) {
          last.error = ui.ask.limitReached
        } else if (!res.ok) {
          last.error = json.error || ui.ask.genericError
        } else {
          last.answer = json.answer
        }
        return next
      })
    } catch {
      setTurns((prev) => {
        const next = [...prev]
        next[next.length - 1].error = ui.ask.networkError
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full w-full flex-col rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#0c0d12] overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
          <Sparkles size={15} className="text-[#4F7CFF]" />
          {ui.ask.title}
        </div>
        <button onClick={onClose} aria-label={ui.ask.close} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/50 dark:text-white/50 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {turns.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">{ui.ask.empty}</p>}
        {turns.map((t, i) => (
          <div key={i} className="space-y-1.5">
            <p className="text-sm font-medium text-ink dark:text-white">{t.question}</p>
            {t.answer && <p className="text-sm text-ink/70 dark:text-white/70 whitespace-pre-wrap">{t.answer}</p>}
            {t.error && <p className="text-sm text-red-500">{t.error}</p>}
            {!t.answer && !t.error && loading && i === turns.length - 1 && (
              <p className="flex items-center gap-1.5 text-sm text-ink/40 dark:text-white/40">
                <Loader2 size={12} className="animate-spin" /> {ui.ask.thinking}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-black/[0.06] dark:border-white/10 p-3">
        <div className="flex items-center gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                ask()
              }
            }}
            placeholder={ui.ask.placeholder}
            className="flex-1 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/5 px-4 py-2 text-sm text-ink dark:text-white placeholder:text-ink/30 dark:placeholder:text-white/30 focus:outline-none focus:border-[#4F7CFF]/40"
          />
          <button
            onClick={ask}
            disabled={!question.trim() || loading}
            aria-label={ui.ask.send}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-30 transition-opacity"
            style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
          >
            <Send size={14} />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-ink/30 dark:text-white/30">{ui.ask.disclaimer}</p>
      </div>
    </div>
  )
}
