'use client'

// The site-wide "Ask PHYGO" entry point — see contexts/AskContext.tsx for
// why this exists (Ask used to only be reachable from inside the PDF
// reader). Mounted ONCE in app/dashboard/layout.tsx, so it floats on every
// dashboard page: a round button pinned to the side of the screen, and a
// slide-over panel that opens beside it, reusing the exact same
// AskPhygoPanel used before — same endpoint, same rate limiting, same
// disclaimer, just reachable from anywhere now instead of one page.

import { Sparkles } from 'lucide-react'
import { useAsk } from '@/contexts/AskContext'
import AskPhygoPanel from './pdf/AskPhygoPanel'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'

export default function GlobalAskLauncher() {
  const ui = useWorkspaceUi()
  const { open, toggle, close, contextLabel } = useAsk()

  return (
    <>
      {/* Floating launcher — bottom-right, above any page content, on every
          dashboard page. Hidden while the panel itself is open on small
          screens (the panel already covers most of the viewport there) so
          it never sits on top of its own close button. */}
      <button
        onClick={toggle}
        aria-label={ui.ask.button}
        title={ui.ask.button}
        className={`fixed bottom-6 right-4 sm:right-6 z-[80] flex h-13 w-13 items-center justify-center rounded-full text-white shadow-lift transition-transform hover:scale-105 ${
          open ? 'hidden sm:flex' : 'flex'
        }`}
        style={{ background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)', height: 52, width: 52 }}
      >
        <Sparkles size={20} />
      </button>

      {open && (
        <>
          {/* Backdrop — click to dismiss, mobile-only (desktop just has the
              panel sit beside page content without blocking it). */}
          <div className="fixed inset-0 z-[75] bg-black/20 sm:hidden" onClick={close} />
          <div className="fixed inset-y-0 right-0 z-[80] w-full sm:w-96 p-0 sm:p-4">
            <AskPhygoPanel contextLabel={contextLabel} onClose={close} />
          </div>
        </>
      )}
    </>
  )
}
