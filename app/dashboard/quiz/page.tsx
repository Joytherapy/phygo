'use client'

// Student-facing Quiz feature ("Sezione dedicata 'Quiz'", per the user's
// chosen scope). One page, four internal views (subjects -> difficulty ->
// quiz -> results) rather than separate routes, since the whole flow is
// short-lived client state with nothing worth deep-linking to individually.
// Auto-generation, caching and scoring all happen server-side in
// /api/quiz/generate, /api/quiz/submit, /api/quiz/progress — this page only
// ever sees question text/options, never correct_index/explanation, until a
// question has actually been answered and reviewed post-submit.

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2, Trophy, RotateCcw } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext'
import { useQuizUi, formatQuizString } from '@/lib/i18n/quizStrings'
import { QUIZ_SUBJECTS, QUIZ_DIFFICULTIES, type QuizSubject, type QuizDifficulty } from '@/lib/quiz/subjects'

type QuizQuestion = { id: string; question: string; options: string[] }
type SubmitResult = {
  questionId: string
  question: string
  options: string[]
  selectedIndex: number
  correctIndex: number
  isCorrect: boolean
  explanation: string | null
}
type ProgressBySubject = Record<
  string,
  { attempts: number; totalQuestions: number; totalCorrect: number; bestPercentage: number; lastAttemptAt: string }
>

type View = 'subjects' | 'difficulty' | 'quiz' | 'results'

function subjectLabel(key: QuizSubject, ui: any, quizUi: ReturnType<typeof useQuizUi>) {
  if (key === 'anatomy') return quizUi.subjects.anatomy
  return ui.libraryLinks?.[key]?.label ?? key
}

export default function QuizPage() {
  const ui = useUiStrings()
  const quizUi = useQuizUi()
  const { lang } = useLanguage()

  const [view, setView] = useState<View>('subjects')
  const [subject, setSubject] = useState<QuizSubject | null>(null)
  const [difficulty, setDifficulty] = useState<QuizDifficulty | null>(null)

  const [progress, setProgress] = useState<ProgressBySubject>({})

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [errorGenerating, setErrorGenerating] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<{ totalQuestions: number; correctCount: number; results: SubmitResult[] } | null>(null)

  useEffect(() => {
    fetch('/api/quiz/progress')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.bySubject) setProgress(data.bySubject)
      })
      .catch(() => {})
  }, [])

  const pickSubject = (s: QuizSubject) => {
    setSubject(s)
    setView('difficulty')
  }

  const pickDifficulty = async (d: QuizDifficulty) => {
    if (!subject) return
    setDifficulty(d)
    setView('quiz')
    setLoadingQuestions(true)
    setErrorGenerating(false)
    setQuestions([])
    setAnswers({})
    setCurrentIndex(0)
    setResults(null)

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, difficulty: d, language: lang }),
      })
      const data = await res.json()
      if (!res.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        setErrorGenerating(true)
      } else {
        setQuestions(data.questions)
      }
    } catch {
      setErrorGenerating(true)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const selectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  const goNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
      return
    }
    // Last question -> submit everything and show results.
    if (!subject || !difficulty) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          difficulty,
          answers: questions.map((q) => ({ questionId: q.id, selectedIndex: answers[q.id] })),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResults({ totalQuestions: data.totalQuestions, correctCount: data.correctCount, results: data.results })
        setView('results')
        fetch('/api/quiz/progress')
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d?.bySubject && setProgress(d.bySubject))
          .catch(() => {})
      }
    } finally {
      setSubmitting(false)
    }
  }

  const restart = () => {
    setView('subjects')
    setSubject(null)
    setDifficulty(null)
    setQuestions([])
    setAnswers({})
    setResults(null)
    setCurrentIndex(0)
  }

  const currentQuestion = questions[currentIndex]
  const hasAnsweredCurrent = currentQuestion ? answers[currentQuestion.id] !== undefined : false

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(244,114,182,0.35) 50%, rgba(50,214,160,0.5) 100%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto pt-40 pb-20 px-6">
        {view === 'subjects' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-10">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4F7CFF] mb-3">{quizUi.navLabel}</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink dark:text-white">
                {quizUi.pageTitle}
              </h1>
              <p className="text-base text-ink/40 dark:text-white/40 mt-3">{quizUi.pageSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUIZ_SUBJECTS.map((s) => {
                const p = progress[s]
                return (
                  <button
                    key={s}
                    onClick={() => pickSubject(s)}
                    className="text-left rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <p className="font-display text-base font-bold text-ink dark:text-white">{subjectLabel(s, ui, quizUi)}</p>
                    {p ? (
                      <p className="text-xs text-ink/40 dark:text-white/40 mt-1.5">
                        {formatQuizString(quizUi.attemptsLabel, { count: p.attempts })} ·{' '}
                        {formatQuizString(quizUi.bestScoreLabel, { percent: p.bestPercentage })}
                      </p>
                    ) : (
                      <p className="text-xs text-ink/30 dark:text-white/30 mt-1.5">{quizUi.noAttemptsYet}</p>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {view === 'difficulty' && subject && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <button
              onClick={restart}
              className="flex items-center gap-1.5 text-sm text-ink/40 dark:text-white/40 hover:text-ink dark:hover:text-white transition-colors mb-8"
            >
              <ChevronLeft size={16} />
              {quizUi.backToSubjects}
            </button>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink dark:text-white mb-2">
              {subjectLabel(subject, ui, quizUi)}
            </h1>
            <p className="text-sm text-ink/40 dark:text-white/40 mb-8">{quizUi.difficultyPrompt}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {QUIZ_DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => pickDifficulty(d)}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl px-5 py-6 text-center shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <p className="font-display text-lg font-bold text-ink dark:text-white">{quizUi.difficulty[d]}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'quiz' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <button
              onClick={restart}
              className="flex items-center gap-1.5 text-sm text-ink/40 dark:text-white/40 hover:text-ink dark:hover:text-white transition-colors mb-8"
            >
              <ChevronLeft size={16} />
              {quizUi.backToSubjects}
            </button>

            {loadingQuestions && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Loader2 size={28} className="animate-spin text-[#4F7CFF] mb-4" />
                <p className="text-sm text-ink/50 dark:text-white/50">{quizUi.loadingQuestions}</p>
                <p className="text-xs text-ink/30 dark:text-white/30 mt-2">{quizUi.generatingNote}</p>
              </div>
            )}

            {!loadingQuestions && errorGenerating && (
              <div className="text-center py-24">
                <p className="text-sm text-ink/50 dark:text-white/50">{quizUi.errorGenerating}</p>
              </div>
            )}

            {!loadingQuestions && !errorGenerating && questions.length === 0 && (
              <div className="text-center py-24">
                <p className="text-sm text-ink/50 dark:text-white/50">{quizUi.noQuestionsAvailable}</p>
              </div>
            )}

            {!loadingQuestions && !errorGenerating && currentQuestion && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs font-semibold tracking-wide uppercase text-ink/40 dark:text-white/40">
                    {formatQuizString(quizUi.questionCounter, { current: currentIndex + 1, total: questions.length })}
                  </p>
                  <div className="flex-1 mx-4 h-1 rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${((currentIndex + 1) / questions.length) * 100}%`,
                        background: 'linear-gradient(90deg, #4F7CFF, #32D6A0)',
                      }}
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h2 className="font-display text-lg sm:text-xl font-bold text-ink dark:text-white mb-6 leading-snug">
                      {currentQuestion.question}
                    </h2>

                    <div className="space-y-2.5">
                      {currentQuestion.options.map((opt, i) => {
                        const selected = answers[currentQuestion.id] === i
                        return (
                          <button
                            key={i}
                            onClick={() => selectOption(currentQuestion.id, i)}
                            className={`w-full text-left rounded-xl border px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
                              selected
                                ? 'border-[#4F7CFF] bg-[#4F7CFF]/10 text-ink dark:text-white'
                                : 'border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.03] text-ink/70 dark:text-white/70 hover:border-black/20 dark:hover:border-white/20'
                            }`}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-end mt-8">
                  <button
                    onClick={goNext}
                    disabled={!hasAnsweredCurrent || submitting}
                    className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                    style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : currentIndex < questions.length - 1 ? (
                      <>
                        {quizUi.nextButton}
                        <ChevronRight size={16} />
                      </>
                    ) : (
                      quizUi.seeResultsButton
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {view === 'results' && results && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="text-center mb-10">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)' }}
              >
                <Trophy size={22} />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink dark:text-white mb-2">{quizUi.resultsTitle}</h1>
              <p className="text-sm text-ink/50 dark:text-white/50">
                {formatQuizString(quizUi.scoreLabel, { correct: results.correctCount, total: results.totalQuestions })}
              </p>
            </div>

            <p className="text-xs font-semibold tracking-wide uppercase text-ink/40 dark:text-white/40 mb-3">{quizUi.reviewTitle}</p>
            <div className="space-y-3 mb-10">
              {results.results.map((r) => (
                <div
                  key={r.questionId}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-5"
                >
                  <div className="flex items-start gap-2.5 mb-3">
                    {r.isCorrect ? (
                      <CheckCircle2 size={18} className="text-[#32D6A0] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm font-semibold text-ink dark:text-white leading-snug">{r.question}</p>
                  </div>
                  <p className="text-xs text-ink/50 dark:text-white/50 ml-[26px]">
                    {quizUi.yourAnswerLabel}: {r.options[r.selectedIndex]}
                  </p>
                  {!r.isCorrect && (
                    <p className="text-xs text-[#32D6A0] ml-[26px] mt-1">
                      {quizUi.correctAnswerLabel}: {r.options[r.correctIndex]}
                    </p>
                  )}
                  {r.explanation && <p className="text-xs text-ink/40 dark:text-white/40 ml-[26px] mt-2">{r.explanation}</p>}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => difficulty && pickDifficulty(difficulty)}
                className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105"
                style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
              >
                <RotateCcw size={16} />
                {quizUi.retryButton}
              </button>
              <button
                onClick={restart}
                className="rounded-full px-6 py-3 text-sm font-semibold text-ink/60 dark:text-white/60 border border-black/[0.06] dark:border-white/10 hover:text-ink dark:hover:text-white transition-colors"
              >
                {quizUi.backToSubjects}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
