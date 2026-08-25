'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { X } from 'lucide-react';

type SubView = 'anatomy' | 'conditions' | 'assessment' | 'rehab';

interface StructureItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  diagram_image?: string;
}

interface ConditionItem {
  id: number;
  condition_name: string;
  goals?: string;
  clinical_tests?: string;
  red_flags?: string;
  contraindications?: string;
  typical_exercises?: string;
  progression_criteria?: string;
  evidence_level?: string;
  compartment: string;
}

interface TestItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  procedure?: string;
  interpretation?: string;
}

interface RehabItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  description?: string;
  protocol?: string;
  evidence_note?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  muscle: 'Muscoli',
  fascia_ligament: 'Fasce e Legamenti',
  concept: 'Concetti Chiave',
};

const COMPARTMENT_LABEL: Record<string, string> = {
  anterior: 'Compartimento Anteriore',
  central: 'Compartimento Centrale',
  posterior: 'Compartimento Posteriore',
  systemic: 'Sindromi Sistemiche',
};

const TEST_CATEGORY_LABEL: Record<string, string> = {
  neuropathy: 'Neuropatia del Pudendo',
  manual_assessment: 'Valutazione Manuale',
  urodynamic: 'Urodinamica',
  questionnaire: 'Questionari',
};

const REHAB_CATEGORY_LABEL: Record<string, string> = {
  kegel: 'Esercizio del Pavimento Pelvico',
  biofeedback_electrostim: 'Biofeedback ed Elettrostimolazione',
  bladder_training: 'Bladder Training',
  postpartum: 'Riabilitazione Post-Partum',
  special_population: 'Popolazioni Speciali',
};

const ACCENT = {
  gradient: 'linear-gradient(90deg, #EC4899 0%, #F43F5E 100%)',
  solid: '#EC4899',
};

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

const OVERVIEW_IMAGES = [
  { file: 'pelvic-floor-female-sagittal.png', label: 'Sagittale — Femminile' },
  { file: 'pelvic-floor-male-sagittal.png', label: 'Sagittale — Maschile' },
  { file: 'pelvic-floor-inferior-view.png', label: 'Vista Inferiore' },
];

export default function PelvicFloorPage() {
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

  const [expandedImage, setExpandedImage] = useState<{ file: string; label: string } | null>(null);

  useEffect(() => {
    if (subView !== 'anatomy' || hasFetchedStructures) return;
    const fetchStructures = async () => {
      setStructuresLoading(true);
      setStructuresError(null);
      try {
        const res = await fetch('/api/pelvic-floor/structures');
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
        const res = await fetch('/api/pelvic-floor/conditions');
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
        const res = await fetch('/api/pelvic-floor/tests');
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
        const res = await fetch('/api/pelvic-floor/rehab');
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

  const SUB_TABS: { key: SubView; label: string }[] = [
    { key: 'anatomy', label: 'Anatomia' },
    { key: 'conditions', label: 'Patologie' },
    { key: 'assessment', label: 'Valutazione' },
    { key: 'rehab', label: 'Riabilitazione' },
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.6) 0%, rgba(244,63,94,0.5) 100%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT.gradient }} />
            Pelvic Health Atlas
          </div>
          <h1 className="font-display text-6xl font-bold tracking-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: ACCENT.gradient }}
            >
              Pelvic Floor
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
              Pelvic Floor Anatomy
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              Muscoli, fasce, legamenti e concetti chiave che spiegano come il pavimento pelvico funziona come sistema integrato.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              {OVERVIEW_IMAGES.filter((img) => img.file !== 'pelvic-floor-inferior-view.png').map((img) => (
                <button
                  key={img.file}
                  onClick={() => setExpandedImage(img)}
                  className="group relative rounded-2xl border border-black/[0.06] dark:border-white/10 bg-[#08090b] overflow-hidden"
                >
                  <img
                    src={`${IMAGE_BASE}/${img.file}`}
                    alt={img.label}
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-xs font-semibold text-white">{img.label}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mb-8">
              <button
                onClick={() => setExpandedImage({ file: 'pelvic-floor-inferior-view.png', label: 'Vista Inferiore (Femminile)' })}
                className="group relative w-full rounded-2xl border border-black/[0.06] dark:border-white/10 bg-[#08090b] overflow-hidden"
              >
                <img
                  src={`${IMAGE_BASE}/pelvic-floor-inferior-view.png`}
                  alt="Vista Inferiore (Femminile)"
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-xs font-semibold text-white">Vista Inferiore (Femminile) — piano perineale, tre compartimenti</p>
                </div>
              </button>
            </div>

            <div className="mb-10 rounded-2xl border border-pink-400/20 bg-pink-400/5 p-6">
              <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                Il pavimento pelvico è un sistema muscolo-fasciale a forma di imbuto che chiude inferiormente la cavità addomino-pelvica, sostenendo vescica, utero/prostata e retto. Non è un blocco muscolare isolato: lavora in coordinazione con muscolatura addominale profonda, diaframma respiratorio e struttura connettivale circostante (fasce e legamenti) per contrastare le pressioni intra-addominali generate da respirazione, tosse, sforzo e sollevamento pesi. Il suo corretto funzionamento dipende dall'equilibrio tra tono di riposo (chiusura degli orifizi), capacità contrattile volontaria (continenza attiva) e capacità di rilasciamento coordinato (minzione, defecazione, parto). Le sezioni sottostanti approfondiscono la componente muscolare, quella fasciale/legamentosa, e i due concetti — la teoria della vela e le sinergie muscolari — che spiegano come queste parti lavorano insieme.
              </p>
            </div>

            {structuresLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {structuresError && <p className="text-sm text-red-500">{structuresError}</p>}

            {!structuresLoading && !structuresError && (
              <div className="space-y-8">
                {(['muscle', 'fascia_ligament', 'concept'] as const).map((cat) => {
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
                      <div className="grid sm:grid-cols-2 gap-3">
                        {items.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => router.push(`/dashboard/pelvic-floor/structure/${s.slug}`)}
                            className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 hover:border-pink-400/40 transition-colors"
                          >
                            <p className="text-sm font-semibold text-ink dark:text-white">{s.name}</p>
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

        {subView === 'conditions' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              Related Conditions
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              Patologie organizzate per compartimento. Tocca una card per obiettivi, test clinici ed esercizi.
            </p>

            {conditionsLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {conditionsError && <p className="text-sm text-red-500">{conditionsError}</p>}

            {!conditionsLoading && !conditionsError && (
              <div className="space-y-8">
                {(['anterior', 'central', 'posterior', 'systemic'] as const).map((comp) => {
                  const items = conditions.filter((c) => c.compartment === comp);
                  if (items.length === 0) return null;
                  return (
                    <div key={comp}>
                      <h3
                        className="text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        {COMPARTMENT_LABEL[comp] ?? comp}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {items.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCondition(c)}
                            className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 hover:border-pink-400/40 transition-colors"
                          >
                            <p className="text-sm font-semibold text-ink dark:text-white">{c.condition_name}</p>
                            {c.evidence_level && (
                              <span className="inline-block text-[10px] font-bold uppercase tracking-wide mt-2 text-ink/40 dark:text-white/40">
                                Evidence: {c.evidence_level}
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

        {subView === 'assessment' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              Clinical Assessment
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              Test clinici e protocolli di valutazione manuale e strumentale.
            </p>

            <div className="mb-8 rounded-2xl border border-pink-400/20 bg-pink-400/5 p-6">
              <p className="text-sm font-semibold text-ink dark:text-white mb-2">
                Questionario Anamnestico Interattivo
              </p>
              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-4">
                Raccolta strutturata di anamnesi intestinale, urinaria e del dolore pelvico, con riepilogo finale organizzato per area.
              </p>
              <button
                onClick={() => router.push('/dashboard/pelvic-floor/questionnaire')}
                className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ background: ACCENT.gradient }}
              >
                Avvia Questionario
              </button>
            </div>

            {testsLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {testsError && <p className="text-sm text-red-500">{testsError}</p>}

            {!testsLoading && !testsError && (
              <div className="space-y-8">
                {(['neuropathy', 'manual_assessment', 'urodynamic', 'questionnaire'] as const).map((cat) => {
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
              Protocolli di esercizio, biofeedback, elettrostimolazione e riabilitazione per popolazioni speciali.
            </p>

            {rehabLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
            )}
            {rehabError && <p className="text-sm text-red-500">{rehabError}</p>}

            {!rehabLoading && !rehabError && (
              <div className="space-y-8">
                {(['kegel', 'biofeedback_electrostim', 'bladder_training', 'postpartum', 'special_population'] as const).map((cat) => {
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
                {selectedCondition.progression_criteria && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Criteri di progressione</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedCondition.progression_criteria}</p>
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
