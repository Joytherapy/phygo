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

## Test simulati e verifica con il modello reale

| | Stato |
|---|---|
| Test simulati (modello scriptato, dati sintetici) | Eseguiti, risultati sopra |
| Verifica con il modello AI reale, prima della revisione 3 | Eseguita dall'utente su tre casi sintetici, in ambiente isolato. Ha trovato i cinque problemi della revisione 3, riprodotti qui come regressioni simulate |
| Verifica con il modello AI reale, dopo la revisione 3 (`cf0e971`) | Eseguita dall'utente sugli stessi tre casi sintetici. I reperti inventati risultano migliorati; ha trovato i problemi della revisione 4, riprodotti qui come regressioni simulate |
| Verifica con il modello AI reale, dopo la revisione 4 | **Da eseguire, prima del merge.** In questo ambiente non c'è una chiave OpenAI. Le correzioni sono dimostrate **solo con risposte simulate** che riproducono gli output osservati. Che il modello reale, con la nuova logica, dia i risultati attesi sui tre casi **non è dimostrato** finché non c'è il nuovo report reale da confrontare con quello precedente |

**Ripetizione dei tre casi dopo la revisione 4** (dalla radice del repository, sul commit della PR, con la chiave solo nella variabile d'ambiente):

```
npm ci
node scripts/clinical-relevance-live.mjs --build
OPENAI_API_KEY_LIVE=<chiave> node scripts/clinical-relevance-live.mjs --out ./clinical-live-report-r4 --repeat 1 --cases shoulderLeft,historyKnee,multiSiteSides
```

Da confrontare con il report precedente (`cf0e971`), punto per punto:
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
- **I dati del test sono sintetici**: il database reale (1107 schede, 52 studi pubblicati, 1924 esercizi) può contenere casi non rappresentati.
- **`refine-plan` è invariata e non usata** (vedi sopra).
- **ESLint non è configurato nel repository**: i controlli statici eseguiti sono il typecheck e la build.
- **La qualità non è certificata al 100%**: la suite copre i casi della matrice, non tutti i casi possibili.
