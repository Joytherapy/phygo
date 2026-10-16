import type { LandingDict } from '../landingStrings';

export const it: LandingDict = {
  meta: {
    title: 'PHYGO — La piattaforma di fisioterapia, dallo studio alla pratica clinica',
    description:
      'Per studenti di fisioterapia e fisioterapisti: anatomia 3D, oltre {n} condizioni cliniche, quiz e uno spazio di studio — e note SOAP preparate dall’AI che rivedi tu, piani di esercizi e follow-up dei pazienti. Account gratuito.',
    descriptionNoCount:
      'Per studenti di fisioterapia e fisioterapisti: anatomia 3D, una libreria di condizioni cliniche, quiz e uno spazio di studio — e note SOAP preparate dall’AI che rivedi tu, piani di esercizi e follow-up dei pazienti. Account gratuito.',
    ogLocale: 'it_IT',
  },
  nav: {
    students: 'Per studenti',
    physiotherapists: 'Per fisioterapisti',
    library: 'Libreria',
    trust: 'Privacy e AI',
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
    eyebrow: 'Per studenti di fisioterapia e fisioterapisti',
    title: 'Un’unica piattaforma di fisioterapia, dal primo esame di anatomia alla pratica clinica di ogni giorno.',
    sub: 'Gli studenti imparano con anatomia 3D, una libreria clinica, quiz e uno spazio di studio. I fisioterapisti documentano le sedute con note SOAP preparate dall’AI e riviste da loro, pianificano gli esercizi e seguono i pazienti.',
    cta: 'Inizia gratis',
    note: 'Account gratuito · nessuna carta di credito · scegli Studente o Fisioterapista durante la configurazione',
    imageAlt:
      'Schermata di seduta di PHYGO: una bozza SOAP per un paziente di prova con Findings, Assessment, Plan e Follow-up e i pulsanti Download PDF e Save to Patient',
    secondImageAlt: 'Mappa corporea 3D di PHYGO: un modello anatomico del corpo intero',
    caption: 'Schermate reali di PHYGO con un paziente di prova sintetico.',
    choose: 'Scegli il tuo percorso',
    paths: {
      students: {
        title: 'Per studenti',
        text: 'Anatomia in 3D, condizioni cliniche, quiz e il tuo spazio di studio.',
        link: 'Scopri il percorso studenti',
      },
      physiotherapists: {
        title: 'Per fisioterapisti',
        text: 'Note di seduta, piani di esercizi, follow-up dei pazienti e Agenda in un solo posto.',
        link: 'Scopri il percorso fisioterapisti',
      },
    },
  },
  students: {
    eyebrow: 'Per studenti',
    title: 'Studia con le conoscenze che usano i clinici.',
    intro: 'Dall’anatomia al ragionamento clinico: esplora, mettiti alla prova e tieni il tuo materiale in un unico posto, con i tuoi tempi.',
    tablistLabel: 'Strumenti per studenti',
    steps: [
      {
        label: 'Anatomia',
        title: 'Esplora il corpo in 3D',
        text: 'Ruota e ingrandisci un modello anatomico, passa ai raggi X per vedere le ossa e apri condizioni, test e protocolli di ogni regione.',
        alt: 'Mappa corporea 3D di PHYGO: un modello anatomico del corpo intero con la ricerca per zona e l’interruttore raggi X',
      },
      {
        label: 'Neuroanatomia',
        title: 'Cervello, nervi e circuiti',
        text: 'Un cervello in 3D con le strutture profonde, più nervi periferici e circuiti neurali, collegati alle condizioni neurologiche della libreria.',
        alt: 'Mappa cerebrale di PHYGO: un modello 3D rotante del cervello umano',
      },
      {
        label: 'Quiz',
        title: 'Mettiti alla prova',
        text: 'Quiz in 14 materie su tre livelli, con domande generate dai contenuti di PHYGO e progressi seguiti materia per materia.',
        alt: 'Pagina dei quiz di PHYGO con 14 materie, dall’anatomia e la biologia fino all’oncologia e al pavimento pelvico',
      },
      {
        label: 'Workspace',
        title: 'Il tuo spazio di studio',
        text: 'Importa e annota PDF, tieni quaderni e cartelle e riprendi da dove avevi lasciato. Seleziona un testo nel PDF per cercarlo nella libreria di PHYGO.',
        alt: 'Workspace di PHYGO con un documento da riprendere, tre cartelle, due quaderni e due PDF con l’avanzamento della lettura',
      },
    ],
    extrasTitle: 'Inclusi anche',
    extras: [
      'Evidence Hub: nuovi trial e revisioni da PubMed, riassunti con la stessa struttura clinica',
      'Librerie specialistiche: medicina dello sport, cardiopolmonare, pavimento pelvico, oncologia, primo soccorso e BLS',
      'Ask PHYGO, un assistente per le tue domande, con limiti orari',
    ],
    cta: 'Inizia gratis come studente',
    ctaNote: 'Scegli «Studente» quando configuri l’account. Gli strumenti per i pazienti e le note di seduta con AI sono per gli account professionali; puoi passare a quello professionale una volta abilitato.',
    caption: 'Schermate reali di PHYGO; i contenuti del workspace sono di esempio.',
  },
  physiotherapists: {
    eyebrow: 'Per fisioterapisti',
    title: 'Dalla seduta al follow-up, in un unico flusso.',
    intro: 'PHYGO prepara ogni bozza; sei tu a decidere cosa salvare e condividere con il paziente.',
    tablistLabel: 'Passaggi del flusso di lavoro',
    steps: [
      {
        label: 'Seduta',
        title: 'Detta o scrivi',
        text: 'Racconta la seduta a voce o scrivi le tue osservazioni in italiano, inglese, spagnolo o francese. La dettatura usa il riconoscimento vocale del browser (in Chrome l’audio viene elaborato dal fornitore del browser).',
        alt: 'Schermata di seduta di PHYGO mentre la bozza è in preparazione: le osservazioni scritte per un paziente di prova sopra i campi vuoti Findings, Assessment, Plan e Follow-up',
      },
      {
        label: 'Nota SOAP',
        title: 'Rivedi la bozza e il ragionamento',
        text: 'PHYGO prepara Soggettivo, Oggettivo, Valutazione e Piano e mostra il ragionamento con formulazioni prudenti: ipotesi, diagnosi differenziali, red flag e informazioni mancanti. Puoi modificare tutto prima di salvare.',
        alt: 'Pannello del ragionamento clinico di una bozza: ipotesi, considerazioni differenziali, elementi a supporto, informazioni mancanti, valutazioni suggerite e red flag',
      },
      {
        label: 'Esercizi',
        title: 'Prescrivi esercizi e fasi',
        text: 'Gli esercizi proposti hanno serie, ripetizioni e frequenza e vengono affinati sul protocollo a fasi della condizione, quando la libreria ne ha uno. Ognuno lo tieni, lo modifichi o lo togli.',
        alt: 'Esercizi con serie e ripetizioni, ciascuno con i pulsanti modifica ed elimina, sopra un protocollo riabilitativo in tre fasi con obiettivi e criteri di progressione',
      },
      {
        label: 'Follow-up',
        title: 'Condividi in My Phygo',
        text: 'Quando salvi, la nota entra nella cartella del paziente. Il paziente, su tuo invito, vede in My Phygo il riepilogo, gli esercizi e lo storico delle sedute: solo ciò che hai salvato.',
        alt: 'Vista paziente di My Phygo: riepilogo dell’ultima seduta, tre esercizi con serie e ripetizioni e lo storico delle sedute',
      },
    ],
    extrasTitle: 'Intorno alla seduta',
    extras: [
      'Cartelle dei pazienti con lo storico delle sedute',
      'Agenda con le richieste di appuntamento inviate da My Phygo',
      'Test ortopedici, scale funzionali, esame neurologico e questionari del pavimento pelvico',
      'PDF della nota con esercizi, riepilogo per il paziente e protocollo riabilitativo',
      'Riassunto scritto di un referto o di un’immagine caricata, con le sue incertezze: non è una diagnosi e l’immagine non viene conservata',
      'Eventi: corsi, congressi e certificazioni per l’aggiornamento continuo',
    ],
    videoItem: 'Videochiamate con i pazienti, che si collegano da My Phygo',
    cta: 'Inizia gratis come fisioterapista',
    ctaNote: 'Scegli «Fisioterapista» quando configuri l’account. La gestione dei pazienti e le note di seduta con AI si sbloccano dopo che PHYGO ha verificato la tua iscrizione professionale.',
    caption: 'Schermate reali di PHYGO con un paziente di prova sintetico e contenuti di esempio.',
    patients: {
      title: 'Sei un paziente?',
      text: 'Si accede a My Phygo su invito del proprio fisioterapista. Dopo l’accesso, al momento è disponibile in inglese.',
      cta: 'Accedi a My Phygo',
    },
  },
  figures: {
    conditions: 'Oltre {n} condizioni cliniche con test, red flag e livello di evidenza',
    conditionsFallback: 'Libreria di condizioni cliniche con test, red flag e livello di evidenza',
    protocols: 'Oltre {n} protocolli riabilitativi a fasi',
    protocolsFallback: 'Protocolli riabilitativi a fasi',
    exercises: 'Oltre {n} esercizi con video',
    exercisesFallback: 'Libreria di esercizi con video',
    libraryCta: 'Consulta la libreria senza account',
    translationNote: 'Le voci della libreria in inglese, spagnolo e francese sono tradotte automaticamente dalla fonte italiana e indicate come tali.',
  },
  trust: {
    eyebrow: 'Privacy e AI',
    title: 'Chiari su cosa fa l’AI e su cosa resta a te.',
    intro: 'PHYGO supporta lo studio e la documentazione. Non fa diagnosi e non agisce da solo.',
    columns: [
      {
        title: 'Cosa fa l’AI',
        items: [
          'Prepara la nota, il ragionamento e le proposte di esercizi da ciò che detti o scrivi',
          'Riassume con formulazioni prudenti un’immagine che carichi',
          'Per farlo, il testo della seduta e le immagini sono elaborati dal nostro fornitore di AI (OpenAI, tramite API)',
        ],
      },
      {
        title: 'Cosa resta a te',
        items: [
          'Ogni bozza è modificabile; nulla entra in cartella finché non salvi',
          'Al paziente non arriva nulla se non lo salvi o condividi tu',
          'Le funzioni cliniche con AI sono per professionisti verificati: ogni iscrizione è controllata a mano sull’albo pubblico',
        ],
      },
      {
        title: 'Misure in atto',
        items: [
          'I dati sono conservati nell’UE (Supabase, Francoforte); le funzioni dell’applicazione oggi girano negli USA (Vercel)',
          'L’accesso è verificato sul server per ogni richiesta clinica',
          'Regole del database separano i pazienti di ciascun professionista',
          'Le immagini caricate non vengono conservate',
        ],
      },
    ],
    privacy: 'Leggi l’informativa privacy (bozza)',
  },
  pricing: {
    eyebrow: 'Prezzi',
    title: 'Gratis oggi, per studenti e fisioterapisti.',
    sub: 'L’account gratuito è l’unica offerta disponibile: nessuna carta di credito, nessun pagamento.',
    free: {
      label: 'Disponibile oggi',
      name: 'Account gratuito',
      price: 'Gratis',
      items: [
        'Libreria clinica, mappe 3D del corpo e del cervello, esercizi con video',
        'Quiz, Workspace, Evidence Hub ed Eventi',
        'Per i fisioterapisti, dopo la verifica: pazienti, Agenda, note SOAP preparate dall’AI e My Phygo',
      ],
      limits: 'Ask PHYGO ha limiti orari e la Pro Library non è inclusa.',
      cta: 'Inizia gratis',
    },
    planned: {
      title: 'Piani a pagamento in futuro',
      text: 'I piani Starter, Professional e Clinic sono previsti ma non ancora acquistabili. Oggi non si può comprare nulla.',
    },
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Domande frequenti',
    items: [
      {
        q: 'Che differenza c’è tra un account studente e uno da fisioterapista?',
        a: 'Sono entrambi gratuiti e includono librerie, anatomia 3D, quiz, workspace e PHYGO World. L’account da fisioterapista aggiunge cartelle dei pazienti, Agenda, note di seduta preparate dall’AI e inviti a My Phygo, dopo che PHYGO ha verificato l’iscrizione professionale.',
      },
      {
        q: 'Posso passare da un account studente a uno da fisioterapista?',
        a: 'Sì. Una volta abilitato, passa allo spazio professionale dal tuo profilo e invia i dati della tua iscrizione per la verifica.',
      },
      {
        q: 'PHYGO sostituisce il giudizio clinico?',
        a: 'No. Ogni nota, sintesi del ragionamento e proposta di esercizi è una bozza che il fisioterapista rivede, modifica e approva. Il ragionamento è scritto come supporto decisionale prudente, con red flag e informazioni mancanti in evidenza. PHYGO non fa diagnosi.',
      },
      {
        q: 'Come vengono trattati i dati dei pazienti?',
        a: 'I dati sono conservati in un database nell’UE (Francoforte); le funzioni dell’applicazione oggi girano negli USA. Ogni professionista vede solo i propri pazienti e l’accesso è verificato sul server. Il testo della seduta e le immagini caricate sono elaborati dal nostro fornitore di AI per creare le bozze; PHYGO non conserva le immagini caricate. La dettatura usa il riconoscimento vocale del browser, che in Chrome elabora l’audio tramite il fornitore del browser. I dettagli sono nell’informativa privacy, al momento una bozza in revisione legale.',
      },
      {
        q: 'Quali lingue supporta PHYGO?',
        a: 'Le sedute si possono dettare o scrivere in italiano, inglese, spagnolo o francese e la bozza segue quella lingua. Il sito, la registrazione e la libreria clinica pubblica sono disponibili in tutte e quattro; le voci in inglese, spagnolo e francese sono tradotte automaticamente dalla fonte italiana e indicate come tali. My Phygo, dopo l’accesso, è al momento in inglese, tranne il profilo metabolico.',
      },
      {
        q: 'Da dove arrivano i contenuti della libreria?',
        a: 'Le voci sono redatte a partire da letteratura pubblicata e linee guida cliniche. Ognuna indica il livello di evidenza e cita le fonti quando disponibili. La copertura varia da condizione a condizione: usa la libreria come punto di partenza per il tuo ragionamento.',
      },
    ],
  },
  final: {
    title: 'Dallo studio alla pratica, su un’unica piattaforma.',
    text: 'Crea un account gratuito e scegli Studente o Fisioterapista.',
    cta: 'Inizia gratis',
    note: 'Nessuna carta di credito richiesta.',
  },
  footer: {
    tagline: 'La piattaforma di fisioterapia, dallo studio alla pratica clinica.',
    product: 'Prodotto',
    library: 'Libreria',
    pricing: 'Prezzi',
    privacy: 'Privacy',
    terms: 'Termini',
    contact: 'Contatti',
    rights: 'Tutti i diritti riservati.',
    navLabel: 'Sito',
    languageLabel: 'Lingua',
  },
};
