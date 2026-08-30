'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { X, Sparkles, Loader2, Maximize2 } from 'lucide-react';

type SubView = 'anatomy' | 'conditions' | 'treatments' | 'assessment' | 'rehab';

interface StructureItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  anatomy?: string;
  function?: string;
  clinical_relevance?: string;
  diagram_image?: string | null;
}

interface ConditionItem {
  id: number;
  condition_name: string;
  system: string;
  goals?: string;
  clinical_tests?: string;
  red_flags?: string;
  contraindications?: string;
  typical_exercises?: string;
  evidence_level?: string;
}

interface TestItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  procedure?: string;
  interpretation?: string;
}

interface RehabItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  description?: string;
  protocol?: string;
  evidence_note?: string;
}

interface TreatmentItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  description?: string;
  pt_implications?: string;
  evidence_note?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  mammario: 'Mammario',
  linfatico: 'Sistema Linfatico',
  'neuro-oncologico': 'Neuro-Oncologico',
  sistemico: 'Sistemico',
};

const REGION_BY_SLUG: Record<string, string> = {
  'sistema-linfatico-generale': 'Sistema Linfatico Generale',
  'anatomia-vascolarizzazione-mammella': 'Mammella',
  'drenaggio-linfatico-ascellare': 'Mammella',
  'drenaggio-linfatico-pelvico-ginecologico': 'Ginecologico',
  'drenaggio-linfatico-prostatico': 'Prostata',
  'drenaggio-linfatico-vescicale': 'Vescica',
  'drenaggio-linfatico-polmonare': 'Polmone',
  'metastasi-cerebrali-mappa': 'Cervello',
  'drenaggio-linfatico-testa-collo': 'Testa-Collo',
  'drenaggio-linfatico-colon-rettale': 'Colon-Retto',
  'meccanismo-diffusione-sistemica': 'Sistemico',
};

const REGION_SLUG_ORDER: Record<string, number> = {
  'anatomia-vascolarizzazione-mammella': 0,
  'drenaggio-linfatico-ascellare': 1,
};

const REGION_ORDER = [
  'Sistema Linfatico Generale',
  'Mammella',
  'Ginecologico',
  'Prostata',
  'Vescica',
  'Polmone',
  'Cervello',
  'Testa-Collo',
  'Colon-Retto',
  'Sistemico',
];

const SYSTEM_LABEL: Record<string, string> = {
  mammario: 'Carcinoma Mammario',
  ginecologico: 'Tumori Ginecologici',
  prostatico: 'Carcinoma Prostatico',
  vescicale: 'Carcinoma della Vescica',
  'neuro-oncologico': 'Tumori Cerebrali',
  'colon-retto': 'Carcinoma del Colon-Retto',
  polmonare: 'Carcinoma del Polmone',
  'testa-collo': 'Tumori Testa-Collo',
  sarcoma: 'Sarcomi',
  ematologico: 'Neoplasie Ematologiche',
  sistemico: 'Complicanze Sistemiche',
};

const SYSTEM_ORDER = ['mammario', 'ginecologico', 'prostatico', 'vescicale', 'neuro-oncologico', 'colon-retto', 'polmonare', 'testa-collo', 'sarcoma', 'ematologico', 'sistemico'];

const TEST_CATEGORY_LABEL: Record<string, string> = {
  performance_status: 'Performance Status',
  lymphedema_assessment: 'Valutazione del Linfedema',
  red_flag_screening: 'Screening Pre-Esercizio',
};

const TEST_CATEGORY_ORDER = ['performance_status', 'lymphedema_assessment', 'red_flag_screening'];

const REHAB_CATEGORY_LABEL: Record<string, string> = {
  linfedema: 'Gestione del Linfedema',
  complicanze_specifiche: 'Complicanze Specifiche',
  esercizio: 'Esercizio in Oncologia',
};

const REHAB_CATEGORY_ORDER = ['linfedema', 'complicanze_specifiche', 'esercizio'];

const TREATMENT_CATEGORY_LABEL: Record<string, string> = {
  per_tipo_tumore: 'Percorsi per Tipo di Tumore',
  diagnostica: 'Diagnostica e Stadiazione',
  chirurgia: 'Chirurgia',
  farmacologico: 'Trattamenti Farmacologici',
  fisico: 'Trattamenti Fisici',
};

const TREATMENT_CATEGORY_ORDER = ['per_tipo_tumore', 'diagnostica', 'chirurgia', 'farmacologico', 'fisico'];

const ACCENT = {
  gradient: 'linear-gradient(90deg, #A855F7 0%, #EC4899 100%)',
  solid: '#A855F7',
};

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

export default function OncologyPage() {
  const [subView, setSubView] = useState<SubView>('anatomy');

  const [structures, setStructures] = useState<StructureItem[]>([]);
  const [structuresLoading, setStructuresLoading] = useState(false);
  const [structuresError, setStructuresError] = useState<string | null>(null);
  const [hasFetchedStructures, setHasFetchedStructures] = useState(false);

  const [conditions, setConditions] = useState<ConditionItem[]>([]);
  const [conditionsLoading, setConditionsLoading] = useState(false);
  const [conditionsError, setConditionsError] = useState<string | null>(null);
  const [hasFetchedConditions, setHasFetchedConditions] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<ConditionItem | null>(null);

  const [tests, setTests] = useState<TestItem[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsError, setTestsError] = useState<string | null>(null);
  const [hasFetchedTests, setHasFetchedTests] = useState(false);

  const [rehab, setRehab] = useState<RehabItem[]>([]);
  const [rehabLoading, setRehabLoading] = useState(false);
  const [rehabError, setRehabError] = useState<string | null>(null);
  const [hasFetchedRehab, setHasFetchedRehab] = useState(false);

  const [treatments, setTreatments] = useState<TreatmentItem[]>([]);
  const [treatmentsLoading, setTreatmentsLoading] = useState(false);
  const [treatmentsError, setTreatmentsError] = useState<string | null>(null);
  const [hasFetchedTreatments, setHasFetchedTreatments] = useState(false);

  const [expandedImage, setExpandedImage] = useState<{ file: string; label: string } | null>(null);

  const [askQuery, setAskQuery] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  useEffect(() => {
    if (subView !== 'anatomy' || hasFetchedStructures) return;
    const fetchStructures = async () => {
      setStructuresLoading(true);
      setStructuresError(null);
      try {
        const res = await fetch('/api/oncology/structures');
        if (!res.ok) throw new Error('Errore nel recupero delle strutture');
        const data = await res.json();
        setStructures(data.structures ?? []);
        setHasFetchedStructures(true);
      } catch (err) {
        setStructuresError('Impossibile caricare le strutture anatomiche.');
        console.error(err);
      } finally {
        setStructuresLoading(false);
      }
    };
    fetchStructures();
  }, [subView, hasFetchedStructures]);

  useEffect(() => {
    if (subView !== 'conditions' || hasFetchedConditions) return;
    const fetchConditions = async () => {
      setConditionsLoading(true);
      setConditionsError(null);
      try {
        const res = await fetch('/api/oncology/conditions');
        if (!res.ok) throw new Error('Errore nel recupero delle patologie');
        const data = await res.json();
        setConditions(data.conditions ?? []);
        setHasFetchedConditions(true);
      } catch (err) {
        setConditionsError('Impossibile caricare le patologie.');
        console.error(err);
      } finally {
        setConditionsLoading(false);
      }
    };
    fetchConditions();
  }, [subView, hasFetchedConditions]);

  useEffect(() => {
    if (subView !== 'assessment' || hasFetchedTests) return;
    const fetchTests = async () => {
      setTestsLoading(true);
      setTestsError(null);
      try {
        const res = await fetch('/api/oncology/tests');
        if (!res.ok) throw new Error('Errore nel recupero dei test');
        const data = await res.json();
        setTests(data.tests ?? []);
        setHasFetchedTests(true);
      } catch (err) {
        setTestsError('Impossibile caricare i test di valutazione.');
        console.error(err);
      } finally {
        setTestsLoading(false);
      }
    };
    fetchTests();
  }, [subView, hasFetchedTests]);

  useEffect(() => {
    if (subView !== 'rehab' || hasFetchedRehab) return;
    const fetchRehab = async () => {
      setRehabLoading(true);
      setRehabError(null);
      try {
        const res = await fetch('/api/oncology/rehab');
        if (!res.ok) throw new Error('Errore nel recupero dei contenuti riabilitativi');
        const data = await res.json();
        setRehab(data.rehab ?? []);
        setHasFetchedRehab(true);
      } catch (err) {
        setRehabError('Impossibile caricare i contenuti riabilitativi.');
        console.error(err);
      } finally {
        setRehabLoading(false);
      }
    };
    fetchRehab();
  }, [subView, hasFetchedRehab]);

  useEffect(() => {
    if (subView !== 'treatments' || hasFetchedTreatments) return;
    const fetchTreatments = async () => {
      setTreatmentsLoading(true);
      setTreatmentsError(null);
      try {
        const res = await fetch('/api/oncology/treatments');
        if (!res.ok) throw new Error('Errore nel recupero dei trattamenti');
        const data = await res.json();
        setTreatments(data.treatments ?? []);
        setHasFetchedTreatments(true);
      } catch (err) {
        setTreatmentsError('Impossibile caricare i trattamenti.');
        console.error(err);
      } finally {
        setTreatmentsLoading(false);
      }
    };
    fetchTreatments();
  }, [subView, hasFetchedTreatments]);

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
          noteContext: 'Sezione: Phygo Oncology. La domanda riguarda patologie oncologiche, complicanze riabilitative, farmaci o argomenti di oncologia non necessariamente presenti nell&apos;atlante attuale.',
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
    { key: 'anatomy', label: 'Anatomia' },
    { key: 'conditions', label: 'Patologie' },
    { key: 'treatments', label: 'Trattamenti' },
    { key: 'assessment', label: 'Valutazione' },
    { key: 'rehab', label: 'Riabilitazione' },
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, rgba(236,72,153,0.5) 100%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT.gradient }} />
            Oncology Atlas
          </div>
          <h1 className="font-display text-6xl font-bold tracking-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: ACCENT.gradient }}
            >
              Oncology
            </span>
          </h1>
        </div>

        <div className="flex justify-center mb-10">
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

        {subView === 'anatomy' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              Oncology Anatomy
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              Anatomia e drenaggio linfatico rilevanti per la comprensione delle principali neoplasie e delle loro complicanze riabilitative.
            </p>

            <div className="mb-10 rounded-2xl border p-6" style={{ borderColor: `${ACCENT.solid}33`, background: `${ACCENT.solid}0D` }}>
              <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                La riabilitazione oncologica affronta un ventaglio ampio di complicanze — fatica, debolezza muscolare, neuropatia, cardiotossicita, disfunzioni del pavimento pelvico, oltre al linfedema. Questa sezione si concentra in particolare sull&apos;anatomia del sistema linfatico, poiche molte delle complicanze piu specificamente fisioterapiche derivano dall&apos;interruzione chirurgica o radioterapica delle vie di drenaggio linfatico regionale. Le altre complicanze (fatica, neuropatia, cardiotossicita) sono approfondite nelle sezioni Patologie, Trattamenti e Riabilitazione.
              </p>
            </div>

            {structuresLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {structuresError && <p className="text-sm text-red-500">{structuresError}</p>}

            {!structuresLoading && !structuresError && (
              <div className="space-y-8">
                {REGION_ORDER.map((region) => {
                  const items = structures
                    .filter((s) => REGION_BY_SLUG[s.slug] === region)
                    .sort((a, b) => (REGION_SLUG_ORDER[a.slug] ?? 99) - (REGION_SLUG_ORDER[b.slug] ?? 99));
                  if (items.length === 0) return null;
                  return (
                    <div key={region}>
                      <h3
                        className="text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        {region}
                      </h3>
                      <div className="space-y-3">
                        {items.map((s) => (
                          <div
                            key={s.id}
                            className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden"
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
                                <div
                                  className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-white opacity-90 group-hover:opacity-100 transition-opacity shadow-lg"
                                  style={{ background: `${ACCENT.solid}DD` }}
                                >
                                  <Maximize2 size={16} />
                                </div>
                              </button>
                            )}
                            <div className="p-5">
                              <p className="text-sm font-semibold text-ink dark:text-white mb-3">{s.name}</p>
                              {s.anatomy && (
                                <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-2">
                                  <span className="font-semibold">Anatomia: </span>{s.anatomy}
                                </p>
                              )}
                              {s.function && (
                                <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-2">
                                  <span className="font-semibold">Funzione: </span>{s.function}
                                </p>
                              )}
                              {s.clinical_relevance && (
                                <p className="text-xs text-ink/50 dark:text-white/50 leading-relaxed">
                                  <span className="font-semibold">Rilevanza clinica: </span>{s.clinical_relevance}
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

        {subView === 'conditions' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              Related Conditions
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              Patologie oncologiche organizzate per sistema. Tocca una card per obiettivi, test clinici, red flag ed esercizi tipici.
            </p>

            {conditionsLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {conditionsError && <p className="text-sm text-red-500">{conditionsError}</p>}

            {!conditionsLoading && !conditionsError && (
              <div className="space-y-8">
                {SYSTEM_ORDER.map((sys) => {
                  const items = conditions.filter((c) => c.system === sys);
                  if (items.length === 0) return null;
                  return (
                    <div key={sys}>
                      <h3
                        className="text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        {SYSTEM_LABEL[sys] ?? sys}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {items.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCondition(c)}
                            className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 transition-colors hover:border-[#A855F7]/40"
                          >
                            <p className="text-sm font-semibold text-ink dark:text-white">{c.condition_name}</p>
                            {c.evidence_level && (
                              <span className="inline-block text-[10px] font-bold uppercase tracking-wide mt-2 text-ink/40 dark:text-white/40">
                                Evidence: {c.evidence_level.split(' - ')[0]}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8 rounded-2xl border p-5" style={{ borderColor: `${ACCENT.solid}33`, background: `${ACCENT.solid}0D` }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} style={{ color: ACCENT.solid }} />
                <p className="text-sm font-semibold text-ink dark:text-white">
                  Non trovi la patologia che cerchi? Chiedi a Phygo
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={askQuery}
                  onChange={(e) => setAskQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskPhygo()}
                  placeholder="es. linfoma, melanoma, sarcoma dei tessuti molli..."
                  className="flex-1 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-2.5 text-sm text-ink dark:text-white placeholder:text-ink/40 dark:placeholder:text-white/40 outline-none focus:border-[#A855F7]/40"
                />
                <button
                  onClick={handleAskPhygo}
                  disabled={askLoading || !askQuery.trim()}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                  style={{ background: ACCENT.gradient }}
                >
                  {askLoading ? <Loader2 size={16} className="animate-spin" /> : 'Chiedi'}
                </button>
              </div>
              {askError && (
                <p className="text-sm text-red-500 mt-3">{askError}</p>
              )}
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

        {subView === 'treatments' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              Oncology Treatments
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              Percorsi diagnostico-terapeutici per tipo di tumore e modalita di trattamento generali, con le relative implicazioni fisioterapiche.
            </p>

            {treatmentsLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {treatmentsError && <p className="text-sm text-red-500">{treatmentsError}</p>}

            {!treatmentsLoading && !treatmentsError && (
              <div className="space-y-8">
                {TREATMENT_CATEGORY_ORDER.map((cat) => {
                  const items = treatments.filter((t) => t.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3
                        className="text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        {TREATMENT_CATEGORY_LABEL[cat] ?? cat}
                      </h3>
                      <div className="space-y-3">
                        {items.map((t) => (
                          <div
                            key={t.id}
                            className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5"
                          >
                            <p className="text-sm font-semibold text-ink dark:text-white mb-2">{t.name}</p>
                            {t.description && (
                              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-3">
                                {t.description}
                              </p>
                            )}
                            {t.pt_implications && (
                              <div className="rounded-xl bg-black/[0.02] dark:bg-white/[0.03] p-3 mb-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-1">
                                  Implicazioni Fisioterapiche
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
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {subView === 'assessment' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              Clinical Assessment
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              Scale di performance status e strumenti di valutazione specifici per il paziente oncologico.
            </p>

            {testsLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {testsError && <p className="text-sm text-red-500">{testsError}</p>}

            {!testsLoading && !testsError && (
              <div className="space-y-8">
                {TEST_CATEGORY_ORDER.map((cat) => {
                  const items = tests.filter((t) => t.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3
                        className="text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        {TEST_CATEGORY_LABEL[cat] ?? cat}
                      </h3>
                      <div className="space-y-3">
                        {items.map((t) => (
                          <div
                            key={t.id}
                            className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5"
                          >
                            <p className="text-sm font-semibold text-ink dark:text-white mb-2">{t.name}</p>
                            {t.procedure && (
                              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-2">
                                <span className="font-semibold">Procedura: </span>{t.procedure}
                              </p>
                            )}
                            {t.interpretation && (
                              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed">
                                <span className="font-semibold">Interpretazione: </span>{t.interpretation}
                              </p>
                            )}
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

        {subView === 'rehab' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              Rehabilitation
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              Protocolli di gestione del linfedema (incluso il linfodrenaggio manuale passo-passo), esercizio in oncologia e gestione delle complicanze specifiche.
            </p>

            {rehabLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {rehabError && <p className="text-sm text-red-500">{rehabError}</p>}

            {!rehabLoading && !rehabError && (
              <div className="space-y-8">
                {REHAB_CATEGORY_ORDER.map((cat) => {
                  const items = rehab.filter((r) => r.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3
                        className="text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        {REHAB_CATEGORY_LABEL[cat] ?? cat}
                      </h3>
                      <div className="space-y-3">
                        {items.map((r) => (
                          <div
                            key={r.id}
                            className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5"
                          >
                            <p className="text-sm font-semibold text-ink dark:text-white mb-2">{r.name}</p>
                            {r.description && (
                              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-3">
                                {r.description}
                              </p>
                            )}
                            {r.protocol && (
                              <div className="rounded-xl bg-black/[0.02] dark:bg-white/[0.03] p-3 mb-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-1">
                                  Protocollo
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
        {selectedCondition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setSelectedCondition(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0e0f12] border border-black/[0.06] dark:border-white/10 p-8"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-ink dark:text-white pr-6">
                  {selectedCondition.condition_name}
                </h3>
                <button
                  onClick={() => setSelectedCondition(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                {selectedCondition.goals && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Obiettivi</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedCondition.goals}</p>
                  </div>
                )}
                {selectedCondition.clinical_tests && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Test clinici</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedCondition.clinical_tests}</p>
                  </div>
                )}
                {selectedCondition.typical_exercises && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Esercizi tipici</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedCondition.typical_exercises}</p>
                  </div>
                )}
                {selectedCondition.red_flags && (
                  <div>
                    <p className="font-semibold text-red-500 mb-1">Red flags</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedCondition.red_flags}</p>
                  </div>
                )}
                {selectedCondition.contraindications && (
                  <div>
                    <p className="font-semibold text-red-500 mb-1">Controindicazioni</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedCondition.contraindications}</p>
                  </div>
                )}
                {selectedCondition.evidence_level && (
                  <div className="pt-2 border-t border-black/[0.06] dark:border-white/10">
                    <p className="text-xs text-ink/40 dark:text-white/40">
                      Evidence: {selectedCondition.evidence_level}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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