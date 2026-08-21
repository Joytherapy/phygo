'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { X, Maximize2 } from 'lucide-react';

type View = 'brain' | 'nerves' | 'pathways';
type Point = { x: number; y: number };

interface Zone {
  slug: string;
  name: string;
  points: Point[];
}

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

const VIEW_STYLES: Record<View, { gradient: string; solid: string; label: string }> = {
  brain: {
    gradient: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)',
    solid: '#4F7CFF',
    label: 'Brain',
  },
  nerves: {
    gradient: 'linear-gradient(90deg, #F5A524 0%, #F97316 100%)',
    solid: '#F5A524',
    label: 'Peripheral Nerves',
  },
  pathways: {
    gradient: 'linear-gradient(90deg, #A855F7 0%, #7C3AED 100%)',
    solid: '#A855F7',
    label: 'Neural Circuits',
  },
};

const BRAIN_ZONES: Zone[] = [
  { slug: 'frontal-lobe', name: 'Frontal Lobe', points: [{ x: 32, y: 30 }] },
  { slug: 'parietal-lobe', name: 'Parietal Lobe', points: [{ x: 55, y: 20 }] },
  { slug: 'temporal-lobe', name: 'Temporal Lobe', points: [{ x: 42, y: 58 }] },
  { slug: 'occipital-lobe', name: 'Occipital Lobe', points: [{ x: 75, y: 35 }] },
  { slug: 'cerebellum', name: 'Cerebellum', points: [{ x: 68, y: 65 }] },
  { slug: 'brainstem', name: 'Brainstem', points: [{ x: 52, y: 75 }] },
  { slug: 'basal-ganglia', name: 'Basal Ganglia', points: [{ x: 45, y: 45 }] },
  { slug: 'insula', name: 'Insula', points: [{ x: 40, y: 42 }] },
  { slug: 'corpus-callosum', name: 'Corpus Callosum', points: [{ x: 48, y: 33 }] },
  { slug: 'thalamus', name: 'Thalamus', points: [{ x: 47, y: 40 }] },
  { slug: 'hypothalamus', name: 'Hypothalamus', points: [{ x: 46, y: 47 }] },
  { slug: 'amygdala', name: 'Amygdala', points: [{ x: 44, y: 52 }] },
  { slug: 'hippocampus', name: 'Hippocampus', points: [{ x: 43, y: 55 }] },
];

const NERVE_INFO = [
  {
    name: 'Brachial Plexus',
    description:
      "Rete nervosa formata dalle radici C5-T1 che origina i principali nervi dell'arto superiore (mediano, ulnare, radiale, muscolocutaneo, ascellare). Lesioni traumatiche (es. da trazione durante il parto o incidenti motociclistici) causano deficit motori/sensitivi variabili in base al livello coinvolto.",
  },
  {
    name: 'Median Nerve',
    description:
      "Innerva la maggior parte dei flessori dell'avambraccio e i muscoli tenar. Sede più comune di compressione: tunnel carpale al polso, con parestesie a pollice-indice-medio.",
  },
  {
    name: 'Ulnar Nerve',
    description:
      "Innerva la maggior parte dei muscoli intrinseci della mano. Sede più comune di compressione: tunnel cubitale al gomito, con parestesie a mignolo e metà anulare.",
  },
  {
    name: 'Radial Nerve',
    description:
      "Innerva il tricipite e i muscoli estensori di polso e dita. Vulnerabile a compressione nel solco radiale dell'omero (es. 'paralisi del sabato sera'), causa mano cadente (wrist drop).",
  },
  {
    name: 'Sciatic Nerve',
    description:
      "Il nervo più grande del corpo, origina dal plesso sacrale (L4-S3) e si divide in nervo tibiale e peroneale comune a livello del cavo popliteo. Coinvolto nella sciatalgia da compressione radicolare lombare.",
  },
  {
    name: 'Femoral Nerve',
    description:
      "Innerva il quadricipite e fornisce sensibilità alla faccia anteriore della coscia. Vulnerabile in chirurgia pelvica/inguinale e in caso di ematoma del muscolo ileopsoas.",
  },
  {
    name: 'Peroneal Nerve',
    description:
      "Ramo del nervo sciatico, decorre superficialmente attorno alla testa del perone — sede comune di compressione (es. accavallare le gambe a lungo), causa piede cadente (foot drop).",
  },
];

const NERVE_INJURY_TYPES = [
  {
    name: 'Neuroaprassia',
    severity: 'Lieve',
    description:
      "Blocco funzionale temporaneo della conduzione nervosa, senza interruzione anatomica dell'assone. Causa tipica: compressione o trazione lieve. Il recupero è generalmente completo, da giorni a poche settimane, senza necessità di rigenerazione assonale.",
  },
  {
    name: 'Assonotmesi',
    severity: 'Moderata',
    description:
      "Interruzione dell'assone con preservazione delle strutture di supporto connettivale (guaina di Schwann, endonevrio). Il recupero avviene per rigenerazione assonale lungo il percorso preservato, a una velocità di circa 1 mm/giorno — quindi tempi di recupero lunghi ma prognosi generalmente favorevole.",
  },
  {
    name: 'Neurotmesi',
    severity: 'Severa',
    description:
      "Interruzione completa del nervo, incluse le strutture connettivali di supporto. Il recupero spontaneo è improbabile o incompleto senza intervento chirurgico (neurorrafia o innesto nervoso). È il tipo di lesione più severo secondo la classificazione di Seddon.",
  },
];

const PATHWAYS = [
  {
    title: 'Corticospinal (Pyramidal) Pathway',
    subtitle: 'Voluntary motor control — limbs and trunk',
    image: `${IMAGE_BASE}/pathway-corticospinal.png`,
  },
  {
    title: 'Corticobulbar Pathway',
    subtitle: 'Voluntary motor control — head and face',
    image: `${IMAGE_BASE}/pathway-corticobulbar.png`,
  },
  {
    title: 'Extrapyramidal Pathways',
    subtitle: 'Involuntary motor control, posture and tone',
    image: `${IMAGE_BASE}/pathway-extrapyramidal.png`,
  },
  {
    title: 'Dorsal Column-Medial Lemniscus Pathway',
    subtitle: 'Fine touch, vibration and proprioception',
    image: `${IMAGE_BASE}/pathway-dorsal-column.png`,
  },
  {
    title: 'Spinothalamic (Anterolateral) Pathway',
    subtitle: 'Pain, temperature and crude touch',
    image: `${IMAGE_BASE}/pathway-spinothalamic.png`,
  },
  {
    title: 'Basal Ganglia Circuitry',
    subtitle: 'Direct and indirect pathways of movement control',
    image: `${IMAGE_BASE}/pathway-basal-ganglia.png`,
  },
];

export default function BrainMapPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<View>('brain');
  const [hovered, setHovered] = useState<string | null>(null);
  const [expandedPathway, setExpandedPathway] = useState<{ title: string; image: string } | null>(null);

  const imageSrc =
    view === 'brain'
      ? `${IMAGE_BASE}/brain-lateral.png`
      : `${IMAGE_BASE}/nervous-system.png`;

  const activeStyle = VIEW_STYLES[view];

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
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]" />
            Neurological Atlas
          </div>
          <h1 className="font-display text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] bg-clip-text text-transparent">
              Neurology
            </span>
          </h1>
        </div>


        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl p-1">
            {(['brain', 'nerves', 'pathways'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-6 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                  view === v
                    ? 'text-black'
                    : 'text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white'
                }`}
                style={view === v ? { background: VIEW_STYLES[v].gradient } : undefined}
              >
                {VIEW_STYLES[v].label}
              </button>
            ))}
          </div>
        </div>

        {view !== 'pathways' && (
          <div className="flex justify-center">
            <div className="w-full max-w-2xl rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-[#08090b] p-8 shadow-2xl">
              <div ref={containerRef} className="relative w-full select-none">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={view}
                    src={imageSrc}
                    alt={view === 'brain' ? 'Brain anatomy' : 'Peripheral nervous system'}
                    className="w-full h-auto pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    draggable={false}
                  />
                </AnimatePresence>

                {view === 'brain' &&
                  BRAIN_ZONES.flatMap((zone) =>
                    zone.points.map((p, i) => (
                      <div
                        key={`${zone.slug}-${i}`}
                        onClick={() => router.push(`/dashboard/brain-map/${zone.slug}`)}
                        onMouseEnter={() => setHovered(zone.slug)}
                        onMouseLeave={() => setHovered(null)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                      >
                        <span className="relative flex h-5 w-5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#32D6A0] opacity-60" />
                          <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] border border-white/40" />
                        </span>
                        {hovered === zone.slug && (
                          <span className="absolute left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap px-3 py-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-xs font-medium text-white">
                            {zone.name}
                          </span>
                        )}
                      </div>
                    ))
                  )}
              </div>
            </div>
          </div>
        )}

        {view === 'brain' && (
          <p className="text-center text-xs text-ink/40 dark:text-white/40 mt-4">
            Hotspot posizioni stimate — richiedono calibrazione a vista
          </p>
        )}

        {view === 'nerves' && (
          <>
            <div className="mt-12">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-4">
                Major Peripheral Nerves
              </h2>
              <div className="space-y-4">
                {NERVE_INFO.map((n) => (
                  <div
                    key={n.name}
                    className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5"
                  >
                    <p className="text-sm font-semibold mb-1">{n.name}</p>
                    <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed">
                      {n.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
                Nerve Injury Classification
              </h2>
              <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
                Classificazione di Seddon, dalla più lieve alla più severa — utile per orientare prognosi e tempistiche di recupero.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {NERVE_INJURY_TYPES.map((t) => (
                  <div
                    key={t.name}
                    className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5"
                  >
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white mb-2"
                      style={{ background: VIEW_STYLES.nerves.gradient }}
                    >
                      {t.severity}
                    </span>
                    <p className="text-sm font-semibold mb-1">{t.name}</p>
                    <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {view === 'pathways' && (
          <div className="grid sm:grid-cols-2 gap-4">
            {PATHWAYS.map((p) => (
              <button
                key={p.title}
                onClick={() => setExpandedPathway(p)}
                className="group text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-[#08090b] overflow-hidden shadow-sm hover:shadow-lg transition-all"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                  <div
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-white"
                    style={{ background: `${VIEW_STYLES.pathways.solid}CC` }}
                  >
                    <Maximize2 size={14} />
                  </div>
                </div>
                <div className="p-4 bg-white/70 dark:bg-white/[0.03]">
                  <p className="text-sm font-semibold text-ink dark:text-white">{p.title}</p>
                  <p className="text-xs text-ink/50 dark:text-white/50 mt-0.5">{p.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {expandedPathway && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setExpandedPathway(null)}
          >
            <button
              onClick={() => setExpandedPathway(null)}
              className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              src={expandedPathway.image}
              alt={expandedPathway.title}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
