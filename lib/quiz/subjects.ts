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

// SUBJECT-PURE QUIZ FIX (PHYGO Student Experience audit): the root cause of
// "I pick Anatomy and get Physiology/clinical questions" was that
// app/api/quiz/generate/route.ts only ever handed the model a bare subject
// KEY ('anatomy') plus a pile of content snippets that mix structural,
// functional and clinical text — nothing told the model where the boundary
// of that subject actually is, and nothing checked the output against it
// afterwards. An audit of the live quiz_questions table confirmed this
// concretely: of 30 questions tagged 'anatomy', 27 were actually asking
// about cardiopulmonary/endocrine/exercise physiology (MAP, VO2max, PTH,
// VA/Q ratio, etc.) with zero structural content — they were reclassified to
// their real subject in that same audit pass.
//
// This map is the fix's foundation: an explicit IN-SCOPE / OUT-OF-SCOPE
// description per subject, in Italian (the prompt itself is authored in
// Italian regardless of the quiz's target output language — this is an
// instruction TO the model, never shown to the student). It is consumed two
// places in app/api/quiz/generate/route.ts: (1) injected into the
// generation prompt as a hard constraint, and (2) reused verbatim by the
// post-generation subject-purity validation pass (GENERATE → SUBJECT SCOPE
// CHECK → APPROVE/REJECT), so generation and validation can never silently
// drift apart by describing the same subject two different ways.
export type QuizSubjectScope = { inScope: string; outOfScope: string }

export const QUIZ_SUBJECT_SCOPES: Record<QuizSubject, QuizSubjectScope> = {
  anatomy: {
    inScope:
      'Anatomia pura, di qualunque sistema corporeo: struttura, forma, posizione, origine/inserzione, rapporti anatomici, decorso, nomenclatura di ossa, muscoli, articolazioni, organi, vasi, nervi.',
    outOfScope:
      'Funzione fisiologica, meccanismi di regolazione, valori normali/di laboratorio, fisiologia dell\'esercizio, gestione clinica di patologie, riabilitazione — anche se riguardano una struttura anatomica nominata sopra, quelle domande appartengono ad altre materie (physiology, sportsMedicine, o il sistema corporeo specifico), non ad anatomy.',
  },
  neurology: {
    inScope:
      'Sistema nervoso centrale e periferico: anatomia neurologica, nervi cranici, vie/pathway, esame neurologico, riflessi, test clinici neurologici, patologie neurologiche.',
    outOfScope: 'Altri sistemi corporei non nervosi; fisiologia generale non neurologica.',
  },
  physiology: {
    inScope:
      'Meccanismi funzionali generali del corpo umano che non sono già coperti da un sistema corporeo specifico più mirato (es. principi generali di omeostasi, membrane, meccanica muscolare di base).',
    outOfScope:
      'Domande puramente di nomenclatura/localizzazione anatomica senza alcun meccanismo; fisiologia specifica di un sistema che ha una propria materia dedicata (cardiopulmonary, endocrine, urinary, gastrointestinal, immune, hematology); fisiologia dell\'esercizio/allenamento (sportsMedicine); gestione clinica.',
  },
  sportsMedicine: {
    inScope:
      'Fisiologia dell\'esercizio e della performance, allenamento, test da sforzo, adattamenti cardiovascolari/metabolici/muscolari all\'attività fisica, infortuni sportivi, biomeccanica del movimento sportivo.',
    outOfScope: 'Anatomia pura senza legame con esercizio/movimento; fisiologia a riposo non legata allo sport o all\'allenamento.',
  },
  cardiopulmonary: {
    inScope:
      'Sistema cardiovascolare e respiratorio: anatomia cardiopolmonare, fisiologia (emodinamica, meccanica respiratoria, scambi gassosi), patologie cardiache/respiratorie, test e riabilitazione cardiopolmonare.',
    outOfScope: 'Altri sistemi corporei (endocrino, renale, digerente, nervoso, ecc.) anche quando interagiscono col sistema cardiopolmonare.',
  },
  endocrine: {
    inScope: 'Sistema endocrino: ghiandole, ormoni, assi di regolazione ormonale, patologie endocrine e metaboliche.',
    outOfScope: 'Altri sistemi corporei, anche quando un ormone agisce su di essi (es. un ormone che agisce sul rene resta endocrine, non urinary).',
  },
  urinary: {
    inScope: 'Sistema urinario/renale: anatomia, fisiologia della filtrazione ed escrezione, equilibrio idroelettrolitico renale, patologie renali/urinarie.',
    outOfScope: 'Regolazione ormonale del rene ad opera di altri sistemi (endocrine); altri sistemi corporei.',
  },
  gastrointestinal: {
    inScope: 'Sistema digerente: anatomia, fisiologia della digestione/assorbimento, patologie gastrointestinali.',
    outOfScope: 'Altri sistemi corporei.',
  },
  immune: {
    inScope: 'Sistema immunitario: anatomia linfatica/immunitaria, fisiologia della risposta immunitaria, patologie immunitarie e infettive.',
    outOfScope: 'Altri sistemi corporei; oncologia (materia a sé, anche se il sistema immunitario è coinvolto nella sorveglianza tumorale).',
  },
  hematology: {
    inScope: 'Sangue ed emopoiesi: componenti ematici, coagulazione, gruppi sanguigni, patologie ematologiche.',
    outOfScope: 'Trasporto di gas nel sangue legato alla meccanica respiratoria (cardiopulmonary); altri sistemi corporei.',
  },
  oncology: {
    inScope: 'Oncologia: biologia del cancro, cancerogenesi, tipi di tumore, stadiazione, gestione clinica oncologica, riabilitazione oncologica.',
    outOfScope: 'Patologie non oncologiche di altri sistemi.',
  },
  pelvicFloor: {
    inScope: 'Pavimento pelvico: anatomia, fisiologia, disfunzioni, valutazione e riabilitazione del pavimento pelvico.',
    outOfScope: 'Altri sistemi corporei.',
  },
}

// Re-exported here (rather than importing AppLang directly at every call
// site) so every quiz file that needs "is this a valid question language"
// goes through one function.
export type QuizLanguage = AppLang
export const QUIZ_LANGUAGES: QuizLanguage[] = APP_LANGS
export function isQuizLanguage(v: string): v is QuizLanguage {
  return (APP_LANGS as string[]).includes(v)
}
