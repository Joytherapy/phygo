'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Activity, Stethoscope, AlertTriangle, Sparkles, Send, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface ZoneAnatomy {
  anatomy: string;
  innervation: string;
  biomechanics: string;
  clinicalRelevance: string;
}

const ZONE_ANATOMY: Record<string, ZoneAnatomy> = {
  'cervical-spine': {
    anatomy: "La colonna cervicale è composta da 7 vertebre (C1-C7), articolate tramite dischi intervertebrali (assenti tra C1-C2) e faccette articolari zigapofisarie orientate a ~45° per favorire flessibilità multiplanare. C1 (atlante) e C2 (epistrofeo/asse) formano un complesso specializzato: l'articolazione atlanto-occipitale consente flesso-estensione ('sì con la testa'), l'atlanto-assiale la rotazione ('no con la testa'), mediata dal dente dell'epistrofeo. I muscoli profondi (lunghi del collo, lunghi della testa, piccoli retti) garantiscono stabilità segmentale; i muscoli superficiali (sternocleidomastoideo, scaleni, splenio del capo e del collo, semispinale) generano movimento e forza. Il legamento nucale posteriormente e i legamenti longitudinali anteriore/posteriore contribuiscono alla stabilità globale della colonna.",
    innervation: "Ogni segmento cervicale emette una radice nervosa (C1-C8) che contribuisce al plesso cervicale (C1-C4, innervazione motoria/sensitiva di collo e diaframma via nervo frenico) e al plesso brachiale (C5-T1, innervazione dell'arto superiore). Il midollo spinale cervicale è protetto dal canale vertebrale ed è particolarmente vulnerabile a compressione in presenza di stenosi o instabilità, con possibile mielopatia cervicale.",
    biomechanics: 'La colonna cervicale è il segmento vertebrale più mobile: flessione ~50°, estensione ~60°, rotazione ~80° per lato (metà circa avviene ad Atlante-Epistrofeo), inclinazione laterale ~45° per lato. Questa ampia mobilità va a scapito della stabilità intrinseca, motivo per cui la muscolatura profonda gioca un ruolo cruciale nel controllo neuromuscolare, specialmente in presenza di carichi ripetuti da postura prolungata (es. uso di device digitali).',
    clinicalRelevance: "La cervicalgia meccanica è una delle cause più comuni di consulto fisioterapico, spesso legata a disfunzione posturale, ipertono dei muscoli superficiali e ipotono dei flessori profondi ('forward head posture'). Il colpo di frusta (whiplash) coinvolge lesioni da accelerazione-decelerazione dei tessuti molli cervicali, con quadro clinico che può includere cefalea cervicogenica, vertigini cervicogeniche e radicolopatia se coinvolge le radici nervose. La stenosi del canale cervicale nell'anziano richiede attenzione per segni di mielopatia (parestesie diffuse, difficoltà nella deambulazione, iperreflessia).",
  },
  'trapezius': {
    anatomy: "Il trapezio è un ampio muscolo triangolare piatto che origina dalla linea nucale superiore, dal legamento nucale e dai processi spinosi di C7-T12, inserendosi su clavicola, acromion e spina della scapola. È funzionalmente suddiviso in tre fasci: superiore (elevazione della scapola, estensione cervicale), medio (retrazione/adduzione scapolare) e inferiore (depressione e rotazione verso il basso della scapola). Lavora in sinergia con il muscolo dentato anteriore nella rotazione verso l'alto della scapola durante l'elevazione del braccio (ritmo scapolo-omerale).",
    innervation: "Innervato dal nervo accessorio spinale (XI nervo cranico), con contributo propriocettivo dai rami ventrali di C3-C4. Una lesione del nervo accessorio (es. iatrogena durante interventi al collo) causa scapola alata laterale e debolezza nell'elevazione della spalla.",
    biomechanics: "Il fascio superiore è spesso iperattivo in pattern compensatori (es. durante l'elevazione del braccio in presenza di debolezza del dentato anteriore o del trapezio inferiore), generando il tipico 'shrug' compensatorio. Il corretto bilanciamento tra i tre fasci è determinante per un ritmo scapolo-omerale fisiologico e per prevenire impingement subacromiale secondario a disfunzione scapolare.",
    clinicalRelevance: "Il trapezio superiore è tra i muscoli più frequentemente interessati da tensione miofasciale e trigger point, associati a cefalea tensiva e dolore cervicale riferito. Uno squilibrio tra trapezio superiore iperattivo e trapezio inferiore/medio ipoattivo (spesso in postura da scrivania prolungata) è un pattern clinico comune nella valutazione della sindrome da conflitto subacromiale e della discinesia scapolare.",
  },
  'shoulder': {
    anatomy: "La spalla è il complesso articolare più mobile del corpo, formato da tre articolazioni vere e due piani di scorrimento funzionali. Le articolazioni vere sono: la sterno-costo-clavicolare, unico vero collegamento osseo tra tronco e arto superiore, stabilizzata soprattutto dal robusto legamento costo-clavicolare; l'acromion-claveare, stabilizzata dal legamento omonimo e, per la stabilità verticale, dal legamento coraco-clavicolare (fasci trapezoide e conoide); e la gleno-omerale, sinoviale sferica, dove l'ampia testa omerale articola con la poco profonda glenoide scapolare, ampliata dal labbro glenoideo fibrocartilagineo. I due piani di scorrimento funzionali sono lo spazio subdeltoideo (tra deltoide/acromion e cuffia dei rotatori, con la relativa borsa subdeltoidea) e la scapolo-toracica, uno scivolamento della scapola sulla gabbia toracica privo di vera capsula articolare ma essenziale per l'ampiezza di movimento globale. La stabilità dinamica gleno-omerale è garantita dalla cuffia dei rotatori (sovraspinato, sottospinato, piccolo rotondo, sottoscapolare), che centra la testa omerale nella glenoide durante il movimento; la stabilità statica dipende da capsula articolare e legamenti gleno-omerali. Il deltoide (fasci anteriore, medio, posteriore) è il principale motore del movimento globale del braccio.",
    innervation: "Il plesso brachiale (C5-T1) innerva l'intera regione: il nervo sovrascapolare (C5-C6) innerva sovraspinato e sottospinato; il nervo ascellare (C5-C6) innerva deltoide e piccolo rotondo; il nervo sottoscapolare innerva il sottoscapolare. Il nervo ascellare è a rischio in lussazioni gleno-omerali anteriori per la sua stretta relazione anatomica con la capsula inferiore.",
    biomechanics: "Il movimento di elevazione del braccio richiede una coordinazione precisa tra articolazione gleno-omerale e scapolo-toracica (ritmo scapolo-omerale, circa 2:1 gleno-omerale/scapolare oltre i 30° di elevazione). La cuffia dei rotatori genera una forza di compressione articolare (concavity-compression) essenziale per contrastare le forze di taglio generate dal deltoide durante l'elevazione, prevenendo la migrazione superiore della testa omerale.",
    clinicalRelevance: "La sindrome da conflitto subacromiale è tra le cause più comuni di dolore di spalla, spesso secondaria a discinesia scapolare o debolezza della cuffia dei rotatori. Le lesioni della cuffia (parziali o complete, tipicamente del sovraspinato) aumentano con l'età e possono essere asintomatiche o sintomatiche. La capsulite adesiva ('spalla congelata') presenta un decorso caratteristico in fasi (dolorosa, di rigidità, di risoluzione) e richiede un approccio riabilitativo specifico per fase. L'instabilità gleno-omerale, più comune in soggetti giovani e sportivi, richiede valutazione della direzione (anteriore, la più frequente) e del grado di lassità capsulare.",
  },
  'chest': {
    anatomy: "Il gran pettorale, ampio muscolo a ventaglio, origina da clavicola, sterno, cartilagini costali e guaina del retto addominale, inserendosi sulla cresta del grande tubercolo omerale. Il piccolo pettorale, più profondo, origina dalle coste 3-5 e si inserisce sul processo coracoideo scapolare, contribuendo alla stabilità scapolare. Il gran pettorale è funzionalmente diviso in un fascio clavicolare (flessione/adduzione orizzontale) e un fascio sterno-costale (adduzione, estensione da posizione flessa, rotazione interna).",
    innervation: "Innervato dai nervi pettorale laterale (C5-C7, plesso brachiale, fascio clavicolare) e pettorale mediale (C8-T1, fascio sterno-costale). Il piccolo pettorale è innervato principalmente dal nervo pettorale mediale.",
    biomechanics: "Il gran pettorale è un potente adduttore e rotatore interno dell'omero, centrale in movimenti di spinta (push-up, panca). Il piccolo pettorale, se ipertonico o accorciato, tende ad anteriorizzare la scapola e limitarne la rotazione verso l'alto, contribuendo a pattern posturali di spalla protratta e intrarotata, spesso osservati in lavori sedentari prolungati.",
    clinicalRelevance: "L'accorciamento del piccolo pettorale è frequentemente coinvolto nella sindrome dello stretto toracico (thoracic outlet syndrome), per compressione neurovascolare tra piccolo pettorale e processo coracoideo. Lesioni del gran pettorale (parziali o complete, spesso alla giunzione muscolo-tendinea) sono tipiche in sollevamento pesi (panca piana) e richiedono gestione differenziata in base al grado di lesione.",
  },
  'biceps': {
    anatomy: "Il bicipite brachiale ha due capi: il capo lungo, che origina dal tubercolo sovraglenoideo della scapola e decorre nel solco intertubercolare dell'omero (rilevante per la tendinopatia bicipitale), e il capo breve, che origina dal processo coracoideo. Entrambi si inseriscono sulla tuberosità radiale tramite un tendine comune, con l'aponeurosi bicipitale (lacerto fibroso) che si estende medialmente sulla fascia dell'avambraccio.",
    innervation: "Innervato dal nervo muscolocutaneo (C5-C6, plesso brachiale), che prosegue poi come nervo cutaneo laterale dell'avambraccio, fornendo sensibilità alla faccia laterale dell'avambraccio.",
    biomechanics: "Il bicipite è il principale flessore del gomito quando l'avambraccio è supinato (la posizione di massima efficienza meccanica) ed è anche il supinatore più potente dell'avambraccio, più efficace a gomito flesso a 90°. Il capo lungo contribuisce inoltre, in minima parte, alla stabilità anteriore della testa omerale.",
    clinicalRelevance: "La tendinopatia del capo lungo del bicipite è spesso associata a patologie della cuffia dei rotatori e conflitto subacromiale, per la stretta relazione anatomica del tendine con lo spazio subacromiale. Le lesioni prossimali (capo lungo) sono più comuni delle lesioni distali e generalmente meglio tollerate funzionalmente; le lesioni distali del tendine bicipitale, più rare, comportano una perdita di forza significativa in supinazione e richiedono spesso trattamento chirurgico nei soggetti attivi.",
  },
  'triceps': {
    anatomy: "Il tricipite brachiale ha tre capi: lungo (origina dal tubercolo infraglenoideo scapolare, unico capo biarticolare), laterale e mediale (entrambi originano dall'omero posteriore). I tre capi convergono in un tendine comune che si inserisce sull'olecrano ulnare.",
    innervation: "Innervato interamente dal nervo radiale (C6-C8, plesso brachiale), che decorre nel solco radiale dell'omero posteriormente — rilevante nella diagnosi di lesioni da frattura diafisaria omerale, spesso associate a paralisi del nervo radiale.",
    biomechanics: "Il tricipite è l'unico estensore significativo del gomito. Il capo lungo, essendo biarticolare, contribuisce anche all'estensione ed adduzione della spalla, rendendolo particolarmente sollecitato in movimenti di spinta sopra la testa (overhead press) e in esercizi come i dip.",
    clinicalRelevance: "Le lesioni del tendine tricipitale sono relativamente rare ma significative in atleti di forza (sollevamento pesi, football americano), tipicamente da contrazione eccentrica improvvisa. Il tricipite è centrale nella riabilitazione post-frattura di gomito e nelle fasi finali del recupero post-protesi di gomito, essendo determinante per l'autonomia funzionale nelle attività di spinta.",
  },
  'elbow': {
    anatomy: "Il gomito è un'articolazione composta da tre articolazioni in un'unica capsula: omero-ulnare (cerniera, flesso-estensione), omero-radiale (permette anche rotazione) e radio-ulnare prossimale (prono-supinazione). Gli epicondili omerali laterale e mediale fungono da origine per la muscolatura estensoria (epicondilo laterale: estensore radiale breve del carpo, principale muscolo coinvolto nell'epicondilite) e flessoria/pronatoria (epicondilo mediale) dell'avambraccio. Il legamento collaterale ulnare (mediale) e il legamento collaterale radiale (laterale) garantiscono stabilità in varo-valgo.",
    innervation: "Il nervo ulnare decorre posteriormente all'epicondilo mediale nel 'tunnel cubitale', estremamente superficiale e vulnerabile a compressione diretta o trazione in flessione prolungata. I nervi mediano e radiale attraversano anteriormente la regione, con il nervo radiale che si divide in ramo superficiale e profondo (interosseo posteriore) a livello del gomito.",
    biomechanics: "Il range di movimento funzionale del gomito per la maggior parte delle attività quotidiane è tra 30° e 130° di flessione, con prono-supinazione di circa 50° per direzione. Il valgo fisiologico dell'avambraccio (angolo di trasporto, maggiore nelle donne) influenza la biomeccanica dello stress in valgo durante attività di lancio.",
    clinicalRelevance: "L'epicondilite laterale ('gomito del tennista') è una tendinopatia da sovraccarico dell'origine degli estensori del polso, comune anche in attività lavorative ripetitive oltre che sportive. L'epicondilite mediale ('gomito del golfista') coinvolge i flessori-pronatori. La sindrome del tunnel cubitale, da compressione del nervo ulnare, causa parestesie al 4°-5° dito ed è spesso aggravata da flessione prolungata del gomito (es. durante il sonno).",
  },
  'forearm': {
    anatomy: "L'avambraccio contiene due compartimenti principali: anteriore (flessore, prevalentemente innervato dal nervo mediano, con il flessore ulnare del carpo e metà del flessore profondo delle dita innervati dal nervo ulnare) e posteriore (estensore, innervato dal nervo radiale). I muscoli originano prevalentemente dagli epicondili omerali e si inseriscono su polso e dita tramite tendini lunghi che attraversano il retinacolo dei flessori/estensori.",
    innervation: "Nervo mediano (compartimento anteriore, eccetto flessore ulnare del carpo e metà mediale del flessore profondo delle dita, innervati dal nervo ulnare), nervo radiale e suo ramo interosseo posteriore (compartimento posteriore). Il nervo interosseo anteriore, ramo del mediano, innerva i muscoli profondi flessori di pollice e indice.",
    biomechanics: "I muscoli dell'avambraccio agiscono su polso e dita tramite tendini lunghi, permettendo movimenti fini di presa e manipolazione. L'equilibrio tra flessori ed estensori del polso è determinante per un corretto pattern di presa; uno squilibrio (tipicamente flessori dominanti) è comune in attività manuali ripetitive.",
    clinicalRelevance: "Le tendinopatie da overuse dei flessori/estensori dell'avambraccio sono comuni in lavori manuali e sport di racchetta. La sindrome del tunnel radiale (compressione del nervo radiale profondo) può mimare un'epicondilite laterale resistente al trattamento, rendendo importante la diagnosi differenziale.",
  },
  'wrist-hand': {
    anatomy: "Il polso è formato da 8 ossa carpali disposte su due file, articolate con radio e ulna prossimalmente e con i metacarpi distalmente. Il tunnel carpale, delimitato dalle ossa carpali e dal retinacolo dei flessori, contiene 9 tendini flessori e il nervo mediano. Dorsalmente, il retinacolo degli estensori organizza i tendini estensori in 6 compartimenti fibro-osteo distinti, rilevanti per la localizzazione di specifiche tenosinoviti (es. il primo compartimento nella tenosinovite di De Quervain). La mano ha 27 ossa (carpo, metacarpo, falangi) e una complessa architettura di muscoli intrinseci (interossei, lombricali, eminenza tenar e ipotenar) ed estrinseci (originano dall'avambraccio).",
    innervation: "Il nervo mediano innerva la maggior parte dei muscoli tenar e i primi due lombricali, oltre alla sensibilità palmare di pollice, indice, medio e metà anulare. Il nervo ulnare innerva la maggior parte dei muscoli intrinseci della mano (interossei, ipotenar, adduttore del pollice) e la sensibilità di mignolo e metà mediale dell'anulare. Il nervo radiale fornisce sensibilità al dorso radiale della mano.",
    biomechanics: "La mano è capace di movimenti estremamente fini grazie alla ricca innervazione sensitiva e alla complessa architettura muscolare intrinseca-estrinseca. La presa di forza dipende principalmente dai flessori estrinseci; la presa di precisione richiede il controllo fine dei muscoli intrinseci, particolarmente vulnerabili a deficit dopo lesione del nervo ulnare o mediano.",
    clinicalRelevance: "La sindrome del tunnel carpale, da compressione del nervo mediano, è la neuropatia da intrappolamento più comune, con parestesie tipicamente notturne a pollice-indice-medio. La tenosinovite di De Quervain coinvolge i tendini di abduttore lungo ed estensore breve del pollice al primo compartimento estensore. Il dito a scatto (tenosinovite stenosante) e la malattia di Dupuytren (retrazione dell'aponeurosi palmare) sono altre condizioni frequenti nella pratica clinica di mano e polso.",
  },
  'core-abdomen': {
    anatomy: "Il core è un sistema muscolare a 'cilindro' composto dal diaframma (tetto), dal pavimento pelvico (base), dal trasverso dell'addome (parete anteriore profonda, avvolge il tronco come un corsetto) e dai muscoli multifido e paraspinali (parete posteriore). Superficialmente, il retto dell'addome (flessione del tronco) e gli obliqui interno/esterno (rotazione, flessione laterale) completano la parete addominale. La linea alba e la fascia toracolombare integrano funzionalmente questi muscoli con l'attività degli arti.",
    innervation: "I muscoli addominali sono innervati segmentalmente dai nervi intercostali toracici inferiori (T7-T12) e dal nervo ileo-ipogastrico/ileo-inguinale (L1). Il trasverso dell'addome e gli obliqui interni condividono innervazione toraco-lombare comune con i muscoli paraspinali profondi.",
    biomechanics: "Il core genera stabilità intra-addominale tramite la co-contrazione di diaframma, trasverso e pavimento pelvico (aumento della pressione intra-addominale), fondamentale per proteggere la colonna lombare durante carichi assiali. Il timing di attivazione del trasverso dell'addome, generalmente anticipatorio rispetto al movimento degli arti in soggetti sani, è spesso ritardato in presenza di lombalgia cronica.",
    clinicalRelevance: "Un deficit di controllo motorio del core, in particolare del trasverso dell'addome, è frequentemente osservato in soggetti con lombalgia cronica non specifica, rendendo l'allenamento della stabilità segmentale un pilastro della riabilitazione lombare. La diastasi dei muscoli retti addominali (comune post-partum) richiede un approccio progressivo che privilegi il trasverso prima del rinforzo del retto addominale.",
  },
  'thoracic-spine': {
    anatomy: "La colonna dorsale è composta da 12 vertebre (T1-T12), articolate con le coste tramite le articolazioni costo-vertebrali e costo-trasversarie, che ne limitano intrinsecamente la mobilità rispetto a cervicale e lombare. La cifosi fisiologica (curva a convessità posteriore) è normale, ma un'eccessiva accentuazione (ipercifosi) è comune con l'invecchiamento o in postura scorretta prolungata. I muscoli paraspinali toracici (erettori spinali, multifido) e i romboidi contribuiscono al mantenimento della postura eretta.",
    innervation: "Segmentale, tramite i nervi spinali toracici T1-T12, che decorrono negli spazi intercostali fornendo innervazione motoria e sensitiva alla parete toracica.",
    biomechanics: "La mobilità della colonna dorsale è prevalentemente in rotazione (favorita dall'orientamento delle faccette articolari sul piano frontale), con flesso-estensione limitata dalla gabbia costale. Un'adeguata mobilità toracica in estensione e rotazione è funzionalmente collegata alla meccanica della spalla, poiché una rigidità toracica eccessiva può forzare compensi a livello scapolare e gleno-omerale.",
    clinicalRelevance: "La rigidità toracica è spesso implicata come fattore contribuente sia in patologie cervicali (aumento del carico compensatorio) sia di spalla (alterazione del ritmo scapolo-toracico). Le fratture da compressione vertebrale, comuni nell'osteoporosi, coinvolgono prevalentemente il tratto toracico medio-basso e possono accentuare progressivamente la cifosi.",
  },
  'lumbar-spine': {
    anatomy: "La colonna lombare è composta da 5 vertebre (L1-L5), le più voluminose della colonna, progettate per sostenere il carico assiale maggiore. I dischi intervertebrali lombari sono i più spessi del rachide; le faccette articolari, orientate sul piano sagittale, favoriscono flesso-estensione limitando la rotazione. Il legamento ileo-lombare, che ancora il processo trasverso di L5 alla cresta iliaca, è un importante stabilizzatore della giunzione lombo-sacrale. Il legamento longitudinale posteriore, più stretto a livello lombare, offre minore protezione contro le erniazioni discali postero-laterali, spiegando la loro frequenza in questa sede. I muscoli erettori spinali, multifido (stabilizzatore segmentale profondo) e quadrato dei lombi supportano la colonna.",
    innervation: "Le radici nervose lombari (L1-L5) emergono e contribuiscono al plesso lombosacrale, dando origine a nervo femorale (L2-L4), otturatorio e, insieme alle radici sacrali, al nervo sciatico (L4-S3). La radice L5 è la più frequentemente coinvolta in ernie discali L4-L5, tra le sedi più comuni di erniazione.",
    biomechanics: "La colonna lombare sostiene gran parte del peso del tronco e trasferisce i carichi verso il bacino durante stazione eretta, cammino e sollevamento. La pressione intradiscale aumenta significativamente in flessione del tronco combinata a carico esterno (es. sollevare un peso da terra a schiena flessa), rendendo la meccanica di sollevamento un fattore chiave nella prevenzione di lombalgia e patologia discale.",
    clinicalRelevance: "La lombalgia è tra i disturbi muscoloscheletrici più prevalenti a livello globale; nella maggior parte dei casi è aspecifica, senza una causa strutturale chiaramente identificabile. L'ernia del disco lombare con radicolopatia (sciatalgia) coinvolge tipicamente L4-L5 o L5-S1. La stenosi del canale lombare, più comune nell'anziano, causa claudicatio neurogena, tipicamente alleviata dalla flessione del tronco (es. camminare chinati su un carrello).",
  },
  'hip': {
    anatomy: "L'anca è un'articolazione sinoviale sferica (enartrosi) tra la testa del femore e l'acetabolo del bacino, ampliato dal labbro acetabolare fibrocartilagineo che ne aumenta la profondità e la stabilità. È l'articolazione con la maggiore congruenza ossea del corpo, il che ne limita la lussazione traumatica rispetto alla spalla ma la rende più suscettibile a conflitto femoro-acetabolare in presenza di anomalie morfologiche. La capsula articolare è rinforzata da tre legamenti principali: l'ileo-femorale (il più robusto del corpo, a forma di Y, limita l'iperestensione), il pubo-femorale (limita eccessiva abduzione ed extrarotazione) e l'ischio-femorale (limita l'intrarotazione). I muscoli glutei (grande, medio, piccolo), ileopsoas, adduttori e il gruppo dei rotatori esterni profondi (piriforme incluso) circondano l'articolazione fornendo forza e stabilità dinamica.",
    innervation: "Il nervo femorale (L2-L4) innerva i flessori d'anca anteriori, il nervo otturatorio (L2-L4) gli adduttori, il nervo gluteo superiore (L4-S1) medio e piccolo gluteo, il nervo gluteo inferiore (L5-S2) il grande gluteo. Il nervo sciatico decorre in stretta relazione posteriore all'articolazione, passando tipicamente sotto (o talvolta attraverso) il muscolo piriforme.",
    biomechanics: "L'anca sostiene forze fino a 3-6 volte il peso corporeo durante il cammino, aumentando significativamente in fasi di appoggio monopodalico o attività ad alto impatto. Il gluteo medio è cruciale per la stabilità del bacino sul piano frontale durante l'appoggio monopodalico (prevenzione del segno di Trendelenburg); la sua debolezza è un pattern comune associato a dolore femoro-rotuleo e lombare.",
    clinicalRelevance: "La coxartrosi è una causa comune di dolore e limitazione funzionale nell'anziano, spesso trattata con approccio conservativo prima dell'eventuale protesi totale d'anca. Il conflitto femoro-acetabolare (FAI), più comune in giovani attivi, coinvolge un contatto anomalo tra collo femorale e bordo acetabolare, spesso associato a lesioni del labbro. La displasia congenita dell'anca richiede diagnosi precoce in età pediatrica per prevenire un'artrosi precoce in età adulta.",
  },
  'glutes': {
    anatomy: "Il grande gluteo, il muscolo più voluminoso del corpo, origina da ileo posteriore, sacro e legamento sacrotuberoso, inserendosi sul tratto ileotibiale e sulla tuberosità glutea del femore. Il medio e il piccolo gluteo originano dalla superficie esterna dell'ileo e si inseriscono sul grande trocantere, posizionati profondamente sotto il grande gluteo nella regione laterale dell'anca. Il piriforme e gli altri rotatori esterni profondi (otturatore interno/esterno, gemelli, quadrato del femore) completano il gruppo posteriore.",
    innervation: "Il grande gluteo è innervato dal nervo gluteo inferiore (L5-S2); medio e piccolo gluteo dal nervo gluteo superiore (L4-S1). Il nervo sciatico decorre profondamente al grande gluteo, in relazione variabile con il piriforme (rilevante nella sindrome del piriforme).",
    biomechanics: "Il grande gluteo è il principale estensore ed extrarotatore dell'anca, dominante in attività ad alta richiesta di potenza (sprint, salto, salita scale). Il medio gluteo stabilizza il bacino sul piano frontale durante l'appoggio monopodalico; una sua debolezza altera significativamente la meccanica del cammino e della corsa, con effetti a catena su ginocchio e colonna lombare.",
    clinicalRelevance: "La sindrome del dolore trocanterico (tendinopatia glutea, spesso coinvolgente il tendine del medio gluteo) è una causa comune di dolore laterale d'anca, più frequente nelle donne di mezza età. La sindrome del piriforme, da compressione del nervo sciatico, può mimare una radicolopatia lombare e richiede diagnosi differenziale accurata. Il rinforzo del medio gluteo è centrale nella riabilitazione di numerose condizioni dell'arto inferiore, dal dolore femoro-rotuleo alla lombalgia.",
  },
  'quadriceps': {
    anatomy: "Il quadricipite femorale è composto da 4 capi: retto femorale (unico biarticolare, origina dalla spina iliaca antero-inferiore), vasto laterale, vasto mediale e vasto intermedio (tutti originano dal femore). Convergono in un tendine comune che avvolge la rotula (tendine quadricipitale) e prosegue come tendine rotuleo fino alla tuberosità tibiale. Il vasto mediale obliquo, porzione distale del vasto mediale con fibre orientate a 50-55°, ha un ruolo chiave nel tracking rotuleo mediale.",
    innervation: "Innervato interamente dal nervo femorale (L2-L4, plesso lombare), che fornisce anche sensibilità cutanea anteriore di coscia tramite i suoi rami cutanei.",
    biomechanics: "Il quadricipite è l'unico estensore del ginocchio ed è centrale nell'assorbimento eccentrico del carico durante l'atterraggio da un salto o la discesa delle scale. Il retto femorale, essendo biarticolare, contribuisce anche alla flessione dell'anca, rendendolo particolarmente sollecitato in gesti che combinano flessione d'anca ed estensione di ginocchio (es. calciare).",
    clinicalRelevance: "Un deficit di forza del quadricipite, in particolare del vasto mediale obliquo, è associato alla sindrome femoro-rotulea per alterato tracking della rotula nella troclea femorale. Il rinforzo del quadricipite è centrale nella riabilitazione post-lesione del LCA e post-protesi di ginocchio, essendo il principale predittore funzionale del recupero. Lesioni del tendine quadricipitale (più comuni sopra i 40 anni) e del tendine rotuleo (più comuni in atleti giovani, 'ginocchio del saltatore') hanno epidemiologia e gestione differenziate.",
  },
  'hamstrings': {
    anatomy: "Gli ischiocrurali comprendono tre muscoli: bicipite femorale (capo lungo biarticolare, capo breve monoarticolare), semitendinoso e semimembranoso. Tutti (eccetto il capo breve del bicipite) originano dalla tuberosità ischiatica e si inseriscono distalmente attorno al ginocchio: il bicipite femorale sulla testa del perone (lateralmente), semitendinoso e semimembranoso medialmente sulla tibia (il semitendinoso contribuisce alla zampa d'oca).",
    innervation: "Innervati dal nervo tibiale (ramo del nervo sciatico, L4-S3), eccetto il capo breve del bicipite femorale, innervato dal nervo peroneale comune (l'altro ramo dello sciatico) — questa doppia innervazione ha rilevanza chirurgica e nella valutazione di lesioni parziali.",
    biomechanics: "Gli ischiocrurali estendono l'anca e flettono il ginocchio, agendo come antagonisti funzionali del quadricipite. Sono biarticolari e quindi soggetti a un elevato stress durante la fase di swing terminale della corsa, quando si allungano rapidamente sotto tensione eccentrica (l'anca in flessione e il ginocchio in estensione) — il meccanismo lesivo più comune.",
    clinicalRelevance: "Le lesioni muscolari degli ischiocrurali sono tra le più comuni in ambito sportivo, particolarmente in sport con sprint ripetuti (calcio, atletica). Il capo lungo del bicipite femorale è il sito più frequentemente coinvolto. Il rinforzo eccentrico (es. Nordic hamstring curl) è supportato da evidenza per la prevenzione di recidive. Gli ischiocrurali contribuiscono anche alla stabilità dinamica del LCA, agendo come antagonisti della traslazione anteriore della tibia — motivo per cui il loro rinforzo è centrale nella riabilitazione post-lesione del LCA.",
  },
  'calf': {
    anatomy: "Il polpaccio comprende il tricipite surale, formato da gastrocnemio (capo mediale e laterale, biarticolare, origina dai condili femorali) e soleo (monoarticolare, origina da tibia e perone), che convergono nel tendine d'Achille, il tendine più spesso e resistente del corpo, inserendosi sul calcagno. Il muscolo tibiale posteriore, i flessori lunghi delle dita e del pollice del piede decorrono più profondamente nel compartimento posteriore.",
    innervation: "Innervato dal nervo tibiale (ramo dello sciatico, S1-S2), che prosegue poi come nervo tibiale posteriore dietro al malleolo mediale, dando origine ai nervi plantari mediale e laterale.",
    biomechanics: "Il tricipite surale genera la spinta propulsiva nel cammino e nella corsa tramite flessione plantare della caviglia, essenziale per l'ultima fase dell'appoggio (push-off). Il gastrocnemio, essendo biarticolare, è più efficace a ginocchio esteso; il soleo, monoarticolare, contribuisce prevalentemente durante l'appoggio con ginocchio flesso ed è particolarmente attivo nel mantenimento della postura eretta statica.",
    clinicalRelevance: "La tendinopatia achillea è una condizione comune in corridori e sportivi, distinta in forma inserzionale (al calcagno) e non inserzionale (a metà tendine, zona ipovascolarizzata). La rottura del tendine d'Achille, tipica in soggetti di mezza età durante attività sportiva sporadica, richiede diagnosi tempestiva (test di Thompson). La sindrome da stress tibiale mediale ('shin splints') coinvolge il compartimento posteriore profondo ed è comune in corridori con carico di allenamento aumentato rapidamente.",
  },
  'ankle-foot': {
    anatomy: "La caviglia è formata dall'articolazione tibio-tarsica (talo-crurale), un ginglimo tra tibia, perone e talo, stabilizzata dai legamenti collaterali laterali (peroneo-astragalico anteriore, il più frequentemente lesionato, calcaneo-peroneale, peroneo-astragalico posteriore) e dal legamento deltoideo medialmente, più robusto. La sindesmosi tibio-peroneale distale, un'articolazione fibrosa che unisce tibia e perone tramite legamenti tibio-peroneali anteriore e posteriore e la membrana interossea, mantiene la corretta mortasa articolare ed è coinvolta nelle distorsioni 'alte' di caviglia. Il piede è formato da 26 ossa organizzate in retropiede (talo, calcagno), mesopiede (navicolare, cuboide, cuneiformi) e avampiede (metatarsi, falangi), con archi longitudinale e trasverso mantenuti da legamenti (plantare lungo, calcaneo-navicolare) e dalla fascia plantare.",
    innervation: "Il nervo tibiale posteriore (S1-S2) innerva la pianta del piede tramite i nervi plantari mediale e laterale; il nervo peroneale superficiale innerva il dorso del piede; il nervo peroneale profondo innerva il primo spazio interdigitale e la muscolatura estensoria dorsale.",
    biomechanics: "La flesso-estensione (dorsiflessione/flessione plantare) avviene principalmente alla tibio-tarsica; l'inversione-eversione avviene prevalentemente alla sottoastragalica. La fascia plantare agisce come un 'windlass mechanism': la dorsiflessione delle dita durante la fase di push-off tende la fascia, rialzando l'arco longitudinale e rigidizzando il piede per una propulsione efficiente.",
    clinicalRelevance: "La distorsione di caviglia laterale (coinvolgente più comunemente il legamento peroneo-astragalico anteriore) è tra le lesioni muscoloscheletriche più frequenti in assoluto, con un tasso di recidiva elevato in assenza di riabilitazione neuromuscolare/propriocettiva adeguata. La fascite plantare è una causa comune di dolore al tallone, associata a sovraccarico ripetuto e spesso a retrazione del tricipite surale. L'alluce valgo, deformità progressiva del primo raggio, e il neuroma di Morton (compressione del nervo interdigitale, tipicamente al terzo spazio) sono altre condizioni comuni dell'avampiede.",
  },
  'whole-body': {
    anatomy: "L'equilibrio e il controllo posturale globale dipendono dall'integrazione di tre sistemi sensoriali principali: visivo, vestibolare (canali semicircolari e organi otolitici dell'orecchio interno) e somatosensoriale/propriocettivo (recettori articolari, muscolari e cutanei, particolarmente densi a livello di piede e caviglia). Le strategie posturali di correzione avvengono principalmente a livello di caviglia (per piccole perturbazioni), anca (per perturbazioni maggiori) e passo compensatorio (quando le prime due strategie sono insufficienti).",
    innervation: "Il controllo dell'equilibrio coinvolge un'integrazione centrale a livello di tronco encefalico, cervelletto e corteccia, con proiezioni discendenti attraverso il tratto vestibolospinale e reticolospinale verso la muscolatura antigravitaria di tronco e arti inferiori.",
    biomechanics: "Il mantenimento della stazione eretta richiede un continuo aggiustamento del centro di massa entro la base di appoggio, tramite oscillazioni posturali fisiologiche rilevabili con la posturografia. Il cammino richiede una coordinazione ciclica tra fasi di appoggio e oscillazione, con transizioni del centro di massa gestite dall'interazione tra forza muscolare, inerzia e controllo neuromuscolare anticipatorio.",
    clinicalRelevance: "Il deficit dell'equilibrio è un importante fattore di rischio di caduta nell'anziano, con conseguenze spesso severe (fratture, perdita di autonomia). La valutazione multifattoriale (forza, propriocezione, tempi di reazione, visione) guida l'intervento riabilitativo mirato. Disturbi vestibolari periferici (es. vertigine parossistica posizionale benigna) richiedono un approccio diagnostico e terapeutico specifico, distinto dal training dell'equilibrio generale utilizzato in altre condizioni.",
  },
  'knee': {
    anatomy: "Il ginocchio è un'articolazione sinoviale a cerniera modificata, la più grande del corpo umano, formata dall'articolazione femoro-tibiale e femoro-rotulea. I condili femorali articolano con i piatti tibiali mediale e laterale, separati dai due menischi (mediale a forma di C, laterale più circolare) che aumentano la congruenza articolare e distribuiscono i carichi. La stabilità è garantita da quattro legamenti principali: il legamento crociato anteriore (LCA), che previene la traslazione anteriore della tibia; il legamento crociato posteriore (LCP), che ne previene la traslazione posteriore; il legamento collaterale mediale (LCM), che resiste allo stress in valgo; il legamento collaterale laterale (LCL), che resiste allo stress in varo. Anteriormente, la rotula scorre nella troclea femorale, aumentando il braccio di leva del quadricipite tramite il tendine rotuleo e il retinacolo. I muscoli principali sono il quadricipite femorale (retto femorale, vasto mediale, laterale e intermedio), estensore primario, e gli ischiocrurali (bicipite femorale, semitendinoso, semimembranoso), flessori primari e stabilizzatori dinamici del LCA.",
    innervation: "L'innervazione deriva principalmente dal nervo femorale (branche articolari anteriori, plesso lombare L2-L4), dal nervo tibiale e dal nervo peroneale comune (entrambi rami del nervo sciatico, L4-S3), che innervano rispettivamente il compartimento posteriore e laterale. Il nervo safeno, ramo cutaneo del femorale, fornisce sensibilità alla faccia mediale del ginocchio e della gamba, rilevante nella diagnosi differenziale del dolore mediale.",
    biomechanics: 'Il ginocchio compie principalmente flesso-estensione sul piano sagittale (0-135° circa di flessione attiva), con una minima rotazione interna-esterna disponibile solo a ginocchio flesso ("screw-home mechanism" in estensione terminale, che blocca l\'articolazione in appoggio). Durante il cammino assorbe carichi fino a 3-4 volte il peso corporeo, fino a 6-8 volte in corsa o scendendo le scale. La cinematica coinvolge uno scivolamento combinato a rotolamento dei condili femorali sui piatti tibiali, reso possibile dall\'azione sinergica di legamenti, menischi e muscolatura circostante.',
    clinicalRelevance: "Il ginocchio è tra le articolazioni più coinvolte in patologie acute e degenerative, per l'elevato carico funzionale e la ridotta protezione dei tessuti molli. Le lesioni del LCA sono comuni in sport con cambi di direzione improvvisi (calcio, basket, sci) e spesso associate a lesioni meniscali concomitanti. Le lesioni degenerative meniscali sono frequenti dopo i 40 anni, spesso senza trauma identificabile. L'artrosi femoro-tibiale è tra le cause più comuni di dolore cronico e disabilità nell'anziano, mentre la sindrome femoro-rotulea è tipica di popolazioni giovani e sportive, legata a squilibri di forza tra vasto mediale e laterale o a malallineamenti dell'arto inferiore.",
  },
};

interface ExerciseItem {
  id: string;
  title: string;
  level: string;
  body_position: string;
  equipment: string;
  image_url: string | null;
  goal: string | null;
}

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
  zone: { id: string; name: string; slug: string };
  exercises: ExerciseItem[];
  totalExercises: number;
  conditions: ConditionItem[];
  plan: string;
}

const levelColor: Record<string, string> = {
  Gentle: '#32D6A0',
  Active: '#4F7CFF',
  Challenge: '#A855F7',
};

const zoneStarterQuestions: Record<string, string> = {
  'cervical-spine': "Quali sono i segnali di allarme (red flags) da escludere prima di trattare una cervicalgia meccanica?",
  'shoulder': "Come distinguo clinicamente un conflitto subacromiale da una capsulite adesiva in fase iniziale?",
  'knee': "Quali criteri uso per decidere se un paziente con lesione del LCA può tornare allo sport?",
  'hip': "Quali test clinici differenziano un conflitto femoro-acetabolare da una coxartrosi iniziale?",
  'lumbar-spine': "Quali red flags devo escludere in un paziente con lombalgia acuta prima di iniziare la riabilitazione?",
};

export default function ZoneHubPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<ConditionItem | null>(null);

  const [askOpen, setAskOpen] = useState(false);
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState('');

  useEffect(() => {
    fetch(`/api/body-map/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleAskPhygo() {
    if (!askQuestion.trim() || !data) return;
    setAskLoading(true);
    setAskError('');
    setAskAnswer('');
    try {
      const res = await fetch('/api/ask-phygo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: askQuestion,
          noteContext: `The clinician is reviewing the "${data.zone.name}" anatomical region in the Body Map tool.`,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAskError(json.error || 'Something went wrong.');
      } else {
        setAskAnswer(json.answer);
      }
    } catch {
      setAskError('Something went wrong. Please try again.');
    } finally {
      setAskLoading(false);
    }
  }

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
            onClick={() => router.push('/dashboard/body-map')}
            className="text-sm font-semibold text-[#4F7CFF]"
          >
            {"\u2190"} Back to Body Map
          </button>
        </div>
      </div>
    );
  }

  const { zone, exercises, totalExercises, conditions } = data;
  const anatomyData = ZONE_ANATOMY[zone.slug];

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
          onClick={() => router.push('/dashboard/body-map')}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Body Map
        </button>

        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]" />
            Anatomical Zone
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight">
            {zone.name}
          </h1>
        </div>

        {anatomyData && (
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
                Anatomy
              </h3>
              <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed max-w-3xl">
                {anatomyData.anatomy}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
                Innervation
              </h3>
              <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed max-w-3xl">
                {anatomyData.innervation}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
                Biomechanics
              </h3>
              <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed max-w-3xl">
                {anatomyData.biomechanics}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60 mb-2">
                Clinical Relevance
              </h3>
              <p className="text-ink/60 dark:text-white/60 text-sm leading-relaxed max-w-3xl">
                {anatomyData.clinicalRelevance}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8">
          {!askOpen ? (
            <button
              onClick={() => {
                setAskOpen(true);
                setAskQuestion(zoneStarterQuestions[zone.slug] || '');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.3)] hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
            >
              <Sparkles size={16} />
              Ask Phygo about this zone
            </button>
          ) : (
            <div className="rounded-[24px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-[#4F7CFF]" />
                <p className="text-sm font-semibold">Ask Phygo about {zone.name}</p>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value)}
                  rows={2}
                  className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-3 py-2 text-sm outline-none focus:border-[#4F7CFF] resize-none"
                  placeholder="Ask a clinical question about this region..."
                />
                <button
                  onClick={handleAskPhygo}
                  disabled={askLoading || !askQuestion.trim()}
                  className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl text-white disabled:opacity-50 self-end"
                  style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
                >
                  {askLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              {askError && (
                <p className="text-xs text-red-500 mt-2">{askError}</p>
              )}
              {askAnswer && (
                <div className="mt-4 pt-4 border-t border-black/[0.06] dark:border-white/10 text-sm text-ink/70 dark:text-white/70 leading-relaxed whitespace-pre-wrap">
                  {askAnswer}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-[#4F7CFF]" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/60 dark:text-white/60">
              Featured Exercises
            </h2>
          </div>

          {exercises.length === 0 ? (
            <p className="text-sm text-ink/40 dark:text-white/40">
              No exercises linked to this zone yet.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  {ex.image_url && (
                    <div className="aspect-video bg-white flex items-center justify-center">
                      <img
                        src={ex.image_url}
                        alt={ex.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white mb-2"
                      style={{ backgroundColor: levelColor[ex.level] || '#4F7CFF' }}
                    >
                      {ex.level}
                    </span>
                    <p className="text-sm font-semibold text-ink dark:text-white">{ex.title}</p>
                    <p className="text-xs text-ink/40 dark:text-white/40 mt-0.5">
                      {ex.body_position}
                      {ex.equipment ? ` \u00b7 ${ex.equipment}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalExercises > exercises.length && (
            <button
              onClick={() => router.push('/dashboard/library')}
              className="mt-4 text-sm font-semibold text-[#4F7CFF] hover:underline"
            >
              See all {totalExercises} exercises in Pro Library {"\u2192"}
            </button>
          )}
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
