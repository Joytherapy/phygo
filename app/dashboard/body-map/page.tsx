'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MousePointerClick, ScanLine, Search, ArrowRight, Move3d } from 'lucide-react';
import Navbar from '@/components/Navbar';
import BodyMap3D from '@/components/BodyMap3D';
import { useUiStrings } from '@/contexts/LanguageContext';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.12 * i, ease: [0.22, 1, 0.36, 1] },
  }),
};

function BodyMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const calibrate = searchParams.get('calibrate') === '1';
  const ui = useUiStrings();
  const bm = ui.bodyMap;

  const HOW_IT_WORKS = [
    { icon: MousePointerClick, color: '#32D6A0', label: bm.howItWorks.clickZone.label, text: bm.howItWorks.clickZone.text },
    { icon: ScanLine, color: '#bcd7ff', label: bm.howItWorks.xray.label, text: bm.howItWorks.xray.text },
    { icon: Search, color: '#4F7CFF', label: bm.howItWorks.search.label, text: bm.howItWorks.search.text },
  ] as const;

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px] animate-drift"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-1/3 right-[-200px] w-[600px] h-[600px] rounded-full opacity-[0.12] dark:opacity-[0.18] blur-[130px] animate-floatSlow"
        style={{
          background: 'radial-gradient(circle, rgba(50,214,160,0.6) 0%, rgba(79,124,255,0.4) 100%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-10">
          <motion.div
            initial="hidden"
            animate="show"
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase text-ink/75 dark:text-white/75 mb-4"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" />
            {calibrate ? bm.calibrationBadge : bm.badge}
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            custom={1}
            variants={fadeUp}
            className="font-display font-semibold tracking-tight text-5xl sm:text-6xl"
          >
            <span className="bg-gradient-to-r from-electric via-[#6D8FFF] to-emerald bg-clip-text text-transparent">
              Anatomical Navigator
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            custom={2}
            variants={fadeUp}
            className="mt-4 text-ink/55 dark:text-white/55 text-lg max-w-xl mx-auto text-balance"
          >
            {bm.subtitle}
          </motion.p>
        </div>

        <div className="flex justify-center mb-10">
          <Link
            href="/dashboard/physiology?system=muscular"
            className="group inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl px-4 py-2 text-xs font-medium text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white hover:border-emerald/40 transition-colors"
          >
            {ui.physiologyCrossLink.question}
            <span className="font-semibold" style={{ color: '#32D6A0' }}>
              {ui.physiologyCrossLink.cta} →
            </span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center"
        >
          <div className="w-full rounded-[28px] shadow-lift">
            <BodyMap3D
              calibrate={calibrate}
              onSelectZone={(slug) => router.push(`/dashboard/body-map/${slug}`)}
            />
          </div>
        </motion.div>

        {!calibrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-xs text-ink/40 dark:text-white/40"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald" />
              {bm.legendMuscleZones}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#bcd7ff' }} />
              {bm.legendBoneZones}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Move3d size={12} />
              {bm.legendDragScroll}
            </span>
          </motion.div>
        )}

        {!calibrate && (
          <div className="grid sm:grid-cols-3 gap-4 mt-14">
            {HOW_IT_WORKS.map(({ icon: Icon, color, label, text }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="group rounded-xl3 glass-strong p-5 shadow-soft hover:shadow-lift transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${color}1F`, color }}
                  >
                    <Icon size={15} />
                  </span>
                  <h3 className="text-sm font-semibold tracking-wide text-ink dark:text-white">{label}</h3>
                </div>
                <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        )}

        {!calibrate && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.25 }}
            className="mt-6 text-center text-[11px] text-ink/35 dark:text-white/35"
          >
            {bm.clinicalFooter}
          </motion.p>
        )}

        {!calibrate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="flex justify-center mt-8"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/dashboard/body-map/whole-body')}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-electric to-emerald px-7 py-3.5 text-sm font-semibold text-white shadow-glow transition-shadow hover:shadow-lift shimmer-sweep"
            >
              {bm.ctaWholeBody}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </motion.button>
          </motion.div>
        )}

        {calibrate && (
          <p className="text-ink/50 dark:text-white/50 text-sm text-center max-w-md mx-auto mt-8">
            Clicca sui punti anatomici direttamente sul modello: ogni clic aggiunge una riga con la frazione [x, y, z] nel pannello in alto. Copiala qui in chat e sostituirò le coordinate definitive in BODY_ZONES_3D.
          </p>
        )}
      </div>
    </div>
  );
}

export default function BodyMapPage() {
  return (
    <Suspense fallback={null}>
      <BodyMapContent />
    </Suspense>
  );
}
