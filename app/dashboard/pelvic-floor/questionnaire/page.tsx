'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const ACCENT = {
  gradient: 'linear-gradient(90deg, #EC4899 0%, #F43F5E 100%)',
  solid: '#EC4899',
};

type QuestionType = 'single' | 'multi' | 'scale' | 'text';

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

const SECTIONS: Section[] = [
  {
    key: 'history',
    title: 'Anamnesi Generale',
    questions: [
      { id: 'pregnancies', text: 'Ha avuto gravidanze con parto?', type: 'single', options: ['Sì', 'No'] },
      { id: 'delivery_type', text: 'Se sì, tipo di parto prevalente', type: 'single', options: ['Vaginale spontaneo', 'Vaginale strumentale (forcipe/ventosa)', 'Taglio cesareo', 'Non applicabile'] },
      { id: 'menopause', text: 'È in menopausa?', type: 'single', options: ['Sì', 'No', 'Non applicabile'] },
      { id: 'prior_surgery', text: 'Interventi chirurgici pelvici pregressi', type: 'multi', options: ['Nessuno', 'Emorroidi/ragadi anali', 'Prolasso rettale/rettocele', 'Plastica vaginale', 'Prostatectomia', 'Altro'] },
      { id: 'pelvic_trauma', text: 'Traumi pelvici pregressi (fratture)', type: 'multi', options: ['Nessuno', 'Sinfisi pubica', 'Coccige', 'Bacino monolaterale', 'Bacino bilaterale'] },
    ],
  },
  {
    key: 'bowel',
    title: 'Funzione Intestinale',
    questions: [
      { id: 'bowel_frequency', text: 'Con quale frequenza va di corpo?', type: 'single', options: ['1 volta/giorno', '3-6 volte/settimana', '1-2 volte/settimana', 'Meno di 1 volta/settimana', 'Solo con lassativi/supposte'] },
      { id: 'stool_type', text: 'Come sono generalmente le feci?', type: 'single', options: ['Acquose', 'Cremose', 'Formate, morbide', 'Formate, molto dure', 'Come palline', 'Miste'] },
      { id: 'straining', text: 'Deve sforzarsi molto per evacuare, almeno 1 volta su 4?', type: 'single', options: ['Sì', 'No'] },
      { id: 'incomplete_evac', text: 'Sensazione di evacuazione incompleta', type: 'single', options: ['Sì', 'No'] },
      { id: 'laxative_use', text: 'Usa lassativi/supposte/clisteri?', type: 'single', options: ['Mai', 'Occasionalmente', 'Almeno 1 volta/settimana', 'Quotidianamente'] },
    ],
  },
  {
    key: 'fecal_incontinence',
    title: 'Incontinenza Fecale',
    questions: [
      { id: 'gas_control', text: 'Riesce a trattenere i gas?', type: 'single', options: ['Sempre', 'Il più delle volte', 'Raramente', 'Mai'] },
      { id: 'fecal_loss_type', text: 'Tipo di perdita fecale, se presente', type: 'single', options: ['Nessuna perdita', 'Perdita improvvisa senza stimolo', 'Stimolo presente ma non riesco a trattenere', 'Sporco dopo l\'evacuazione', 'Non applicabile'] },
      { id: 'retention_time', text: 'Per quanto tempo riesce a trattenere quando ha lo stimolo?', type: 'single', options: ['Più di 15 min', '3-15 min', '1-2 min', 'Meno di 30 sec'] },
    ],
  },
  {
    key: 'pain',
    title: 'Dolore del Pavimento Pelvico',
    questions: [
      { id: 'pain_present', text: 'Soffre di dolore del pavimento pelvico?', type: 'single', options: ['Sì', 'No'] },
      { id: 'pain_location', text: 'Localizzazione del dolore', type: 'multi', options: ['Zona perianale', 'Zona perivaginale', 'Zona periuretrale', 'Sinfisi pubica', 'Zona coccigea', 'Non applicabile'] },
      { id: 'pain_intensity', text: 'Intensità del dolore (0 = assente, 10 = massimo)', type: 'scale' },
      { id: 'pain_triggers', text: 'Il dolore aumenta con', type: 'multi', options: ['Defecazione', 'Rapporti sessuali', 'Attività fisica', 'Stare seduti a lungo', 'Contrazione addominali', 'Nessuno di questi'] },
      { id: 'pain_interference', text: 'Il dolore interferisce con', type: 'multi', options: ['Attività lavorative/casalinghe', 'Attività fisica', 'Viaggi lunghi', 'Vita di coppia', 'Nessuna interferenza significativa'] },
    ],
  },
  {
    key: 'urinary',
    title: 'Funzione Urinaria',
    questions: [
      { id: 'urinary_frequency', text: 'Quante volte al giorno urina?', type: 'single', options: ['3-5 volte', '6-9 volte', '10-15 volte', '15-20 volte', 'Più di 20 volte'] },
      { id: 'incontinence_trigger', text: 'L\'incontinenza si verifica (se presente)', type: 'multi', options: ['Non presente', 'Colpo di tosse/starnuto', 'Sollevando pesi', 'Cambio posizione seduto-in piedi', 'Stimolo forte improvviso', 'Non me ne accorgo'] },
      { id: 'urgency_intensity', text: 'Intensità dello stimolo di urgenza (0 = assente, 10 = massimo)', type: 'scale' },
      { id: 'nocturia', text: 'Si sveglia di notte per urinare?', type: 'single', options: ['Mai', '1 volta', '2 volte', '3 o più volte'] },
      { id: 'recurrent_uti', text: 'Ha mai sofferto di cistiti ricorrenti?', type: 'single', options: ['Sì', 'No'] },
    ],
  },
];

export default function PelvicFloorQuestionnairePage() {
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
          background: 'radial-gradient(circle, rgba(236,72,153,0.6) 0%, rgba(244,63,94,0.5) 100%)',
        }}
      />

      <div className="relative max-w-2xl mx-auto px-6 pt-40 pb-24">
        <button
          onClick={() => router.push('/dashboard/pelvic-floor')}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Torna a Pelvic Floor
        </button>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT.gradient }} />
            Questionario Anamnestico
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Valutazione del Pavimento Pelvico
          </h1>
        </div>

        {!showSummary && (
          <>
            <div className="flex items-center gap-2 mb-8">
              {SECTIONS.map((s, i) => (
                <div
                  key={s.key}
                  className="h-1.5 flex-1 rounded-full transition-colors"
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

                      {q.type === 'scale' && (
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                            <button
                              key={n}
                              onClick={() => setSingleAnswer(q.id, String(n))}
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold border transition-colors ${
                                answers[q.id] === String(n)
                                  ? 'text-white border-transparent'
                                  : 'text-ink/60 dark:text-white/60 border-black/[0.08] dark:border-white/10'
                              }`}
                              style={answers[q.id] === String(n) ? { background: ACCENT.solid } : undefined}
                            >
                              {n}
                            </button>
                          ))}
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
              Riepilogo Anamnestico
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
                onClick={() => router.push('/dashboard/pelvic-floor')}
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
