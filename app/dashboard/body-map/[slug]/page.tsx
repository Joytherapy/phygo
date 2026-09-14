'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Activity, Stethoscope, AlertTriangle, Sparkles, Send, Loader2, Bone, Zap, BookOpen, ClipboardCheck, Quote, Link2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ClinicalActionBar from '@/components/ClinicalActionBar';
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext';
import { ZONE_ANATOMY } from '@/lib/bodyMapAnatomy';

// Adiacenze anatomiche/cliniche tra zone muscolari e ossee — è il cuore del
// cross-linking muscolo <-> osso che nessun altro atlante 3D generico offre:
// da un osso si arriva subito al muscolo che lo muove (e viceversa), invece
// di dover tornare al modello e ricliccare a mano. Elenco intenzionalmente
// corto (max 4) per restare uno strumento di navigazione, non un altro muro
// di link.
const RELATED_ZONES: Record<string, string[]> = {
  'cervical-spine': ['bone-cervicale', 'bone-cranio', 'trapezius'],
  trapezius: ['shoulder', 'bone-clavicola-scapola', 'bone-cervicale'],
  shoulder: ['bone-omero', 'bone-clavicola-scapola', 'biceps'],
  chest: ['bone-coste-sterno', 'shoulder'],
  biceps: ['shoulder', 'elbow', 'bone-omero'],
  triceps: ['shoulder', 'elbow', 'bone-omero'],
  elbow: ['bone-omero', 'bone-radio-ulna', 'forearm'],
  forearm: ['bone-radio-ulna', 'wrist-hand', 'elbow'],
  'wrist-hand': ['bone-mano', 'bone-radio-ulna', 'forearm'],
  'core-abdomen': ['bone-bacino', 'lumbar-spine'],
  'thoracic-spine': ['bone-dorsale', 'bone-coste-sterno', 'lumbar-spine'],
  'lumbar-spine': ['bone-lombare', 'bone-sacro', 'hip'],
  hip: ['bone-bacino', 'bone-femore', 'glutes'],
  glutes: ['hip', 'bone-bacino', 'hamstrings'],
  quadriceps: ['hip', 'knee', 'bone-femore'],
  hamstrings: ['hip', 'knee', 'bone-femore'],
  knee: ['bone-femore', 'bone-tibia-perone', 'quadriceps'],
  calf: ['bone-tibia-perone', 'ankle-foot'],
  'ankle-foot': ['bone-piede', 'bone-tibia-perone', 'calf'],
  'bone-cranio': ['bone-cervicale', 'cervical-spine'],
  'bone-clavicola-scapola': ['bone-omero', 'shoulder', 'trapezius'],
  'bone-coste-sterno': ['bone-dorsale', 'chest', 'thoracic-spine'],
  'bone-omero': ['bone-clavicola-scapola', 'shoulder', 'biceps', 'triceps'],
  'bone-radio-ulna': ['bone-mano', 'forearm', 'elbow'],
  'bone-mano': ['bone-radio-ulna', 'wrist-hand'],
  'bone-bacino': ['bone-sacro', 'hip', 'core-abdomen'],
  'bone-sacro': ['bone-bacino', 'lumbar-spine', 'hip'],
  'bone-femore': ['bone-tibia-perone', 'hip', 'quadriceps'],
  'bone-tibia-perone': ['bone-femore', 'bone-piede', 'knee', 'calf'],
  'bone-piede': ['bone-tibia-perone', 'ankle-foot'],
  'bone-cervicale': ['bone-cranio', 'cervical-spine', 'trapezius'],
  'bone-dorsale': ['bone-coste-sterno', 'thoracic-spine'],
  'bone-lombare': ['bone-sacro', 'lumbar-spine', 'core-abdomen'],
};

interface ExerciseItem {
  id: string;
  title: string;
  level: string;
  body_position: string;
  equipment: string;
  image_url: string | null;
  goal: string | null;
}

interface ConditionItem {
  id: number;
  condition_name: string;
  goals: string | null;
  clinical_tests: string | null;
  red_flags: string | null;
  contraindications: string | null;
  typical_exercises: string | null;
  progression_criteria: string | null;
  evidence_level: string | null;
  return_to_activity_criteria?: string | null;
  outcome_measures?: string | null;
  source?: string | null;
  source_date?: string | null;
}

interface HubData {
  zone: { id: string; name: string; slug: string };
  exercises: ExerciseItem[];
  totalExercises: number;
  conditions: ConditionItem[];
  plan: string;
  /** Present when the API found ZONE_ANATOMY for this slug — translated server-side when lang !== 'it', otherwise the original Italian text passed through unchanged. */
  anatomy?: { anatomy: string; innervation: string; biomechanics: string; clinicalRelevance: string };
}

const levelColor: Record<string, string> = {
  Gentle: '#32D6A0',
  Active: '#4F7CFF',
  Challenge: '#A855F7',
};

const zoneStarterQuestions: Record<string, string> = {
  'cervical-spine': "Quali sono i segnali di allarme (red flags) da escludere prima di trattare una cervicalgia meccanica?",
  'shoulder': "Come distinguo clinicamente un conflitto subacromiale da una capsulite adesiva in fase iniziale?",
  'knee': "Quali criteri uso per decidere se un paziente con lesione del LCA può tornare allo sport?",
  'hip': "Quali test clinici differenziano un conflitto femoro-acetabolare da una coxartrosi iniziale?",
  'lumbar-spine': "Quali red flags devo escludere in un paziente con lombalgia acuta prima di iniziare la riabilitazione?",
};

export default function ZoneHubPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<ConditionItem | null>(null);

  const [askOpen, setAskOpen] = useState(false);
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState('');

  const { lang } = useLanguage();
  const ui = useUiStrings();

  // All 34 zone names (20 muscular + 14 bone) resolved through the shared,
  // localized ui.bodyMap maps — used only to label the "Related Zones" links
  // below, so we don't need an extra API call just for a display name.
  const zoneDisplayName = (slug: string): string =>
    (ui.bodyMap.zoneNames as Record<string, string>)[slug] ??
    (ui.bodyMap.boneNames as Record<string, string>)[slug] ??
    (slug === 'whole-body' ? ui.bodyMap.ctaWholeBody : slug);

  useEffect(() => {
    fetch(`/api/body-map/${slug}?lang=${lang}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug, lang]);

  async function handleAskPhygo() {
    if (!askQuestion.trim() || !data) return;
    setAskLoading(true);
    setAskError('');
    setAskAnswer('');
    try {
      // Contesto arricchito con le patologie e i red flag realmente curati
      // per questa zona (non solo il nome) -- risposte ancorate a quello che
      // Phygo ha gia verificato per questa regione, non generiche.
      const zoneConditionNames = data.conditions.slice(0, 6).map((c) => c.condition_name);
      const zoneRedFlags = Array.from(
        new Set(data.conditions.map((c) => c.red_flags).filter(Boolean))
      ).slice(0, 4);
      const contextParts = [
        `The clinician is reviewing the "${data.zone.name}" anatomical region in the Body Map tool (${
          data.zone.slug.startsWith('bone-') ? 'skeletal/X-ray view' : 'muscular view'
        }).`,
      ];
      if (zoneConditionNames.length > 0) {
        contextParts.push(`Conditions curated by Phygo for this region: ${zoneConditionNames.join(', ')}.`);
      }
      if (zoneRedFlags.length > 0) {
        contextParts.push(`Known red flags to screen for in this region: ${zoneRedFlags.join(' | ')}`);
      }

      const res = await fetch('/api/ask-phygo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: askQuestion,
          noteContext: contextParts.join(' '),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAskError(json.error || ui.bodyMap.askGenericError);
      } else {
        setAskAnswer(json.answer);
      }
    } catch {
      setAskError(ui.bodyMap.askGenericErrorRetry);
    } finally {
      setAskLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#08090b] flex items-center justify-center">
        <Navbar />
        <p className="text-ink/40 dark:text-white/40">{ui.common.loading}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#08090b] flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <p className="text-ink/60 dark:text-white/60 mb-4">{ui.bodyMap.zoneNotFound}</p>
          <button
            onClick={() => router.push('/dashboard/body-map')}
            className="text-sm font-semibold text-[#4F7CFF]"
          >
            {"\u2190"} {ui.bodyMap.backToBodyMap}
          </button>
        </div>
      </div>
    );
  }

  const { zone, exercises, totalExercises, conditions } = data;
  // Prefer the API's copy (translated server-side when lang !== 'it') over
  // the local ZONE_ANATOMY lookup, which stays only as an it-locale fallback
  // for the rare case data.anatomy didn't come back for some reason.
  const anatomyData = data.anatomy ?? ZONE_ANATOMY[zone.slug];
  const isBoneZone = zone.slug.startsWith('bone-');

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
        <button
          onClick={() => router.push('/dashboard/body-map')}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          {ui.bodyMap.backToBodyMap}
        </button>

        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]" />
            {isBoneZone ? ui.bodyMap.zoneTypeSkeletal : ui.bodyMap.zoneTypeAnatomical}
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight">
            {zoneDisplayName(zone.slug)}
          </h1>
          <div className="mt-4">
            <ClinicalActionBar contentType="anatomical_zone" contentId={zone.id} label={zoneDisplayName(zone.slug)} section="Body Map" />
          </div>

          {(RELATED_ZONES[zone.slug] || []).length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink/35 dark:text-white/35 mr-1">
                <Link2 size={11} />
                {ui.bodyMap.relatedZonesLabel}
              </span>
              {(RELATED_ZONES[zone.slug] || []).map((relSlug) => (
                <button
                  key={relSlug}
                  onClick={() => router.push(`/dashboard/body-map/${relSlug}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:border-black/[0.14] dark:hover:border-white/20 transition-all text-xs font-medium"
                >
                  {relSlug.startsWith('bone-') && <Bone size={11} className="text-[#4F7CFF]" />}
                  {zoneDisplayName(relSlug)}
                </button>
              ))}
            </div>
          )}
        </div>

        {anatomyData && (
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {(
              [
                { key: 'anatomy', label: ui.anatomy.anatomy, icon: Bone, color: '#4F7CFF' },
                { key: 'innervation', label: ui.anatomy.innervation, icon: Zap, color: '#A855F7' },
                { key: 'biomechanics', label: ui.anatomy.biomechanics, icon: Activity, color: '#32D6A0' },
                { key: 'clinicalRelevance', label: ui.anatomy.clinicalRelevance, icon: BookOpen, color: '#F59E0B' },
              ] as const
            ).map(({ key, label, icon: Icon, color }) => (
              <div
                key={key}
                className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${color}1F`, color }}
                  >
                    <Icon size={14} />
                  </span>
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60">
                    {label}
                  </h3>
                </div>
                <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed">
                  {anatomyData[key]}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 pt-10 border-t border-black/[0.06] dark:border-white/10">
          {!askOpen ? (
            <button
              onClick={() => {
                setAskOpen(true);
                setAskQuestion(zoneStarterQuestions[zone.slug] || '');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.3)] hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
            >
              <Sparkles size={16} />
              {ui.bodyMap.askPhygoButton}
            </button>
          ) : (
            <div className="rounded-[24px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-[#4F7CFF]" />
                <p className="text-sm font-semibold">{ui.bodyMap.askPhygoHeadingPrefix.replace('{zone}', zoneDisplayName(zone.slug))}</p>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value)}
                  rows={2}
                  className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-3 py-2 text-sm outline-none focus:border-[#4F7CFF] resize-none"
                  placeholder={ui.bodyMap.askPlaceholder}
                />
                <button
                  onClick={handleAskPhygo}
                  disabled={askLoading || !askQuestion.trim()}
                  className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl text-white disabled:opacity-50 self-end"
                  style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
                >
                  {askLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              {askError && (
                <p className="text-xs text-red-500 mt-2">{askError}</p>
              )}
              {askAnswer && (
                <div className="mt-4 pt-4 border-t border-black/[0.06] dark:border-white/10 text-sm text-ink/70 dark:text-white/70 leading-relaxed whitespace-pre-wrap">
                  {askAnswer}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-10 pt-10 border-t border-black/[0.06] dark:border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4F7CFF]/[0.12] text-[#4F7CFF]">
              <Activity size={14} />
            </span>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60">
              {ui.fields.featuredExercises}
            </h2>
          </div>

          {exercises.length === 0 ? (
            <p className="text-sm text-ink/40 dark:text-white/40">
              {ui.bodyMap.noExercisesLinked}
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl shadow-sm hover:shadow-md transition-all"
                >
                  {ex.image_url && (
                    <div className="aspect-video bg-white flex items-center justify-center rounded-t-2xl overflow-hidden">
                      <img
                        src={ex.image_url}
                        alt={ex.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white mb-2"
                      style={{ backgroundColor: levelColor[ex.level] || '#4F7CFF' }}
                    >
                      {ex.level}
                    </span>
                    <p className="text-sm font-semibold text-ink dark:text-white">{ex.title}</p>
                    <p className="text-xs text-ink/40 dark:text-white/40 mt-0.5">
                      {ex.body_position}
                      {ex.equipment ? ` \u00b7 ${ex.equipment}` : ''}
                    </p>
                    <div className="mt-2">
                      <ClinicalActionBar contentType="exercise" contentId={ex.id} label={ex.title} section="Body Map" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalExercises > exercises.length && (
            <button
              onClick={() => router.push('/dashboard/library')}
              className="mt-4 text-sm font-semibold text-[#4F7CFF] hover:underline"
            >
              {ui.bodyMap.seeAllExercises.replace('{count}', String(totalExercises))}
            </button>
          )}
        </div>

        <div className="mt-10 pt-10 border-t border-black/[0.06] dark:border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#32D6A0]/[0.12] text-[#32D6A0]">
              <Stethoscope size={14} />
            </span>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60">
              {ui.bodyMap.relatedConditionsHeading}
            </h2>
          </div>

          {conditions.length === 0 ? (
            <p className="text-sm text-ink/40 dark:text-white/40">
              {ui.bodyMap.noConditionsLinked}
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {conditions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCondition(c)}
                  className="group flex items-start justify-between gap-3 text-left px-4 py-3 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:border-black/[0.14] dark:hover:border-white/20 transition-all"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink dark:text-white leading-snug">
                    {c.condition_name}
                    {c.source && (
                      <Quote size={10} className="shrink-0 text-ink/25 dark:text-white/25" aria-label={ui.bodyMap.sourceCitedAriaLabel} />
                    )}
                  </span>
                  {c.evidence_level && (
                    <span
                      className="shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white"
                      style={{
                        backgroundColor:
                          c.evidence_level.toLowerCase() === 'high'
                            ? '#32D6A0'
                            : c.evidence_level.toLowerCase() === 'moderate'
                            ? '#4F7CFF'
                            : '#94A3B8',
                      }}
                    >
                      {c.evidence_level}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedCondition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedCondition(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0e0f12] border border-black/[0.06] dark:border-white/10 rounded-[28px] p-8 max-w-xl w-full max-h-[85vh] overflow-auto shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-display text-2xl font-bold pr-4">
                  {selectedCondition.condition_name}
                </h3>
                <button
                  onClick={() => setSelectedCondition(null)}
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {selectedCondition.evidence_level && (
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white mb-4"
                  style={{
                    backgroundColor:
                      selectedCondition.evidence_level.toLowerCase() === 'high'
                        ? '#32D6A0'
                        : selectedCondition.evidence_level.toLowerCase() === 'moderate'
                        ? '#4F7CFF'
                        : '#94A3B8',
                  }}
                >
                  {ui.fields.evidence}: {selectedCondition.evidence_level}
                </span>
              )}

              <div className="mb-4">
                <ClinicalActionBar contentType="condition" contentId={String(selectedCondition.id)} label={selectedCondition.condition_name} section="Body Map" />
              </div>

              <div className="space-y-4 text-sm">
                {selectedCondition.goals && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.fields.goals}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.goals}
                    </p>
                  </div>
                )}
                {selectedCondition.clinical_tests && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.fields.clinicalTests}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.clinical_tests}
                    </p>
                  </div>
                )}
                {selectedCondition.outcome_measures && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.fields.outcomeMeasures}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.outcome_measures}
                    </p>
                  </div>
                )}
                {selectedCondition.typical_exercises && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.fields.typicalExercises}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.typical_exercises}
                    </p>
                  </div>
                )}
                {selectedCondition.progression_criteria && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.fields.progressionCriteria}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.progression_criteria}
                    </p>
                  </div>
                )}
                {selectedCondition.return_to_activity_criteria && (
                  <div className="flex items-start gap-2">
                    <ClipboardCheck size={14} className="text-[#32D6A0] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.fields.returnToActivityCriteria}</p>
                      <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                        {selectedCondition.return_to_activity_criteria}
                      </p>
                    </div>
                  </div>
                )}
                {selectedCondition.contraindications && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.fields.contraindications}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.contraindications}
                    </p>
                  </div>
                )}
                {selectedCondition.red_flags && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} className="text-red-500" />
                      <p className="font-semibold text-red-500 text-xs uppercase tracking-wide">
                        {ui.fields.redFlags}
                      </p>
                    </div>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.red_flags}
                    </p>
                  </div>
                )}
                {lang !== 'it' &&
                  !(selectedCondition as any)._translationFailed &&
                  (selectedCondition.red_flags || selectedCondition.contraindications) && (
                    <p className="text-[11px] italic text-ink/35 dark:text-white/35">
                      {ui.common.machineTranslatedNotice}
                    </p>
                  )}
              </div>

              {selectedCondition.source && (
                <div className="mt-5 pt-4 border-t border-black/[0.06] dark:border-white/10 flex items-start gap-2">
                  <Quote size={12} className="text-ink/30 dark:text-white/30 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-ink/40 dark:text-white/40 leading-relaxed italic">
                    {selectedCondition.source}
                    {selectedCondition.source_date ? ` (${selectedCondition.source_date})` : ''}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}