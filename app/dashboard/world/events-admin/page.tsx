'use client'

import { useEffect, useState } from 'react'
import { Plus, Check, X, Star, Trash2, Pencil, Ban } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext'
import { useAdminStrings } from '@/lib/i18n/adminStrings'
import { localeForLang } from '@/lib/i18n/agendaStrings'

interface AdminEvent {
  id: string
  title: string
  description: string | null
  event_type: string
  category: string
  location_type: 'online' | 'in_person' | 'hybrid'
  country: string | null
  city: string | null
  start_date: string
  official_url: string | null
  registration_url: string | null
  is_free: boolean
  price: number | null
  currency: string | null
  status: string
  verification_status: 'unverified' | 'source_verified' | 'organizer_verified' | 'phygo_verified'
  moderation_status: 'pending_review' | 'approved' | 'rejected'
  is_featured: boolean
}

const emptyForm = () => ({
  id: undefined as string | undefined,
  title: '',
  description: '',
  event_type: 'conference',
  category: 'physiotherapy',
  location_type: 'in_person' as 'online' | 'in_person' | 'hybrid',
  country: '',
  city: '',
  start_date: '',
  official_url: '',
  registration_url: '',
  is_free: false,
  price: '',
  currency: 'EUR',
})

// Admin queue + manual event creation/editing, modeled on
// app/dashboard/science-admin/page.tsx. There is no automated discovery
// source wired up yet (Phase 10 is architecture-only for now), so this is
// how events get into the system today.
export default function EventsAdminPage() {
  const ui = useUiStrings()
  const { lang } = useLanguage()
  const a = useAdminStrings()
  const t = a.events
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'pending_review' | 'all'>('pending_review')

  const load = () => {
    setLoading(true)
    fetch('/api/events/admin')
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const patch = async (id: string, body: Record<string, unknown>) => {
    setProcessingId(id)
    try {
      await fetch(`/api/events/admin/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      load()
    } finally {
      setProcessingId(null)
    }
  }

  const remove = async (id: string) => {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/events/admin/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        alert(res.status === 403 || res.status === 401 ? a.common.adminOnly : t.deleteError)
        return
      }
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } finally {
      setProcessingId(null)
    }
  }

  const startEdit = (e: AdminEvent) => {
    setForm({
      id: e.id,
      title: e.title,
      description: e.description || '',
      event_type: e.event_type,
      category: e.category,
      location_type: e.location_type,
      country: e.country || '',
      city: e.city || '',
      start_date: e.start_date ? e.start_date.slice(0, 16) : '',
      official_url: e.official_url || '',
      registration_url: e.registration_url || '',
      is_free: e.is_free,
      price: e.price != null ? String(e.price) : '',
      currency: e.currency || 'EUR',
    })
    setShowForm(true)
  }

  const submitForm = async () => {
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        event_type: form.event_type,
        category: form.category,
        location_type: form.location_type,
        country: form.country || null,
        city: form.city || null,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        official_url: form.official_url || null,
        registration_url: form.registration_url || null,
        is_free: form.is_free,
        price: form.price ? Number(form.price) : null,
        currency: form.currency || null,
      }
      if (form.id) {
        await fetch(`/api/events/admin/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/events/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setForm(emptyForm())
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const shown = filter === 'pending_review' ? events.filter((e) => e.moderation_status === 'pending_review') : events

  return (
    <div className="relative min-h-screen bg-[#f7f7f8] dark:bg-[#050608] overflow-hidden transition-colors">
      <Navbar />

      <div className="relative max-w-4xl mx-auto pt-40 pb-24 px-6">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#8B95FF] mb-3">{a.common.eyebrow}</p>
        <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white">
            {t.title}
          </h1>
          <button
            onClick={() => {
              setForm(emptyForm())
              setShowForm((s) => !s)
            }}
            className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ background: 'linear-gradient(90deg, #8B95FF 0%, #A78BFA 100%)' }}
          >
            <Plus size={14} />
            {form.id ? t.editEvent : t.addEvent}
          </button>
        </div>

        {showForm && (
          <div className="rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] p-5 mb-8 grid sm:grid-cols-2 gap-3">
            <input
              placeholder={t.titlePh}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="sm:col-span-2 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm outline-none focus:border-[#8B95FF] text-ink dark:text-white"
            />
            <textarea
              placeholder={t.descriptionPh}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="sm:col-span-2 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm outline-none focus:border-[#8B95FF] text-ink dark:text-white"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm outline-none focus:border-[#8B95FF] text-ink dark:text-white"
            >
              {Object.entries(ui.events.categoryLabels).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
            <select
              value={form.event_type}
              onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
              className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm outline-none focus:border-[#8B95FF] text-ink dark:text-white"
            >
              {Object.entries(ui.events.typeLabels).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
            <select
              value={form.location_type}
              onChange={(e) => setForm((f) => ({ ...f, location_type: e.target.value as 'online' | 'in_person' | 'hybrid' }))}
              className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm outline-none focus:border-[#8B95FF] text-ink dark:text-white"
            >
              <option value="online">{ui.events.onlineLabel}</option>
              <option value="in_person">{ui.events.inPersonLabel}</option>
              <option value="hybrid">{ui.events.hybridLabel}</option>
            </select>
            <input
              type="datetime-local"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm outline-none focus:border-[#8B95FF] text-ink dark:text-white"
            />
            <input
              placeholder={t.cityPh}
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm outline-none focus:border-[#8B95FF] text-ink dark:text-white"
            />
            <input
              placeholder={t.countryPh}
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm outline-none focus:border-[#8B95FF] text-ink dark:text-white"
            />
            <input
              placeholder={t.officialUrlPh}
              value={form.official_url}
              onChange={(e) => setForm((f) => ({ ...f, official_url: e.target.value }))}
              className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm outline-none focus:border-[#8B95FF] text-ink dark:text-white"
            />
            <input
              placeholder={t.registrationUrlPh}
              value={form.registration_url}
              onChange={(e) => setForm((f) => ({ ...f, registration_url: e.target.value }))}
              className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm outline-none focus:border-[#8B95FF] text-ink dark:text-white"
            />
            <label className="flex items-center gap-2 text-sm text-ink/70 dark:text-white/70">
              <input type="checkbox" checked={form.is_free} onChange={(e) => setForm((f) => ({ ...f, is_free: e.target.checked }))} />
              {ui.events.freeLabel}
            </label>
            {!form.is_free && (
              <div className="flex gap-2">
                <input
                  placeholder={t.pricePh}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="flex-1 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm outline-none focus:border-[#8B95FF] text-ink dark:text-white"
                />
                <input
                  placeholder={t.currencyPh}
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className="w-24 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] px-3 py-2.5 text-sm outline-none focus:border-[#8B95FF] text-ink dark:text-white"
                />
              </div>
            )}
            <div className="sm:col-span-2 flex justify-end gap-2 mt-1">
              <button
                onClick={() => {
                  setShowForm(false)
                  setForm(emptyForm())
                }}
                className="rounded-full px-4 py-2 text-xs font-semibold text-ink/60 dark:text-white/60"
              >
                {a.common.cancel}
              </button>
              <button
                onClick={submitForm}
                disabled={saving || !form.title || !form.start_date}
                className="rounded-full px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(90deg, #8B95FF 0%, #A78BFA 100%)' }}
              >
                {saving ? '…' : form.id ? t.saveChanges : t.create}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('pending_review')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${filter === 'pending_review' ? 'text-white bg-gradient-to-r from-[#8B95FF] to-[#A78BFA]' : 'text-ink/60 dark:text-white/60 bg-black/[0.04] dark:bg-white/5'}`}
          >
            {t.pendingReview(events.filter((e) => e.moderation_status === 'pending_review').length)}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${filter === 'all' ? 'text-white bg-gradient-to-r from-[#8B95FF] to-[#A78BFA]' : 'text-ink/60 dark:text-white/60 bg-black/[0.04] dark:bg-white/5'}`}
          >
            {t.all(events.length)}
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-ink/60 dark:text-white/50">{ui.events.loadingEvents}</p>
        ) : shown.length === 0 ? (
          <div className="rounded-[28px] border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.03] backdrop-blur-xl p-10 text-center">
            <p className="text-sm text-ink/60 dark:text-white/50">{a.common.nothingHere}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {shown.map((event) => (
              <div key={event.id} className="rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] p-5">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60">
                    {t.moderation[event.moderation_status] ?? event.moderation_status}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60">
                    {ui.events.categoryLabels[event.category as keyof typeof ui.events.categoryLabels] || event.category}
                  </span>
                  {event.is_featured && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 flex items-center gap-1">
                      <Star size={10} /> {t.featured}
                    </span>
                  )}
                </div>

                <h2 className="text-base font-semibold text-ink dark:text-white mb-1">{event.title}</h2>
                <p className="text-xs text-ink/60 dark:text-white/50 mb-4">
                  {new Date(event.start_date).toLocaleDateString(localeForLang(lang))} · {event.city || event.country || (event.location_type === 'online' ? ui.events.onlineLabel : event.location_type === 'hybrid' ? ui.events.hybridLabel : ui.events.inPersonLabel)}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  {event.moderation_status === 'pending_review' && (
                    <>
                      <ActionButton icon={<Check size={12} />} label={a.common.approve} onClick={() => patch(event.id, { moderation_status: 'approved' })} disabled={processingId === event.id} tone="positive" />
                      <ActionButton icon={<X size={12} />} label={a.common.reject} onClick={() => patch(event.id, { moderation_status: 'rejected' })} disabled={processingId === event.id} tone="negative" />
                    </>
                  )}
                  <ActionButton
                    icon={<Star size={12} />}
                    label={event.is_featured ? t.unfeature : t.feature}
                    onClick={() => patch(event.id, { is_featured: !event.is_featured })}
                    disabled={processingId === event.id}
                  />
                  <select
                    value={event.verification_status}
                    onChange={(e) => patch(event.id, { verification_status: e.target.value })}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold bg-black/[0.04] dark:bg-white/5 text-ink/70 dark:text-white/70 outline-none"
                  >
                    {Object.entries(ui.events.verificationLabels).map(([k, l]) => (
                      <option key={k} value={k}>{l}</option>
                    ))}
                  </select>
                  <ActionButton
                    icon={<Ban size={12} />}
                    label={event.status === 'cancelled' ? t.restore : t.markCancelled}
                    onClick={() => patch(event.id, { status: event.status === 'cancelled' ? 'upcoming' : 'cancelled' })}
                    disabled={processingId === event.id}
                  />
                  <ActionButton icon={<Pencil size={12} />} label={a.common.edit} onClick={() => startEdit(event)} disabled={processingId === event.id} />
                  <ActionButton
                    icon={<Trash2 size={12} />}
                    label={a.common.delete}
                    onClick={() => remove(event.id)}
                    disabled={processingId === event.id}
                    tone="negative"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  tone,
  className,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: 'positive' | 'negative'
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-40 transition-colors ${
        tone === 'positive'
          ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
          : tone === 'negative'
          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
          : 'bg-black/[0.04] dark:bg-white/5 text-ink/70 dark:text-white/70 hover:bg-black/[0.07] dark:hover:bg-white/10'
      } ${className || ''}`}
    >
      {icon}
      {label}
    </button>
  )
}
