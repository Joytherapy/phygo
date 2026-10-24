// Care programme texts: the clinician's "Home programme" card on the patient
// page and the patient's "Today" (Daily Quest) in My Phygo, in the four app languages.
import type { AppLang } from '@/lib/i18n/uiStrings'
import type { LogStatus, ProgramStatus } from '@/lib/care/program'

export type CareDict = {
  clinician: {
    heading: string
    subtitle: string
    empty: string
    createFromNote: string
    createBlank: string
    noExercisesInNote: string
    titleLabel: string
    defaultTitle: string
    startLabel: string
    restDays: string
    restHint: string
    weekdays: [string, string, string, string, string, string, string]
    exerciseN: (n: number) => string
    name: string
    instructions: string
    sets: string
    reps: string
    duration: string
    timesPerDay: string
    doseNotes: string
    shortVariant: string
    shortHint: string
    addExercise: string
    remove: string
    dailyCheckin: string
    save: string
    saving: string
    saved: string
    saveError: string
    needName: string
    cancel: string
    edit: string
    loadError: string
    retry: string
    status: Record<ProgramStatus, string>
    pause: string
    resume: string
    complete: string
    toMaintenance: string
    last7: (done: number, planned: number) => string
    last7None: string
    selfReported: string
    checkinsOn: string
    lastCheckin: (pain: string, fatigue: string, date: string) => string
    noDose: string
    sessionsPerDay: (n: number) => string
    shortAvailable: string
  }
  patient: {
    heading: string
    subtitle: string
    progress: (done: number, total: number) => string
    rest: string
    paused: string
    outside: string
    nothing: string
    allDone: string
    session: (n: number) => string
    status: Record<LogStatus, string>
    recorded: Record<LogStatus, string>
    change: string
    saveError: string
    honest: string
    lowEnergy: string
    lowEnergyHint: string
    noShort: string
    shortDose: string
    times: (n: number) => string
    checkinTitle: string
    pain: string
    fatigue: string
    painAnchors: [string, string]
    fatigueAnchors: [string, string]
    note: string
    saveCheckin: string
    checkinSaved: string
    checkinHint: string
    education: string
    open: string
  }
  attention: {
    heading: string
    subtitle: string
    empty: string
    week: (done: number, planned: number) => string
    weekNone: string
    lastCheckin: (pain: string, fatigue: string, date: string) => string
    noCheckin: string
    paused: string
    flags: {
      pain_high: (value: number, threshold: number) => string
      pain_rise: (from: number, to: number) => string
      fatigue_high: (value: number, threshold: number) => string
      no_update: (days: number) => string
    }
    noFlags: string
    howToRead: string
    definitions: string[]
    open: string
    loadError: string
    rulesTitle: string
    rulesHint: string
    painAtOrAbove: string
    painRise: string
    fatigueAtOrAbove: string
    noUpdate: string
    off: string
    saveRules: string
    rulesSaved: string
  }
  booklet: {
    button: string
    panelTitle: string
    panelHint: string
    include: string
    title: string
    summary: string
    path: string
    exercises: string
    evidence: string
    contact: string
    currentPhase: string
    notSaid: string
    youAreHere: string
    goals: string
    progressWhen: string
    pathIndicative: string
    evidenceIntro: string
    strength: (s: string) => string
    guideline: (name: string, source: string) => string
    making: string
    error: string
  }
  plan: {
    days: string
    everyDay: string
    daysHint: string
    fromNote: string
    sendToProgram: string
    sending: string
    created: (n: number) => string
    updated: (added: number, changed: number) => string
    unavailable: string
    sendError: string
    noExercises: string
    withVideo: string
    pdfButton: string
    pdfTitle: string
    pdfFor: (name: string) => string
    pdfStart: (date: string) => string
    pdfRest: (days: string) => string
    pdfTimesPerDay: (n: number) => string
    pdfShort: string
    pdfApp: string
    pdfSafety: string
    pdfFooter: string
    pdfBy: (name: string) => string
    pdfFooterBy: (name: string) => string
    pdfYourPhysio: string
    pdfNoName: string
    noProtocol: (condition: string) => string
    pdfError: string
  }
  library: {
    addFromLibrary: string
    createFromLibrary: string
    title: string
    hint: string
    search: string
    linked: string
    all: string
    loading: string
    loadError: string
    noResults: string
    more: (n: number) => string
    selected: (n: number) => string
    add: (n: number) => string
    needOne: string
    close: string
    fromLibrary: string
    doseFromYou: string
    showHow: string
    hideHow: string
    linkedPending: (n: number) => string
    addLinked: string
    openProgram: string
  }
}

const it: CareDict = {
  clinician: {
    heading: 'Programma a casa',
    subtitle: 'Le attività che il paziente trova ogni giorno in My Phygo. Le decidi solo tu.',
    empty: 'Nessun programma. Crealo dagli esercizi dell’ultima nota, poi controlla dose, giorni e riposo.',
    createFromNote: 'Crea dall’ultima nota',
    createBlank: 'Crea da zero',
    noExercisesInNote: 'L’ultima nota non contiene esercizi: aggiungili qui sotto.',
    titleLabel: 'Titolo',
    defaultTitle: 'Programma a casa',
    startLabel: 'Inizio',
    restDays: 'Giorni di riposo',
    restHint: 'Nei giorni di riposo il paziente non vede attività e non può registrarne.',
    weekdays: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
    exerciseN: (n) => `Esercizio ${n}`,
    name: 'Nome',
    instructions: 'Istruzioni per il paziente',
    sets: 'Serie',
    reps: 'Ripetizioni',
    duration: 'Durata (secondi)',
    timesPerDay: 'Volte al giorno',
    doseNotes: 'Note sulla dose',
    shortVariant: 'Variante breve (facoltativa)',
    shortHint: 'Il paziente la vede solo se segnala “Oggi ho poca voglia”. Se la lasci vuota, PHYGO non riduce mai la dose.',
    addExercise: 'Aggiungi esercizio',
    remove: 'Rimuovi',
    dailyCheckin: 'Chiedi ogni giorno il check-in di dolore e fatica (0–10)',
    save: 'Salva programma',
    saving: 'Salvataggio…',
    saved: 'Programma salvato.',
    saveError: 'Non è stato possibile salvare il programma. Riprova.',
    needName: 'Dai un nome a ogni esercizio.',
    cancel: 'Annulla',
    edit: 'Modifica',
    loadError: 'Il programma non è stato caricato.',
    retry: 'Riprova',
    status: { active: 'Attivo', paused: 'In pausa', maintenance: 'Mantenimento', completed: 'Concluso' },
    pause: 'Metti in pausa',
    resume: 'Riprendi',
    complete: 'Concludi',
    toMaintenance: 'Passa a mantenimento',
    last7: (done, planned) => `Ultimi 7 giorni: ${done} di ${planned} sessioni segnate come fatte`,
    last7None: 'Ultimi 7 giorni: nessuna sessione prevista',
    selfReported: 'Dichiarato dal paziente: un segno non prova che l’esercizio sia stato eseguito correttamente.',
    checkinsOn: 'Check-in giornaliero di dolore e fatica',
    lastCheckin: (pain, fatigue, date) => `Ultimo check-in (${date}): dolore ${pain}, fatica ${fatigue}`,
    noDose: 'dose non indicata',
    sessionsPerDay: (n) => (n === 1 ? '1 volta al giorno' : `${n} volte al giorno`),
    shortAvailable: 'variante breve prevista',
  },
  patient: {
    heading: 'Oggi',
    subtitle: 'Le attività del tuo programma, decise dal tuo fisioterapista.',
    progress: (done, total) => `${done} di ${total}`,
    rest: 'Oggi è un giorno di riposo: anche recuperare fa parte del programma.',
    paused: 'Il tuo programma è in pausa. Il tuo fisioterapista ti dirà quando riprendere.',
    outside: 'Il tuo programma non prevede attività oggi.',
    nothing: 'Per oggi non ci sono attività.',
    allDone: 'Hai segnato tutte le attività di oggi.',
    session: (n) => `Sessione ${n}`,
    status: { done: 'Fatto', partial: 'In parte', skipped: 'Saltato' },
    recorded: { done: 'Fatto', partial: 'Fatto in parte', skipped: 'Saltato' },
    change: 'Cambia',
    saveError: 'Non salvato. Riprova.',
    honest: 'Segna solo quello che hai fatto davvero: serve al tuo fisioterapista per seguirti.',
    lowEnergy: 'Oggi ho poca voglia',
    lowEnergyHint: 'Ti mostriamo la versione breve solo dove il tuo fisioterapista l’ha prevista.',
    noShort: 'Per questo esercizio non c’è una versione breve. Se oggi non riesci, segnalo come saltato: il tuo fisioterapista lo vedrà.',
    shortDose: 'Versione breve',
    times: (n) => (n === 1 ? '1 volta al giorno' : `${n} volte al giorno`),
    checkinTitle: 'Come stai oggi?',
    pain: 'Dolore',
    fatigue: 'Fatica',
    painAnchors: ['0 = nessun dolore', '10 = il peggior dolore immaginabile'],
    fatigueAnchors: ['0 = per niente stanco/a', '10 = completamente esausto/a'],
    note: 'Vuoi aggiungere qualcosa? (facoltativo)',
    saveCheckin: 'Salva',
    checkinSaved: 'Check-in salvato.',
    checkinHint: 'Il tuo fisioterapista vedrà i valori. Se il dolore aumenta molto o compaiono sintomi nuovi, contattalo.',
    education: 'Da leggere',
    open: 'Apri',
  },
  attention: {
    heading: 'Programmi a casa',
    subtitle: 'Pazienti con un programma attivo: sessioni segnate come fatte e check-in, come li riferiscono i pazienti.',
    empty: 'Nessun paziente ha ancora un programma a casa attivo. Crealo dalla scheda del paziente.',
    week: (done, planned) => `${done}/${planned} sessioni in 7 giorni`,
    weekNone: 'nessuna sessione prevista in 7 giorni',
    lastCheckin: (pain, fatigue, date) => `check-in ${date}: dolore ${pain}, fatica ${fatigue}`,
    noCheckin: 'nessun check-in',
    paused: 'programma in mantenimento',
    flags: {
      pain_high: (value, threshold) => `Dolore ${value}/10 (soglia ${threshold})`,
      pain_rise: (from, to) => `Dolore da ${from} a ${to} dall’inizio`,
      fatigue_high: (value, threshold) => `Fatica ${value}/10 (soglia ${threshold})`,
      no_update: (days) => `Nessun aggiornamento da ${days} giorni`,
    },
    noFlags: 'nessuna segnalazione',
    howToRead: 'Come leggere questi dati',
    definitions: [
      'Sessioni: quelle previste negli ultimi 7 giorni (oggi compreso) e quante il paziente ha segnato come fatte o fatte in parte. È ciò che il paziente dichiara, non una misura dell’esecuzione.',
      'Segnalazioni: compaiono solo per le soglie che hai impostato nella scheda del paziente. Senza soglie non compare nulla.',
      'Dolore e fatica: l’ultimo check-in degli ultimi 7 giorni, su scala 0–10. L’aumento è rispetto al primo check-in dall’inizio del programma.',
      'Nessun aggiornamento: nei giorni indicati c’erano sessioni previste e il paziente non ha registrato nulla. Non indica un peggioramento clinico.',
    ],
    open: 'Apri scheda',
    loadError: 'I programmi a casa non sono stati caricati.',
    rulesTitle: 'Quando segnalarmi questo paziente',
    rulesHint: 'Le soglie le decidi tu e il paziente non le vede. Senza soglie non compare nessuna segnalazione in dashboard.',
    painAtOrAbove: 'Dolore pari o superiore a',
    painRise: 'Aumento del dolore rispetto al primo check-in di almeno',
    fatigueAtOrAbove: 'Fatica pari o superiore a',
    noUpdate: 'Nessun aggiornamento per almeno (giorni)',
    off: 'Nessuna soglia',
    saveRules: 'Salva soglie',
    rulesSaved: 'Soglie salvate.',
  },
  booklet: {
    button: 'Scarica l’opuscolo',
    panelTitle: 'Opuscolo per il paziente',
    panelHint: 'Un documento chiaro da consegnare o inviare: riepilogo, percorso, esercizi ed evidenze. Nessuna parte della nota clinica.',
    include: 'Includi',
    title: 'Il tuo percorso',
    summary: 'Cosa abbiamo visto oggi',
    path: 'Il tuo percorso di recupero',
    exercises: 'I tuoi esercizi',
    evidence: 'Su cosa si basa il tuo programma',
    contact: 'Quando contattarmi',
    currentPhase: 'Fase attuale del paziente',
    notSaid: 'Non indicare',
    youAreHere: 'Sei qui',
    goals: 'Obiettivi',
    progressWhen: 'Si passa alla fase successiva quando',
    pathIndicative: 'Le fasi e i tempi sono indicativi: il tuo fisioterapista li adatta alla tua valutazione e ai tuoi progressi.',
    evidenceIntro: 'Il percorso e gli esercizi seguono le indicazioni della ricerca scientifica. Questi sono alcuni degli studi considerati:',
    strength: (s) => `Livello di evidenza: ${s}`,
    guideline: (name, source) => `Protocollo di riferimento per ${name}: ${source}.`,
    making: 'Preparazione dell’opuscolo…',
    error: 'Non è stato possibile creare l’opuscolo. Riprova.',
  },
  plan: {
    days: 'Giorni',
    everyDay: 'Tutti i giorni',
    daysHint: 'Nessun giorno scelto: tutti i giorni tranne quelli di riposo.',
    fromNote: 'Dalla nota di oggi',
    sendToProgram: 'Metti nel programma a casa',
    sending: 'Invio al programma…',
    created: (n) => (n === 1 ? 'Programma a casa creato con 1 esercizio.' : `Programma a casa creato con ${n} esercizi.`),
    updated: (added, changed) => `Programma a casa aggiornato: ${added} ${added === 1 ? 'esercizio aggiunto' : 'esercizi aggiunti'}, ${changed} ${changed === 1 ? 'dose aggiornata' : 'dosi aggiornate'}.`,
    unavailable: 'Il programma a casa non è ancora attivo su questo account.',
    sendError: 'Non è stato possibile aggiornare il programma a casa. Riprova.',
    noExercises: 'Questa nota non contiene esercizi da mettere nel programma.',
    withVideo: 'Con video',
    pdfButton: 'PDF per il paziente',
    pdfTitle: 'Il tuo programma a casa',
    pdfFor: (name) => `Per ${name}`,
    pdfStart: (date) => `Dal ${date}`,
    pdfRest: (days) => `Giorni di riposo: ${days}`,
    pdfTimesPerDay: (n) => (n === 1 ? '1 volta al giorno' : `${n} volte al giorno`),
    pdfShort: 'Se oggi hai poca voglia:',
    pdfApp: 'Ogni giorno segna in My Phygo cosa hai fatto e guarda i video degli esercizi:',
    pdfSafety: 'Se il dolore aumenta molto o compaiono sintomi nuovi, interrompi e contatta il tuo fisioterapista.',
    pdfFooter: 'Preparato dal tuo fisioterapista con PHYGO',
    pdfBy: (name) => `A cura di ${name}`,
    pdfFooterBy: (name) => `Preparato da ${name} con PHYGO`,
    pdfYourPhysio: 'Il tuo fisioterapista',
    pdfNoName: 'Il PDF non riporta il tuo nome: aggiungilo in Profilo.',
    noProtocol: (c) => `Nessuna scheda clinica con protocollo riabilitativo trovata per «${c}». Esercizi e nota restano disponibili.`,
    pdfError: 'Non è stato possibile creare il PDF. Riprova.',
  },
  library: {
    addFromLibrary: 'Aggiungi dalla sezione Esercizi',
    createFromLibrary: 'Crea dalla sezione Esercizi',
    title: 'Esercizi dalla sezione Esercizi',
    hint: 'Il paziente vedrà il video e le istruzioni dell’esercizio. Il dosaggio lo decidi tu.',
    search: 'Cerca per nome, muscolo, zona o attrezzo',
    linked: 'Già collegati a questo paziente',
    all: 'Tutti gli esercizi',
    loading: 'Caricamento degli esercizi…',
    loadError: 'Non è stato possibile caricare gli esercizi. Riprova.',
    noResults: 'Nessun esercizio trovato.',
    more: (n) => `Altri ${n} risultati: affina la ricerca.`,
    selected: (n) => (n === 1 ? '1 selezionato' : `${n} selezionati`),
    add: (n) => (n === 0 ? 'Aggiungi' : n === 1 ? 'Aggiungi 1 esercizio' : `Aggiungi ${n} esercizi`),
    needOne: 'Aggiungi almeno un esercizio.',
    close: 'Chiudi',
    fromLibrary: 'Dalla sezione Esercizi',
    doseFromYou: 'Indica tu serie, ripetizioni o durata.',
    showHow: 'Guarda come si fa',
    hideHow: 'Nascondi il video',
    linkedPending: (n) => (n === 1 ? 'Hai collegato 1 esercizio a questo paziente dalla sezione Esercizi: non è ancora nel programma a casa.' : `Hai collegato ${n} esercizi a questo paziente dalla sezione Esercizi: non sono ancora nel programma a casa.`),
    addLinked: 'Mettili nel programma',
    openProgram: 'Apri il programma a casa',
  },
}

const en: CareDict = {
  clinician: {
    heading: 'Home programme',
    subtitle: 'What the patient finds every day in My Phygo. Only you decide it.',
    empty: 'No programme yet. Create it from the latest note’s exercises, then check dose, days and rest.',
    createFromNote: 'Create from latest note',
    createBlank: 'Start from scratch',
    noExercisesInNote: 'The latest note has no exercises: add them below.',
    titleLabel: 'Title',
    defaultTitle: 'Home programme',
    startLabel: 'Start',
    restDays: 'Rest days',
    restHint: 'On rest days the patient sees no activity and cannot record any.',
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    exerciseN: (n) => `Exercise ${n}`,
    name: 'Name',
    instructions: 'Instructions for the patient',
    sets: 'Sets',
    reps: 'Reps',
    duration: 'Duration (seconds)',
    timesPerDay: 'Times a day',
    doseNotes: 'Dose notes',
    shortVariant: 'Short variant (optional)',
    shortHint: 'The patient only sees it after choosing “Low energy today”. If you leave it empty, PHYGO never lowers the dose.',
    addExercise: 'Add exercise',
    remove: 'Remove',
    dailyCheckin: 'Ask for a daily pain and fatigue check-in (0–10)',
    save: 'Save programme',
    saving: 'Saving…',
    saved: 'Programme saved.',
    saveError: 'The programme could not be saved. Try again.',
    needName: 'Give every exercise a name.',
    cancel: 'Cancel',
    edit: 'Edit',
    loadError: 'The programme could not be loaded.',
    retry: 'Retry',
    status: { active: 'Active', paused: 'Paused', maintenance: 'Maintenance', completed: 'Completed' },
    pause: 'Pause',
    resume: 'Resume',
    complete: 'Complete',
    toMaintenance: 'Switch to maintenance',
    last7: (done, planned) => `Last 7 days: ${done} of ${planned} sessions marked as done`,
    last7None: 'Last 7 days: no sessions planned',
    selfReported: 'Reported by the patient: a tick does not prove the exercise was done correctly.',
    checkinsOn: 'Daily pain and fatigue check-in',
    lastCheckin: (pain, fatigue, date) => `Latest check-in (${date}): pain ${pain}, fatigue ${fatigue}`,
    noDose: 'no dose given',
    sessionsPerDay: (n) => (n === 1 ? 'once a day' : `${n} times a day`),
    shortAvailable: 'short variant available',
  },
  patient: {
    heading: 'Today',
    subtitle: 'The activities in your programme, set by your physiotherapist.',
    progress: (done, total) => `${done} of ${total}`,
    rest: 'Today is a rest day: recovering is part of the programme too.',
    paused: 'Your programme is paused. Your physiotherapist will tell you when to resume.',
    outside: 'Your programme has no activities today.',
    nothing: 'There are no activities for today.',
    allDone: 'You have recorded all of today’s activities.',
    session: (n) => `Session ${n}`,
    status: { done: 'Done', partial: 'Partly', skipped: 'Skipped' },
    recorded: { done: 'Done', partial: 'Partly done', skipped: 'Skipped' },
    change: 'Change',
    saveError: 'Not saved. Try again.',
    honest: 'Only record what you really did: it helps your physiotherapist follow you.',
    lowEnergy: 'Low energy today',
    lowEnergyHint: 'We only show a short version where your physiotherapist prepared one.',
    noShort: 'There is no short version of this exercise. If you can’t do it today, mark it as skipped: your physiotherapist will see it.',
    shortDose: 'Short version',
    times: (n) => (n === 1 ? 'once a day' : `${n} times a day`),
    checkinTitle: 'How are you today?',
    pain: 'Pain',
    fatigue: 'Fatigue',
    painAnchors: ['0 = no pain', '10 = worst pain imaginable'],
    fatigueAnchors: ['0 = not tired at all', '10 = completely exhausted'],
    note: 'Anything to add? (optional)',
    saveCheckin: 'Save',
    checkinSaved: 'Check-in saved.',
    checkinHint: 'Your physiotherapist will see these values. If pain rises a lot or new symptoms appear, contact them.',
    education: 'To read',
    open: 'Open',
  },
  attention: {
    heading: 'Home programmes',
    subtitle: 'Patients with an active programme: sessions marked as done and check-ins, as the patients report them.',
    empty: 'No patient has an active home programme yet. Create one from the patient page.',
    week: (done, planned) => `${done}/${planned} sessions in 7 days`,
    weekNone: 'no sessions planned in 7 days',
    lastCheckin: (pain, fatigue, date) => `check-in ${date}: pain ${pain}, fatigue ${fatigue}`,
    noCheckin: 'no check-in',
    paused: 'programme in maintenance',
    flags: {
      pain_high: (value, threshold) => `Pain ${value}/10 (threshold ${threshold})`,
      pain_rise: (from, to) => `Pain from ${from} to ${to} since the start`,
      fatigue_high: (value, threshold) => `Fatigue ${value}/10 (threshold ${threshold})`,
      no_update: (days) => `No update for ${days} days`,
    },
    noFlags: 'nothing flagged',
    howToRead: 'How to read this',
    definitions: [
      'Sessions: those planned in the last 7 days (today included) and how many the patient marked as done or partly done. This is what the patient reports, not a measure of how they were done.',
      'Flags: they only appear for the thresholds you set on the patient page. With no threshold nothing appears.',
      'Pain and fatigue: the latest check-in of the last 7 days, on a 0–10 scale. The rise is compared with the first check-in since the programme started.',
      'No update: sessions were planned on those days and the patient recorded nothing. It does not mean a clinical worsening.',
    ],
    open: 'Open record',
    loadError: 'The home programmes could not be loaded.',
    rulesTitle: 'When to flag this patient',
    rulesHint: 'You set the thresholds and the patient does not see them. With no threshold nothing is flagged on the dashboard.',
    painAtOrAbove: 'Pain at or above',
    painRise: 'Pain rise from the first check-in of at least',
    fatigueAtOrAbove: 'Fatigue at or above',
    noUpdate: 'No update for at least (days)',
    off: 'No threshold',
    saveRules: 'Save thresholds',
    rulesSaved: 'Thresholds saved.',
  },
  booklet: {
    button: 'Download the booklet',
    panelTitle: 'Patient booklet',
    panelHint: 'A clear document to hand over or send: summary, recovery path, exercises and evidence. No part of the clinical note.',
    include: 'Include',
    title: 'Your recovery path',
    summary: 'What we saw today',
    path: 'Your recovery path',
    exercises: 'Your exercises',
    evidence: 'What your programme is based on',
    contact: 'When to contact me',
    currentPhase: 'Patient’s current phase',
    notSaid: 'Do not show',
    youAreHere: 'You are here',
    goals: 'Goals',
    progressWhen: 'You move to the next phase when',
    pathIndicative: 'The phases and timings are indicative: your physiotherapist adapts them to your assessment and your progress.',
    evidenceIntro: 'The path and the exercises follow what research recommends. These are some of the studies considered:',
    strength: (s) => `Level of evidence: ${s}`,
    guideline: (name, source) => `Reference protocol for ${name}: ${source}.`,
    making: 'Preparing the booklet…',
    error: 'The booklet could not be created. Try again.',
  },
  plan: {
    days: 'Days',
    everyDay: 'Every day',
    daysHint: 'No day chosen: every day except rest days.',
    fromNote: 'From today’s note',
    sendToProgram: 'Put in the home programme',
    sending: 'Sending to the programme…',
    created: (n) => (n === 1 ? 'Home programme created with 1 exercise.' : `Home programme created with ${n} exercises.`),
    updated: (added, changed) => `Home programme updated: ${added} ${added === 1 ? 'exercise added' : 'exercises added'}, ${changed} ${changed === 1 ? 'dose updated' : 'doses updated'}.`,
    unavailable: 'The home programme is not active on this account yet.',
    sendError: 'The home programme could not be updated. Try again.',
    noExercises: 'This note has no exercises to put in the programme.',
    withVideo: 'With video',
    pdfButton: 'PDF for the patient',
    pdfTitle: 'Your home programme',
    pdfFor: (name) => `For ${name}`,
    pdfStart: (date) => `From ${date}`,
    pdfRest: (days) => `Rest days: ${days}`,
    pdfTimesPerDay: (n) => (n === 1 ? 'Once a day' : `${n} times a day`),
    pdfShort: 'On a low-energy day:',
    pdfApp: 'Every day, record what you did in My Phygo and watch the exercise videos:',
    pdfSafety: 'If the pain gets much worse or new symptoms appear, stop and contact your physiotherapist.',
    pdfFooter: 'Prepared by your physiotherapist with PHYGO',
    pdfBy: (name) => `By ${name}`,
    pdfFooterBy: (name) => `Prepared by ${name} with PHYGO`,
    pdfYourPhysio: 'Your physiotherapist',
    pdfNoName: 'The PDF does not show your name: add it in Profile.',
    noProtocol: (c) => `No clinical sheet with a rehab protocol was found for “${c}”. The note and exercises are still available.`,
    pdfError: 'The PDF could not be created. Try again.',
  },
  library: {
    addFromLibrary: 'Add from the Exercises section',
    createFromLibrary: 'Create from the Exercises section',
    title: 'Exercises from the Exercises section',
    hint: 'The patient will see the exercise video and instructions. You set the dose.',
    search: 'Search by name, muscle, area or equipment',
    linked: 'Already linked to this patient',
    all: 'All exercises',
    loading: 'Loading exercises…',
    loadError: 'The exercises could not be loaded. Try again.',
    noResults: 'No exercises found.',
    more: (n) => `${n} more results: refine the search.`,
    selected: (n) => `${n} selected`,
    add: (n) => (n === 0 ? 'Add' : n === 1 ? 'Add 1 exercise' : `Add ${n} exercises`),
    needOne: 'Add at least one exercise.',
    close: 'Close',
    fromLibrary: 'From the Exercises section',
    doseFromYou: 'Set the sets, reps or duration yourself.',
    showHow: 'See how it’s done',
    hideHow: 'Hide the video',
    linkedPending: (n) => (n === 1 ? 'You linked 1 exercise to this patient from the Exercises section: it is not in the home programme yet.' : `You linked ${n} exercises to this patient from the Exercises section: they are not in the home programme yet.`),
    addLinked: 'Add them to the programme',
    openProgram: 'Open the home programme',
  },
}

const es: CareDict = {
  clinician: {
    heading: 'Programa en casa',
    subtitle: 'Lo que el paciente encuentra cada día en My Phygo. Solo tú lo decides.',
    empty: 'Aún no hay programa. Créalo con los ejercicios de la última nota y revisa dosis, días y descanso.',
    createFromNote: 'Crear desde la última nota',
    createBlank: 'Empezar de cero',
    noExercisesInNote: 'La última nota no tiene ejercicios: añádelos abajo.',
    titleLabel: 'Título',
    defaultTitle: 'Programa en casa',
    startLabel: 'Inicio',
    restDays: 'Días de descanso',
    restHint: 'Los días de descanso el paciente no ve actividades ni puede registrarlas.',
    weekdays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    exerciseN: (n) => `Ejercicio ${n}`,
    name: 'Nombre',
    instructions: 'Instrucciones para el paciente',
    sets: 'Series',
    reps: 'Repeticiones',
    duration: 'Duración (segundos)',
    timesPerDay: 'Veces al día',
    doseNotes: 'Notas sobre la dosis',
    shortVariant: 'Variante corta (opcional)',
    shortHint: 'El paciente solo la ve si indica “Hoy tengo pocas ganas”. Si la dejas vacía, PHYGO nunca reduce la dosis.',
    addExercise: 'Añadir ejercicio',
    remove: 'Quitar',
    dailyCheckin: 'Pedir cada día el registro de dolor y fatiga (0–10)',
    save: 'Guardar programa',
    saving: 'Guardando…',
    saved: 'Programa guardado.',
    saveError: 'No se pudo guardar el programa. Inténtalo de nuevo.',
    needName: 'Pon un nombre a cada ejercicio.',
    cancel: 'Cancelar',
    edit: 'Editar',
    loadError: 'No se pudo cargar el programa.',
    retry: 'Reintentar',
    status: { active: 'Activo', paused: 'En pausa', maintenance: 'Mantenimiento', completed: 'Terminado' },
    pause: 'Pausar',
    resume: 'Reanudar',
    complete: 'Terminar',
    toMaintenance: 'Pasar a mantenimiento',
    last7: (done, planned) => `Últimos 7 días: ${done} de ${planned} sesiones marcadas como hechas`,
    last7None: 'Últimos 7 días: ninguna sesión prevista',
    selfReported: 'Indicado por el paciente: una marca no prueba que el ejercicio se haya hecho correctamente.',
    checkinsOn: 'Registro diario de dolor y fatiga',
    lastCheckin: (pain, fatigue, date) => `Último registro (${date}): dolor ${pain}, fatiga ${fatigue}`,
    noDose: 'dosis no indicada',
    sessionsPerDay: (n) => (n === 1 ? '1 vez al día' : `${n} veces al día`),
    shortAvailable: 'variante corta prevista',
  },
  patient: {
    heading: 'Hoy',
    subtitle: 'Las actividades de tu programa, decididas por tu fisioterapeuta.',
    progress: (done, total) => `${done} de ${total}`,
    rest: 'Hoy es día de descanso: recuperarse también forma parte del programa.',
    paused: 'Tu programa está en pausa. Tu fisioterapeuta te dirá cuándo retomarlo.',
    outside: 'Tu programa no tiene actividades hoy.',
    nothing: 'Hoy no hay actividades.',
    allDone: 'Has registrado todas las actividades de hoy.',
    session: (n) => `Sesión ${n}`,
    status: { done: 'Hecho', partial: 'En parte', skipped: 'Saltado' },
    recorded: { done: 'Hecho', partial: 'Hecho en parte', skipped: 'Saltado' },
    change: 'Cambiar',
    saveError: 'No guardado. Inténtalo de nuevo.',
    honest: 'Marca solo lo que has hecho de verdad: ayuda a tu fisioterapeuta a seguirte.',
    lowEnergy: 'Hoy tengo pocas ganas',
    lowEnergyHint: 'Solo mostramos la versión corta donde tu fisioterapeuta la ha previsto.',
    noShort: 'Este ejercicio no tiene versión corta. Si hoy no puedes, márcalo como saltado: tu fisioterapeuta lo verá.',
    shortDose: 'Versión corta',
    times: (n) => (n === 1 ? '1 vez al día' : `${n} veces al día`),
    checkinTitle: '¿Cómo estás hoy?',
    pain: 'Dolor',
    fatigue: 'Fatiga',
    painAnchors: ['0 = sin dolor', '10 = el peor dolor imaginable'],
    fatigueAnchors: ['0 = nada cansado/a', '10 = completamente agotado/a'],
    note: '¿Quieres añadir algo? (opcional)',
    saveCheckin: 'Guardar',
    checkinSaved: 'Registro guardado.',
    checkinHint: 'Tu fisioterapeuta verá estos valores. Si el dolor aumenta mucho o aparecen síntomas nuevos, contáctalo.',
    education: 'Para leer',
    open: 'Abrir',
  },
  attention: {
    heading: 'Programas en casa',
    subtitle: 'Pacientes con un programa activo: sesiones marcadas como hechas y registros, tal como los indican los pacientes.',
    empty: 'Ningún paciente tiene todavía un programa en casa activo. Créalo desde la ficha del paciente.',
    week: (done, planned) => `${done}/${planned} sesiones en 7 días`,
    weekNone: 'ninguna sesión prevista en 7 días',
    lastCheckin: (pain, fatigue, date) => `registro ${date}: dolor ${pain}, fatiga ${fatigue}`,
    noCheckin: 'sin registro',
    paused: 'programa en mantenimiento',
    flags: {
      pain_high: (value, threshold) => `Dolor ${value}/10 (umbral ${threshold})`,
      pain_rise: (from, to) => `Dolor de ${from} a ${to} desde el inicio`,
      fatigue_high: (value, threshold) => `Fatiga ${value}/10 (umbral ${threshold})`,
      no_update: (days) => `Sin actualizaciones desde hace ${days} días`,
    },
    noFlags: 'sin avisos',
    howToRead: 'Cómo leer estos datos',
    definitions: [
      'Sesiones: las previstas en los últimos 7 días (hoy incluido) y cuántas ha marcado el paciente como hechas o hechas en parte. Es lo que indica el paciente, no una medida de la ejecución.',
      'Avisos: solo aparecen para los umbrales que has fijado en la ficha del paciente. Sin umbrales no aparece nada.',
      'Dolor y fatiga: el último registro de los últimos 7 días, en escala 0–10. El aumento se compara con el primer registro desde el inicio del programa.',
      'Sin actualizaciones: había sesiones previstas en esos días y el paciente no registró nada. No indica un empeoramiento clínico.',
    ],
    open: 'Abrir ficha',
    loadError: 'No se pudieron cargar los programas en casa.',
    rulesTitle: 'Cuándo avisarme de este paciente',
    rulesHint: 'Los umbrales los decides tú y el paciente no los ve. Sin umbrales no aparece ningún aviso en el panel.',
    painAtOrAbove: 'Dolor igual o superior a',
    painRise: 'Aumento del dolor respecto al primer registro de al menos',
    fatigueAtOrAbove: 'Fatiga igual o superior a',
    noUpdate: 'Sin actualizaciones durante al menos (días)',
    off: 'Sin umbral',
    saveRules: 'Guardar umbrales',
    rulesSaved: 'Umbrales guardados.',
  },
  booklet: {
    button: 'Descargar el folleto',
    panelTitle: 'Folleto para el paciente',
    panelHint: 'Un documento claro para entregar o enviar: resumen, recorrido, ejercicios y evidencias. Nada de la nota clínica.',
    include: 'Incluir',
    title: 'Tu recorrido',
    summary: 'Lo que vimos hoy',
    path: 'Tu recorrido de recuperación',
    exercises: 'Tus ejercicios',
    evidence: 'En qué se basa tu programa',
    contact: 'Cuándo contactarme',
    currentPhase: 'Fase actual del paciente',
    notSaid: 'No indicar',
    youAreHere: 'Estás aquí',
    goals: 'Objetivos',
    progressWhen: 'Se pasa a la fase siguiente cuando',
    pathIndicative: 'Las fases y los tiempos son orientativos: tu fisioterapeuta los adapta a tu valoración y a tu evolución.',
    evidenceIntro: 'El recorrido y los ejercicios siguen las indicaciones de la investigación científica. Estos son algunos de los estudios considerados:',
    strength: (s) => `Nivel de evidencia: ${s}`,
    guideline: (name, source) => `Protocolo de referencia para ${name}: ${source}.`,
    making: 'Preparando el folleto…',
    error: 'No se ha podido crear el folleto. Inténtalo de nuevo.',
  },
  plan: {
    days: 'Días',
    everyDay: 'Todos los días',
    daysHint: 'Ningún día elegido: todos los días salvo los de descanso.',
    fromNote: 'De la nota de hoy',
    sendToProgram: 'Poner en el programa en casa',
    sending: 'Enviando al programa…',
    created: (n) => (n === 1 ? 'Programa en casa creado con 1 ejercicio.' : `Programa en casa creado con ${n} ejercicios.`),
    updated: (added, changed) => `Programa en casa actualizado: ${added} ${added === 1 ? 'ejercicio añadido' : 'ejercicios añadidos'}, ${changed} ${changed === 1 ? 'dosis actualizada' : 'dosis actualizadas'}.`,
    unavailable: 'El programa en casa aún no está activo en esta cuenta.',
    sendError: 'No se ha podido actualizar el programa en casa. Inténtalo de nuevo.',
    noExercises: 'Esta nota no tiene ejercicios para el programa.',
    withVideo: 'Con vídeo',
    pdfButton: 'PDF para el paciente',
    pdfTitle: 'Tu programa en casa',
    pdfFor: (name) => `Para ${name}`,
    pdfStart: (date) => `Desde el ${date}`,
    pdfRest: (days) => `Días de descanso: ${days}`,
    pdfTimesPerDay: (n) => (n === 1 ? '1 vez al día' : `${n} veces al día`),
    pdfShort: 'Si hoy tienes pocas ganas:',
    pdfApp: 'Cada día, anota en My Phygo lo que has hecho y mira los vídeos de los ejercicios:',
    pdfSafety: 'Si el dolor aumenta mucho o aparecen síntomas nuevos, para y contacta con tu fisioterapeuta.',
    pdfFooter: 'Preparado por tu fisioterapeuta con PHYGO',
    pdfBy: (name) => `Por ${name}`,
    pdfFooterBy: (name) => `Preparado por ${name} con PHYGO`,
    pdfYourPhysio: 'Tu fisioterapeuta',
    pdfNoName: 'El PDF no muestra tu nombre: añádelo en Perfil.',
    noProtocol: (c) => `No se ha encontrado una ficha clínica con protocolo de rehabilitación para «${c}». La nota y los ejercicios siguen disponibles.`,
    pdfError: 'No se ha podido crear el PDF. Inténtalo de nuevo.',
  },
  library: {
    addFromLibrary: 'Añadir desde la sección Ejercicios',
    createFromLibrary: 'Crear desde la sección Ejercicios',
    title: 'Ejercicios de la sección Ejercicios',
    hint: 'El paciente verá el vídeo y las instrucciones del ejercicio. La dosis la decides tú.',
    search: 'Buscar por nombre, músculo, zona o material',
    linked: 'Ya vinculados a este paciente',
    all: 'Todos los ejercicios',
    loading: 'Cargando ejercicios…',
    loadError: 'No se han podido cargar los ejercicios. Inténtalo de nuevo.',
    noResults: 'No se ha encontrado ningún ejercicio.',
    more: (n) => `${n} resultados más: afina la búsqueda.`,
    selected: (n) => (n === 1 ? '1 seleccionado' : `${n} seleccionados`),
    add: (n) => (n === 0 ? 'Añadir' : n === 1 ? 'Añadir 1 ejercicio' : `Añadir ${n} ejercicios`),
    needOne: 'Añade al menos un ejercicio.',
    close: 'Cerrar',
    fromLibrary: 'De la sección Ejercicios',
    doseFromYou: 'Indica tú las series, repeticiones o duración.',
    showHow: 'Ver cómo se hace',
    hideHow: 'Ocultar el vídeo',
    linkedPending: (n) => (n === 1 ? 'Has vinculado 1 ejercicio a este paciente desde la sección Ejercicios: aún no está en el programa en casa.' : `Has vinculado ${n} ejercicios a este paciente desde la sección Ejercicios: aún no están en el programa en casa.`),
    addLinked: 'Añadirlos al programa',
    openProgram: 'Abrir el programa en casa',
  },
}

const fr: CareDict = {
  clinician: {
    heading: 'Programme à domicile',
    subtitle: 'Ce que le patient retrouve chaque jour dans My Phygo. Vous seul le décidez.',
    empty: 'Pas encore de programme. Créez-le à partir des exercices de la dernière note, puis vérifiez dose, jours et repos.',
    createFromNote: 'Créer depuis la dernière note',
    createBlank: 'Partir de zéro',
    noExercisesInNote: 'La dernière note ne contient pas d’exercices : ajoutez-les ci-dessous.',
    titleLabel: 'Titre',
    defaultTitle: 'Programme à domicile',
    startLabel: 'Début',
    restDays: 'Jours de repos',
    restHint: 'Les jours de repos, le patient ne voit aucune activité et ne peut rien enregistrer.',
    weekdays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    exerciseN: (n) => `Exercice ${n}`,
    name: 'Nom',
    instructions: 'Instructions pour le patient',
    sets: 'Séries',
    reps: 'Répétitions',
    duration: 'Durée (secondes)',
    timesPerDay: 'Fois par jour',
    doseNotes: 'Notes sur la dose',
    shortVariant: 'Variante courte (facultative)',
    shortHint: 'Le patient ne la voit que s’il indique « Peu d’énergie aujourd’hui ». Si vous la laissez vide, PHYGO ne réduit jamais la dose.',
    addExercise: 'Ajouter un exercice',
    remove: 'Retirer',
    dailyCheckin: 'Demander chaque jour le relevé de douleur et de fatigue (0–10)',
    save: 'Enregistrer le programme',
    saving: 'Enregistrement…',
    saved: 'Programme enregistré.',
    saveError: 'Le programme n’a pas pu être enregistré. Réessayez.',
    needName: 'Donnez un nom à chaque exercice.',
    cancel: 'Annuler',
    edit: 'Modifier',
    loadError: 'Le programme n’a pas pu être chargé.',
    retry: 'Réessayer',
    status: { active: 'Actif', paused: 'En pause', maintenance: 'Entretien', completed: 'Terminé' },
    pause: 'Mettre en pause',
    resume: 'Reprendre',
    complete: 'Terminer',
    toMaintenance: 'Passer en entretien',
    last7: (done, planned) => `7 derniers jours : ${done} séances sur ${planned} marquées comme faites`,
    last7None: '7 derniers jours : aucune séance prévue',
    selfReported: 'Déclaré par le patient : une coche ne prouve pas que l’exercice a été fait correctement.',
    checkinsOn: 'Relevé quotidien de douleur et de fatigue',
    lastCheckin: (pain, fatigue, date) => `Dernier relevé (${date}) : douleur ${pain}, fatigue ${fatigue}`,
    noDose: 'dose non indiquée',
    sessionsPerDay: (n) => (n === 1 ? '1 fois par jour' : `${n} fois par jour`),
    shortAvailable: 'variante courte prévue',
  },
  patient: {
    heading: 'Aujourd’hui',
    subtitle: 'Les activités de votre programme, décidées par votre kinésithérapeute.',
    progress: (done, total) => `${done} sur ${total}`,
    rest: 'Aujourd’hui est un jour de repos : récupérer fait aussi partie du programme.',
    paused: 'Votre programme est en pause. Votre kinésithérapeute vous dira quand reprendre.',
    outside: 'Votre programme ne prévoit pas d’activité aujourd’hui.',
    nothing: 'Aucune activité aujourd’hui.',
    allDone: 'Vous avez noté toutes les activités du jour.',
    session: (n) => `Séance ${n}`,
    status: { done: 'Fait', partial: 'En partie', skipped: 'Passé' },
    recorded: { done: 'Fait', partial: 'Fait en partie', skipped: 'Passé' },
    change: 'Modifier',
    saveError: 'Non enregistré. Réessayez.',
    honest: 'Notez seulement ce que vous avez vraiment fait : cela aide votre kinésithérapeute à vous suivre.',
    lowEnergy: 'Peu d’énergie aujourd’hui',
    lowEnergyHint: 'Nous ne montrons une version courte que là où votre kinésithérapeute l’a prévue.',
    noShort: 'Cet exercice n’a pas de version courte. Si vous n’y arrivez pas aujourd’hui, marquez-le comme passé : votre kinésithérapeute le verra.',
    shortDose: 'Version courte',
    times: (n) => (n === 1 ? '1 fois par jour' : `${n} fois par jour`),
    checkinTitle: 'Comment allez-vous aujourd’hui ?',
    pain: 'Douleur',
    fatigue: 'Fatigue',
    painAnchors: ['0 = aucune douleur', '10 = la pire douleur imaginable'],
    fatigueAnchors: ['0 = pas du tout fatigué(e)', '10 = complètement épuisé(e)'],
    note: 'Quelque chose à ajouter ? (facultatif)',
    saveCheckin: 'Enregistrer',
    checkinSaved: 'Relevé enregistré.',
    checkinHint: 'Votre kinésithérapeute verra ces valeurs. Si la douleur augmente beaucoup ou si de nouveaux symptômes apparaissent, contactez-le.',
    education: 'À lire',
    open: 'Ouvrir',
  },
  attention: {
    heading: 'Programmes à domicile',
    subtitle: 'Patients avec un programme actif : séances marquées comme faites et relevés, tels que les patients les déclarent.',
    empty: 'Aucun patient n’a encore de programme à domicile actif. Créez-le depuis la fiche du patient.',
    week: (done, planned) => `${done}/${planned} séances sur 7 jours`,
    weekNone: 'aucune séance prévue sur 7 jours',
    lastCheckin: (pain, fatigue, date) => `relevé ${date} : douleur ${pain}, fatigue ${fatigue}`,
    noCheckin: 'aucun relevé',
    paused: 'programme en entretien',
    flags: {
      pain_high: (value, threshold) => `Douleur ${value}/10 (seuil ${threshold})`,
      pain_rise: (from, to) => `Douleur de ${from} à ${to} depuis le début`,
      fatigue_high: (value, threshold) => `Fatigue ${value}/10 (seuil ${threshold})`,
      no_update: (days) => `Aucune mise à jour depuis ${days} jours`,
    },
    noFlags: 'aucun signalement',
    howToRead: 'Comment lire ces données',
    definitions: [
      'Séances : celles prévues sur les 7 derniers jours (aujourd’hui compris) et combien le patient a marquées comme faites ou faites en partie. C’est ce que le patient déclare, pas une mesure de l’exécution.',
      'Signalements : ils n’apparaissent que pour les seuils que vous avez fixés sur la fiche du patient. Sans seuil, rien n’apparaît.',
      'Douleur et fatigue : le dernier relevé des 7 derniers jours, sur une échelle de 0 à 10. La hausse est comparée au premier relevé depuis le début du programme.',
      'Aucune mise à jour : des séances étaient prévues ces jours-là et le patient n’a rien enregistré. Cela n’indique pas une aggravation clinique.',
    ],
    open: 'Ouvrir la fiche',
    loadError: 'Les programmes à domicile n’ont pas pu être chargés.',
    rulesTitle: 'Quand me signaler ce patient',
    rulesHint: 'Vous fixez les seuils et le patient ne les voit pas. Sans seuil, rien n’est signalé sur le tableau de bord.',
    painAtOrAbove: 'Douleur égale ou supérieure à',
    painRise: 'Hausse de la douleur depuis le premier relevé d’au moins',
    fatigueAtOrAbove: 'Fatigue égale ou supérieure à',
    noUpdate: 'Aucune mise à jour pendant au moins (jours)',
    off: 'Aucun seuil',
    saveRules: 'Enregistrer les seuils',
    rulesSaved: 'Seuils enregistrés.',
  },
  booklet: {
    button: 'Télécharger la brochure',
    panelTitle: 'Brochure pour le patient',
    panelHint: 'Un document clair à remettre ou envoyer : résumé, parcours, exercices et données probantes. Rien de la note clinique.',
    include: 'Inclure',
    title: 'Votre parcours',
    summary: 'Ce que nous avons vu aujourd’hui',
    path: 'Votre parcours de récupération',
    exercises: 'Vos exercices',
    evidence: 'Sur quoi repose votre programme',
    contact: 'Quand me contacter',
    currentPhase: 'Phase actuelle du patient',
    notSaid: 'Ne pas indiquer',
    youAreHere: 'Vous êtes ici',
    goals: 'Objectifs',
    progressWhen: 'On passe à la phase suivante quand',
    pathIndicative: 'Les phases et les durées sont indicatives : votre kinésithérapeute les adapte à votre évaluation et à vos progrès.',
    evidenceIntro: 'Le parcours et les exercices suivent les recommandations de la recherche scientifique. Voici quelques-unes des études prises en compte :',
    strength: (s) => `Niveau de preuve : ${s}`,
    guideline: (name, source) => `Protocole de référence pour ${name} : ${source}.`,
    making: 'Préparation de la brochure…',
    error: 'Impossible de créer la brochure. Réessayez.',
  },
  plan: {
    days: 'Jours',
    everyDay: 'Tous les jours',
    daysHint: 'Aucun jour choisi : tous les jours sauf les jours de repos.',
    fromNote: 'De la note du jour',
    sendToProgram: 'Mettre dans le programme à domicile',
    sending: 'Envoi au programme…',
    created: (n) => (n === 1 ? 'Programme à domicile créé avec 1 exercice.' : `Programme à domicile créé avec ${n} exercices.`),
    updated: (added, changed) => `Programme à domicile mis à jour : ${added} ${added === 1 ? 'exercice ajouté' : 'exercices ajoutés'}, ${changed} ${changed === 1 ? 'dosage mis à jour' : 'dosages mis à jour'}.`,
    unavailable: 'Le programme à domicile n’est pas encore actif sur ce compte.',
    sendError: 'Impossible de mettre à jour le programme à domicile. Réessayez.',
    noExercises: 'Cette note ne contient pas d’exercices pour le programme.',
    withVideo: 'Avec vidéo',
    pdfButton: 'PDF pour le patient',
    pdfTitle: 'Votre programme à domicile',
    pdfFor: (name) => `Pour ${name}`,
    pdfStart: (date) => `À partir du ${date}`,
    pdfRest: (days) => `Jours de repos : ${days}`,
    pdfTimesPerDay: (n) => (n === 1 ? '1 fois par jour' : `${n} fois par jour`),
    pdfShort: 'Si vous manquez d’énergie aujourd’hui :',
    pdfApp: 'Chaque jour, notez dans My Phygo ce que vous avez fait et regardez les vidéos des exercices :',
    pdfSafety: 'Si la douleur augmente beaucoup ou si de nouveaux symptômes apparaissent, arrêtez et contactez votre kinésithérapeute.',
    pdfFooter: 'Préparé par votre kinésithérapeute avec PHYGO',
    pdfBy: (name) => `Par ${name}`,
    pdfFooterBy: (name) => `Préparé par ${name} avec PHYGO`,
    pdfYourPhysio: 'Votre kinésithérapeute',
    pdfNoName: 'Le PDF n’indique pas votre nom : ajoutez-le dans Profil.',
    noProtocol: (c) => `Aucune fiche clinique avec protocole de rééducation trouvée pour « ${c} ». La note et les exercices restent disponibles.`,
    pdfError: 'Impossible de créer le PDF. Réessayez.',
  },
  library: {
    addFromLibrary: 'Ajouter depuis la section Exercices',
    createFromLibrary: 'Créer depuis la section Exercices',
    title: 'Exercices de la section Exercices',
    hint: 'Le patient verra la vidéo et les consignes de l’exercice. C’est vous qui fixez le dosage.',
    search: 'Rechercher par nom, muscle, zone ou matériel',
    linked: 'Déjà liés à ce patient',
    all: 'Tous les exercices',
    loading: 'Chargement des exercices…',
    loadError: 'Impossible de charger les exercices. Réessayez.',
    noResults: 'Aucun exercice trouvé.',
    more: (n) => `${n} autres résultats : affinez la recherche.`,
    selected: (n) => (n === 1 ? '1 sélectionné' : `${n} sélectionnés`),
    add: (n) => (n === 0 ? 'Ajouter' : n === 1 ? 'Ajouter 1 exercice' : `Ajouter ${n} exercices`),
    needOne: 'Ajoutez au moins un exercice.',
    close: 'Fermer',
    fromLibrary: 'De la section Exercices',
    doseFromYou: 'Indiquez vous-même les séries, répétitions ou la durée.',
    showHow: 'Voir comment faire',
    hideHow: 'Masquer la vidéo',
    linkedPending: (n) => (n === 1 ? 'Vous avez lié 1 exercice à ce patient depuis la section Exercices : il n’est pas encore dans le programme à domicile.' : `Vous avez lié ${n} exercices à ce patient depuis la section Exercices : ils ne sont pas encore dans le programme à domicile.`),
    addLinked: 'Les ajouter au programme',
    openProgram: 'Ouvrir le programme à domicile',
  },
}

export const CARE_STRINGS: Record<AppLang, CareDict> = { it, en, es, fr }
