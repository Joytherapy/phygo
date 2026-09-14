'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { X } from 'lucide-react';
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext';

interface BLSProcedure {
  id: string;
  name: string;
  procedure_category: string;
  age_group?: string;
  patient_position?: string;
  procedure?: string;
  key_parameters?: string;
  precautions?: string;
  evidence_note?: string;
  image_url?: string;
}

const CATEGORY_ORDER = ['adult_cpr', 'child_cpr', 'infant_cpr', 'choking', 'aed', 'team_dynamics'];

const ACCENT = {
  gradient: 'linear-gradient(90deg, #EF4444 0%, #F97316 100%)',
  solid: '#EF4444',
};

export default function BLSPage() {
  const { lang } = useLanguage();
  const ui = useUiStrings();
  const [procedures, setProcedures] = useState<BLSProcedure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BLSProcedure | null>(null);
  const [expandedImage, setExpandedImage] = useState<{ url: string; label: string } | null>(null);
  useEffect(() => {
    const fetchProcedures = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/bls/procedures?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero delle procedure');
        const data = await res.json();
        setProcedures(data.procedures ?? []);
      } catch (err) {
        setError(ui.bls.errorLoading);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProcedures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, rgba(249,115,22,0.5) 100%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT.solid }} />
            {ui.bls.badge}
          </div>
          <h1 className="font-display text-6xl font-bold tracking-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: ACCENT.gradient }}
            >
              {ui.bls.heading}
            </span>
          </h1>
                    <p className="text-sm text-ink/50 dark:text-white/50 mt-4 max-w-xl mx-auto">
            {ui.bls.subtitle}
          </p>
        </div>

        <div className="mb-10 rounded-2xl border p-6" style={{ borderColor: `${ACCENT.solid}33`, background: `${ACCENT.solid}0D` }}>
          <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
            {ui.bls.infoBox}
          </p>
        </div>

        {loading && <p className="text-center text-sm text-ink/40 dark:text-white/40">{ui.common.loading}</p>}
        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="space-y-8">
            {CATEGORY_ORDER.map((cat) => {
              const items = procedures.filter((p) => p.procedure_category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <h3
                    className="text-xs font-bold uppercase tracking-wide mb-3"
                    style={{ color: ACCENT.solid }}
                  >
                    {ui.bls.categoryLabels[cat as keyof typeof ui.bls.categoryLabels] ?? cat}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {items.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelected(p)}
                        className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 transition-colors hover:border-[#EF4444]/40"
                      >
                        <p className="text-sm font-semibold text-ink dark:text-white">{p.name}</p>
                        {p.age_group && (
                          <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink/50 dark:text-white/50">
                            {p.age_group}
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

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setSelected(null)}
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
                  {selected.name}
                </h3>
                <button
                  onClick={() => setSelected(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>

                            {selected.image_url && (
                <button
                  onClick={() => setExpandedImage({ url: selected.image_url as string, label: selected.name })}
                  className="group block w-full rounded-2xl overflow-hidden mb-4 bg-[#08090b]"
                >
                  <img
                    src={selected.image_url}
                    alt={selected.name}
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                  />
                </button>
              )}
              <div className="space-y-4 text-sm">
                {selected.patient_position && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.bls.positionLabel}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selected.patient_position}</p>
                  </div>
                )}
                {selected.procedure && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.bls.procedureLabel}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selected.procedure}</p>
                  </div>
                )}
                {selected.key_parameters && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.bls.keyParametersLabel}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selected.key_parameters}</p>
                  </div>
                )}
                {selected.precautions && (
                  <div>
                    <p className="font-semibold text-red-500 mb-1">{ui.bls.precautionsLabel}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selected.precautions}</p>
                  </div>
                )}
                {selected.evidence_note && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">{ui.bls.evidenceLabel}</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">{selected.evidence_note}</p>
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
              src={expandedImage.url}
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