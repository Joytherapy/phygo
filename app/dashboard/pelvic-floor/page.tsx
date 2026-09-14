'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { X, Dumbbell, Layers, Lightbulb, Activity, Zap, Droplets, Baby, Users } from 'lucide-react';
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext';

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

const STRUCTURE_CATEGORY_ICON: Record<string, typeof Dumbbell> = {
  muscle: Dumbbell,
  fascia_ligament: Layers,
  concept: Lightbulb,
  nerve: Activity,
};

const REHAB_CATEGORY_ICON: Record<string, typeof Dumbbell> = {
  kegel: Dumbbell,
  biofeedback_electrostim: Zap,
  bladder_training: Droplets,
  postpartum: Baby,
  special_population: Users,
};

const ACCENT = {
  gradient: 'linear-gradient(90deg, #EC4899 0%, #F43F5E 100%)',
  solid: '#EC4899',
};

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

export default function PelvicFloorPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const ui = useUiStrings();
  const t = ui.pelvicFloorAtlas;
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

  const OVERVIEW_IMAGES = [
    { file: 'pelvic-floor-female-sagittal.png', label: t.imageLabels.femaleSagittal },
    { file: 'pelvic-floor-male-sagittal.png', label: t.imageLabels.maleSagittal },
    { file: 'pelvic-floor-inferior-view.png', label: t.imageLabels.inferiorView },
  ];

  useEffect(() => {
    if (subView !== 'anatomy' || hasFetchedStructures) return;
    const fetchStructures = async () => {
      setStructuresLoading(true);
      setStructuresError(null);
      try {
        const res = await fetch(`/api/pelvic-floor/structures?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero delle strutture');
        const data = await res.json();
        if (Array.isArray(data.structures)) {
          setStructures(data.structures);
          setHasFetchedStructures(true);
        }
      } catch (err) {
        setStructuresError(t.errorStructures);
        console.error(err);
      } finally {
        setStructuresLoading(false);
      }
    };
    fetchStructures();
  }, [subView, hasFetchedStructures, lang]);

  useEffect(() => {
    if (subView !== 'conditions' || hasFetchedConditions) return;
    const fetchConditions = async () => {
      setConditionsLoading(true);
      setConditionsError(null);
      try {
        const res = await fetch(`/api/pelvic-floor/conditions?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero delle patologie');
        const data = await res.json();
        if (Array.isArray(data.conditions)) {
          setConditions(data.conditions);
          setHasFetchedConditions(true);
        }
      } catch (err) {
        setConditionsError(t.errorConditions);
        console.error(err);
      } finally {
        setConditionsLoading(false);
      }
    };
    fetchConditions();
  }, [subView, hasFetchedConditions, lang]);

  useEffect(() => {
    if (subView !== 'assessment' || hasFetchedTests) return;
    const fetchTests = async () => {
      setTestsLoading(true);
      setTestsError(null);
      try {
        const res = await fetch(`/api/pelvic-floor/tests?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero dei test');
        const data = await res.json();
        if (Array.isArray(data.tests)) {
          setTests(data.tests);
          setHasFetchedTests(true);
        }
      } catch (err) {
        setTestsError(t.errorTests);
        console.error(err);
      } finally {
        setTestsLoading(false);
      }
    };
    fetchTests();
  }, [subView, hasFetchedTests, lang]);

  useEffect(() => {
    if (subView !== 'rehab' || hasFetchedRehab) return;
    const fetchRehab = async () => {
      setRehabLoading(true);
      setRehabError(null);
      try {
        const res = await fetch(`/api/pelvic-floor/rehab?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero dei contenuti riabilitativi');
        const data = await res.json();
        if (Array.isArray(data.rehab)) {
          setRehab(data.rehab);
          setHasFetchedRehab(true);
        }
      } catch (err) {
        setRehabError(t.errorRehab);
        console.error(err);
      } finally {
        setRehabLoading(false);
      }
    };
    fetchRehab();
  }, [subView, hasFetchedRehab, lang]);

  const SUB_TABS: { key: SubView; label: string }[] = [
    { key: 'anatomy', label: t.subTabs.anatomy },
    { key: 'conditions', label: t.subTabs.conditions },
    { key: 'assessment', label: t.subTabs.assessment },
    { key: 'rehab', label: t.subTabs.rehab },
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
            {t.badge}
          </div>
          <h1 className="font-display text-6xl font-bold tracking-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: ACCENT.gradient }}
            >
              {t.heading}
            </span>
          </h1>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex flex-wrap justify-center rounded-full border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-1">
            {SUB_TABS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSubView(s.key)}
                className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  subView === s.key
                    ? 'text-white'
                    : 'text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white'
                }`}
                style={subView === s.key ? { background: ACCENT.solid } : undefined}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {subView === 'anatomy' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              {t.anatomyHeading}
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              {t.anatomyIntro}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              {OVERVIEW_IMAGES.filter((img) => img.file !== 'pelvic-floor-inferior-view.png').map((img) => (
                <button
                  key={img.file}
                  onClick={() => setExpandedImage(img)}
                  className="group relative rounded-2xl border border-black/[0.06] dark:border-white/10 bg-[#08090b] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-pink-500/10 transition-shadow"
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
                onClick={() => setExpandedImage({ file: 'pelvic-floor-inferior-view.png', label: t.imageLabels.inferiorViewFull })}
                className="group relative w-full rounded-2xl border border-black/[0.06] dark:border-white/10 bg-[#08090b] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-pink-500/10 transition-shadow"
              >
                <img
                  src={`${IMAGE_BASE}/pelvic-floor-inferior-view.png`}
                  alt={t.imageLabels.inferiorViewFull}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-xs font-semibold text-white">{t.imageLabels.inferiorViewFull}</p>
                </div>
              </button>
            </div>

            <div className="mb-10 rounded-2xl border border-pink-400/20 bg-pink-400/5 p-6">
              <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                {t.overviewIntro}
              </p>
            </div>

            {structuresLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">{t.loading}</p>
            )}
            {structuresError && <p className="text-sm text-red-500">{structuresError}</p>}

            {!structuresLoading && !structuresError && (
              <div className="space-y-8">
                {(['muscle', 'fascia_ligament', 'nerve', 'concept'] as const).map((cat) => {
                  const items = structures.filter((s) => s.category === cat);
                  if (items.length === 0) return null;
                  const Icon = STRUCTURE_CATEGORY_ICON[cat];
                  return (
                    <div key={cat}>
                      <h3
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        <Icon size={13} />
                        {t.structureCategoryLabels[cat] ?? cat}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {items.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => router.push(`/dashboard/pelvic-floor/structure/${s.slug}`)}
                            className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 hover:border-pink-400/40 hover:-translate-y-0.5 transition-all"
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
              {t.conditionsHeading}
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              {t.conditionsIntro}
            </p>

            {conditionsLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">{t.loading}</p>
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
                        {t.compartmentLabels[comp] ?? comp}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {items.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCondition(c)}
                            className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 hover:border-pink-400/40 hover:-translate-y-0.5 transition-all"
                          >
                            <p className="text-sm font-semibold text-ink dark:text-white">{c.condition_name}</p>
                            {c.evidence_level && (
                              <span className="inline-block text-[10px] font-bold uppercase tracking-wide mt-2 text-ink/40 dark:text-white/40">
                                {ui.fields.evidence}: {c.evidence_level}
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
              {t.assessmentHeading}
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              {t.assessmentIntro}
            </p>

            <div className="mb-8 rounded-2xl border border-pink-400/20 bg-pink-400/5 p-6">
              <p className="text-sm font-semibold text-ink dark:text-white mb-2">
                {ui.clinicalToolkit.pelvicFloor.questionnaireCalloutHeading}
              </p>
              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-4">
                {ui.clinicalToolkit.pelvicFloor.questionnaireCalloutDescription}
              </p>
              <button
                onClick={() => router.push('/dashboard/pelvic-floor/questionnaire')}
                className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ background: ACCENT.gradient }}
              >
                {ui.clinicalToolkit.pelvicFloor.startQuestionnaireLabel}
              </button>
            </div>

            {testsLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">{t.loading}</p>
            )}
            {testsError && <p className="text-sm text-red-500">{testsError}</p>}

            {!testsLoading && !testsError && (
              <div className="space-y-8">
                {(['neuropathy', 'manual_assessment', 'urodynamic', 'questionnaire'] as const).map((cat) => {
                  const items = tests.filter((t2) => t2.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3
                        className="text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        {ui.clinicalToolkit.pelvicFloor.categoryLabels[cat] ?? cat}
                      </h3>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5"
                          >
                            <p className="text-sm font-semibold text-ink dark:text-white mb-2">{item.name}</p>
                            {item.procedure && (
                              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-2">
                                <span className="font-semibold">{ui.clinicalToolkit.pelvicFloor.procedureLabel}: </span>{item.procedure}
                              </p>
                            )}
                            {item.interpretation && (
                              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed">
                                <span className="font-semibold">{ui.clinicalToolkit.pelvicFloor.interpretationLabel}: </span>{item.interpretation}
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
              {t.rehabHeading}
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              {t.rehabIntro}
            </p>

            {rehabLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">{t.loading}</p>
            )}
            {rehabError && <p className="text-sm text-red-500">{rehabError}</p>}

            {!rehabLoading && !rehabError && (
              <div className="space-y-8">
                {(['kegel', 'biofeedback_electrostim', 'bladder_training', 'postpartum', 'special_population'] as const).map((cat) => {
                  const items = rehab.filter((r) => r.category === cat);
                  if (items.length === 0) return null;
                  const Icon = REHAB_CATEGORY_ICON[cat];
                  return (
                    <div key={cat}>
                      <h3
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        <Icon size={13} />
                        {t.rehabCategoryLabels[cat] ?? cat}
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
                                  {t.protocolLabel}
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
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.fields.goals}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedCondition.goals}</p>
                  </div>
                )}
                {selectedCondition.clinical_tests && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.fields.clinicalTests}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedCondition.clinical_tests}</p>
                  </div>
                )}
                {selectedCondition.typical_exercises && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.fields.typicalExercises}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedCondition.typical_exercises}</p>
                  </div>
                )}
                {selectedCondition.progression_criteria && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.fields.progressionCriteria}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedCondition.progression_criteria}</p>
                  </div>
                )}
                {selectedCondition.red_flags && (
                  <div>
                    <p className="font-semibold text-red-500 mb-1">{ui.fields.redFlags}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedCondition.red_flags}</p>
                  </div>
                )}
                {selectedCondition.contraindications && (
                  <div>
                    <p className="font-semibold text-red-500 mb-1">{ui.fields.contraindications}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selectedCondition.contraindications}</p>
                  </div>
                )}
                {selectedCondition.evidence_level && (
                  <div className="pt-2 border-t border-black/[0.06] dark:border-white/10">
                    <p className="text-xs text-ink/40 dark:text-white/40">
                      {ui.fields.evidence}: {selectedCondition.evidence_level}
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
