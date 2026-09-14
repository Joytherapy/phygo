-- Phygo Events — popola event_sources con 13 provider verificati (14/09/2026)
-- CORRETTO in base allo schema reale della tabella (già esistente, creata
-- con lo schema Events iniziale): colonne id/name/source_type/base_url/
-- active/created_at, NIENTE website_url/is_active come avevo ipotizzato
-- prima — uso base_url e active che esistono già, aggiungo solo le colonne
-- che mancano davvero. Nessun vincolo CHECK su source_type: uso il valore
-- descrittivo 'course_provider' per tutte le righe di questo giro.
-- Idempotente: puoi rieseguire questo file in futuro (ON CONFLICT su name).

ALTER TABLE event_sources ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE event_sources ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE event_sources ADD COLUMN IF NOT EXISTS courses_note text;
ALTER TABLE event_sources ADD COLUMN IF NOT EXISTS sort_order integer not null default 0;

CREATE UNIQUE INDEX IF NOT EXISTS event_sources_name_key ON event_sources (name);

INSERT INTO event_sources (name, source_type, base_url, active, country, description, courses_note, sort_order) VALUES
('FisioScience', 'course_provider', 'https://www.fisioscience.it', true, 'Italy', 'Corsi ECM pratici di 2-3 giorni in diverse città italiane su terapia manuale, esercizio terapeutico e riabilitazione ortopedica.', 'Molte edizioni all''anno, stessa formazione ripetuta in più città.', 10),
('New Master', 'course_provider', 'https://newmaster.it', true, 'Italy', 'Percorsi certificativi multi-modulo (Concetto Maitland, COMT, Bobath, CRAFTA, Sport Certificate), sedi principali Roma e Milano.', 'Calendario ricco, molti percorsi a più moduli su più mesi.', 20),
('PhisioVit', 'course_provider', 'https://corsiecm-phisiovit.it', true, 'Italy', 'Ampio calendario di corsi ECM e master in tutta Italia, dal pavimento pelvico alla certificazione in fisioterapia sportiva.', 'Uno dei calendari più fitti tra i provider italiani.', 30),
('FisioMaster', 'course_provider', 'https://www.fisiomaster.it', true, 'Italy', 'Piattaforma di formazione online con centinaia di video-lezioni e crediti ECM cumulativi.', 'Abbonamento annuale, non eventi datati: da consultare direttamente sul sito.', 40),
('Physiotutors', 'course_provider', 'https://www.physiotutors.com', true, 'Netherlands', 'Corsi pratici in presenza su valutazione e trattamento ortopedico e neurologico, presso la loro sede a Velserbroek.', NULL, 50),
('MVClinic', 'course_provider', 'https://www.mvclinic.es', true, 'Spain', 'Corsi di ecografia muscoloscheletrica e neuromodulazione percutanea a Madrid e Barcellona.', NULL, 60),
('FisioFocus', 'course_provider', 'https://www.fisiofocus.com', true, 'Spain', 'Corsi di fisioterapia oncologica ed esercizio terapeutico neurologico a Madrid e Barcellona.', NULL, 70),
('Physiopark Akademie', 'course_provider', 'https://www.physiopark-akademie.eu', true, 'Germany', 'Simposi e corsi interprofessionali, in presenza e ibridi, a Berlino.', NULL, 80),
('Odnova Szkolenia', 'course_provider', 'https://odnova.org.pl', true, 'Poland', 'Corsi su terapia linfatico-fasciale, fisioterapia respiratoria e disturbi del movimento in diverse città polacche.', NULL, 90),
('Institute of Physical Art', 'course_provider', 'https://instituteofphysicalart.com', true, 'United States', 'Corsi pratici di mobilizzazione funzionale in diverse sedi USA, incluse più location a New York.', NULL, 100),
('Herman & Wallace Pelvic Rehabilitation Institute', 'course_provider', 'https://hermanwallace.com', true, 'United States', 'Il provider statunitense di riferimento per la formazione in riabilitazione del pavimento pelvico.', NULL, 110),
('Evidence In Motion', 'course_provider', 'https://evidenceinmotion.com', true, 'United States', 'Corsi ibridi (online + presenza) su ortopedia e dry needling in varie città USA.', NULL, 120),
('ITMP', 'course_provider', 'https://www.itmp.fr', true, 'France', 'Percorsi di formazione in kinésithérapie du sport e terapia manuale in diverse città francesi.', NULL, 130)
ON CONFLICT (name) DO UPDATE SET
  source_type = EXCLUDED.source_type,
  base_url = EXCLUDED.base_url,
  active = EXCLUDED.active,
  country = EXCLUDED.country,
  description = EXCLUDED.description,
  courses_note = EXCLUDED.courses_note,
  sort_order = EXCLUDED.sort_order;
