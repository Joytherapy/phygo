'use client';

import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ClinicalActionBar from '@/components/ClinicalActionBar';
import { X, Maximize2, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext';
import {
  PATHWAYS,
  GAIT_TYPES,
  LOCALIZATION_PRINCIPLES,
  NERVE_INJURY_TYPES,
  CONDUCTION_FIBER_TYPES,
  type Pathway,
  type GaitType,
  type LocalizationPrinciple,
  type NerveInjuryType,
  type ConductionFiberType,
} from '@/lib/brainMapContent';

// Canvas WebGL: caricato solo lato client, mai in SSR
const BrainMap3D = dynamic(() => import('@/components/BrainMap3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] sm:h-[520px] rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-[#08090b] flex items-center justify-center">
      <p className="text-sm text-white/40">Caricamento modello 3D...</p>
    </div>
  ),
});

type View = 'brain' | 'nerves' | 'pathways';
type Point = { x: number; y: number };

interface Zone {
  slug: string;
  name: string;
  points: Point[];
}
interface PeripheralCondition {
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
interface BrainConditionItem extends PeripheralCondition {
  zones: { slug: string; name: string }[];
}
interface NerveListItem {
  id: string;
  slug: string;
  name: string;
  region: string;
  compression_site?: string;
}

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

const VIEW_COLORS: Record<View, { gradient: string; solid: string }> = {
  brain: {
    gradient: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)',
    solid: '#4F7CFF',
  },
  nerves: {
    gradient: 'linear-gradient(90deg, #F5A524 0%, #F97316 100%)',
    solid: '#F5A524',
  },
  pathways: {
    gradient: 'linear-gradient(90deg, #A855F7 0%, #7C3AED 100%)',
    solid: '#A855F7',
  },
};

// `name` qui è solo un fallback italiano (mai mostrato direttamente): il testo
// visibile risolve sempre lo slug tramite ui.brainMap.zoneNames, così la label
// segue la lingua attiva invece di restare fissa in italiano/inglese.
const BRAIN_ZONES: Zone[] = [
  { slug: 'frontal-lobe', name: 'Lobo Frontale', points: [{ x: 32, y: 30 }] },
  { slug: 'parietal-lobe', name: 'Lobo Parietale', points: [{ x: 55, y: 20 }] },
  { slug: 'temporal-lobe', name: 'Lobo Temporale', points: [{ x: 42, y: 58 }] },
  { slug: 'occipital-lobe', name: 'Lobo Occipitale', points: [{ x: 75, y: 35 }] },
  { slug: 'cerebellum', name: 'Cervelletto', points: [{ x: 68, y: 65 }] },
  { slug: 'brainstem', name: 'Tronco Encefalico', points: [{ x: 52, y: 75 }] },
  { slug: 'basal-ganglia', name: 'Gangli della Base', points: [{ x: 45, y: 45 }] },
  { slug: 'insula', name: 'Insula', points: [{ x: 40, y: 42 }] },
  { slug: 'corpus-callosum', name: 'Corpo Calloso', points: [{ x: 48, y: 33 }] },
  { slug: 'thalamus', name: 'Talamo', points: [{ x: 47, y: 40 }] },
  { slug: 'hypothalamus', name: 'Ipotalamo', points: [{ x: 46, y: 47 }] },
  { slug: 'amygdala', name: 'Amigdala', points: [{ x: 44, y: 52 }] },
  { slug: 'hippocampus', name: 'Ippocampo', points: [{ x: 43, y: 55 }] },
];

export default function BrainMapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();
  const ui = useUiStrings();

  // Tilt/parallax 3D al passaggio del mouse per il viewer del sistema nervoso
  // periferico — l'immagine resta 2D, ma il movimento la fa "sentire" tridimensionale
  // e coerente con l'interattività del modello 3D del cervello, senza bisogno di un
  // vero asset 3D del sistema nervoso periferico (progetto a parte, più corposo).
  const nerveTiltX = useMotionValue(0);
  const nerveTiltY = useMotionValue(0);
  const nerveGlowX = useMotionValue(50);
  const nerveGlowY = useMotionValue(50);
  const nerveRotateX = useSpring(useTransform(nerveTiltY, [-0.5, 0.5], [10, -10]), { stiffness: 150, damping: 20 });
  const nerveRotateY = useSpring(useTransform(nerveTiltX, [-0.5, 0.5], [-10, 10]), { stiffness: 150, damping: 20 });
  // IMPORTANTE: useTransform va chiamato sempre qui, a livello top del componente —
  // chiamarlo dentro il JSX condizionale "{view === 'nerves' && (...)}" (com'era prima)
  // significa eseguirlo solo in certi render, violando le regole degli hook e causando
  // "Rendered more hooks than during the previous render" al cambio di vista.
  const nerveGlowBackground = useTransform(
    [nerveGlowX, nerveGlowY],
    ([gx, gy]: number[]) => `radial-gradient(400px circle at ${gx}% ${gy}%, ${VIEW_COLORS.nerves.solid}22, transparent 70%)`
  );
  const handleNerveViewerMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    nerveTiltX.set(px - 0.5);
    nerveTiltY.set(py - 0.5);
    nerveGlowX.set(px * 100);
    nerveGlowY.set(py * 100);
  };
  const handleNerveViewerMouseLeave = () => {
    nerveTiltX.set(0);
    nerveTiltY.set(0);
    nerveGlowX.set(50);
    nerveGlowY.set(50);
  };

  const initialView = (searchParams.get('view') as View) || 'brain';
  const [view, setView] = useState<View>(initialView);
  const [expandedPathway, setExpandedPathway] = useState<{ title: string; image: string } | null>(null);
  const [brainSubView, setBrainSubView] = useState<'atlas' | 'conditions'>('atlas');
  const [brainConditions, setBrainConditions] = useState<BrainConditionItem[]>([]);
  const [brainConditionsLoading, setBrainConditionsLoading] = useState(false);
  const [brainConditionsError, setBrainConditionsError] = useState<string | null>(null);
  const [hasFetchedBrainConditions, setHasFetchedBrainConditions] = useState(false);
  const [brainConditionsSearch, setBrainConditionsSearch] = useState('');

  // Contenuti di riferimento hardcoded (Pathways, Gait, Localization,
  // classificazione Seddon, conduzione nervosa) — tradotti e messi in cache
  // da un unico endpoint, invece dei 5 array statici originali. Lo stato
  // parte già valorizzato con i dati italiani importati direttamente da
  // lib/brainMapContent.ts: così, se il fetch di traduzione fallisce o è
  // lento (rete, cold start, endpoint momentaneamente giù), la sezione
  // mostra comunque il contenuto italiano invece di restare vuota — non
  // sovrascriviamo mai lo stato con un array vuoto.
  const [pathways, setPathways] = useState<Pathway[]>(PATHWAYS);
  const [gaitTypes, setGaitTypes] = useState<GaitType[]>(GAIT_TYPES);
  const [localizationPrinciples, setLocalizationPrinciples] = useState<LocalizationPrinciple[]>(LOCALIZATION_PRINCIPLES);
  const [nerveInjuryTypes, setNerveInjuryTypes] = useState<NerveInjuryType[]>(NERVE_INJURY_TYPES);
  const [conductionFiberTypes, setConductionFiberTypes] = useState<ConductionFiberType[]>(CONDUCTION_FIBER_TYPES);

  useEffect(() => {
    fetch(`/api/brain-map/reference-content?lang=${lang}`)
      .then((res) => {
        if (!res.ok) throw new Error(`reference-content fetch failed: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        // Aggiorna solo i campi effettivamente presenti nella risposta —
        // mai sovrascrivere con [] un array già popolato dal fallback
        // italiano iniziale se la risposta è incompleta o malformata.
        if (Array.isArray(json.pathways)) setPathways(json.pathways);
        if (Array.isArray(json.gaitTypes)) setGaitTypes(json.gaitTypes);
        if (Array.isArray(json.localizationPrinciples)) setLocalizationPrinciples(json.localizationPrinciples);
        if (Array.isArray(json.nerveInjuryTypes)) setNerveInjuryTypes(json.nerveInjuryTypes);
        if (Array.isArray(json.conductionFiberTypes)) setConductionFiberTypes(json.conductionFiberTypes);
      })
      .catch((err) => console.error('reference-content error:', err));
  }, [lang]);

  // Ri-fetch di tutti i contenuti già caricati quando cambia la lingua —
  // altrimenti i flag hasFetchedX bloccherebbero il refetch, mostrando
  // contenuto nella lingua precedente dopo un cambio lingua.
  useEffect(() => {
    setHasFetchedBrainConditions(false);
    setHasFetchedConditions(false);
    setHasFetchedDiffuse(false);
    setHasFetchedNerves(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    if (view !== 'brain' || brainSubView !== 'conditions' || hasFetchedBrainConditions) return;
    const fetchBrainConditions = async () => {
      setBrainConditionsLoading(true);
      setBrainConditionsError(null);
      try {
        const res = await fetch(`/api/brain-map/conditions?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero delle patologie');
        const data = await res.json();
        setBrainConditions(data.conditions ?? []);
        setHasFetchedBrainConditions(true);
      } catch (err) {
        setBrainConditionsError(ui.brainMap.errorLoadingConditions);
        console.error(err);
      } finally {
        setBrainConditionsLoading(false);
      }
    };
    fetchBrainConditions();
  }, [view, brainSubView, hasFetchedBrainConditions, lang]);

  const filteredBrainConditions = brainConditions.filter((c) =>
    c.condition_name.toLowerCase().includes(brainConditionsSearch.trim().toLowerCase())
  );
  const [pathwaySubView, setPathwaySubView] = useState<'circuits' | 'gait' | 'localization'>('circuits');
  const [pathwayCategoryFilter, setPathwayCategoryFilter] = useState<'long-tracts' | 'brain-circuits'>('long-tracts');
  const [nervesSubView, setNervesSubView] = useState<'atlas' | 'seddon' | 'conduction' | 'conditions' | 'diffuse'>('atlas');
  const [peripheralConditions, setPeripheralConditions] = useState<PeripheralCondition[]>([]);
  const [conditionsLoading, setConditionsLoading] = useState(false);
  const [conditionsError, setConditionsError] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<PeripheralCondition | null>(null);
  const [hasFetchedConditions, setHasFetchedConditions] = useState(false);

  useEffect(() => {
    if (view !== 'nerves' || hasFetchedConditions) return;
    const fetchConditions = async () => {
      setConditionsLoading(true);
      setConditionsError(null);
      try {
        const res = await fetch(`/api/brain-map/peripheral-nerves?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero delle patologie');
        const data = await res.json();
        setPeripheralConditions(data.conditions ?? []);
        setHasFetchedConditions(true);
      } catch (err) {
        setConditionsError(ui.brainMap.errorLoadingConditions);
        console.error(err);
      } finally {
        setConditionsLoading(false);
      }
    };
    fetchConditions();
  }, [view, hasFetchedConditions, lang]);

  // Disturbi Diffusi del SNP — condizioni sistemiche/diffuse non legate a un singolo nervo nominato
  const [diffuseConditions, setDiffuseConditions] = useState<PeripheralCondition[]>([]);
  const [diffuseLoading, setDiffuseLoading] = useState(false);
  const [diffuseError, setDiffuseError] = useState<string | null>(null);
  const [hasFetchedDiffuse, setHasFetchedDiffuse] = useState(false);

  useEffect(() => {
    if (view !== 'nerves' || hasFetchedDiffuse) return;
    const fetchDiffuse = async () => {
      setDiffuseLoading(true);
      setDiffuseError(null);
      try {
        const res = await fetch(`/api/brain-map/diffuse-conditions?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero dei disturbi diffusi');
        const data = await res.json();
        setDiffuseConditions(data.conditions ?? []);
        setHasFetchedDiffuse(true);
      } catch (err) {
        setDiffuseError(ui.brainMap.errorLoadingDiffuse);
        console.error(err);
      } finally {
        setDiffuseLoading(false);
      }
    };
    fetchDiffuse();
  }, [view, hasFetchedDiffuse, lang]);

  const [allNerves, setAllNerves] = useState<NerveListItem[]>([]);
  const [nervesLoading, setNervesLoading] = useState(false);
  const [nervesError, setNervesError] = useState<string | null>(null);
  const [hasFetchedNerves, setHasFetchedNerves] = useState(false);
  const [nerveRegionFilter, setNerveRegionFilter] = useState<'all' | 'plexus' | 'cranial' | 'upper_limb' | 'lower_limb'>('all');

  useEffect(() => {
    if (view !== 'nerves' || hasFetchedNerves) return;
    const fetchNerves = async () => {
      setNervesLoading(true);
      setNervesError(null);
      try {
        const res = await fetch(`/api/brain-map/nerves?lang=${lang}`);
        if (!res.ok) throw new Error('Errore nel recupero dei nervi');
        const data = await res.json();
        setAllNerves(data.nerves ?? []);
        setHasFetchedNerves(true);
      } catch (err) {
        setNervesError(ui.brainMap.errorLoadingNerves);
        console.error(err);
      } finally {
        setNervesLoading(false);
      }
    };
    fetchNerves();
  }, [view, hasFetchedNerves, lang]);

  // Ricerca libera "Ask Phygo" per nervi/argomenti non presenti nell'atlante
  const [askQuery, setAskQuery] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const handleAskPhygo = async () => {
    if (!askQuery.trim() || askLoading) return;
    setAskLoading(true);
    setAskError(null);
    setAskAnswer(null);
    try {
      const res = await fetch('/api/ask-phygo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: askQuery,
          noteContext: 'Sezione: Phygo Neurology — Atlante dei Nervi Periferici. La domanda riguarda un nervo, plesso o argomento di neuroanatomia periferica non necessariamente presente nell\'atlante attuale.',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAskError(data.error || 'Errore nella richiesta.');
        return;
      }
      setAskAnswer(data.answer);
    } catch (err) {
      setAskError('Impossibile contattare Phygo in questo momento.');
      console.error(err);
    } finally {
      setAskLoading(false);
    }
  };

  const imageSrc =
    view === 'brain'
      ? `${IMAGE_BASE}/brain-lateral.png`
      : `${IMAGE_BASE}/nervous-system.png`;

  const NERVES_SUB_TABS = [
    { key: 'atlas' as const, label: ui.brainMap.nervesSubTabs.atlas },
    { key: 'seddon' as const, label: ui.brainMap.nervesSubTabs.seddon },
    { key: 'conduction' as const, label: ui.brainMap.nervesSubTabs.conduction },
    { key: 'conditions' as const, label: ui.brainMap.nervesSubTabs.conditions },
    { key: 'diffuse' as const, label: ui.brainMap.nervesSubTabs.diffuse },
  ];

  const filteredPathways = pathways.filter((p) => p.category === pathwayCategoryFilter);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />
      {/* Secondo alone più piccolo e sfalsato, per dare profondità allo sfondo invece
          di un unico bagliore piatto — un dettaglio tipico delle landing page premium. */}
      <div
        className="pointer-events-none absolute top-24 right-[8%] w-[420px] h-[420px] rounded-full opacity-[0.12] dark:opacity-[0.18] blur-[120px]"
        style={{
          background: VIEW_COLORS[view].gradient,
          transition: 'background 0.6s ease',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-5 shadow-sm shadow-black/[0.03] dark:shadow-black/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#32D6A0] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]" />
            </span>
            {ui.brainMap.atlasBadge}
          </div>
          <h1 className="font-display text-6xl sm:text-7xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] bg-clip-text text-transparent">
              {ui.brainMap.heading}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-ink/50 dark:text-white/40 max-w-lg mx-auto leading-relaxed">
            {ui.brainMap.subtitle}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative inline-flex rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl p-1 shadow-lg shadow-black/[0.04] dark:shadow-black/40">
            {(['brain', 'nerves', 'pathways'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`relative z-10 px-6 py-2 rounded-full text-sm font-semibold capitalize transition-colors duration-300 active:scale-[0.96] ${
                  view === v
                    ? 'text-black'
                    : 'text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white'
                }`}
              >
                {view === v && (
                  <motion.span
                    layoutId="mainViewTabIndicator"
                    className="absolute inset-0 -z-10 rounded-full"
                    style={{ background: VIEW_COLORS[v].gradient }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{ui.brainMap.viewLabels[v]}</span>
              </button>
            ))}
          </div>
        </div>

        {view === 'brain' && (
          <div className="flex justify-center mb-6">
            <div className="relative inline-flex rounded-full border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-1 shadow-sm shadow-black/[0.03] dark:shadow-black/30">
              {(['atlas', 'conditions'] as const).map((sv) => (
                <button
                  key={sv}
                  onClick={() => setBrainSubView(sv)}
                  className={`relative z-10 px-5 py-2 rounded-full text-[13px] font-semibold transition-colors duration-300 active:scale-[0.96] ${
                    brainSubView === sv
                      ? 'text-white'
                      : 'text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white'
                  }`}
                >
                  {brainSubView === sv && (
                    <motion.span
                      layoutId="brainSubTabIndicator"
                      className="absolute inset-0 -z-10 rounded-full"
                      style={{ background: VIEW_COLORS.brain.solid }}
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{sv === 'atlas' ? ui.brainMap.brainSubTabs.atlas : ui.brainMap.brainSubTabs.conditions}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'brain' && brainSubView === 'atlas' && (
          <div className="flex justify-center">
            <div className="w-full">
              <BrainMap3D onSelectZone={(slug) => router.push(`/dashboard/brain-map/${slug}`)} />

              <div className="mt-6">
                <p className="text-sm text-ink/50 dark:text-white/50 mb-3">
                  {ui.brainMap.deepStructuresHint}
                </p>
                <div className="flex flex-wrap gap-2">
                  {BRAIN_ZONES.filter((z) =>
                    ['basal-ganglia', 'insula', 'corpus-callosum', 'thalamus', 'hypothalamus', 'amygdala', 'hippocampus'].includes(
                      z.slug
                    )
                  ).map((z) => (
                    <button
                      key={z.slug}
                      onClick={() => router.push(`/dashboard/brain-map/${z.slug}`)}
                      className="px-3.5 py-1.5 rounded-full text-sm border border-black/[0.08] dark:border-white/10 text-ink/70 dark:text-white/70 transition-all duration-200 hover:border-[#4F7CFF]/50 hover:text-[#4F7CFF] hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#4F7CFF]/10 active:translate-y-0"
                    >
                      {ui.brainMap.zoneNames[z.slug as keyof typeof ui.brainMap.zoneNames] ?? z.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <p className="text-sm text-ink/50 dark:text-white/50 mb-4">
                  {ui.brainMap.referenceViewsHint}
                </p>
                <div className="flex flex-col gap-4">
                  <div className="group rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/10 transition-all duration-300 hover:border-[#4F7CFF]/30 hover:shadow-xl hover:shadow-[#4F7CFF]/10">
                    <img
                      src="/images/brain-lateral-view.png"
                      alt="Brain — Lateral View"
                      className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="group rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/10 transition-all duration-300 hover:border-[#4F7CFF]/30 hover:shadow-xl hover:shadow-[#4F7CFF]/10">
                    <img
                      src="/images/brain-sagittal-view.png"
                      alt="Brain — Sagittal View"
                      className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="group rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/10 transition-all duration-300 hover:border-[#4F7CFF]/30 hover:shadow-xl hover:shadow-[#4F7CFF]/10">
                    <img
                      src="/images/brain-coronal-view.png"
                      alt="Brain — Coronal View"
                      className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'nerves' && (
          <div className="flex justify-center">
            <div className="relative w-full max-w-2xl">
              {/* Alone ambientale dietro il viewer — stessa logica del bagliore dietro il
                  modello 3D del cervello, qui in tonalità arancio/nervi per coerenza col
                  colore della vista. */}
              <div
                className="pointer-events-none absolute -inset-10 rounded-[40px] opacity-30 dark:opacity-40 blur-[80px]"
                style={{ background: VIEW_COLORS.nerves.gradient }}
              />
              <div
                ref={containerRef}
                onMouseMove={handleNerveViewerMouseMove}
                onMouseLeave={handleNerveViewerMouseLeave}
                className="group relative w-full max-w-2xl rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-[#08090b] p-8 shadow-2xl shadow-black/20 dark:shadow-black/50 ring-1 ring-white/[0.04] overflow-hidden [perspective:1000px]"
              >
                {/* Glow che segue il cursore — dà l'illusione di una superficie
                    illuminata dinamicamente, lo stesso linguaggio visivo del fresnel
                    glow usato sulle zone del cervello 3D. */}
                <motion.div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: nerveGlowBackground }}
                />
                {/* Cornici angolari — un dettaglio da "HUD" scientifico/premium, coerente
                    con l'estetica da strumento clinico del resto della sezione. */}
                {[
                  'top-4 left-4 border-t border-l rounded-tl-xl',
                  'top-4 right-4 border-t border-r rounded-tr-xl',
                  'bottom-4 left-4 border-b border-l rounded-bl-xl',
                  'bottom-4 right-4 border-b border-r rounded-br-xl',
                ].map((pos) => (
                  <span
                    key={pos}
                    className={`pointer-events-none absolute h-5 w-5 border-white/15 transition-colors duration-300 group-hover:border-[#F5A524]/50 ${pos}`}
                  />
                ))}

                <motion.div
                  className="relative w-full select-none"
                  style={{
                    rotateX: nerveRotateX,
                    rotateY: nerveRotateY,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={imageSrc}
                      src={imageSrc}
                      alt="Peripheral nervous system"
                      className="w-full h-auto pointer-events-none drop-shadow-[0_20px_40px_rgba(245,165,36,0.15)]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      draggable={false}
                    />
                  </AnimatePresence>
                </motion.div>
              </div>
              <p className="pointer-events-none mt-4 text-center text-[11px] text-ink/30 dark:text-white/30">
                {ui.brainMap.nerveViewerHint}
              </p>
            </div>
          </div>
        )}

        {view === 'brain' && brainSubView === 'conditions' && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
              {ui.brainMap.brainConditionsHeading}
            </h2>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
              {ui.brainMap.brainConditionsHint}
            </p>

            <input
              type="text"
              value={brainConditionsSearch}
              onChange={(e) => setBrainConditionsSearch(e.target.value)}
              placeholder={ui.brainMap.searchConditionsPlaceholder}
              className="w-full mb-6 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-2.5 text-sm text-ink dark:text-white placeholder:text-ink/40 dark:placeholder:text-white/40 outline-none transition-colors focus:border-[#4F7CFF]/40"
            />

            {brainConditionsLoading && (
              <p className="text-sm text-ink/40 dark:text-white/40">{ui.brainMap.loadingConditions}</p>
            )}
            {brainConditionsError && <p className="text-sm text-red-500">{brainConditionsError}</p>}

            {!brainConditionsLoading && !brainConditionsError && (
              <>
                {filteredBrainConditions.length === 0 && (
                  <p className="text-sm text-ink/40 dark:text-white/40">{ui.brainMap.noConditionsFound}</p>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredBrainConditions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCondition(c)}
                      className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:border-[#4F7CFF]/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#4F7CFF]/10"
                    >
                      <p className="text-sm font-semibold text-ink dark:text-white">
                        {c.condition_name}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.zones.map((z) => (
                          <span
                            key={z.slug}
                            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF] dark:bg-[#4F7CFF]/15"
                          >
                            {z.name}
                          </span>
                        ))}
                      </div>
                      {c.evidence_level && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wide mt-2 text-ink/40 dark:text-white/40">
                          {ui.fields.evidence}: {c.evidence_level}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {view === 'nerves' && (
          <div className="mt-12">
            <div className="flex justify-center mb-10">
              <div className="inline-flex flex-wrap justify-center rounded-full border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-1 shadow-sm shadow-black/[0.03] dark:shadow-black/30">
                {NERVES_SUB_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setNervesSubView(t.key)}
                    className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 active:scale-[0.96] ${
                      nervesSubView === t.key
                        ? 'text-white'
                        : 'text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white'
                    }`}
                    style={
                      nervesSubView === t.key
                        ? { background: VIEW_COLORS.nerves.solid }
                        : undefined
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {nervesSubView === 'atlas' && (
              <div>
                <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
                  {ui.brainMap.peripheralAtlasHeading}
                </h2>
                <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
                  {ui.brainMap.peripheralAtlasHint}
                </p>

                {nervesLoading && (
                  <p className="text-sm text-ink/40 dark:text-white/40">{ui.brainMap.loadingNerves}</p>
                )}
                {nervesError && <p className="text-sm text-red-500">{nervesError}</p>}

                {!nervesLoading && !nervesError && (
                  <>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(['all', 'plexus', 'cranial', 'upper_limb', 'lower_limb'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setNerveRegionFilter(r)}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 active:scale-[0.96] ${
                            nerveRegionFilter === r
                              ? 'text-white shadow-md shadow-[#F5A524]/20'
                              : 'text-ink/60 dark:text-white/60 border border-black/[0.08] dark:border-white/10 hover:text-ink dark:hover:text-white hover:border-[#F5A524]/30'
                          }`}
                          style={nerveRegionFilter === r ? { background: VIEW_COLORS.nerves.gradient } : undefined}
                        >
                          {r === 'all' ? ui.brainMap.regionAll : ui.brainMap.regionLabels[r]}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-8">
                      {(['plexus', 'cranial', 'upper_limb', 'lower_limb'] as const)
                        .filter((region) => nerveRegionFilter === 'all' || nerveRegionFilter === region)
                        .map((region) => {
                          const nervesInRegion = allNerves.filter((n) => n.region === region);
                          if (nervesInRegion.length === 0) return null;
                          return (
                            <div key={region}>
                              <h3 className="text-xs font-bold uppercase tracking-wide text-[#F5A524] mb-3">
                                {ui.brainMap.regionLabels[region] ?? region}
                              </h3>
                              <div className="grid sm:grid-cols-2 gap-3">
                                {nervesInRegion.map((n) => (
                                  <button
                                    key={n.id}
                                    onClick={() => router.push(`/dashboard/brain-map/nerve/${n.slug}`)}
                                    className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:border-[#F5A524]/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#F5A524]/10"
                                  >
                                    <p className="text-sm font-semibold text-ink dark:text-white mb-1">{n.name}</p>
                                    {n.compression_site && (
                                      <p className="text-xs text-ink/50 dark:text-white/50 leading-relaxed line-clamp-2">
                                        {n.compression_site}
                                      </p>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="mt-8 rounded-2xl border border-[#F5A524]/20 bg-[#F5A524]/5 p-5 shadow-sm shadow-[#F5A524]/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={16} className="text-[#F5A524]" />
                        <p className="text-sm font-semibold text-ink dark:text-white">
                          {ui.brainMap.askPhygoPrompt}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={askQuery}
                          onChange={(e) => setAskQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAskPhygo()}
                          placeholder={ui.brainMap.askPhygoPlaceholder}
                          className="flex-1 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-2.5 text-sm text-ink dark:text-white placeholder:text-ink/40 dark:placeholder:text-white/40 outline-none transition-colors focus:border-[#F5A524]/40"
                        />
                        <button
                          onClick={handleAskPhygo}
                          disabled={askLoading || !askQuery.trim()}
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:shadow-[#F5A524]/25 hover:-translate-y-0.5 active:translate-y-0"
                          style={{ background: VIEW_COLORS.nerves.gradient }}
                        >
                          {askLoading ? <Loader2 size={16} className="animate-spin" /> : ui.brainMap.askButton}
                        </button>
                      </div>

                      {askError && (
                        <p className="text-sm text-red-500 mt-3">{askError}</p>
                      )}

                      {askAnswer && (
                        <div className="mt-4 rounded-xl bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 p-4">
                          <p className="text-sm text-ink/80 dark:text-white/80 leading-relaxed whitespace-pre-line">
                            {askAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {nervesSubView === 'seddon' && (
              <div>
                <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
                  {ui.brainMap.nerveInjuryHeading}
                </h2>
                <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
                  {ui.brainMap.nerveInjuryHint}
                </p>

                <button
                  onClick={() => setExpandedPathway({
                    title: 'Nerve Injury Classification (Seddon)',
                    image: `${IMAGE_BASE}/nerve-injury-classification.png`,
                  })}
                  className="group relative w-full rounded-2xl border border-black/[0.06] dark:border-white/10 bg-[#08090b] overflow-hidden mb-6 block"
                >
                  <img
                    src={`${IMAGE_BASE}/nerve-injury-classification.png`}
                    alt="Seddon Nerve Injury Classification"
                    className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `${VIEW_COLORS.nerves.solid}CC` }}
                  >
                    <Maximize2 size={14} />
                  </div>
                </button>

                <div className="grid sm:grid-cols-3 gap-4">
                  {nerveInjuryTypes.map((t) => (
                    <div
                      key={t.slug}
                      className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.06] dark:hover:shadow-black/40"
                    >
                      <span
                        className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white mb-2"
                        style={{ background: VIEW_COLORS.nerves.gradient }}
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
            )}

            {nervesSubView === 'conduction' && (
              <div>
                <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
                  {ui.brainMap.nerveConductionHeading}
                </h2>
                <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
                  {ui.brainMap.nerveConductionHint}
                </p>

                <button
                  onClick={() => setExpandedPathway({
                    title: 'Nerve Conduction Velocity',
                    image: `${IMAGE_BASE}/nerve-conduction-and-velocity.png`,
                  })}
                  className="group relative w-full rounded-2xl border border-black/[0.06] dark:border-white/10 bg-[#08090b] overflow-hidden mb-6 block"
                >
                  <img
                    src={`${IMAGE_BASE}/nerve-conduction-and-velocity.png`}
                    alt="Nerve Conduction Velocity"
                    className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `${VIEW_COLORS.nerves.solid}CC` }}
                  >
                    <Maximize2 size={14} />
                  </div>
                </button>

                <div className="grid sm:grid-cols-2 gap-4">
                  {conductionFiberTypes.map((f) => (
                    <div
                      key={f.slug}
                      className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.06] dark:hover:shadow-black/40"
                    >
                      <span
                        className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full text-white mb-2"
                        style={{ background: VIEW_COLORS.nerves.solid }}
                      >
                        {f.name}
                      </span>
                      <p className="text-xs text-ink/70 dark:text-white/70 leading-relaxed">
                        <span className="font-semibold text-ink/50 dark:text-white/50">{ui.brainMap.fiberDiameter}: </span>{f.diameter}
                      </p>
                      <p className="text-xs text-ink/70 dark:text-white/70 leading-relaxed">
                        <span className="font-semibold text-ink/50 dark:text-white/50">{ui.brainMap.fiberMyelination}: </span>{f.myelination}
                      </p>
                      <p className="text-xs text-ink/70 dark:text-white/70 leading-relaxed">
                        <span className="font-semibold text-ink/50 dark:text-white/50">{ui.brainMap.fiberVelocity}: </span>{f.velocity}
                      </p>
                      <p className="text-xs text-ink/70 dark:text-white/70 leading-relaxed">
                        <span className="font-semibold text-ink/50 dark:text-white/50">{ui.brainMap.fiberFunction}: </span>{f.function}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {nervesSubView === 'conditions' && (
              <div>
                <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
                  {ui.brainMap.relatedConditionsHeading}
                </h2>
                <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
                  {ui.brainMap.snpConditionsHint}
                </p>

                {conditionsLoading && (
                  <p className="text-sm text-ink/40 dark:text-white/40">{ui.brainMap.loadingConditions}</p>
                )}

                {conditionsError && (
                  <p className="text-sm text-red-500">{conditionsError}</p>
                )}

                {!conditionsLoading && !conditionsError && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {peripheralConditions.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCondition(c)}
                        className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:border-[#F5A524]/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#F5A524]/10"
                      >
                        <p className="text-sm font-semibold text-ink dark:text-white">
                          {c.condition_name}
                        </p>
                        {c.evidence_level && (
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wide mt-2 text-ink/40 dark:text-white/40">
                            {ui.fields.evidence}: {c.evidence_level}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {nervesSubView === 'diffuse' && (
              <div>
                <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
                  {ui.brainMap.diffuseHeading}
                </h2>
                <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
                  {ui.brainMap.diffuseHint}
                </p>

                {diffuseLoading && (
                  <p className="text-sm text-ink/40 dark:text-white/40">{ui.brainMap.loadingDiffuse}</p>
                )}

                {diffuseError && (
                  <p className="text-sm text-red-500">{diffuseError}</p>
                )}

                {!diffuseLoading && !diffuseError && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {diffuseConditions.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCondition(c)}
                        className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:border-[#F5A524]/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#F5A524]/10"
                      >
                        <p className="text-sm font-semibold text-ink dark:text-white">
                          {c.condition_name}
                        </p>
                        {c.evidence_level && (
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wide mt-2 text-ink/40 dark:text-white/40">
                            {ui.fields.evidence}: {c.evidence_level}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {view === 'pathways' && (
          <div>
            <div className="flex justify-center mb-8">
              <div className="relative inline-flex rounded-full border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-1 shadow-sm shadow-black/[0.03] dark:shadow-black/30">
                {(['circuits', 'gait', 'localization'] as const).map((sv) => (
                  <button
                    key={sv}
                    onClick={() => setPathwaySubView(sv)}
                    className={`relative z-10 px-5 py-2 rounded-full text-[13px] font-semibold transition-colors duration-300 active:scale-[0.96] ${
                      pathwaySubView === sv
                        ? 'text-white'
                        : 'text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white'
                    }`}
                  >
                    {pathwaySubView === sv && (
                      <motion.span
                        layoutId="pathwaySubTabIndicator"
                        className="absolute inset-0 -z-10 rounded-full"
                        style={{ background: VIEW_COLORS.pathways.solid }}
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative">
                      {sv === 'circuits' ? ui.brainMap.pathwaySubTabs.circuits : sv === 'gait' ? ui.brainMap.pathwaySubTabs.gait : ui.brainMap.pathwaySubTabs.localization}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {pathwaySubView === 'circuits' && (
              <div>
                                               <div className="flex justify-center gap-2 mb-8">
                  {(['long-tracts', 'brain-circuits'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setPathwayCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-300 active:scale-[0.96] ${
                        pathwayCategoryFilter === cat
                          ? 'text-white shadow-md shadow-[#32D6A0]/20'
                          : 'text-ink/50 dark:text-white/50 border border-black/[0.08] dark:border-white/10 hover:text-ink dark:hover:text-white hover:border-[#32D6A0]/30'
                      }`}
                      style={pathwayCategoryFilter === cat ? { background: '#32D6A0' } : undefined}
                    >
                      {cat === 'long-tracts' ? ui.brainMap.pathwayCategoryLabels.longTracts : ui.brainMap.pathwayCategoryLabels.brainCircuits}
                    </button>
                  ))}
                </div>

                <div className="space-y-6">
                  {filteredPathways.map((p) => (
                    <div
                      key={p.slug}
                      className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-[#A855F7]/30 hover:shadow-xl hover:shadow-[#A855F7]/10"
                    >
                      <button
                        onClick={() => setExpandedPathway(p)}
                        className="group relative w-full aspect-[16/9] overflow-hidden bg-[#08090b] block"
                      >
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                        <div
                          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-white"
                          style={{ background: `${VIEW_COLORS.pathways.solid}CC` }}
                        >
                          <Maximize2 size={14} />
                        </div>
                      </button>
                      <div className="p-5">
                        <p className="text-base font-semibold text-ink dark:text-white">{p.title}</p>
                        <p className="text-xs text-ink/50 dark:text-white/50 mt-0.5 mb-3">{p.subtitle}</p>
                        <p
                          className="text-xs font-mono mb-3 leading-relaxed"
                          style={{ color: VIEW_COLORS.pathways.solid }}
                        >
                          {p.route}
                        </p>
                        <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pathwaySubView === 'gait' && (
              <div>
                <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
                  {ui.brainMap.gaitHint}
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {gaitTypes.map((g) => (
                    <div
                      key={g.slug}
                      className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.06] dark:hover:shadow-black/40"
                    >
                      <p className="text-sm font-semibold text-ink dark:text-white">{g.name}</p>
                      <p
                        className="text-xs font-medium mt-0.5 mb-2"
                        style={{ color: VIEW_COLORS.pathways.solid }}
                      >
                        {g.origin}
                      </p>
                      <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed">
                        {g.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pathwaySubView === 'localization' && (
              <div>
                <p className="text-sm text-ink/50 dark:text-white/50 mb-8 max-w-2xl">
                  {ui.brainMap.localizationHint}
                </p>
                <div className="space-y-4">
                  {localizationPrinciples.map((lp, i) => (
                    <div
                      key={lp.slug}
                      className="group relative rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-6 overflow-hidden transition-all duration-300 hover:border-[#A855F7]/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#A855F7]/10"
                    >
                      <div
                        className="pointer-events-none absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.07] blur-3xl transition-opacity duration-300 group-hover:opacity-[0.16]"
                        style={{ background: VIEW_COLORS.pathways.gradient }}
                      />
                      <div className="relative flex items-start gap-4">
                        <div
                          className="shrink-0 flex h-11 w-11 items-center justify-center rounded-full text-white font-display text-sm font-bold shadow-lg shadow-black/10"
                          style={{ background: VIEW_COLORS.pathways.gradient }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-ink dark:text-white mb-1.5">
                            {lp.title}
                          </p>
                          <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed">
                            {lp.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-110 active:scale-95"
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
              className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0e0f12] border border-black/[0.06] dark:border-white/10 p-8 shadow-2xl shadow-black/20 dark:shadow-black/60"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-ink dark:text-white pr-6">
                  {selectedCondition.condition_name}
                </h3>
                <button
                  onClick={() => setSelectedCondition(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 transition-all duration-200 hover:scale-110 hover:bg-black/10 dark:hover:bg-white/20 active:scale-95"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-4">
                <ClinicalActionBar contentType="condition" contentId={String(selectedCondition.id)} label={selectedCondition.condition_name} section="Brain Map" />
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
    </div>
  );
}
