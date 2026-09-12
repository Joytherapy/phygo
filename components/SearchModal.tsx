'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  title: string;
  section: string;
  sectionLabel: string;
  href: string;
  subtitle?: string;
}

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.sectionLabel] ??= []).push(r);
    return acc;
  }, {});

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 sm:pt-32 z-[100] px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: -8 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#0e0f12] border border-black/[0.06] dark:border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06] dark:border-white/10">
              <Search size={18} className="text-ink/40 dark:text-white/40 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca tecniche, patologie, procedure..."
                className="flex-1 bg-transparent outline-none text-sm text-ink dark:text-white placeholder:text-ink/40 dark:placeholder:text-white/40"
              />
              {loading && <Loader2 size={16} className="animate-spin text-ink/30 dark:text-white/30" />}
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {query.trim().length < 2 && (
                <p className="text-center text-sm text-ink/40 dark:text-white/40 py-10">
                  Scrivi almeno 2 caratteri per cercare
                </p>
              )}
              {query.trim().length >= 2 && !loading && results.length === 0 && (
                <p className="text-center text-sm text-ink/40 dark:text-white/40 py-10">
                  Nessun risultato per &quot;{query}&quot;
                </p>
              )}
              {Object.entries(grouped).map(([sectionLabel, items]) => (
                <div key={sectionLabel} className="mb-2">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">
                    {sectionLabel}
                  </p>
                  {items.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r.href)}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="text-sm text-ink dark:text-white">{r.title}</span>
                      {r.subtitle && (
                        <span className="text-xs text-ink/40 dark:text-white/40 shrink-0">{r.subtitle}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}