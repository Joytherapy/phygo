'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Stethoscope, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ClinicalActionBar from '@/components/ClinicalActionBar';
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext';
import type { GeriatricPrinciple, ZoneDetail } from '@/lib/brainMapContent';

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

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
}

interface HubData {
  zone: { id: string; name: string; slug: string; image_url?: string };
  conditions: ConditionItem[];
  info?: ZoneDetail;
  geriatricPrinciples: GeriatricPrinciple[];
}

export default function BrainZoneHubPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { lang } = useLanguage();
  const ui = useUiStrings();

  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<ConditionItem | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/brain-map/${slug}?lang=${lang}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug, lang]);

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
          <p className="text-ink/60 dark:text-white/60 mb-4">{ui.brainMap.zone.zoneNotFound}</p>
          <button
            onClick={() => router.push('/dashboard/brain-map')}
            className="text-sm font-semibold text-[#4F7CFF]"
          >
            {'←'} {ui.brainMap.zone.backToBrainMap}
          </button>
        </div>
      </div>
    );
  }

  const { zone, conditions, info, geriatricPrinciples } = data;

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
          onClick={() => router.push('/dashboard/brain-map')}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          {ui.brainMap.zone.backToBrainMap}
        </button>

        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]" />
            {ui.brainMap.zone.badge}
          </div>

          {zone.image_url && (
            <div className="mt-6 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-[#08090b] overflow-hidden">
              <img
                src={`${IMAGE_BASE}/${zone.image_url}`}
                alt={`${zone.name} highlighted`}
                className="w-full h-auto"
              />
            </div>
          )}

          {info && (
            <div className="mt-6 space-y-5 max-w-2xl">
              <div>
                <h3 className="text-xs font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-1.5">
                  {ui.anatomy.anatomy}
                </h3>
                <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed">{info.anatomy}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-1.5">
                  {ui.anatomy.connections}
                </h3>
                <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed">{info.connections}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-1.5">
                  {ui.anatomy.function}
                </h3>
                <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed">{info.function}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-1.5">
                  {ui.anatomy.clinicalRelevance}
                </h3>
                <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed">{info.clinicalRelevance}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-1.5">
                  {ui.anatomy.vascularSupply}
                </h3>
                <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed">{info.vascularSupply}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-4">
            {ui.brainMap.zone.geriatricHeading}
          </h2>
          <div className="space-y-4">
            {geriatricPrinciples.map((g) => (
              <div
                key={g.slug}
                className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5"
              >
                <p className="text-sm font-semibold mb-1">{g.title}</p>
                <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed">
                  {g.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope size={16} className="text-[#32D6A0]" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60">
              {ui.brainMap.relatedConditionsHeading}
            </h2>
          </div>

          {conditions.length === 0 ? (
            <p className="text-sm text-ink/40 dark:text-white/40">
              {ui.brainMap.zone.noConditionsLinked}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {conditions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCondition(c)}
                  className="px-4 py-2 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] text-sm font-medium transition-all"
                >
                  {c.condition_name}
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
                <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#32D6A0] text-white mb-4">
                  {selectedCondition.evidence_level} {ui.fields.evidence.toLowerCase()}
                </span>
              )}

              <div className="mb-4">
                <ClinicalActionBar contentType="condition" contentId={String(selectedCondition.id)} label={selectedCondition.condition_name} section="Brain Map" />
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
