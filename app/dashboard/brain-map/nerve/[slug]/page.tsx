'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { ArrowLeft, X } from 'lucide-react';

interface NerveDetail {
  id: string;
  slug: string;
  name: string;
  region: string;
  origin?: string;
  anatomy?: string;
  motor_function?: string;
  sensory_function?: string;
  compression_site?: string;
  clinical_sign?: string;
  diagram_image?: string;
}


interface Condition {
  id: number;
  condition_name: string;
  goals?: string;
  clinical_tests?: string;
  red_flags?: string;
  contraindications?: string;
  typical_exercises?: string;
  progression_criteria?: string;
  evidence_level?: string;
}

const REGION_LABEL: Record<string, string> = {
  plexus: 'Plesso',
  upper_limb: 'Arto Superiore',
  lower_limb: 'Arto Inferiore',
  cranial: 'Nervi Cranici',
};

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

export default function NerveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [nerve, setNerve] = useState<NerveDetail | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);

  useEffect(() => {
    const fetchNerve = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/brain-map/nerve/${slug}`);
        if (!res.ok) throw new Error('Nervo non trovato');
        const data = await res.json();
        setNerve(data.nerve);
        setConditions(data.conditions ?? []);
      } catch (err) {
        setError('Impossibile caricare i dati del nervo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchNerve();
  }, [slug]);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(245,165,36,0.6) 0%, rgba(249,115,22,0.5) 100%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6 pt-40 pb-24">
        <button
          onClick={() => router.push('/dashboard/brain-map?view=nerves')}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Torna alla mappa neurologica
        </button>

        {loading && (
          <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {nerve && (
          <>
            <div className="mb-10">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white mb-3 bg-gradient-to-r from-[#F5A524] to-[#F97316]">
                {REGION_LABEL[nerve.region] ?? nerve.region}
              </span>
              <h1 className="font-display text-5xl font-bold tracking-tight">
                {nerve.name}
              </h1>
              {nerve.origin && (
                <p className="text-sm text-ink/50 dark:text-white/50 mt-3">{nerve.origin}</p>
              )}
            </div>

            {nerve.diagram_image && (
              <div className="mb-8 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-[#08090b] overflow-hidden">
                <img
                  src={`${IMAGE_BASE}/${nerve.diagram_image}`}
                  alt={`${nerve.name} diagram`}
                  className="w-full h-auto"
                />
              </div>
            )}

            {nerve.anatomy && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
                  Anatomia e decorso
                </h2>
                <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed whitespace-pre-line">
                  {nerve.anatomy}
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {nerve.motor_function && (
                <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-2">
                    Funzione motoria
                  </p>
                  <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                    {nerve.motor_function}
                  </p>
                </div>
              )}
              {nerve.sensory_function && (
                <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-2">
                    Funzione sensitiva
                  </p>
                  <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                    {nerve.sensory_function}
                  </p>
                </div>
              )}
            </div>

            {nerve.compression_site && (
              <div className="mb-4 rounded-2xl border border-[#F5A524]/20 bg-[#F5A524]/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#F5A524] mb-2">
                  Sede tipica di compressione/lesione
                </p>
                <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                  {nerve.compression_site}
                </p>
              </div>
            )}

            {nerve.clinical_sign && (
              <div className="mb-10 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-2">
                  Segno clinico caratteristico
                </p>
                <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                  {nerve.clinical_sign}
                </p>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-4">
                Patologie collegate
              </h2>
              {conditions.length === 0 && (
                <p className="text-sm text-ink/40 dark:text-white/40">
                  Nessuna patologia ancora collegata a questo nervo.
                </p>
              )}
              {conditions.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {conditions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCondition(c)}
                      className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 hover:border-[#F5A524]/40 transition-colors"
                    >
                      <p className="text-sm font-semibold text-ink dark:text-white">
                        {c.condition_name}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
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
    </div>
  );
}
