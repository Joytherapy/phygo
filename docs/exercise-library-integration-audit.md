# Audit — Integrazione Exercise Animatic nella Exercise Library di Phygo

**Data:** 26 settembre 2026
**Ambito:** codebase Phygo (`/Users/andreastilfer/Downloads/phygo`) + database Supabase (progetto `dckmumxswheamyymerea`)
**Metodo:** ispezione diretta di codice reale (route API, componenti, tipi TypeScript) e schema reale (`information_schema.columns`, `storage.buckets`) — nessuna ipotesi, nessuna modifica a codice/dati/schema in questa fase.

---

## 1. Architettura esercizi attuale

**Non esiste oggi una "Exercise Library" unica, navigabile, con un proprio modello dati.** Il concetto di "esercizio" è frammentato in tre sistemi paralleli, non collegati tra loro:

**a) Cache Wger (solo per matching AI, nessuna UI)**
- `lib/exercise-providers/types.ts` — interfaccia `ExerciseEntry` (internal_id, provider, provider_id, name, description, instructions, body_region, primary_muscle, secondary_muscles, equipment, difficulty, category, tags, media {image_url, gif_url, video_url}, license, language).
- `lib/exercise-providers/wger.ts` — `WgerProvider`, unico provider implementato, chiama live l'API pubblica `wger.de/api/v2` (nessuna chiave richiesta), `internal_id` generato come `wger-${id}`.
- `lib/exercise-providers/cache.ts` — cache su Supabase (`exercise_cache`), `seedWgerCache` per popolamento massivo, `searchExercisesWithCache` per ricerca ILIKE.
- Route: `app/api/exercise-search/route.ts`, `app/api/exercise-intelligence/route.ts` (usa GPT-4o-mini per estrarre keyword da testo libero e fare match), `app/api/admin/seed-exercises/route.ts`.
- **Nessuna pagina UI elenca questi esercizi**: sono usati solo dietro le quinte per arricchire il testo libero scritto dal terapista.

**b) "Pro Library" (`library_items`) — contenuto curato a mano, non una libreria di 800 esercizi generici**
- `app/dashboard/library/page.tsx` (vista terapista) + `app/dashboard/library-admin/page.tsx` (CRUD).
- Gerarchia: `library_categories` → `library_subcategories` → `library_items` (oggi solo 61 item, sotto un'unica categoria "Senior Rehabilitation").
- L'interfaccia TypeScript `Item` è **duplicata identica** in due file diversi — non esiste una cartella `types/` condivisa nel repo.

**c) Prescrizione in nota clinica — testo libero, non normalizzato**
- `notes.exercises` (jsonb) contiene stringhe generate da OpenAI (`app/api/refine-exercises/route.ts`, `app/api/refine-plan/route.ts`) — **non è una relazione a nessuna entità esercizio**, solo testo strutturato a livello di prompt.
- `exercise-intelligence` prova a fare match di questo testo contro `exercise_cache`, ma il risultato arricchito non risulta mai persistito in una tabella normalizzata.

**Conclusione:** tre rappresentazioni incompatibili, nessuna condivide schema o chiavi primarie. Non c'è un "Exercise ID" unico oggi in nessuna forma.

---

## 2. Tabelle database attuali (schema esatto)

**`exercise_cache`** (697 righe, `provider` sempre `'wger'`)
```
id uuid PK default gen_random_uuid()
provider text NOT NULL
provider_id text NOT NULL
data jsonb NOT NULL          -- intero ExerciseEntry serializzato
language text NOT NULL default 'en'
cached_at timestamptz NOT NULL default now()
name text
```
Nessun UNIQUE index verificato lato DB su (provider, provider_id, language) — l'upsert lo assume solo lato applicativo. Solo lingua `en` popolata. Nessuna riga con `video_url`.

**`library_categories`** (3 righe) — `id, name, slug, description, sort_order, created_at`
**`library_subcategories`** (3 righe) — `id, category_id FK, name, slug, sort_order`
**`library_items`** (61 righe):
```
id uuid PK, subcategory_id uuid FK NOT NULL
title text NOT NULL, goal text, level text NOT NULL, body_position text NOT NULL
equipment text NOT NULL default 'None'
steps jsonb NOT NULL default '[]'
reps_duration, easier_option, harder_option, tip, safety_note text
sort_order int, image_url text, objective text, updated_at, created_at timestamptz
```
Vincoli NOT NULL stretti pensati per contenuto editoriale a mano. Nessuna colonna video, lingua o `source`/`external_id`.

**`library_item_conditions`** (0 righe, mai popolata): `item_id FK→library_items`, `condition_id FK→knowledge_base` — **unico collegamento esercizio↔condizione clinica già esistente nello schema**, ma vuoto.

**`patient_clinical_references`** (0 righe, mai usata): `patient_id, note_id, content_type text ('exercise'|'clinical_test'|...), content_id text (non FK), payload jsonb` — tabella generica pensata per collegare qualunque contenuto clinico a paziente/nota.

**`knowledge_base`** (481 condizioni): `typical_exercises` è **testo libero**, non FK.
**`rehab_phases`** (254 righe): `phase_exercises` è anch'esso **testo libero**, non riferimenti.

**Pattern traduzione riusabile già in produzione:**
- `condition_translations` (per condizioni, con `source_hash` per invalidazione).
- `content_translations`: generica — `content_type, content_id, lang, fields jsonb, source_hash` — oggi usata per 8 tipi di contenuto (fascia, oncologia, nervi periferici, ecc.), **mai per `'exercise'`**.

Tutte le tabelle hanno RLS abilitato.

---

## 3. Architettura storage attuale

**3 bucket Supabase Storage, nessun CDN/object storage esterno** (confermato: `package.json` non ha SDK AWS S3/Cloudflare/Bunny/Mux/Cloudinary).

| bucket | pubblico | limite | uso |
|---|---|---|---|
| `library-images` | sì | — | immagini `library_items`, path piatto senza cartelle |
| `avatars` | sì | — | avatar utente |
| `workspace-files` | **no (privato)** | 300MB | documenti Workspace, path `<owner_id>/<uuid>.<ext>`, signed URL 30 min |

**Nessun bucket video esiste.** Gli asset Wger sono hotlinked da wger.de in runtime — Phygo non possiede alcun file media relativo a quegli esercizi. Il pattern più vicino a ciò che servirebbe per Exercise Animatic è `workspace-files` (bucket privato, path ownership-based, signed URL).

---

## 4. Integrazione Wger esistente

Esiste, ma solo come **matching AI in background, non come catalogo navigabile**:
- Nessuna chiave API richiesta (endpoint pubblici Wger).
- `internal_id = wger-${id}` è l'unico "marker di provenienza" — non esiste una colonna `source`/`external_id` dedicata oltre a `provider`/`provider_id` (che già coprono quel ruolo).
- Seed manuale one-shot (`GET /api/admin/seed-exercises`), nessun log, nessuna garanzia di idempotenza verificata.
- **Nessuna UI** mostra questi esercizi come lista/catalogo.
- **Nessun collegamento persistito** a prescrizioni/programmi: il match arricchito torna solo nella response JSON di `exercise-intelligence`, non risulta scritto in `notes`.
- Traduzioni: `langCodeToId` mappa già IT/EN/ES/FR ma la cache è popolata **solo in inglese** — il fallback multilingua richiesto non esiste nemmeno per Wger oggi.

---

## 5. Cosa deve cambiare — valutazione onesta

Lo schema esistente **non è pronto** per l'obiettivo dichiarato:

- **Nessuna tabella "esercizio" unificata con identità stabile.** `exercise_cache` è concettualmente una cache invalidabile (nessuna garanzia di stabilità dell'id come riferimento permanente), `library_items` è pensata per contenuto editoriale manuale con vincoli NOT NULL stretti incompatibili con import bulk a metadata parziali.
- **Nessun meccanismo di dedup** (nessuna colonna `similarity_score`/`dedup_status` in nessuna tabella esistente).
- **Nessun meccanismo di import/log/idempotenza** (nessuna tabella `import_batches`/`import_log`).
- **Multilingua parzialmente risolto ma non applicato agli esercizi** — il pattern `content_translations` è il candidato naturale da estendere, ma va deciso se riusarlo (nuovo `content_type='exercise'`) o creare `exercise_translations` dedicata.
- **Asset multipli non rappresentabili** — schema attuale prevede al massimo un singolo url immagine/video, serve una tabella 1-a-molti per video 4K/FHD/720p/verticale/green-screen + immagini start/end.
- **Rischio di rottura compatibilità**: basso se si procede in modo puramente additivo (nuove tabelle); **alto se si tenta di riusare `library_items` o `exercise_cache` così come sono** — richiederebbe di allentare vincoli NOT NULL pensati per altro uso, e propagherebbe la fragilità della cache Wger (nessun UNIQUE index verificato) nel nuovo sistema permanente.
- **Debito tecnico preesistente da non ripetere**: l'interfaccia `Item` è duplicata identica in più file, nessuna cartella `types/` condivisa nel repo — qualunque nuovo modello Exercise dovrebbe centralizzare i tipi.

**Conclusione:** serve una **nuova architettura tabellare additiva**, che riusa però i punti di aggancio già esistenti: `library_item_conditions` come precedente di pattern condizione↔esercizio (da riprodurre), `content_translations` come precedente i18n, `workspace-files` come precedente di bucket privato con path ownership-based e signed URL.

---

## 6. Proposta di migrazione/import (proposta, non implementata)

### Schema tabelle proposto (additivo — nessuna modifica alle tabelle esistenti)

```sql
-- Entità esercizio unificata e permanente (fonte-agnostica)
exercises (
  id uuid PK default gen_random_uuid(),        -- ID Phygo stabile e permanente
  source text NOT NULL,                        -- 'wger' | 'exercise_animatic' | 'manual' | 'library_item'
  external_id text,                             -- id nella fonte originale
  external_ref text,                            -- es. hash nome file, per rimappare al re-import
  primary_muscle text, secondary_muscles text[], equipment text[],
  body_region text, category text, subcategory text, difficulty text, tags text[],
  metadata_complete boolean NOT NULL default false,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  archived_at timestamptz,                      -- soft-archive, mai delete automatico
  UNIQUE (source, external_id)
);

-- Traduzioni (estende il pattern content_translations esistente, oppure tabella dedicata — DA DECIDERE)
exercise_translations (
  exercise_id uuid FK→exercises.id, lang text,
  name text, instructions jsonb, tips text,
  source_hash text, updated_at timestamptz,
  PRIMARY KEY (exercise_id, lang)
);

-- Asset multipli 1-a-molti
exercise_assets (
  id uuid PK, exercise_id uuid FK→exercises.id,
  asset_type text,        -- 'video' | 'image_start' | 'image_end'
  variant text,           -- '4k' | 'fhd_horizontal' | 'fhd_vertical' | '720p' | 'greenscreen' | null
  storage_bucket text, storage_key text,
  width int, height int, duration_seconds numeric,
  created_at timestamptz default now()
);

-- Dedup contro esercizi esistenti (Wger cache + library_items)
exercise_dedup_matches (
  id uuid PK, new_exercise_id uuid FK→exercises.id,
  matched_source text,        -- 'exercise_cache' | 'library_items'
  matched_id text,
  match_status text,           -- 'EXACT' | 'LIKELY' | 'POSSIBLE' | 'NEW'
  similarity_score numeric,
  reviewed boolean default false, reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- Log import idempotente e resumibile
exercise_import_batches (
  id uuid PK, source text, started_at timestamptz, finished_at timestamptz,
  status text,  -- 'running' | 'completed' | 'failed' | 'partial'
  total_rows int, processed_rows int, error_count int
);
exercise_import_log (
  id uuid PK, batch_id uuid FK→exercise_import_batches.id,
  row_ref text,                  -- riga Excel/identificativo sorgente, per resume
  exercise_id uuid FK→exercises.id,
  status text,                    -- 'created' | 'updated' | 'skipped_duplicate' | 'error'
  error_message text, created_at timestamptz default now(),
  UNIQUE (batch_id, row_ref)      -- garantisce idempotenza sul re-import
);

-- Riuso del pattern library_item_conditions per il link condizione↔esercizio
exercise_conditions (
  exercise_id uuid FK→exercises.id, condition_id bigint FK→knowledge_base.id,
  PRIMARY KEY (exercise_id, condition_id)
);
```

Come rispetta i vincoli già dati dall'utente:
- **Niente cancellazioni automatiche**: solo `archived_at`, mai delete via pipeline.
- **Niente duplicati al re-import**: `UNIQUE(source, external_id)` su `exercises` + `UNIQUE(batch_id, row_ref)` su `exercise_import_log`.
- **ID Phygo stabile**: `exercises.id` non cambia mai; il legame con la fonte resta tramite `(source, external_id)`.
- **Log resumibile**: chiave `(batch_id, row_ref)` permette di riprendere un batch interrotto saltando le righe già processate.

### Pipeline di import (alto livello)

1. **Parsing Excel** → normalizzazione righe, validazione campi minimi, marcatura `metadata_complete`.
2. **Matching/dedup** contro `exercise_cache` (697) e `library_items` (61) → scritto in `exercise_dedup_matches`, **senza auto-merge**: LIKELY/POSSIBLE richiedono revisione umana.
3. **Creazione entità** in `exercises` + `exercise_translations`, upsert idempotente su `(source, external_id)`.
4. **Upload storage**: nuovo bucket privato dedicato (es. `exercise-media`, path `<exercise_id>/<asset_type>-<variant>.<ext>`, signed URL), popolamento `exercise_assets`.
5. **Log**: `exercise_import_batches`/`exercise_import_log` per ogni riga.
6. **Collegamento clinico**: popolamento opzionale `exercise_conditions`, integrazione con `patient_clinical_references` (content_type='exercise') per l'uso nelle note pazienti.

---

## Rischi e raccomandazione di migrazione

1. **Non riusare `library_items` né `exercise_cache` come tabella di destinazione** — vincoli/garanzie pensate per altro uso, propagherebbero fragilità nel nuovo sistema permanente.
2. **`exercise_cache` upsert non ha UNIQUE index verificato lato DB** — da correggere comunque, indipendentemente dal nuovo progetto.
3. **`library_item_conditions` e `patient_clinical_references` sono vuote oggi** — pattern giusto da riusare ma non ancora validato in produzione con dati reali.
4. **Serve un nuovo bucket privato dedicato** (`exercise-media`, sul modello `workspace-files`) — `library-images` (pubblico, path piatto) non è adatto a migliaia di video/immagini ad alta risoluzione.
5. **Multilingua**: decisione da prendere — estendere `content_translations` (coerente col resto del sistema, 8 content_type già presenti) vs. tabella `exercise_translations` dedicata (più esplicita per un volume grande come questo). Nessuna delle due è "sbagliata"; è una scelta di coerenza architetturale.
6. **Debito tecnico da non ripetere**: introdurre un modulo tipi condiviso (es. `lib/exercises/types.ts`) invece di duplicare interfacce come già avvenuto per `Item`.

**File/tabelle chiave citati** (riferimento diretto per l'implementazione): `lib/exercise-providers/{types.ts,wger.ts,cache.ts}`, `app/api/{exercise-search,exercise-intelligence,refine-exercises,refine-plan,admin/seed-exercises}/route.ts`, `app/api/library/{admin,list}/route.ts`, `app/dashboard/{library,library-admin}/page.tsx`, `app/api/workspace/files/signed-url/route.ts` — tabelle `exercise_cache`, `library_categories`, `library_subcategories`, `library_items`, `library_item_conditions`, `patient_clinical_references`, `knowledge_base`, `rehab_phases`, `content_translations`, `condition_translations`, `notes` — bucket `library-images`/`avatars`/`workspace-files`.

**Nessuna modifica a codice, schema o dati è stata eseguita in questa fase — solo lettura, come richiesto.**
