import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- Bone layer (X-ray view) fallback content ---
// These 14 slugs come from the skeletal groups in BodyMap3D's X-ray mode.
// They are not (yet) rows in `body_zones`/`knowledge_base` in Supabase, so
// rather than 404, we serve hardcoded anatomy-adjacent condition content
// here. If/when these get real DB rows (so they show up in search, get
// exercises linked via body_zone_items, etc.), this fallback block can be
// deleted and the normal DB path will take over automatically.
const BONE_NAMES: Record<string, string> = {
  'bone-cranio': 'Skull',
  'bone-clavicola-scapola': 'Clavicle & Scapula',
  'bone-coste-sterno': 'Ribs & Sternum',
  'bone-omero': 'Humerus',
  'bone-radio-ulna': 'Radius & Ulna',
  'bone-mano': 'Hand Bones',
  'bone-bacino': 'Pelvis',
  'bone-sacro': 'Sacrum & Coccyx',
  'bone-femore': 'Femur',
  'bone-tibia-perone': 'Tibia & Fibula',
  'bone-piede': 'Foot Bones',
  'bone-cervicale': 'Cervical Vertebrae',
  'bone-dorsale': 'Thoracic Vertebrae',
  'bone-lombare': 'Lumbar Vertebrae',
};

interface BoneCondition {
  id: string;
  condition_name: string;
  goals: string;
  clinical_tests: string;
  red_flags: string;
  contraindications: string;
  typical_exercises: string;
  progression_criteria: string;
  evidence_level: string;
}

const BONE_CONDITIONS: Record<string, BoneCondition[]> = {
  'bone-cranio': [
    {
      id: 'bone-cranio-1',
      condition_name: 'Disfunzione temporo-mandibolare (DTM)',
      goals: 'Ridurre dolore mio-fasciale masticatorio, ripristinare apertura orale simmetrica e fluida, ridurre click/blocco articolare.',
      clinical_tests: 'Misurazione apertura orale attiva/passiva, palpazione dei masseteri e pterigoidei, valutazione della deviazione mandibolare in apertura, screening del rachide cervicale superiore.',
      red_flags: 'Trisma acuto post-traumatico, gonfiore/asimmetria facciale improvvisa, sospetta frattura condilare — riferire per imaging.',
      contraindications: 'Evitare mobilizzazioni forzate in fase acuta infiammatoria; cautela in pazienti con storia di lussazione ricorrente del disco.',
      typical_exercises: 'Mobilizzazione attiva controllata dell\'apertura, esercizi di rilassamento dei masticatori, terapia manuale su masseteri/temporali, trattamento associato del rachide cervicale superiore.',
      progression_criteria: 'Apertura orale >35-40mm senza dolore, assenza di click/blocco funzionalmente limitante, ripresa masticazione normale.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-cranio-2',
      condition_name: 'Vertigine posizionale post-trauma cranico lieve',
      goals: 'Risoluzione della vertigine posizionale, ripristino della fiducia nel movimento della testa, riduzione del rischio di caduta.',
      clinical_tests: 'Dix-Hallpike, roll test, screening vestibolare e oculomotorio di base.',
      red_flags: 'Cefalea a insorgenza improvvisa e severa, deficit neurologici focali, alterazione dello stato di coscienza — riferire con urgenza.',
      contraindications: 'Manovre di riposizionamento canalitico controindicate in instabilità cervicale non esclusa o sospetta lesione vascolare cervicale.',
      typical_exercises: 'Manovre di riposizionamento (es. Epley) se BPPV confermata, esercizi di abituazione vestibolare, training dell\'equilibrio progressivo.',
      progression_criteria: 'Test posizionali negativi, assenza di vertigine nelle attività quotidiane, normalizzazione dell\'equilibrio dinamico.',
      evidence_level: 'high',
    },
    {
      id: 'bone-cranio-3',
      condition_name: 'Trauma cranico lieve (commozione cerebrale) — ritorno graduale all\'attività',
      goals: 'Gestire in sicurezza il periodo di recupero, prevenire il second-impact syndrome, ripristinare la tolleranza allo sforzo fisico e cognitivo secondo un percorso graduato.',
      clinical_tests: 'Screening dei sintomi post-commotivi (cefalea, capogiro, affaticamento, difficoltà di concentrazione), test di tolleranza allo sforzo submassimale, screening vestibolo-oculomotorio.',
      red_flags: 'Peggioramento della cefalea, vomito ripetuto, confusione crescente, perdita di coscienza, convulsioni, asimmetria pupillare — riferire con urgenza (sospetta emorragia intracranica).',
      contraindications: 'Evitare il ritorno allo sport/attività ad alto rischio di nuovo trauma prima del completamento di tutte le fasi del protocollo graduato e della piena risoluzione dei sintomi.',
      typical_exercises: 'Protocollo a fasi graduate (riposo relativo iniziale breve, poi attività aerobica leggera, attività sport-specifica senza contatto, allenamento completo senza contatto, ritorno al contatto pieno), ciascuna della durata minima di 24h se asintomatica.',
      progression_criteria: 'Assenza di sintomi a riposo e sotto sforzo ad ogni fase prima di progredire alla successiva, autorizzazione medica al ritorno allo sport.',
      evidence_level: 'high',
    },
  ],
  'bone-clavicola-scapola': [
    {
      id: 'bone-clavicola-scapola-1',
      condition_name: 'Frattura di clavicola',
      goals: 'Consolidamento osseo sicuro, recupero progressivo di mobilità di spalla, prevenzione della rigidità scapolo-omerale secondaria.',
      clinical_tests: 'Palpazione del focolaio, valutazione della deformità/accorciamento, controllo neurovascolare distale (plesso brachiale, vasi succlavi).',
      red_flags: 'Deficit neurovascolare distale, frattura esposta, tenting cutaneo severo — gestione chirurgica urgente.',
      contraindications: 'Evitare carico e mobilizzazione attiva contro resistenza prima del consolidamento clinico/radiografico iniziale.',
      typical_exercises: 'Mobilizzazione passiva/attiva assistita precoce entro il range tollerato, progressione a rinforzo del cingolo scapolare una volta consolidata.',
      progression_criteria: 'Consolidamento radiografico, ROM di spalla funzionale, assenza di dolore al focolaio sotto carico progressivo.',
      evidence_level: 'high',
    },
    {
      id: 'bone-clavicola-scapola-2',
      condition_name: 'Discinesia scapolare',
      goals: 'Ripristinare un ritmo scapolo-omerale fisiologico, ridurre il sovraccarico compensatorio su cuffia dei rotatori e struttura sub-acromiale.',
      clinical_tests: 'Scapular Assistance Test, Scapular Retraction Test, osservazione dinamica del winging/tilting scapolare durante elevazione del braccio.',
      red_flags: 'Winging scapolare marcato e persistente con debolezza isolata (possibile lesione del nervo toracico lungo/accessorio) — approfondire prima di trattare come discinesia posturale.',
      contraindications: 'Nessuna specifica; evitare protocolli di rinforzo che aumentano il conflitto sub-acromiale in presenza di dolore acuto.',
      typical_exercises: 'Rinforzo di trapezio inferiore e dentato anteriore, rieducazione del controllo scapolare durante gesti funzionali, stretching del piccolo pettorale se accorciato.',
      progression_criteria: 'Normalizzazione del pattern scapolare osservato clinicamente, riduzione del dolore associato, ripresa dei gesti sportivi/lavorativi specifici.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-clavicola-scapola-3',
      condition_name: 'Sindrome dello stretto toracico (compressione neurovascolare)',
      goals: 'Ridurre la compressione del plesso brachiale/vasi succlavi tra clavicola, prima costa e piccolo pettorale, ripristinare sensibilità e forza dell\'arto superiore.',
      clinical_tests: 'Test di Roos (elevated arm stress test), test di Adson, test di iperabduzione, palpazione del piccolo pettorale e degli scaleni, screening posturale del cingolo scapolare.',
      red_flags: 'Cianosi/pallore improvviso dell\'arto, edema unilaterale marcato (sospetta trombosi venosa succlavia-ascellare, sindrome di Paget-Schroetter) — riferire con urgenza.',
      contraindications: 'Evitare posizioni sostenute di iperabduzione/retrazione scapolare che riproducono i sintomi durante le fasi sintomatiche acute.',
      typical_exercises: 'Stretching di scaleni e piccolo pettorale, rieducazione posturale del cingolo scapolare, rinforzo di trapezio inferiore e dentato anteriore per aprire lo spazio costo-clavicolare.',
      progression_criteria: 'Risoluzione/riduzione marcata delle parestesie, test provocativi negativizzati, ripresa delle attività con l\'arto sopra la testa.',
      evidence_level: 'low',
    },
  ],
  'bone-coste-sterno': [
    {
      id: 'bone-coste-sterno-1',
      condition_name: 'Frattura costale',
      goals: 'Gestione del dolore per permettere respirazione efficace e tosse valida, prevenzione delle complicanze polmonari (atelettasia, polmonite).',
      clinical_tests: 'Palpazione mirata del focolaio, valutazione dell\'espansione toracica, saturazione periferica, screening della qualità della tosse.',
      red_flags: 'Fratture multiple con movimento paradosso (flail chest), dispnea ingravescente, enfisema sottocutaneo — emergenza respiratoria.',
      contraindications: 'Evitare bendaggi costrittivi del torace (riducono l\'espansione polmonare e aumentano il rischio di atelettasia).',
      typical_exercises: 'Esercizi di respirazione diaframmatica e di espansione costale, tecniche di tosse assistita/controllata, mobilizzazione precoce.',
      progression_criteria: 'Respirazione profonda senza dolore limitante, tosse efficace, assenza di segni di complicanza respiratoria.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-coste-sterno-2',
      condition_name: 'Costocondrite (sindrome di Tietze)',
      goals: 'Riduzione del dolore parasternale, esclusione di cause cardiache, ripresa delle attività senza timore ingiustificato.',
      clinical_tests: 'Palpazione delle giunzioni condro-sternali (riproduce il dolore), esclusione di segni cardiaci/respiratori acuti.',
      red_flags: 'Dolore toracico con irradiazione tipica, dispnea acuta, sudorazione, storia cardiovascolare significativa — escludere causa cardiaca prima di trattare.',
      contraindications: 'Nessuna specifica una volta escluse cause cardiopolmonari.',
      typical_exercises: 'Terapia manuale locale, mobilizzazione toracica, gestione del carico in attività che riproducono il sintomo, rassicurazione clinica.',
      progression_criteria: 'Risoluzione della dolorabilità palpatoria, ripresa completa delle attività quotidiane/sportive.',
      evidence_level: 'low',
    },
    {
      id: 'bone-coste-sterno-3',
      condition_name: 'Disfunzione articolare costo-vertebrale/costo-trasversaria',
      goals: 'Ridurre il dolore toracico meccanico da ipomobilità/blocco articolare costale, ripristinare la meccanica respiratoria e la rotazione toracica.',
      clinical_tests: 'Palpazione segmentale costo-vertebrale, valutazione dell\'espansione toracica asimmetrica, test di mobilità in rotazione del rachide dorsale.',
      red_flags: 'Dolore toracico atipico con sintomi sistemici (dispnea, sudorazione, irradiazione tipica) — escludere causa cardiopolmonare prima di trattare come meccanico.',
      contraindications: 'Cautela con tecniche manipolative ad alta velocità in osteoporosi severa o sospetta frattura costale non consolidata.',
      typical_exercises: 'Mobilizzazione manuale segmentale costo-vertebrale, esercizi di respirazione con enfasi sull\'espansione asimmetrica, mobilità toracica in rotazione/estensione.',
      progression_criteria: 'Normalizzazione dell\'espansione toracica, riduzione del dolore nei movimenti respiratori e di rotazione, ripresa delle attività complete.',
      evidence_level: 'low',
    },
  ],
  'bone-omero': [
    {
      id: 'bone-omero-1',
      condition_name: 'Frattura del collo chirurgico dell\'omero',
      goals: 'Consolidamento sicuro, recupero funzionale della spalla, prevenzione della capsulite adesiva secondaria all\'immobilizzazione.',
      clinical_tests: 'Controllo neurovascolare (nervo ascellare, arteria ascellare), valutazione ROM passivo progressivo, classificazione radiografica (Neer).',
      red_flags: 'Deficit sensitivo della "regimental badge area" (nervo ascellare), assenza di polso distale, frattura esposta.',
      contraindications: 'Evitare mobilizzazione attiva precoce contro resistenza in fratture instabili prima di indicazione medica/chirurgica di carico.',
      typical_exercises: 'Pendolari (Codman) precoci se stabile, mobilizzazione passiva/attiva assistita progressiva, rinforzo di cuffia dei rotatori nelle fasi successive.',
      progression_criteria: 'Consolidamento confermato, ROM funzionale per le ADL, forza sufficiente per attività quotidiane senza compenso scapolare eccessivo.',
      evidence_level: 'high',
    },
    {
      id: 'bone-omero-2',
      condition_name: 'Frattura diafisaria omerale con neuroaprassia del nervo radiale',
      goals: 'Monitoraggio del recupero nervoso, prevenzione di rigidità articolare e retrazioni durante il periodo di attesa del recupero neurologico, mantenimento del trofismo.',
      clinical_tests: 'Valutazione della forza di estensione di polso/dita (mano cadente), sensibilità del dorso della mano, follow-up seriato con EMG se il recupero non progredisce.',
      red_flags: 'Assenza di segni di recupero clinico dopo il periodo atteso — riferire per valutazione chirurgica/neurologica.',
      contraindications: 'Evitare stiramento prolungato dei muscoli estensori denervati; tutore antideclive per prevenire l\'allungamento eccessivo del tendine.',
      typical_exercises: 'Tutore posturale per polso/dita, mobilizzazione passiva per mantenere l\'escursione articolare, stimolazione e rinforzo progressivo non appena riprende attività motoria.',
      progression_criteria: 'Recupero della contrazione volontaria degli estensori, normalizzazione della funzione della mano, consolidamento osseo confermato.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-omero-3',
      condition_name: 'Capsulite adesiva post-immobilizzazione (spalla congelata secondaria)',
      goals: 'Recuperare progressivamente il ROM globale di spalla perso durante l\'immobilizzazione post-frattura, gestire il dolore nelle diverse fasi della condizione.',
      clinical_tests: 'ROM passivo in tutti i piani (limitazione capsulare tipica: extrarotazione più limitata di abduzione, più limitata di intrarotazione), esclusione di causa articolare/tendinea concomitante.',
      red_flags: 'Nessuna specifica; verificare il consolidamento della frattura sottostante prima di mobilizzazioni aggressive.',
      contraindications: 'Evitare mobilizzazioni forzate in fase acuta/dolorosa (fase "freezing"); il tipo e l\'intensità della mobilizzazione vanno adattati alla fase (freezing, frozen, thawing).',
      typical_exercises: 'Mobilizzazione graduale secondo fase (delicata in fase dolorosa, più intensiva in fase di rigidità), stretching capsulare, esercizi pendolari, rinforzo funzionale nella fase di risoluzione.',
      progression_criteria: 'Progressivo recupero del ROM in tutti i piani, riduzione del dolore notturno, ripresa delle attività quotidiane sopra la testa.',
      evidence_level: 'moderate',
    },
  ],
  'bone-radio-ulna': [
    {
      id: 'bone-radio-ulna-1',
      condition_name: 'Frattura di Colles (radio distale)',
      goals: 'Recupero della prono-supinazione e della forza di presa, prevenzione della rigidità di polso e delle dita.',
      clinical_tests: 'ROM di polso/prono-supinazione, forza di presa, valutazione del nervo mediano (rischio di sindrome del tunnel carpale acuta post-frattura).',
      red_flags: 'Parestesie progressive nel territorio del mediano, dolore sproporzionato con gonfiore severo (sospetta sindrome compartimentale acuta dell\'avambraccio).',
      contraindications: 'Evitare carico assiale sul polso prima del consolidamento confermato.',
      typical_exercises: 'Mobilizzazione precoce delle dita, desensibilizzazione, progressione a mobilizzazione di polso e rinforzo di presa una volta consolidata.',
      progression_criteria: 'ROM di polso funzionale, forza di presa comparabile al lato controlaterale, assenza di dolore residuo nelle attività quotidiane.',
      evidence_level: 'high',
    },
    {
      id: 'bone-radio-ulna-2',
      condition_name: 'Frattura di Monteggia/Galeazzi',
      goals: 'Ripristino della stabilità radio-ulnare e della prono-supinazione, prevenzione della rigidità post-chirurgica.',
      clinical_tests: 'Valutazione della stabilità radio-ulnare distale/prossimale, ROM di prono-supinazione, controllo del nervo interosseo posteriore (Monteggia).',
      red_flags: 'Instabilità radio-ulnare persistente dopo trattamento, deficit del nervo interosseo posteriore non in miglioramento.',
      contraindications: 'Evitare prono-supinazione forzata prima del consolidamento/stabilizzazione chirurgica confermata.',
      typical_exercises: 'Mobilizzazione protetta e progressiva della prono-supinazione, rinforzo di avambraccio e polso nelle fasi avanzate.',
      progression_criteria: 'Prono-supinazione simmetrica e non dolorosa, stabilità radio-ulnare clinicamente confermata, ripresa delle attività manuali complete.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-radio-ulna-3',
      condition_name: 'Lesione della membrana interossea (lesione di Essex-Lopresti)',
      goals: 'Riconoscere precocemente l\'instabilità longitudinale radio-ulnare, prevenire la migrazione prossimale del radio, ripristinare stabilità e funzione del gomito/polso.',
      clinical_tests: 'Valutazione della stabilità radio-ulnare distale, dolore al polso associato a frattura della testa radiale, imaging mirato se sospetto clinico (spesso misconosciuta inizialmente).',
      red_flags: 'Dolore al polso persistente dopo frattura/resezione della testa radiale non spiegato da altre cause — sospettare lesione della membrana interossea fino a prova contraria.',
      contraindications: 'Evitare la resezione isolata della testa radiale senza valutare la stabilità della membrana interossea/DRUJ, se il quadro è compatibile con Essex-Lopresti.',
      typical_exercises: 'Gestione post-chirurgica secondo protocollo specifico (spesso protezione prolungata della prono-supinazione), mobilizzazione progressiva sotto stretto controllo della stabilità radio-ulnare.',
      progression_criteria: 'Stabilità radio-ulnare mantenuta nel tempo, assenza di migrazione prossimale del radio ai controlli, funzione di prensione e prono-supinazione soddisfacente.',
      evidence_level: 'low',
    },
  ],
  'bone-mano': [
    {
      id: 'bone-mano-1',
      condition_name: 'Frattura di scafoide',
      goals: 'Prevenzione della pseudoartrosi e della necrosi avascolare, recupero completo di mobilità e forza del polso.',
      clinical_tests: 'Dolorabilità in tabacchiera anatomica, test di compressione assiale del pollice, follow-up radiografico/RM in caso di sospetto clinico con radiografia iniziale negativa.',
      red_flags: 'Dolore persistente in tabacchiera anatomica nonostante radiografia iniziale negativa — trattare come frattura fino a nuova valutazione.',
      contraindications: 'Evitare carico assiale sul polso e movimenti di presa forzata prima del consolidamento confermato.',
      typical_exercises: 'Immobilizzazione secondo indicazione medica, poi mobilizzazione progressiva di polso e rinforzo di presa una volta confermato il consolidamento.',
      progression_criteria: 'Consolidamento radiografico/RM confermato, ROM di polso funzionale, assenza di dolorabilità in tabacchiera anatomica sotto carico.',
      evidence_level: 'high',
    },
    {
      id: 'bone-mano-2',
      condition_name: 'Rizoartrosi (artrosi trapezio-metacarpale)',
      goals: 'Riduzione del dolore in presa/pinza, mantenimento della funzione del pollice nelle attività quotidiane.',
      clinical_tests: 'Grind test, valutazione della forza di pinza e presa, osservazione della deformità a Z in stadi avanzati.',
      red_flags: 'Nessuna red flag specifica; escludere componente infiammatoria sistemica se poliarticolare/simmetrica.',
      contraindications: 'Evitare esercizi di pinza in resistenza durante le riacutizzazioni dolorose.',
      typical_exercises: 'Ortesi di stabilizzazione del pollice, esercizi di mobilità protetta, rinforzo progressivo della muscolatura tenar, adattamento delle attività ad alto carico di pinza.',
      progression_criteria: 'Riduzione del dolore nelle attività quotidiane, forza di pinza funzionale, minor ricorso all\'ortesi.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-mano-3',
      condition_name: 'Dito a scatto (tenosinovite stenosante)',
      goals: 'Eliminare lo scatto/blocco del dito in flessione, ridurre il dolore alla puleggia A1, ripristinare uno scorrimento tendineo fluido.',
      clinical_tests: 'Palpazione della puleggia A1 a livello della testa metacarpale (nodulo dolente), osservazione dello scatto attivo/passivo in flesso-estensione del dito.',
      red_flags: 'Nessuna specifica; considerare screening per condizioni sistemiche associate (es. diabete) se multipli diti/mani coinvolti.',
      contraindications: 'Evitare stretching aggressivo della puleggia in fase acuta fortemente infiammata.',
      typical_exercises: 'Splintaggio notturno dell\'articolazione metacarpo-falangea, esercizi di scorrimento tendineo differenziale, modifica temporanea delle attività di presa ripetuta.',
      progression_criteria: 'Scomparsa dello scatto/blocco, scorrimento tendineo fluido e indolore, ripresa della presa di forza completa.',
      evidence_level: 'moderate',
    },
  ],
  'bone-bacino': [
    {
      id: 'bone-bacino-1',
      condition_name: 'Frattura pelvica da fragilità',
      goals: 'Mobilizzazione precoce sicura, prevenzione delle complicanze da immobilità (tromboembolia, decondizionamento), recupero della deambulazione autonoma.',
      clinical_tests: 'Valutazione del carico tollerato, test di compressione/distrazione pelvica con cautela, screening del dolore a riposo vs sotto carico.',
      red_flags: 'Instabilità emodinamica, dolore severo sproporzionato, sospetta lesione associata (vescicale, vascolare) — a maggior ragione dopo trauma ad alta energia.',
      contraindications: 'Evitare test provocativi pelvici aggressivi in fase acuta senza stabilità confermata.',
      typical_exercises: 'Mobilizzazione progressiva con carico secondo tolleranza, training del cammino con ausili, rinforzo dei muscoli dell\'anca in scarico prima del carico completo.',
      progression_criteria: 'Carico completo indolore, deambulazione autonoma sicura, assenza di dolore a riposo.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-bacino-2',
      condition_name: 'Disfunzione sacro-iliaca',
      goals: 'Riduzione del dolore lombo-pelvico, ripristino del controllo motorio e della stabilità della cintura pelvica.',
      clinical_tests: 'Cluster di provocazione sacro-iliaca (thigh thrust, compressione, distrazione, Gaenslen), test di controllo motorio del bacino.',
      red_flags: 'Dolore notturno ingravescente non meccanico, febbre associata (sospetta sacroileite infettiva/infiammatoria) — approfondire.',
      contraindications: 'Nessuna specifica; cautela con manipolazioni ad alta velocità in gravidanza o osteoporosi severa.',
      typical_exercises: 'Esercizi di stabilizzazione del core e della cintura pelvica, terapia manuale mirata, rieducazione del pattern di carico durante cammino/trasferimenti.',
      progression_criteria: 'Riduzione/scomparsa del dolore nei test di provocazione, ripresa delle attività funzionali senza compenso doloroso.',
      evidence_level: 'low',
    },
    {
      id: 'bone-bacino-3',
      condition_name: 'Pubalgia sportiva (osteite pubica / entesopatia degli adduttori)',
      goals: 'Ridurre il dolore inguinale/pubico da overuse, ripristinare l\'equilibrio di forza tra adduttori e addominali, permettere il ritorno graduale allo sport.',
      clinical_tests: 'Palpazione della sinfisi pubica e delle inserzioni adduttorie, test di adduzione resistita (squeeze test), test di Adductor Squeeze a diversi gradi di flessione d\'anca.',
      red_flags: 'Dolore inguinale acuto con impotenza funzionale immediata (sospetta lesione muscolare acuta grave vs entesopatia cronica) — differenziare per l\'approccio terapeutico.',
      contraindications: 'Evitare cambi di direzione ad alta intensità e sprint massimali prima del recupero della forza e della tolleranza al carico degli adduttori.',
      typical_exercises: 'Rinforzo progressivo degli adduttori (isometrico poi eccentrico, es. Copenhagen adduction exercise), rinforzo del core anteriore, ripresa graduale della corsa e dei cambi di direzione.',
      progression_criteria: 'Forza di adduzione simmetrica, assenza di dolore nei test di provocazione sotto carico sport-specifico, completamento di un protocollo di ritorno allo sport graduato.',
      evidence_level: 'moderate',
    },
  ],
  'bone-sacro': [
    {
      id: 'bone-sacro-1',
      condition_name: 'Coccigodinia',
      goals: 'Riduzione del dolore in posizione seduta, ripristino della tolleranza funzionale alla seduta prolungata.',
      clinical_tests: 'Palpazione esterna/interna del coccige (con consenso e formazione appropriata), valutazione posturale della seduta.',
      red_flags: 'Dolore notturno ingravescente, perdita di peso inspiegata, sanguinamento rettale associato — approfondire per escludere cause non muscoloscheletriche.',
      contraindications: 'Evitare la pressione diretta prolungata sul coccige durante il trattamento e nella vita quotidiana (seduta prolungata su superfici rigide).',
      typical_exercises: 'Cuscino a ciambella/a cuneo per scaricare il coccige, terapia manuale del pavimento pelvico se indicata, correzione posturale della seduta.',
      progression_criteria: 'Tolleranza alla seduta prolungata senza dolore, ripresa delle attività quotidiane complete.',
      evidence_level: 'low',
    },
    {
      id: 'bone-sacro-2',
      condition_name: 'Frattura sacrale da insufficienza',
      goals: 'Gestione del dolore, mobilizzazione progressiva secondo tolleranza, prevenzione del decondizionamento nell\'anziano.',
      clinical_tests: 'Sospetto clinico in presenza di lombalgia bassa persistente nell\'anziano senza trauma significativo; conferma per imaging (RM più sensibile della radiografia standard).',
      red_flags: 'Deficit neurologico agli arti inferiori o sfinterico (sospetta compromissione delle radici sacrali) — riferire con urgenza.',
      contraindications: 'Evitare carico assiale elevato e manipolazioni dirette in fase acuta prima della stabilizzazione clinica.',
      typical_exercises: 'Mobilizzazione protetta e progressiva, training del cammino con ausili secondo tolleranza al dolore, gestione della postura seduta/sdraiata.',
      progression_criteria: 'Riduzione del dolore a riposo e sotto carico, ripresa della deambulazione funzionale.',
      evidence_level: 'low',
    },
    {
      id: 'bone-sacro-3',
      condition_name: 'Sacroileite infiammatoria (spondiloartrite assiale)',
      goals: 'Distinguere il dolore infiammatorio da quello meccanico, ottimizzare la funzione e la mobilità del rachide/bacino in un percorso integrato con la terapia medica.',
      clinical_tests: 'Caratteristiche del dolore infiammatorio (rigidità mattutina >30min, miglioramento con il movimento, dolore notturno che migliora alzandosi), cluster di provocazione sacro-iliaca, storia familiare/associazioni extra-articolari.',
      red_flags: 'Sintomi sistemici associati (uveite, psoriasi, malattie infiammatorie intestinali), rigidità progressiva ingravescente non responsiva al movimento — riferire per valutazione reumatologica.',
      contraindications: 'Nessuna specifica per l\'esercizio; il trattamento farmacologico di base è di competenza reumatologica e la fisioterapia è complementare, non sostitutiva.',
      typical_exercises: 'Programma di esercizio regolare e continuativo (mobilità rachide, rinforzo posturale, attività aerobica), fondamentale nella gestione a lungo termine della spondiloartrite assiale.',
      progression_criteria: 'Riduzione della rigidità mattutina, mantenimento della mobilità rachidea nel tempo, aderenza a un programma di esercizio regolare.',
      evidence_level: 'high',
    },
  ],
  'bone-femore': [
    {
      id: 'bone-femore-1',
      condition_name: 'Frattura del collo femorale',
      goals: 'Mobilizzazione precoce post-chirurgica, prevenzione delle complicanze da immobilità, recupero massimo dell\'autonomia funzionale pregressa.',
      clinical_tests: 'Valutazione del carico secondo indicazione chirurgica, forza degli abduttori d\'anca, qualità e sicurezza del pattern di cammino con ausili.',
      red_flags: 'Segni di infezione post-chirurgica, dolore improvviso con impotenza funzionale (sospetta mobilizzazione dell\'impianto/nuova frattura periprotesica).',
      contraindications: 'Rispettare le restrizioni di carico e di movimento indicate dal chirurgo (es. evitare extrarotazione/adduzione eccessiva secondo l\'approccio chirurgico).',
      typical_exercises: 'Mobilizzazione e verticalizzazione precoce (entro 24-48h se possibile), rinforzo progressivo di quadricipite e abduttori d\'anca, training del cammino e dell\'equilibrio.',
      progression_criteria: 'Carico completo secondo indicazione, deambulazione sicura con o senza ausilio, ritorno al livello di autonomia pre-frattura quando possibile.',
      evidence_level: 'high',
    },
    {
      id: 'bone-femore-2',
      condition_name: 'Frattura diafisaria femorale (post-chiodo endomidollare)',
      goals: 'Recupero di ROM di anca e ginocchio, rinforzo muscolare progressivo, ripristino del pattern di cammino fisiologico.',
      clinical_tests: 'ROM attivo/passivo di anca e ginocchio, forza del quadricipite, valutazione della simmetria del passo.',
      red_flags: 'Dolore acuto ingravescente con gonfiore severo della coscia (sospetta sindrome compartimentale), segni di trombosi venosa profonda.',
      contraindications: 'Rispettare il carico protetto secondo indicazione chirurgica fino a segni di consolidamento.',
      typical_exercises: 'Mobilizzazione precoce di anca/ginocchio, rinforzo isometrico poi progressivamente concentrico/eccentrico del quadricipite, training del cammino progressivo.',
      progression_criteria: 'Consolidamento radiografico, ROM funzionale, forza e pattern di cammino simmetrici.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-femore-3',
      condition_name: 'Sindrome del dolore trocanterico laterale (tendinopatia glutea)',
      goals: 'Ridurre il dolore laterale d\'anca a livello del grande trocantere, ripristinare la capacità di carico in decubito laterale e durante il cammino/scale.',
      clinical_tests: 'Palpazione del grande trocantere, test di carico monopodalico prolungato (single leg stance test), test di forza degli abduttori d\'anca (medio gluteo), FABER per differenziale intra-articolare.',
      red_flags: 'Nessuna specifica; escludere causa infettiva/infiammatoria se febbre o segni sistemici associati.',
      contraindications: 'Evitare lo stretching diretto in adduzione/compressione del tendine gluteo sul trocantere in fase acuta (peggiora la compressione tendinea).',
      typical_exercises: 'Rinforzo progressivo del medio/piccolo gluteo con carico graduale (isometrico poi isotonico), modifica temporanea delle posizioni di carico compressivo (decubito laterale diretto, seduta a gambe accavallate), educazione al carico.',
      progression_criteria: 'Tolleranza al decubito laterale sul lato coinvolto, forza degli abduttori simmetrica, assenza di dolore nel cammino prolungato e sulle scale.',
      evidence_level: 'moderate',
    },
  ],
  'bone-tibia-perone': [
    {
      id: 'bone-tibia-perone-1',
      condition_name: 'Frattura tibiale (gestione post-chirurgica)',
      goals: 'Prevenzione della sindrome compartimentale nella fase acuta, recupero progressivo del carico e della funzione di cammino.',
      clinical_tests: 'Valutazione del dolore sproporzionato/tensione dei compartimenti nella fase acuta, ROM di ginocchio/caviglia, progressione del carico secondo indicazione.',
      red_flags: 'Dolore sproporzionato e ingravescente, parestesie distali, pallore/assenza di polso (sindrome compartimentale acuta) — emergenza chirurgica.',
      contraindications: 'Rispettare rigorosamente il carico protetto indicato fino a segni di consolidamento.',
      typical_exercises: 'Mobilizzazione precoce di ginocchio e caviglia entro i limiti consentiti, rinforzo progressivo, training del cammino con ausili e progressione del carico.',
      progression_criteria: 'Consolidamento confermato, carico completo indolore, pattern di cammino simmetrico.',
      evidence_level: 'high',
    },
    {
      id: 'bone-tibia-perone-2',
      condition_name: 'Frattura malleolare (Weber)',
      goals: 'Recupero di mobilità di caviglia, forza e propriocezione, prevenzione dell\'instabilità cronica.',
      clinical_tests: 'ROM di caviglia, forza dei muscoli peronieri, test di stabilità (in fase avanzata secondo tolleranza), squat monopodalico per la funzione globale.',
      red_flags: 'Segni di instabilità della sindesmosi persistente, dolore acuto ingravescente post-chirurgico (sospetta complicanza).',
      contraindications: 'Rispettare il carico protetto secondo indicazione fino al consolidamento/stabilità confermata della sindesmosi.',
      typical_exercises: 'Mobilizzazione progressiva di caviglia, rinforzo dei peronieri, training propriocettivo su superfici instabili nelle fasi avanzate.',
      progression_criteria: 'ROM di caviglia funzionale, forza simmetrica, buona performance ai test propriocettivi prima del ritorno allo sport/lavoro.',
      evidence_level: 'high',
    },
    {
      id: 'bone-tibia-perone-3',
      condition_name: 'Sindrome compartimentale cronica da sforzo',
      goals: 'Ridurre il dolore da overuse indotto dall\'aumento di pressione intracompartimentale durante l\'esercizio, permettere il ritorno alla corsa/attività senza recidiva.',
      clinical_tests: 'Anamnesi tipica (dolore che compare a un tempo/intensità di sforzo prevedibile e si risolve rapidamente a riposo), misurazione della pressione intracompartimentale pre/post sforzo (gold standard diagnostico).',
      red_flags: 'Dolore che non si risolve a riposo, progressivo deficit sensitivo/motorio (sospetta evoluzione verso sindrome compartimentale acuta) — differenziare con urgenza dalla forma cronica.',
      contraindications: 'Evitare la prosecuzione dell\'attività ad alta intensità che riproduce sistematicamente i sintomi senza prima modificare volume/tecnica di carico.',
      typical_exercises: 'Modifica della tecnica di corsa (cadenza, pattern di appoggio), gestione del carico di allenamento (riduzione temporanea e ripresa graduale), rinforzo della muscolatura della gamba.',
      progression_criteria: 'Aumento della soglia di sforzo prima della comparsa dei sintomi, ripresa progressiva del volume di allenamento precedente senza recidiva.',
      evidence_level: 'low',
    },
  ],
  'bone-piede': [
    {
      id: 'bone-piede-1',
      condition_name: 'Frattura da stress metatarsale',
      goals: 'Gestione del carico per permettere la guarigione ossea, ripresa graduale dell\'attività senza recidiva.',
      clinical_tests: 'Palpazione mirata del metatarso, test di carico/salto monopodalico (se tollerato), valutazione dei fattori di carico allenante.',
      red_flags: 'Dolore che persiste a riposo e peggiora progressivamente nonostante scarico (possibile evoluzione a frattura completa/mancata unione).',
      contraindications: 'Evitare la ripresa immediata di corsa/salti ad alto impatto prima della risoluzione della sintomatologia a riposo.',
      typical_exercises: 'Scarico relativo iniziale, ripresa progressiva del carico secondo tolleranza al dolore, correzione dei fattori di carico allenante (volume, superficie, calzatura).',
      progression_criteria: 'Assenza di dolore a riposo e alla palpazione, tolleranza progressiva al carico da impatto, ripresa graduale dell\'attività sportiva.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-piede-2',
      condition_name: 'Frattura del collo dell\'astragalo',
      goals: 'Monitoraggio del rischio di necrosi avascolare, recupero progressivo di carico e mobilità della caviglia/sottoastragalica.',
      clinical_tests: 'ROM di caviglia e sottoastragalica, follow-up per segni radiografici di necrosi avascolare (segno di Hawkins), valutazione del carico tollerato.',
      red_flags: 'Segni clinici/radiografici di necrosi avascolare, dolore persistente sproporzionato al consolidamento atteso — riferire per rivalutazione ortopedica.',
      contraindications: 'Rispettare rigorosamente le restrizioni di carico indicate, dato l\'alto rischio di complicanze vascolari di questo osso.',
      typical_exercises: 'Mobilizzazione protetta secondo tolleranza, progressione del carico molto graduale e guidata da indicazione medica/imaging, rinforzo del tricipite surale nelle fasi avanzate.',
      progression_criteria: 'Assenza di segni di necrosi avascolare, consolidamento confermato, carico completo funzionale.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-piede-3',
      condition_name: 'Sindrome del tunnel tarsale',
      goals: 'Ridurre la compressione del nervo tibiale posteriore dietro il malleolo mediale, risolvere parestesie/dolore plantare, ripristinare il cammino senza sintomi neurologici.',
      clinical_tests: 'Segno di Tinel al tunnel tarsale, test di dorsiflessione-eversione, valutazione della sensibilità plantare nei territori dei nervi plantari mediale/laterale.',
      red_flags: 'Deficit motorio progressivo dei muscoli intrinseci del piede, massa palpabile nel tunnel tarsale (sospetta lesione occupante spazio) — approfondire con imaging.',
      contraindications: 'Evitare calzature/ortesi che aumentano la compressione nel tunnel tarsale (es. eccessivo supporto rigido mediale mal adattato).',
      typical_exercises: 'Mobilizzazione neurale del nervo tibiale, correzione degli eventuali fattori biomeccanici di sovraccarico (es. eccessiva pronazione), ortesi plantari su misura se indicate.',
      progression_criteria: 'Risoluzione delle parestesie plantari, normalizzazione della sensibilità, ripresa del cammino/attività sportiva senza sintomi.',
      evidence_level: 'low',
    },
  ],
  'bone-cervicale': [
    {
      id: 'bone-cervicale-1',
      condition_name: 'Frattura del dente dell\'epistrofeo (C2)',
      goals: 'Gestione secondo il percorso medico/chirurgico indicato; una volta stabilizzata, recupero progressivo e sicuro di mobilità e controllo neuromuscolare cervicale.',
      clinical_tests: 'Screening di instabilità cervicale alta e di segni di compromissione midollare prima di qualsiasi intervento fisioterapico attivo.',
      red_flags: 'Segni di mielopatia (parestesie diffuse, alterazione dell\'andatura, iperreflessia), instabilità non consolidata — controindicazione assoluta a mobilizzazione/manipolazione fino a consolidamento/stabilizzazione confermata.',
      contraindications: 'Manipolazione e mobilizzazione ad alta velocità del rachide cervicale alto controindicate fino a piena stabilità ossea confermata dal team medico.',
      typical_exercises: 'Nella fase post-stabilizzazione: esercizi di controllo motorio cervicale a basso carico, mobilizzazione progressiva secondo indicazione medica, rieducazione posturale.',
      progression_criteria: 'Stabilità confermata dal team medico, ROM cervicale progressivo senza segni neurologici, controllo neuromuscolare funzionale.',
      evidence_level: 'low',
    },
    {
      id: 'bone-cervicale-2',
      condition_name: 'Radicolopatia cervicale da stenosi foraminale',
      goals: 'Riduzione del dolore irradiato e delle parestesie, recupero della funzione dell\'arto superiore, ottimizzazione del movimento cervicale.',
      clinical_tests: 'Spurling test, test di trazione cervicale, valutazione dermatomerica/miotomerica dell\'arto superiore, test di tensione neurale (ULNT).',
      red_flags: 'Deficit motorio progressivo, segni di mielopatia associata, sindrome di Horner o altri segni neurologici atipici — approfondire con imaging.',
      contraindications: 'Cautela con posizioni di estensione/rotazione cervicale sostenute che riproducono i sintomi radicolari in fase acuta.',
      typical_exercises: 'Esercizi di decompressione posizionale, mobilizzazione neurale graduale, rinforzo della muscolatura cervicale profonda, educazione posturale.',
      progression_criteria: 'Riduzione/centralizzazione del dolore irradiato, recupero della forza nei miotomi coinvolti, ripresa delle attività funzionali.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-cervicale-3',
      condition_name: 'Mielopatia cervicale spondilotica',
      goals: 'Riconoscere precocemente i segni di compromissione midollare, ottimizzare la funzione residua e la sicurezza nella deambulazione, orientare tempestivamente verso valutazione chirurgica se indicata.',
      clinical_tests: 'Segno di Hoffmann, iperreflessia, clonus, valutazione della destrezza manuale fine (es. grip-and-release test), valutazione dell\'andatura per instabilità/atassia.',
      red_flags: 'Deterioramento neurologico progressivo (peggioramento della destrezza manuale, dell\'andatura, disturbi sfinterici) — riferire con urgenza per valutazione chirurgica, poiché la mielopatia stabilita risponde limitatamente al solo trattamento conservativo.',
      contraindications: 'Manipolazione cervicale ad alta velocità controindicata in presenza di segni/sospetto di mielopatia.',
      typical_exercises: 'Nei casi lievi/non chirurgici: esercizi di stabilizzazione cervicale a basso carico, educazione posturale, monitoraggio clinico seriato della progressione dei segni neurologici.',
      progression_criteria: 'Stabilità o miglioramento dei segni neurologici nel follow-up, mantenimento della sicurezza funzionale nella deambulazione e nelle attività quotidiane.',
      evidence_level: 'low',
    },
  ],
  'bone-dorsale': [
    {
      id: 'bone-dorsale-1',
      condition_name: 'Frattura vertebrale da compressione osteoporotica',
      goals: 'Gestione del dolore acuto, prevenzione dell\'accentuazione della cifosi, mantenimento della funzione respiratoria e dell\'autonomia.',
      clinical_tests: 'Valutazione della postura in cifosi, palpazione dei processi spinosi, screening del dolore con i cambi di posizione (supino-seduto-stazione eretta).',
      red_flags: 'Dolore notturno ingravescente non meccanico, deficit neurologico agli arti inferiori, storia di neoplasia (frattura patologica da sospettare).',
      contraindications: 'Evitare flessione del tronco sotto carico e manipolazioni dirette sul livello fratturato in fase acuta.',
      typical_exercises: 'Esercizi di estensione toracica leggera secondo tolleranza, rinforzo posturale, training respiratorio, educazione alla gestione dei carichi quotidiani.',
      progression_criteria: 'Riduzione del dolore nei cambi di posizione, mantenimento/miglioramento della postura, ripresa delle attività quotidiane sicure.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-dorsale-2',
      condition_name: 'Scoliosi idiopatica dell\'adolescente (curva dorsale)',
      goals: 'Monitoraggio della progressione della curva, mantenimento/miglioramento della funzione respiratoria e della simmetria posturale.',
      clinical_tests: 'Test di Adams (forward bend), misurazione della gobba costale, follow-up radiografico dell\'angolo di Cobb secondo indicazione medica.',
      red_flags: 'Progressione rapida della curva, dolore significativo (atipico nella scoliosi idiopatica non complicata, da approfondire), segni neurologici associati.',
      contraindications: 'Nessuna specifica per l\'esercizio terapeutico; il bracing, se indicato, segue protocolli medici dedicati.',
      typical_exercises: 'Esercizi specifici per la scoliosi (es. approccio Schroth), rinforzo posturale asimmetrico mirato, training respiratorio.',
      progression_criteria: 'Stabilità o riduzione dell\'angolo di Cobb nel follow-up, miglioramento della simmetria posturale e della funzione respiratoria.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-dorsale-3',
      condition_name: 'Morbo di Scheuermann (cifosi giovanile)',
      goals: 'Ottimizzare la postura e la mobilità toracica durante la fase di crescita, prevenire l\'accentuazione della cifosi strutturale, gestire il dolore associato.',
      clinical_tests: 'Test di Adams con valutazione del profilo sagittale, misurazione della cifosi toracica, radiografia per il rilievo dei tipici corpi vertebrali a cuneo/irregolarità dei piatti (noduli di Schmorl).',
      red_flags: 'Dolore notturno severo, deficit neurologico associato (raro nella forma tipica, da approfondire se presente).',
      contraindications: 'Evitare carichi assiali eccessivi ripetuti (es. sollevamento pesi ad alto carico) durante le fasi di rapida crescita in presenza di cifosi marcata sintomatica.',
      typical_exercises: 'Esercizi di estensione toracica ed estensori spinali, stretching della catena anteriore (pettorali, ileopsoas), educazione posturale, monitoraggio della progressione durante la crescita.',
      progression_criteria: 'Stabilizzazione o miglioramento del profilo posturale, riduzione del dolore, mantenimento della partecipazione alle attività fisiche.',
      evidence_level: 'low',
    },
  ],
  'bone-lombare': [
    {
      id: 'bone-lombare-1',
      condition_name: 'Frattura da compressione vertebrale lombare',
      goals: 'Gestione del dolore, prevenzione del decondizionamento, ripristino della capacità di svolgere le attività quotidiane in sicurezza.',
      clinical_tests: 'Palpazione dei processi spinosi, valutazione del dolore nei cambi di posizione e nel carico assiale, screening di deficit neurologico.',
      red_flags: 'Deficit neurologico agli arti inferiori, disfunzione sfinterica, storia di neoplasia o trauma significativo (frattura instabile) — riferire con urgenza.',
      contraindications: 'Evitare flessione lombare sotto carico e sollevamento pesi in fase acuta.',
      typical_exercises: 'Mobilizzazione precoce secondo tolleranza, esercizi di stabilizzazione del core a basso carico, educazione all\'ergonomia dei movimenti quotidiani.',
      progression_criteria: 'Riduzione del dolore nei trasferimenti e nel carico, ripresa delle attività quotidiane, assenza di segni neurologici.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-lombare-2',
      condition_name: 'Spondilolistesi istmica L5-S1',
      goals: 'Stabilizzazione funzionale del segmento, riduzione del dolore meccanico, ottimizzazione del controllo motorio lombo-pelvico.',
      clinical_tests: 'Test di instabilità segmentale (prone instability test), valutazione del controllo motorio lombare, screening neurologico se sintomi radicolari associati.',
      red_flags: 'Deficit neurologico progressivo, sintomi radicolari bilaterali con disfunzione sfinterica (sospetta stenosi severa associata) — approfondire.',
      contraindications: 'Cautela con iperestensione lombare ripetuta sotto carico (es. alcuni gesti ginnici/sportivi) in fase sintomatica.',
      typical_exercises: 'Esercizi di stabilizzazione segmentale (multifido, trasverso dell\'addome), rinforzo del core in posizione neutra, educazione al controllo del movimento lombare.',
      progression_criteria: 'Riduzione del dolore meccanico, miglioramento del controllo motorio ai test specifici, ripresa delle attività funzionali/sportive.',
      evidence_level: 'moderate',
    },
    {
      id: 'bone-lombare-3',
      condition_name: 'Stenosi del canale lombare degenerativa',
      goals: 'Aumentare la distanza/tempo di cammino tollerato, ridurre la claudicatio neurogena, ottimizzare la postura in flessione funzionale per le attività quotidiane.',
      clinical_tests: 'Test del cammino su tapis roulant in estensione vs flessione (bicycle test di van Gelderen), valutazione della tolleranza posizionale (peggiora in estensione/stazione eretta, migliora in flessione/seduta), screening neurologico degli arti inferiori.',
      red_flags: 'Sindrome della cauda equina (deficit sfinterico, anestesia a sella, deficit bilaterale progressivo) — emergenza chirurgica da escludere sempre.',
      contraindications: 'Evitare protocolli di esercizio basati su estensione lombare sostenuta, che tipicamente riproducono/aggravano la claudicatio neurogena.',
      typical_exercises: 'Esercizi di stabilizzazione in flessione lombare relativa (flexion-biased), cyclette/ellittica in postura flessa come alternativa a basso impatto al cammino, rinforzo del core in posizione neutra-flessa.',
      progression_criteria: 'Aumento della distanza di cammino tollerata prima della comparsa dei sintomi, riduzione della necessità di fermarsi/flettersi in avanti durante il cammino.',
      evidence_level: 'moderate',
    },
  ],
};

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const { data: zone, error: zoneErr } = await adminSupabase
      .from('body_zones')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (zoneErr || !zone) {
      if (BONE_NAMES[slug]) {
        return NextResponse.json({
          zone: { id: slug, name: BONE_NAMES[slug], slug },
          exercises: [],
          totalExercises: 0,
          conditions: BONE_CONDITIONS[slug] || [],
          plan: 'free',
        });
      }
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let plan = 'free';
    if (user) {
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();
      if (profile?.plan) plan = profile.plan;
    }

    const { data: itemLinks } = await adminSupabase
      .from('body_zone_items')
      .select('item_id')
      .eq('zone_id', zone.id);

    const itemIds = (itemLinks || []).map((l) => l.item_id);

    let exercises: any[] = [];
    if (itemIds.length > 0) {
      const { data: items } = await adminSupabase
        .from('library_items')
        .select('id, title, level, body_position, equipment, image_url, goal')
        .in('id', itemIds);
      exercises = items || [];
    }

    const exerciseLimit = plan === 'free' ? 2 : 6;
    const featuredExercises = exercises.slice(0, exerciseLimit);

    const { data: conditionLinks } = await adminSupabase
      .from('body_zone_conditions')
      .select('condition_id')
      .eq('zone_id', zone.id);

    const conditionIds = (conditionLinks || []).map((l) => l.condition_id);

    let conditions: any[] = [];
    if (conditionIds.length > 0) {
      const { data: conds } = await adminSupabase
        .from('knowledge_base')
        .select(
          'id, condition_name, goals, clinical_tests, red_flags, contraindications, typical_exercises, progression_criteria, evidence_level, return_to_activity_criteria, outcome_measures, source, source_date'
        )
        .in('id', conditionIds);
      conditions = conds || [];
    }

    return NextResponse.json({
      zone,
      exercises: featuredExercises,
      totalExercises: exercises.length,
      conditions,
      plan,
    });
  } catch (err) {
    console.error('body-map zone error:', err);
    return NextResponse.json({ error: 'Failed to load zone' }, { status: 500 });
  }
}