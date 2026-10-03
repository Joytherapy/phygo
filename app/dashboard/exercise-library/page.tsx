'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  X,
  PersonStanding,
  Weight,
  Waves,
  HeartPulse,
  Play,
  Layers,
  Search,
  Flame,
  ListChecks,
  CheckCircle2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext';
import ClinicalActionBar from '@/components/ClinicalActionBar';
import BulkPatientLinkBar from '@/components/BulkPatientLinkBar';

interface ExerciseEntry {
  id: string;
  name: string;
  instructions: string[] | null;
  tips: string | null;
  primary_muscle: string | null;
  secondary_muscles: string[] | null;
  equipment: string[] | null;
  category: string | null;
  subcategory: string | null;
  body_region: string | null;
  difficulty: string | null;
  tags: string[] | null;
  video_url: string | null;
  image_start_url: string | null;
  image_end_url: string | null;
}

/** Le 20 zone del Body Map (stesso slug/ordine/nome italiano usati in quella sezione),
 *  cosi' gli esercizi sono gia' pronti per essere collegati li' in futuro. */
const BODY_ZONES: { slug: string; name: string }[] = [
  { slug: 'cervical-spine', name: 'Rachide Cervicale' },
  { slug: 'shoulder', name: 'Spalla' },
  { slug: 'thoracic-spine', name: 'Rachide Toracico / Schiena Alta' },
  { slug: 'elbow', name: 'Gomito' },
  { slug: 'wrist-hand', name: 'Polso / Mano' },
  { slug: 'lumbar-spine', name: 'Rachide Lombare / Schiena Bassa' },
  { slug: 'hip', name: 'Anca' },
  { slug: 'knee', name: 'Ginocchio' },
  { slug: 'ankle-foot', name: 'Caviglia / Piede' },
  { slug: 'whole-body', name: 'Corpo Intero / Equilibrio e Andatura' },
  { slug: 'trapezius', name: 'Trapezio' },
  { slug: 'forearm', name: 'Avambraccio' },
  { slug: 'chest', name: 'Petto / Pettorali' },
  { slug: 'core-abdomen', name: 'Core / Addome' },
  { slug: 'glutes', name: 'Glutei' },
  { slug: 'quadriceps', name: 'Quadricipite' },
  { slug: 'hamstrings', name: 'Femorali' },
  { slug: 'calf', name: 'Polpaccio' },
  { slug: 'biceps', name: 'Bicipite' },
  { slug: 'triceps', name: 'Tricipite' },
];
const BODY_ZONE_NAME: Record<string, string> = Object.fromEntries(BODY_ZONES.map((z) => [z.slug, z.name]));

const CATEGORY_STYLE: Record<string, { gradient: string; glow: string; icon: typeof Dumbbell }> = {
  Bodyweight: { gradient: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)', glow: 'rgba(79,124,255,0.28)', icon: PersonStanding },
  'Free Weights': { gradient: 'linear-gradient(135deg, #A855F7 0%, #4F7CFF 100%)', glow: 'rgba(168,85,247,0.28)', icon: Weight },
  Resistance: { gradient: 'linear-gradient(135deg, #F59E0B 0%, #FB7185 100%)', glow: 'rgba(245,158,11,0.28)', icon: Waves },
  Cardio: { gradient: 'linear-gradient(135deg, #FB7185 0%, #A855F7 100%)', glow: 'rgba(251,113,133,0.28)', icon: HeartPulse },
};
const DEFAULT_STYLE = { gradient: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)', glow: 'rgba(79,124,255,0.28)', icon: Dumbbell };

// Per formattare i numeri (es. "1.880" vs "1,880") nello stesso stile della lingua corrente,
// non sempre con la convenzione italiana indipendentemente dalla lingua scelta.
const NUMBER_LOCALE: Record<string, string> = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR' };

// Etichetta trasversale "Cardio/HIIT": indipendente dall'attrezzo (category) e dalla zona del
// corpo (body_region) — un burpee a corpo libero e uno sprint sul tapis roulant hanno attrezzo e
// zona diversi, ma sono entrambi condizionamento cardio/HIIT. Colore volutamente distinto dalla
// categoria "Cardio" (che descrive solo l'attrezzo) per non confondere le due dimensioni.
const CARDIO_HIIT_TAG = 'cardio-hiit';
const CARDIO_HIIT_GRADIENT = 'linear-gradient(135deg, #FB923C 0%, #EF4444 100%)';

function styleFor(category: string | null) {
  if (!category) return DEFAULT_STYLE;
  return CATEGORY_STYLE[category] || DEFAULT_STYLE;
}

function CardSkeleton() {
  return (
    <div className="rounded-[24px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] overflow-hidden animate-pulse">
      <div className="h-40 bg-ink/5 dark:bg-white/5" />
      <div className="p-5 space-y-2">
        <div className="h-3 w-16 rounded-full bg-ink/10 dark:bg-white/10" />
        <div className="h-4 w-3/4 rounded-full bg-ink/10 dark:bg-white/10" />
        <div className="h-3 w-1/2 rounded-full bg-ink/10 dark:bg-white/10" />
      </div>
    </div>
  );
}

/** `instructions` è un array jsonb di step (uno per elemento) -> lista numerata leggibile. */
function StepList({ steps: rawSteps }: { steps: string[] }) {
  const steps = rawSteps
    .map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean);

  if (steps.length === 0) return null;

  if (steps.length === 1) {
    return <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed whitespace-pre-line">{steps[0]}</p>;
  }

  return (
    <ol className="space-y-2.5">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm text-ink/70 dark:text-white/70 leading-relaxed">
          <span
            className="flex-none mt-0.5 h-5 w-5 rounded-full text-[11px] font-bold text-white flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' }}
          >
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

type LibraryFilter =
  | { type: 'category' | 'muscle' | 'equipment' | 'region'; value: string }
  | { type: 'tag'; value: typeof CARDIO_HIIT_TAG }
  | null;

const PAGE_SIZE = 24;

export default function ExerciseLibraryPage() {
  const { lang } = useLanguage();
  const uiFull = useUiStrings();
  const ui = uiFull.exerciseLibraryPage;
  const numberLocale = NUMBER_LOCALE[lang] || 'en-US';
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openExercise, setOpenExercise] = useState<ExerciseEntry | null>(null);
  const [filter, setFilter] = useState<LibraryFilter>(null);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleSelectionMode() {
    setSelectionMode((v) => !v);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedItems = useMemo(
    () =>
      Array.from(selectedIds)
        .map((id) => exercises.find((ex) => ex.id === id))
        .filter((ex): ex is ExerciseEntry => !!ex)
        .map((ex) => ({ id: ex.id, label: ex.name })),
    [selectedIds, exercises]
  );

  function applyFilter(next: LibraryFilter) {
    // Click again on the same chip to clear it.
    setFilter((prev) => (prev && prev.type === next?.type && prev.value === next?.value ? null : next));
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    fetch(`/api/exercise-library/list?lang=${lang}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          setErrorMsg(ui.loginRequired);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || ui.loadError);
          setLoading(false);
          return;
        }
        setExercises(data.exercises || []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg(ui.networkError);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ex of exercises) {
      const key = ex.category || 'Altro';
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [exercises]);

  const cardioHiitCount = useMemo(
    () => exercises.filter((ex) => (ex.tags || []).includes(CARDIO_HIIT_TAG)).length,
    [exercises]
  );

  const regionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ex of exercises) {
      if (!ex.body_region) continue;
      counts.set(ex.body_region, (counts.get(ex.body_region) || 0) + 1);
    }
    // Ordine fisso come nel Body Map, non per conteggio: più facile da scorrere per chi cerca una zona precisa.
    return BODY_ZONES.filter((z) => counts.has(z.slug)).map((z) => ({ ...z, count: counts.get(z.slug) as number }));
  }, [exercises]);

  const equipmentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ex of exercises) {
      for (const eq of ex.equipment || []) {
        counts.set(eq, (counts.get(eq) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [exercises]);

  const searchQuery = search.trim().toLowerCase();

  const filteredExercises = useMemo(() => {
    let list = exercises;
    if (filter) {
      list = list.filter((ex) => {
        if (filter.type === 'category') return (ex.category || 'Altro') === filter.value;
        if (filter.type === 'muscle') {
          return ex.primary_muscle === filter.value || (ex.secondary_muscles || []).includes(filter.value);
        }
        if (filter.type === 'equipment') return (ex.equipment || []).includes(filter.value);
        if (filter.type === 'region') return ex.body_region === filter.value;
        if (filter.type === 'tag') return (ex.tags || []).includes(filter.value);
        return true;
      });
    }
    if (searchQuery) {
      list = list.filter(
        (ex) =>
          ex.name.toLowerCase().includes(searchQuery) ||
          (ex.primary_muscle || '').toLowerCase().includes(searchQuery)
      );
    }
    return list;
  }, [exercises, filter, searchQuery]);

  // Ogni volta che il set filtrato cambia (nuovo filtro o nuova ricerca), si ricomincia a
  // mostrare dall'inizio invece di restare su una pagina che magari ora ha pochi risultati.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, searchQuery]);

  const visibleExercises = filteredExercises.slice(0, visibleCount);
  const hasMore = visibleCount < filteredExercises.length;

  const filterLabel = (f: NonNullable<LibraryFilter>) =>
    f.type === 'region' ? BODY_ZONE_NAME[f.value] || f.value : f.type === 'tag' ? ui.hiitLabel : f.value;

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full opacity-20 dark:opacity-25 blur-[160px]"
        style={{ background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)' }}
      />

      <div className="relative max-w-6xl mx-auto pt-40 pb-24 px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#4F7CFF]/20 bg-[#4F7CFF]/10 px-3.5 py-1.5 mb-5">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }} />
          <p className="eyebrow text-[#4F7CFF]">
            {exercises.length > 0 ? ui.eyebrowCount.replace('{count}', exercises.length.toLocaleString(numberLocale)) : ui.eyebrowDefault}
          </p>
        </div>
        <h1 className="font-display text-6xl font-bold tracking-tight mb-3 text-[#32D6A0]">
          {ui.headingPart1} {ui.headingPart2}
        </h1>
        <p className="text-base text-ink/50 dark:text-white/50 mb-6 max-w-xl">
          {ui.description}
        </p>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="relative max-w-md flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ui.searchPlaceholder}
              className="w-full rounded-full border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl pl-10 pr-4 py-2.5 text-sm text-ink dark:text-white placeholder:text-ink/35 dark:placeholder:text-white/35 outline-none focus:border-[#4F7CFF]/40 transition-colors shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30 hover:text-ink dark:hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSelectionMode}
            title={selectionMode ? uiFull.bulkSelection.toggleOff : uiFull.bulkSelection.toggleOn}
            className={`flex-none inline-flex items-center justify-center h-[42px] w-[42px] rounded-full border backdrop-blur-xl transition-colors ${
              selectionMode
                ? 'border-transparent text-white shadow-sm'
                : 'border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white'
            }`}
            style={selectionMode ? { background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' } : undefined}
          >
            {selectionMode ? <X size={16} /> : <ListChecks size={16} />}
          </button>
        </div>

        {(regionCounts.length > 0 || categoryCounts.size > 0 || equipmentCounts.length > 0 || cardioHiitCount > 0) && (
          <div className="flex flex-wrap items-center gap-2.5 mb-10">
            {regionCounts.length > 0 && (
              <select
                value={filter?.type === 'region' ? filter.value : ''}
                onChange={(e) => setFilter(e.target.value ? { type: 'region', value: e.target.value } : null)}
                className={`rounded-full border backdrop-blur-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#4F7CFF]/40 shadow-sm cursor-pointer transition-colors ${
                  filter?.type === 'region'
                    ? 'border-[#A855F7]/40 bg-[#A855F7]/10 text-ink dark:text-white'
                    : 'border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] text-ink/70 dark:text-white/70'
                }`}
              >
                <option value="">{ui.bodyZoneHeading}</option>
                {regionCounts.map((zone) => (
                  <option key={zone.slug} value={zone.slug}>
                    {zone.name} &middot; {zone.count}
                  </option>
                ))}
              </select>
            )}

            {(categoryCounts.size > 0 || cardioHiitCount > 0) && (
              <select
                value={filter?.type === 'category' ? filter.value : filter?.type === 'tag' ? '__hiit__' : ''}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) setFilter(null);
                  else if (v === '__hiit__') setFilter({ type: 'tag', value: CARDIO_HIIT_TAG });
                  else setFilter({ type: 'category', value: v });
                }}
                className={`rounded-full border backdrop-blur-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#4F7CFF]/40 shadow-sm cursor-pointer transition-colors ${
                  filter?.type === 'category' || filter?.type === 'tag'
                    ? 'border-[#4F7CFF]/40 bg-[#4F7CFF]/10 text-ink dark:text-white'
                    : 'border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] text-ink/70 dark:text-white/70'
                }`}
              >
                <option value="">{ui.categoryHeading}</option>
                {cardioHiitCount > 0 && (
                  <option value="__hiit__">
                    {ui.hiitLabel} &middot; {cardioHiitCount}
                  </option>
                )}
                {Array.from(categoryCounts.entries()).map(([cat, count]) => (
                  <option key={cat} value={cat}>
                    {cat} &middot; {count}
                  </option>
                ))}
              </select>
            )}

            {equipmentCounts.length > 0 && (
              <select
                value={filter?.type === 'equipment' ? filter.value : ''}
                onChange={(e) => setFilter(e.target.value ? { type: 'equipment', value: e.target.value } : null)}
                className={`rounded-full border backdrop-blur-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#4F7CFF]/40 shadow-sm cursor-pointer transition-colors ${
                  filter?.type === 'equipment'
                    ? 'border-[#4F7CFF]/40 bg-[#4F7CFF]/10 text-ink dark:text-white'
                    : 'border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] text-ink/70 dark:text-white/70'
                }`}
              >
                <option value="">{ui.equipmentHeading}</option>
                {equipmentCounts.map(([eq, count]) => (
                  <option key={eq} value={eq}>
                    {eq} &middot; {count}
                  </option>
                ))}
              </select>
            )}

            {filter && (
              <button
                type="button"
                onClick={() => setFilter(null)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-black/[0.12] dark:border-white/15 px-3 py-1.5 text-xs font-medium text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white"
              >
                <X size={12} />
                {filterLabel(filter)}
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : errorMsg ? (
          <p className="text-sm text-red-500">{errorMsg}</p>
        ) : exercises.length === 0 ? (
          <p className="text-sm text-ink/50 dark:text-white/50">{ui.noExercises}</p>
        ) : filteredExercises.length === 0 ? (
          <p className="text-sm text-ink/50 dark:text-white/50">
            {ui.noMatchPrefix} {filter ? ui.noMatchFilterPart.replace('{filter}', filterLabel(filter)) : ui.noMatchSearchPart}
            {searchQuery ? ` "${search.trim()}"` : ''}.
          </p>
        ) : (
          <>
            <p className="text-xs text-ink/40 dark:text-white/40 mb-4">
              {filteredExercises.length.toLocaleString(numberLocale)} {filteredExercises.length === 1 ? ui.exerciseSingular : ui.exercisePlural}
              {filter || searchQuery ? ` ${ui.outOfTotal.replace('{total}', exercises.length.toLocaleString(numberLocale))}` : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleExercises.map((ex, i) => {
                const style = styleFor(ex.category);
                const Icon = style.icon;
                const isCardioHiit = (ex.tags || []).includes(CARDIO_HIIT_TAG);
                const isSelected = selectedIds.has(ex.id);
                return (
                  <motion.div
                    key={ex.id}
                    role="button"
                    tabIndex={0}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.05 }}
                    whileHover={{ y: -4 }}
                    onClick={() => (selectionMode ? toggleSelected(ex.id) : setOpenExercise(ex))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectionMode ? toggleSelected(ex.id) : setOpenExercise(ex);
                      }
                    }}
                    className={`group text-left relative rounded-[24px] border backdrop-blur-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer bg-white/70 dark:bg-white/[0.03] ${
                      isSelected ? 'border-[#4F7CFF] ring-2 ring-[#4F7CFF]/50' : 'border-black/[0.06] dark:border-white/10'
                    }`}
                  >
                    {selectionMode && (
                      <span
                        className={`absolute top-3 right-3 z-[3] flex h-7 w-7 items-center justify-center rounded-full shadow-lg transition-colors ${
                          isSelected ? 'text-white' : 'bg-white/90 dark:bg-black/60 text-ink/30 dark:text-white/40'
                        }`}
                        style={isSelected ? { background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' } : undefined}
                      >
                        {isSelected ? <CheckCircle2 size={15} /> : <span className="h-3.5 w-3.5 rounded-full border-2 border-current" />}
                      </span>
                    )}
                    <div className="relative h-40 overflow-hidden bg-ink/5 dark:bg-white/5">
                      <div
                        className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-40 blur-2xl transition-transform duration-500 group-hover:scale-125 z-0"
                        style={{ background: style.gradient }}
                      />
                      {ex.image_start_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ex.image_start_url}
                          alt={ex.name}
                          className="relative z-[1] w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="relative z-[1] h-full flex items-center justify-center">
                          <Icon className="text-ink/20 dark:text-white/20" size={30} />
                        </div>
                      )}
                      {ex.video_url && (
                        <span className="absolute bottom-3 right-3 z-[2] flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-sm shadow-sm">
                          <Play size={13} fill="currentColor" className="text-ink dark:text-white ml-0.5" />
                        </span>
                      )}
                      {isCardioHiit && (
                        <span
                          className="absolute bottom-3 left-3 z-[2] flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold text-white shadow-lg"
                          style={{ background: CARDIO_HIIT_GRADIENT }}
                        >
                          <Flame size={10} />
                          HIIT
                        </span>
                      )}
                      <span
                        className="absolute top-3 left-3 z-[2] flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-lg"
                        style={{ background: style.gradient }}
                      >
                        <Icon size={15} strokeWidth={2} />
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.gradient }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 dark:text-white/40">
                          {ex.category || ui.genericExercise}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-ink dark:text-white mb-1 leading-snug">{ex.name}</h3>
                      {ex.primary_muscle ? (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            applyFilter({ type: 'muscle', value: ex.primary_muscle as string });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              applyFilter({ type: 'muscle', value: ex.primary_muscle as string });
                            }
                          }}
                          className="inline-block text-xs text-ink/50 dark:text-white/50 hover:text-[#4F7CFF] dark:hover:text-[#4F7CFF] hover:underline underline-offset-2"
                        >
                          {ex.primary_muscle}
                        </span>
                      ) : (
                        <p className="text-xs text-ink/50 dark:text-white/50">{ui.muscleUnspecified}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  type="button"
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl px-5 py-2.5 text-sm font-semibold text-ink dark:text-white hover:bg-white/95 dark:hover:bg-white/[0.08] shadow-sm transition-colors"
                >
                  {ui.showMore.replace('{n}', String(Math.min(PAGE_SIZE, filteredExercises.length - visibleCount)))}
                  <span className="text-ink/40 dark:text-white/40 font-normal">
                    {ui.ofTotal.replace('{total}', filteredExercises.length.toLocaleString(numberLocale))}
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {openExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setOpenExercise(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="relative max-w-3xl w-full max-h-[88vh] overflow-y-auto rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/95 dark:bg-[#0d0f13]/95 backdrop-blur-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setOpenExercise(null)}
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white shadow-sm"
              >
                <X size={17} />
              </button>

              {openExercise.video_url ? (
                <video
                  src={openExercise.video_url}
                  poster={openExercise.image_start_url || undefined}
                  controls
                  className="w-full max-h-[40vh] rounded-t-[28px] bg-black"
                />
              ) : (openExercise.image_start_url || openExercise.image_end_url) && (
                <div className="grid grid-cols-2 gap-0.5 rounded-t-[28px] overflow-hidden">
                  {openExercise.image_start_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={openExercise.image_start_url} alt="Posizione iniziale" className="w-full h-52 object-cover" />
                  )}
                  {openExercise.image_end_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={openExercise.image_end_url} alt="Posizione finale" className="w-full h-52 object-cover" />
                  )}
                </div>
              )}

              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: styleFor(openExercise.category).gradient }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 dark:text-white/40">
                    {openExercise.category || ui.genericExercise}
                  </span>
                </div>
                <h2 className="font-display text-3xl font-bold text-ink dark:text-white mb-3">{openExercise.name}</h2>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(openExercise.tags || []).includes(CARDIO_HIIT_TAG) && (
                    <button
                      type="button"
                      onClick={() => {
                        applyFilter({ type: 'tag', value: CARDIO_HIIT_TAG });
                        setOpenExercise(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
                      style={{ background: CARDIO_HIIT_GRADIENT }}
                    >
                      <Flame size={12} />
                      HIIT
                    </button>
                  )}
                  {openExercise.body_region && (
                    <button
                      type="button"
                      onClick={() => {
                        applyFilter({ type: 'region', value: openExercise.body_region as string });
                        setOpenExercise(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)' }}
                    >
                      {ui.zoneLabel}: {BODY_ZONE_NAME[openExercise.body_region] || openExercise.body_region}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {openExercise.primary_muscle && (
                    <button
                      type="button"
                      onClick={() => {
                        applyFilter({ type: 'muscle', value: openExercise.primary_muscle as string });
                        setOpenExercise(null);
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
                      style={{ background: styleFor(openExercise.category).gradient }}
                    >
                      {openExercise.primary_muscle}
                    </button>
                  )}
                  {(openExercise.secondary_muscles || []).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        applyFilter({ type: 'muscle', value: m });
                        setOpenExercise(null);
                      }}
                      className="rounded-full border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-ink/60 dark:text-white/60 hover:bg-white/90 dark:hover:bg-white/[0.08]"
                    >
                      {m}
                    </button>
                  ))}
                  {(openExercise.equipment || []).map((eq) => (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => {
                        applyFilter({ type: 'equipment', value: eq });
                        setOpenExercise(null);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-dashed border-black/[0.1] dark:border-white/15 px-3 py-1.5 text-xs font-medium text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white"
                    >
                      <Layers size={11} />
                      {eq}
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <ClinicalActionBar
                    contentType="exercise"
                    contentId={openExercise.id}
                    label={openExercise.name}
                    section="Exercise Library"
                  />
                </div>

                {openExercise.instructions && openExercise.instructions.length > 0 && (
                  <div className="mb-6">
                    <p className="eyebrow text-ink/40 dark:text-white/40 mb-3">{ui.instructionsLabel}</p>
                    <StepList steps={openExercise.instructions} />
                  </div>
                )}

                {openExercise.tips && (
                  <div className="rounded-2xl border border-[#32D6A0]/20 bg-[#32D6A0]/[0.06] p-4">
                    <p className="eyebrow text-[#32D6A0] mb-1.5">{ui.tipLabel}</p>
                    <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed whitespace-pre-line">{openExercise.tips}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectionMode && (
        <BulkPatientLinkBar
          contentType="exercise"
          section="Exercise Library"
          items={selectedItems}
          onDone={() => {
            setSelectedIds(new Set());
            setSelectionMode(false);
          }}
          onCancel={() => {
            setSelectedIds(new Set());
            setSelectionMode(false);
          }}
        />
      )}
    </div>
  );
}
