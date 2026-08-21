require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CONDITION = {
  condition_name: 'Spasticità (sindrome del motoneurone superiore)',
  condition_keywords: 'spasticità,sindrome del motoneurone superiore,ipertono spastico,SMNS,upper motor neuron syndrome',
  goals: "Ridurre l'impatto funzionale dell'ipertono sulle attività quotidiane, prevenire le complicanze secondarie (contratture, retrazioni muscolo-tendinee, dolore), e distinguere la componente neurale (spasticità vera) dalla componente meccanica (contrattura/ipertonia intrinseca) per orientare il trattamento più efficace.",
  progression_criteria: "Il decorso segue tipicamente tre fasi temporali dall'evento acuto (es. ictus): fase acuta (30-60 minuti, danno diretto alle vie motorie centrali), fase subacuta (fino a circa 3 mesi, comparsa di paralisi flaccida seguita da riorganizzazione plastica del sistema nervoso), fase cronica (fino a circa 9 mesi e oltre, stabilizzazione dell'ipertono spastico). Circa il 30% dei pazienti con ictus sviluppa spasticità clinicamente rilevante dopo il periodo di diaschisi iniziale (fase di shock funzionale tra SNC e muscoli, con plegia e assenza di riflessi). Il recupero motorio è oggi considerato possibile anche oltre i tradizionali 6 mesi, essendo un processo attività-dipendente, ma l'avvio della riabilitazione va sempre tempestivo.",
  return_to_activity_criteria: "Non esiste un timing fisso: la ripresa funzionale dipende dal bilanciamento tra riduzione dell'ipertono, recupero della forza volontaria e gestione del dolore associato (che in un circolo vizioso tende ad amplificare la spasticità stessa).",
  outcome_measures: "Scala di Ashworth modificata (0-4, misura la resistenza al movimento passivo: 0 nessuna resistenza, 4 resistenza quasi impossibile da vincere), rapporto H/M al riflesso di Hoffmann (misura elettrofisiologica quantitativa della facilitazione delle vie afferenti 1A, utile per monitorare oggettivamente la risposta al trattamento).",
  clinical_tests: "Valutazione della resistenza al movimento passivo a diverse velocità (la spasticità è velocità-dipendente: più rapido il movimento, maggiore la resistenza percepita — a differenza della contrattura, che resta costante indipendentemente dalla velocità), valutazione della presenza di clono, riflessi osteotendinei iperattivi, segno di Babinski. Va sempre associata una valutazione della sensibilità superficiale e profonda, poiché un deficit sensitivo concomitante è frequente e influenza la strategia riabilitativa.",
  red_flags: "Dolore acuto associato all'ipertono (da trattare sempre, poiché alimenta un circolo vizioso di aumento della spasticità), peggioramento rapido e asimmetrico non spiegato dal quadro noto (possibile nuovo evento neurologico), segni di trombosi venosa profonda o infezioni in pazienti con ridotta mobilità.",
  typical_exercises: "Stretching prolungato per contrastare l'accorciamento muscolare secondario, mobilizzazione passiva regolare per prevenire la contrattura, esercizi di attivazione volontaria del muscolo antagonista, taping neuromuscolare per modulare l'input propriocettivo cutaneo (agisce sui recettori di Ruffini a lento adattamento). Nei casi più severi, il trattamento è multimodale e può includere farmaci antispastici (es. baclofen, benzodiazepine), tossina botulinica per il controllo focale, o vibrazione meccanica focale a bassa ampiezza applicata al muscolo agonista spastico (agisce sui fusi neuromuscolari riducendo la facilitazione della via afferente 1A).",
  contraindications: "Stretching aggressivo o rapido su muscolo severamente spastico può aumentare paradossalmente la resistenza (essendo velocità-dipendente) e il rischio di lesione muscolo-tendinea; la vibrazione ad alta ampiezza/frequenza è stata storicamente abbandonata per l'effetto solo temporaneo e il rischio di irritazione cutanea da attrito.",
  source: 'Materiale didattico su neurofisiologia della spasticità e sindrome del motoneurone superiore; letteratura su riflesso H e vibrazione meccanica focale',
  source_date: '2023',
  evidence_level: 'moderate',
};

async function main() {
  const { data: existing } = await supabase
    .from('knowledge_base')
    .select('id')
    .eq('condition_name', CONDITION.condition_name)
    .maybeSingle();

  if (existing) {
    console.log('Già presente, nessun inserimento necessario.');
    return;
  }

  const { data, error } = await supabase
    .from('knowledge_base')
    .insert([CONDITION])
    .select('id, condition_name');

  if (error) throw error;
  console.log('Inserita:', data[0]);
}

main().catch((err) => {
  console.error('Errore:', err);
  process.exit(1);
});