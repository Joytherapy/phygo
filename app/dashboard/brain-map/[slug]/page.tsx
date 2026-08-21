'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Stethoscope, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';

const ZONE_INFO: Record<string, string> = {
  'frontal-lobe':
    "Il lobo frontale governa funzioni esecutive (pianificazione, giudizio, controllo degli impulsi), il movimento volontario e il linguaggio espressivo (area di Broca, tipicamente emisfero sinistro). Al suo interno si distinguono tre regioni motorie organizzate gerarchicamente: la corteccia motoria primaria (M1, Area 4), che esegue il comando motorio finale; la corteccia premotoria e l'area motoria supplementare (Area 6), che pianificano la sequenza del movimento prima che M1 lo esegua; e la corteccia prefrontale (Area 10), coinvolta in funzioni cognitive superiori come il processo decisionale. Lesioni causano deficit di personalità/comportamento, emiparesi controlaterale, o afasia espressiva. Nell'anziano, un deterioramento delle funzioni esecutive frontali è spesso il primo segno di decadimento cognitivo vascolare, distinto dal pattern mnesico tipico dell'Alzheimer.",
  'parietal-lobe':
    "Il lobo parietale ospita la corteccia somatosensoriale primaria (S1, Aree 3a-3b-1-2), che riceve ed elabora tatto e propriocezione. La corteccia parietale posteriore (Aree 5 e 7) integra queste informazioni sensoriali con l'input visivo per la localizzazione spaziale del corpo e degli oggetti, comunicando con la corteccia premotoria per la pianificazione del movimento. Lesioni causano deficit sensitivi controlaterali, agnosia spaziale (spesso più marcata con lesioni dell'emisfero destro, es. neglect) o aprassia. Il neglect spaziale post-ictus richiede un approccio riabilitativo specifico, poiché il paziente può non essere consapevole del proprio deficit, con implicazioni dirette sulla sicurezza.",
  'temporal-lobe':
    "Il lobo temporale è coinvolto in memoria (ippocampo, strutture mediali), linguaggio recettivo (area di Wernicke, tipicamente emisfero sinistro) ed elaborazione uditiva. Lesioni causano deficit di memoria, afasia recettiva o agnosia uditiva. Il coinvolgimento precoce delle strutture temporali mediali (ippocampo) è caratteristico della malattia di Alzheimer, con un pattern di perdita di memoria episodica recente che precede altri deficit cognitivi.",
  'occipital-lobe':
    "Il lobo occipitale è dedicato all'elaborazione visiva primaria (Area 17). Lesioni causano deficit del campo visivo controlaterale, fino all'emianopsia in lesioni estese. Nell'anziano, i deficit visivi post-ictus vanno sempre valutati insieme al rischio di cadute, poiché si sommano spesso a comorbidità visive preesistenti (cataratta, degenerazione maculare).",
  'cerebellum':
    "Il cervelletto coordina movimento, equilibrio e tono muscolare, integrando input propriocettivi, vestibolari e visivi. Lesioni causano atassia, dismetria, tremore intenzionale e disturbi dell'equilibrio, tipicamente omolaterali alla lesione. Le atassie cerebellari nell'anziano richiedono una valutazione multifattoriale del rischio di caduta, spesso aggravato da comorbidità come la polineuropatia periferica.",
  'brainstem':
    "Il tronco encefalico (mesencefalo, ponte, bulbo) contiene i nuclei dei nervi cranici, i centri vitali (respirazione, frequenza cardiaca) ed è il punto di decussazione delle principali vie motorie e sensitive che lo attraversano. Ospita inoltre i nuclei di origine dei tratti extrapiramidali (rosso, vestibolari, reticolari, collicolo superiore). Lesioni del tronco sono spesso gravi, con deficit multipli di nervi cranici, alterazione dello stato di coscienza o sindromi crociate (deficit omolaterale del volto, controlaterale del corpo). La prognosi funzionale dipende fortemente dalla tempestività del trattamento in fase acuta.",
  'basal-ganglia':
    "I gangli della base (nucleo caudato e putamen, che insieme formano lo striato; globo pallido esterno e interno; nucleo subtalamico; sostanza nera) regolano il controllo del movimento volontario e il tono muscolare tramite un circuito cortico-sottocorticale-corticale che riceve input dalla corteccia cerebrale e restituisce l'output al talamo e da lì alla corteccia frontale. Disfunzioni sono centrali nella malattia di Parkinson (deplezione dopaminergica) e in altri disturbi del movimento come corea e distonia. Nell'anziano, la diagnosi differenziale tra Parkinson idiopatico e parkinsonismi vascolari (da micro-lesioni ischemiche multiple) è clinicamente rilevante, poiché influenza sia la prognosi che la risposta al trattamento farmacologico.",
};

const GERIATRIC_PRINCIPLES = [
  {
    title: 'Approccio al paziente anziano vs giovane',
    content:
      "La valutazione neurologica nell'anziano richiede un approccio diverso da quello del paziente giovane: comorbidità multiple, polifarmacia, e riserva funzionale ridotta modificano sia la presentazione clinica sia la risposta al trattamento. Un cambio di ambiente (es. ricovero) può di per sé destabilizzare un paziente anziano, specialmente in presenza di decadimento cognitivo anche lieve, con perdita dei punti di riferimento abituali — un fattore da considerare nella scelta tra ricovero e gestione domiciliare.",
  },
  {
    title: 'Riabilitazione post-ictus: tempistiche e fattori prognostici',
    content:
      "Il timing dell'ingresso in un percorso riabilitativo intensivo dopo un ictus è un fattore prognostico rilevante: il periodo di massimo recupero funzionale si colloca nelle prime settimane-mesi, e un ritardo eccessivo nell'avvio della riabilitazione ne riduce l'efficacia. Va inoltre considerato che una parte dei pazienti anziani può mostrare un peggioramento funzionale alla dimissione rispetto all'ingresso, spesso legato più al cambio di ambiente e alla destabilizzazione psicologica che al quadro neurologico in sé.",
  },
  {
    title: 'Approccio multidisciplinare e cura centrata sul paziente',
    content:
      "La gestione del paziente neurogeriatrico beneficia di un team multidisciplinare (medico, fisioterapista, terapista occupazionale, supporto familiare) e di un percorso di cura personalizzato, che integri le linee guida cliniche con il contesto socio-economico e familiare del paziente. Le linee guida forniscono una cornice, ma il piano di trattamento va sempre calibrato sulle risorse e sul contesto specifico di ogni paziente.",
  },
  {
    title: 'Segnali di allarme cognitivo da non sottovalutare',
    content:
      "Un declino cognitivo che compromette progressivamente l'autonomia nelle attività quotidiane, un cambiamento comportamentale acuto o subacuto, o un peggioramento cognitivo rapido (settimane-pochi mesi, non anni) sono segnali che richiedono approfondimento diagnostico tempestivo, per escludere cause reversibili (es. delirium, cause metaboliche/farmacologiche) prima di attribuire il quadro a una demenza degenerativa primaria.",
  },
];



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
  zone: { id: string; name: string; slug: string };
  conditions: ConditionItem[];
}

export default function BrainZoneHubPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<ConditionItem | null>(null);

  useEffect(() => {
    fetch(`/api/brain-map/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#08090b] flex items-center justify-center">
        <Navbar />
        <p className="text-ink/40 dark:text-white/40">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#08090b] flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <p className="text-ink/60 dark:text-white/60 mb-4">Zone not found.</p>
          <button
            onClick={() => router.push('/dashboard/brain-map')}
            className="text-sm font-semibold text-[#4F7CFF]"
          >
            {"\u2190"} Back to Brain Map
          </button>
        </div>
      </div>
    );
  }

  const { zone, conditions } = data;
  const info = ZONE_INFO[zone.slug] || '';

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
          Brain Map
        </button>

        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]" />
            Neurological Zone
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight">
            {zone.name}
          </h1>
          {info && (
            <p className="text-ink/50 dark:text-white/50 mt-4 max-w-2xl text-base leading-relaxed">
              {info}
            </p>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-4">
            Geriatric Neurology Principles
          </h2>
          <div className="space-y-4">
            {GERIATRIC_PRINCIPLES.map((g) => (
              <div
                key={g.title}
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
              Related Conditions
            </h2>
          </div>

          {conditions.length === 0 ? (
            <p className="text-sm text-ink/40 dark:text-white/40">
              No conditions linked to this zone yet.
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
                  {selectedCondition.evidence_level} evidence
                </span>
              )}

              <div className="space-y-4 text-sm">
                {selectedCondition.goals && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Goals</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.goals}
                    </p>
                  </div>
                )}
                {selectedCondition.clinical_tests && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Clinical Tests</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.clinical_tests}
                    </p>
                  </div>
                )}
                {selectedCondition.typical_exercises && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Typical Exercises</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.typical_exercises}
                    </p>
                  </div>
                )}
                {selectedCondition.progression_criteria && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Progression Criteria</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.progression_criteria}
                    </p>
                  </div>
                )}
                {selectedCondition.contraindications && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Contraindications</p>
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
                        Red Flags
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
