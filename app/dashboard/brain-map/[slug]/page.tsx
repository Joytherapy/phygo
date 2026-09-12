'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Stethoscope, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

interface ZoneDetail {
  anatomy: string;
  connections: string;
  function: string;
  clinicalRelevance: string;
  vascularSupply: string;
}

const ZONE_INFO: Record<string, ZoneDetail> = {
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

const GERIATRIC_PRINCIPLES = [
  {
    title: 'Approccio al paziente anziano vs giovane',
    content:
      "La valutazione neurologica nell'anziano richiede un approccio diverso da quello del paziente giovane: comorbidità multiple, polifarmacia, e riserva funzionale ridotta modificano sia la presentazione clinica sia la risposta al trattamento. Un cambio di ambiente (es. ricovero) può di per sé destabilizzare un paziente anziano, specialmente in presenza di decadimento cognitivo anche lieve, con perdita dei punti di riferimento abituali — un fattore da considerare nella scelta tra ricovero e gestione domiciliare.",
  },
  {
    title: 'Riabilitazione post-ictus: tempistiche e fattori prognostici',
    content:
      "Il timing dell'ingresso in un percorso riabilitativo intensivo dopo un ictus è un fattore prognostico rilevante: il periodo di massimo recupero funzionale si colloca nelle prime settimane-mesi, e un ritardo eccessivo nell'avvio della riabilitazione ne riduce l'efficacia. Va inoltre considerato che una parte dei pazienti anziani può mostrare un peggioramento funzionale alla dimissione rispetto all'ingresso, spesso legato più al cambio di ambiente e alla destabilizzazione psicologica che al quadro neurologico in sé.",
  },
  {
    title: 'Approccio multidisciplinare e cura centrata sul paziente',
    content:
      "La gestione del paziente neurogeriatrico beneficia di un team multidisciplinare (medico, fisioterapista, terapista occupazionale, supporto familiare) e di un percorso di cura personalizzato, che integri le linee guida cliniche con il contesto socio-economico e familiare del paziente. Le linee guida forniscono una cornice, ma il piano di trattamento va sempre calibrato sulle risorse e sul contesto specifico di ogni paziente.",
  },
  {
    title: 'Segnali di allarme cognitivo da non sottovalutare',
    content:
      "Un declino cognitivo che compromette progressivamente l'autonomia nelle attività quotidiane, un cambiamento comportamentale acuto o subacuto, o un peggioramento cognitivo rapido (settimane-pochi mesi, non anni) sono segnali che richiedono approfondimento diagnostico tempestivo, per escludere cause reversibili (es. delirium, cause metaboliche/farmacologiche) prima di attribuire il quadro a una demenza degenerativa primaria.",
  },
];

interface ConditionItem {
  id: number;
  condition_name: string;
  goals: string | null;
  clinical_tests: string | null;
  red_flags: string | null;
  contraindications: string | null;
  typical_exercises: string | null;
  progression_criteria: string | null;
  evidence_level: string | null;
}

interface HubData {
  zone: { id: string; name: string; slug: string; image_url?: string };
  conditions: ConditionItem[];
}

export default function BrainZoneHubPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<ConditionItem | null>(null);

  useEffect(() => {
    fetch(`/api/brain-map/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#08090b] flex items-center justify-center">
        <Navbar />
        <p className="text-ink/40 dark:text-white/40">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#08090b] flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <p className="text-ink/60 dark:text-white/60 mb-4">Zone not found.</p>
          <button
            onClick={() => router.push('/dashboard/brain-map')}
            className="text-sm font-semibold text-[#4F7CFF]"
          >
            {"\u2190"} Back to Brain Map
          </button>
        </div>
      </div>
    );
  }

  const { zone, conditions } = data;
  const info = ZONE_INFO[zone.slug];

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 pt-40 pb-24">
        <button
          onClick={() => router.push('/dashboard/brain-map')}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Brain Map
        </button>

        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]" />
            Neurological Zone
          </div>

          {zone.image_url && (
            <div className="mt-6 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-[#08090b] overflow-hidden">
              <img
                src={`${IMAGE_BASE}/${zone.image_url}`}
                alt={`${zone.name} highlighted`}
                className="w-full h-auto"
              />
            </div>
          )}

          {info && (
            <div className="mt-6 space-y-5 max-w-2xl">
              <div>
                <h3 className="text-xs font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-1.5">
                  Anatomy
                </h3>
                <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed">{info.anatomy}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-1.5">
                  Connections
                </h3>
                <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed">{info.connections}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-1.5">
                  Function
                </h3>
                <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed">{info.function}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-1.5">
                  Clinical Relevance
                </h3>
                <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed">{info.clinicalRelevance}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-1.5">
                  Vascular Supply
                </h3>
                <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed">{info.vascularSupply}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-4">
            Geriatric Neurology Principles
          </h2>
          <div className="space-y-4">
            {GERIATRIC_PRINCIPLES.map((g) => (
              <div
                key={g.title}
                className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5"
              >
                <p className="text-sm font-semibold mb-1">{g.title}</p>
                <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed">
                  {g.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope size={16} className="text-[#32D6A0]" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60">
              Related Conditions
            </h2>
          </div>

          {conditions.length === 0 ? (
            <p className="text-sm text-ink/40 dark:text-white/40">
              No conditions linked to this zone yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {conditions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCondition(c)}
                  className="px-4 py-2 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] text-sm font-medium transition-all"
                >
                  {c.condition_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedCondition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedCondition(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0e0f12] border border-black/[0.06] dark:border-white/10 rounded-[28px] p-8 max-w-xl w-full max-h-[85vh] overflow-auto shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-display text-2xl font-bold pr-4">
                  {selectedCondition.condition_name}
                </h3>
                <button
                  onClick={() => setSelectedCondition(null)}
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {selectedCondition.evidence_level && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#32D6A0] text-white mb-4">
                  {selectedCondition.evidence_level} evidence
                </span>
              )}

              <div className="space-y-4 text-sm">
                {selectedCondition.goals && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Goals</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.goals}
                    </p>
                  </div>
                )}
                {selectedCondition.clinical_tests && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Clinical Tests</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.clinical_tests}
                    </p>
                  </div>
                )}
                {selectedCondition.typical_exercises && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Typical Exercises</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.typical_exercises}
                    </p>
                  </div>
                )}
                {selectedCondition.progression_criteria && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Progression Criteria</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.progression_criteria}
                    </p>
                  </div>
                )}
                {selectedCondition.contraindications && (
                  <div>
                    <p className="font-semibold text-ink/70 dark:text-white/70 mb-1">Contraindications</p>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.contraindications}
                    </p>
                  </div>
                )}
                {selectedCondition.red_flags && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} className="text-red-500" />
                      <p className="font-semibold text-red-500 text-xs uppercase tracking-wide">
                        Red Flags
                      </p>
                    </div>
                    <p className="text-ink/60 dark:text-white/60 leading-relaxed">
                      {selectedCondition.red_flags}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}