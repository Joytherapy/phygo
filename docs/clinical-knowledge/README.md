# Libreria clinica: standardizzazione e crescita controllata

**Stato: proposta. Nulla di questo ramo è stato applicato al database di produzione.**
Le migrazioni sono state provate solo su un database PostgreSQL 16 locale e usa-e-getta (vedi §8).

Questo documento continua `docs/clinical-database-audit.md` (settembre 2026) e cambia metodo: i lotti precedenti scrivevano direttamente in produzione. Da qui in avanti i contenuti nuovi passano da una tabella di bozze privata, da un controllo automatico e da una revisione clinica, prima di diventare pubblici.

---

## 1. Fotografia del 12 ottobre 2026

Tutte le cifre provengono da query in sola lettura sul progetto Supabase `dckmumxswheamyymerea`.

| Misura | Valore |
|---|---|
| Righe in `knowledge_base` | **626**, con 626 nomi distinti |
| Duplicati certi (stessa condizione, nome diverso) | **6 coppie**, vedi `duplicate-review.csv` |
| Sovrapposizioni da decidere clinicamente | 7 coppie, più 1 fase con due versioni diverse |
| **Condizioni uniche stimate** | **612–620**: 620 se si uniscono i 6 duplicati certi, fino a 612 se si uniscono anche le sovrapposizioni |
| Protocolli a fasi (condizioni con `rehab_phases`) | **74 validi**. Il sito pubblico ne mostrava 75 perché contava anche una condizione cancellata |
| Fasi in `rehab_phases` | 254, di cui 8 copie esatte, 3 orfane di una condizione cancellata, 1 senza condizione |
| Esercizi attivi con video | 1.924 |
| Collegamenti esercizio ↔ condizione (`exercise_conditions`) | **0**: la tabella esiste ma è vuota |
| Protocolli testuali per sistema (`*_rehab`) | 68 righe, senza fasi |

**Completezza dei campi** (righe con il campo compilato, su 626):

| Campo | Righe | Campo | Righe |
|---|---|---|---|
| goals | 626 | return_to_activity_criteria | 420 |
| contraindications | 626 | outcome_measures | 425 |
| typical_exercises | 626 | source (testo libero) | 453 |
| red_flags | 622 | condition_keywords (sinonimi) | 442 |
| clinical_tests | 612 | pathophysiology / etiology / differential_diagnosis | 61 |
| progression_criteria | 587 | icd10_code (di cui verificati) | 61 (55) |
| evidence_level | 626 (vocabolario non uniforme, vedi sotto) | related_condition_ids | 0 |

- **Evidenze.**
  - 173 condizioni non hanno nessuna fonte.
  - Nelle altre 453 la fonte è testo libero: nessun DOI o PMID strutturato, nessuna verifica registrata.
  - `evidence_level` usa sei valori principali (moderate 318, low 134, high 122, strong 8, low-moderate 7, limited 3). In alcune righe contiene invece frasi intere.
- **Traduzioni.**
  - L'italiano è la lingua di partenza.
  - I nomi sono tradotti in en/es/fr per tutte le 626 condizioni.
  - Il contenuto completo è tradotto solo per 42 condizioni in inglese, 19 in spagnolo e 14 in francese; le altre traduzioni vengono generate da OpenAI alla prima visita.
  - Le fasi hanno traduzioni per 227 righe su 254.
- **Copertura per area** (una condizione può essere in più aree):

  | Area | Condizioni | Con protocollo |
  |---|---|---|
  | MSK/sport (zone corporee) | 235 | 63 |
  | Neurologia | 115 | 8 |
  | Cardiopolmonare | 73 | 3 |
  | Immuno | 47 | 1 |
  | Endocrino | 42 | 0 |
  | Pavimento pelvico | 39 | 1 |
  | Oncologia | 34 | 0 |
  | GI, ematologia, urinario | 29 ciascuna | 0 |
  | Non taggate | 15 | – |

  **I protocolli sono quasi tutti muscoloscheletrici.**

## 2. Problemi trovati

1. **Le pagine pubbliche si rompono.** I 18 merge di settembre hanno **cancellato** le righe ritirate.
   - Le pagine pubbliche di quegli id (`/library/condition/<id>-...` e le versioni en/es/fr) rispondono 404.
   - Le fasi della BPCO (#36) sono rimaste orfane: la BPCO sopravvissuta (#117) è senza protocollo.
2. **Manca una foreign key su `rehab_phases.condition_id`.** È questo che ha permesso le orfane del punto 1.
3. **Tre protocolli importati due volte** (#6, #57, #83): le pagine pubbliche mostravano ogni fase due volte.
   - Il ramo della landing (PR #3) ora mostra ogni fase una volta sola.
   - Il dato resta da pulire, ed è il passo 3 qui sotto.
4. **I controlli manuali sui duplicati non bastano.** Sei duplicati sono entrati con i lotti di espansione nonostante i controlli; per esempio #646 è lo stesso nome di #46 con le parole in un altro ordine.
5. **Non esiste uno stato di revisione.** Una condizione aggiunta oggi è subito pubblica e indistinguibile da una rivista da un clinico.
6. **Le fonti non sono tracciabili.** Il campo `source` non dice quale affermazione sostiene, né se l'identificativo esiste.

## 3. Template della condizione (17 punti → database)

| # | Punto del template | Dove vive | Nuovo? |
|---|---|---|---|
| 1 | Nome preferito e sinonimi | `condition_name`, `synonyms text[]` (+ `condition_keywords` per compatibilità) | `synonyms` |
| 2 | Classificazione e regione | `specialty`, `body_region` + tabelle di tag esistenti | sì |
| 3 | Quadro, presentazione, sintomi, limiti funzionali | `clinical_presentation` | sì |
| 4 | Anamnesi e valutazione | `assessment_considerations` | sì |
| 5 | Test clinici (scopo e limiti) | `clinical_tests` | – |
| 6 | Red flag, invio, urgenza | `red_flags` | – |
| 7 | Diagnosi differenziale | `differential_diagnosis` | – |
| 8 | Controindicazioni, precauzioni, sicurezza | `contraindications` | – |
| 9 | Obiettivi riabilitativi | `goals` | – |
| 10 | Interventi ed esercizi tipici | `typical_exercises` + `exercise_conditions` (oggi vuota) | – |
| 11 | Protocolli collegati | `rehab_protocol_conditions` | sì |
| 12 | Fasi riabilitative | tramite il protocollo (`rehab_phases.protocol_id`) | sì |
| 13 | Progressione e regressione | `progression_criteria` | – |
| 14 | Misure di outcome | `outcome_measures` | – |
| 15 | Ritorno all'attività | `return_to_activity_criteria` | – |
| 16 | Fonti e livello di evidenza | `clinical_sources` + `condition_sources(supports[])`, `evidence_level` | sì |
| 17 | Stato del contenuto, traduzione, revisione | `review_status`, `reviewed_by/at`, `review_notes`; `condition_translations.translation_status` | sì |

**"Non applicabile" e "mancante" non sono la stessa cosa.**
- Un campo che per quella condizione non ha senso va in `field_status` con stato `not_applicable` e un motivo. Esempio: il ritorno allo sport in una condizione neonatale.
- Un campo vuoto senza voce in `field_status` è semplicemente **mancante**.
- Red flag e controindicazioni non possono mai essere "non applicabili".
- Nessun campo va riempito con testo generico solo perché la scheda sembri completa.

## 4. Template del protocollo (15 punti → database)

Una condizione descrive il quadro clinico; un protocollo descrive un **percorso a fasi basato su criteri**. Usano lo stesso vocabolario, le stesse misure di outcome e gli stessi esercizi, ma restano risorse separate.

| # | Punto | Dove vive |
|---|---|---|
| 1 | Identificativo e titolo | `rehab_protocols.id`, `slug`, `title` |
| 2 | Indicazioni e condizioni collegate | `rehab_protocol_conditions` (molti-a-molti) |
| 3 | Popolazione | `population` |
| 4 | Inclusione / esclusione | `inclusion_criteria`, `exclusion_criteria` |
| 5 | Valutazione iniziale | `baseline_assessment` |
| 6 | Controindicazioni e precauzioni | `precautions` |
| 7 | Fasi | `rehab_phases` con `protocol_id` (il numero di fasi varia per protocollo) |
| 8 | Obiettivi e priorità di fase | `phase_goals` |
| 9 | Esercizi dal database PHYGO | `rehab_phase_exercises` (fase ↔ `exercises.id`), nessun esercizio duplicato |
| 10 | Dosaggio | `rehab_phase_exercises.dosage`, per fase e per esercizio |
| 11 | Progressione, mantenimento, regressione | `criteria_to_progress`, `regression_criteria`, `phase_criteria_to_start` |
| 12 | Rivalutazione e outcome | `reassessment` (fase), `reassessment_points` e `outcome_measures` (protocollo) |
| 13 | Ritorno all'attività o allo sport | `return_criteria` |
| 14 | Fonti | `protocol_sources(supports[])` |
| 15 | Revisione e approvazione | `review_status`, `reviewed_by/at`, `review_notes` |

I 74 protocolli esistenti (75 dopo il passo 3) diventano un record `rehab_protocols` ciascuno, con `legacy_condition_id`. Hanno fasi complete (obiettivi, esercizi, criteri, durata sempre presenti), ma i campi di livello protocollo (popolazione, precauzioni, fonti) sono vuoti. Vanno quindi contati come **"legacy, da standardizzare"**, non come completi.

## 5. Relazioni

```
knowledge_base ──< rehab_protocol_conditions >── rehab_protocols ──< rehab_phases ──< rehab_phase_exercises >── exercises
      │                                               │
      └──< condition_sources >── clinical_sources ──< protocol_sources
      └──< condition_translations (stesso id, una riga per lingua: le traduzioni non contano come condizioni)
      └──< condition_redirects (id ritirati → id sopravvissuto)
```

`rehab_phases.condition_id` resta per compatibilità: l'app di oggi lo legge e continua a funzionare senza modifiche.

## 6. Ciclo di vita e traduzioni

| Stato (`review_status`) | Significato | Chi lo imposta |
|---|---|---|
| `draft` | in lavorazione, può essere incompleto | import |
| `source_checked` | ogni campo compilato o motivato; ogni campo ha una fonte con DOI/PMID/URL verificabile | import, dopo il validatore |
| `clinical_review_pending` | pronto per la revisione clinica | import |
| `clinically_reviewed` | rivisto da un clinico (nome e data registrati) | **solo il revisore, nel database** |
| `approved` | approvato per la pubblicazione | **solo il revisore, nel database** |

- Le 626 condizioni esistenti diventano `clinical_review_pending`: sono pubbliche, ma nessun clinico le ha formalmente approvate in PHYGO. Nessun contenuto viene etichettato come validato.
- Le traduzioni esistenti diventano `machine_generated`. Diventano `human_reviewed` solo dopo una revisione nominativa.
- Le bozze vivono in `clinical_content_drafts`: nessuna policy pubblica, quindi solo il service role le vede. Nessuna bozza compare nell'app.
- `promote_condition_draft(slug)` pubblica una bozza. Rifiuta tutto ciò che non è `approved` e non crea mai due righe per lo stesso slug.

## 7. Regole

**Duplicati** (applicate da `scripts/clinical-knowledge/validate.mjs`):
- **Bloccante**: stesso nome o sinonimo, normalizzato senza accenti e punteggiatura, di una condizione esistente o di un altro record nello stesso file.
- **Bloccante**: stesse parole in ordine diverso.
- **Avviso, da decidere**: nomi simili (indice di Jaccard ≥ 0,5). Due condizioni restano distinte quando valutazione, rischi o gestione cambiano in modo sostanziale. Per esempio tibiale anteriore e tibiale posteriore sono distinte.
- **Non sono condizioni nuove** una traduzione, un titolo cambiato o un "angolo" diverso sulla stessa malattia ("— esercizio fisico", "— attività sportiva").

**Evidenze**:
- Ogni fonte ha un DOI, un PMID o un URL e dichiara quali campi sostiene (`supports`).
- Con `--verify-online` il validatore interroga PubMed e Crossref. Fallisce se l'identificativo non esiste o corrisponde a un altro articolo.
- Non si inventano mai DOI, PMID, linee guida, valori di accuratezza diagnostica, dosaggi, soglie di progressione, criteri di ritorno allo sport, livelli di evidenza o approvazioni cliniche.
- Raccomandazione con fonte, pratica comune, opinione di esperti ed evidenza incerta vanno dichiarate come tali nel testo e nel livello di evidenza.
- L'AI può aiutare a scrivere bozze e traduzioni, ma un testo generato non diventa mai "clinicamente validato" senza revisione.

**Protocolli**:
- Le fasi sono numerate 1..n e ognuna ha uno scopo clinico.
- Servono criteri per passare alla fase successiva.
- Gli esercizi sono quelli della libreria PHYGO, citati per id.
- Il validatore segnala lo stesso dosaggio copiato in tutte le fasi.
- Un protocollo nuovo conta solo se rappresenta una distinzione clinica reale.

## 8. Come si applica, in sicurezza

**File** (cartella `sql/`):

| Passo | File | Cosa fa | Rollback |
|---|---|---|---|
| 1 | `2026-10_clinical_knowledge_01_schema.sql` | solo aggiunte: colonne, tabelle, stati, protocolli legacy, bozze | `..._01_rollback.sql` |
| 2 | `2026-10_clinical_knowledge_02_condition_redirects.sql` | registra i 18 merge storici (vecchio id → nuovo id) | `drop table condition_redirects;` |
| 3 | `2026-10_clinical_knowledge_03_phase_integrity.sql` | backup, poi: toglie 8 fasi copiate, riporta la BPCO su #117, toglie la fase senza condizione, aggiunge la foreign key | `..._03_rollback.sql` |

**Test riproducibile.** `scripts/clinical-knowledge/test/run.sh` crea un database locale con lo stesso schema e gli stessi id, nomi e impronte md5 delle fasi di produzione. Poi:
1. applica i passi 1–3 **due volte** e controlla ogni numero atteso:
   - 245 fasi, 75 protocolli, 18 redirect;
   - nessuna fase senza protocollo;
   - foreign key presente;
2. prova l'importazione delle bozze (due volte, nessun doppione) e il blocco delle bozze non approvate;
3. esegue ogni rollback e verifica che dati e colonne tornino identici all'originale.

Esito al 12 ottobre 2026: **tutti i controlli superati**. Anche `node --test scripts/clinical-knowledge/lib.test.mjs` passa: 12 test, tra cui il riconoscimento dei duplicati reali #46/#646 e #423/#473.

**Procedura proposta per la produzione** (da eseguire solo dopo la tua approvazione):
1. Creare un **branch di database Supabase** o un progetto di staging (ha un costo; va autorizzato) e applicare lì i passi 1–3.
2. Verificare che le pagine pubbliche e il dashboard funzionino su quel branch.
3. Fare un backup: Supabase Database → Backups, o almeno `pg_dump` di `knowledge_base`, `rehab_phases` e `condition_translations`.
4. Applicare i passi in produzione, uno alla volta, rileggendo i conteggi dopo ciascuno.
5. Se qualcosa non torna: rollback del passo, in ordine inverso.

**Attenzione**: dopo il passo 3, cancellare una condizione che ha fasi viene **rifiutato** dalla foreign key. È voluto: un merge futuro deve prima spostare le fasi e registrare il redirect.

## 9. Come entrano i contenuti nuovi

1. Esportare l'indice attuale con `scripts/clinical-knowledge/export-index.sql`: contiene solo nomi e sinonimi.
2. Preparare un file JSON nel formato di `scripts/clinical-knowledge/examples/dataset.example.json`.
3. Lanciare `node scripts/clinical-knowledge/validate.mjs dati.json --index indice.json --verify-online --report report.json`. Con errori ci si ferma.
4. Generare l'SQL con `node scripts/clinical-knowledge/build-drafts-sql.mjs dati.json report.json > bozze.sql`. Scrive **solo** in `clinical_content_drafts`; rilanciarlo non crea doppioni.
5. Revisione clinica nel database: impostare `review_status`, `reviewed_by` e `reviewed_at`.
6. Pubblicazione, una condizione per volta: `select promote_condition_draft('slug');`.

La promozione dei protocolli (bozza → `rehab_protocols` + fasi + esercizi) è il prossimo pezzo da scrivere, sullo stesso modello.

## 10. Piano realistico verso 800 condizioni e 100 protocolli

**Condizioni.** Dopo i merge si parte da 612–620 condizioni uniche, quindi ne servono **180–188 davvero nuove**. Ritmo dei lotti di settembre: circa 4–11 condizioni per lotto con ricerca delle fonti. Contando revisione clinica e verifica delle fonti, è un lavoro editoriale di più settimane. Priorità suggerite, dalle aree più sottili rispetto al carico reale:
1. pavimento pelvico e salute pelvica maschile;
2. neurologia ambulatoriale (oggi 115 voci ma 8 protocolli);
3. pediatria;
4. condizioni MSK comuni non ancora presenti, da verificare contro l'indice con il validatore;
5. oncologia post-trattamento;
6. le 15 condizioni non taggate vanno classificate (non sono nuove).

**Protocolli.** Oggi 74 validi, 75 dopo il passo 3, quindi ne servono **almeno 25**.
- `protocol-candidates.csv` elenca 44 condizioni già presenti, con fonte e livello di evidenza alto o forte, senza protocollo: per esempio fratture comuni, ictus, Parkinson, incontinenza, BPCO già recuperata, diabete, osteoporosi.
- Altra fonte di candidati: i 68 protocolli testuali delle tabelle `*_rehab`, che si possono strutturare in fasi solo dove le fonti lo permettono.
- Per ogni protocollo vanno riportati separatamente: completo, bozza, tradotto, fonti verificate, approvato clinicamente.

**Conteggi da mostrare internamente** (mai pubblicizzare 800 o 100 prima che siano reali):

| | Oggi |
|---|---|
| Condizioni uniche | 612–620 |
| Complete secondo il nuovo template | 0 (i punti 3 e 4 non esistevano) |
| Complete sui 9 campi storici + fonte | circa 420 |
| Approvate clinicamente | 0 |
| Protocolli validi | 74 (legacy, da standardizzare) |
| Protocolli approvati clinicamente | 0 |

## 11. Modifiche all'app da fare dopo (fuori da questo ramo)

Questo ramo non tocca il codice dell'app, per non entrare in conflitto con la PR #3.

1. Pagine condizione: se l'id non esiste, cercarlo in `condition_redirects` e fare un redirect permanente.
2. Pagine condizione: leggere le fasi da `rehab_protocols` (oggi le legge per `condition_id`, che continua a funzionare).
3. Conditions library nel dashboard: mostrare i protocolli collegati (oggi non mostra le fasi).
4. Etichetta "contenuto in attesa di revisione clinica" sulle schede `clinical_review_pending`, se lo decidi.
5. Popolare `exercise_conditions` e `rehab_phase_exercises` per collegare davvero esercizi e condizioni.

## 12. Decisioni che servono a te

1. Applicare i passi 1–3: prima su un branch di database Supabase (costo da autorizzare), poi in produzione.
2. I 6 duplicati certi e le 7 sovrapposizioni in `duplicate-review.csv`, compresa la fase 2 del protocollo #57 con due versioni.
3. Chi fa la revisione clinica (nome che finisce in `reviewed_by`) e con quale criterio di approvazione.
4. Se mostrare pubblicamente lo stato "in attesa di revisione clinica" sulle schede esistenti.
5. Quali aree priorizzare per le 180+ condizioni e i 25+ protocolli mancanti.
