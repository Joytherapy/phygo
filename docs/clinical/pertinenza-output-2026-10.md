# Pertinenza clinica dell'output generato dalla nota (ottobre 2026)

Audit di tutto ciò che PHYGO genera a partire dalla nota del fisioterapista:
Rilievi, Valutazione, Piano, Follow-up, Ragionamento clinico, Spunti clinici
(scheda e protocollo), Evidenze scientifiche ed Esercizi.

## Il caso degli screenshot (regressione riproducibile, dati sintetici)

**Nota.** Dolore alla spalla sinistra, possibile problematica della cuffia dei rotatori.

**Output osservato:**
- valutazione e ragionamento centrati sulla spalla;
- tra gli esercizi, mobilità di caviglia e stretching degli hamstring;
- tra le evidenze, uno studio sul dolore traumatico alla gamba negli adolescenti.

**Test di regressione (`tests/clinical-relevance.test.mjs`).**
- Il caso `shoulderLeft` e il test *"the screenshot case in detail"* lo riproducono con una trascrizione sintetica. Il modello simulato propone gli stessi esercizi, cioè ciò che i prompt chiedevano.
- La libreria contiene "Hamstring stretch" e "Ankle mobility circles". Tra gli studi c'è "Traumatic leg pain in adolescents", con un abstract che cita "shoulder pain", come il caso reale.

**Nel browser (`tests/session-notes-panel.test.mjs`)**, lo stesso caso verifica il riquadro "Controlli di coerenza":
- esclusione dell'esercizio e motivo;
- lato errato nel Piano;
- esercizio aggiunto a mano mantenuto;
- "Aggiungi comunque";
- salvataggio.

## Criteri (fissati prima dei test)

1. **Pertinenza all'input**: ogni sezione riguarda il caso descritto oggi.
2. **Coerenza anatomica**: distretto e lato corrispondono a quelli detti dal fisioterapista, in **ogni** sezione.
3. **Coerenza tra sezioni**: Valutazione, Piano, esercizi, protocollo e studi parlano dello stesso problema.
4. **Pertinenza degli studi**, su quattro livelli, ognuno con il suo motivo mostrato:
   - *diretta*: la condizione nel titolo, oppure nell'abstract di uno studio sullo stesso distretto;
   - *indiretta motivata*:
     - stesso distretto con un termine della condizione ma non la condizione esatta, oppure
     - stesso meccanismo clinico (ad esempio "tendinopatia") in uno studio su un altro distretto;
   - *pertinenza non verificata*: termini in comune, ma il distretto del caso o dello studio non è riconosciuto. **Non** viene presentata come diretta;
   - *irrilevante*: altro distretto senza meccanismo in comune, oppure solo parole generiche ("pain", "exercise", "musculoskeletal"). Non viene mostrata.
5. **Pertinenza degli esercizi**, distinguendo quattro esiti:
   - *distretto riconosciuto e compatibile*: distretto del caso o distretti vicini;
   - *attività realmente generale*: attività aerobica come cyclette, camminata o nuoto, riconosciuta dal nome;
   - *distretto non riconosciuto*: l'esercizio viene mantenuto ma segnalato come "pertinenza non verificata", con il motivo; decide il fisioterapista;
   - *distretto incompatibile*: l'esercizio viene escluso dalla proposta e messo nell'elenco degli esclusi, con il motivo.

   I distretti vicini sono, ad esempio:
   - scapola e tratto toracico per la spalla;
   - anca, coscia e caviglia per il ginocchio;
   - arto inferiore per la lombare, arto superiore per la cervicale.
6. **Protocollo**: scheda e fasi del distretto della condizione valutata, presentate come indicative. Una scheda senza distretto riconoscibile, o per un caso senza distretto riconosciuto, è mostrata come "pertinenza non verificata", con il motivo.
   - **Il caso** è il problema trattato oggi, come lo descrive il fisioterapista. Un distretto citato solo in anamnesi o negato non ne fa parte. Un distretto secondario descritto come attuale sì, come nei casi multidistretto reali.
   - **Il lato** è associato al distretto con cui viene detto.
7. **Nessun dato inventato**:
   - misure non dette in Rilievi e Valutazione;
   - giorni, date o orari non detti in Piano e Follow-up;
   - trattamenti presentati come "eseguiti" che il fisioterapista non ha nominato.
8. **Utilità pratica**: giudizio umano, non automatizzabile (vedi la procedura manuale).

**Accettazione nella suite.**
- Nessun esercizio, studio o protocollo di un distretto estraneo al caso entra senza motivo.
- Nessun esercizio viene sostituito da un esercizio del database di un altro distretto.
- Ogni studio non diretto mostra il suo motivo.
- Ogni errore di lato, distretto di sezione, misura, appuntamento o trattamento inventato viene rilevato e mostrato.
- Se il distretto non è riconosciuto, lo si dice invece di dichiarare "nessuna incoerenza".

## Cause (dimostrate dai test sul codice di `main`)

| | Causa | File |
|---|---|---|
| C1 | I prompt spingevano esercizi dell'arto inferiore. In quello della nota c'erano esempi solo per l'arto inferiore (hamstring, gastrocnemio, scale, equilibrio). In quello della rifinitura c'erano categorie da includere "non da saltare per default" (equilibrio, cammino, cardio) e l'esempio "entrambe le gambe". | `app/api/generate-note/route.ts`, `app/api/refine-exercises/route.ts` |
| C2 | L'abbinamento al database degli esercizi prendeva il primo nome che conteneva una parola chiave, anche generica: "Stretching pettorale" → "stretch" → **"Hamstring stretch"**; "Mobilità cervicale" → "mobility" → **"Ankle mobility circles"**. Non c'era alcun controllo del distretto, né nella libreria né nella cache wger. | `app/api/exercise-intelligence/route.ts` |
| C3 | Gli studi venivano mostrati con qualsiasi punteggio sopra zero, quindi bastava una parola dell'abstract. "Traumatic leg pain in adolescents" passava per "shoulder pain" nell'abstract; "exercise" faceva comparire studi a caso; un'epicondilite riceveva uno studio sulla caviglia per la parola "lateral". | `lib/knowledge/paperRank.ts`, `app/api/science/relevant/route.ts` |
| C4 | La scheda clinica veniva scelta per parola chiave senza controllare il distretto. Con "Tendinopatia del sovraspinato" la parola "tendinopatia" della scheda achillea vinceva sulla cuffia: alla spalla arrivavano protocollo e fasi del tendine d'Achille, e la rifinitura degli esercizi partiva da quelle fasi. | `app/api/knowledge-lookup/route.ts` |
| C5 | Nessun controllo prima di mostrare il risultato. Lato invertito, distretto estraneo in una sezione, misure, appuntamenti o trattamenti inventati arrivavano al fisioterapista senza avviso. | `components/liveStructuring/LiveStructuring.tsx` |

**Escluse dalle cause:**
- **Contaminazione tra casi o cache**: le route non conservano stato tra una nota e l'altra, e la sequenza spalla → ginocchio → anca è pulita già su `main`.
- **`app/api/refine-plan/route.ts`**: contiene lo stesso prompt sbilanciato, ma **non è usata da nessun flusso**. Il pannello delle note la chiamava in passato e la chiamata è stata rimossa (commento in `LiveStructuring.tsx`). Oggi la citano solo i test di sicurezza, che verificano che sia protetta, e la tabella dei limiti orari. Non è stata modificata per non ampliare la PR. Si consiglia di rimuoverla in una PR separata, perché resta un endpoint raggiungibile da un professionista verificato.

## Correzione (strutturale: un solo riconoscimento usato in più punti)

`lib/clinical/region.ts` riconosce in modo deterministico distretto e lato:
- dalle parole del fisioterapista, in italiano, inglese, spagnolo e francese;
- dai codici di distretto della libreria esercizi.

`lib/clinical/coherence.ts` usa lo stesso modello per i controlli.

- **Esercizi** (`exercise-intelligence`):
  - riceve la trascrizione;
  - un esercizio di un distretto estraneo viene escluso e restituito in `excluded`, con il suo distretto e quello del caso;
  - le parole chiave solo generiche non servono più per l'abbinamento;
  - si abbina solo a un esercizio del database di un distretto compatibile;
  - un nome senza distretto ("Chin tuck") prende il distretto dell'esercizio che nomina;
  - ogni esercizio porta `draft`, il testo della nota, mostrato come "Dalla nota: …" quando il nome del database è diverso.
- **Scheda clinica** (`knowledge-lookup`): sono candidate solo le schede di un distretto compatibile con la condizione, sia nella ricerca per parole sia nel ripiego AI.
- **Studi** (`paperRank`, `science/relevant`):
  - quattro livelli: diretta, indiretta motivata, non verificata, irrilevante;
  - ogni livello porta il suo motivo (`relevance`, `relevance_reason`);
  - ordine di presentazione: prima i diretti, poi gli indiretti dello stesso distretto, poi quelli di altro distretto, poi i non verificati;
  - i termini solo generici sono scartati.
- **Prompt**:
  - eliminati gli esempi sbilanciati e le categorie obbligatorie;
  - regola: esercizi solo per il distretto di oggi, i distretti vicini o un bisogno generale indicato nella trascrizione, rispettando il lato.
- **Controlli di coerenza** (riquadro nella nota, ricalcolato a ogni modifica):
  - distretto non riconosciuto;
  - condizione di un altro distretto;
  - distretto estraneo in Rilievi, Valutazione, Piano, Follow-up, Ipotesi ed Elementi a favore. Differenziali, test suggeriti e precauzioni possono citare altri distretti;
  - lato opposto in **tutte** le sezioni, ragionamento clinico compreso;
  - esercizi, studi e protocollo fuori distretto;
  - studi non verificati;
  - misure, appuntamenti e trattamenti "eseguiti" non detti;
  - elenco degli esercizi esclusi, con il motivo e "Aggiungi comunque".
- **Il riquadro non toglie e non modifica nulla**: gli esercizi scelti o aggiunti dal fisioterapista restano e vengono solo segnalati. L'unica esclusione automatica avviene alla generazione, ed è sempre elencata.
- **Protocollo**: avviso "indicativo" sulla scheda clinica e nell'opuscolo per il paziente.

### Revisione 2: anamnesi, lato per distretto, quattro esiti

Due limiti della prima versione della PR (commit 160cd46), verificati eseguendo quel codice sui casi nuovi:

- **L'anamnesi contava come caso attuale.**
  - `caseRegionsOf()` prendeva tutti i distretti della trascrizione. Con "oggi lombalgia; in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico" il ginocchio era un distretto del caso: l'esercizio per il ginocchio passava e "rinforzo del ginocchio" nel Piano non veniva segnalato.
  - Lo stesso valeva per "nega dolore lombare".
  - Il lato era uno solo per tutta la trascrizione: con "spalla destra e ginocchio sinistro" nessun errore di lato veniva rilevato.
- **"Non riconosciuto" valeva come "pertinente".** `fitsCase()` restituiva vero quando un insieme era vuoto, quindi:
  - "Plank" (distretto non riconosciuto) e una scheda senza distretto passavano come pertinenti, senza alcun avviso;
  - un caso senza distretto riconosciuto rendeva "pertinente" qualsiasi elemento.

Correzioni:

- **`caseProfile()`** divide la trascrizione in frasi e proposizioni e classifica ciascuna come:
  - **attuale**: "oggi", "attualmente", sintomi come dolore o rigidità; oppure "non risolto";
  - **anamnesi**: "anamnesi", "pregresso", "in passato", "storia di", "asintomatico", "risolto", "guarito"; "anni fa" solo se non ci sono sintomi attuali;
  - **negata**: "nega", "nessun", "non riferisce", "senza dolore".

  Inoltre:
  - le autocorrezioni della dettatura ("no scusa", "anzi") annullano quanto detto prima;
  - "rispetto alla seduta precedente" resta attuale;
  - il lato è associato al distretto più vicino nella frase ("spalla destra e ginocchio sinistro": spalla destra, ginocchio sinistro).
- **Il caso** è dato dai distretti attuali (principale e secondari) più quelli della condizione, mai un distretto solo in anamnesi o negato.
  - Un esercizio per un distretto dell'anamnesi è escluso con il motivo "indicato solo in anamnesi".
  - Una sezione che tratta come attuale un distretto dell'anamnesi viene segnalata.
  - Le frasi di anamnesi nelle sezioni generate (es. "pregresso intervento al ginocchio sinistro" nei Rilievi) non sono errori.
- **`regionFit()`** sostituisce `fitsCase()` e ha quattro esiti: compatibile, attività generale, non riconosciuto, incompatibile.
  - Sono generali solo le attività aerobiche riconosciute dal nome. "Whole-body" e "core" restano non riconosciuti.
  - Lo stesso principio vale per:
    - gli **esercizi**: nel pannello e sulla scheda dell'esercizio, "Pertinenza non verificata" con il motivo, oppure "Attività generale";
    - le **schede cliniche**: si provano prima quelle verificate; la route restituisce `relevance` e `relevanceReason`, e il pannello mostra il motivo;
    - gli **studi**: livello "non verificata", già presente.
  - Gli elementi non riconosciuti **non vengono eliminati**.
- **Vocabolario**:
  - aggiunti alcuni esercizi comuni: pendolo/Codman, cat-camel;
  - corretto un difetto trovato dai nuovi test: "anche" (avverbio) veniva letto come plurale di "anca".

### Revisione 3: problemi trovati con il modello reale

L'utente ha eseguito tre verifiche con il modello OpenAI reale, usando lo script in ambiente isolato e casi sintetici. Ognuna è riprodotta come regressione: il caso `real*` in `tests/support/clinical-world.mjs`, con la risposta del modello ricostruita sinteticamente, e un test dedicato in `tests/clinical-relevance.test.mjs`. Sul codice della revisione 2 i tre test fallivano tutti, ciascuno per il motivo osservato.

| Problema osservato | Causa | Correzione |
|---|---|---|
| Reperti inventati: ROM lombare limitato, "assenza di radicolopatia", "nessuna instabilità", Neer/Hawkins positivi, gonfiore, flessione del ginocchio limitata oltre 90°. Segnalati solo in parte | Il prompt della nota chiedeva per "Objective" anche le "structures to rule out" e uno stile "non parafrasato". I controlli conoscevano solo le misure con unità | **Prompt**: l'Oggettivo contiene solo reperti, misure e test riferiti; mai reperti negativi, nomi di test o risultati non detti; le considerazioni differenziali vanno nel ragionamento clinico. **`lib/clinical/facts.ts`** riconosce i reperti per concetto (ROM e movimenti ridotti, rigidità, gonfiore, radicolopatia, instabilità, segni neurologici, forza, trofismo, crepitio, palpazione, andatura, ecchimosi) e i test clinici per nome (circa 40, in 4 lingue). Un reperto è sostenuto se il fisioterapista ha parlato di quel concetto, anche con altre parole |
| `history_as_active` falso positivo ("pregresso intervento al ginocchio sinistro (asintomatico) e lombalgia attuale") | Lo stato (attuale, anamnesi o negato) era deciso per proposizione intera, e "attuale" vinceva su "pregresso" | **Stato per singola menzione**: vince l'indicatore più vicino; virgole e parentesi contano come distanza; una negazione vale nella sua proposizione; "pregresso dolore" e "attualmente asintomatico" sono anamnesi; "non correlato", "asintomatico" e "risolto" sono anamnesi; "entrambi" vale solo per il distretto vicino |
| Pendolo e sollevamento del braccio prono associati alla rotazione esterna con elastico; rotazione esterna "gomito a 90°" esclusa come esercizio del gomito | La ricerca usava anche parole chiave di solo distretto ("shoulder") e accettava qualsiasi esercizio che contenesse una parola; "gomito a 90°" era letto come distretto | **Posizioni** ("gomito a 90°", "ginocchia flesse", "al fianco") non sono distretti. Le parole chiave di solo distretto non si usano. **`lib/clinical/exerciseMatch.ts`**: un esercizio del database sostituisce quello della nota solo se il movimento coincide (circa 25 movimenti in 4 lingue) o, senza movimento noto, se tutte le parole specifiche della parola chiave sono nel nome. Altrimenti l'esercizio resta come scritto, con "Corrispondenza non verificata"; un suggerimento compare solo se non è in conflitto, e il fisioterapista può usarlo con "Usa «…»" |
| La sintesi per il paziente inventa follow-up e frequenze di visita | Il prompt chiedeva per il Piano una "sensible frequency/timeline" e non limitava la sintesi | **Prompt**: niente frequenza delle visite, numero di sedute, date di controllo o trattamenti concordati se non detti; distinguere il fatto oggi dal proposto. **Controlli**: visite, follow-up e frequenze (confermati solo se il fisioterapista ne ha parlato e con gli stessi numeri e la stessa unità), accordi ("abbiamo concordato") |
| Più distretti trattati: protocolli, evidenze ed esercizi devono coprirli tutti | Scheda clinica e studi erano cercati solo per la condizione principale | **`knowledge-lookup`** restituisce `others`: per ogni altro distretto attuale, il suo lato e la sua scheda (o nessuna). **`science/relevant`** cerca per tutti i distretti e prende il migliore studio per ciascuno; ogni studio indica i distretti che copre. **Controlli `coverage_*`**: un distretto trattato oggi senza esercizi, scheda o studi viene segnalato. **Prompt**: piano, esercizi e rifinitura coprono ogni distretto, ciascuno con il suo lato |

**Pulizia della bozza (`sanitizeNote`, nella route della nota).** Le affermazioni non dette vengono tolte dalle parti che riportano fatti, proposizione per proposizione, in modo che resti ciò che è stato detto:
- reperti, test e misure nei Rilievi soggettivi e nell'Oggettivo;
- visite, follow-up e accordi nel Piano e nella sintesi per il paziente;
- trattamenti presentati come eseguiti.

Ogni rimozione è elencata nel pannello ("Tolto dalla bozza perché non risulta da ciò che hai detto"), con sezione, motivo e "Ripristina". La Valutazione è ragionamento clinico: viene solo segnalata (se non è formulata come ipotesi), mai modificata.

### Revisione 4: seconda verifica con il modello reale (dopo `cf0e971`)

L'utente ha ripetuto con il modello OpenAI reale i tre casi sintetici `shoulderLeft`, `historyKnee` e `multiSiteSides`, sul commit `cf0e971` e in ambiente isolato. Il suo report resta sul suo computer e non è nel repository. Ogni problema segnalato è riprodotto come regressione con risposte simulate, in quattro casi: `r4ShoulderLeft`, `r4HistoryKnee`, `r4MultiSite` e `r4ObjectiveReported` in `tests/support/clinical-world.mjs`, con quattro test dedicati in `tests/clinical-relevance.test.mjs`. Sul codice di `cf0e971` i quattro test fallivano tutti, ciascuno per il motivo osservato (47 superati, 4 falliti).

| Problema osservato con il modello reale | Causa | Correzione |
|---|---|---|
| "Rotazione esterna con elastico, gomito vicino al corpo" esclusa come esercizio del gomito; "Mobilizzazione della colonna vertebrale con rotazione" esclusa come esercizio della spalla | Due cause. (1) Le posizioni riconosciute erano un elenco fisso ("gomito a 90°", "al fianco"); "gomito vicino al corpo" non c'era, quindi "gomito" diventava il distretto. (2) Un esercizio del database abbinato solo perché il nome condivideva una parola ("rotation" in "Shoulder internal rotation") decideva il distretto dell'esercizio della nota | **Deduzione del distretto dalla struttura della frase** (`exerciseTextRegions` in `lib/clinical/region.ts`), non da un elenco di eccezioni. Il distretto è quello che l'esercizio nomina come **oggetto**: "flessione **del** gomito", "mobilizzazione **della** colonna". Non sono distretti: una **posizione**, cioè un distretto dopo "con", "tenendo" o "in", vicino a parole come vicino, corpo, flesso, fianco, o seguito da un angolo; e uno **scopo** ("per la spalla"). Senza oggetto, un movimento noto indica i distretti possibili: la rotazione esterna o interna e l'abduzione indicano spalla o anca, il ponte indica l'anca. **Abbinamento** (`matchDetail` in `lib/clinical/exerciseMatch.ts`): solo un esercizio confermato dallo **stesso movimento** può indicare il distretto. Una parola di solo movimento ("rotation", "flexion") non basta più a confermare un abbinamento per nome |
| Plank, mobilità del bacino, bird-dog e flessione laterale della colonna "pertinenza non verificata" in un caso di lombalgia | Colonna, tronco, core, bacino, plank e bird-dog non erano nel vocabolario dei distretti | Aggiunti in 4 lingue: colonna/rachide/spine come dorsale e lombare; tronco, core, addome, plank, bird-dog e dead bug come lombare; bacino/pelvi come lombare e anca. I termini sono cercati **dal più lungo** in tutti i distretti, così "rachide cervicale" resta cervicale. Un esercizio senza alcun distretto riconoscibile ("Esercizio con la palla") resta "non verificato", come richiesto |
| Spalla dx + ginocchio sx: ginocchio sinistro "nessuna scheda" | Per gli altri distretti si cercava per parola chiave nell'intera valutazione. Il ginocchio era descritto solo come dolore, e nessuna parola chiave di una scheda del ginocchio compariva | **Ricerca separata per ogni distretto** trattato oggi, tra le sole schede di quel distretto, in questo ordine: (1) la condizione nominata dal fisioterapista nelle frasi su quel distretto; (2) se ha descritto solo il sintomo, la **scheda generica del distretto** ("Dolore di ginocchio aspecifico", "Lombalgia aspecifica"), mai una diagnosi più specifica; (3) una condizione che compare solo nella valutazione generata, oppure (4) la scelta del modello limitata alle schede di quel distretto: entrambe **"non verificate"**; (5) altrimenti nessuna, con il motivo. Ogni voce riporta distretto, lato, pertinenza e motivo, anche nel pannello |
| — (stesso caso) diagnosi più specifica di quella detta | La scheda principale era "verificata" se il distretto coincideva, anche quando la diagnosi ("cuffia dei rotatori") veniva solo dalla valutazione del modello | La scheda principale è **"non verificata: la diagnosi non risulta da ciò che hai detto"** se il fisioterapista non ha nominato la condizione della scheda (un nome o una parola chiave in qualsiasi lingua, oppure, nello stesso distretto, una parola della condizione come "tendinopatia") |
| "Traumatic leg pain in adolescents: a cohort study" diretto per il ginocchio | La pertinenza degli studi guardava solo distretto e condizione | **Popolazione e meccanismo** (`unstatedQualifiers` in `lib/knowledge/paperRank.ts`): un titolo che riguarda bambini, adolescenti, anziani, trauma, chirurgia, atleti o gravidanza è "non verificato" se il caso non lo indica. Valgono le parole del fisioterapista, la condizione e la valutazione; un'età indicata conta per le fasce d'età. La copertura di un distretto conta solo gli studi diretti o indiretti |
| "Flessione laterale del tronco per la spalla destra" contata come esercizio compatibile | "spalla" era letto come distretto dell'esercizio | "per la spalla" è uno **scopo**, non un distretto. L'esercizio è del tronco (lombare): nel caso spalla + ginocchio viene escluso con il suo distretto |
| Dati oggettivi: verificare che quelli riferiti non vengano persi e che l'assenza sia esplicita | — | Regressione `r4ObjectiveReported`: flessione 120 gradi, Lachman negativo e lieve versamento, tutti detti, restano nella nota e non vengono tolti né segnalati. Quando l'Oggettivo è vuoto, il pannello lo dice: "Nessun rilievo obiettivo riferito" (`objective_missing`). L'avviso sparisce se il fisioterapista ripristina un rilievo |

### Revisione 5: terza verifica con il modello reale (dopo `eff1dbe`)

L'utente ha eseguito di nuovo i tre casi sintetici con il modello OpenAI reale (report `clinical-live-report-r4`). Il report resta sul suo computer: le regressioni riproducono gli output **come descritti dall'utente**, con risposte simulate, nei casi `r5LowBack` e `r5MultiSite` di `tests/support/clinical-world.mjs`. I test sono 7 in `tests/clinical-relevance.test.mjs` più uno in `tests/knowledge-match.test.mjs`. Sul codice di `eff1dbe` gli 8 test fallivano tutti, ciascuno per il motivo osservato; 52 test di `clinical-relevance` e 7 di `knowledge-match` passavano.

| Problema osservato con il modello reale | Funzione responsabile e causa | Correzione |
|---|---|---|
| Lombalgia: "nessun segno di compromissione neurologica né altre condizioni acute", e nessuna red flag, senza che fossero stati valutati | **Prompt** (`app/api/generate-note/route.ts`): chiedeva di scrivere esplicitamente "No red flags apparent" se non emergeva nulla. **`lib/clinical/facts.ts`**: "compromissione neurologica", "condizioni acute" e "red flag" non erano concetti noti; la Valutazione e il ragionamento clinico venivano solo segnalati, mai corretti | **Tre stati distinti**: un negativo detto dal fisioterapista resta ("nessuna irradiazione"); un aspetto non nominato non diventa mai un negativo; per le red flag non discusse la nota dice esplicitamente "Red flag non indagate: non risultano da ciò che è stato riferito, da valutare.". `unsupportedNegatives` riconosce le affermazioni negative (nessun, senza, assenza, negativo, escluso… in 4 lingue) su reperti, segni neurologici, red flag e "altre condizioni". Le toglie da Soggettivo, Oggettivo, Valutazione, Piano, sintesi e da reperti a favore e contro e red flag del ragionamento, elencate con "Ripristina" (`invented_negative`). Il prompt ora dice che ciò che non è stato discusso è "non valutato", non assente |
| Spalla dx + ginocchio sx: "condromalacia patellare", "tendinopatia della cuffia" come diagnosi certe sulla base del solo dolore | Nessun controllo confrontava le diagnosi con la trascrizione | `unstatedDiagnoses`: circa 20 concetti diagnostici in 4 lingue (tendinopatia, condromalacia, femororotuleo, lesione/rottura, artrosi, ernia, distorsione, frattura…); i nomi di sintomo (lombalgia, cervicalgia, gonalgia) non sono diagnosi. Una diagnosi è "detta" solo se il fisioterapista l'ha affermata, non solo sospettata. Se scritta come certa, nei Rilievi e nella Valutazione viene **etichettata "Ipotesi da confermare: …"**, con "Ripristina" che rimette la formulazione originale; nel messaggio al paziente viene **tolta**. Le ipotesi già formulate come tali restano invariate; il titolo della sezione è ora "Ipotesi cliniche (non confermate)". Prompt: i sintomi non vanno trasformati in diagnosi |
| Esercizi, serie, ripetizioni e frequenze aggiunti dal modello attribuiti al fisioterapista | Il prompt chiedeva "exercise with sets/reps/frequency" per ogni esercizio; nessuna distinzione d'origine | `exerciseOrigin` e `dosingOrigin`: ogni esercizio è **"Svolto oggi (dalla trascrizione)"**, **"Indicato da te"** o **"Suggerito dall'AI, da confermare"**. Il dosaggio è del fisioterapista solo se ha dato gli stessi numeri con la stessa unità ("3x12" vale come 3 serie e 12 ripetizioni); altrimenti "Dosaggio suggerito dall'AI: non indicato da te". Nel Piano una frase con un dosaggio non detto è etichettata "Proposta generata, da confermare: …" (`generated_dosage`). La nota salvata conserva `origin` e `dosing_origin` per ogni esercizio; My Phygo non li mostra al paziente (elenco dei campi consentiti in `lib/myPhygo/patientNote.ts`) |
| "Loading programmes in Achilles tendinopathy" classificato `same_region` per il ginocchio | **`paperRelevance`** (`lib/knowledge/paperRank.ts`) usava il vicinato clinico (il ginocchio confina con caviglia e piede, utile per gli esercizi) come "stesso distretto"; anche i distretti coperti da uno studio (`science/relevant`) usavano il vicinato | "Stesso distretto" vale solo per lo **stesso** distretto. Uno studio di un distretto vicino è "indiretto per meccanismo" se condivide il meccanismo nel titolo (Achille → ginocchio: tendinopatia), altrimenti "non verificato" (`adjacent_region`), e non conta come copertura di quel distretto. **Altri mapping corretti**: "collo del piede" (non cervicale), "collo del femore"/"femoral neck" (anca), "piatto tibiale" e "zampa d'oca" (ginocchio), "bandelletta ileotibiale" (coscia), ileopsoas e tensore della fascia lata (anca) |
| Esercizio per la cuffia dei rotatori "con gomito flesso a 90 gradi" con `exercise_region_unknown` | **`exerciseTextRegions`**: "per la cuffia dei rotatori" è uno scopo e veniva sempre ignorato; il gomito è una posizione | Ordine di deduzione: oggetto dell'esercizio, poi movimento, poi **scopo**, solo se non c'è altro. "Flessione laterale del tronco per la spalla" resta del tronco (l'oggetto vince). Nessuna nuova corrispondenza con la libreria: l'abbinamento resta quello confermato dal movimento |
| Piano multidistretto segnalato `section_region` pur citando entrambi i distretti | **Controllo delle sezioni** (`checkOutput`): "gomito a 90 gradi" nel Piano era letto come una menzione del gomito; il gomito non è tra i vicini della spalla | Nelle sezioni un distretto nominato solo come posizione non conta (`analyzeMentions(…, { skipPositions })`, stessa logica degli esercizi). Le omissioni reali restano visibili: un distretto trattato oggi che il Piano non nomina è segnalato (`coverage_plan`); un altro distretto davvero nominato (es. "rinforzo del gomito") resta `section_region`; il lato sbagliato resta segnalato. Un Piano con "core" o "tronco" in un caso spalla + ginocchio resta segnalato: è un altro distretto |

### Revisione 6: quarta verifica con il modello reale (dopo `9fa65eb`)

L'utente ha eseguito i tre casi sintetici con il modello OpenAI reale (report `clinical-live-report-r5`, sul suo computer). I miglioramenti della revisione 5 risultano confermati; restano quattro difetti. Sono riprodotti, **come descritti dall'utente**, con risposte simulate nei casi `r6HistoryKnee`, `r6ShoulderLeft` e `r6MultiSite`, con quattro test dedicati in `tests/clinical-relevance.test.mjs`, uno in `tests/knowledge-match.test.mjs` e un'estensione del test nel browser. Sul codice di `9fa65eb` tutti questi test fallivano, ciascuno per il motivo osservato, e così il controllo del prompt.

| Problema osservato con il modello reale | Funzione responsabile e causa | Correzione |
|---|---|---|
| `historyKnee`: il Soggettivo conserva la lombalgia e perde «in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico» | **Generazione**: il prompt diceva che la storia pregressa «may appear briefly in "subjective" if relevant», cioè facoltativa. La sanitizzazione non la toglieva: verificato su quattro formulazioni | **Prompt**: il Soggettivo deve conservare ogni condizione, intervento o lesione pregressi riferiti, come anamnesi, anche se il distretto è asintomatico. Non va mai presentata come attuale né usata per il piano. **Garanzia deterministica** (`historyNotKept` e `sanitizeNote` in `lib/clinical/facts.ts`): l'anamnesi riferita che la bozza omette viene aggiunta con le parole del fisioterapista. Si aggiunge solo la parte storica di una frase che mescola presente e passato. L'aggiunta è elencata con "Togli". Resta anamnesi: lo stato per menzione la legge come storia, quindi nessuna scheda, protocollo, esercizio o controllo la tratta come problema attuale (verificato nel test). Controllo `history_missing` |
| `shoulderLeft`: rotazione esterna con elastico, documentata come eseguita oggi, classificata `origine: suggested` | **`exerciseOrigin`**: il confronto era per radici di parole, quindi "extrarotazione", "banda elastica" e "theraband" non corrispondevano a "rotazione esterna con elastico" | Confronto per **attività**: stessi movimenti noti (lo stesso movimento in 4 lingue e varianti), nessun attrezzo diverso (elastico, banda elastica, theraband e resistance band sono lo stesso attrezzo; un manubrio no), nessun altro distretto (una rotazione d'anca non è quella di spalla). È "svolto oggi" se la frase lo dice come fatto, non come proposta o ipotesi. In caso di dubbio resta dell'AI: altro movimento, attrezzo o distretto, oppure "non abbiamo fatto". **Origine e dosaggio sono separati**: "Svolto oggi" con "Dosaggio suggerito dall'AI" se serie e ripetizioni non erano state indicate |
| Riepilogo al paziente: «continua a casa gli esercizi come ti ho mostrato» senza assegnazione domiciliare documentata; nel multisede esercizi proposti dall'AI dati come istruzioni | **Prompt**: chiedeva per il riepilogo «only what was discussed today and the exercises». Nessun controllo sulle istruzioni | **`unapprovedInstructions`** (in `sanitizeNote`): nel messaggio al paziente vengono tolte le frasi con:<br>- un esercizio proposto dall'AI;<br>- un dosaggio o una frequenza non indicati;<br>- un programma a casa o un «come ti ho mostrato» non documentati;<br>- un'istruzione generica sul programma ("fai gli esercizi ogni giorno") quando il programma contiene proposte dell'AI.<br>La prima frase tolta è sostituita da «Il tuo fisioterapista ti confermerà quali esercizi fare a casa.». Ogni rimozione è elencata con "Ripristina". Resta ciò che è stato fatto oggi e il programma a casa effettivamente assegnato, con il suo dosaggio. Controllo `unapproved_instruction`. Il prompt dice che le proposte non sono ancora approvate |
| Scheda della cuffia `verified` mentre la trascrizione parla di problema **sospetto** | **`knowledge-lookup`**: `relevance` indicava la corrispondenza della scheda con il caso documentato, ma nel report e nella lettura poteva sembrare una diagnosi confermata. Il sospetto valeva come "detto" | **Due campi separati**. `relevance` (verified/unverified) indica la corrispondenza della scheda con il caso documentato: distretto e condizione nominata dal fisioterapista, anche se solo come sospetto. Il nuovo `diagnosisStatus` (`diagnosisStatus` in `lib/knowledge/conditionMatch.ts`) indica che cosa ha detto il fisioterapista della diagnosi: `stated` (affermata), `suspected` (solo sospettata o ipotizzata), `not_stated`. Vale anche per gli altri distretti trattati. Il pannello mostra, per esempio, «Diagnosi sospetta, da confermare. La scheda corrisponde al caso documentato: non conferma la diagnosi.». Il report scrive «corrispondenza con il caso documentato: verified · diagnosi: suspected (la scheda non conferma la diagnosi)» |

### Revisione 7: quinta verifica con il modello reale (dopo `e78336f`)

L'utente ha eseguito i tre casi sintetici con il modello OpenAI reale (report `clinical-live-report-r6`, sul suo computer). Anamnesi, esercizi svolti e riepilogo per il paziente risultano migliorati; resta un problema sui reperti negativi non documentati in `historyKnee`. Le due frasi del report sono riprodotte **testualmente** nel caso `r7HistoryKnee`; il caso `r7Documented` contiene invece negativi realmente riferiti, che devono restare. Sul codice di `e78336f` i due nuovi test sulle frasi e il test dell'interfaccia fallivano; il caso di controllo passava già.

**Perché la sanitizzazione non le toglieva** (`unsupportedNegatives` e `sanitizeNote` in `lib/clinical/facts.ts`):
- «Non sono stati riportati segni di compromissione neurologica o altre condizioni acute»:
  - la forma passiva "non sono stati riportati" non era tra le negazioni note (c'erano "nessun", "senza", "non si rilevano"…);
  - "non riferito" e "not reported" erano trattati come "non valutato", ed esentavano la frase dal controllo; "non riportato" invece non era nell'elenco, ma la formulazione suona comunque come un esito negativo;
  - nella Valutazione la frase veniva così letta solo come "reperto non detto" (`invented_finding`), che lì viene segnalato ma mai corretto.
- «Il paziente ha riportato lombalgia senza altre complicazioni»:
  - "complicazioni" non era un concetto clinico noto, quindi la frase non veniva controllata;
  - la pulizia tagliava solo alle virgole, quindi non avrebbe potuto separare la parte detta da quella negativa.

**Correzione.** Tre stati distinti:

| Stato | Esempio | Che cosa succede |
|---|---|---|
| Negativo valutato e documentato | «Esame neurologico negativo», «nega febbre» | Resta com'è |
| Aspetto non riportato o non valutato | «Non sono stati riportati segni…», «senza altre complicazioni» | Non è mai un risultato negativo. Viene **riformulato in modo esplicito**: la parte detta resta («Il paziente ha riportato lombalgia.»), il resto diventa «La trascrizione non documenta una valutazione neurologica; da approfondire se indicato.». Analogamente per esclusione di altre condizioni, assenza di complicazioni, segni radicolari, screening delle red flag e, in generale, «questa valutazione (…)». In 4 lingue, in tutte le sezioni e nel ragionamento clinico; l'originale è elencato e si può ripristinare |
| Aspetto da valutare | «Da approfondire», «non documentato», «da escludere» | Non è un risultato negativo e resta |

- **Nuove forme negative riconosciute**: "non sono stati riportati / rilevati / evidenziati / osservati", "non risulta", "non emergono", "nessun altro", "nient'altro", "no signs / no evidence / no other / not reported", "sin otras", "sans autre".
- **Nuovo concetto "complicazioni / altri problemi / altri sintomi"**.
- **Ciò che non esenta più una frase**: "non riferito" e "not reported".
- **Prompt**: nomina queste formulazioni come negative e chiede la frase esplicita "non documentato".

**Interfaccia del fisioterapista** (`components/liveStructuring/LiveStructuring.tsx`):
- **Piano generato**: porta l'etichetta «Proposta generata dall'AI: da rivedere e confermare. Non è una prescrizione già approvata.» e non ha più il segno di spunta verde di "completato".
- **Esercizi**: sopra l'elenco compare, per esempio, «2 esercizi proposti dall'AI e 2 dosaggi suggeriti, da confermare. Salvando la nota li approvi come programma del paziente.», oltre all'origine già indicata su ogni esercizio. Il salvataggio è il momento in cui il fisioterapista approva: gli esercizi salvati diventano visibili al paziente in My Phygo.

### Revisione 8: abbinamento degli esercizi per movimento e distretto (report `clinical-live-report-r8`)

Nel report r8 una nota di lombalgia con «mobilità lombare con flessione ed estensione della colonna vertebrale in posizione supina» veniva sostituita dall'esercizio di libreria «Knee extension», marcato `verified` e `compatible`. Il caso è riprodotto in `r8LumbarMobility` (`tests/support/clinical-world.mjs`). Sul codice di `c3304ce` il test falliva attraverso l'intera pipeline: l'esercizio lombare veniva sostituito da «Knee extension».

**Cause (due, concorrenti)**
1. **`matchDetail`** (`lib/clinical/exerciseMatch.ts`) confermava un candidato per il solo nome del movimento: "estensione" e "extension" sono lo stesso movimento canonico, ma non si controllava su quale articolazione agisse. Risultato: `verified` "per movimento".
2. **`exerciseRegions`** (`lib/clinical/region.ts`) univa al distretto del nome quello del muscolo e della categoria del catalogo. «Knee extension», archiviato in "thighs" (quadricipite), era anche un esercizio della coscia, e la coscia è vicina alla zona lombare: così passava come `compatible` in un caso lombare.

**Correzione**
- Un abbinamento richiede **lo stesso movimento sullo stesso distretto** (`sameRegion`): un distretto in comune, oppure un arto intero e una sua parte; i distretti vicini non bastano. Altrimenti è un conflitto: l'esercizio della nota resta come scritto, non verificato, e il candidato non viene nemmeno suggerito.
- Il distretto di un esercizio di libreria è quello del suo nome; categoria e muscolo valgono solo se il nome non ne indica uno.
- "Back" e "schiena" sono riconosciuti come colonna ("upper back" dorsale, "lower back" lombare).

**Regressioni** (risposte simulate)
- Il caso r8 attraverso la pipeline: nessuna sostituzione, nessuna corrispondenza verificata né suggerita con «Knee extension»; l'esercizio scritto resta lombare e compatibile.
- Corrispondenze corrette ancora verificate: rotazione esterna di spalla, anche "extrarotazione con banda elastica"; estensione del ginocchio; ponte glutei; plank. Sono invece respinte la rotazione esterna d'anca per quella di spalla e l'estensione del ginocchio per la «Back extension».
- Spalla destra + ginocchio sinistro: ogni esercizio abbinato al suo distretto; segnalati solo il ginocchio destro e il Piano con il lato sbagliato.
- Origine: la mobilità lombare documentata come svolta oggi è "svolta oggi" con dosaggio suggerito; il cat-camel e un'estensione del ginocchio (stesso movimento, altra articolazione) restano "suggeriti".

**Controlli** sul commit `74962f0`, albero pulito:
- suite completa 284/284 (0 falliti, 0 saltati);
- typecheck senza errori e build riuscita;
- test SQL locali 7/7;
- nessun file SQL modificato, nessun accesso a Supabase o Vercel;
- nessuna verifica con il modello reale in questo ambiente.

**Limiti**: il controllo vale quando nota e candidato indicano un distretto. Un esercizio senza distretto né movimento noto resta abbinabile per nome, con le regole già esistenti. Un esercizio che coinvolge due distretti (es. "estensione d'anca e lombare") è accettato se uno dei due coincide.

### Revisione 9: piano per distretto ed eziologia dalla sola durata (report `clinical-live-report-r9`)

**1. Piano generico con più distretti** (spalla destra e ginocchio sinistro trattati oggi).
- **Problema**: il controllo segnalava `coverage_plan` per spalla e ginocchio.
- **Causa**: il formato del prompt chiedeva un "piano strutturato per fasi" senza una parte per distretto, e niente dava al piano questa struttura; il controllo poteva solo segnalarlo.
- **Correzione**:
  - il prompt chiede una parte per distretto, con il lato («Spalla destra: … Ginocchio sinistro: …»);
  - `planByRegion` (`lib/clinical/coherence.ts`) dice che la parte generica è comune, da adattare a ciascun distretto, e nomina il distretto mancante con «nessuna proposta specifica nella bozza per questo distretto; da definire» e il suo lato;
  - non aggiunge nulla come eseguito o approvato;
  - la modifica è elencata e si può annullare;
  - la mancanza resta visibile con `plan_region_undefined`;
  - un piano che nomina già ogni distretto non viene modificato.

**2. Eziologia dedotta dalla durata.**
- **Problema**: «Il dolore persistente da un mese suggerisce una condizione infiammatoria» superava tutti i controlli.
- **Causa**: nessun controllo conosceva le cause, e la durata veniva usata come prova.
- **Correzione**:
  - `unsupportedEtiology` (`lib/clinical/facts.ts`) riconosce le cause (infiammatoria, degenerativa, infettiva, reumatica, neuropatica, autoimmune, metabolica; 4 lingue) dedotte dalla sola durata ("da un mese", "persistente", "cronico") e non nominate dal fisioterapista;
  - queste diventano «La durata dei sintomi da sola non indica una causa …; da approfondire se indicato.» nei Rilievi, nella Valutazione, nelle ipotesi e nel ragionamento;
  - restano: le ipotesi prudenti basate sui reperti, una causa riferita dal fisioterapista, le cause da escludere;
  - il prompt dice che la durata è un dato riferito, non una prova di causa.

**Regressioni** (risposte simulate):
- `r10MultiSitePlan`: prima `coverage_plan` per entrambi; dopo, piano per distretto con i lati, nessun `coverage_plan`, `plan_region_undefined` visibile. Controllato anche con un solo distretto mancante e con un solo distretto trattato.
- `r10ShoulderEtiology`: prima nessuna segnalazione; dopo, le inferenze vengono riformulate nella Valutazione, nell'ipotesi e nei reperti a favore, mentre l'ipotesi della cuffia resta invariata. Varianti in inglese e italiano; restano invariati una causa riferita e una durata senza inferenza.
- Sul codice di `3df855d` entrambi i test fallivano, come il controllo del prompt.

**Controlli** sul commit `749dd5b`:
- suite completa 293/293 (0 falliti), compresi i test del matching per movimento e distretto (`91a80c7`);
- typecheck senza errori;
- nessuna chiamata a OpenAI, nessun accesso a Supabase o Vercel, nessun report modificato.

### Revisione 10: cause, anamnesi, piano per distretto ed evidenze (report `clinical-live-report-r10`)

Il report r10 è sul computer dell'utente: dalla sessione cloud la cartella `phygo` non era accessibile. I casi `r11ShoulderCause`, `r11HistoryKnee` e `r11MultiSitePlan` (`tests/support/clinical-world.mjs`) riproducono i problemi **come descritti dall'utente**, con risposte simulate. Sul codice di `120bbbb` tutti i nuovi test fallivano, ciascuno per il motivo osservato; fallivano anche il controllo del prompt, il test sul libretto e il test del pannello.

| Problema | Causa | Correzione |
|---|---|---|
| `shoulderLeft`: «potrebbe essere correlato a fattori ergonomici o ad attività fisiche recenti», non riferiti | Nessun controllo conosceva cause e fattori di rischio; la frase prudente ("potrebbe") passava come ipotesi | `unsupportedCauses` (`lib/clinical/facts.ts`): una causa o un fattore di rischio presentati come causa del problema (correlato, dovuto, legato, secondario…), che il fisioterapista non ha nominato, diventano «La trascrizione non documenta cause o fattori di rischio; da indagare se indicato.». Categorie riconosciute: ergonomia, postura, lavoro, sport, sovraccarico, trauma, sollevamento, stile di vita. Vale per Rilievi, Valutazione, ipotesi e ragionamento. Restano: le ipotesi prudenti basate sui reperti, una causa riferita dal fisioterapista e le informazioni mancanti («attività lavorativa non indagata») |
| `historyKnee`: sindrome miofasciale e legame tra lombalgia e vecchio intervento al ginocchio | Nessun controllo sui legami con l'anamnesi; un'ipotesi prudente non richiedeva i reperti su cui si basa | `historyLinks`: un legame causale tra il problema attuale e un distretto indicato solo in anamnesi diventa «La trascrizione non documenta un legame tra il problema attuale e l'anamnesi; da valutare se indicato.», salvo che il fisioterapista l'abbia indicato. `unsupportedHypotheses`: una sindrome miofasciale senza reperti palpatori o trigger point riferiti diventa «Ipotesi di sindrome miofasciale non sostenuta dai reperti riferiti; da valutare se indicato.». L'anamnesi resta, come anamnesi |
| `multiSiteSides`: una frase che nomina entrambi i distretti contava come piano per ciascuno | `planByRegion` considerava coperto ogni distretto nominato in una frase qualsiasi | Un distretto ha una parte propria solo in una frase che nomina lui e nessun altro distretto del caso. La frase comune viene indicata come «Indicazioni comuni, da adattare a ciascun distretto», e ogni distretto senza parte propria compare con il suo lato e «da definire». Nuovo controllo `plan_region_not_specific` sulla bozza; nulla è presentato come eseguito o prescritto |
| Evidenze indirette o non verificate presentate come supporto | (1) Uno studio con titolo generico ("chronic musculoskeletal pain") e il distretto solo nell'abstract era `direct`. (2) Il pannello mostrava tutti gli studi sotto «Evidenze scientifiche pertinenti», con «Perché è pertinente:» anche per quelli indiretti o non verificati. (3) Il libretto del paziente includeva fino a 5 studi senza guardarne la pertinenza | (1) `paperRelevance` applica da sé il controllo su popolazione e meccanismo; un distretto presente solo nell'abstract dà `indirect` (`region_in_abstract_only`). (2) Il pannello raggruppa gli studi: «Evidenza diretta per questo caso», «Evidenza indiretta: non è un supporto diretto di questo caso», «Pertinenza non verificata: da non usare come supporto di questo caso». «Perché è pertinente:» compare solo per gli studi diretti; per gli altri «Che cosa dice lo studio:». (3) Il libretto riporta solo gli studi diretti |

**Correzione successiva** (revisione della PR):
- **Libretto del paziente**: riporta solo gli studi con `relevance === 'direct'`. Uno studio senza classificazione, con `null`, con stringa vuota o con un valore sconosciuto non viene incluso.
- **Ipotesi miofasciale**: la semplice menzione della sindrome nella bozza non è un reperto. È sostenuta se il fisioterapista ha riferito reperti palpatori o trigger point, oppure se ha formulato lui l'ipotesi («sospetta sindrome miofasciale»): in quel caso resta. Una menzione negata («esclusa una sindrome miofasciale», «nessun punto trigger») non sostiene nulla.
- **Portata della negazione**: una negazione vale per le parole che la seguono nella stessa frase, fino a una congiunzione avversativa (ma, però, tuttavia, invece, bensì, but, however, pero, sin embargo, mais, cependant, pourtant). In «Nessun punto trigger alla palpazione ma sospetta sindrome miofasciale» l'ipotesi del fisioterapista resta e i trigger point non contano come reperti. Prima la negazione copriva tutta la frase e l'ipotesi veniva sostituita. Restano negate «Esclusa una sindrome miofasciale» e «Non sospetta sindrome miofasciale».
- **Negazione e «e»** (seconda fase): «e» (ed, and, y, et) estende la negazione ai reperti coordinati («Nessuna dolorabilità e tensione muscolare»: entrambi negativi). La interrompe solo se ciò che segue è un'affermazione autonoma: un'ipotesi («e sospetta sindrome miofasciale», «and myofascial syndrome is suspected») o un riferito («e riferisce tensione muscolare»). Una negazione dopo il termine («trigger point assenti») non risale oltre un'affermazione autonoma. «Non solo… ma anche» non nega nulla. Sono riconosciute anche «non è sospettata» e «not suspected».
- **Ipotesi e reperti restano distinti**: `hypothesisSupport()` riporta separatamente reperti e ipotesi detta. Un'ipotesi detta senza reperti resta nella nota come ipotesi. Se la bozza la scrive come diagnosi certa («Sindrome miofasciale del trapezio superiore.») diventa «Ipotesi da confermare: …», con l'originale ripristinabile; nel messaggio al paziente viene tolta. La sindrome miofasciale è stata aggiunta alle diagnosi controllate; «suspected», «probable», «sospechado» e «soupçonné» contano ora come espressioni di dubbio, come «sospetta».
- **Limiti**: le affermazioni autonome sono riconosciute da elenchi di parole iniziali (ipotesi e verbi di riferito). «Nessun punto trigger e sindrome miofasciale» resta negata per intero; l'errore va verso la segnalazione e l'originale si può ripristinare. Un reperto prudente dopo «e» («e possibile tensione muscolare») conta come reperto, come già fuori dalla negazione. «È» e «e» si confondono dopo la normalizzazione degli accenti; i casi frequenti sono coperti dai test. Il controllo «diagnosi detta» riconosce la frase del fisioterapista come certa solo se non contiene espressioni di dubbio, senza leggerne le negazioni (corretto nella terza fase).
- **Certezza diagnostica** (terza fase): ogni menzione di una diagnosi, nella trascrizione e nella bozza, viene classificata con `diagnosisCertainty()` come **affermata**, **incerta**, **negata** o **insufficiente/ambigua**. Prima si guarda la polarità: una negazione che lascia aperta la diagnosi («non si può escludere», «non è stata esclusa», «cannot be ruled out», «non confermata») la rende incerta; una negazione vicina la esclude («esclusa», «non sospetta», «nessuna evidenza di», «ruled out», «not suspected»). Poi il contesto: una menzione attribuita ad altri («il paziente chiede se…», «worried about») non dice nulla del giudizio clinico; un'ipotesi, una domanda o qualcosa da valutare, anche in una clausola successiva della stessa frase («…, da confermare con ecografia»), è incerta. Solo ciò che resta, detto chiaramente o confermato, è affermato. Se la stessa diagnosi è affermata (o sospettata) ed esclusa, il testo non la stabilisce. Un «no» lontano dalla diagnosi in una frase parlata senza punteggiatura rende il caso ambiguo, e un'autocorrezione («no scusa», «anzi», «I mean») non è una negazione.
- **Confronto con la bozza** (`diagnosisConflicts()`): una diagnosi affermata nella bozza resta solo se il fisioterapista l'ha affermata. Se l'ha solo sospettata, non l'ha detta o non l'ha stabilita, diventa «Ipotesi da confermare: …» (come prima). Se il fisioterapista l'ha esclusa, la bozza non può affermarla né proporla come ipotesi: la frase viene tolta (nuovo motivo `contradicted_diagnosis`, ripristinabile), anche dalle ipotesi e dal messaggio al paziente. Lo stesso vale per una bozza che esclude una diagnosi affermata o sospettata dal fisioterapista. Un'esclusione nella bozza di cui il fisioterapista non ha parlato diventa «La trascrizione non documenta che questa diagnosi sia stata esclusa (…)», se nessun altro controllo l'ha già tolta. Il controllo è per menzione, non più per frase: una frase con un'espressione di dubbio non nasconde più una diagnosi affermata in un'altra clausola.
- **Effetti su casi esistenti**: «Non sospetta sindrome miofasciale» con un'ipotesi miofasciale nella bozza ora toglie l'ipotesi come contraria al fisioterapista, invece di sostituirla con «non sostenuta dai reperti». Nel caso `realLumbarHistory`, «Assenza di segni di radicolopatia» non viene più segnalata anche come «diagnosi presentata come certa»: resta la segnalazione di reperto non detto. Sulle altre 45 note sintetiche l'esito della pulizia e dei controlli è identico.
- **Limiti della terza fase**: polarità e contesto sono riconosciuti da elenchi di espressioni in 4 lingue. La distanza di 8 parole per una negazione e i 7 parole dopo la diagnosi sono soglie fisse. Le diagnosi controllate sono quelle dell'elenco `DIAGNOSES`. La scheda di conoscenza usava ancora il controllo per frase (corretto nella quarta fase).
- **Stato diagnostico unificato** (quarta fase): `/api/knowledge-lookup` classifica la diagnosi della scheda con la stessa funzione della pulizia della nota e del controllo di coerenza (`textCertainty` in `lib/clinical/facts.ts`, passata a `diagnosisStatus` in `lib/knowledge/conditionMatch.ts`), applicata ai nomi e alle parole chiave della scheda. `diagnosisStatus` vale `stated`, `suspected`, `excluded`, `ambiguous` o `not_stated` (i primi tre e l'ultimo come prima; `excluded` e `ambiguous` sono nuovi). Una scheda la cui diagnosi il fisioterapista ha escluso, o nominato senza stabilirla, non è più "verificata": `relevanceReason` vale `diagnosis_excluded` o `diagnosis_ambiguous`. Per un altro distretto, una condizione esclusa non viene scelta come "condizione detta". I campi della risposta non cambiano; sulle 46 note sintetiche la risposta è identica a prima.
- **Correzione circoscritta della frase** (quarta fase): una diagnosi in contrasto, non confermata o esclusa senza che il fisioterapista ne abbia parlato viene corretta solo nella parte della frase che la nomina, quando è sicuro: «Cervicalgia con tendinopatia della cuffia» diventa «Cervicalgia.» (diagnosi esclusa dal fisioterapista) o «Cervicalgia. Ipotesi da confermare: tendinopatia della cuffia.» (non indicata). La frase si divide a virgole, punti e virgola, «e», «con», «and», «with». La parte viene separata solo se, da sola, dice della diagnosi ciò che dice la frase; se non contiene altro contenuto clinico (dolore, test, numeri, un'altra diagnosi) né un lato che il resto perderebbe; e se il resto non dipende da essa («Tendinopatia con dolore notturno», «…, esclusa dal fisioterapista»). Altrimenti la frase viene cambiata per intero come prima, e la modifica è segnata «Da rivedere» se la frase diceva anche altro. L'originale si ripristina sempre: la correzione è registrata come frase originale e frase corretta.
- **Clausola che esclude**: una clausola breve dopo la diagnosi, senza una diagnosi propria («…, esclusa dal fisioterapista», «…, ruled out»), la esclude. Una clausola successiva rende incerta la diagnosi solo se la qualifica («…, da confermare», «…, non si può escludere», «…, sospetta.»), non se è un'affermazione a sé su un'altra diagnosi («…, sospetta lesione del legamento crociato»).
- **Limiti della quarta fase**: la divisione della frase e i controlli di sicurezza sono basati su elenchi di parole; una frase senza punteggiatura né congiunzioni non viene divisa. Lo stato della scheda si basa sulle parole della scheda: una parola chiave condivisa da una diagnosi esclusa vicina («lesione della cuffia» per la scheda della tendinopatia della cuffia) può rendere lo stato `ambiguous`.
- **Modifiche in catena**: se una frase corretta in parte riceve un'altra modifica (la parte esclusa tolta, poi la diagnosi non indicata etichettata), ogni voce dell'elenco va dalla frase originale al testo finale. Ripristinarne una qualsiasi rimette la frase originale una sola volta, al suo posto, e toglie dall'elenco le altre voci della stessa frase. Prima la seconda voce restava e il ripristino poteva duplicare il testo.

**Effetto su un caso esistente**: `secondaryActive` aveva il piano «Esercizio per spalla e lombare.», cioè una frase sola per due distretti; ora viene diviso per distretto, ed entrambi i distretti risultano «da definire».

**Controlli** sul commit `4383811`, albero pulito:
- suite completa 301/301 (0 falliti);
- typecheck senza errori;
- nessuna chiamata a OpenAI, a Supabase o a Vercel; nessun report modificato.

**Limiti**:
- cause, legami e ipotesi sono riconosciuti da elenchi di termini e connettivi;
- tra le ipotesi che richiedono reperti propri, per ora solo la sindrome miofasciale;
- un legame con l'anamnesi è riconosciuto quando nomina il distretto dell'anamnesi o parole come "pregresso";
- il titolo del pannello è ora «Evidenze scientifiche», senza «pertinenti».

## Matrice dei casi e risultati (solo test simulati)

Suite `tests/clinical-relevance.test.mjs`. Segue il percorso reale delle route:
nota → studi → scheda e fasi → rifinitura → abbinamento esercizi. Il modello è
**simulato**; scheda, studi ed esercizi sono **sintetici**. Il "prima" è la
stessa suite eseguita sul codice di `main` (0e55194).

| Caso | Prima (`main`) | Dopo |
|---|---|---|
| Spalla sx, cuffia (**screenshot**) | ✗ "Hamstring stretch" ×2, "Ankle mobility circles", "Single leg balance"; studio gamba e studio generico mostrati | ✓ caviglia, hamstring e monopodalico esclusi con il motivo; studio cuffia diretto; studio sull'Achille indiretto (stesso meccanismo); studio senza distretto "non verificato"; nessun avviso falso su tutte le sezioni |
| Spalla dx, sovraspinato | ✗ scheda **Tendinopatia achillea** | ✓ scheda cuffia; studi indiretti e non verificati con il motivo |
| Spalla dx, piano con "sinistra" | il test passa perché usa la funzione di controllo nuova; nell'app non c'era alcun avviso | ✓ lato errato nel Piano rilevato e mostrato |
| Ginocchio dx, LCA | ✗ "Stretching pettorali" → "Hamstring stretch" | ✓ escluso; flessione 120° segnalata come non detta |
| Ginocchio sx, femororotuleo | ✗ "Chin tuck" (collo) nel programma | ✓ escluso |
| Anca dx, coxartrosi | ✗ "Mobilità cervicale" → "Ankle mobility circles" | ✓ esclusa |
| Cervicale | ✗ squat | ✓ escluso |
| Lombare | ✗ rotazione esterna di spalla | ✓ esclusa |
| Caviglia sx, distorsione | ✗ elevazioni del braccio | ✓ escluse |
| Piede dx, fascite plantare | ✓ | ✓ |
| Gomito dx, epicondilite | ✗ studio sulla caviglia ("lateral"); squat | ✓ nessuno dei due |
| Polso sx, tunnel carpale | ✗ calf raise | ✓ escluso |
| Multidistretto (spalla dx + lombalgia) | ✗ mobilità di caviglia | ✓ esclusa; spalla e lombare mantenuti |
| Generico/incompleto | ✗ 3 studi casuali per "exercise" | ✓ nessuno studio; avviso "distretto non riconosciuto" |
| Problemi multipli (lombalgia + ginocchio in anamnesi; esercizio per il ginocchio nella bozza) | ✗ studio senza livello né motivo; con la prima versione della PR l'esercizio per il ginocchio passava | ✓ escluso come "indicato solo in anamnesi"; la frase di anamnesi nei Rilievi non è un errore |
| Anamnesi trattata come attuale nel Piano ("rinforzo del ginocchio") | prima versione della PR: non rilevato | ✓ rilevato |
| Distretto secondario attivo (spalla + "riferisce anche lieve dolore lombare, trattato oggi") | — | ✓ esercizio lombare mantenuto, nessun avviso falso |
| Distretto secondario negato ("nega dolore lombare") | prima versione della PR: esercizio lombare mantenuto | ✓ escluso |
| Multidistretto con lati diversi (spalla dx + ginocchio sx; Piano e un esercizio con "ginocchio destro") | prima versione della PR: nessun errore di lato rilevato | ✓ Piano ed esercizio segnalati; nessun falso allarme sugli elementi corretti |
| Esercizio con distretto non riconosciuto ("Plank") e attività generale ("Cyclette") | prima versione della PR: entrambi trattati come pertinenti | ✓ Plank mantenuto come "non verificato" con il motivo; cyclette "attività generale" |
| Scheda senza distretto per un caso di spalla ("tendinopatia calcifica") | prima versione della PR: pertinente, senza avviso | ✓ scheda mostrata come "non verificata (la scheda non indica un distretto)" |
| Caso senza distretto (fibromialgia) | — | ✓ avviso "distretto non riconosciuto"; scheda ed esercizi non verificati, cammino "attività generale" |
| Colloquiale | ✗ caviglia; studio gamba | ✓ |
| Trascrizione ambigua ("ginocchio no scusa caviglia") | contenuto ✓; ✗ studio senza livello né motivo di pertinenza | ✓ |
| Errori nelle sezioni (lato nelle ipotesi, ginocchio nel Piano, 150° non detto, tecar "eseguita" non detta, "alle 18:00" non detto) | (nessun controllo nell'app) | ✓ tutti rilevati; nessun falso allarme su "terapia manuale" e "giovedì", che erano stati detti, né sui differenziali |
| Sequenza spalla → ginocchio → anca | ✓ nessuna contaminazione | ✓ |
| Prompt senza sbilanciamento | ✗ | ✓ |

Risultati della suite:
- **Prima versione della suite** (24 test):
  - su `main`: **6 superati, 18 falliti**. Due casi con contenuto già corretto (problemi multipli, trascrizione ambigua) falliscono solo perché gli studi non hanno livello né motivo di pertinenza;
  - con la prima versione della PR: 24 su 24.
- **Suite attuale** (34 test: 24 casi più 10 tra regressione dello screenshot, sequenza, prompt e funzioni di controllo). Comprende i nuovi test su anamnesi, problema attivo, distretti secondari, negazioni, casi multidistretto, lato per distretto e i quattro esiti: **34 superati su 34**.
- **I nuovi casi della revisione 2** non sono confrontabili con `main` riga per riga, perché le funzioni che verificano non esistevano. Il loro "prima" è il comportamento della prima versione della PR, riportato nella tabella, ottenuto eseguendo il codice del commit 160cd46.

Test nel browser (Playwright, `tests/session-notes-panel.test.mjs`, 5 test). Due riguardano il pannello di coerenza. Il primo è il caso degli screenshot; il secondo è un caso con due distretti trattati oggi e uno solo in anamnesi. Verificano che:
- un esercizio per un distretto citato solo in anamnesi venga escluso con il motivo "indicato solo in anamnesi";
- il Piano che tratta come attuale il distretto dell'anamnesi venga segnalato;
- il lato venga controllato per distretto: segnalata solo l'ipotesi con il ginocchio dal lato sbagliato, non il Piano corretto (spalla destra, ginocchio sinistro) né la riga di anamnesi nei Rilievi;
- un esercizio con distretto non riconosciuto resti nel programma con "Pertinenza non verificata" e il motivo, nella scheda dell'esercizio e nel pannello;
- una scheda clinica senza distretto riconoscibile sia mostrata con il motivo;
- il riquadro indichi il lato errato nel Piano e l'esercizio escluso con "Distretto dell'esercizio: caviglia e piede. Distretto del caso: spalla.";
- l'esercizio abbinato al database mostri "Dalla nota: …";
- un esercizio di un altro distretto aggiunto a mano dal fisioterapista resti nel programma e venga solo segnalato;
- "Aggiungi comunque" sposti l'esercizio tra gli esercizi senza toccare gli altri;
- la nota salvata contenga tutti e quattro gli esercizi scelti.

**Revisione 3, regressioni dal modello reale** (risposte simulate):

| Test | Prima, sul codice della revisione 2 | Dopo |
|---|---|---|
| Lombalgia con ginocchio in anamnesi | ✗ reperti inventati non rilevati; `history_as_active` falso positivo nella Valutazione | ✓ tre reperti, visite nel Piano e follow-up nella sintesi rilevati, tolti ed elencati; nessun falso positivo sull'anamnesi |
| Spalla dx + ginocchio sx | ✗ Neer, Hawkins e gonfiore non rilevati (solo "90 gradi") | ✓ tutti rilevati e tolti (Oggettivo vuoto); scheda del ginocchio sinistro come altro distretto; studi per entrambi; nessun errore di lato |
| Spalla dx + ginocchio sx, esercizi solo per la spalla | — | ✓ `coverage_exercises` per il ginocchio |
| Spalla sx, abbinamento esercizi | ✗ rotazione esterna "gomito a 90°" esclusa come esercizio del gomito | ✓ pendolo e sollevamento prono non sostituiti (prono "non verificato"); rotazione esterna abbinata correttamente |
| Prompt | ✗ "structures to rule out", "sensible frequency/timeline" | ✓ |

**Controlli complessivi** (revisione 3), eseguiti sul commit `f616c4e` con l'albero di lavoro pulito:
- suite completa dell'app: **247 test, 247 superati, 0 falliti, 0 saltati, 0 annullati**, compresi tutti i test preesistenti. Comprende `clinical-relevance` (43), `knowledge-match` (5) e 6 test nel browser della pagina della seduta, di cui 3 sul pannello di coerenza;
- typecheck: nessun errore. Build: riuscita;
- test SQL: 7 file, tutti superati, solo su PostgreSQL locale nel container;
- script del modello reale: verificato solo contro un sostituto locale di OpenAI (collegamento delle parti), non contro il modello reale;
- questo documento è aggiornato con un commit successivo che modifica **solo** questo file.

**Revisione 4, regressioni dalla seconda verifica con il modello reale** (risposte simulate):

| Test | Prima, sul codice di `cf0e971` | Dopo |
|---|---|---|
| Spalla sx, "Rotazione esterna con elastico, gomito vicino al corpo" | ✗ esclusa (`off_region`) | ✓ non esclusa; abbinata a "Shoulder external rotation with band", compatibile |
| Lombalgia con ginocchio in anamnesi: mobilizzazione della colonna con rotazione, plank, mobilità del bacino, bird-dog, flessione laterale della colonna | ✗ mobilizzazione esclusa come esercizio della spalla; gli altri quattro "non verificati" | ✓ nessuno escluso; tutti e cinque compatibili; nessuna sostituzione con "Shoulder internal rotation" |
| Spalla dx + ginocchio sx | ✗ ginocchio senza scheda; scheda della cuffia "verificata" senza che il fisioterapista l'abbia nominata | ✓ ginocchio sinistro: scheda generica del ginocchio, verificata, motivo "sintomo descritto, non una diagnosi"; scheda della cuffia "non verificata: diagnosi non detta"; studio sugli adolescenti con trauma assente o "non verificato" con il motivo; flessione laterale del tronco "per la spalla" esclusa come lombare; nessun avviso di copertura del protocollo per il ginocchio |
| Oggettivo riferito / Oggettivo assente | ✗ Oggettivo vuoto senza alcun avviso | ✓ dati riferiti conservati e nessuna rimozione; Oggettivo vuoto segnalato |

Altri test aggiornati di conseguenza (comportamento nuovo e voluto, non tolleranze):
- **Schede**: nei casi in cui il fisioterapista dice solo "dolore alla spalla", la scheda della cuffia è ora "non verificata (diagnosi non detta)". Riguarda 7 casi della matrice; prima risultava "verificata".
- **Altri distretti**: nel caso `realMultisite` l'altro distretto (ginocchio) riceve la scheda generica del ginocchio invece di "Dolore femororotuleo", che compariva solo nella valutazione del modello. Nel caso `secondaryActive` il distretto lombare riceve "Lombalgia aspecifica" e non è più segnalato come senza scheda.
- **Esercizi**: "Plank", prima usato come esempio di distretto non riconosciuto, ora è lombare. L'esempio è diventato "Esercizio con la palla 3x10" (casi `unknownExercise`, `caseUnverified` e test nel browser).
- **Movimenti**: "Rotazione esterna …, gomito a 90° al fianco" ha come distretti possibili spalla e anca, quelli del movimento. "Ponte con ginocchia flesse" ha come distretto l'anca.
- **Unità**: nuovi test unitari per "diagnosi detta", per "scheda generica del distretto" (es. "Dolore femororotuleo" e "Coxartrosi" non sono generiche) e per popolazione e meccanismo degli studi.
- **Browser**: il test del pannello multidistretto verifica la scheda "non verificata" con il motivo, la scheda generica del ginocchio con il motivo, l'avviso "Nessun rilievo obiettivo riferito" e la sua scomparsa dopo il ripristino di un rilievo.

**Controlli complessivi** (revisione 4), eseguiti sul commit `19dbc31` con l'albero di lavoro pulito:
- suite completa dell'app: **257 test, 257 superati, 0 falliti, 0 saltati, 0 annullati**. Comprende `clinical-relevance` (51), `knowledge-match` (7) e i 6 test nel browser della pagina della seduta, di cui 3 sul pannello di coerenza;
- typecheck: nessun errore. Build: riuscita;
- test SQL: 7 file, tutti superati, solo su PostgreSQL locale nel container;
- script del modello reale: eseguito **solo contro un sostituto locale di OpenAI** sui tre casi della verifica e sulle tre regressioni. Il report dice "SOSTITUTO del modello" e riporta, per ogni altro distretto, la scheda con pertinenza e motivo. È una prova del collegamento tra le parti, **non** una verifica del modello reale;
- questo documento è aggiornato con un commit successivo che modifica **solo** la documentazione.

**Revisione 5, regressioni dalla terza verifica con il modello reale** (risposte simulate):

| Test | Prima, sul codice di `eff1dbe` | Dopo |
|---|---|---|
| Lombalgia: negativi non valutati | ✗ nessun controllo li rilevava (trovato solo `objective_missing`) | ✓ tolti da Valutazione e red flag; red flag "non indagate"; "Assenza di irradiazione" (detta) conservata |
| Spalla dx + ginocchio sx: diagnosi certe | ✗ nessun controllo | ✓ entrambe le frasi della Valutazione etichettate "Ipotesi da confermare"; nel messaggio al paziente la diagnosi viene tolta; le ipotesi già prudenti invariate |
| Origine di esercizi e dosaggi | ✗ funzioni assenti | ✓ esercizi e dosaggi non detti "suggeriti"; "svolto oggi" e "indicato da te" riconosciuti; frequenza non detta "suggerita"; frasi del Piano con dosaggio non detto etichettate |
| Cuffia "con gomito flesso a 90 gradi"; Piano multidistretto; studio sull'Achille | ✗ distretto non riconosciuto; `section_region` sul Piano; Achille `same_region` per il ginocchio | ✓ spalla, compatibile; nessun `section_region`; Achille "indiretto per meccanismo", senza il ginocchio tra i distretti coperti |
| Controllo del Piano multidistretto | ✗ "gomito a 90 gradi" segnalato | ✓ posizione ignorata; un distretto omesso dal Piano segnalato (`coverage_plan`); un distretto davvero nominato e un lato sbagliato ancora segnalati |
| Mapping anatomico | ✗ "collo del piede" letto anche come cervicale | ✓ |
| Studi: stesso distretto (`knowledge-match`) | ✗ `{"level":"indirect","reason":"same_region"}` per l'Achille e il ginocchio | ✓ |

Effetti voluti su test esistenti:
- **Caso degli screenshot** (`shoulderLeft`): la bozza diceva "Nessuna red flag apparente" senza che se ne fosse parlato. Ora la frase viene tolta e sostituita da "non indagate"; il caso registra questa rimozione.
- **Studi**: per lo studio "Traumatic leg pain in adolescents" il motivo resta "popolazione o meccanismo non indicati", che prevale sul nuovo "distretto vicino".
- **Etichette**: nei test nel browser sono cambiati i titoli "Ipotesi cliniche (non confermate)" e "Tolto o etichettato nella bozza…".
- **Browser**: il test multidistretto verifica anche:
  - la diagnosi etichettata, con "Ripristina" che rimette la formulazione originale, ed è quella salvata;
  - "Suggerito dall'AI" e "Dosaggio suggerito" sui due esercizi;
  - `origin` e `dosing_origin` nella nota salvata.

**Controlli complessivi** (revisione 5), eseguiti sul commit `d938195` con l'albero di lavoro pulito:
- suite completa dell'app: **266 test, 266 superati, 0 falliti, 0 saltati, 0 annullati**. Comprende `clinical-relevance` (59), `knowledge-match` (8) e i 6 test nel browser della pagina della seduta;
- typecheck: nessun errore. Build: riuscita;
- test SQL: 7 file, tutti superati, solo su PostgreSQL locale nel container;
- **nessuna modifica a database o dati di produzione**:
  - nessun file SQL è cambiato dopo `eff1dbe`;
  - in questa revisione non è stata eseguita alcuna chiamata a Supabase o Vercel;
  - i nuovi campi degli esercizi stanno nel JSON della nota, già usato per campi interni, e non richiedono modifiche allo schema;
- script del modello reale: aggiornato per riportare origine di esercizi e dosaggi e le etichette; **non** eseguito contro il modello reale (in questo ambiente non c'è una chiave);
- questo documento è aggiornato con un commit successivo che modifica **solo** la documentazione.

**Revisione 6, regressioni dalla quarta verifica con il modello reale** (risposte simulate):

| Test | Prima, sul codice di `9fa65eb` | Dopo |
|---|---|---|
| Anamnesi del ginocchio | ✗ Soggettivo «Lombalgia.» | ✓ «Lombalgia. In anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico.». Il problema attuale resta solo lombare: scheda della lombalgia, nessuna scheda né esercizio per il ginocchio, nessun `history_as_active`. Una nota che conserva già l'anamnesi non viene modificata |
| Origine dell'esercizio | ✗ "Extrarotazione … con banda elastica" `suggested` | ✓ quattro formulazioni (extrarotazione / banda elastica, rotazioni esterne / theraband, inglese, "della spalla … gomito vicino al corpo") sono "svolto oggi" con dosaggio suggerito. Restano "suggerito": rotazione interna, manubrio, anca, "non abbiamo fatto". "Potremmo proporre" vale "indicato da te", non "svolto" |
| Riepilogo al paziente | ✗ «come ti ho mostrato, 3 serie da 12 ogni giorno» e istruzioni con esercizi dell'AI conservati | ✓ tolti; resta «Oggi abbiamo fatto terapia manuale ed esercizi per la spalla.» e il rinvio alla conferma del fisioterapista. Un programma a casa assegnato davvero resta con il suo dosaggio |
| Significato di `verified` | ✗ nessuna distinzione | ✓ cuffia: `verified` e diagnosi `suspected`; sovraspinato affermato: `stated`; solo dolore: `not_stated`; scheda generica del ginocchio: `verified` (`symptom_only`) con diagnosi `not_stated` |
| Prompt | ✗ storia facoltativa; riepilogo con «the exercises» | ✓ |
| Browser | ✗ origine `suggested` | ✓ "Svolto oggi (dalla trascrizione)" con "Dosaggio suggerito dall'AI"; «Diagnosi sospetta, da confermare … non conferma la diagnosi» |

Effetti voluti su test esistenti:
- **Caso degli screenshot** (`shoulderLeft`): il riepilogo «Fai gli esercizi per la spalla ogni giorno…» presentava come istruzione il programma generato, con una frequenza non indicata. Ora viene sostituito; il caso registra la rimozione.
- **Riepilogo con frequenza non detta**: nel test della revisione 5, il riepilogo di controllo «Fai gli esercizi ogni giorno.» ora viene tolto, perché la frequenza non era stata detta. Il test usa una frase senza istruzioni.

**Controlli complessivi** (revisione 6), eseguiti sul commit `0a04d38` con l'albero di lavoro pulito:
- suite completa dell'app: **274 test, 274 superati, 0 falliti, 0 saltati, 0 annullati**. Comprende `clinical-relevance` (66), `knowledge-match` (9) e i 6 test nel browser;
- typecheck: nessun errore. Build: riuscita;
- test SQL: 7 file, tutti superati, solo su PostgreSQL locale nel container;
- nessuna modifica a database o servizi di produzione: nessun file SQL cambiato dopo `9fa65eb` e nessuna chiamata a Supabase o Vercel. `diagnosisStatus` è un campo della risposta API, non del database;
- script del modello reale: eseguito contro un sostituto locale di OpenAI per verificare il report (scheda e diagnosi separate, origine `performed`), **non** contro il modello reale;
- questo documento è aggiornato con un commit successivo che modifica **solo** la documentazione.

**Revisione 7, regressioni dalla quinta verifica con il modello reale** (risposte simulate):

| Test | Prima, sul codice di `e78336f` | Dopo |
|---|---|---|
| Le due frasi del report r6, testuali | ✗ nessuna negazione rilevata (solo `invented_finding:neurologica` sulla Valutazione, non corretto) | ✓ Valutazione: «Lombalgia aspecifica. La trascrizione non documenta una valutazione neurologica; da approfondire se indicato. La trascrizione non documenta l'esclusione di altre condizioni; da approfondire se indicato.»; ragionamento: «Il paziente ha riportato lombalgia. La trascrizione non documenta l'assenza di complicazioni; da approfondire se indicato.»; entrambe elencate e ripristinabili; anamnesi del ginocchio invariata |
| Negativi realmente riferiti (esame neurologico negativo, nessuna irradiazione, nega febbre) | ✓ | ✓ nessuna modifica |
| Varianti in 4 lingue | ✗ "non sono stati riportati", "non risultano altre complicazioni", "no other complications"… non rilevati | ✓ rilevate; le frasi "non documentato / da approfondire" mai trattate come risultati |
| Interfaccia: piano ed esercizi | ✗ piano con spunta verde, nessuna indicazione di proposta | ✓ etichetta di proposta sul piano; conteggio di esercizi e dosaggi proposti; il salvataggio indicato come approvazione |

**Effetto su un test esistente**: nel caso lombare della revisione 5 la Valutazione contiene ora, volutamente, la frase «non documenta una valutazione neurologica». Il test verifica che sparisca l'affermazione negativa, non la parola "neurologica".

**Controlli complessivi** (revisione 7), eseguiti sul commit `6a0050c` con l'albero di lavoro pulito:
- suite completa dell'app: **279 test, 279 superati, 0 falliti, 0 saltati, 0 annullati**. Comprende `clinical-relevance` (71) e i 6 test nel browser;
- typecheck: nessun errore. Build: riuscita;
- test SQL: 7 file, tutti superati, solo su PostgreSQL locale;
- nessuna modifica a database o servizi di produzione: nessun file SQL cambiato dopo `e78336f`, nessuna chiamata a Supabase o Vercel;
- questo documento è aggiornato con un commit successivo che modifica **solo** la documentazione.

## Test simulati e verifica con il modello reale

| | Stato |
|---|---|
| Test simulati (modello scriptato, dati sintetici) | Eseguiti, risultati sopra |
| Verifica con il modello AI reale, prima della revisione 3 | Eseguita dall'utente su tre casi sintetici, in ambiente isolato. Ha trovato i cinque problemi della revisione 3, riprodotti qui come regressioni simulate |
| Verifica con il modello AI reale, dopo la revisione 3 (`cf0e971`) | Eseguita dall'utente sugli stessi tre casi sintetici. I reperti inventati risultano migliorati; ha trovato i problemi della revisione 4, riprodotti qui come regressioni simulate |
| Verifica con il modello AI reale, dopo la revisione 4 (`eff1dbe`) | Eseguita dall'utente sugli stessi tre casi (report `clinical-live-report-r4`). Ha trovato i sei problemi della revisione 5, riprodotti qui come regressioni simulate a partire dalla sua descrizione |
| Verifica con il modello AI reale, dopo la revisione 5 (`9fa65eb`) | Eseguita dall'utente (report `clinical-live-report-r5`): miglioramenti della revisione 5 confermati; trovati i quattro problemi della revisione 6, riprodotti qui come regressioni simulate a partire dalla sua descrizione |
| Verifica con il modello AI reale, dopo la revisione 6 (`e78336f`) | Eseguita dall'utente (report `clinical-live-report-r6`): anamnesi, esercizi svolti e riepilogo migliorati; trovato il problema dei negativi non documentati della revisione 7, riprodotto qui con le frasi testuali del report |
| Verifica con il modello AI reale, dopo la revisione 7 | **Da eseguire, prima del merge.** In questo ambiente non c'è una chiave OpenAI. Le correzioni sono dimostrate **solo con risposte simulate** |

**Ripetizione dei tre casi dopo la revisione 7** (dalla radice del repository, sul commit della PR, con la chiave solo nella variabile d'ambiente):

```
npm ci
node scripts/clinical-relevance-live.mjs --build
OPENAI_API_KEY_LIVE=<chiave> node scripts/clinical-relevance-live.mjs --out ./clinical-live-report-r7 --repeat 1 --cases shoulderLeft,historyKnee,multiSiteSides
```

Da confrontare con `clinical-live-report-r6`:
- in nessuna sezione, ragionamento clinico compreso, un risultato negativo non riferito («non sono stati riportati segni…», «senza altre complicazioni», «nessuna red flag»): al loro posto «La trascrizione non documenta …; da approfondire se indicato.» (voci `invented_negative` in "Tolto o etichettato", con la riformulazione);
- i negativi detti dal fisioterapista restano;
- l'interfaccia (da controllare a mano nel pannello, perché il report non la mostra): il piano porta l'etichetta di proposta; sopra gli esercizi il numero di esercizi e dosaggi proposti dall'AI.

Punti della revisione 6, da ricontrollare nello stesso report:
1. `historyKnee`: il Soggettivo contiene l'intervento al ginocchio sinistro come anamnesi (scritto dal modello, oppure aggiunto: voce `history_added` in "Tolto o etichettato"); nessuna scheda, esercizio o controllo per il ginocchio;
2. `shoulderLeft`: la rotazione esterna con elastico ha `origine: performed`, con `dosaggio: suggested` se serie e ripetizioni non erano state dette;
3. riepilogo al paziente: nessun «come ti ho mostrato», programma a casa, esercizio dell'AI o dosaggio non detti; le rimozioni compaiono come `unapproved_instruction`;
4. scheda clinica: «corrispondenza con il caso documentato» separata da «diagnosi: suspected / stated / not_stated».

Punti della revisione 5, da ricontrollare nello stesso report:
1. nessuna affermazione di assenza (segni neurologici, altre condizioni, red flag) non riferita; red flag non discusse indicate come "non indagate"; i negativi detti restano;
2. nessuna diagnosi specifica presentata come certa se è stato descritto solo il dolore: etichettata "Ipotesi da confermare" (sezione "Tolto o etichettato" del report);
3. ogni esercizio con la sua origine (`performed`, `stated`, `suggested`) e il dosaggio (`stated`, `suggested`); nel Piano i dosaggi non detti etichettati;
4. lo studio sul tendine d'Achille non è `same_region` per il ginocchio;
5. un esercizio per la cuffia dei rotatori "con gomito a 90 gradi" non è `exercise_region_unknown`;
6. nessun `section_region` sul Piano multidistretto che nomina entrambi i distretti; `coverage_plan` solo se il Piano ne omette uno.

Punti della revisione 4, da ricontrollare nello stesso report:
1. "Rotazione esterna … gomito vicino al corpo" e "Mobilizzazione della colonna vertebrale con rotazione" non sono esclusi;
2. plank, bacino, bird-dog e flessione laterale della colonna non risultano "non verificati" nel caso lombare;
3. il ginocchio sinistro ha una scheda con lato, pertinenza e motivo;
4. "Traumatic leg pain in adolescents" non è "diretto";
5. un esercizio del tronco "per la spalla" non è compatibile con la spalla;
6. i dati oggettivi detti restano nella nota e l'Oggettivo vuoto è segnalato.

Il modello reale può scrivere esercizi o valutazioni diversi da quelli delle regressioni. In quel caso conta il comportamento sul testo effettivamente generato, che va riportato con il caso.

**Procedura per la verifica con il modello reale** (`docs/clinical/verifica-manuale-modello-reale.md`):
- si esegue con `scripts/clinical-relevance-live.mjs`, in ambiente isolato: app in locale, Supabase sostituito da un database in memoria con soli dati sintetici, nessun database reale e nessun paziente;
- lo script è stato provato solo contro un sostituto locale di OpenAI, per verificare il collegamento tra le parti; il report di quella prova dice esplicitamente "SOSTITUTO del modello". Non è una verifica del modello reale.

## Limiti residui

- **Reperti e test sono riconosciuti da un vocabolario** (concetti e nomi in 4 lingue): un reperto descritto con parole fuori elenco non viene rilevato.
- **Un reperto è "sostenuto" a livello di concetto**: se il fisioterapista ha parlato di gonfiore, un "edema" nel testo è accettato anche se il grado o la sede sono diversi.
- **La pulizia lavora per proposizioni**: una proposizione che mescola un dato detto e uno inventato viene tolta per intero; resta elencata e si può ripristinare.
- **La corrispondenza degli esercizi si basa su circa 25 movimenti**: per un esercizio senza movimento noto devono essere nel nome tutte le parole specifiche della parola chiave, di cui almeno una non di solo movimento.
- **Il distretto di un esercizio si deduce dalla struttura della frase** (oggetto, posizione, scopo) e da un vocabolario. Una costruzione insolita può essere letta male: un distretto introdotto da "con" è sempre letto come posizione, quindi "Esercizio con la spalla" non ha distretto e resta "non verificato". Senza oggetto, un movimento indica distretti possibili ampi: la rotazione esterna indica spalla o anca. Con i distretti vicini, quindi, risulta compatibile anche in un caso di gomito o di ginocchio. L'errore va nel senso di accettare l'esercizio, che resta visibile al fisioterapista, non di escluderlo.
- **Per gli altri distretti** la scheda viene mostrata senza fasi. La "scheda generica del distretto" esiste solo se il database ne contiene una il cui nome indica soltanto il dolore di quel distretto, come "Dolore di ginocchio aspecifico" o "Lombalgia aspecifica"; altrimenti si passa alla valutazione o alla scelta del modello, entrambe "non verificate".
- **"Diagnosi detta" è un confronto di parole**: un sinonimo che non compare tra i nomi e le parole chiave della scheda ("sovraspinato" per una scheda sulla "cuffia dei rotatori") rende la scheda "non verificata" anche se la diagnosi è stata detta. L'errore va nel senso di dichiarare meno.
- **Popolazione e meccanismo degli studi si leggono dal titolo**, con un elenco di 7 qualificatori in inglese. Una popolazione indicata solo nell'abstract, o con parole fuori elenco, non viene rilevata.
- **I controlli sono deterministici e coprono solo fatti verificabili**: distretto, lato, misure con unità, giorni/date/orari, trattamenti "eseguiti" di un elenco noto. Non giudicano la correttezza del ragionamento clinico, l'aderenza agli obiettivi del paziente o la corrispondenza tra titolo, abstract, autori e PMID; la popolazione degli studi solo come sopra. Sono tutti punti della verifica manuale.
- **Il riconoscimento del distretto si basa su un vocabolario**: sinonimi rari, refusi o abbreviazioni non vengono riconosciuti. In quel caso il sistema **lo dichiara** ("distretto non riconosciuto", "pertinenza non verificata") invece di classificare.
- **La distinzione anamnesi / attuale / negato si basa su parole indicatrici**: un'anamnesi senza indicatori ("operato al ginocchio nel 2019") resta attuale. Una frase senza indicatori eredita lo stato della frase precedente. Gli errori vanno nel senso di considerare un distretto attuale, quindi segnalare meno, non nascondere.
- **Il lato viene associato alla parola di lato più vicina**, entro tre parole. Costruzioni lunghe o insolite possono lasciare il lato non associato, e in quel caso non viene controllato.
- **Le attività generali sono solo quelle aerobiche riconosciute dal nome.** Gli esercizi di core e tronco (plank, bird-dog, dead bug) sono lombari; gli esercizi "whole-body" o senza distretto restano "non verificati": decide il fisioterapista.
- **Una scheda o uno studio "non verificati" restano visibili.** Vanno valutati dal fisioterapista, che vede il motivo.
- **Il controllo dei distretti non si applica a tutte le sezioni**: Differenziali, test suggeriti e precauzioni possono citare altri distretti; lì si controlla solo il lato.
- **"Indiretta per meccanismo" dipende dalle parole del titolo**: può includere uno studio sullo stesso meccanismo in un contesto clinico diverso. Per questo è sempre etichettato e viene dopo le evidenze dirette.
- **Negativi, diagnosi e dosaggi sono riconosciuti da vocabolari** in 4 lingue: un'affermazione negativa senza le parole elencate ("quadro neurologico tranquillo") o una diagnosi fuori elenco non vengono rilevate. Un aspetto è "sostenuto" se il fisioterapista ne ha parlato in qualsiasi modo: "nega febbre" sostiene un'affermazione generica sulle red flag.
- **"Diagnosi detta" è decisa per concetto**: "tendinopatia del sovraspinato" detta sostiene "tendinopatia della cuffia" scritta. Una frase che contiene sia una diagnosi detta sia una non detta viene etichettata per intero.
- **L'origine di un esercizio è un confronto di parole** con le frasi della trascrizione che parlano di esercizi: un esercizio detto con parole molto diverse risulta "suggerito" (l'errore va nel senso di non attribuirlo al fisioterapista). Il dosaggio è del fisioterapista solo con gli stessi numeri e la stessa unità.
- **Le etichette valgono per la nota e la scheda**: il libretto PDF degli esercizi per il paziente riporta il dosaggio senza indicarne l'origine.
- **L'anamnesi viene riconosciuta dalle parole indicatrici** (anamnesi, pregresso, in passato, storia di…) e dallo stato per menzione: un'anamnesi senza indicatori («operato al ginocchio nel 2019») non viene riconosciuta come tale e non viene aggiunta. Il controllo "già presente" confronta distretto e parole: una riformulazione molto diversa può portare a un'aggiunta ridondante, che si può togliere.
- **L'origine dell'esercizio si basa su circa 25 movimenti e 7 tipi di attrezzo**: per un esercizio senza movimento noto resta il confronto delle parole, quindi un esercizio detto con parole molto diverse risulta "suggerito".
- **Il controllo del messaggio al paziente si basa su elenchi di espressioni** (a casa, continua, ripeti, come ti ho mostrato, ogni giorno…): un'istruzione formulata diversamente, senza esercizi, dosaggi o frequenze riconoscibili, non viene rilevata. Le frasi tolte sono elencate e si possono ripristinare.
- **`diagnosisStatus` distingue affermato e sospettato con le parole di ipotesi** (sospetto, possibile, compatibile…): una diagnosi detta come certa ma con un'espressione di dubbio fuori elenco risulta "indicata".
- **I negativi riconosciuti dipendono da un elenco di forme e concetti**: una negazione formulata diversamente («quadro neurologico tranquillo», «tutto nella norma») non viene rilevata. Un concetto è "documentato" se il fisioterapista ne ha parlato in qualsiasi modo, anche con un'altra polarità.
- **La parte detta di una frase viene conservata solo se precede la negazione** («X senza Y»). Se la negazione viene prima («Senza complicazioni, il paziente riferisce…»), la frase viene riformulata per intero; l'originale resta ripristinabile.
- **Le etichette di proposta sono nell'interfaccia del fisioterapista**: una volta salvata la nota, gli esercizi sono considerati approvati. Il testo del piano salvato non porta l'etichetta, salvo le frasi con dosaggi non detti già etichettate dalla revisione 5.
- **I dati del test sono sintetici**: il database reale (1107 schede, 52 studi pubblicati, 1924 esercizi) può contenere casi non rappresentati.
- **`refine-plan` è invariata e non usata** (vedi sopra).
- **ESLint non è configurato nel repository**: i controlli statici eseguiti sono il typecheck e la build.
- **La qualità non è certificata al 100%**: la suite copre i casi della matrice, non tutti i casi possibili.
