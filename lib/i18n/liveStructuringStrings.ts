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
  evidenceIndirect: string
  /** The evidence block, by level: only direct papers are support for the case. */
  evidenceDirectTitle: string
  evidenceIndirectTitle: string
  evidenceUnverifiedTitle: string
  /** For a paper that is not direct evidence: what it says, not why it is pertinent. */
  paperSummary: string
  evidenceUnverified: string
  evidenceReason: Record<'same_region' | 'same_mechanism_other_region' | 'case_region_unknown' | 'paper_region_unknown' | 'population_or_mechanism_not_stated' | 'adjacent_region' | 'region_in_abstract_only', string>
  coherenceTitle: string
  coherenceIntro: string
  coherenceOk: string
  coherenceIssue: Record<'region_unknown' | 'district' | 'section_region' | 'history_as_active' | 'side' | 'exercise' | 'exercise_unverified' | 'evidence' | 'evidence_unverified' | 'protocol' | 'protocol_unverified' | 'invented' | 'invented_finding' | 'invented_test' | 'invented_appointment' | 'invented_agreement' | 'invented_treatment' | 'coverage_exercises' | 'coverage_protocol' | 'coverage_evidence' | 'objective_missing' | 'invented_negative' | 'unconfirmed_diagnosis' | 'contradicted_diagnosis' | 'generated_dosage' | 'coverage_plan' | 'unapproved_instruction' | 'history_missing' | 'unsupported_etiology' | 'plan_region_undefined' | 'unsupported_cause' | 'history_link' | 'unsupported_hypothesis' | 'plan_region_not_specific', (item: string) => string>
  removedTitle: string
  removedReason: Record<'invented' | 'invented_finding' | 'invented_test' | 'invented_appointment' | 'invented_agreement' | 'invented_treatment' | 'invented_negative' | 'unconfirmed_diagnosis' | 'unconfirmed_diagnosis_removed' | 'contradicted_diagnosis' | 'generated_dosage' | 'unapproved_instruction' | 'history_added' | 'unsupported_etiology' | 'plan_regions' | 'unsupported_cause' | 'history_link' | 'unsupported_hypothesis', string>
  /** Why an instruction to the patient was not approved (lib/clinical/facts.ts unapprovedInstructions). */
  instructionReason: Record<'home_programme_not_documented' | 'demonstration_not_documented' | 'suggested_exercise' | 'generated_dosage', string>
  /** What the clinician said of the diagnosis of the condition sheet, apart from the sheet's match. */
  diagnosisStatus: Record<'stated' | 'suspected' | 'not_stated', string>
  sheetMatchNote: string
  /** An addition PHYGO made to the draft (history the draft left out). */
  added: (text: string) => string
  undoAdd: string
  /** Shown under a statement that was relabelled instead of removed: what the draft now says. */
  replacedWith: (text: string) => string
  /** Where an exercise of the programme comes from, and whose its dose is. */
  exerciseOrigin: Record<'performed' | 'stated' | 'suggested', string>
  dosageSuggested: string
  restore: string
  matchUnverified: string
  useSuggestion: (name: string) => string
  otherRegionsTitle: string
  otherRegionNoSheet: string
  sideLeft: string
  sideRight: string
  unverifiedReason: Record<'case_region_unknown' | 'exercise_region_unknown' | 'sheet_region_unknown' | 'diagnosis_not_stated' | 'ai_choice', string>
  /** Why a region treated today has this sheet, or none (/api/knowledge-lookup `others`). */
  otherSheetReason: Record<'symptom_only' | 'no_matching_sheet' | 'no_sheet_for_region', string>
  generalActivity: string
  excludedHistory: (regions: string) => string
  regionNames: Record<'shoulder' | 'elbow' | 'wrist_hand' | 'cervical' | 'thoracic' | 'lumbar' | 'hip' | 'thigh' | 'knee' | 'lower_leg' | 'ankle_foot' | 'upper_limb' | 'lower_limb', string>
  excludedTitle: string
  excludedReason: (regions: string, caseRegions: string) => string
  addBack: string
  fromNote: (draft: string) => string
  protocolIndicative: string
  exercises: string
  /** On the generated plan: a proposal, not an approved prescription. */
  planProposal: string
  /** Above the exercises: how many exercises and doses are the AI's, and that saving approves them. */
  exercisesProposal: (exercises: number, doses: number) => string
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
  hypotheses: 'Ipotesi cliniche (non confermate)',
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
  evidenceTitle: 'Evidenze scientifiche',
  evidenceSearching: 'Ricerca nella libreria delle evidenze…',
  evidenceNone: 'Nessuno studio pubblicato nella libreria Science di PHYGO corrisponde a questo caso.',
  whyRelevant: 'Perché è pertinente: ',
  viewSource: 'Vedi la fonte',
  evidenceDisclaimer: 'La presenza di uno studio non convalida da sola un trattamento: il giudizio clinico resta al professionista.',
  evidenceIndirect: 'Evidenza indiretta',
  evidenceDirectTitle: 'Evidenza diretta per questo caso',
  evidenceIndirectTitle: 'Evidenza indiretta: non è un supporto diretto di questo caso',
  evidenceUnverifiedTitle: 'Pertinenza non verificata: da non usare come supporto di questo caso',
  paperSummary: 'Che cosa dice lo studio: ',
  evidenceUnverified: 'Pertinenza non verificata',
  evidenceReason: {
    same_region: 'Stesso distretto, ma non la condizione esatta di questo caso.',
    same_mechanism_other_region: 'Stesso meccanismo clinico in un altro distretto: utile solo come riferimento, da valutare.',
    case_region_unknown: 'Il distretto del caso non è stato riconosciuto: la pertinenza non è stata verificata.',
    paper_region_unknown: 'Lo studio non indica un distretto riconoscibile: la pertinenza non è stata verificata.',
    population_or_mechanism_not_stated: 'Lo studio riguarda una popolazione o un meccanismo (es. età, trauma, chirurgia, sport) che non hai indicato per questo caso: pertinenza non verificata.',
    adjacent_region: 'Studio su un distretto vicino, non sullo stesso: la pertinenza non è stata verificata.',
    region_in_abstract_only: 'Lo studio nomina il distretto solo nell’abstract, sotto un titolo più generale: non riguarda specificamente questo caso.',
  },
  coherenceTitle: 'Controlli di coerenza',
  coherenceIntro: 'Confronto automatico tra ciò che hai detto e ciò che è stato generato. Il contenuto clinico resta da verificare da parte tua.',
  coherenceOk: 'Nessuna incoerenza rilevata su distretto, lato, esercizi, studi, protocollo, misure, appuntamenti e trattamenti.',
  coherenceIssue: {
    invented_finding: (i) => `${i}: reperto non presente in ciò che hai detto. Verificalo o rimuovilo.`,
    invented_test: (i) => `${i}: test clinico non nominato da te. Il risultato non può venire dalla bozza.`,
    invented_agreement: (i) => `${i}: presentato come concordato, ma non risulta da ciò che hai detto.`,
    coverage_exercises: (i) => `${i}: trattato oggi, ma nessun esercizio lo riguarda.`,
    coverage_protocol: (i) => `${i}: trattato oggi, ma nessuna scheda clinica trovata per questo distretto.`,
    coverage_evidence: (i) => `${i}: trattato oggi, ma nessuno studio pertinente trovato per questo distretto.`,
    invented_negative: (i) => `${i}: risultato negativo che non hai riferito. Se non è stato valutato, non va dichiarato assente.`,
    contradicted_diagnosis: (i) => `${i}: la bozza contraddice ciò che hai detto su questa diagnosi (esclusa da te, oppure esclusa nella bozza). Tolta dalla nota.`,
    unconfirmed_diagnosis: (i) => `${i}: diagnosi presentata come certa, ma non l’hai indicata. Va trattata come ipotesi da confermare.`,
    generated_dosage: (i) => `${i}: dosaggio che non hai indicato, presentato come prescrizione. È un suggerimento generato.`,
    coverage_plan: (i) => `${i}: trattato oggi, ma il piano non ne parla.`,
    unsupported_cause: (i) => `${i}: causa o fattore di rischio che non hai riferito.`,
    history_link: (i) => `${i}: legame tra il problema attuale e l’anamnesi che non hai indicato.`,
    unsupported_hypothesis: (i) => `${i}: ipotesi non sostenuta dai reperti che hai riferito.`,
    plan_region_not_specific: (i) => `${i}: il piano lo nomina solo insieme agli altri distretti, senza una proposta specifica.`,
    unsupported_etiology: (i) => `${i}: causa dedotta dalla sola durata dei sintomi, non riferita da te.`,
    plan_region_undefined: (i) => `${i}: trattato oggi, ma la bozza non contiene proposte specifiche per questo distretto.`,
    unapproved_instruction: (i) => `${i}: il messaggio al paziente presentava come prescritto ciò che non hai approvato.`,
    history_missing: (i) => `Anamnesi che hai riferito ma che il Soggettivo non riporta: ${i}`,
    objective_missing: () => 'Nessun rilievo obiettivo riferito: la sezione resta vuota. Aggiungilo tu se lo hai raccolto.',
    region_unknown: () => 'Distretto non riconosciuto nella nota: la pertinenza di esercizi, studi e protocollo non è stata verificata automaticamente.',
    district: (i) => `La condizione indicata ("${i}") riguarda un distretto diverso da quello che hai descritto.`,
    section_region: (i) => `${i}: nomina un distretto che non hai descritto.`,
    side: (i) => `${i}: il lato non corrisponde a quello che hai indicato.`,
    exercise: (i) => `"${i}" riguarda un distretto diverso da quello del caso.`,
    evidence: (i) => `Lo studio "${i}" riguarda un distretto diverso da quello del caso.`,
    evidence_unverified: (i) => `Lo studio "${i}": pertinenza non verificata.`,
    protocol: (i) => `La scheda "${i}" riguarda un distretto diverso da quello del caso.`,
    invented: (i) => `${i}: misura che non compare in ciò che hai detto. Verificala prima di salvare.`,
    invented_appointment: (i) => `${i}: giorno, data o orario che non hai indicato. Verificalo prima di comunicarlo al paziente.`,
    invented_treatment: (i) => `${i}: presentato come già eseguito, ma non compare in ciò che hai detto.`,
    history_as_active: (i) => `${i}: tratta come problema attuale un distretto che hai indicato solo in anamnesi.`,
    exercise_unverified: (i) => `"${i}": pertinenza non verificata, il distretto dell'esercizio non è riconosciuto. Decidi tu se tenerlo.`,
    protocol_unverified: (i) => `La scheda "${i}": pertinenza non verificata, il distretto non è riconosciuto.`,
  },
  removedTitle: 'Tolto o etichettato nella bozza perché non risulta da ciò che hai detto',
  removedReason: { invented: 'misura non detta', invented_finding: 'reperto non detto', invented_test: 'test non nominato', invented_appointment: 'appuntamento o frequenza delle visite non concordati', invented_agreement: 'accordo non risultante', invented_treatment: 'trattamento non nominato', invented_negative: 'risultato negativo non documentato (non indagato)', unconfirmed_diagnosis: 'diagnosi non indicata da te: etichettata come ipotesi', unconfirmed_diagnosis_removed: 'diagnosi non indicata da te: tolta dal messaggio al paziente', contradicted_diagnosis: 'diagnosi in contrasto con ciò che hai detto (esclusa o affermata): tolta', generated_dosage: 'dosaggio non indicato da te: etichettato come proposta generata', unapproved_instruction: 'istruzione al paziente non approvata da te', history_added: 'anamnesi riferita da te, mancante nella bozza: aggiunta come anamnesi', unsupported_etiology: 'causa dedotta dalla sola durata dei sintomi', plan_regions: 'piano organizzato per distretto, senza aggiungere proposte', unsupported_cause: 'causa o fattore di rischio non riferito da te', history_link: 'legame con l’anamnesi non indicato da te', unsupported_hypothesis: 'ipotesi senza i reperti che la sostengono' },
  instructionReason: { home_programme_not_documented: 'programma a casa non indicato da te', demonstration_not_documented: 'dimostrazione non documentata', suggested_exercise: 'esercizio proposto dall’AI', generated_dosage: 'dosaggio o frequenza non indicati da te' },
  diagnosisStatus: { stated: 'Diagnosi indicata da te.', suspected: 'Diagnosi sospetta, da confermare.', not_stated: 'Diagnosi non indicata da te.' },
  sheetMatchNote: 'La scheda corrisponde al caso documentato: non conferma la diagnosi.',
  added: (x) => `Aggiunto: «${x}»`,
  undoAdd: 'Togli',
  replacedWith: (x) => `Ora nella bozza: «${x}»`,
  exerciseOrigin: { performed: 'Svolto oggi (dalla trascrizione)', stated: 'Indicato da te', suggested: 'Suggerito dall’AI, da confermare' },
  dosageSuggested: 'Dosaggio suggerito dall’AI: non indicato da te',
  restore: 'Ripristina',
  matchUnverified: 'Corrispondenza in libreria non verificata: resta l’esercizio come l’hai scritto.',
  useSuggestion: (n) => `Usa «${n}»`,
  otherRegionsTitle: 'Altri distretti trattati oggi',
  otherRegionNoSheet: 'nessuna scheda clinica trovata',
  sideLeft: 'lato sinistro',
  sideRight: 'lato destro',
  unverifiedReason: {
    case_region_unknown: 'Pertinenza non verificata: il distretto del caso non è stato riconosciuto.',
    exercise_region_unknown: 'Pertinenza non verificata: il distretto dell’esercizio non è riconosciuto. Decidi tu se tenerlo.',
    sheet_region_unknown: 'Pertinenza non verificata: la scheda non indica un distretto riconoscibile.',
    diagnosis_not_stated: 'Pertinenza non verificata: la diagnosi della scheda non risulta da ciò che hai detto, viene dalla valutazione generata.',
    ai_choice: 'Pertinenza non verificata: scheda scelta dal modello, non da parole che hai detto.',
  },
  otherSheetReason: { symptom_only: 'scheda generica del distretto (hai descritto il sintomo, non una diagnosi)', no_matching_sheet: 'nessuna scheda corrisponde a ciò che hai detto', no_sheet_for_region: 'nessuna scheda per questo distretto' },
  generalActivity: 'Attività generale',
  excludedHistory: (r) => `${r}: indicato solo in anamnesi, non come problema attuale.`,
  regionNames: { shoulder: 'spalla', elbow: 'gomito', wrist_hand: 'polso e mano', cervical: 'rachide cervicale', thoracic: 'rachide dorsale', lumbar: 'rachide lombare', hip: 'anca', thigh: 'coscia', knee: 'ginocchio', lower_leg: 'gamba (polpaccio)', ankle_foot: 'caviglia e piede', upper_limb: 'arto superiore', lower_limb: 'arto inferiore' },
  excludedTitle: 'Esercizi non inseriti nel programma, con il motivo',
  excludedReason: (r, c) => `Distretto dell'esercizio: ${r}. Distretto del caso: ${c}.`,
  addBack: 'Aggiungi comunque',
  fromNote: (d) => `Dalla nota: ${d}`,
  protocolIndicative: 'Protocollo indicativo: va adattato alla valutazione individuale del paziente.',
  exercises: 'Esercizi',
  planProposal: 'Proposta generata dall’AI: da rivedere e confermare. Non è una prescrizione già approvata.',
  exercisesProposal: (n, m) => `${[n ? `${n} ${n === 1 ? 'esercizio proposto' : 'esercizi proposti'} dall’AI` : '', m ? `${m} ${m === 1 ? 'dosaggio suggerito' : 'dosaggi suggeriti'}` : ''].filter(Boolean).join(' e ')}, da confermare. Salvando la nota li approvi come programma del paziente.`,
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
  hypotheses: 'Clinical hypotheses (not confirmed)',
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
  evidenceTitle: 'Scientific evidence',
  evidenceSearching: 'Searching the evidence library…',
  evidenceNone: 'No published paper in the PHYGO Science library matches this case.',
  whyRelevant: 'Why it’s relevant: ',
  viewSource: 'View source',
  evidenceDisclaimer: 'Showing a paper here does not by itself validate a treatment: clinical judgment remains with the treating professional.',
  evidenceIndirect: 'Indirect evidence',
  evidenceDirectTitle: 'Direct evidence for this case',
  evidenceIndirectTitle: 'Indirect evidence: not direct support for this case',
  evidenceUnverifiedTitle: 'Pertinence not verified: not to be used as support for this case',
  paperSummary: 'What the paper says: ',
  evidenceUnverified: 'Pertinence not verified',
  evidenceReason: {
    same_region: 'Same body region, but not this exact condition.',
    same_mechanism_other_region: 'Same clinical mechanism in another body region: a reference only, to be weighed.',
    case_region_unknown: 'The body region of the case was not recognised: pertinence not verified.',
    paper_region_unknown: 'The paper names no recognisable body region: pertinence not verified.',
    population_or_mechanism_not_stated: 'The paper is about a population or a mechanism (e.g. age, trauma, surgery, sport) you did not state for this case: pertinence not verified.',
    adjacent_region: 'Paper about a neighbouring region, not the same one: pertinence not verified.',
    region_in_abstract_only: 'The paper names the region only in its abstract, under a broader title: it is not specifically about this case.',
  },
  coherenceTitle: 'Coherence checks',
  coherenceIntro: 'An automatic comparison between what you said and what was generated. The clinical content is still yours to verify.',
  coherenceOk: 'No inconsistency found in region, side, exercises, papers, protocol, measurements, appointments or treatments.',
  coherenceIssue: {
    invented_finding: (i) => `${i}: a finding that is not in what you said. Check or remove it.`,
    invented_test: (i) => `${i}: a clinical test you did not name. Its result cannot come from the draft.`,
    invented_agreement: (i) => `${i}: presented as agreed, but not in what you said.`,
    coverage_exercises: (i) => `${i}: treated today, but no exercise is for it.`,
    coverage_protocol: (i) => `${i}: treated today, but no condition sheet was found for this region.`,
    coverage_evidence: (i) => `${i}: treated today, but no pertinent paper was found for this region.`,
    invented_negative: (i) => `${i}: a negative result you did not report. If it was not assessed, it must not be declared absent.`,
    contradicted_diagnosis: (i) => `${i}: the draft contradicts what you said about this diagnosis (ruled out by you, or ruled out in the draft). Taken out of the note.`,
    unconfirmed_diagnosis: (i) => `${i}: a diagnosis presented as certain that you did not give. It is a hypothesis to confirm.`,
    generated_dosage: (i) => `${i}: a dose you did not give, presented as a prescription. It is a generated suggestion.`,
    coverage_plan: (i) => `${i}: treated today, but the plan does not mention it.`,
    unsupported_cause: (i) => `${i}: a cause or risk factor you did not report.`,
    history_link: (i) => `${i}: a link between today’s problem and the history that you did not make.`,
    unsupported_hypothesis: (i) => `${i}: a hypothesis not supported by the findings you reported.`,
    plan_region_not_specific: (i) => `${i}: the plan names it only together with the other regions, with no specific proposal.`,
    unsupported_etiology: (i) => `${i}: a cause drawn from the duration of the symptoms alone, not given by you.`,
    plan_region_undefined: (i) => `${i}: treated today, but the draft has no specific proposal for this region.`,
    unapproved_instruction: (i) => `${i}: the patient message presented as prescribed what you have not approved.`,
    history_missing: (i) => `History you reported that the subjective section leaves out: ${i}`,
    objective_missing: () => 'No objective findings were stated: the section is left empty. Add them yourself if you collected any.',
    region_unknown: () => 'No body region recognised in the note: the pertinence of exercises, papers and protocol was not checked automatically.',
    district: (i) => `The condition given ("${i}") is about a different body region from the one you described.`,
    section_region: (i) => `${i}: names a body region you did not describe.`,
    side: (i) => `${i}: the side does not match the one you gave.`,
    exercise: (i) => `"${i}" is for a different body region from the case.`,
    evidence: (i) => `The paper "${i}" is about a different body region from the case.`,
    evidence_unverified: (i) => `The paper "${i}": pertinence not verified.`,
    protocol: (i) => `The sheet "${i}" is about a different body region from the case.`,
    invented: (i) => `${i}: a measurement that is not in what you said. Check it before saving.`,
    invented_appointment: (i) => `${i}: a day, date or time you did not give. Check it before telling the patient.`,
    invented_treatment: (i) => `${i}: presented as already done, but not in what you said.`,
    history_as_active: (i) => `${i}: treats as a current problem a body region you gave only as history.`,
    exercise_unverified: (i) => `"${i}": pertinence not verified, the exercise's body region is not recognised. Your call whether to keep it.`,
    protocol_unverified: (i) => `The sheet "${i}": pertinence not verified, the body region is not recognised.`,
  },
  removedTitle: 'Taken out of or labelled in the draft because it is not in what you said',
  removedReason: { invented: 'measurement not given', invented_finding: 'finding not given', invented_test: 'test not named', invented_appointment: 'appointment or visit frequency not agreed', invented_agreement: 'agreement not given', invented_treatment: 'treatment not named', invented_negative: 'negative result not documented (not assessed)', unconfirmed_diagnosis: 'diagnosis you did not give: labelled as a hypothesis', unconfirmed_diagnosis_removed: 'diagnosis you did not give: taken out of the patient message', contradicted_diagnosis: 'diagnosis contradicting what you said (ruled out or affirmed): taken out', generated_dosage: 'dose you did not give: labelled as a generated suggestion', unapproved_instruction: 'instruction to the patient not approved by you', history_added: 'history you reported, missing from the draft: added as history', unsupported_etiology: 'cause drawn from the duration of the symptoms alone', plan_regions: 'plan organised by region, no proposal added', unsupported_cause: 'cause or risk factor you did not report', history_link: 'link to the history you did not make', unsupported_hypothesis: 'hypothesis without the findings it rests on' },
  instructionReason: { home_programme_not_documented: 'home programme not given by you', demonstration_not_documented: 'demonstration not documented', suggested_exercise: 'exercise proposed by the AI', generated_dosage: 'dose or frequency not given by you' },
  diagnosisStatus: { stated: 'Diagnosis given by you.', suspected: 'Suspected diagnosis, to be confirmed.', not_stated: 'Diagnosis not given by you.' },
  sheetMatchNote: 'The sheet matches the documented case: it does not confirm the diagnosis.',
  added: (x) => `Added: “${x}”`,
  undoAdd: 'Remove',
  replacedWith: (x) => `Now in the draft: “${x}”`,
  exerciseOrigin: { performed: 'Done today (from the transcript)', stated: 'Named by you', suggested: 'Suggested by the AI, to be confirmed' },
  dosageSuggested: 'Dose suggested by the AI: not given by you',
  restore: 'Restore',
  matchUnverified: 'Library match not verified: the exercise stays as you wrote it.',
  useSuggestion: (n) => `Use “${n}”`,
  otherRegionsTitle: 'Other regions treated today',
  otherRegionNoSheet: 'no condition sheet found',
  sideLeft: 'left side',
  sideRight: 'right side',
  unverifiedReason: {
    case_region_unknown: 'Pertinence not verified: the body region of the case was not recognised.',
    exercise_region_unknown: 'Pertinence not verified: the exercise’s body region is not recognised. Your call whether to keep it.',
    sheet_region_unknown: 'Pertinence not verified: the sheet names no recognisable body region.',
    diagnosis_not_stated: 'Pertinence not verified: the sheet\'s diagnosis is not in what you said, it comes from the generated assessment.',
    ai_choice: 'Pertinence not verified: sheet chosen by the model, not from words you said.',
  },
  otherSheetReason: { symptom_only: 'generic sheet for the region (you described the symptom, not a diagnosis)', no_matching_sheet: 'no sheet matches what you said', no_sheet_for_region: 'no sheet for this region' },
  generalActivity: 'General activity',
  excludedHistory: (r) => `${r}: given only as history, not as a current problem.`,
  regionNames: { shoulder: 'shoulder', elbow: 'elbow', wrist_hand: 'wrist and hand', cervical: 'cervical spine', thoracic: 'thoracic spine', lumbar: 'lumbar spine', hip: 'hip', thigh: 'thigh', knee: 'knee', lower_leg: 'lower leg (calf)', ankle_foot: 'ankle and foot', upper_limb: 'upper limb', lower_limb: 'lower limb' },
  excludedTitle: 'Exercises left out of the programme, with the reason',
  excludedReason: (r, c) => `Exercise region: ${r}. Case region: ${c}.`,
  addBack: 'Add anyway',
  fromNote: (d) => `From the note: ${d}`,
  protocolIndicative: 'Indicative protocol: adapt it to the individual assessment of the patient.',
  exercises: 'Exercises',
  planProposal: 'Generated by the AI: to review and confirm. Not an approved prescription.',
  exercisesProposal: (n, m) => `${[n ? `${n} ${n === 1 ? 'exercise' : 'exercises'} proposed by the AI` : '', m ? `${m} suggested ${m === 1 ? 'dose' : 'doses'}` : ''].filter(Boolean).join(' and ')}, to confirm. Saving the note approves them as the patient’s programme.`,
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
  hypotheses: 'Hipótesis clínicas (no confirmadas)',
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
  evidenceTitle: 'Evidencia científica',
  evidenceSearching: 'Buscando en la biblioteca de evidencia…',
  evidenceNone: 'Ningún estudio publicado en la biblioteca Science de PHYGO coincide con este caso.',
  whyRelevant: 'Por qué es relevante: ',
  viewSource: 'Ver la fuente',
  evidenceDisclaimer: 'Que aparezca un estudio no valida por sí solo un tratamiento: el juicio clínico corresponde al profesional.',
  evidenceIndirect: 'Evidencia indirecta',
  evidenceDirectTitle: 'Evidencia directa para este caso',
  evidenceIndirectTitle: 'Evidencia indirecta: no es un apoyo directo de este caso',
  evidenceUnverifiedTitle: 'Pertinencia no verificada: no usar como apoyo de este caso',
  paperSummary: 'Qué dice el estudio: ',
  evidenceUnverified: 'Pertinencia no verificada',
  evidenceReason: {
    same_region: 'Misma región, pero no la condición exacta de este caso.',
    same_mechanism_other_region: 'Mismo mecanismo clínico en otra región: solo como referencia, a valorar.',
    case_region_unknown: 'No se ha reconocido la región del caso: pertinencia no verificada.',
    paper_region_unknown: 'El estudio no indica una región reconocible: pertinencia no verificada.',
    population_or_mechanism_not_stated: 'El estudio trata de una población o un mecanismo (p. ej. edad, traumatismo, cirugía, deporte) que no indicaste para este caso: pertinencia no verificada.',
    adjacent_region: 'Estudio sobre una región vecina, no la misma: pertinencia no verificada.',
    region_in_abstract_only: 'El estudio nombra la región solo en el resumen, bajo un título más general: no trata específicamente de este caso.',
  },
  coherenceTitle: 'Controles de coherencia',
  coherenceIntro: 'Comparación automática entre lo que has dicho y lo generado. El contenido clínico debes verificarlo tú.',
  coherenceOk: 'No se ha detectado ninguna incoherencia en región, lado, ejercicios, estudios, protocolo, medidas, citas y tratamientos.',
  coherenceIssue: {
    invented_finding: (i) => `${i}: un hallazgo que no aparece en lo que has dicho. Verifícalo o elimínalo.`,
    invented_test: (i) => `${i}: una prueba clínica que no has nombrado. Su resultado no puede venir del borrador.`,
    invented_agreement: (i) => `${i}: se presenta como acordado, pero no aparece en lo que has dicho.`,
    coverage_exercises: (i) => `${i}: tratado hoy, pero ningún ejercicio lo trabaja.`,
    coverage_protocol: (i) => `${i}: tratado hoy, pero no se encontró ninguna ficha clínica para esta región.`,
    coverage_evidence: (i) => `${i}: tratado hoy, pero no se encontró ningún estudio pertinente para esta región.`,
    invented_negative: (i) => `${i}: resultado negativo que no indicaste. Si no se evaluó, no debe declararse ausente.`,
    contradicted_diagnosis: (i) => `${i}: el borrador contradice lo que dijiste sobre este diagnóstico (descartado por ti, o descartado en el borrador). Retirado de la nota.`,
    unconfirmed_diagnosis: (i) => `${i}: diagnóstico presentado como seguro que no indicaste. Es una hipótesis por confirmar.`,
    generated_dosage: (i) => `${i}: dosis que no indicaste, presentada como prescripción. Es una sugerencia generada.`,
    coverage_plan: (i) => `${i}: tratado hoy, pero el plan no lo menciona.`,
    unsupported_cause: (i) => `${i}: causa o factor de riesgo que no indicaste.`,
    history_link: (i) => `${i}: relación entre el problema actual y los antecedentes que no indicaste.`,
    unsupported_hypothesis: (i) => `${i}: hipótesis no sustentada por los hallazgos que indicaste.`,
    plan_region_not_specific: (i) => `${i}: el plan lo nombra solo junto con las otras regiones, sin una propuesta específica.`,
    unsupported_etiology: (i) => `${i}: causa deducida solo de la duración de los síntomas, no indicada por ti.`,
    plan_region_undefined: (i) => `${i}: tratado hoy, pero el borrador no contiene propuestas específicas para esta región.`,
    unapproved_instruction: (i) => `${i}: el mensaje al paciente presentaba como prescrito lo que no has aprobado.`,
    history_missing: (i) => `Antecedente que indicaste y que el apartado subjetivo omite: ${i}`,
    objective_missing: () => 'No se indicó ningún hallazgo objetivo: la sección queda vacía. Añádelo tú si lo recogiste.',
    region_unknown: () => 'No se ha reconocido ninguna región en la nota: la pertinencia de ejercicios, estudios y protocolo no se ha verificado automáticamente.',
    district: (i) => `La condición indicada ("${i}") corresponde a una región distinta de la que has descrito.`,
    section_region: (i) => `${i}: menciona una región que no has descrito.`,
    side: (i) => `${i}: el lado no coincide con el que has indicado.`,
    exercise: (i) => `"${i}" corresponde a una región distinta de la del caso.`,
    evidence: (i) => `El estudio "${i}" trata de una región distinta de la del caso.`,
    evidence_unverified: (i) => `El estudio "${i}": pertinencia no verificada.`,
    protocol: (i) => `La ficha "${i}" trata de una región distinta de la del caso.`,
    invented: (i) => `${i}: una medida que no aparece en lo que has dicho. Verifícala antes de guardar.`,
    invented_appointment: (i) => `${i}: un día, fecha u hora que no has indicado. Verifícalo antes de comunicarlo al paciente.`,
    invented_treatment: (i) => `${i}: se presenta como ya realizado, pero no aparece en lo que has dicho.`,
    history_as_active: (i) => `${i}: trata como problema actual una región que indicaste solo como antecedente.`,
    exercise_unverified: (i) => `"${i}": pertinencia no verificada, no se reconoce la región del ejercicio. Decides tú si mantenerlo.`,
    protocol_unverified: (i) => `La ficha "${i}": pertinencia no verificada, no se reconoce la región.`,
  },
  removedTitle: 'Retirado o etiquetado en el borrador porque no aparece en lo que has dicho',
  removedReason: { invented: 'medida no dicha', invented_finding: 'hallazgo no dicho', invented_test: 'prueba no nombrada', invented_appointment: 'cita o frecuencia de visitas no acordadas', invented_agreement: 'acuerdo no indicado', invented_treatment: 'tratamiento no nombrado', invented_negative: 'resultado negativo no documentado (no evaluado)', unconfirmed_diagnosis: 'diagnóstico que no indicaste: etiquetado como hipótesis', unconfirmed_diagnosis_removed: 'diagnóstico que no indicaste: retirado del mensaje al paciente', contradicted_diagnosis: 'diagnóstico en contradicción con lo que dijiste (descartado o afirmado): retirado', generated_dosage: 'dosis que no indicaste: etiquetada como sugerencia generada', unapproved_instruction: 'instrucción al paciente no aprobada por ti', history_added: 'antecedente que indicaste, ausente del borrador: añadido como antecedente', unsupported_etiology: 'causa deducida solo de la duración de los síntomas', plan_regions: 'plan organizado por región, sin añadir propuestas', unsupported_cause: 'causa o factor de riesgo no indicado por ti', history_link: 'relación con los antecedentes no indicada por ti', unsupported_hypothesis: 'hipótesis sin los hallazgos que la sustentan' },
  instructionReason: { home_programme_not_documented: 'programa en casa no indicado por ti', demonstration_not_documented: 'demostración no documentada', suggested_exercise: 'ejercicio propuesto por la IA', generated_dosage: 'dosis o frecuencia no indicadas por ti' },
  diagnosisStatus: { stated: 'Diagnóstico indicado por ti.', suspected: 'Diagnóstico sospechado, por confirmar.', not_stated: 'Diagnóstico no indicado por ti.' },
  sheetMatchNote: 'La ficha corresponde al caso documentado: no confirma el diagnóstico.',
  added: (x) => `Añadido: «${x}»`,
  undoAdd: 'Quitar',
  replacedWith: (x) => `Ahora en el borrador: «${x}»`,
  exerciseOrigin: { performed: 'Realizado hoy (de la transcripción)', stated: 'Indicado por ti', suggested: 'Sugerido por la IA, por confirmar' },
  dosageSuggested: 'Dosis sugerida por la IA: no indicada por ti',
  restore: 'Restaurar',
  matchUnverified: 'Correspondencia en la biblioteca no verificada: el ejercicio queda como lo escribiste.',
  useSuggestion: (n) => `Usar «${n}»`,
  otherRegionsTitle: 'Otras regiones tratadas hoy',
  otherRegionNoSheet: 'no se encontró ficha clínica',
  sideLeft: 'lado izquierdo',
  sideRight: 'lado derecho',
  unverifiedReason: {
    case_region_unknown: 'Pertinencia no verificada: no se ha reconocido la región del caso.',
    exercise_region_unknown: 'Pertinencia no verificada: no se reconoce la región del ejercicio. Decides tú si mantenerlo.',
    sheet_region_unknown: 'Pertinencia no verificada: la ficha no indica una región reconocible.',
    diagnosis_not_stated: 'Pertinencia no verificada: el diagnóstico de la ficha no consta en lo que dijiste, viene de la valoración generada.',
    ai_choice: 'Pertinencia no verificada: ficha elegida por el modelo, no por palabras que dijiste.',
  },
  otherSheetReason: { symptom_only: 'ficha genérica de la región (describiste el síntoma, no un diagnóstico)', no_matching_sheet: 'ninguna ficha corresponde a lo que dijiste', no_sheet_for_region: 'ninguna ficha para esta región' },
  generalActivity: 'Actividad general',
  excludedHistory: (r) => `${r}: indicado solo como antecedente, no como problema actual.`,
  regionNames: { shoulder: 'hombro', elbow: 'codo', wrist_hand: 'muñeca y mano', cervical: 'columna cervical', thoracic: 'columna dorsal', lumbar: 'columna lumbar', hip: 'cadera', thigh: 'muslo', knee: 'rodilla', lower_leg: 'pierna (pantorrilla)', ankle_foot: 'tobillo y pie', upper_limb: 'miembro superior', lower_limb: 'miembro inferior' },
  excludedTitle: 'Ejercicios no incluidos en el programa, con el motivo',
  excludedReason: (r, c) => `Región del ejercicio: ${r}. Región del caso: ${c}.`,
  addBack: 'Añadir igualmente',
  fromNote: (d) => `De la nota: ${d}`,
  protocolIndicative: 'Protocolo orientativo: adáptalo a la valoración individual del paciente.',
  exercises: 'Ejercicios',
  planProposal: 'Propuesta generada por la IA: por revisar y confirmar. No es una prescripción aprobada.',
  exercisesProposal: (n, m) => `${[n ? `${n} ${n === 1 ? 'ejercicio propuesto' : 'ejercicios propuestos'} por la IA` : '', m ? `${m} ${m === 1 ? 'dosis sugerida' : 'dosis sugeridas'}` : ''].filter(Boolean).join(' y ')}, por confirmar. Al guardar la nota los apruebas como programa del paciente.`,
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
  hypotheses: 'Hypothèses cliniques (non confirmées)',
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
  evidenceTitle: 'Données scientifiques',
  evidenceSearching: 'Recherche dans la bibliothèque de données probantes…',
  evidenceNone: 'Aucune étude publiée dans la bibliothèque Science de PHYGO ne correspond à ce cas.',
  whyRelevant: 'Pourquoi c’est pertinent : ',
  viewSource: 'Voir la source',
  evidenceDisclaimer: "La présence d'une étude ne valide pas à elle seule un traitement : le jugement clinique reste au professionnel.",
  evidenceIndirect: 'Preuve indirecte',
  evidenceDirectTitle: 'Preuve directe pour ce cas',
  evidenceIndirectTitle: 'Preuve indirecte : ce n’est pas un appui direct de ce cas',
  evidenceUnverifiedTitle: 'Pertinence non vérifiée : à ne pas utiliser comme appui de ce cas',
  paperSummary: 'Ce que dit l’étude : ',
  evidenceUnverified: 'Pertinence non vérifiée',
  evidenceReason: {
    same_region: 'Même région, mais pas la pathologie exacte de ce cas.',
    same_mechanism_other_region: 'Même mécanisme clinique dans une autre région : simple référence, à évaluer.',
    case_region_unknown: 'La région du cas n’a pas été reconnue : pertinence non vérifiée.',
    paper_region_unknown: 'L’étude n’indique pas de région reconnaissable : pertinence non vérifiée.',
    population_or_mechanism_not_stated: 'L’étude porte sur une population ou un mécanisme (p. ex. âge, traumatisme, chirurgie, sport) que vous n’avez pas indiqué pour ce cas : pertinence non vérifiée.',
    adjacent_region: 'Étude sur une région voisine, pas la même : pertinence non vérifiée.',
    region_in_abstract_only: 'L’étude ne nomme la région que dans le résumé, sous un titre plus général : elle ne porte pas spécifiquement sur ce cas.',
  },
  coherenceTitle: 'Contrôles de cohérence',
  coherenceIntro: 'Comparaison automatique entre ce que vous avez dit et ce qui a été généré. Le contenu clinique reste à vérifier par vous.',
  coherenceOk: 'Aucune incohérence détectée sur la région, le côté, les exercices, les études, le protocole, les mesures, les rendez-vous et les traitements.',
  coherenceIssue: {
    invented_finding: (i) => `${i} : un constat absent de ce que vous avez dit. Vérifiez-le ou supprimez-le.`,
    invented_test: (i) => `${i} : un test clinique que vous n’avez pas nommé. Son résultat ne peut pas venir du brouillon.`,
    invented_agreement: (i) => `${i} : présenté comme convenu, mais absent de ce que vous avez dit.`,
    coverage_exercises: (i) => `${i} : traité aujourd’hui, mais aucun exercice ne le concerne.`,
    coverage_protocol: (i) => `${i} : traité aujourd’hui, mais aucune fiche clinique trouvée pour cette région.`,
    coverage_evidence: (i) => `${i} : traité aujourd’hui, mais aucune étude pertinente trouvée pour cette région.`,
    invented_negative: (i) => `${i} : résultat négatif que vous n’avez pas rapporté. S’il n’a pas été évalué, il ne doit pas être déclaré absent.`,
    contradicted_diagnosis: (i) => `${i} : le brouillon contredit ce que vous avez dit de ce diagnostic (exclu par vous, ou exclu dans le brouillon). Retiré de la note.`,
    unconfirmed_diagnosis: (i) => `${i} : diagnostic présenté comme certain que vous n’avez pas donné. C’est une hypothèse à confirmer.`,
    generated_dosage: (i) => `${i} : dosage que vous n’avez pas donné, présenté comme une prescription. C’est une suggestion générée.`,
    coverage_plan: (i) => `${i} : traité aujourd’hui, mais le plan n’en parle pas.`,
    unsupported_cause: (i) => `${i} : cause ou facteur de risque que vous n’avez pas indiqué.`,
    history_link: (i) => `${i} : lien entre le problème actuel et les antécédents que vous n’avez pas indiqué.`,
    unsupported_hypothesis: (i) => `${i} : hypothèse non étayée par les constats que vous avez rapportés.`,
    plan_region_not_specific: (i) => `${i} : le plan ne le nomme qu’avec les autres régions, sans proposition spécifique.`,
    unsupported_etiology: (i) => `${i} : cause déduite de la seule durée des symptômes, non indiquée par vous.`,
    plan_region_undefined: (i) => `${i} : traité aujourd’hui, mais le brouillon ne contient pas de proposition spécifique pour cette région.`,
    unapproved_instruction: (i) => `${i} : le message au patient présentait comme prescrit ce que vous n’avez pas approuvé.`,
    history_missing: (i) => `Antécédent que vous avez rapporté et que la section subjective omet : ${i}`,
    objective_missing: () => 'Aucun constat objectif indiqué : la section reste vide. Ajoutez-le vous-même si vous l’avez recueilli.',
    region_unknown: () => 'Aucune région reconnue dans la note : la pertinence des exercices, des études et du protocole n’a pas été vérifiée automatiquement.',
    district: (i) => `La pathologie indiquée (« ${i} ») concerne une autre région que celle que vous avez décrite.`,
    section_region: (i) => `${i} : mentionne une région que vous n’avez pas décrite.`,
    side: (i) => `${i} : le côté ne correspond pas à celui que vous avez indiqué.`,
    exercise: (i) => `« ${i} » concerne une autre région que celle du cas.`,
    evidence: (i) => `L'étude « ${i} » porte sur une autre région que celle du cas.`,
    evidence_unverified: (i) => `L'étude « ${i} » : pertinence non vérifiée.`,
    protocol: (i) => `La fiche « ${i} » porte sur une autre région que celle du cas.`,
    invented: (i) => `${i} : une mesure absente de ce que vous avez dit. Vérifiez-la avant d'enregistrer.`,
    invented_appointment: (i) => `${i} : un jour, une date ou une heure que vous n’avez pas indiqués. Vérifiez avant de le communiquer au patient.`,
    invented_treatment: (i) => `${i} : présenté comme déjà réalisé, mais absent de ce que vous avez dit.`,
    history_as_active: (i) => `${i} : traite comme problème actuel une région que vous avez indiquée seulement dans les antécédents.`,
    exercise_unverified: (i) => `« ${i} » : pertinence non vérifiée, la région de l’exercice n’est pas reconnue. À vous de décider de le garder.`,
    protocol_unverified: (i) => `La fiche « ${i} » : pertinence non vérifiée, la région n’est pas reconnue.`,
  },
  removedTitle: 'Retiré ou étiqueté dans le brouillon car absent de ce que vous avez dit',
  removedReason: { invented: 'mesure non donnée', invented_finding: 'constat non donné', invented_test: 'test non nommé', invented_appointment: 'rendez-vous ou fréquence des séances non convenus', invented_agreement: 'accord non indiqué', invented_treatment: 'traitement non nommé', invented_negative: 'résultat négatif non documenté (non évalué)', unconfirmed_diagnosis: 'diagnostic que vous n’avez pas donné : étiqueté comme hypothèse', unconfirmed_diagnosis_removed: 'diagnostic que vous n’avez pas donné : retiré du message au patient', contradicted_diagnosis: 'diagnostic en contradiction avec ce que vous avez dit (exclu ou affirmé) : retiré', generated_dosage: 'dosage que vous n’avez pas donné : étiqueté comme suggestion générée', unapproved_instruction: 'instruction au patient non approuvée par vous', history_added: 'antécédent que vous avez rapporté, absent du brouillon : ajouté comme antécédent', unsupported_etiology: 'cause déduite de la seule durée des symptômes', plan_regions: 'plan organisé par région, sans proposition ajoutée', unsupported_cause: 'cause ou facteur de risque non indiqué par vous', history_link: 'lien avec les antécédents non indiqué par vous', unsupported_hypothesis: 'hypothèse sans les constats qui la soutiennent' },
  instructionReason: { home_programme_not_documented: 'programme à domicile non indiqué par vous', demonstration_not_documented: 'démonstration non documentée', suggested_exercise: 'exercice proposé par l’IA', generated_dosage: 'dosage ou fréquence non indiqués par vous' },
  diagnosisStatus: { stated: 'Diagnostic indiqué par vous.', suspected: 'Diagnostic suspecté, à confirmer.', not_stated: 'Diagnostic non indiqué par vous.' },
  sheetMatchNote: 'La fiche correspond au cas documenté : elle ne confirme pas le diagnostic.',
  added: (x) => `Ajouté : « ${x} »`,
  undoAdd: 'Retirer',
  replacedWith: (x) => `Désormais dans le brouillon : « ${x} »`,
  exerciseOrigin: { performed: 'Réalisé aujourd’hui (d’après la transcription)', stated: 'Indiqué par vous', suggested: 'Suggéré par l’IA, à confirmer' },
  dosageSuggested: 'Dosage suggéré par l’IA : non indiqué par vous',
  restore: 'Rétablir',
  matchUnverified: 'Correspondance dans la bibliothèque non vérifiée : l’exercice reste tel que vous l’avez écrit.',
  useSuggestion: (n) => `Utiliser « ${n} »`,
  otherRegionsTitle: 'Autres régions traitées aujourd’hui',
  otherRegionNoSheet: 'aucune fiche clinique trouvée',
  sideLeft: 'côté gauche',
  sideRight: 'côté droit',
  unverifiedReason: {
    case_region_unknown: 'Pertinence non vérifiée : la région du cas n’a pas été reconnue.',
    exercise_region_unknown: 'Pertinence non vérifiée : la région de l’exercice n’est pas reconnue. À vous de décider de le garder.',
    sheet_region_unknown: 'Pertinence non vérifiée : la fiche n’indique pas de région reconnaissable.',
    diagnosis_not_stated: 'Pertinence non vérifiée : le diagnostic de la fiche ne ressort pas de ce que vous avez dit, il vient de l’évaluation générée.',
    ai_choice: 'Pertinence non vérifiée : fiche choisie par le modèle, pas à partir de vos mots.',
  },
  otherSheetReason: { symptom_only: 'fiche générique de la région (vous avez décrit le symptôme, pas un diagnostic)', no_matching_sheet: 'aucune fiche ne correspond à ce que vous avez dit', no_sheet_for_region: 'aucune fiche pour cette région' },
  generalActivity: 'Activité générale',
  excludedHistory: (r) => `${r} : indiqué seulement dans les antécédents, pas comme problème actuel.`,
  regionNames: { shoulder: 'épaule', elbow: 'coude', wrist_hand: 'poignet et main', cervical: 'rachis cervical', thoracic: 'rachis dorsal', lumbar: 'rachis lombaire', hip: 'hanche', thigh: 'cuisse', knee: 'genou', lower_leg: 'jambe (mollet)', ankle_foot: 'cheville et pied', upper_limb: 'membre supérieur', lower_limb: 'membre inférieur' },
  excludedTitle: 'Exercices non ajoutés au programme, avec le motif',
  excludedReason: (r, c) => `Région de l’exercice : ${r}. Région du cas : ${c}.`,
  addBack: 'Ajouter quand même',
  fromNote: (d) => `D’après la note : ${d}`,
  protocolIndicative: 'Protocole indicatif : à adapter à l’évaluation individuelle du patient.',
  exercises: 'Exercices',
  planProposal: 'Proposition générée par l’IA : à revoir et confirmer. Ce n’est pas une prescription approuvée.',
  exercisesProposal: (n, m) => `${[n ? `${n} ${n === 1 ? 'exercice proposé' : 'exercices proposés'} par l’IA` : '', m ? `${m} ${m === 1 ? 'dosage suggéré' : 'dosages suggérés'}` : ''].filter(Boolean).join(' et ')}, à confirmer. En enregistrant la note, vous les approuvez comme programme du patient.`,
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
