'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { X, Maximize2, Sparkles, Loader2 } from 'lucide-react';

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
interface NerveListItem {
  id: string;
  slug: string;
  name: string;
  region: string;
  compression_site?: string;
}

const REGION_LABEL: Record<string, string> = {
  plexus: 'Plesso',
  upper_limb: 'Arto Superiore',
  lower_limb: 'Arto Inferiore',
  cranial: 'Nervi Cranici',
};



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
    route: 'Corteccia motoria (M1, Area 4) → capsula interna → peduncolo cerebrale → ponte → piramidi bulbari → decussazione (70-90% delle fibre) → midollo spinale → motoneuroni',
    description:
      "Origina per circa il 60% dalla corteccia motoria primaria (M1, Area 4) e per il 40% dalla corteccia premotoria (Area 6) e dall'area parietale. Scende attraverso il braccio posteriore della capsula interna, il peduncolo cerebrale del mesencefalo, la base del ponte, fino alle piramidi del bulbo, dove la maggior parte delle fibre (70-90%) decussa formando il tratto corticospinale laterale (controlla la muscolatura distale degli arti). Le fibre restanti proseguono omolateralmente come tratto corticospinale anteriore, decussando solo vicino al livello di terminazione, e controllano prevalentemente la muscolatura assiale. È la via responsabile dei movimenti volontari rapidi, precisi e appresi, in particolare delle dita e della mano.",
  },
  {
    title: 'Corticobulbar Pathway',
    subtitle: 'Voluntary motor control — head and face',
    image: `${IMAGE_BASE}/pathway-corticobulbar.png`,
    route: 'Corteccia motoria (Aree 4 e 6) → ginocchio della capsula interna → tronco encefalico → nuclei motori dei nervi cranici (III, IV, V, VI, VII, IX, X, XII)',
    description:
      "Origina dalla corteccia motoria primaria e premotoria e discende attraverso il ginocchio della capsula interna fino ai nuclei motori dei nervi cranici nel tronco encefalico, controllando i muscoli di volto, mandibola, faringe, laringe e lingua. A differenza del tratto corticospinale, la maggior parte delle fibre corticobulbari NON decussa: l'innervazione della muscolatura del volto superiore (fronte, chiusura degli occhi) è bilaterale, mentre quella del volto inferiore (bocca) e della lingua è prevalentemente controlaterale. Questa distinzione è clinicamente fondamentale: una lesione centrale (es. ictus) risparmia tipicamente il movimento della fronte ma causa paralisi della metà inferiore del volto controlaterale, mentre una lesione periferica del nervo facciale (es. paralisi di Bell) coinvolge l'intero emivolto omolaterale, fronte inclusa.",
  },
  {
    title: 'Extrapyramidal Pathways',
    subtitle: 'Involuntary motor control, posture and tone',
    image: `${IMAGE_BASE}/pathway-extrapyramidal.png`,
    route: 'Nuclei del tronco encefalico (nucleo rosso, formazione reticolare, nuclei vestibolari, collicolo superiore) → midollo spinale → interneuroni e motoneuroni',
    description:
      "A differenza del sistema piramidale, le vie extrapiramidali non originano dalla corteccia ma da nuclei del tronco encefalico, e agiscono in gran parte al di fuori del controllo cosciente diretto. Il tratto rubrospinale (dal nucleo rosso mesencefalico) facilita i muscoli flessori, soprattutto dell'arto superiore. Il tratto reticolospinale (dalla formazione reticolare di ponte e bulbo) regola postura, tono muscolare e movimenti automatici. Il tratto vestibolospinale (dai nuclei vestibolari) mantiene equilibrio e postura integrando l'informazione labirintica. Il tratto tettospinale (dal collicolo superiore) coordina i movimenti riflessi di capo e occhi in risposta a stimoli visivi/uditivi. Clinicamente, una lesione piramidale causa debolezza/paralisi con iperreflessia, mentre una disfunzione extrapiramidale si manifesta come alterazione del tono (rigidità, spasticità, distonia) senza vera paralisi.",
  },
  {
    title: 'Dorsal Column-Medial Lemniscus Pathway',
    subtitle: 'Fine touch, vibration and proprioception',
    image: `${IMAGE_BASE}/pathway-dorsal-column.png`,
    route: 'Recettori periferici → colonne dorsali (fascicolo gracile/cuneato) → nuclei gracile/cuneato nel bulbo → decussazione (fibre arcuate interne) → lemnisco mediale → talamo (VPL) → corteccia somatosensoriale (S1)',
    description:
      "Trasporta tatto fine, vibrazione, propriocezione cosciente e discriminazione tra due punti. Le fibre di primo ordine entrano nel midollo spinale e salgono omolateralmente senza sinapsi nelle colonne dorsali: il fascicolo gracile (mediale) porta informazioni dagli arti inferiori, il fascicolo cuneato (laterale) dagli arti superiori. Fanno sinapsi nei nuclei gracile e cuneato del bulbo, dove le fibre di secondo ordine decussano (fibre arcuate interne) formando il lemnisco mediale, che sale fino al talamo (nucleo ventrale posterolaterale). Da qui, le fibre di terzo ordine proiettano alla corteccia somatosensoriale primaria. Punto chiave: questa via decussa solo nel bulbo — molto più in alto rispetto alla via spinotalamica, che decussa subito nel midollo spinale.",
  },
  {
    title: 'Spinothalamic (Anterolateral) Pathway',
    subtitle: 'Pain, temperature and crude touch',
    image: `${IMAGE_BASE}/pathway-spinothalamic.png`,
    route: 'Recettori periferici → corno dorsale del midollo → decussazione immediata (commissura bianca anteriore) → tratto anterolaterale → talamo (VPL) → corteccia somatosensoriale (S1)',
    description:
      "Trasporta dolore, temperatura e tatto grossolano/pressione. Le fibre di primo ordine entrano nel corno dorsale del midollo spinale e fanno sinapsi quasi subito. Le fibre di secondo ordine decussano immediatamente (entro 1-2 segmenti spinali) attraverso la commissura bianca anteriore, per poi salire controlateralmente nel funicolo anterolaterale come tratto spinotalamico laterale (dolore/temperatura) e tratto spinotalamico anteriore (tatto grossolano/pressione). Raggiungono il talamo e da lì la corteccia somatosensoriale. Punto chiave: questa via decussa subito a livello del midollo spinale — l'opposto della via delle colonne dorsali. Clinicamente, un'emisezione del midollo spinale causa un pattern dissociato: perdita di propriocezione/tatto fine OMOLATERALE (colonne dorsali, non ancora decussate) ma perdita di dolore/temperatura CONTROLATERALE (spinotalamica, già decussata) al di sotto del livello della lesione.",
  },
  {
    title: 'Basal Ganglia Circuitry',
    subtitle: 'Direct and indirect pathways of movement control',
    image: `${IMAGE_BASE}/pathway-basal-ganglia.png`,
    route: 'Corteccia → striato (caudato + putamen) → [via diretta: globo pallido interno/substantia nigra reticolata] o [via indiretta: globo pallido esterno → nucleo subtalamico → globo pallido interno] → talamo → corteccia',
    description:
      "I gangli della base non hanno connessioni dirette con il midollo spinale, ma modulano il movimento tramite un circuito che parte e ritorna alla corteccia, passando per il talamo. La via diretta facilita il movimento: la corteccia eccita lo striato, che inibisce il globo pallido interno/substantia nigra reticolata, riducendo l'inibizione tonica sul talamo — risultato netto: eccitazione della corteccia motoria. La via indiretta inibisce il movimento attraverso un percorso più lungo (striato → globo pallido esterno → nucleo subtalamico → globo pallido interno), con un risultato netto opposto: maggiore inibizione del talamo. La dopamina, rilasciata dalla substantia nigra pars compacta, facilita la via diretta (recettori D1) e inibisce la via indiretta (recettori D2) — l'effetto netto è la facilitazione del movimento. Nella malattia di Parkinson, la degenerazione dei neuroni dopaminergici sposta l'equilibrio verso l'inibizione del talamo, causando bradicinesia, rigidità e tremore a riposo.",
  },
];

const GAIT_TYPES = [
  {
    name: 'Andatura Spastica',
    origin: 'Lesione del I motoneurone (es. post-ictus, paralisi cerebrale)',
    description:
      "Movimento a falce dell'arto inferiore colpito (circumduzione), ginocchio esteso e piede in equinismo/inversione durante lo swing, per compensare la difficoltà a flettere anca/ginocchio/caviglia contro l'ipertono spastico. Tipicamente asimmetrica negli esiti di ictus.",
  },
  {
    name: 'Andatura Parkinsoniana',
    origin: 'Disfunzione dei gangli della base (deplezione dopaminergica)',
    description:
      "Passi piccoli e strascicati (marche a piccoli passi), ridotta oscillazione delle braccia, postura flessa in avanti, difficoltà nell'iniziare il passo (freezing) e tendenza alla festinazione (accelerazione involontaria progressiva del passo).",
  },
  {
    name: 'Andatura Atassica Cerebellare',
    origin: 'Disfunzione cerebellare',
    description:
      "Base d'appoggio allargata, passo irregolare ed eterogeneo (varia in ampiezza e lunghezza da un passo all'altro, a differenza della marcia a piccoli passi che è più omogenea), oscillazione del tronco, difficoltà nei cambi di direzione.",
  },
  {
    name: 'Andatura Steppante (Steppage)',
    origin: 'Paralisi del nervo peroneale / foot drop',
    description:
      "Eccessiva flessione di anca e ginocchio durante lo swing per compensare l'incapacità di dorsiflettere la caviglia (piede cadente), evitando che le dita strascichino a terra. Il piede tocca terra prima con le dita che con il tallone.",
  },
  {
    name: 'Andatura Talloneggiante (Atassia Sensitiva)',
    origin: 'Deficit propriocettivo (es. via delle colonne dorsali)',
    description:
      "Il paziente colpisce il suolo con forza eccessiva con il tallone, spesso guardando i propri piedi per compensare visivamente la perdita di informazione propriocettiva. Peggiora marcatamente a occhi chiusi (Romberg positivo).",
  },
  {
    name: 'Andatura Vestibolare',
    origin: 'Disfunzione del sistema vestibolare',
    description:
      "Collo e testa mantenuti rigidi per minimizzare le vertigini, possibile deviazione laterale verso il lato della lesione durante la marcia.",
  },
  {
    name: 'Andatura Cauta (Anziano)',
    origin: 'Paura di cadere, deficit multisensoriale età-correlato',
    description:
      "Passi corti, base d'appoggio lievemente allargata, ridotta velocità, aumentato tempo di doppio appoggio — un pattern adattivo protettivo più che una vera lesione neurologica focale, spesso multifattoriale (visione, propriocezione, forza, paura).",
  },
];

export default function BrainMapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);

  const initialView = (searchParams.get('view') as View) || 'brain';
  const [view, setView] = useState<View>(initialView);
  const [hovered, setHovered] = useState<string | null>(null);
  const [expandedPathway, setExpandedPathway] = useState<{ title: string; image: string } | null>(null);
  const [pathwaySubView, setPathwaySubView] = useState<'circuits' | 'gait'>('circuits');
  const [nervesSubView, setNervesSubView] = useState<'atlas' | 'seddon' | 'conditions'>('atlas');
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
      const res = await fetch('/api/brain-map/peripheral-nerves');
      if (!res.ok) throw new Error('Errore nel recupero delle patologie');
      const data = await res.json();
      setPeripheralConditions(data.conditions ?? []);
      setHasFetchedConditions(true);
    } catch (err) {
      setConditionsError('Impossibile caricare le patologie collegate.');
      console.error(err);
    } finally {
      setConditionsLoading(false);
    }
  };
  fetchConditions();
}, [view, hasFetchedConditions]);

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
      const res = await fetch('/api/brain-map/nerves');
      if (!res.ok) throw new Error('Errore nel recupero dei nervi');
      const data = await res.json();
      setAllNerves(data.nerves ?? []);
      setHasFetchedNerves(true);
    } catch (err) {
      setNervesError('Impossibile caricare i nervi.');
      console.error(err);
    } finally {
      setNervesLoading(false);
    }
  };
  fetchNerves();
}, [view, hasFetchedNerves]);

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
    { key: 'atlas' as const, label: 'Atlante Nervi' },
    { key: 'seddon' as const, label: 'Classificazione Seddon' },
    { key: 'conditions' as const, label: 'Patologie Collegate' },
  ];

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
          <div className="mt-12">
            <div className="flex justify-center mb-10">
              <div className="inline-flex flex-wrap justify-center rounded-full border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-1">
                {NERVES_SUB_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setNervesSubView(t.key)}
                    className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      nervesSubView === t.key
                        ? 'text-white'
                        : 'text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white'
                    }`}
                    style={
                      nervesSubView === t.key
                        ? { background: VIEW_STYLES.nerves.solid }
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
                  Peripheral Nerve Atlas
                </h2>
                <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
                  Tocca un nervo per anatomia, funzione motoria/sensitiva, sede di compressione tipica e patologie collegate.
                </p>

                {nervesLoading && (
                  <p className="text-sm text-ink/40 dark:text-white/40">Caricamento nervi...</p>
                )}
                {nervesError && <p className="text-sm text-red-500">{nervesError}</p>}

                {!nervesLoading && !nervesError && (
                  <>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(['all', 'plexus', 'cranial', 'upper_limb', 'lower_limb'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setNerveRegionFilter(r)}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            nerveRegionFilter === r
                              ? 'text-white'
                              : 'text-ink/60 dark:text-white/60 border border-black/[0.08] dark:border-white/10 hover:text-ink dark:hover:text-white'
                          }`}
                          style={nerveRegionFilter === r ? { background: VIEW_STYLES.nerves.gradient } : undefined}
                        >
                          {r === 'all' ? 'Tutti' : REGION_LABEL[r]}
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
                                {REGION_LABEL[region] ?? region}
                              </h3>
                              <div className="grid sm:grid-cols-2 gap-3">
                                {nervesInRegion.map((n) => (
                                  <button
                                    key={n.id}
                                    onClick={() => router.push(`/dashboard/brain-map/nerve/${n.slug}`)}
                                    className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 hover:border-[#F5A524]/40 transition-colors"
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

                    <div className="mt-8 rounded-2xl border border-[#F5A524]/20 bg-[#F5A524]/5 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={16} className="text-[#F5A524]" />
                        <p className="text-sm font-semibold text-ink dark:text-white">
                          Non trovi il nervo che cerchi? Chiedi a Phygo
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={askQuery}
                          onChange={(e) => setAskQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAskPhygo()}
                          placeholder="es. nervo ileoipogastrico, nervo genitofemorale..."
                          className="flex-1 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-2.5 text-sm text-ink dark:text-white placeholder:text-ink/40 dark:placeholder:text-white/40 outline-none focus:border-[#F5A524]/40"
                        />
                        <button
                          onClick={handleAskPhygo}
                          disabled={askLoading || !askQuery.trim()}
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                          style={{ background: VIEW_STYLES.nerves.gradient }}
                        >
                          {askLoading ? <Loader2 size={16} className="animate-spin" /> : 'Chiedi'}
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
                  Nerve Injury Classification
                </h2>
                <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
                  Classificazione di Seddon, dalla più lieve alla più severa — utile per orientare prognosi e tempistiche di recupero.
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
                    style={{ background: `${VIEW_STYLES.nerves.solid}CC` }}
                  >
                    <Maximize2 size={14} />
                  </div>
                </button>

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
            )}

            {nervesSubView === 'conditions' && (
              <div>
                <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
                  Related Conditions
                </h2>
                <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
                  Patologie del sistema nervoso periferico presenti nella Knowledge Base di Phygo. Tocca una card per i dettagli clinici.
                </p>

                {conditionsLoading && (
                  <p className="text-sm text-ink/40 dark:text-white/40">Caricamento patologie...</p>
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
                        className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 hover:border-[#F5A524]/40 transition-colors"
                      >
                        <p className="text-sm font-semibold text-ink dark:text-white">
                          {c.condition_name}
                        </p>
                        {c.evidence_level && (
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wide mt-2 text-ink/40 dark:text-white/40">
                            Evidence: {c.evidence_level}
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
              <div className="inline-flex rounded-full border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-1">
                {(['circuits', 'gait'] as const).map((sv) => (
                  <button
                    key={sv}
                    onClick={() => setPathwaySubView(sv)}
                    className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      pathwaySubView === sv
                        ? 'text-white'
                        : 'text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white'
                    }`}
                    style={
                      pathwaySubView === sv
                        ? { background: VIEW_STYLES.pathways.solid }
                        : undefined
                    }
                  >
                    {sv === 'circuits' ? 'Pathways' : 'Gait Patterns'}
                  </button>
                ))}
              </div>
            </div>

            {pathwaySubView === 'circuits' && (
              <div className="space-y-6">
                {PATHWAYS.map((p) => (
                  <div
                    key={p.title}
                    className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden"
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
                        style={{ background: `${VIEW_STYLES.pathways.solid}CC` }}
                      >
                        <Maximize2 size={14} />
                      </div>
                    </button>
                    <div className="p-5">
                      <p className="text-base font-semibold text-ink dark:text-white">{p.title}</p>
                      <p className="text-xs text-ink/50 dark:text-white/50 mt-0.5 mb-3">{p.subtitle}</p>
                      <p
                        className="text-xs font-mono mb-3 leading-relaxed"
                        style={{ color: VIEW_STYLES.pathways.solid }}
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
            )}

            {pathwaySubView === 'gait' && (
              <div>
                <p className="text-sm text-ink/50 dark:text-white/50 mb-6 max-w-2xl">
                  Il riconoscimento del pattern del cammino orienta la localizzazione della lesione neurologica sottostante.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {GAIT_TYPES.map((g) => (
                    <div
                      key={g.name}
                      className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5"
                    >
                      <p className="text-sm font-semibold text-ink dark:text-white">{g.name}</p>
                      <p
                        className="text-xs font-medium mt-0.5 mb-2"
                        style={{ color: VIEW_STYLES.pathways.solid }}
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