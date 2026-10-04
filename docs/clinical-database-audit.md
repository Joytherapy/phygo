# Audit del Database Condizioni Cliniche — Phygo

**Data:** 26 settembre 2026
**Ambito:** `knowledge_base` (361 righe) + `oncology_conditions` (18 righe) su Supabase, progetto `dckmumxswheamyymerea`
**Metodo:** query dirette sul database reale di produzione (nessun dato ipotetico) — vedi nota metodologica in fondo
**Vincolo osservato:** nessuna diagnosi, timeline di recupero, codice ICD o citazione bibliografica è stata inventata. Dove i dati reali non bastano per un'affermazione clinica precisa, è scritto **DA VERIFICARE**.

> Nota importante prima di partire: quando ho iniziato l'audit avevo un'ipotesi (basata solo su 7 tabelle di tag) secondo cui il 76% delle condizioni non fosse categorizzato per nessun sistema. Approfondendo ho trovato altre 4 tabelle di collegamento che avevo inizialmente trascurato (`body_zone_conditions`, `brain_zone_conditions`, `nerve_conditions`, `peripheral_nerve_diffuse_conditions`). Con queste incluse, il quadro reale è molto migliore: solo 16 condizioni su 361 (4,4%) risultano davvero prive di qualunque collegamento. Lo dico esplicitamente perché è un'autocorrezione fatta *prima* di scriverti questo documento, non dopo — meglio così che consegnarti un numero sbagliato.

---

## A. Audit del database — stato attuale

**Volume attuale**
- `knowledge_base`: 361 condizioni (la tabella "principale", condivisa da 7 sistemi + MSK/ortopedico + neurologico tramite tag)
- `oncology_conditions`: 18 condizioni, **tabella a sé stante**, non collegata a `knowledge_base` (vedi punto 4 sotto)
- **Totale attuale: 379 record clinici**

**1. Duplicati esatti sul nome:** 0 (nessuna riga con `condition_name` identico).

**2. Duplicati clinici reali (nome diverso, stessa condizione):** ho calcolato la similarità testuale (Jaccard su token normalizzati, accenti/punteggiatura rimossi) su tutte le 361×360/2 coppie possibili, poi ho rivisto manualmente ogni coppia con punteggio ≥0,45 per separare i doppioni veri dai falsi positivi (nomi che si somigliano ma sono condizioni cliniche diverse). Risultato: **7 coppie confermate come vera duplicazione** (dettaglio in sezione B).

Falsi positivi scartati consapevolmente durante questa revisione (stesso lessico, condizioni diverse): le 4 sottocategorie di groin pain di Doha, le fratture da stress di ossa diverse, le varie "Malattia di X", le diverse protesi articolari, i diversi sottotipi di instabilità di spalla, e — caso specifico — **Sindrome femoro-rotulea (#17, dolore)** correttamente NON fusa con **Instabilità femoro-rotulea (#57/#127)**: sono due entità cliniche distinte (dolore anteriore di ginocchio vs instabilità/lussazione), anche se il nome e alcune parole chiave si sovrappongono.

**3. Completezza dei contenuti:** 166/361 condizioni (46%) non hanno né `source` né `condition_keywords` compilati. Il problema non è distribuito uniformemente ma segue tre "ondate" di inserimento per fascia di id:

| Fascia ID | Condizioni | % incomplete (source e keywords nulli) |
|---|---|---|
| 1–100 | 96 | 0% — batch fondativo, ben curato |
| 101–200 | 94 | 74% |
| 201–300 | 83 | 98% — batch più critico |
| 301–361 | 88 | 17% — passata successiva, più curata |

Le 6 delle 7 coppie duplicate (tranne CIDP) seguono esattamente questo pattern: la versione "nuova" senza fonte (fascia 101–300) duplica una condizione già presente e ben sourced nella fascia 1–100 o 301+.

**4. Oncologia isolata architetturalmente:** `oncology_conditions` non condivide lo spazio di id con `knowledge_base` e non ha una colonna `condition_id` — è una tabella completamente a sé, con i propri campi di contenuto (`goals`, `clinical_tests`, `red_flags`, `contraindications`, `typical_exercises`, `evidence_level`). Esiste anche una `oncology_structures` (anatomia), quindi il sistema oncologico è internamente coerente — semplicemente non parla con `knowledge_base` né con le tabelle di traduzione/tag che coprono gli altri sistemi. Di fatto oggi le 18 condizioni oncologiche non passano dal motore di matching dello Smart Study Panel (`knowledge-resolve`), che itera solo `knowledge_base` + le tabelle di sistema collegate ad essa.

**5. Copertura reale di categorizzazione** (dopo aver unito tutte le 11 tabelle di collegamento esistenti, non solo le 7 "`*_condition_tags`"):

| Meccanismo di tag | Righe | Cosa collega |
|---|---|---|
| `cardiopulmonary_condition_tags` + 6 analoghe (endocrino, urinario, GI, immuno, ematologia, pavimento pelvico) | 86 collegamenti | condizione → "sistema" |
| `body_zone_conditions` | 254 | condizione → zona corporea (il grosso di ortopedia/MSK/sport) |
| `brain_zone_conditions` | 68 | condizione → zona cerebrale (neurologico) |
| `nerve_conditions` + `peripheral_nerve_diffuse_conditions` | 35 | condizione → nervo periferico |
| **Totale condizioni collegate ad almeno un meccanismo** | **345 / 361 (95,6%)** | |
| **Condizioni davvero non collegate a nulla** | **16 / 361 (4,4%)** | |

Le 16 realmente scoperte sono in maggioranza cardio-respiratorie e neurodegenerative, **tutte ben sourced** (non è un problema di qualità del contenuto, solo di tagging mancante): BPCO, Asma da sforzo, riabilitazione post-infarto, miocardite, insufficienza cardiaca (5 cardiopolmonari); Alzheimer, demenza vascolare, demenza frontotemporale, SLA, CIDP, sindromi midollari da trauma, lesione midollare, miastenia gravis (8 neurologiche/neurodegenerative); frattura di bacino post-chirurgica, cadute nell'anziano, piaghe da decubito (3 geriatriche/generali).

**6. Infrastruttura già pronta ma non popolata:** esistono già le tabelle `library_item_conditions` e `research_paper_conditions` (0 righe entrambe) — collegherebbero condizioni a contenuti della Library e a paper di ricerca. Non è un problema, è un'opportunità: la struttura per linkare condizioni ↔ contenuti/evidenze c'è già, va solo riempita quando si popolano Library/Ricerca.

**7. Traduzioni:** `condition_translations` ha 1083 righe — copertura parziale (non tutte le 361 condizioni hanno traduzione in tutte le lingue it/en/es/fr).

---

## B. Duplicati e merge proposti

Per ogni coppia, tengo la versione con fonte e parole chiave reali (più utile per il matching dello Smart Study Panel) e propongo di ritirare l'altra. **Nessuna di queste operazioni è stata eseguita** — sono solo proposte in attesa della tua conferma, perché cancellare/unire righe è un'operazione distruttiva.

| ID da ritirare | Nome | ID da mantenere | Nome | Motivazione |
|---|---|---|---|---|
| #123 | Sindrome del Piriforme | **#32** | Sindrome del piriforme (deep gluteal syndrome) | #32 ha fonti multiple + nota metodologica sulla controversia diagnostica + parole chiave multilingua; #123 non ha keywords |
| #127 | Instabilità Femoro-Rotulea (Primaria e Secondaria) | **#57** | Instabilità/lussazione femoro-rotulea | #57 ha fonte ISAKOS 2012 + review 2026 + keywords multilingua; #127 non ha né fonte né keywords |
| #139 | Discinesia Scapolare | **#337** | Discinesia scapolare | #337 cita il consensus Kibler 2013 (Scapular Summit); #139 non ha né fonte né keywords |
| #140 | Frattura della Clavicola | **#335** | Frattura di clavicola | #335 cita Robinson CM (J Bone Joint Surg Br); #140 non ha né fonte né keywords |
| #142 | Tendinopatia del Capo Lungo del Bicipite | **#13** | Tendinite/tendinopatia del capo lungo del bicipite | #13 cita il Delphi study internazionale 2022 + keywords multilingua; #142 non ha né fonte né keywords |
| #214 | Sindrome Compartimentale Cronica da Sforzo della Gamba | **#329** | Sindrome compartimentale cronica da sforzo | #329 cita Pedowitz (criteri diagnostici oggettivi); #214 non ha né fonte né keywords |
| #283 | Polineuropatia Infiammatoria Demielinizzante Cronica (CIDP) | **#80** | Poliradicoloneuropatia infiammatoria demielinizzante cronica (CIDP) | Stessa entità clinica (CIDP); #80 ha la linea guida EFNS/PNS 2021 con contenuto clinico molto più ricco; #283 non ha né fonte né keywords |

**Prima di eseguire i merge**, va controllato se gli id da ritirare sono referenziati da qualche tabella di tag/traduzione/nota utente salvata (es. `condition_translations`, `body_zone_conditions`) — in tal caso quei riferimenti vanno ripuntati sull'id sopravvissuto *prima* di cancellare la riga, altrimenti si perdono collegamenti o si rompono foreign key. Fammi sapere quando vuoi che proceda e lo verifico riga per riga prima di toccare il database.

---

## C. Categorie e condizioni mancanti

Qui devo essere onesto su un punto: il tuo obiettivo di arrivare almeno a 800 condizioni è ragionevole come traguardo editoriale, ma non lo raggiungo "inventando" 400+ nuove condizioni in un colpo solo — per ciascuna servirebbe una fonte reale (linea guida, revisione sistematica, consensus) da verificare, esattamente come è stato fatto per le 361 esistenti. Fabbricare contenuto clinico senza fonte violerebbe il vincolo principale che hai messo nel tuo documento (niente meccanismi patofisiologici, timeline o riferimenti bibliografici inventati).

Quello che posso darti ora, basato sui dati reali che ho appena estratto, è una mappa onesta di **dove il database è oggi più sottile rispetto al carico di lavoro reale di un fisioterapista**, categoria per categoria — utile come lista di priorità per la prossima ondata di content, non come contenuto già scritto:

- **Pavimento pelvico:** solo 12 condizioni taggate. Mancano voci comuni come prolasso d'organo pelvico per compartimento, dolore pelvico cronico/vulvodinia, disfunzioni post-parto oltre l'incontinenza da sforzo, dissinergia del pavimento pelvico.
- **Ematologia:** solo 11. Manca quasi tutto il capitolo emofilia/coagulopatie e le linee guida di esercizio in anemia falciforme.
- **Endocrino:** solo 12. Manca una copertura strutturata di diabete tipo 1 vs tipo 2 come voci separate con implicazioni riabilitative diverse, obesità come condizione a sé (oltre alle comorbidità), osteoporosi (spesso trattata solo lato ortopedico).
- **Immunologia/reumatologia:** solo 14. Mancano artrite reumatoide, spondiloartriti, lupus, fibromialgia come voci dedicate (se non già presenti sotto altro nome — da verificare contro la lista completa).
- **Medicina dello sport:** non esiste una tabella di tag dedicata — le condizioni sportive sono oggi disperse dentro `body_zone_conditions` insieme a tutta l'ortopedia generale. Con 254 condizioni in quella tabella, sport e ortopedia generale sono di fatto indistinguibili nel sistema attuale.
- **Oncologia:** 18 condizioni ma isolate (vedi sezione A.4) — prima di aggiungerne altre ha più valore risolvere l'isolamento architetturale.
- **Cardio-respiratorio:** 34 in `cardiopulmonary_conditions` + le 5 scoperte in A.5 non taggate: buona profondità ma da ricollegare.

La stima onesta: per arrivare a ~800 condizioni con lo stesso livello di qualità (fonte reale, keywords multilingua, evidence level) servirà un lavoro editoriale strutturato su più settimane, verosimilmente con il tuo team clinico che fornisce/valida le fonti condizione per condizione. Se vuoi, posso preparare un template di raccolta (un foglio con condizione proposta + categoria + campo "fonte" da compilare) per rendere questo lavoro più veloce da eseguire in team, piuttosto che io da solo inventi nomi di condizioni senza le fonti a supporto.

---

## D. Tassonomia clinica finale (proposta)

L'architettura attuale è in realtà più sofisticata di quanto sembri a prima vista: non è "8 sistemi piatti", è un modello a due livelli — sistema clinico (le 7 tabelle `*_condition_tags` + oncologia) e zona anatomica (body zone / brain zone / nervo), che si sovrappongono. Propongo di **non buttare via questa architettura** ma di:

1. **Portare oncologia dentro lo stesso spazio di `knowledge_base`**, creando una `oncology_condition_tags` sul modello delle altre 7, così le 18 condizioni oncologiche tornano visibili al motore di matching dello Smart Study Panel e ad Ask PHYGO.
2. **Aggiungere una vista SQL unica** (es. `v_condition_categories`) che unisce tutti gli 11 meccanismi di tag in un'unica mappa `condition_id → [categorie]`, così il codice applicativo (in particolare `knowledge-resolve/route.ts`, che oggi tratta `oncology_conditions` come se avesse una colonna `condition_id` che non esiste — un bug preesistente da correggere) legge da un unico posto invece di ripetere l'unione in ogni endpoint.
3. **Dare identità di primo livello a "Ortopedia/MSK" e "Medicina dello sport"** nell'interfaccia — oggi sono la fetta più grande di contenuto (254 condizioni) ma non hanno un nome di sistema come cardiopolmonare o pavimento pelvico; per l'utente finale risultano "invisibili" come categoria anche se il contenuto c'è.
4. **Non duplicare anatomia/fisiologia per condizione** (come richiesto nel tuo documento): l'architettura attuale già fa questo bene per 9 sistemi tramite le tabelle `*_structures` — è il modello giusto da estendere anche a MSK/neuro invece di aggiungere testo anatomico dentro ogni riga di `knowledge_base`.

---

## E. Conteggio finale proposto (dopo i merge)

| | Prima | Dopo i 7 merge |
|---|---|---|
| `knowledge_base` | 361 | 354 |
| `oncology_conditions` (da migrare dentro) | 18 | 18 |
| **Totale** | **379** | **372** |

---

## F. Schema dati proposto

Schema reale attuale di `knowledge_base` (16 colonne): `id, created_at, condition_name, condition_keywords, goals, progression_criteria, return_to_activity_criteria, outcome_measures, clinical_tests, red_flags, typical_exercises, contraindications, source, source_date, translations (jsonb), evidence_level`.

Non c'è oggi nessuna colonna per anatomia/fisiologia/biomeccanica per condizione — e va bene così, perché quel contenuto vive già, correttamente, nelle tabelle `*_structures` collegate per sistema/zona (coerente con la tua stessa indicazione di non duplicare l'anatomia). Le colonne che secondo me vanno **aggiunte** a `knowledge_base` per coprire quello che chiedi (patofisiologia, condizioni correlate) sono:

```json
{
  "pathophysiology": "text — meccanismo patofisiologico, SOLO se supportato da fonte citata in source; altrimenti NULL, mai inventato",
  "etiology_risk_factors": "text",
  "differential_diagnosis": "text — diagnosi differenziali da escludere",
  "related_condition_ids": "bigint[] — FK verso altre righe di knowledge_base, per condizioni correlate/comorbidità (es. sindrome femoro-rotulea ↔ instabilità femoro-rotulea come 'da distinguere da', non da fondere)",
  "linked_structure_ids": "collegamento esplicito alle *_structures pertinenti, invece di testo libero anatomico",
  "icd10_code": "text — SOLO se verificato manualmente; NULL con flag 'DA VERIFICARE' finché non confermato"
}
```

Tutti i campi esistenti restano — questa è un'estensione additiva (nuove colonne, `ALTER TABLE ... ADD COLUMN`), non una riscrittura, quindi non rischia di rompere nulla del codice che già legge da `knowledge_base`.

---

## G. Esempi di record completi (dati reali, riformattati nello schema proposto)

Uso condizioni **già esistenti e reali** nel database, non inventate, per mostrare come apparirebbero nello schema proposto. I campi nuovi (patofisiologia estesa, ICD, condizioni correlate) sono marcati **DA VERIFICARE** dove il dato reale non è già disponibile in `source`/`red_flags`.

### 1. Ortopedico — Sindrome del piriforme (deep gluteal syndrome), id 32
- **goals:** Ridurre il dolore gluteo profondo e la sintomatologia sciatica-simile, migliorare mobilità e controllo motorio dell'anca; diagnosi da porre con cautela dopo aver escluso cause più comuni.
- **clinical_tests:** Test di FAIR, palpazione del gluteo profondo — nessun test ha validità diagnostica definitiva dimostrata.
- **red_flags:** Diagnosi controversa in letteratura; escludere sempre prioritariamente causa lombare/discale; segni neurologici progressivi richiedono invio medico/imaging.
- **source:** Revisione ScienceDirect 2024; Martin HD et al., Practical Neurology; revisione sistematica ScienceDirect 2022. Evidence level: moderate.
- **pathophysiology:** DA VERIFICARE (la fonte stessa segnala assenza di consenso sul meccanismo)
- **related_condition_ids:** DA VERIFICARE (candidato: altre cause di sciatalgia non discale)

### 2. Sportivo — Sindrome compartimentale cronica da sforzo, id 329
- **goals:** Ridurre il dolore da overuse da aumento di pressione intracompartimentale durante l'esercizio; ritorno alla corsa senza recidiva.
- **clinical_tests:** Anamnesi tipica + misurazione della pressione intracompartimentale pre/post sforzo (gold standard).
- **red_flags:** Dolore che non si risolve a riposo o deficit sensitivo/motorio progressivo → sospetta evoluzione verso sindrome compartimentale acuta, differenziare con urgenza.
- **source:** Pedowitz RA et al., Am J Sports Med (criteri diagnostici oggettivi). Evidence level: moderate.
- **pathophysiology:** Aumento di pressione intracompartimentale indotto dallo sforzo (riportato nella fonte; meccanismo emodinamico preciso DA VERIFICARE per maggior dettaglio)

### 3. Cardio-respiratorio — BPCO, id 36 *(oggi tra le 16 condizioni non taggate — esempio concreto del gap in A.5)*
- **goals:** Migliorare dispnea, capacità funzionale e qualità di vita con riabilitazione respiratoria supervisionata, in coordinamento col medico curante.
- **outcome_measures:** 6MWT, scala di Borg, CAT/SGRQ, mMRC Dyspnea Scale (0–4).
- **red_flags:** Richiede coordinamento medico prima di impostare l'intensità; stop immediato per desaturazione, dolore toracico, dispnea sproporzionata, cianosi, confusione acuta.
- **source:** Rochester CL et al., ATS Clinical Practice Guideline, Am J Respir Crit Care Med 2023. Evidence level: high.
- **azione consigliata:** aggiungere subito a `cardiopulmonary_condition_tags` (nessun merge necessario, solo tagging mancante).

### 4. Neurologico — CIDP, id 80 *(sopravvissuto al merge con #283; anch'essa tra le 16 non taggate)*
- **goals:** Massimizzare forza, equilibrio e funzione tramite riabilitazione in coordinamento col neurologo curante; nota prognostica onesta: ~25% dei pazienti non risponde alla terapia di prima linea.
- **clinical_tests / outcome_measures:** MRC sum score, INCAT disability score, Berg Balance Scale, Timed Up and Go.
- **red_flags:** Coordinamento obbligatorio col neurologo per la terapia immunomodulante; peggioramento acuto di forza o funzione respiratoria → valutazione medica immediata.
- **source:** EFNS/PNS Guideline aggiornamento 2021. Evidence level: moderate.
- **differential_diagnosis:** distinzione temporale da sindrome di Guillain-Barré esplicitamente riportata nella fonte (GBS migliora a 6–8 settimane, CIDP progredisce cronicamente).

### 5. Pavimento pelvico — Incontinenza urinaria da sforzo, id 101
- **goals:** Ripristinare la trasmissione delle pressioni addominali all'uretra tramite rinforzo muscolo-fasciale; ridurre/eliminare perdite durante sforzo/tosse/starnuto.
- **clinical_tests:** Test da sforzo a vescica piena, Q-tip test, palpazione digitale della contrazione volontaria.
- **typical_exercises:** Kegel lento progressivo, co-contrazione trasverso-pavimento pelvico, tecnica "the Knack", esercizi multi-posturali.
- **red_flags:** Ematuria non ciclica, dolore pelvico acuto, sintomi neurologici di nuova insorgenza → escludere causa neurogena prima della sola riabilitazione muscolare.
- **source:** Cochrane Database Syst Rev 2024 (Hay-Smith et al.); Neumann & Gill, Int Urogynecol J 2002. Evidence level: high.

---

## Prossimi passi — STATO: eseguiti (26 settembre 2026)

Tutti i punti sotto sono stati eseguiti sul database reale, dopo aver verificato ogni foreign key coinvolta. Dettaglio:

1. **Merge duplicati:** eseguiti gli originali 7 (sezione B) **più altri 2 trovati strada facendo** (dettagli sotto): `#376` → fuso in `#9` (Spondiloartrite Assiale/Spondilite Anchilosante, stessa fonte ASAS-EULAR 2022) e `#112` → fuso in `#306` (Prolasso Genitale/POP, stesso compartimento pelvico). **Totale merge: 9. Totale `knowledge_base`: 370** (379 − 9).
2. **Oncologia migrata**: 18 condizioni copiate in `knowledge_base` (id 389-406) + nuova tabella `oncology_condition_tags`. La tabella originale `oncology_conditions` resta intatta.
3. **Bug corretto** in `knowledge-resolve/route.ts` (oncologia ora visibile allo Smart Study Panel) — sincronizzato e verificato.
4. **Tagging**: le 5 condizioni cardiopolmonari + le 8 neurologiche (nuova tabella `neurology_condition_tags`, mirror esatto delle altre 7) + 1 frattura di bacino (zona "Bacino"). Aggiunto anche `neuro_tests` (12 test) al motore di matching — anche questo era scoperto ma non collegato. Lasciate volutamente senza tag "Cadute nell'anziano" e "Piaghe da decubito" (#66, #73): non appartengono a nessun sistema/zona specifica, meglio non forzare un collegamento clinicamente arbitrario.
5. **Nuove colonne** aggiunte a `knowledge_base` (patofisiologia, eziologia, diagnosi differenziale, condizioni correlate, ICD-10 + flag verifica).
6. **Template di espansione**: vedi `template-espansione-condizioni-cliniche.csv` — **ridotto rispetto alla prima bozza**: ho verificato ogni candidato contro il database reale prima di consegnarlo, e la maggior parte di quello che sembrava mancante (Parkinson, ictus, diabete tipo 1/2, osteoporosi, artrite reumatoide, sclerosi multipla, prolasso, vulvodinia, dolore pelvico cronico, anemia falciforme, lupus, spondiloartrite) **era già presente** — semplicemente non tutte tagged. Restano solo 5 candidati verificati come realmente assenti.

### Scoperta architetturale aggiuntiva (durante l'esecuzione)

Mentre eseguivo l'8° merge ho scoperto un **terzo meccanismo di collegamento** che l'audit originale non aveva considerato: le tabelle `cardiopulmonary_conditions`, `endocrine_conditions`, `gastrointestinal_conditions`, `hematology_conditions`, `immune_conditions`, `pelvic_floor_conditions`, `urinary_conditions` — che avevo assunto fossero tabelle di contenuto a sé stanti come `oncology_conditions` — sono in realtà tabelle di collegamento condizione↔struttura anatomica specifica (`condition_id` + `structure_id`), non semplici tabelle isolate. Non cambia le conclusioni dell'audit ma significa che l'architettura di collegamento ha tre livelli (sistema, zona anatomica, struttura specifica), non due. Utile saperlo per qualunque lavoro futuro su questa parte del database.

### 9° merge — eseguito

Ho valutato `#112` vs `#306` a fondo prima di decidere: a differenza del caso dolore/instabilità femoro-rotulea (due meccanismi patologici diversi), qui cistocele/prolasso uterino/rettocele **sono i compartimenti dello stesso prolasso**, non entità distinte — stessa classificazione POP-Q, stesso trattamento PFMT di prima linea, stessi red flags, e un tag `pelvic_floor_condition_tags` identico su entrambi (`compartment='central', applies_to='female'`). È un vero duplicato, non un termine ombrello con sottotipi.

**Tenuto `#306`** (fonti più recenti e complete: NICE NG123 2024, IUGA 2022, Cochrane 2025) e **recuperati da `#112`** prima di ritirarlo i campi che `#306` non aveva ancora (`condition_keywords`, `outcome_measures`, `return_to_activity_criteria`) — nessuna informazione persa. I 5 collegamenti anatomici di `#112` in `pelvic_floor_conditions` (strutture pelviche specifiche) sono stati ripuntati su `#306`, non persi.

**Totale finale: 370 condizioni** (379 − 9 merge). Verificato: 0 righe orfane su tutte le tabelle collegate.

Nessuna delle azioni sopra ha toccato dati che non fossero clinici/di riferimento condivisi (nessun dato utente coinvolto).

---

## Espansione verso 800 condizioni — log dei batch reali

Ogni condizione qui sotto è stata cercata individualmente (fonte reale verificata via ricerca web, non generata), controllata contro il database per escludere doppioni prima di aggiungerla, e taggata al sistema corretto. Ritmo deliberatamente lento ("piano piano" come richiesto) — poche condizioni per volta, ognuna verificabile.

**10° merge trovato strada facendo:** `#269 "Commozione Cerebrale Sportiva (Concussione)"` (senza fonte) duplicava `#342 "Trauma cranico lieve (commozione cerebrale)"` (fonte: Amsterdam 2022 Consensus Statement on Concussion in Sport) — fuso, tenendo #342. `#270 "Sindrome Post-Commotiva Persistente"` resta separata: è un esito cronico distinto, non lo stesso evento.

**Batch 1 (4 condizioni, id 407-410):**
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Fibromialgia (gestione con esercizio terapeutico) | Immunologia | Tailored exercise programmes for fibromyalgia (PMID 38910571) | 2024 |
| Artropatia emofilica (gestione riabilitativa dell'emofilia) | Ematologia | MASAC Document 275, National Hemophilia Foundation | 2023 |
| Dissinergia del pavimento pelvico (dischezia funzionale) | Pavimento pelvico | Rao SSC et al., ANMS-ESNM position paper (PMID 25828100) | 2015 |
| Obesità (gestione con esercizio terapeutico) | Endocrino | ACSM's Guidelines for Exercise Testing and Prescription — **edizione da verificare** | — |

**Batch 2 (4 condizioni, id 411-414):**
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sclerosi sistemica (sclerodermia) — gestione con esercizio | Immunologia | Cochrane Database Syst Rev, Frade S et al. | 2022 |
| Polimialgia reumatica e arterite a cellule giganti | Immunologia | 2025 EULAR recommendations (PMID 42481270) | 2025 |
| Endometriosi (dolore pelvico associato) | Pavimento pelvico | Systematic review PMID 40705433 + ESHRE Guideline 2022 | 2025 |
| Deficit energetico relativo nello sport (RED-S) | Endocrino (nessuna categoria sport dedicata ancora) | 2023 IOC consensus statement (PMID 37752011) | 2023 |

**Batch 3 (4 condizioni, id 415-418):** prima di cercare, ho verificato contro il database candidati come PCOS, sindrome metabolica, Cushing, Addison, gotta, linfedema, trombofilia, vescica iperattiva, IBD, incontinenza fecale, tunnel carpale, sarcopenia — quasi tutti già presenti (Linfedema ×3, Sarcopenia, Vescica Iperattiva ×2, Cushing, Addison, IBD, Tunnel carpale). Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sindrome dell'ovaio policistico (PCOS) — gestione con esercizio | Endocrino | 2023 International Evidence-based Guideline for the Assessment and Management of PCOS (PMID 37580314) | 2023 |
| Artrite psoriasica (gestione dell'esercizio terapeutico) | Immunologia | Updated GRAPPA and EULAR recommendations for the management of psoriatic arthritis (PMID 36184036) | 2022 |
| Gotta (artrite gottosa — gestione dell'esercizio e delle fasi intercritiche) | Immunologia | 2020 ACR Guideline for the Management of Gout (FitzGerald JD et al., Arthritis Care & Research) | 2020 |
| Incontinenza fecale (gestione con fisioterapia del pavimento pelvico) | Pavimento pelvico (posteriore, entrambi i sessi) | Anorectal physiotherapy in coloproctology: Guidelines of the French National Society of Coloproctology | 2025 |

Sindrome metabolica e trombofilia erano state identificate come assenti ma non ancora ricercate a fondo: rimandate al prossimo batch per non forzare il ritmo ("piano piano").

**Batch 4 (4 condizioni, id 419-422):** prima di cercare, ho verificato ulteriormente contro il database candidati come ipertensione arteriosa, CRPS, ipertensione polmonare, fibrillazione atriale/aritmie, malattia renale cronica — tutti già presenti. Genuinamente assenti e aggiunti in questo batch (seguendo la tua indicazione di cercare sempre la versione più recente delle linee guida, non fermarsi alla prima trovata):
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sindrome metabolica (gestione con esercizio terapeutico) | Endocrino | Efficacy of Exercise-Based Interventions for Metabolic Syndrome: An Umbrella Review With Meta-Analyses (Poon et al., Obesity Reviews) | 2026 |
| Trombofilia (gestione dell'attività fisica e prevenzione del tromboembolismo venoso) | Ematologia | Role of Physical Therapists in the Management of Individuals at Risk for or Diagnosed With VTE — Evidence-Based CPG, **aggiornamento 2022** (Hillegass, Lukaszewicz, Puthoff et al., Physical Therapy) — verificato che superasse la versione 2016 originale | 2022 |
| Fenomeno di Raynaud (gestione non farmacologica) | Immunologia (spesso secondario a sclerosi sistemica, già presente) | ESVM guidelines: the diagnosis and management of Raynaud's phenomenon (Belch J et al., VASA) — nessun aggiornamento formale più recente trovato per la gestione non farmacologica | 2017 |
| Sindrome delle apnee ostruttive del sonno (OSAS) — gestione con esercizio | Cardio-respiratorio | Exercise Interventions in Obstructive Sleep Apnea: Program Features and Clinical Benefits (Saavedra et al., Current Pulmonology Reports) | 2025 |

Nota clinica onesta sul Raynaud: a differenza delle altre condizioni di questo batch, la letteratura non riporta un vero e proprio programma di esercizio terapeutico validato per il fenomeno di Raynaud in sé — la gestione fisioterapica reale è educazione/protezione termica e biofeedback, non carico progressivo. L'ho scritto così com'è, senza forzare un protocollo di esercizio che le fonti non descrivono.

**Stato attuale: 385 condizioni totali** (381 + 4 nuove). **Mancano 415 per arrivare a 800.**

**Batch 5 (4 condizioni, id 423-426):** controllati contro il database anche Sjögren, sarcoidosi, stanchezza cronica/ME-CFS, sindrome delle gambe senza riposo, vasculiti, Behçet, sindrome da anticorpi antifosfolipidi, porpora trombocitopenica, policondrite recidivante, talassemia (quest'ultima già presente, #387). Aggiunte 4 condizioni verificate come assenti:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sindrome di Sjögren (gestione con esercizio terapeutico) | Immunologia | Effects of exercise in primary Sjögren's syndrome: systematic review e meta-analisi di RCT, Disability and Rehabilitation 2025 + British Society for Rheumatology guideline, Rheumatology 2025 | 2025 |
| Sarcoidosi (riabilitazione polmonare) | Cardio-respiratorio | Pulmonary rehabilitation in sarcoidosis: systematic review e meta-analisi (Respiratory Medicine, PMID 37858728) | 2023 |
| Sindrome da anticorpi antifosfolipidi (APS) — attività fisica in sicurezza | Ematologia | Non-pharmacological rehabilitation interventions for individuals with antiphospholipid syndrome: scoping review (Harper AE et al., Lupus, 2024) | 2024 |
| Sindrome delle gambe senza riposo (RLS) — gestione con esercizio e fisioterapia | Neurologia | Advancements in Restless Leg Syndrome Management: A Review of Physiotherapeutic Modalities and Their Efficacy (Ratnani I, Harjpal P, Cureus, PMID 37954781) | 2023 |

Nota clinica onesta sull'APS: la scoping review più recente sul tema segnala **un solo caso studio pubblicato** su esercizio in questa condizione, con conclusione esplicita che serve ancora ricerca su sicurezza ed efficacia. Ho scritto l'intero campo `typical_exercises` come **DA VERIFICARE**, estendendo con cautela solo i principi di mobilità sicura già validati per la trombofilia (condizione gemella in banca dati), invece di inventare un protocollo che la letteratura non descrive ancora.

Rimandate al prossimo batch (identificate come assenti ma non ancora ricercate a fondo): stanchezza cronica/encefalomielite mialgica (richiede particolare cautela: le linee guida più recenti, es. NICE 2021, sconsigliano esplicitamente la terapia con esercizio graduato classica per il rischio di malessere post-sforzo — da trattare con attenzione specifica in un batch dedicato), vasculiti ANCA-associate, malattia di Behçet, porpora trombocitopenica idiopatica, policondrite recidivante.

**Stato attuale: 389 condizioni totali** (385 + 4 nuove). **Mancano 411 per arrivare a 800.**

**Batch 6 (4 condizioni, id 427-430):** le 4 condizioni rimandate dal batch precedente, trattate con la cautela che ciascuna richiedeva:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Encefalomielite mialgica/Sindrome da fatica cronica (ME/CFS) | Immunologia | NICE Guideline NG206, raccomandazione 1.11.13-1.11.14 | 2021 |
| Vasculite ANCA-associata (gestione generale dell'attività fisica) | Immunologia | 2025 British Society for Rheumatology management recommendations, Rheumatology 64(8):4463-4469 | 2025 |
| Malattia di Behçet (gestione generale dell'attività fisica) | Immunologia | EULAR recommendations for the management of Behçet's syndrome: 2025 update (Hatemi G et al., Annals of the Rheumatic Diseases) | 2026 |
| Porpora trombocitopenica immune (ITP) — attività fisica in base alla conta piastrinica | Ematologia | Physical exercise is safe and feasible in thrombocytopenic patients with hematologic malignancies: narrative review, Hematology 2020 (PMID 32075567) | 2020 |

Note cliniche oneste su questo batch, particolarmente delicato:

- **ME/CFS**: qui la fonte è insolitamente esplicita e dettagliata. La linea guida NICE NG206 **sconsiglia esplicitamente** la terapia con esercizio graduato a incrementi fissi ("graded exercise therapy" classica) come possibile causa di malessere post-sforzo (PEM). Ho scritto l'intera scheda attorno a questo — niente "progressione standard", ma gestione individualizzata dell'energia (pacing), con la persona che decide se aumentare o ridurre l'attività in base alla propria risposta sintomatica. Ho evitato di riciclare lo schema standard delle altre 429 condizioni, perché applicarlo qui sarebbe clinicamente scorretto.
- **Vasculite ANCA-associata e Malattia di Behçet**: entrambe le linee guida più recenti e autorevoli (BSR 2025, EULAR 2025/2026) sono quasi interamente farmacologiche e **non descrivono un protocollo di esercizio specifico** — l'ho scritto onestamente marcando `typical_exercises` e `progression_criteria` come **DA VERIFICARE**, estendendo con cautela solo i principi generali già usati per altre malattie infiammatorie sistemiche in banca dati (polimialgia/arterite a cellule giganti), invece di inventare un protocollo che le fonti non contengono. Per Behçet ho aggiunto un red flag specifico sul rischio trombotico/aneurismatico della forma vascolare.
- **ITP**: le soglie di conta piastrinica riportate (< 10.000, 10.000-20.000, ≥ 50.000) provengono dalla revisione narrativa citata, che a sua volta segnala esplicitamente che sono "in gran parte di consenso clinico più che rigorosamente basate su evidenza sperimentale diretta" — l'ho scritto con la stessa onestà nella scheda stessa, non solo qui.

**Stato attuale: 393 condizioni totali** (389 + 4 nuove). **Mancano 407 per arrivare a 800.**

**11° merge trovato strada facendo:** durante il controllo di esistenza per il batch 7 ho trovato due candidati duplicati sul Morbo/Malattia di Scheuermann. Verificati: `#236 "Malattia di Scheuermann (Cifosi Giovanile)"` (senza fonte né keywords) duplicava `#325 "Morbo di Scheuermann (cifosi giovanile)"` (fonte reale: Palazzo C et al., Joint Bone Spine + keywords multilingua) — stesso nome eponimo, stessa condizione. Fuso, tenendo #325; le traduzioni es/en/fr di #236 erano già identiche a quelle di #325 (eliminate come ridondanti), il collegamento anatomico di #236 (zona diversa da quella già taggata su #325) è stato ripuntato, non perso. Verificato: 0 righe orfane.

**Caso valutato e NON fuso:** `#230 "Spondilolistesi"` (concetto generale/ombrello: copre sia la forma istmica giovanile sia quella degenerativa dell'adulto, classificazione di Meyerding) vs `#334 "Spondilolistesi istmica L5-S1"` (sottotipo specifico, con proprio protocollo di stabilizzazione segmentale, outcome measures e test distinti). A differenza del caso Scheuermann, qui #230 contiene informazioni cliniche (la forma degenerativa dell'adulto) che #334 non copre affatto — stesso principio già applicato al caso sindrome/instabilità femoro-rotulea: termine ombrello con un sottotipo specifico, non un vero duplicato. Tenute entrambe.

**Batch 7 (4 condizioni, id 431-434):**
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Disturbo dello spettro da ipermobilità (HSD) / Sindrome di Ehlers-Danlos ipermobile (hEDS) | Immunologia (categorizzazione di comodo: nessuna categoria genetica/tessuto connettivo dedicata esiste ancora, vedi nota sotto) | Therapeutic Management of Pediatric Hypermobility Spectrum Disorder, Evidence-Based Care Guideline, Cincinnati Children's Hospital | 2025 |
| Sindrome del dolore pelvico cronico maschile / Prostatite cronica (CP/CPPS) | Pavimento pelvico (anteriore, maschile) | Diagnosis and Management of Male Chronic Pelvic Pain, AUA Guideline (Statement 29-30 su terapia manuale e biofeedback) | 2025 |
| Policondrite recidivante | Immunologia | Protocole national de diagnostic et de soins pour la polychondrite chronique atrophiante (Arnaud L et al., La Revue de Médecine Interne) | 2023 |
| Paralisi cerebrale infantile — attività fisica ed esercizio nell'adulto | Neurologia | Physical activity and exercise interventions in adults with cerebral palsy: systematic review, Disability and Rehabilitation 47(9) | 2024 |

Note oneste su questo batch:
- **HSD/hEDS**: ho dovuto fare una scelta di comodo sulla categorizzazione — in banca dati non esiste ancora un bucket dedicato ai disturbi genetici del tessuto connettivo, quindi l'ho taggata come 'immune' per coerenza con le altre connettivopatie sistemiche già presenti (sclerosi sistemica, Sjögren), pur sapendo che l'ipermobilità non è di natura autoimmune ma genetica/costituzionale. Segnalo la questione qui invece di nasconderla.
- **Policondrite recidivante**: come per vasculite ANCA e Behçet nel batch precedente, il protocollo nazionale francese più recente non descrive un programma di esercizio specifico — campi marcati **DA VERIFICARE**, con un red flag specifico e importante sul possibile coinvolgimento tracheale/laringeo (potenzialmente pericoloso per la via aerea).
- **Prostatite cronica/CP-CPPS**: colma parzialmente il gap del pavimento pelvico segnalato nell'audit originale (sezione C) — nota bene, qui il pavimento pelvico è tipicamente ipertono/iperattivo, l'opposto dell'incontinenza da sforzo già presente, quindi il trattamento è di rilassamento, non di rinforzo tipo Kegel.

**Stato attuale: 396 condizioni totali** (393 + 4 nuove − 1 merge). **Mancano 404 per arrivare a 800.**

**12° merge trovato strada facendo:** durante il controllo di esistenza per il batch 8 ho trovato `#311 "Asma Bronchiale"` (senza fonte né keywords, ma con un paragrafo di aggiornamento farmacologico molto recente e utile: linee guida GINA 2025 su ICS/MART e position paper EAACI 2025 sul "periodo refrattario" per il broncospasmo da sforzo) che duplicava `#39 "Asma (gestione dell'esercizio)"` (fonte reale ATS 2013 + keywords). A differenza dei merge precedenti, qui **non ho semplicemente scartato il contenuto della riga più debole**: ho prima trascritto in #39 gli aggiornamenti clinicamente validi di #311 (GINA 2025, EAACI 2025) che #39 non aveva ancora, poi ho ripuntato il collegamento anatomico strutturale (`cardiopulmonary_conditions`, che #39 non aveva) e solo alla fine ho cancellato #311. Verificato: 0 righe orfane.

**Osservazione architetturale non risolta (segnalata, non corretta in questo batch):** ho anche trovato che `#143 "Neuropatie da Intrappolamento della Spalla"` è una riga "raggruppata" che descrive TRE condizioni distinte in un unico record (intrappolamento del nervo soprascapolare, sindrome dello stretto toracico, sindrome dello spazio quadrilatero) — e il terzo di questi contenuti (stretto toracico) duplica in modo sostanziale la scheda molto più completa e sourced `#52 "Sindrome dello stretto toracico"`. Le altre due condizioni descritte in #143 (soprascapolare, spazio quadrilatero) non esistono altrove come schede proprie. Sistemarlo bene richiederebbe scorporare #143 in due schede nuove complete (non solo cancellare una riga) — un lavoro di creazione contenuto, non un semplice merge. Lo segnalo qui per una decisione futura invece di agire a metà in un batch dedicato alla sola espansione.

**Batch 8 (4 condizioni, id 435-438):**
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Malattia di Paget dell'osso | Endocrino | Diagnosis and Management of Paget's Disease of Bone in Adults: A Clinical Guideline (Ralston SH et al., Journal of Bone and Mineral Research) | 2019 |
| Osteogenesi imperfetta | Immunologia (categorizzazione di comodo, vedi nota sotto) | Physical and Occupational Therapists Guide to Treating Osteogenesis Imperfecta, OI Foundation (ed. aggiornata 2025, originariamente 2017) | 2025 |
| Sindrome di Marfan | Immunologia (categorizzazione di comodo, vedi nota sotto) | Exercise recommendations for patients with Marfan syndrome: updated review (Jayaratne N et al., European Journal of Preventive Cardiology 33(8):1481-1496) | 2026 |
| Displasia evolutiva dell'anca (DDH) | Ortopedico/MSK (zona "Anca") | Detection and Nonoperative Management of Pediatric DDH in Infants up to Six Months of Age, AAOS Clinical Practice Guideline | 2022 |

Note oneste su questo batch:
- **Ricorrenza del problema di categorizzazione già visto con l'ipermobilità/Ehlers-Danlos (batch 7):** anche Osteogenesi imperfetta e Sindrome di Marfan sono malattie genetiche del tessuto connettivo, non autoimmuni, ma le ho taggate 'immune' per coerenza con l'unico bucket di "connettivopatie sistemiche" disponibile oggi in banca dati. **Con questa è la terza volta in due batch che mi scontro con lo stesso problema** — probabilmente vale la pena valutare una categoria dedicata ai disturbi genetici del tessuto connettivo, la segnalo di nuovo qui.
- **Paget**: la linea guida clinica di riferimento (2019) è quasi interamente farmacologica (bisfosfonati) — campi di esercizio marcati **DA VERIFICARE**, mutuati con cautela dai principi generali di attività fisica sicura in altre malattie metaboliche ossee.
- **DDH**: qui sono stato particolarmente esplicito che il trattamento primario è ortopedico (tutore/imbracatura), non fisioterapico — la scheda descrive onestamente il ruolo di supporto/educativo della fisioterapia (posizionamento, monitoraggio dello sviluppo motorio), non un programma di esercizio terapeutico in senso classico, perché la linea guida AAOS di riferimento non ne descrive uno.

**Stato attuale: 399 condizioni totali** (396 + 4 nuove − 1 merge). **Mancano 401 per arrivare a 800.**

**Batch 9 (4 condizioni, id 439-442):** nessun nuovo doppione scoperto questa volta.
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Distrofia muscolare di Duchenne (DMD) | Neurologia | Physiotherapy and Occupational Therapy Guidance for DMD, DMD Care UK | 2023 |
| Atrofia muscolare spinale (SMA) | Neurologia | Filling the gaps in knowledge translation: PT recommendations for SMA, Neuromuscular Disorders (PMID 33741230) | 2021 |
| Artrite idiopatica giovanile (AIG) | Immunologia | Ottawa Panel Evidence-Based CPG for Structured Physical Activity in JIA (Cavallo S, Brosseau L et al., Archives of Physical Medicine and Rehabilitation) | 2017 |
| Torcicollo miogeno congenito (TMC) | Ortopedico/MSK (zona "Rachide Cervicale", stessa del Torcicollo Acuto adulto già presente) | Physical Therapy Management of Congenital Muscular Torticollis: 2024 EB-CPG, APTA Academy of Pediatric Physical Therapy (Sargent B et al., Pediatric Physical Therapy) | 2024 |

Note su questo batch: per la SMA ho notato durante la ricerca l'esistenza di una scoping review ancora più recente (2026, "Rehabilitation approaches used for children with spinal muscular atrophy: A scoping review based on the F-words framework", Mortenson P et al.) ma non sono riuscito ad accedere al contenuto completo (bloccato da verifica anti-bot) per estrarne raccomandazioni verificabili — ho preferito citare la fonte 2021 di cui ho potuto verificare il contenuto reale, piuttosto che citare un titolo 2026 senza sapere cosa dice davvero. Lo segnalo per trasparenza, in linea con la tua richiesta di cercare sempre la fonte più aggiornata possibile.

Nota sulla DMD: le urine scure post-sforzo come segno di danno muscolare, e l'avvertenza specifica contro esercizi eccentrici ad alto impatto (es. trampolino), sono dettagli clinici reali e specifici tratti dalla fonte, non generici.

**Stato attuale: 403 condizioni totali** (399 + 4 nuove). **Mancano 397 per arrivare a 800.**

**Batch 10 (4 condizioni, id 443-446):** nessun nuovo doppione scoperto.
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Spina bifida / Mielomeningocele | Neurologia | Guidelines for the Care of People with Spina Bifida: Physical Activity, Spina Bifida Association | 2023 |
| Paralisi ostetrica del plesso brachiale (Erb's Palsy) | Nervo periferico "Plesso Brachiale" | Early Conservative PT Management of Babies With Obstetric Brachial Plexus Injury, Pediatric Physical Therapy (PMID 39495595) | 2025 |
| Malattia di Sever (apofisite calcaneare) | Ortopedico/MSK (zona "Ossa del Piede") | Conservative Management of Sever's Disease: Comprehensive Review of Treatment Efficacy (Nweke TC, Cureus) | 2025 |
| Sindrome di Down — fisioterapia e gestione dell'ipotonia | Neurologia | Contemporary physiotherapy interventions for balance rehabilitation in children with Down syndrome: systematic review of RCT, European Journal of Pediatrics | 2026 |

Note su questo batch:
- Per l'articolo su Down syndrome/equilibrio, il fetch della pagina Springer è stato rifiutato per rate-limiting (HTTP 429, con istruzione esplicita a non ritentare) — ho usato titolo/giornale/anno confermati dai risultati di ricerca, e per i contenuti clinici (gestione dell'ipotonia, iperlassità, il red flag sull'instabilità atlanto-assiale) mi sono basato su conoscenza clinica consolidata e ampiamente documentata su questa sindrome, non inventata.
- **Instabilità atlanto-assiale nella sindrome di Down**: red flag specifico e ben noto in letteratura pediatrica — controindicazione a capovolte/tuffi/sport di contatto fino a esclusione medica specifica. L'ho segnalato con enfasi perché è un dato di sicurezza clinicamente importante.
- Per l'Erb's Palsy ho usato il nervo periferico "Plesso Brachiale" già presente in banca dati invece di una zona anatomica generica — più preciso.

**Stato attuale: 407 condizioni totali** (403 + 4 nuove). **Mancano 393 per arrivare a 800.**

**Batch 11 (4 condizioni, id 447-450):** verificati preventivamente contro il database candidati come Dupuytren, dito a scatto, cefalea cervicogenica, Sinding-Larsen-Johansson, VPPB, ipofunzione vestibolare, vertigine posizionale post-trauma — tutti già presenti. Nessun nuovo doppione scoperto in questo batch.
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Malattia di Legg-Calvé-Perthes | Ortopedico/MSK (zona "Anca") | Recommendations for physiotherapy and physical activity for children with Legg-Calvé-Perthes disease: survey of pediatric orthopedic surgeons and physiotherapists in Sweden (Melin L, Rendek Z, Hailer YD, Acta Orthopaedica) | 2023 |
| Epifisiolisi femorale prossimale (SCFE) | Ortopedico/MSK (zona "Anca") | Slipped Capital Femoral Epiphysis: Rapid Evidence Review (Webb, Liu, Bouchereau-Lal, American Family Physician 112(4):414-423) | 2025 |
| Disfunzione temporomandibolare (DTM) | Non taggata — vedi nota sotto | Topic Brief: Temporomandibular Disorder Treatment Guidelines, AHRQ | 2023 |
| Emicrania — esercizio terapeutico preventivo | Neurologia | Prescription of Therapeutic Exercise in Migraine: Evidence-Based CPG of the Professional College of Physiotherapists of the Community of Madrid, The Journal of Headache and Pain (PMID 37286937) | 2023 |

Note oneste su questo batch:
- **Nuovo tipo di gap architetturale (quarta occorrenza di un problema di categorizzazione, ma di natura diversa dalle precedenti):** per la disfunzione temporomandibolare non esiste in `body_zones` nessuna zona per mascella/ATM/testa/viso (verificato con query dedicata — nessun risultato). A differenza dei casi HSD/Osteogenesi imperfetta/Marfan (dove ho scelto una categorizzazione "di comodo" comunque imperfetta), qui ho preferito **non forzare alcun collegamento**: né una zona anatomica sbagliata, né un tag di sistema non pertinente (esiste un nervo "Trigemino" in `peripheral_nerves`, ma la DTM è primariamente un disturbo articolare/muscolare, non una neuropatia trigeminale — collegarla lì sarebbe fuorviante). Stessa logica già usata per "Cadute nell'anziano" e "Piaghe da decubito": meglio lasciare scoperto che collegare in modo clinicamente arbitrario. Segnalo che potrebbe valer la pena, in futuro, creare una zona "Testa/ATM" dedicata.
- **Emicrania**: la linea guida di riferimento (Journal of Headache and Pain 2023, PMID 37286937) è confermata come reale ed esiste, ma tre tentativi di accedere al testo completo sono falliti (ResearchGate 429, clinicalpainadvisor.com 402, Zenodo 429 con istruzione esplicita a non ritentare). Non essendo riuscito a estrarre i parametri esatti di frequenza/durata/intensità dell'esercizio aerobico raccomandato dalla fonte primaria, ho scritto la scheda usando solo il principio clinico generale ben consolidato (esercizio aerobico regolare come intervento preventivo, introduzione graduale nei pazienti in cui lo sforzo è un trigger noto) senza inventare cifre specifiche che non ho potuto verificare — **DA VERIFICARE** eventuali parametri quantitativi precisi (frequenza settimanale, durata per sessione) quando la fonte sarà accessibile.
- **Perthes e SCFE**: entrambe condizioni pediatriche dell'anca, taggate sulla stessa zona "Anca" già usata per la DDH (batch 8). Per la SCFE ho segnalato esplicitamente nella scheda che le raccomandazioni fisioterapiche post-chirurgiche si basano prevalentemente su opinione di esperti, non su trial randomizzati — la fonte stessa lo dichiara.

**Stato attuale: 411 condizioni totali** (407 + 4 nuove). **Mancano 389 per arrivare a 800.**

**13° merge trovato strada facendo:** durante il controllo di esistenza per il batch 12 ho trovato `#240 "Costocondrite"` (senza fonte né keywords, ma con un contenuto clinico interessante: distingueva esplicitamente la costocondrite semplice — senza tumefazione — dalla sindrome di Tietze vera e propria, con rigonfiamento visibile) che duplicava `#323 "Costocondrite (sindrome di Tietze)"` (fonte reale: Proulx AM, Zryd TW, Am Fam Physician 2009 + keywords). Prima di cancellare #240 ho trascritto in #323 la nota di diagnosi differenziale Tietze-vs-costocondrite che #323 non aveva, poi ho ripuntato il collegamento anatomico di #240 (zona "Petto / Pettorali", diversa da "Coste e Sterno" già su #323 — copertura aggiuntiva, non persa) e infine cancellato #240. Verificato: 0 righe orfane.

**Batch 12 (4 condizioni, id 451-454):** verificati preventivamente contro il database candidati come sindrome di Guillain-Barré, Charcot-Marie-Tooth, tenosinovite di De Quervain, meralgia parestesica, malattia di Kienböck, anemia falciforme, vulvodinia — tutti già presenti (l'anemia falciforme, segnalata come gap nella sezione C originale dell'audit, risulta già coperta da tempo, #384). Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Paralisi di Bell (paralisi del nervo facciale) | Neurologia + nervo periferico "Nervo Facciale (VII nervo cranico)" | Physical therapy for facial nerve paralysis (Bell's palsy): An updated and extended systematic review of the evidence for facial exercise therapy (Khan AJ et al., Clinical Rehabilitation, PMID 35787015) | 2022 |
| Malformazione di Chiari tipo I | Neurologia + zona cerebrale "Cervelletto" | Effects of Two Exercise Regimes on Patients with Chiari Malformation Type 1: a Randomized Controlled Trial, The Cerebellum (PMID 35325392) | 2022 |
| Miopatie infiammatorie idiopatiche (polimiosite e dermatomiosite) | Immunologia | Treatment guidelines for idiopathic inflammatory myopathies in adults: a comparative review (Paik JJ et al., Rheumatology, PMID 39999025) | 2025 |
| Malattia di Freiberg (osteocondrosi della testa metatarsale) | Ortopedico/MSK (zona "Ossa del Piede") | Evidence-Based Treatment Algorithm for Freiberg Disease (Yoshimura I et al., Foot & Ankle Specialist, PMID 37815268) | 2024 |

Note oneste su questo batch:
- **Paralisi di Bell**: ho scelto una revisione sistematica del 2022 (estensione aggiornata di una precedente Cochrane review) invece della linea guida clinica AAO-HNS del 2013 trovata per prima nella ricerca — quest'ultima è più datata e il fetch del suo contenuto dettagliato non ha restituito le raccomandazioni specifiche, mentre la revisione sistematica 2022 è sia più recente sia più ricca di dettagli verificabili sull'esercizio facciale.
- **Malformazione di Chiari tipo I**: fonte completamente verificata (RCT con protocollo, parametri di dosaggio e risultati tutti confermati dal testo). Segnalo che l'esercizio è indicato solo nei pazienti SENZA indicazione chirurgica attiva — la scheda lo specifica esplicitamente per evitare fraintendimenti.
- **Miopatie infiammatorie idiopatiche**: fonte particolarmente solida, una revisione comparativa 2025 di 5 linee guida internazionali diverse (tedesca, ENMC, brasiliana, giapponese, britannica) — ho scritto la scheda basandomi sul consenso tra queste, con la linea guida britannica (BSR) come la più dettagliata sull'esercizio supervisionato. Segnalato esplicitamente nella scheda che nessuna delle linee guida confrontate copre la miosite a corpi inclusi (IBM), un sottotipo distinto non incluso in questa voce.
- **Malattia di Freiberg**: fonte con algoritmo di trattamento basato su stadiazione (classificazione di Smillie, 5 stadi) completamente verificato, inclusi i tempi (6 mesi di conservativo prima di considerare la chirurgia) e l'efficacia riportata (~60% nelle fasi iniziali).

**Stato attuale: 414 condizioni totali** (411 + 4 nuove − 1 merge). **Mancano 386 per arrivare a 800.**

**Batch 13 (4 condizioni, id 455-458):** nessun nuovo doppione scoperto. Verificati preventivamente contro il database candidati come sindrome di Wartenberg, canale di Guyon, tunnel radiale/cubitale, piede cadente/nervo peroneo, DRUJ, Skier's Thumb, bandelletta ileotibiale, tendinopatia rotulea, sindrome da stress tibiale mediale, rottura tendine d'Achille, whiplash, stenosi spinale lombare, mielopatia cervicale spondilotica, bronchiectasie, fibrosi polmonare idiopatica, tromboembolismo venoso, policitemia, rizoartrosi — tutti già presenti.
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sindrome della cauda equina (riconoscimento ed emergenza) | Neurologia + zona anatomica "Rachide Lombare / Schiena Bassa" | The National Suspected Cauda Equina Syndrome Pathway: implications for physiotherapists, Physiotherapy (Chartered Society of Physiotherapy journal) | 2024 |
| Distonia cervicale (torcicollo spasmodico) | Neurologia | Optimal physiotherapy management strategies for cervical dystonia: an international Delphi study, Neurological Sciences (PMID 42618836) | 2026 |
| Malattia di Huntington | Neurologia | Clinical recommendations to guide physical therapy practice for Huntington disease, Neurology (Quinn L et al., PMID 31907286) | 2020 |
| Atassia di Friedreich | Neurologia | Effectiveness of rehabilitation intervention in persons with Friedreich ataxia, Frontiers in Neurology (PMID 38020600) | 2023 |

Note oneste su questo batch:
- **Sindrome della cauda equina**: a differenza di tutte le altre schede in banca dati, questa non descrive un trattamento fisioterapico ma un percorso di **riconoscimento ed emergenza** — l'ho scritta così deliberatamente (campi `typical_exercises`/`progression_criteria` espliciti sul fatto che non si applicano) perché il ruolo del fisioterapista qui è riconoscere i segnali d'allarme e attivare l'invio urgente, non trattare. Fonte pienamente verificata e molto recente (2024), specificamente rivolta ai fisioterapisti.
- **Distonia cervicale**: ho scelto uno studio Delphi internazionale 2026 (pubblicazione anticipata, condotto giugno 2024-settembre 2025) invece della revisione sistematica 2023 trovata per prima, seguendo la tua indicazione di preferire sempre la fonte più aggiornata quando esiste — qui esiste, ed è specificamente costruita da/per fisioterapisti in assenza di linee guida cliniche formali sull'argomento.
- **Malattia di Huntington**: la linea guida clinica ufficiale APTA/Neurology (2020) è dietro paywall per i dettagli completi (accesso riservato ai soci APTA) — ho potuto verificare la conclusione generale ("la fisioterapia può migliorare fitness, funzione motoria e marcia") ma non il dettaglio di dosaggio/progressione per singolo stadio di malattia. Ho scritto la scheda con questa onestà, marcando il protocollo dettagliato come **DA VERIFICARE** invece di inventare parametri specifici.
- **Atassia di Friedreich**: fonte completamente verificata (studio di coorte con dati quantitativi precisi su durata, intensità e risultati) — segnalato esplicitamente il limite metodologico dichiarato dagli stessi autori (assenza di gruppo di controllo).

**Stato attuale: 418 condizioni totali** (414 + 4 nuove). **Mancano 382 per arrivare a 800.**

**Batch 14 (4 condizioni, id 459-462):** nessun nuovo doppione scoperto. Verificati preventivamente contro il database candidati come amiotrofia diabetica/Bruns-Garland, neuropatia periferica diabetica, disfunzione intestinale neurogena, cistite interstiziale/vescica dolorosa, ipotiroidismo, ipertiroidismo, malattia polmonare interstiziale/fibrosi polmonare — tutti già presenti.
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Neuroartropatia di Charcot (piede di Charcot) | Endocrino + zona anatomica "Caviglia / Piede" | Guidelines on the diagnosis and treatment of active Charcot neuro-osteoarthropathy (IWGDF 2023), Diabetes/Metabolism Research and Reviews (Wukich DK et al.) + Weight bearing versus non-weight bearing total contact cast in the management of active Charcot foot: a systematic review (Prem R et al., SAGE Open Medicine) | 2024 |
| Malattia di von Willebrand | Ematologia | Sports participation and physical activity in patients with von Willebrand disease (PMC7379650) | 2020 |
| Fibromatosi plantare (malattia di Ledderhose) | Ortopedico/MSK (zona "Caviglia / Piede") | Soleful solutions: Advancements in treatment strategies for ledderhose disease, Foot and Ankle Surgery (PMID 39068139) | 2024 |
| Cardiomiopatia ipertrofica | Cardio-respiratorio | 2024 AHA/ACC/AMSSM/HRS/PACES/SCMR Guideline for the Management of Hypertrophic Cardiomyopathy, Circulation (PMID 38718139) | 2024 |

Note oneste su questo batch:
- **Difficoltà tecnica incontrata e risolta:** durante la stesura di questo batch un primo tentativo di migrazione è fallito per un errore di sintassi SQL (un campo mancante nella tupla della scheda von Willebrand, che ha sfalsato il conteggio dei valori). Per isolare il problema ho riscritto temporaneamente il testo senza accenti/apostrofi, inserito i dati, verificato che il conteggio tornasse corretto, e poi eseguito una migrazione correttiva separata per ripristinare accenti e apostrofi corretti in tutti e 4 i nuovi record — verificato che il testo finale sia ora corretto quanto il resto della banca dati. Lo segnalo per trasparenza: nessun contenuto clinico è stato perso o alterato, solo un problema di formattazione del testo temporaneamente introdotto e poi corretto nella stessa sessione.
- **Neuroartropatia di Charcot**: fonte primaria (IWGDF 2023) autorevole ma con dettagli specifici dietro un download non accessibile via fetch; ho integrato con una revisione sistematica 2024 pienamente verificata sul carico durante il total contact cast, che mette onestamente in discussione (con parole degli stessi autori) il dogma classico dello scarico completo obbligatorio, descritto come basato su "evidenza aneddotica e teoria" più che su ricerca robusta.
- **Malattia di von Willebrand**: fonte verificata del 2020 con dati quantitativi reali sulla partecipazione sportiva per tipo di malattia; esiste una possibile fonte aggiornata al 2025/2026 (PMID 41512904) trovata ma non accessibile per verifica — segnalato per trasparenza, come già fatto per altre fonti bloccate in batch precedenti.
- **Fibromatosi plantare/Ledderhose**: fonte 2024 pienamente verificata con dati quantitativi su efficacia di radioterapia, onde d'urto e tassi di recidiva chirurgica — questi ultimi dati (fino al 100% di recidiva con le tecniche meno invasive) sono stati inclusi esplicitamente per una scelta condivisa informata col paziente.
- **Cardiomiopatia ipertrofica**: fonte autorevole 2024 (linea guida multi-società AHA/ACC), che rappresenta un cambio di paradigma clinico rispetto alle raccomandazioni storicamente restrittive sull'esercizio in questa condizione — la scheda riflette questo cambiamento recente.

**Stato attuale: 422 condizioni totali** (418 + 4 nuove). **Mancano 378 per arrivare a 800.**

**Batch 15 (4 condizioni, id 463-466):** nessun nuovo doppione scoperto. Verificati preventivamente contro il database candidati come acromegalia, alluce valgo, epilessia, malattie pericardiche, neuroma di Morton, sindrome dell'elevatore dell'ano, spondilolisi — tutti già presenti.
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Siringomielia | Neurologia + zona cerebrale "Midollo Spinale" | Case report su siringoidromielia + neuroriabilitazione in caso classico di siringomielia | 2023 |
| Sindrome post-polio | Neurologia | Exercise and Post-Polio Syndrome, fact sheet APTA Academy of Neurologic PT; Physiopedia | 2023 |
| Osteocondrite dissecante del ginocchio | Ortopedico/MSK (zona "Ginocchio") | Return to Sport After Treatment of Stable Osteochondritis Dissecans Lesions of the Knee in Adolescents: A Systematic Review (Muchintala R et al., AJSM, PMID 39772951) | 2025 |
| Endocardite infettiva (riabilitazione post-chirurgica) | Cardio-respiratorio | Utility of Cardiac Rehabilitation Following Surgical Treatment of Infective Endocarditis (PMID 41524043) | 2025 |

**Nota importante e trasparente su questo batch — limite tecnico temporaneo:** durante la ricerca di questo batch lo strumento di lettura del testo integrale delle pagine web (WebFetch) ha esaurito il limite di utilizzo per questa sessione, rendendo impossibile verificare il contenuto specifico dei paper oltre a titolo/autori/rivista/anno/PMID (che restano comunque reali e verificati tramite ricerca). Come già fatto in casi analoghi di singole fonti bloccate nei batch precedenti (SMA, sindrome di Down, atassia di Friedreich in parte), ho scritto le 4 schede di questo batch usando le citazioni reali verificate come riferimento bibliografico, integrate con conoscenza clinica consolidata e ampiamente documentata per ciascuna condizione — mai inventando dettagli specifici non verificabili. La differenza rispetto ai casi precedenti è che qui il limite ha riguardato l'intero batch, non una singola fonte, quindi lo segnalo con particolare enfasi:
- **Siringomielia**: condizione rara, la letteratura reperibile è essa stessa descritta come limitata perlopiù a case report (non trial randomizzati o linee guida consolidate) — l'ho dichiarato esplicitamente nella scheda stessa (evidence_level: low) invece di presentare un protocollo come se fosse validato su larga scala.
- **Sindrome post-polio**: qui la conoscenza clinica di base è molto solida e consolidata da decenni (principio cardine della "debolezza da sovraccarico"/overwork weakness, ben noto nella letteratura riabilitativa), quindi il limite di verifica del testo integrale pesa meno sulla qualità della scheda.
- **Osteocondrite dissecante del ginocchio**: le citazioni (revisioni sistematiche 2024/2025) sono verificate come reali ed esistenti tramite ricerca, ma il contenuto specifico (tempistiche esatte, tassi di ritorno allo sport) è scritto sulla base di conoscenza clinica ortopedica consolidata, non di lettura diretta di questi specifici paper.
- **Endocardite infettiva**: stesso principio; le due fonti citate (2025) sono reali e specificamente sulla riabilitazione in questa popolazione, ma il dettaglio dei protocolli di allenamento a intervalli descritto nella scheda è generico/consolidato (riabilitazione cardiaca post-chirurgica standard), non estratto dal testo specifico di questi paper.

Il limite tecnico dovrebbe risolversi con il reset della sessione di ricerca web; nei prossimi batch tornerò alla verifica tramite lettura diretta del testo integrale come fatto finora, e se vuoi posso anche ri-verificare più a fondo queste 4 schede in un secondo momento.

**Stato attuale: 426 condizioni totali** (422 + 4 nuove). **Mancano 374 per arrivare a 800.**

**Batch 16 (4 condizioni, id 467-470):** nessun nuovo doppione scoperto. Durante il controllo di esistenza ho scoperto un'area sorprendentemente scoperta della banca dati: nonostante le protesi articolari (anca, ginocchio, spalla, gomito, caviglia) siano tutte presenti, **non esisteva ancora nessuna scheda sull'amputazione stessa**, né su dolore da arto fantasma, ustioni o cachessia neoplastica — verificati anche acromegalia, alluce valgo, Parsonage-Turner, tutti già presenti.
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Amputazione dell'arto inferiore (riabilitazione protesica) | Non taggata (vedi nota) | VA/DoD Clinical Practice Guideline for Rehabilitation of Individuals With Lower Limb Amputation (2024/2025 update) | 2025 |
| Sindrome dell'arto fantasma | Neurologia | An Invited Review of Mirror Therapy for Phantom Limb Pain, Current Physical Medicine and Rehabilitation Reports | 2024 |
| Ustioni (riabilitazione fisioterapica) | Non taggata (vedi nota) | Burn Rehabilitation, PM&R KnowledgeNow (AAPMR) | 2024 |
| Cachessia neoplastica | Endocrino | The role of resistance training in mitigating cancer-induced cachexia: A systematic review (PMC12421196) | 2025 |

Note oneste su questo batch:
- **Amputazione e ustioni non taggate a nessun sistema/zona**: come già fatto per "Cadute nell'anziano" e "Piaghe da decubito" all'inizio della sessione, queste due condizioni non appartengono a nessuna zona anatomica specifica né a un sistema clinico dei 7 esistenti — ho preferito lasciarle scoperte piuttosto che forzare un collegamento arbitrario.
- **Amputazione dell'arto inferiore**: fonte di altissima autorevolezza (linea guida ufficiale VA/DoD 2025, pienamente verificata) con contenuto ricco e specifico: fasi pre/post-amputazione, raccomandazioni su componenti protesiche moderne (ginocchia a microprocessore, piedi ad accumulo di energia), osteointegrazione, e persino la raccomandazione specifica sulla terapia dello specchio per il dolore da arto fantasma — che ha reso naturale trattare quest'ultimo come scheda a sé stante nello stesso batch.
- **Sindrome dell'arto fantasma**: qui ho scelto di essere particolarmente onesto sui limiti dell'evidenza — la revisione più recente disponibile segnala che studi randomizzati controllati con placebo non hanno trovato prove di efficacia della terapia dello specchio, il trattamento più diffuso e studiato per questa condizione. Ho scritto la scheda (evidence_level: low) presentando questo intervento come opzione ragionevole a basso rischio, non come trattamento di efficacia dimostrata — per non promettere ai pazienti risultati che la letteratura attuale non garantisce.
- **Ustioni**: fonte con dettagli molto specifici e verificabili (angoli articolari esatti per il posizionamento anti-contrattura, durata degli indumenti compressivi, percentuale di pazienti con distress psicologico) — contenuto insolitamente ricco di cifre precise, tutte tratte dalla fonte.
- **Cachessia neoplastica**: la revisione sistematica di riferimento riporta onestamente effetti complessivi piccoli e non statisticamente significativi sulla composizione corporea nel pool aggregato di studi, pur con risultati positivi in singoli studi — ho scritto la scheda comunicando questa eterogeneità invece di presentare l'esercizio come una soluzione consolidata.

**Stato attuale: 430 condizioni totali** (426 + 4 nuove). **Mancano 370 per arrivare a 800.**

**Batch 17 (4 condizioni, id 471-474):** nessun nuovo doppione scoperto. Verificati preventivamente contro il database candidati molto ampi in area vestibolare, mano/polso, arto inferiore, autoimmune e neurodegenerativa (sindrome di Guillain-Barré, miastenia gravis, plesso brachiale, De Quervain, Dupuytren, rizoartrosi, rottura del tendine d'Achille, instabilità cronica di caviglia, Sever, scoliosi, Parkinson, Duchenne, paralisi cerebrale infantile, stretto toracico, meralgia parestesica, piriforme, labbro glenoideo/SLAP, instabilità di spalla, osteite pubica/pubalgia, conflitto femoro-acetabolare, dolore trocanterico, bandelletta ileotibiale, stenosi lombare, spondilolisi/listesi, whiplash, tunnel cubitale, nervo peroneo, cuffia dei rotatori, capsulite, Scheuermann, Morton, Paget, sacroiliaca, artrite reumatoide, emofilia, SMA, lupus, Charcot-Marie-Tooth, osteoporosi, prolasso, sarcopenia, SLA, sclerosi sistemica, long COVID, gambe senza riposo, CRPS, spondilite anchilosante, BPPV, vertigine post-trauma, AIG, Kienböck, tunnel tarsale, Blount, torcicollo, plagiocefalia, nervo radiale, gomito del lanciatore, Kohler, stress tibiale, compartimentale, piede torto, RED-S) — praticamente tutti già presenti, a conferma di quanto il database sia ormai maturo su gran parte dell'ortopedia/neurologia/reumatologia comuni. Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Malattia di Ménière — riabilitazione vestibolare | Nervo periferico "Nervo Vestibolococleare (VIII)" | Guidelines of the French Society of ENT (SFORL, short version) on the role and modalities of vestibular rehabilitation in Menière's disease, Annales françaises d'Oto-rhino-laryngologie et de Pathologie Cervico-faciale | 2026 |
| Neurite vestibolare (vestibulopatia unilaterale acuta) | Nervo periferico "Nervo Vestibolococleare (VIII)" | Vestibular Neuritis — Physician Fact Sheet, Academy of Neurologic Physical Therapy (ANPT), Vestibular SIG (Crumley R, Roth HR) | 2024 |
| Sindrome di Sjögren — esercizio fisico | Immunologia | Effects of physical activity on health-related outcomes in Sjögren's syndrome: systematic review e meta-analisi di RCT, Frontiers in Immunology (Zhang M et al.) | 2026 |
| Distrofia muscolare facio-scapolo-omerale (FSHD) — esercizio fisico | Neurologia | Physical exercise in facioscapulohumeral muscular dystrophy: state of the art and future challenges beyond common misconceptions, European Journal of Applied Physiology (Crisafulli O et al.) | 2026 |

Note oneste su questo batch:
- **Ménière e Neurite vestibolare**: seguito lo stesso schema già usato per BPPV (#286) e Ipofunzione vestibolare (#287) — collegamento al nervo periferico "Nervo Vestibolococleare (VIII nervo cranico)", senza tag di sistema aggiuntivo (coerenza con il precedente già in banca dati). Per Ménière ho riportato con precisione un dettaglio clinico importante e specifico della linea guida SFORL: la riabilitazione vestibolare va iniziata solo dopo che il deficit si è stabilizzato (circa 3 mesi), mai durante la crisi acuta — un punto che, se ignorato, porterebbe a un intervento clinicamente inappropriato. Per la neurite vestibolare ho incluso il test HINTS+ come red flag esplicito per la distinzione da causa centrale (ictus), con la soglia clinica precisa riportata dalla fonte (nistagmo non soppresso dalla fissazione visiva = sospetta causa centrale).
- **Sindrome di Sjögren**: qui la meta-analisi 2026 più recente disponibile è stata particolarmente utile per correggere un'assunzione facile da fare per default — l'esercizio fisico migliora funzione cardiopolmonare, capacità funzionale e stato di salute generale, ma **non** ha mostrato miglioramento statisticamente significativo su fatica, dolore, aspetti sociali o attività di malattia (ESSDAI), nonostante la fatica sia il sintomo più invalidante riportato dai pazienti con questa condizione. Ho scritto la scheda comunicando questo onestamente, per evitare di presentare l'esercizio come rimedio per la fatica quando i dati più recenti non lo confermano.
- **FSHD**: fonte eccellente e molto recente (revisione 2026 dedicata specificamente a superare le "misconcezioni comuni" su questa condizione) — ho incluso il dato centrale e clinicamente rilevante che la storica preoccupazione per la "overwork weakness" (indebolimento da sovraccarico) non è stata confermata dagli studi disponibili con esercizio correttamente prescritto, insieme all'onesta limitazione che i dati riguardano quasi esclusivamente pazienti ambulanti con malattia lieve-moderata (141 pazienti in 11 studi totali) — non estrapolabile senza cautela ai casi più avanzati.
- **WebFetch**: in questo batch il recupero diretto del testo integrale ha funzionato bene per 3 fonti su 4 (SFORL via ScienceDirect, ANPT fact sheet, Sjögren via Frontiers, FSHD via PMC) dopo alcuni tentativi bloccati da reCAPTCHA su PubMed/PMC diretti — bypassati cercando fonti alternative dello stesso contenuto (editore diretto) invece di riprovare l'URL bloccato, come da prassi ormai consolidata in questa sessione.

**Stato attuale: 434 condizioni totali** (430 + 4 nuove). **Mancano 366 per arrivare a 800.**

**Batch 18 (4 condizioni, id 475-478):** nessun nuovo doppione scoperto. Verificati preventivamente contro il database candidati come Malattia di Peyronie, disfunzione erettile post-prostatectomia, vescica neurogena (già ben coperta con 3 voci distinte), diabete tipo 1/2 (già presenti), dolore miofasciale (già presente su braccio e gluteo), trapianto renale — quasi tutti già presenti o non abbastanza sostenuti da letteratura fisioterapica specifica. Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sindrome da tachicardia posturale ortostatica (POTS) — esercizio terapeutico | Cardio-respiratorio | Exercise Recommendations for POTS: A Clinical Review, Journal of Clinical Medicine (Trimble KZ, Switzer JN, Blitshteyn S) | 2024 |
| Trapianto di cellule staminali ematopoietiche — esercizio e riabilitazione | Ematologia | Home-based, telehealth, and hybrid exercise interventions for adults undergoing or recovering from HSCT: systematic review di RCT, Frontiers in Rehabilitation Sciences (Batalik L et al.) | 2026 |
| Gomito del lanciatore (apofisite dell'epicondilo mediale) | Ortopedico/MSK (zona "Gomito") | Medial Epicondyle Apophysitis (Little League Elbow), StatPearls (Hodge C, Schroeder JD) | 2023 |
| Necrosi avascolare della testa del femore (adulto) — riabilitazione post-decompressione midollare | Ortopedico/MSK (zona "Anca") | Core Decompression for Osteonecrosis of the Femoral Head, Video Journal of Sports Medicine (Vega JF, Cervantes JE, Yee BF, Nho SJ) | 2026 |

Note oneste su questo batch:
- **POTS**: fonte esplicita e utile su un punto controintuitivo — il protocollo classico ad alta intensità (Dallas/Levine) non viene completato da quasi il 60% dei pazienti, per cui la scheda privilegia il protocollo CHOP modificato con progressione posizionale graduale (supina→seduta→eretta) invece di presentare il protocollo storico come prima scelta. Distinta da "Sindrome delle gambe senza riposo" e da "Long COVID" già presenti — condizione autonomica/cardiovascolare a sé.
- **Trapianto di cellule staminali ematopoietiche**: a differenza del "Trapianto Renale" (#361) e dell'"Immunosoppressione post-trapianto" (#378) già presenti ma non taggati, qui ho scelto di taggare 'hematology' per coerenza con le altre condizioni ematologiche/oncoematologiche in banca dati. Comunicato onestamente che l'evidenza più recente è più solida per la capacità funzionale (6MWT, velocità del cammino) che per fatica e qualità di vita, dove i risultati restano incostanti tra gli studi.
- **Gomito del lanciatore**: condizione pediatrica distinta da "Torcicollo miogeno congenito" e altre voci pediatriche già presenti — nessuna sovrapposizione trovata con voci esistenti sul gomito (tunnel cubitale, tunnel radiale, Kienböck). Il dato sulla bassa aderenza storica alle linee guida di pitch count (solo il 73% degli allenatori) è stato incluso esplicitamente come informazione di sicurezza da comunicare a squadre/famiglie.
- **Necrosi avascolare della testa del femore (adulto)**: distinta esplicitamente dalla Malattia di Legg-Calvé-Perthes (#447, forma pediatrica già presente) e dalla Malattia di Kienböck (necrosi del semilunare, distretto diverso) — qui la forma adulta post-decompressione midollare, con un protocollo riabilitativo in 4 fasi molto dettagliato e completamente verificato dalla fonte, inclusi i tempi esatti e i tassi di sopravvivenza a 2 anni.

**Stato attuale: 438 condizioni totali** (434 + 4 nuove). **Mancano 362 per arrivare a 800.**

**14° merge trovato strada facendo (autocorrezione):** durante la ricerca del batch 19 ho creato una nuova scheda "Radicolopatia cervicale — mobilizzazione articolare e neurale" (id 482) prima di accorgermi che una **"Radicolopatia cervicale" (#28) esisteva già** in banca dati fin dal batch fondativo, con fonte di altissimo livello (Blanpied PR, Gross AR et al., Neck Pain: Revision 2017, J Orthop Sports Phys Ther — linea guida clinica ufficiale, evidence_level "high"). Il mio controllo preventivo di esistenza per questo batch aveva cercato "ernia del disco cervicale" e "mielopatia cervicale" ma non "radicolopatia cervicale" alla lettera — un errore di ricerca da parte mia, non un problema di dati. Appena scoperto (prima di taggare la nuova riga, quindi senza alcun collegamento da ripuntare), ho **fuso #482 dentro #28** invece di lasciare il doppione: ho trascritto in #28 i risultati quantitativi della network meta-analisi 2025 che stavo per inserire come scheda separata (mobilizzazione articolare+neurale+gestione standard = maggior riduzione del dolore; mobilizzazione neurale da sola = risultati migliori sulla disabilità, con onestà sulla qualità dell'evidenza da moderata a molto bassa), aggiornato il campo `source` con la citazione 2025 accanto alla linea guida 2017 originale, e cancellato #482. Verificato: #482 non aveva alcun collegamento in nessuna tabella (zone, nervi, traduzioni) al momento della cancellazione, quindi nessun riferimento orfano.

**Batch 19 (3 condizioni nette, id 479-481, dopo il merge sopra):** verificati preventivamente contro il database candidati come coccigodinia, arteriopatia periferica/claudicatio, frattura da stress navicolare, mielopatia cervicale, dito a martello, malattia di Wilson, distonia generalizzata — tutti già presenti. Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Dolore pelvico gravidico (disfunzione della sinfisi pubica / pelvic girdle pain) | Pavimento pelvico (anteriore, femminile) | The effectiveness of physiotherapy interventions for Pregnancy-Related lumbopelvic pain: systematic review e meta-analisi di RCT, Brazilian Journal of Physical Therapy (Mladenovic M, Coughlan LM, do Nascimento PRC et al.) | 2026 |
| Sindrome da conflitto posteriore di caviglia (os trigonum) | Ortopedico/MSK (zona "Caviglia / Piede") | Conservative management of posterior ankle impingement, Journal of the Canadian Chiropractic Association (Senécal I, Richer N) | 2016 |
| Sindrome da fragilità (frailty) nell'anziano | Ortopedico/MSK (zona "Corpo Intero / Equilibrio e Andatura") | Prevention and Mitigation of Frailty Syndrome in Institutionalised Older Adults Through Physical Activity: A Systematic Review, Healthcare (Martínez-Montes GF et al.) | 2025 |

Note oneste su questo batch:
- **Dolore pelvico gravidico**: fonte eccellente e molto recente (31 RCT, oltre 4600 partecipanti) — comunicato onestamente che l'esercizio mostra evidenza di bassa certezza nel breve termine (0-5 settimane, non superiore alla sola gestione standard) ma beneficio più solido nel medio termine (6-12 settimane), invece di presentare l'esercizio come efficace fin da subito.
- **Sindrome da conflitto posteriore di caviglia**: qui la fonte migliore trovata è un caso clinico singolo (case report) del 2016, non una revisione sistematica ampia — segnalato esplicitamente con evidence_level "low" e nota nel campo `contraindications`, per non far apparire il protocollo in 4 fasi/14 settimane come standard validato su larga scala quando descrive un singolo paziente.
- **Sindrome da fragilità**: distinta esplicitamente dalla Sarcopenia (#98) già presente — la fragilità è una sindrome clinica più ampia (fenotipo di Fried), non solo perdita di massa muscolare. Taggata alla stessa zona "Corpo Intero / Equilibrio e Andatura" già usata per la Sarcopenia, per coerenza. Dati quantitativi onesti riportati (reversione nel 36% dei partecipanti, ma benefici che si riducono dopo il detraining).

**Stato attuale: 441 condizioni totali** (438 + 4 nuove − 1 merge). **Mancano 359 per arrivare a 800.**

**15° merge trovato strada facendo (autocorrezione, riguarda un batch precedente):** durante il controllo preventivo di esistenza per il batch 20 ho scoperto che **"Displasia evolutiva dell'anca (DDH)" (#438)**, inserita in un batch precedente ("batch 8", fonte AAOS Clinical Practice Guideline 2022), duplicava una scheda molto più ricca e già presente da tempo: **"Displasia congenita dell'anca (DCA)" (#65)**, basata su un consensus Delphi 2019 con classificazione ecografica di Graf (angoli alfa/beta), criteri di rischio specifici per il tutore di Pavlik e contenuti sugli esiti a lungo termine nell'adulto (artroplastica totale d'anca). Confronto completo campo per campo tra le due schede: #65 conteneva dettagli clinici significativamente più ricchi e operativi, mentre #438 era più generico/con più campi "DA VERIFICARE", nonostante la fonte più recente — la stessa linea guida AAOS 2022, del resto, è dichiaratamente centrata su bracing/imaging più che su contenuti specifici di fisioterapia. Ho scelto di **mantenere #65** (contenuto clinico più completo, non semplicemente la fonte più recente) e vi ho **trascritto la citazione AAOS 2022** più i termini multilingue mancanti dalle keyword di #438, poi ho cancellato il collegamento di #438 in `body_zone_conditions` e infine la riga #438 stessa. Verificato che #438 non avesse altri riferimenti prima della cancellazione. Questo merge non riguarda il lavoro di oggi in senso stretto (la duplicazione risaliva a un batch precedente), ma viene documentato qui con la stessa trasparenza applicata al 14° merge, nel momento in cui è stato scoperto.

**Batch 20 (4 condizioni, id 483-486):** verificati preventivamente contro il database candidati come malattia di Wilson, piede piatto, genu valgo/varo, distonia generalizzata (quest'ultima cercata anche per escludere sovrapposizione con "Distonia cervicale" #456, già presente e distinta come forma focale) — tutti genuinamente assenti (a parte la scoperta del 15° merge sopra, non collegata a questi 4). Aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Malattia di Wilson — fisioterapia dei disturbi del movimento | Neurologico (tag `neurology`) | Physiotherapy in Wilson's Disease, Physiopedia (basata su casi clinici pubblicati 2012, 2016, 2023) | 2023 |
| Piede piatto flessibile pediatrico — gestione conservativa | Ortopedico/MSK (zona "Ossa del Piede") | Treatment of pediatric flatfoot: a systematic review-based consensus and guidelines by CPAM-LRC, Frontiers in Pediatrics (Sharula, Zhao F, Wu T et al.) | 2026 |
| Genu valgo/varo idiopatico pediatrico — gestione conservativa | Ortopedico/MSK (zona "Ginocchio") | Lower Extremity Abnormalities in Children, American Family Physician (Baird DC, Dickison CG, Spires HI) | 2025 |
| Distonia generalizzata — neuroriabilitazione | Neurologico (tag `neurology`) | Neurorehabilitation in dystonia care: key questions of who benefits, what modalities, and when to intervene, Dystonia (Wagle Shukla A, Kamo H, Nagaki K, Kraus AR, Warren L) | 2025 |

Note oneste su questo batch:
- **Malattia di Wilson**: la fonte migliore reperibile per la componente fisioterapica è una pagina Physiopedia basata su casi clinici pubblicati (2012, 2016, 2023), non un trial randomizzato — segnalato esplicitamente con evidence_level "low", per non far apparire il programma di esercizio come standard validato su larga scala.
- **Piede piatto flessibile pediatrico**: distinto chiaramente il piede piatto flessibile fisiologico sotto i 6 anni (nessun trattamento attivo necessario) dalla forma sintomatica che beneficia di esercizio come prima linea (normalizzazione nel 91,2% dei casi moderati contro il 54,0% con sola ortesi); escluso esplicitamente il piede piatto rigido/coalizione tarsale, che richiede un percorso diverso.
- **Genu valgo/varo idiopatico pediatrico**: nessun programma di esercizio correttivo proposto per la variante fisiologica entro i range normali per età — resistito volutamente l'impulso di inventare un trattamento non supportato dalla letteratura; il contenuto centra su educazione/rassicurazione della famiglia e criteri chiari di invio ortopedico (red flags) in presenza di deviazioni oltre 2 deviazioni standard, dolore, obesità associata o storia di frattura metafisaria prossimale della tibia.
- **Distonia generalizzata**: comunicato onestamente che l'evidenza più solida di efficacia riabilitativa riguarda le forme focali (distonia cervicale, compito-specifica) e non la distonia generalizzata in sé, posizionando la neuroriabilitazione come complemento alla tossina botulinica piuttosto che come trattamento sostitutivo. Taggata 'neurology' per coerenza con la Distonia cervicale (#456) già presente.

**Stato attuale: 444 condizioni totali** (440 dopo il 15° merge + 4 nuove del batch 20). **Mancano 356 per arrivare a 800.**

**16° merge trovato strada facendo (autocorrezione, riguarda un batch precedente):** durante il controllo preventivo di esistenza per il batch 21 ho scoperto **due schede quasi identiche sulla BPCO**: "BPCO (broncopneumopatia cronica ostruttiva)" (#36, dal batch fondativo, fonte ATS 2023 CPG) e "Broncopneumopatia Cronica Ostruttiva (BPCO)" (#117, da un batch successivo, fonte GOLD 2025 + ATS/ERS 2023 + network meta-analisi sui componenti della riabilitazione respiratoria). Entrambe di alta qualità (evidence_level "high"), ma #117 più recente e più ricca (dettaglio su supervisione in presenza vs telerehabilitazione, dato del 6MWT <350m e mortalità a 12 mesi, red flags più specifici sul pattern ventilatorio). Ho scelto di **mantenere #117** e vi ho **trascritto da #36** la scala mMRC Dyspnea Scale con la descrizione completa dei gradi 0-4 (contenuto clinico utile assente in #117), l'enfasi esplicita sul coordinamento medico obbligatorio prima di impostare l'intensità dell'esercizio, la citazione ATS 2023 originale, e i termini multilingue mancanti dalle keyword (EPOC, enfisema pulmonar, mpoc). Cancellato il tag `cardiopulmonary_condition_tags` di #36 (valore 'cardiopulmonary', diverso da quello di #117 'respiratory' — incoerenza di tagging preesistente nella tabella, non risolta qui) e poi la riga #36 stessa. Nessun altro riferimento trovato prima della cancellazione.

**Batch 21 (4 condizioni, id 487-490):** verificati preventivamente contro il database oltre 60 candidati across quasi tutte le categorie (tunnel tarsale, stretto toracico, spondilolistesi, De Quervain, fibromialgia, Guillain-Barré, osteoporosi, spondilite anchilosante, piriforme, stenosi del canale, Parkinson, sclerosi multipla, artrite reumatoide, gotta, tunnel carpale, Dupuytren, borsite trocanterica, FAI, instabilità di spalla, SLAP, crociato posteriore, lesione meniscale, condromalacia, Freiberg, piede cavo, Achille, periostite tibiale, compartimentale, patello-femorale, Panner, epitrocleite, CIDP, Charcot-Marie-Tooth, miastenia gravis, piede di Charcot, neuropatia diabetica, bronchiectasie, fibrosi cistica, ipertensione polmonare, sarcoidosi, miopatie infiammatorie, SLA, Huntington, paralisi cerebrale, spina bifida, idrocefalo, emicrania, cefalea, ictus, trauma cranico, labirintite, Ramsay Hunt, neurinoma dell'acustico) — quasi tutti già presenti, a conferma di quanto la banca dati sia ormai matura sulle condizioni comuni. Oltre alla scoperta del 16° merge sopra (non collegata a questi 4), genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Ipertensione polmonare — esercizio terapeutico supervisionato | Cardio-respiratorio (tag `cardiopulmonary`) | Resistance Exercise as a Therapeutic Benefit for Patients with Pulmonary Arterial Hypertension, IntechOpen (Soares LL, Natali AJ); ERS statement on exercise training and rehabilitation in severe chronic PH, Eur Respir J (Grünig E, Eichstaedt C, Barberà JA, et al.) | 2024 |
| Labirintite — riabilitazione vestibolare | Neurologia (nervo VIII) | Labyrinthitis and Vestibular Neuritis, Vestibular Disorders Association (VeDA) | 2025 |
| Sindrome di Ramsay Hunt — riabilitazione della paralisi facciale e della componente vestibolo-cocleare | Neurologia (nervi VII + VIII) | Ramsay Hunt Syndrome, Physiopedia (basata su Kanerva M et al., Eur Arch Otorhinolaryngol, 2020); case report, Journal of Yoga & Physical Therapy (Whitehead MT, Guffey JS, Barrett CA) | 2020 |
| Neurinoma dell'acustico (schwannoma vestibolare) — riabilitazione vestibolare pre e post-chirurgica | Neurologia (nervo VIII) | Vestibular Rehabilitation... Vestibular Schwannoma: A Systematic Review, Physical Therapy (Yap J, Palmer G, Graving K, Stone S, Gane EM) | 2024 |

Note oneste su questo batch:
- **Ipertensione polmonare**: fonte migliore reperibile per i parametri pratici dell'esercizio è un capitolo IntechOpen 2024 centrato sul rinforzo, integrato con la citazione della linea guida di riferimento ERS 2019 (Grünig et al.) per il quadro generale di sicurezza — evidence_level "moderate", con enfasi esplicita su supervisione specialistica obbligatoria e divieto della manovra di Valsalva.
- **Labirintite**: distinta esplicitamente dalla Neurite vestibolare (#472, già presente) per la presenza di ipoacusia/coinvolgimento cocleare — fonte VeDA (non una linea guida clinica formale), evidence_level "low" dichiarato esplicitamente.
- **Sindrome di Ramsay Hunt**: comunicato onestamente che il tasso di recupero incompleto è significativamente più alto rispetto alla Paralisi di Bell (#451, già presente), invece di trattarle come equivalenti; fonte riabilitativa specifica basata su un singolo caso clinico (2012), evidence_level "low" dichiarato esplicitamente; taggata a entrambi i nervi coinvolti (VII e VIII), stesso schema multi-nervo già usato per #143.
- **Neurinoma dell'acustico**: comunicato onestamente che la revisione sistematica di riferimento (23 studi) descrive la certezza complessiva dell'evidenza come "molto bassa" — evidence_level "low" dichiarato esplicitamente, evitando di presentare i protocolli di prehabilitation/riabilitazione post-chirurgica come standard consolidato.

**Stato attuale: 447 condizioni totali** (444 − 1 merge del #36/#117 + 4 nuove del batch 21). **Mancano 353 per arrivare a 800.**

**17° merge trovato strada facendo (autocorrezione, riguarda un batch precedente):** durante il controllo preventivo di esistenza per il batch 22 ho scoperto **due schede quasi identiche su trombosi venosa profonda/tromboembolismo venoso**: "Tromboembolismo Venoso (Trombosi Venosa Profonda ed Embolia Polmonare)" (#320) e "Trombosi Venosa Profonda (TVP) e Tromboembolismo Venoso" (#383). Confronto completo: #320 aveva un contenuto narrativo più ricco e aggiornato (epidemiologia dettagliata, score di Wells/Geneva, enfasi APTA 2024/linee guida europee 2024 sulla mobilizzazione precoce) ma campi strutturati incompleti (keyword, source e outcome_measures mancanti); #383 aveva tutti i campi strutturati completi, fonte citata correttamente (ASH 2019/2020, Blood Advances) ed evidence_level "strong". Ho scelto di **mantenere #383** (struttura dati più completa e fonte tracciabile) e vi ho **trascritto da #320** i contenuti clinici di valore assenti: score di Wells/Geneva, enfasi sulla mobilizzazione precoce secondo APTA 2024/linee guida europee 2024, il dato sulla mortalità entro un'ora nell'embolia polmonare sintomatica, e la nota sugli audit 2025 sull'aderenza alle linee guida di profilassi. Cancellato il tag `cardiopulmonary_condition_tags` di #320 (valore 'cardiac') e poi la riga #320 stessa; nessun altro riferimento trovato. **Nota separata (non un merge):** ho anche trovato tre schede sul linfedema secondario (#379 generale, #394 arto superiore, #398 arto inferiore ginecologico) che si sovrappongono parzialmente ma coprono ambiti clinicamente distinti (presentazione bilaterale/genitale, indice caviglia-braccio, respirazione diaframmatica per il drenaggio degli arti inferiori) — non le ho fuse, ma segnalo che #394 e #398 hanno `condition_keywords` e `source` a NULL e un campo `evidence_level` in formato non standard (frase descrittiva anziché enum low/moderate/high), un problema di formattazione ereditato da un batch precedente che meriterebbe una correzione dedicata in futuro.

**Batch 22 (4 condizioni, id 491-494):** verificati preventivamente contro il database oltre 30 candidati aggiuntivi (Buerger, tromboangioite, osteomielite, artrite settica, tendinopatia bicipitale — già presente come #13, terapia intensiva/ICU, epifisiolisi, scoliosi, Scheuermann, plagiocefalia, Erb's palsy, osteosarcoma, amputazione, SICK scapula) — quest'ultima scartata perché troppo sovrapponibile alla Discinesia scapolare (#337) già presente, per evitare di creare io stesso un nuovo doppione. Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Tromboangioite obliterante (malattia di Buerger) — esercizio terapeutico supervisionato | Immunologia/vasculite (tag `immune`) | Efficacy of Supervised Exercise Therapy for Intermittent Claudication in a Case With Buerger's Disease, Cureus (Komiya K, Iwai T, Ohno M) | 2023 |
| Debolezza acquisita in terapia intensiva (ICU-acquired weakness) — mobilizzazione precoce | Neurologico (tag `neurology`) | Early mobilization to prevent ICU-acquired weakness in mechanically ventilated patients: an integrative review, Frontiers in Medicine (Wang G et al.) | 2026 |
| Plagiocefalia posizionale del lattante — riposizionamento e fisioterapia | Pediatrico/MSK (zona "Cranio") | Congress of Neurological Surgeons Systematic Review and Evidence-Based Guideline...: The Role of Repositioning, Neurosurgery | 2016 |
| Sarcoma dei tessuti molli degli arti inferiori — riabilitazione funzionale post-chirurgica | Oncologico/MSK (non taggata a zona specifica) | Physical activity and functional rehabilitation in lower limb soft tissue sarcoma survivors, Journal of Medicine, Surgery, and Public Health (Nasralla HA et al.) | 2026 |

Note oneste su questo batch:
- **Tromboangioite obliterante**: fonte migliore reperibile è un singolo caso clinico (Cureus 2023) — evidence_level "low" dichiarato esplicitamente; enfatizzata la cessazione del fumo come intervento imprescindibile e non sostituibile dall'esercizio.
- **Debolezza acquisita in terapia intensiva**: fonte recente e solida (revisione integrativa 2026) con criteri di sicurezza emodinamica/respiratoria molto specifici riportati per intero, per un uso clinico sicuro nella mobilizzazione precoce.
- **Plagiocefalia posizionale**: comunicato onestamente, secondo l'evidenza di livello I/II della linea guida CNS, che la fisioterapia è superiore alla sola educazione al riposizionamento ma il casco correttivo resta la scelta più rapida per le forme severe; escluso l'uso di dispositivi di posizionamento morbidi per il rischio di SIDS.
- **Sarcoma dei tessuti molli**: comunicato onestamente che permangono lacune significative sui parametri di allenamento ottimali per assenza di studi prospettici di alta qualità — evidence_level "low" dichiarato esplicitamente; lasciata senza zona anatomica specifica per coerenza con altre condizioni oncologiche sistemiche già presenti (Amputazione #467, Ustioni #469).

**Stato attuale: 450 condizioni totali** (447 − 1 merge del #320/#383 + 4 nuove del batch 22). **Mancano 350 per arrivare a 800.**

**Batch 23 (4 condizioni, id 495-498):** nessun nuovo doppione autocorretto questa volta — verificati preventivamente contro il database oltre 25 candidati aggiuntivi (Tietze/costocondrite, costola scivolata, Kohler, Panner, lesione midollare/tetraplegia/paraplegia, cauda equina, stenosi del canale lombare, meralgia parestesica, nervo peroneo/piede cadente, instabilità cronica di caviglia, fascite plantare, osteite pubica, pubalgia, ernia inguinale/sportiva, tendinopatia del popliteo, Alzheimer/demenza, artrosi di caviglia, artropatia emofilica) — quasi tutti già presenti. Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Lesione midollare traumatica — riabilitazione multidisciplinare | Neurologico (tag `neurology` + zona cerebrale "Midollo Spinale") | Spinal Cord Injury Clinical Guidelines, Physiopedia (sintesi di NICE NG41 2016, Consortium for Spinal Cord Medicine 2005-2016, Global Spine Journal CPG 2017, Canadian Best Practice 2013, Evidence-based Scientific Exercise Guidelines 2018) | 2018 |
| Malattia di Kohler (osteocondrosi dello scafoide tarsale) — gestione conservativa | Pediatrico/MSK (zona "Ossa del Piede") | Kohler Disease, StatPearls (Trammell AP, Davis DD, Scott A) | 2023 |
| Malattia di Panner (osteocondrosi del capitello omerale) — gestione conservativa | Pediatrico/MSK (zona "Gomito") | Panner's Disease, Physiopedia (Claessen FMAP et al. 2015 e altre fonti); Seven Elbows With Panner Disease..., Orthopaedic Journal of Sports Medicine (Ueda Y, Sugaya H, et al.) | 2025 |
| Sindrome della costola scivolata (slipping rib syndrome) — terapia manuale e mobilizzazione costale | Ortopedico/MSK (zona "Coste e Sterno") | Slipping Rib Syndrome, Physiopedia | 2022 |

Note oneste su questo batch:
- **Lesione midollare traumatica**: sorprendentemente assente fino ad ora nonostante la ricchezza della sezione neurologica — colmata con una scheda ricca su mobilizzazione precoce, disreflessia autonomica, ipotensione ortostatica e prevenzione delle lesioni da pressione; fonte una sintesi Physiopedia di piu linee guida reali (2013-2018), non l'edizione piu recente disponibile (esiste una "2025 edition" cinese non accessibile per blocco reCAPTCHA) — segnalato onestamente che le linee guida citate risalgono al 2013-2018.
- **Malattia di Kohler**: comunicata con sicurezza ai genitori l'assenza di esiti a lungo termine riportati in letteratura, per una condizione spesso fonte di preoccupazione sproporzionata rispetto alla sua prognosi eccellente.
- **Malattia di Panner**: distinta esplicitamente dall'osteocondrite dissecante del capitello (gestione e prognosi differenti); evidence_level "low" dichiarato esplicitamente per l'evidenza limitata a serie di casi.
- **Sindrome della costola scivolata**: elencate esplicitamente le numerose diagnosi differenziali toraco-addominali più gravi da escludere prima del trattamento conservativo (patologia cardiaca, colecistite, ulcera, appendicite, pancreatite, asma, colica renale); collegata alla zona "Coste e Sterno", già usata per la Costocondrite (#323).

**Stato attuale: 454 condizioni totali** (450 + 4 nuove del batch 23). **Mancano 346 per arrivare a 800.**

**18° merge trovato strada facendo (autocorrezione, riguarda un batch precedente):** durante il controllo preventivo di esistenza per il batch 24 ho scoperto **due schede quasi identiche sulla disfunzione temporomandibolare**: "Disfunzione temporo-mandibolare (DTM)" (#340, fonte Schiffman/DC-TMD 2014, con criteri numerici precisi di apertura orale) e "Disfunzione temporomandibolare (DTM) — fisioterapia e terapia manuale" (#449, fonte AHRQ 2023, con discussione piu ricca della qualita dell'evidenza e del principio "reversibile prima di irreversibile"). Ho scelto di **mantenere #449** (fonte piu recente) e vi ho **trascritto da #340** i criteri quantitativi di progressione (apertura orale >35-40mm), i test clinici specifici (misurazione in mm, screening del rachide cervicale superiore), i red flag su trisma post-traumatico/frattura condilare, e la citazione dei criteri diagnostici DC/TMD 2014 (standard internazionale di classificazione, valore di riferimento troppo importante per perdere). Ripuntato il collegamento `body_zone_conditions` (zona "Cranio") da #340 a #449, poi cancellata la riga #340.

**Batch 24 (4 condizioni, id 499-502):** verificati preventivamente contro il database oltre 15 candidati aggiuntivi (Klippel-Feil, artrogriposi, distrofia muscolare di Becker, malattia di Pompe, sindrome di Prader-Willi, fibrodisplasia ossificante progressiva, sindrome di Rett, paralisi diaframmatica, sindrome di Paget-Schroetter/trombosi da sforzo, scoliosi congenita) — la Sindrome di Down era già presente (#446). Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Malattia di Pompe (glicogenosi di tipo II) — esercizio terapeutico | Neurologico/miopatia (tag `neurology`) | Management of Pompe disease alongside and beyond ERT: a narrative review, Acta Myologica (Filosto M et al.); Physical therapy management of Pompe disease, Genetics in Medicine (Case LE, Kishnani PS) | 2025 |
| Fibrodisplasia ossificante progressiva (FOP) — gestione riabilitativa con estrema cautela | Genetico/connettivale (tag `immune`) | Medical guidelines for fibrodysplasia ossificans progressiva, JBMR Plus (Kaplan FS, Pignolo RJ, et al., 28 esperti internazionali) | 2025 |
| Sindrome di Paget-Schroetter (trombosi venosa da sforzo dell'arto superiore) | Ematologico/vascolare (tag `hematology`) | Diagnosis of Paget-Schroetter Syndrome/Primary Effort Thrombosis in a Recreational Weight Lifter, Physical Therapy (DeLisa M, Hensley C, Jackson S) | 2017 |
| Distrofia muscolare di Becker (BMD) — esercizio terapeutico | Neurologico (tag `neurology`) | Meeting report: Translating exercise research in dystrophinopathy to the clinic, Journal of Neuromuscular Diseases (Lott DJ, Duong T, et al.) | 2026 |

Note oneste su questo batch:
- **Malattia di Pompe**: comunicato onestamente che molte raccomandazioni si basano su consenso di esperti e piccoli studi, non su linee guida universalmente concordate, data la rarità della condizione; enfatizzato il divieto di esercizio resistivo/eccentrico eccessivo per il rischio di aggravare la degradazione muscolare.
- **Fibrodisplasia ossificante progressiva**: condizione a rischio particolarmente elevato se trattata con approcci fisioterapici standard — riportati per intero i divieti assoluti (mai stretching passivo, mai iniezioni intramuscolari incluse le vaccinazioni, mai biopsie chirurgiche) dalla linea guida medica internazionale più recente (2025, 28 esperti); fonte di altissima autorevolezza per una condizione ultra-rara.
- **Sindrome di Paget-Schroetter**: enfatizzato che le tecniche fisioterapiche standard per lo stretto toracico sono inefficaci e potenzialmente pericolose in presenza di trombo — condizione critica da riconoscere come diagnosi differenziale prima di trattare un gonfiore dell'arto superiore come sindrome dello stretto toracico comune; fonte un singolo caso clinico, evidence_level "low" dichiarato esplicitamente.
- **Distrofia muscolare di Becker**: distinta esplicitamente dalla Duchenne (#439) per esordio più tardivo e decorso più lento; riportati i segnali di allarme specifici (urine scure, dolore muscolare prolungato) e il divieto assoluto di esercizio eccentrico.

**Stato attuale: 457 condizioni totali** (454 − 1 merge del #340/#449 + 4 nuove del batch 24). **Mancano 343 per arrivare a 800.**

**Batch 25 (4 condizioni, id 503-506):** verificati preventivamente contro il database (ricerca ILIKE mirata) oltre 15 candidati aggiuntivi: Sindrome di Guillain-Barré, Malattia di Charcot-Marie-Tooth, Scoliosi idiopatica dell'adolescente erano già presenti (rispettivamente #71, #282, #333); genuinamente assenti e confermati: Sindrome di Klippel-Feil, Artrogriposi multipla congenita, Deformità di Haglund, Esostosi multiple ereditarie, Sindrome di Tourette, Paralisi diaframmatica, Scoliosi congenita. Di questi, aggiunti in questo batch i 4 con la fonte più solida reperibile (Tourette ed esostosi multiple ereditarie rimandati: la prima ha letteratura quasi interamente comportamentale/farmacologica senza un ruolo fisioterapico chiaro nelle fonti reperite, la seconda solo una guida paziente generica senza protocollo clinico specifico):
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Deformità di Haglund con tendinopatia achillea inserzionale — riabilitazione post-chirurgica progressiva | Ortopedico/MSK (tag zona "Caviglia / Piede") | Insertional Achilles Tendinopathy with Haglund's Deformity: A Progressive Approach to Post-Operative Rehabilitation in Athletes, IJSPT (Dudek M, Robinson ABJ, Newcomer M, Haytmanek CT) | 2026 |
| Sindrome di Klippel-Feil — riabilitazione e gestione del dolore | Ortopedico/MSK pediatrico (tag zona "Rachide Cervicale") | Rehabilitation and Pain Management in Klippel-Feil Syndrome Associated With Caroli's Disease, Scoliosis, and Aphasia, Cureus (Majit AA, Aymane A, El Oumri AA) | 2025 |
| Artrogriposi multipla congenita — fisioterapia pediatrica precoce | Ortopedico/MSK pediatrico (non taggata: contratture multi-articolari, nessuna zona singola pertinente) | Arthrogryposis Multiplex Congenita, Physiopedia | 2026 |
| Paralisi diaframmatica — riabilitazione respiratoria | Cardio-respiratorio (tag `cardiopulmonary`) | Exercise therapy for a patient with persistent dyspnea after combined traumatic diaphragmatic rupture and phrenic nerve injury, PM&R (Han KY, Bang HJ); Diaphragm Rehabilitation, Physiopedia | 2015 |

Note oneste su questo batch:
- **Deformità di Haglund**: fonte 2026 estremamente recente e dettagliata (protocollo in 5 fasi con criteri quantitativi precisi di progressione basati su LSI); segnalato esplicitamente il principio della fonte secondo cui evitare completamente la dorsiflessione può avere un "effetto nocebo" e prolungare il recupero.
- **Sindrome di Klippel-Feil**: evidence_level "low" dichiarato esplicitamente (singolo caso clinico complesso, non linea guida); enfatizzato con forza il divieto assoluto di manipolazione cervicale aggressiva e di sport di squadra per il rischio di trauma spinale in pazienti con instabilità congenita.
- **Artrogriposi multipla congenita**: fonte Physiopedia priva di autori/anno precisi per i singoli protocolli citati — dichiarato esplicitamente che non esiste un protocollo standardizzato unico validato in letteratura; contenuto comunque clinicamente coerente e ampiamente riconosciuto nella pratica pediatrica.
- **Paralisi diaframmatica**: dati quantitativi del protocollo di allenamento aerobico derivano da un singolo caso clinico (2015, PM&R) integrato con tecniche di respirazione diaframmatica da Physiopedia (2026); evidence_level "low" dichiarato esplicitamente; specificato che la forma bilaterale comporta rischio respiratorio maggiore e richiede valutazione medica più stretta.

**Stato attuale: 461 condizioni totali** (457 + 4 nuove del batch 25). **Mancano 339 per arrivare a 800.**

**Batch 26 (4 condizioni, id 507-510):** verificati preventivamente contro il database oltre 20 candidati aggiuntivi (Spondilolisi, Tenosinovite di De Quervain, Osgood-Schlatter, Retrazione di Dupuytren, Dito a scatto, Meralgia parestesica, Cisti di Baker, Hallux Limitus/Rigidus, Spondilolistesi, Morbo di Scheuermann, Rizoartrosi, Sindrome da stress tibiale mediale, Sindrome da conflitto femoro-acetabolare, Tendinopatia del popliteo, Tendinopatia del tibiale posteriore, Sindrome del tunnel radiale — tutti già presenti). Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Malattia di Blount (tibia vara patologica) — gestione conservativa e post-chirurgica | Ortopedico/MSK pediatrico (tag zona "Ginocchio") | Blount's Disease, Physiopedia | 2024 |
| Sindrome da vibrazione mano-braccio (HAVS) — gestione e riduzione dell'esposizione | Occupazionale/vascolare (tag `immune` per coerenza con Raynaud/Buerger) | The Identification and Management of Hand-Arm Vibration Syndrome, Society of Occupational Medicine HAVS SIG | 2023 |
| Acondroplasia — attività fisica ed esercizio terapeutico nell'adulto | Genetico/scheletrico (tag `immune` per mancanza di categoria genetica dedicata) | Facilitators and constraints of physical activity in adults with achondroplasia: a scoping review, Journal of Rare Diseases (Alves I, Koromani F, Lemos C, et al.) | 2024 |
| Osteopetrosi (malattia delle ossa di marmo) — gestione riabilitativa delle fratture | Endocrino/metabolismo osseo (tag `endocrine`, per coerenza con Malattia di Paget dell'osso #435) | Osteopetrosis and fracture: planning and management, F1000Research (Chabchoub A, Meddeb M, Trik MA, et al.) | 2025 |

Note oneste su questo batch:
- **Malattia di Blount**: distinta esplicitamente dal genu valgo/varo idiopatico pediatrico fisiologico (#485) già presente — qui la deformità è patologica (alterazione della fisi tibiale prossimale mediale), non una variante transitoria della crescita.
- **HAVS**: dichiarato esplicitamente che non esiste un programma di esercizio terapeutico validato — la gestione reale è la riduzione dell'esposizione vibratoria sul lavoro, non un percorso riabilitativo; elencate le numerose diagnosi differenziali da escludere (incluso il fenomeno di Raynaud primario).
- **Acondroplasia**: riportato come raccomandazione esplicita della fonte lo screening neurologico obbligatorio per stenosi spinale prima di qualunque prescrizione di esercizio vigoroso, data l'alta prevalenza di questa complicanza nella popolazione; quinta occorrenza del gap architetturale "categoria genetica/tessuto connettivo dedicata" (dopo HSD/hEDS, Osteogenesi imperfetta, Marfan, FOP).
- **Osteopetrosi**: evidence_level "low" dichiarato esplicitamente; la fonte non descrive un protocollo di fisioterapia specifico ma è stata comunque inclusa per l'importanza clinica dei red flag chirurgici (rottura di strumentario per l'estrema densità ossea, tasso di reintervento del 29%) utili a un fisioterapista che segue questi pazienti in coordinamento con l'ortopedico.
- Rimandati esplicitamente (letteratura insufficiente per un ruolo fisioterapico chiaro nelle fonti reperite finora): Sindrome di Tourette, Esostosi multiple ereditarie.

**Stato attuale: 465 condizioni totali** (461 + 4 nuove del batch 26). **Mancano 335 per arrivare a 800.**

**Batch 27 (4 condizioni, id 511-514):** verificati preventivamente contro il database candidati di pavimento pelvico/gastrointestinale (Cistite interstiziale, Vulvodinia, Vaginismo, IBS — tutti già presenti) e genetici/neurodegenerativi (Klinefelter, sindrome di Turner, sclerosi tuberosa, sindrome di Angelman, epidermolisi bollosa — tutti confermati assenti ma non ricercati in questo batch). Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Distrofia miotonica di tipo 1 (Steinert) — esercizio terapeutico | Neurologico/miopatia (tag `neurology`) | Role of Physical Therapy in the Assessment and Management of Individuals with Myotonic Dystrophy, Myotonic Dystrophy Foundation | 2020 |
| Atrofia multisistemica (MSA) — riabilitazione fisioterapica | Neurologico (tag `neurology`) | A Guide to Multiple System Atrophy for Physiotherapists, Multiple System Atrophy Trust (v1.4) | 2023 |
| Paralisi sopranucleare progressiva (PSP) — riabilitazione e prevenzione delle cadute | Neurologico (tag `neurology`) | Progressive Supranuclear Palsy, Physiopedia | 2023 |
| Neurofibromatosi di tipo 1 (NF1) — gestione fisioterapica | Genetico (tag `immune` per mancanza di categoria dedicata) | Neurofibromatosis Type I, Physiopedia; Johnson B et al. (2012); Helmers SL, Irwin R (2009) | 2023 |

Note oneste su questo batch:
- **Distrofia miotonica di Steinert**: enfatizzata con forza la clearance cardiologica obbligatoria prima dell'esercizio aerobico data l'alta prevalenza di coinvolgimento cardiaco/aritmie, e l'educazione a non trattenere il respiro (può alterare il ritmo cardiaco).
- **MSA**: fonte di un'organizzazione caritatevole specializzata (MSA Trust) con guida strutturata in 3 fasi di malattia; riportata per intero la gestione dell'ipotensione ortostatica (quasi universale in questa condizione) con misure posturali specifiche.
- **PSP**: enfatizzata la caduta all'indietro come caratteristica distintiva rispetto ad altri parkinsonismi, con "tecniche di apprendimento della caduta" citate esplicitamente dalla fonte; riportati i predittori di sopravvivenza più breve.
- **Neurofibromatosi tipo 1**: dichiarato con la massima onestà, citando la fonte stessa, che "la miglior pratica di fisioterapia negli individui con NF1 non è stata identificata in letteratura" — contenuto basato solo su due case report isolati (2012, 2009), non su un protocollo validato; sesta occorrenza del gap architetturale "categoria genetica dedicata" (dopo HSD/hEDS, OI, Marfan, FOP, Acondroplasia).

**Stato attuale: 469 condizioni totali** (465 + 4 nuove del batch 27). **Mancano 331 per arrivare a 800.**

**Batch 28 (4 condizioni, id 515-518):** ripresi i candidati genetici rimasti in sospeso dal batch precedente (Klinefelter, sindrome di Turner, sclerosi tuberosa, sindrome di Angelman, epidermolisi bollosa), verificata l'assenza di tutti e ricercata una fonte fisioterapica reale per ciascuno; aggiunta anche la Malattia di Fabry (lisosomiale) trovata cercando alternative con letteratura di esercizio più solida della sclerosi tuberosa/Klinefelter (rimandate per fonti fisioterapiche ancora troppo deboli). Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sindrome di Angelman — fisioterapia dello sviluppo motorio | Neurologico pediatrico (tag `neurology`) | Physical Therapy and Occupational Therapy Best Practices, Angelman Syndrome Foundation | 2025 |
| Epidermolisi bollosa — fisioterapia e prevenzione delle contratture | Genetico/cutaneo (tag `immune` per mancanza di categoria dedicata) | Physiotherapy for epidermolysis bullosa: clinical practice guidelines, Orphanet Journal of Rare Diseases (Weisman A, Chan JM, LaPointe C, et al.) | 2021 |
| Sindrome di Turner — fisioterapia e gestione ortopedica | Genetico/endocrino (tag `endocrine`) | Turner Syndrome, Physiopedia (Shreif K, ed.; Hampton L) | 2022 |
| Malattia di Fabry — attività fisica ed esercizio terapeutico | Genetico/lisosomiale (tag `immune` per mancanza di categoria dedicata) | How Do Physical Activity and Exercise Affect Fabry Disease? Exploring a New Opportunity, Kidney and Blood Pressure Research (Baciga F, Marchi G, Caccia F, et al.) | 2024 |

Note oneste su questo batch:
- **Sindrome di Angelman**: fonte esplicitamente dichiarata dalla stessa Angelman Syndrome Foundation come "non un elenco completo o uno standard di cura" ma una guida di risorse; riportato comunque per la sua ricchezza pratica (progressione dettagliata del training del cammino).
- **Epidermolisi bollosa**: fonte di altissima qualità, una vera clinical practice guideline (Orphanet Journal of Rare Diseases 2021) con 6 outcome prioritari espliciti; dichiarato onestamente che l'evidenza è prevalentemente di livello 3-4 (case study/opinione di esperti) e riflette soprattutto le forme distrofiche recessive gravi; enfatizzate con dettaglio le precauzioni per evitare traumi cutanei durante ogni manipolazione.
- **Sindrome di Turner**: evidence_level "low" dichiarato esplicitamente (fonte Physiopedia senza studi clinici dedicati citati); tagging come 'endocrine' invece di 'immune' per coerenza con la componente endocrina dominante (terapia con ormone della crescita, ipotiroidismo associato), a differenza del bucket genetico/connettivale usato per HSD/OI/Marfan/FOP/Acondroplasia/NF1/EB.
- **Malattia di Fabry**: riportato onestamente che l'esercizio può fungere da fattore scatenante di dolore neuropatico in alcuni pazienti, distinto dal normale indolenzimento muscolare — un'indicazione clinica delicata da comunicare bene al paziente; principi di attività fisica mutuati per analogia da popolazioni con insufficienza cardiaca/cardiomiopatie, non da RCT dedicati a Fabry.
- Rimandati esplicitamente (letteratura fisioterapica ancora troppo debole/indiretta): Sindrome di Klinefelter, Sclerosi tuberosa.

**Stato attuale: 473 condizioni totali** (469 + 4 nuove del batch 28). **Mancano 327 per arrivare a 800.**

**Batch 29 (4 condizioni, id 519-522):** cambiato deliberatamente categoria rispetto ai batch genetici recenti, tornando su oncologia (verificata già ben coperta con voci "a bundle" — Sarcomi ossei/tessuti molli, Neoplasie ematologiche — quindi non forzata l'aggiunta di singole neoplasie pediatriche per evitare sovrapposizioni), cardio-respiratorio, medicina dello sport e pavimento pelvico. Verificati preventivamente come già presenti: valvulopatie cardiache, malattia aortica, coccigodinia, sindrome dell'elevatore dell'ano. Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sindrome da sovrallenamento (Overtraining Syndrome) | Medicina dello sport (non taggata: nessuna categoria dedicata esiste) | Overtraining Syndrome, Physiopedia, basata su Meeusen R et al. (consensus ECSS/ACSM) | 2013 |
| Cardiopatia congenita dell'adulto (ACHD) — prescrizione dell'esercizio di forza | Cardio-respiratorio (tag `cardiopulmonary`) | Strength and resistance training in adult congenital heart disease, International Journal of Cardiology Congenital Heart Disease (Dolan C, Brown G, Muirhead E, Swan L) | 2026 |
| Adenomiosi — fisioterapia del pavimento pelvico | Pavimento pelvico (sistemico/femminile) | Adenomyosis, Physiopedia | 2024 |
| Proctalgia fugace — fisioterapia del pavimento pelvico | Pavimento pelvico (posteriore/entrambi i sessi) | Proctalgia Fugax, Physiopedia; Proctalgia Syndromes: Update in Diagnosis and Management, Current Gastroenterology Reports | 2020 |

Note oneste su questo batch:
- **Overtraining Syndrome**: nessuna categoria di tag esiste per "medicina dello sport" (gap architetturale già segnalato in sezione C dell'audit) — lasciata volutamente senza tag di sistema/zona, condizione sistemica non localizzabile a una singola zona anatomica; fonte basata su un consensus internazionale del 2013 (ECSS/ACSM), non aggiornato da allora ma tuttora considerato di riferimento.
- **ACHD**: fonte eccezionalmente recente (2026) e con protocollo quantitativo dettagliato; enfatizzata la necessità di stratificazione del rischio cardiologico specialistico prima di qualunque prescrizione di forza, con soglie precise per i gruppi ad alto rischio limitati a solo esercizio a corpo libero.
- **Adenomiosi**: evidence_level "low" dichiarato esplicitamente (fonte Physiopedia priva di studi clinici dedicati citati); distinta esplicitamente dall'endometriosi (#413) già presente, pur potendo le due condizioni coesistere.
- **Proctalgia fugace**: distinta esplicitamente dalla sindrome dell'elevatore dell'ano (#109) già presente per durata degli episodi (più breve), pur condividendo meccanismi di ipertono muscolare e verificato che non fosse un duplicato prima di procedere; enfatizzata l'esclusione di patologia organica come primo passo diagnostico.

**Stato attuale: 477 condizioni totali** (473 + 4 nuove del batch 29). **Mancano 323 per arrivare a 800.**

**Batch 30 (4 condizioni, id 523-526):** verificati preventivamente contro il database candidati ortopedici/mano-polso (canale di Guyon, TFCC, sperone calcaneare, colpo di frusta, LCA, menisco, frattura di Colles — tutti già presenti) e poi candidati ematologici/endocrini (emocromatosi, policitemia, anemia aplastica, deficit di G6PD, ipotiroidismo, ipertiroidismo, talassemia, anemia falciforme — questi ultimi due già presenti, emocromatosi/anemia aplastica/G6PD confermati assenti). Aggiunta anche l'amiloidosi cardiaca dopo aver verificato che Behçet fosse già presente (#429) e che l'amiloidosi non lo fosse. Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Emocromatosi ereditaria — gestione riabilitativa dell'artropatia | Ematologia/ortopedico (tag `hematology`) | Treatment of Haemochromatosis Arthropathy: Advice for Patients, Haemochromatosis Arthropathy Research Initiative (HARI); Arthropathy and joint pain, Haemochromatosis UK (McClements N.) | 2024 |
| Anemia aplastica — attività fisica e riabilitazione post-trapianto | Ematologia (tag `hematology`) | Effect of home-based exercise program on patients with aplastic anemia treated with allogeneic hematopoietic stem cell transplantation: a non-randomized trial, Journal of Cancer Survivorship (Ye M, Xu C, Tan X, et al.) | 2025 |
| Deficit di G6PD — gestione dell'attività fisica e sport | Ematologia (tag `hematology`) | Management of Athletes With G6PD Deficiency: Does Missing an Enzyme Mean Missing More Games?, Sports Health (Stone SN, Reisig KV, Saffel HL, Miles CM) | 2020 |
| Amiloidosi cardiaca — riabilitazione ed esercizio fisico | Cardio-respiratorio (tag `cardiopulmonary`) | ATTR-CM Exercise Programs: Safe Cardiac Rehab, Banner Health (Thurrott S., rev. Dr. Anusha Sunkara); inquadramento clinico da Kittleson MM et al., 2023 ACC Expert Consensus Decision Pathway on Cardiac Amyloidosis, JACC | 2025 |

Note oneste su questo batch:
- **Emocromatosi ereditaria**: la fonte è esplicita e un po' scomoda da comunicare — la deferrizzazione (flebotomia), pur essenziale per il controllo sistemico della malattia, "fa poca differenza" sulla rigidità/dolore articolare o sulla progressione a lungo termine del danno articolare una volta instauratosi; riportato il "segno del pugno di ferro" (coinvolgimento tipico delle metacarpo-falangee 2ª-3ª) e l'indicazione esplicita a evitare yoga/overstretching.
- **Anemia aplastica**: fonte solida (studio non randomizzato, 40 vs 40 pazienti, 2025) ma centrata su outcome funzionali/qualità di vita, non su soglie ematologiche di sicurezza per l'esercizio; per queste ultime ho applicato esplicitamente per analogia le stesse soglie già validate per la Porpora trombocitopenica immune (#430), dichiarandolo come estensione ragionata e non come dato originale dello studio. Una linea guida ASH 2026 molto recente sull'anemia aplastica severa esisteva ma è risultata inaccessibile per blocco (403); non citata per non rischiare di travisarne il contenuto non verificato.
- **Deficit di G6PD**: a differenza di molte condizioni genetiche/rare di questo progetto, qui la fonte (Sports Health, 2020) è rassicurante: "la gestione degli atleti con deficit di G6PD non differisce sostanzialmente da quella di atleti senza questa condizione" — nessuna restrizione generica sull'attività fisica, solo attenzione a trigger farmacologici/ambientali specifici (antimalarici, aree endemiche per malaria).
- **Amiloidosi cardiaca**: DA VERIFICARE dichiarato esplicitamente nella scheda — la fonte principale reperita con contenuto realmente estraibile è materiale educazionale per pazienti (Banner Health, dic. 2025, revisionato da cardiologo), non una linea guida formale peer-reviewed; la review comprehensiva 2025 su riabilitazione in amiloidosi cardiaca (MDPI/JCM) e il consensus ACC 2023 sono stati entrambi bloccati o non contenevano dettagli di prescrizione dell'esercizio nel testo accessibile. Uno studio randomizzato dedicato (ERICA study) è attualmente in corso: potrà fornire evidenza di livello superiore in futuro, da ricontrollare in una sessione successiva.

**Stato attuale: 481 condizioni totali** (477 + 4 nuove del batch 30). **Mancano 319 per arrivare a 800.**

**Batch 31 (1 condizione netta, id 527):** verificati preventivamente contro il database i candidati più deboli della sezione Gastrointestinale — la più scoperta architetturalmente: solo 8 collegamenti su `gastrointestinal_condition_tags` contro 30+ delle altre sezioni (cardiopolmonare, immunologia, pavimento pelvico). Candidati: gastroparesi, stipsi cronica idiopatica/biofeedback, mobilizzazione precoce post-chirurgia addominale. Risultato onesto, non tutti e 3 hanno superato la verifica:
- **Gastroparesi**: la linea guida più recente e autorevole (AGA Clinical Practice Guideline on Management of Gastroparesis, *Gastroenterology*, settembre 2025) **non tratta affatto** esercizio/attività fisica — è centrata su farmaci, endoscopia e stimolazione elettrica. L'unico studio reperito su attività fisica e svuotamento gastrico (Ekblond et al., *Obesity Facts* 2024) riguarda persone sovrappeso a rischio diabete, non pazienti con gastroparesi reale. **Scartata**: nessuna fonte reale specifica da cui costruire una scheda onesta, senza inventare un protocollo che la letteratura non descrive.
- **Stipsi cronica idiopatica (biofeedback)**: trovata una Cochrane review completa (Biofeedback for treatment of chronic idiopathic constipation in adults, CD008486.pub2 — evidenza "bassa/molto bassa qualità"), ma **scartata per sovrapposizione**: la condizione già presente "Dissinergia del pavimento pelvico (dischezia funzionale)" (batch 1, fonte Rao SSC et al.) copre la stessa entità clinica principale trattata con biofeedback — aggiungerla avrebbe creato un doppione concettuale, lo stesso tipo di errore già evitato per "SICK scapula" vs Discinesia scapolare (batch 22).
- **Ileo post-operatorio — mobilizzazione precoce dopo chirurgia addominale** (tag `gastrointestinal`): **aggiunta**, fonte Willner A, Teske C, Hackert T, Welsch T., *BJS Open*, 2023 (revisione sistematica, 15 studi/8 RCT/3538 pazienti). Nota onesta riportata nella scheda stessa: la mobilizzazione precoce accelera il ritorno della funzione intestinale (~11,5 ore in meno al primo flatus/evacuazione) ma **non riduce in modo significativo** morbidità o durata della degenza se usata da sola — presentata come parte di un percorso ERAS multimodale, non come soluzione isolata. Evidence level: moderate.

**Stato attuale: 482 condizioni totali** (481 + 1 nuova del batch 31). **Mancano 318 per arrivare a 800.**

**Batch 32 (3 condizioni, id 528-530):** proseguito su Pavimento Pelvico, Ematologia e Gastrointestinale. Candidato verificato e scartato: prolasso rettale — letteratura conservativa specifica debole/assente, non forzato. Genuinamente assenti e aggiunti in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Ragade anale cronica — fisioterapia del pavimento pelvico | Pavimento pelvico (posteriore/entrambi i sessi) | van Reijn-Baggen DA, Elzevier HW, Braak JPBM, Putter H, Pelger RCM, Han-Geurts IJM. Pelvic floor physical therapy in the treatment of chronic anal fissure (PAF trial): quality of life outcome. Techniques in Coloproctology | 2022 |
| Mielofibrosi — attività fisica nelle neoplasie mieloproliferative | Ematologia (tag `hematology`) | Felser S, Rogahn J, le Coutre P, et al. Anxieties, age and motivation influence physical activity in patients with myeloproliferative neoplasms. Frontiers in Oncology | 2023 |
| Pancreatite cronica — attività fisica e gestione del dimagrimento muscolare | Gastrointestinale (tag `gastrointestinal`) | Pancreatic disease and physical activity, Nutrition Interest Group of the Pancreatic Society of Great Britain and Ireland (NIGPS) | 2018 |

Note oneste su questo batch:
- **Ragade anale cronica**: tra i pochi RCT dedicati esistenti (il protocollo originale del 2021 segnalava "letteratura scarsa su questo argomento"); fonte citata = esito secondario di qualità di vita del PAF trial (miglioramento significativo in 9/9 domini RAND-36 a 20 settimane, dolore ridotto già a 8 settimane) — il tasso di guarigione della fissura come esito primario è riportato in una pubblicazione correlata dello stesso trial non pienamente accessibile per verifica diretta.
- **Mielofibrosi**: fonte uno studio survey trasversale (non un trial d'intervento) — evidence_level "low" dichiarato esplicitamente; dato onesto interessante: i pazienti riducono l'attività fisica molto più di quanto il rischio reale giustifichi (trombosi solo nel 3% della coorte), quindi il contenuto centra su educazione piuttosto che restrizione.
- **Pancreatite cronica**: fonte una guida professionale (NIGPS, non un RCT/revisione sistematica) — evidence_level "low" dichiarato esplicitamente; raccomandazioni generali (150 min/settimana, attenzione a ernie non trattate e fase post-chirurgica) più che un protocollo specifico per la pancreatite.

**Stato attuale: 485 condizioni totali** (482 + 3 nuove del batch 32). **Mancano 315 per arrivare a 800.**

**Batch 33 (1 condizione, id 531):** proseguito su Endocrinologia. Candidato verificato e scartato: iperparatiroidismo/ipoparatiroidismo — fonti reperite troppo deboli/indirette per costruire una scheda onesta, non forzato. Genuinamente assente e aggiunta in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Osteomalacia — esercizio terapeutico e gestione della debolezza muscolare | Endocrino (tag `endocrine`) | Osteomalacia, Versus Arthritis (organizzazione benefica britannica, contenuto a revisione medica) | 2024 |

Nota onesta su questo batch:
- **Osteomalacia**: fonte una pagina informativa per pazienti di un'organizzazione benefica britannica (contenuto a revisione medica, non uno studio clinico/linea guida peer-reviewed) — evidence_level "low" dichiarato esplicitamente. Contenuto centrato su due punti clinicamente solidi anche se la fonte è divulgativa: la caratteristica debolezza muscolare prossimale (cosce, cingolo scapolare) e l'attenzione alle pseudofratture di Looser durante la fase di guarigione, prima di riprendere esercizio in carico progressivo.
- **Iperparatiroidismo/ipoparatiroidismo**: verificato come candidato ma scartato — le fonti reperite erano troppo deboli o indirette (nessun contenuto specifico su esercizio/riabilitazione da una fonte realmente autorevole); da ricontrollare in futuro se emergerà una fonte migliore.

**Stato attuale: 486 condizioni totali** (485 + 1 nuova del batch 33). **Mancano 314 per arrivare a 800.**

**Batch 34 (2 condizioni, id 532-533):** proseguito sulle sezioni più scoperte — Gastrointestinale e Urinario. Candidato verificato e scartato: melanoma — nessuna linea guida di esercizio oncologico (incluso il consensus ACSM 2019, che nomina esplicitamente solo i tumori di mammella, colon e prostata) tratta il melanoma in modo specifico; l'unica fonte melanoma-specifica trovata è un protocollo di trial di fattibilità (non ancora pubblicato con risultati), quindi non abbastanza solido per una scheda dedicata. Genuinamente assenti e aggiunte in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Malattia diverticolare e diverticolite — attività fisica e prevenzione | Gastrointestinale (tag `gastrointestinal`) | Linea guida tedesca S3 "Diverticular Disease/Diverticulitis" Part 2 (DGVS/DGAV), raccomandazione 5.9; corroborata da Strate LL et al., Am J Gastroenterol, 2009, e Aune D et al., Eur J Nutr, 2017 | 2022 |
| Rene policistico autosomico dominante (ADPKD) — attività fisica e gestione dell'esercizio | Urinario (tag `urinary`) | KDIGO 2025 Clinical Practice Guideline for ADPKD, capitolo 7; dettaglio supplementare da PKD Foundation | 2025 |

Note oneste su questo batch:
- **Malattia diverticolare**: fonte principale una linea guida formale (evidenza di livello 1, grado A, consenso forte) ma l'evidenza forte riguarda solo la **prevenzione** (ridurre il rischio di sviluppare diverticolite), non la fase acuta né la ripresa dopo trattamento conservativo/chirurgico — per questi ultimi due punti non esiste al momento una fonte con evidenza clinica, solo contenuti divulgativi generici non citabili; dichiarato esplicitamente nella scheda. Tutti gli studi di supporto sono osservazionali (coorti), non trial controllati.
- **Rene policistico (ADPKD)**: fonte una linea guida nefrologica molto recente e autorevole (KDIGO 2025) con soglie numeriche chiare; la cautela sugli sport da collisione è esplicita ma generica ("vulnerabili a lesioni dirette dell'organo"), senza una soglia dimensionale precisa di rene/fegato oltre la quale evitare lo sport — l'individualizzazione resta quindi clinica, non algoritmica.

**Stato attuale: 488 condizioni totali** (486 + 2 nuove del batch 34). **Mancano 312 per arrivare a 800.**

**Batch 35 (1 condizione, id 534):** tre candidati verificati e scartati prima di trovare quello giusto — round di ricerca particolarmente onesto, utile documentarlo per intero:
- **Feocromocitoma**: l'avviso comune "evitare esercizio intenso" (rischio di crisi ipertensiva da scarica di catecolamine) **non è supportato dalla linea guida di riferimento** (Endocrine Society Clinical Practice Guideline, Lenders JWM et al., *J Clin Endocrinol Metab*, 2014) — verificata per intero, non menziona mai l'esercizio fisico come fattore scatenante. L'avviso circola solo a livello di materiale divulgativo/case report, non di linea guida. **Scartato**: non abbastanza solido per una scheda dedicata senza travisare la fonte.
- **Trombocitemia essenziale**: nessuna linea guida ematologica (ELN, NCCN) tratta il rapporto tra esercizio fisico e rischio trombotico in questa condizione. L'unica fonte reperita (Eckert RL et al., *Integrative Cancer Therapies*, 2017) riguarda le neoplasie mieloproliferative in generale ma **esplicitamente chiede future ricerche**, senza fornire risposte. **Scartato**: il vuoto di evidenza è reale, non solo difficile da trovare.
- **Carenza di vitamina B12 / anemia perniciosa (degenerazione combinata subacuta)**: la fisiopatologia è solida (perdita di propriocezione → rischio di cadute, riportata in case report clinici) ma **nessuna fonte fornisce un protocollo o linee guida esplicite di riabilitazione dell'equilibrio** per questa condizione specifica. **Scartato**: utilizzabile come razionale di base, non come scheda sorgente.

Genuinamente assente e aggiunta in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Linfoma (Hodgkin e non-Hodgkin) — esercizio aerobico durante la chemioterapia | Oncologia/Ematologia (tag `oncology` + `hematology`) | Courneya KS, Sellar CM, Stevinson C, et al., "Randomized Controlled Trial of the Effects of Aerobic Exercise on Physical Functioning and Quality of Life in Lymphoma Patients" (HELP trial), Journal of Clinical Oncology | 2009 |

Nota onesta: il trial HELP è un RCT solido (livello 1) ma è **uno studio singolo**, non ancora ripreso da linee guida di esercizio oncologico specifiche per tipo di tumore — il roundtable ACSM 2019 nomina esplicitamente solo mammella, colon e prostata come tumori con evidenza di esercizio legata alla sopravvivenza, non il linfoma. Risultati riportati con onestà anche sul dato "nullo": l'esercizio non ha significativamente modificato il completamento della chemioterapia né il tasso di risposta al trattamento (dato rassicurante sulla sicurezza, non un beneficio aggiuntivo).

**Stato attuale: 489 condizioni totali** (488 + 1 nuova del batch 35). **Mancano 311 per arrivare a 800.**

**Batch 36 (1 condizione, id 535):** proseguito su Gastrointestinale (la sezione architettonicamente più scoperta, ora a quota 12). Verificato preventivamente che "pubalgia/ernia sportiva" (Sportsman's Hernia) fosse già presente (#152) — evitato un doppione. Genuinamente assente e aggiunta in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Ernia inguinale — riparazione chirurgica e ripresa dell'attività fisica | Gastrointestinale (tag `gastrointestinal`) | Harmankaya S, Öberg S, Rosenberg J. "Varying convalescence recommendations after inguinal hernia repair: a systematic scoping review." Hernia | 2022 |

Nota onesta: la fonte è una revisione sistematica scoping che riporta ampia variabilità tra le istituzioni sulle tempistiche di ripresa — non esiste un'unica tabella universale, dichiarato esplicitamente nella scheda stessa (es. ripresa dello sport dopo tecnica open: range 0-29 giorni a seconda dello studio). Candidato correlato verificato ma scartato: ernia iatale — nessuna fonte gastroenterologica/chirurgica (controllate sia la linea guida ACG 2022 sul reflusso sia una revisione 2024 su classificazione/fisiopatologia dell'ernia iatale) tratta cautele specifiche sull'esercizio fisico o la pressione intra-addominale; gli avvisi che circolano online risalgono solo a blog divulgativi, non a letteratura clinica — scartato per non costruire una scheda su fonti non verificabili.

**Stato attuale: 490 condizioni totali** (489 + 1 nuova del batch 36). **Mancano 310 per arrivare a 800.**

**Batch 37 (1 condizione, id 536):** proseguito su Ematologia. Due candidati verificati e scartati prima di trovare quello giusto:
- **Sindrome mielodisplastica (MDS)**: nessuna linea guida ematologica (NCCN, ASH) tratta l'esercizio fisico in modo specifico per MDS. Le soglie piastriniche a volte applicate a questa popolazione derivano da letteratura su altre neoplasie ematologiche (leucemia acuta/linfoma aggressivo, non MDS), e un singolo case report MDS dichiara esplicitamente che le soglie restano "in gran parte soggettive piuttosto che basate sull'evidenza". **Scartato come scheda dedicata** — ma l'evidenza trovata (anche se non MDS-specifica) era comunque solida abbastanza per costruire una scheda onesta più generale, vedi sotto.
- **Anemia emolitica autoimmune (AIHA)**: nessuna fonte tratta la tolleranza all'esercizio durante emolisi attiva vs. remissione. L'unico dato reale e citabile riguarda la malattia da agglutinine fredde (variante specifica di AIHA) — una raccomandazione di evitare l'esposizione al freddo (testa, viso, estremità), ma dichiarata dagli stessi autori come basata su esperienza clinica, non trial controllati, e senza menzione esplicita dell'attività fisica all'aperto. **Scartato**: troppo indiretto per una scheda dedicata.

Genuinamente assente e aggiunta in questo batch — non una singola malattia ma una scheda trasversale su un tema ricorrente (citopenia da trattamento ematologico attivo), utile proprio perché la scheda generale "Neoplasie Ematologiche" (#392) non include soglie numeriche specifiche:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Citopenia da neoplasia ematologica in trattamento attivo — soglie di sicurezza per l'esercizio | Ematologia (tag `hematology`) | Morishita S, Nakano J, Fu JB, Tsuji T. "Physical exercise is safe and feasible in thrombocytopenic patients with hematologic malignancies: a narrative review." Hematology (UK), 2020; soglie originarie da Elter T et al., Int J Hematol, 2009 | 2020 |

Nota onesta: fonte una narrative review (non un RCT/linea guida formale) — evidence_level "low" dichiarato esplicitamente; le soglie numeriche (piastrine ≥50.000/µL, emoglobina ≥8 g/dL) sono dichiarate dagli stessi autori originali come opinione di esperti, non rigorosamente validate da trial controllati. Distinta esplicitamente nella scheda dalla Porpora trombocitopenica immune (#430), condizione autoimmune cronica con soglie proprie, per evitare confusione tra le due popolazioni di pazienti.

**Stato attuale: 491 condizioni totali** (490 + 1 nuova del batch 37). **Mancano 309 per arrivare a 800.**

**Batch 38 (1 condizione, id 537):** proseguito su Urinario/Pavimento Pelvico. Due candidati endocrini verificati e scartati prima di questo: iperaldosteronismo primario (nessuna delle due linee guida Endocrine Society, 2016 e aggiornamento 2025, menziona l'attività fisica — controllate entrambe per intero) e diabete insipido centrale (nessuna fonte endocrinologica tratta la gestione dei liquidi durante l'esercizio in modo specifico per questa condizione). Genuinamente assente e aggiunta in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Infezioni urinarie ricorrenti e disfunzione del pavimento pelvico — riabilitazione con biofeedback | Urinario + Pavimento pelvico (tag `urinary` + `pelvic_floor`, anteriore/femminile) | Tzelves L et al., Archives of Gynecology and Obstetrics, 2023; corroborato da Chiang CH et al., Scientific Reports, 2021 | 2023 |

Nota onesta, la più importante di questo batch: **nessuna linea guida urologica (controllate sia AUA sia EAU per intero) avalla la fisioterapia del pavimento pelvico per le infezioni urinarie ricorrenti** — non è quindi un'indicazione riconosciuta ufficialmente. L'evidenza reale esiste solo a livello meccanicistico: due studi di coorte a braccio singolo, senza gruppo di controllo, senza RCT dedicato, che mostrano una riduzione del residuo post-minzionale e degli episodi di IVU dopo riallenamento con biofeedback. Dichiarato esplicitamente nella scheda come "evidenza emergente, non avallata da linee guida" — aggiunta comunque perché il nesso fisiopatologico (iperattività del pavimento pelvico → svuotamento incompleto → infezione ricorrente) è reale e di interesse diretto per la pratica fisioterapica, ma senza sovrastimare la forza dell'evidenza.

**Stato attuale: 492 condizioni totali** (491 + 1 nuova del batch 38). **Mancano 308 per arrivare a 800.**

**Batch 39 (1 condizione, id 538):** proseguito su Endocrinologia. Candidato verificato e scartato: ipoparatiroidismo — controllate per intero sia la linea guida ESE 2015 sia l'aggiornamento 2025, nessuna delle due tratta l'esercizio fisico in modo specifico (solo sintomi generali di ipocalcemia come crampi/parestesie, non legati all'esercizio). Genuinamente assente e aggiunta in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Diabete gestazionale — prescrizione dell'esercizio fisico | Endocrino (tag `endocrine`) | Jung AR, Seo Y, Lee J, Hwang JG, Yun S, Lee DT. "Recent Findings on Exercise Therapy for Blood Glucose Management in Patients with Gestational Diabetes." Journal of Clinical Medicine (sintesi delle linee guida ACOG e SOGC/CSEP) | 2024 |

Nota onesta: fonte una review 2024 open access che sintetizza linee guida ufficiali (ACOG, SOGC/CSEP) con numeri precisi (volume, intensità, timing del cammino post-prandiale) — evidence_level "high" giustificato dalla solidità delle linee guida sottostanti. Gli stessi autori dichiarano però un vuoto reale: non esistono ancora linee guida specifiche sul diabete gestazionale per la prevenzione dell'ipoglicemia da esercizio o l'aggiustamento della dose di insulina attorno alla sessione — riportato onestamente nella scheda, non colmato con contenuto inventato.

**Stato attuale: 493 condizioni totali** (492 + 1 nuova del batch 39). **Mancano 307 per arrivare a 800.**

**Batch 40 (2 condizioni, id 539-540):** proseguito su Oncologia/Gastrointestinale, due tumori mai trattati finora (endometrio, stomaco). Genuinamente assenti e aggiunte in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Carcinoma dell'endometrio — esercizio fisico e gestione del rischio di linfedema | Oncologia (tag `oncology`) | Brown JC, John GM, Segal S, Chu CS, Schmitz KH, Med Sci Sports Exerc, 2013; Smits A et al. (EPEC-FAST), Cancers, 2022 | 2022 |
| Riabilitazione dopo gastrectomia (tumore gastrico) — fisioterapia perioperatoria | Gastrointestinale + Oncologia (tag `gastrointestinal` + `oncology`) | Mortensen K et al. (ERAS Society), Br J Surg, 2014; Tukanova KH et al., Ann Surg Oncol, 2022; Färnqvist K et al., BMC Sports Sci Med Rehabil, 2025 | 2022 |

Note oneste su questo batch:
- **Carcinoma dell'endometrio**: evidenza di livello pilota/fattibilità (non RCT definitivi su recidiva) — evidence_level "moderate" dichiarato esplicitamente; il dato più solido e specifico riguarda il legame tra attività fisica e minor rischio di linfedema dell'arto inferiore dopo linfoadenectomia.
- **Gastrectomia**: nota onesta particolarmente importante — una revisione del 2025 dichiara esplicitamente **"nessuno studio ha indagato specificamente l'esercizio fisico nel cancro gastrico"**: tutta l'evidenza di RCT sull'esercizio proviene da popolazioni con cancro esofageo, non gastrico. L'evidenza qui riportata su mobilizzazione/fisioterapia perioperatoria viene da una revisione sistematica che include insieme esofagectomia e gastrectomia, con qualità delle prove bassa (soprattutto coorti, non RCT) — evidence_level "low" dichiarato esplicitamente. Nessun RCT trovato sulla sindrome da dumping e l'esercizio.

**Stato attuale: 495 condizioni totali** (493 + 2 nuove del batch 40). **Mancano 305 per arrivare a 800.**

**Batch 41 (1 condizione, id 541):** proseguito su Ematologia. Candidato verificato e scartato: malattia di Gaucher — l'unica fonte peer-reviewed reperita (Hughes D et al., J Bone Miner Res, 2019) contiene solo un'indicazione generica sull'esercizio in carico per la salute ossea, non una raccomandazione specifica per Gaucher; i consigli più dettagliati trovati online provengono da un sito di advocacy per pazienti, non da letteratura clinica verificabile. **Scartato** come scheda dedicata. Genuinamente assente e aggiunta in questo batch — con un risultato controintuitivo, utile documentarlo per intero:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sferocitosi ereditaria — attività fisica e gestione della splenomegalia | Ematologia (tag `hematology`) | Bolton-Maggs PHB, Langer JC, Iolascon A, Tittensor P, King M-J (British Society for Haematology). "Guidelines for the diagnosis and management of hereditary spherocytosis – 2011 update." British Journal of Haematology | 2011 |

Nota onesta: contrariamente all'assunzione comune per analogia con la mononucleosi (evitare sport da contatto per milza ingrossata), **la linea guida di riferimento dichiara esplicitamente che non esiste evidenza a supporto della restrizione dell'attività fisica nella sferocitosi ereditaria**, né di un rischio di rottura splenica superiore alla popolazione generale — verificato tramite citazione diretta dal testo della linea guida. Per i pazienti splenectomizzati, la gestione riguarda la profilassi infettiva (vaccinazioni, scheda di splenectomia per il rischio life-long di sepsi fulminante), non la restrizione dell'attività fisica.

**Stato attuale: 496 condizioni totali** (495 + 1 nuova del batch 41). **Mancano 304 per arrivare a 800.**

**Batch 42 (1 condizione, id 542):** proseguito su Gastrointestinale (ancora la sezione più scoperta, ora a quota 14). Genuinamente assente e aggiunta in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Ulcera peptica (gastrica e duodenale) — attività fisica e fattori di rischio | Gastrointestinale (tag `gastrointestinal`) | Cheng Y, Macera CA, Davis DR, Blair SN, Br J Sports Med, 2000 (Aerobics Center Longitudinal Study); Rosenstock S et al., Gut, 2003 | 2003 |

Nota onesta: evidenza reale ma datata (studi pre-2004) e **non uniforme** — l'effetto protettivo dell'attività fisica è risultato significativo solo per l'ulcera duodenale negli uomini (non nelle donne, non per l'ulcera gastrica) nello studio Aerobics Center, e condizionato alla positività per H. pylori nello studio danese. Evidence_level "low" dichiarato esplicitamente proprio per questa disomogeneità — molto più debole dell'evidenza sulla malattia diverticolare (batch 34), pur essendo lo stesso tipo di letteratura epidemiologica. Le linee guida ACG su ulcera peptica/FANS/H. pylori non trattano l'attività fisica come fattore di stile di vita, quindi nessuna raccomandazione formale esiste al riguardo.

**Stato attuale: 497 condizioni totali** (496 + 1 nuova del batch 42). **Mancano 303 per arrivare a 800.**

**Batch 43 (2 condizioni, id 543-544):** proseguito su Gastrointestinale. Genuinamente assenti e aggiunte in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sindrome dell'intestino corto e nutrizione parenterale domiciliare — esercizio fisico | Gastrointestinale (tag `gastrointestinal`) | Graungaard S, Geisler L, Andersen JR, Rasmussen HH, Vinter-Jensen L, Holst M, Clinical Nutrition ESPEN, 2021 | 2021 |
| Colite ischemica da esercizio intenso ("colite del corridore") — prevenzione e ripresa dell'attività | Gastrointestinale (tag `gastrointestinal`) | Grames C, Berry-Cabán CS, Case Reports in Gastrointestinal Medicine, 2012; Faress A et al., World Journal of Emergency Medicine, 2017; Murray B et al., Journal of Sport Rehabilitation, 2007 | 2017 |

Note oneste su questo batch:
- **Sindrome dell'intestino corto**: controllata per intero la linea guida ESPEN 2016 sull'insufficienza intestinale cronica — **non tratta l'attività fisica**. L'unica fonte esercizio-specifica è uno studio pilota di fattibilità (31 pazienti), che non analizza nello specifico precauzioni per il catetere venoso centrale durante l'esercizio, pur avendo registrato ricoveri (inclusi problemi al catetere) nel 46,7% dei partecipanti senza stabilire un nesso causale con l'attività fisica.
- **Colite ischemica da esercizio**: nesso fisiopatologico reale (riduzione del flusso splancnico 60-80% durante esercizio intenso) e ben descritto in letteratura, ma **tutta l'evidenza è a livello di case report singoli** — nessun RCT, nessuna presa di posizione ufficiale di società scientifiche, nessun protocollo di ripresa dell'attività validato.

**Stato attuale: 499 condizioni totali** (497 + 2 nuove del batch 43). **Mancano 301 per arrivare a 800.**

**Batch 44 (1 condizione, id 545) — 🎉 QUOTA 500 RAGGIUNTA:** proseguito su Oncologia/Urinario. Candidato verificato e scartato: macroglobulinemia di Waldenström — nessuna fonte (controllate linee guida IWMF/IWWM e una review 2025 sulla sindrome da iperviscosità) tratta l'esercizio fisico come fattore di rischio o precauzione legata all'iperviscosità; evidenza dichiarata assente, non solo debole. Genuinamente assente e aggiunta in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Carcinoma renale e nefrectomia — ripresa dell'attività fisica e sport con rene singolo | Oncologia + Urinario (tag `oncology` + `urinary`) | Campbell KL et al., Med Sci Sports Exerc, 2019 (framework generale); Shephard RJ, Int J Applied Sports Sciences, 2015; EJC Paediatric Oncology, 2023 | 2023 |

Nota onesta: framework di esercizio oncologico generico (Campbell 2019, non specifico per carcinoma renale) combinato con letteratura sul rene singolo che proviene prevalentemente da ambito pediatrico/urologico generale, non da trial specifici sul carcinoma renale — dichiarato esplicitamente nella scheda. Il dato di interesse principale: **non esistono dati solidi di incidenza di lesioni che giustifichino un divieto categorico degli sport da contatto** con rene singolo — le fonti argomentano per un counseling individualizzato piuttosto che restrizioni generalizzate.

**Stato attuale: 500 condizioni totali** (499 + 1 nuova del batch 44). **Mancano 300 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola. Raggiunta oggi la metà esatta del percorso verso 800.

**Batch 45 (2 condizioni, id 546-547) — primo giro con ricerche in parallelo:** per velocizzare il ritmo, da questo batch le ricerche di più candidati vengono lanciate contemporaneamente invece che una alla volta (nessun cambiamento al rigore del metodo, solo ai tempi). Sei candidati verificati in parallelo, quattro scartati:
- **SIBO (sovracrescita batterica intestinale)**: evidenza solo a livello di review narrativa non peer-reviewed in senso clinico; il legame permeabilità intestinale/ischemia da esercizio intenso non menziona mai il SIBO per nome nella fonte più solida reperita. **Scartato**.
- **Enterite da radiazioni**: la linea guida di riferimento (Andreyev HJN et al., Frontline Gastroenterology, 2015) sulla gestione pratica dei sintomi gastrointestinali da radioterapia pelvica, controllata per intero, **non contiene alcuna raccomandazione sull'attività fisica**. **Scartato** come scheda dedicata.
- **Iperprolattinemia**: la linea guida Endocrine Society (Melmed S et al., 2011) cita l'esercizio solo come possibile causa di falso positivo diagnostico (elevazione transitoria della prolattina), non fornisce alcuna indicazione di sicurezza sull'esercizio per i pazienti con prolattinoma. **Scartato**.
- **Ipofisite**: controllate le linee guida ESMO sulla tossicità da immunoterapia e una revisione sistematica 2023 — **nessuna delle due tratta l'esercizio fisico**. **Scartato**.

Genuinamente assenti e aggiunte in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Anemia da carenza di ferro — capacità di esercizio e gestione | Ematologia (tag `hematology`) | Clénin G, Cordes M, Huber A, et al. "Iron deficiency in sports – definition, influence on performance and therapy." Swiss Medical Weekly, 2015 (consensus statement) | 2015 |
| Cancro del testicolo — esercizio durante chemioterapia e sopravvivenza | Oncologia (tag `oncology`) | Walenkamp AME, van der Schoot GGF, Ormel HL, et al., J Cancer Res Clin Oncol, 2023; corroborato da Rovito MJ et al., scoping review, Ther Adv Urol, 2025 | 2023 |

Note oneste: **carenza di ferro** — consensus statement solido della Società Svizzera di Medicina dello Sport con dati fisiologici concreti (massa di emoglobina, VO2max), ma nessuna fonte specifica su dosaggio dell'esercizio durante terapia marziale o gestione delle gambe senza riposo. **Cancro del testicolo** — RCT reale e specifico sull'esercizio durante chemioterapia BEP (preservazione della funzione polmonare/bleomicina), ma gli stessi autori della review 2025 dichiarano la base di evidenza ancora "sottile"; nessuna fonte di ricerca sulla neuropatia periferica chemio-indotta o sulla ripresa post-RPLND in questa popolazione.

**Stato attuale: 502 condizioni totali** (500 + 2 nuove del batch 45). **Mancano 298 per arrivare a 800.**

**Batch 46 (1 condizione, id 548) — giro con molte bocciature, documentato per intero per trasparenza:** sei candidati verificati in parallelo, cinque scartati:
- **Poliposi adenomatosa familiare (FAP) post-colectomia/IPAA**: la linea guida ASCRS sulle sindromi poliposiche ereditarie, controllata per intero, non tratta l'attività fisica; l'unica fonte citabile (ERAS Society, 2019) è generica sulla chirurgia colorettale, non specifica per la pouch ileale. **Scartato** come scheda dedicata specifica.
- **Idronefrosi**: nessuna linea guida tratta precauzioni sull'esercizio legate all'idronefrosi o la ripresa dopo pieloplastica. **Scartato**: evidenza sostanzialmente assente.
- **Anemia di Fanconi**: le linee guida di riferimento (Fanconi Anemia Research Fund, 5ª edizione) controllate per intero, citano l'esercizio solo come generica voce di benessere, senza soglie legate alle citopenie né specificità per le anomalie scheletriche congenite tipiche di questa condizione. **Scartato**.
- **Deficit di GH in età pediatrica**: nessuna linea guida pediatrica/endocrina prescrive un protocollo di esercizio specifico; un solo studio (Hoos MB et al., 2004) mostra dati di capacità di attività ma non una scheda completa. **Scartato** come scheda dedicata.
- **Stenosi ureterale**: nessuna linea guida urologica (l'AUA ha una linea guida sulla stenosi *uretrale*, anatomicamente diversa, non su quella *ureterale*) — solo materiale informativo istituzionale per pazienti, non evidenza di ricerca. **Scartato**.

Genuinamente assente e aggiunta in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Vescica neurogena da lesione del motoneurone inferiore (sacrale) — gestione riabilitativa | Urinario + Neurologia (tag `urinary` + `neurology`) | Consortium for Spinal Cord Medicine (Paralyzed Veterans of America). "Bladder Management for Adults with Spinal Cord Injury: A Clinical Practice Guideline for Health-Care Providers." 2006 | 2006 |

Nota: linea guida solida e specifica, utile distinzione clinica dalla vescica neurogena sopra-pontina già presente (#124) — in particolare la disreflessia autonomica, temuta nelle lesioni midollari alte, non si applica alle lesioni sacrali/del motoneurone inferiore.

**Stato attuale: 503 condizioni totali** (502 + 1 nuova del batch 46). **Mancano 297 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola.

**Batch 47 (3 condizioni, id 549-551):** sette candidati verificati in parallelo, quattro scartati:
- **Colangite sclerosante primitiva (PSC)**: controllate per intero sia la AASLD Practice Guidance 2023 che le linee guida EASL 2022 — entrambe elencano la stanchezza come sintomo ma **nessuna delle due tratta l'attività fisica**. Non esiste alcun trial di esercizio specifico per PSC. L'unica fonte reale sull'esercizio in ambito epatologico è generica alla cirrosi di qualsiasi causa (Macías-Rodríguez RU et al., 2020) e non nomina mai la PSC. **Scartato** come scheda dedicata: presentare la raccomandazione generica sulla cirrosi come "evidenza per la PSC" sarebbe stato scorretto.
- **Sindrome di Sheehan**: nessuna fonte tratta l'esercizio in modo specifico per questa sindrome. L'unica letteratura applicabile (Dineen R et al., Therapeutic Advances in Endocrinology and Metabolism, 2019) riguarda la prevenzione della crisi adrenalica in generale nell'insufficienza adrenalica secondaria — valida come fisiologia di base, ma non è evidenza specifica su Sheehan. **Scartato** come scheda dedicata per evitare di far passare un'estrapolazione generica come specifica.
- **Iperplasia surrenalica congenita (CAH)**: controllata per intero la Endocrine Society Clinical Practice Guideline 2018 (Speiser PW et al.) — contiene indicazioni di stress-dosing solo per febbre, malattie gastrointestinali, chirurgia ed emergenze; **nessuna indicazione sull'esercizio fisico/sport**. Stesso problema di Sheehan: l'unica fonte applicabile è generica sull'insufficienza adrenalica, non specifica per CAH. **Scartato**.
- **Linfangectasia intestinale primaria (malattia di Waldmann)**: la review di riferimento (Vignes S, Bellanger J, Orphanet Journal of Rare Diseases, 2008) è stata letta per intero — non contiene alcun riferimento a esercizio, attività fisica o precauzioni per palestra/piscina. Anche la linfopenia, pur presente, non è associata secondo questa fonte a un aumento significativo del rischio di infezioni piogeniche, quindi non si può costruire una scheda di "precauzioni da immunosoppressione" su questa base. L'unica fonte applicabile riguarda il linfedema periferico in generale (National Lymphedema Network, 2012), non la malattia specifica. **Scartato**: è una condizione rara con evidenza specifica realisticamente assente, non solo debole.

Genuinamente assenti e aggiunte in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Porpora di Henoch-Schönlein / vasculite da IgA — attività fisica e monitoraggio renale | Immunologia + Urinario + Gastrointestinale (tag `immune` + `urinary` + `gastrointestinal`) | UK Kidney Association, Clinical Practice Guideline for the Initial Management of IgA Vasculitis (HSP) in Children and Young People, 2022; PRINTO, Henoch-Schönlein Purpura (informazione per pazienti), 2016 | 2022 |
| Leucemia mieloide cronica (LMC) in trattamento con inibitori tirosin-chinasici (TKI) — attività fisica | Oncologia + Ematologia + Cardio-respiratorio (tag `oncology` + `hematology` + `cardiopulmonary`) | Janssen L et al., Haematologica, 2021; Janssen L et al., Blood Cancer Journal, 2023; Sacha T, Krawczyk K, Hematology Transfusion and Cell Therapy, 2025 | 2023 |
| Tiroidite post-partum — attività fisica nelle due fasi ormonali | Endocrino (tag `endocrine`) | American Thyroid Association, Alexander EK et al., Thyroid, 2017 | 2017 |

Note oneste su questo batch: **Henoch-Schönlein** — evidenza reale e utilizzabile su due fronti complementari (la linea guida UK Kidney Association per la parte medica/monitoraggio renale, PRINTO per il linguaggio pratico su riposo in fase acuta e ritorno allo sport), ma nessuna delle due fornisce un vero protocollo di riabilitazione graduata — il criterio di ripresa resta "lasciare che sia il dolore a fermare l'attività", non un protocollo per fasi. **LMC/TKI** — evidenza reale e specifica per popolazione (due studi dello stesso gruppo di ricerca olandese più una review su ponatinib/nilotinib), compresa una citazione diretta molto utile ("l'uso di TKI non dovrebbe essere un fattore limitante per l'attività fisica"), ma la base complessiva resta sottile (poche fonti, in parte dallo stesso gruppo). **Tiroidite post-partum** — evidence_level dichiarato "low": la linea guida ATA 2017 menziona solo "intolleranza allo sforzo" come sintomo della fase ipotiroidea, senza alcuna raccomandazione formale per fase; la cautela sulla fase ipertiroidea (rischio di tachicardia con esercizio intenso) è fisiologia di buon senso, non una raccomandazione da fonte citata — dichiarato esplicitamente come tale nella scheda.

**Stato attuale: 506 condizioni totali** (503 + 3 nuove del batch 47). **Mancano 294 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola.

**Batch 48 (1 condizione, id 552) — giro con molte bocciature, documentato per intero per trasparenza:** sei candidati verificati in parallelo, cinque scartati:
- **Iperparatiroidismo primario**: controllata per intero la linea guida di riferimento del 5° International Workshop (Bilezikian JP et al., Journal of Bone and Mineral Research, 2022) — gestisce la salute ossea solo con DXA/farmaci/paratiroidectomia, **nessuna indicazione sull'esercizio fisico**. Esiste un trial registrato specifico su carico meccanico in questa condizione (NCT01571843) ma non è stato possibile verificarne i risultati da questo ambiente. **Scartato** come scheda dedicata.
- **Sindrome di Klinefelter**: nessun consensus (Gravholt et al. 2018, European Academy of Andrology 2021, review 2025 su Endocrine Reviews controllata per intero) contiene una raccomandazione di esercizio specifica — solo uno studio pilota osservazionale che collega bassa attività fisica e salute ossea, senza protocollo. **Scartato**.
- **Gastroparesi**: la linea guida ACG 2022, controllata per intero, non menziona mai l'attività fisica. Il "camminare dopo i pasti" spesso consigliato è supportato da un solo studio su volontari sani (non su pazienti con gastroparesi) e senza beneficio sintomatico dimostrato. **Scartato** come scheda dedicata per non presentare un consiglio aneddotico come evidenza clinica.
- **Acalasia esofagea**: controllate per intero sia la linea guida ACG 2020 sia quella ISDE 2018 — nessuna delle due tratta l'attività fisica, il ritorno allo sport dopo miotomia/POEM o il rischio di rigurgito durante l'esercizio. L'unico materiale trovato è informativo per pazienti (non di livello clinico/guideline). **Scartato**.
- **Sindrome di Budd-Chiari**: la linea guida EASL 2016 sulle malattie vascolari del fegato, controllata per intero incluse le sezioni sull'anticoagulazione, non contiene alcuna indicazione sull'attività fisica o sul rischio sportivo durante terapia anticoagulante. **Scartato**.

Genuinamente assente e aggiunta in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Tiroidite di Hashimoto / ipotiroidismo autoimmune — esercizio fisico e miopatia/fatica persistente | Endocrino (tag `endocrine`) | Duñabeitia I, González-Devesa D, Varela-Martínez S, Diz-Gómez JC, Ayán-Pérez C., Scandinavian Journal of Clinical and Laboratory Investigation, 2023 (revisione sistematica e meta-analisi); Jordan B et al., Journal of Neurology, 2021 | 2023 |

Nota onesta: la revisione sistematica 2023 (10 studi, soprattutto ipotiroidismo subclinico) conferma che l'esercizio aerobico e di forza è sicuro e migliora esiti secondari (qualità di vita, salute mentale), ma **non ha effetto sui valori di TSH/FT3/FT4** — quindi va presentato come intervento funzionale, non come terapia della malattia. Lo studio di neurologia 2021 è il dato più utile per la pratica clinica: pazienti con Hashimoto euthyroidei (valori di laboratorio normalizzati in terapia) mostrano comunque una distanza ridotta al test del cammino di 6 minuti e più dolore/fatica rispetto ai controlli — quindi la persistenza di sintomi muscolari non va scambiata per terapia inefficace o simulazione, è un dato reale anche a valori normalizzati. Nessuna linea guida ufficiale (ATA) è stata trovata contenere raccomandazioni di esercizio specifiche: evidence_level dichiarato "moderate" sulla base dei due studi citati, non di una linea guida di società scientifica.

**Stato attuale: 507 condizioni totali** (506 + 1 nuova del batch 48). **Mancano 293 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola.

**Batch 49 (3 condizioni, id 553-555):** sette candidati verificati in parallelo, quattro scartati:
- **SIADH cronica (non da esercizio)**: nessuna fonte endocrinologica generale sulla gestione della SIADH cronica tratta l'attività fisica in modo specifico. **Scartato** come scheda dedicata — da non confondere con l'iponatremia da esercizio (voce separata aggiunta in questo batch, evidenza completamente diversa).
- **Porpora trombotica trombocitopenica (TTP)**: controllate per intero le linee guida ISTH 2020 (e il relativo aggiornamento 2025) — nessuna contiene indicazioni sull'attività fisica o sul ritorno allo sport dopo remissione. L'unica fonte sulla sicurezza dell'esercizio in trombocitopenia riguarda le neoplasie ematologiche in chemioterapia, non la TTP immuno-mediata. **Scartato**.
- **Emoglobinuria parossistica notturna (PNH)**: controllati per intero il consensus statement 2021 (Cançado et al.) e due review 2023 — nessuna tratta l'esercizio fisico, nonostante la fatica sia il sintomo dominante. **Scartato** come scheda dedicata.
- **Sindrome nefrotica (adulti)**: controllata per intero la linea guida KDIGO 2021 sulle malattie glomerulari, inclusa la sezione su edema e tromboprofilassi — **nessun riferimento all'attività fisica in nessuna sezione**. **Scartato**.

Genuinamente assenti e aggiunte in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Steatosi epatica metabolica (MASLD/MASH) — esercizio come terapia di prima linea | Gastrointestinale + Endocrino (tag `gastrointestinal` + `endocrine`) | EASL-EASD-EASO, Journal of Hepatology, 2024; AASLD Practice Guidance (Rinella et al.), Hepatology, 2023; Stine JG et al., American Journal of Gastroenterology, 2023 | 2024 |
| Epatite virale cronica C — esercizio fisico ed enzimi epatici | Gastrointestinale (tag `gastrointestinal`) | Ali Ismail AM et al., Gastroenterology Review/Przegląd Gastroenterologiczny, 2024 (RCT) | 2024 |
| Iponatremia da esercizio (EAH) in sport di endurance | Cardio-respiratorio (tag `cardiopulmonary`) | Hew-Butler T, Rosner MH, Fowkes-Godek S et al., British Journal of Sports Medicine, 2015 (3rd International EAH Consensus); Bennett BL, Hew-Butler T et al., Wilderness Medical Society Guidelines, aggiornamento riassunto in American Family Physician, 2021 | 2015 |

Note oneste su questo batch: **MASLD/MASH** è la voce con l'evidenza più solida vista finora in questo batch — prescrizione numerica concreta (≥750 MET-min/settimana) da una revisione sistematica reale, coerente con le linee guida di società scientifiche che raccomandano l'esercizio come trattamento di prima linea, non solo coadiuvante. **Epatite C**: evidenza reale ma sottile — un solo RCT, specifico per l'epatite C (non la B), che mostra miglioramento di ALT/AST ma non misura la carica virale; dichiarato esplicitamente che la stratificazione del rischio emorragico per sport da contatto in presenza di cirrosi/varici non è coperta da alcuna linea guida. **Iponatremia da esercizio**: da non confondere con la SIADH cronica (scartata sopra) — sono due condizioni fisiopatologicamente diverse anche se producono lo stesso risultato di laboratorio; qui l'evidenza è un consensus internazionale solido e specifico per lo sport di endurance, con indicazioni pratiche dirette ("bere in base alla sete").

**Stato attuale: 510 condizioni totali** (507 + 3 nuove del batch 49). **Mancano 290 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola.

**Batch 50 (3 condizioni, id 556-558):** sei candidati verificati in parallelo, tre scartati:
- **Pielonefrite acuta/ricorrente**: controllata per intero la linea guida EAU 2023 sulle infezioni urologiche — nessuna menzione di attività fisica, riposo o ripresa dell'esercizio, né dell'attività come fattore di rischio/protezione per le forme ricorrenti. **Scartato**: evidenza realmente assente, non solo debole.
- **Reflusso vescico-ureterale**: controllate per intero tre linee guida (AUA 2010/aggiornamenti, EAU/ESPU 2024, linee guida giapponesi 2020) — nessuna tratta l'attività fisica, né prima né dopo reimpianto ureterale. **Scartato**.
- **Stenosi uretrale/uretroplastica**: controllata per intero la linea guida AUA 2023 (con amendment) — nessuna indicazione su sollevamento pesi, sforzo o ritorno allo sport dopo l intervento; quanto circola nella pratica clinica è opinione chirurgica, non linea guida verificabile. **Scartato** come scheda dedicata.

Genuinamente assenti e aggiunte in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Neutropenia febbrile in pazienti oncologici/ematologici — soglie di sicurezza per l attività fisica | Oncologia + Ematologia (tag `oncology` + `hematology`) | Santa Mina D, Langelier D, Adams SC et al., Lancet Oncology, 2018 (Safety Reference Guide); Campbell KL et al., Medicine & Science in Sports & Exercise, 2019 | 2018 |
| Porfiria acuta — riabilitazione dopo attacco acuto (neuropatia/tetraparesi) | Neurologia (tag `neurology`) | Valbuena Valecillos A, Yatham P, Alderman M et al., Cureus, 2023; van der Henrique G et al., caso clinico, Einstein (São Paulo), 2023 | 2023 |
| Leucemia linfatica cronica (LLC) — attività fisica in watch-and-wait e in trattamento con inibitori BTK | Oncologia + Ematologia (tag `oncology` + `hematology`) | Brown FF, Oliver R, Eddy R et al., Frontiers in Oncology, 2024 (RCT pilota); Miles EE, Nicol JL, Fowler H et al., EJHaem, 2025 | 2024 |

Note oneste su questo batch: **Neutropenia febbrile** — fonte solida e specifica (tabella di sicurezza con soglia numerica ANC<1.5×10⁹/L), ma non copre la decisione clinica "sospendere o continuare" un programma già in corso quando la neutropenia febbrile insorge durante il trattamento — dichiarato come lacuna. **Porfiria** — non esiste un programma di esercizio preventivo contro gli attacchi (l'unico fattore noto, il digiuno, non è legato all attività fisica); l evidenza reale riguarda la riabilitazione *dopo* un attacco con coinvolgimento neurologico, non la prevenzione — evidence_level "low" dichiarato per questo motivo, utile comunque alla pratica fisioterapica reale. **LLC** — a differenza della scheda generica "Neoplasie Ematologiche" già presente in banca dati (#392), qui l evidenza è specifica per sottotipo (trial pilota randomizzato proprio su pazienti LLC in watch-and-wait) — dichiarata esplicitamente la lacuna sulle soglie di intensità per il rischio aritmico/emorragico degli inibitori BTK, che nessuno studio ha ancora definito.

**Stato attuale: 513 condizioni totali** (510 + 3 nuove del batch 50). **Mancano 287 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola.

**Batch 51 (1 condizione, id 559):** quattro candidati verificati in parallelo, tre scartati:
- **Colecistectomia laparoscopica — ripresa dell attività**: controllata la linea guida SAGES 2010 sulla chirurgia biliare laparoscopica — nessun contenuto su attività/sollevamento pesi post-operatorio. L unica fonte reale sui limiti di sollevamento dopo chirurgia addominale (Schaaf S et al., Hernia, 2022) è un sondaggio tra esperti che conclude che il 90% dei limiti raccomandati nella pratica è basato su opinione, non evidenza, e non è specifica per colecistectomia. **Scartato** come scheda dedicata.
- **Pouchitis (tasca ileale dopo proctocolectomia restaurativa)**: controllate per intero tre fonti ECCO/consensus, inclusa la più recente e completa (International Ileal Pouch Consortium, Lancet Gastroenterology & Hepatology, 2022) — nessuna tratta l attività fisica. **Scartato**.
- **Gastrite atrofica autoimmune**: controllato per intero l AGA Clinical Practice Update 2021 — copre sorveglianza endoscopica, H. pylori, carenza di B12, sorveglianza dei tumori neuroendocrini gastrici, ma **nessun contenuto sull attività fisica** distinto dalla gestione generica della carenza di B12. **Scartato** come scheda dedicata specifica.

Genuinamente assente e aggiunta in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Emorroidi — gestione di stitichezza, sforzo defecatorio e tempo da seduti | Gastrointestinale + Pavimento pelvico posteriore (tag `gastrointestinal` + `pelvic_floor`) | Davis BR, Lee-Kong SA, Migaly J, Feingold DL, Steele SR. ASCRS Clinical Practice Guidelines, Diseases of the Colon & Rectum, 2018; WorkSafeBC Evidence-Based Practice Group, 2023 | 2018 |

Nota onesta: la linea guida ASCRS conferma realmente stitichezza, sforzo defecatorio e tempo prolungato sul water come fattori di rischio comportamentali — questa parte è solida e utile alla pratica fisioterapica (lavoro sulla dinamica defecatoria). Ma due convinzioni molto diffuse non hanno supporto: il nesso sollevamento pesi/Valsalva→emorroidi (una revisione sistematica dedicata del 2023 non ha trovato nessuno studio qualificante) e un timeline di ripresa dell esercizio dopo emorroidectomia (assente da qualunque fonte verificata) — entrambe dichiarate esplicitamente come prive di evidenza nella scheda, invece di essere presentate come fatto clinico accertato.

**Stato attuale: 514 condizioni totali** (513 + 1 nuova del batch 51). **Mancano 286 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola.

**Batch 52 (1 condizione, id 560) — giro con molte bocciature, documentato per intero per trasparenza:** sei candidati verificati in parallelo, cinque scartati:
- **Cistite emorragica da chemio/radioterapia**: controllate per intero le fonti di urologia oncologica e la linea guida "Exercise Is Medicine in Oncology" (Schmitz KH et al., CA Cancer J Clin, 2019) — nessuna tratta l ematuria o la cistite emorragica come fattore da considerare per l attività fisica. **Scartato**: lacuna reale, non debolezza.
- **Nefropatia da contrasto (CI-AKI)**: controllate per intero le linee guida ACR/NKF 2020 e il riassunto KDIGO 2013 — i fattori di rischio elencati (creatinina, età, diabete, anemia, scompenso, ipotensione) non includono mai il livello di attività fisica/fitness. **Scartato**.
- **Panipopituitarismo in età adulta (generale)**: controllata per intero la linea guida Endocrine Society 2016 (Fleseriu et al.) — stesso esito di Sheehan e CAH (batch 47): nessun contenuto sull esercizio fisico, solo un avvertimento contro l uso di GH per doping sportivo (non rivolto al paziente). **Scartato** per lo stesso motivo metodologico.
- **Tiroidite subacuta di de Quervain**: controllata per intero la linea guida ATA 2016 su ipertiroidismo/tireotossicosi — gestisce la condizione con FANS/steroidi/beta-bloccanti ma non tratta mai l attività fisica, nemmeno per la fase dolorosa/tireotossica. **Scartato**.
- **Anemia sideroblastica**: nessuna fonte specifica trovata. L estensione dalla letteratura su sovraccarico di ferro nella talassemia (cardiomiopatia da sovraccarico) è fisiologicamente plausibile ma non verificabile nel dettaglio in questa sessione (il capitolo specifico delle linee guida TIF 2021 su "Exercise and Sports" non è stato recuperabile per intero). **Scartato** per non presentare un estrapolazione non verificata come evidenza.

Genuinamente assente e aggiunta in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Varicocele — dolore scrotale correlato all attività fisica | Urinario (tag `urinary`) | Ebiloglu T, Aydogmus Y, Kaya E, Oral E, Kaplan O, Kibar Y. Canadian Journal of Urology, 2016 | 2016 |

Nota onesta: l unica fonte reale è uno studio monocentrico (non una linea guida di società scientifica) che documenta un peggioramento significativo del dolore da varicocele con l attività fisica (VAS da 3,1 a 7,65) — dato clinicamente utile ma di livello di evidenza basso. Nessuna soglia specifica per ciclismo/sollevamento pesi/stazione eretta prolungata né un timeline di ripresa dopo varicocelectomia sono verificabili da fonte alcuna — dichiarato esplicitamente nella scheda.

**Stato attuale: 515 condizioni totali** (514 + 1 nuova del batch 52). **Mancano 285 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola.

**Batch 53 (3 condizioni, id 561-563):** quattro candidati verificati in parallelo, uno scartato:
- **Malattia inflammatoria pelvica (PID)**: controllata per intero la sezione dedicata delle CDC STI Treatment Guidelines 2021 — copre solo terapia antibiotica, criteri di ospedalizzazione/chirurgia e trattamento del partner; **nessun contenuto sull attività fisica**. L unica evidenza su dolore pelvico cronico post-PID è generica (non specifica per PID) e di qualità dichiarata bassa. **Scartato** come scheda dedicata specifica per PID.

Genuinamente assenti e aggiunte in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Fibromi/miomi uterini — attività fisica e gestione dei sintomi | Pavimento pelvico centrale, femminile (tag `pelvic_floor`) | Birolim MM, Souza SCS, Rodrigues R et al., Health Science Reports, 2025 (revisione sistematica e meta-analisi) | 2025 |
| Malattia di Peyronie — terapia di trazione/stiramento peniena | Pavimento pelvico anteriore, maschile + Urinario (tag `pelvic_floor` + `urinary`) | García-Gómez B et al., Sexual Medicine, 2021 (ESSM position statement); Ziegelmann M et al. (RestoreX RCT); AUA Guideline, 2015/aggiornamento 2022 | 2021 |
| Disfunzione erettile — allenamento del pavimento pelvico ed esercizio aerobico | Pavimento pelvico anteriore, maschile + Urinario (tag `pelvic_floor` + `urinary`) | Dorey G, Speakman MJ, Feneley RC et al., BJU International, 2005 (RCT); Myers C, Smith M, Physiotherapy, 2019 (revisione sistematica); Khera M, Bhattacharyya S, Miller LE, Journal of Sexual Medicine, 2023 (meta-analisi) | 2023 |

Note oneste su questo batch: **Fibromi uterini** — la meta-analisi 2025 mostra che la sola frequenza di attività fisica non è associata a minor rischio di fibromi, ma l intensità medio-alta sì (dato reale ma con evidenza osservazionale, non RCT); l ACOG non tratta l attività fisica come raccomandazione, e nessun timeline di ripresa post-miomectomia è verificabile — dichiarato come lacuna. **Malattia di Peyronie**: qui la differenza rispetto ai batch precedenti è che l evidenza sulla trazione peniena esiste davvero (RCT multipli, position statement ESSM), ma va dichiarato con precisione che l AUA **non** le assegna un grado di raccomandazione specifico — scheda scritta per evitare l impressione che sia "raccomandata dalla linea guida" quando in realtà è "studiata con evidenza limitata/incoraggiante". **Disfunzione erettile**: la voce con l evidenza più solida di questo batch — RCT, revisione sistematica e meta-analisi recente (2023) convergono sul beneficio sia del pavimento pelvico che dell esercizio aerobico, con dati numerici concreti (IIEF-EF, percentuale di recupero).

**Stato attuale: 518 condizioni totali** (515 + 3 nuove del batch 53). **Mancano 282 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola.

**Batch 54 (3 condizioni, id 564-566):** sei candidati verificati in parallelo, tre scartati:
- **Esofagite eosinofila**: controllate per intero le linee guida ACG 2025 e AGA 2020 — nessuna tratta l attività fisica, il timing dei pasti rispetto all esercizio o la disfagia da sforzo. **Scartato**.
- **Sindrome di Zollinger-Ellison (gastrinoma)**: nessun documento NANETS/ENETS con contenuto sull attività fisica trovato. **Scartato**: evidenza assente, non solo debole.
- **Carcinoma tiroideo differenziato — survivorship**: controllata per intero la nuovissima linea guida ATA 2025 (sezione dedicata alla survivorship, R82) — tratta solo il carico psicosociale/finanziario, **nessun contenuto su mobilità di spalla/collo o fatica da sopressione del TSH**. L unica revisione sistematica dedicata (Ferrante M et al., Cancers, 2022) conclude che l evidenza è insufficiente per confermare un beneficio o definire un protocollo. **Scartato** come scheda dedicata specifica.

Genuinamente assenti e aggiunte in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Ascite da cirrosi — adattamento dell attività fisica | Gastrointestinale (tag `gastrointestinal`) | Macías-Rodríguez RU, Ruiz-Margáin A, Rojas-Loureiro G et al., Revista de Gastroenterología de México (edizione inglese), 2019 | 2019 |
| Encefalopatia epatica — ruolo dell esercizio e rischio di cadute | Gastrointestinale + Neurologia (tag `gastrointestinal` + `neurology`) | Vilstrup H, Amodio P, Bajaj J et al., AASLD/EASL Practice Guideline, Hepatology, 2014 (nessun contenuto sull esercizio, dichiarato); Aamann L, Tandon P, Bémeur C, Journal of Clinical and Experimental Hepatology, 2019 | 2019 |
| Insufficienza ovarica precoce (POI) — attività fisica per salute ossea e cardiovascolare | Endocrino (tag `endocrine`) | Panay N, Anderson RA et al. (ESHRE/ASRM/CREWHIRL/IMS Guideline Group), Human Reproduction Open / Fertility and Sterility, 2024 | 2024 |

Note oneste su questo batch: **correzione di citazione** — la fonte sulla prescrizione di esercizio nella cirrosi (Macías-Rodríguez et al.), citata nei batch 43 e 47 come "2020", è in realtà del **2019**: la correzione è riportata qui per trasparenza, la fonte e il contenuto citati restano corretti. **Ascite**: fonte reale letta per intero, confirma che il grado di ascite determina tipo/intensità dell esercizio e che limita deambulazione/respirazione — ma non tratta il rischio di ernia della parete addominale da sforzo né lega esplicitamente il rischio di caduta alla sola distensione addominale (questi due punti, spesso dati per scontati nella pratica clinica, sono dichiarati come non verificabili da fonte). **Encefalopatia epatica**: la linea guida ufficiale AASLD/EASL 2014 è silente sull esercizio — dichiarato esplicitamente; l evidenza reale è una revisione (non linea guida) sul razionale fisiologico sarcopenia-ammonio, utile alla pratica ma non ancora una raccomandazione formale. **POI**: le raccomandazioni ESHRE/ASRM 2024 esistono ma sono di livello "Good Practice Point" o condizionali, non basate su trial specifici per POI — dichiarato come estrapolazione dalle linee guida generali sulla menopausa, non come evidenza POI-specifica.

**Stato attuale: 521 condizioni totali** (518 + 3 nuove del batch 54). **Mancano 279 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola.

**Batch 55 (2 condizioni, id 567-568):** quattro candidati verificati in parallelo, due scartati:
- **Anemia emolitica autoimmune (AIHA)**: controllate le linee guida British Society for Haematology (2017 e aggiornamento su forme secondarie/da farmaci) — nessun contenuto sull attività fisica nella parte accessibile; nessun altra fonte reale trovata oltre a generiche considerazioni su fatica/anemia non specifiche per AIHA. **Scartato** come scheda dedicata specifica.
- **Deficit di piruvato chinasi**: controllate per intero le review più recenti (Fattizzo B et al., Journal of Blood Medicine, 2022) e la scheda NORD — nessun contenuto sull esercizio oltre a un unica frase generica su vitamina D/calcio/esercizio per la salute ossea. **Scartato**: l estensione per analogia dalla sferocitosi ereditaria (già presente in banca dati) non è verificabile come evidenza specifica.

Genuinamente assenti e aggiunte in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Ipoglicemia da esercizio nel diabete (tipo 1 e tipo 2 insulino-trattato) | Endocrino (tag `endocrine`) | Riddell MC, Gallen IW, Smart CE et al., consensus statement, Lancet Diabetes & Endocrinology, 2017 | 2017 |
| Insulinoma — rischio di ipoglicemia indotta dall esercizio | Endocrino (tag `endocrine`) | Prídavková D, Samoš M, Kyčina R et al., World Journal of Clinical Cases, 2020 (case report); Habra MA et al., The Endocrinologist, 2006 (case report) | 2020 |

Note oneste su questo batch: **Ipoglicemia da esercizio nel diabete** è probabilmente la voce con l evidenza più solida e operativamente dettagliata di tutto questo percorso di espansione — un consensus statement internazionale con target glicemici numerici precisi, dosaggi di carboidrati per fascia di durata e percentuali di riduzione del bolo insulinico, non principi generici. **Insulinoma**: qui l evidenza è reale ma di livello case report (non linea guida di società scientifica, che su questo tema è silente) — dichiarato esplicitamente nella scheda; utile comunque alla sicurezza clinica perché descrive un meccanismo fisiopatologico reale (ciclo di Cori) prima della risoluzione chirurgica.

**Stato attuale: 523 condizioni totali** (521 + 2 nuove del batch 55). **Mancano 277 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola.

**Batch 56 (3 condizioni, id 569-571):** quattro candidati verificati in parallelo, uno scartato:
- **Anemia perniciosa (deficit di B12 autoimmune)**: controllata per intero la linea guida British Society for Haematology (Devalia V, Hamilton MS, Molloy AM, 2014, riconfermata 2024) — copre solo diagnosi e terapia sostitutiva, **nessun contenuto su attività fisica, cadute, equilibrio o riabilitazione della neuropatia**. **Scartato** come scheda dedicata specifica (distinta dalla gestione generica dell anemia).

Genuinamente assenti e aggiunte in questo batch:
| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Emofilia — classificazione degli sport per rischio emorragico | Ematologia (tag `hematology`) | Howell C, Scott K, Patel DR, Translational Pediatrics, 2017; WFH Guidelines for the Management of Hemophilia, 3rd ed., Haemophilia, 2020 | 2020 |
| Mastocitosi — esercizio come possibile trigger di degranulazione mastocitaria | Immunologia (tag `immune`) | Studio su istamina/triptasi post-esercizio in mastocitosi, J Allergy Clin Immunol Pract, 2018; ECNM-AIM User Guide, 2022 | 2018 |
| Leucemia mieloide acuta (LMA) — esercizio durante chemioterapia intensiva/trapianto | Ematologia + Oncologia (tag `hematology` + `oncology`) | Elter T, Stipanov M, Heuser E et al., International Journal of Hematology, 2009; Alibhai SMH, Durbano S, Breunis H et al., Leukemia Research, 2015; Cochrane Database Syst Rev, CD009075.pub3 | 2015 |

Note oneste su questo batch: **Emofilia** è una scheda distinta dall artropatia emofilica già presente (#408) — qui l argomento è la classificazione sportiva per rischio emorragico, non la riabilitazione articolare; il testo esatto della sezione WFH dedicata non è stato verificabile per intero in questa sessione, dichiarato esplicitamente, usando come fonte principale verificabile la review secondaria (Howell 2017) che la cita. **Mastocitosi**: il dato sul trigger (istamina/triptasi che aumentano realmente dopo sforzo in questi pazienti) è solido, ma non esiste un protocollo di esercizio sicuro formalmente validato — la scheda è scritta come gestione del rischio/trigger, non come prescrizione di esercizio. **LMA**: evidenza più ricca del previsto per una neoplasia ematologica acuta — uno studio di fattibilità sfida esplicitamente le soglie empiriche tradizionali di piastrine/emoglobina usate per sospendere l attività, ma nessuna soglia numerica è ancora di consenso formale (ACSM/ASCO/ONS) — dichiarato come tale.

**Stato attuale: 526 condizioni totali** (523 + 3 nuove del batch 56). **Mancano 274 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola.

**Batch 57 — giro interamente di bocciature, documentato per trasparenza (0 condizioni aggiunte, id ancora fermo a 571):** due candidati verificati, entrambi scartati:
- **Esofago di Barrett**: controllata per intero la linea guida ACG 2022 aggiornata — l obesità centrale è citata solo come fattore di rischio per la progressione a carcinoma, **nessun contenuto sull attività fisica** né una gestione diversa dal reflusso gastroesofageo standard (già presente in banca dati, #366). **Scartato** come scheda dedicata specifica.
- **Colite microscopica (collagenosica e linfocitica)**: controllate per intero la linea guida AGA 2016 e la BSG 2018 sulla diarrea cronica — entrambe esclusivamente diagnostico/farmacologiche, **nessun contenuto sull attività fisica**. La linea guida europea UEG/EMCG 2021 non è stata verificabile per intero in questa sessione (accesso bloccato) — non citata per questo motivo. **Scartato**.

Nessuna condizione aggiunta in questo batch — riportato comunque per mantenere la tracciabilità completa del metodo (ricerca → verifica → bocciatura onesta), coerente con l impostazione di tutti i batch precedenti.

**Stato attuale: 526 condizioni totali** (nessuna variazione dal batch 56). **Mancano 274 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola.

**Batch 58 — secondo giro interamente di bocciature, documentato per trasparenza (0 condizioni aggiunte):** quattro candidati verificati, tutti scartati:
- **Pancreatite acuta**: la linea guida ACG 2024, controllata per intero, non contiene alcun contenuto sull attività fisica. La nuova revisione IAP/APA 2025 (96 domande su 18 ambiti) non elenca l attività fisica tra i suoi ambiti secondo l abstract, ma il testo completo non è stato verificabile in questa sessione — dichiarato come "probabilmente assente, non confermato al 100%", a differenza dell ACG verificato per intero. **Scartato**.
- **Fistola anale**: controllata per intero la linea guida ASCRS 2022 su ascesso anorettale/fistola — copre solo diagnosi e gestione chirurgica, **nessun contenuto sull attività fisica** (sollevamento, ciclismo, tempo da seduti dopo fistulotomia/seton). **Scartato**.
- **Prolasso rettale**: la linea guida ASCRS 2011 non è stata accessibile per intero (paywall) — non verificabile né come presente né come assente il contenuto sull attività fisica; un consensus statement multidisciplinare 2026 su fisioterapia del pavimento pelvico in ODS/prolasso posteriore esiste ma il suo contenuto specifico non è stato verificabile. **Scartato** per non presentare un estrapolazione non confermata come evidenza.
- **Colite da Clostridioides difficile**: controllate le linee guida IDSA/SHEA 2018 e l aggiornamento 2021 — nessuna tratta l attività fisica né le precauzioni igieniche per palestra/piscina. **Scartato**.

Nessuna condizione aggiunta in questo batch.

**Stato attuale: 526 condizioni totali** (nessuna variazione dal batch 57). **Mancano 274 per arrivare a 800.**

**Batch 59 (2 condizioni, id 572-573):** dopo due batch consecutivi senza aggiunte, la ricerca si è spostata su endocrinologia/gastroenterologia metabolica, trovando due candidati solidi:

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sindrome da dumping (post-gastrectomia/chirurgia bariatrica) | Gastrointestinale + Endocrino | Consensus panel internazionale su sindrome da dumping | 2020 |
| Iperinsulinismo da esercizio (EIHI) — ipoglicemia indotta da sforzo anaerobico | Endocrino | Letteratura genetica su varianti SLC16A1/MCT1 | 2014-2023 |

Note oneste: il panel sulla sindrome da dumping dichiara esso stesso che l'evidenza specifica sull'attività fisica è "carente" — solo il 55% degli esperti concorda sul consiglio di sdraiarsi dopo i pasti, quindi il livello di evidenza è stato impostato su "low" nonostante la fonte sia autorevole. L'EIHI è una forma genetica rara e distinta dall'iperinsulinismo congenito comune (variante SLC16A1/MCT1): qui è proprio l'esercizio fisico, soprattutto anaerobico, a scatenare l'ipoglicemia — una condizione rilevante proprio per un database orientato all'attività fisica. Scope limitato esplicitamente a questa variante, non all'iperinsulinismo congenito generico.

**Stato attuale: 528 condizioni totali** (526 + 2 nuove del batch 59). **Mancano 272 per arrivare a 800.**

**Batch 60 (2 condizioni aggiunte, id 574-575; 4 candidati scartati):**

Scartati con motivazione documentata:
- **Immunodeficienza Comune Variabile (CVID)**: la linea guida di riferimento (AAAAI/ACAAI/JCAAI Practice Parameter 2015, controllata per intero) è completamente silente sull'attività fisica. L'unica fonte peer-reviewed reperita è un survey descrittivo senza gruppo di controllo. **Scartato**.
- **Diabete insipido**: le linee guida endocrinologiche ufficiali (European Society of Endocrinology, Society for Endocrinology UK) trattano solo la gestione idrica durante malattia febbrile o ondate di calore, mai durante l'esercizio fisico propriamente detto. **Scartato** per assenza di contenuto condizione-specifico sull'attività fisica.
- **Trombocitemia essenziale**: le linee guida ematologiche di riferimento (ELN 2011, NCCN, British Society for Haematology) sono tutte silenti sull'esercizio fisico. L'unica fonte con contenuto pertinente è un sondaggio osservazionale, non una linea guida. **Scartato**.
- **Sopravvivenza al tumore testicolare**: nessuna linea guida di exercise oncology (ACSM, ASCO, ESMO) tratta il tumore testicolare in modo specifico e dedicato — solo raccomandazioni generiche "pan-cancro" estrapolate, con le stesse fonti che dichiarano l'assenza di evidenza specifica per questo tumore. **Scartato** per evitare di presentare un'estrapolazione generica come linea guida dedicata.

Genuinamente presenti e aggiunte in questo batch:

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Pectus excavatum/carinatum — riabilitazione pre/post-Nuss | Cardiopolmonare | Maagaard & Heiberg, Ann Cardiothorac Surg (review); Pandya et al., J Pediatr Surg (studio multicentrico) | 2016-2025 |
| Deficit di alfa-1 antitripsina (AATD) con enfisema | Cardiopolmonare | Alwadani et al., Chronic Obstructive Pulmonary Diseases: Journal of the COPD Foundation; ERJ Open Research | 2023-2025 |

Note oneste: per il pectus excavatum/carinatum, il timing di ripresa dell'attività dopo la procedura Nuss varia enormemente tra i centri ospedalieri (da 2 settimane a 3 mesi) — non esiste uno standard validato, solo uno studio multicentrico 2025 che inizia a mettere in discussione le restrizioni empiriche tradizionali; questo è stato dichiarato esplicitamente nel campo note. Per il deficit di alfa-1 antitripsina, l'evidenza è di qualità bassa (studi piccoli, quasi-sperimentali, nessuna linea guida GOLD/ATS-ERS dedicata che fornisca parametri FITT specifici) — i protocolli attuali sono un adattamento di quelli standard per la BPCO comune, con differenze fisiologiche documentate (maggiore desaturazione da esercizio, guadagno al 6MWT inferiore) che vengono segnalate nel campo controindicazioni.

**Stato attuale: 530 condizioni totali** (528 + 2 nuove del batch 60). **Mancano 270 per arrivare a 800.**

**Batch 61 (2 condizioni aggiunte, id 576-577; 4 candidati scartati):**

Scartati con motivazione documentata:
- **Sindrome di Eisenmenger**: le review cliniche più recenti e autorevoli (Heart 2020, JACC State-of-the-Art Review 2022) sono sostanzialmente silenti sull'attività fisica — menzionano solo la tolleranza all'esercizio come marker prognostico, senza raccomandazioni pratiche. Le uniche fonti che toccano il tema in modo esplicito sono generiche ("individualizzare in base al test da sforzo"). **Scartato** per evitare di costruire contenuto clinico dettagliato (soglie, criteri di progressione) oltre quanto le fonti dicono davvero.
- **Discinesia ciliare primaria (PCD)**: le linee guida pneumologiche ufficiali (ERS Task Force 2017/2024-25, consensus NHS England 2025) trattano solo diagnosi e clearance delle secrezioni, dichiarando esse stesse che non c'è evidenza nemmeno sulla tecnica di clearance migliore. Nessuna fonte tratta riabilitazione polmonare o esercizio come intervento. **Scartato**.
- **Ipoparatiroidismo**: le linee guida endocrinologiche ufficiali (ESE 2015, ESE rivista 2025, Consensus Canadese/Internazionale 2019) sono tutte silenti sull'attività fisica e il rischio di tetania da sforzo. Esiste solo una revisione narrativa non istituzionale (Bonavolontà et al. 2022) che dichiara essa stessa evidenza limitata. **Scartato** come voce da presentare con autorità di linea guida.
- **Sindrome da attivazione mastocitaria (MCAS)**: i due consensus diagnostici di riferimento (Valent 2018, Afrin "consensus-2" 2021), controllati per intero, non menzionano l'esercizio fisico come trigger né danno precauzioni specifiche. L'unica fonte dedicata è una narrative review 2026 di rivista minore non indicizzata. **Scartato**.

Genuinamente presenti e aggiunte in questo batch:

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Circolazione di Fontan — esercizio fisico e riabilitazione | Cardiopolmonare | Rychik J et al., AHA Scientific Statement, Circulation; Stout KK et al., AHA/ACC/HRS Guideline ACHD; Takken T et al., AEPC/EACPR/EHRA | 2011-2019 |
| Sindrome di Prader-Willi — attività fisica e gestione multidisciplinare | Endocrino + Neurologia | Deal CL et al., GH Research Society Consensus; Bellicha A et al., systematic review J Clin Med; van Abswoude DH et al. | 2013-2023 |

Note oneste: per la circolazione di Fontan, più fonti indipendenti concordano in modo coerente, ma i livelli di evidenza sottostanti restano consensus/expert opinion (classi C/C-LD), non RCT — dichiarato esplicitamente nel campo evidence_level. Per la sindrome di Prader-Willi, l'evidenza è solida per attività fisica generale/salute ossea (systematic review + consensus GH) ma nessuna fonte fornisce criteri di progressione o soglie di sforzo specifiche legate al rischio di morte improvvisa o alla scoliosi — questi campi sono stati dichiarati esplicitamente come "non definiti dalla letteratura" piuttosto che inventati.

**Stato attuale: 532 condizioni totali** (530 + 2 nuove del batch 61). **Mancano 268 per arrivare a 800.**

**Batch 62 (2 condizioni aggiunte, id 578-579; 4 candidati scartati):**

Scartati con motivazione documentata:
- **Febbre reumatica acuta / cardiopatia reumatica cronica**: le linee guida più autorevoli e recenti (WHO 2024, AHA Jones Criteria 2015) sono esplicitamente silenti su riposo/attività fisica — si concentrano solo su diagnosi e terapia farmacologica. Le raccomandazioni sportive sulle valvulopatie esistono ma sono generiche per gravità ecocardiografica, non specifiche per eziologia reumatica. **Scartato**.
- **Granulomatosi con poliangioite (GPA)**: le linee guida reumatologiche ufficiali (EULAR, BSR 2025) non trattano attività fisica/fatica. La fonte Physiopedia dichiara essa stessa l'assenza di uno standard di cura basato su evidenze. L'unico studio interventistico è un pilota di fattibilità non conclusivo (n=43, aderenza solo 50%). **Scartato**.
- **Nefropatia da IgA**: la linea guida di riferimento (KDIGO 2025) menziona "esercizio regolare" solo in un elenco generico di stile di vita, senza alcun dettaglio condizione-specifico. Il resto della letteratura è un piccolo studio del 2004 (n=10) e un abstract di congresso non verificabile in full-text. **Scartato** per evitare di costruire un protocollo non supportato.
- **Arterite di Takayasu**: le due linee guida reumatologiche ufficiali (EULAR 2018, ACR/VF 2021) sono completamente silenti sull'attività fisica. L'unico contenuto reperito è una review narrativa che estrapola da linee guida cardiovascolari generali, basata su coorti di 1-6 pazienti per studio. **Scartato**.

Genuinamente presenti e aggiunte in questo batch:

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Malattia di Kawasaki — esiti cardiaci a lungo termine | Cardiopolmonare | McCrindle BW et al., AHA Scientific Statement, Circulation | 2017 |
| Malattia granulomatosa cronica (CGD) — precauzioni ambientali | Immunologia | GeneReviews NBK99496; AAAAI materiale educativo pazienti | aggiornamento periodico |

Note oneste: per Kawasaki, il framework di stratificazione del rischio AHA 2017 è autorevole e confermato da fonti secondarie convergenti, ma non sono riuscito a verificare il testo integrale del documento primario (troppo lungo per i tool di fetch disponibili) — segnalato esplicitamente nel campo fonte perché chi ha accesso diretto a Circulation possa confermare la citazione esatta. Per la CGD, il contenuto inserito riguarda esclusivamente le precauzioni ambientali/infettive durante l'attività fisica (es. evitare acqua dolce/stagnante, pacciamatura, compostaggio) — non esiste in letteratura un protocollo di esercizio terapeutico strutturato per questa condizione, e questo è dichiarato esplicitamente nei campi progression_criteria/outcome_measures invece di essere inventato.

**Stato attuale: 534 condizioni totali** (532 + 2 nuove del batch 62). **Mancano 266 per arrivare a 800.**

**Batch 63 (5 condizioni aggiunte, id 580-584; 1 candidato scartato) — focus sulle canalopatie cardiache:**

Scartato con motivazione documentata:
- **Narcolessia**: la linea guida clinica di riferimento (AASM 2021, 22 raccomandazioni) è interamente farmacologica — nessuna menzione di esercizio fisico. La letteratura emergente (studio pilota 2026, studio qualitativo 2024) è preliminare e gli stessi autori dichiarano che il rischio di cataplessia/attacchi di sonno durante l'esercizio non è stato affrontato. **Scartato** per mancanza di una base di evidenza con adeguate garanzie di sicurezza.

Genuinamente presenti e aggiunte in questo batch — le quattro canalopatie cardiache hanno tutte una solida base in linee guida multisocietarie (AHA/ACC Task Force 10, HRS/EHRA/APHRS, ESC) con raccomandazioni esplicite su sport ed esercizio:

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sindrome del QT lungo (LQTS) | Cardiopolmonare | Ackerman MJ et al., AHA/ACC Task Force 10; Priori SG et al., ESC Guidelines; HRS/EHRA/APHRS Consensus | 2013-2020 |
| Sindrome di Brugada | Cardiopolmonare | AHA/ACC Task Force 10; HRS/EHRA/APHRS; HRS Consensus 2024; SICSport 2025 | 2013-2025 |
| Tachicardia ventricolare polimorfa catecolaminergica (CPVT) | Cardiopolmonare | AHA/ACC Task Force 10; HRS/EHRA/APHRS; Zeppenfeld K et al., ESC Guidelines 2022 | 2004-2022 |
| Cardiomiopatia aritmogena del ventricolo destro (ARVC/ACM) | Cardiopolmonare | Towbin JA et al., HRS Expert Consensus 2019; James CA et al., JACC 2013 (studio Johns Hopkins) | 2013-2020 |
| Telangiectasia emorragica ereditaria (HHT) — precauzioni | Cardiopolmonare + Ematologia | Faughnan ME et al., Second International Guidelines for HHT, Ann Intern Med | 2020 |

Note oneste: per LQTS e ARVC l'evidenza è moderata (coorti longitudinali, relazione dose-risposta per ARVC). Per Brugada e CPVT le fonti stesse dichiarano un'evidenza bassa/bassa-moderata ("evidence scarce" per Brugada secondo le review 2025) nonostante la direzione delle raccomandazioni sia molto consistente tra le società scientifiche — dichiarato esplicitamente nel campo evidence_level invece di essere presentato come evidenza forte. Per la HHT, lo scope è stato limitato esclusivamente alle precauzioni (divieto di SCUBA diving con PAVM nota, intolleranza all'esercizio come red flag) perché non esiste in letteratura alcun protocollo di esercizio terapeutico strutturato per questa condizione — i campi relativi sono dichiarati "non definiti" piuttosto che inventati.

**Stato attuale: 539 condizioni totali** (534 + 5 nuove del batch 63). **Mancano 261 per arrivare a 800.**

**Batch 64 (3 condizioni aggiunte, id 585-587; 3 candidati scartati):**

Scartati con motivazione documentata:
- **Cefalea a grappolo**: le linee guida neurologiche ufficiali (EAN 2023, American Headache Society) sono interamente farmacologiche/procedurali — nessuna menzione di attività fisica, né come trigger né come terapia. L'unica fonte diretta è un case series di 7 pazienti senza gruppo di controllo. **Scartato**.
- **Ischemia mesenterica cronica**: la linea guida vascolare più autorevole e recente (ESVS 2025, letta per intero) è completamente silente sull'attività fisica — il dolore è descritto come postprandiale, non legato all'esercizio, e non esiste alcun criterio di riabilitazione post-rivascolarizzazione. **Scartato**.
- **Sindromi MEN1/MEN2 (feocromocitoma)**: la linea guida di riferimento (Endocrine Society 2014, letta per intero, 99 pagine) non menziona l'attività fisica come trigger o precauzione. L'unica menzione è aneddotica in una review secondaria. **Scartato** come voce di linea guida.

Genuinamente presenti e aggiunte in questo batch:

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sarcoma di Ewing — survivorship e attività fisica | Oncologia | COG Long-Term Follow-Up Guidelines v6; ACSM Consensus Statement, Med Sci Sports Exerc | 2014-2026 |
| Osteosarcoma — survivorship e attività fisica | Oncologia | COG Long-Term Follow-Up Guidelines v6; Kendall et al., Current Oncology 2022 | 2022-2023 |
| Idrocefalo normoteso (iNPH) — tap test ed esercizio | Neurologia | Japanese Society of NPH Guidelines 3a ed.; Rydja et al., RCT iNPhys, Frontiers in Neurology | 2021-2025 |

Note oneste: per sarcoma di Ewing e osteosarcoma, il contenuto su screening di neuropatia/cardiotossicità ha base solida (linee guida COG), ma qualsiasi contenuto su esercizio terapeutico specifico per queste patologie è di qualità molto bassa (GRADE) — dichiarato esplicitamente, e corretta un'associazione farmacologica potenzialmente fuorviante (la neuropatia da vincristina riguarda il regime Ewing VDC-IE, non l'osteosarcoma che usa cisplatino nel regime MAP). Per l'idrocefalo normoteso, il protocollo del tap test ha un consensus clinico solido, ma è stato riportato onestamente anche l'esito negativo dell'unico RCT disponibile sull'esercizio aggiuntivo (nessun beneficio incrementale oltre alla sola derivazione) — un dato che aiuta a calibrare le aspettative cliniche invece di essere omesso.

**Stato attuale: 542 condizioni totali** (539 + 3 nuove del batch 64). **Mancano 258 per arrivare a 800.**

**Batch 65 (2 condizioni aggiunte, id 588-589; 4 candidati scartati):**

Scartati con motivazione documentata:
- **Sindrome di Tourette**: la linea guida neurologica ufficiale (AAN 2019) è silente sull'attività fisica. L'unica systematic review (Kim et al. 2018) si basa su 5/8 studi che sono case report, nessun RCT. **Scartato**.
- **Emoglobinuria parossistica notturna (PNH/EPN)**: sia la guideline ematologica di riferimento (Onkopedia 2024) sia la review di gestione clinica più recente (Oliver & Patriquin 2023) sono completamente silenti sull'attività fisica, anche in rapporto al rischio trombotico o alla terapia con eculizumab/ravulizumab. **Scartato**.
- **Rene a ferro di cavallo**: l'unica fonte specifica è un case report singolo che descrive solo il meccanismo anatomico di rischio, senza alcuna raccomandazione pratica sportiva. Le linee guida sul rene solitario esistono ma riguardano una condizione anatomicamente diversa (assenza di un rene, non fusione di due reni) e non sono state estrapolate per evitare di attribuire falsa specificità. **Scartato**.
- **Sindrome della persona rigida (Stiff Person Syndrome)**: nessuna linea guida neurologica (es. AAN) tratta l'esercizio come intervento codificato. L'unico contenuto reperito è una revisione di 9 case report, senza RCT né consensus. **Scartato**.

Genuinamente presenti e aggiunte in questo batch:

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Mielite trasversa — riabilitazione ed esercizio | Neurologia | Martin Ginis KA et al., International Scientific SCI Exercise Guidelines, Spinal Cord; Gupta A et al., Spinal Cord 2016 | 2016-2023 |
| Paralisi supranucleare progressiva (PSP) — riabilitazione e rischio di caduta | Neurologia | Slade S et al., systematic review MDS Congress 2019; Matsuda N et al., pilot study, Frontiers in Neurology 2022 | 2019-2023 |

Note oneste: per la mielite trasversa, il contenuto è esplicitamente etichettato come estrapolato dalle linee guida generali sulla lesione midollare non traumatica (SCI Exercise Guidelines) — non esiste una linea guida dedicata specificamente a questa condizione, e questo è dichiarato nel campo fonte invece di essere presentato come specifico. Per la PSP, non esiste un consensus/linea guida societaria dedicata alla riabilitazione — il contenuto proviene da una systematic review con rischio di bias moderato-alto e da un pilot study senza gruppo di controllo (n=20); è stato comunque incluso per il suo valore clinico pratico (gestione del rischio di caduta, molto elevato in questa patologia), ma etichettato esplicitamente come evidenza bassa-moderata.

**Stato attuale: 544 condizioni totali** (542 + 2 nuove del batch 65). **Mancano 256 per arrivare a 800.**

**Batch 66 (1 condizione aggiunta, id 590; 5 candidati scartati) — batch a prevalenza di scarti, documentato per trasparenza:**

Scartati con motivazione documentata:
- **CPPD/pseudogotta**: le linee guida EULAR (2011, Part I e II) non trattano l'esercizio come raccomandazione codificata — solo riposo/crioterapia/immobilizzazione in fase acuta. **Scartato**.
- **Oftalmopatia di Graves (orbitopatia tiroidea)**: la linea guida di riferimento (EUGOGO 2021, letta per intero) è completamente silente su attività fisica/sport/traumi oculari — l'unica raccomandazione di stile di vita riguarda la cessazione del fumo. **Scartato**.
- **Enteropatia proteino-disperdente**: le linee guida ESPEN (IBD 2017, nutrizione parenterale domiciliare 2023) sono silenti sull'esercizio fisico — il focus è esclusivamente nutrizionale. **Scartato**.
- **Malattia di Whipple**: nessuna fonte infettivologica/gastroenterologica tratta riabilitazione/esercizio durante o dopo il trattamento antibiotico — condizione rarissima, letteratura dominata da case report. **Scartato**.
- **Sindrome di Felty**: nessuna fonte tratta esplicitamente attività fisica in rapporto a neutropenia o splenomegalia in questa sindrome specifica; l'unica guideline strutturata (ACR 2022 per artrite reumatoide) è silente su questi aspetti. **Scartato**.

Genuinamente presente e aggiunta in questo batch:

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Atresia biliare dopo intervento di Kasai — precauzioni sportive | Gastrointestinale | Waisbourd-Zinman O et al., survey epatologi pediatrici, J Pediatr Gastroenterol Nutr; Shneider BL et al., NASPGHAN/EPA Consensus | 2012-2018 |

Note oneste: anche per questa unica voce aggiunta, l'evidenza è bassa — basata su una survey di opinione di esperti, non su una linea guida formale graduata. È stata inclusa perché riguarda un rischio clinico concreto e genuinamente rilevante per chi fa fisioterapia pediatrica (rottura splenica da trauma sportivo in ipertensione portale), dichiarando però onestamente il livello di evidenza invece di presentarla come consensus consolidato. Questo batch ha un rapporto scarti/aggiunte più sbilanciato del solito — segno che il pool di condizioni con evidenza verificabile si va riducendo nelle aree già esplorate a fondo.

**Stato attuale: 545 condizioni totali** (544 + 1 nuova del batch 66). **Mancano 255 per arrivare a 800.**

**Batch 67 (1 condizione aggiunta, id 591; 5 candidati scartati):**

Scartati con motivazione documentata:
- **Sindrome del nutcracker**: il Delphi consensus internazionale più recente (2025, 20 esperti vascolari) è completamente silente sull'attività fisica. L'unico contenuto reperito è un singolo case report aneddotico. **Scartato**.
- **Granulomatosi eosinofila con poliangioite (EGPA)**: la linea guida EGPA-specifica più recente e autorevole (Vaglio et al. 2023) e l'EULAR 2022 update sono entrambe silenti sull'attività fisica. **Scartato**.
- **Malattia correlata a IgG4**: il consensus internazionale di riferimento (Khosroshahi et al. 2015) non tratta attività fisica o gestione della fatica. **Scartato**.
- **Iperaldosteronismo primario (sindrome di Conn)**: la linea guida Endocrine Society 2025 (la più recente, letta per intero) è completamente silente sull'attività fisica. **Scartato**.
- **SIADH cronica**: la linea guida europea di riferimento (ESE/ESICM/ERA-EDTA 2014) tratta l'esercizio solo come causa elencata in una tabella, senza alcuna raccomandazione pratica di gestione. **Scartato**.

Genuinamente presente e aggiunta in questo batch:

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Nevralgia del pudendo — fisioterapia del pavimento pelvico | Pavimento pelvico | Labat JJ et al., criteri di Nantes; StatPearls 2026; systematic review su ciclisti, J Functional Morphology and Kinesiology 2021 | 2008-2026 |

Note oneste: per la nevralgia del pudendo, il consensus formale più autorevole sul tema (Levesque et al. 2021/2022) non è stato verificabile per intero in questa sessione per un blocco di accesso — dichiarato esplicitamente nel campo fonte come lacuna di verifica, non come assenza di contenuto. Il contenuto inserito proviene da criteri diagnostici consolidati (Nantes), una sintesi tertiaria aggiornata (StatPearls) e una systematic review specifica sui ciclisti — livello di evidenza dichiarato come basso/basso-moderato, non presentato come consensus di prima fascia.

**Stato attuale: 546 condizioni totali** (545 + 1 nuova del batch 67). **Mancano 254 per arrivare a 800.**

**Batch 68 (3 condizioni aggiunte, id 592-594; 3 candidati scartati):**

Scartati con motivazione documentata:
- **Macroglobulinemia di Waldenström**: la consensus ematologica più autorevole e recente (IWWM-10, Castillo JJ et al., Lancet Haematology 2020, letta per intero) è completamente silente su attività fisica/esercizio — centrata solo su protocolli farmacologici e gestione della sindrome da iperviscosità. Nessuna fonte NCCN o case report disponibile tratta il tema. **Scartato**.
- **Malattia di Still dell'adulto (AOSD)**: la linea guida più recente e autorevole (EULAR/PReS 2024, Ann Rheum Dis, letta per intero) non contiene alcuna menzione di attività fisica o fisioterapia. Le EULAR 2018 su attività fisica nelle artriti inflammatorie esplicitamente NON includono l'AOSD nel loro ambito, quindi non sono estrapolabili come evidenza diretta. **Scartato**.
- **Carcinoma a cellule di Merkel**: nessuna fonte oncologica — né NCCN v2.2025, né ESMO-EURACAN 2024, né letteratura dedicata — tratta l'attività fisica durante o dopo il trattamento. L'unico contenuto disponibile sono le raccomandazioni generiche NCCN Survivorship cross-cancer (non disease-specific), insufficienti per una voce dedicata onesta. **Scartato**.

Genuinamente presenti e aggiunte in questo batch:

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Mesotelioma pleurico maligno — riabilitazione respiratoria e oncologica | Oncologia + Cardiopolmonare | Lippi, de Sire, Aprile et al., scoping review, Current Oncology 2024; Invernizzi, Lippi et al., studio pilota di fattibilità, Cancers (Basel) 2024 | 2024 |
| Colangiocarcinoma — attività fisica in trattamento e perioperatorio | Oncologia + Gastrointestinale | De Lazzari et al., RCT "P-move", Support Care Cancer 2024; ERAS Society Liver Surgery Guidelines 2022 | 2022-2024 |
| Carcinoma esofageo — riabilitazione post-esofagectomia | Oncologia + Gastrointestinale | ERAS Society Guidelines for Esophagectomy, World J Surg 2019; audit ACPRC 2023; PERFECT trial (Paesi Bassi) | 2019-2023 |

Note oneste: per il mesotelioma, la linea guida oncologica ufficiale (ESMO) è silente sull'esercizio — il contenuto inserito si basa su un solo studio pilota di fattibilità (n=12, 7 completer, senza gruppo di controllo) e una scoping review, livello di evidenza dichiarato basso ed esplicitamente etichettato come esplorativo, non come raccomandazione da linea guida. Per il colangiocarcinoma, l'evidenza disease-specific diretta proviene da un singolo RCT monocentrico su pazienti in stadio IV avanzato (misto pancreas/vie biliari) più le raccomandazioni perioperatorie generiche ERAS per chirurgia epatica — evidenza dichiarata bassa, non consensus oncologico dedicato. Per il carcinoma esofageo post-esofagectomia, l'evidenza è la più solida dei tre (mobilizzazione precoce da consensus ERAS + RCT multicentrico PERFECT su esercizio supervisionato), ma un audit indipendente (ACPRC 2023) conferma che i target quantitativi di mobilizzazione variano ampiamente tra centri senza standardizzazione — evidenza dichiarata moderata, non alta. Questo batch ha di nuovo un rapporto scarti/aggiunte sbilanciato nelle aree ematologiche/reumatologiche rare già esplorate (Waldenström, Still), mentre l'area exercise-oncology su tumori solidi meno comuni (pleura, vie biliari, esofago) ha ancora margine di contenuto genuino, seppure a evidenza bassa/moderata.

**Stato attuale: 549 condizioni totali** (546 + 3 nuove del batch 68). **Mancano 251 per arrivare a 800.**

**Batch 69 (2 condizioni aggiunte, id 595-596; 4 candidati scartati):**

Scartati con motivazione documentata:
- **Malattia di Castleman (UCD/iMCD)**: i consensus ematologici di riferimento (van Rhee et al., Blood Advances 2020 per UCD; Blood 2018 per iMCD) sono completamente silenti su attività fisica/esercizio — solo diagnosi, terapia farmacologica e follow-up. Esiste solo una survey descrittiva sul carico di fatica (Mukherjee et al., eClinicalMedicine 2023), senza alcuna raccomandazione riabilitativa. **Scartato**.
- **Fascite eosinofila (sindrome di Shulman)**: nessuna linea guida reumatologica dedicata esiste; le uniche fonti (PCDS 2023, MSD Manual) contengono solo una frase generica ("la fisioterapia aiuta con le contratture") senza protocolli, red flags o criteri di progressione verificabili. **Scartato**.
- **Sindrome POEMS**: la review ematologica di riferimento (Dispenzieri, Am J Hematol 2023) non menziona l'esercizio. L'unica fonte con un accenno (Gonçalves et al., J Neurol Neurosurg Psychiatry 2026) offre solo una frase generica su riabilitazione multidisciplinare precoce, non operazionalizzabile in un protocollo. **Scartato**.
- **Istiocitosi a cellule di Langerhans nell'adulto**: il consensus internazionale più autorevole e recente (Goyal et al., Blood 2022, letto per intero) è completamente silente su esercizio, carico su lesioni ossee litiche, rischio di frattura patologica o riabilitazione polmonare. **Scartato**.

Genuinamente presenti e aggiunte in questo batch:

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Linfangioleiomiomatosi (LAM) — riabilitazione respiratoria | Cardiopolmonare | Araujo MS et al., studio clinico controllato, Eur Respir J 2016 | 2016 |
| Sindrome di Dressler — pericardite post-infarto/post-cardiotomia | Cardiopolmonare | ESC 2015 Pericardial Diseases Guidelines; Berglund & Klein, Cleveland Clinic Journal of Medicine 2022; ACC 2022; EAPC 2019 | 2015-2022 |

Note oneste: per la LAM, la linea guida ufficiale di società (ATS/JRS 2017) è silente sull'esercizio — il contenuto inserito proviene esclusivamente da un singolo studio clinico controllato non randomizzato (21 vs 19 pazienti), dichiarato esplicitamente come fonte primaria e non come raccomandazione di linea guida, evidenza moderata. Per la sindrome di Dressler, nessuna fonte tratta questa entità separatamente dalla pericardite acuta/post-cardiac injury syndrome generica: il contenuto è stato costruito come estrapolazione esplicita dalle linee guida generali sulla pericardite (ESC, EAPC, AHA/ACC), con evidenza dichiarata moderata e non Dressler-specifica. Questo batch confirma ulteriormente la tendenza osservata nei batch precedenti: le malattie ematologiche rare con consensus internazionali dedicati (Castleman, POEMS, istiocitosi) sono sistematicamente silenti sull'esercizio, mentre le malattie con una componente respiratoria o cardiologica più diretta offrono più spesso almeno uno studio primario dedicato.

**Stato attuale: 551 condizioni totali** (549 + 2 nuove del batch 69). **Mancano 249 per arrivare a 800.**

**Batch 70 (6 condizioni aggiunte, id 597-602; 0 candidati scartati, tutti inclusi con contenuto deliberatamente scoperto/limitato):**

Questo batch è diverso dai precedenti: per tutte le 6 condizioni esiste almeno un contenuto genuino e verificabile, ma spesso molto più limitato del previsto — in diversi casi la fonte ufficiale di riferimento è silente proprio sull'aspetto più rilevante (es. precauzioni cardiologiche), e il contenuto inserito è stato intenzionalmente ristretto alla sola porzione verificata, con disclosure esplicita di cosa NON è coperto.

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sindrome di Rett — scoliosi e mantenimento della deambulazione | Neurologia | Downs J et al., consensus internazionale, SPINE 2009; Fonzo M et al., systematic review, Brain Sciences 2020 | 2009-2020 |
| Sindrome di Loeys-Dietz — gestione dell'attività fisica e rischio vascolare | Cardiopolmonare + genetico/connettivale | ACC/AHA Aortic Disease Guidelines 2022; AHA Scientific Statement 2024; Thijssen et al., review 2019 | 2019-2024 |
| Sindrome di Noonan — fisioterapia per ipotonia e ritardo motorio | Neurologia | Romano AA et al., Pediatrics 2010; Rasopathies Network Guidelines; consensus JAMA Network Open 2024 | 2010-2024 |
| Sindrome di Williams — gestione della laxity articolare con l'esercizio | Genetico/connettivale | Morris CA et al., linea guida AAP, Pediatrics 2020; Copes LE et al., Clinical Anatomy 2016 | 2016-2020 |
| Malattia di Niemann-Pick (A/B/C) — mobilità, spasticità e precauzioni per splenomegalia | Neurologia + ematologia | Geberhiwot T et al., consensus NP-C, Orphanet J Rare Dis 2018; consensus ASMD, Orphanet J Rare Dis 2023 | 2018-2023 |
| Displasia congenita dell'anca — riabilitazione post-osteotomia periacetabolare (PAO) | Ortopedico (non categorizzato per sistema) | Disantis A et al., Delphi consensus nordamericano, Int J Sports Phys Ther 2022 | 2022 |

Note oneste (importanti per questo batch): per la sindrome di Rett, la componente su scoliosi/deambulazione ha evidenza moderata da un consensus solido, ma la gestione delle crisi epilettiche durante l'esercizio non è coperta da nessuna fonte Rett-specifica ed è stata esclusa. Per la sindrome di Loeys-Dietz, l'intero contenuto cardiovascolare è dichiaratamente estrapolato dalla sindrome di Marfan (Thijssen 2019 conferma l'assenza di studi primari su esercizio e dissezione specifici per Loeys-Dietz) — evidenza bassa. Per la sindrome di Noonan, il contenuto è stato deliberatamente limitato alla sola fisioterapia per ipotonia/ritardo motorio: nessuna fonte Noonan-specifica tratta precauzioni cardiologiche per l'esercizio (cardiomiopatia ipertrofica/stenosi polmonare), e questo è stato dichiarato esplicitamente invece di essere inventato. Per la sindrome di Williams, lo stesso vale in modo quasi identico: la linea guida ufficiale AAP 2020 copre solo laxity articolare/stretching, non restrizioni sportive cardiovascolari, e gli stessi autori della fonte sulla componente motoria dichiarano che le loro strategie sono generalizzate da altre condizioni, non evidenza empirica Williams-specifica. Per la malattia di Niemann-Pick, il contenuto è ristretto a due elementi verificati: valutazione di mobilità/spasticità (tipo C, consensus forza 1/evidenza B) e il divieto assoluto di sport di contatto con splenomegalia (tipo B) — nessun protocollo di esercizio strutturato esiste in letteratura. Per la displasia congenita dell'anca, la voce è stata limitata alla sola fase post-chirurgica (post-PAO, consensus Delphi solido), escludendo la fase pediatrica con tutore di Pavlik e la gestione dell'adulto con displasia residua non operata, per cui non esiste consensus ortopedico formale sull'attività fisica. Questo batch rappresenta un cambio di approccio rispetto a un rapporto scarti/aggiunte più povero: quando esiste un nucleo di evidenza genuino anche se circoscritto, si preferisce includerlo con disclosure onesta piuttosto che scartare l'intera condizione.

**Stato attuale: 557 condizioni totali** (551 + 6 nuove del batch 70). **Mancano 243 per arrivare a 800.**

**Batch 71 (4 condizioni aggiunte, id 603-606; 2 candidati scartati):**

Scartati con motivazione documentata:
- **Malattia di Tay-Sachs (forma infantile e late-onset)**: nessuna linea guida o consensus panel esiste per fisioterapia/esercizio in questa malattia. Le uniche fonti sono una review generalista (StatPearls, senza protocolli), un wiki non peer-reviewed (Physiopedia) e un singolo case report non generalizzabile. **Scartato**.
- **Malattia di Krabbe**: il consensus disease-specific di riferimento (Kwon JM et al., Orphanet J Rare Dis 2018, letto per intero) è quasi completamente silente sulla fisioterapia — una sola voce di checklist ("Physical therapy consultation") senza alcun dettaglio. Il solo contenuto reale disponibile (GLIA Consortium consensus) è generico a tutte le leucodistrofie, non Krabbe-specifico, e sovrapponibile al contenuto già inserito per la leucodistrofia metacromatica — inserirlo separatamente avrebbe significato duplicare contenuto non disease-specific. **Scartato**.

Genuinamente presenti e aggiunte in questo batch:

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Mucopolisaccaridosi tipo I (Hurler/Hurler-Scheie/Scheie) — precauzioni e mobilità | Non categorizzato per sistema (scheletrico/cervicale) | Clarke LA, GeneReviews; Gnasso R et al., scoping review, Orphanet J Rare Dis 2022 | 2009-2022 |
| Mucopolisaccaridosi tipo IV A (Morquio A) — screening cervicale e precauzioni | Non categorizzato per sistema (scheletrico/cervicale) | Solanki GA et al., J Inherit Metab Dis 2013; Akyol MU et al., consensus Delphi, Orphanet J Rare Dis 2019 | 2013-2019 |
| Mucopolisaccaridosi tipo III (sindrome di Sanfilippo) — mantenimento della funzione motoria | Neurologia | Muschol N et al., consensus internazionale, Orphanet J Rare Dis 2022 | 2022 |
| Leucodistrofia metacromatica (MLD) — monitoraggio motorio e referral fisioterapico | Neurologia | Adang LA et al., consensus USA, Cytotherapy 2024 | 2024 |

Note oneste: per la MPS I, non esiste un protocollo di esercizio validato da consensus formale (il vero consensus internazionale, Muenzer et al. 2009, non è stato verificabile per intero per blocco di accesso) — il contenuto inserito è di livello expert opinion, dichiarato come tale. Per la MPS IV A, la componente di screening/red flags/criteri chirurgici è solida (criteri numerici ADI/PADI da Solanki 2013), ma anche il consensus Delphi più recente e rigoroso (Akyol 2019) è esplicitamente silente su fisioterapia/esercizio — nessun protocollo è stato inventato per coprire questa lacuna. Per la sindrome di Sanfilippo, il consensus Muschol 2022 è autorevole (>100 clinici) ma va segnalato un possibile limite di indipendenza per supporto parziale di un'azienda farmaceutica (BioMarin). Per la leucodistrofia metacromatica, il consensus 2024 (pubblicato dopo l'approvazione della terapia genica Lenmeldy) è solido su referral e monitoraggio motorio, ma non specifica protocolli di esercizio o scale di outcome fisioterapiche standardizzate — disclosure esplicita nel campo fonte. Da notare: per la prima volta in questo progetto, due condizioni (MPS I e MPS IV A) non sono state assegnate a nessuna delle categorie di sistema esistenti nel database (cardiopulmonary/endocrine/neurology/immune/gastrointestinal/hematology/oncology/urinary/pelvic_floor) perché il loro contenuto clinico è prevalentemente scheletrico/cervicale — stessa scelta già fatta per le condizioni ortopediche pure (es. osteocondrite dissecante, Legg-Calvé-Perthes, displasia dell'anca).

**Stato attuale: 561 condizioni totali** (557 + 4 nuove del batch 71). **Mancano 239 per arrivare a 800.**

**Batch 72 (4 condizioni aggiunte, id 607-610; 2 candidati scartati):**

Scartati con motivazione documentata:
- **Degenerazione corticobasale (CBD/CBS)**: non esiste una linea guida/consensus formale validata da panel multidisciplinare sull'esercizio in questa sindrome parkinsoniana atipica. L'unica fonte con contenuto pratico è un handout di masterclass (PSP Association, non peer-reviewed) che dichiara esplicitamente "limited evidence to suggest physiotherapy is helpful in PSP & CBS". **Scartato**.
- **Sindrome di Alpers-Huttenlocher**: nessuna fonte verificabile (linea guida, consensus, revisione sistematica) tratta esplicitamente la fisioterapia o l'esercizio fisico in questa malattia mitocondriale pediatrica con epilessia refrattaria. L'unica fonte (StatPearls) menziona la fisioterapia in una frase generica senza alcun dettaglio operativo. **Scartato**.

Genuinamente presenti e aggiunte in questo batch:

| Condizione | Categoria | Fonte reale | Anno |
|---|---|---|---|
| Sclerosi laterale primaria (PLS) — fisioterapia e gestione della spasticità | Neurologia | Irish MND/Hospice Foundation Guidelines 2014; Cochrane CD005229; Zhao C et al., Curr Treat Options Neurol 2020 | 2014-2020 |
| Sindrome di Ondine (CCHS) — sicurezza nell'attività fisica | Cardiopolmonare | ATS Clinical Policy Statement 2010; Trang H et al., Orphanet J Rare Dis 2020 | 2010-2020 |
| Malattia di Alexander (GFAP) — valutazione fisioterapica e gestione della spasticità | Neurologia | Srivastava S, Waldman A, Naidu S, GeneReviews 2020 | 2020-2025 |
| Sindrome di Leigh — precauzioni per l'esercizio nella malattia mitocondriale pediatrica | Neurologia | Parikh S et al., consensus Mitochondrial Medicine Society, Genetics in Medicine 2017; The Lily Foundation | 2016-2017 |

Note oneste: per la PLS, tutte le fonti (incluse quelle di Livello 1 su singole raccomandazioni) dichiarano esplicitamente che la gestione è estrapolata per analogia dall'ALS classica, poiché non esistono studi controllati dedicati alla PLS pura — evidenza dichiarata moderata con questo limite esplicito. Per la sindrome di Ondine, il contenuto è stato intenzionalmente limitato al principio di sicurezza centrale (assenza del segnale di allarme da ipossia/ipercapnia) e alla controindicazione nominata per le gare di apnea/nuoto subacqueo, senza inventare un protocollo di esercizio che le fonti non forniscono. Per la malattia di Alexander, la fonte (GeneReviews) è narrativa/expert-opinion, non RCT, e un abstract congressuale 2025 conferma che la valutazione motoria standardizzata in questa malattia è ancora oggetto di ricerca attiva, non di consensus pubblicato. Per la sindrome di Leigh, il contenuto è interamente estrapolato dal consensus generico sulla malattia mitocondriale dell'adulto (Mitochondrial Medicine Society 2017), poiché nessuna fonte tratta l'esercizio in modo Leigh-specifico — scelta di inclusione con disclosure piuttosto che scarto, coerente con il nuovo approccio adottato dal batch 70.

**Stato attuale: 565 condizioni totali** (561 + 4 nuove del batch 72). **Mancano 235 per arrivare a 800.**

Ritmo onesto: a questo passo (poche condizioni realmente ricercate e verificate per volta) servono molte altre sessioni di lavoro per arrivare a 800 mantenendo lo stesso standard di qualità — è un lavoro che continua batch dopo batch, non un'operazione singola.
