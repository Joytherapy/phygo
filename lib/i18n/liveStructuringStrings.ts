// Session notes panel (components/liveStructuring/LiveStructuring.tsx): the
// dictation/typing flow, the structured note, clinical support blocks and the
// exported PDF, in the four app languages. Kept as its own file, like
// homeStrings.ts and agendaStrings.ts.
'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { AppLang } from '@/lib/i18n/uiStrings'

interface LiveDict {
  ready: string
  listening: string
  analyzing: string
  generating: string
  completedIn: (seconds: string) => string
  liveSession: string
  aiDemo: string
  recordingLanguage: string
  intro: string
  introHero: string
  startSpeaking: string
  noteError: string
  docReady: string
  docReadyBody: string
  downloadPdf: string
  saving: string
  saved: string
  saveError: string
  saveToPatient: string
  reviewHint: string
  categories: { findings: string; assessment: string; plan: string; followup: string }
  clinicalReasoning: string
  hypotheses: string
  differentials: string
  supportingFindings: string
  findingsAgainst: string
  missingInfo: string
  suggestedAssessments: string
  redFlagsPrecautions: string
  reasoningDisclaimer: string
  clinicalInsights: string
  evidenceStrong: string
  evidenceModerate: string
  goals: string
  clinicalTests: string
  redFlags: string
  typicalExercises: string
  insightDisclaimer: string
  whySuggestion: string
  whyBecause: (keyword: string) => string
  askMore: string
  askPlaceholder: string
  thinking: string
  ask: string
  askLimit: string
  askNoAnswer: string
  askError: string
  evidenceTitle: string
  evidenceSearching: string
  evidenceNone: string
  whyRelevant: string
  viewSource: string
  evidenceDisclaimer: string
  exercises: string
  cancel: string
  addExercise: string
  searchExercises: string
  searching: string
  noExercises: string
  noImage: string
  sets: (n: number) => string
  reps: (n: number) => string
  perWeek: (n: number) => string
  customExercise: string
  hideDetails: string
  howTo: string
  setsLabel: string
  repsLabel: string
  durationLabel: string
  freqLabel: string
  notesLabel: string
  done: string
  editExercise: string
  removeExercise: string
  rehabProtocol: string
  phase: (n: number) => string
  phaseGoals: string
  phaseExercises: string
  progressWhen: string
  examples: string
  startRecording: string
  stopRecording: string
  voiceChrome: string
  writeInstead: string
  contextPlaceholder: string
  multiFileTip: string
  uploadScan: string
  uploadAfterNote: string
  files: (names: string[]) => string
  analyzingDoc: string
  docSummary: string
  scanError: string
  writePlaceholder: string
  generateNote: string
  pdfTitle: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  patientSummary: string
  source: string
}

const it: LiveDict = {
  ready: 'Pronto',
  listening: 'In ascolto…',
  analyzing: 'Analisi della conversazione…',
  generating: 'Creazione della nota clinica…',
  completedIn: (s) => `Completata in ${s} s`,
  liveSession: 'Seduta dal vivo',
  aiDemo: 'Esempio',
  recordingLanguage: 'Lingua della dettatura',
  intro: 'Parla in modo naturale: PHYGO organizza la nota per te.',
  introHero: 'Guarda come una visita diventa documentazione strutturata.',
  startSpeaking: 'Inizia a parlare: PHYGO trascrive in tempo reale.',
  noteError: 'Non sono riuscito a generare la nota clinica. Riprova.',
  docReady: 'Nota pronta',
  docReadyBody: 'Nota SOAP, piano di trattamento e sintesi per il paziente.',
  downloadPdf: 'Scarica PDF',
  saving: 'Salvataggio…',
  saved: 'Salvata nella scheda',
  saveError: 'Non salvata: riprova',
  saveToPatient: 'Salva nella scheda',
  reviewHint: 'Rivedi nota ed esercizi, modifica ciò che vuoi, poi salva nella scheda del paziente.',
  categories: { findings: 'Rilievi', assessment: 'Valutazione', plan: 'Piano', followup: 'Follow-up' },
  clinicalReasoning: 'Ragionamento clinico',
  hypotheses: 'Ipotesi cliniche',
  differentials: 'Diagnosi differenziali da considerare',
  supportingFindings: 'Elementi a favore',
  findingsAgainst: 'Elementi contrari',
  missingInfo: 'Informazioni mancanti',
  suggestedAssessments: 'Valutazioni aggiuntive suggerite',
  redFlagsPrecautions: 'Red flag / precauzioni',
  reasoningDisclaimer: 'Supporto alla decisione clinica, non una diagnosi autonoma. Giudizio e decisioni finali restano al professionista.',
  clinicalInsights: 'Spunti clinici',
  evidenceStrong: 'Evidenza forte',
  evidenceModerate: 'Evidenza moderata',
  goals: 'Obiettivi',
  clinicalTests: 'Test clinici',
  redFlags: 'Red flag',
  typicalExercises: 'Esercizi tipici',
  insightDisclaimer: 'Supporto alla decisione clinica, non una diagnosi.',
  whySuggestion: 'Perché questo suggerimento?',
  whyBecause: (k) => `Suggerito perché la nota cita: "${k}"`,
  askMore: 'Chiedi approfondimenti a PHYGO',
  askPlaceholder: 'Es. cos’altro dovrei considerare in questo caso?',
  thinking: 'Sto pensando…',
  ask: 'Chiedi',
  askLimit: 'Hai raggiunto il limite di domande per questa ora. Riprova più tardi o passa a un piano superiore.',
  askNoAnswer: 'Non sono riuscito a generare una risposta.',
  askError: 'Errore durante la richiesta. Riprova.',
  evidenceTitle: 'Evidenze scientifiche pertinenti',
  evidenceSearching: 'Ricerca nella libreria delle evidenze…',
  evidenceNone: 'Nessuno studio pubblicato nella libreria Science di PHYGO corrisponde a questo caso.',
  whyRelevant: 'Perché è pertinente: ',
  viewSource: 'Vedi la fonte',
  evidenceDisclaimer: 'La presenza di uno studio non convalida da sola un trattamento: il giudizio clinico resta al professionista.',
  exercises: 'Esercizi',
  cancel: 'Annulla',
  addExercise: 'Aggiungi esercizio',
  searchExercises: 'Cerca esercizi (es. plank, ponte, squat)…',
  searching: 'Ricerca…',
  noExercises: 'Nessun esercizio trovato.',
  noImage: 'Nessuna immagine',
  sets: (n) => `${n} serie`,
  reps: (n) => `${n} ripetizioni`,
  perWeek: (n) => `${n} volte/settimana`,
  customExercise: 'Esercizio personalizzato',
  hideDetails: 'Nascondi dettagli',
  howTo: 'Come si esegue',
  setsLabel: 'Serie',
  repsLabel: 'Ripetizioni',
  durationLabel: 'Durata (s)',
  freqLabel: 'Volte/settimana',
  notesLabel: 'Note',
  done: 'Fatto',
  editExercise: 'Modifica esercizio',
  removeExercise: 'Rimuovi esercizio',
  rehabProtocol: 'Protocollo riabilitativo',
  phase: (n) => `Fase ${n}`,
  phaseGoals: 'Obiettivi: ',
  phaseExercises: 'Esercizi: ',
  progressWhen: 'Si avanza quando: ',
  examples: 'Esempi',
  startRecording: 'Inizia a dettare',
  stopRecording: 'Ferma la dettatura',
  voiceChrome: 'La dettatura vocale funziona meglio in Chrome.',
  writeInstead: 'Scrivi',
  contextPlaceholder: 'Contesto clinico (facoltativo): es. sospetta artrosi, trauma acuto',
  multiFileTip: 'Suggerimento: seleziona più file insieme (Cmd o Ctrl) per analizzarli come un unico caso.',
  uploadScan: 'Carica referto',
  uploadAfterNote: 'Disponibile dopo aver generato la nota',
  files: (names) => (names.length === 1 ? `1 file: ${names[0]}` : `${names.length} file: ${names.join(', ')}`),
  analyzingDoc: 'Analisi del documento…',
  docSummary: 'Sintesi del documento',
  scanError: 'Non è stato possibile analizzare il documento.',
  writePlaceholder: 'Scrivi qui le tue osservazioni sulla seduta…',
  generateNote: 'Genera nota',
  pdfTitle: 'Nota clinica - PHYGO',
  subjective: 'Soggettivo',
  objective: 'Oggettivo',
  assessment: 'Valutazione',
  plan: 'Piano',
  patientSummary: 'Sintesi per il paziente',
  source: 'Fonte',
}

const en: LiveDict = {
  ready: 'Ready',
  listening: 'Listening…',
  analyzing: 'Analyzing the conversation…',
  generating: 'Writing the clinical note…',
  completedIn: (s) => `Completed in ${s}s`,
  liveSession: 'Live session',
  aiDemo: 'Example',
  recordingLanguage: 'Dictation language',
  intro: 'Speak naturally: PHYGO organizes the note for you.',
  introHero: 'Watch a consultation turn into structured documentation.',
  startSpeaking: 'Start speaking: PHYGO transcribes in real time.',
  noteError: 'The clinical note could not be generated. Please try again.',
  docReady: 'Note ready',
  docReadyBody: 'SOAP note, treatment plan and patient summary.',
  downloadPdf: 'Download PDF',
  saving: 'Saving…',
  saved: 'Saved to the record',
  saveError: 'Not saved: try again',
  saveToPatient: 'Save to the record',
  reviewHint: 'Review the note and exercises, edit anything you like, then save to the patient’s record.',
  categories: { findings: 'Findings', assessment: 'Assessment', plan: 'Plan', followup: 'Follow-up' },
  clinicalReasoning: 'Clinical reasoning',
  hypotheses: 'Clinical hypotheses',
  differentials: 'Differential considerations',
  supportingFindings: 'Supporting findings',
  findingsAgainst: 'Findings against',
  missingInfo: 'Missing information',
  suggestedAssessments: 'Suggested additional assessments',
  redFlagsPrecautions: 'Red flags / precautions',
  reasoningDisclaimer: 'Clinical decision support only, not an autonomous diagnosis. Clinical judgment and final decisions remain with the treating professional.',
  clinicalInsights: 'Clinical insights',
  evidenceStrong: 'Strong evidence',
  evidenceModerate: 'Moderate evidence',
  goals: 'Goals',
  clinicalTests: 'Clinical tests',
  redFlags: 'Red flags',
  typicalExercises: 'Typical exercises',
  insightDisclaimer: 'Clinical decision support, not a diagnosis.',
  whySuggestion: 'Why this suggestion?',
  whyBecause: (k) => `Suggested because the note mentions: "${k}"`,
  askMore: 'Ask PHYGO for more insight',
  askPlaceholder: 'e.g. What else should I consider for this case?',
  thinking: 'Thinking…',
  ask: 'Ask',
  askLimit: 'You have reached the question limit for this hour. Try again later or upgrade your plan.',
  askNoAnswer: 'An answer could not be generated.',
  askError: 'The request failed. Please try again.',
  evidenceTitle: 'Relevant scientific evidence',
  evidenceSearching: 'Searching the evidence library…',
  evidenceNone: 'No published paper in the PHYGO Science library matches this case.',
  whyRelevant: 'Why it’s relevant: ',
  viewSource: 'View source',
  evidenceDisclaimer: 'Showing a paper here does not by itself validate a treatment: clinical judgment remains with the treating professional.',
  exercises: 'Exercises',
  cancel: 'Cancel',
  addExercise: 'Add exercise',
  searchExercises: 'Search exercises (e.g. plank, bridge, squat)…',
  searching: 'Searching…',
  noExercises: 'No exercises found.',
  noImage: 'No image',
  sets: (n) => `${n} sets`,
  reps: (n) => `${n} reps`,
  perWeek: (n) => `${n}x/week`,
  customExercise: 'Custom exercise',
  hideDetails: 'Hide details',
  howTo: 'How to do it',
  setsLabel: 'Sets',
  repsLabel: 'Reps',
  durationLabel: 'Duration (s)',
  freqLabel: 'Times/week',
  notesLabel: 'Notes',
  done: 'Done',
  editExercise: 'Edit exercise',
  removeExercise: 'Remove exercise',
  rehabProtocol: 'Rehab protocol',
  phase: (n) => `Phase ${n}`,
  phaseGoals: 'Goals: ',
  phaseExercises: 'Exercises: ',
  progressWhen: 'Progress when: ',
  examples: 'Examples',
  startRecording: 'Start dictating',
  stopRecording: 'Stop dictating',
  voiceChrome: 'Voice dictation works best in Chrome.',
  writeInstead: 'Write',
  contextPlaceholder: 'Clinical context (optional): e.g. suspected osteoarthritis, acute trauma',
  multiFileTip: 'Tip: select several files together (Cmd or Ctrl) to analyze them as one case.',
  uploadScan: 'Upload report',
  uploadAfterNote: 'Available after generating the note',
  files: (names) => (names.length === 1 ? `1 file: ${names[0]}` : `${names.length} files: ${names.join(', ')}`),
  analyzingDoc: 'Analyzing the document…',
  docSummary: 'Document summary',
  scanError: 'The document could not be analyzed.',
  writePlaceholder: 'Write your observations about the session here…',
  generateNote: 'Generate note',
  pdfTitle: 'Clinical note - PHYGO',
  subjective: 'Subjective',
  objective: 'Objective',
  assessment: 'Assessment',
  plan: 'Plan',
  patientSummary: 'Patient summary',
  source: 'Source',
}

const es: LiveDict = {
  ready: 'Listo',
  listening: 'Escuchando…',
  analyzing: 'Analizando la conversación…',
  generating: 'Redactando la nota clínica…',
  completedIn: (s) => `Completada en ${s} s`,
  liveSession: 'Sesión en directo',
  aiDemo: 'Ejemplo',
  recordingLanguage: 'Idioma del dictado',
  intro: 'Habla con naturalidad: PHYGO organiza la nota por ti.',
  introHero: 'Mira cómo una consulta se convierte en documentación estructurada.',
  startSpeaking: 'Empieza a hablar: PHYGO transcribe en tiempo real.',
  noteError: 'No se pudo generar la nota clínica. Inténtalo de nuevo.',
  docReady: 'Nota lista',
  docReadyBody: 'Nota SOAP, plan de tratamiento y resumen para el paciente.',
  downloadPdf: 'Descargar PDF',
  saving: 'Guardando…',
  saved: 'Guardada en la ficha',
  saveError: 'No guardada: inténtalo de nuevo',
  saveToPatient: 'Guardar en la ficha',
  reviewHint: 'Revisa la nota y los ejercicios, modifica lo que quieras y guárdala en la ficha del paciente.',
  categories: { findings: 'Hallazgos', assessment: 'Valoración', plan: 'Plan', followup: 'Seguimiento' },
  clinicalReasoning: 'Razonamiento clínico',
  hypotheses: 'Hipótesis clínicas',
  differentials: 'Diagnósticos diferenciales a considerar',
  supportingFindings: 'Hallazgos a favor',
  findingsAgainst: 'Hallazgos en contra',
  missingInfo: 'Información que falta',
  suggestedAssessments: 'Valoraciones adicionales sugeridas',
  redFlagsPrecautions: 'Banderas rojas / precauciones',
  reasoningDisclaimer: 'Apoyo a la decisión clínica, no un diagnóstico autónomo. El juicio y las decisiones finales corresponden al profesional.',
  clinicalInsights: 'Claves clínicas',
  evidenceStrong: 'Evidencia sólida',
  evidenceModerate: 'Evidencia moderada',
  goals: 'Objetivos',
  clinicalTests: 'Pruebas clínicas',
  redFlags: 'Banderas rojas',
  typicalExercises: 'Ejercicios habituales',
  insightDisclaimer: 'Apoyo a la decisión clínica, no un diagnóstico.',
  whySuggestion: '¿Por qué esta sugerencia?',
  whyBecause: (k) => `Sugerido porque la nota menciona: "${k}"`,
  askMore: 'Pide más detalles a PHYGO',
  askPlaceholder: 'Ej. ¿qué más debería considerar en este caso?',
  thinking: 'Pensando…',
  ask: 'Preguntar',
  askLimit: 'Has alcanzado el límite de preguntas de esta hora. Inténtalo más tarde o cambia a un plan superior.',
  askNoAnswer: 'No se pudo generar una respuesta.',
  askError: 'Error en la solicitud. Inténtalo de nuevo.',
  evidenceTitle: 'Evidencia científica relevante',
  evidenceSearching: 'Buscando en la biblioteca de evidencia…',
  evidenceNone: 'Ningún estudio publicado en la biblioteca Science de PHYGO coincide con este caso.',
  whyRelevant: 'Por qué es relevante: ',
  viewSource: 'Ver la fuente',
  evidenceDisclaimer: 'Que aparezca un estudio no valida por sí solo un tratamiento: el juicio clínico corresponde al profesional.',
  exercises: 'Ejercicios',
  cancel: 'Cancelar',
  addExercise: 'Añadir ejercicio',
  searchExercises: 'Buscar ejercicios (p. ej. plancha, puente, sentadilla)…',
  searching: 'Buscando…',
  noExercises: 'No se encontraron ejercicios.',
  noImage: 'Sin imagen',
  sets: (n) => `${n} series`,
  reps: (n) => `${n} repeticiones`,
  perWeek: (n) => `${n} veces/semana`,
  customExercise: 'Ejercicio personalizado',
  hideDetails: 'Ocultar detalles',
  howTo: 'Cómo se hace',
  setsLabel: 'Series',
  repsLabel: 'Repeticiones',
  durationLabel: 'Duración (s)',
  freqLabel: 'Veces/semana',
  notesLabel: 'Notas',
  done: 'Hecho',
  editExercise: 'Editar ejercicio',
  removeExercise: 'Quitar ejercicio',
  rehabProtocol: 'Protocolo de rehabilitación',
  phase: (n) => `Fase ${n}`,
  phaseGoals: 'Objetivos: ',
  phaseExercises: 'Ejercicios: ',
  progressWhen: 'Se avanza cuando: ',
  examples: 'Ejemplos',
  startRecording: 'Empezar a dictar',
  stopRecording: 'Detener el dictado',
  voiceChrome: 'El dictado por voz funciona mejor en Chrome.',
  writeInstead: 'Escribir',
  contextPlaceholder: 'Contexto clínico (opcional): p. ej. sospecha de artrosis, traumatismo agudo',
  multiFileTip: 'Consejo: selecciona varios archivos a la vez (Cmd o Ctrl) para analizarlos como un único caso.',
  uploadScan: 'Subir informe',
  uploadAfterNote: 'Disponible después de generar la nota',
  files: (names) => (names.length === 1 ? `1 archivo: ${names[0]}` : `${names.length} archivos: ${names.join(', ')}`),
  analyzingDoc: 'Analizando el documento…',
  docSummary: 'Resumen del documento',
  scanError: 'No se pudo analizar el documento.',
  writePlaceholder: 'Escribe aquí tus observaciones sobre la sesión…',
  generateNote: 'Generar nota',
  pdfTitle: 'Nota clínica - PHYGO',
  subjective: 'Subjetivo',
  objective: 'Objetivo',
  assessment: 'Valoración',
  plan: 'Plan',
  patientSummary: 'Resumen para el paciente',
  source: 'Fuente',
}

const fr: LiveDict = {
  ready: 'Prêt',
  listening: 'Écoute en cours…',
  analyzing: 'Analyse de la conversation…',
  generating: 'Rédaction de la note clinique…',
  completedIn: (s) => `Terminée en ${s} s`,
  liveSession: 'Séance en direct',
  aiDemo: 'Exemple',
  recordingLanguage: 'Langue de la dictée',
  intro: 'Parlez naturellement : PHYGO organise la note pour vous.',
  introHero: 'Voyez une consultation devenir une documentation structurée.',
  startSpeaking: 'Commencez à parler : PHYGO transcrit en temps réel.',
  noteError: "La note clinique n'a pas pu être générée. Réessayez.",
  docReady: 'Note prête',
  docReadyBody: 'Note SOAP, plan de traitement et résumé pour le patient.',
  downloadPdf: 'Télécharger le PDF',
  saving: 'Enregistrement…',
  saved: 'Enregistrée dans le dossier',
  saveError: 'Non enregistrée : réessayez',
  saveToPatient: 'Enregistrer dans le dossier',
  reviewHint: 'Relisez la note et les exercices, modifiez ce que vous voulez, puis enregistrez dans le dossier du patient.',
  categories: { findings: 'Constats', assessment: 'Évaluation', plan: 'Plan', followup: 'Suivi' },
  clinicalReasoning: 'Raisonnement clinique',
  hypotheses: 'Hypothèses cliniques',
  differentials: 'Diagnostics différentiels à envisager',
  supportingFindings: 'Éléments en faveur',
  findingsAgainst: 'Éléments en défaveur',
  missingInfo: 'Informations manquantes',
  suggestedAssessments: 'Évaluations complémentaires suggérées',
  redFlagsPrecautions: "Drapeaux rouges / précautions",
  reasoningDisclaimer: "Aide à la décision clinique, pas un diagnostic autonome. Le jugement et les décisions finales restent au professionnel.",
  clinicalInsights: 'Repères cliniques',
  evidenceStrong: 'Niveau de preuve élevé',
  evidenceModerate: 'Niveau de preuve modéré',
  goals: 'Objectifs',
  clinicalTests: 'Tests cliniques',
  redFlags: 'Drapeaux rouges',
  typicalExercises: 'Exercices habituels',
  insightDisclaimer: "Aide à la décision clinique, pas un diagnostic.",
  whySuggestion: 'Pourquoi cette suggestion ?',
  whyBecause: (k) => `Suggéré car la note mentionne : « ${k} »`,
  askMore: 'Demander plus de détails à PHYGO',
  askPlaceholder: 'Ex. Que devrais-je envisager d’autre dans ce cas ?',
  thinking: 'Réflexion…',
  ask: 'Demander',
  askLimit: 'Vous avez atteint la limite de questions pour cette heure. Réessayez plus tard ou passez à une offre supérieure.',
  askNoAnswer: "Aucune réponse n'a pu être générée.",
  askError: 'La demande a échoué. Réessayez.',
  evidenceTitle: 'Données scientifiques pertinentes',
  evidenceSearching: 'Recherche dans la bibliothèque de données probantes…',
  evidenceNone: 'Aucune étude publiée dans la bibliothèque Science de PHYGO ne correspond à ce cas.',
  whyRelevant: 'Pourquoi c’est pertinent : ',
  viewSource: 'Voir la source',
  evidenceDisclaimer: "La présence d'une étude ne valide pas à elle seule un traitement : le jugement clinique reste au professionnel.",
  exercises: 'Exercices',
  cancel: 'Annuler',
  addExercise: 'Ajouter un exercice',
  searchExercises: 'Rechercher des exercices (ex. gainage, pont, squat)…',
  searching: 'Recherche…',
  noExercises: 'Aucun exercice trouvé.',
  noImage: "Pas d'image",
  sets: (n) => `${n} séries`,
  reps: (n) => `${n} répétitions`,
  perWeek: (n) => `${n} fois/semaine`,
  customExercise: 'Exercice personnalisé',
  hideDetails: 'Masquer les détails',
  howTo: 'Comment le faire',
  setsLabel: 'Séries',
  repsLabel: 'Répétitions',
  durationLabel: 'Durée (s)',
  freqLabel: 'Fois/semaine',
  notesLabel: 'Notes',
  done: 'Terminé',
  editExercise: "Modifier l'exercice",
  removeExercise: "Retirer l'exercice",
  rehabProtocol: 'Protocole de rééducation',
  phase: (n) => `Phase ${n}`,
  phaseGoals: 'Objectifs : ',
  phaseExercises: 'Exercices : ',
  progressWhen: 'Progresser quand : ',
  examples: 'Exemples',
  startRecording: 'Commencer la dictée',
  stopRecording: 'Arrêter la dictée',
  voiceChrome: 'La dictée vocale fonctionne mieux dans Chrome.',
  writeInstead: 'Écrire',
  contextPlaceholder: 'Contexte clinique (facultatif) : ex. arthrose suspectée, traumatisme aigu',
  multiFileTip: 'Astuce : sélectionnez plusieurs fichiers ensemble (Cmd ou Ctrl) pour les analyser comme un seul cas.',
  uploadScan: 'Importer un compte rendu',
  uploadAfterNote: 'Disponible après la génération de la note',
  files: (names) => (names.length === 1 ? `1 fichier : ${names[0]}` : `${names.length} fichiers : ${names.join(', ')}`),
  analyzingDoc: 'Analyse du document…',
  docSummary: 'Résumé du document',
  scanError: "Le document n'a pas pu être analysé.",
  writePlaceholder: 'Écrivez ici vos observations sur la séance…',
  generateNote: 'Générer la note',
  pdfTitle: 'Note clinique - PHYGO',
  subjective: 'Subjectif',
  objective: 'Objectif',
  assessment: 'Évaluation',
  plan: 'Plan',
  patientSummary: 'Résumé pour le patient',
  source: 'Source',
}

export const LIVE_STRINGS: Record<AppLang, LiveDict> = { it, en, es, fr }

/** Speech-recognition locale matching each app language. */
export const DICTATION_LOCALE: Record<AppLang, string> = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR' }

export function useLiveUi() {
  const { lang } = useLanguage()
  return { s: LIVE_STRINGS[lang], lang }
}
