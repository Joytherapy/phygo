'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Sparkles, Wifi, MapPin, SlidersHorizontal, X, Building2, ArrowUpRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import EventCard, { type EventRecord } from '@/components/EventCard'
import { useUiStrings } from '@/contexts/LanguageContext'

const PAGE_SIZE = 15

type Provider = {
  id: string
  name: string
  base_url: string
  country: string | null
  description: string | null
  courses_note: string | null
}

type Filters = {
  category: string
  eventType: string
  locationType: string
  free: string
  audience: string
  level: string
  datePreset: string
}

const EMPTY_FILTERS: Filters = {
  category: '',
  eventType: '',
  locationType: '',
  free: '',
  audience: '',
  level: '',
  datePreset: '',
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function EventsPage() {
  const ui = useUiStrings()
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)

  const [events, setEvents] = useState<EventRecord[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [featured, setFeatured] = useState<EventRecord[]>([])
  const [online, setOnline] = useState<EventRecord[]>([])
  const [nearYou, setNearYou] = useState<EventRecord[]>([])
  const [providers, setProviders] = useState<Provider[]>([])

  const isFiltering = Boolean(query) || Object.values(filters).some(Boolean)

  const buildParams = (extra: Record<string, string> = {}, extraOffset = 0) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (filters.category) params.set('category', filters.category)
    if (filters.eventType) params.set('eventType', filters.eventType)
    if (filters.locationType) params.set('locationType', filters.locationType)
    if (filters.free) params.set('free', filters.free)
    if (filters.audience) params.set('audience', filters.audience)
    if (filters.level) params.set('level', filters.level)
    if (filters.datePreset) params.set('datePreset', filters.datePreset)
    params.set('limit', String(PAGE_SIZE))
    params.set('offset', String(extraOffset))
    Object.entries(extra).forEach(([k, v]) => params.set(k, v))
    return params
  }

  // Main filtered grid — refetches whenever search text or any filter
  // changes, with a short debounce on the free-text search.
  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true)
      fetch(`/api/events/list?${buildParams({}, 0)}`)
        .then((res) => res.json())
        .then((data) => {
          setEvents(data.events || [])
          setTotal(data.total || 0)
          setOffset(0)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }, 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters])

  // Featured / Online rails — independent of the active filters, hidden
  // once the user starts filtering/searching so the page doesn't feel
  // cluttered (per brief: "Do not overwhelm the user").
  useEffect(() => {
    fetch('/api/events/list?featured=true&limit=8')
      .then((res) => res.json())
      .then((data) => setFeatured(data.events || []))
      .catch(() => {})
    fetch('/api/events/list?locationType=online&limit=8')
      .then((res) => res.json())
      .then((data) => setOnline(data.events || []))
      .catch(() => {})
    fetch('/api/events/providers')
      .then((res) => res.json())
      .then((data) => setProviders(data.providers || []))
      .catch(() => {})
  }, [])

  // Near You — opportunistic geolocation; if denied/unavailable the rail
  // simply never appears rather than blocking or prompting repeatedly.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetch('/api/events/list?locationType=in_person&limit=40')
          .then((res) => res.json())
          .then((data) => {
            const withCoords = (data.events || []).filter(
              (e: EventRecord & { latitude?: number; longitude?: number }) =>
                typeof e.latitude === 'number' && typeof e.longitude === 'number'
            ) as (EventRecord & { latitude: number; longitude: number })[]
            const sorted = withCoords
              .map((e) => ({ e, d: haversineKm(pos.coords.latitude, pos.coords.longitude, e.latitude, e.longitude) }))
              .sort((a, b) => a.d - b.d)
              .slice(0, 8)
              .map((x) => x.e)
            setNearYou(sorted)
          })
          .catch(() => {})
      },
      () => {},
      { timeout: 4000 }
    )
  }, [])

  const loadMore = () => {
    setLoadingMore(true)
    fetch(`/api/events/list?${buildParams({}, offset + PAGE_SIZE)}`)
      .then((res) => res.json())
      .then((data) => {
        setEvents((prev) => [...prev, ...(data.events || [])])
        setOffset((o) => o + PAGE_SIZE)
        setLoadingMore(false)
      })
      .catch(() => setLoadingMore(false))
  }

  const categoryOptions = useMemo(() => Object.entries(ui.events.categoryLabels), [ui])
  const typeOptions = useMemo(() => Object.entries(ui.events.typeLabels), [ui])
  const audienceOptions = useMemo(() => Object.entries(ui.events.audienceLabels), [ui])
  const levelOptions = useMemo(() => Object.entries(ui.events.levelLabels), [ui])

  const hasMore = events.length < total

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] rounded-full opacity-20 dark:opacity-30 blur-[160px]"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.55) 0%, rgba(168,85,247,0.5) 100%)' }}
      />

      <div className="relative max-w-6xl mx-auto pt-40 pb-24 px-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/25 bg-[#22D3EE]/10 px-3.5 py-1.5 mb-5">
            <Sparkles size={12} className="text-[#22D3EE]" />
            <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ background: 'linear-gradient(90deg, #22D3EE 0%, #A855F7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {ui.events.badge}
            </p>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight mb-3">
            <span style={{ background: 'linear-gradient(90deg, #22D3EE 0%, #A855F7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {ui.events.heading}
            </span>
          </h1>
          <p className="text-base text-ink/50 dark:text-white/50 max-w-2xl mb-8">{ui.events.subtitle}</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center h-6 w-6 rounded-full bg-[#22D3EE]/15">
              <Search size={13} strokeWidth={2.5} className="text-[#22D3EE]" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ui.events.searchPlaceholder}
              className="relative w-full text-sm rounded-full border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] pl-14 pr-4 py-3.5 outline-none focus:border-[#22D3EE] text-ink dark:text-white placeholder:text-ink/40 dark:placeholder:text-white/40 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition-colors ${
              showFilters
                ? 'text-white'
                : 'text-ink/70 dark:text-white/70 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.07] dark:hover:bg-white/10'
            }`}
            style={showFilters ? { background: 'linear-gradient(90deg, #22D3EE 0%, #A855F7 100%)' } : undefined}
          >
            <SlidersHorizontal size={15} />
            {ui.events.filtersLabel}
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <FilterSelect
              label={ui.events.categoryLabel}
              value={filters.category}
              onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
              options={categoryOptions}
              allLabel={ui.events.allLabel}
            />
            <FilterSelect
              label={ui.events.typeLabel}
              value={filters.eventType}
              onChange={(v) => setFilters((f) => ({ ...f, eventType: v }))}
              options={typeOptions}
              allLabel={ui.events.allLabel}
            />
            <FilterSelect
              label={ui.events.audienceLabel}
              value={filters.audience}
              onChange={(v) => setFilters((f) => ({ ...f, audience: v }))}
              options={audienceOptions}
              allLabel={ui.events.allLabel}
            />
            <FilterSelect
              label={ui.events.levelLabel}
              value={filters.level}
              onChange={(v) => setFilters((f) => ({ ...f, level: v }))}
              options={levelOptions}
              allLabel={ui.events.allLabel}
            />

            <div>
              <p className="text-xs font-semibold text-ink/50 dark:text-white/50 mb-2">{ui.events.locationLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {(['', 'online', 'in_person', 'hybrid'] as const).map((v) => (
                  <button
                    key={v || 'all'}
                    onClick={() => setFilters((f) => ({ ...f, locationType: v }))}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      filters.locationType === v
                        ? 'text-white bg-gradient-to-r from-[#22D3EE] to-[#A855F7]'
                        : 'text-ink/60 dark:text-white/60 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.07] dark:hover:bg-white/10'
                    }`}
                  >
                    {v === '' ? ui.events.allLabel : v === 'online' ? ui.events.onlineLabel : v === 'in_person' ? ui.events.inPersonLabel : ui.events.hybridLabel}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink/50 dark:text-white/50 mb-2">{ui.events.dateLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {(['', 'today', 'week', 'month', '3months'] as const).map((v) => (
                  <button
                    key={v || 'all'}
                    onClick={() => setFilters((f) => ({ ...f, datePreset: v }))}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      filters.datePreset === v
                        ? 'text-white bg-gradient-to-r from-[#22D3EE] to-[#A855F7]'
                        : 'text-ink/60 dark:text-white/60 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.07] dark:hover:bg-white/10'
                    }`}
                  >
                    {v === '' ? ui.events.allLabel : v === 'today' ? ui.events.datePresets.today : v === 'week' ? ui.events.datePresets.thisWeek : v === 'month' ? ui.events.datePresets.thisMonth : ui.events.datePresets.next3Months}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink/50 dark:text-white/50 mb-2">{ui.events.freeLabel} / {ui.events.paidLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {(['', 'true', 'false'] as const).map((v) => (
                  <button
                    key={v || 'all'}
                    onClick={() => setFilters((f) => ({ ...f, free: v }))}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      filters.free === v
                        ? 'text-white bg-gradient-to-r from-[#22D3EE] to-[#A855F7]'
                        : 'text-ink/60 dark:text-white/60 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.07] dark:hover:bg-white/10'
                    }`}
                  >
                    {v === '' ? ui.events.allLabel : v === 'true' ? ui.events.freeLabel : ui.events.paidLabel}
                  </button>
                ))}
              </div>
            </div>

            {isFiltering && (
              <button
                onClick={() => {
                  setFilters(EMPTY_FILTERS)
                  setQuery('')
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors self-end"
              >
                <X size={13} />
                {ui.events.allLabel}
              </button>
            )}
          </motion.div>
        )}

        {!isFiltering && featured.length > 0 && (
          <Rail title={ui.events.featuredHeading} events={featured} router={router} />
        )}
        {!isFiltering && online.length > 0 && (
          <Rail title={ui.events.onlineHeading} events={online} router={router} icon={<Wifi size={15} className="text-[#22D3EE]" />} />
        )}
        {!isFiltering && nearYou.length > 0 && (
          <Rail title={ui.events.nearYouHeading} events={nearYou} router={router} icon={<MapPin size={15} className="text-[#A855F7]" />} />
        )}

        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40 mb-4 mt-2">
          {ui.events.upcomingHeading}
        </p>

        {loading ? (
          <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-10 text-center">
            <p className="text-sm text-ink/50 dark:text-white/50">{ui.events.loadingEvents}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-10 text-center">
            <p className="text-sm text-ink/50 dark:text-white/50">{ui.events.noEventsFound}</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} onClick={() => router.push(`/dashboard/world/events/${event.id}`)} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-transform hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(90deg, #22D3EE 0%, #A855F7 100%)' }}
                >
                  {loadingMore ? ui.events.loadingEvents : `${ui.events.upcomingHeading} +${total - events.length}`}
                </button>
              </div>
            )}
          </>
        )}

        {providers.length > 0 && (
          <div className="mt-16 pt-10 border-t border-black/[0.06] dark:border-white/10">
            <div className="flex items-center gap-2 mb-1.5">
              <Building2 size={15} className="text-[#A855F7]" />
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40">
                {ui.events.providersHeading}
              </p>
            </div>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">{ui.events.providersSubtitle}</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="group rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#A855F7]/30 hover:shadow-[0_16px_40px_-18px_rgba(168,85,247,0.3)]"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-ink dark:text-white">{provider.name}</h3>
                    {provider.country && (
                      <span className="shrink-0 text-[11px] font-medium text-ink/40 dark:text-white/40 bg-black/[0.04] dark:bg-white/[0.06] rounded-full px-2 py-0.5">
                        {provider.country}
                      </span>
                    )}
                  </div>
                  {provider.description && (
                    <p className="text-xs text-ink/55 dark:text-white/55 leading-relaxed mb-1.5">{provider.description}</p>
                  )}
                  {provider.courses_note && (
                    <p className="text-xs text-ink/40 dark:text-white/40 leading-relaxed mb-4">{provider.courses_note}</p>
                  )}
                  <a
                    href={provider.base_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A855F7] hover:gap-2 transition-all"
                  >
                    {ui.events.visitProviderCta}
                    <ArrowUpRight size={13} strokeWidth={2.5} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
  allLabel: string
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-ink/50 dark:text-white/50 mb-2 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm outline-none focus:border-[#22D3EE] text-ink dark:text-white"
      >
        <option value="">{allLabel}</option>
        {options.map(([key, l]) => (
          <option key={key} value={key}>
            {l}
          </option>
        ))}
      </select>
    </div>
  )
}

function Rail({
  title,
  events,
  router,
  icon,
}: {
  title: string
  events: EventRecord[]
  router: ReturnType<typeof useRouter>
  icon?: React.ReactNode
}) {
  return (
    <div className="mb-10">
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40 mb-4">
        {icon}
        {title}
      </p>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {events.map((event) => (
          <div key={event.id} className="w-64 shrink-0">
            <EventCard event={event} onClick={() => router.push(`/dashboard/world/events/${event.id}`)} />
          </div>
        ))}
      </div>
    </div>
  )
}
