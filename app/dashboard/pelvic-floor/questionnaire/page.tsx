'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext';
import type { PFAnamnesisQuestionContent, PFAnamnesisSectionContent, PFAnamnesisOption } from '@/lib/pelvicFloorAnamnesisContent';

const ACCENT = {
  gradient: 'linear-gradient(90deg, #EC4899 0%, #F43F5E 100%)',
  solid: '#EC4899',
};

// Section/question/option content (SECTIONS, question text, option labels)
// now lives in lib/pelvicFloorAnamnesisContent.ts and is served translated
// via /api/pelvic-floor/anamnesis. Answers for single/multi questions are
// keyed by the option's stable `value` slug (language-independent), not
// its display label, so in-progress answers survive a language switch
// mid-questionnaire. 'scale' questions store the numeric string directly.

interface PFAnamnesisData {
  questions: PFAnamnesisQuestionContent[];
  sections: PFAnamnesisSectionContent[];
  optionSets: Record<string, PFAnamnesisOption[]>;
}

export default function PelvicFloorQuestionnairePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const ui = useUiStrings();
  const [data, setData] = useState<PFAnamnesisData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    setData(null);
    setLoadError(false);
    fetch(`/api/pelvic-floor/anamnesis?lang=${lang}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setLoadError(true));
  }, [lang]);

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

  if (loadError) {
    return (
      <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white transition-colors">
        <Navbar />
        <div className="relative max-w-2xl mx-auto px-6 pt-40 pb-24">
          <p className="text-center text-sm text-red-500 py-10">{ui.pelvicFloorAnamnesis.errorLoading}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white transition-colors">
        <Navbar />
        <div className="relative max-w-2xl mx-auto px-6 pt-40 pb-24">
          <p className="text-center text-sm text-ink/50 dark:text-white/50 py-10">{ui.pelvicFloorAnamnesis.loading}</p>
        </div>
      </div>
    );
  }

  const questionsById = new Map<string, PFAnamnesisQuestionContent>(data.questions.map((q) => [q.id, q]));
  const sections = data.sections;
  const section = sections[currentStep];
  const isLastSection = currentStep === sections.length - 1;

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

  const resolveLabel = (question: PFAnamnesisQuestionContent, value: string) => {
    if (question.type === 'scale' || !question.optionSet) return value;
    const options = data.optionSets[question.optionSet] ?? [];
    return options.find((o) => o.value === value)?.label ?? value;
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
          {ui.pelvicFloorAnamnesis.backToPelvicFloor}
        </button>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT.gradient }} />
            {ui.pelvicFloorAnamnesis.badge}
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            {ui.pelvicFloorAnamnesis.heading}
          </h1>
        </div>

        {!showSummary && (
          <>
            <div className="flex items-center gap-2 mb-8">
              {sections.map((s, i) => (
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
                  {section.title} — {currentStep + 1} {ui.pelvicFloorAnamnesis.sectionCounterSeparator} {sections.length}
                </p>

                <div className="space-y-8">
                  {section.questionIds.map((qId) => {
                    const q = questionsById.get(qId);
                    if (!q) return null;
                    const options = q.optionSet ? data.optionSets[q.optionSet] ?? [] : [];
                    return (
                      <div key={q.id}>
                        <p className="text-sm font-semibold text-ink dark:text-white mb-3">{q.text}</p>

                        {q.type === 'single' && (
                          <div className="flex flex-wrap gap-2">
                            {options.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setSingleAnswer(q.id, opt.value)}
                                className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
                                  answers[q.id] === opt.value
                                    ? 'text-white border-transparent'
                                    : 'text-ink/60 dark:text-white/60 border-black/[0.08] dark:border-white/10 hover:text-ink dark:hover:text-white'
                                }`}
                                style={answers[q.id] === opt.value ? { background: ACCENT.solid } : undefined}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {q.type === 'multi' && (
                          <div className="flex flex-wrap gap-2">
                            {options.map((opt) => {
                              const selected = ((answers[q.id] as string[]) || []).includes(opt.value);
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => toggleMultiAnswer(q.id, opt.value)}
                                  className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
                                    selected
                                      ? 'text-white border-transparent'
                                      : 'text-ink/60 dark:text-white/60 border-black/[0.08] dark:border-white/10 hover:text-ink dark:hover:text-white'
                                  }`}
                                  style={selected ? { background: ACCENT.solid } : undefined}
                                >
                                  {opt.label}
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
                    );
                  })}
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
                {ui.pelvicFloorAnamnesis.backButton}
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ background: ACCENT.gradient }}
              >
                {isLastSection ? ui.pelvicFloorAnamnesis.viewSummaryButton : ui.pelvicFloorAnamnesis.nextButton}
                {isLastSection ? <Check size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
          </>
        )}

        {showSummary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-6" style={{ color: ACCENT.solid }}>
              {ui.pelvicFloorAnamnesis.summaryHeading}
            </p>

            <div className="space-y-6">
              {sections.map((s) => (
                <div
                  key={s.key}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5"
                >
                  <p className="text-sm font-bold text-ink dark:text-white mb-3">{s.title}</p>
                  <div className="space-y-2">
                    {s.questionIds.map((qId) => {
                      const q = questionsById.get(qId);
                      if (!q) return null;
                      const answer = answers[q.id];
                      if (!answer || (Array.isArray(answer) && answer.length === 0)) return null;
                      const labelText = Array.isArray(answer)
                        ? answer.map((v) => resolveLabel(q, v)).join(', ')
                        : resolveLabel(q, answer);
                      return (
                        <div key={q.id} className="text-xs">
                          <span className="text-ink/50 dark:text-white/50">{q.text}: </span>
                          <span className="text-ink/80 dark:text-white/80 font-medium">{labelText}</span>
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
                {ui.pelvicFloorAnamnesis.editAnswersButton}
              </button>
              <button
                onClick={() => router.push('/dashboard/pelvic-floor')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ background: ACCENT.gradient }}
              >
                {ui.pelvicFloorAnamnesis.finishButton}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
