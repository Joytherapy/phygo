'use client'

import { Calendar, MapPin, Wifi, ShieldCheck, BadgeCheck } from 'lucide-react'
import { useUiStrings, useLanguage } from '@/contexts/LanguageContext'

export type EventRecord = {
  id: string
  title: string
  category: string
  event_type: string
  location_type: 'online' | 'in_person' | 'hybrid'
  country: string | null
  city: string | null
  start_date: string
  end_date: string | null
  is_free: boolean
  price: number | null
  currency: string | null
  image: string | null
  verification_status: 'unverified' | 'source_verified' | 'organizer_verified' | 'phygo_verified'
  status: string
}

// Shared card for the Events discovery rails/grid and the "My Events" list —
// keeps date/price/verification formatting identical everywhere an event
// gets rendered as a compact tile, per the brief's card spec (image,
// category, title, date, location, online/in-person/hybrid, price,
// verification badge, VIEW EVENT CTA).
export default function EventCard({ event, onClick }: { event: EventRecord; onClick: () => void }) {
  const ui = useUiStrings()
  const { lang } = useLanguage()

  const dateLabel = new Date(event.start_date).toLocaleDateString(
    lang === 'it' ? 'it-IT' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US',
    { day: 'numeric', month: 'short', year: 'numeric' }
  )

  const locationLabel =
    event.location_type === 'online'
      ? ui.events.onlineLabel
      : event.location_type === 'hybrid'
      ? ui.events.hybridLabel
      : ui.events.inPersonLabel

  const place = [event.city, event.country].filter(Boolean).join(', ')

  const priceLabel = event.is_free
    ? ui.events.freeLabel
    : event.price != null
    ? `${event.price} ${event.currency || ''}`.trim()
    : ui.events.paidLabel

  const verificationColor =
    event.verification_status === 'phygo_verified'
      ? '#22D3EE'
      : event.verification_status === 'organizer_verified'
      ? '#A855F7'
      : event.verification_status === 'source_verified'
      ? '#818CF8'
      : '#8A93A6'

  return (
    <button
      onClick={onClick}
      className="group text-left relative rounded-[22px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full"
    >
      <div
        className="relative h-28 flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.18) 0%, rgba(168,85,247,0.18) 100%)' }}
      >
        {event.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image} alt={event.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div
            className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-40 blur-2xl transition-transform duration-500 group-hover:scale-125"
            style={{ background: 'linear-gradient(135deg, #22D3EE 0%, #A855F7 100%)' }}
          />
        )}
        <span className="absolute top-2.5 left-2.5 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink dark:text-white shadow-sm">
          {ui.events.categoryLabels[event.category as keyof typeof ui.events.categoryLabels] || event.category}
        </span>
        <span className="absolute top-2.5 right-2.5 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-ink dark:text-white shadow-sm">
          {priceLabel}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <p className="text-sm font-bold text-ink dark:text-white leading-snug line-clamp-2">{event.title}</p>

        <div className="flex items-center gap-1.5 text-xs text-ink/50 dark:text-white/50">
          <Calendar size={12} />
          {dateLabel}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-ink/50 dark:text-white/50">
          {event.location_type === 'online' ? <Wifi size={12} /> : <MapPin size={12} />}
          {locationLabel}
          {place && ` · ${place}`}
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: verificationColor }}>
            <ShieldCheck size={12} />
            {ui.events.verificationLabels[event.verification_status]}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white transition-transform group-hover:scale-105"
            style={{ background: 'linear-gradient(90deg, #22D3EE 0%, #A855F7 100%)' }}
          >
            <BadgeCheck size={12} />
            {ui.events.viewEventCta}
          </span>
        </div>
      </div>
    </button>
  )
}
