require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CONDITIONS = [
  {
    condition_name: 'Paralisi del nervo faciale (centrale vs periferica)',
    condition_keywords: 'paralisi facciale,paresi facciale,nervo faciale,paralisi di Bell,paresi centrale periferica',
    goals: 'Distinguere correttamente una paresi facciale centrale (da lesione delle vie corticobulbari, es. ictus) da una paresi periferica (da lesione del nervo faciale stesso, es. paralisi di Bell), poiché prognosi e gestione differiscono sostanzialmente; nel caso periferico, proteggere l\'occhio dall\'esposizione corneale e supportare il recupero della funzione muscolare.',
    progression_criteria: 'Nella paralisi di Bell il recupero spontaneo avviene nella maggior parte dei casi entro 3-6 mesi; una componente riabilitativa (esercizi di mimica facciale, biofeedback) supporta il recupero funzionale e previene sincinesie patologiche. Nella paresi centrale, il recupero segue il decorso della patologia neurologica sottostante (es. ictus).',
    return_to_activity_criteria: 'Non applicabile come singolo criterio; il ritorno alla normale funzione mimica facciale è l\'obiettivo, con tempistiche molto diverse tra le due forme.',
    outcome_measures: 'House-Brackmann Grading System (scala di gravità della paralisi periferica del faciale, I-VI), valutazione della simmetria facciale a riposo e nei movimenti volontari.',
    clinical_tests: 'Chiedere al paziente di sollevare le sopracciglia, chiudere gli occhi con forza, e mostrare i denti/sorridere. Il punto chiave differenziale: nella paresi centrale la fronte è risparmiata (il nucleo facciale superiore riceve innervazione corticale bilaterale), quindi il paziente riesce a sollevare le sopracciglia su entrambi i lati, mentre la metà inferiore del volto controlaterale alla lesione è paretica. Nella paresi periferica è coinvolto l\'intero emivolto omolaterale alla lesione, fronte inclusa, con incapacità di chiudere completamente l\'occhio (lagoftalmo).',
    red_flags: 'Paralisi facciale periferica ad esordio acuto richiede comunque valutazione medica per escludere cause secondarie (es. Herpes zoster, otite, tumore) oltre alla forma idiopatica (di Bell); incapacità di chiudere l\'occhio richiede protezione corneale immediata (lacrime artificiali, bendaggio notturno) per prevenire danni oculari; una paresi centrale di nuova insorgenza è un\'emergenza neurologica (possibile ictus in corso).',
    contraindications: 'Nessuna specifica per la riabilitazione della mimica, salvo evitare esercizi eccessivamente intensi nelle fasi iniziali che possono favorire sincinesie (movimenti involontari associati, es. chiusura dell\'occhio quando si muove la bocca).',
    typical_exercises: 'Esercizi di mimica facciale specifici per singoli gruppi muscolari, biofeedback con specchio, massaggio facciale, elettrostimolazione (uso controverso, da valutare caso per caso), protezione oculare nella paresi periferica con lagoftalmo.',
    source: 'Materiale didattico su anatomia e clinica del nervo faciale; House-Brackmann Grading System',
    source_date: '2023',
    evidence_level: 'moderate',
  },
  {
    condition_name: 'Sindromi midollari da trauma vertebro-spinale',
    condition_keywords: 'sindrome midollare,trauma spinale,Brown-Sequard,sindrome del cordone anteriore,sindrome del cordone centrale,cauda equina,lesione midollare',
    goals: 'Riconoscere il pattern clinico specifico della sindrome midollare (centrale, di Brown-Séquard, del cordone anteriore, del cordone posteriore, o della cauda equina) per orientare prognosi funzionale e strategia riabilitativa, dato che ciascuna ha un profilo di recupero atteso diverso.',
    progression_criteria: 'La fase acuta post-trauma può presentare shock midollare (perdita transitoria di tutta l\'attività riflessa sotto il livello della lesione); la valutazione neurologica definitiva va fatta dopo la risoluzione dello shock midollare. Il livello neurologico si stabilisce clinicamente segmento per segmento (es. C4 mantiene motilità del trapezio e diaframma tramite il nervo frenico; C5 aggiunge deltoide e bicipite; C6 estensori del polso; C7 tricipite; C8 flessori delle dita; T1 interossei della mano).',
    return_to_activity_criteria: 'Fortemente dipendente dal livello e dalla completezza della lesione; l\'ASIA Score (American Spinal Injury Association) è lo strumento standard per classificare la lesione e monitorarne l\'evoluzione nel tempo.',
    outcome_measures: 'ASIA Impairment Scale (classificazione A-E della completezza della lesione), esame segmentale di motilità e sensibilità (tattile e dolorifica separatamente).',
    clinical_tests: 'Valutazione differenziata di sensibilità tattile (fibre a conduzione lenta, via colonne dorsali) e sensibilità dolorifica (fibre a conduzione più rapida, via spinotalamica) — le due vie possono essere colpite in modo dissociato a seconda della sindrome. Sindrome centromidollare: deficit prevalentemente motorio agli arti superiori rispetto agli inferiori, spesso da trauma in iperestensione in pazienti con stenosi cervicale preesistente. Sindrome di Brown-Séquard (emisezione midollare): perdita di forza e propriocezione omolaterale, perdita di dolore e temperatura controlaterale (stessa logica di dissociazione delle vie ascendenti spiegata per le lesioni midollari in generale). Sindrome del cordone anteriore: perdita di motilità e sensibilità dolorifica/termica con mantenimento della propriocezione. Sindrome del cordone posteriore: perdita selettiva della propriocezione con mantenimento di motilità e sensibilità dolorifica/termica.',
    red_flags: 'Instabilità vertebrale non trattata (richiede stabilizzazione, talvolta chirurgica, prima della mobilizzazione), sindrome della cauda equina (interessa le radici nervose lombosacrali, non il midollo vero e proprio — coinvolge tipicamente sensibilità perianale/sacrale, controllo sfinterico, ed è un\'emergenza chirurgica), segni di shock midollare persistente oltre le prime settimane (da rivalutare).',
    contraindications: 'Mobilizzazione non autorizzata prima della stabilizzazione della colonna vertebrale in fase acuta; movimenti del rachide non concordati con il team ortopedico/neurochirurgico in presenza di instabilità.',
    typical_exercises: 'Programma riabilitativo altamente specifico per livello e completezza della lesione, spesso richiede l\'uso di scale come l\'ASIA per impostare obiettivi realistici; mobilizzazione precoce quando autorizzata, prevenzione delle piaghe da decubito, gestione della componente vescico-sfinterica in coordinamento con l\'urologo.',
    source: 'Materiale didattico su sindromi midollari traumatiche; ASIA Impairment Scale',
    source_date: '2023',
    evidence_level: 'high',
  },
];

async function main() {
  console.log(`Inserisco ${CONDITIONS.length} nuove condizioni...`);

  const { data: existing } = await supabase
    .from('knowledge_base')
    .select('condition_name');

  const existingNames = new Set((existing || []).map((c) => c.condition_name));
  const toInsert = CONDITIONS.filter((c) => !existingNames.has(c.condition_name));

  if (toInsert.length === 0) {
    console.log('Tutte già presenti, nessun inserimento necessario.');
    return;
  }

  const { data, error } = await supabase
    .from('knowledge_base')
    .insert(toInsert)
    .select('id, condition_name');

  if (error) throw error;

  console.log(`Inserite ${data.length}:`);
  data.forEach((d) => console.log(`  - ${d.condition_name} (id ${d.id})`));
}

main().catch((err) => {
  console.error('Errore:', err);
  process.exit(1);
});
