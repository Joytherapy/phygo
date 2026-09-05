'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { X } from 'lucide-react';

type SubView = 'anatomy' | 'conditions' | 'assessment' | 'rehab' | 'airway-clearance';
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
  goals?: string;
  clinical_tests?: string;
  red_flags?: string;
  contraindications?: string;
  typical_exercises?: string;
  system: string;
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

interface AirwayClearanceItem {
  id: string;
  name: string;
  technique_category: string;
  patient_position?: string;
  procedure?: string;
  indications?: string;
  contraindications_precautions?: string;
  evidence_note?: string;
  age_group?: string;
  image_url?: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  cardiac: 'Cardiaco',
  respiratory: 'Respiratorio',
  circulatory: 'Circolatorio',
  thoracic_mechanics: 'Meccanica Toracica',
  concept: 'Concetti Chiave',
};

const SYSTEM_LABEL: Record<string, string> = {
  cardiac: 'Condizioni Cardiache',
  respiratory: 'Condizioni Respiratorie',
  mixed_systemic: 'Condizioni Sistemiche/Miste',
};

const TEST_CATEGORY_LABEL: Record<string, string> = {
  functional_capacity: 'Capacità Funzionale',
  dyspnea_scale: 'Scale della Dispnea',
  strength: 'Forza',
  vital_signs: 'Parametri Vitali',
  consciousness: 'Stato di Coscienza',
};

const REHAB_CATEGORY_LABEL: Record<string, string> = {
  aerobic_training: 'Allenamento Aerobico',
  resistance_training: 'Allenamento alla Forza',
  post_surgical: 'Post-Chirurgico',
  heart_failure: 'Scompenso Cardiaco',
  respiratory_specific: 'Specifico Respiratorio',
};

const AIRWAY_CATEGORY_LABEL: Record<string, string> = {
  postural_drainage: 'Drenaggio Posturale',
  manual: 'Tecniche Manuali',
  active_breathing: 'Respirazione Attiva',
  device_dependent: 'Dispositivi (PEP)',
  machine_dependent: 'Dispositivi Meccanici',
  ventilation_support: 'Supporto Ventilatorio',
  dyspnoea_technique: 'Tecniche per la Dispnea',
};

const AIRWAY_CATEGORY_ORDER = ['postural_drainage', 'manual', 'active_breathing', 'device_dependent', 'machine_dependent', 'ventilation_support', 'dyspnoea_technique'];

const ACCENT = {
  gradient: 'linear-gradient(90deg, #FF6B6B 0%, #FFA36B 100%)',
  solid: '#FF6B6B',
};

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

export default function CardiopulmonaryPage() {
  const router = useRouter();
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

  const [airwayTechniques, setAirwayTechniques] = useState<AirwayClearanceItem[]>([]);
  const [airwayLoading, setAirwayLoading] = useState(false);
  const [airwayError, setAirwayError] = useState<string | null>(null);
  const [hasFetchedAirway, setHasFetchedAirway] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<AirwayClearanceItem | null>(null);

  const [expandedImage, setExpandedImage] = useState<{ file: string; label: string } | null>(null);

  useEffect(() => {
    if (subView !== 'anatomy' || hasFetchedStructures) return;
    const fetchStructures = async () => {
      setStructuresLoading(true);
      setStructuresError(null);
      try {
        const res = await fetch('/api/cardiopulmonary/structures');
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
        const res = await fetch('/api/cardiopulmonary/conditions');
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
        const res = await fetch('/api/cardiopulmonary/tests');
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
        const res = await fetch('/api/cardiopulmonary/rehab');
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
    if (subView !== 'airway-clearance' || hasFetchedAirway) return;
    const fetchAirway = async () => {
      setAirwayLoading(true);
      setAirwayError(null);
      try {
        const res = await fetch('/api/cardiopulmonary/airway-clearance');
        if (!res.ok) throw new Error('Errore nel recupero delle tecniche di disostruzione');
        const data = await res.json();
        setAirwayTechniques(data.techniques ?? []);
        setHasFetchedAirway(true);
      } catch (err) {
        setAirwayError('Impossibile caricare le tecniche di disostruzione.');
        console.error(err);
      } finally {
        setAirwayLoading(false);
      }
    };
    fetchAirway();
  }, [subView, hasFetchedAirway]);

    const SUB_TABS: { key: SubView; label: string }[] = [
    { key: 'anatomy', label: 'Anatomia' },
    { key: 'conditions', label: 'Patologie' },
    { key: 'assessment', label: 'Valutazione' },
    { key: 'rehab', label: 'Riabilitazione' },
    { key: 'airway-clearance', label: 'Disostruzione' },
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(255,107,107,0.6) 0%, rgba(255,163,107,0.5) 100%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT.gradient }} />
            Cardiopulmonary Atlas
          </div>
          <h1 className="font-display text-6xl font-bold tracking-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: ACCENT.gradient }}
            >
              Cardiopulmonary
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
              Cardiopulmonary Anatomy
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              Cuore, circolo, apparato respiratorio e meccanica toracica: come funzionano come sistema integrato.
            </p>

            <div className="mb-10 rounded-2xl border p-6" style={{ borderColor: `${ACCENT.solid}33`, background: `${ACCENT.solid}0D` }}>
              <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                Il sistema cardiorespiratorio integra funzione cardiaca, circolatoria e polmonare: una compromissione in uno di questi ambiti si ripercuote quasi sempre sugli altri. La valutazione fisioterapica considera insieme meccanica toracica, capacità di esercizio e parametri vitali, poiché sono strettamente interdipendenti. Le sezioni sottostanti approfondiscono anatomia cardiaca, sistema vascolare, apparato respiratorio, meccanica/cinematica toracica e il concetto chiave di VO2max/riserva cardiaca, che orienta la prescrizione dell'esercizio.
              </p>
            </div>

            {structuresLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {structuresError && <p className="text-sm text-red-500">{structuresError}</p>}

            {!structuresLoading && !structuresError && (
              <div className="space-y-8">
                {(['cardiac', 'circulatory', 'respiratory', 'thoracic_mechanics', 'concept'] as const).map((cat) => {
                  const items = structures.filter((s) => s.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3
                        className="text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        {CATEGORY_LABEL[cat] ?? cat}
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
              Patologie organizzate per sistema. Tocca una card per obiettivi, test clinici ed esercizi.
            </p>

            {conditionsLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {conditionsError && <p className="text-sm text-red-500">{conditionsError}</p>}

            {!conditionsLoading && !conditionsError && (
              <div className="space-y-8">
                {(['cardiac', 'respiratory', 'mixed_systemic'] as const).map((sys) => {
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
                            className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 transition-colors hover:border-[#FF6B6B]/40"
                          >
                            <p className="text-sm font-semibold text-ink dark:text-white">{c.condition_name}</p>
                          </button>
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
              Test clinici e scale di valutazione cardiorespiratoria.
            </p>

            {testsLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {testsError && <p className="text-sm text-red-500">{testsError}</p>}

            {!testsLoading && !testsError && (
              <div className="space-y-8">
                {(['functional_capacity', 'dyspnea_scale', 'strength', 'vital_signs', 'consciousness'] as const).map((cat) => {
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
              Protocolli FITT, gestione post-chirurgica e specifici per scompenso cardiaco e patologie respiratorie.
            </p>

            {rehabLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {rehabError && <p className="text-sm text-red-500">{rehabError}</p>}

            {!rehabLoading && !rehabError && (
              <div className="space-y-8">
                {(['aerobic_training', 'resistance_training', 'post_surgical', 'heart_failure', 'respiratory_specific'] as const).map((cat) => {
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

        {subView === 'airway-clearance' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              Airway Clearance Techniques
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              Tecniche di disostruzione bronchiale: drenaggio posturale, tecniche manuali, PEP, respirazione attiva, supporto ventilatorio. Tocca una card per la procedura completa.
            </p>

            {airwayLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {airwayError && <p className="text-sm text-red-500">{airwayError}</p>}

            {!airwayLoading && !airwayError && (
              <div className="space-y-8">
                {AIRWAY_CATEGORY_ORDER.map((cat) => {
                  const items = airwayTechniques.filter((t) => t.technique_category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3
                        className="text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        {AIRWAY_CATEGORY_LABEL[cat] ?? cat}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {items.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTechnique(t)}
                            className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 transition-colors hover:border-[#FF6B6B]/40"
                          >
                            <p className="text-sm font-semibold text-ink dark:text-white">{t.name}</p>
                            {t.age_group && (
                              <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink/50 dark:text-white/50">
                                {t.age_group === 'both' ? 'Adulti e bambini' : t.age_group === 'adult' ? 'Adulti' : 'Pediatrico'}
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
              </div>
            </motion.div>
          </motion.div>
        )}
            </AnimatePresence>

      <AnimatePresence>
        {selectedTechnique && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setSelectedTechnique(null)}
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
                  {selectedTechnique.name}
                </h3>
                <button
                  onClick={() => setSelectedTechnique(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              {selectedTechnique.image_url && (
                <button
                  onClick={() => setExpandedImage({ file: selectedTechnique.image_url as string, label: selectedTechnique.name })}
                  className="group block w-full rounded-2xl overflow-hidden mb-4 bg-[#08090b]"
                >
                  <img
                    src={selectedTechnique.image_url}
                    alt={selectedTechnique.name}
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                  />
                </button>
              )}

              <div className="space-y-4 text-sm">
                {selectedTechnique.patient_position && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Posizione paziente</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedTechnique.patient_position}</p>
                  </div>
                )}
                {selectedTechnique.procedure && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Procedura</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedTechnique.procedure}</p>
                  </div>
                )}
                {selectedTechnique.indications && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Indicazioni</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedTechnique.indications}</p>
                  </div>
                )}
                {selectedTechnique.contraindications_precautions && (
                  <div>
                    <p className="font-semibold text-red-500 mb-1">Controindicazioni/Precauzioni</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedTechnique.contraindications_precautions}</p>
                  </div>
                )}
                {selectedTechnique.evidence_note && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Evidenza</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedTechnique.evidence_note}</p>
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