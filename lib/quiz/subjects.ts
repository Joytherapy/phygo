// Shared, client-safe list of Quiz subjects — just the keys, no DB access
// (the actual content-sourcing per subject, which needs the service-role
// client, lives server-side in app/api/quiz/generate/route.ts). Labels come
// from lib/i18n/quizStrings.ts, keyed by these same strings.
//
// Question language reuses the site's own AppLang list (lib/i18n/uiStrings.ts)
// rather than a separate one — quiz questions are now generated in whichever
// of the four site languages the student is using, same as every other
// PHYGO string.
import { APP_LANGS, type AppLang } from '@/lib/i18n/uiStrings'
//
// Picked deliberately narrower than the full 16-section Library list (see
// components/LibraryNavMenu.tsx): only subjects backed by a real,
// rich-enough text source to ground auto-generated questions in — no
// first-aid/BLSD procedural checklists or the bare clinical-tools page.
// 'anatomy' and 'neurology' cover the two foundational subjects named
// explicitly; 'physiology' and 'sportsMedicine' (movement/biomechanics —
// physiology_concepts and sports_medicine_concepts are the closest existing
// content tables to "biomeccanica", there being no dedicated biomechanics
// table in PHYGO today) round out the foundational set, then the 8 body
// systems already wired for the Smart Study Panel's own matching.
export const QUIZ_SUBJECTS = [
  'anatomy',
  'neurology',
  'physiology',
  'sportsMedicine',
  'cardiopulmonary',
  'endocrine',
  'urinary',
  'gastrointestinal',
  'immune',
  'hematology',
  'oncology',
  'pelvicFloor',
] as const

export type QuizSubject = (typeof QUIZ_SUBJECTS)[number]
export type QuizDifficulty = 'easy' | 'medium' | 'hard'
export const QUIZ_DIFFICULTIES: QuizDifficulty[] = ['easy', 'medium', 'hard']

export function isQuizSubject(v: string): v is QuizSubject {
  return (QUIZ_SUBJECTS as readonly string[]).includes(v)
}
export function isQuizDifficulty(v: string): v is QuizDifficulty {
  return QUIZ_DIFFICULTIES.includes(v as QuizDifficulty)
}

// Re-exported here (rather than importing AppLang directly at every call
// site) so every quiz file that needs "is this a valid question language"
// goes through one function.
export type QuizLanguage = AppLang
export const QUIZ_LANGUAGES: QuizLanguage[] = APP_LANGS
export function isQuizLanguage(v: string): v is QuizLanguage {
  return (APP_LANGS as string[]).includes(v)
}
