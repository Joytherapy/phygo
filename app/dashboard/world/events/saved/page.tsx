'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import Navbar from '@/components/Navbar'
import EventCard, { type EventRecord } from '@/components/EventCard'
import { useUiStrings } from '@/contexts/LanguageContext'

type Tab = 'saved' | 'upcoming' | 'past'

export default function MyEventsPage() {
  const ui = useUiStrings()
  const router = useRouter()
  const [events, setEvents] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [needsSignIn, setNeedsSignIn] = useState(false)
  const [tab, setTab] = useState<Tab>('saved')

  useEffect(() => {
    fetch('/api/events/saved')
      .then((res) => {
        if (res.status === 401) {
          setNeedsSignIn(true)
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data?.events) setEvents(data.events)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const now = Date.now()
  const upcoming = useMemo(() => events.filter((e) => new Date(e.start_date).getTime() >= now), [events, now])
  const past = useMemo(() => events.filter((e) => new Date(e.start_date).getTime() < now), [events, now])

  const shown = tab === 'saved' ? events : tab === 'upcoming' ? upcoming : past

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[150px]"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.5) 0%, rgba(168,85,247,0.5) 100%)' }}
      />

      <div className="relative max-w-5xl mx-auto pt-40 pb-24 px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/25 bg-[#22D3EE]/10 px-3.5 py-1.5 mb-5">
          <Bookmark size={12} className="text-[#22D3EE]" />
          <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ background: 'linear-gradient(90deg, #22D3EE 0%, #A855F7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {ui.events.badge}
          </p>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white mb-8">
          {ui.events.myEventsHeading}
        </h1>

        {needsSignIn ? (
          <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-10 text-center">
            <p className="text-sm text-ink/50 dark:text-white/50">{ui.events.signInToSave}</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-8">
              {(['saved', 'upcoming', 'past'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-5 py-2.5 text-xs font-semibold transition-all ${
                    tab === t
                      ? 'text-white scale-[1.03]'
                      : 'text-ink/60 dark:text-white/60 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.07] dark:hover:bg-white/10'
                  }`}
                  style={tab === t ? { background: 'linear-gradient(90deg, #22D3EE 0%, #A855F7 100%)' } : undefined}
                >
                  {t === 'saved' ? ui.events.savedTab : t === 'upcoming' ? ui.events.upcomingTab : ui.events.pastTab}
                  {' · '}
                  {t === 'saved' ? events.length : t === 'upcoming' ? upcoming.length : past.length}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-10 text-center">
                <p className="text-sm text-ink/50 dark:text-white/50">{ui.events.loadingEvents}</p>
              </div>
            ) : shown.length === 0 ? (
              <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-10 text-center">
                <p className="text-sm text-ink/50 dark:text-white/50">{ui.events.noSavedEvents}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {shown.map((event) => (
                  <EventCard key={event.id} event={event} onClick={() => router.push(`/dashboard/world/events/${event.id}`)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
