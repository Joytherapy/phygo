'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, ChevronDown, Stethoscope, ChevronRight, BookOpen } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';

// Sezione "Patologie" del dashboard (menu Libreria) — elenco di tutte le
// condizioni cliniche di `knowledge_base` con ricerca + filtro per sistema,
// stesso linguaggio visivo della Libreria Esercizi (select con icona/chevron,
// card arrotondate). A differenza delle pagine pubbliche /library/condition
// (pensate per la SEO, senza filtri), qui si può restringere per sistema.
// Click su una card apre il dettaglio completo (obiettivi, test, red flag,
// esercizi tipici, fonte), caricato al momento e tenuto in cache in memoria.

type Lang = 'it' | 'en' | 'es' | 'fr';

type ConditionSummary = { id: number; name: string; systems: string[] };

interface ConditionDetail {
  id: number;
  condition_name: string;
  goals: string | null;
  clinical_tests: string | null;
  red_flags: string | null;
  typical_exercises: string | null;
  contraindications: string | null;
  progression_criteria: string | null;
  return_to_activity_criteria: string | null;
  outcome_measures: string | null;
  evidence_level: string | null;
  source: string | null;
  source_date: string | null;
}

const SYSTEM_ORDER = [
  'cardiopulmonary',
  'neurology',
  'pelvicFloor',
  'urinary',
  'gastrointestinal',
  'endocrine',
  'immune',
  'hematology',
  'oncology',
  'orthoOther',
] as const;

const SYSTEM_LABELS: Record<Lang, Record<string, string>> = {
  it: {
    cardiopulmonary: 'Cardio-respiratorio',
    neurology: 'Neurologico',
    pelvicFloor: 'Pavimento Pelvico',
    urinary: 'Urinario',
    gastrointestinal: 'Gastrointestinale',
    endocrine: 'Endocrino',
    immune: 'Immunologico / Reumatologico',
    hematology: 'Ematologico',
    oncology: 'Oncologico',
    orthoOther: 'Ortopedico / Altro',
  },
  en: {
    cardiopulmonary: 'Cardiopulmonary',
    neurology: 'Neurological',
    pelvicFloor: 'Pelvic Floor',
    urinary: 'Urinary',
    gastrointestinal: 'Gastrointestinal',
    endocrine: 'Endocrine',
    immune: 'Immune / Rheumatologic',
    hematology: 'Hematologic',
    oncology: 'Oncologic',
    orthoOther: 'Orthopedic / Other',
  },
  es: {
    cardiopulmonary: 'Cardiorrespiratorio',
    neurology: 'Neurológico',
    pelvicFloor: 'Suelo Pélvico',
    urinary: 'Urinario',
    gastrointestinal: 'Gastrointestinal',
    endocrine: 'Endocrino',
    immune: 'Inmunológico / Reumatológico',
    hematology: 'Hematológico',
    oncology: 'Oncológico',
    orthoOther: 'Ortopédico / Otro',
  },
  fr: {
    cardiopulmonary: 'Cardio-respiratoire',
    neurology: 'Neurologique',
    pelvicFloor: 'Plancher Pelvien',
    urinary: 'Urinaire',
    gastrointestinal: 'Gastro-intestinal',
    endocrine: 'Endocrinien',
    immune: 'Immunologique / Rhumatologique',
    hematology: 'Hématologique',
    oncology: 'Oncologique',
    orthoOther: 'Orthopédique / Autre',
  },
};

const UI = {
  it: {
    eyebrow: (n: number) => `${n.toLocaleString('it-IT')} condizioni cliniche`,
    heading1: 'Libreria',
    heading2: 'Patologie',
    description: 'Condizioni cliniche con obiettivi, test, red flag ed esercizi tipici — ogni voce verificata su fonte reale.',
    searchPlaceholder: 'Cerca una condizione (es. tendinopatia, ictus...)',
    allSystems: 'Tutti i sistemi',
    noResults: 'Nessuna condizione trovata.',
    loading: 'Caricamento condizioni...',
    loadingDetail: 'Caricamento scheda...',
    goals: 'Obiettivi',
    clinicalTests: 'Test clinici',
    redFlags: 'Red flag',
    typicalExercises: 'Esercizi tipici',
    contraindications: 'Controindicazioni',
    progressionCriteria: 'Criteri di progressione',
    returnToActivity: 'Ritorno all’attività',
    outcomeMeasures: 'Misure di esito',
    source: 'Fonte',
    evidenceLevel: 'Livello di evidenza',
  },
  en: {
    eyebrow: (n: number) => `${n.toLocaleString('en-US')} clinical conditions`,
    heading1: 'Conditions',
    heading2: 'Library',
    description: 'Clinical conditions with goals, tests, red flags and typical exercises — every entry verified against a real source.',
    searchPlaceholder: 'Search a condition (e.g. tendinopathy, stroke...)',
    allSystems: 'All systems',
    noResults: 'No condition found.',
    loading: 'Loading conditions...',
    loadingDetail: 'Loading record...',
    goals: 'Goals',
    clinicalTests: 'Clinical tests',
    redFlags: 'Red flags',
    typicalExercises: 'Typical exercises',
    contraindications: 'Contraindications',
    progressionCriteria: 'Progression criteria',
    returnToActivity: 'Return to activity',
    outcomeMeasures: 'Outcome measures',
    source: 'Source',
    evidenceLevel: 'Evidence level',
  },
  es: {
    eyebrow: (n: number) => `${n.toLocaleString('es-ES')} condiciones clínicas`,
    heading1: 'Patologías',
    heading2: 'Biblioteca',
    description: 'Condiciones clínicas con objetivos, test, red flags y ejercicios típicos — cada ficha verificada con fuente real.',
    searchPlaceholder: 'Busca una condición (p. ej. tendinopatía, ictus...)',
    allSystems: 'Todos los sistemas',
    noResults: 'No se ha encontrado ninguna condición.',
    loading: 'Cargando condiciones...',
    loadingDetail: 'Cargando ficha...',
    goals: 'Objetivos',
    clinicalTests: 'Test clínicos',
    redFlags: 'Red flags',
    typicalExercises: 'Ejercicios típicos',
    contraindications: 'Contraindicaciones',
    progressionCriteria: 'Criterios de progresión',
    returnToActivity: 'Vuelta a la actividad',
    outcomeMeasures: 'Medidas de resultado',
    source: 'Fuente',
    evidenceLevel: 'Nivel de evidencia',
  },
  fr: {
    eyebrow: (n: number) => `${n.toLocaleString('fr-FR')} pathologies cliniques`,
    heading1: 'Pathologies',
    heading2: 'Bibliothèque',
    description: 'Pathologies cliniques avec objectifs, tests, red flags et exercices types — chaque fiche vérifiée sur source réelle.',
    searchPlaceholder: 'Recherchez une pathologie (ex. tendinopathie, AVC...)',
    allSystems: 'Tous les systèmes',
    noResults: 'Aucune pathologie trouvée.',
    loading: 'Chargement des pathologies...',
    loadingDetail: 'Chargement de la fiche...',
    goals: 'Objectifs',
    clinicalTests: 'Tests cliniques',
    redFlags: 'Red flags',
    typicalExercises: 'Exercices types',
    contraindications: 'Contre-indications',
    progressionCriteria: 'Critères de progression',
    returnToActivity: 'Retour à l’activité',
    outcomeMeasures: 'Mesures de résultat',
    source: 'Source',
    evidenceLevel: "Niveau d'évidence",
  },
};

function DetailField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/55 dark:text-white/40 mb-1">{label}</p>
      <p className="text-sm text-ink/80 dark:text-white/80 leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  );
}

export default function ConditionsLibraryPage() {
  const { lang: rawLang } = useLanguage();
  const lang: Lang = rawLang === 'en' || rawLang === 'es' || rawLang === 'fr' ? rawLang : 'it';
  const ui = UI[lang];
  const systemLabels = SYSTEM_LABELS[lang];

  const [conditions, setConditions] = useState<ConditionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [systemFilter, setSystemFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailCache, setDetailCache] = useState<Map<number, ConditionDetail>>(new Map());
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/conditions-library/list?lang=${lang}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setConditions(data.conditions || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const systemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of conditions) {
      for (const s of c.systems) counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return SYSTEM_ORDER.filter((s) => counts.has(s)).map((s) => ({ key: s, count: counts.get(s)! }));
  }, [conditions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conditions.filter((c) => {
      if (systemFilter && !c.systems.includes(systemFilter)) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [conditions, search, systemFilter]);

  const toggleExpand = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!detailCache.has(id)) {
      setLoadingDetailId(id);
      fetch(`/api/conditions-library/${id}?lang=${lang}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.condition) {
            setDetailCache((prev) => new Map(prev).set(id, data.condition));
          }
        })
        .finally(() => setLoadingDetailId((cur) => (cur === id ? null : cur)));
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f6f7f9] dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full opacity-20 dark:opacity-25 blur-[160px]"
        style={{ background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)' }}
      />

      <div className="relative max-w-6xl mx-auto pt-40 pb-24 px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#4F7CFF]/20 bg-[#4F7CFF]/10 px-3.5 py-1.5 mb-5">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }} />
          <p className="eyebrow text-[#4F7CFF]">{loading ? ui.loading : ui.eyebrow(conditions.length)}</p>
        </div>
        <h1 className="font-display text-6xl font-bold tracking-tight mb-3 text-[#32D6A0]">
          {ui.heading1} {ui.heading2}
        </h1>
        <p className="text-base text-ink/60 dark:text-white/50 mb-6 max-w-xl">{ui.description}</p>

        <div className="flex flex-wrap items-center gap-2.5 mb-10">
          <div className="relative max-w-md flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ui.searchPlaceholder}
              className="w-full rounded-full border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.03] backdrop-blur-xl pl-10 pr-9 py-2.5 text-sm text-ink dark:text-white placeholder:text-ink/35 dark:placeholder:text-white/35 outline-none focus:border-[#4F7CFF]/40 transition-colors shadow-soft"
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

          {systemCounts.length > 0 && (
            <div className="relative w-[250px] shrink-0">
              <Stethoscope size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/55 dark:text-white/40" />
              <select
                value={systemFilter}
                onChange={(e) => setSystemFilter(e.target.value)}
                className={`w-full appearance-none truncate rounded-full border backdrop-blur-xl pl-9 pr-9 py-2.5 text-xs font-semibold outline-none focus:border-[#4F7CFF]/40 shadow-soft cursor-pointer transition-colors ${
                  systemFilter
                    ? 'border-[#4F7CFF]/40 bg-[#4F7CFF]/10 text-ink dark:text-white'
                    : 'border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.03] text-ink/70 dark:text-white/70'
                }`}
              >
                <option value="">{ui.allSystems}</option>
                {systemCounts.map(({ key, count }) => (
                  <option key={key} value={key}>
                    {systemLabels[key]} &middot; {count}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/55 dark:text-white/40" />
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-ink/5 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-ink/55 dark:text-white/40">{ui.noResults}</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => {
              const isOpen = expandedId === c.id;
              const detail = detailCache.get(c.id);
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.03] overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(c.id)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-ink/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <BookOpen size={15} className="shrink-0 text-[#4F7CFF]" />
                      <span className="text-sm font-semibold text-ink dark:text-white truncate">{c.name}</span>
                    </span>
                    <ChevronRight size={16} className={`shrink-0 text-ink/30 dark:text-white/30 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-black/[0.09] dark:border-white/10">
                          {loadingDetailId === c.id && !detail ? (
                            <p className="text-xs text-ink/55 dark:text-white/40 py-3">{ui.loadingDetail}</p>
                          ) : detail ? (
                            <>
                              <DetailField label={ui.goals} value={detail.goals} />
                              <DetailField label={ui.clinicalTests} value={detail.clinical_tests} />
                              <DetailField label={ui.redFlags} value={detail.red_flags} />
                              <DetailField label={ui.typicalExercises} value={detail.typical_exercises} />
                              <DetailField label={ui.contraindications} value={detail.contraindications} />
                              <DetailField label={ui.progressionCriteria} value={detail.progression_criteria} />
                              <DetailField label={ui.returnToActivity} value={detail.return_to_activity_criteria} />
                              <DetailField label={ui.outcomeMeasures} value={detail.outcome_measures} />
                              {detail.source && (
                                <div className="pt-2 border-t border-black/[0.09] dark:border-white/10">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/55 dark:text-white/40 mb-1">
                                    {ui.source}
                                    {detail.evidence_level ? ` · ${ui.evidenceLevel}: ${detail.evidence_level}` : ''}
                                  </p>
                                  <p className="text-xs text-ink/60 dark:text-white/50 leading-relaxed">{detail.source}</p>
                                </div>
                              )}
                            </>
                          ) : null}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
