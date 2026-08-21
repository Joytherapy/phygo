require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CONDITIONS = [
  {
    condition_name: 'Ictus ischemico (fase acuta/subacuta)',
    condition_keywords: 'ictus ischemico,stroke ischemico,infarto cerebrale,ictus acuto,fase acuta ictus',
    goals: 'Prevenire complicanze secondarie (contratture, decubiti, tromboembolismo venoso), avviare la mobilizzazione precoce non appena il paziente è clinicamente stabile, e impostare un percorso riabilitativo personalizzato in base al deficit funzionale predominante (motorio, del linguaggio, cognitivo, deglutitorio).',
    progression_criteria: 'La progressione dell\'intensità riabilitativa dipende dalla stabilità clinica, dal recupero neurologico spontaneo nelle prime settimane e dalla tolleranza del paziente al carico di terapia; l\'aumento dell\'intensità terapeutica è generalmente associato a outcome funzionali migliori.',
    return_to_activity_criteria: 'Il ritorno alle attività quotidiane è guidato dal recupero dell\'autonomia funzionale (valutata con scale come la Functional Independence Measure) più che da un timing fisso; il periodo di massimo recupero spontaneo si colloca solitamente nei primi mesi post-evento.',
    outcome_measures: 'National Institutes of Health Stroke Scale (NIHSS), Functional Independence Measure (FIM), Fugl-Meyer Assessment, Berg Balance Scale, 10-Meter Walk Test.',
    clinical_tests: 'Valutazione del tono muscolare (scala di Ashworth modificata), test di forza segmentaria, valutazione della deglutizione (screening disfagia), valutazione del neglect spaziale, valutazione cognitiva di base.',
    red_flags: 'Peggioramento neurologico acuto (possibile estensione della lesione o trasformazione emorragica), segni di trombosi venosa profonda, difficoltà di deglutizione non riconosciuta (rischio di aspirazione), instabilità cardiovascolare durante la mobilizzazione.',
    typical_exercises: 'Mobilizzazione passiva/attiva precoce, esercizi di controllo del tronco, training del cammino con supporto progressivamente ridotto, esercizi task-specific per l\'arto superiore, terapia dello specchio o constraint-induced movement therapy nei casi selezionati.',
    contraindications: 'Instabilità emodinamica, ipertensione non controllata, segni di deterioramento neurologico acuto in corso — in questi casi la mobilizzazione va sospesa e rivalutata dal team medico.',
    source: 'VA/DoD Clinical Practice Guideline for the Management of Stroke Rehabilitation',
    source_date: '2024',
    evidence_level: 'high',
  },
  {
    condition_name: 'Ictus emorragico (emorragia cerebrale)',
    condition_keywords: 'ictus emorragico,emorragia cerebrale,emorragia intraparenchimale,stroke emorragico',
    goals: 'Analoghi all\'ictus ischemico, con particolare attenzione al monitoraggio della pressione intracranica nella fase acuta e a un approccio riabilitativo che tenga conto di una fase di stabilizzazione clinica generalmente più prolungata.',
    progression_criteria: 'La mobilizzazione precoce va bilanciata con il rischio di risanguinamento nella fase acuta; la progressione segue la stabilizzazione radiologica e clinica confermata dal team neurologico.',
    return_to_activity_criteria: 'Il recupero funzionale può essere più lento rispetto all\'ictus ischemico nella fase iniziale, ma con prognosi a lungo termine potenzialmente favorevole nei sopravvissuti alla fase acuta, in base a sede e volume dell\'emorragia.',
    outcome_measures: 'NIHSS, Glasgow Coma Scale (fase acuta), Functional Independence Measure, Modified Rankin Scale.',
    clinical_tests: 'Stessi strumenti di valutazione motoria e funzionale dell\'ictus ischemico, con monitoraggio più stretto dei segni di ipertensione endocranica nella fase acuta.',
    red_flags: 'Cefalea improvvisa e severa, deterioramento dello stato di coscienza, anisocoria, vomito a getto — segni di possibile aumento della pressione intracranica che richiedono valutazione medica immediata.',
    typical_exercises: 'Analoghi all\'ictus ischemico, con timing di avvio della mobilizzazione attiva stabilito caso per caso dal team medico in base alla stabilità dell\'emorragia.',
    contraindications: 'Fase acuta con instabilità neurologica, mancata autorizzazione medica alla mobilizzazione nei protocolli post-emorragici.',
    source: 'VA/DoD Clinical Practice Guideline for the Management of Stroke Rehabilitation',
    source_date: '2024',
    evidence_level: 'high',
  },
  {
    condition_name: 'Attacco ischemico transitorio (TIA)',
    condition_keywords: 'TIA,attacco ischemico transitorio,mini ictus,ischemia cerebrale transitoria',
    goals: 'Educazione del paziente sulla gestione dei fattori di rischio cerebrovascolare (pressione arteriosa, glicemia, fumo, attività fisica), poiché il TIA è un campanello d\'allarme per un possibile ictus futuro.',
    progression_criteria: 'Non richiede tipicamente un percorso riabilitativo motorio intensivo, essendo per definizione un deficit reversibile senza infarto stabilito; l\'attenzione clinica si sposta sulla prevenzione secondaria.',
    return_to_activity_criteria: 'La ripresa delle attività quotidiane è generalmente rapida, ma va sempre accompagnata da una valutazione medica tempestiva per escludere un ictus in evoluzione.',
    outcome_measures: 'ABCD2 score (stratificazione del rischio di ictus successivo), valutazione neurologica di base.',
    clinical_tests: 'Esame neurologico completo per escludere deficit residui, valutazione cardiovascolare.',
    red_flags: 'Qualsiasi sintomo neurologico focale, anche se transitorio, richiede valutazione medica urgente: il TIA è un\'emergenza clinica per il rischio elevato di ictus nei giorni successivi.',
    typical_exercises: 'Programma di attività fisica aerobica regolare come parte della prevenzione secondaria cardiovascolare, una volta esclusa patologia acuta in corso.',
    contraindications: 'Nessuna specifica per l\'esercizio una volta esclusa la fase acuta, salvo comorbidità cardiovascolari da gestire individualmente.',
    source: 'Linee guida internazionali sulla gestione del TIA e prevenzione secondaria dell\'ictus',
    source_date: '2023',
    evidence_level: 'high',
  },
  {
    condition_name: 'Malattia di Parkinson',
    condition_keywords: 'parkinson,malattia di parkinson,morbo di parkinson,parkinsonismo idiopatico',
    goals: 'Mantenere la mobilità funzionale, contrastare la progressiva riduzione dell\'ampiezza del movimento (bradicinesia), migliorare l\'equilibrio per ridurre il rischio di caduta, e preservare l\'autonomia nelle attività quotidiane il più a lungo possibile.',
    progression_criteria: 'L\'intensità e il tipo di esercizio si adattano allo stadio di malattia (scala di Hoehn e Yahr) e alla risposta alla terapia farmacologica dopaminergica, con particolare attenzione alle fluttuazioni motorie (fenomeno on-off).',
    return_to_activity_criteria: 'Non applicabile come "ritorno" a uno stato precedente, essendo una condizione degenerativa cronica; l\'obiettivo è il mantenimento del massimo livello funzionale possibile nel tempo.',
    outcome_measures: 'Unified Parkinson\'s Disease Rating Scale (UPDRS/MDS-UPDRS), Timed Up and Go, Berg Balance Scale, Parkinson\'s Disease Questionnaire (PDQ-39).',
    clinical_tests: 'Valutazione della rigidità a ruota dentata, test di bradicinesia (movimenti alternati rapidi), valutazione della postura e del freezing del cammino, test di stabilità posturale (pull test).',
    red_flags: 'Cadute frequenti e precoci nella malattia (possibile segno di parkinsonismo atipico piuttosto che Parkinson idiopatico), disfagia severa, ipotensione ortostatica sintomatica, rapido deterioramento cognitivo.',
    typical_exercises: 'Esercizi ad ampiezza di movimento amplificata (es. metodo LSVT BIG), training del cammino con cue esterni (visivi/uditivi) per contrastare il freezing, esercizi di equilibrio multidirezionale, attività aerobica regolare.',
    contraindications: 'Attenzione a esercizi che richiedono rapidi cambi di direzione in fase di freezing attivo; monitorare la pressione arteriosa in caso di ipotensione ortostatica associata alla terapia dopaminergica.',
    source: 'MDS Clinical Diagnostic Criteria for Parkinson\'s Disease; linee guida internazionali di fisioterapia nel Parkinson',
    source_date: '2023',
    evidence_level: 'high',
  },
  {
    condition_name: 'Malattia di Alzheimer',
    condition_keywords: 'alzheimer,malattia di alzheimer,demenza di alzheimer,decadimento cognitivo alzheimer',
    goals: 'Mantenere la funzione fisica e ridurre il rischio di caduta, rallentare il decondizionamento fisico associato alla progressione della malattia, e supportare l\'autonomia funzionale residua tramite un approccio adattato alle capacità cognitive del paziente.',
    progression_criteria: 'Il programma si adatta allo stadio cognitivo (lieve, moderato, severo), privilegiando istruzioni semplici, ripetitive e un ambiente strutturato e prevedibile.',
    return_to_activity_criteria: 'Non applicabile come recupero; l\'obiettivo è il mantenimento funzionale, con outcome misurati in termini di stabilizzazione del declino più che di miglioramento.',
    outcome_measures: 'Mini-Mental State Examination (MMSE) — per il quadro cognitivo generale, non specifico fisioterapico —, Timed Up and Go, scale di valutazione delle attività della vita quotidiana (ADL/IADL).',
    clinical_tests: 'Valutazione dell\'equilibrio e del rischio di caduta, valutazione della capacità di seguire istruzioni motorie semplici, osservazione del pattern del cammino.',
    red_flags: 'Cambiamento comportamentale acuto o rapido peggioramento cognitivo (possibile delirium sovrapposto, da indagare prima di attribuirlo alla progressione della demenza), cadute ricorrenti, rifiuto improvviso del cibo o dei liquidi.',
    typical_exercises: 'Attività fisica strutturata e ripetitiva (cammino, esercizi funzionali semplici), attività con componente musicale o ritmica (spesso ben tollerate), esercizi di equilibrio in ambiente sicuro e familiare.',
    contraindications: 'Evitare ambienti sovrastimolanti o cambi di routine improvvisi durante le sedute; adattare sempre la comunicazione al livello cognitivo del paziente.',
    source: 'NIA-AA Research Framework for Alzheimer\'s Disease; linee guida internazionali su attività fisica e demenza',
    source_date: '2023',
    evidence_level: 'high',
  },
  {
    condition_name: 'Demenza vascolare',
    condition_keywords: 'demenza vascolare,demenza multinfartuale,decadimento cognitivo vascolare',
    goals: 'Analoghi alla demenza di Alzheimer, con enfasi aggiuntiva sulla gestione dei fattori di rischio cardiovascolare per rallentare la progressione delle lesioni ischemiche cerebrali sottostanti.',
    progression_criteria: 'Il decorso è spesso a gradini (peggioramenti step-wise associati a nuovi eventi ischemici) piuttosto che lineare come nell\'Alzheimer, con implicazioni sulla pianificazione riabilitativa.',
    return_to_activity_criteria: 'Come per la demenza di Alzheimer, l\'obiettivo è il mantenimento funzionale piuttosto che il recupero completo.',
    outcome_measures: 'MMSE o Montreal Cognitive Assessment (MoCA) — quest\'ultimo più sensibile ai deficit esecutivi tipici della componente vascolare —, scale ADL/IADL, Timed Up and Go.',
    clinical_tests: 'Valutazione dell\'andatura (spesso più compromessa precocemente rispetto all\'Alzheimer puro), valutazione delle funzioni esecutive, screening del rischio di caduta.',
    red_flags: 'Peggioramento acuto a gradino (possibile nuovo evento ischemico in corso), segni neurologici focali di nuova insorgenza.',
    typical_exercises: 'Programma di attività fisica regolare orientato anche alla prevenzione cardiovascolare secondaria, esercizi di equilibrio e cammino adattati al pattern motorio specifico.',
    contraindications: 'Gestione attenta dei fattori di rischio cardiovascolare durante l\'esercizio (pressione arteriosa, frequenza cardiaca).',
    source: 'Linee guida su decadimento cognitivo vascolare e riabilitazione',
    source_date: '2023',
    evidence_level: 'moderate',
  },
  {
    condition_name: 'Demenza frontotemporale',
    condition_keywords: 'demenza frontotemporale,degenerazione lobare frontotemporale,FTD',
    goals: 'Mantenimento funzionale con particolare attenzione alla gestione dei disturbi comportamentali (nella variante comportamentale) o del linguaggio (nelle varianti afasiche primarie progressive), che spesso precedono il deficit motorio.',
    progression_criteria: 'L\'esordio è tipicamente più precoce rispetto all\'Alzheimer (spesso prima dei 65 anni) con predominanza di sintomi comportamentali o del linguaggio nelle fasi iniziali; il coinvolgimento motorio compare più tardivamente.',
    return_to_activity_criteria: 'Obiettivo di mantenimento funzionale, con approccio riabilitativo che richiede spesso un forte coinvolgimento del caregiver data la ridotta consapevolezza di malattia (anosognosia) frequente in questa forma.',
    outcome_measures: 'Frontal Assessment Battery, scale comportamentali specifiche, scale ADL/IADL.',
    clinical_tests: 'Valutazione delle funzioni esecutive frontali, osservazione comportamentale strutturata.',
    red_flags: 'Comportamenti a rischio per sé o per altri (disinibizione severa), rapido peggioramento funzionale.',
    typical_exercises: 'Attività fisica strutturata con supporto del caregiver, routine motorie semplici e ripetitive.',
    contraindications: 'Approccio comportamentale da coordinare con il team specialistico in caso di disturbi comportamentali significativi.',
    source: 'Criteri diagnostici internazionali per la degenerazione lobare frontotemporale',
    source_date: '2023',
    evidence_level: 'moderate',
  },
  {
    condition_name: 'Atassia cerebellare',
    condition_keywords: 'atassia cerebellare,atassia,disturbi cerebellari,sindrome atassica',
    goals: 'Migliorare la coordinazione motoria, l\'equilibrio e la stabilità del cammino, e ridurre il rischio di caduta associato a dismetria e incoordinazione.',
    progression_criteria: 'La progressione dipende dall\'eziologia (degenerativa, post-ictus, tossica/da farmaci): nelle forme acute post-ictus è possibile un recupero parziale significativo, nelle forme degenerative l\'obiettivo è rallentare il declino funzionale.',
    return_to_activity_criteria: 'Variabile in base all\'eziologia; nelle forme acute il ritorno alle attività è guidato dal recupero della stabilità posturale e del cammino.',
    outcome_measures: 'Scale for the Assessment and Rating of Ataxia (SARA), Berg Balance Scale, Timed Up and Go, valutazione della dismetria (test indice-naso, tallone-ginocchio).',
    clinical_tests: 'Test di coordinazione appendicolare (indice-naso, tallone-ginocchio), valutazione del tremore intenzionale, test di Romberg, valutazione dell\'andatura atassica ad ampia base.',
    red_flags: 'Peggioramento acuto della coordinazione (possibile evento cerebrovascolare in corso), disartria severa con difficoltà di deglutizione associata, nistagmo di nuova insorgenza.',
    typical_exercises: 'Esercizi di stabilizzazione del tronco, training dell\'equilibrio con progressiva riduzione della base d\'appoggio, esercizi di coordinazione appendicolare, uso di ausili per la deambulazione quando indicato per la sicurezza.',
    contraindications: 'Cautela con esercizi ad alta velocità o cambi di direzione rapidi in fase di instabilità severa, per il rischio di caduta.',
    source: 'Linee guida su riabilitazione delle atassie cerebellari',
    source_date: '2022',
    evidence_level: 'moderate',
  },
  {
    condition_name: 'Sindrome del tronco encefalico (es. sindrome di Wallenberg)',
    condition_keywords: 'sindrome del tronco encefalico,sindrome di wallenberg,ictus del tronco encefalico,sindrome bulbare laterale',
    goals: 'Gestione multidisciplinare dei deficit multipli tipici delle lesioni del tronco encefalico (motori, sensitivi, di deglutizione, oculomotori, dell\'equilibrio), con priorità iniziale alla sicurezza della deglutizione e delle vie aeree.',
    progression_criteria: 'La complessità e molteplicità dei deficit richiede un approccio a step, spesso a partire dalla stabilizzazione respiratoria/deglutitoria prima di procedere con la riabilitazione motoria intensiva.',
    return_to_activity_criteria: 'Fortemente variabile in base all\'estensione della lesione; alcune sindromi del tronco encefalico hanno prognosi funzionale relativamente favorevole nonostante la presentazione acuta severa.',
    outcome_measures: 'NIHSS, valutazione strumentale della deglutizione, Functional Independence Measure.',
    clinical_tests: 'Screening della deglutizione, valutazione dei nervi cranici, valutazione dell\'equilibrio e della coordinazione, valutazione della sensibilità termodolorifica (spesso alterata con pattern crociato).',
    red_flags: 'Difficoltà respiratoria, aspirazione silente (assenza di riflesso tussigeno efficace), instabilità cardiovascolare — il coinvolgimento del tronco encefalico può interessare centri vitali e richiede monitoraggio stretto.',
    typical_exercises: 'Programma riabilitativo multidisciplinare che integra terapia della deglutizione, esercizi oculomotori se indicato, training dell\'equilibrio e del cammino una volta stabilizzato il quadro clinico.',
    contraindications: 'Assunzione orale di cibi/liquidi non autorizzata fino a valutazione della deglutizione in sicurezza; mobilizzazione da coordinare con il team medico in fase acuta.',
    source: 'Letteratura clinica su sindromi vascolari del tronco encefalico',
    source_date: '2022',
    evidence_level: 'moderate',
  },
  {
    condition_name: 'Sclerosi laterale amiotrofica (SLA)',
    condition_keywords: 'sla,sclerosi laterale amiotrofica,malattia del motoneurone,ALS',
    goals: 'Mantenere la funzione e la qualità di vita il più a lungo possibile in una malattia progressiva senza cura, prevenire complicanze secondarie (contratture, piaghe da decubito), e supportare l\'adattamento funzionale con ausili in base alla progressione dei deficit.',
    progression_criteria: 'Il programma richiede rivalutazione frequente data la natura rapidamente progressiva della malattia; l\'intensità dell\'esercizio va bilanciata per evitare l\'affaticamento eccessivo, che può accelerare la fatica muscolare nei pazienti con SLA.',
    return_to_activity_criteria: 'Non applicabile come recupero, essendo una malattia neurodegenerativa progressiva; l\'obiettivo è il mantenimento adattivo della funzione residua.',
    outcome_measures: 'ALS Functional Rating Scale-Revised (ALSFRS-R), valutazione della funzione respiratoria (capacità vitale forzata).',
    clinical_tests: 'Valutazione della forza muscolare segmentaria, valutazione della funzione bulbare (parola, deglutizione), valutazione respiratoria.',
    red_flags: 'Segni di insufficienza respiratoria (dispnea, uso di muscoli accessori, desaturazione), disfagia severa con rischio di aspirazione, rapido peggioramento funzionale che richiede rivalutazione del piano di cura.',
    typical_exercises: 'Esercizio aerobico e di rinforzo moderato nelle fasi iniziali (con cautela, evitando l\'overwork), stretching per prevenire contratture, esercizi respiratori, adattamento progressivo con ausili per la mobilità.',
    contraindications: 'Evitare esercizio ad alta intensità che causi affaticamento eccessivo; nelle fasi avanzate privilegiare mobilizzazione passiva e prevenzione delle complicanze da immobilità piuttosto che rinforzo attivo.',
    source: 'Linee guida internazionali sulla gestione multidisciplinare della SLA',
    source_date: '2023',
    evidence_level: 'high',
  },
  {
    condition_name: 'Mielopatia cervicale spondilotica',
    condition_keywords: 'mielopatia cervicale spondilotica,mielopatia cervicale,stenosi cervicale con mielopatia',
    goals: 'Preservare la funzione degli arti superiori e inferiori, gestire i disturbi dell\'equilibrio e del cammino tipici della compressione midollare cervicale, e monitorare la progressione per un\'eventuale valutazione chirurgica tempestiva.',
    progression_criteria: 'Nei casi lievi-moderati la fisioterapia conservativa può essere appropriata con monitoraggio stretto; un peggioramento progressivo dei segni mielopatici richiede rivalutazione per possibile indicazione chirurgica.',
    return_to_activity_criteria: 'Dipende dalla stabilità del quadro clinico e, nei casi trattati chirurgicamente, dal decorso post-operatorio specifico.',
    outcome_measures: 'Modified Japanese Orthopaedic Association Score (mJOA), Nurick grading scale, valutazione della forza e della sensibilità segmentaria.',
    clinical_tests: 'Segno di Hoffmann, segno di Babinski, valutazione dell\'andatura mielopatica (spesso spastico-atassica), test di iperreflessia, valutazione della propriocezione.',
    red_flags: 'Rapido peggioramento della forza o della coordinazione, disturbi sfinterici di nuova insorgenza (possibile segno di compressione midollare severa che richiede valutazione urgente), segni di instabilità cervicale.',
    typical_exercises: 'Esercizi di stabilizzazione cervicale a basso carico, training dell\'equilibrio e del cammino, rinforzo degli arti nel rispetto dei limiti imposti dalla compressione midollare — evitando manipolazioni cervicali ad alta velocità.',
    contraindications: 'Manipolazioni cervicali ad alta velocità e basso ampiezza (thrust) controindicate in presenza di segni mielopatici conclamati; movimenti cervicali in flessione/estensione estrema da valutare con cautela.',
    source: 'Linee guida su gestione conservativa e chirurgica della mielopatia cervicale spondilotica',
    source_date: '2022',
    evidence_level: 'moderate',
  },
];

async function main() {
  console.log(`Inserisco ${CONDITIONS.length} nuove patologie neurologiche...`);

  const { data: existing } = await supabase
    .from('knowledge_base')
    .select('condition_name');

  const existingNames = new Set((existing || []).map((c) => c.condition_name));

  const toInsert = CONDITIONS.filter((c) => !existingNames.has(c.condition_name));

  if (toInsert.length === 0) {
    console.log('Tutte le patologie sono già presenti, nessun inserimento necessario.');
    return;
  }

  const { data, error } = await supabase
    .from('knowledge_base')
    .insert(toInsert)
    .select('id, condition_name');

  if (error) throw error;

  console.log(`Inserite ${data.length} patologie:`);
  data.forEach((d) => console.log(`  - ${d.condition_name} (id ${d.id})`));
}

main().catch((err) => {
  console.error('Errore:', err);
  process.exit(1);
});
