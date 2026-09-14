// Content (translatable strings) for the Functional Scales tab of Clinical
// Toolkit — 27 interactive scales (Katz through DRS). SF-36 is NOT included
// here: it's shared with the Pelvic Floor tab and lives in
// lib/pelvicFloorQuestionnaires.ts. Subtitles, descriptions, item labels,
// option labels and interpretation text below are translated via
// /api/clinical-tools/functional-scales. The display NAME of each scale
// (e.g. "Katz Index" / "Indice di Katz") is a separate, per-language lookup
// (SCALE_NAMES_BY_LANG) in app/dashboard/clinical-tools/page.tsx — IT
// translates the name (keeping the recognizable acronym in parentheses
// where one is commonly used), EN/ES/FR keep or localize the international
// name. Numeric scoring values (v, max) are untouched by translation; only
// the display label (l) or text changes with language.

export type ScaleKey =
  | 'katz' | 'barthel' | 'tinetti' | 'conley' | 'berg' | 'morse' | 'ashworth' | 'nrs' | 'sppb' | 'mmse'
  | 'gcs' | 'tug' | 'sixmwt' | 'sf36' | 'nihss' | 'updrs3' | 'womac' | 'dash' | 'wmft' | 'boxblock'
  | 'jebsen' | 'tct' | 'edss' | 'hy' | 'fss' | 'hhs' | 'ucla' | 'drs';

export interface ScaleOption { v: number; l: string; }
export interface ScaleItem { id: string; label: string; }
export interface KeyedItem { key: string; label: string; }

// ---------------------------------------------------------------------
// Subtitles (short description shown under each scale name in the picker
// grid) and full descriptions (shown in the ScaleDescription callout).
// ---------------------------------------------------------------------

export const SCALE_SUBTITLES: Record<ScaleKey, string> = {
  katz: 'Autonomia nelle ADL',
  barthel: 'Disabilità funzionale',
  tinetti: 'Equilibrio e andatura',
  conley: 'Rischio di caduta',
  berg: 'Equilibrio (gold standard)',
  morse: 'Rischio di caduta',
  ashworth: 'Spasticità',
  nrs: 'Intensità del dolore',
  sppb: 'Performance fisica',
  mmse: 'Screening cognitivo',
  gcs: 'Stato di coscienza',
  tug: 'Mobilità funzionale',
  sixmwt: 'Capacità aerobica',
  sf36: 'Qualità della vita percepita',
  nihss: 'Severità ictus',
  updrs3: 'Esame motorio Parkinson',
  womac: 'Artrosi ginocchio/anca',
  dash: 'Disabilità arto superiore',
  wmft: 'Funzione arto superiore post-ictus',
  boxblock: 'Destrezza manuale grossolana',
  jebsen: 'Funzione della mano',
  tct: 'Controllo del tronco',
  edss: 'Disabilità in sclerosi multipla',
  hy: 'Stadiazione Parkinson',
  fss: 'Severità della fatica',
  hhs: "Funzione dell'anca",
  ucla: 'Funzione della spalla',
  drs: 'Disabilità post trauma cranico',
};

export const SCALE_DESCRIPTIONS: Record<ScaleKey, string> = {
  katz: "Misura il grado di autonomia dell'anziano in 6 attività di base della vita quotidiana (ADL): fare il bagno, vestirsi, uso della toilette, trasferimenti, continenza, alimentazione. Ogni item è dicotomico (indipendente/dipendente). Utile per una valutazione rapida dell'autosufficienza globale, meno sensibile ai cambiamenti rispetto a scale più dettagliate come il Barthel.",
  barthel: "Scala di disabilità funzionale tra le più utilizzate nella pratica riabilitativa, valuta 10 attività della vita quotidiana con punteggi differenziati (0-15 punti per item) in base al livello di assistenza necessario. Un punteggio ≤40 indica generalmente la necessità di un ricovero riabilitativo intensivo. Va tipicamente somministrata all'ingresso e alla dimissione per misurare l'efficacia del trattamento.",
  tinetti: "Valuta equilibrio (13 item) e andatura (9 item) con osservazione diretta del paziente durante compiti standardizzati (alzarsi dalla sedia, stare in piedi, girarsi, camminare). Il punteggio combinato orienta il rischio di caduta: sotto i 19 punti il rischio è considerato elevato. Richiede l'osservazione diretta del movimento, non è compilabile solo con un'intervista.",
  conley: "Scala di screening rapido del rischio di caduta, basata su 6 domande (storia di cadute, vertigini, incontinenza urgente, deterioramento cognitivo, agitazione, deficit di giudizio). Pensata per un utilizzo veloce al momento del ricovero ospedaliero, un punteggio ≥2 indica un rischio significativo che giustifica misure preventive.",
  berg: "Considerata il gold standard per la valutazione dell'equilibrio in ambito riabilitativo e geriatrico. Composta da 14 compiti funzionali (da seduto a in piedi, stazione eretta a occhi chiusi, raggiungere in avanti, girarsi, stazione monopodalica) ciascuno valutato 0-4. Più lunga da somministrare rispetto alla Tinetti ma con maggiore sensibilità nei range intermedi di funzione.",
  morse: "Scala di screening del rischio di caduta molto diffusa in ambito ospedaliero internazionale, alternativa alla Conley. Valuta 6 fattori (storia di cadute, diagnosi secondaria, ausilio per la deambulazione, terapia endovenosa, tipo di andatura, stato mentale) con pesi diversi. Va ripetuta periodicamente durante la degenza, non solo all'ingresso.",
  ashworth: "Scala di valutazione clinica della spasticità (0-4, con il grado intermedio 1+ nella versione modificata), basata sulla resistenza percepita dall'esaminatore durante lo stiramento passivo rapido del muscolo. È soggettiva e dipende dall'esperienza del valutatore, ma resta lo strumento clinico più diffuso per il monitoraggio della spasticità nel tempo.",
  nrs: "Scala numerica di autovalutazione del dolore, da 0 (nessun dolore) a 10 (peggior dolore immaginabile). Semplice, rapida, ampiamente validata; il paziente stesso indica il numero che meglio rappresenta l'intensità del dolore percepito in quel momento.",
  sppb: "Batteria composita di performance fisica molto utilizzata in geriatria, combina tre test cronometrati (equilibrio in piedi in posizioni progressivamente più impegnative, velocità del cammino su 4 metri, tempo per alzarsi 5 volte dalla sedia) in un punteggio 0-12. Un punteggio basso predice un aumentato rischio di disabilità, ospedalizzazione e mortalità.",
  mmse: "Test di screening cognitivo più utilizzato al mondo, esplora orientamento spazio-temporale, memoria immediata e differita, attenzione/calcolo, linguaggio e prassia costruttiva in circa 10 minuti. Il punteggio va corretto per età e scolarità del paziente secondo le tabelle normative italiane. Non è uno strumento diagnostico da solo, ma un valido screening di primo livello.",
  gcs: "Scala standard per la valutazione dello stato di coscienza dopo trauma cranico o evento neurologico acuto, basata su tre componenti indipendenti (apertura degli occhi, risposta verbale, risposta motoria). Il punteggio totale classifica la gravità del trauma: 13-15 lieve, 9-12 moderato, 3-8 grave (quest'ultimo generalmente associato a necessità di protezione delle vie aeree).",
  tug: "Test rapido e semplice di mobilità funzionale: il paziente si alza da una sedia, cammina 3 metri, si gira, torna e si siede, mentre viene cronometrato il tempo totale. Un tempo superiore a 20 secondi è generalmente associato a un aumentato rischio di caduta e a difficoltà nelle attività della vita quotidiana.",
  sixmwt: "Misura la distanza massima percorribile in 6 minuti camminando al proprio passo, su un percorso piano di lunghezza nota. Riflette la capacità funzionale aerobica sub-massimale ed è ampiamente utilizzato in cardiologia, pneumologia e riabilitazione geriatrica per monitorare l'evoluzione della capacità di esercizio nel tempo.",
  sf36: "Questionario generico di qualità della vita correlata alla salute, tra i più utilizzati al mondo in ambito clinico e di ricerca. Esplora 8 domini (attività fisica, limitazioni di ruolo fisiche ed emotive, dolore fisico, salute generale, vitalità, attività sociali, salute mentale) tramite 36 item, con punteggi 0-100 per dominio dove valori più alti indicano uno stato di salute percepito migliore. Non è specifico di una patologia, quindi si applica trasversalmente a qualsiasi condizione clinica.",
  nihss: "Esame neurologico standardizzato di 15 voci, usato per quantificare la severità di un ictus acuto. Copre livello di coscienza, motilità oculare, campo visivo, paralisi facciale, forza degli arti, atassia, sensibilità, linguaggio, disartria e neglect. Punteggio totale 0-42: più alto indica ictus più severo. Va amministrato da personale formato, tipicamente in meno di 10 minuti.",
  updrs3: "Parte motoria della MDS-UPDRS (Movement Disorder Society - Unified Parkinson's Disease Rating Scale), condotta direttamente dal clinico a differenza delle altre 3 parti (compilate dal paziente). Valuta rigidità, bradicinesia, tremore, andatura e stabilità posturale. Ogni voce 0-4 (normale-molto severo); il punteggio totale orienta la severità motoria e la risposta alla terapia dopaminergica.",
  womac: "Questionario specifico per artrosi di ginocchio e/o anca, tra i più utilizzati in ambito ortopedico. 24 item su 3 sottoscale: dolore (5 item), rigidità (2 item), funzione fisica (17 item), ciascuno 0-4. Punteggio totale 0-96, più alto indica sintomi/limitazioni peggiori. Sensibile al cambiamento dopo trattamento conservativo o chirurgico (es. protesi).",
  dash: "Questionario di 30 item che valuta sintomi e capacità funzionale dell'arto superiore (braccio, spalla, mano) indipendentemente dalla diagnosi specifica. Ogni item 1-5; il punteggio finale (0-100, richiede almeno 27/30 risposte) si calcola come [(media risposte) - 1] × 25. Punteggio più alto indica maggiore disabilità. Ampiamente usato per monitorare il recupero dopo traumi, chirurgia o patologie dell'arto superiore.",
  wmft: "Valuta la funzione dell'arto superiore paretico attraverso 15 compiti funzionali in ordine crescente di complessità, tipicamente usato in ambito post-ictus. Ogni compito è misurato sia per il tempo di esecuzione (secondi, max 120) sia per la qualità del movimento sulla Functional Ability Scale (FAS 0-5). Ampiamente usato per monitorare l'efficacia della terapia del movimento indotto da constraint (CIMT).",
  boxblock: "Misura la destrezza manuale grossolana contando il numero di cubetti da 1 pollice spostati da un vano all'altro di una scatola in 60 secondi, una mano alla volta. Semplice e rapido, ampiamente usato in ambito neurologico (ictus, sclerosi multipla, lesioni midollari) e ortopedico. Adulti sani trasferiscono in media 75-78 cubetti; punteggi più alti indicano migliore destrezza.",
  jebsen: "7 sottotest cronometrati che simulano attività quotidiane (scrittura, girare pagine, raccogliere piccoli oggetti, impilare pedine, simulare il mangiare, spostare oggetti leggeri e pesanti), eseguiti con ciascuna mano separatamente. Il punteggio è il tempo totale per completare tutti i sottotest; tempi più brevi indicano funzione migliore.",
  tct: "Valuta il controllo del tronco nel paziente con ictus attraverso 4 compiti assiali: rotolare verso il lato debole, rotolare verso il lato forte, alzarsi da sdraiato a seduto, e mantenere l'equilibrio da seduto per 30 secondi. Ogni voce è valutata 0 (incapace), 12 (modalità anomala) o 25 (normale), per un punteggio totale 0-100. Buon predittore precoce dell'esito riabilitativo.",
  edss: "Scala standard per quantificare la disabilità nella sclerosi multipla e monitorarne l'evoluzione. Combina la valutazione di 7 sistemi funzionali del sistema nervoso centrale (piramidale, cerebellare, tronco encefalico, sensitivo, vescico-sfinterico, visivo, cerebrale) con la capacità di deambulazione, per determinare uno step finale da 0 (esame normale) a 10 (morte per SM), con incrementi di 0.5. Ampiamente usata in trial clinici, criticata per la sua dipendenza dalla sola deambulazione nei punteggi medio-alti.",
  hy: "Stadiazione clinica della malattia di Parkinson in 8 livelli (0-5, con incrementi 1.5 e 2.5), che descrive la progressione dei sintomi motori da un coinvolgimento unilaterale isolato fino alla completa dipendenza. Stadi 1-3 sono generalmente considerati a disabilità minima, 4-5 a disabilità severa. Semplice e rapida da applicare, ma poco sensibile ai cambiamenti fini.",
  fss: "Questionario di 9 item che misura l'impatto della fatica sulla vita quotidiana, molto usato in sclerosi multipla, malattia di Parkinson e altre condizioni neurologiche croniche. Ogni item 1-7 (fortemente in disaccordo - fortemente in accordo); il punteggio finale è la media dei 9 item. Un punteggio medio superiore a 4 è generalmente considerato indicativo di fatica clinicamente significativa.",
  hhs: "Scala di 100 punti per valutare la funzione dell'anca dopo protesi d'anca o altri interventi, su 4 domini: dolore (44 punti), funzione (47 punti su 7 item), assenza di deformità (4 punti) e range di movimento (5 punti). Punteggi ≥90 sono eccellenti, 80-89 buoni, 70-79 discreti, <70 scarsi. Uno dei punteggi più utilizzati in chirurgia ortopedica dell'anca.",
  ucla: "Scala di 35 punti che integra valutazione soggettiva (dolore, funzione, soddisfazione del paziente) e oggettiva (flessione anteriore attiva, forza) della spalla. Usata soprattutto per artroplastica di spalla e riparazione della cuffia dei rotatori. Punteggi ≥27 indicano risultato buono/eccellente, <27 risultato scarso/insoddisfacente.",
  drs: "Scala di 8 item per classificare il grado di disabilità dopo trauma cranico, dal coma al reinserimento nella comunità. Copre vigilanza/consapevolezza (apertura occhi, comunicazione, risposta motoria), capacità cognitiva per l'autocura (alimentazione, toilette, igiene), dipendenza dagli altri e adattabilità psicosociale (occupabilità). Punteggio 0 (nessuna disabilità) a 29 (stato vegetativo estremo in vita); 30 indica il decesso.",
};

// ===================== Katz Index =====================
export const KATZ_ITEMS: KeyedItem[] = [
  { key: 'bathing', label: 'Fare il bagno' },
  { key: 'dressing', label: 'Vestirsi' },
  { key: 'toileting', label: 'Toilette' },
  { key: 'transferring', label: 'Spostarsi (letto/sedia)' },
  { key: 'continence', label: 'Continenza' },
  { key: 'feeding', label: 'Alimentazione' },
];
export const KATZ_OPTIONS: ScaleOption[] = [{ v: 0, l: 'Dipendente' }, { v: 1, l: 'Indipendente' }];
export const KATZ_TEXT = {
  full: 'Completa autonomia',
  moderate: 'Compromissione moderata',
  severe: 'Compromissione severa',
};

// ===================== Barthel Index =====================
export const BARTHEL_ITEMS: { key: string; label: string; options: ScaleOption[] }[] = [
  { key: 'feeding', label: 'Alimentazione', options: [{ v: 0, l: 'Incapace' }, { v: 5, l: 'Necessita assistenza' }, { v: 10, l: 'Indipendente' }] },
  { key: 'bathing', label: 'Fare il bagno', options: [{ v: 0, l: 'Dipendente' }, { v: 5, l: 'Indipendente' }] },
  { key: 'grooming', label: 'Igiene personale', options: [{ v: 0, l: 'Necessita aiuto' }, { v: 5, l: 'Indipendente' }] },
  { key: 'dressing', label: 'Vestirsi', options: [{ v: 0, l: 'Dipendente' }, { v: 5, l: 'Necessita aiuto' }, { v: 10, l: 'Indipendente' }] },
  { key: 'bowel', label: 'Controllo defecazione', options: [{ v: 0, l: 'Incontinente' }, { v: 5, l: 'Occasionale' }, { v: 10, l: 'Continente' }] },
  { key: 'bladder', label: 'Controllo minzione', options: [{ v: 0, l: 'Incontinente' }, { v: 5, l: 'Occasionale' }, { v: 10, l: 'Continente' }] },
  { key: 'toilet', label: 'Uso del bagno', options: [{ v: 0, l: 'Dipendente' }, { v: 5, l: 'Necessita aiuto' }, { v: 10, l: 'Indipendente' }] },
  { key: 'transfer', label: 'Trasferimenti sedia/letto', options: [{ v: 0, l: 'Incapace' }, { v: 5, l: 'Grande assistenza' }, { v: 10, l: 'Minima assistenza' }, { v: 15, l: 'Indipendente' }] },
  { key: 'mobility', label: 'Deambulazione', options: [{ v: 0, l: 'Immobile' }, { v: 5, l: 'Con aiuto' }, { v: 10, l: 'Con ausilio' }, { v: 15, l: 'Indipendente' }] },
  { key: 'stairs', label: 'Salire le scale', options: [{ v: 0, l: 'Incapace' }, { v: 5, l: 'Con aiuto' }, { v: 10, l: 'Indipendente' }] },
];
export const BARTHEL_TEXT = {
  severe: 'Dipendenza severa — necessita riabilitazione',
  moderate: 'Dipendenza moderata',
  mild: 'Dipendenza lieve',
  independent: 'Indipendente',
};

// ===================== Tinetti Scale =====================
export const TINETTI_BALANCE: { key: string; label: string; max: number }[] = [
  { key: 'sitting', label: 'Equilibrio da seduto', max: 1 },
  { key: 'rising', label: 'Alzarsi dalla sedia', max: 2 },
  { key: 'attempts', label: 'Tentativo di alzarsi', max: 2 },
  { key: 'standing', label: 'Equilibrio in stazione eretta (5 sec)', max: 2 },
  { key: 'standing_prolonged', label: 'Equilibrio in stazione eretta prolungata', max: 2 },
  { key: 'eyes_closed', label: 'Equilibrio a occhi chiusi', max: 1 },
  { key: 'turn_360', label: 'Girarsi di 360°', max: 2 },
  { key: 'sitting_down', label: 'Sedersi', max: 2 },
];
export const TINETTI_GAIT: { key: string; label: string; max: number }[] = [
  { key: 'initiation', label: 'Inizio della deambulazione', max: 1 },
  { key: 'step_length', label: 'Lunghezza e altezza del passo', max: 1 },
  { key: 'symmetry', label: 'Simmetria del passo', max: 1 },
  { key: 'continuity', label: 'Continuità del passo', max: 1 },
  { key: 'trajectory', label: 'Traiettoria', max: 2 },
  { key: 'trunk', label: 'Tronco', max: 2 },
];
export const TINETTI_TEXT = {
  balanceHeading: 'Equilibrio (max 16)',
  gaitHeading: 'Andatura (max 12)',
  low: 'Basso rischio di caduta',
  moderate: 'Rischio moderato',
  high: 'Elevato rischio di caduta',
};

// ===================== Conley Scale =====================
export const CONLEY_ITEMS: { key: string; label: string; max: number }[] = [
  { key: 'c1', label: 'Precedenti cadute (ultimi 3 mesi)', max: 2 },
  { key: 'c2', label: 'Vertigini o capogiri (ultimi 3 mesi)', max: 1 },
  { key: 'c3', label: 'Incapace di trattenere urine/feci mentre si reca in bagno (ultimi 3 mesi)', max: 1 },
  { key: 'c4', label: "Deterioramento cognitivo (marcia strascicata, base d'appoggio ampia, instabile)", max: 1 },
  { key: 'c5', label: 'Agitato (attività motoria eccessiva, non finalizzata)', max: 2 },
  { key: 'c6', label: 'Deterioramento della capacità di giudizio / mancanza del senso del pericolo', max: 3 },
];
export const CONLEY_TEXT = {
  significant: 'Rischio di caduta significativo',
  low: 'Rischio basso',
};

// ===================== Berg Balance Scale =====================
export const BERG_ITEMS: string[] = [
  'Posizione seduta a stazione eretta', 'Stazione eretta senza appoggio', 'Posizione seduta senza schienale',
  'Da stazione eretta a seduta', 'Trasferimenti', 'Stazione eretta a occhi chiusi', 'Stazione eretta a piedi uniti',
  'Raggiungere in avanti con braccio teso', 'Raccogliere un oggetto da terra', 'Girarsi a guardare indietro',
  'Girarsi di 360°', 'Posizionare alternativamente il piede su un gradino', "Stazione eretta con un piede davanti all'altro",
  'Stazione eretta su un piede solo',
];
export const BERG_TEXT = {
  low: 'Basso rischio di caduta',
  moderate: 'Rischio moderato',
  high: 'Elevato rischio di caduta',
};

// ===================== Morse Fall Scale =====================
export const MORSE_ITEMS: { key: string; label: string; options: ScaleOption[] }[] = [
  { key: 'history', label: 'Storia di cadute (attuale o negli ultimi 3 mesi)', options: [{ v: 0, l: 'No' }, { v: 25, l: 'Sì (25)' }] },
  { key: 'secondary', label: 'Diagnosi secondaria', options: [{ v: 0, l: 'No' }, { v: 15, l: 'Sì (15)' }] },
  { key: 'aid', label: 'Ausilio per la deambulazione', options: [{ v: 0, l: 'Nessuno/riposo a letto/assistenza infermieristica' }, { v: 15, l: 'Bastone/stampelle/deambulatore' }, { v: 30, l: 'Si appoggia ai mobili' }] },
  { key: 'iv', label: 'Terapia endovenosa / accesso venoso', options: [{ v: 0, l: 'No' }, { v: 20, l: 'Sì (20)' }] },
  { key: 'gait', label: 'Andatura', options: [{ v: 0, l: 'Normale/riposo a letto/immobile' }, { v: 10, l: 'Debole' }, { v: 20, l: 'Compromessa' }] },
  { key: 'mental', label: 'Stato mentale', options: [{ v: 0, l: 'Orientato sulle proprie capacità' }, { v: 15, l: 'Sovrastima le proprie capacità' }] },
];
export const MORSE_TEXT = {
  high: 'Rischio alto',
  moderate: 'Rischio moderato',
  low: 'Rischio basso',
};

// ===================== Modified Ashworth Scale =====================
export const ASHWORTH_LEVELS: { v: number; l: string; desc: string }[] = [
  { v: 0, l: '0', desc: 'Nessun aumento del tono muscolare' },
  { v: 1, l: '1', desc: 'Lieve aumento del tono, con arresto minimo o a fine ROM' },
  { v: 1.5, l: '1+', desc: 'Lieve aumento del tono, con arresto in meno della metà del ROM' },
  { v: 2, l: '2', desc: 'Aumento più marcato del tono per la maggior parte del ROM, arto ancora mobilizzabile facilmente' },
  { v: 3, l: '3', desc: 'Considerevole aumento del tono, movimento passivo difficoltoso' },
  { v: 4, l: '4', desc: 'Parte rigida in flessione o estensione' },
];
export const ASHWORTH_TEXT = {
  label: 'Grado di spasticità osservato',
  resultTemplate: 'Grado {grade} — {desc}',
};

// ===================== NRS Pain Scale =====================
export const NRS_TEXT = {
  label: 'Intensità del dolore percepito (0 = nessun dolore, 10 = peggior dolore immaginabile)',
  none: 'Nessun dolore',
  mild: 'Dolore lieve',
  moderate: 'Dolore moderato',
  severe: 'Dolore severo',
};

// ===================== SPPB =====================
export const SPPB_BALANCE_OPTIONS: ScaleOption[] = [{ v: 0, l: 'Incapace di mantenere piedi uniti 10s' }, { v: 1, l: 'Semi-tandem <10s' }, { v: 2, l: 'Tandem <3s' }, { v: 3, l: 'Tandem 3-9,9s' }, { v: 4, l: 'Tandem ≥10s' }];
export const SPPB_GAIT_OPTIONS: ScaleOption[] = [{ v: 0, l: 'Incapace' }, { v: 1, l: '>8,70s' }, { v: 2, l: '6,21-8,70s' }, { v: 3, l: '4,82-6,20s' }, { v: 4, l: '<4,82s' }];
export const SPPB_CHAIR_OPTIONS: ScaleOption[] = [{ v: 0, l: 'Incapace o >60s' }, { v: 1, l: '16,7-59,9s' }, { v: 2, l: '13,7-16,69s' }, { v: 3, l: '11,2-13,69s' }, { v: 4, l: '<11,2s' }];
export const SPPB_TEXT = {
  balanceLabel: 'Test di equilibrio (piedi uniti, semi-tandem, tandem)',
  gaitLabel: 'Velocità del cammino su 4 metri',
  chairLabel: 'Alzata dalla sedia x5 ripetizioni',
  good: 'Performance fisica buona',
  limited: 'Performance fisica limitata',
  poor: 'Performance fisica scarsa — alto rischio di disabilità',
};

// ===================== MMSE =====================
export const MMSE_TEXT = {
  label: 'Punteggio totale ottenuto',
  normal: 'Funzione cognitiva normale',
  mildModerate: 'Decadimento cognitivo lieve-moderato',
  severe: 'Decadimento cognitivo severo',
};

// ===================== Glasgow Coma Scale =====================
export const GCS_EYE_OPTIONS: ScaleOption[] = [{ v: 1, l: 'Assente' }, { v: 2, l: 'Al dolore' }, { v: 3, l: 'Alla voce' }, { v: 4, l: 'Spontanea' }];
export const GCS_VERBAL_OPTIONS: ScaleOption[] = [{ v: 1, l: 'Assente' }, { v: 2, l: 'Suoni incomprensibili' }, { v: 3, l: 'Parole inappropriate' }, { v: 4, l: 'Confusa' }, { v: 5, l: 'Orientata' }];
export const GCS_MOTOR_OPTIONS: ScaleOption[] = [{ v: 1, l: 'Assente' }, { v: 2, l: 'Estensione al dolore' }, { v: 3, l: 'Flessione al dolore' }, { v: 4, l: 'Retrazione al dolore' }, { v: 5, l: 'Localizza il dolore' }, { v: 6, l: 'Obbedisce ai comandi' }];
export const GCS_TEXT = {
  eyeLabel: 'Apertura degli occhi (E)',
  verbalLabel: 'Risposta verbale (V)',
  motorLabel: 'Risposta motoria (M)',
  mild: 'Trauma lieve',
  moderate: 'Trauma moderato',
  severe: 'Trauma grave',
};

// ===================== Timed Up and Go =====================
export const TUG_TEXT = {
  label: 'Tempo cronometrato',
  normal: 'Mobilità normale',
  frailNormal: 'Mobilità nella norma per anziano fragile',
  risk: 'Rischio di caduta aumentato — approfondire',
};

// ===================== 6-Minute Walk Test =====================
export const SIXMWT_TEXT = {
  label: 'Distanza percorsa',
  interpretation: "Confronta con i valori normativi attesi per età, sesso, altezza e peso del paziente (equazioni di riferimento come Enright & Sherrill)",
};

// ===================== NIHSS =====================
export const OPT_NIHSS_1A: ScaleOption[] = [{ v: 0, l: 'Vigile' }, { v: 1, l: 'Non vigile, risvegliabile con stimoli minimi' }, { v: 2, l: 'Non vigile, richiede stimoli ripetuti' }, { v: 3, l: 'Risposta solo riflessa o nessuna risposta' }];
export const OPT_NIHSS_1B: ScaleOption[] = [{ v: 0, l: 'Entrambe corrette' }, { v: 1, l: 'Una corretta' }, { v: 2, l: 'Nessuna corretta' }];
export const OPT_NIHSS_1C: ScaleOption[] = [{ v: 0, l: 'Entrambi eseguiti' }, { v: 1, l: 'Uno eseguito' }, { v: 2, l: 'Nessuno eseguito' }];
export const OPT_NIHSS_GAZE: ScaleOption[] = [{ v: 0, l: 'Normale' }, { v: 1, l: 'Paresi parziale dello sguardo' }, { v: 2, l: 'Deviazione forzata' }];
export const OPT_NIHSS_VISUAL: ScaleOption[] = [{ v: 0, l: 'Nessuna perdita' }, { v: 1, l: 'Emianopsia parziale' }, { v: 2, l: 'Emianopsia completa' }, { v: 3, l: 'Emianopsia bilaterale' }];
export const OPT_NIHSS_FACIAL: ScaleOption[] = [{ v: 0, l: 'Normale' }, { v: 1, l: 'Paralisi minore' }, { v: 2, l: 'Paralisi parziale' }, { v: 3, l: 'Paralisi completa' }];
export const OPT_NIHSS_LIMB: ScaleOption[] = [{ v: 0, l: 'Nessuna caduta' }, { v: 1, l: 'Caduta lieve' }, { v: 2, l: 'Qualche sforzo contro gravita' }, { v: 3, l: 'Nessuno sforzo contro gravita' }, { v: 4, l: 'Nessun movimento' }];
export const OPT_NIHSS_ATAXIA: ScaleOption[] = [{ v: 0, l: 'Assente' }, { v: 1, l: 'Presente in un arto' }, { v: 2, l: 'Presente in due arti' }];
export const OPT_NIHSS_SENSORY: ScaleOption[] = [{ v: 0, l: 'Normale' }, { v: 1, l: 'Perdita lieve-moderata' }, { v: 2, l: 'Perdita severa-totale' }];
export const OPT_NIHSS_LANGUAGE: ScaleOption[] = [{ v: 0, l: 'Nessuna afasia' }, { v: 1, l: 'Afasia lieve-moderata' }, { v: 2, l: 'Afasia severa' }, { v: 3, l: 'Muto/afasia globale' }];
export const OPT_NIHSS_DYSARTHRIA: ScaleOption[] = [{ v: 0, l: 'Normale' }, { v: 1, l: 'Lieve-moderata' }, { v: 2, l: 'Severa' }];
export const OPT_NIHSS_NEGLECT: ScaleOption[] = [{ v: 0, l: 'Nessuna anomalia' }, { v: 1, l: 'Lieve (una modalita)' }, { v: 2, l: 'Severa (piu modalita)' }];

export const NIHSS_ITEMS: { id: string; label: string; options: ScaleOption[] }[] = [
  { id: '1a', label: '1a. Livello di coscienza', options: OPT_NIHSS_1A },
  { id: '1b', label: '1b. Domande sul livello di coscienza (mese, eta)', options: OPT_NIHSS_1B },
  { id: '1c', label: '1c. Comandi sul livello di coscienza (apri/chiudi occhi, apri/chiudi mano)', options: OPT_NIHSS_1C },
  { id: '2', label: '2. Sguardo coniugato', options: OPT_NIHSS_GAZE },
  { id: '3', label: '3. Campo visivo', options: OPT_NIHSS_VISUAL },
  { id: '4', label: '4. Paralisi facciale', options: OPT_NIHSS_FACIAL },
  { id: '5a', label: '5a. Forza arto superiore sinistro', options: OPT_NIHSS_LIMB },
  { id: '5b', label: '5b. Forza arto superiore destro', options: OPT_NIHSS_LIMB },
  { id: '6a', label: '6a. Forza arto inferiore sinistro', options: OPT_NIHSS_LIMB },
  { id: '6b', label: '6b. Forza arto inferiore destro', options: OPT_NIHSS_LIMB },
  { id: '7', label: '7. Atassia degli arti', options: OPT_NIHSS_ATAXIA },
  { id: '8', label: '8. Sensibilita', options: OPT_NIHSS_SENSORY },
  { id: '9', label: '9. Linguaggio', options: OPT_NIHSS_LANGUAGE },
  { id: '10', label: '10. Disartria', options: OPT_NIHSS_DYSARTHRIA },
  { id: '11', label: '11. Estinzione e inattenzione (neglect)', options: OPT_NIHSS_NEGLECT },
];
export const NIHSS_TEXT = {
  none: 'Nessun sintomo di ictus',
  minor: 'Ictus minore',
  moderate: 'Ictus moderato',
  moderateSevere: 'Ictus da moderato a severo',
  severe: 'Ictus severo',
  resultSuffixTemplate: '{interp} - {answered}/15 voci compilate',
};

// ===================== MDS-UPDRS Parte III =====================
export const OPT_UPDRS5: ScaleOption[] = [{ v: 0, l: 'Normale' }, { v: 1, l: 'Lieve' }, { v: 2, l: 'Moderato' }, { v: 3, l: 'Severo' }, { v: 4, l: 'Molto severo' }];

export const UPDRS_III_ITEMS: ScaleItem[] = [
  { id: 'speech', label: 'Eloquio' },
  { id: 'facial', label: 'Espressione facciale' },
  { id: 'rigidity_neck', label: 'Rigidita - collo' },
  { id: 'rigidity_ue_dx', label: 'Rigidita - arto superiore destro' },
  { id: 'rigidity_ue_sx', label: 'Rigidita - arto superiore sinistro' },
  { id: 'rigidity_le_dx', label: 'Rigidita - arto inferiore destro' },
  { id: 'rigidity_le_sx', label: 'Rigidita - arto inferiore sinistro' },
  { id: 'finger_tap_dx', label: 'Movimenti alternati dita - destra' },
  { id: 'finger_tap_sx', label: 'Movimenti alternati dita - sinistra' },
  { id: 'hand_mov_dx', label: 'Movimenti mano - destra' },
  { id: 'hand_mov_sx', label: 'Movimenti mano - sinistra' },
  { id: 'pron_sup_dx', label: 'Prono-supinazione mano - destra' },
  { id: 'pron_sup_sx', label: 'Prono-supinazione mano - sinistra' },
  { id: 'toe_tap_dx', label: 'Movimenti alternati piede - destra' },
  { id: 'toe_tap_sx', label: 'Movimenti alternati piede - sinistra' },
  { id: 'leg_agility_dx', label: 'Agilita della gamba - destra' },
  { id: 'leg_agility_sx', label: 'Agilita della gamba - sinistra' },
  { id: 'arising', label: 'Alzarsi dalla sedia' },
  { id: 'gait', label: 'Andatura' },
  { id: 'freezing', label: 'Freezing dell andatura' },
  { id: 'postural_stability', label: 'Stabilita posturale' },
  { id: 'posture', label: 'Postura' },
  { id: 'bradykinesia_global', label: 'Bradicinesia globale' },
  { id: 'tremor_postural_dx', label: 'Tremore posturale mano - destra' },
  { id: 'tremor_postural_sx', label: 'Tremore posturale mano - sinistra' },
  { id: 'tremor_kinetic_dx', label: 'Tremore cinetico mano - destra' },
  { id: 'tremor_kinetic_sx', label: 'Tremore cinetico mano - sinistra' },
  { id: 'tremor_rest_amp', label: 'Ampiezza tremore a riposo (globale)' },
  { id: 'tremor_rest_const', label: 'Costanza del tremore a riposo' },
];
export const UPDRS_TEXT = {
  resultTemplate: 'Punteggio motorio (Parte III) - {answered}/{total} voci compilate',
};

// ===================== WOMAC =====================
export const OPT_WOMAC: ScaleOption[] = [{ v: 0, l: 'Nessuno' }, { v: 1, l: 'Lieve' }, { v: 2, l: 'Moderato' }, { v: 3, l: 'Severo' }, { v: 4, l: 'Estremo' }];

export const WOMAC_PAIN: ScaleItem[] = [
  { id: 'p1', label: 'Camminando su una superficie piana' },
  { id: 'p2', label: 'Salendo o scendendo le scale' },
  { id: 'p3', label: 'Di notte, a letto' },
  { id: 'p4', label: 'Stando seduto o sdraiato' },
  { id: 'p5', label: 'Stando in piedi' },
];
export const WOMAC_STIFFNESS: ScaleItem[] = [
  { id: 's1', label: 'Rigidita al risveglio mattutino' },
  { id: 's2', label: 'Rigidita piu tardi nel corso della giornata' },
];
export const WOMAC_FUNCTION: ScaleItem[] = [
  { id: 'f1', label: 'Scendere le scale' },
  { id: 'f2', label: 'Salire le scale' },
  { id: 'f3', label: 'Alzarsi da seduto' },
  { id: 'f4', label: 'Stare in piedi' },
  { id: 'f5', label: 'Chinarsi verso il pavimento' },
  { id: 'f6', label: 'Camminare in piano' },
  { id: 'f7', label: 'Entrare/uscire dall auto' },
  { id: 'f8', label: 'Fare la spesa' },
  { id: 'f9', label: 'Indossare le calze' },
  { id: 'f10', label: 'Alzarsi dal letto' },
  { id: 'f11', label: 'Togliersi le calze' },
  { id: 'f12', label: 'Stare sdraiato a letto' },
  { id: 'f13', label: 'Entrare/uscire dalla vasca da bagno' },
  { id: 'f14', label: 'Stare seduto' },
  { id: 'f15', label: 'Sedersi/alzarsi dal water' },
  { id: 'f16', label: 'Faccende domestiche pesanti' },
  { id: 'f17', label: 'Faccende domestiche leggere' },
];
export const WOMAC_TEXT = {
  painHeading: 'Dolore (max 20)',
  stiffnessHeading: 'Rigidita (max 8)',
  functionHeading: 'Funzione Fisica (max 68)',
  painGridLabel: 'Dolore',
  stiffnessGridLabel: 'Rigidita',
  functionGridLabel: 'Funzione',
  resultTemplate: 'Punteggio totale WOMAC - {answered}/24 voci compilate. Punteggi piu alti indicano sintomi/limitazioni peggiori.',
};

// ===================== DASH =====================
export const OPT_DASH: ScaleOption[] = [{ v: 1, l: 'Nessuna difficolta' }, { v: 2, l: 'Lieve' }, { v: 3, l: 'Moderata' }, { v: 4, l: 'Severa' }, { v: 5, l: 'Impossibile' }];

export const DASH_ITEMS: ScaleItem[] = [
  { id: 'd1', label: 'Aprire un barattolo con coperchio a vite nuovo o rigido' },
  { id: 'd2', label: 'Scrivere' },
  { id: 'd3', label: 'Girare una chiave nella serratura' },
  { id: 'd4', label: 'Preparare un pasto' },
  { id: 'd5', label: 'Aprire una porta pesante spingendola' },
  { id: 'd6', label: 'Sistemare un oggetto su un ripiano sopra la testa' },
  { id: 'd7', label: 'Fare lavori domestici pesanti (es. lavare pareti, pavimenti)' },
  { id: 'd8', label: 'Curare il giardino' },
  { id: 'd9', label: 'Rifare un letto' },
  { id: 'd10', label: 'Portare una borsa della spesa o una ventiquattrore' },
  { id: 'd11', label: 'Portare un oggetto pesante (oltre 5 kg)' },
  { id: 'd12', label: 'Cambiare una lampadina sopra la testa' },
  { id: 'd13', label: 'Lavarsi o asciugarsi i capelli' },
  { id: 'd14', label: 'Lavarsi la schiena' },
  { id: 'd15', label: 'Indossare un maglione' },
  { id: 'd16', label: 'Usare un coltello per tagliare il cibo' },
  { id: 'd17', label: 'Attivita ricreative con poco sforzo (es. giocare a carte)' },
  { id: 'd18', label: 'Attivita ricreative con impatto sul braccio (es. golf, martello)' },
  { id: 'd19', label: 'Attivita ricreative con movimento libero del braccio (es. nuoto)' },
  { id: 'd20', label: 'Gestire i trasporti (entrare/uscire da un auto)' },
  { id: 'd21', label: 'Attivita sessuale' },
  { id: 'd22', label: 'Interferenza con le normali attivita sociali' },
  { id: 'd23', label: 'Limitazione nel lavoro o nelle attivita quotidiane abituali' },
  { id: 'd24', label: 'Dolore al braccio, alla spalla o alla mano' },
  { id: 'd25', label: 'Dolore durante lo svolgimento di attivita specifiche' },
  { id: 'd26', label: 'Formicolio (parestesia) al braccio, spalla o mano' },
  { id: 'd27', label: 'Debolezza al braccio, spalla o mano' },
  { id: 'd28', label: 'Rigidita al braccio, spalla o mano' },
  { id: 'd29', label: 'Difficolta a dormire per il dolore al braccio, spalla o mano' },
  { id: 'd30', label: 'Sensazione di scarsa fiducia o utilita del braccio' },
];
export const DASH_TEXT = {
  scoredTemplate: '{answered}/30 voci compilate. Punteggio piu alto = maggiore disabilita.',
  notEnoughTemplate: 'Compila almeno 27 voci per calcolare il punteggio ({answered}/27)',
};

// ===================== Wolf Motor Function Test =====================
export const OPT_FAS: ScaleOption[] = [{ v: 0, l: '0 - Non tenta' }, { v: 1, l: '1' }, { v: 2, l: '2' }, { v: 3, l: '3' }, { v: 4, l: '4' }, { v: 5, l: '5 - Normale' }];

export const WMFT_ITEMS: ScaleItem[] = [
  { id: 'w1', label: 'Avambraccio verso il tavolo (di lato)' },
  { id: 'w2', label: 'Avambraccio verso la scatola (di lato)' },
  { id: 'w3', label: 'Estensione del gomito (di lato)' },
  { id: 'w4', label: 'Estensione del gomito con peso' },
  { id: 'w5', label: 'Mano verso il tavolo (frontale)' },
  { id: 'w6', label: 'Mano verso la scatola (frontale)' },
  { id: 'w7', label: 'Raggiungere e recuperare un oggetto' },
  { id: 'w8', label: 'Solleva una lattina' },
  { id: 'w9', label: 'Solleva una matita' },
  { id: 'w10', label: 'Solleva una graffetta' },
  { id: 'w11', label: 'Impila le pedine (dama)' },
  { id: 'w12', label: 'Gira le carte' },
  { id: 'w13', label: 'Gira una chiave nella serratura' },
  { id: 'w14', label: 'Piega un asciugamano' },
  { id: 'w15', label: 'Solleva un cestino' },
];
export const WMFT_TEXT = {
  fasAverageLabel: 'FAS media',
  timeAverageLabel: 'Tempo medio',
  countSuffixTemplate: '{count}/15 voci',
};

// ===================== Box and Block Test =====================
export const BOXBLOCK_TEXT = {
  dominantLabel: 'Mano dominante - cubetti in 60 secondi',
  nonDominantLabel: 'Mano non dominante - cubetti in 60 secondi',
  resultTemplate: 'Dominante: {dominant} | Non dominante: {nonDominant} - adulti sani: media 77+/-11 (dx), 75+/-11 (sx)',
};

// ===================== Jebsen-Taylor Hand Function Test =====================
export const JEBSEN_ITEMS: ScaleItem[] = [
  { id: 'j1', label: 'Scrittura di una frase' },
  { id: 'j2', label: 'Girare schede (simulazione voltare pagina)' },
  { id: 'j3', label: 'Raccogliere piccoli oggetti (monete, graffette, tappi)' },
  { id: 'j4', label: 'Impilare pedine (dama)' },
  { id: 'j5', label: 'Simulazione dell atto di mangiare' },
  { id: 'j6', label: 'Spostare oggetti grandi e leggeri (lattine vuote)' },
  { id: 'j7', label: 'Spostare oggetti grandi e pesanti (lattine con peso)' },
];
export const JEBSEN_TEXT = {
  resultTemplate: 'Tempo totale - {count}/7 sottotest compilati. Tempi piu brevi indicano funzione migliore.',
};

// ===================== Trunk Control Test =====================
export const OPT_TCT: ScaleOption[] = [{ v: 0, l: '0 - Incapace senza assistenza' }, { v: 12, l: '12 - Modalita anomala' }, { v: 25, l: '25 - Normale' }];

export const TCT_ITEMS: ScaleItem[] = [
  { id: 't1', label: 'Rotolare verso il lato debole' },
  { id: 't2', label: 'Rotolare verso il lato forte' },
  { id: 't3', label: 'Alzarsi da sdraiato a seduto' },
  { id: 't4', label: 'Equilibrio in posizione seduta (30 secondi, piedi a terra)' },
];
export const TCT_TEXT = {
  resultTemplate: '{count}/4 voci compilate. Punteggio piu alto = migliore controllo del tronco.',
};

// ===================== EDSS =====================
export const OPT_FS0_5: ScaleOption[] = [{ v: 0, l: '0 - Normale' }, { v: 1, l: '1' }, { v: 2, l: '2' }, { v: 3, l: '3' }, { v: 4, l: '4' }, { v: 5, l: '5 - Massima disfunzione' }];

export const EDSS_FS_SYSTEMS: ScaleItem[] = [
  { id: 'pyramidal', label: 'Piramidale (forza, debolezza agli arti)' },
  { id: 'cerebellar', label: 'Cerebellare (atassia, coordinazione, tremore)' },
  { id: 'brainstem', label: 'Tronco encefalico (linguaggio, deglutizione, nistagmo)' },
  { id: 'sensory', label: 'Sensitivo (ipoestesia, perdita di sensibilita)' },
  { id: 'bowel_bladder', label: 'Vescico-sfinterico' },
  { id: 'visual', label: 'Visivo' },
  { id: 'cerebral', label: 'Cerebrale/Mentale (cognitivo, umore)' },
];
export const EDSS_STEPS: { v: number; l: string }[] = [
  { v: 0, l: '0.0 - Esame neurologico normale' },
  { v: 1, l: '1.0 - Nessuna disabilita, segni minimi in un sistema funzionale' },
  { v: 1.5, l: '1.5 - Nessuna disabilita, segni minimi in piu di un sistema' },
  { v: 2, l: '2.0 - Disabilita minima in un sistema funzionale' },
  { v: 2.5, l: '2.5 - Disabilita lieve in un sistema, o minima in due' },
  { v: 3, l: '3.0 - Disabilita moderata in un sistema, o lieve in 3-4. Pienamente ambulante' },
  { v: 3.5, l: '3.5 - Pienamente ambulante ma con disabilita moderata in un sistema e piu di minima in altri' },
  { v: 4, l: '4.0 - Ambulante senza aiuto per almeno 500m, autosufficiente circa 12h/die' },
  { v: 4.5, l: '4.5 - Ambulante senza aiuto per almeno 300m, limitazione significativa nelle attivita' },
  { v: 5, l: '5.0 - Ambulante senza aiuto per circa 200m' },
  { v: 5.5, l: '5.5 - Ambulante senza aiuto per circa 100m' },
  { v: 6, l: '6.0 - Necessita di supporto unilaterale intermittente o costante per camminare circa 100m' },
  { v: 6.5, l: '6.5 - Necessita di supporto bilaterale costante per camminare circa 20m' },
  { v: 7, l: '7.0 - Incapace di camminare oltre 5m anche con aiuto, confinato a sedia a rotelle' },
  { v: 7.5, l: '7.5 - Incapace di fare piu di pochi passi, confinato a sedia a rotelle' },
  { v: 8, l: '8.0 - Confinato a letto o sedia, mantiene molte funzioni di autocura' },
  { v: 8.5, l: '8.5 - Confinato a letto per la maggior parte della giornata' },
  { v: 9, l: '9.0 - Paziente completamente dipendente, non comunicativo o non alimentabile/deglutente normalmente' },
  { v: 9.5, l: '9.5 - Totalmente dipendente, incapace di comunicare efficacemente' },
  { v: 10, l: '10.0 - Morte per sclerosi multipla' },
];
export const EDSS_TEXT = {
  fsHeading: 'Sistemi Funzionali (documentazione)',
  stepHeading: 'Step EDSS Finale',
};

// ===================== Hoehn and Yahr =====================
export const HY_STAGES: { v: number; l: string; desc: string }[] = [
  { v: 0, l: 'Stadio 0', desc: 'Nessun segno di malattia' },
  { v: 1, l: 'Stadio 1', desc: 'Sintomi unilaterali soltanto' },
  { v: 1.5, l: 'Stadio 1.5', desc: 'Coinvolgimento unilaterale e assiale' },
  { v: 2, l: 'Stadio 2', desc: "Sintomi bilaterali, senza compromissione dell'equilibrio" },
  { v: 2.5, l: 'Stadio 2.5', desc: 'Malattia bilaterale lieve, con recupero al pull test' },
  { v: 3, l: 'Stadio 3', desc: "Compromissione dell'equilibrio, malattia lieve-moderata, fisicamente indipendente" },
  { v: 4, l: 'Stadio 4', desc: 'Disabilita severa, ancora in grado di camminare o stare in piedi senza assistenza' },
  { v: 5, l: 'Stadio 5', desc: 'Necessita di sedia a rotelle o costretto a letto salvo assistenza' },
];
export const HY_TEXT = {
  label: 'Stadio di malattia osservato',
};

// ===================== Fatigue Severity Scale =====================
export const OPT_FSS: ScaleOption[] = [{ v: 1, l: '1 - Fortemente in disaccordo' }, { v: 2, l: '2' }, { v: 3, l: '3' }, { v: 4, l: '4' }, { v: 5, l: '5' }, { v: 6, l: '6' }, { v: 7, l: '7 - Fortemente in accordo' }];

export const FSS_ITEMS: ScaleItem[] = [
  { id: 'f1', label: 'La mia motivazione e piu bassa quando sono stanco/a' },
  { id: 'f2', label: "L'esercizio fisico mi provoca stanchezza" },
  { id: 'f3', label: 'Mi stanco facilmente' },
  { id: 'f4', label: 'La stanchezza interferisce con il mio funzionamento fisico' },
  { id: 'f5', label: 'La stanchezza mi causa problemi frequenti' },
  { id: 'f6', label: 'La mia stanchezza mi impedisce un funzionamento fisico prolungato' },
  { id: 'f7', label: 'La stanchezza interferisce con lo svolgimento di certi doveri e responsabilita' },
  { id: 'f8', label: 'La stanchezza e tra i tre sintomi piu invalidanti che ho' },
  { id: 'f9', label: 'La stanchezza interferisce con il mio lavoro, la famiglia o la vita sociale' },
];
export const FSS_TEXT = {
  resultTemplate: '{count}/9 voci compilate. Punteggio medio >4 e generalmente considerato indicativo di fatica clinicamente significativa.',
};

// ===================== Harris Hip Score =====================
export const OPT_HHS_PAIN: ScaleOption[] = [{ v: 44, l: 'Nessuno' }, { v: 40, l: 'Leggero, occasionale' }, { v: 30, l: 'Lieve, nessun effetto sulle attivita' }, { v: 20, l: 'Moderato, qualche limitazione' }, { v: 10, l: 'Marcato, seria limitazione' }, { v: 0, l: 'Totalmente disabilitante' }];
export const OPT_HHS_LIMP: ScaleOption[] = [{ v: 11, l: 'Nessuna zoppia' }, { v: 8, l: 'Lieve' }, { v: 5, l: 'Moderata' }, { v: 0, l: 'Severa' }];
export const OPT_HHS_SUPPORT: ScaleOption[] = [{ v: 11, l: 'Nessuno' }, { v: 7, l: 'Bastone per camminate lunghe' }, { v: 5, l: 'Bastone per la maggior parte del tempo' }, { v: 3, l: 'Una stampella' }, { v: 2, l: 'Due bastoni' }, { v: 0, l: 'Due stampelle o incapace di camminare' }];
export const OPT_HHS_DISTANCE: ScaleOption[] = [{ v: 11, l: 'Illimitata' }, { v: 8, l: 'Circa 6 isolati' }, { v: 5, l: 'Circa 2-3 isolati' }, { v: 2, l: 'Solo in casa' }, { v: 0, l: 'Solo a letto/sedia' }];
export const OPT_HHS_SITTING: ScaleOption[] = [{ v: 5, l: 'Qualsiasi sedia per 1 ora' }, { v: 3, l: 'Solo sedia alta' }, { v: 0, l: 'Incapace di sedersi comodamente su qualsiasi sedia' }];
export const OPT_HHS_TRANSPORT: ScaleOption[] = [{ v: 1, l: 'In grado di usare i trasporti pubblici' }, { v: 0, l: 'Incapace' }];
export const OPT_HHS_STAIRS: ScaleOption[] = [{ v: 4, l: 'Normalmente senza corrimano' }, { v: 2, l: 'Normalmente con corrimano' }, { v: 1, l: 'In qualche modo' }, { v: 0, l: 'Incapace' }];
export const OPT_HHS_SHOES: ScaleOption[] = [{ v: 4, l: 'Con facilita' }, { v: 2, l: 'Con difficolta' }, { v: 0, l: 'Incapace' }];
export const OPT_HHS_DEFORMITY: ScaleOption[] = [{ v: 4, l: 'Assente' }, { v: 0, l: 'Presente' }];
export const OPT_HHS_ROM: ScaleOption[] = [{ v: 5, l: 'Normale' }, { v: 4, l: 'Lieve limitazione' }, { v: 3, l: 'Limitazione moderata' }, { v: 2, l: 'Limitazione significativa' }, { v: 1, l: 'Limitazione severa' }, { v: 0, l: 'Anchilosi' }];
export const HHS_TEXT = {
  painHeading: 'Dolore (max 44)',
  functionHeading: 'Funzione (max 47)',
  deformityHeading: 'Assenza di Deformita (max 4)',
  romHeading: 'Range di Movimento (max 5)',
  limpLabel: 'Zoppia',
  supportLabel: 'Supporto',
  distanceLabel: 'Distanza percorsa',
  sittingLabel: 'Sedersi',
  transportLabel: 'Uso dei trasporti pubblici',
  stairsLabel: 'Scale',
  shoesLabel: 'Indossare scarpe e calze',
  excellent: 'Eccellente',
  good: 'Buono',
  fair: 'Discreto',
  poor: 'Scarso',
  resultTemplate: 'Grado: {grade} (90-100 eccellente, 80-89 buono, 70-79 discreto, <70 scarso)',
};

// ===================== UCLA Shoulder Rating Scale =====================
export const OPT_UCLA_PAIN: ScaleOption[] = [{ v: 1, l: 'Presente sempre, insopportabile' }, { v: 2, l: 'Presente sempre, sopportabile' }, { v: 4, l: 'Assente/minimo a riposo, presente in attivita leggere' }, { v: 6, l: 'Presente solo in attivita pesanti' }, { v: 8, l: 'Occasionale e lieve' }, { v: 10, l: 'Nessuno' }];
export const OPT_UCLA_FUNCTION: ScaleOption[] = [{ v: 1, l: "Incapace di usare l'arto" }, { v: 2, l: 'Solo attivita leggere possibili' }, { v: 4, l: 'Lavori domestici leggeri o quasi tutte le ADL' }, { v: 6, l: 'Maggior parte lavori domestici, spesa, guidare' }, { v: 8, l: 'Solo lieve restrizione' }, { v: 10, l: 'Attivita normali' }];
export const OPT_UCLA_FLEXION: ScaleOption[] = [{ v: 5, l: '>150°' }, { v: 4, l: '120-150°' }, { v: 3, l: '90-120°' }, { v: 2, l: '45-90°' }, { v: 1, l: '30-45°' }, { v: 0, l: '<30°' }];
export const OPT_UCLA_STRENGTH: ScaleOption[] = [{ v: 5, l: 'Grado 5 (normale)' }, { v: 4, l: 'Grado 4+' }, { v: 3, l: 'Grado 4' }, { v: 2, l: 'Grado 3+' }, { v: 1, l: 'Grado 3' }, { v: 0, l: 'Grado 0-2' }];
export const OPT_UCLA_SATISFACTION: ScaleOption[] = [{ v: 5, l: 'Soddisfatto e migliorato' }, { v: 0, l: 'Non soddisfatto' }];
export const UCLA_TEXT = {
  painLabel: 'Dolore (max 10)',
  functionLabel: 'Funzione (max 10)',
  flexionLabel: 'Flessione anteriore attiva (max 5)',
  strengthLabel: 'Forza in flessione anteriore (max 5)',
  satisfactionLabel: 'Soddisfazione del paziente (max 5)',
  excellent: 'Eccellente',
  good: 'Buono',
  poor: 'Scarso',
};

// ===================== Disability Rating Scale =====================
export const OPT_DRS_EYE: ScaleOption[] = [{ v: 0, l: 'Spontanea' }, { v: 1, l: 'Alla voce' }, { v: 2, l: 'Al dolore' }, { v: 3, l: 'Nessuna' }];
export const OPT_DRS_COMM: ScaleOption[] = [{ v: 0, l: 'Orientata' }, { v: 1, l: 'Confusa' }, { v: 2, l: 'Inappropriata' }, { v: 3, l: 'Incomprensibile' }, { v: 4, l: 'Nessuna' }];
export const OPT_DRS_MOTOR: ScaleOption[] = [{ v: 0, l: 'Obbedisce ai comandi' }, { v: 1, l: 'Localizza gli stimoli' }, { v: 2, l: 'Retrazione' }, { v: 3, l: 'Flessione' }, { v: 4, l: 'Estensione' }, { v: 5, l: 'Nessuna risposta' }];
export const OPT_DRS_SELFCARE: ScaleOption[] = [{ v: 0, l: 'Completa' }, { v: 1, l: 'Parziale' }, { v: 2, l: 'Minima' }, { v: 3, l: 'Nessuna' }];
export const OPT_DRS_LEVEL: ScaleOption[] = [{ v: 0, l: 'Completamente indipendente' }, { v: 1, l: 'Indipendente in ambiente speciale' }, { v: 2, l: 'Lievemente dipendente' }, { v: 3, l: 'Moderatamente dipendente' }, { v: 4, l: 'Marcatamente dipendente' }, { v: 5, l: 'Totalmente dipendente' }];
export const OPT_DRS_EMPLOY: ScaleOption[] = [{ v: 0, l: 'Non limitata' }, { v: 1, l: 'Lavori selezionati, competitivo' }, { v: 2, l: 'Laboratorio protetto, non competitivo' }, { v: 3, l: 'Non occupabile' }];
export const DRS_TEXT = {
  vigilanceHeading: 'Vigilanza, Consapevolezza, Responsivita',
  selfcareHeading: "Capacita Cognitiva per l'Autocura",
  dependenceHeading: 'Dipendenza dagli Altri',
  psychosocialHeading: 'Adattabilita Psicosociale',
  eyeLabel: 'Apertura degli occhi',
  commLabel: 'Capacita comunicativa',
  motorLabel: 'Risposta motoria',
  feedingLabel: 'Alimentazione',
  toiletingLabel: 'Toilette',
  groomingLabel: 'Igiene personale',
  levelLabel: 'Livello di funzionamento',
  employLabel: 'Occupabilita',
  minPartial: 'Disabilita da nulla a parziale',
  moderateSevere: 'Disabilita moderata-severa',
  severeExtreme: 'Disabilita severa-estrema',
  vegetative: 'Stato vegetativo',
  extremeVegetative: 'Stato vegetativo estremo',
};
