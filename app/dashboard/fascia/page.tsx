'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { X, Search, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext';
import EvidenceBadge from '@/components/EvidenceBadge';

type SubView = 'structures' | 'function' | 'treatments' | 'rehab';

interface StructureItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  anatomy?: string;
  function?: string;
  clinical_relevance?: string;
  evidence_level?: string;
  diagram_image?: string | null;
}

interface FunctionItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  description?: string;
  clinical_relevance?: string;
  evidence_level?: string;
  diagram_image?: string | null;
}

interface TreatmentItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  description?: string;
  pt_implications?: string;
  evidence_note?: string;
  evidence_level?: string;
  diagram_image?: string | null;
}

interface RehabItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  description?: string;
  protocol?: string;
  evidence_note?: string;
  evidence_level?: string;
  diagram_image?: string | null;
}

const ACCENT = {
  gradient: 'linear-gradient(90deg, #D97706 0%, #B45309 100%)',
  solid: '#D97706',
};

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

const STRUCTURE_CATEGORIES = [
  'anatomia_generale',
  'istologia',
  'innervazione',
  'vascolarizzazione',
  'regolazione_ormonale',
  'contrattilita_miofibroblasti',
  'metodi_di_studio',
] as const;

const FUNCTION_CATEGORIES = [
  'biotensegrita',
  'carico_e_nutrizione',
  'capacita_di_allungamento',
  'cammino_e_locomozione',
  'valutazione_posturale',
] as const;

const TREATMENT_CATEGORIES = [
  'integrazione_strutturale',
  'terapia_dei_punti_trigger',
  'manipolazione_fasciale',
  'fascial_stretch_therapy',
  'gestione_delle_cicatrici',
  'riabilitazione_oncologica_fasciale',
  'auto_trattamento_miofasciale',
  'movimento_e_rieducazione_fasciale',
] as const;

const REHAB_CATEGORIES = [
  'post_surgical_scar_management',
  'progressive_loading',
  'movement_reeducation',
  'sports_performance',
  'chronic_pain_management',
] as const;

export default function FasciaPage() {
  const { lang } = useLanguage();
  const ui = useUiStrings();
  const [subView, setSubView] = useState<SubView>('structures');

  const [structures, setStructures] = useState<StructureItem[]>([]);
  const [structuresLoading, setStructuresLoading] = useState(false);
  const [structuresError, setStructuresError] = useState<string | null>(null);
  const [hasFetchedStructures, setHasFetchedStructures] = useState(false);

  const [functionItems, setFunctionItems] = useState<FunctionItem[]>([]);
  const [functionLoading, setFunctionLoading] = useState(false);
  const [functionError, setFunctionError] = useState<string | null>(null);
  const [hasFetchedFunction, setHasFetchedFunction] = useState(false);

  const [treatments, setTreatments] = useState<TreatmentItem[]>([]);
  const [treatmentsLoading, setTreatmentsLoading] = useState(false);
  const [treatmentsError, setTreatmentsError] = useState<string | null>(null);
  const [hasFetchedTreatments, setHasFetchedTreatments] = useState(false);

  const [rehab, setRehab] = useState<RehabItem[]>([]);
  const [rehabLoading, setRehabLoading] = useState(false);
  const [rehabError, setRehabError] = useState<string | null>(null);
  const [hasFetchedRehab, setHasFetchedRehab] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedImage, setExpandedImage] = useState<{ file: string; label: string } | null>(null);

  const [askQuery, setAskQuery] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  useEffect(() => {
    setHasFetchedStructures(false);
    setHasFetchedFunction(false);
    setHasFetchedTreatments(false);
    setHasFetchedRehab(false);
  }, [lang]);

  useEffect(() => {
    setSearchQuery('');
  }, [subView]);

  useEffect(() => {
    if (subView !== 'structures' || hasFetchedStructures) return;
    const run = async () => {
      setStructuresLoading(true);
      setStructuresError(null);
      try {
        const res = await fetch(`/api/fascia/structures?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero delle strutture');
        const data = await res.json();
        setStructures(data.structures ?? []);
        setHasFetchedStructures(true);
      } catch (err) {
        setStructuresError(ui.fascia.errorLoadingStructures);
        console.error(err);
      } finally {
        setStructuresLoading(false);
      }
    };
    run();
  }, [subView, hasFetchedStructures, lang, ui]);

  useEffect(() => {
    if (subView !== 'function' || hasFetchedFunction) return;
    const run = async () => {
      setFunctionLoading(true);
      setFunctionError(null);
      try {
        const res = await fetch(`/api/fascia/function?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero dei contenuti funzionali');
        const data = await res.json();
        setFunctionItems(data.items ?? []);
        setHasFetchedFunction(true);
      } catch (err) {
        setFunctionError(ui.fascia.errorLoadingFunction);
        console.error(err);
      } finally {
        setFunctionLoading(false);
      }
    };
    run();
  }, [subView, hasFetchedFunction, lang, ui]);

  useEffect(() => {
    if (subView !== 'treatments' || hasFetchedTreatments) return;
    const run = async () => {
      setTreatmentsLoading(true);
      setTreatmentsError(null);
      try {
        const res = await fetch(`/api/fascia/treatments?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero delle applicazioni cliniche');
        const data = await res.json();
        setTreatments(data.treatments ?? []);
        setHasFetchedTreatments(true);
      } catch (err) {
        setTreatmentsError(ui.fascia.errorLoadingTreatments);
        console.error(err);
      } finally {
        setTreatmentsLoading(false);
      }
    };
    run();
  }, [subView, hasFetchedTreatments, lang, ui]);

  useEffect(() => {
    if (subView !== 'rehab' || hasFetchedRehab) return;
    const run = async () => {
      setRehabLoading(true);
      setRehabError(null);
      try {
        const res = await fetch(`/api/fascia/rehab?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero dei contenuti riabilitativi');
        const data = await res.json();
        setRehab(data.rehab ?? []);
        setHasFetchedRehab(true);
      } catch (err) {
        setRehabError(ui.fascia.errorLoadingRehab);
        console.error(err);
      } finally {
        setRehabLoading(false);
      }
    };
    run();
  }, [subView, hasFetchedRehab, lang, ui]);

  const handleAskPhygo = async () => {
    if (!askQuery.trim() || askLoading) return;
    setAskLoading(true);
    setAskError(null);
    setAskAnswer(null);
    try {
      const res = await fetch('/api/ask-phygo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: askQuery,
          noteContext:
            "Sezione: Phygo Fascia. La domanda riguarda anatomia, fisiologia o applicazioni cliniche del sistema fasciale (fascia superficiale e profonda, catene miofasciali, biotensegrità, tecniche manuali fascia-specifiche come Fascial Manipulation, Structural Integration, Fascial Stretch Therapy) non necessariamente presenti nell'atlante attuale.",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAskError(data.error || 'Errore nella richiesta.');
        return;
      }
      setAskAnswer(data.answer);
    } catch (err) {
      setAskError('Impossibile contattare Phygo in questo momento.');
      console.error(err);
    } finally {
      setAskLoading(false);
    }
  };

  const SUB_TABS: { key: SubView; label: string }[] = [
    { key: 'structures', label: ui.fascia.subTabs.structures },
    { key: 'function', label: ui.fascia.subTabs.function },
    { key: 'treatments', label: ui.fascia.subTabs.treatments },
    { key: 'rehab', label: ui.fascia.subTabs.rehab },
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesStructure = (s: StructureItem) =>
    normalizedQuery === '' ||
    s.name.toLowerCase().includes(normalizedQuery) ||
    (s.anatomy ?? '').toLowerCase().includes(normalizedQuery) ||
    (s.function ?? '').toLowerCase().includes(normalizedQuery) ||
    (s.clinical_relevance ?? '').toLowerCase().includes(normalizedQuery);
  const matchesFunction = (f: FunctionItem) =>
    normalizedQuery === '' ||
    f.name.toLowerCase().includes(normalizedQuery) ||
    (f.description ?? '').toLowerCase().includes(normalizedQuery) ||
    (f.clinical_relevance ?? '').toLowerCase().includes(normalizedQuery);
  const matchesTreatment = (t: TreatmentItem) =>
    normalizedQuery === '' ||
    t.name.toLowerCase().includes(normalizedQuery) ||
    (t.description ?? '').toLowerCase().includes(normalizedQuery) ||
    (t.pt_implications ?? '').toLowerCase().includes(normalizedQuery) ||
    (t.evidence_note ?? '').toLowerCase().includes(normalizedQuery);
  const matchesRehab = (r: RehabItem) =>
    normalizedQuery === '' ||
    r.name.toLowerCase().includes(normalizedQuery) ||
    (r.description ?? '').toLowerCase().includes(normalizedQuery) ||
    (r.protocol ?? '').toLowerCase().includes(normalizedQuery) ||
    (r.evidence_note ?? '').toLowerCase().includes(normalizedQuery);

  const hasAnyMatchCurrent =
    subView === 'structures'
      ? structures.some(matchesStructure)
      : subView === 'function'
      ? functionItems.some(matchesFunction)
      : subView === 'treatments'
      ? treatments.some(matchesTreatment)
      : rehab.some(matchesRehab);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(217,119,6,0.55) 0%, rgba(180,83,9,0.45) 100%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT.gradient }} />
            {ui.fascia.atlasBadge}
          </div>
          <h1 className="font-display text-6xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: ACCENT.gradient }}>
              {ui.fascia.heading}
            </span>
          </h1>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex flex-wrap justify-center rounded-full border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-1">
            {SUB_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setSubView(t.key)}
                className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  subView === t.key
                    ? 'text-white'
                    : 'text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white'
                }`}
                style={subView === t.key ? { background: ACCENT.solid } : undefined}
              >
                {t.label}
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

        {subView === 'structures' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              {ui.fascia.structuresHeading}
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">{ui.fascia.structuresHint}</p>

            <div
              className="mb-10 rounded-2xl border p-6"
              style={{ borderColor: `${ACCENT.solid}33`, background: `${ACCENT.solid}0D` }}
            >
              <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">{ui.fascia.structuresIntro}</p>
            </div>

            {structuresLoading && <p className="text-sm text-ink/40 dark:text-white/40">{ui.fascia.loading}</p>}
            {structuresError && <p className="text-sm text-red-500">{structuresError}</p>}

            {!structuresLoading && !structuresError && normalizedQuery !== '' && !hasAnyMatchCurrent && (
              <p className="text-sm text-ink/40 dark:text-white/40 text-center">{ui.librarySearchNoResults}</p>
            )}

            {!structuresLoading && !structuresError && (
              <div className="space-y-8">
                {STRUCTURE_CATEGORIES.map((cat) => {
                  const items = structures.filter((s) => s.category === cat && matchesStructure(s));
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: ACCENT.solid }}>
                        {ui.fascia.structureCategoryLabels[cat] ?? cat}
                      </h3>
                      <div className="space-y-5">
                        {items.map((s) => (
                          <div
                            key={s.id}
                            className="rounded-2xl border border-black/[0.08] dark:border-white/[0.14] bg-white/80 dark:bg-white/[0.05] backdrop-blur-xl overflow-hidden shadow-sm shadow-black/5 dark:shadow-black/40"
                          >
                            {s.diagram_image && (
                              <button
                                onClick={() => setExpandedImage({ file: s.diagram_image as string, label: s.name })}
                                className="group relative w-full bg-[#08090b] overflow-hidden block"
                              >
                                <img
                                  src={`${IMAGE_BASE}/${s.diagram_image}`}
                                  alt={s.name}
                                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                                />
                              </button>
                            )}
                            <div className="p-5 pt-4">
                            <div className="flex items-center justify-between gap-2.5 mb-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: ACCENT.solid }} />
                                <p className="text-sm font-semibold text-ink dark:text-white truncate">{s.name}</p>
                              </div>
                              <EvidenceBadge level={s.evidence_level} className="shrink-0" />
                            </div>
                            {s.anatomy && (
                              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-2">
                                <span className="font-semibold">{ui.anatomy.anatomy}: </span>
                                {s.anatomy}
                              </p>
                            )}
                            {s.function && (
                              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-2">
                                <span className="font-semibold">{ui.anatomy.function}: </span>
                                {s.function}
                              </p>
                            )}
                            {s.clinical_relevance && (
                              <p className="text-xs text-ink/50 dark:text-white/50 leading-relaxed">
                                <span className="font-semibold">{ui.anatomy.clinicalRelevance}: </span>
                                {s.clinical_relevance}
                              </p>
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
        )}

        {subView === 'function' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              {ui.fascia.functionHeading}
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">{ui.fascia.functionHint}</p>

            {functionLoading && <p className="text-sm text-ink/40 dark:text-white/40">{ui.fascia.loading}</p>}
            {functionError && <p className="text-sm text-red-500">{functionError}</p>}

            {!functionLoading && !functionError && normalizedQuery !== '' && !hasAnyMatchCurrent && (
              <p className="text-sm text-ink/40 dark:text-white/40 text-center">{ui.librarySearchNoResults}</p>
            )}

            {!functionLoading && !functionError && (
              <div className="space-y-8">
                {FUNCTION_CATEGORIES.map((cat) => {
                  const items = functionItems.filter((f) => f.category === cat && matchesFunction(f));
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: ACCENT.solid }}>
                        {ui.fascia.functionCategoryLabels[cat] ?? cat}
                      </h3>
                      <div className="space-y-5">
                        {items.map((f) => (
                          <div
                            key={f.id}
                            className="rounded-2xl border border-black/[0.08] dark:border-white/[0.14] bg-white/80 dark:bg-white/[0.05] backdrop-blur-xl overflow-hidden shadow-sm shadow-black/5 dark:shadow-black/40"
                          >
                            {f.diagram_image && (
                              <button
                                onClick={() => setExpandedImage({ file: f.diagram_image as string, label: f.name })}
                                className="group relative w-full bg-[#08090b] overflow-hidden block"
                              >
                                <img
                                  src={`${IMAGE_BASE}/${f.diagram_image}`}
                                  alt={f.name}
                                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                                />
                              </button>
                            )}
                            <div className="p-5 pt-4">
                            <div className="flex items-center justify-between gap-2.5 mb-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: ACCENT.solid }} />
                                <p className="text-sm font-semibold text-ink dark:text-white truncate">{f.name}</p>
                              </div>
                              <EvidenceBadge level={f.evidence_level} className="shrink-0" />
                            </div>
                            {f.description && (
                              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-2">
                                {f.description}
                              </p>
                            )}
                            {f.clinical_relevance && (
                              <p className="text-xs text-ink/50 dark:text-white/50 leading-relaxed">
                                <span className="font-semibold">{ui.anatomy.clinicalRelevance}: </span>
                                {f.clinical_relevance}
                              </p>
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
        )}

        {subView === 'treatments' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              {ui.fascia.treatmentsHeading}
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">{ui.fascia.treatmentsHint}</p>

            {treatmentsLoading && <p className="text-sm text-ink/40 dark:text-white/40">{ui.fascia.loading}</p>}
            {treatmentsError && <p className="text-sm text-red-500">{treatmentsError}</p>}

            {!treatmentsLoading && !treatmentsError && normalizedQuery !== '' && !hasAnyMatchCurrent && (
              <p className="text-sm text-ink/40 dark:text-white/40 text-center">{ui.librarySearchNoResults}</p>
            )}

            {!treatmentsLoading && !treatmentsError && (
              <div className="space-y-8">
                {TREATMENT_CATEGORIES.map((cat) => {
                  const items = treatments.filter((t) => t.category === cat && matchesTreatment(t));
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: ACCENT.solid }}>
                        {ui.fascia.treatmentCategoryLabels[cat] ?? cat}
                      </h3>
                      <div className="space-y-5">
                        {items.map((t) => (
                          <div
                            key={t.id}
                            className="rounded-2xl border border-black/[0.08] dark:border-white/[0.14] bg-white/80 dark:bg-white/[0.05] backdrop-blur-xl overflow-hidden shadow-sm shadow-black/5 dark:shadow-black/40"
                          >
                            {t.diagram_image && (
                              <button
                                onClick={() => setExpandedImage({ file: t.diagram_image as string, label: t.name })}
                                className="group relative w-full bg-[#08090b] overflow-hidden block"
                              >
                                <img
                                  src={`${IMAGE_BASE}/${t.diagram_image}`}
                                  alt={t.name}
                                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                                />
                              </button>
                            )}
                            <div className="p-5 pt-4">
                            <div className="flex items-center justify-between gap-2.5 mb-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: ACCENT.solid }} />
                                <p className="text-sm font-semibold text-ink dark:text-white truncate">{t.name}</p>
                              </div>
                              <EvidenceBadge level={t.evidence_level} className="shrink-0" />
                            </div>
                            {t.description && (
                              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-3">
                                {t.description}
                              </p>
                            )}
                            {t.pt_implications && (
                              <div className="rounded-xl bg-black/[0.02] dark:bg-white/[0.03] p-3 mb-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-1">
                                  {ui.fascia.ptImplicationsLabel}
                                </p>
                                <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed">
                                  {t.pt_implications}
                                </p>
                              </div>
                            )}
                            {t.evidence_note && (
                              <p className="text-[10px] text-ink/40 dark:text-white/40 leading-relaxed">
                                {t.evidence_note}
                              </p>
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

            <div
              className="mt-8 rounded-2xl border p-5"
              style={{ borderColor: `${ACCENT.solid}33`, background: `${ACCENT.solid}0D` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} style={{ color: ACCENT.solid }} />
                <p className="text-sm font-semibold text-ink dark:text-white">{ui.fascia.askPhygoPrompt}</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={askQuery}
                  onChange={(e) => setAskQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskPhygo()}
                  placeholder={ui.fascia.askPhygoPlaceholder}
                  className="flex-1 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-2.5 text-sm text-ink dark:text-white placeholder:text-ink/40 dark:placeholder:text-white/40 outline-none focus:border-[#D97706]/40"
                />
                <button
                  onClick={handleAskPhygo}
                  disabled={askLoading || !askQuery.trim()}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                  style={{ background: ACCENT.gradient }}
                >
                  {askLoading ? <Loader2 size={16} className="animate-spin" /> : ui.fascia.askButton}
                </button>
              </div>
              {askError && <p className="text-sm text-red-500 mt-3">{askError}</p>}
              {askAnswer && (
                <div className="mt-4 rounded-xl bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 p-4">
                  <p className="text-sm text-ink/80 dark:text-white/80 leading-relaxed whitespace-pre-line">
                    {askAnswer}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {subView === 'rehab' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              {ui.fascia.rehabHeading}
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">{ui.fascia.rehabHint}</p>

            {rehabLoading && <p className="text-sm text-ink/40 dark:text-white/40">{ui.fascia.loading}</p>}
            {rehabError && <p className="text-sm text-red-500">{rehabError}</p>}

            {!rehabLoading && !rehabError && normalizedQuery !== '' && !hasAnyMatchCurrent && (
              <p className="text-sm text-ink/40 dark:text-white/40 text-center">{ui.librarySearchNoResults}</p>
            )}

            {!rehabLoading && !rehabError && (
              <div className="space-y-8">
                {REHAB_CATEGORIES.map((cat) => {
                  const items = rehab.filter((r) => r.category === cat && matchesRehab(r));
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: ACCENT.solid }}>
                        {ui.fascia.rehabCategoryLabels[cat] ?? cat}
                      </h3>
                      <div className="space-y-5">
                        {items.map((r) => (
                          <div
                            key={r.id}
                            className="rounded-2xl border border-black/[0.08] dark:border-white/[0.14] bg-white/80 dark:bg-white/[0.05] backdrop-blur-xl overflow-hidden shadow-sm shadow-black/5 dark:shadow-black/40"
                          >
                            {r.diagram_image && (
                              <button
                                onClick={() => setExpandedImage({ file: r.diagram_image as string, label: r.name })}
                                className="group relative w-full bg-[#08090b] overflow-hidden block"
                              >
                                <img
                                  src={`${IMAGE_BASE}/${r.diagram_image}`}
                                  alt={r.name}
                                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                                />
                              </button>
                            )}
                            <div className="p-5 pt-4">
                            <div className="flex items-center justify-between gap-2.5 mb-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: ACCENT.solid }} />
                                <p className="text-sm font-semibold text-ink dark:text-white truncate">{r.name}</p>
                              </div>
                              <EvidenceBadge level={r.evidence_level} className="shrink-0" />
                            </div>
                            {r.description && (
                              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-3">
                                {r.description}
                              </p>
                            )}
                            {r.protocol && (
                              <div className="rounded-xl bg-black/[0.02] dark:bg-white/[0.03] p-3 mb-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-1">
                                  {ui.fascia.protocolLabel}
                                </p>
                                <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed">
                                  {r.protocol}
                                </p>
                              </div>
                            )}
                            {r.evidence_note && (
                              <p className="text-[10px] text-ink/40 dark:text-white/40 leading-relaxed">
                                {r.evidence_note}
                              </p>
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
        )}
      </div>

      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setExpandedImage(null)}
          >
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              src={`${IMAGE_BASE}/${expandedImage.file}`}
              alt={expandedImage.label}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
