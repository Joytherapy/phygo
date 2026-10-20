'use client'

// Picks exercises from the Exercises section (/api/exercise-library/list) for
// the home programme editor. Exercises already linked to this patient from the
// Exercises section (patient_clinical_references) are listed first. Only the
// name, the steps and the exercise id are taken (lib/care/program.ts,
// draftFromLibraryExercise): the dose is the clinician's to set.
import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Check, Search, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { lazy } from '@/lib/lazy'
import { CARE_STRINGS } from '@/lib/i18n/careStrings'
import { PRIMARY_BTN, SECONDARY_BTN } from '@/components/ui/premium'

const supabase = lazy(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!))

export type LibraryExercise = {
  id: string
  name: string
  instructions: string[] | null
  primary_muscle: string | null
  body_region: string | null
  equipment: string[] | null
  category: string | null
  tags: string[] | null
  image_start_url: string | null
}

const SHOWN = 30
// The list is large and the same for every patient: kept for the page's lifetime,
// below the 30-minute life of its signed image links.
const cache = new Map<string, { at: number; exercises: LibraryExercise[] }>()
const CACHE_MS = 20 * 60 * 1000

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const haystack = (e: LibraryExercise) => fold([e.name, e.primary_muscle, e.body_region, e.category, ...(e.equipment ?? []), ...(e.tags ?? [])].filter(Boolean).join(' '))

export default function LibraryExercisePicker({ patientId, excludeIds, onAdd, onClose }: { patientId: string; excludeIds: string[]; onAdd: (exercises: LibraryExercise[]) => void; onClose: () => void }) {
  const { lang } = useLanguage()
  const dict = CARE_STRINGS[lang] ?? CARE_STRINGS.it
  const t = dict.library
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading')
  const [exercises, setExercises] = useState<LibraryExercise[]>([])
  const [linkedIds, setLinkedIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setState('loading')
      const cached = cache.get(lang)
      const listPromise = cached && Date.now() - cached.at < CACHE_MS
        ? Promise.resolve(cached.exercises)
        : fetch(`/api/exercise-library/list?lang=${lang}`, { cache: 'no-store' }).then(async (r) => {
            if (!r.ok) throw new Error(`list ${r.status}`)
            const list = ((await r.json()).exercises ?? []) as LibraryExercise[]
            cache.set(lang, { at: Date.now(), exercises: list })
            return list
          })
      const linkedPromise = supabase
        .from('patient_clinical_references')
        .select('content_id, created_at')
        .eq('patient_id', patientId)
        .eq('content_type', 'exercise')
        .order('created_at', { ascending: false })
      try {
        const [list, linked] = await Promise.all([listPromise, linkedPromise])
        if (cancelled) return
        if (linked.error) console.error('library picker: linked exercises failed:', linked.error.code)
        setExercises(list)
        setLinkedIds(Array.from(new Set(((linked.data ?? []) as { content_id: string }[]).map((r) => String(r.content_id)))))
        setState('ready')
      } catch (err) {
        if (cancelled) return
        console.error('library picker: list failed:', err instanceof Error ? err.message : 'error')
        setState('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [lang, patientId, attempt])

  const available = useMemo(() => exercises.filter((e) => !excludeIds.includes(e.id)), [exercises, excludeIds])
  const linked = useMemo(() => linkedIds.map((id) => available.find((e) => e.id === id)).filter((e): e is LibraryExercise => !!e), [linkedIds, available])
  const matches = useMemo(() => {
    const words = fold(query).split(/\s+/).filter(Boolean)
    if (words.length === 0) return available
    return available.filter((e) => {
      const text = haystack(e)
      return words.every((w) => text.includes(w))
    })
  }, [query, available])

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const add = () => {
    onAdd(picked.map((id) => exercises.find((e) => e.id === id)).filter((e): e is LibraryExercise => !!e))
    setPicked([])
  }

  const row = (e: LibraryExercise) => {
    const on = picked.includes(e.id)
    const meta = [e.primary_muscle, e.body_region, ...(e.equipment ?? []).filter((x) => x && x.toLowerCase() !== 'none').slice(0, 1)].filter(Boolean).join(' · ')
    return (
      <li key={e.id}>
        <label data-testid="care-library-option" className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${on ? 'border-[#7C83FF]/60 bg-[#7C83FF]/[0.06]' : 'border-black/[0.06] hover:bg-black/[0.02] dark:border-white/[0.08] dark:hover:bg-white/[0.03]'}`}>
          <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(e.id)} />
          <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? 'border-[#7C83FF] bg-[#7C83FF] text-white' : 'border-black/20 dark:border-white/25'}`}>
            {on && <Check size={13} />}
          </span>
          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-black/[0.04] dark:bg-white/[0.06]">
            {e.image_start_url && <img src={e.image_start_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink dark:text-white">{e.name}</span>
            {meta && <span className="block truncate text-xs capitalize text-ink/50 dark:text-white/40">{meta}</span>}
          </span>
        </label>
      </li>
    )
  }

  // Without a search, the linked exercises are listed once, above the rest.
  const list = query.trim() ? matches : available.filter((e) => !linkedIds.includes(e.id))
  return (
    <div role="group" aria-labelledby="care-library-title" data-testid="care-library-picker" className="rounded-2xl border border-[#7C83FF]/25 bg-[#7C83FF]/[0.03] p-4 dark:border-[#7C83FF]/30 dark:bg-[#7C83FF]/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p id="care-library-title" className="text-sm font-bold text-ink dark:text-white">{t.title}</p>
          <p className="mt-0.5 text-xs text-ink/55 dark:text-white/45">{t.hint}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t.close} className="rounded-full p-1.5 text-ink/50 hover:bg-black/[0.05] dark:text-white/50 dark:hover:bg-white/[0.06]">
          <X size={16} aria-hidden />
        </button>
      </div>

      {state === 'loading' && <p className="mt-4 text-sm text-ink/50 dark:text-white/40">{t.loading}</p>}
      {state === 'error' && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {t.loadError}{' '}
          <button type="button" onClick={() => setAttempt((a) => a + 1)} className="font-semibold underline">{dict.clinician.retry}</button>
        </p>
      )}

      {state === 'ready' && (
        <>
          <label className="relative mt-3 block">
            <span className="sr-only">{t.search}</span>
            <Search size={15} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/35" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder:text-ink/35 focus:border-[#7C83FF]/60 focus:outline-none focus:ring-2 focus:ring-[#7C83FF]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/30"
            />
          </label>

          <div className="mt-3 max-h-[420px] space-y-4 overflow-y-auto pr-1">
            {!query.trim() && linked.length > 0 && (
              <div data-testid="care-library-linked">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/50 dark:text-white/40">{t.linked}</p>
                <ul className="space-y-1.5">{linked.map(row)}</ul>
              </div>
            )}
            <div>
              {!query.trim() && linked.length > 0 && <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/50 dark:text-white/40">{t.all}</p>}
              {list.length === 0 ? (
                <p className="text-sm text-ink/55 dark:text-white/45">{t.noResults}</p>
              ) : (
                <ul className="space-y-1.5" data-testid="care-library-results">{list.slice(0, SHOWN).map(row)}</ul>
              )}
              {list.length > SHOWN && <p className="mt-2 text-xs text-ink/50 dark:text-white/40">{t.more(list.length - SHOWN)}</p>}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" disabled={picked.length === 0} onClick={add} className={`inline-flex min-h-[40px] items-center rounded-full px-4 text-sm font-semibold disabled:opacity-50 ${PRIMARY_BTN}`}>
              {t.add(picked.length)}
            </button>
            <button type="button" onClick={onClose} className={`inline-flex min-h-[40px] items-center rounded-full px-4 text-sm font-semibold ${SECONDARY_BTN}`}>{t.close}</button>
            {picked.length > 0 && <span className="text-xs text-ink/55 dark:text-white/45">{t.selected(picked.length)}</span>}
          </div>
        </>
      )}
    </div>
  )
}
