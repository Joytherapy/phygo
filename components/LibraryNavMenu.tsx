'use client'

// The "Library" nav dropdown's content — split out of Navbar.tsx because it
// grew from a flat list of ~16 macro-sections into something too long to
// scroll comfortably (desktop dropdown AND mobile menu both had the same
// problem). Same 16 sections, same hrefs, same ui.libraryLinks[key] labels
// from the existing i18n dict — just grouped into 3 collapsible categories
// with a search box on top, instead of one long flat list. Nothing about
// what a section IS or where it links changed, only how it's browsed.

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import { useUiStrings } from '@/contexts/LanguageContext'
import { useLibraryNavUi } from '@/lib/i18n/libraryNavStrings'

// Unchanged from the previous flat Navbar.tsx declaration — same keys, same
// hrefs. Owned here now since this is the only place that uses it.
export const libraryLinkHrefs = [
  { key: 'bodyMap', href: '/dashboard/body-map' },
  { key: 'neurology', href: '/dashboard/brain-map' },
  { key: 'physiology', href: '/dashboard/physiology' },
  { key: 'sportsMedicine', href: '/dashboard/sports-medicine' },
  { key: 'pelvicFloor', href: '/dashboard/pelvic-floor' },
  { key: 'cardiopulmonary', href: '/dashboard/cardiopulmonary' },
  { key: 'endocrine', href: '/dashboard/endocrine' },
  { key: 'fascia', href: '/dashboard/fascia' },
  { key: 'urinary', href: '/dashboard/urinary' },
  { key: 'gastrointestinal', href: '/dashboard/gastrointestinal' },
  { key: 'immune', href: '/dashboard/immune' },
  { key: 'hematology', href: '/dashboard/hematology' },
  { key: 'oncology', href: '/dashboard/oncology' },
  { key: 'firstAid', href: '/dashboard/first-aid' },
  { key: 'blsd', href: '/dashboard/bls' },
  { key: 'clinicalTools', href: '/dashboard/clinical-tools' },
] as const

type LibraryLinkKey = (typeof libraryLinkHrefs)[number]['key']

// A purely presentational grouping — doesn't touch any table or route, just
// how the 16 existing sections are bucketed in this one menu.
const LIBRARY_CATEGORIES: { id: 'bodySystems' | 'anatomyMovement' | 'emergencyTools'; keys: LibraryLinkKey[] }[] = [
  {
    id: 'bodySystems',
    keys: ['cardiopulmonary', 'endocrine', 'urinary', 'gastrointestinal', 'immune', 'hematology', 'oncology', 'pelvicFloor'],
  },
  { id: 'anatomyMovement', keys: ['bodyMap', 'neurology', 'physiology', 'fascia', 'sportsMedicine'] },
  { id: 'emergencyTools', keys: ['firstAid', 'blsd', 'clinicalTools'] },
]

export default function LibraryNavMenu({ variant, onNavigate }: { variant: 'desktop' | 'mobile'; onNavigate?: () => void }) {
  const ui = useUiStrings()
  const navUi = useLibraryNavUi()
  const [search, setSearch] = useState('')
  // All categories start CLOSED (per user request — the user opens only the
  // one they need, instead of the first category always taking up space); a
  // search temporarily force-opens whichever categories actually match,
  // without disturbing this saved state once the search is cleared again.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set<string>())

  const linksByKey = useMemo(
    () => Object.fromEntries(libraryLinkHrefs.map((l) => [l.key, l])) as Record<LibraryLinkKey, (typeof libraryLinkHrefs)[number]>,
    []
  )

  const query = search.trim().toLowerCase()
  const isSearching = query.length > 0

  const matches = (key: LibraryLinkKey) => {
    if (!isSearching) return true
    const entry = ui.libraryLinks[key]
    return entry.label.toLowerCase().includes(query) || entry.description.toLowerCase().includes(query)
  }

  const toggleCategory = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const anyMatch = LIBRARY_CATEGORIES.some((cat) => cat.keys.some(matches))

  return (
    <div className={variant === 'desktop' ? 'w-72' : 'w-full'}>
      <div className="relative mb-2">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={navUi.searchPlaceholder}
          className="w-full rounded-lg border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/5 pl-8 pr-3 py-1.5 text-xs text-ink dark:text-white placeholder:text-ink/30 dark:placeholder:text-white/30 outline-none focus:border-[#4F7CFF]/40 transition-colors"
        />
      </div>

      <div className={variant === 'desktop' ? 'max-h-[65vh] overflow-y-auto pr-0.5' : ''}>
        {LIBRARY_CATEGORIES.map((cat) => {
          const categoryKeys = cat.keys.filter(matches)
          if (isSearching && categoryKeys.length === 0) return null
          const isOpen = isSearching || expanded.has(cat.id)

          return (
            <div key={cat.id} className="mb-1">
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40 hover:text-ink/70 dark:hover:text-white/70 transition-colors"
              >
                {navUi.categories[cat.id]}
                <ChevronDown size={11} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    {categoryKeys.map((key) => {
                      const l = linksByKey[key]
                      return (
                        <a
                          key={l.href}
                          href={l.href}
                          onClick={onNavigate}
                          className={
                            variant === 'desktop'
                              ? 'block rounded-xl px-3 py-2.5 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors'
                              : 'block py-1.5 pl-3'
                          }
                        >
                          <p
                            className={
                              variant === 'desktop'
                                ? 'text-sm font-semibold text-ink dark:text-white'
                                : 'text-sm font-medium text-ink/80 dark:text-white/80'
                            }
                          >
                            {ui.libraryLinks[key].label}
                          </p>
                          {variant === 'desktop' && (
                            <p className="text-xs text-ink/50 dark:text-white/50 mt-0.5">{ui.libraryLinks[key].description}</p>
                          )}
                        </a>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
        {isSearching && !anyMatch && <p className="px-3 py-2 text-xs text-ink/40 dark:text-white/40">{navUi.noResults}</p>}
      </div>
    </div>
  )
}
