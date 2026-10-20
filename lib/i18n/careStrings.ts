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
}

export const CARE_STRINGS: Record<AppLang, CareDict> = { it, en, es, fr }
