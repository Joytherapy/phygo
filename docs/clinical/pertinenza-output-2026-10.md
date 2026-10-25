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

**Controlli complessivi:** {{FULL}}

## Test simulati e verifica con il modello reale

| | Stato |
|---|---|
| Test simulati (modello scriptato, dati sintetici) | Eseguiti, risultati sopra |
| Verifica con il modello AI reale, prima della revisione 3 | Eseguita dall'utente su tre casi sintetici, in ambiente isolato. Ha trovato i cinque problemi della revisione 3, riprodotti qui come regressioni simulate |
| Verifica con il modello AI reale, dopo la revisione 3 | **Da ripetere.** In questo ambiente non c'è una chiave OpenAI. Le correzioni sono dimostrate solo con risposte simulate, che riproducono gli output osservati. Quanto il modello reale scriva meno dati inventati con i nuovi prompt **non è dimostrato**; la pulizia e i controlli intervengono comunque su ciò che scrive |

**Procedura per la verifica con il modello reale** (`docs/clinical/verifica-manuale-modello-reale.md`):
- si esegue con `scripts/clinical-relevance-live.mjs`, in ambiente isolato: app in locale, Supabase sostituito da un database in memoria con soli dati sintetici, nessun database reale e nessun paziente;
- lo script è stato provato solo contro un sostituto locale di OpenAI, per verificare il collegamento tra le parti; il report di quella prova dice esplicitamente "SOSTITUTO del modello". Non è una verifica del modello reale.

## Limiti residui

- **Reperti e test sono riconosciuti da un vocabolario** (concetti e nomi in 4 lingue): un reperto descritto con parole fuori elenco non viene rilevato.
- **Un reperto è "sostenuto" a livello di concetto**: se il fisioterapista ha parlato di gonfiore, un "edema" nel testo è accettato anche se il grado o la sede sono diversi.
- **La pulizia lavora per proposizioni**: una proposizione che mescola un dato detto e uno inventato viene tolta per intero; resta elencata e si può ripristinare.
- **La corrispondenza degli esercizi si basa su circa 25 movimenti**: per un esercizio senza movimento noto basta che le parole specifiche della parola chiave siano nel nome.
- **Per gli altri distretti** la scheda è cercata per parola chiave tra le schede di quel distretto, senza ripiego AI e senza fasi.
- **I controlli sono deterministici e coprono solo fatti verificabili**: distretto, lato, misure con unità, giorni/date/orari, trattamenti "eseguiti" di un elenco noto. Non giudicano la correttezza del ragionamento clinico, l'aderenza agli obiettivi del paziente, la popolazione degli studi o la corrispondenza tra titolo, abstract, autori e PMID. Sono tutti punti della verifica manuale.
- **Il riconoscimento del distretto si basa su un vocabolario**: sinonimi rari, refusi o abbreviazioni non vengono riconosciuti. In quel caso il sistema **lo dichiara** ("distretto non riconosciuto", "pertinenza non verificata") invece di classificare.
- **La distinzione anamnesi / attuale / negato si basa su parole indicatrici**: un'anamnesi senza indicatori ("operato al ginocchio nel 2019") resta attuale. Una frase senza indicatori eredita lo stato della frase precedente. Gli errori vanno nel senso di considerare un distretto attuale, quindi segnalare meno, non nascondere.
- **Il lato viene associato alla parola di lato più vicina**, entro tre parole. Costruzioni lunghe o insolite possono lasciare il lato non associato, e in quel caso non viene controllato.
- **Le attività generali sono solo quelle aerobiche riconosciute dal nome.** Gli esercizi "core" o "whole-body" restano "non verificati": decide il fisioterapista.
- **Una scheda o uno studio "non verificati" restano visibili.** Vanno valutati dal fisioterapista, che vede il motivo.
- **Il controllo dei distretti non si applica a tutte le sezioni**: Differenziali, test suggeriti e precauzioni possono citare altri distretti; lì si controlla solo il lato.
- **"Indiretta per meccanismo" dipende dalle parole del titolo**: può includere uno studio sullo stesso meccanismo in un contesto clinico diverso. Per questo è sempre etichettato e viene dopo le evidenze dirette.
- **I dati del test sono sintetici**: il database reale (1107 schede, 52 studi pubblicati, 1924 esercizi) può contenere casi non rappresentati.
- **`refine-plan` è invariata e non usata** (vedi sopra).
- **ESLint non è configurato nel repository**: i controlli statici eseguiti sono il typecheck e la build.
- **La qualità non è certificata al 100%**: la suite copre i casi della matrice, non tutti i casi possibili.
