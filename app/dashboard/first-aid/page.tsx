'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

interface TopicItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  description?: string;
  image_url?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  rianimazione: 'Rianimazione',
  neurologico: 'Neurologico',
  cardiovascolare: 'Cardiovascolare',
  allergologico: 'Allergologico',
  trauma: 'Trauma',
  ambientale: 'Ambientale',
  tossicologico: 'Tossicologico',
  organizzazione: 'Organizzazione',
};

const ACCENT = {
  gradient: 'linear-gradient(90deg, #EF4444 0%, #F97316 100%)',
  solid: '#EF4444',
};

export default function FirstAidPage() {
  const router = useRouter();

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (hasFetched) return;
    const fetchTopics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/first-aid/topics');
        if (!res.ok) throw new Error('Errore nel recupero degli argomenti');
        const data = await res.json();
        setTopics(data.topics ?? []);
        setHasFetched(true);
      } catch (err) {
        setError('Impossibile caricare gli argomenti di primo soccorso.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [hasFetched]);

  const categories = Array.from(new Set(topics.map((t) => t.category))).filter(Boolean);
  const filteredTopics =
    categoryFilter === 'all' ? topics : topics.filter((t) => t.category === categoryFilter);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, rgba(249,115,22,0.5) 100%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT.solid }} />
            First Aid Atlas
          </div>
          <h1 className="font-display text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[#EF4444] to-[#F97316] bg-clip-text text-transparent">
              Primo Soccorso
            </span>
          </h1>
          <p className="text-sm text-ink/50 dark:text-white/50 mt-4 max-w-xl mx-auto">
            Protocolli confrontati tra Italia, Francia, Regno Unito, Spagna e USA — perché le linee guida non sono sempre le stesse ovunque.
          </p>
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-10">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              categoryFilter === 'all'
                ? 'text-white'
                : 'text-ink/60 dark:text-white/60 border border-black/[0.08] dark:border-white/10 hover:text-ink dark:hover:text-white'
            }`}
            style={categoryFilter === 'all' ? { background: ACCENT.gradient } : undefined}
          >
            Tutti
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                categoryFilter === c
                  ? 'text-white'
                  : 'text-ink/60 dark:text-white/60 border border-black/[0.08] dark:border-white/10 hover:text-ink dark:hover:text-white'
              }`}
              style={categoryFilter === c ? { background: ACCENT.gradient } : undefined}
            >
              {CATEGORY_LABEL[c] ?? c}
            </button>
          ))}
        </div>

        {loading && <p className="text-center text-sm text-ink/40 dark:text-white/40">Caricamento argomenti...</p>}
        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="grid sm:grid-cols-2 gap-5">
            {filteredTopics.map((topic, i) => (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/dashboard/first-aid/${topic.slug}`)}
                className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-[#EF4444]/40 transition-colors"
              >
                {topic.image_url && (
                  <div className="w-full aspect-[16/9] bg-[#08090b] overflow-hidden">
                    <img
                      src={topic.image_url}
                      alt={topic.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5">
                  <span
                    className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white mb-2"
                    style={{ background: ACCENT.gradient }}
                  >
                    {CATEGORY_LABEL[topic.category] ?? topic.category}
                  </span>
                  <p className="text-sm font-semibold text-ink dark:text-white">{topic.name}</p>
                  {topic.description && (
                    <p className="text-xs text-ink/50 dark:text-white/50 mt-2 leading-relaxed line-clamp-2">
                      {topic.description}
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}