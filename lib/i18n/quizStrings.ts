// Small, additive dictionary for the new student-facing Quiz feature — same
// convention as libraryNavStrings.ts / workspaceStrings.ts: its own file
// rather than the large shared lib/i18n/uiStrings.ts.
//
// This UI chrome AND the quiz questions themselves are both fully IT/EN/ES/FR:
// /api/quiz/generate now generates (and caches) questions directly in
// whichever site language the student is using, grounded in PHYGO's own
// Italian content tables but written out in the target language.
'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { AppLang } from '@/lib/i18n/uiStrings'

interface QuizDict {
  navLabel: string
  pageTitle: string
  pageSubtitle: string
  // Only 'anatomy' needs its own label here — every other subject key
  // already has a label in the shared ui.libraryLinks dictionary and is
  // read from there instead, to avoid maintaining the same translation
  // twice (see getQuizSubjectLabel in app/dashboard/quiz/page.tsx).
  subjects: { anatomy: string }
  difficulty: { easy: string; medium: string; hard: string }
  difficultyPrompt: string
  startButton: string
  backToSubjects: string
  questionCounter: string // use {current} and {total} placeholders
  submitButton: string
  nextButton: string
  seeResultsButton: string
  retryButton: string
  loadingQuestions: string
  generatingNote: string
  errorGenerating: string
  noQuestionsAvailable: string
  resultsTitle: string
  scoreLabel: string // use {correct} and {total} placeholders
  reviewTitle: string
  yourAnswerLabel: string
  correctAnswerLabel: string
  progressTitle: string
  attemptsLabel: string // use {count} placeholder
  bestScoreLabel: string // use {percent} placeholder
  noAttemptsYet: string
}

const it: QuizDict = {
  navLabel: 'Quiz',
  pageTitle: 'Quiz PHYGO',
  pageSubtitle: 'Mettiti alla prova sulle materie fondamentali, con domande generate dai contenuti PHYGO.',
  subjects: { anatomy: 'Anatomia' },
  difficulty: { easy: 'Facile', medium: 'Medio', hard: 'Difficile' },
  difficultyPrompt: 'Scegli il livello',
  startButton: 'Inizia il quiz',
  backToSubjects: 'Torna alle materie',
  questionCounter: 'Domanda {current} di {total}',
  submitButton: 'Rispondi',
  nextButton: 'Domanda successiva',
  seeResultsButton: 'Vedi i risultati',
  retryButton: 'Riprova',
  loadingQuestions: 'Preparazione delle domande…',
  generatingNote: 'La prima volta su una materia può richiedere qualche secondo in più.',
  errorGenerating: 'Non è stato possibile generare le domande. Riprova tra poco.',
  noQuestionsAvailable: 'Nessuna domanda disponibile al momento per questa materia.',
  resultsTitle: 'Risultato',
  scoreLabel: 'Hai risposto correttamente a {correct} domande su {total}.',
  reviewTitle: 'Rivedi le risposte',
  yourAnswerLabel: 'La tua risposta',
  correctAnswerLabel: 'Risposta corretta',
  progressTitle: 'I tuoi progressi',
  attemptsLabel: '{count} tentativi',
  bestScoreLabel: 'Miglior punteggio: {percent}%',
  noAttemptsYet: 'Non hai ancora completato quiz in questa materia.',
}

const en: QuizDict = {
  navLabel: 'Quiz',
  pageTitle: 'PHYGO Quizzes',
  pageSubtitle: 'Test yourself on the foundational subjects, with questions generated from PHYGO content.',
  subjects: { anatomy: 'Anatomy' },
  difficulty: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
  difficultyPrompt: 'Choose a level',
  startButton: 'Start quiz',
  backToSubjects: 'Back to subjects',
  questionCounter: 'Question {current} of {total}',
  submitButton: 'Answer',
  nextButton: 'Next question',
  seeResultsButton: 'See results',
  retryButton: 'Try again',
  loadingQuestions: 'Preparing questions…',
  generatingNote: 'The first time on a subject can take a few extra seconds.',
  errorGenerating: "Couldn't generate questions. Please try again shortly.",
  noQuestionsAvailable: 'No questions available for this subject right now.',
  resultsTitle: 'Result',
  scoreLabel: 'You answered {correct} out of {total} questions correctly.',
  reviewTitle: 'Review your answers',
  yourAnswerLabel: 'Your answer',
  correctAnswerLabel: 'Correct answer',
  progressTitle: 'Your progress',
  attemptsLabel: '{count} attempts',
  bestScoreLabel: 'Best score: {percent}%',
  noAttemptsYet: "You haven't completed any quizzes in this subject yet.",
}

const es: QuizDict = {
  navLabel: 'Quiz',
  pageTitle: 'Quiz de PHYGO',
  pageSubtitle: 'Ponte a prueba en las materias fundamentales, con preguntas generadas a partir de los contenidos de PHYGO.',
  subjects: { anatomy: 'Anatomía' },
  difficulty: { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' },
  difficultyPrompt: 'Elige el nivel',
  startButton: 'Iniciar quiz',
  backToSubjects: 'Volver a las materias',
  questionCounter: 'Pregunta {current} de {total}',
  submitButton: 'Responder',
  nextButton: 'Siguiente pregunta',
  seeResultsButton: 'Ver resultados',
  retryButton: 'Volver a intentar',
  loadingQuestions: 'Preparando las preguntas…',
  generatingNote: 'La primera vez en una materia puede tardar unos segundos más.',
  errorGenerating: 'No se han podido generar las preguntas. Inténtalo de nuevo en un momento.',
  noQuestionsAvailable: 'No hay preguntas disponibles para esta materia por ahora.',
  resultsTitle: 'Resultado',
  scoreLabel: 'Has respondido correctamente a {correct} de {total} preguntas.',
  reviewTitle: 'Revisa tus respuestas',
  yourAnswerLabel: 'Tu respuesta',
  correctAnswerLabel: 'Respuesta correcta',
  progressTitle: 'Tu progreso',
  attemptsLabel: '{count} intentos',
  bestScoreLabel: 'Mejor puntuación: {percent}%',
  noAttemptsYet: 'Todavía no has completado ningún quiz en esta materia.',
}

const fr: QuizDict = {
  navLabel: 'Quiz',
  pageTitle: 'Quiz PHYGO',
  pageSubtitle: 'Teste tes connaissances sur les matières fondamentales, avec des questions générées à partir des contenus PHYGO.',
  subjects: { anatomy: 'Anatomie' },
  difficulty: { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' },
  difficultyPrompt: 'Choisis un niveau',
  startButton: 'Commencer le quiz',
  backToSubjects: 'Retour aux matières',
  questionCounter: 'Question {current} sur {total}',
  submitButton: 'Répondre',
  nextButton: 'Question suivante',
  seeResultsButton: 'Voir les résultats',
  retryButton: 'Réessayer',
  loadingQuestions: 'Préparation des questions…',
  generatingNote: 'La première fois sur une matière peut prendre quelques secondes de plus.',
  errorGenerating: "Impossible de générer les questions. Réessaie dans un instant.",
  noQuestionsAvailable: 'Aucune question disponible pour cette matière pour le moment.',
  resultsTitle: 'Résultat',
  scoreLabel: 'Tu as répondu correctement à {correct} question(s) sur {total}.',
  reviewTitle: 'Revois tes réponses',
  yourAnswerLabel: 'Ta réponse',
  correctAnswerLabel: 'Bonne réponse',
  progressTitle: 'Tes progrès',
  attemptsLabel: '{count} tentatives',
  bestScoreLabel: 'Meilleur score : {percent}%',
  noAttemptsYet: "Tu n'as pas encore terminé de quiz dans cette matière.",
}

export const QUIZ_STRINGS: Record<AppLang, QuizDict> = { it, en, es, fr }

export function useQuizUi() {
  const { lang } = useLanguage()
  return QUIZ_STRINGS[lang]
}

// Tiny helper for the "{placeholder}" substitutions used above (kept local
// to avoid pulling in a full i18n templating library for a handful of strings).
export function formatQuizString(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match))
}
