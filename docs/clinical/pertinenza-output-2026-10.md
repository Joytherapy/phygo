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
5. **Pertinenza degli esercizi**: distretto del caso, distretti vicini o lavoro generale senza distretto. I distretti vicini sono, ad esempio:
   - scapola e tratto toracico per la spalla;
   - anca, coscia e caviglia per il ginocchio;
   - arto inferiore per la lombare, arto superiore per la cervicale.
6. **Protocollo**: scheda e fasi del distretto della condizione valutata, presentate come indicative.
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
| Problemi multipli (lombalgia + ginocchio in anamnesi) | contenuto ✓; ✗ studio senza livello né motivo di pertinenza | ✓ |
| Colloquiale | ✗ caviglia; studio gamba | ✓ |
| Trascrizione ambigua ("ginocchio no scusa caviglia") | contenuto ✓; ✗ studio senza livello né motivo di pertinenza | ✓ |
| Errori nelle sezioni (lato nelle ipotesi, ginocchio nel Piano, 150° non detto, tecar "eseguita" non detta, "alle 18:00" non detto) | (nessun controllo nell'app) | ✓ tutti rilevati; nessun falso allarme su "terapia manuale" e "giovedì", che erano stati detti, né sui differenziali |
| Sequenza spalla → ginocchio → anca | ✓ nessuna contaminazione | ✓ |
| Prompt senza sbilanciamento | ✗ | ✓ |

Risultati della suite (24 test: matrice, regressione dello screenshot, sequenza, prompt e funzioni di controllo):
- **prima**, sul codice di `main`: **6 superati, 18 falliti**. Due casi con contenuto già corretto (problemi multipli, trascrizione ambigua) falliscono su `main` solo perché gli studi non hanno livello né motivo di pertinenza;
- **dopo**: **24 superati su 24**.

Test nel browser (Playwright, `tests/session-notes-panel.test.mjs`, 4 test, tutti superati). Verificano che:
- il riquadro indichi il lato errato nel Piano e l'esercizio escluso con "Distretto dell'esercizio: caviglia e piede. Distretto del caso: spalla.";
- l'esercizio abbinato al database mostri "Dalla nota: …";
- un esercizio di un altro distretto aggiunto a mano dal fisioterapista resti nel programma e venga solo segnalato;
- "Aggiungi comunque" sposti l'esercizio tra gli esercizi senza toccare gli altri;
- la nota salvata contenga i tre esercizi scelti.

**Controlli complessivi** sul branch, prima della PR:
- suite completa dell'app: **226 test, 226 superati, 0 falliti, 0 saltati**, compresi tutti i test preesistenti;
- typecheck (`tsc --noEmit`): nessun errore;
- `next build`: riuscita;
- test SQL su PostgreSQL locale: 7 file, tutti superati, nessuna operazione su Supabase.

## Test simulati e verifica con il modello reale

| | Stato |
|---|---|
| Test simulati (modello scriptato, dati sintetici) | Eseguiti, risultati sopra |
| Verifica con il modello AI reale | **Non eseguita.** In questo ambiente non c'è accesso a OpenAI. La qualità delle risposte reali con i nuovi prompt **non è validata**. Procedura per il preview: `docs/clinical/verifica-manuale-preview.md` |

## Limiti residui

- **I controlli sono deterministici e coprono solo fatti verificabili**: distretto, lato, misure con unità, giorni/date/orari, trattamenti "eseguiti" di un elenco noto. Non giudicano la correttezza del ragionamento clinico, l'aderenza agli obiettivi del paziente, la popolazione degli studi o la corrispondenza tra titolo, abstract, autori e PMID. Sono tutti punti della verifica manuale.
- **Il riconoscimento del distretto si basa su un vocabolario**: sinonimi rari, refusi o abbreviazioni non vengono riconosciuti. In quel caso il sistema **lo dichiara** ("distretto non riconosciuto", "pertinenza non verificata") invece di classificare.
- **Un distretto citato solo come anamnesi conta come distretto del caso**: gli esercizi per quel distretto non vengono esclusi.
- **Gli esercizi generali senza distretto non vengono filtrati**: cyclette, camminata, core.
- **Il controllo dei distretti non si applica a tutte le sezioni**: Differenziali, test suggeriti e precauzioni possono citare altri distretti; lì si controlla solo il lato.
- **"Indiretta per meccanismo" dipende dalle parole del titolo**: può includere uno studio sullo stesso meccanismo in un contesto clinico diverso. Per questo è sempre etichettato e viene dopo le evidenze dirette.
- **I dati del test sono sintetici**: il database reale (1107 schede, 52 studi pubblicati, 1924 esercizi) può contenere casi non rappresentati.
- **`refine-plan` è invariata e non usata** (vedi sopra).
- **ESLint non è configurato nel repository**: i controlli statici eseguiti sono il typecheck e la build.
- **La qualità non è certificata al 100%**: la suite copre i casi della matrice, non tutti i casi possibili.
