// PHYGO Workspace — UI string dictionary, kept as its own file rather than
// appended into the existing 320KB lib/i18n/uiStrings.ts (a single hand-edited
// file shared by the entire dashboard). Same AppLang type, same 4 languages,
// same LanguageContext — just isolated so Workspace ships without touching a
// large shared file it doesn't need to.
'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { AppLang } from '@/lib/i18n/uiStrings'

interface WorkspaceDict {
  nav: {
    workspace: string
    home: string
    starred: string
    trash: string
  }
  home: {
    title: string
    subtitle: string
    continueReading: string
    recent: string
    starredSection: string
    quickActions: string
    newFolder: string
    newNotebook: string
    importPdf: string
    empty: string
  }
  folder: {
    root: string
    empty: string
    documents: string
    notebooks: string
    folders: string
  }
  item: {
    rename: string
    move: string
    star: string
    unstar: string
    color: string
    delete: string
    restore: string
    deleteForever: string
    tags: string
    open: string
    pages: string
    lastOpened: string
  }
  dialog: {
    newFolderTitle: string
    newFolderPlaceholder: string
    newNotebookTitle: string
    newNotebookPlaceholder: string
    renameTitle: string
    moveTitle: string
    moveToRoot: string
    confirmDeleteTitle: string
    confirmDeleteBody: string
    cancel: string
    create: string
    save: string
    move: string
    delete: string
  }
  import: {
    button: string
    uploading: string
    processing: string
    failed: string
    onlyPdf: string
  }
  reader: {
    page: string
    of: string
    zoomIn: string
    zoomOut: string
    fitWidth: string
    fitPage: string
    thumbnails: string
    search: string
    searchPlaceholder: string
    noResults: string
    matches: string
    bookmarkPage: string
    bookmarked: string
    focusMode: string
    exportPdf: string
  }
  annotate: {
    select: string
    pen: string
    line: string
    rectangle: string
    ellipse: string
    highlighter: string
    eraser: string
    eraserSize: string
    text: string
    textPlaceholder: string
    shape: string
    insertImage: string
    uploadPhoto: string
    takePhoto: string
    imageOnly: string
    /** Contains the literal token "{max}", replaced with the size limit in MB. */
    fileTooLarge: string
    sessionExpired: string
    color: string
    thickness: string
    undo: string
    redo: string
    clearPage: string
    noBackground: string
  }
  ask: {
    button: string
    title: string
    placeholder: string
    send: string
    thinking: string
    limitReached: string
    close: string
    disclaimer: string
    empty: string
    genericError: string
    networkError: string
  }
  notebook: {
    newPage: string
    duplicatePage: string
    deletePage: string
    template: string
    templateBlank: string
    templateRuled: string
    templateGrid: string
    templateDotted: string
    untitled: string
    format: string
    formatA4: string
    formatLetter: string
    formatSquare: string
    paperColor: string
    pageSettings: string
    deletePageConfirm: string
    lastPage: string
  }
  tags: {
    addTag: string
    placeholder: string
  }
  save: {
    saving: string
    saved: string
    offline: string
  }
  search: {
    placeholder: string
    noResults: string
    resultsIn: string
  }
  insight: {
    title: string
    comingSoon: string
  }
  studyPanel: {
    explore: string
    title: string
    selectionLabel: string
    loading: string
    empty: string
    error: string
    addToDocument: string
    addedToDocument: string
    saveToWorkspace: string
    savedToWorkspace: string
    removeFromWorkspace: string
    myNote: string
    myNotePlaceholder: string
    noteSaved: string
    close: string
    back: string
    openInPhygo: string
    scientificEvidence: string
    open3dAnatomy: string
    addToConceptMap: string
    testMe: string
    comingSoon: string
    sections: {
      goals: string
      clinical_tests: string
      red_flags: string
      typical_exercises: string
      outcome_measures: string
      progression_criteria: string
      return_to_activity_criteria: string
      contraindications: string
      anatomy: string
      function: string
      clinical_relevance: string
      procedure: string
      interpretation: string
    }
    systems: {
      cardiopulmonary: string
      oncology: string
      'pelvic-floor': string
      endocrine: string
      urinary: string
      gastrointestinal: string
      immune: string
      hematology: string
    }
  }
  // SELECT TEXT → Copy / Highlight / Add to Notes (PHYGO Student Experience
  // audit PART 9/11/13) — the small action row TextSelectionPopup shows
  // alongside its existing "Explore with PHYGO" button whenever the user
  // selects real PDF text.
  selectionPopup: {
    copy: string
    copied: string
    highlight: string
    addToNotes: string
    addedToNotes: string
  }
}

const it: WorkspaceDict = {
  nav: { workspace: 'Workspace', home: 'Home', starred: 'Preferiti', trash: 'Cestino' },
  home: {
    title: 'Il tuo Workspace',
    subtitle: 'Studia, organizza e costruisci la tua conoscenza.',
    continueReading: 'Riprendi da dove avevi lasciato',
    recent: 'Recenti',
    starredSection: 'Preferiti',
    quickActions: 'Azioni rapide',
    newFolder: 'Nuova cartella',
    newNotebook: 'Nuovo notebook',
    importPdf: 'Importa PDF',
    empty: 'Il tuo Workspace è vuoto — importa un PDF o crea il tuo primo notebook.',
  },
  folder: { root: 'Il mio Workspace', empty: 'Questa cartella è vuota', documents: 'Documenti', notebooks: 'Notebook', folders: 'Cartelle' },
  item: {
    rename: 'Rinomina', move: 'Sposta', star: 'Aggiungi ai preferiti', unstar: 'Rimuovi dai preferiti', color: 'Colore',
    delete: 'Sposta nel cestino', restore: 'Ripristina', deleteForever: 'Elimina definitivamente',
    tags: 'Tag', open: 'Apri', pages: 'pagine', lastOpened: 'Ultimo accesso',
  },
  dialog: {
    newFolderTitle: 'Nuova cartella', newFolderPlaceholder: 'Nome della cartella',
    newNotebookTitle: 'Nuovo notebook', newNotebookPlaceholder: 'Nome del notebook',
    renameTitle: 'Rinomina', moveTitle: 'Sposta in…', moveToRoot: 'Il mio Workspace (radice)',
    confirmDeleteTitle: 'Spostare nel cestino?', confirmDeleteBody: 'Potrai ripristinarlo in qualsiasi momento dal Cestino.',
    cancel: 'Annulla', create: 'Crea', save: 'Salva', move: 'Sposta', delete: 'Sposta nel cestino',
  },
  import: { button: 'Importa PDF', uploading: 'Caricamento…', processing: 'Elaborazione…', failed: 'Importazione non riuscita', onlyPdf: 'Per ora sono supportati solo file PDF' },
  reader: {
    page: 'Pagina', of: 'di', zoomIn: 'Zoom avanti', zoomOut: 'Zoom indietro', fitWidth: 'Adatta larghezza', fitPage: 'Adatta pagina',
    thumbnails: 'Miniature', search: 'Cerca nel documento', searchPlaceholder: 'Cerca nel testo…', noResults: 'Nessun risultato',
    matches: 'risultati', bookmarkPage: 'Segna pagina', bookmarked: 'Pagina segnata', focusMode: 'Modalità focus', exportPdf: 'Esporta PDF',
  },
  annotate: {
    select: 'Seleziona', pen: 'Penna', line: 'Linea', rectangle: 'Rettangolo', ellipse: 'Cerchio',
    highlighter: 'Evidenziatore', eraser: 'Gomma', eraserSize: 'Dimensione gomma', text: 'Testo', textPlaceholder: 'Scrivi una nota…', shape: 'Forma',
    color: 'Colore', thickness: 'Spessore', undo: 'Annulla', redo: 'Ripeti', clearPage: 'Cancella annotazioni pagina', noBackground: 'Nessuno sfondo',
    insertImage: 'Inserisci immagine', uploadPhoto: 'Carica foto', takePhoto: 'Scatta foto', imageOnly: 'Seleziona un file immagine',
    fileTooLarge: 'File troppo grande (max {max}MB).', sessionExpired: 'Sessione scaduta — accedi di nuovo.',
  },
  notebook: {
    newPage: 'Nuova pagina', duplicatePage: 'Duplica pagina', deletePage: 'Elimina pagina', template: 'Modello',
    templateBlank: 'Bianca', templateRuled: 'A righe', templateGrid: 'A quadretti', templateDotted: 'A puntini', untitled: 'Notebook senza titolo',
    format: 'Formato', formatA4: 'A4', formatLetter: 'Letter', formatSquare: 'Quadrato', paperColor: 'Colore del foglio',
    pageSettings: 'Impostazioni pagina', deletePageConfirm: 'Eliminare questa pagina?', lastPage: 'Il notebook deve avere almeno una pagina',
  },
  tags: { addTag: 'Aggiungi tag', placeholder: 'es. Esame, Anatomia…' },
  save: { saving: 'Salvataggio…', saved: 'Salvato', offline: 'Offline — verrà sincronizzato' },
  search: { placeholder: 'Cerca nel Workspace…', noResults: 'Nessun risultato', resultsIn: 'in' },
  insight: { title: 'PHYGO Insight', comingSoon: 'I collegamenti contestuali alla Libreria PHYGO arriveranno qui.' },
  studyPanel: {
    explore: 'Esplora con PHYGO',
    title: 'PHYGO Smart Study Panel',
    selectionLabel: 'Testo selezionato',
    loading: 'Ricerca nella Libreria PHYGO…',
    empty: 'Nessuna corrispondenza trovata nella Libreria PHYGO per questo testo.',
    error: 'Qualcosa è andato storto durante la ricerca.',
    addToDocument: 'Aggiungi al documento',
    addedToDocument: 'Aggiunto al documento',
    saveToWorkspace: 'Salva nel Workspace',
    savedToWorkspace: 'Salvato nel Workspace',
    removeFromWorkspace: 'Rimuovi dal Workspace',
    myNote: 'La mia nota',
    myNotePlaceholder: 'Aggiungi una nota personale…',
    noteSaved: 'Nota salvata',
    close: 'Chiudi',
    back: 'Indietro',
    openInPhygo: 'Apri in PHYGO',
    scientificEvidence: 'Evidenza scientifica',
    open3dAnatomy: 'Apri Anatomia 3D',
    addToConceptMap: 'Aggiungi alla mappa concettuale',
    testMe: 'Mettimi alla prova',
    comingSoon: 'Presto disponibile',
    sections: {
      goals: 'Obiettivi',
      clinical_tests: 'Test clinici',
      red_flags: 'Segnali di allarme',
      typical_exercises: 'Esercizi tipici',
      outcome_measures: 'Misure di esito',
      progression_criteria: 'Criteri di progressione',
      return_to_activity_criteria: 'Criteri di ritorno all’attività',
      contraindications: 'Controindicazioni',
      anatomy: 'Anatomia',
      function: 'Funzione',
      clinical_relevance: 'Rilevanza clinica',
      procedure: 'Procedura',
      interpretation: 'Interpretazione',
    },
    systems: {
      cardiopulmonary: 'Cardiopolmonare',
      oncology: 'Oncologia',
      'pelvic-floor': 'Pavimento pelvico',
      endocrine: 'Endocrino',
      urinary: 'Urinario',
      gastrointestinal: 'Gastrointestinale',
      immune: 'Immunitario',
      hematology: 'Ematologia',
    },
  },
  selectionPopup: {
    copy: 'Copia', copied: 'Copiato', highlight: 'Evidenzia', addToNotes: 'Aggiungi alle note', addedToNotes: 'Aggiunto alle note',
  },
  ask: {
    button: 'Chiedi a PHYGO', title: 'Chiedi a PHYGO', placeholder: 'Fai una domanda su questo documento…', send: 'Invia',
    thinking: 'PHYGO sta pensando…', limitReached: 'Hai raggiunto il limite di domande per il tuo piano. Riprova più tardi o passa a un piano superiore.',
    close: 'Chiudi', disclaimer: 'Le risposte sono un supporto didattico, non un parere clinico definitivo.', empty: 'Fai la tua prima domanda su questo documento.',
    genericError: 'Qualcosa è andato storto.', networkError: 'Errore di rete — riprova.',
  },
}

const en: WorkspaceDict = {
  nav: { workspace: 'Workspace', home: 'Home', starred: 'Starred', trash: 'Trash' },
  home: {
    title: 'Your Workspace', subtitle: 'Study, organize and build your knowledge.', continueReading: 'Continue where you left off', recent: 'Recent', starredSection: 'Starred',
    quickActions: 'Quick actions', newFolder: 'New folder', newNotebook: 'New notebook', importPdf: 'Import PDF',
    empty: 'Your Workspace is empty — import a PDF or create your first notebook.',
  },
  folder: { root: 'My Workspace', empty: 'This folder is empty', documents: 'Documents', notebooks: 'Notebooks', folders: 'Folders' },
  item: {
    rename: 'Rename', move: 'Move', star: 'Add to starred', unstar: 'Remove from starred', color: 'Color',
    delete: 'Move to trash', restore: 'Restore', deleteForever: 'Delete forever',
    tags: 'Tags', open: 'Open', pages: 'pages', lastOpened: 'Last opened',
  },
  dialog: {
    newFolderTitle: 'New folder', newFolderPlaceholder: 'Folder name',
    newNotebookTitle: 'New notebook', newNotebookPlaceholder: 'Notebook name',
    renameTitle: 'Rename', moveTitle: 'Move to…', moveToRoot: 'My Workspace (root)',
    confirmDeleteTitle: 'Move to trash?', confirmDeleteBody: 'You can restore it anytime from Trash.',
    cancel: 'Cancel', create: 'Create', save: 'Save', move: 'Move', delete: 'Move to trash',
  },
  import: { button: 'Import PDF', uploading: 'Uploading…', processing: 'Processing…', failed: 'Import failed', onlyPdf: 'Only PDF files are supported for now' },
  reader: {
    page: 'Page', of: 'of', zoomIn: 'Zoom in', zoomOut: 'Zoom out', fitWidth: 'Fit width', fitPage: 'Fit page',
    thumbnails: 'Thumbnails', search: 'Search document', searchPlaceholder: 'Search text…', noResults: 'No results',
    matches: 'matches', bookmarkPage: 'Bookmark page', bookmarked: 'Page bookmarked', focusMode: 'Focus mode', exportPdf: 'Export PDF',
  },
  annotate: {
    select: 'Select', pen: 'Pen', line: 'Line', rectangle: 'Rectangle', ellipse: 'Circle',
    highlighter: 'Highlighter', eraser: 'Eraser', eraserSize: 'Eraser size', text: 'Text', textPlaceholder: 'Write a note…', shape: 'Shape',
    color: 'Color', thickness: 'Thickness', undo: 'Undo', redo: 'Redo', clearPage: 'Clear page annotations', noBackground: 'No background',
    insertImage: 'Insert image', uploadPhoto: 'Upload photo', takePhoto: 'Take photo', imageOnly: 'Please select an image file',
    fileTooLarge: 'File too large (max {max}MB).', sessionExpired: 'Session expired — please sign in again.',
  },
  notebook: {
    newPage: 'New page', duplicatePage: 'Duplicate page', deletePage: 'Delete page', template: 'Template',
    templateBlank: 'Blank', templateRuled: 'Ruled', templateGrid: 'Grid', templateDotted: 'Dotted', untitled: 'Untitled notebook',
    format: 'Format', formatA4: 'A4', formatLetter: 'Letter', formatSquare: 'Square', paperColor: 'Paper color',
    pageSettings: 'Page settings', deletePageConfirm: 'Delete this page?', lastPage: 'A notebook must keep at least one page',
  },
  tags: { addTag: 'Add tag', placeholder: 'e.g. Exam, Anatomy…' },
  save: { saving: 'Saving…', saved: 'Saved', offline: 'Offline — will sync' },
  search: { placeholder: 'Search Workspace…', noResults: 'No results', resultsIn: 'in' },
  insight: { title: 'PHYGO Insight', comingSoon: 'Contextual links to PHYGO Knowledge will appear here.' },
  studyPanel: {
    explore: 'Explore with PHYGO',
    title: 'PHYGO Smart Study Panel',
    selectionLabel: 'Selected text',
    loading: 'Searching PHYGO Knowledge…',
    empty: 'No match found in PHYGO Knowledge for this text.',
    error: 'Something went wrong while searching.',
    addToDocument: 'Add to Document',
    addedToDocument: 'Added to document',
    saveToWorkspace: 'Save to Workspace',
    savedToWorkspace: 'Saved to Workspace',
    removeFromWorkspace: 'Remove from Workspace',
    myNote: 'My Note',
    myNotePlaceholder: 'Add a personal note…',
    noteSaved: 'Note saved',
    close: 'Close',
    back: 'Back',
    openInPhygo: 'Open in PHYGO',
    scientificEvidence: 'Scientific Evidence',
    open3dAnatomy: 'Open 3D Anatomy',
    addToConceptMap: 'Add to Concept Map',
    testMe: 'Test Me',
    comingSoon: 'Coming soon',
    sections: {
      goals: 'Goals',
      clinical_tests: 'Clinical tests',
      red_flags: 'Red flags',
      typical_exercises: 'Typical exercises',
      outcome_measures: 'Outcome measures',
      progression_criteria: 'Progression criteria',
      return_to_activity_criteria: 'Return-to-activity criteria',
      contraindications: 'Contraindications',
      anatomy: 'Anatomy',
      function: 'Function',
      clinical_relevance: 'Clinical relevance',
      procedure: 'Procedure',
      interpretation: 'Interpretation',
    },
    systems: {
      cardiopulmonary: 'Cardiopulmonary',
      oncology: 'Oncology',
      'pelvic-floor': 'Pelvic Floor',
      endocrine: 'Endocrine',
      urinary: 'Urinary',
      gastrointestinal: 'Gastrointestinal',
      immune: 'Immune',
      hematology: 'Hematology',
    },
  },
  selectionPopup: {
    copy: 'Copy', copied: 'Copied', highlight: 'Highlight', addToNotes: 'Add to notes', addedToNotes: 'Added to notes',
  },
  ask: {
    button: 'Ask PHYGO', title: 'Ask PHYGO', placeholder: 'Ask a question about this document…', send: 'Send',
    thinking: 'PHYGO is thinking…', limitReached: "You've reached your plan's question limit. Try again later or upgrade your plan.",
    close: 'Close', disclaimer: 'Answers are study support, not definitive clinical advice.', empty: 'Ask your first question about this document.',
    genericError: 'Something went wrong.', networkError: 'Network error — please try again.',
  },
}

const es: WorkspaceDict = {
  nav: { workspace: 'Workspace', home: 'Inicio', starred: 'Destacados', trash: 'Papelera' },
  home: {
    title: 'Tu Workspace', subtitle: 'Estudia, organiza y construye tu conocimiento.', continueReading: 'Continúa donde lo dejaste', recent: 'Recientes', starredSection: 'Destacados',
    quickActions: 'Acciones rápidas', newFolder: 'Nueva carpeta', newNotebook: 'Nuevo cuaderno', importPdf: 'Importar PDF',
    empty: 'Tu Workspace está vacío — importa un PDF o crea tu primer cuaderno.',
  },
  folder: { root: 'Mi Workspace', empty: 'Esta carpeta está vacía', documents: 'Documentos', notebooks: 'Cuadernos', folders: 'Carpetas' },
  item: {
    rename: 'Renombrar', move: 'Mover', star: 'Añadir a destacados', unstar: 'Quitar de destacados', color: 'Color',
    delete: 'Mover a la papelera', restore: 'Restaurar', deleteForever: 'Eliminar definitivamente',
    tags: 'Etiquetas', open: 'Abrir', pages: 'páginas', lastOpened: 'Último acceso',
  },
  dialog: {
    newFolderTitle: 'Nueva carpeta', newFolderPlaceholder: 'Nombre de la carpeta',
    newNotebookTitle: 'Nuevo cuaderno', newNotebookPlaceholder: 'Nombre del cuaderno',
    renameTitle: 'Renombrar', moveTitle: 'Mover a…', moveToRoot: 'Mi Workspace (raíz)',
    confirmDeleteTitle: '¿Mover a la papelera?', confirmDeleteBody: 'Podrás restaurarlo cuando quieras desde la Papelera.',
    cancel: 'Cancelar', create: 'Crear', save: 'Guardar', move: 'Mover', delete: 'Mover a la papelera',
  },
  import: { button: 'Importar PDF', uploading: 'Subiendo…', processing: 'Procesando…', failed: 'Error al importar', onlyPdf: 'Por ahora solo se admiten archivos PDF' },
  reader: {
    page: 'Página', of: 'de', zoomIn: 'Acercar', zoomOut: 'Alejar', fitWidth: 'Ajustar ancho', fitPage: 'Ajustar página',
    thumbnails: 'Miniaturas', search: 'Buscar en el documento', searchPlaceholder: 'Buscar texto…', noResults: 'Sin resultados',
    matches: 'resultados', bookmarkPage: 'Marcar página', bookmarked: 'Página marcada', focusMode: 'Modo enfoque', exportPdf: 'Exportar PDF',
  },
  annotate: {
    select: 'Seleccionar', pen: 'Bolígrafo', line: 'Línea', rectangle: 'Rectángulo', ellipse: 'Círculo',
    highlighter: 'Resaltador', eraser: 'Borrador', eraserSize: 'Tamaño del borrador', text: 'Texto', textPlaceholder: 'Escribe una nota…', shape: 'Forma',
    color: 'Color', thickness: 'Grosor', undo: 'Deshacer', redo: 'Rehacer', clearPage: 'Borrar anotaciones de la página', noBackground: 'Sin fondo',
    insertImage: 'Insertar imagen', uploadPhoto: 'Subir foto', takePhoto: 'Tomar foto', imageOnly: 'Selecciona un archivo de imagen',
    fileTooLarge: 'Archivo demasiado grande (máx. {max}MB).', sessionExpired: 'Sesión caducada — inicia sesión de nuevo.',
  },
  notebook: {
    newPage: 'Nueva página', duplicatePage: 'Duplicar página', deletePage: 'Eliminar página', template: 'Plantilla',
    templateBlank: 'En blanco', templateRuled: 'Rayada', templateGrid: 'Cuadriculada', templateDotted: 'Punteada', untitled: 'Cuaderno sin título',
    format: 'Formato', formatA4: 'A4', formatLetter: 'Carta', formatSquare: 'Cuadrado', paperColor: 'Color del papel',
    pageSettings: 'Ajustes de página', deletePageConfirm: '¿Eliminar esta página?', lastPage: 'Un cuaderno debe tener al menos una página',
  },
  tags: { addTag: 'Añadir etiqueta', placeholder: 'ej. Examen, Anatomía…' },
  save: { saving: 'Guardando…', saved: 'Guardado', offline: 'Sin conexión — se sincronizará' },
  search: { placeholder: 'Buscar en Workspace…', noResults: 'Sin resultados', resultsIn: 'en' },
  insight: { title: 'PHYGO Insight', comingSoon: 'Los enlaces contextuales a la Biblioteca PHYGO aparecerán aquí.' },
  studyPanel: {
    explore: 'Explorar con PHYGO',
    title: 'PHYGO Smart Study Panel',
    selectionLabel: 'Texto seleccionado',
    loading: 'Buscando en la Biblioteca PHYGO…',
    empty: 'No se encontró ninguna coincidencia en la Biblioteca PHYGO para este texto.',
    error: 'Algo salió mal durante la búsqueda.',
    addToDocument: 'Añadir al documento',
    addedToDocument: 'Añadido al documento',
    saveToWorkspace: 'Guardar en el Workspace',
    savedToWorkspace: 'Guardado en el Workspace',
    removeFromWorkspace: 'Quitar del Workspace',
    myNote: 'Mi nota',
    myNotePlaceholder: 'Añade una nota personal…',
    noteSaved: 'Nota guardada',
    close: 'Cerrar',
    back: 'Atrás',
    openInPhygo: 'Abrir en PHYGO',
    scientificEvidence: 'Evidencia científica',
    open3dAnatomy: 'Abrir Anatomía 3D',
    addToConceptMap: 'Añadir al mapa conceptual',
    testMe: 'Ponme a prueba',
    comingSoon: 'Próximamente',
    sections: {
      goals: 'Objetivos',
      clinical_tests: 'Pruebas clínicas',
      red_flags: 'Señales de alarma',
      typical_exercises: 'Ejercicios típicos',
      outcome_measures: 'Medidas de resultado',
      progression_criteria: 'Criterios de progresión',
      return_to_activity_criteria: 'Criterios de retorno a la actividad',
      contraindications: 'Contraindicaciones',
      anatomy: 'Anatomía',
      function: 'Función',
      clinical_relevance: 'Relevancia clínica',
      procedure: 'Procedimiento',
      interpretation: 'Interpretación',
    },
    systems: {
      cardiopulmonary: 'Cardiopulmonar',
      oncology: 'Oncología',
      'pelvic-floor': 'Suelo pélvico',
      endocrine: 'Endocrino',
      urinary: 'Urinario',
      gastrointestinal: 'Gastrointestinal',
      immune: 'Inmunitario',
      hematology: 'Hematología',
    },
  },
  selectionPopup: {
    copy: 'Copiar', copied: 'Copiado', highlight: 'Resaltar', addToNotes: 'Añadir a notas', addedToNotes: 'Añadido a notas',
  },
  ask: {
    button: 'Preguntar a PHYGO', title: 'Preguntar a PHYGO', placeholder: 'Haz una pregunta sobre este documento…', send: 'Enviar',
    thinking: 'PHYGO está pensando…', limitReached: 'Has alcanzado el límite de preguntas de tu plan. Inténtalo más tarde o mejora tu plan.',
    close: 'Cerrar', disclaimer: 'Las respuestas son apoyo de estudio, no un consejo clínico definitivo.', empty: 'Haz tu primera pregunta sobre este documento.',
    genericError: 'Algo salió mal.', networkError: 'Error de red — inténtalo de nuevo.',
  },
}

const fr: WorkspaceDict = {
  nav: { workspace: 'Workspace', home: 'Accueil', starred: 'Favoris', trash: 'Corbeille' },
  home: {
    title: 'Votre Workspace', subtitle: 'Étudiez, organisez et construisez vos connaissances.', continueReading: 'Reprendre là où vous en étiez', recent: 'Récents', starredSection: 'Favoris',
    quickActions: 'Actions rapides', newFolder: 'Nouveau dossier', newNotebook: 'Nouveau notebook', importPdf: 'Importer un PDF',
    empty: 'Votre Workspace est vide — importez un PDF ou créez votre premier notebook.',
  },
  folder: { root: 'Mon Workspace', empty: 'Ce dossier est vide', documents: 'Documents', notebooks: 'Notebooks', folders: 'Dossiers' },
  item: {
    rename: 'Renommer', move: 'Déplacer', star: 'Ajouter aux favoris', unstar: 'Retirer des favoris', color: 'Couleur',
    delete: 'Mettre à la corbeille', restore: 'Restaurer', deleteForever: 'Supprimer définitivement',
    tags: 'Tags', open: 'Ouvrir', pages: 'pages', lastOpened: 'Dernier accès',
  },
  dialog: {
    newFolderTitle: 'Nouveau dossier', newFolderPlaceholder: 'Nom du dossier',
    newNotebookTitle: 'Nouveau notebook', newNotebookPlaceholder: 'Nom du notebook',
    renameTitle: 'Renommer', moveTitle: 'Déplacer vers…', moveToRoot: 'Mon Workspace (racine)',
    confirmDeleteTitle: 'Mettre à la corbeille ?', confirmDeleteBody: 'Vous pourrez le restaurer à tout moment depuis la Corbeille.',
    cancel: 'Annuler', create: 'Créer', save: 'Enregistrer', move: 'Déplacer', delete: 'Mettre à la corbeille',
  },
  import: { button: 'Importer un PDF', uploading: 'Envoi…', processing: 'Traitement…', failed: "Échec de l'import", onlyPdf: 'Seuls les fichiers PDF sont pris en charge pour le moment' },
  reader: {
    page: 'Page', of: 'sur', zoomIn: 'Zoomer', zoomOut: 'Dézoomer', fitWidth: 'Ajuster à la largeur', fitPage: 'Ajuster à la page',
    thumbnails: 'Miniatures', search: 'Rechercher dans le document', searchPlaceholder: 'Rechercher du texte…', noResults: 'Aucun résultat',
    matches: 'résultats', bookmarkPage: 'Marquer la page', bookmarked: 'Page marquée', focusMode: 'Mode focus', exportPdf: 'Exporter en PDF',
  },
  annotate: {
    select: 'Sélectionner', pen: 'Stylo', line: 'Ligne', rectangle: 'Rectangle', ellipse: 'Cercle',
    highlighter: 'Surligneur', eraser: 'Gomme', eraserSize: 'Taille de la gomme', text: 'Texte', textPlaceholder: 'Écrivez une note…', shape: 'Forme',
    color: 'Couleur', thickness: 'Épaisseur', undo: 'Annuler', redo: 'Rétablir', clearPage: 'Effacer les annotations de la page', noBackground: 'Aucun fond',
    insertImage: 'Insérer une image', uploadPhoto: 'Importer une photo', takePhoto: 'Prendre une photo', imageOnly: 'Sélectionnez un fichier image',
    fileTooLarge: 'Fichier trop volumineux (max {max}Mo).', sessionExpired: 'Session expirée — veuillez vous reconnecter.',
  },
  notebook: {
    newPage: 'Nouvelle page', duplicatePage: 'Dupliquer la page', deletePage: 'Supprimer la page', template: 'Modèle',
    templateBlank: 'Vierge', templateRuled: 'Lignée', templateGrid: 'Quadrillée', templateDotted: 'Pointillée', untitled: 'Notebook sans titre',
    format: 'Format', formatA4: 'A4', formatLetter: 'Letter', formatSquare: 'Carré', paperColor: 'Couleur du papier',
    pageSettings: 'Paramètres de la page', deletePageConfirm: 'Supprimer cette page ?', lastPage: 'Un notebook doit garder au moins une page',
  },
  tags: { addTag: 'Ajouter un tag', placeholder: 'ex. Examen, Anatomie…' },
  save: { saving: 'Enregistrement…', saved: 'Enregistré', offline: 'Hors ligne — sera synchronisé' },
  search: { placeholder: 'Rechercher dans le Workspace…', noResults: 'Aucun résultat', resultsIn: 'dans' },
  insight: { title: 'PHYGO Insight', comingSoon: 'Les liens contextuels vers la Bibliothèque PHYGO apparaîtront ici.' },
  studyPanel: {
    explore: 'Explorer avec PHYGO',
    title: 'PHYGO Smart Study Panel',
    selectionLabel: 'Texte sélectionné',
    loading: 'Recherche dans la Bibliothèque PHYGO…',
    empty: 'Aucune correspondance trouvée dans la Bibliothèque PHYGO pour ce texte.',
    error: "Une erreur s'est produite pendant la recherche.",
    addToDocument: 'Ajouter au document',
    addedToDocument: 'Ajouté au document',
    saveToWorkspace: 'Enregistrer dans le Workspace',
    savedToWorkspace: 'Enregistré dans le Workspace',
    removeFromWorkspace: 'Retirer du Workspace',
    myNote: 'Ma note',
    myNotePlaceholder: 'Ajoutez une note personnelle…',
    noteSaved: 'Note enregistrée',
    close: 'Fermer',
    back: 'Retour',
    openInPhygo: 'Ouvrir dans PHYGO',
    scientificEvidence: 'Preuves scientifiques',
    open3dAnatomy: 'Ouvrir Anatomie 3D',
    addToConceptMap: 'Ajouter à la carte conceptuelle',
    testMe: 'Teste-moi',
    comingSoon: 'Bientôt disponible',
    sections: {
      goals: 'Objectifs',
      clinical_tests: 'Tests cliniques',
      red_flags: "Signaux d'alarme",
      typical_exercises: 'Exercices typiques',
      outcome_measures: 'Mesures de résultat',
      progression_criteria: 'Critères de progression',
      return_to_activity_criteria: "Critères de retour à l'activité",
      contraindications: 'Contre-indications',
      anatomy: 'Anatomie',
      function: 'Fonction',
      clinical_relevance: 'Pertinence clinique',
      procedure: 'Procédure',
      interpretation: 'Interprétation',
    },
    systems: {
      cardiopulmonary: 'Cardiopulmonaire',
      oncology: 'Oncologie',
      'pelvic-floor': 'Plancher pelvien',
      endocrine: 'Endocrinien',
      urinary: 'Urinaire',
      gastrointestinal: 'Gastro-intestinal',
      immune: 'Immunitaire',
      hematology: 'Hématologie',
    },
  },
  selectionPopup: {
    copy: 'Copier', copied: 'Copié', highlight: 'Surligner', addToNotes: 'Ajouter aux notes', addedToNotes: 'Ajouté aux notes',
  },
  ask: {
    button: 'Demander à PHYGO', title: 'Demander à PHYGO', placeholder: 'Posez une question sur ce document…', send: 'Envoyer',
    thinking: 'PHYGO réfléchit…', limitReached: 'Vous avez atteint la limite de questions de votre forfait. Réessayez plus tard ou passez à un forfait supérieur.',
    close: 'Fermer', disclaimer: "Les réponses sont un support d'étude, pas un avis clinique définitif.", empty: 'Posez votre première question sur ce document.',
    genericError: "Une erreur s'est produite.", networkError: 'Erreur réseau — veuillez réessayer.',
  },
}

export const WORKSPACE_STRINGS: Record<AppLang, WorkspaceDict> = { it, en, es, fr }

/** Convenience hook, mirrors useUiStrings() from LanguageContext but for Workspace-only copy. */
export function useWorkspaceUi() {
  const { lang } = useLanguage()
  return WORKSPACE_STRINGS[lang]
}
