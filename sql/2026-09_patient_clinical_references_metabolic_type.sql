-- Consente il nuovo content_type 'metabolic_profile' su
-- patient_clinical_references (necessario perche' il Calcolatore Metabolico
-- possa comparire nel "Piano di trattamento e riferimenti clinici" del
-- paziente, come gli altri strumenti clinici).
--
-- Se la colonna content_type ha un vincolo CHECK che elenca esplicitamente i
-- valori ammessi (es. 'exercise','clinical_test','questionnaire','condition',
-- 'anatomical_zone','product'), quel vincolo bloccherebbe l'inserimento del
-- nuovo valore. Questo script lo trova dinamicamente (il nome esatto non e'
-- noto) e lo rimuove, cosi' la colonna resta libera di accettare anche i
-- content_type introdotti in futuro senza bisogno di nuove migrazioni --
-- la validazione dei valori ammessi resta comunque lato applicazione
-- (TypeScript). Se non esiste alcun vincolo di questo tipo, lo script non fa
-- nulla (idempotente, sicuro da rieseguire).

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
  where rel.relname = 'patient_clinical_references'
    and con.contype = 'c'
    and att.attname = 'content_type';

  if constraint_name is not null then
    execute format('alter table patient_clinical_references drop constraint %I', constraint_name);
  end if;
end $$;
