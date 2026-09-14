// Shared plain-data module for Brain Map / Neurology hardcoded clinical
// content — extracted verbatim from app/dashboard/brain-map/page.tsx and
// app/dashboard/brain-map/[slug]/page.tsx so that BOTH the client pages and
// the API routes (app/api/brain-map/...) can import the same source-of-truth
// object, exactly like lib/bodyMapAnatomy.ts does for Body Map's ZONE_ANATOMY.
//
// Every entry that needs translation carries a stable `slug` used as the
// `content_id` passed to lib/contentTranslation.ts's translateContent() —
// this way no database migration is needed to make this content
// multi-language: the lazy engine translates and caches it the first time a
// non-Italian request asks for it.

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

export interface ZoneDetail {
  anatomy: string;
  connections: string;
  function: string;
  clinicalRelevance: string;
  vascularSupply: string;
}

// Brain zone anatomy/physiology narrative, keyed by the same slug as the
// `brain_zones` DB table — mirrors lib/bodyMapAnatomy.ts's ZONE_ANATOMY.
export const ZONE_INFO: Record<string, ZoneDetail> = {
  'frontal-lobe': {
    anatomy: "Il lobo frontale è il più esteso dei quattro lobi cerebrali, delimitato posteriormente dal solco centrale (di Rolando) e inferiormente dal solco laterale (di Silvio). Comprende tre regioni funzionalmente distinte organizzate in senso antero-posteriore: la corteccia prefrontale (Area 10 e aree associate), la corteccia premotoria e l'area motoria supplementare (Area 6), e la corteccia motoria primaria M1 (Area 4), immediatamente anteriore al solco centrale. Nell'emisfero dominante (tipicamente il sinistro), la porzione inferiore ospita l'area di Broca, deputata al linguaggio espressivo.",
    connections: "M1 proietta direttamente al midollo spinale tramite il tratto cortico-spinale (via piramidale), che decussa a livello del bulbo. La corteccia premotoria e l'area supplementare motoria ricevono input dai gangli della base e dal cervelletto (tramite il talamo) prima di proiettare a M1, integrando la pianificazione del movimento. La corteccia prefrontale è densamente interconnessa con il sistema limbico e con le aree associative parietali e temporali, alla base delle funzioni esecutive.",
    function: "Le tre regioni motorie sono organizzate gerarchicamente: la corteccia prefrontale elabora obiettivi e decisioni; premotoria e area supplementare pianificano la sequenza e la strategia del movimento; M1 esegue il comando motorio finale, con una rappresentazione somatotopica dettagliata (homunculus motorio). Oltre al controllo motorio, il lobo frontale sostiene funzioni esecutive (pianificazione, giudizio, controllo degli impulsi, memoria di lavoro) e il linguaggio espressivo.",
    clinicalRelevance: "Lesioni causano deficit di personalità e comportamento (disinibizione, apatia), emiparesi controlaterale se coinvolta M1, o afasia espressiva (non fluente, con comprensione relativamente preservata) se coinvolta l'area di Broca. Nell'anziano, un deterioramento delle funzioni esecutive frontali è spesso il primo segno di decadimento cognitivo vascolare, distinto dal pattern mnesico tipico dell'Alzheimer, con importanti implicazioni per la diagnosi differenziale e la pianificazione riabilitativa.",
    vascularSupply: "Arteria cerebrale media (MCA) per la maggior parte della convessità laterale; arteria cerebrale anteriore (ACA) per la superficie mediale e la porzione superiore/paracentrale. Occlusione MCA: emiparesi controlaterale a prevalenza brachio-faciale, afasia di Broca se emisfero dominante. Occlusione ACA: emiparesi controlaterale a prevalenza crurale (arto inferiore più colpito dell'arto superiore, per la rappresentazione mediale della gamba nell'homunculus), possibile abulia/mutismo acinetico se bilaterale o esteso alla corteccia cingolata.",
  },
  'parietal-lobe': {
    anatomy: "Il lobo parietale è delimitato anteriormente dal solco centrale, inferiormente dal solco laterale e posteriormente da un confine convenzionale con il lobo occipitale. Ospita la corteccia somatosensoriale primaria S1 (Aree 3a, 3b, 1, 2), immediatamente posteriore al solco centrale e specularmente organizzata rispetto a M1, e la corteccia parietale posteriore (Aree 5 e 7), che integra informazioni multisensoriali.",
    connections: "S1 riceve proiezioni talamiche dirette (nucleo ventrale postero-laterale) che trasmettono informazioni tattili e propriocettive dal corpo controlaterale. La corteccia parietale posteriore integra questo input somatosensoriale con quello visivo proveniente dal lobo occipitale, e comunica densamente con la corteccia premotoria frontale per la pianificazione di movimenti guidati visivamente.",
    function: "S1 elabora tatto, pressione, temperatura e propriocezione con una mappa somatotopica dettagliata (homunculus sensitivo). La corteccia parietale posteriore costruisce la rappresentazione dello spazio peripersonale, integrando corpo e ambiente esterno, ed è fondamentale per l'orientamento spaziale, l'attenzione visuo-spaziale e la coordinazione visuo-motoria.",
    clinicalRelevance: "Lesioni di S1 causano deficit sensitivi controlaterali (ipoestesia, astereognosia). Lesioni della corteccia parietale posteriore, specialmente nell'emisfero destro (non dominante), causano tipicamente neglect spaziale controlaterale — il paziente ignora o non è consapevole di stimoli nell'emispazio sinistro, spesso senza consapevolezza del proprio deficit. Il neglect post-ictus richiede un approccio riabilitativo specifico, con implicazioni dirette sulla sicurezza (es. rischio di cadute, incidenti in carrozzina).",
    vascularSupply: "MCA per la maggior parte della convessità laterale; ACA per la porzione mediale (lobulo paracentrale, sensibilità della gamba); PCA contribuisce al margine posteriore. Occlusione MCA: deficit sensitivo controlaterale, neglect se emisfero non dominante. La sindrome di Balint (simultanagnosia, aprassia oculomotoria, atassia ottica) origina da lesioni bilaterali parieto-occipitali, tipicamente in territorio di confine tra MCA e PCA (watershed), come in ipoperfusione globale.",
  },
  'temporal-lobe': {
    anatomy: "Il lobo temporale è situato inferiormente al solco laterale (di Silvio). La sua porzione superiore ospita la corteccia uditiva primaria (Aree 41-42, giro di Heschl) e, nell'emisfero dominante, l'area di Wernicke, posteriormente. Le strutture mediali del lobo temporale comprendono l'ippocampo e le strutture ad esso adiacenti (giro paraippocampale, corteccia entorinale), oggi spesso trattate come regione a sé nella letteratura neuroscientifica ma anatomicamente parte del complesso temporale.",
    connections: "La corteccia uditiva riceve proiezioni dal nucleo genicolato mediale del talamo. L'area di Wernicke è collegata all'area di Broca frontale tramite il fascicolo arcuato, un fascio di fibre bianche che permette l'integrazione tra comprensione e produzione del linguaggio. Le strutture mediali temporali sono densamente interconnesse con il sistema limbico.",
    function: "Il lobo temporale elabora l'informazione uditiva e, tramite l'area di Wernicke, la comprensione del linguaggio. Le strutture mediali (ippocampo e aree adiacenti) sono centrali nella formazione di nuove memorie dichiarative e nel riconoscimento semantico degli oggetti e dei volti (via visiva ventrale, che termina nel lobo temporale).",
    clinicalRelevance: "Lesioni della corteccia uditiva causano agnosia uditiva; lesioni dell'area di Wernicke causano afasia recettiva (fluente ma con contenuto spesso privo di senso, comprensione compromessa) — a differenza dell'afasia di Broca, il paziente non è consapevole dei propri errori linguistici. Il coinvolgimento precoce delle strutture temporali mediali è caratteristico della malattia di Alzheimer, con un pattern di perdita di memoria episodica recente che precede altri deficit cognitivi.",
    vascularSupply: "MCA per la porzione laterale e superiore (inclusa l'area di Wernicke); PCA per la porzione inferiore e mediale (strutture ippocampali); arteria coroidea anteriore contribuisce alle strutture mediali anteriori (uncus, amigdala, ippocampo anteriore). Occlusione MCA (ramo temporale): afasia di Wernicke se emisfero dominante. Occlusione PCA: possibile amnesia acuta se coinvolte le strutture mediali bilateralmente o nell'unico emisfero dominante per la memoria.",
  },
  'occipital-lobe': {
    anatomy: "Il lobo occipitale è il più posteriore dei quattro lobi, situato posteriormente a un confine convenzionale con lobi parietale e temporale. Ospita la corteccia visiva primaria (Area 17, o V1), localizzata lungo la scissura calcarina, e le aree visive associative circostanti (V2-V5) deputate all'elaborazione di caratteristiche visive complesse (movimento, colore, forma).",
    connections: "V1 riceve proiezioni dirette dal nucleo genicolato laterale del talamo, che a sua volta riceve l'input dalla retina tramite il nervo e il tratto ottico. Da V1, l'informazione visiva si distribuisce lungo due vie associative principali: la via dorsale (parietale, 'dove/come') per la localizzazione spaziale e la guida del movimento, e la via ventrale (temporale, 'cosa') per il riconoscimento di oggetti e volti.",
    function: "V1 elabora le caratteristiche visive elementari (orientamento, contrasto, movimento di base) con una mappa retinotopica precisa. Le aree associative elaborano progressivamente caratteristiche più complesse, fino al riconoscimento cosciente di oggetti, volti e scene.",
    clinicalRelevance: "Lesioni di V1 causano deficit del campo visivo controlaterale (emianopsia omonima in lesioni estese, quadrantopsia in lesioni parziali). Nell'anziano, i deficit visivi post-ictus vanno sempre valutati insieme al rischio di cadute, poiché si sommano spesso a comorbidità visive preesistenti (cataratta, degenerazione maculare), richiedendo un approccio riabilitativo che tenga conto di entrambi i fattori.",
    vascularSupply: "Arteria cerebrale posteriore (PCA), tramite il ramo calcarino, per la quasi totalità della corteccia visiva primaria. Il polo occipitale (rappresentazione maculare) riceve un contributo collaterale dalla MCA, motivo per cui un'occlusione PCA causa tipicamente emianopsia omonima controlaterale con risparmio maculare (macular sparing) — un segno clinico classicamente utilizzato per localizzare la lesione a livello occipitale piuttosto che più anteriormente lungo la via ottica.",
  },
  'cerebellum': {
    anatomy: "Il cervelletto è situato nella fossa cranica posteriore, connesso al tronco encefalico tramite tre paia di peduncoli cerebellari (superiore, medio, inferiore). È organizzato in una porzione mediale (verme), deputata al controllo del tronco e dell'andatura, e due emisferi laterali, deputati al controllo fine dei movimenti degli arti, in particolare distali.",
    connections: "Il cervelletto riceve informazioni propriocettive dal midollo spinale (tratti spino-cerebellari), input vestibolari dall'orecchio interno, e una copia efferente del comando motorio dalla corteccia cerebrale (via i nuclei pontini). L'output cerebellare, tramite il nucleo dentato e gli altri nuclei profondi, raggiunge la corteccia motoria attraverso il talamo, e i nuclei vestibolari/reticolari del tronco per il controllo posturale.",
    function: "Il cervelletto non genera il movimento ma lo coordina, confrontando in tempo reale il comando motorio pianificato con l'esecuzione effettiva (feedback propriocettivo) e correggendo la traiettoria. È centrale per la coordinazione fine, l'equilibrio, il tono muscolare e l'apprendimento motorio procedurale.",
    clinicalRelevance: "Lesioni causano atassia (perdita della coordinazione), dismetria (errore nella misura del movimento), tremore intenzionale (che peggiora avvicinandosi al bersaglio) e disturbi dell'equilibrio, tipicamente omolaterali alla lesione per le vie cerebellari periferiche. Le atassie cerebellari nell'anziano richiedono una valutazione multifattoriale del rischio di caduta, spesso aggravato da comorbidità come la polineuropatia periferica, che riduce ulteriormente il feedback propriocettivo disponibile.",
    vascularSupply: "Tre arterie pari originano dal sistema vertebro-basilare: l'arteria cerebellare postero-inferiore (PICA, dalla vertebrale) irrora la porzione inferiore del cervelletto e, soprattutto, il bulbo laterale — la sua occlusione causa la sindrome di Wallenberg (bulbare laterale): vertigine, atassia, disfagia, sindrome di Horner omolaterale, deficit termico-dolorifico del volto omolaterale e del corpo controlaterale (dissociazione sensitiva crociata), con relativa preservazione della forza. L'arteria cerebellare antero-inferiore (AICA, dalla basilare) irrora il ponte laterale e il flocculo, causando se occlusa vertigine, sordità omolaterale, paralisi del faciale omolaterale. L'arteria cerebellare superiore (SCA, dalla basilare) irrora la porzione superiore del cervelletto.",
  },
  'brainstem': {
    anatomy: "Il tronco encefalico comprende, in senso cranio-caudale, mesencefalo, ponte e bulbo (midollo allungato), e connette il cervello al midollo spinale. Contiene i nuclei di origine di 10 dei 12 nervi cranici (III-XII), i centri vitali per respirazione e frequenza cardiaca nella formazione reticolare bulbare, e i nuclei di origine dei tratti extrapiramidali discendenti (nucleo rosso, nuclei vestibolari, formazione reticolare, collicolo superiore).",
    connections: "Il tronco è il punto di decussazione delle principali vie lunghe: il tratto cortico-spinale decussa a livello bulbare, il lemnisco mediale (via sensitiva tattile/propriocettiva) decussa a livello bulbare, mentre il tratto spinotalamico (dolore/temperatura) decussa già a livello midollare — questa differenza spiega i pattern clinici distintivi delle sindromi da lesione del tronco. Tutte le vie ascendenti e discendenti tra cervello e midollo spinale attraversano il tronco encefalico.",
    function: "Oltre a essere una via di passaggio obbligata per le principali vie motorie e sensitive, il tronco regola funzioni vitali autonome (respirazione, frequenza cardiaca, pressione arteriosa tramite la formazione reticolare), il livello di coscienza (sistema reticolare attivante ascendente), e coordina i riflessi dei nervi cranici (pupillare, corneale, di deglutizione).",
    clinicalRelevance: "Lesioni del tronco sono spesso gravi, con deficit multipli di nervi cranici, alterazione dello stato di coscienza, o sindromi crociate (deficit omolaterale del volto/nervi cranici, controlaterale del corpo, dovuto al livello della decussazione rispetto alla lesione). La prognosi funzionale dipende fortemente dalla tempestività del trattamento in fase acuta, data la concentrazione di funzioni vitali in uno spazio anatomico ristretto.",
    vascularSupply: "Il tronco encefalico è irrorato dall'arteria basilare (formata dalla confluenza delle due vertebrali) e dai suoi rami paramediani (perforanti diretti) e circonferenziali (che raggiungono le porzioni laterali). Le sindromi crociate del tronco derivano da lesioni vascolari a diversi livelli: la sindrome di Weber (mesencefalo, rami perforanti della PCA/basilare) causa paralisi del III nervo cranico omolaterale con emiparesi controlaterale; la sindrome di Millard-Gubler (ponte, rami paramediani della basilare) causa paralisi del VI e VII nervo cranico omolaterale con emiparesi controlaterale; la sindrome di Wallenberg (bulbo laterale, PICA) è descritta sopra. Queste sindromi sono un pilastro dell'insegnamento neurologico per la localizzazione clinica delle lesioni troncoencefaliche.",
  },
  'basal-ganglia': {
    anatomy: "I gangli della base comprendono il nucleo caudato e il putamen (che insieme formano lo striato, o neostriato), il globo pallido (segmenti esterno ed interno), il nucleo subtalamico e la sostanza nera (porzioni compatta e reticolata). Sono nuclei sottocorticali profondi, situati lateralmente al talamo.",
    connections: "Lo striato riceve l'input principale dalla corteccia cerebrale (via glutamatergica eccitatoria) e dalla sostanza nera compatta (via dopaminergica, modulatoria). L'output, tramite globo pallido interno e sostanza nera reticolata, proietta al talamo, che a sua volta restituisce l'informazione alla corteccia frontale, chiudendo un circuito cortico-striato-talamo-corticale. Esistono due vie funzionalmente distinte all'interno del circuito: la via diretta (facilita il movimento) e la via indiretta (lo inibisce), il cui equilibrio è modulato dalla dopamina nigrostriatale.",
    function: "I gangli della base regolano l'inizio, l'ampiezza e la fluidità del movimento volontario, sopprimendo i movimenti indesiderati e facilitando quelli intenzionali, tramite il bilanciamento tra via diretta e indiretta. Contribuiscono inoltre a funzioni cognitive (apprendimento procedurale, formazione delle abitudini) e alla regolazione dell'umore, tramite circuiti paralleli non motori.",
    clinicalRelevance: "La deplezione dei neuroni dopaminergici della sostanza nera compatta è alla base della malattia di Parkinson, con il caratteristico quadro di bradicinesia, rigidità, tremore a riposo e instabilità posturale. Disfunzioni dei gangli della base sono centrali anche in altri disturbi del movimento come corea (movimenti involontari) e distonia (contrazioni muscolari sostenute). Nell'anziano, la diagnosi differenziale tra Parkinson idiopatico e parkinsonismi vascolari (da micro-lesioni ischemiche multiple dello striato) è clinicamente rilevante, poiché influenza sia la prognosi sia la risposta al trattamento farmacologico dopaminergico.",
    vascularSupply: "Le arterie lenticolostriate, piccoli rami perforanti che originano dal tratto prossimale della MCA, irrorano putamen, globo pallido e gran parte del nucleo caudato — sono note in clinica come le \"arterie dell'ictus\" per l'alta frequenza sia di infarti lacunari sia di emorragie ipertensive in questo territorio, essendo vasi terminali ad alta pressione con scarsa capacità di autoregolazione. L'arteria coroidea anteriore irrora inoltre parte del globo pallido e il braccio posteriore della capsula interna, struttura adiacente densa di fibre cortico-spinali.",
  },
  'insula': {
    anatomy: "L'insula (o corteccia insulare, o lobo dell'insula) è una regione corticale nascosta in profondità nel solco laterale (di Silvio), coperta dagli opercoli frontale, parietale e temporale che la ricoprono come veri e propri 'coperchi'. È divisa in una porzione anteriore, filogeneticamente più antica e connessa al sistema limbico, e una porzione posteriore, più recente e connessa alle aree somatosensoriali.",
    connections: "L'insula anteriore riceve proiezioni dal nucleo talamico ventromediale posteriore, che trasmette informazioni interocettive (segnali dagli organi interni, stato fisiologico del corpo), ed è densamente connessa con amigdala, corteccia cingolata anteriore e corteccia orbitofrontale. L'insula posteriore riceve proiezioni somatosensoriali e nocicettive più dirette.",
    function: "L'insula integra segnali interocettivi (battito cardiaco, respirazione, sensazioni viscerali) con stati emotivi soggettivi, contribuendo alla consapevolezza corporea (interocezione) e alla generazione dell'esperienza emotiva cosciente. È inoltre centrale nell'elaborazione del dolore (componente affettiva/emotiva, non solo sensoriale-discriminativa), nel disgusto, e nella regolazione autonomica cardiovascolare e viscerale.",
    clinicalRelevance: "L'insula è coinvolta nella componente affettiva del dolore cronico, e alterazioni della sua attività sono state osservate in sindromi dolorose croniche centralizzate (es. fibromialgia), dove contribuisce all'amplificazione della componente emotiva della sofferenza. Lesioni insulari (es. in alcuni ictus dell'arteria cerebrale media) possono causare disautonomia cardiovascolare acuta, con rilevanza nella gestione medica precoce post-ictus.",
    vascularSupply: "Irrorata direttamente dai rami M2 della MCA, che decorrono nella cisterna silviana sopra la superficie insulare prima di emergere sulla convessità laterale — per questo l'insula è tra le prime aree a mostrare segni precoci di ischemia (perdita del \"nastro insulare\") alla TC cerebrale in caso di occlusione prossimale della MCA, un segno radiologico precoce clinicamente rilevante nella valutazione dell'ictus iperacuto.",
  },
  'corpus-callosum': {
    anatomy: "Il corpo calloso è il più grande fascio di fibre commissurali del cervello, composto da circa 200-300 milioni di assoni mielinizzati che collegano le aree corticali omologhe dei due emisferi cerebrali. Anatomicamente si distingue in ginocchio (porzione anteriore, connette i lobi frontali), corpo (porzione centrale), istmo e splenio (porzione posteriore, connette i lobi occipitali e parte dei temporali).",
    connections: "Le fibre callose collegano in modo topograficamente organizzato le aree corticali omologhe dei due emisferi: le fibre del ginocchio connettono le regioni prefrontali, quelle del corpo le regioni motorie/somatosensoriali, quelle dello splenio le regioni visive occipitali e parte del lobo temporale.",
    function: "Il corpo calloso permette l'integrazione e la comunicazione tra i due emisferi cerebrali, coordinando funzioni che richiedono elaborazione bilaterale (es. coordinazione bimanuale, integrazione dell'informazione visiva dai due campi visivi) e trasferendo informazioni specializzate elaborate in un emisferio (es. linguaggio nell'emisfero dominante) all'altro.",
    clinicalRelevance: "Lesioni del corpo calloso (es. in sclerosi multipla, dove è una sede tipica di placche demielinizzanti, o in traumi cranici con lesione assonale diffusa) causano sindromi da disconnessione interemisferica, con deficit nella coordinazione bimanuale e nell'integrazione di informazioni tra i due lati. L'agenesia congenita del corpo calloso, pur potendo essere relativamente ben compensata da altre vie di connessione, si associa in alcuni casi a deficit di coordinazione motoria e funzioni esecutive.",
    vascularSupply: "L'arteria pericallosa, ramo terminale dell'ACA, irrora la maggior parte del corpo calloso (ginocchio, corpo); lo splenio riceve un contributo aggiuntivo da rami della PCA. Infarti nel territorio dell'ACA distale possono quindi coinvolgere il corpo calloso, contribuendo a sindromi da disconnessione callosa acuta (es. aprassia della mano sinistra in compiti verbali, in pazienti destrimani).",
  },
  'thalamus': {
    anatomy: "Il talamo è una struttura sottocorticale pari, situata ai lati del terzo ventricolo, organizzata in numerosi nuclei ciascuno con proiezioni specifiche verso aree corticali definite. I principali nuclei di rilievo per la funzione sensitivo-motoria includono il nucleo ventrale postero-laterale (VPL, sensibilità del corpo), ventrale postero-mediale (VPM, sensibilità del volto), ventrale laterale (VL, motorio) e i nuclei genicolati laterale (visivo) e mediale (uditivo).",
    connections: "Il talamo è la principale stazione di ritrasmissione (relay) per quasi tutta l'informazione sensoriale diretta alla corteccia (eccetto l'olfatto), e riceve anche l'output dei gangli della base e del cervelletto prima che questo raggiunga la corteccia motoria. Ogni nucleo talamico ha proiezioni reciproche specifiche con la sua area corticale target, formando circuiti talamo-corticali.",
    function: "Il talamo integra, filtra e ritrasmette l'informazione sensoriale e motoria verso la corteccia cerebrale, agendo come un centro di smistamento attivo (non un semplice relay passivo) che modula quali informazioni raggiungono la coscienza corticale. Contribuisce inoltre alla regolazione del ciclo sonno-veglia tramite i nuclei intralaminari e la loro connessione con il sistema reticolare attivante.",
    clinicalRelevance: "Lesioni talamiche possono causare deficit sensitivi controlaterali globali (tutte le modalità sensoriali) e, caratteristicamente, la sindrome dolorosa talamica (o sindrome di Dejerine-Roussy), un dolore centrale cronico spesso di difficile gestione che può comparire settimane o mesi dopo un ictus talamico. Il talamo è anche una sede rilevante nella genesi del tremore essenziale e in alcuni target di stimolazione cerebrale profonda per disturbi del movimento refrattari al trattamento farmacologico.",
    vascularSupply: "La vascolarizzazione talamica è complessa e clinicamente rilevante: le arterie talamogenicolate (rami della PCA) irrorano il nucleo ventrale postero-laterale, la cui occlusione causa la sindrome dolorosa talamica di Dejerine-Roussy; l'arteria talamoperforata paramediana (spesso originante da un singolo tronco comune noto come arteria di Percheron) irrora porzioni mediali di entrambi i talami — la sua occlusione causa il caratteristico infarto talamico paramediano bilaterale, con compromissione acuta dello stato di coscienza (sonnolenza, coma) e successivi deficit cognitivi, un quadro clinico distintivo che ogni neurologo impara a riconoscere; l'arteria tuberotalamica (o polare, ramo della comunicante posteriore) irrora la porzione anteriore del talamo.",
  },
  'hypothalamus': {
    anatomy: "L'ipotalamo è una piccola struttura situata alla base del cervello, inferiormente al talamo, che forma il pavimento e parte delle pareti del terzo ventricolo. È organizzato in numerosi nuclei con funzioni specifiche (es. nucleo sopraottico e paraventricolare per la produzione ormonale, nucleo soprachiasmatico per il ritmo circadiano, nucleo ventromediale per la sazietà).",
    connections: "L'ipotalamo è connesso all'ipofisi tramite il peduncolo ipofisario, sia per via nervosa diretta (neuroipofisi, per il rilascio di ossitocina e vasopressina prodotte nell'ipotalamo) sia per via vascolare (sistema portale ipotalamo-ipofisario, per il controllo della secrezione degli ormoni dell'adenoipofisi). Riceve inoltre input dal sistema limbico, dal tronco encefalico e proietta estesamente al sistema nervoso autonomo tramite il tronco encefalico e il midollo spinale.",
    function: "L'ipotalamo è il principale centro di controllo dell'omeostasi corporea: regola temperatura corporea, fame e sazietà, sete, ciclo sonno-veglia (tramite il nucleo soprachiasmatico, l'orologio biologico principale), risposta allo stress (asse ipotalamo-ipofisi-surrene) e comportamento riproduttivo, integrando segnali neurali e ormonali.",
    clinicalRelevance: "Lesioni ipotalamiche (tumori, traumi, interventi chirurgici in quella regione) possono causare disregolazione termica, disturbi del sonno, alterazioni dell'appetito con obesità o cachessia, diabete insipido (da deficit di vasopressina) o disfunzioni endocrine multiple. Nell'anziano, la disregolazione del ritmo circadiano ipotalamico contribuisce ai disturbi del sonno frequentemente osservati nelle demenze, con importanti implicazioni per la gestione comportamentale e ambientale del paziente.",
    vascularSupply: "Irrorato da numerosi piccoli rami perforanti che originano dal circolo arterioso del Willis (rami dell'arteria comunicante anteriore, del tratto prossimale della cerebrale anteriore, della comunicante posteriore e della carotide interna terminale) — la ricca ma delicata rete di piccoli vasi terminali rende questa regione vulnerabile a disfunzione in caso di aneurismi o interventi chirurgici nella regione del poligono di Willis.",
  },
  'amygdala': {
    anatomy: "L'amigdala è un complesso di nuclei situato nella porzione mediale del lobo temporale, immediatamente anteriore all'ippocampo. Comprende diversi sottonuclei funzionalmente distinti, tra cui il nucleo laterale (principale via di ingresso dell'informazione sensoriale), il nucleo basolaterale e il nucleo centrale (principale via di uscita verso le risposte autonome e comportamentali).",
    connections: "Il nucleo laterale riceve proiezioni sensoriali dirette dal talamo (via rapida, meno elaborata) e dalla corteccia sensoriale associativa (via più lenta ma più accurata). Il nucleo centrale proietta all'ipotalamo (risposte autonome), al tronco encefalico (risposte comportamentali di difesa, freezing) e, tramite connessioni con la corteccia prefrontale, è modulato dal controllo cognitivo top-down.",
    function: "L'amigdala elabora rapidamente il significato emotivo, in particolare la rilevanza minacciosa, degli stimoli sensoriali, e coordina le risposte fisiologiche e comportamentali associate alla paura e all'ansia. È inoltre centrale nel condizionamento della paura (associazione tra uno stimolo neutro e una conseguenza minacciosa) e nella modulazione della consolidazione di memorie emotivamente salienti in collaborazione con l'ippocampo.",
    clinicalRelevance: "Iperattivazione amigdalare è implicata nei disturbi d'ansia e nel disturbo da stress post-traumatico, dove risposte di paura condizionate persistono in modo disadattivo. Lesioni bilaterali dell'amigdala (estremamente rare, es. nella malattia di Urbach-Wiethe) causano un deficit selettivo nel riconoscimento della paura nelle espressioni facciali altrui e una ridotta risposta fisiologica a stimoli minacciosi.",
    vascularSupply: "Irrorata principalmente dall'arteria coroidea anteriore, con contributo dai rami temporali anteriori della MCA. L'arteria coroidea anteriore è un vaso sottile ma clinicamente importante: la sua occlusione causa una sindrome caratteristica con emiparesi controlaterale (capsula interna), emianopsia (tratto ottico) ed emianestesia (talamo), oltre a un possibile coinvolgimento di amigdala e ippocampo anteriore.",
  },
  'hippocampus': {
    anatomy: "L'ippocampo è una struttura a forma di C situata nella porzione mediale del lobo temporale, posteriormente all'amigdala. È organizzato in diverse regioni citoarchitettonicamente distinte (CA1-CA4, giro dentato), disposte in un circuito unidirezionale caratteristico noto come circuito trisinaptico.",
    connections: "L'ippocampo riceve il principale input dalla corteccia entorinale (che a sua volta riceve informazioni multimodali già elaborate da tutte le aree associative corticali) e restituisce l'output principalmente tramite il fornice, che proietta a ipotalamo (corpi mammillari) e setto. Il circuito trisinaptico interno (corteccia entorinale - giro dentato - CA3 - CA1 - corteccia entorinale) è alla base dei meccanismi di plasticità sinaptica coinvolti nell'apprendimento.",
    function: "L'ippocampo è la struttura chiave per la formazione di nuove memorie dichiarative (episodiche e semantiche), agendo come un sito di consolidamento temporaneo prima che le memorie vengano progressivamente trasferite alla corteccia per l'archiviazione a lungo termine. È inoltre coinvolto nella navigazione spaziale, tramite le celebri 'cellule di luogo' che si attivano in risposta a posizioni specifiche nell'ambiente.",
    clinicalRelevance: "L'ippocampo è tra le strutture più precocemente e severamente colpite nella malattia di Alzheimer, spiegando il caratteristico deficit iniziale di memoria episodica recente (il paziente ricorda eventi lontani ma non recenti). L'atrofia ippocampale, visibile alla risonanza magnetica, è un biomarcatore diagnostico rilevante. L'ippocampo è inoltre particolarmente vulnerabile a ipossia/ischemia globale (es. arresto cardiaco) e a crisi epilettiche prolungate, che possono causare sclerosi ippocampale e epilessia del lobo temporale farmacoresistente.",
    vascularSupply: "Irrorato principalmente dai rami ippocampali della PCA, con un contributo anteriore dall'arteria coroidea anteriore. L'ippocampo è tra le strutture cerebrali più vulnerabili all'ipossia/ischemia globale (es. dopo arresto cardiaco), poiché il settore CA1 è selettivamente sensibile alla privazione di ossigeno — un fenomeno di vulnerabilità selettiva ben noto in neuropatologia, alla base dell'amnesia globale che può seguire un evento ipossico-ischemico anche in assenza di lesioni strutturali diffuse evidenti.",
  },
  'spinal-cord': {
    anatomy: "Il midollo spinale si estende dal forame magno (continuazione del bulbo) fino al cono midollare, tipicamente a livello vertebrale L1-L2 nell'adulto (la discrepanza tra livello midollare e livello vertebrale, crescente in senso caudale, è dovuta alla crescita differenziale tra colonna vertebrale e midollo durante lo sviluppo). È organizzato in 31 segmenti (8 cervicali, 12 toracici, 5 lombari, 5 sacrali, 1 coccigeo), ciascuno con una coppia di radici nervose. In sezione trasversale, la sostanza grigia centrale (a forma di H o farfalla, contenente i corpi cellulari neuronali) è circondata dalla sostanza bianca periferica (organizzata in colonne o funicoli, contenente i tratti ascendenti e discendenti).",
    connections: "Le radici dorsali (sensitive, afferenti) entrano nel corno dorsale; le radici ventrali (motorie, efferenti) escono dal corno ventrale, unendosi lateralmente al forame intervertebrale per formare il nervo spinale misto. I principali tratti ascendenti sono il sistema colonna dorsale-lemnisco mediale (tatto discriminativo, propriocezione, decussa a livello bulbare) e il tratto spinotalamico (dolore, temperatura, tatto grossolano, decussa entro 1-2 segmenti dal livello di ingresso). Il principale tratto discendente è il tratto cortico-spinale (controllo motorio volontario, già decussato a livello bulbare nella sua porzione laterale, quindi controlla il lato ipsilaterale del midollo per il movimento controlaterale del corpo).",
    function: "Il midollo spinale trasmette informazioni sensoriali dal corpo al cervello (tramite i tratti ascendenti) e comandi motori dal cervello ai muscoli (tramite i tratti discendenti), oltre a organizzare circuiti riflessi locali (es. riflesso da stiramento, riflesso di flessione-retrazione) che non richiedono l'intervento diretto dell'encefalo. Contiene inoltre i centri per il controllo autonomo di vescica, intestino e funzione sessuale a livello sacrale, e il centro simpatico toraco-lombare.",
    clinicalRelevance: "La distribuzione topografica dei tratti nella sostanza bianca spiega pattern clinici distintivi da lesione midollare parziale. La sindrome di Brown-Séquard (lesione emimidollare, es. trauma penetrante) causa paralisi motoria e perdita di propriocezione/tatto discriminativo omolaterali alla lesione (fibre già ipsilaterali a quel livello), con perdita di dolore/temperatura controlaterale (fibre spinotalamiche già decussate). La sindrome del cordone centrale (tipica in traumi da iperestensione cervicale nell'anziano con stenosi preesistente) causa debolezza a prevalenza degli arti superiori rispetto agli inferiori, per la disposizione somatotopica delle fibre cortico-spinali (cervicali più centrali, sacrali più periferiche). La sindrome del cordone anteriore (tipicamente ischemica, territorio dell'arteria spinale anteriore) causa paralisi motoria bilaterale con perdita di dolore/temperatura, ma preservazione della propriocezione (colonne dorsali risparmiate). Una lesione midollare completa acuta causa shock spinale, con flaccidità e areflessia transitorie al di sotto del livello di lesione, seguite nelle settimane successive dallo sviluppo di spasticità e iperreflessia, con importanti implicazioni per la tempistica e la strategia della riabilitazione motoria.",
    vascularSupply: "Il midollo spinale è irrorato da un'unica arteria spinale anteriore (che origina dalle vertebrali e irrora i due terzi anteriori del midollo, incluse le vie motorie cortico-spinali e spinotalamiche) e da due arterie spinali posteriori pari (che irrorano il terzo posteriore, le colonne dorsali propriocettive). Queste arterie longitudinali ricevono rinforzo segmentale da arterie radicolo-midollari a vari livelli, la più importante delle quali è l'arteria di Adamkiewicz (tipicamente tra T9 e L2), che fornisce un contributo maggiore alla vascolarizzazione del midollo toraco-lombare — la sua compromissione (es. durante chirurgia aortica) è la causa classica della sindrome del cordone anteriore ischemica.",
  },
};

export interface GeriatricPrinciple {
  slug: string;
  title: string;
  content: string;
}

// Shown on every brain zone hub page (app/dashboard/brain-map/[slug]/page.tsx),
// not tied to a specific zone.
export const GERIATRIC_PRINCIPLES: GeriatricPrinciple[] = [
  {
    slug: 'geriatric-approach-vs-young',
    title: 'Approccio al paziente anziano vs giovane',
    content:
      "La valutazione neurologica nell'anziano richiede un approccio diverso da quello del paziente giovane: comorbidità multiple, polifarmacia, e riserva funzionale ridotta modificano sia la presentazione clinica sia la risposta al trattamento. Un cambio di ambiente (es. ricovero) può di per sé destabilizzare un paziente anziano, specialmente in presenza di decadimento cognitivo anche lieve, con perdita dei punti di riferimento abituali — un fattore da considerare nella scelta tra ricovero e gestione domiciliare.",
  },
  {
    slug: 'post-stroke-rehab-timing',
    title: 'Riabilitazione post-ictus: tempistiche e fattori prognostici',
    content:
      "Il timing dell'ingresso in un percorso riabilitativo intensivo dopo un ictus è un fattore prognostico rilevante: il periodo di massimo recupero funzionale si colloca nelle prime settimane-mesi, e un ritardo eccessivo nell'avvio della riabilitazione ne riduce l'efficacia. Va inoltre considerato che una parte dei pazienti anziani può mostrare un peggioramento funzionale alla dimissione rispetto all'ingresso, spesso legato più al cambio di ambiente e alla destabilizzazione psicologica che al quadro neurologico in sé.",
  },
  {
    slug: 'multidisciplinary-patient-centered-care',
    title: 'Approccio multidisciplinare e cura centrata sul paziente',
    content:
      "La gestione del paziente neurogeriatrico beneficia di un team multidisciplinare (medico, fisioterapista, terapista occupazionale, supporto familiare) e di un percorso di cura personalizzato, che integri le linee guida cliniche con il contesto socio-economico e familiare del paziente. Le linee guida forniscono una cornice, ma il piano di trattamento va sempre calibrato sulle risorse e sul contesto specifico di ogni paziente.",
  },
  {
    slug: 'cognitive-warning-signs',
    title: 'Segnali di allarme cognitivo da non sottovalutare',
    content:
      "Un declino cognitivo che compromette progressivamente l'autonomia nelle attività quotidiane, un cambiamento comportamentale acuto o subacuto, o un peggioramento cognitivo rapido (settimane-pochi mesi, non anni) sono segnali che richiedono approfondimento diagnostico tempestivo, per escludere cause reversibili (es. delirium, cause metaboliche/farmacologiche) prima di attribuire il quadro a una demenza degenerativa primaria.",
  },
];

export interface ConductionFiberType {
  slug: string;
  name: string;
  diameter: string;
  myelination: string;
  velocity: string;
  function: string;
}

export const CONDUCTION_FIBER_TYPES: ConductionFiberType[] = [
  { slug: 'fiber-a-alpha', name: 'Aα (A-alfa)', diameter: '13–20 μm', myelination: 'Sì', velocity: '80–120 m/s', function: 'Motoria ai muscoli scheletrici, propriocezione' },
  { slug: 'fiber-a-beta', name: 'Aβ (A-beta)', diameter: '5–12 μm', myelination: 'Sì', velocity: '35–75 m/s', function: 'Tatto, pressione, vibrazione' },
  { slug: 'fiber-a-delta', name: 'Aδ (A-delta)', diameter: '1–5 μm', myelination: 'Sì (sottile)', velocity: '5–30 m/s', function: 'Dolore acuto, freddo, tatto grossolano' },
  { slug: 'fiber-c', name: 'C', diameter: '0.2–1.5 μm', myelination: 'No', velocity: '0.5–2 m/s', function: 'Dolore sordo, caldo, funzioni autonomiche' },
];

export interface NerveInjuryType {
  slug: string;
  name: string;
  severity: string;
  description: string;
}

export const NERVE_INJURY_TYPES: NerveInjuryType[] = [
  {
    slug: 'neurapraxia',
    name: 'Neuroaprassia',
    severity: 'Lieve',
    description:
      "Blocco funzionale temporaneo della conduzione nervosa, senza interruzione anatomica dell'assone. Causa tipica: compressione o trazione lieve. Il recupero è generalmente completo, da giorni a poche settimane, senza necessità di rigenerazione assonale.",
  },
  {
    slug: 'axonotmesis',
    name: 'Assonotmesi',
    severity: 'Moderata',
    description:
      "Interruzione dell'assone con preservazione delle strutture di supporto connettivale (guaina di Schwann, endonevrio). Il recupero avviene per rigenerazione assonale lungo il percorso preservato, a una velocità di circa 1 mm/giorno — quindi tempi di recupero lunghi ma prognosi generalmente favorevole.",
  },
  {
    slug: 'neurotmesis',
    name: 'Neurotmesi',
    severity: 'Severa',
    description:
      "Interruzione completa del nervo, incluse le strutture connettivali di supporto. Il recupero spontaneo è improbabile o incompleto senza intervento chirurgico (neurorrafia o innesto nervoso). È il tipo di lesione più severo secondo la classificazione di Seddon.",
  },
];

export interface Pathway {
  slug: string;
  title: string;
  category: 'long-tracts' | 'brain-circuits';
  subtitle: string;
  image: string;
  route: string;
  description: string;
}

export const PATHWAYS: Pathway[] = [
  {
    slug: 'corticospinal-pathway',
    title: 'Corticospinal (Pyramidal) Pathway',
    category: 'long-tracts',
    subtitle: 'Voluntary motor control — limbs and trunk',
    image: `${IMAGE_BASE}/pathway-corticospinal.png`,
    route: 'Corteccia motoria (M1, Area 4) → capsula interna → peduncolo cerebrale → ponte → piramidi bulbari → decussazione (70-90% delle fibre) → midollo spinale → motoneuroni',
    description:
      "Origina per circa il 60% dalla corteccia motoria primaria (M1, Area 4) e per il 40% dalla corteccia premotoria (Area 6) e dall'area parietale. Scende attraverso il braccio posteriore della capsula interna, il peduncolo cerebrale del mesencefalo, la base del ponte, fino alle piramidi del bulbo, dove la maggior parte delle fibre (70-90%) decussa formando il tratto corticospinale laterale (controlla la muscolatura distale degli arti). Le fibre restanti proseguono omolateralmente come tratto corticospinale anteriore, decussando solo vicino al livello di terminazione, e controllano prevalentemente la muscolatura assiale. È la via responsabile dei movimenti volontari rapidi, precisi e appresi, in particolare delle dita e della mano.",
  },
  {
    slug: 'corticobulbar-pathway',
    title: 'Corticobulbar Pathway',
    category: 'long-tracts',
    subtitle: 'Voluntary motor control — head and face',
    image: `${IMAGE_BASE}/pathway-corticobulbar.png`,
    route: 'Corteccia motoria (Aree 4 e 6) → ginocchio della capsula interna → tronco encefalico → nuclei motori dei nervi cranici (III, IV, V, VI, VII, IX, X, XII)',
    description:
      "Origina dalla corteccia motoria primaria e premotoria e discende attraverso il ginocchio della capsula interna fino ai nuclei motori dei nervi cranici nel tronco encefalico, controllando i muscoli di volto, mandibola, faringe, laringe e lingua. A differenza del tratto corticospinale, la maggior parte delle fibre corticobulbari NON decussa: l'innervazione della muscolatura del volto superiore (fronte, chiusura degli occhi) è bilaterale, mentre quella del volto inferiore (bocca) e della lingua è prevalentemente controlaterale. Questa distinzione è clinicamente fondamentale: una lesione centrale (es. ictus) risparmia tipicamente il movimento della fronte ma causa paralisi della metà inferiore del volto controlaterale, mentre una lesione periferica del nervo facciale (es. paralisi di Bell) coinvolge l'intero emivolto omolaterale, fronte inclusa.",
  },
  {
    slug: 'extrapyramidal-pathways',
    title: 'Extrapyramidal Pathways',
    category: 'long-tracts',
    subtitle: 'Involuntary motor control, posture and tone',
    image: `${IMAGE_BASE}/pathway-extrapyramidal.png`,
    route: 'Nuclei del tronco encefalico (nucleo rosso, formazione reticolare, nuclei vestibolari, collicolo superiore) → midollo spinale → interneuroni e motoneuroni',
    description:
      "A differenza del sistema piramidale, le vie extrapiramidali non originano dalla corteccia ma da nuclei del tronco encefalico, e agiscono in gran parte al di fuori del controllo cosciente diretto. Il tratto rubrospinale (dal nucleo rosso mesencefalico) facilita i muscoli flessori, soprattutto dell'arto superiore. Il tratto reticolospinale (dalla formazione reticolare di ponte e bulbo) regola postura, tono muscolare e movimenti automatici. Il tratto vestibolospinale (dai nuclei vestibolari) mantiene equilibrio e postura integrando l'informazione labirintica. Il tratto tettospinale (dal collicolo superiore) coordina i movimenti riflessi di capo e occhi in risposta a stimoli visivi/uditivi. Clinicamente, una lesione piramidale causa debolezza/paralisi con iperreflessia, mentre una disfunzione extrapiramidale si manifesta come alterazione del tono (rigidità, spasticità, distonia) senza vera paralisi.",
  },
  {
    slug: 'dorsal-column-medial-lemniscus-pathway',
    title: 'Dorsal Column-Medial Lemniscus Pathway',
    category: 'long-tracts',
    subtitle: 'Fine touch, vibration and proprioception',
    image: `${IMAGE_BASE}/pathway-dorsal-column.png`,
    route: 'Recettori periferici → colonne dorsali (fascicolo gracile/cuneato) → nuclei gracile/cuneato nel bulbo → decussazione (fibre arcuate interne) → lemnisco mediale → talamo (VPL) → corteccia somatosensoriale (S1)',
    description:
      "Trasporta tatto fine, vibrazione, propriocezione cosciente e discriminazione tra due punti. Le fibre di primo ordine entrano nel midollo spinale e salgono omolateralmente senza sinapsi nelle colonne dorsali: il fascicolo gracile (mediale) porta informazioni dagli arti inferiori, il fascicolo cuneato (laterale) dagli arti superiori. Fanno sinapsi nei nuclei gracile e cuneato del bulbo, dove le fibre di secondo ordine decussano (fibre arcuate interne) formando il lemnisco mediale, che sale fino al talamo (nucleo ventrale posterolaterale). Da qui, le fibre di terzo ordine proiettano alla corteccia somatosensoriale primaria. Punto chiave: questa via decussa solo nel bulbo — molto più in alto rispetto alla via spinotalamica, che decussa subito nel midollo spinale.",
  },
  {
    slug: 'spinothalamic-pathway',
    title: 'Spinothalamic (Anterolateral) Pathway',
    category: 'long-tracts',
    subtitle: 'Pain, temperature and crude touch',
    image: `${IMAGE_BASE}/pathway-spinothalamic.png`,
    route: 'Recettori periferici → corno dorsale del midollo → decussazione immediata (commissura bianca anteriore) → tratto anterolaterale → talamo (VPL) → corteccia somatosensoriale (S1)',
    description:
      "Trasporta dolore, temperatura e tatto grossolano/pressione. Le fibre di primo ordine entrano nel corno dorsale del midollo spinale e fanno sinapsi quasi subito. Le fibre di secondo ordine decussano immediatamente (entro 1-2 segmenti spinali) attraverso la commissura bianca anteriore, per poi salire controlateralmente nel funicolo anterolaterale come tratto spinotalamico laterale (dolore/temperatura) e tratto spinotalamico anteriore (tatto grossolano/pressione). Raggiungono il talamo e da lì la corteccia somatosensoriale. Punto chiave: questa via decussa subito a livello del midollo spinale — l'opposto della via delle colonne dorsali. Clinicamente, un'emisezione del midollo spinale causa un pattern dissociato: perdita di propriocezione/tatto fine OMOLATERALE (colonne dorsali, non ancora decussate) ma perdita di dolore/temperatura CONTROLATERALE (spinotalamica, già decussata) al di sotto del livello della lesione.",
  },
  {
    slug: 'basal-ganglia-circuitry',
    title: 'Basal Ganglia Circuitry',
    category: 'brain-circuits',
    subtitle: 'Direct and indirect pathways of movement control',
    image: `${IMAGE_BASE}/pathway-basal-ganglia.png`,
    route: 'Corteccia → striato (caudato + putamen) → [via diretta: globo pallido interno/substantia nigra reticolata] o [via indiretta: globo pallido esterno → nucleo subtalamico → globo pallido interno] → talamo → corteccia',
    description:
      "I gangli della base non hanno connessioni dirette con il midollo spinale, ma modulano il movimento tramite un circuito che parte e ritorna alla corteccia, passando per il talamo. La via diretta facilita il movimento: la corteccia eccita lo striato, che inibisce il globo pallido interno/substantia nigra reticolata, riducendo l'inibizione tonica sul talamo — risultato netto: eccitazione della corteccia motoria. La via indiretta inibisce il movimento attraverso un percorso più lungo (striato → globo pallido esterno → nucleo subtalamico → globo pallido interno), con un risultato netto opposto: maggiore inibizione del talamo. La dopamina, rilasciata dalla substantia nigra pars compacta, facilita la via diretta (recettori D1) e inibisce la via indiretta (recettori D2) — l'effetto netto è la facilitazione del movimento. Nella malattia di Parkinson, la degenerazione dei neuroni dopaminergici sposta l'equilibrio verso l'inibizione del talamo, causando bradicinesia, rigidità e tremore a riposo.",
  },
  {
    slug: 'association-fiber-tracts',
    title: 'Association Fiber Tracts',
    category: 'brain-circuits',
    subtitle: 'Intra-hemispheric cortical connections',
    image: `${IMAGE_BASE}/pathway-association-fibers.png`,
    route: 'Aree corticali associative → fascicolo arcuato / fascicolo longitudinale superiore / fascicolo uncinato / cingolo → altre aree corticali dello stesso emisfero',
    description:
      "A differenza dei tratti proiettivi lunghi (come il corticospinale, che collega la corteccia a strutture sottocorticali/midollari) e delle fibre commissurali (come il corpo calloso, che collega i due emisferi), i fasci associativi collegano aree corticali diverse all'interno dello stesso emisfero, permettendo l'integrazione funzionale tra regioni distanti della corteccia. Il fascicolo arcuato collega l'area di Broca (frontale) all'area di Wernicke (temporale), integrando produzione e comprensione del linguaggio — una sua lesione causa l'afasia di conduzione, un quadro distintivo in cui comprensione e produzione linguistica sono relativamente preservate ma la ripetizione di frasi è marcatamente compromessa. Il fascicolo longitudinale superiore, di cui l'arcuato è considerato una componente, collega più ampiamente le regioni frontali, parietali e occipitali. Il fascicolo uncinato collega il lobo frontale (corteccia orbitofrontale) al polo temporale anteriore, contribuendo a memoria semantica e comportamento sociale. Il cingolo collega le strutture limbiche con l'ippocampo, integrando funzioni emotive, mnesiche e attentive.",
  },
  {
    slug: 'papez-circuit',
    title: 'Papez Circuit (Limbic Circuit)',
    category: 'brain-circuits',
    subtitle: 'Emotion and memory consolidation',
    image: `${IMAGE_BASE}/pathway-papez-circuit.png`,
    route: 'Ippocampo → fornice → corpi mammillari (ipotalamo) → tratto mammillotalamico → nucleo talamico anteriore → giro del cingolo → corteccia entorinale → ippocampo (circuito chiuso)',
    description:
      "Descritto per la prima volta dal neuroanatomista James Papez nel 1937 come possibile substrato anatomico dell'emozione, questo circuito chiuso collega strutture del lobo temporale mediale, del diencefalo e della corteccia cingolata, ed è oggi riconosciuto come fondamentale soprattutto per la consolidazione della memoria dichiarativa, oltre che per la regolazione emotiva. L'informazione parte dall'ippocampo, viaggia tramite il fornice fino ai corpi mammillari dell'ipotalamo, prosegue tramite il tratto mammillotalamico fino al nucleo talamico anteriore, da qui proietta al giro del cingolo, che a sua volta proietta alla corteccia entorinale, chiudendo il circuito con una nuova proiezione all'ippocampo. Lesioni in qualsiasi punto di questo circuito possono causare amnesia anterograda severa: la sindrome di Korsakoff (da carenza di tiamina, tipicamente in alcolismo cronico) coinvolge classicamente i corpi mammillari e il talamo dorsomediale; lesioni bilaterali dell'ippocampo (es. da ipossia globale) hanno un effetto analogo agendo più a monte nel circuito.",
  },
  {
    slug: 'spinocerebellar-pathways',
    title: 'Spinocerebellar Pathways',
    category: 'long-tracts',
    subtitle: 'Unconscious proprioception to the cerebellum',
    image: `${IMAGE_BASE}/pathway-spinocerebellar.png`,
    route: 'Fusi neuromuscolari e organi tendinei di Golgi → tratti spinocerebellari dorsale e ventrale (arto inferiore) / cuneocerebellare e spinocerebellare rostrale (arto superiore) → peduncoli cerebellari → cervelletto',
    description:
      "A differenza della via colonna dorsale-lemnisco mediale, che trasmette la propriocezione cosciente destinata alla corteccia somatosensoriale, le vie spinocerebellari trasmettono la propriocezione inconscia direttamente al cervelletto, senza mai raggiungere la coscienza corticale, per la regolazione in tempo reale della coordinazione motoria. Per l'arto inferiore e il tronco, il tratto spinocerebellare dorsale (di Flechsig, non decussato, entra tramite il peduncolo cerebellare inferiore) trasmette informazioni propriocettive precise e rapide da un singolo arto; il tratto spinocerebellare ventrale (di Gowers, decussa due volte, risultando funzionalmente non decussato, entra tramite il peduncolo cerebellare superiore) trasmette informazioni più integrate sull'attività dei circuiti spinali locali. Per l'arto superiore, i tratti equivalenti sono il cuneocerebellare e lo spinocerebellare rostrale. Una lesione di queste vie (es. in atassia di Friedreich, malattia neurodegenerativa ereditaria) causa atassia sensitiva-cerebellare mista, con perdita di coordinazione motoria fine che peggiora ulteriormente in assenza di compenso visivo.",
  },
];

export interface GaitType {
  slug: string;
  name: string;
  origin: string;
  description: string;
}

export const GAIT_TYPES: GaitType[] = [
  {
    slug: 'gait-spastic',
    name: 'Andatura Spastica',
    origin: 'Lesione del I motoneurone (es. post-ictus, paralisi cerebrale)',
    description:
      "Movimento a falce dell'arto inferiore colpito (circumduzione), ginocchio esteso e piede in equinismo/inversione durante lo swing, per compensare la difficoltà a flettere anca/ginocchio/caviglia contro l'ipertono spastico. Tipicamente asimmetrica negli esiti di ictus.",
  },
  {
    slug: 'gait-parkinsonian',
    name: 'Andatura Parkinsoniana',
    origin: 'Disfunzione dei gangli della base (deplezione dopaminergica)',
    description:
      "Passi piccoli e strascicati (marche a piccoli passi), ridotta oscillazione delle braccia, postura flessa in avanti, difficoltà nell'iniziare il passo (freezing) e tendenza alla festinazione (accelerazione involontaria progressiva del passo).",
  },
  {
    slug: 'gait-ataxic-cerebellar',
    name: 'Andatura Atassica Cerebellare',
    origin: 'Disfunzione cerebellare',
    description:
      "Base d'appoggio allargata, passo irregolare ed eterogeneo (varia in ampiezza e lunghezza da un passo all'altro, a differenza della marcia a piccoli passi che è più omogenea), oscillazione del tronco, difficoltà nei cambi di direzione.",
  },
  {
    slug: 'gait-steppage',
    name: 'Andatura Steppante (Steppage)',
    origin: 'Paralisi del nervo peroneale / foot drop',
    description:
      "Eccessiva flessione di anca e ginocchio durante lo swing per compensare l'incapacità di dorsiflettere la caviglia (piede cadente), evitando che le dita strascichino a terra. Il piede tocca terra prima con le dita che con il tallone.",
  },
  {
    slug: 'gait-sensory-ataxic',
    name: 'Andatura Talloneggiante (Atassia Sensitiva)',
    origin: 'Deficit propriocettivo (es. via delle colonne dorsali)',
    description:
      "Il paziente colpisce il suolo con forza eccessiva con il tallone, spesso guardando i propri piedi per compensare visivamente la perdita di informazione propriocettiva. Peggiora marcatamente a occhi chiusi (Romberg positivo).",
  },
  {
    slug: 'gait-vestibular',
    name: 'Andatura Vestibolare',
    origin: 'Disfunzione del sistema vestibolare',
    description:
      "Collo e testa mantenuti rigidi per minimizzare le vertigini, possibile deviazione laterale verso il lato della lesione durante la marcia.",
  },
  {
    slug: 'gait-cautious-elderly',
    name: 'Andatura Cauta (Anziano)',
    origin: 'Paura di cadere, deficit multisensoriale età-correlato',
    description:
      "Passi corti, base d'appoggio lievemente allargata, ridotta velocità, aumentato tempo di doppio appoggio — un pattern adattivo protettivo più che una vera lesione neurologica focale, spesso multifattoriale (visione, propriocezione, forza, paura).",
  },
];

export interface LocalizationPrinciple {
  slug: string;
  title: string;
  content: string;
}

export const LOCALIZATION_PRINCIPLES: LocalizationPrinciple[] = [
  {
    slug: 'upper-vs-lower-motor-neuron',
    title: 'Primo Motoneurone vs Secondo Motoneurone',
    content:
      "Distinguere se un deficit motorio origina da una lesione del I motoneurone (via corticospinale, da corteccia a corno anteriore) o del II motoneurone (corno anteriore, radice, plesso, nervo periferico, fino alla placca neuromuscolare) è il primo bivio di ogni ragionamento di localizzazione. Lesione I motoneurone: ipertono spastico, iperreflessia, segno di Babinski positivo, clono, nessuna atrofia significativa (salvo da non uso), debolezza a distribuzione tipicamente 'piramidale' (estensori più deboli all'arto superiore, il contrario all'arto inferiore). Lesione II motoneurone: ipotono/flaccidità, iporeflessia o areflessia, Babinski assente, fascicolazioni, atrofia marcata e precoce, debolezza a distribuzione segmentale o periferica. Attenzione clinica: nella fase acuta di una lesione centrale (es. ictus, trauma spinale acuto) i segni piramidali classici possono mancare per 'shock spinale' o diaschisi, con ipotono/areflessia transitori — motivo per cui i segni franchi compaiono spesso solo dopo giorni o settimane.",
  },
  {
    slug: 'sensory-level-spinal-localization',
    title: 'Livello Sensitivo e Localizzazione Midollare',
    content:
      "Un livello sensitivo netto — un cambiamento brusco della sensibilità lungo una linea orizzontale sul tronco, normale sopra e alterata sotto — è il segno più specifico di lesione midollare trasversa. Dettaglio clinicamente utile e spesso trascurato: il livello per la puntura di spillo (via spinotalamica) compare tipicamente 1-2 dermatomi sotto la sede reale della lesione, perché le fibre risalgono nel fascicolo di Lissauer prima di decussare; il livello vibratorio/propriocettivo (colonne dorsali), invece, coincide più fedelmente con la lesione. Un pattern diverso — perdita di sensibilità 'a banda' con sensibilità conservata sia sopra sia sotto (suspended sensory loss) — non indica una lesione trasversa ma un processo centromidollare (siringomielia, tumore intramidollare), classicamente con perdita dissociata di dolore/temperatura a mantellina su spalle e arti superiori, risparmiando vibrazione e propriocezione. La conservazione della sensibilità perianale/sacrale (sacral sparing) in un quadro altrimenti completo indica una lesione midollare incompleta, con prognosi più favorevole.",
  },
  {
    slug: 'crossed-findings-brainstem',
    title: 'Reperti "Crociati" Localizzano al Tronco Encefalico',
    content:
      "Un deficit crociato — un segno omolaterale a un nervo cranico insieme a un segno controlaterale su una via lunga (emiparesi, emianestesia) — è il segno cardine di lesione del tronco encefalico, l'unica sede dove nuclei/fascicoli dei nervi cranici non ancora decussati convivono con vie lunghe motorie e sensitive già decussate o in fase di decussazione. Una lesione sopratentoriale darebbe un deficit puramente controlaterale; una lesione midollare un deficit ipsilaterale sotto il livello, senza nervi cranici coinvolti. Esempi classici: sindrome di Wallenberg (bulbare laterale — Horner e deficit trigeminale omolaterali, perdita termodolorifica controlaterale), sindrome di Weber (mesencefalica mediale — paralisi del III nervo cranico omolaterale, emiparesi controlaterale), sindrome di Millard-Gubler (pontina — paralisi del VI nervo cranico omolaterale, emiparesi controlaterale). Nota onesta: nella pratica reale le sindromi crociate 'da manuale' in forma pura sono meno frequenti di quanto l'insegnamento classico suggerisca — le lesioni vascolari del tronco danno spesso quadri misti o incompleti; il principio di ragionamento (crociato = tronco encefalico) resta comunque valido e clinicamente affidabile anche quando l'eponimo esatto non collima perfettamente.",
  },
  {
    slug: 'symptom-distribution-levels',
    title: 'Distribuzione dei Sintomi — Singolo Nervo, Radice, Plesso, o Polineuropatia',
    content:
      "Stabilito che il deficit è periferico (II motoneurone), il passo successivo è definirne la distribuzione topografica, che discrimina quattro livelli lungo il percorso dal midollo alla periferia. Una mononeuropatia coinvolge il territorio motorio e sensitivo di un singolo nervo (es. nervo radiale: mano cadente + ipoestesia dorso mano). Una radicolopatia segue una distribuzione dermatomerica/miotomerica di una singola radice, spesso con dolore irradiato e riflesso specifico ridotto (es. L5: dolore lungo il bordo laterale della gamba). Una plessopatia coinvolge più nervi con origine comune nel plesso (brachiale o lombosacrale), con un pattern che non corrisponde né a un singolo nervo né a una singola radice, spesso su base traumatica, ostetrica, attinica o infiammatoria (es. sindrome di Parsonage-Turner). Una polineuropatia dà infine un pattern simmetrico, lunghezza-dipendente, 'a calza e guanto', che colpisce prima le fibre più lunghe (piedi prima delle mani), tipico di cause metaboliche/tossiche/infiammatorie diffuse (diabete, chemioterapia, Guillain-Barré). Distinguere questi quattro livelli guida direttamente la scelta tra imaging mirato, elettromiografia o esami ematochimici sistemici.",
  },
  {
    slug: 'pure-motor-or-sensory-deficit',
    title: 'Deficit Puramente Motorio o Puramente Sensitivo',
    content:
      "Un deficit isolato — puramente motorio o puramente sensitivo, senza commistione — è un indizio di localizzazione potente perché restringe drasticamente le sedi anatomiche possibili. L'ictus motorio puro è la sindrome lacunare più frequente (circa 45% degli ictus lacunari): emiparesi di volto, braccio e gamba controlaterali, spesso con lieve disartria ma senza alcun sintomo sensitivo, da lesione della capsula interna posteriore, della corona radiata o del ponte ventrale, dove le fibre corticospinali sono compattate senza fibre sensitive adiacenti. L'ictus sensitivo puro (circa 7% degli ictus lacunari) coinvolge tipicamente il talamo (nucleo ventrale posterolaterale), con alterazione di tutte le modalità sensitive di volto/braccio/gamba controlaterali senza alcuna debolezza; una variante dolorosa cronica è la sindrome di Dejerine-Roussy, con dolore neuropatico spontaneo e allodinia. La chiave diagnostica in entrambi i casi è l'assenza di segni corticali (afasia, negligenza, deficit del campo visivo, deficit cognitivo): la loro presenza sposta il sospetto verso una lesione corticale/sottocorticale più ampia, non lacunare.",
  },
  {
    slug: 'symmetry-diagnostic-clue',
    title: 'Simmetria come Indizio Diagnostico',
    content:
      "La simmetria o asimmetria di un deficit è uno degli indizi più rapidi e sottoutilizzati nella localizzazione neurologica. Un quadro marcatamente asimmetrico o strettamente unilaterale orienta verso una lesione focale — vascolare, tumorale, traumatica, da compressione di un singolo nervo/radice/plesso — mentre un quadro simmetrico, specie se distale e lunghezza-dipendente, orienta verso un processo sistemico o diffuso: polineuropatia metabolica/tossica, o una condizione che colpisce strutture bilaterali per motivi fisiopatologici più che anatomici (miastenia gravis, sindrome di Guillain-Barré, che classicamente inizia distale e simmetrica per poi risalire). Eccezioni clinicamente importanti: la SLA può esordire in modo asimmetrico pur essendo una malattia sistemica del motoneurone; alcune neuropatie infiammatorie (es. neuropatia multifocale motoria) danno un quadro multifocale asimmetrico pur essendo immuno-mediate e diffuse nella causa. La simmetria resta quindi un indizio probabilistico potente, da integrare sempre con distribuzione, andamento temporale e reperti associati — non una regola assoluta.",
  },
];
