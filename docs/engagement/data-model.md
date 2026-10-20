# Programma di cura, attività e check-in — modello dati (D1)

Stato: **proposta, non applicata**. SQL: `sql/2026-10-20_care_program_PROPOSED.sql`.
Test: `tests/sql/care_program.sh`, su un PostgreSQL locale con le regole della produzione, solo dati sintetici.

Questo modello è la base di tre funzioni di My PHYGO e della dashboard:
- la **Daily Quest** (cosa fare oggi);
- l'**aderenza** (fatto rispetto a previsto);
- il **check-in di dolore e fatica**.

Non introduce punti né premi: sono previsti per la fase E, con un registro separato.

## Perché nuove tabelle

Oggi gli esercizi del paziente sono il JSON `notes.exercises` dell'ultima nota (`app/my-phygo/home/page.tsx`). Mancano diverse cose:
- un programma con date di inizio e fine;
- i giorni di riposo;
- le volte al giorno;
- una variante breve;
- un identificativo stabile a cui collegare ciò che il paziente dichiara.

Il registro non può vivere dentro la nota. La nota è il documento clinico del fisioterapista, e dalla PR #25 il paziente non la legge più direttamente.

Il programma **non sostituisce** la nota. Può citarla (`source_note_id`) e riprendere gli esercizi già prescritti, ma lo crea solo il fisioterapista.

## Tabelle

| Tabella | Cosa contiene | Chi scrive | Chi legge |
|---|---|---|---|
| `care_programs` | programma autorizzato: titolo, stato (`active`, `paused`, `maintenance`, `completed`), date, giorni di riposo (ISO 1–7). Al massimo uno in uso per paziente | il fisioterapista titolare della scheda, se può gestire pazienti (`can_manage_patients()`) | il titolare; il paziente collegato (solo i propri) |
| `care_program_items` | attività del programma: `exercise`, `checkin` o `education`; titolo, istruzioni, riferimento all'esercizio (`exercise_source` + `exercise_ref`), serie, ripetizioni, durata, giorni, volte al giorno, variante breve (`short_variant`), link https | come sopra | come sopra |
| `care_activity_logs` | cosa è stato fatto: giorno, sessione (`slot`), stato (`done`, `partial`, `skipped`), variante, quantità riferite, **provenienza** | il paziente (`patient_reported`, `camera_estimated`); il fisioterapista (`clinician_entered`); il server (`device_measured`) | il paziente (i propri); il titolare |
| `symptom_checkins` | dolore e fatica 0–10 (NRS), nota facoltativa fino a 280 caratteri; uno al giorno | il paziente | il paziente (i propri); il titolare |
| `care_attention_rules` | soglie di attenzione: dolore pari o superiore a, aumento rispetto al primo check-in, fatica, giorni senza aggiornamenti | solo il fisioterapista titolare | solo il fisioterapista titolare |

### Provenienza del dato (`care_activity_logs.provenance`)

| Valore | Significato | Chi può impostarlo |
|---|---|---|
| `patient_reported` | il paziente dichiara di aver svolto l'attività. Un clic non prova che l'esercizio sia stato eseguito correttamente | paziente |
| `camera_estimated` | conteggio stimato sul dispositivo dal prototipo con telecamera (fase F); `source_detail` contiene solo modello, versione e qualità, mai immagini | paziente (dal proprio dispositivo) |
| `device_measured` | misurato da un dispositivo collegato (fase G) | solo il server |
| `clinician_entered` | registrato dal fisioterapista, per esempio in studio | solo il fisioterapista titolare |

La stessa attività, nello stesso giorno, sessione e provenienza, si registra una sola volta (vincolo `care_logs_once`). Una richiesta ripetuta non crea doppioni.

## Regole applicate dal database

Non solo dall'interfaccia: valgono anche per una chiamata diretta all'API di Supabase.

- **Il programma lo scrive solo il fisioterapista.** Il paziente non crea programmi, non aggiunge esercizi, non cambia la dose e non cancella nulla. PHYGO non assegna esercizi da solo.
- **Si registra solo ciò che è prescritto, quando è prescritto:**
  - niente nei giorni di riposo;
  - niente nei giorni in cui l'attività non è prevista;
  - niente oltre le volte al giorno prescritte;
  - niente fuori dalle date del programma;
  - niente con il programma in pausa o concluso.

  Non c'è modo di "allenarsi di più" per ottenere qualcosa.
- **Variante breve:** si può registrare solo se il fisioterapista l'ha prescritta per quell'esercizio. PHYGO non riduce la dose da solo.
- **Il paziente registra solo oggi o ieri** (con un giorno di tolleranza per il fuso orario, come per la data di nascita). Può correggere stato e quantità, ma non spostare un record su un altro giorno o su un'altra attività.
- **Nessuna cancellazione dal browser** di attività e check-in. Scompaiono solo con la scheda del paziente (`ON DELETE CASCADE`).
- **Le soglie non sono visibili al paziente**, così le sue risposte non sono influenzate.
- **Accessi:** nessun accesso anonimo. Il paziente vede solo ciò che lo riguarda; un altro fisioterapista non vede nulla.

## Privacy (GDPR) — scheda per funzione

- **Dati trattati:**
  - dati relativi alla salute (art. 9 GDPR): programma riabilitativo, attività svolte, dolore e fatica riferiti;
  - nessun dato biometrico. La fase F conta le ripetizioni sul dispositivo e salva solo il numero e la qualità della stima: nessuna immagine o video, nessun fotogramma inviato al server.
- **Finalità:** supporto all'esecuzione del programma prescritto e monitoraggio da parte del fisioterapista che ha in cura il paziente. Nessun uso pubblicitario o di profilazione commerciale. Nessun uso per ricerca senza una governance separata (fase futura).
- **Minimizzazione:**
  - la nota del check-in è facoltativa e limitata a 280 caratteri;
  - non si raccolgono posizione, sonno o altri dati dei dispositivi personali;
  - `source_detail` è limitato a 2 KB e non contiene immagini.
- **Accessi:** paziente (solo i propri dati) e fisioterapista titolare della scheda. Il server, con il ruolo di servizio, solo per importazioni da dispositivi e solo dopo una verifica dedicata.
- **Conservazione:** per tutta la durata della scheda paziente. La cancellazione della scheda elimina programmi, attività, check-in e soglie. Da definire con il titolare del trattamento un termine di conservazione dopo la fine del ciclo di cura.
- **Rischi in caso di errore o accesso improprio:**
  - esposizione di dati sanitari a terzi, mitigata da RLS su ogni tabella, test di accesso incrociato e nessun accesso anonimo;
  - interpretazione errata dell'aderenza come peggioramento clinico, mitigata perché la dashboard mostrerà dati e definizioni, non diagnosi;
  - pressione sul paziente, mitigata da nessun premio per attività extra, rispetto dei giorni di riposo e soglie invisibili.
- **DPIA:** consigliata prima del pilota, insieme alle fasi F (telecamera) e G (dispositivi), perché si tratta di un trattamento sistematico di dati sanitari con monitoraggio.
- **Inquadramento regolatorio:**
  - il modulo registra e mostra dati: non calcola dosi, non suggerisce terapie, non interpreta misure;
  - eventuali funzioni future che producano raccomandazioni terapeutiche o misure cliniche automatiche richiedono una valutazione separata secondo il regolamento sui dispositivi medici (MDR, Regolamento (UE) 2017/745).

## Cosa non c'è ancora (prossime PR)

- **D2:** API e schermata Daily Quest in My PHYGO; modalità "Oggi ho poca voglia" (mostra solo una variante breve prescritta); check-in 0–10 con definizioni esplicite.
- **D3:** editor del programma per il fisioterapista (partendo dagli esercizi dell'ultima nota) e vista operativa: fatto/previsto, check-in da esaminare, giorni senza aggiornamenti, con definizioni precise.
- **E:** punti e traguardi non monetari, con un registro a sola aggiunta lato server.

## Attivazione

1. Il titolare approva e lancia lo SQL nell'editor SQL di Supabase.
2. Si verifica con la query in fondo al file: 5 tabelle con RLS attiva.
3. Fino al merge del codice D2/D3 le tabelle restano vuote e inutilizzate.

**Rollback:** il blocco nell'intestazione del file SQL rimuove le 5 tabelle e i dati registrati.
