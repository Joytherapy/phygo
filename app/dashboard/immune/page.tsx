'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ClinicalActionBar from '@/components/ClinicalActionBar';
import { X, Search } from 'lucide-react';
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext';
import EvidenceBadge, { SourceCitation } from '@/components/EvidenceBadge';

type SubView = 'anatomy' | 'conditions' | 'assessment' | 'rehab';
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
  evidence_level?: string;
  source?: string;
  source_date?: string;
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

const ACCENT = {
  gradient: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)',
  solid: '#4F7CFF',
};

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

export default function ImmunePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const ui = useUiStrings();
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setHasFetchedStructures(false);
    setHasFetchedConditions(false);
    setHasFetchedTests(false);
    setHasFetchedRehab(false);
  }, [lang]);

  useEffect(() => {
    setSearchQuery('');
  }, [subView]);

  useEffect(() => {
    if (subView !== 'anatomy' || hasFetchedStructures) return;
    const fetchStructures = async () => {
      setStructuresLoading(true);
      setStructuresError(null);
      try {
        const res = await fetch(`/api/immune/structures?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero delle strutture');
        const data = await res.json();
        setStructures(data.structures ?? []);
        setHasFetchedStructures(true);
      } catch (err) {
        setStructuresError(ui.immune.errorLoadingStructures);
        console.error(err);
      } finally {
        setStructuresLoading(false);
      }
    };
    fetchStructures();
  }, [subView, hasFetchedStructures, lang, ui]);

  useEffect(() => {
    if (subView !== 'conditions' || hasFetchedConditions) return;
    const fetchConditions = async () => {
      setConditionsLoading(true);
      setConditionsError(null);
      try {
        const res = await fetch(`/api/immune/conditions?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero delle patologie');
        const data = await res.json();
        setConditions(data.conditions ?? []);
        setHasFetchedConditions(true);
      } catch (err) {
        setConditionsError(ui.immune.errorLoadingConditions);
        console.error(err);
      } finally {
        setConditionsLoading(false);
      }
    };
    fetchConditions();
  }, [subView, hasFetchedConditions, lang, ui]);

  useEffect(() => {
    if (subView !== 'assessment' || hasFetchedTests) return;
    const fetchTests = async () => {
      setTestsLoading(true);
      setTestsError(null);
      try {
        const res = await fetch(`/api/immune/tests?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero dei test');
        const data = await res.json();
        setTests(data.tests ?? []);
        setHasFetchedTests(true);
      } catch (err) {
        setTestsError(ui.immune.errorLoadingTests);
        console.error(err);
      } finally {
        setTestsLoading(false);
      }
    };
    fetchTests();
  }, [subView, hasFetchedTests, lang, ui]);

  useEffect(() => {
    if (subView !== 'rehab' || hasFetchedRehab) return;
    const fetchRehab = async () => {
      setRehabLoading(true);
      setRehabError(null);
      try {
        const res = await fetch(`/api/immune/rehab?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero dei contenuti riabilitativi');
        const data = await res.json();
        setRehab(data.rehab ?? []);
        setHasFetchedRehab(true);
      } catch (err) {
        setRehabError(ui.immune.errorLoadingRehab);
        console.error(err);
      } finally {
        setRehabLoading(false);
      }
    };
    fetchRehab();
  }, [subView, hasFetchedRehab, lang, ui]);

  const SUB_TABS: { key: SubView; label: string }[] = [
    { key: 'anatomy', label: ui.immune.subTabs.anatomy },
    { key: 'conditions', label: ui.immune.subTabs.conditions },
    { key: 'assessment', label: ui.immune.subTabs.assessment },
    { key: 'rehab', label: ui.immune.subTabs.rehab },
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesStructure = (s: StructureItem) =>
    normalizedQuery === '' ||
    s.name.toLowerCase().includes(normalizedQuery) ||
    (s.anatomy ?? '').toLowerCase().includes(normalizedQuery) ||
    (s.function ?? '').toLowerCase().includes(normalizedQuery) ||
    (s.clinical_relevance ?? '').toLowerCase().includes(normalizedQuery);
  const matchesCondition = (c: ConditionItem) =>
    normalizedQuery === '' ||
    c.condition_name.toLowerCase().includes(normalizedQuery) ||
    (c.goals ?? '').toLowerCase().includes(normalizedQuery) ||
    (c.clinical_tests ?? '').toLowerCase().includes(normalizedQuery) ||
    (c.typical_exercises ?? '').toLowerCase().includes(normalizedQuery) ||
    (c.red_flags ?? '').toLowerCase().includes(normalizedQuery) ||
    (c.contraindications ?? '').toLowerCase().includes(normalizedQuery);
  const matchesTest = (t: TestItem) =>
    normalizedQuery === '' ||
    t.name.toLowerCase().includes(normalizedQuery) ||
    (t.procedure ?? '').toLowerCase().includes(normalizedQuery) ||
    (t.interpretation ?? '').toLowerCase().includes(normalizedQuery);
  const matchesRehab = (r: RehabItem) =>
    normalizedQuery === '' ||
    r.name.toLowerCase().includes(normalizedQuery) ||
    (r.description ?? '').toLowerCase().includes(normalizedQuery) ||
    (r.protocol ?? '').toLowerCase().includes(normalizedQuery) ||
    (r.evidence_note ?? '').toLowerCase().includes(normalizedQuery);

  const hasAnyMatchCurrent =
    subView === 'anatomy'
      ? structures.some(matchesStructure)
      : subView === 'conditions'
      ? conditions.some(matchesCondition)
      : subView === 'assessment'
      ? tests.some(matchesTest)
      : rehab.some(matchesRehab);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT.gradient }} />
            {ui.immune.atlasBadge}
          </div>
          <h1 className="font-display text-6xl font-bold tracking-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: ACCENT.gradient }}
            >
              {ui.immune.heading}
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

        {subView === 'anatomy' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              {ui.immune.anatomyHeading}
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              {ui.immune.anatomyHint}
            </p>

            <div className="mb-10 rounded-2xl border p-6" style={{ borderColor: `${ACCENT.solid}33`, background: `${ACCENT.solid}0D` }}>
              <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                {ui.immune.anatomyIntro}
              </p>
            </div>

            {structuresLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">{ui.immune.loading}</p>
            )}
            {structuresError && <p className="text-sm text-red-500">{structuresError}</p>}

            {!structuresLoading && !structuresError && normalizedQuery !== '' && !hasAnyMatchCurrent && (
              <p className="text-sm text-ink/40 dark:text-white/40 text-center">{ui.librarySearchNoResults}</p>
            )}

            {!structuresLoading && !structuresError && (
              <div className="space-y-8">
                {(
                  [
                    'primary_lymphoid_organ',
                    'secondary_lymphoid_organ',
                    'lymphatic_drainage',
                    'innate_immunity',
                    'humoral_immunity',
                    'cell_mediated_immunity',
                  ] as const
                ).map((cat) => {
                  const items = structures.filter((s) => s.category === cat && matchesStructure(s));
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3
                        className="text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        {ui.immune.categoryLabels[cat] ?? cat}
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
                              <div className="flex items-center gap-2.5 mb-3">
                                <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: ACCENT.solid }} />
                                <p className="text-sm font-semibold text-ink dark:text-white">{s.name}</p>
                              </div>
                              {s.anatomy && (
                                <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-2">
                                  <span className="font-semibold">{ui.anatomy.anatomy}: </span>{s.anatomy}
                                </p>
                              )}
                              {s.function && (
                                <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-2">
                                  <span className="font-semibold">{ui.anatomy.function}: </span>{s.function}
                                </p>
                              )}
                              {s.clinical_relevance && (
                                <p className="text-xs text-ink/50 dark:text-white/50 leading-relaxed">
                                  <span className="font-semibold">{ui.anatomy.clinicalRelevance}: </span>{s.clinical_relevance}
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
              {ui.immune.conditionsHeading}
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              {ui.immune.conditionsHint}
            </p>

            {conditionsLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">{ui.immune.loading}</p>
            )}
            {conditionsError && <p className="text-sm text-red-500">{conditionsError}</p>}

            {!conditionsLoading && !conditionsError && normalizedQuery !== '' && !hasAnyMatchCurrent && (
              <p className="text-sm text-ink/40 dark:text-white/40 text-center">{ui.librarySearchNoResults}</p>
            )}

            {!conditionsLoading && !conditionsError && (
              // Unlike Cardiopulmonary, Immune has no sub-system split
              // (immune_condition_tags.system is always 'immune'), so all
              // conditions render as a single flat list without grouping.
              <div className="grid sm:grid-cols-2 gap-3">
                {conditions.filter(matchesCondition).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCondition(c)}
                    className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 transition-colors hover:border-[#4F7CFF]/40"
                  >
                    <p className="text-sm font-semibold text-ink dark:text-white mb-2">{c.condition_name}</p>
                    <EvidenceBadge level={c.evidence_level} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {subView === 'assessment' && (
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              {ui.immune.assessmentHeading}
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              {ui.immune.assessmentHint}
            </p>

            {testsLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">{ui.immune.loading}</p>
            )}
            {testsError && <p className="text-sm text-red-500">{testsError}</p>}

            {!testsLoading && !testsError && normalizedQuery !== '' && !hasAnyMatchCurrent && (
              <p className="text-sm text-ink/40 dark:text-white/40 text-center">{ui.librarySearchNoResults}</p>
            )}

            {!testsLoading && !testsError && (
              <div className="space-y-8">
                {(['hematologic', 'immunologic', 'inflammatory_marker', 'functional'] as const).map((cat) => {
                  const items = tests.filter((t) => t.category === cat && matchesTest(t));
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3
                        className="text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        {ui.immune.testCategoryLabels[cat] ?? cat}
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
                                <span className="font-semibold">{ui.immune.procedureLabel}: </span>{t.procedure}
                              </p>
                            )}
                            {t.interpretation && (
                              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed">
                                <span className="font-semibold">{ui.immune.interpretationLabel}: </span>{t.interpretation}
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
              {ui.immune.rehabHeading}
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              {ui.immune.rehabHint}
            </p>

            {rehabLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">{ui.immune.loading}</p>
            )}
            {rehabError && <p className="text-sm text-red-500">{rehabError}</p>}

            {!rehabLoading && !rehabError && normalizedQuery !== '' && !hasAnyMatchCurrent && (
              <p className="text-sm text-ink/40 dark:text-white/40 text-center">{ui.librarySearchNoResults}</p>
            )}

            {!rehabLoading && !rehabError && (
              <div className="space-y-8">
                {(
                  [
                    'exercise_immunology',
                    'immunosuppression_precautions',
                    'inflammatory_arthritis_training',
                    'lymphedema_management',
                    'post_viral_rehabilitation',
                  ] as const
                ).map((cat) => {
                  const items = rehab.filter((r) => r.category === cat && matchesRehab(r));
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3
                        className="text-xs font-bold uppercase tracking-wide mb-3"
                        style={{ color: ACCENT.solid }}
                      >
                        {ui.immune.rehabCategoryLabels[cat] ?? cat}
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
                                  {ui.immune.protocolLabel}
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

              <div className="mb-4">
                <ClinicalActionBar contentType="condition" contentId={String(selectedCondition.id)} label={selectedCondition.condition_name} section="Immune" />
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
                    <EvidenceBadge level={selectedCondition.evidence_level} />
                    <SourceCitation source={selectedCondition.source} sourceDate={selectedCondition.source_date} />
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
