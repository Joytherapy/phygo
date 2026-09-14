'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { buildConditionPath, type Lang } from '@/lib/publicLibrary';

type ConditionSummary = { id: number; condition_name: string };

const PLACEHOLDER: Record<Lang, string> = {
  it: 'Cerca una condizione (es. tendinopatia, ictus, linfedema...)',
  en: 'Search a condition (e.g. tendinopathy, stroke, lymphedema...)',
  es: 'Busca una condición (p. ej. tendinopatía, ictus, linfedema...)',
  fr: 'Recherchez une pathologie (ex. tendinopathie, AVC, lymphœdème...)',
};

const NO_RESULTS: Record<Lang, string> = {
  it: 'Nessuna condizione trovata.',
  en: 'No condition found.',
  es: 'No se ha encontrado ninguna condición.',
  fr: 'Aucune pathologie trouvée.',
};

export default function ConditionSearchList({
  items,
  lang = 'it',
}: {
  items: ConditionSummary[];
  lang?: Lang;
}) {
  const [query, setQuery] = useState('');
  const placeholder = PLACEHOLDER[lang];
  const noResultsText = NO_RESULTS[lang];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.condition_name.toLowerCase().includes(q));
  }, [items, query]);

  const grouped = useMemo(() => {
    const groups: Record<string, ConditionSummary[]> = {};
    for (const c of filtered) {
      const letter = c.condition_name[0]?.toUpperCase() || '#';
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(c);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div>
      <div className="relative mb-10 max-w-md">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] pl-11 pr-4 py-3 text-sm text-ink dark:text-white placeholder:text-ink/40 dark:placeholder:text-white/40 outline-none focus:border-[#4F7CFF]/40"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink/40 dark:text-white/40">{noResultsText}</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([letter, conditions]) => (
            <div key={letter}>
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#4F7CFF] mb-3">{letter}</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {conditions.map((c) => (
                  <a
                    key={c.id}
                    href={buildConditionPath(c.id, c.condition_name, lang)}
                    className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] px-4 py-3 text-sm font-medium text-ink/80 dark:text-white/80 hover:border-[#4F7CFF]/40 hover:text-ink dark:hover:text-white transition-colors"
                  >
                    {c.condition_name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
