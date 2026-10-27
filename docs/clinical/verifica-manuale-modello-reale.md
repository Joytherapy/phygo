# Verifica manuale: pertinenza clinica con il modello AI reale, in ambiente isolato

La suite automatica (`tests/clinical-relevance.test.mjs`) usa risposte del
modello **simulate**. Verifica che cosa fa PHYGO con quelle risposte: filtri,
abbinamenti, scheda clinica, studi, controlli di coerenza. **Non** verifica che
cosa scrive davvero il modello con i nuovi prompt. Questa procedura serve a
quello.

## Ambiente: isolato, senza database reale

**Non usare il preview di Vercel né il database di produzione, e non creare pazienti fittizi nel database di produzione,** neppure con l'intenzione di cancellarli dopo.

Si usa invece lo script `scripts/clinical-relevance-live.mjs`:
- **App:** gira in locale, sul computer di chi esegue la verifica.
- **Database:** al posto di Supabase c'è un sostituto **in memoria** (`tests/support/fake-supabase.mjs`). Contiene solo i dati sintetici della suite: schede, studi, esercizi e un professionista di prova. Non scrive nulla da nessuna parte e sparisce alla chiusura.
- **Unica chiamata esterna: OpenAI**, con la chiave passata nella variabile `OPENAI_API_KEY_LIVE`. La chiave non viene stampata.
- **Costi:** ogni caso genera alcune chiamate a pagamento, come una nota vera. Le ripetizioni predefinite sono 2.

```
npm ci
node scripts/clinical-relevance-live.mjs --build
OPENAI_API_KEY_LIVE=<chiave> node scripts/clinical-relevance-live.mjs --out ./clinical-live-report --repeat 2
```

- Si può limitare a una parte dei casi con `--cases shoulderLeft,historyKnee,multiSiteSides`.
- Il risultato è in `clinical-live-report/report.md`, con una scheda di revisione per ogni esecuzione. Contiene:
  - tutte le sezioni generate;
  - la scheda clinica con la sua pertinenza;
  - gli studi con livello e motivo;
  - gli esercizi con pertinenza e testo della nota;
  - gli esercizi esclusi con il motivo;
  - i controlli di coerenza.
- L'intestazione del report dice quale endpoint ha risposto. Un report che dice "SOSTITUTO del modello" non è una verifica del modello reale.
- La build dello script è legata alla porta del sostituto: prima di rieseguire la suite di test, rifare la build dei test.
- Il controllo visivo del pannello si fa con il test nel browser (`tests/session-notes-panel.test.mjs`), sullo stesso sostituto in memoria. Per salvare le immagini del pannello, impostare `COHERENCE_SCREENSHOTS=<cartella>`.

I casi sono quelli della matrice in `tests/support/clinical-world.mjs`. Vengono eseguiti in sequenza nella stessa sessione, quindi controllano anche la contaminazione tra un caso e l'altro.

## Casi principali (testi sintetici; l'elenco completo è nello script)

| # | Testo da incollare | Distretto / lato atteso |
|---|---|---|
| 1 | Paziente di 45 anni con dolore alla spalla sinistra da circa un mese, dolore in elevazione oltre i 90 gradi e alla rotazione esterna contro resistenza. Sospetta problematica della cuffia dei rotatori. Oggi terapia manuale ed esercizi di rotazione esterna con elastico. | spalla, sinistra (**caso degli screenshot**) |
| 2 | Tendinopatia del sovraspinato alla spalla destra, dolore notturno e in abduzione. | spalla, destra |
| 3 | Spalla destra rigida da tre mesi, sospetta capsulite adesiva. | spalla, destra |
| 4 | Ricostruzione del legamento crociato anteriore al ginocchio destro 8 settimane fa, cammina senza stampelle, lieve gonfiore. | ginocchio, destro |
| 5 | Dolore anteriore al ginocchio sinistro scendendo le scale, sospetto femororotuleo. | ginocchio, sinistro |
| 6 | Coxartrosi dell'anca destra, dolore inguinale al cammino prolungato. | anca, destra |
| 7 | Cervicalgia da postura al computer, rigidità del collo a fine giornata. | cervicale |
| 8 | Lombalgia acuta da due giorni dopo aver sollevato un peso, nessuna irradiazione. | lombare |
| 9 | Distorsione di caviglia sinistra in inversione una settimana fa, carico tollerato. | caviglia, sinistra |
| 10 | Fascite plantare al piede destro, dolore al tallone ai primi passi del mattino. | piede, destro |
| 11 | Dolore laterale al gomito destro, tennista, sospetta epicondilite. | gomito, destro |
| 12 | Formicolio alla mano sinistra di notte, sospetto tunnel carpale al polso sinistro. | polso/mano, sinistra |
| 13 | Dolore alla spalla destra e lombalgia da due settimane, lavora in magazzino. | spalla destra + lombare (multidistretto) |
| 14 | La paziente sta meglio, continua gli esercizi, nessun dolore oggi. | nessuno (generico: atteso l'avviso "distretto non riconosciuto") |
| 15 | Oggi lombalgia; in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico. | lombare (ginocchio solo anamnesi) |
| 16 | mi fa male la spalla quando alzo il braccio, soprattutto la sera, da un paio di settimane | spalla (colloquiale, lato non detto) |
| 17 | dolore al ginocchio no scusa alla caviglia sinistra dopo una distorsione | caviglia, sinistra (trascrizione ambigua) |
| 18 | Oggi lombalgia; in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico. | lombare (ginocchio **solo anamnesi**: niente esercizi né piano per il ginocchio) |
| 19 | Dolore alla spalla destra da tre settimane; riferisce anche lieve dolore lombare, trattato oggi. | spalla destra + lombare secondario attivo |
| 20 | Dolore alla spalla destra da tre settimane, nega dolore lombare. | spalla destra (lombare **negato**) |
| 21 | Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi. | multidistretto con **lato diverso per distretto** |
| 22 | Fibromialgia con dolore diffuso e stanchezza. | nessun distretto: tutto "pertinenza non verificata" |
| 23 | Oggi lombalgia da due giorni dopo aver sollevato un peso. In anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico. | regressione 1: niente reperti né visite inventati; nessun falso allarme sull'anamnesi |
| 24 | Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi. Dolore alla spalla in elevazione e al ginocchio scendendo le scale. | regressione 2: niente test o reperti inventati; scheda, studi ed esercizi per entrambi i distretti, con il lato giusto |
| 25 | Dolore alla spalla sinistra da un mese, sospetta tendinopatia della cuffia dei rotatori. (Esercizi attesi come pendolo, sollevamento prono, rotazione esterna "gomito a 90°") | regressione 3: nessuna sostituzione con un esercizio di movimento diverso |
| 26 | Paziente di 45 anni con dolore alla spalla sinistra da circa un mese… (caso 1; esercizio "Rotazione esterna con elastico, gomito vicino al corpo") | revisione 4: la posizione non è un distretto, l'esercizio è della spalla |
| 27 | Oggi lombalgia; in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico. (Esercizi come mobilizzazione della colonna con rotazione, plank, bacino, bird-dog, flessione laterale della colonna) | revisione 4: tutti lombari, nessuno escluso o "non verificato" |
| 28 | Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi. Dolore alla spalla in elevazione e al ginocchio scendendo le scale. | revisione 4: una scheda per distretto con lato, pertinenza e motivo; nessuna diagnosi più specifica di quella detta; studi su popolazioni o meccanismi non indicati "non verificati"; esercizio del tronco "per la spalla" non compatibile |
| 29 | Dolore al ginocchio destro dopo la corsa. Flessione 120 gradi, Lachman negativo, lieve versamento. | revisione 4: i dati oggettivi detti restano |
| 30 | Lombalgia acuta da due giorni dopo aver sollevato un peso, nessuna irradiazione alla gamba. Oggi terapia manuale. | revisione 5: nessun negativo non valutato (segni neurologici, altre condizioni, red flag); "nessuna irradiazione", detto, resta |
| 32 | Oggi lombalgia; in anamnesi intervento al ginocchio sinistro cinque anni fa, ora asintomatico. | revisione 6: l'anamnesi resta nel Soggettivo, come anamnesi; nessuna scheda, esercizio o controllo per il ginocchio |
| 33 | Paziente di 45 anni con dolore alla spalla sinistra… Oggi terapia manuale ed esercizi di rotazione esterna con elastico. | revisione 6: la rotazione esterna è "Svolto oggi", con dosaggio suggerito se non detto; il riepilogo non dice «come ti ho mostrato» né dà a casa ciò che non è stato assegnato; scheda «corrispondente» e diagnosi «sospetta» |
| 31 | Dolore alla spalla destra e al ginocchio sinistro, trattati entrambi oggi. Dolore alla spalla in elevazione e al ginocchio scendendo le scale. | revisione 5: diagnosi come ipotesi; esercizi e dosaggi non detti come suggerimenti; nessuno studio di un distretto vicino come "stesso distretto"; nessun falso `section_region` sul Piano |

## Che cosa controllare in ogni sezione

- **Tolto dalla bozza** (pannello e report): ogni rimozione era davvero un dato non detto (nessuna rimozione di cose dette), e nessun dato inventato è rimasto nel testo.
- **Rilievi**:
  - solo ciò che è stato detto, e tutto ciò che è stato detto (nessun dato oggettivo riferito perso);
  - l'anamnesi riferita è presente, scritta come anamnesi, anche se il distretto è asintomatico, e non diventa un problema attuale;
  - se non è stato riferito nulla di oggettivo, la sezione è vuota e il pannello lo dice;
  - nessuna misura, test o trattamento aggiunti;
  - distretto e lato invariati.
- **Valutazione**:
  - nomina la condizione;
  - ipotesi presentate come ipotesi ("possibile", "compatibile"), non come diagnosi certe.
- **Piano**:
  - pertinente al distretto e alla condizione;
  - distingue ciò che è stato fatto oggi da ciò che è proposto;
  - lato corretto **per ogni distretto** nei casi multidistretto;
  - nessun distretto dell'anamnesi trattato come problema attuale.
- **Follow-up / sintesi per il paziente**:
  - nessun esercizio, dosaggio, frequenza o programma a casa che il fisioterapista non abbia indicato, e nessun «come ti ho mostrato» non documentato; al loro posto il rinvio alla conferma del fisioterapista;
  - nessun giorno, data o orario non detti;
  - nessun risultato futuro presentato come certo.
- **Ragionamento clinico**:
  - ipotesi e differenziali plausibili per i dati;
  - "informazioni mancanti" specifiche del caso;
  - red flag: quelle riferite, oppure "non indagate" se non se n'è parlato; mai dichiarate assenti se non è stato detto;
  - nessun risultato negativo non riferito ("nessun segno neurologico", "non sono stati riportati segni…", "senza altre complicazioni", "nessuna altra condizione acuta"), anche nel ragionamento clinico: al suo posto "La trascrizione non documenta …; da approfondire se indicato"; i negativi detti restano;
  - ipotesi etichettate come tali: nessuna diagnosi specifica presentata come certa sulla base del solo sintomo.
- **Spunti clinici (scheda e protocollo)**:
  - scheda dello stesso distretto e condizione, oppure "pertinenza non verificata" con il motivo;
  - la corrispondenza della scheda non è una diagnosi: la diagnosi è indicata a parte come «indicata da te», «sospetta, da confermare» o «non indicata da te»;
  - "non verificata: la diagnosi non risulta da ciò che hai detto" quando la condizione della scheda viene solo dalla valutazione;
  - per ogni altro distretto trattato oggi: lato, scheda (o "nessuna scheda") e motivo; mai una diagnosi più specifica di quella detta;
  - avviso "protocollo indicativo" presente.
- **Evidenze**:
  - "Evidenza indiretta" e "Pertinenza non verificata" mostrano il motivo;
  - nessuno studio di un altro distretto senza motivo;
  - uno studio su una popolazione o un meccanismo non indicati (adolescenti, trauma, chirurgia…) non è "diretto";
  - se non c'è nulla di pertinente, il messaggio "nessuno studio" invece di studi casuali.
- **Esercizi**:
  - distretto del caso, distretti vicini o attività generale (aerobica);
  - una posizione ("gomito vicino al corpo") o uno scopo ("per la spalla") non decidono il distretto dell'esercizio;
  - un esercizio con distretto non riconosciuto è mostrato come "pertinenza non verificata", con il motivo, e non viene tolto;
  - nessun esercizio per un distretto citato solo in anamnesi o negato;
  - "Dalla nota: …" quando l'esercizio del database ha un nome diverso, e l'esercizio del database ha lo stesso movimento;
  - "Corrispondenza non verificata" quando non è certo, senza sostituzione automatica;
  - origine indicata: "Svolto oggi", "Indicato da te" o "Suggerito dall'AI"; un dosaggio non detto è "suggerito", mai attribuito al fisioterapista;
  - il piano generato porta l'etichetta di proposta da confermare; sopra gli esercizi è indicato quanti esercizi e dosaggi sono proposti dall'AI e che il salvataggio li approva;
  - dosaggio presente.
- **Controlli di coerenza**:
  - gli esercizi esclusi indicano il distretto dell'esercizio e quello del caso;
  - "Aggiungi comunque" li rimette senza togliere nulla;
  - gli avvisi sono veri (nessun falso allarme) e non manca un errore evidente (nessun falso negativo).

## Scheda di registrazione

Il report dello script contiene già una scheda per ogni esecuzione. Formato:

| Caso | Ripetizione | Sezione | Esito (OK / errore) | Gravità (alta / media / bassa) | Che cosa | Serve revisione umana? |
|---|---|---|---|---|---|---|
| 1 | 1 | Esercizi | | | | |
| … | | | | | | |

**Gravità**:
- *alta*: distretto o lato sbagliati, dato clinico inventato, trattamento proposto presentato come eseguito, studio di un altro distretto presentato come diretto;
- *media*: contenuto poco pertinente ma segnalato, avviso falso;
- *bassa*: formulazione o utilità.

## Esito atteso

Su tutti i casi e su entrambe le ripetizioni:
- **zero errori di gravità alta non segnalati dal riquadro**;
- ogni errore segnalato corrisponde a un errore reale.

Gli errori di gravità alta che il riquadro **non** segnala vanno riportati con il testo del caso, perché indicano un limite del controllo deterministico.
