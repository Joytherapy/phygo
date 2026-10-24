# Verifica manuale sul preview: pertinenza clinica con il modello AI reale

La suite automatica (`tests/clinical-relevance.test.mjs`) usa risposte del
modello **simulate**. Verifica che cosa fa PHYGO con quelle risposte: filtri,
abbinamenti, scheda clinica, studi, controlli di coerenza. **Non** verifica che
cosa scrive davvero il modello con i nuovi prompt. Questa procedura serve a
quello, sul deploy di preview della PR, con casi solo sintetici.

## Preparazione

1. Aprire il link di preview della PR (Vercel → Deployments → Preview).
2. Accedere con un account professionista verificato di prova.
3. Creare un paziente fittizio, ad esempio **"TEST – non reale"**. Non usare pazienti reali e non incollare dati reali nelle note.
   - Il preview può usare lo stesso database di produzione: alla fine eliminare il paziente fittizio e le sue note.
4. Ogni nota genera chiamate a OpenAI, a pagamento come in produzione. Il giro completo è di circa 16 note più le ripetizioni.

## Come eseguire ogni caso

1. Pagina del paziente fittizio → Seduta → **Scrivi**.
2. Incollare il testo del caso e premere **Genera nota**.
3. Compilare una riga della scheda di registrazione (in fondo) per **ogni sezione**:
   - Rilievi, Valutazione, Piano, Follow-up/sintesi per il paziente, Ragionamento clinico;
   - Spunti clinici (scheda e protocollo), Evidenze, Esercizi, Controlli di coerenza.
4. Ripetere ogni caso **2 volte**: il modello non dà sempre la stessa risposta.
5. Eseguire i casi 1 → 4 → 6 di seguito, senza ricaricare la pagina, per controllare che non ci sia contaminazione tra casi.

## Casi (testi sintetici)

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

## Che cosa controllare in ogni sezione

- **Rilievi**:
  - solo ciò che è stato detto;
  - nessuna misura, test o trattamento aggiunti;
  - distretto e lato invariati.
- **Valutazione**:
  - nomina la condizione;
  - ipotesi presentate come ipotesi ("possibile", "compatibile"), non come diagnosi certe.
- **Piano**:
  - pertinente al distretto e alla condizione;
  - distingue ciò che è stato fatto oggi da ciò che è proposto;
  - lato corretto.
- **Follow-up / sintesi per il paziente**:
  - nessun giorno, data o orario non detti;
  - nessun risultato futuro presentato come certo.
- **Ragionamento clinico**:
  - ipotesi e differenziali plausibili per i dati;
  - "informazioni mancanti" specifiche del caso;
  - red flag presenti o esplicitamente assenti.
- **Spunti clinici (scheda e protocollo)**:
  - scheda dello stesso distretto e condizione;
  - avviso "protocollo indicativo" presente.
- **Evidenze**:
  - "Evidenza indiretta" e "Pertinenza non verificata" mostrano il motivo;
  - nessuno studio di un altro distretto senza motivo;
  - se non c'è nulla di pertinente, il messaggio "nessuno studio" invece di studi casuali.
- **Esercizi**:
  - distretto del caso, distretti vicini o lavoro generale;
  - "Dalla nota: …" quando l'esercizio del database ha un nome diverso;
  - dosaggio presente.
- **Controlli di coerenza**:
  - gli esercizi esclusi indicano il distretto dell'esercizio e quello del caso;
  - "Aggiungi comunque" li rimette senza togliere nulla;
  - gli avvisi sono veri (nessun falso allarme) e non manca un errore evidente (nessun falso negativo).

## Scheda di registrazione

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
