require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CONDITIONS = [
  {
    condition_name: 'Rischio di caduta nell\'anziano',
    condition_keywords: 'caduta,rischio di caduta,cadute anziano,prevenzione cadute,fall risk,STEADI',
    goals: 'Identificare precocemente i fattori di rischio modificabili (equilibrio, forza muscolare, ipotensione ortostatica, farmaci, ambiente domestico), ridurre l\'incidenza di cadute e le loro complicanze (fratture, sindrome da immobilizzazione, isolamento sociale, paura di cadere), e mantenere la massima autonomia funzionale possibile.',
    progression_criteria: 'Il framework internazionale di riferimento (CDC STEADI, basato sulle linee guida congiunte American/British Geriatrics Society) si articola in tre fasi: Screen (identificazione rapida dei soggetti a rischio), Assess (valutazione approfondita dei fattori modificabili), Intervene (programma personalizzato). A livello riabilitativo si distingue tra prevenzione primaria (mantenimento di uno stile di vita attivo prima che il rischio si manifesti) e prevenzione secondaria (programma mirato con esercizi di forza, equilibrio e resistenza, eseguibili anche a domicilio, dopo l\'identificazione del rischio). La rivalutazione periodica con le scale funzionali guida la progressione del programma.',
    return_to_activity_criteria: 'Non applicabile come singolo evento; l\'obiettivo è il mantenimento continuativo della sicurezza nel movimento, con rivalutazione completa dei fattori di rischio dopo ogni episodio di caduta, incluso un'eventuale nuova valutazione ambientale domiciliare.',
    outcome_measures: 'Tinetti Balance and Gait Scale (punteggio combinato equilibrio+andatura su 28 punti totali: ≥19 indica basso rischio di caduta, <18 indica rischio elevato), Scala di Conley (valutata al ricovero ospedaliero e nei tre mesi precedenti, punteggio ≥2 indica rischio significativo), velocità del cammino su 4 metri (normale 1,1-1,5 m/secondo; ≤0,8 m/s è soglia di allarme condivisa anche con i criteri diagnostici di sarcopenia), Timed Up and Go.',
    clinical_tests: 'Valutazione della stazione eretta in posizione di Romberg (a occhi aperti e chiusi — un netto peggioramento a occhi chiusi suggerisce un deficit propriocettivo più che vestibolare o cerebellare puro), prova di Trendelenburg (appoggio monopodalico, osservazione di bacino e tronco per debolezza del medio gluteo), valutazione della cadenza e lunghezza del passo (lunghezza normale circa 3 piedi, considerata anomala se inferiore a 2), osservazione dell\'altezza dello slancio del piede durante lo swing (rischio di inciampo se insufficiente).',
    red_flags: 'Caduta con trauma cranico o sospetta frattura (richiede valutazione medica immediata — oltre il 95% delle fratture d\'anca nell\'anziano è causato da una caduta), sincope associata alla caduta (possibile causa cardiovascolare — aritmie, blocco atrioventricolare, ipotensione ortostatica, sindromi vaso-vagali — o neurologica, come TIA/ictus del circolo posteriore, da indagare prima di attribuire l\'evento a un semplice inciampo), cadute ricorrenti in breve tempo (segnale di deterioramento funzionale, cognitivo o di un nuovo problema medico non ancora diagnosticato), nuova incontinenza urinaria improvvisa associata a instabilità della marcia.',
    typical_exercises: 'Esercizi di equilibrio in appoggio monopodalico progressivo, training del cammino su superfici e in condizioni diverse, rinforzo della muscolatura degli arti inferiori (in particolare quadricipite e medio gluteo, stabilizzatore del bacino sul piano frontale), esercizi di trasferimento (alzarsi dalla sedia, passaggi posturali), educazione del paziente e del caregiver sulla sicurezza ambientale domestica (rimozione di tappeti/ostacoli, illuminazione adeguata, uso del corrimano, calzature chiuse e adatte, evitare di scendere dal letto in modo brusco).',
    contraindications: 'Esercizi ad alto rischio di caduta senza adeguata supervisione o supporto in pazienti con instabilità severa; attenzione a comorbidità cardiovascolari durante esercizi che comportano cambi posturali rapidi, per il rischio di ipotensione ortostatica.',
    source: 'CDC STEADI (Stopping Elderly Accidents, Deaths & Injuries), basato sulle linee guida congiunte American Geriatrics Society / British Geriatrics Society; scale Tinetti e Conley da materiale didattico geriatrico',
    source_date: '2024',
    evidence_level: 'high',
  },
  {
    condition_name: 'Sarcopenia',
    condition_keywords: 'sarcopenia,perdita massa muscolare,riduzione forza muscolare anziano,EWGSOP2',
    goals: 'Contrastare la perdita di massa e forza muscolare età-correlata, preservare l\'autonomia funzionale nelle attività quotidiane, e ridurre le conseguenze sistemiche associate (aumento del rischio di caduta, alterata termoregolazione, ridotta tolleranza glucidica, osteopenia).',
    progression_criteria: 'La sarcopenia inizia tipicamente intorno ai 50 anni con un declino che si accentua progressivamente, in particolare dopo i 65-70 anni. Il programma di esercizio va calibrato sul livello di partenza e intensificato gradualmente, privilegiando l\'esercizio di resistenza (rinforzo progressivo) come intervento cardine, supportato da un adeguato apporto proteico nella dieta.',
    return_to_activity_criteria: 'Non applicabile come recupero da un evento acuto; obiettivo di mantenimento e rallentamento della progressione nel lungo termine, con outcome misurati in termini di forza, massa muscolare e performance funzionale nel tempo.',
    outcome_measures: 'Criteri diagnostici EWGSOP2 (European Working Group on Sarcopenia in Older People, revisione 2019): la sarcopenia va sospettata in presenza di bassa forza muscolare, confermata da una ridotta quantità/qualità muscolare, e classificata come severa se è presente anche una ridotta performance fisica. Soglie di riferimento: forza di presa (hand grip) <27 kg negli uomini e <16 kg nelle donne; chair stand test ≥15 secondi per 5 alzate; velocità del cammino ≤0,8 m/s su 4 metri o Short Physical Performance Battery ≤8 punti per la severità.',
    clinical_tests: 'Test della forza di presa (hand grip, con dinamometro), chair stand test (tempo per compiere 5 alzate consecutive dalla sedia senza uso delle braccia), test del cammino a velocità abituale su 4 metri, misurazione della circonferenza del polpaccio (≤34 cm uomini, ≤33 cm donne, come indicatore indiretto di massa muscolare quando non disponibili metodiche di composizione corporea).',
    red_flags: 'Perdita di peso e di forza muscolare rapida e non intenzionale (da distinguere dal fisiologico declino lento correlato all\'età — un calo rapido richiede indagine per escludere cause sottostanti come neoplasie, malnutrizione severa o patologie endocrine), difficoltà respiratorie associate a marcata debolezza (possibile coinvolgimento della muscolatura respiratoria).',
    typical_exercises: 'Esercizio di resistenza progressiva (rinforzo con carichi crescenti) è l\'intervento con maggiore evidenza per contrastare la sarcopenia, associato ad attività aerobica regolare. L\'intervento nutrizionale con adeguato apporto proteico supporta l\'efficacia dell\'esercizio. Fattori concomitanti da considerare nella programmazione includono l\'alterata termoregolazione (maggiore rischio di colpi di calore e ipotermia, per la ridotta massa magra e capacità di dispersione del calore) e la ridotta tolleranza glucidica secondaria alla minore massa muscolare disponibile per l\'utilizzo del glucosio.',
    contraindications: 'Attenzione al carico e alla progressione in presenza di comorbidità cardiovascolari o osteoporosi severa; monitorare la tolleranza termica durante l\'esercizio in ambienti caldi, data la ridotta capacità di termoregolazione.',
    source: 'Cruz-Jentoft AJ et al., Sarcopenia: Revised European Consensus on Definition and Diagnosis (EWGSOP2), Age and Ageing 2019; materiale didattico su fisiologia dell\'invecchiamento',
    source_date: '2019',
    evidence_level: 'high',
  },
];

async function main() {
  console.log(`Inserisco ${CONDITIONS.length} nuove condizioni geriatriche...`);

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
