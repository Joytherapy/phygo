'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ClinicalActionBar from '@/components/ClinicalActionBar';
import {
  ClipboardList, Activity, Bone, Waves, Brain, Hand,
  Footprints, HandHeart, Gauge, HeartPulse, Zap, PersonStanding,
  Droplets, ClipboardCheck, Sparkles, ArrowRight, PenLine, Flame, Search,
} from 'lucide-react';
import MetabolicCalculator from '@/components/MetabolicCalculator';
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext';
import type { OrthoTestContent } from '@/lib/orthopedicTestsContent';
import type { SF36Domain, SF36ItemContent, SF36SectionContent, PFDIItemContent, ICIQCircumstanceContent, QOption } from '@/lib/pelvicFloorQuestionnaires';
import type { ScaleKey, ScaleOption } from '@/lib/functionalScalesContent';

// Functional Scales content (item labels, option labels, interpretation
// text for all 27 scales below) now lives in lib/functionalScalesContent.ts
// and is served translated via /api/clinical-tools/functional-scales, so
// it's no longer hardcoded here. Scoring logic (reduce/ternary math) stays
// here, language-independent; only display text is a prop now.

// Scale names are localized per language below (EN/ES/FR keep the
// original international names; IT translates them, keeping the
// recognizable acronym in parentheses where one is commonly used —
// same convention as the Cardiopulmonary test names).
const SCALE_NAMES_IT: Record<ScaleKey, string> = {
  katz: 'Indice di Katz',
  barthel: 'Indice di Barthel',
  tinetti: 'Scala di Tinetti',
  conley: 'Scala di Conley',
  berg: "Scala dell'Equilibrio di Berg (Berg Balance Scale)",
  morse: 'Scala di Morse per il Rischio di Caduta',
  ashworth: 'Scala di Ashworth Modificata',
  nrs: 'Scala Numerica del Dolore (NRS)',
  sppb: 'Batteria Breve di Performance Fisica (SPPB)',
  mmse: 'Esame Mini-Mentale (MMSE)',
  gcs: 'Scala di Coma di Glasgow (GCS)',
  tug: 'Alzati e Cammina Cronometrato (TUG)',
  sixmwt: 'Test del Cammino dei 6 Minuti (6MWT)',
  sf36: 'SF-36',
  nihss: 'Scala NIH per lo Stroke (NIHSS)',
  updrs3: 'UPDRS Parte III',
  womac: 'WOMAC',
  dash: 'DASH (Disabilità di Braccio, Spalla e Mano)',
  wmft: 'Test della Funzione Motoria di Wolf (WMFT)',
  boxblock: 'Test dei Cubetti (Box and Block Test)',
  jebsen: 'Test di Jebsen per la Funzione della Mano',
  tct: 'Test di Controllo del Tronco (TCT)',
  edss: 'Scala di Disabilità Estesa (EDSS)',
  hy: 'Scala di Hoehn e Yahr',
  fss: 'Scala di Severità della Fatica (FSS)',
  hhs: "Punteggio di Harris per l'Anca (HHS)",
  ucla: 'Scala di Valutazione della Spalla UCLA',
  drs: 'Scala di Valutazione della Disabilità (DRS)',
};

const SCALE_NAMES_EN: Record<ScaleKey, string> = {
  katz: 'Katz Index',
  barthel: 'Barthel Index',
  tinetti: 'Tinetti Scale',
  conley: 'Conley Scale',
  berg: 'Berg Balance Scale',
  morse: 'Morse Fall Scale',
  ashworth: 'Modified Ashworth',
  nrs: 'NRS Pain Scale',
  sppb: 'SPPB',
  mmse: 'MMSE',
  gcs: 'Glasgow Coma Scale',
  tug: 'Timed Up and Go',
  sixmwt: '6-Minute Walk Test',
  sf36: 'SF-36',
  nihss: 'NIHSS',
  updrs3: 'UPDRS Part III',
  womac: 'WOMAC',
  dash: 'DASH',
  wmft: 'Wolf Motor Function Test',
  boxblock: 'Box and Block Test',
  jebsen: 'Jebsen Hand Function Test',
  tct: 'Trunk Control Test',
  edss: 'EDSS',
  hy: 'Hoehn & Yahr',
  fss: 'Fatigue Severity Scale',
  hhs: 'Harris Hip Score',
  ucla: 'UCLA Shoulder Rating',
  drs: 'Disability Rating Scale',
};

const SCALE_NAMES_ES: Record<ScaleKey, string> = {
  katz: 'Índice de Katz',
  barthel: 'Índice de Barthel',
  tinetti: 'Escala de Tinetti',
  conley: 'Escala de Conley',
  berg: 'Escala de Equilibrio de Berg (Berg Balance Scale)',
  morse: 'Escala de Morse de Riesgo de Caída',
  ashworth: 'Escala de Ashworth Modificada',
  nrs: 'Escala Numérica del Dolor (NRS)',
  sppb: 'Batería Corta de Rendimiento Físico (SPPB)',
  mmse: 'Mini-Examen del Estado Mental (MMSE)',
  gcs: 'Escala de Coma de Glasgow (GCS)',
  tug: 'Timed Up and Go Cronometrado (TUG)',
  sixmwt: 'Test de la Marcha de 6 Minutos (6MWT)',
  sf36: 'SF-36',
  nihss: 'Escala NIH para el Ictus (NIHSS)',
  updrs3: 'UPDRS Parte III',
  womac: 'WOMAC',
  dash: 'DASH (Discapacidad de Brazo, Hombro y Mano)',
  wmft: 'Test de Función Motora de Wolf (WMFT)',
  boxblock: 'Test de Cubos y Bloques (Box and Block Test)',
  jebsen: 'Test de Jebsen de Función de la Mano',
  tct: 'Test de Control del Tronco (TCT)',
  edss: 'Escala Ampliada de Discapacidad (EDSS)',
  hy: 'Escala de Hoehn y Yahr',
  fss: 'Escala de Severidad de la Fatiga (FSS)',
  hhs: 'Puntuación de Cadera de Harris (HHS)',
  ucla: 'Escala de Hombro UCLA',
  drs: 'Escala de Valoración de la Discapacidad (DRS)',
};

const SCALE_NAMES_FR: Record<ScaleKey, string> = {
  katz: "Indice de Katz",
  barthel: 'Indice de Barthel',
  tinetti: 'Échelle de Tinetti',
  conley: 'Échelle de Conley',
  berg: "Échelle d'Équilibre de Berg (Berg Balance Scale)",
  morse: 'Échelle de Morse du Risque de Chute',
  ashworth: "Échelle d'Ashworth Modifiée",
  nrs: 'Échelle Numérique de la Douleur (NRS)',
  sppb: 'Batterie Courte de Performance Physique (SPPB)',
  mmse: 'Mini-Examen de l’État Mental (MMSE)',
  gcs: 'Échelle de Coma de Glasgow (GCS)',
  tug: 'Timed Up and Go Chronométré (TUG)',
  sixmwt: 'Test de Marche de 6 Minutes (6MWT)',
  sf36: 'SF-36',
  nihss: "Échelle NIH de l'AVC (NIHSS)",
  updrs3: 'UPDRS Partie III',
  womac: 'WOMAC',
  dash: 'DASH (Incapacité du Bras, de l’Épaule et de la Main)',
  wmft: 'Test de Fonction Motrice de Wolf (WMFT)',
  boxblock: 'Test des Cubes et Blocs (Box and Block Test)',
  jebsen: 'Test de Jebsen de la Fonction de la Main',
  tct: 'Test de Contrôle du Tronc (TCT)',
  edss: 'Échelle Étendue de Handicap (EDSS)',
  hy: 'Échelle de Hoehn et Yahr',
  fss: 'Échelle de Sévérité de la Fatigue (FSS)',
  hhs: 'Score de Hanche de Harris (HHS)',
  ucla: "Échelle d'Épaule UCLA",
  drs: "Échelle d'Évaluation du Handicap (DRS)",
};

const SCALE_NAMES_BY_LANG: Record<'it' | 'en' | 'es' | 'fr', Record<ScaleKey, string>> = {
  it: SCALE_NAMES_IT,
  en: SCALE_NAMES_EN,
  es: SCALE_NAMES_ES,
  fr: SCALE_NAMES_FR,
};

const SCALE_KEYS: ScaleKey[] = [
  'katz', 'barthel', 'tinetti', 'conley', 'berg', 'morse', 'ashworth', 'nrs', 'sppb', 'mmse',
  'gcs', 'tug', 'sixmwt', 'sf36', 'nihss', 'updrs3', 'womac', 'dash', 'wmft', 'boxblock',
  'jebsen', 'tct', 'edss', 'hy', 'fss', 'hhs', 'ucla', 'drs',
];

// Groups the 28 scales into clinical domains for a more organized, premium
// picker (instead of one flat 28-button grid). Purely a frontend grouping —
// no DB column involved — so the key set and order are defined here.
type ScaleGroupKey =
  | 'balanceFalls' | 'adl' | 'cognitiveConsciousness' | 'painTone' | 'aerobicQol'
  | 'strokeNeurodegenerative' | 'upperLimb' | 'orthopedics' | 'trunkGlobalDisability';

const SCALE_GROUP_ORDER: ScaleGroupKey[] = [
  'balanceFalls', 'adl', 'cognitiveConsciousness', 'painTone', 'aerobicQol',
  'strokeNeurodegenerative', 'upperLimb', 'orthopedics', 'trunkGlobalDisability',
];

const SCALE_GROUP_ICON: Record<ScaleGroupKey, typeof Footprints> = {
  balanceFalls: Footprints,
  adl: HandHeart,
  cognitiveConsciousness: Brain,
  painTone: Gauge,
  aerobicQol: HeartPulse,
  strokeNeurodegenerative: Zap,
  upperLimb: Hand,
  orthopedics: Bone,
  trunkGlobalDisability: PersonStanding,
};

const SCALE_GROUPS: Record<ScaleGroupKey, ScaleKey[]> = {
  balanceFalls: ['tinetti', 'conley', 'berg', 'morse', 'tug', 'sppb'],
  adl: ['katz', 'barthel'],
  cognitiveConsciousness: ['mmse', 'gcs'],
  painTone: ['nrs', 'ashworth'],
  aerobicQol: ['sixmwt', 'sf36'],
  strokeNeurodegenerative: ['nihss', 'updrs3', 'hy', 'edss', 'fss'],
  upperLimb: ['dash', 'wmft', 'boxblock', 'jebsen'],
  orthopedics: ['womac', 'hhs', 'ucla'],
  trunkGlobalDisability: ['tct', 'drs'],
};

const CATEGORY_TAB_ICON: Record<Category, typeof Activity> = {
  functional: Activity,
  orthopedic: Bone,
  'pelvic-floor': Waves,
  neuro: Brain,
  'manual-therapy': Hand,
  metabolic: Flame,
};

function ButtonGroup({
  options,
  value,
  onChange,
}: {
  options: { v: number; l: string }[];
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.v}
          onClick={() => onChange(opt.v)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            value === opt.v
              ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white'
              : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'
          }`}
        >
          {opt.l}
        </button>
      ))}
    </div>
  );
}

function ScaleDescription({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 mb-4">
      <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed">{text}</p>
    </div>
  );
}

function ResultBox({
  score,
  max,
  interpretation,
  saveKey,
  saveLabel,
  saveSection,
  saveContentType = 'clinical_test',
}: {
  score: number;
  max?: number;
  interpretation: string;
  /** Scale/questionnaire identifier (e.g. 'katz', 'pfdi20') — when set, shows an "Add to patient" action so the completed result can be attached to the patient's timeline. */
  saveKey?: string;
  /** Explicit display name override; otherwise resolved from SCALE_NAMES_BY_LANG when saveKey matches a functional scale. */
  saveLabel?: string;
  saveSection?: string;
  saveContentType?: 'clinical_test' | 'questionnaire';
}) {
  const { lang } = useLanguage();
  const ui = useUiStrings();
  const resolvedLabel =
    saveLabel ?? (saveKey ? (SCALE_NAMES_BY_LANG[lang] as Record<string, string>)[saveKey] : undefined) ?? saveKey;
  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10 border border-[#6366F1]/20 p-5 text-center">
      <p className="text-3xl font-bold">{score}{max !== undefined ? ` / ${max}` : ''}</p>
      <p className="text-sm text-ink/60 dark:text-white/60 mt-1">{interpretation}</p>
      {saveKey && (
        <div className="mt-4 flex justify-center">
          <ClinicalActionBar
            contentType={saveContentType}
            contentId={saveKey}
            label={resolvedLabel}
            section={saveSection || ui.clinicalToolkit.tabLabels.functional}
            payload={{ result: `${score}${max !== undefined ? `/${max}` : ''} — ${interpretation}` }}
          />
        </div>
      )}
    </div>
  );
}

// Shape returned by /api/clinical-tools/functional-scales (translated).
interface FunctionalScalesData {
  scaleSubtitles: Record<ScaleKey, string>;
  scaleDescriptions: Record<ScaleKey, string>;
  katz: { items: { key: string; label: string }[]; options: ScaleOption[]; text: { full: string; moderate: string; severe: string } };
  barthel: { items: { key: string; label: string; options: ScaleOption[] }[]; text: { severe: string; moderate: string; mild: string; independent: string } };
  tinetti: {
    balance: { key: string; label: string; max: number }[];
    gait: { key: string; label: string; max: number }[];
    text: { balanceHeading: string; gaitHeading: string; low: string; moderate: string; high: string };
  };
  conley: { items: { key: string; label: string; max: number }[]; text: { significant: string; low: string } };
  berg: { items: string[]; text: { low: string; moderate: string; high: string } };
  morse: { items: { key: string; label: string; options: ScaleOption[] }[]; text: { high: string; moderate: string; low: string } };
  ashworth: { levels: { v: number; l: string; desc: string }[]; text: { label: string; resultTemplate: string } };
  nrs: { text: { label: string; none: string; mild: string; moderate: string; severe: string } };
  sppb: {
    balanceOptions: ScaleOption[]; gaitOptions: ScaleOption[]; chairOptions: ScaleOption[];
    text: { balanceLabel: string; gaitLabel: string; chairLabel: string; good: string; limited: string; poor: string };
  };
  mmse: { text: { label: string; normal: string; mildModerate: string; severe: string } };
  gcs: {
    eyeOptions: ScaleOption[]; verbalOptions: ScaleOption[]; motorOptions: ScaleOption[];
    text: { eyeLabel: string; verbalLabel: string; motorLabel: string; mild: string; moderate: string; severe: string };
  };
  tug: { text: { label: string; normal: string; frailNormal: string; risk: string } };
  sixmwt: { text: { label: string; interpretation: string } };
  nihss: {
    items: { id: string; label: string; options: ScaleOption[] }[];
    text: { none: string; minor: string; moderate: string; moderateSevere: string; severe: string; resultSuffixTemplate: string };
  };
  updrs3: { items: { id: string; label: string }[]; options: ScaleOption[]; text: { resultTemplate: string } };
  womac: {
    pain: { id: string; label: string }[]; stiffness: { id: string; label: string }[]; function: { id: string; label: string }[];
    options: ScaleOption[];
    text: { painHeading: string; stiffnessHeading: string; functionHeading: string; painGridLabel: string; stiffnessGridLabel: string; functionGridLabel: string; resultTemplate: string };
  };
  dash: { items: { id: string; label: string }[]; options: ScaleOption[]; text: { scoredTemplate: string; notEnoughTemplate: string } };
  wmft: { items: { id: string; label: string }[]; options: ScaleOption[]; text: { fasAverageLabel: string; timeAverageLabel: string; countSuffixTemplate: string } };
  boxblock: { text: { dominantLabel: string; nonDominantLabel: string; resultTemplate: string } };
  jebsen: { items: { id: string; label: string }[]; text: { resultTemplate: string } };
  tct: { items: { id: string; label: string }[]; options: ScaleOption[]; text: { resultTemplate: string } };
  edss: {
    fsSystems: { id: string; label: string }[]; steps: { v: number; l: string }[]; options: ScaleOption[];
    text: { fsHeading: string; stepHeading: string };
  };
  hy: { stages: { v: number; l: string; desc: string }[]; text: { label: string } };
  fss: { items: { id: string; label: string }[]; options: ScaleOption[]; text: { resultTemplate: string } };
  hhs: {
    options: {
      pain: ScaleOption[]; limp: ScaleOption[]; support: ScaleOption[]; distance: ScaleOption[]; sitting: ScaleOption[];
      transport: ScaleOption[]; stairs: ScaleOption[]; shoes: ScaleOption[]; deformity: ScaleOption[]; rom: ScaleOption[];
    };
    text: {
      painHeading: string; functionHeading: string; deformityHeading: string; romHeading: string;
      limpLabel: string; supportLabel: string; distanceLabel: string; sittingLabel: string; transportLabel: string;
      stairsLabel: string; shoesLabel: string; excellent: string; good: string; fair: string; poor: string; resultTemplate: string;
    };
  };
  ucla: {
    options: { pain: ScaleOption[]; function: ScaleOption[]; flexion: ScaleOption[]; strength: ScaleOption[]; satisfaction: ScaleOption[] };
    text: { painLabel: string; functionLabel: string; flexionLabel: string; strengthLabel: string; satisfactionLabel: string; excellent: string; good: string; poor: string };
  };
  drs: {
    options: { eye: ScaleOption[]; comm: ScaleOption[]; motor: ScaleOption[]; selfcare: ScaleOption[]; level: ScaleOption[]; employ: ScaleOption[] };
    text: {
      vigilanceHeading: string; selfcareHeading: string; dependenceHeading: string; psychosocialHeading: string;
      eyeLabel: string; commLabel: string; motorLabel: string; feedingLabel: string; toiletingLabel: string; groomingLabel: string;
      levelLabel: string; employLabel: string; minPartial: string; moderateSevere: string; severeExtreme: string; vegetative: string; extremeVegetative: string;
    };
  };
}

type FnUi = ReturnType<typeof useUiStrings>;

function KatzScale({ content }: { content: FunctionalScalesData['katz'] }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const total = content.items.reduce((sum, item) => sum + (scores[item.key] ?? 0), 0);
  return (
    <div className="space-y-4">
      {content.items.map((item) => (
        <div key={item.key} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <ButtonGroup options={content.options} value={scores[item.key]} onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))} />
        </div>
      ))}
      <ResultBox saveKey="katz" score={total} max={6} interpretation={total === 6 ? content.text.full : total >= 4 ? content.text.moderate : content.text.severe} />
    </div>
  );
}

function BarthelScale({ content }: { content: FunctionalScalesData['barthel'] }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const total = Object.values(scores).reduce((s, v) => s + v, 0);
  return (
    <div className="space-y-4">
      {content.items.map((item) => (
        <div key={item.key} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <ButtonGroup options={item.options} value={scores[item.key]} onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))} />
        </div>
      ))}
      <ResultBox saveKey="barthel" score={total} max={100} interpretation={total <= 40 ? content.text.severe : total <= 60 ? content.text.moderate : total < 100 ? content.text.mild : content.text.independent} />
    </div>
  );
}

function TinettiScale({ content }: { content: FunctionalScalesData['tinetti'] }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const balanceTotal = content.balance.reduce((s, i) => s + (scores[i.key] ?? 0), 0);
  const gaitTotal = content.gait.reduce((s, i) => s + (scores[i.key] ?? 0), 0);
  const total = balanceTotal + gaitTotal;
  const renderItems = (items: FunctionalScalesData['tinetti']['balance']) =>
    items.map((item) => (
      <div key={item.key} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{item.label}</p>
        <ButtonGroup options={Array.from({ length: item.max + 1 }, (_, v) => ({ v, l: String(v) }))} value={scores[item.key]} onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))} />
      </div>
    ));
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.balanceHeading}</h3>
        <div className="space-y-3">{renderItems(content.balance)}</div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.gaitHeading}</h3>
        <div className="space-y-3">{renderItems(content.gait)}</div>
      </div>
      <ResultBox saveKey="tinetti" score={total} max={28} interpretation={total >= 19 ? content.text.low : total >= 15 ? content.text.moderate : content.text.high} />
    </div>
  );
}

function ConleyScale({ content, ui }: { content: FunctionalScalesData['conley']; ui: FnUi }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const total = content.items.reduce((s, i) => s + (scores[i.key] ?? 0), 0);
  return (
    <div className="space-y-4">
      {content.items.map((item) => (
        <div key={item.key} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <ButtonGroup
            options={[{ v: 0, l: ui.clinicalToolkit.functional.noLabel }, { v: item.max, l: `${ui.clinicalToolkit.functional.yesLabel} (${item.max})` }]}
            value={scores[item.key]}
            onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))}
          />
        </div>
      ))}
      <ResultBox saveKey="conley" score={total} interpretation={total >= 2 ? content.text.significant : content.text.low} />
    </div>
  );
}

function BergBalanceScale({ content }: { content: FunctionalScalesData['berg'] }) {
  const [scores, setScores] = useState<Record<number, number>>({});
  const total = content.items.reduce((s, _, i) => s + (scores[i] ?? 0), 0);
  return (
    <div className="space-y-4">
      {content.items.map((label, i) => (
        <div key={i} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{i + 1}. {label}</p>
          <ButtonGroup options={[0, 1, 2, 3, 4].map((v) => ({ v, l: String(v) }))} value={scores[i]} onChange={(v) => setScores((s) => ({ ...s, [i]: v }))} />
        </div>
      ))}
      <ResultBox saveKey="berg" score={total} max={56} interpretation={total >= 41 ? content.text.low : total >= 21 ? content.text.moderate : content.text.high} />
    </div>
  );
}

function MorseFallScale({ content }: { content: FunctionalScalesData['morse'] }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const total = Object.values(scores).reduce((s, v) => s + v, 0);
  return (
    <div className="space-y-4">
      {content.items.map((item) => (
        <div key={item.key} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <ButtonGroup options={item.options} value={scores[item.key]} onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))} />
        </div>
      ))}
      <ResultBox saveKey="morse" score={total} max={125} interpretation={total >= 45 ? content.text.high : total >= 25 ? content.text.moderate : content.text.low} />
    </div>
  );
}

function AshworthScale({ content }: { content: FunctionalScalesData['ashworth'] }) {
  const [value, setValue] = useState<number | null>(null);
  const selected = content.levels.find((l) => l.v === value);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">{content.text.label}</p>
        <div className="space-y-2">
          {content.levels.map((l) => (
            <button key={l.v} onClick={() => setValue(l.v)} className={`w-full text-left rounded-xl p-3 transition-all ${value === l.v ? 'bg-gradient-to-r from-[#6366F1]/15 to-[#8B5CF6]/15 border border-[#6366F1]/40' : 'bg-black/[0.02] dark:bg-white/[0.02] border border-transparent'}`}>
              <span className="text-sm font-bold mr-2">{l.l}</span>
              <span className="text-sm text-ink/60 dark:text-white/60">{l.desc}</span>
            </button>
          ))}
        </div>
      </div>
      {selected && <ResultBox saveKey="ashworth" score={selected.v} interpretation={content.text.resultTemplate.replace('{grade}', selected.l).replace('{desc}', selected.desc)} />}
    </div>
  );
}

function NRSPainScale({ content }: { content: FunctionalScalesData['nrs'] }) {
  const [value, setValue] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">{content.text.label}</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, v) => (
            <button key={v} onClick={() => setValue(v)} className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${value === v ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white' : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      {value !== null && <ResultBox saveKey="nrs" score={value} max={10} interpretation={value === 0 ? content.text.none : value <= 3 ? content.text.mild : value <= 6 ? content.text.moderate : content.text.severe} />}
    </div>
  );
}

function SPPBScale({ content }: { content: FunctionalScalesData['sppb'] }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [gait, setGait] = useState<number | null>(null);
  const [chair, setChair] = useState<number | null>(null);
  const total = (balance ?? 0) + (gait ?? 0) + (chair ?? 0);
  const answered = balance !== null && gait !== null && chair !== null;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{content.text.balanceLabel}</p>
        <ButtonGroup options={content.balanceOptions} value={balance ?? undefined} onChange={setBalance} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{content.text.gaitLabel}</p>
        <ButtonGroup options={content.gaitOptions} value={gait ?? undefined} onChange={setGait} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{content.text.chairLabel}</p>
        <ButtonGroup options={content.chairOptions} value={chair ?? undefined} onChange={setChair} />
      </div>
      {answered && <ResultBox saveKey="sppb" score={total} max={12} interpretation={total >= 10 ? content.text.good : total >= 7 ? content.text.limited : content.text.poor} />}
    </div>
  );
}

function MMSEScale({ content }: { content: FunctionalScalesData['mmse'] }) {
  const [value, setValue] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">{content.text.label}</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 31 }, (_, v) => (
            <button key={v} onClick={() => setValue(v)} className={`w-9 h-9 rounded-full text-xs font-semibold transition-all ${value === v ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white' : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      {value !== null && <ResultBox saveKey="mmse" score={value} max={30} interpretation={value >= 24 ? content.text.normal : value >= 18 ? content.text.mildModerate : content.text.severe} />}
    </div>
  );
}

function GCSScale({ content }: { content: FunctionalScalesData['gcs'] }) {
  const [eye, setEye] = useState<number | null>(null);
  const [verbal, setVerbal] = useState<number | null>(null);
  const [motor, setMotor] = useState<number | null>(null);
  const total = (eye ?? 0) + (verbal ?? 0) + (motor ?? 0);
  const answered = eye !== null && verbal !== null && motor !== null;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{content.text.eyeLabel}</p>
        <ButtonGroup options={content.eyeOptions} value={eye ?? undefined} onChange={setEye} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{content.text.verbalLabel}</p>
        <ButtonGroup options={content.verbalOptions} value={verbal ?? undefined} onChange={setVerbal} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{content.text.motorLabel}</p>
        <ButtonGroup options={content.motorOptions} value={motor ?? undefined} onChange={setMotor} />
      </div>
      {answered && <ResultBox saveKey="gcs" score={total} max={15} interpretation={total >= 13 ? content.text.mild : total >= 9 ? content.text.moderate : content.text.severe} />}
    </div>
  );
}

function TUGScale({ content, ui }: { content: FunctionalScalesData['tug']; ui: FnUi }) {
  const [seconds, setSeconds] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">{content.text.label}</p>
        <div className="flex items-center gap-3">
          <input type="number" step="0.1" value={seconds ?? ''} onChange={(e) => setSeconds(e.target.value ? parseFloat(e.target.value) : null)} placeholder="0.0" className="w-28 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-sm outline-none focus:border-[#6366F1]" />
          <span className="text-sm text-ink/50 dark:text-white/50">{ui.clinicalToolkit.functional.secondsUnit}</span>
        </div>
      </div>
      {seconds !== null && <ResultBox saveKey="tug" score={seconds} interpretation={seconds <= 10 ? content.text.normal : seconds <= 20 ? content.text.frailNormal : content.text.risk} />}
    </div>
  );
}

function SixMWTScale({ content, ui }: { content: FunctionalScalesData['sixmwt']; ui: FnUi }) {
  const [meters, setMeters] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">{content.text.label}</p>
        <div className="flex items-center gap-3">
          <input type="number" value={meters ?? ''} onChange={(e) => setMeters(e.target.value ? parseFloat(e.target.value) : null)} placeholder="0" className="w-28 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-sm outline-none focus:border-[#6366F1]" />
          <span className="text-sm text-ink/50 dark:text-white/50">{ui.clinicalToolkit.functional.metersUnit}</span>
        </div>
      </div>
      {meters !== null && <ResultBox saveKey="sixmwt" score={meters} interpretation={content.text.interpretation} />}
    </div>
  );
}

function NIHSSScale({ content }: { content: FunctionalScalesData['nihss'] }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const total = content.items.reduce((s, i) => s + (scores[i.id] ?? 0), 0);
  const answeredCount = Object.keys(scores).length;
  const interpretation =
    total === 0 ? content.text.none :
    total <= 4 ? content.text.minor :
    total <= 15 ? content.text.moderate :
    total <= 20 ? content.text.moderateSevere : content.text.severe;
  return (
    <div className="space-y-4">
      {content.items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <ButtonGroup options={item.options} value={scores[item.id]} onChange={(v) => setScores((s) => ({ ...s, [item.id]: v }))} />
        </div>
      ))}
      <ResultBox saveKey="nihss" score={total} max={42} interpretation={content.text.resultSuffixTemplate.replace('{interp}', interpretation).replace('{answered}', String(answeredCount))} />
    </div>
  );
}

function UPDRSPartIIIScale({ content }: { content: FunctionalScalesData['updrs3'] }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const total = content.items.reduce((s, i) => s + (scores[i.id] ?? 0), 0);
  const answeredCount = Object.keys(scores).length;
  return (
    <div className="space-y-4">
      {content.items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <ButtonGroup options={content.options} value={scores[item.id]} onChange={(v) => setScores((s) => ({ ...s, [item.id]: v }))} />
        </div>
      ))}
      <ResultBox saveKey="updrs3" score={total} max={112} interpretation={content.text.resultTemplate.replace('{answered}', String(answeredCount)).replace('{total}', String(content.items.length))} />
    </div>
  );
}

function WOMACScale({ content }: { content: FunctionalScalesData['womac'] }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const painTotal = content.pain.reduce((s, i) => s + (scores[i.id] ?? 0), 0);
  const stiffTotal = content.stiffness.reduce((s, i) => s + (scores[i.id] ?? 0), 0);
  const funcTotal = content.function.reduce((s, i) => s + (scores[i.id] ?? 0), 0);
  const grandTotal = painTotal + stiffTotal + funcTotal;
  const answeredCount = Object.keys(scores).length;
  const renderGroup = (items: FunctionalScalesData['womac']['pain']) =>
    items.map((item) => (
      <div key={item.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{item.label}</p>
        <ButtonGroup options={content.options} value={scores[item.id]} onChange={(v) => setScores((s) => ({ ...s, [item.id]: v }))} />
      </div>
    ));
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.painHeading}</h3>
        <div className="space-y-3">{renderGroup(content.pain)}</div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.stiffnessHeading}</h3>
        <div className="space-y-3">{renderGroup(content.stiffness)}</div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.functionHeading}</h3>
        <div className="space-y-3">{renderGroup(content.function)}</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/60 dark:bg-white/[0.04] p-3 text-center">
          <p className="text-xs text-ink/50 dark:text-white/50">{content.text.painGridLabel}</p>
          <p className="text-xl font-bold">{painTotal}/20</p>
        </div>
        <div className="rounded-xl bg-white/60 dark:bg-white/[0.04] p-3 text-center">
          <p className="text-xs text-ink/50 dark:text-white/50">{content.text.stiffnessGridLabel}</p>
          <p className="text-xl font-bold">{stiffTotal}/8</p>
        </div>
        <div className="rounded-xl bg-white/60 dark:bg-white/[0.04] p-3 text-center">
          <p className="text-xs text-ink/50 dark:text-white/50">{content.text.functionGridLabel}</p>
          <p className="text-xl font-bold">{funcTotal}/68</p>
        </div>
      </div>
      <ResultBox saveKey="womac" score={grandTotal} max={96} interpretation={content.text.resultTemplate.replace('{answered}', String(answeredCount))} />
    </div>
  );
}

function DASHScale({ content }: { content: FunctionalScalesData['dash'] }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const answered = Object.values(scores);
  const answeredCount = answered.length;
  const sum = answered.reduce((s, v) => s + v, 0);
  const canScore = answeredCount >= 27;
  const dashScore = canScore ? Math.round(((sum / answeredCount) - 1) * 25 * 10) / 10 : null;
  return (
    <div className="space-y-4">
      {content.items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <ButtonGroup options={content.options} value={scores[item.id]} onChange={(v) => setScores((s) => ({ ...s, [item.id]: v }))} />
        </div>
      ))}
      {canScore ? (
        <ResultBox saveKey="dash" score={dashScore as number} max={100} interpretation={content.text.scoredTemplate.replace('{answered}', String(answeredCount))} />
      ) : (
        <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] p-5 text-center">
          <p className="text-sm text-ink/60 dark:text-white/60">{content.text.notEnoughTemplate.replace('{answered}', String(answeredCount))}</p>
        </div>
      )}
    </div>
  );
}

function WMFTScale({ content, ui }: { content: FunctionalScalesData['wmft']; ui: FnUi }) {
  const { lang } = useLanguage();
  const [fas, setFas] = useState<Record<string, number>>({});
  const [times, setTimes] = useState<Record<string, number>>({});
  const fasValues = Object.values(fas);
  const timeValues = Object.values(times);
  const avgFas = fasValues.length > 0 ? Math.round((fasValues.reduce((s, v) => s + v, 0) / fasValues.length) * 100) / 100 : null;
  const avgTime = timeValues.length > 0 ? Math.round((timeValues.reduce((s, v) => s + v, 0) / timeValues.length) * 100) / 100 : null;
  return (
    <div className="space-y-4">
      {content.items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="number"
              step="0.1"
              max={120}
              value={times[item.id] ?? ''}
              onChange={(e) => setTimes((t) => ({ ...t, [item.id]: e.target.value ? Math.min(120, parseFloat(e.target.value)) : 0 }))}
              placeholder="0.0"
              className="w-24 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-sm outline-none focus:border-[#6366F1]"
            />
            <span className="text-xs text-ink/50 dark:text-white/50">{ui.clinicalToolkit.functional.secondsMax120Unit}</span>
          </div>
          <ButtonGroup options={content.options} value={fas[item.id]} onChange={(v) => setFas((f) => ({ ...f, [item.id]: v }))} />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/60 dark:bg-white/[0.04] p-4 text-center">
          <p className="text-xs text-ink/50 dark:text-white/50 mb-1">{content.text.fasAverageLabel}</p>
          <p className="text-2xl font-bold">{avgFas !== null ? avgFas : '-'} / 5</p>
          <p className="text-[10px] text-ink/40 dark:text-white/40">{content.text.countSuffixTemplate.replace('{count}', String(fasValues.length))}</p>
        </div>
        <div className="rounded-xl bg-white/60 dark:bg-white/[0.04] p-4 text-center">
          <p className="text-xs text-ink/50 dark:text-white/50 mb-1">{content.text.timeAverageLabel}</p>
          <p className="text-2xl font-bold">{avgTime !== null ? avgTime : '-'} s</p>
          <p className="text-[10px] text-ink/40 dark:text-white/40">{content.text.countSuffixTemplate.replace('{count}', String(timeValues.length))}</p>
        </div>
      </div>
      <div className="flex justify-center">
        <ClinicalActionBar
          contentType="clinical_test"
          contentId="wmft"
          label={SCALE_NAMES_BY_LANG[lang].wmft}
          section={ui.clinicalToolkit.tabLabels.functional}
          payload={{ result: `${content.text.fasAverageLabel} ${avgFas ?? '-'}/5, ${content.text.timeAverageLabel} ${avgTime ?? '-'}s` }}
        />
      </div>
    </div>
  );
}

function BoxBlockScale({ content }: { content: FunctionalScalesData['boxblock'] }) {
  const [dominant, setDominant] = useState<number | null>(null);
  const [nonDominant, setNonDominant] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">{content.text.dominantLabel}</p>
        <input
          type="number"
          value={dominant ?? ''}
          onChange={(e) => setDominant(e.target.value ? parseInt(e.target.value) : null)}
          placeholder="0"
          className="w-28 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-sm outline-none focus:border-[#6366F1]"
        />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">{content.text.nonDominantLabel}</p>
        <input
          type="number"
          value={nonDominant ?? ''}
          onChange={(e) => setNonDominant(e.target.value ? parseInt(e.target.value) : null)}
          placeholder="0"
          className="w-28 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-sm outline-none focus:border-[#6366F1]"
        />
      </div>
      {(dominant !== null || nonDominant !== null) && (
        <ResultBox saveKey="boxblock"
          score={dominant ?? 0}
          interpretation={content.text.resultTemplate.replace('{dominant}', String(dominant ?? '-')).replace('{nonDominant}', String(nonDominant ?? '-'))}
        />
      )}
    </div>
  );
}

function JebsenScale({ content, ui }: { content: FunctionalScalesData['jebsen']; ui: FnUi }) {
  const [times, setTimes] = useState<Record<string, number>>({});
  const values = Object.values(times);
  const total = values.reduce((s, v) => s + v, 0);
  return (
    <div className="space-y-4">
      {content.items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-3">{item.label}</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              step="0.1"
              max={120}
              value={times[item.id] ?? ''}
              onChange={(e) => setTimes((t) => ({ ...t, [item.id]: e.target.value ? Math.min(120, parseFloat(e.target.value)) : 0 }))}
              placeholder="0.0"
              className="w-24 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-sm outline-none focus:border-[#6366F1]"
            />
            <span className="text-xs text-ink/50 dark:text-white/50">{ui.clinicalToolkit.functional.secondsMax120Unit}</span>
          </div>
        </div>
      ))}
      <ResultBox saveKey="jebsen" score={Math.round(total * 10) / 10} interpretation={content.text.resultTemplate.replace('{count}', String(values.length))} />
    </div>
  );
}

function TrunkControlScale({ content }: { content: FunctionalScalesData['tct'] }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const total = content.items.reduce((s, i) => s + (scores[i.id] ?? 0), 0);
  const answeredCount = Object.keys(scores).length;
  return (
    <div className="space-y-4">
      {content.items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <ButtonGroup options={content.options} value={scores[item.id]} onChange={(v) => setScores((s) => ({ ...s, [item.id]: v }))} />
        </div>
      ))}
      <ResultBox saveKey="tct" score={total} max={100} interpretation={content.text.resultTemplate.replace('{count}', String(answeredCount))} />
    </div>
  );
}

function EDSSScale({ content }: { content: FunctionalScalesData['edss'] }) {
  const [fsScores, setFsScores] = useState<Record<string, number>>({});
  const [edssStep, setEdssStep] = useState<number | undefined>(undefined);
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.fsHeading}</h3>
        <div className="space-y-3">
          {content.fsSystems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
              <p className="text-sm font-semibold mb-2">{item.label}</p>
              <ButtonGroup options={content.options} value={fsScores[item.id]} onChange={(v) => setFsScores((s) => ({ ...s, [item.id]: v }))} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.stepHeading}</h3>
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <div className="space-y-2">
            {content.steps.map((step) => (
              <button
                key={step.v}
                onClick={() => setEdssStep(step.v)}
                className={`w-full text-left rounded-xl p-3 text-sm transition-all ${edssStep === step.v ? 'bg-gradient-to-r from-[#6366F1]/15 to-[#8B5CF6]/15 border border-[#6366F1]/40' : 'bg-black/[0.02] dark:bg-white/[0.02] border border-transparent'}`}
              >
                {step.l}
              </button>
            ))}
          </div>
        </div>
      </div>
      {edssStep !== undefined && (
        <ResultBox saveKey="edss" score={edssStep} max={10} interpretation={content.steps.find((s) => s.v === edssStep)?.l ?? ''} />
      )}
    </div>
  );
}

function HoehnYahrScale({ content }: { content: FunctionalScalesData['hy'] }) {
  const [stage, setStage] = useState<number | undefined>(undefined);
  const selected = content.stages.find((s) => s.v === stage);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">{content.text.label}</p>
        <div className="space-y-2">
          {content.stages.map((s) => (
            <button
              key={s.v}
              onClick={() => setStage(s.v)}
              className={`w-full text-left rounded-xl p-3 transition-all ${stage === s.v ? 'bg-gradient-to-r from-[#6366F1]/15 to-[#8B5CF6]/15 border border-[#6366F1]/40' : 'bg-black/[0.02] dark:bg-white/[0.02] border border-transparent'}`}
            >
              <span className="text-sm font-bold mr-2">{s.l}</span>
              <span className="text-sm text-ink/60 dark:text-white/60">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>
      {selected && <ResultBox saveKey="hy" score={selected.v} max={5} interpretation={`${selected.l} - ${selected.desc}`} />}
    </div>
  );
}

function FSSScale({ content }: { content: FunctionalScalesData['fss'] }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const values = Object.values(scores);
  const average = values.length > 0 ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100 : null;
  return (
    <div className="space-y-4">
      {content.items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{item.label}</p>
          <ButtonGroup options={content.options} value={scores[item.id]} onChange={(v) => setScores((s) => ({ ...s, [item.id]: v }))} />
        </div>
      ))}
      {average !== null && (
        <ResultBox saveKey="fss" score={average} max={7} interpretation={content.text.resultTemplate.replace('{count}', String(values.length))} />
      )}
    </div>
  );
}

function HarrisHipScale({ content }: { content: FunctionalScalesData['hhs'] }) {
  const [pain, setPain] = useState<number | undefined>(undefined);
  const [limp, setLimp] = useState<number | undefined>(undefined);
  const [support, setSupport] = useState<number | undefined>(undefined);
  const [distance, setDistance] = useState<number | undefined>(undefined);
  const [sitting, setSitting] = useState<number | undefined>(undefined);
  const [transport, setTransport] = useState<number | undefined>(undefined);
  const [stairs, setStairs] = useState<number | undefined>(undefined);
  const [shoes, setShoes] = useState<number | undefined>(undefined);
  const [deformity, setDeformity] = useState<number | undefined>(undefined);
  const [rom, setRom] = useState<number | undefined>(undefined);

  const functionTotal = (limp ?? 0) + (support ?? 0) + (distance ?? 0) + (sitting ?? 0) + (transport ?? 0) + (stairs ?? 0) + (shoes ?? 0);
  const total = (pain ?? 0) + functionTotal + (deformity ?? 0) + (rom ?? 0);
  const allAnswered = [pain, limp, support, distance, sitting, transport, stairs, shoes, deformity, rom].every((v) => v !== undefined);
  const grade = total >= 90 ? content.text.excellent : total >= 80 ? content.text.good : total >= 70 ? content.text.fair : content.text.poor;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.painHeading}</h3>
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <ButtonGroup options={content.options.pain} value={pain} onChange={setPain} />
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.functionHeading}</h3>
        <div className="space-y-3">
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
            <p className="text-sm font-semibold mb-2">{content.text.limpLabel}</p>
            <ButtonGroup options={content.options.limp} value={limp} onChange={setLimp} />
          </div>
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
            <p className="text-sm font-semibold mb-2">{content.text.supportLabel}</p>
            <ButtonGroup options={content.options.support} value={support} onChange={setSupport} />
          </div>
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
            <p className="text-sm font-semibold mb-2">{content.text.distanceLabel}</p>
            <ButtonGroup options={content.options.distance} value={distance} onChange={setDistance} />
          </div>
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
            <p className="text-sm font-semibold mb-2">{content.text.sittingLabel}</p>
            <ButtonGroup options={content.options.sitting} value={sitting} onChange={setSitting} />
          </div>
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
            <p className="text-sm font-semibold mb-2">{content.text.transportLabel}</p>
            <ButtonGroup options={content.options.transport} value={transport} onChange={setTransport} />
          </div>
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
            <p className="text-sm font-semibold mb-2">{content.text.stairsLabel}</p>
            <ButtonGroup options={content.options.stairs} value={stairs} onChange={setStairs} />
          </div>
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
            <p className="text-sm font-semibold mb-2">{content.text.shoesLabel}</p>
            <ButtonGroup options={content.options.shoes} value={shoes} onChange={setShoes} />
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.deformityHeading}</h3>
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <ButtonGroup options={content.options.deformity} value={deformity} onChange={setDeformity} />
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.romHeading}</h3>
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <ButtonGroup options={content.options.rom} value={rom} onChange={setRom} />
        </div>
      </div>
      {allAnswered && <ResultBox saveKey="hhs" score={total} max={100} interpretation={content.text.resultTemplate.replace('{grade}', grade)} />}
    </div>
  );
}

function UCLAShoulderScale({ content }: { content: FunctionalScalesData['ucla'] }) {
  const [pain, setPain] = useState<number | undefined>(undefined);
  const [func, setFunc] = useState<number | undefined>(undefined);
  const [flexion, setFlexion] = useState<number | undefined>(undefined);
  const [strength, setStrength] = useState<number | undefined>(undefined);
  const [satisfaction, setSatisfaction] = useState<number | undefined>(undefined);
  const allAnswered = [pain, func, flexion, strength, satisfaction].every((v) => v !== undefined);
  const total = (pain ?? 0) + (func ?? 0) + (flexion ?? 0) + (strength ?? 0) + (satisfaction ?? 0);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{content.text.painLabel}</p>
        <ButtonGroup options={content.options.pain} value={pain} onChange={setPain} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{content.text.functionLabel}</p>
        <ButtonGroup options={content.options.function} value={func} onChange={setFunc} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{content.text.flexionLabel}</p>
        <ButtonGroup options={content.options.flexion} value={flexion} onChange={setFlexion} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{content.text.strengthLabel}</p>
        <ButtonGroup options={content.options.strength} value={strength} onChange={setStrength} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{content.text.satisfactionLabel}</p>
        <ButtonGroup options={content.options.satisfaction} value={satisfaction} onChange={setSatisfaction} />
      </div>
      {allAnswered && <ResultBox saveKey="ucla" score={total} max={35} interpretation={total >= 34 ? content.text.excellent : total >= 29 ? content.text.good : content.text.poor} />}
    </div>
  );
}

function DRSScale({ content }: { content: FunctionalScalesData['drs'] }) {
  const [eye, setEye] = useState<number | undefined>(undefined);
  const [comm, setComm] = useState<number | undefined>(undefined);
  const [motor, setMotor] = useState<number | undefined>(undefined);
  const [feeding, setFeeding] = useState<number | undefined>(undefined);
  const [toileting, setToileting] = useState<number | undefined>(undefined);
  const [grooming, setGrooming] = useState<number | undefined>(undefined);
  const [level, setLevel] = useState<number | undefined>(undefined);
  const [employ, setEmploy] = useState<number | undefined>(undefined);
  const allAnswered = [eye, comm, motor, feeding, toileting, grooming, level, employ].every((v) => v !== undefined);
  const total = (eye ?? 0) + (comm ?? 0) + (motor ?? 0) + (feeding ?? 0) + (toileting ?? 0) + (grooming ?? 0) + (level ?? 0) + (employ ?? 0);
  const interpretation =
    total <= 3 ? content.text.minPartial :
    total <= 14 ? content.text.moderateSevere :
    total <= 21 ? content.text.severeExtreme :
    total <= 28 ? content.text.vegetative : content.text.extremeVegetative;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.vigilanceHeading}</h3>
        <div className="space-y-3">
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
            <p className="text-sm font-semibold mb-2">{content.text.eyeLabel}</p>
            <ButtonGroup options={content.options.eye} value={eye} onChange={setEye} />
          </div>
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
            <p className="text-sm font-semibold mb-2">{content.text.commLabel}</p>
            <ButtonGroup options={content.options.comm} value={comm} onChange={setComm} />
          </div>
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
            <p className="text-sm font-semibold mb-2">{content.text.motorLabel}</p>
            <ButtonGroup options={content.options.motor} value={motor} onChange={setMotor} />
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.selfcareHeading}</h3>
        <div className="space-y-3">
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
            <p className="text-sm font-semibold mb-2">{content.text.feedingLabel}</p>
            <ButtonGroup options={content.options.selfcare} value={feeding} onChange={setFeeding} />
          </div>
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
            <p className="text-sm font-semibold mb-2">{content.text.toiletingLabel}</p>
            <ButtonGroup options={content.options.selfcare} value={toileting} onChange={setToileting} />
          </div>
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
            <p className="text-sm font-semibold mb-2">{content.text.groomingLabel}</p>
            <ButtonGroup options={content.options.selfcare} value={grooming} onChange={setGrooming} />
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.dependenceHeading}</h3>
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{content.text.levelLabel}</p>
          <ButtonGroup options={content.options.level} value={level} onChange={setLevel} />
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{content.text.psychosocialHeading}</h3>
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
          <p className="text-sm font-semibold mb-2">{content.text.employLabel}</p>
          <ButtonGroup options={content.options.employ} value={employ} onChange={setEmploy} />
        </div>
      </div>
      {allAnswered && <ResultBox saveKey="drs" score={total} max={29} interpretation={interpretation} />}
    </div>
  );
}


type Category = 'functional' | 'orthopedic' | 'pelvic-floor' | 'neuro' | 'manual-therapy' | 'metabolic';type BodyRegion = 'knee' | 'shoulder' | 'hip' | 'spine' | 'ankle' | 'elbow-wrist' | 'cervical';

// Orthopedic test content (KNEE_TESTS, SHOULDER_TESTS, etc.) now lives in
// lib/orthopedicTestsContent.ts and is served translated via
// /api/clinical-tools/orthopedic-tests, so it's no longer hardcoded here.

interface PelvicFloorTest {
  slug: string;
  name: string;
  category: string;
  procedure: string;
  interpretation: string;
}

interface NeuroTest {
  slug: string;
  name: string;
  category: string;
  procedure: string;
  interpretation: string;
}

interface MTTechnique {
  id: string;
  name: string;
  joint_region: string;
  technique_type: string;
  grade: string;
  patient_position: string;
  direction: string;
  indications: string;
  contraindications: string;
  procedure: string;
}

interface MTConcept {
  id: string;
  name: string;
  framework: string;
  category: string;
  summary: string;
  content: string;
}

const MT_REGION_ORDER = ['ATM', 'Colonna Cervicale', 'Colonna Toracica', 'Colonna Lombare e Pelvi', 'Spalla', 'Gomito', 'Polso e Mano', 'Anca', 'Ginocchio', 'Caviglia', 'Piede'];

const MT_TYPE_ORDER = ['all', 'mobilization', 'manipulation', 'thrust', 'nonthrust', 'mwm', 'prp'];
const MT_TYPE_LABELS: Record<string, string> = {
  all: 'Tutte',
  mobilization: 'Mobilizzazione',
  manipulation: 'Manipolazione',
  thrust: 'Thrust',
  nonthrust: 'Non-thrust',
  mwm: 'MWM (Mulligan)',
  prp: 'PRP (Mulligan)',
};
// Pelvic Floor category display labels now come from
// ui.clinicalToolkit.pelvicFloor.categoryLabels (translated); the DB
// `category` column values themselves are used unchanged as dictionary keys.

// Neurology category display labels now come from
// ui.clinicalToolkit.neuro.categoryLabels (translated); the DB `category`
// column values themselves are used unchanged as dictionary keys.

const NEURO_CATEGORY_ORDER = ['cranial_nerves', 'reflexes', 'sensation', 'strength', 'coordination', 'balance_gait'];

// SF-36 / PFDI-20 / ICIQ-UI Short Form content (item text, section titles,
// option labels) now lives in lib/pelvicFloorQuestionnaires.ts and is served
// translated via /api/clinical-tools/pelvic-floor-questionnaires. Scoring
// logic (recode tables, thresholds) stays here, language-independent; only
// display text is a prop now instead of a module-level constant.

interface PFQuestionnaireData {
  sf36Items: SF36ItemContent[];
  sf36Sections: SF36SectionContent[];
  pfdiPopdi: PFDIItemContent[];
  pfdiCradi: PFDIItemContent[];
  pfdiUdi: PFDIItemContent[];
  iciqQuestions: Record<'frequency' | 'amount' | 'impact' | 'circumstancesLabel', { slug: string; text: string }>;
  iciqCircumstances: ICIQCircumstanceContent[];
  optionSets: Record<string, QOption[]>;
}

function SF36Scale({ data, ui }: { data: PFQuestionnaireData; ui: ReturnType<typeof useUiStrings> }) {
  const { lang } = useLanguage();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const domainOrder: SF36Domain[] = ['PF', 'RP', 'RE', 'VT', 'MH', 'SF', 'BP', 'GH'];
  const domainScores = domainOrder.map((d) => {
    const items = data.sf36Items.filter((it) => it.domain === d);
    const values = items
      .map((it) => (answers[it.id] ? it.recode[answers[it.id] - 1] : null))
      .filter((v): v is number => v !== null);
    const avg = values.length > 0 ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : null;
    return { domain: d, score: avg, answered: values.length, total: items.length };
  });
  const answeredCount = Object.keys(answers).length;
  const domainLabels = ui.clinicalToolkit.pelvicFloor.sf36.domainLabels;
  const scoreHeader = ui.clinicalToolkit.pelvicFloor.sf36.scoreHeader
    .replace('{answered}', String(answeredCount))
    .replace('{total}', String(data.sf36Items.length));

  return (
    <div className="space-y-6">
      {data.sf36Sections.map((sec) => (
        <div key={sec.slug}>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{sec.title}</h4>
          <div className="space-y-3">
            {sec.ids.map((id) => {
              const item = data.sf36Items.find((it) => it.id === id)!;
              const options = data.optionSets[item.optionSet] ?? [];
              return (
                <div key={id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold mb-2">{id}. {item.text}</p>
                  <ButtonGroup options={options} value={answers[id]} onChange={(v) => setAnswers((s) => ({ ...s, [id]: v }))} />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="rounded-2xl bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10 border border-[#6366F1]/20 p-5">
        <p className="text-sm font-semibold mb-3">{scoreHeader}</p>
        <div className="grid grid-cols-2 gap-3">
          {domainScores.map((d) => (
            <div key={d.domain} className="rounded-xl bg-white/60 dark:bg-white/[0.04] p-3">
              <p className="text-xs text-ink/50 dark:text-white/50">{domainLabels[d.domain]}</p>
              <p className="text-xl font-bold">{d.score !== null ? d.score : '—'}</p>
              <p className="text-[10px] text-ink/40 dark:text-white/40">{d.answered}/{d.total} {ui.clinicalToolkit.pelvicFloor.sf36.responsesLabel}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center">
          <ClinicalActionBar
            contentType="clinical_test"
            contentId="sf36"
            label={SCALE_NAMES_BY_LANG[lang].sf36}
            section={ui.clinicalToolkit.tabLabels.functional}
            payload={{ result: domainScores.map((d) => `${domainLabels[d.domain]}: ${d.score ?? '—'}`).join(', ') }}
          />
        </div>
      </div>
    </div>
  );
}

function PFDI20Scale({ data, ui }: { data: PFQuestionnaireData; ui: ReturnType<typeof useUiStrings> }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const labels = ui.clinicalToolkit.pelvicFloor.pfdi.subscaleLabels;
  const subscales = [
    { key: 'POPDI' as const, label: labels.POPDI, items: data.pfdiPopdi },
    { key: 'CRADI' as const, label: labels.CRADI, items: data.pfdiCradi },
    { key: 'UDI' as const, label: labels.UDI, items: data.pfdiUdi },
  ];
  const subscaleScores = subscales.map((s) => {
    const values = s.items.map((it) => answers[it.id]).filter((v): v is number => v !== undefined);
    const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length) * 25 : null;
    return { ...s, score: avg !== null ? Math.round(avg * 10) / 10 : null, answered: values.length };
  });
  const totalScore = subscaleScores.reduce((sum, s) => sum + (s.score ?? 0), 0);
  const answeredCount = Object.keys(answers).length;
  const options = data.optionSets.pfdi ?? [];
  const scoreHeader = ui.clinicalToolkit.pelvicFloor.pfdi.scoreHeader
    .replace('{answered}', String(answeredCount))
    .replace('{total}', '20');
  const severity = ui.clinicalToolkit.pelvicFloor.pfdi.severityLabels;
  const interpretation = totalScore <= 50 ? severity.minimal : totalScore <= 150 ? severity.moderate : severity.severe;

  return (
    <div className="space-y-6">
      {subscales.map((s) => (
        <div key={s.key}>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">{s.label}</h4>
          <div className="space-y-3">
            {s.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
                <p className="text-sm font-semibold mb-2">{item.text}</p>
                <ButtonGroup options={options} value={answers[item.id]} onChange={(v) => setAnswers((a) => ({ ...a, [item.id]: v }))} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-2xl bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10 border border-[#6366F1]/20 p-5">
        <p className="text-sm font-semibold mb-3">{scoreHeader}</p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {subscaleScores.map((s) => (
            <div key={s.key} className="rounded-xl bg-white/60 dark:bg-white/[0.04] p-3">
              <p className="text-xs text-ink/50 dark:text-white/50">{s.label}</p>
              <p className="text-xl font-bold">{s.score !== null ? s.score : '—'}</p>
              <p className="text-[10px] text-ink/40 dark:text-white/40">{s.answered}/{s.items.length} {ui.clinicalToolkit.pelvicFloor.pfdi.responsesLabel}</p>
            </div>
          ))}
        </div>
        <ResultBox saveKey="pfdi20" saveContentType="questionnaire" saveSection={ui.clinicalToolkit.tabLabels.pelvicFloor} score={Math.round(totalScore * 10) / 10} max={300} interpretation={interpretation} />
      </div>
    </div>
  );
}

function ICIQScale({ data, ui }: { data: PFQuestionnaireData; ui: ReturnType<typeof useUiStrings> }) {
  const [freq, setFreq] = useState<number | undefined>(undefined);
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [impact, setImpact] = useState<number | undefined>(undefined);
  const [circumstances, setCircumstances] = useState<string[]>([]);

  const toggleCircumstance = (c: string) => {
    setCircumstances((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const total = (freq ?? 0) + (amount ?? 0) + (impact ?? 0);
  const answered = freq !== undefined && amount !== undefined && impact !== undefined;
  const severity = ui.clinicalToolkit.pelvicFloor.iciq.severityLabels;
  const severityLabel = total <= 5 ? severity.mild : total <= 12 ? severity.moderate : total <= 18 ? severity.severe : severity.verySevere;
  const freqOptions = data.optionSets.iciqFreq ?? [];
  const amountOptions = data.optionSets.iciqAmount ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{data.iciqQuestions.frequency.text}</p>
        <ButtonGroup options={freqOptions} value={freq} onChange={setFreq} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{data.iciqQuestions.amount.text}</p>
        <ButtonGroup options={amountOptions} value={amount} onChange={setAmount} />
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-3">{data.iciqQuestions.impact.text}</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, v) => (
            <button key={v} onClick={() => setImpact(v)} className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${impact === v ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white' : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-semibold mb-2">{data.iciqQuestions.circumstancesLabel.text}</p>
        <div className="flex flex-wrap gap-2">
          {data.iciqCircumstances.map((c) => (
            <button key={c.slug} onClick={() => toggleCircumstance(c.slug)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${circumstances.includes(c.slug) ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white' : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'}`}>
              {c.text}
            </button>
          ))}
        </div>
      </div>
      {answered && <ResultBox saveKey="iciq" saveContentType="questionnaire" saveSection={ui.clinicalToolkit.tabLabels.pelvicFloor} score={total} max={21} interpretation={`${ui.clinicalToolkit.pelvicFloor.iciq.severityPrefix}: ${severityLabel}`} />}
    </div>
  );
}

function getQuestionnaireMatch(name: string): 'sf36' | 'pfdi20' | 'iciq' | null {
  const n = name.toUpperCase();
  if (n.includes('SF-36') || n.includes('SF36')) return 'sf36';
  if (n.includes('PFDI')) return 'pfdi20';
  if (n.includes('ICIQ')) return 'iciq';
  return null;
}

const PELVIC_FLOOR_CATEGORY_ORDER = ['questionnaire', 'symptom_questionnaire', 'neuropathy', 'manual_assessment', 'urodynamic'];
const PELVIC_FLOOR_CATEGORY_ICON: Record<string, typeof Activity> = {
  questionnaire: ClipboardList,
  symptom_questionnaire: ClipboardCheck,
  neuropathy: Zap,
  manual_assessment: Hand,
  urodynamic: Droplets,
};

const REGIONS: { key: BodyRegion }[] = [
  { key: 'knee' },
  { key: 'shoulder' },
  { key: 'hip' },
  { key: 'spine' },
  { key: 'ankle' },
  { key: 'elbow-wrist' },
  { key: 'cervical' },
];

const TAB_PARAM_TO_CATEGORY: Record<string, Category> = {
  functional: 'functional',
  orthopedic: 'orthopedic',
  'pelvic-floor': 'pelvic-floor',
  neuro: 'neuro',
  'manual-therapy': 'manual-therapy',
  metabolic: 'metabolic',
};

export default function ClinicalToolsPage() {
  return (
    <Suspense fallback={null}>
      <ClinicalToolsPageInner />
    </Suspense>
  );
}

function ClinicalToolsPageInner() {
  const { lang } = useLanguage();
  const ui = useUiStrings();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [category, setCategory] = useState<Category>(
    (initialTab && TAB_PARAM_TO_CATEGORY[initialTab]) || 'functional'
  );
  const [activeScale, setActiveScale] = useState<ScaleKey>('katz');
  const [activeRegion, setActiveRegion] = useState<BodyRegion>('knee');
  const [orthoTests, setOrthoTests] = useState<Record<BodyRegion, OrthoTestContent[]> | null>(null);
  const [orthoLoading, setOrthoLoading] = useState(false);
  const [orthoError, setOrthoError] = useState<string | null>(null);
  const [pelvicFloorTests, setPelvicFloorTests] = useState<PelvicFloorTest[] | null>(null);
  const [pelvicFloorLoading, setPelvicFloorLoading] = useState(false);
  const [pelvicFloorError, setPelvicFloorError] = useState<string | null>(null);
  const [openQuestionnaire, setOpenQuestionnaire] = useState<string | null>(null);
  const [pfQuestionnaireData, setPfQuestionnaireData] = useState<PFQuestionnaireData | null>(null);
  const [pfQuestionnaireLoading, setPfQuestionnaireLoading] = useState(false);
  const [functionalScalesData, setFunctionalScalesData] = useState<FunctionalScalesData | null>(null);
  const [functionalScalesLoading, setFunctionalScalesLoading] = useState(false);
    const [neuroTests, setNeuroTests] = useState<NeuroTest[] | null>(null);
  const [neuroLoading, setNeuroLoading] = useState(false);
  const [neuroError, setNeuroError] = useState<string | null>(null);
    const [mtTechniques, setMtTechniques] = useState<MTTechnique[] | null>(null);
  const [mtLoading, setMtLoading] = useState(false);
  const [mtError, setMtError] = useState<string | null>(null);
  const [activeMTRegion, setActiveMTRegion] = useState<string>('ATM');
    const [mtConcepts, setMtConcepts] = useState<MTConcept[] | null>(null);
  const [openConcept, setOpenConcept] = useState<string | null>(null);
  const [activeMTType, setActiveMTType] = useState<string>('all');
  const [mtSearchQuery, setMtSearchQuery] = useState('');
  useEffect(() => {
    setMtSearchQuery('');
  }, [category]);
  useEffect(() => {
    if (category !== 'pelvic-floor' || pelvicFloorTests !== null || pelvicFloorLoading) return;
    setPelvicFloorLoading(true);
    fetch(`/api/pelvic-floor/tests?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        setPelvicFloorTests(Array.isArray(data) ? data : data.tests ?? []);
        setPelvicFloorLoading(false);
      })
      .catch(() => {
        setPelvicFloorError(ui.clinicalToolkit.pelvicFloor.errorLoadingTests);
        setPelvicFloorLoading(false);
      });
  }, [category, pelvicFloorTests, pelvicFloorLoading, lang, ui]);

  useEffect(() => {
    // SF-36 is shared between the Functional Scales tab (activeScale ===
    // 'sf36') and the Pelvic Floor tab's questionnaire library, so this
    // fetch is needed from either entry point.
    const pfQuestionnairesNeeded = category === 'pelvic-floor' || (category === 'functional' && activeScale === 'sf36');
    if (!pfQuestionnairesNeeded || pfQuestionnaireData !== null || pfQuestionnaireLoading) return;
    setPfQuestionnaireLoading(true);
    fetch(`/api/clinical-tools/pelvic-floor-questionnaires?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        setPfQuestionnaireData(data);
        setPfQuestionnaireLoading(false);
      })
      .catch(() => {
        setPfQuestionnaireLoading(false);
      });
  }, [category, activeScale, pfQuestionnaireData, pfQuestionnaireLoading, lang]);

  useEffect(() => {
    if (category !== 'functional' || functionalScalesData !== null || functionalScalesLoading) return;
    setFunctionalScalesLoading(true);
    fetch(`/api/clinical-tools/functional-scales?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        setFunctionalScalesData(data);
        setFunctionalScalesLoading(false);
      })
      .catch(() => {
        setFunctionalScalesLoading(false);
      });
  }, [category, functionalScalesData, functionalScalesLoading, lang]);

    useEffect(() => {
    if (category !== 'neuro' || neuroTests !== null || neuroLoading) return;
    setNeuroLoading(true);
    fetch(`/api/neuro/tests?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        setNeuroTests(Array.isArray(data) ? data : data.tests ?? []);
        setNeuroLoading(false);
      })
      .catch(() => {
        setNeuroError(ui.clinicalToolkit.neuro.errorLoadingTests);
        setNeuroLoading(false);
      });
  }, [category, neuroTests, neuroLoading, lang, ui]);

  useEffect(() => {
    setMtTechniques(null);
    setMtConcepts(null);
    setOrthoTests(null);
    setPelvicFloorTests(null);
    setPfQuestionnaireData(null);
    setFunctionalScalesData(null);
    setNeuroTests(null);
  }, [lang]);

  useEffect(() => {
    if (category !== 'orthopedic' || orthoTests !== null || orthoLoading) return;
    setOrthoLoading(true);
    fetch(`/api/clinical-tools/orthopedic-tests?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        setOrthoTests(data);
        setOrthoLoading(false);
      })
      .catch(() => {
        setOrthoError(ui.clinicalToolkit.orthopedic.errorLoadingTests);
        setOrthoLoading(false);
      });
  }, [category, orthoTests, orthoLoading, lang, ui]);

   useEffect(() => {
    if (category !== 'manual-therapy' || mtTechniques !== null || mtLoading) return;
    setMtLoading(true);
    fetch(`/api/manual-therapy/techniques?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        setMtTechniques(Array.isArray(data) ? data : data.techniques ?? []);
        setMtLoading(false);
      })
      .catch(() => {
        setMtError(ui.clinicalToolkit.manualTherapy.errorLoadingTechniques);
        setMtLoading(false);
      });
  }, [category, mtTechniques, mtLoading, lang, ui]);

  useEffect(() => {
    if (category !== 'manual-therapy' || mtConcepts !== null) return;
    fetch(`/api/manual-therapy/concepts?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        setMtConcepts(Array.isArray(data) ? data : data.concepts ?? []);
      })
      .catch(() => {
        setMtConcepts([]);
      });
  }, [category, mtConcepts, lang]);

  const pelvicFloorGrouped = (pelvicFloorTests ?? []).reduce<Record<string, PelvicFloorTest[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  const pelvicFloorGroupedSorted = Object.entries(pelvicFloorGrouped).sort(
    ([a], [b]) => PELVIC_FLOOR_CATEGORY_ORDER.indexOf(a) - PELVIC_FLOOR_CATEGORY_ORDER.indexOf(b)
  );

  const neuroGrouped = (neuroTests ?? []).reduce<Record<string, NeuroTest[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  const neuroGroupedSorted = Object.entries(neuroGrouped).sort(
    ([a], [b]) => NEURO_CATEGORY_ORDER.indexOf(a) - NEURO_CATEGORY_ORDER.indexOf(b)
  );

    const normalizedMtSearch = mtSearchQuery.trim().toLowerCase();
  const matchesTechnique = (t: MTTechnique) =>
    !normalizedMtSearch ||
    t.name.toLowerCase().includes(normalizedMtSearch) ||
    t.technique_type.toLowerCase().includes(normalizedMtSearch) ||
    (t.grade ?? '').toLowerCase().includes(normalizedMtSearch) ||
    (t.patient_position ?? '').toLowerCase().includes(normalizedMtSearch) ||
    (t.direction ?? '').toLowerCase().includes(normalizedMtSearch) ||
    (t.indications ?? '').toLowerCase().includes(normalizedMtSearch) ||
    (t.contraindications ?? '').toLowerCase().includes(normalizedMtSearch) ||
    (t.procedure ?? '').toLowerCase().includes(normalizedMtSearch);
    const mtFilteredByRegion = (mtTechniques ?? []).filter((t) => t.joint_region === activeMTRegion && (activeMTType === 'all' || t.technique_type === activeMTType) && matchesTechnique(t));
  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />
      <div className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]" style={{ background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)' }} />
      <div className="relative max-w-3xl mx-auto px-6 pt-40 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#6366F1]/20 dark:border-[#6366F1]/25 bg-gradient-to-r from-[#6366F1]/[0.07] to-[#8B5CF6]/[0.07] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-5 shadow-sm shadow-[#6366F1]/10">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B5CF6] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#8B5CF6]" />
            </span>
            <ClipboardList size={14} className="text-[#6366F1] dark:text-[#A5B4FC]" />
            <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">{ui.clinicalToolkit.badge}</span>
          </div>
          <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tight">
            <span className="relative inline-block bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent drop-shadow-[0_2px_24px_rgba(79,124,255,0.25)]">
              {ui.clinicalToolkit.headingAccent}{' '}{ui.clinicalToolkit.headingRest}
            </span>
          </h1>
          <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[#6366F1]/50 to-transparent" />
          <p className="mt-5 text-base md:text-lg text-ink/60 dark:text-white/60 max-w-xl mx-auto leading-relaxed">
            {ui.clinicalToolkit.subtitle}
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl p-1.5">
            {(['functional', 'orthopedic', 'pelvic-floor', 'neuro', 'manual-therapy', 'metabolic'] as Category[]).map((c) => {
              const TabIcon = CATEGORY_TAB_ICON[c];
              const tabLabel =
                c === 'functional' ? ui.clinicalToolkit.tabLabels.functional
                : c === 'orthopedic' ? ui.clinicalToolkit.tabLabels.orthopedic
                : c === 'pelvic-floor' ? ui.clinicalToolkit.tabLabels.pelvicFloor
                : c === 'neuro' ? ui.clinicalToolkit.tabLabels.neuro
                : c === 'manual-therapy' ? ui.clinicalToolkit.tabLabels.manualTherapy
                : ui.clinicalToolkit.tabLabels.metabolic;
              return (
                <button key={c} onClick={() => setCategory(c)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${category === c ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-[#6366F1]/25' : 'text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`}>
                  <TabIcon size={14} className={category === c ? 'opacity-90' : 'opacity-50'} />
                  {tabLabel}
                </button>
              );
            })}
          </div>
        </div>

        {category === 'functional' && (
          <>
            <div className="space-y-8 mb-10">
              {SCALE_GROUP_ORDER.map((groupKey) => {
                const GroupIcon = SCALE_GROUP_ICON[groupKey];
                return (
                  <div key={groupKey}>
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-[0.12em] text-ink/45 dark:text-white/45">
                      <GroupIcon size={14} className="text-[#6366F1]" />
                      {ui.clinicalToolkit.functional.groupLabels[groupKey]}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {SCALE_GROUPS[groupKey].map((key) => (
                        <button
                          key={key}
                          onClick={() => setActiveScale(key)}
                          className={`text-left rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                            activeScale === key
                              ? 'border-transparent bg-gradient-to-br from-[#6366F1]/10 to-[#8B5CF6]/10 shadow-lg shadow-[#6366F1]/15 ring-1 ring-[#6366F1]/40'
                              : 'border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] hover:border-[#6366F1]/30 hover:shadow-md hover:shadow-[#6366F1]/5'
                          }`}
                        >
                          <p className="text-sm font-semibold">{SCALE_NAMES_BY_LANG[lang][key]}</p>
                          <p className="text-xs text-ink/50 dark:text-white/50 mt-0.5">{functionalScalesData?.scaleSubtitles[key] ?? ''}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {!functionalScalesData ? (
              <p className="text-center text-sm text-ink/50 dark:text-white/50 py-10">{ui.clinicalToolkit.functional.loading}</p>
            ) : (
              <>
                <ScaleDescription text={functionalScalesData.scaleDescriptions[activeScale]} />

                {activeScale === 'katz' && <KatzScale content={functionalScalesData.katz} />}
                {activeScale === 'barthel' && <BarthelScale content={functionalScalesData.barthel} />}
                {activeScale === 'tinetti' && <TinettiScale content={functionalScalesData.tinetti} />}
                {activeScale === 'conley' && <ConleyScale content={functionalScalesData.conley} ui={ui} />}
                {activeScale === 'berg' && <BergBalanceScale content={functionalScalesData.berg} />}
                {activeScale === 'morse' && <MorseFallScale content={functionalScalesData.morse} />}
                {activeScale === 'ashworth' && <AshworthScale content={functionalScalesData.ashworth} />}
                {activeScale === 'nrs' && <NRSPainScale content={functionalScalesData.nrs} />}
                {activeScale === 'sppb' && <SPPBScale content={functionalScalesData.sppb} />}
                {activeScale === 'mmse' && <MMSEScale content={functionalScalesData.mmse} />}
                {activeScale === 'gcs' && <GCSScale content={functionalScalesData.gcs} />}
                {activeScale === 'tug' && <TUGScale content={functionalScalesData.tug} ui={ui} />}
                {activeScale === 'sixmwt' && <SixMWTScale content={functionalScalesData.sixmwt} ui={ui} />}
                {activeScale === 'sf36' && (
                  pfQuestionnaireData ? <SF36Scale data={pfQuestionnaireData} ui={ui} /> : <p className="text-center text-sm text-ink/50 dark:text-white/50 py-10">{ui.common.loading}</p>
                )}
                {activeScale === 'nihss' && <NIHSSScale content={functionalScalesData.nihss} />}
                {activeScale === 'updrs3' && <UPDRSPartIIIScale content={functionalScalesData.updrs3} />}
                {activeScale === 'womac' && <WOMACScale content={functionalScalesData.womac} />}
                {activeScale === 'dash' && <DASHScale content={functionalScalesData.dash} />}
                {activeScale === 'wmft' && <WMFTScale content={functionalScalesData.wmft} ui={ui} />}
                {activeScale === 'boxblock' && <BoxBlockScale content={functionalScalesData.boxblock} />}
                {activeScale === 'jebsen' && <JebsenScale content={functionalScalesData.jebsen} ui={ui} />}
                {activeScale === 'tct' && <TrunkControlScale content={functionalScalesData.tct} />}
                {activeScale === 'edss' && <EDSSScale content={functionalScalesData.edss} />}
                {activeScale === 'hy' && <HoehnYahrScale content={functionalScalesData.hy} />}
                {activeScale === 'fss' && <FSSScale content={functionalScalesData.fss} />}
                {activeScale === 'hhs' && <HarrisHipScale content={functionalScalesData.hhs} />}
                {activeScale === 'ucla' && <UCLAShoulderScale content={functionalScalesData.ucla} />}
                {activeScale === 'drs' && <DRSScale content={functionalScalesData.drs} />}
              </>
            )}
          </>
        )}

        {category === 'orthopedic' && (
          <>
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {REGIONS.map((r) => (
                <button key={r.key} onClick={() => setActiveRegion(r.key)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeRegion === r.key ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white' : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'}`}>
                  {ui.clinicalToolkit.orthopedic.regionLabels[r.key]}
                </button>
              ))}
            </div>

            {orthoLoading && (
              <p className="text-center text-sm text-ink/50 dark:text-white/50 py-10">{ui.clinicalToolkit.orthopedic.loading}</p>
            )}

            {orthoError && !orthoLoading && (
              <p className="text-center text-sm text-red-500 py-10">{orthoError}</p>
            )}

            {!orthoLoading && !orthoError && (
              <div className="space-y-4">
                {(orthoTests?.[activeRegion] ?? []).map((t) => (
                  <div key={t.slug} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
                    <p className="text-base font-semibold text-ink dark:text-white">{t.name}</p>
                    <p className="text-xs font-medium text-[#6366F1] mt-0.5 mb-3">{t.targets}</p>
                    <div className="space-y-2 text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                      <p><span className="font-semibold text-ink/50 dark:text-white/50">{ui.clinicalToolkit.orthopedic.procedureLabel}: </span>{t.procedure}</p>
                      <p><span className="font-semibold text-ink/50 dark:text-white/50">{ui.clinicalToolkit.orthopedic.positiveLabel}: </span>{t.positive}</p>
                      <p className="text-xs text-ink/50 dark:text-white/50 pt-1">{t.accuracy}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {category === 'pelvic-floor' && (
          <>
            <div className="mb-10 rounded-3xl border border-[#6366F1]/25 bg-gradient-to-br from-[#6366F1]/[0.08] to-[#8B5CF6]/[0.08] p-7 relative overflow-hidden">
              <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#8B5CF6]/10 blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6366F1]/15 text-[#6366F1] dark:text-[#A5B4FC] text-[10px] font-bold uppercase tracking-wide mb-3">
                  <Sparkles size={12} />
                  {ui.clinicalToolkit.pelvicFloor.fillableBadge}
                </div>
                <p className="text-lg font-semibold text-ink dark:text-white mb-2">
                  {ui.clinicalToolkit.pelvicFloor.questionnaireCalloutHeading}
                </p>
                <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed mb-5 max-w-xl">
                  {ui.clinicalToolkit.pelvicFloor.questionnaireCalloutDescription}
                </p>
                <a
                  href="/dashboard/pelvic-floor/questionnaire"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] shadow-lg shadow-[#6366F1]/25 hover:scale-[1.02] transition-transform"
                >
                  {ui.clinicalToolkit.pelvicFloor.startQuestionnaireLabel}
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>

            {pelvicFloorLoading && (
              <p className="text-center text-sm text-ink/50 dark:text-white/50 py-10">{ui.clinicalToolkit.pelvicFloor.loading}</p>
            )}
            {pelvicFloorError && (
              <p className="text-center text-sm text-red-500 py-10">{pelvicFloorError}</p>
            )}
            {!pelvicFloorLoading && !pelvicFloorError && (
              <div className="space-y-10">
                {pelvicFloorGroupedSorted.map(([cat, tests]) => {
                  const CatIcon = PELVIC_FLOOR_CATEGORY_ICON[cat] ?? Activity;
                  const sortedTests = tests
                    .slice()
                    .sort((a, b) => (getQuestionnaireMatch(a.name) ? 0 : 1) - (getQuestionnaireMatch(b.name) ? 0 : 1));
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6366F1]/10 text-[#6366F1] dark:text-[#A5B4FC]">
                          <CatIcon size={14} />
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-ink/60 dark:text-white/60">
                          {ui.clinicalToolkit.pelvicFloor.categoryLabels[cat as keyof typeof ui.clinicalToolkit.pelvicFloor.categoryLabels] ?? cat}
                        </h3>
                        <span className="text-[10px] font-semibold text-ink/30 dark:text-white/30">{sortedTests.length}</span>
                      </div>
                      <div className="space-y-4">
                        {sortedTests.map((t) => {
                          const match = getQuestionnaireMatch(t.name);
                          const isOpen = openQuestionnaire === t.slug;
                          return (
                            <div
                              key={t.slug}
                              className={`rounded-2xl border p-5 transition-colors ${
                                match
                                  ? 'border-[#6366F1]/25 bg-gradient-to-br from-[#6366F1]/[0.04] to-[#8B5CF6]/[0.04]'
                                  : 'border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <p className="text-base font-semibold text-ink dark:text-white">{t.name}</p>
                                {match && (
                                  <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#6366F1]/15 text-[#6366F1] dark:text-[#A5B4FC]">
                                    <PenLine size={10} />
                                    {ui.clinicalToolkit.pelvicFloor.fillableBadge}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-2 text-sm text-ink/70 dark:text-white/70 leading-relaxed mt-3">
                                <p><span className="font-semibold text-ink/50 dark:text-white/50">{ui.clinicalToolkit.pelvicFloor.procedureLabel}: </span>{t.procedure}</p>
                                <p><span className="font-semibold text-ink/50 dark:text-white/50">{ui.clinicalToolkit.pelvicFloor.interpretationLabel}: </span>{t.interpretation}</p>
                              </div>
                              {match && (
                                <>
                                  <button
                                    onClick={() => setOpenQuestionnaire(isOpen ? null : t.slug)}
                                    className="mt-4 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-md shadow-[#6366F1]/20 hover:scale-[1.02] transition-transform"
                                  >
                                    {isOpen ? ui.clinicalToolkit.pelvicFloor.hideQuestionnaireLabel : ui.clinicalToolkit.pelvicFloor.fillQuestionnaireLabel}
                                  </button>
                                  {isOpen && (
                                    <div className="mt-5 pt-5 border-t border-black/[0.06] dark:border-white/10">
                                      {pfQuestionnaireLoading && (
                                        <p className="text-center text-sm text-ink/50 dark:text-white/50 py-6">{ui.clinicalToolkit.pelvicFloor.loadingQuestionnaireContent}</p>
                                      )}
                                      {pfQuestionnaireData && (
                                        <>
                                          {match === 'sf36' && <SF36Scale data={pfQuestionnaireData} ui={ui} />}
                                          {match === 'pfdi20' && <PFDI20Scale data={pfQuestionnaireData} ui={ui} />}
                                          {match === 'iciq' && <ICIQScale data={pfQuestionnaireData} ui={ui} />}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {category === 'neuro' && (
          <>
            <div className="mb-8 rounded-2xl border border-[#6366F1]/20 bg-[#6366F1]/5 p-6">
              <p className="text-sm font-semibold text-ink dark:text-white mb-2">
                {ui.clinicalToolkit.neuro.calloutHeading}
              </p>
              <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-4">
                {ui.clinicalToolkit.neuro.calloutDescription}
              </p>
              <a
                href="/dashboard/clinical-tools/neuro-exam"
                className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
              >
                {ui.clinicalToolkit.neuro.startExamLabel}
              </a>
            </div>

            {neuroLoading && (
              <p className="text-center text-sm text-ink/50 dark:text-white/50 py-10">{ui.clinicalToolkit.neuro.loading}</p>
            )}
            {neuroError && (
              <p className="text-center text-sm text-red-500 py-10">{neuroError}</p>
            )}
            {!neuroLoading && !neuroError && (
              <div className="space-y-8">
                {neuroGroupedSorted.map(([cat, tests]) => (
                  <div key={cat}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-white/50 mb-3">
                      {ui.clinicalToolkit.neuro.categoryLabels[cat as keyof typeof ui.clinicalToolkit.neuro.categoryLabels] ?? cat}
                    </h3>
                                        <div className="space-y-4">
                      {tests.map((t) => (
                        <div key={t.slug} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
                          <p className="text-base font-semibold text-ink dark:text-white">{t.name}</p>
                          <div className="space-y-2 text-sm text-ink/70 dark:text-white/70 leading-relaxed mt-3">
                            <p><span className="font-semibold text-ink/50 dark:text-white/50">{ui.clinicalToolkit.neuro.procedureLabel}: </span>{t.procedure}</p>
                            <p><span className="font-semibold text-ink/50 dark:text-white/50">{ui.clinicalToolkit.neuro.interpretationLabel}: </span>{t.interpretation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

                {category === 'manual-therapy' && (
          <>
            {mtConcepts && mtConcepts.length > 0 && (
              <div className="mb-8 rounded-2xl border border-[#6366F1]/20 bg-[#6366F1]/5 p-6">
                <p className="text-sm font-semibold text-ink dark:text-white mb-2">
                  {ui.clinicalToolkit.manualTherapy.mulliganPrinciplesHeading}
                </p>
                <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-4">
                  {ui.clinicalToolkit.manualTherapy.mulliganPrinciplesHint}
                </p>
                <div className="space-y-3">
                  {mtConcepts.map((c) => {
                    const isOpen = openConcept === c.id;
                    return (
                      <div key={c.id} className="rounded-xl bg-white/70 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/10 overflow-hidden">
                        <button
                          onClick={() => setOpenConcept(isOpen ? null : c.id)}
                          className="w-full text-left px-4 py-3 flex items-center justify-between gap-3"
                        >
                          <span>
                            <span className="text-sm font-semibold text-ink dark:text-white block">{c.name}</span>
                            <span className="text-xs text-ink/50 dark:text-white/50">{c.summary}</span>
                          </span>
                          <span className="text-xs text-[#6366F1] font-semibold shrink-0">{isOpen ? ui.clinicalToolkit.manualTherapy.closeLabel : ui.clinicalToolkit.manualTherapy.readLabel}</span>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 border-t border-black/[0.06] dark:border-white/10">
                            <p className="text-xs text-ink/70 dark:text-white/70 leading-relaxed whitespace-pre-line">{c.content}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

                        <div className="relative mb-6 max-w-md mx-auto">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 dark:text-white/30" />
              <input
                type="text"
                value={mtSearchQuery}
                onChange={(e) => setMtSearchQuery(e.target.value)}
                placeholder={ui.librarySearchPlaceholder}
                className="w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-ink dark:text-white placeholder:text-ink/40 dark:placeholder:text-white/40 outline-none transition-colors focus:border-[#6366F1]/40"
              />
            </div>

                        <div className="flex flex-wrap justify-center gap-2 mb-4">
              {MT_REGION_ORDER.map((r) => (
                <button key={r} onClick={() => setActiveMTRegion(r)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeMTRegion === r ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white' : 'bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60'}`}>
                  {ui.clinicalToolkit.manualTherapy.regionLabels[r as keyof typeof ui.clinicalToolkit.manualTherapy.regionLabels] ?? r}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {MT_TYPE_ORDER.map((t) => (
                <button key={t} onClick={() => setActiveMTType(t)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeMTType === t ? 'bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/40' : 'bg-black/[0.03] dark:bg-white/[0.05] text-ink/50 dark:text-white/50 border border-transparent'}`}>
                  {ui.clinicalToolkit.manualTherapy.typeLabels[t as keyof typeof ui.clinicalToolkit.manualTherapy.typeLabels] ?? MT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            {mtLoading && (
              <p className="text-center text-sm text-ink/50 dark:text-white/50 py-10">{ui.clinicalToolkit.manualTherapy.loadingTechniques}</p>
            )}
            {mtError && (
              <p className="text-center text-sm text-red-500 py-10">{mtError}</p>
            )}
            {!mtLoading && !mtError && (
              <div className="space-y-4">
                {mtFilteredByRegion.map((t) => (
                  <div key={t.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
                    <p className="text-base font-semibold text-ink dark:text-white">{t.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1 mb-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1]">{t.technique_type}</span>
                      {t.grade && <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink/60 dark:text-white/60">{t.grade}</span>}
                    </div>
                    <div className="mb-3">
                      <ClinicalActionBar contentType="exercise" contentId={t.id} label={t.name} section="Manual Therapy" />
                    </div>
                    <div className="space-y-2 text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                      <p><span className="font-semibold text-ink/50 dark:text-white/50">{ui.clinicalToolkit.manualTherapy.patientPositionLabel}: </span>{t.patient_position}</p>
                      <p><span className="font-semibold text-ink/50 dark:text-white/50">{ui.clinicalToolkit.manualTherapy.directionLabel}: </span>{t.direction}</p>
                      <p><span className="font-semibold text-ink/50 dark:text-white/50">{ui.clinicalToolkit.manualTherapy.indicationsLabel}: </span>{t.indications}</p>
                      <p><span className="font-semibold text-ink/50 dark:text-white/50">{ui.fields.contraindications}: </span>{t.contraindications}</p>
                      <p><span className="font-semibold text-ink/50 dark:text-white/50">{ui.clinicalToolkit.manualTherapy.procedureLabel}: </span>{t.procedure}</p>
                    </div>
                  </div>
                ))}
                {mtFilteredByRegion.length === 0 && (
                  <p className="text-center text-sm text-ink/50 dark:text-white/50 py-10">{ui.clinicalToolkit.manualTherapy.noTechniquesFound}</p>
                )}
              </div>
            )}
          </>
        )}

        {category === 'metabolic' && (
          <div className="mb-10">
            <MetabolicCalculator mode="professional" />
          </div>
        )}
      </div>
    </div>
  );
}