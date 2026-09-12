// BOZZA — contenuto clinico per le 14 nuove pagine ossee del Body Map.
// Stessa struttura di ZONE_INFO usata in app/dashboard/brain-map/[slug]/page.tsx
// (anatomy, connections, function, clinicalRelevance, vascularSupply), così da
// poter essere incollato nell'equivalente file body-map/[slug]/page.tsx (o
// dovunque Phygo tenga il contenuto statico delle zone) con lo stesso layout
// già esistente. DA RIVEDERE prima di pubblicare: contenuto scritto da Claude,
// non ancora validato da un professionista/fonte primaria per questo progetto.

export interface BoneDetail {
  anatomy: string;
  connections: string;
  function: string;
  clinicalRelevance: string;
  vascularSupply: string;
}

export const BONE_INFO: Record<string, BoneDetail> = {
  'bone-cranio': {
    anatomy:
      "Il cranio è composto da 8 ossa (frontale, 2 parietali, occipitale, 2 temporali, sfenoide, etmoide) unite da suture fibrose praticamente immobili nell'adulto, e dallo scheletro facciale (mascella, mandibola, zigomi, ossa nasali, ecc.). La mandibola è l'unico osso cranico mobile, articolato bilateralmente con l'osso temporale tramite l'articolazione temporo-mandibolare (ATM).",
    connections:
      "Le suture craniche (sagittale, coronale, lambdoidea, squamosa) uniscono le ossa della volta e sono sedi di crescita nell'infanzia, poi progressivamente si ossificano. L'ATM è l'unica vera articolazione sinoviale del cranio, con un disco articolare interposto; è funzionalmente accoppiata alla controlaterale (i due lati si muovono sempre insieme). Il rachide cervicale si articola con il cranio tramite l'atlante (C1) all'articolazione atlanto-occipitale.",
    function:
      "Protegge l'encefalo e gli organi di senso, fornisce l'inserzione ai muscoli masticatori e a parte della muscolatura cervicale/facciale, e costituisce la cassa di risonanza e il supporto scheletrico delle vie respiratorie superiori e della masticazione tramite l'ATM.",
    clinicalRelevance:
      "In ambito fisioterapico l'interesse principale è la disfunzione temporo-mandibolare (DTM): dolore mio-fasciale masticatorio, click/blocco articolare da dislocazione discale, spesso associata a cervicalgia e cefalea tensiva per le connessioni miofasciali tra ATM e rachide cervicale superiore. Fratture craniche (volta o base) sono eventi ad alto impatto energetico, di pertinenza medica/neurochirurgica acuta, non fisioterapica in fase acuta; la riabilitazione fisioterapica entra in gioco nelle sequele (vertigini post-traumatiche, cervicalgia associata, riabilitazione vestibolare).",
    vascularSupply:
      "Il cuoio capelluto e le ossa craniche sono irrorati da rami dell'arteria carotide esterna (temporale superficiale, occipitale, auricolare posteriore); la dura madre e l'osso della volta ricevono anche l'arteria meningea media (ramo della mascellare interna), la cui lesione traumatica (frattura temporale) è la causa classica dell'ematoma extradurale.",
  },

  'bone-clavicola-scapola': {
    anatomy:
      "La clavicola è un osso lungo a doppia curvatura a S, unico collegamento scheletrico diretto tra l'arto superiore e il tronco. La scapola è un osso piatto triangolare che scorre sulla parete toracica posteriore, priva di vera articolazione ossea con le coste (si muove su un piano di scorrimento muscolare, la cosiddetta articolazione scapolo-toracica funzionale).",
    connections:
      "La clavicola si articola medialmente con lo sterno (articolazione sterno-clavicolare, unica vera articolazione tra arto superiore e scheletro assile) e lateralmente con l'acromion della scapola (articolazione acromion-claveare). La scapola si articola con l'omero all'articolazione gleno-omerale (la più mobile del corpo) e forma con clavicola e torace il complesso del cingolo scapolare, la cui coordinazione (ritmo scapolo-omerale) è essenziale per l'elevazione completa del braccio.",
    function:
      "Il cingolo scapolare posiziona la scapola (e quindi la cavità glenoidea) nello spazio per ottimizzare il contatto articolare durante i movimenti del braccio, agendo da base stabile mobile per i muscoli della cuffia dei rotatori e del deltoide. La clavicola funge da puntone rigido che mantiene la distanza tra sterno e spalla, impedendo il collasso anteriore del cingolo scapolare.",
    clinicalRelevance:
      "La frattura di clavicola (spesso da caduta sulla spalla o sul braccio teso) è tra le fratture più comuni in assoluto, generalmente trattata conservativamente; la riabilitazione fisioterapica ne segue il consolidamento per recuperare mobilità ed evitare rigidità scapolo-omerale secondaria. La disfunzione del ritmo scapolo-omerale (discinesia scapolare, spesso da debolezza del trapezio inferiore/dentato anteriore) è un reperto frequente nell'impingement subacromiale e nell'instabilità di spalla, ed è un target riabilitativo centrale. Le lussazioni acromion-claveari (tipiche da caduta sulla spalla nello sport) sono classificate per grado di severità (Rockwood) e guidano l'indicazione conservativa vs chirurgica.",
    vascularSupply:
      "La clavicola riceve vascolarizzazione periostale da rami dell'arteria succlavia/toracoacromiale; la scapola da rami dell'arteria soprascapolare e circonflessa scapolare. La regione è clinicamente rilevante anche per i rapporti di vicinanza: la clavicola decorre a stretto contatto con il plesso brachiale e i vasi succlavi, per cui fratture scomposte o callo osseo esuberante possono raramente causare sindrome da compressione neurovascolare (sindrome dello stretto toracico).",
  },

  'bone-coste-sterno': {
    anatomy:
      "La gabbia toracica comprende 12 paia di coste e lo sterno (manubrio, corpo, processo xifoideo). Le prime 7 coste sono 'vere' (si articolano direttamente con lo sterno tramite cartilagine costale propria), le coste 8-10 sono 'false' (cartilagine che si fonde a quella della 7ª), e le coste 11-12 sono 'fluttuanti' (prive di attacco anteriore).",
    connections:
      "Posteriormente ogni costa si articola con la colonna dorsale tramite una doppia articolazione (costo-vertebrale con il corpo vertebrale, costo-trasversaria con il processo trasverso), che insieme permettono il movimento di elevazione/depressione costale durante la respirazione. Anteriormente le coste vere si articolano con lo sterno tramite le articolazioni sterno-costali; il manubrio e il corpo sternale si uniscono all'angolo dello sterno (angolo di Louis), reperto palpatorio che corrisponde al livello della 2ª costa.",
    function:
      "La gabbia toracica protegge cuore e polmoni e costituisce, insieme al diaframma e ai muscoli respiratori accessori, l'apparato meccanico della respirazione: l'elevazione costale aumenta i diametri trasverso e antero-posteriore del torace (movimento 'a manico di secchio' per le coste inferiori, 'a manico di pompa' per quelle superiori), permettendo l'espansione polmonare in inspirazione.",
    clinicalRelevance:
      "Le fratture costali (da trauma diretto o, negli anziani con osteoporosi, anche da colpi di tosse violenti) sono dolorose soprattutto ai movimenti respiratori e alla tosse; la gestione fisioterapica si concentra su respirazione efficace e prevenzione delle complicanze polmonari (atelettasia, polmonite) piuttosto che sull'immobilizzazione. La disfunzione costo-vertebrale/costo-condrale (es. sindrome di Tietze, costocondrite) è una causa comune di dolore toracico meccanico da escludere clinicamente da cause cardiache. Un trauma toracico con fratture multiple costali su più punti per costa (lembo costale/flail chest) è un'emergenza respiratoria di pertinenza acuta.",
    vascularSupply:
      "Le coste sono irrorate dalle arterie intercostali (posteriori, dall'aorta toracica; anteriori, dall'arteria toracica interna), che decorrono nel solco costale insieme a vena e nervo intercostale — rapporto anatomico rilevante per il rischio di lesione neurovascolare durante procedure invasive (drenaggio toracico, blocchi intercostali), da eseguire lungo il margine superiore della costa sottostante per evitare il fascio vascolo-nervoso.",
  },

  'bone-omero': {
    anatomy:
      "L'omero è l'osso lungo del braccio. Prossimalmente presenta la testa omerale (rivolta postero-medialmente rispetto all'asse del gomito, con una retroversione di circa 30°), il collo anatomico, grande e piccolo tubercolo (inserzioni della cuffia dei rotatori) e il collo chirurgico, sede frequente di frattura. Distalmente si allarga nei condili, con la troclea (per l'ulna) e il capitello (per il radio).",
    connections:
      "Prossimalmente si articola con la scapola all'articolazione gleno-omerale, un'enartrosi con ampia escursione ma scarsa congruenza ossea (stabilità affidata soprattutto ai tessuti molli: cuffia dei rotatori, labbro glenoideo, capsula). Distalmente forma con ulna e radio l'articolazione del gomito (omero-ulnare a cerniera, omero-radiale a sfera funzionalmente limitata dai legamenti collaterali).",
    function:
      "Funge da braccio di leva per i muscoli della spalla (deltoide, cuffia dei rotatori, grande pettorale, gran dorsale) che posizionano l'arto superiore nello spazio, e per i muscoli del gomito (bicipite, tricipite, brachiale) che ne controllano flesso-estensione; la sua lunghezza e l'orientamento della testa determinano l'arco di rotazione disponibile alla spalla.",
    clinicalRelevance:
      "La frattura del collo chirurgico dell'omero è tra le fratture più comuni dell'arto superiore nell'anziano osteoporotico (caduta sul braccio teso o sul gomito); la classificazione di Neer ne guida il trattamento conservativo vs chirurgico. La frattura di diafisi omerale si associa a rischio di lesione del nervo radiale, che decorre a stretto contatto con l'osso nel solco spirale (possibile paralisi del nervo radiale con mano cadente). Le fratture sovracondiloidee sono tipiche in età pediatrica (caduta su mano estesa) e comportano rischio di lesione dell'arteria brachiale e del nervo mediano.",
    vascularSupply:
      "La testa omerale riceve il contributo principale dall'arteria circonflessa omerale posteriore (tramite i suoi rami ascendenti postero-laterali), con un contributo variabile dalla circonflessa anteriore: fratture del collo anatomico scomposte possono compromettere questo apporto e causare necrosi avascolare della testa omerale, un rischio clinicamente rilevante da conoscere nella prognosi post-frattura.",
  },

  'bone-radio-ulna': {
    anatomy:
      "Radio e ulna sono le due ossa dell'avambraccio, unite per tutta la loro lunghezza dalla membrana interossea. L'ulna è mediale, con l'olecrano prossimale che si incastra nella fossa olecranica dell'omero in estensione, offrendo la stabilità primaria del gomito. Il radio è laterale, con la testa radiale prossimale che ruota all'interno del legamento anulare.",
    connections:
      "Prossimalmente formano con l'omero il complesso articolare del gomito (omero-ulnare, omero-radiale, radio-ulnare prossimale); quest'ultima, insieme alla radio-ulnare distale al polso, permette la prono-supinazione: il radio ruota attorno all'ulna, che resta relativamente fissa, portando con sé la mano. Distalmente il radio si articola con il carpo (articolazione radio-carpica, la principale del polso); l'ulna non si articola direttamente con il carpo ma tramite un complesso fibrocartilagineo triangolare.",
    function:
      "L'ulna garantisce la stabilità e la trasmissione di forza in flesso-estensione del gomito; il radio, ruotando attorno all'ulna tramite le due articolazioni radio-ulnari, permette la prono-supinazione dell'avambraccio, un grado di libertà che consente di orientare la mano indipendentemente dalla posizione del gomito — essenziale per la manipolazione fine.",
    clinicalRelevance:
      "La frattura di polso 'tipo Colles' (radio distale, caduta su mano estesa) è tra le fratture più frequenti in assoluto, soprattutto nella donna post-menopausale osteoporotica; la riabilitazione post-frattura/post-chirurgica è un percorso fisioterapico classico (recupero di prono-supinazione, forza di presa). La frattura di entrambe le ossa dell'avambraccio nell'adulto richiede quasi sempre fissazione chirurgica per il rischio di malunion rotazionale (perdita di prono-supinazione). La frattura isolata di ulna con lussazione della testa radiale (frattura di Monteggia) e quella di radio con lussazione radio-ulnare distale (frattura di Galeazzi) sono pattern classici da non mancare.",
    vascularSupply:
      "Le arterie radiale e ulnare originano dalla brachiale a livello del gomito e decorrono lungo l'avambraccio fino a formare gli archi palmari della mano; sono facilmente palpabili (polso radiale al polso, ulnare più profondo) e rappresentano un repere clinico standard per la valutazione neurovascolare periferica, incluso il test di Allen per la pervietà dell'arco palmare.",
  },

  'bone-mano': {
    anatomy:
      "Lo scheletro della mano comprende 8 ossa carpali disposte in due file (prossimale: scafoide, semilunare, piramidale, pisiforme; distale: trapezio, trapezoide, capitato, uncinato), 5 metacarpi e 14 falangi (2 per il pollice, 3 per le altre dita).",
    connections:
      "Il carpo si articola prossimalmente con il radio (articolazione radio-carpica) e distalmente con i metacarpi (articolazioni carpo-metacarpali, di cui la trapezio-metacarpale del pollice è una sella con ampia mobilità, base dell'opponibilità). Le articolazioni metacarpo-falangee e interfalangee (prossimali e distali) completano la catena cinematica delle dita.",
    function:
      "La mano è l'organo terminale di prensione e manipolazione fine dell'arto superiore: il carpo trasmette e distribuisce i carichi tra avambraccio e dita adattando la propria configurazione (concetto della 'colonna del semilunare' nella dinamica del carpo), mentre l'opponibilità del pollice, resa possibile dall'articolazione trapezio-metacarpale a sella, è il tratto distintivo della mano umana per la presa di precisione.",
    clinicalRelevance:
      "La frattura di scafoide (caduta su mano estesa, spesso sottodiagnosticata perché non sempre visibile alla radiografia iniziale) è a rischio elevato di necrosi avascolare e pseudoartrosi per la sua vascolarizzazione retrograda — motivo per cui un dolore persistente nella tabacchiera anatomica dopo trauma va trattato come frattura fino a prova contraria. Le fratture di metacarpo (es. frattura del boxeur, 5° metacarpo) e delle falangi sono comuni e la riabilitazione precoce del movimento è centrale per prevenire rigidità articolare, particolarmente frequente e invalidante alla mano. L'artrosi trapezio-metacarpale (rizoartrosi) è una causa frequente di dolore e riduzione di forza di presa nell'anziano.",
    vascularSupply:
      "L'arco palmare superficiale (soprattutto da arteria ulnare) e profondo (soprattutto da arteria radiale) irrorano la mano con una rete anastomotica ricca; lo scafoide fa eccezione, con vascolarizzazione che entra prevalentemente dal polo distale e decorre in senso retrogrado verso il polo prossimale, che risulta quindi il più vulnerabile a necrosi avascolare dopo frattura del terzo medio o prossimale dell'osso.",
  },

  'bone-bacino': {
    anatomy:
      "Il bacino (cinto pelvico) è formato dalle due ossa iliache (ciascuna fusione di ileo, ischio e pube) unite posteriormente al sacro e anteriormente tra loro alla sinfisi pubica, formando un anello osseo chiuso.",
    connections:
      "Posteriormente ogni osso iliaco si articola con il sacro alle articolazioni sacro-iliache, articolazioni sinoviali con minima mobilità ma cruciali nel trasferimento di carico tra colonna e arti inferiori. Anteriormente le due ossa pubiche si uniscono alla sinfisi pubica, un'articolazione cartilaginea semi-mobile. Lateralmente l'acetabolo (formato dalla giunzione di ileo, ischio e pube) accoglie la testa del femore nell'articolazione coxo-femorale.",
    function:
      "Il bacino trasferisce il peso del tronco agli arti inferiori (in stazione eretta) o al piano di appoggio (da seduti, tramite le tuberosità ischiatiche), protegge i visceri pelvici, e fornisce ampia superficie di inserzione ai muscoli del tronco e dell'anca (grande gluteo, ileopsoas, adduttori, muscoli del pavimento pelvico).",
    clinicalRelevance:
      "Le fratture di bacino nel giovane sono generalmente ad alta energia (traumi stradali) e possono associarsi a importante emorragia per la ricca rete vascolare pelvica; nell'anziano osteoporotico anche cadute a bassa energia possono causare fratture da fragilità (tipicamente branche ilio/ischio-pubiche), spesso gestite conservativamente con mobilizzazione precoce. La disfunzione sacro-iliaca è una causa comune di lombalgia bassa/gluteo, con test clinici specifici (provocazione sacro-iliaca) parte della valutazione fisioterapica standard. La sinfisi pubica è sede di dolore (pubalgia) frequente negli sportivi da overuse degli adduttori, e fisiologicamente si allenta in gravidanza (disfunzione della sinfisi pubica gravidica).",
    vascularSupply:
      "Il bacino è irrorato da un'estesa rete di rami dell'arteria iliaca interna (glutee superiore e inferiore, otturatoria, pudenda interna); la ricchezza e l'interconnessione di questa rete vascolare spiegano sia il potenziale emorragico delle fratture pelviche ad alta energia sia, di converso, il buon potenziale di guarigione delle fratture da fragilità a bassa energia.",
  },

  'bone-sacro': {
    anatomy:
      "Il sacro è un osso triangolare formato dalla fusione di 5 vertebre sacrali, che chiude posteriormente l'anello pelvico e continua superiormente il rachide lombare (giunzione lombo-sacrale a livello L5-S1). Il coccige, formato da 3-5 vertebre coccigee rudimentali fuse, si articola all'apice del sacro.",
    connections:
      "Si articola superiormente con L5 (giunzione lombo-sacrale, sede di carico meccanico elevato per l'angolo di inclinazione del sacro), lateralmente con le due ossa iliache alle articolazioni sacro-iliache, e inferiormente con il coccige (articolazione sacro-coccigea, generalmente poco mobile nell'adulto).",
    function:
      "Il sacro trasmette il peso della colonna vertebrale al bacino e agli arti inferiori tramite le articolazioni sacro-iliache, e costituisce la base di inserzione per legamenti pelvici maggiori (sacro-tuberoso, sacro-spinoso) e per parte della muscolatura del pavimento pelvico e del grande gluteo. Il coccige è punto di inserzione per parte del pavimento pelvico e del grande gluteo, e sopporta carico diretto nella posizione seduta reclinata.",
    clinicalRelevance:
      "La coccigodinia (dolore coccigeo, spesso post-traumatico da caduta in posizione seduta o post-parto) è una condizione fisioterapicamente rilevante, gestita con adattamenti posturali (cuscini a ciambella), terapia manuale e talvolta lavoro sul pavimento pelvico. Le fratture sacrali da insufficienza (osteoporosi) sono spesso misconosciute come causa di lombalgia bassa nell'anziano e vanno sospettate in assenza di trauma significativo. La disfunzione della giunzione lombo-sacrale (L5-S1) è una sede comune di patologia discale e di instabilità meccanica per l'elevato carico di taglio a quel livello.",
    vascularSupply:
      "Irrorato dalle arterie sacrali laterali (rami dell'iliaca interna) e dall'arteria sacrale mediana (ramo terminale dell'aorta addominale); il canale sacrale contiene la porzione terminale del sacco durale e la cauda equina, rapporto anatomico rilevante per le infiltrazioni epidurali caudali eseguite attraverso lo iato sacrale.",
  },

  'bone-femore': {
    anatomy:
      "Il femore è l'osso più lungo e robusto del corpo. Prossimalmente presenta testa, collo (con un angolo cervico-diafisario di circa 125° e un angolo di antiversione di circa 10-15°), grande e piccolo trocantere. Distalmente si allarga nei condili femorali (mediale e laterale), che si articolano con tibia e rotula.",
    connections:
      "Prossimalmente si articola con l'acetabolo del bacino all'articolazione coxo-femorale, un'enartrosi profonda e molto congruente (a differenza della spalla, qui la stabilità ossea è già elevata). Distalmente forma con tibia e rotula l'articolazione del ginocchio (femoro-tibiale e femoro-rotulea).",
    function:
      "Trasmette il peso corporeo dal bacino al ginocchio durante stazione eretta, cammino e corsa, e funge da braccio di leva per i grandi gruppi muscolari dell'anca (glutei, ileopsoas, adduttori) e del ginocchio (quadricipite, ischiocrurali) inseriti sulla sua diafisi e sulle sue prominenze (grande e piccolo trocantere, linea aspra).",
    clinicalRelevance:
      "La frattura del collo femorale è una delle fratture da fragilità più gravi nell'anziano, con importanti implicazioni di mortalità e perdita di autonomia, e rappresenta un'emergenza chirurgica-riabilitativa: la mobilizzazione precoce post-operatoria è oggi lo standard per ridurre le complicanze da immobilità. La frattura diafisaria nel giovane è tipicamente ad alta energia. La sindrome femoro-rotulea e le tendinopatie inserzionali (grande trocantere, tensore della fascia lata) sono condizioni fisioterapiche comuni legate alla biomeccanica dell'anca e del ginocchio piuttosto che a frattura.",
    vascularSupply:
      "La testa femorale riceve il proprio apporto principale dalle arterie circonflesse femorali (soprattutto la mediale, tramite rami retinacolari che risalgono lungo il collo), con un contributo minore e spesso insufficiente nell'adulto dall'arteria del legamento rotondo: una frattura del collo femorale scomposta può interrompere questo apporto retrogrado e causare necrosi avascolare della testa, motivo per cui questo tipo di frattura viene trattato chirurgicamente in tempi rapidi, spesso con sostituzione protesica anziché sintesi nell'anziano.",
  },

  'bone-tibia-perone': {
    anatomy:
      "Tibia e perone (fibula) sono le due ossa della gamba, unite dalla membrana interossea. La tibia, mediale, è l'osso portante principale (supporta la quasi totalità del carico), con il piatto tibiale prossimale che si articola con i condili femorali e la malleolo mediale distalmente. Il perone, laterale e sottile, non partecipa in modo significativo al carico ma è essenziale per la stabilità della caviglia (malleolo laterale).",
    connections:
      "Prossimalmente la tibia si articola con il femore (ginocchio) e con la testa del perone (articolazione tibio-peroneale prossimale); distalmente tibia e perone formano insieme, tramite la sindesmosi tibio-peroneale, la 'mortasa' che accoglie l'astragalo nell'articolazione tibio-tarsica (caviglia).",
    function:
      "La tibia è il principale trasmettitore di carico dal ginocchio alla caviglia; il perone, pur scaricando solo una minima parte del peso, stabilizza lateralmente la caviglia e fornisce inserzione a muscoli peronieri e parte del tricipite surale.",
    clinicalRelevance:
      "Le fratture di tibia (spesso ad alta energia, es. incidenti stradali o sportivi) hanno un rischio relativamente elevato di complicanze per la scarsa copertura di tessuti molli sulla sua faccia antero-mediale (esposizione, ritardo di consolidazione); la sindrome compartimentale acuta della gamba è un'emergenza da riconoscere precocemente dopo trauma tibiale. Le fratture malleolari (spesso da distorsione/trauma torsionale della caviglia) coinvolgono tipicamente il perone distale, classificate con il sistema di Weber in base al rapporto con la sindesmosi. La tibia è anche sede classica di frattura da stress nei corridori (dolore tibiale mediale da overuse, da distinguere dalla sindrome da stress tibiale mediale/periostite).",
    vascularSupply:
      "La tibia riceve un importante apporto nutritizio da un singolo grande vaso nutritizio che entra nella diafisi prossimale posteriore e si distribuisce in senso centrifugo; questo, insieme alla scarsa copertura muscolare del terzo distale (a differenza del femore, ampiamente avvolto da muscoli ben vascolarizzati), spiega perché le fratture del terzo distale di tibia guariscono più lentamente e con maggior rischio di pseudoartrosi rispetto ad altre sedi.",
  },

  'bone-piede': {
    anatomy:
      "Lo scheletro del piede comprende 7 ossa tarsali (astragalo, calcagno, navicolare, cuboide, 3 cuneiformi), 5 metatarsi e 14 falangi. L'astragalo è l'unico osso del tarso senza inserzioni muscolari dirette, e trasmette il carico dalla tibia al resto del piede.",
    connections:
      "L'astragalo si articola superiormente con tibia e perone (caviglia), inferiormente con il calcagno (articolazione sottoastragalica, chiave della pronosupinazione del piede), e anteriormente con il navicolare. Le articolazioni tarso-metatarsali (di Lisfranc) e metatarso-falangee/interfalangee completano la catena distale. L'insieme delle ossa tarsali e metatarsali, con i loro legamenti plantari e la fascia plantare, costituisce le arcate plantari (longitudinale mediale, longitudinale laterale, trasversa).",
    function:
      "Il piede assorbe e ridistribuisce le forze di impatto durante l'appoggio, si adatta alle irregolarità del terreno (pronosupinazione sottoastragalica) e diventa una leva rigida in fase di spinta (attraverso il meccanismo a 'verricello' della fascia plantare durante la dorsiflessione delle dita), essenziale per un cammino e una corsa efficienti.",
    clinicalRelevance:
      "La fascite plantare (dolore al tallone, tipicamente al primo passo mattutino) è una delle condizioni più comuni della pratica fisioterapica muscolo-scheletrica. Le fratture da stress dei metatarsi (specie 2°-3°, da overuse in corridori/militari) e la frattura acuta della base del 5° metatarso (frattura di Jones, a rischio di ritardata consolidazione per la vascolarizzazione della zona) sono pattern classici. Le distorsioni di caviglia con coinvolgimento dei legamenti tarsali (es. legamento calcaneo-cuboideo) e le fratture-lussazioni di Lisfranc (spesso misconosciute) richiedono attenzione diagnostica per le implicazioni funzionali a lungo termine.",
    vascularSupply:
      "Il piede è irrorato dalle arterie tibiale posteriore (che dà origine alle plantari mediale e laterale) e dorsale del piede (continuazione della tibiale anteriore); l'astragalo, similmente allo scafoide carpale e alla testa femorale, ha una vascolarizzazione retrograda relativamente precaria che lo rende vulnerabile a necrosi avascolare dopo fratture del collo astragalico, un'evenienza clinicamente rilevante da conoscere nella prognosi post-traumatica.",
  },

  'bone-cervicale': {
    anatomy:
      "Il rachide cervicale è composto da 7 vertebre. Le prime due, atlante (C1, privo di corpo vertebrale, ad anello) ed epistrofeo (C2, con il caratteristico dente/odontoide), sono specializzate per la rotazione della testa e differiscono nettamente dalla vertebra tipo; C3-C7 hanno una morfologia più uniforme, con corpo relativamente piccolo e forami trasversari che danno passaggio all'arteria vertebrale.",
    connections:
      "L'articolazione atlanto-occipitale (C0-C1) permette prevalentemente flesso-estensione ('sì con la testa'); l'articolazione atlo-assiale (C1-C2) permette circa la metà della rotazione totale del collo ('no con la testa'), stabilizzata dal legamento trasverso dell'atlante che contiene il dente dell'epistrofeo. Da C2 a C7 le vertebre si articolano tramite i dischi intervertebrali anteriormente e le faccette articolari (orientate a circa 45° nel piano orizzontale) posteriormente, oltre alle articolazioni uncovertebrali (di Luschka), specifiche del rachide cervicale.",
    function:
      "Sostiene e mobilizza la testa con la maggiore escursione di movimento di tutto il rachide (flessione, estensione, inclinazione e rotazione combinate), protegge il midollo spinale cervicale e le arterie vertebrali nel loro decorso verso il cranio, e fornisce inserzione ai muscoli posturali cervicali e a parte della muscolatura del cingolo scapolare (trapezio superiore, elevatore della scapola).",
    clinicalRelevance:
      "La cervicalgia meccanica/posturale è tra i motivi di consulto fisioterapico più frequenti in assoluto; il colpo di frusta (whiplash, da trauma da accelerazione-decelerazione) è un pattern lesionale specifico con possibile coinvolgimento di strutture capsulo-legamentose delle faccette articolari. La radicolopatia cervicale da ernia discale o da stenosi foraminale degenerativa causa dolore/parestesie irradiate all'arto superiore secondo un pattern dermatomerico riconoscibile. Le fratture di C1-C2 (es. frattura del dente dell'epistrofeo, frattura di Jefferson dell'atlante) sono ad alto rischio neurologico per la vicinanza al midollo spinale alto e al tronco encefalico, e rappresentano un'emergenza da 'red flag' da escludere sempre dopo trauma cervicale significativo prima di procedere con trattamento manuale.",
    vascularSupply:
      "Le arterie vertebrali risalgono attraverso i forami trasversari da C6 a C1 prima di entrare nel cranio e unirsi a formare l'arteria basilare; questo decorso, con angolazioni marcate soprattutto tra C1 e C2, rende l'arteria vertebrale teoricamente vulnerabile a manovre di rotazione/estensione cervicale spinta, motivo per cui la valutazione dei fattori di rischio vascolare è parte degli screening pre-manipolativi del rachide cervicale alto in fisioterapia.",
  },

  'bone-dorsale': {
    anatomy:
      "Il rachide dorsale (toracico) comprende 12 vertebre, ciascuna caratterizzata dalla presenza di faccette costali per l'articolazione con le coste corrispondenti — la caratteristica che le distingue nettamente da vertebre cervicali e lombari. I processi spinosi sono lunghi e marcatamente obliqui verso il basso nella porzione medio-toracica.",
    connections:
      "Ogni vertebra dorsale si articola con la costa omonima tramite la doppia articolazione costo-vertebrale (corpo) e costo-trasversaria (processo trasverso), oltre alle consuete articolazioni intervertebrali (disco anteriormente, faccette articolari posteriormente, orientate quasi frontalmente per favorire la rotazione più che la flessione). L'accoppiamento con la gabbia toracica rende il rachide dorsale la porzione più rigida della colonna.",
    function:
      "Fornisce l'ancoraggio posteriore della gabbia toracica partecipando alla meccanica respiratoria, sostiene il carico del tronco superiore trasferendolo verso il bacino, e determina, insieme al rachide lombare, la postura sagittale globale (cifosi dorsale fisiologica).",
    clinicalRelevance:
      "La rigidità dorsale (spesso associata a ipercifosi posturale, frequente nell'anziano anche per fratture vertebrali da fragilità osteoporotica) limita compensatoriamente la mobilità di rachide cervicale e lombare adiacenti, ed è un target comune di mobilizzazione in fisioterapia muscolo-scheletrica. Le fratture vertebrali da compressione osteoporotica sono particolarmente frequenti nella giunzione toraco-lombare (T11-L2), zona di transizione biomeccanica tra il rachide dorsale rigido e quello lombare più mobile. La scoliosi idiopatica dell'adolescente coinvolge tipicamente il tratto dorsale come curva primaria.",
    vascularSupply:
      "Il midollo spinale a livello toracico è la zona di 'watershed' (spartiacque vascolare) più vulnerabile ischemicamente di tutto il midollo, poiché riceve un contributo segmentale relativamente scarso rispetto ai rinforzi cervicale e lombare; l'arteria di Adamkiewicz (tipicamente tra T9 e L2) è il principale contributo radicolo-midollare per questo tratto, e la sua compromissione (es. in chirurgia aortica) è la causa classica di ischemia midollare toraco-lombare.",
  },

  'bone-lombare': {
    anatomy:
      "Il rachide lombare comprende 5 vertebre, le più voluminose della colonna mobile, con corpi vertebrali larghi adatti a sopportare il carico maggiore. L'ultima vertebra lombare (L5) si articola con il sacro alla giunzione lombo-sacrale, un punto di elevato stress meccanico per l'inclinazione del piano sacrale.",
    connections:
      "Le vertebre lombari si articolano tramite dischi intervertebrali robusti anteriormente e faccette articolari orientate quasi sagittalmente (che favoriscono flesso-estensione e limitano la rotazione) posteriormente. La giunzione lombo-sacrale (L5-S1) è la sede di maggior carico di taglio di tutto il rachide, per l'angolo di inclinazione del sacro rispetto al piano orizzontale.",
    function:
      "Sostiene il peso della porzione superiore del corpo trasferendolo al bacino, permette ampia flesso-estensione e inclinazione laterale (con rotazione limitata dall'orientamento delle faccette), e costituisce, con la sua lordosi fisiologica, la base dell'equilibrio sagittale posturale insieme a cifosi dorsale e lordosi cervicale.",
    clinicalRelevance:
      "La lombalgia è il motivo di consulto fisioterapico più frequente in assoluto a livello mondiale. L'ernia del disco lombare (più comune a L4-L5 e L5-S1) può causare radicolopatia con dolore irradiato secondo il dermatomero coinvolto (es. sciatalgia); la sindrome della cauda equina (deficit sfinterico, anestesia a sella, bilateralità) è una red flag chirurgica assoluta da riconoscere immediatamente. La spondilolistesi (scivolamento di una vertebra sull'altra, spesso a L5-S1 per frattura/lisi istmica bilaterale) e la stenosi del canale lombare degenerativa (claudicatio neurogena, tipica dell'anziano, migliora in flessione/seduta) sono condizioni comuni nella pratica fisioterapica geriatrica e sportiva.",
    vascularSupply:
      "Il midollo spinale termina a livello L1-L2 (cono midollare); al di sotto, il canale vertebrale lombare contiene la cauda equina (radici nervose lombosacrali), non il midollo stesso — per questo le procedure invasive lombari (puntura lombare, infiltrazioni) sono relativamente più sicure a questo livello. La vascolarizzazione vertebrale lombare deriva dalle arterie lombari segmentali, rami diretti dell'aorta addominale.",
  },
};
