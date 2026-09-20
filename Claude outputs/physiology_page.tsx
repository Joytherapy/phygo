'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import { X, Search } from 'lucide-react';
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext';
import { useSearchParams } from 'next/navigation';

type SystemView = 'muscular' | 'neurological' | 'cellular';

interface ConceptItem {
  id: number;
  slug: string;
  system: SystemView;
  category: string;
  name: string;
  explanation?: string;
  clinical_relevance?: string;
  diagram_image?: string | null;
}

const ACCENT = {
  gradient: 'linear-gradient(90deg, #A78BFA 0%, #6366F1 100%)',
  solid: '#818CF8',
};

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

const MUSCULAR_CATEGORY_ORDER = [
  'contraction_mechanics',
  'fiber_types',
  'mechanics',
  'motor_control',
  'neuromuscular',
  'smooth_cardiac',
  'exercise_adaptation',
] as const;

const NEURO_CATEGORY_ORDER = [
  'cellular_basics',
  'reflexes',
  'sensory',
  'motor_control',
  'autonomic',
  'plasticity',
] as const;

const CELLULAR_CATEGORY_ORDER = [
  'homeostasis',
  'membrane_transport',
  'energy_metabolism',
  'chemical_messengers',
] as const;

export default function PhysiologyPage() {
  return (
    <Suspense fallback={null}>
      <PhysiologyPageInner />
    </Suspense>
  );
}

function PhysiologyPageInner() {
  const { lang } = useLanguage();
  const ui = useUiStrings();
  const searchParams = useSearchParams();
  const sysParam = searchParams.get('system');
  const initialSystem: SystemView =
    sysParam === 'neurological' ? 'neurological' : sysParam === 'cellular' ? 'cellular' : 'muscular';

  const [system, setSystem] = useState<SystemView>(initialSystem);
  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<{ file: string; label: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchConcepts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/physiology?system=${system}&lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero dei contenuti');
        const data = await res.json();
        setConcepts(data.concepts ?? []);
      } catch (err) {
        setError(ui.physiology.errorLoading);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConcepts();
  }, [system, lang, ui]);

  useEffect(() => {
    setSearchQuery('');
  }, [system]);

  const categoryOrder =
    system === 'muscular' ? MUSCULAR_CATEGORY_ORDER : system === 'neurological' ? NEURO_CATEGORY_ORDER : CELLULAR_CATEGORY_ORDER;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesQuery = (c: ConceptItem) =>
    normalizedQuery === '' ||
    c.name.toLowerCase().includes(normalizedQuery) ||
    (c.explanation ?? '').toLowerCase().includes(normalizedQuery) ||
    (c.clinical_relevance ?? '').toLowerCase().includes(normalizedQuery);
  const hasAnyMatch = concepts.some(matchesQuery);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(167,139,250,0.6) 0%, rgba(99,102,241,0.5) 100%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT.gradient }} />
            {ui.physiology.atlasBadge}
          </div>
          <h1 className="font-display text-6xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: ACCENT.gradient }}>
              {ui.physiology.heading}
            </span>
          </h1>
          <p className="text-sm text-ink/50 dark:text-white/50 mt-4 max-w-xl mx-auto leading-relaxed">
            {ui.physiology.sectionHint}
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex flex-wrap justify-center rounded-full border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-1">
            {(['muscular', 'neurological', 'cellular'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSystem(s)}
                className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  system === s ? 'text-white' : 'text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white'
                }`}
                style={system === s ? { background: ACCENT.solid } : undefined}
              >
                {ui.physiology.systemTabs[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-md mx-auto mb-10 relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30 dark:text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={ui.librarySearchPlaceholder}
            className="w-full pl-11 pr-10 py-2.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-sm text-ink dark:text-white placeholder:text-ink/30 dark:placeholder:text-white/30 focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-ink/30 dark:text-white/30 hover:text-ink dark:hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {loading && <p className="text-sm text-ink/40 dark:text-white/40 text-center">{ui.physiology.loading}</p>}
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {!loading && !error && normalizedQuery !== '' && !hasAnyMatch && (
          <p className="text-sm text-ink/40 dark:text-white/40 text-center">{ui.librarySearchNoResults}</p>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            {categoryOrder.map((cat) => {
              const items = concepts.filter((c) => c.category === cat && matchesQuery(c));
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: ACCENT.solid }}>
                    {ui.physiology.categoryLabels[cat as keyof typeof ui.physiology.categoryLabels] ?? cat}
                  </h3>
                  <div className="space-y-3">
                    {items.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden"
                      >
                        {c.diagram_image && (
                          <button
                            onClick={() => setExpandedImage({ file: c.diagram_image as string, label: c.name })}
                            className="group relative w-full bg-[#08090b] overflow-hidden block"
                          >
                            <img
                              src={`${IMAGE_BASE}/${c.diagram_image}`}
                              alt={c.name}
                              className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                            />
                          </button>
                        )}
                        <div className="p-5">
                          <p className="text-sm font-semibold text-ink dark:text-white mb-3">{c.name}</p>
                          {c.explanation && (
                            <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-3">
                              {c.explanation}
                            </p>
                          )}
                          {c.clinical_relevance && (
                            <div
                              className="rounded-xl p-3"
                              style={{ background: `${ACCENT.solid}0D`, border: `1px solid ${ACCENT.solid}33` }}
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: ACCENT.solid }}>
                                {ui.physiology.clinicalRelevanceLabel}
                              </p>
                              <p className="text-xs text-ink/70 dark:text-white/70 leading-relaxed">
                                {c.clinical_relevance}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setExpandedImage(null)}
        >
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} />
          </button>
          <img
            src={`${IMAGE_BASE}/${expandedImage.file}`}
            alt={expandedImage.label}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
