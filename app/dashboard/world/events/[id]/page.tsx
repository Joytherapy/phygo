'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe2,
  MapPin,
  Wifi,
  ShieldCheck,
  Users,
  Tag,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Building2,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useUiStrings, useLanguage } from '@/contexts/LanguageContext'

type Speaker = { name: string; role?: string } | string

interface EventDetail {
  id: string
  title: string
  description: string | null
  event_type: string
  category: string
  sub_category: string | null
  audience: string
  professional_level: string | null
  organizer: string | null
  organizer_website: string | null
  official_url: string | null
  registration_url: string | null
  location_type: 'online' | 'in_person' | 'hybrid'
  country: string | null
  city: string | null
  venue: string | null
  address: string | null
  start_date: string
  end_date: string | null
  timezone: string | null
  language: string | null
  price: number | null
  currency: string | null
  is_free: boolean
  registration_deadline: string | null
  speakers: Speaker[]
  topics: string[]
  tags: string[]
  image: string | null
  status: string
  verification_status: 'unverified' | 'source_verified' | 'organizer_verified' | 'phygo_verified'
}

export default function EventDetailPage() {
  const ui = useUiStrings()
  const { lang } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [needsSignIn, setNeedsSignIn] = useState(false)

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found')
        return res.json()
      })
      .then((data) => {
        setEvent(data.event)
        setLoading(false)
      })
      .catch(() => {
        setNotFound(true)
        setLoading(false)
      })

    fetch('/api/events/saved')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.events) {
          setSaved(data.events.some((e: { id: string }) => e.id === eventId))
        }
      })
      .catch(() => {})
  }, [eventId])

  const toggleSave = async () => {
    setSaving(true)
    setNeedsSignIn(false)
    try {
      const res = await fetch('/api/events/save', {
        method: saved ? 'DELETE' : 'POST',
        headers: saved ? undefined : { 'Content-Type': 'application/json' },
        body: saved ? undefined : JSON.stringify({ eventId }),
      })
      if (res.status === 401) {
        setNeedsSignIn(true)
      } else if (res.ok) {
        setSaved((s) => !s)
      }
    } finally {
      setSaving(false)
    }
  }

  const locale = lang === 'it' ? 'it-IT' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US'

  if (loading) {
    return (
      <div className="relative min-h-screen bg-white dark:bg-[#08090b] transition-colors">
        <Navbar />
        <div className="pt-40 text-center text-ink/40 dark:text-white/40">{ui.events.loadingEvents}</div>
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="relative min-h-screen bg-white dark:bg-[#08090b] transition-colors">
        <Navbar />
        <div className="pt-40 text-center text-ink/40 dark:text-white/40">{ui.events.eventNotFound}</div>
      </div>
    )
  }

  const dateLabel = new Date(event.start_date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
  const endDateLabel = event.end_date
    ? new Date(event.end_date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const timeLabel = new Date(event.start_date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

  const locationLabel =
    event.location_type === 'online' ? ui.events.onlineLabel : event.location_type === 'hybrid' ? ui.events.hybridLabel : ui.events.inPersonLabel

  const place = [event.venue, event.city, event.country].filter(Boolean).join(', ')

  const priceLabel = event.is_free ? ui.events.freeLabel : event.price != null ? `${event.price} ${event.currency || ''}`.trim() : ui.events.paidLabel

  const verificationColor =
    event.verification_status === 'phygo_verified'
      ? '#22D3EE'
      : event.verification_status === 'organizer_verified'
      ? '#A855F7'
      : event.verification_status === 'source_verified'
      ? '#818CF8'
      : '#8A93A6'

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full opacity-20 dark:opacity-30 blur-[160px]"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.5) 0%, rgba(168,85,247,0.5) 100%)' }}
      />

      <div className="relative max-w-3xl mx-auto pt-36 pb-24 px-6">
        <button
          onClick={() => router.push('/dashboard/world/events')}
          className="flex items-center gap-2 text-sm font-medium text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          {ui.events.backToEvents}
        </button>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="rounded-full bg-black/[0.04] dark:bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink/60 dark:text-white/60">
              {ui.events.categoryLabels[event.category as keyof typeof ui.events.categoryLabels] || event.category}
            </span>
            <span className="rounded-full bg-black/[0.04] dark:bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink/60 dark:text-white/60">
              {ui.events.typeLabels[event.event_type as keyof typeof ui.events.typeLabels] || event.event_type}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: `${verificationColor}1A`, color: verificationColor }}>
              <ShieldCheck size={12} />
              {ui.events.verificationLabels[event.verification_status]}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink dark:text-white mb-3 leading-tight">
            {event.title}
          </h1>

          {event.organizer && (
            <p className="flex items-center gap-1.5 text-sm text-ink/50 dark:text-white/50 mb-8">
              <Building2 size={14} />
              {ui.events.organizerLabel}: {event.organizer}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            <InfoRow icon={<Calendar size={15} className="text-[#22D3EE]" />} label={ui.events.dateLabel} value={endDateLabel && endDateLabel !== dateLabel ? `${dateLabel} → ${endDateLabel}` : dateLabel} />
            <InfoRow icon={<Clock size={15} className="text-[#22D3EE]" />} label={ui.events.timeLabel} value={`${timeLabel}${event.timezone ? ` (${event.timezone})` : ''}`} />
            <InfoRow
              icon={event.location_type === 'online' ? <Wifi size={15} className="text-[#A855F7]" /> : <MapPin size={15} className="text-[#A855F7]" />}
              label={ui.events.locationLabel}
              value={`${locationLabel}${place ? ` · ${place}` : ''}`}
            />
            <InfoRow icon={<Globe2 size={15} className="text-[#A855F7]" />} label={ui.events.priceLabel} value={priceLabel} />
          </div>

          {event.registration_deadline && (
            <p className="text-xs text-ink/40 dark:text-white/40 mb-8">
              {ui.events.registrationDeadlineLabel}: {new Date(event.registration_deadline).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          {event.description && (
            <div className="mb-8">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40 mb-2">{ui.events.descriptionLabel}</p>
              <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>
          )}

          {event.topics?.length > 0 && (
            <div className="mb-8">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40 mb-2">
                <Tag size={12} />
                {ui.events.topicsLabel}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {event.topics.map((topic, i) => (
                  <span key={i} className="rounded-full bg-black/[0.04] dark:bg-white/10 px-3 py-1 text-xs text-ink/70 dark:text-white/70">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {event.speakers?.length > 0 && (
            <div className="mb-10">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40 mb-2">
                <Users size={12} />
                {ui.events.speakersLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {event.speakers.map((s, i) => (
                  <span key={i} className="rounded-full bg-black/[0.04] dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-ink/70 dark:text-white/70">
                    {typeof s === 'string' ? s : s.role ? `${s.name} · ${s.role}` : s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-ink/35 dark:text-white/35 mb-8">{ui.events.verificationExplainer}</p>

          <div className="flex flex-wrap gap-3">
            <a
              href={event.registration_url || event.official_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ background: 'linear-gradient(90deg, #22D3EE 0%, #A855F7 100%)' }}
            >
              {ui.events.registerCta}
              <ExternalLink size={14} />
            </a>
            <button
              onClick={toggleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold border border-black/10 dark:border-white/15 text-ink dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {saved ? <BookmarkCheck size={15} className="text-[#22D3EE]" /> : <Bookmark size={15} />}
              {saved ? ui.events.savedCta : ui.events.saveEventCta}
            </button>
          </div>
          {needsSignIn && <p className="mt-3 text-xs text-red-500">{ui.events.signInToSave}</p>}
        </motion.div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/10">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">{label}</p>
        <p className="text-sm font-semibold text-ink dark:text-white truncate">{value}</p>
      </div>
    </div>
  )
}
