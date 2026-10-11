import type { LandingDict } from '../landingStrings';

export const it: LandingDict = {
  meta: {
    title: 'PHYGO — Lo spazio di lavoro clinico per la fisioterapia',
    description:
      'Note SOAP preparate dall’AI che rivedi e approvi tu, oltre {n} condizioni cliniche, anatomia 3D e prescrizione degli esercizi: un unico spazio di lavoro per fisioterapisti.',
    descriptionNoCount:
      'Note SOAP preparate dall’AI che rivedi e approvi tu, una libreria di condizioni cliniche, anatomia 3D e prescrizione degli esercizi: un unico spazio di lavoro per fisioterapisti.',
    ogLocale: 'it_IT',
  },
  nav: {
    tour: 'Prodotto',
    library: 'Libreria',
    pricing: 'Prezzi',
    faq: 'FAQ',
    login: 'Accedi',
    startFree: 'Inizia gratis',
    openMenu: 'Apri il menu',
    closeMenu: 'Chiudi il menu',
    language: 'Lingua',
    darkMode: 'Passa al tema scuro',
    lightMode: 'Passa al tema chiaro',
    home: 'Home di PHYGO',
    skip: 'Vai al contenuto',
  },
  hero: {
    eyebrow: 'Lo spazio di lavoro clinico per la fisioterapia',
    title: 'Dalla prima parola\nal *piano riabilitativo.*',
    sub: 'PHYGO trasforma ciò che osservi in seduta in una bozza SOAP strutturata, la collega a {conditions}, all’anatomia 3D e a {exercises} — e lascia a te ogni decisione clinica.',
    conditionsPhrase: 'oltre {n} condizioni cliniche',
    conditionsFallback: 'una libreria di condizioni cliniche',
    exercisesPhrase: 'oltre {n} esercizi con video',
    exercisesFallback: 'una libreria di esercizi con video',
    ctaPrimary: 'Inizia gratis',
    ctaSecondary: 'Scopri il prodotto',
    assurances: ['Gratis per iniziare', 'Nessuna carta di credito', 'IT · EN · ES · FR'],
    caption: 'Interfaccia illustrativa con un caso di esempio. Ogni bozza attende la tua revisione.',
    stage: {
      windowTitle: 'Seduta · Paziente di esempio',
      draft: 'Bozza · non salvata',
      sidebar: ['Pazienti', 'Copilota', 'Condizioni', 'Mappa corporea', 'Esercizi', 'Evidenze'],
      voiceLabel: 'Dettatura',
      voiceText: '“…arco doloroso tra 70 e 120 gradi, più debole in rotazione esterna…”',
      linkedLabel: 'Condizione collegata',
      evidence: 'Evidenza: alta',
      exerciseLabel: 'Bozza esercizi',
      phasesLabel: 'Fasi riabilitative',
      reviewSave: 'Rivedi e salva',
      ariaLabel:
        'Interfaccia illustrativa di PHYGO: una bozza di seduta collegata alla libreria clinica, agli esercizi e alle fasi riabilitative',
    },
  },
  proof: {
    conditions: 'condizioni cliniche',
    exercises: 'esercizi con video',
    protocols: 'protocolli riabilitativi a fasi',
    languages: 'lingue',
    mapsValue: '3D',
    maps: 'mappe del corpo e del cervello',
  },
  story: {
    eyebrow: 'Il prodotto',
    title: 'Un paziente. *Un unico flusso di lavoro.*',
    intro:
      'Segui un caso di esempio dentro PHYGO: da ciò che ascolti in seduta a un piano riabilitativo pronto per la tua approvazione.',
    caseLabel: 'Caso di esempio · spalla destra, 3 settimane',
    chapters: [
      {
        kicker: 'Comprendi',
        title: 'Registra la seduta come la pensi.',
        text: 'Detta o scrivi i tuoi appunti in modo naturale, in italiano, inglese, spagnolo o francese. La trascrizione avviene nel browser, senza schemi rigidi da seguire.',
      },
      {
        kicker: 'Organizza',
        title: 'Una bozza SOAP strutturata, con il ragionamento in chiaro.',
        text: 'Soggettivo, oggettivo, valutazione e piano — con ipotesi, diagnosi differenziali, red flag e informazioni ancora mancanti, scritte come supporto alla decisione.',
      },
      {
        kicker: 'Approfondisci',
        title: 'Le conoscenze che servono, già collegate.',
        text: 'La valutazione viene associata alla libreria clinica: obiettivi, test clinici, red flag ed esercizi tipici della condizione, a un clic di distanza.',
      },
      {
        kicker: 'Prescrivi',
        title: 'Esercizi con un dosaggio, non solo un nome.',
        text: 'Proposte di esercizi con serie, ripetizioni e frequenza, rifinite sul protocollo a fasi della condizione quando esiste. Nella libreria esercizi, ogni esercizio ha il suo video dimostrativo.',
      },
      {
        kicker: 'Pianifica e rivedi',
        title: 'Decidi tu cosa entra nella cartella.',
        text: 'Modifica o scarta qualsiasi cosa. Quando salvi, il piano e un riepilogo in linguaggio semplice diventano disponibili al paziente in My Phygo — e puoi esportare un PDF quando ti serve.',
      },
    ],
    listening: 'In ascolto',
    languagesPill: 'IT · EN · ES · FR',
    transcript:
      '42 anni, dolore alla spalla destra da tre settimane, da quando ha iniziato ad allenarsi sopra la testa. Arco doloroso tra 70 e 120 gradi, più debole in rotazione esterna contro resistenza. Nessun trauma, nessun dolore notturno.',
    soapLabels: ['Soggettivo', 'Oggettivo', 'Valutazione', 'Piano'],
    soap: [
      'Dolore alla spalla destra da 3 settimane, insorto con l’allenamento sopra la testa. Nessun trauma, nessun dolore notturno.',
      'Arco doloroso 70–120°. Forza ridotta in rotazione esterna contro resistenza.',
      'Il quadro potrebbe essere compatibile con un dolore di spalla correlato alla cuffia dei rotatori.',
      'Carico progressivo della cuffia dei rotatori e dei muscoli scapolari; rivalutazione tra 2 settimane.',
    ],
    reasoning: [
      { label: 'Ipotesi', text: 'Possibile dolore di spalla correlato alla cuffia dei rotatori' },
      { label: 'Diagnosi differenziali', text: 'Considerare un dolore riferito cervicale o una capsulite adesiva iniziale' },
      { label: 'Red flag', text: 'Nessuna evidente dalle informazioni fornite' },
      { label: 'Informazioni mancanti', text: 'Intensità del dolore e una misura di outcome iniziale (es. SPADI)' },
    ],
    linkedLabel: 'Collegata dalla libreria',
    region: 'Mappa corporea · Spalla',
    exercises: [
      { name: 'Rotazione esterna isometrica', dose: '5 × 30 s · ogni giorno' },
      { name: 'Rotazione esterna in decubito laterale', dose: '3 × 12 · a giorni alterni' },
      { name: 'Retrazione scapolare con elastico', dose: '3 × 15 · ogni giorno' },
    ],
    videoLabel: 'Video',
    fromLibrary: 'Dalla libreria esercizi',
    phasesLabel: 'Fasi riabilitative',
    current: 'In corso',
    review: 'Rivedi e salva',
    savedTo: 'Condiviso con il paziente dopo il salvataggio',
    portalTitle: 'My Phygo · vista paziente',
    portalText:
      'In questo momento la tua spalla è sensibile ai carichi sopra la testa. Esegui i tre esercizi ogni giorno e mantieni i sollevamenti sopra la testa senza dolore.',
    pdf: 'Esporta PDF',
    caption:
      'Caso di esempio a scopo illustrativo. Il nome della condizione e le fasi riabilitative provengono dalla vera libreria di PHYGO.',
    chapterNav: 'Capitoli della presentazione del prodotto',
  },
  library: {
    eyebrow: 'Libreria clinica',
    title: 'Oltre {n} condizioni cliniche.\n*Un’unica struttura clinica.*',
    titleNoCount: 'Una libreria clinica costruita\n*sul tuo ragionamento.*',
    intro:
      'Quadri ortopedici, neurologici, cardiorespiratori, oncologici, del pavimento pelvico e molti altri — ogni scheda è organizzata attorno alle domande che ti poni in ambulatorio, ed è consultabile liberamente senza account.',
    countLabel: 'condizioni e patologie, in tempo reale dalla libreria',
    namesLabel: 'Una selezione delle condizioni presenti nella libreria',
    coverageTitle: 'Cosa contiene ogni scheda',
    coverageLive: 'Copertura in tempo reale · {n} schede',
    fields: {
      goals: 'Obiettivi riabilitativi',
      clinical_tests: 'Test clinici',
      red_flags: 'Red flag',
      contraindications: 'Controindicazioni',
      typical_exercises: 'Esercizi tipici',
      progression_criteria: 'Criteri di progressione',
      return_to_activity_criteria: 'Criteri di ritorno all’attività',
      outcome_measures: 'Misure di outcome',
      source: 'Fonti citate',
      phased: 'Protocolli riabilitativi a fasi',
    },
    coverageNote:
      'Non tutte le schede hanno ancora ogni campo. Ogni condizione indica il proprio livello di evidenza e, quando disponibili, le fonti. La libreria supporta il giudizio clinico, non lo sostituisce.',
    featuredKicker: 'Una vera scheda della libreria',
    evidence: 'Evidenza',
    levels: { high: 'Alta', moderate: 'Moderata', low: 'Bassa', strong: 'Forte' },
    tabs: { goals: 'Obiettivi', clinical_tests: 'Test clinici', red_flags: 'Red flag', typical_exercises: 'Esercizi' },
    phasesLabel: 'Fasi riabilitative',
    excerptTranslated: 'Estratto · tradotto dalla fonte italiana',
    excerptSource: 'Estratto dalla scheda originale',
    openEntry: 'Apri la scheda completa',
    cta: 'Esplora la libreria',
    languages: 'Consultala in italiano, inglese, spagnolo o francese',
    tablistLabel: 'Sezioni di {name}',
  },
  anatomy: {
    eyebrow: 'Anatomia e neuroanatomia',
    title: 'Parti dal corpo.\n*Arrivi alla condizione.*',
    intro:
      'Esplora modelli 3D interattivi, seleziona una regione e raggiungi subito le condizioni collegate — e, per le regioni del corpo, i programmi di esercizi.',
    body: {
      title: 'Mappa corporea',
      text: 'Un modello muscoloscheletrico 3D con regioni selezionabili. Ogni regione apre le condizioni e i programmi di esercizi associati.',
      regions: ['Spalla', 'Rachide lombare', 'Ginocchio', 'Caviglia'],
      caption: 'Illustrazione semplificata — nell’app trovi un modello 3D interattivo.',
      svgLabel: 'Sagoma illustrativa del corpo con regioni selezionabili',
    },
    brain: {
      title: 'Mappa cerebrale',
      text: 'Neuroanatomia in 3D: aree cerebrali e nervi periferici collegati alle condizioni neurologiche che tratti, con viste di riferimento come questa.',
      alt: 'Riferimento di neuroanatomia di PHYGO: vista laterale del cervello con i lobi, il cervelletto e il tronco encefalico, le loro funzioni e le sindromi da lesione',
      caption: 'Vista di riferimento dalla mappa cerebrale di PHYGO (etichette in inglese)',
    },
    systemsLabel: 'E in più, esploratori per sistema',
    systems: [
      'Pavimento pelvico',
      'Cardiorespiratorio',
      'Endocrino',
      'Gastrointestinale',
      'Urinario',
      'Immunitario',
      'Ematologia',
      'Oncologia',
      'Fasce',
      'Fisiologia',
    ],
  },
  tools: {
    eyebrow: 'Evidenze e strumenti professionali',
    title: 'Lo scaffale di riferimento\n*di uno studio moderno.*',
    intro: 'Ricerca, strumenti di valutazione e conoscenze specialistiche — accanto al paziente che stai trattando, non in un’altra scheda del browser.',
    columns: [
      {
        title: 'Evidenze, filtrate',
        text: 'I nuovi studi su PubMed vengono controllati ogni giorno. Vengono importati solo trial controllati randomizzati, revisioni sistematiche e meta-analisi sulla fisioterapia, poi riassunti con una struttura fissa.',
        items: [
          'Domanda clinica, popolazione e intervento',
          'Risultati principali e interpretazione clinica',
          'Pubblicazione automatica solo sopra una soglia di qualità',
          'Studi correlati mostrati accanto alle bozze del copilota',
        ],
      },
      {
        title: 'Strumenti di valutazione',
        text: 'I test e le scale che usi ogni settimana, a portata di mano mentre scrivi.',
        items: [
          'Test ortopedici speciali',
          'Scale funzionali e misure di outcome',
          'Esame neurologico',
          'Questionari per il pavimento pelvico',
          'Calcolatore metabolico e del fabbisogno energetico',
        ],
      },
      {
        title: 'Librerie specialistiche',
        text: 'Profondità oltre l’ambito muscoloscheletrico.',
        items: [
          'Medicina dello sport e ritorno al gioco',
          'Riabilitazione cardiorespiratoria e disostruzione bronchiale',
          'Riabilitazione del pavimento pelvico',
          'Riabilitazione oncologica',
          'Primo soccorso e BLS per Paese',
        ],
      },
    ],
  },
  workspace: {
    eyebrow: 'Lo spazio di lavoro',
    title: 'Il tuo studio,\n*connesso.*',
    intro:
      'Documentazione e conoscenze sono metà del lavoro. PHYGO tiene in un unico posto anche pazienti, agenda e materiale di studio.',
    items: [
      {
        title: 'Pazienti e sedute',
        text: 'Note salvate, piani e riferimenti clinici di ogni paziente in un’unica cartella: la visita successiva riparte da dove era finita la precedente.',
      },
      {
        title: 'My Phygo per i pazienti',
        text: 'Invita i pazienti con un codice. Vedono il piano, gli esercizi e il riepilogo che hai salvato — niente che tu non abbia approvato.',
      },
      { title: 'Agenda', text: 'Pianifica le sedute e lascia che i pazienti collegati richiedano appuntamenti che confermi tu.' },
      {
        title: 'Documenti e quaderni',
        text: 'Carica PDF, evidenzia e annota, tieni quaderni di appunti e fai domande a PHYGO su ciò che stai leggendo.',
      },
      {
        title: 'Modalità studente',
        text: 'Per studenti di fisioterapia: lo spazio di lavoro, le librerie di conoscenze e quiz per materia e difficoltà.',
      },
    ],
  },
  trust: {
    eyebrow: 'Responsabilità clinica',
    title: 'Pensato per supportare il tuo giudizio,\n*mai per sostituirlo.*',
    intro:
      'PHYGO è uno strumento di documentazione e conoscenza per professionisti qualificati. Non fa diagnosi e non agisce mai sui pazienti senza di te.',
    items: [
      {
        title: 'Bozze, non decisioni',
        text: 'L’output dell’AI è una proposta. Il ragionamento è formulato come supporto alla decisione e nulla entra nella cartella del paziente finché non lo salvi tu.',
      },
      {
        title: 'Dati ad accesso controllato',
        text: 'Conservati in un database ospitato nell’UE (Francoforte), cifrati in transito e a riposo, con sicurezza a livello di riga: ogni account accede solo ai propri pazienti.',
      },
      {
        title: 'Elaborazione AI trasparente',
        text: 'Per creare una bozza, il testo della seduta — e le eventuali immagini caricate — viene elaborato dal nostro fornitore di AI. I dati clinici non vengono usati per addestrare modelli di terze parti.',
      },
      {
        title: 'Evidenze da soppesare',
        text: 'Le schede della libreria indicano il livello di evidenza e citano le fonti quando disponibili, così decidi tu quanto peso dare loro.',
      },
    ],
    privacy: 'Leggi l’informativa sulla privacy',
  },
  pricing: {
    eyebrow: 'Prezzi',
    title: 'Piani che crescono\n*con il tuo studio.*',
    sub: 'Crea il tuo account gratuitamente, senza carta di credito.',
    monthly: 'Mensile',
    annual: 'Annuale',
    save: 'Risparmi il 20%',
    perMonth: '/mese',
    custom: 'Su misura',
    popular: 'Il più scelto',
    billingLabel: 'Fatturazione annuale',
    tiers: [
      {
        description: 'Per chi lavora in autonomia e sta iniziando.',
        features: ['50 sedute al mese', 'Note cliniche con AI', 'Esportazione PDF', 'Supporto via email'],
        cta: 'Inizia gratis',
      },
      {
        description: 'Per chi lavora a tempo pieno, ogni giorno.',
        features: [
          'Sedute illimitate',
          'Note cliniche con AI + riepiloghi per il paziente',
          'Libreria esercizi',
          'Supporto prioritario',
        ],
        cta: 'Inizia gratis',
      },
      {
        description:
          'Per studi con più professionisti. Le funzioni per i team sono in sviluppo: raccontaci di cosa ha bisogno il tuo studio.',
        features: [
          'Tutto ciò che include Professional',
          'Account per più professionisti (in sviluppo)',
          'Storico pazienti condiviso (in sviluppo)',
          'Onboarding dedicato',
        ],
        cta: 'Contattaci',
      },
    ],
  },
  faq: {
    eyebrow: 'Domande',
    title: 'Le domande dei\n*fisioterapisti.*',
    items: [
      {
        q: 'PHYGO sostituisce il mio giudizio clinico?',
        a: 'No. PHYGO prepara la documentazione e ti mette a portata di mano le conoscenze pertinenti. Ogni nota, sintesi del ragionamento e proposta di esercizi è una bozza che rivedi, modifichi e approvi. PHYGO non fa diagnosi e non contatta i pazienti di sua iniziativa.',
      },
      {
        q: 'E se l’AI sbaglia?',
        a: 'Può succedere: per questo nulla entra nella cartella del paziente finché non lo salvi tu. Il ragionamento è scritto come un prudente supporto alla decisione, con red flag e informazioni mancanti in evidenza, così è facile confrontarlo con la tua valutazione.',
      },
      {
        q: 'Come vengono gestiti i dati dei pazienti?',
        a: 'I dati clinici sono conservati in un database ospitato nell’UE (Francoforte), cifrati in transito e a riposo, con sicurezza a livello di riga: ogni account accede solo ai propri pazienti. Il testo delle sedute e le immagini caricate vengono elaborati dal nostro fornitore di AI per creare le bozze e non vengono usati per addestrare modelli di terze parti. Trovi i dettagli nell’informativa sulla privacy.',
      },
      {
        q: 'Da dove provengono i contenuti della libreria?',
        a: 'Le schede sono redatte a partire dalla letteratura pubblicata e dalle linee guida cliniche. Ognuna indica il proprio livello di evidenza e cita le fonti quando disponibili. La completezza varia da condizione a condizione: considera la libreria un punto di partenza per il tuo ragionamento.',
      },
      {
        q: 'Quali lingue supporta PHYGO?',
        a: 'Puoi dettare o scrivere le sedute in italiano, inglese, spagnolo o francese. La libreria pubblica delle condizioni e la libreria esercizi sono disponibili nelle stesse quattro lingue.',
      },
      {
        q: 'Posso provarlo prima su un caso di esempio?',
        a: 'Sì. Crea un account gratuito e usa il copilota su un caso inventato, per vedere le bozze che produce prima di usarlo nella pratica.',
      },
      {
        q: 'Quanto costa iniziare?',
        a: 'Creare un account è gratuito e non serve una carta di credito.',
      },
    ],
  },
  final: {
    title: 'Dedica la tua attenzione al paziente,\n*non alle scartoffie.*',
    text: 'Crea un account gratuito e prova il copilota, la libreria clinica e gli strumenti per gli esercizi nella tua prossima seduta.',
    cta: 'Inizia gratis',
    secondary: 'Prima esplora la libreria',
    note: 'Nessuna carta di credito richiesta.',
  },
  footer: {
    tagline: 'Lo spazio di lavoro clinico per la fisioterapia.',
    product: 'Prodotto',
    library: 'Libreria',
    pricing: 'Prezzi',
    privacy: 'Privacy',
    terms: 'Termini',
    contact: 'Contatti',
    rights: 'Tutti i diritti riservati.',
    languageLabel: 'Lingua',
  },
  common: { illustrative: 'Illustrativo' },
};
