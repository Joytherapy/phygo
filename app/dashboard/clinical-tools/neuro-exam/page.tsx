'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const ACCENT = {
  gradient: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)',
  solid: '#4F7CFF',
};

type QuestionType = 'single' | 'multi';

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
}

interface Section {
  key: string;
  title: string;
  questions: Question[];
}

const OPT_NORMAL_ALTERED = ['Normale', 'Alterato'];
const OPT_YESNO = ['Sì', 'No'];
const OPT_ASSENTE_PRESENTE = ['Assente', 'Presente'];
const OPT_NEG_POS = ['Negativo', 'Positivo'];
const OPT_CONSCIOUSNESS = ['Vigile', 'Sopore', 'Stupor / Stato vegetativo', 'Coma'];
const OPT_MRC = ['0', '1', '2', '3', '4', '5'];
const OPT_ROT_GRADE = ['Assente', 'Ipoevocabile', 'Normoevocabile/Vivace', 'Scattante', 'Trepidante/Policinetico', 'Clono'];
const OPT_TONO = ['Normale', 'Ipertono spastico (piramidale)', 'Ipertono plastico (extrapiramidale)', 'Ipotono', 'Flaccidità'];
const OPT_TROFISMO = ['Normale', 'Ipotrofico', 'Ipertrofico'];

const SECTIONS: Section[] = [
  {
    key: 'consciousness',
    title: 'Stato di Vigilanza e Coscienza',
    questions: [
      { id: 'consciousness_level', text: 'Stato di vigilanza e coscienza', type: 'single', options: OPT_CONSCIOUSNESS },
    ],
  },
  {
    key: 'cortical_functions',
    title: 'Funzioni Corticali Superiori',
    questions: [
      { id: 'attention', text: 'Attenzione', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'orient_person', text: 'Orientamento verso sé stesso (persona)', type: 'single', options: OPT_YESNO },
      { id: 'orient_place', text: 'Orientamento nello spazio', type: 'single', options: OPT_YESNO },
      { id: 'orient_time', text: 'Orientamento nel tempo', type: 'single', options: OPT_YESNO },
      { id: 'memory', text: 'Memoria (immediata e differita)', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'calculation', text: 'Calcolo (es. sottrazione seriale)', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'language', text: 'Linguaggio', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'gnosia', text: 'Gnosia (riconoscimento)', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'praxis', text: 'Prassia (inclusa prassia costruttiva — es. copia di figura geometrica)', type: 'single', options: OPT_NORMAL_ALTERED },
    ],
  },
  {
    key: 'stance_gait',
    title: 'Stazione Eretta e Deambulazione',
    questions: [
      { id: 'stance', text: 'Raggiungimento e mantenimento della stazione eretta', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'romberg', text: 'Prova di Romberg', type: 'single', options: OPT_NEG_POS },
      { id: 'pull_test', text: 'Riflessi posturali (pull test)', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'gait_base_symmetry', text: 'Base, stabilità, postura e simmetria della marcia', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'gait_stress', text: 'Marcia in condizioni di stress (occhi chiusi, punte, talloni, tandem)', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'gait_pattern', text: 'Pattern di marcia patologica osservato', type: 'multi', options: ['Nessuno', 'Paretica/Paraparetica', 'Atassica', 'Extrapiramidale', 'Aprassia della marcia', 'Steppage', 'Anserina'] },
    ],
  },
  {
    key: 'strength_tone',
    title: 'Forza, Trofismo e Tono Muscolare',
    questions: [
      { id: 'mingazzini', text: 'Prove di forza statiche (Mingazzini I e II)', type: 'single', options: ['Negativa', 'Positiva (deficit rilevato)'] },
      { id: 'mrc_deltoid_dx', text: 'Forza dinamica (MRC 0-5) — Deltoide Destra', type: 'single', options: OPT_MRC },
      { id: 'mrc_deltoid_sx', text: 'Forza dinamica (MRC 0-5) — Deltoide Sinistra', type: 'single', options: OPT_MRC },
      { id: 'mrc_biceps_dx', text: 'Forza dinamica (MRC 0-5) — Bicipite Brachiale Destra', type: 'single', options: OPT_MRC },
      { id: 'mrc_biceps_sx', text: 'Forza dinamica (MRC 0-5) — Bicipite Brachiale Sinistra', type: 'single', options: OPT_MRC },
      { id: 'mrc_wrist_ext_dx', text: 'Forza dinamica (MRC 0-5) — Estensori del Polso Destra', type: 'single', options: OPT_MRC },
      { id: 'mrc_wrist_ext_sx', text: 'Forza dinamica (MRC 0-5) — Estensori del Polso Sinistra', type: 'single', options: OPT_MRC },
      { id: 'mrc_iliopsoas_dx', text: 'Forza dinamica (MRC 0-5) — Ileopsoas Destra', type: 'single', options: OPT_MRC },
      { id: 'mrc_iliopsoas_sx', text: 'Forza dinamica (MRC 0-5) — Ileopsoas Sinistra', type: 'single', options: OPT_MRC },
      { id: 'mrc_quadriceps_dx', text: 'Forza dinamica (MRC 0-5) — Quadricipite Destra', type: 'single', options: OPT_MRC },
      { id: 'mrc_quadriceps_sx', text: 'Forza dinamica (MRC 0-5) — Quadricipite Sinistra', type: 'single', options: OPT_MRC },
      { id: 'mrc_tibialis_ant_dx', text: 'Forza dinamica (MRC 0-5) — Tibiale Anteriore Destra', type: 'single', options: OPT_MRC },
      { id: 'mrc_tibialis_ant_sx', text: 'Forza dinamica (MRC 0-5) — Tibiale Anteriore Sinistra', type: 'single', options: OPT_MRC },
      { id: 'trofismo', text: 'Massa muscolare (trofismo)', type: 'single', options: OPT_TROFISMO },
      { id: 'tono', text: 'Tono muscolare', type: 'single', options: OPT_TONO },
    ],
  },
  {
    key: 'reflexes',
    title: 'Riflessi Osteotendinei e Superficiali',
    questions: [
      { id: 'rot_biceps_dx', text: 'R. Bicipitale (C6) — Destra', type: 'single', options: OPT_ROT_GRADE },
      { id: 'rot_biceps_sx', text: 'R. Bicipitale (C6) — Sinistra', type: 'single', options: OPT_ROT_GRADE },
      { id: 'rot_triceps_dx', text: 'R. Tricipitale (C7) — Destra', type: 'single', options: OPT_ROT_GRADE },
      { id: 'rot_triceps_sx', text: 'R. Tricipitale (C7) — Sinistra', type: 'single', options: OPT_ROT_GRADE },
      { id: 'rot_stiloradial_dx', text: 'R. Stilo-radiale/Cubito-pronatore (C8) — Destra', type: 'single', options: OPT_ROT_GRADE },
      { id: 'rot_stiloradial_sx', text: 'R. Stilo-radiale/Cubito-pronatore (C8) — Sinistra', type: 'single', options: OPT_ROT_GRADE },
      { id: 'rot_patellar_dx', text: 'R. Rotuleo/Patellare (L4) — Destra', type: 'single', options: OPT_ROT_GRADE },
      { id: 'rot_patellar_sx', text: 'R. Rotuleo/Patellare (L4) — Sinistra', type: 'single', options: OPT_ROT_GRADE },
      { id: 'rot_achilles_dx', text: 'R. Achilleo (S1) — Destra', type: 'single', options: OPT_ROT_GRADE },
      { id: 'rot_achilles_sx', text: 'R. Achilleo (S1) — Sinistra', type: 'single', options: OPT_ROT_GRADE },
      { id: 'babinski_dx', text: 'Riflesso cutaneo plantare (Segno di Babinski) — Destra', type: 'single', options: ['Normale (flessorio)', 'Positivo (patologico)'] },
      { id: 'babinski_sx', text: 'Riflesso cutaneo plantare (Segno di Babinski) — Sinistra', type: 'single', options: ['Normale (flessorio)', 'Positivo (patologico)'] },
      { id: 'abdominal_reflexes', text: 'Riflessi addominali', type: 'single', options: ['Normali', 'Assenti'] },
      { id: 'hoffmann_dx', text: 'Riflesso di Hoffmann (flessore delle dita) — Destra', type: 'single', options: OPT_NEG_POS },
      { id: 'hoffmann_sx', text: 'Riflesso di Hoffmann (flessore delle dita) — Sinistra', type: 'single', options: OPT_NEG_POS },
    ],
  },
  {
    key: 'sensation',
    title: 'Sensibilità',
    questions: [
      { id: 'sens_superficial', text: 'Sensibilità superficiale (termo-tattile-dolorifica)', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'sens_deep', text: 'Sensibilità profonda (pallestesia e senso di posizione)', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'sens_topography', text: 'Topografia del deficit (se presente)', type: 'multi', options: ['Non applicabile', 'Territorio nervo periferico', 'Polineuropatica', 'Radicolare', 'Metamerica (livello)', 'Emisferica'] },
      { id: 'sens_quality', text: 'Qualità del deficit (se presente)', type: 'multi', options: ['Non applicabile', 'Ipo(an)estesia', 'Iperestesia', 'Disestesia', 'Allodinia', 'Parestesia'] },
    ],
  },
  {
    key: 'cerebellar',
    title: 'Prove Cerebellari',
    questions: [
      { id: 'finger_nose_dx', text: 'Indice-naso — Destra', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'finger_nose_sx', text: 'Indice-naso — Sinistra', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'alt_hand_movements_dx', text: 'Movimenti alternati delle mani — Destra', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'alt_hand_movements_sx', text: 'Movimenti alternati delle mani — Sinistra', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'heel_knee_dx', text: 'Calcagno-ginocchio — Destra', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'heel_knee_sx', text: 'Calcagno-ginocchio — Sinistra', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'foot_tapping_dx', text: 'Foot-tapping — Destra', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'foot_tapping_sx', text: 'Foot-tapping — Sinistra', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'cerebellar_findings', text: 'Reperti patologici osservati', type: 'multi', options: ['Nessuno', 'Frénage', 'Dismetria', 'Tremore intenzionale', 'Ipodiadococinesia', 'Atassia', 'Disequilibrio'] },
      { id: 'stewart_holmes', text: 'Segno di Stewart-Holmes', type: 'single', options: OPT_NEG_POS },
      { id: 'scanning_speech', text: 'Parola scandita/esplosiva', type: 'single', options: OPT_ASSENTE_PRESENTE },
      { id: 'voice_tremor', text: 'Tremore vocale', type: 'single', options: OPT_ASSENTE_PRESENTE },
    ],
  },
  {
    key: 'cranial_nerves',
    title: 'Nervi Cranici',
    questions: [
      { id: 'cn1', text: 'I — Olfattivo', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'cn2', text: 'II — Ottico (acuità visiva, campo visivo, fundus oculi)', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'pupil_isocoria', text: 'Esame pupillare — Isocoria (calibro simmetrico)', type: 'single', options: OPT_YESNO },
      { id: 'pupil_direct_reflex', text: 'Riflesso fotomotore diretto', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'pupil_consensual_reflex', text: 'Riflesso fotomotore consensuale', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'cn3_4_6', text: 'III-IV-VI — Motilità oculare estrinseca', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'cn5', text: 'V — Trigemino (sensibilità facciale/corneale, motilità masticatoria)', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'cn7', text: 'VII — Facciale (motilità del volto)', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'cn8', text: 'VIII — Vestibolo-cocleare (riflessi vestibolari, udito)', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'cn9_10', text: 'IX-X — Glossofaringeo/Vago (palato molle, deglutizione, riflesso faringeo)', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'cn11', text: 'XI — Accessorio (trapezio, sternocleidomastoideo)', type: 'single', options: OPT_NORMAL_ALTERED },
      { id: 'cn12', text: 'XII — Ipoglosso (motilità linguale)', type: 'single', options: OPT_NORMAL_ALTERED },
    ],
  },
  {
    key: 'involuntary_movements',
    title: 'Movimenti Involontari',
    questions: [
      { id: 'tremor', text: 'Tremore', type: 'multi', options: ['Assente', 'A riposo', 'Posturale', 'Intenzionale'] },
      { id: 'other_movements', text: 'Altri movimenti involontari osservati', type: 'multi', options: ['Nessuno', 'Clonie', 'Fascicolazioni', 'Tic', 'Mioclono', 'Miochimia', 'Corea', 'Atetosi'] },
    ],
  },
  {
    key: 'meningeal_signs',
    title: 'Segni Meningei',
    questions: [
      { id: 'rigor_nucalis', text: 'Rigor nucalis (rigidità nucale)', type: 'single', options: OPT_ASSENTE_PRESENTE },
      { id: 'brudzinski', text: 'Segno di Brudzinski', type: 'single', options: OPT_NEG_POS },
      { id: 'kernig', text: 'Segno di Kernig', type: 'single', options: OPT_NEG_POS },
      { id: 'lasegue', text: 'Segno di Lasègue', type: 'single', options: OPT_NEG_POS },
    ],
  },
];

export default function NeuroExamPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showSummary, setShowSummary] = useState(false);

  const section = SECTIONS[currentStep];
  const isLastSection = currentStep === SECTIONS.length - 1;

  const setSingleAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const toggleMultiAnswer = (qId: string, value: string) => {
    setAnswers((prev) => {
      const current = (prev[qId] as string[]) || [];
      const exists = current.includes(value);
      return {
        ...prev,
        [qId]: exists ? current.filter((v) => v !== value) : [...current, value],
      };
    });
  };

  const handleNext = () => {
    if (isLastSection) {
      setShowSummary(true);
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (showSummary) {
      setShowSummary(false);
      return;
    }
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />

      <div className="relative max-w-2xl mx-auto px-6 pt-40 pb-24">
        <button
          onClick={() => router.push('/dashboard/clinical-tools')}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Torna a Clinical Toolkit
        </button>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT.gradient }} />
            Esame Obiettivo
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Esame Neurologico
          </h1>
        </div>

        {!showSummary && (
          <>
            <div className="flex items-center gap-1.5 mb-8 flex-wrap">
              {SECTIONS.map((s, i) => (
                <div
                  key={s.key}
                  className="h-1.5 flex-1 min-w-[16px] rounded-full transition-colors"
                  style={{
                    background: i <= currentStep ? ACCENT.solid : 'rgba(0,0,0,0.08)',
                  }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={section.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs font-bold uppercase tracking-wide mb-6" style={{ color: ACCENT.solid }}>
                  {section.title} — {currentStep + 1} di {SECTIONS.length}
                </p>

                <div className="space-y-8">
                  {section.questions.map((q) => (
                    <div key={q.id}>
                      <p className="text-sm font-semibold text-ink dark:text-white mb-3">{q.text}</p>

                      {q.type === 'single' && q.options && (
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => setSingleAnswer(q.id, opt)}
                              className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
                                answers[q.id] === opt
                                  ? 'text-white border-transparent'
                                  : 'text-ink/60 dark:text-white/60 border-black/[0.08] dark:border-white/10 hover:text-ink dark:hover:text-white'
                              }`}
                              style={answers[q.id] === opt ? { background: ACCENT.solid } : undefined}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === 'multi' && q.options && (
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((opt) => {
                            const selected = ((answers[q.id] as string[]) || []).includes(opt);
                            return (
                              <button
                                key={opt}
                                onClick={() => toggleMultiAnswer(q.id, opt)}
                                className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
                                  selected
                                    ? 'text-white border-transparent'
                                    : 'text-ink/60 dark:text-white/60 border-black/[0.08] dark:border-white/10 hover:text-ink dark:hover:text-white'
                                }`}
                                style={selected ? { background: ACCENT.solid } : undefined}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-10">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-ink/60 dark:text-white/60 border border-black/[0.08] dark:border-white/10 disabled:opacity-30"
              >
                <ArrowLeft size={16} />
                Indietro
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ background: ACCENT.gradient }}
              >
                {isLastSection ? 'Vedi Riepilogo' : 'Avanti'}
                {isLastSection ? <Check size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
          </>
        )}

        {showSummary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-6" style={{ color: ACCENT.solid }}>
              Riepilogo Esame Neurologico
            </p>

            <div className="space-y-6">
              {SECTIONS.map((s) => (
                <div
                  key={s.key}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5"
                >
                  <p className="text-sm font-bold text-ink dark:text-white mb-3">{s.title}</p>
                  <div className="space-y-2">
                    {s.questions.map((q) => {
                      const answer = answers[q.id];
                      if (!answer || (Array.isArray(answer) && answer.length === 0)) return null;
                      return (
                        <div key={q.id} className="text-xs">
                          <span className="text-ink/50 dark:text-white/50">{q.text}: </span>
                          <span className="text-ink/80 dark:text-white/80 font-medium">
                            {Array.isArray(answer) ? answer.join(', ') : answer}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-10">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-ink/60 dark:text-white/60 border border-black/[0.08] dark:border-white/10"
              >
                <ArrowLeft size={16} />
                Modifica risposte
              </button>
              <button
                onClick={() => router.push('/dashboard/clinical-tools')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ background: ACCENT.gradient }}
              >
                Concludi
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}