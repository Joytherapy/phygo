-- ============================================================================
-- Body Map: 14 new skeletal ("X-ray mode") zones + their pathology library.
-- Idempotent: every statement is guarded (WHERE NOT EXISTS), safe to re-run.
-- Run this as one transaction in the Supabase SQL Editor.
--
-- Slugs match BONE_ORDER already shipped in components/BodyMap3D.tsx -- do
-- not rename them without also updating that component.
--
-- 13 of the 42 zone<->condition links reuse EXISTING knowledge_base rows
-- (checked against your full condition_name list) instead of duplicating
-- content already in the library:
--   52 Sindrome dello stretto toracico            -> bone-clavicola-scapola
--   19 Capsulite adesiva (spalla congelata)        -> bone-omero
--   53 Frattura di radio distale                   -> bone-radio-ulna
--   64 Frattura dello scafoide                     -> bone-mano
--   76 Dito a scatto (tenosinovite stenosante)     -> bone-mano
--   21 Pubalgia/dolore inguinale da adduttori       -> bone-bacino
--    9 Spondilite anchilosante (spondiloartrite assiale) -> bone-sacro
--   60 Frattura d'anca (post-chirurgica, anziano)  -> bone-femore
--   30 Sindrome del dolore trocanterico            -> bone-femore
--   58 Sindrome del tunnel tarsale                 -> bone-piede
--   28 Radicolopatia cervicale                     -> bone-cervicale
--   95 Mielopatia cervicale spondilotica           -> bone-cervicale
--   45 Stenosi spinale lombare con claudicatio neurogena -> bone-lombare
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) body_zones -- 14 new rows
-- ----------------------------------------------------------------------------

INSERT INTO body_zones (name, slug, view, sort_order)
SELECT v.name, v.slug, v.view, v.sort_order
FROM (VALUES
  ('Skull',                 'bone-cranio',              'front', 101),
  ('Clavicle & Scapula',    'bone-clavicola-scapola',   'front', 102),
  ('Ribs & Sternum',        'bone-coste-sterno',        'front', 103),
  ('Humerus',               'bone-omero',               'front', 104),
  ('Radius & Ulna',         'bone-radio-ulna',          'front', 105),
  ('Hand Bones',            'bone-mano',                'front', 106),
  ('Pelvis',                'bone-bacino',              'front', 107),
  ('Sacrum & Coccyx',       'bone-sacro',               'back',  108),
  ('Femur',                 'bone-femore',              'front', 109),
  ('Tibia & Fibula',        'bone-tibia-perone',        'front', 110),
  ('Foot Bones',            'bone-piede',               'front', 111),
  ('Cervical Vertebrae',    'bone-cervicale',           'front', 112),
  ('Thoracic Vertebrae',    'bone-dorsale',             'back',  113),
  ('Lumbar Vertebrae',      'bone-lombare',             'back',  114)
) AS v(name, slug, view, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM body_zones z WHERE z.slug = v.slug);

-- ----------------------------------------------------------------------------
-- 2) knowledge_base -- 28 new condition rows
--    (id is an identity column; let Postgres assign it, link by name below)
-- ----------------------------------------------------------------------------

INSERT INTO knowledge_base
  (condition_name, condition_keywords, goals, clinical_tests, red_flags,
   contraindications, typical_exercises, progression_criteria,
   return_to_activity_criteria, outcome_measures, source, source_date, evidence_level)
SELECT v.condition_name, v.condition_keywords, v.goals, v.clinical_tests, v.red_flags,
       v.contraindications, v.typical_exercises, v.progression_criteria,
       v.return_to_activity_criteria, v.outcome_measures, v.source, v.source_date, v.evidence_level
FROM (VALUES

('Disfunzione temporo-mandibolare (DTM)',
 'disfunzione temporo-mandibolare,DTM,temporomandibular disorder,TMD,temporomandibular joint dysfunction',
 'Ridurre dolore mio-fasciale masticatorio, ripristinare apertura orale simmetrica e fluida, ridurre click/blocco articolare.',
 'Misurazione apertura orale attiva/passiva, palpazione dei masseteri e pterigoidei, valutazione della deviazione mandibolare in apertura, screening del rachide cervicale superiore.',
 'Trisma acuto post-traumatico, gonfiore/asimmetria facciale improvvisa, sospetta frattura condilare -- riferire per imaging.',
 'Evitare mobilizzazioni forzate in fase acuta infiammatoria; cautela in pazienti con storia di lussazione ricorrente del disco.',
 'Mobilizzazione attiva controllata dell''apertura, esercizi di rilassamento dei masticatori, terapia manuale su masseteri/temporali, trattamento associato del rachide cervicale superiore.',
 'Apertura orale >35-40mm senza dolore, assenza di click/blocco funzionalmente limitante, ripresa masticazione normale.',
 'Apertura orale funzionale senza dolore, masticazione normale senza click/blocco limitante.',
 'Jaw Functional Limitation Scale (JFLS), scala VAS per il dolore, misurazione dell''apertura orale in mm.',
 'Schiffman E, Ohrbach R, et al. Diagnostic Criteria for Temporomandibular Disorders (DC/TMD) for Clinical and Research Applications. J Oral Facial Pain Headache.',
 '2014', 'moderate'),

('Vertigine posizionale post-trauma cranico lieve',
 'vertigine posizionale,BPPV post-traumatico,benign paroxysmal positional vertigo,post-traumatic BPPV',
 'Risoluzione della vertigine posizionale, ripristino della fiducia nel movimento della testa, riduzione del rischio di caduta.',
 'Dix-Hallpike, roll test, screening vestibolare e oculomotorio di base.',
 'Cefalea a insorgenza improvvisa e severa, deficit neurologici focali, alterazione dello stato di coscienza -- riferire con urgenza.',
 'Manovre di riposizionamento canalitico controindicate in instabilita cervicale non esclusa o sospetta lesione vascolare cervicale.',
 'Manovre di riposizionamento (es. Epley) se BPPV confermata, esercizi di abituazione vestibolare, training dell''equilibrio progressivo.',
 'Test posizionali negativi, assenza di vertigine nelle attivita quotidiane, normalizzazione dell''equilibrio dinamico.',
 'Test posizionali negativi, assenza di vertigine nelle attivita quotidiane e alla guida.',
 'Dizziness Handicap Inventory (DHI), scala VAS per intensita/frequenza della vertigine.',
 'Bhattacharyya N, et al. Clinical Practice Guideline: Benign Paroxysmal Positional Vertigo (Update). Otolaryngol Head Neck Surg.',
 '2017', 'high'),

('Trauma cranico lieve (commozione cerebrale) -- ritorno graduale all''attivita',
 'commozione cerebrale,trauma cranico lieve,concussione,concussion,mild traumatic brain injury,mTBI',
 'Gestire in sicurezza il periodo di recupero, prevenire il second-impact syndrome, ripristinare la tolleranza allo sforzo fisico e cognitivo secondo un percorso graduato.',
 'Screening dei sintomi post-commotivi (cefalea, capogiro, affaticamento, difficolta di concentrazione), test di tolleranza allo sforzo submassimale, screening vestibolo-oculomotorio.',
 'Peggioramento della cefalea, vomito ripetuto, confusione crescente, perdita di coscienza, convulsioni, asimmetria pupillare -- riferire con urgenza (sospetta emorragia intracranica).',
 'Evitare il ritorno allo sport/attivita ad alto rischio di nuovo trauma prima del completamento di tutte le fasi del protocollo graduato e della piena risoluzione dei sintomi.',
 'Protocollo a fasi graduate (riposo relativo iniziale breve, poi attivita aerobica leggera, attivita sport-specifica senza contatto, allenamento completo senza contatto, ritorno al contatto pieno), ciascuna della durata minima di 24h se asintomatica.',
 'Assenza di sintomi a riposo e sotto sforzo ad ogni fase prima di progredire alla successiva, autorizzazione medica al ritorno allo sport.',
 'Completamento di tutte le fasi del protocollo graduato senza ricomparsa dei sintomi, autorizzazione medica.',
 'Sport Concussion Assessment Tool (SCAT6), Post-Concussion Symptom Scale (PCSS).',
 'Patricios JS, et al. Consensus Statement on Concussion in Sport: Amsterdam 2022. Br J Sports Med.',
 '2023', 'high'),

('Frattura di clavicola',
 'frattura di clavicola,frattura claveare,clavicle fracture,collarbone fracture',
 'Consolidamento osseo sicuro, recupero progressivo di mobilita di spalla, prevenzione della rigidita scapolo-omerale secondaria.',
 'Palpazione del focolaio, valutazione della deformita/accorciamento, controllo neurovascolare distale (plesso brachiale, vasi succlavi).',
 'Deficit neurovascolare distale, frattura esposta, tenting cutaneo severo -- gestione chirurgica urgente.',
 'Evitare carico e mobilizzazione attiva contro resistenza prima del consolidamento clinico/radiografico iniziale.',
 'Mobilizzazione passiva/attiva assistita precoce entro il range tollerato, progressione a rinforzo del cingolo scapolare una volta consolidata.',
 'Consolidamento radiografico, ROM di spalla funzionale, assenza di dolore al focolaio sotto carico progressivo.',
 'Consolidamento radiografico, ROM di spalla funzionale, forza comparabile al lato controlaterale per il ritorno allo sport da contatto.',
 'DASH (Disabilities of the Arm, Shoulder and Hand), Constant-Murley Score.',
 'Robinson CM. Fractures of the clavicle in the adult: epidemiology and classification. J Bone Joint Surg Br.',
 '1998', 'high'),

('Discinesia scapolare',
 'discinesia scapolare,scapular dyskinesis,scapular dyskinesia',
 'Ripristinare un ritmo scapolo-omerale fisiologico, ridurre il sovraccarico compensatorio su cuffia dei rotatori e struttura sub-acromiale.',
 'Scapular Assistance Test, Scapular Retraction Test, osservazione dinamica del winging/tilting scapolare durante elevazione del braccio.',
 'Winging scapolare marcato e persistente con debolezza isolata (possibile lesione del nervo toracico lungo/accessorio) -- approfondire prima di trattare come discinesia posturale.',
 'Nessuna specifica; evitare protocolli di rinforzo che aumentano il conflitto sub-acromiale in presenza di dolore acuto.',
 'Rinforzo di trapezio inferiore e dentato anteriore, rieducazione del controllo scapolare durante gesti funzionali, stretching del piccolo pettorale se accorciato.',
 'Normalizzazione del pattern scapolare osservato clinicamente, riduzione del dolore associato, ripresa dei gesti sportivi/lavorativi specifici.',
 'Pattern scapolare normalizzato durante gesti sport-specifici ad alta velocita, assenza di dolore.',
 'Scapular Dyskinesis Test (osservazionale), DASH, Y-Balance Test upper quarter.',
 'Kibler WB, et al. Clinical Implications of Scapular Dyskinesis in Shoulder Injury: The 2013 Consensus Statement from the ''Scapular Summit''. Br J Sports Med.',
 '2013', 'moderate'),

('Frattura costale',
 'frattura costale,frattura delle coste,rib fracture',
 'Gestione del dolore per permettere respirazione efficace e tosse valida, prevenzione delle complicanze polmonari (atelettasia, polmonite).',
 'Palpazione mirata del focolaio, valutazione dell''espansione toracica, saturazione periferica, screening della qualita della tosse.',
 'Fratture multiple con movimento paradosso (flail chest), dispnea ingravescente, enfisema sottocutaneo -- emergenza respiratoria.',
 'Evitare bendaggi costrittivi del torace (riducono l''espansione polmonare e aumentano il rischio di atelettasia).',
 'Esercizi di respirazione diaframmatica e di espansione costale, tecniche di tosse assistita/controllata, mobilizzazione precoce.',
 'Respirazione profonda senza dolore limitante, tosse efficace, assenza di segni di complicanza respiratoria.',
 'Tosse efficace e indolore, nessun segno di complicanza respiratoria, ripresa delle attivita quotidiane complete.',
 'VAS per il dolore respiratorio/alla tosse, spirometria incentivante (volume inspiratorio).',
 'Kasotakis G, et al. Operative fixation of rib fractures after blunt trauma: A practice management guideline from the EAST. J Trauma Acute Care Surg.',
 '2017', 'moderate'),

('Costocondrite (sindrome di Tietze)',
 'costocondrite,sindrome di Tietze,costochondritis,Tietze syndrome',
 'Riduzione del dolore parasternale, esclusione di cause cardiache, ripresa delle attivita senza timore ingiustificato.',
 'Palpazione delle giunzioni condro-sternali (riproduce il dolore), esclusione di segni cardiaci/respiratori acuti.',
 'Dolore toracico con irradiazione tipica, dispnea acuta, sudorazione, storia cardiovascolare significativa -- escludere causa cardiaca prima di trattare.',
 'Nessuna specifica una volta escluse cause cardiopolmonari.',
 'Terapia manuale locale, mobilizzazione toracica, gestione del carico in attivita che riproducono il sintomo, rassicurazione clinica.',
 'Risoluzione della dolorabilita palpatoria, ripresa completa delle attivita quotidiane/sportive.',
 'Assenza di dolorabilita palpatoria, ripresa completa dello sport/attivita lavorativa.',
 'VAS, questionario di impatto funzionale generico.',
 'Proulx AM, Zryd TW. Costochondritis: diagnosis and treatment. Am Fam Physician.',
 '2009', 'low'),

('Disfunzione articolare costo-vertebrale/costo-trasversaria',
 'disfunzione costo-vertebrale,blocco costale,rib dysfunction,costovertebral joint dysfunction',
 'Ridurre il dolore toracico meccanico da ipomobilita/blocco articolare costale, ripristinare la meccanica respiratoria e la rotazione toracica.',
 'Palpazione segmentale costo-vertebrale, valutazione dell''espansione toracica asimmetrica, test di mobilita in rotazione del rachide dorsale.',
 'Dolore toracico atipico con sintomi sistemici (dispnea, sudorazione, irradiazione tipica) -- escludere causa cardiopolmonare prima di trattare come meccanico.',
 'Cautela con tecniche manipolative ad alta velocita in osteoporosi severa o sospetta frattura costale non consolidata.',
 'Mobilizzazione manuale segmentale costo-vertebrale, esercizi di respirazione con enfasi sull''espansione asimmetrica, mobilita toracica in rotazione/estensione.',
 'Normalizzazione dell''espansione toracica, riduzione del dolore nei movimenti respiratori e di rotazione, ripresa delle attivita complete.',
 'Espansione toracica simmetrica, assenza di dolore nei movimenti di rotazione/respirazione profonda.',
 'Misurazione dell''espansione toracica (cirtometria), VAS.',
 'Lee D. The Thorax: An Integrated Approach, 2nd ed.',
 '2017', 'low'),

('Frattura del collo chirurgico dell''omero',
 'frattura del collo chirurgico dell''omero,frattura omero prossimale,proximal humerus fracture,surgical neck fracture',
 'Consolidamento sicuro, recupero funzionale della spalla, prevenzione della capsulite adesiva secondaria all''immobilizzazione.',
 'Controllo neurovascolare (nervo ascellare, arteria ascellare), valutazione ROM passivo progressivo, classificazione radiografica (Neer).',
 'Deficit sensitivo della "regimental badge area" (nervo ascellare), assenza di polso distale, frattura esposta.',
 'Evitare mobilizzazione attiva precoce contro resistenza in fratture instabili prima di indicazione medica/chirurgica di carico.',
 'Pendolari (Codman) precoci se stabile, mobilizzazione passiva/attiva assistita progressiva, rinforzo di cuffia dei rotatori nelle fasi successive.',
 'Consolidamento confermato, ROM funzionale per le ADL, forza sufficiente per attivita quotidiane senza compenso scapolare eccessivo.',
 'Consolidamento confermato, ROM funzionale per le ADL, forza sufficiente per attivita bimanuali sopra la testa.',
 'Constant-Murley Score, DASH, ROM goniometrico di spalla.',
 'Neer CS 2nd. Displaced proximal humeral fractures: part I. Classification and evaluation. J Bone Joint Surg Am.',
 '1970', 'high'),

('Frattura diafisaria omerale con neuroaprassia del nervo radiale',
 'frattura diafisaria omerale,paralisi del nervo radiale,humeral shaft fracture,radial nerve palsy',
 'Monitoraggio del recupero nervoso, prevenzione di rigidita articolare e retrazioni durante il periodo di attesa del recupero neurologico, mantenimento del trofismo.',
 'Valutazione della forza di estensione di polso/dita (mano cadente), sensibilita del dorso della mano, follow-up seriato con EMG se il recupero non progredisce.',
 'Assenza di segni di recupero clinico dopo il periodo atteso -- riferire per valutazione chirurgica/neurologica.',
 'Evitare stiramento prolungato dei muscoli estensori denervati; tutore antideclive per prevenire l''allungamento eccessivo del tendine.',
 'Tutore posturale per polso/dita, mobilizzazione passiva per mantenere l''escursione articolare, stimolazione e rinforzo progressivo non appena riprende attivita motoria.',
 'Recupero della contrazione volontaria degli estensori, normalizzazione della funzione della mano, consolidamento osseo confermato.',
 'Recupero della funzione motoria del nervo radiale o piena compensazione funzionale, consolidamento osseo confermato.',
 'DASH, valutazione manuale della forza degli estensori di polso/dita (scala MRC).',
 'Shao YC, et al. Radial nerve palsy associated with fractures of the shaft of the humerus: a systematic review. J Bone Joint Surg Br.',
 '2005', 'moderate'),

('Frattura di Monteggia/Galeazzi',
 'frattura di Monteggia,frattura di Galeazzi,Monteggia fracture,Galeazzi fracture',
 'Ripristino della stabilita radio-ulnare e della prono-supinazione, prevenzione della rigidita post-chirurgica.',
 'Valutazione della stabilita radio-ulnare distale/prossimale, ROM di prono-supinazione, controllo del nervo interosseo posteriore (Monteggia).',
 'Instabilita radio-ulnare persistente dopo trattamento, deficit del nervo interosseo posteriore non in miglioramento.',
 'Evitare prono-supinazione forzata prima del consolidamento/stabilizzazione chirurgica confermata.',
 'Mobilizzazione protetta e progressiva della prono-supinazione, rinforzo di avambraccio e polso nelle fasi avanzate.',
 'Prono-supinazione simmetrica e non dolorosa, stabilita radio-ulnare clinicamente confermata, ripresa delle attivita manuali complete.',
 'Prono-supinazione simmetrica, stabilita radio-ulnare confermata clinicamente/per imaging, ripresa delle attivita manuali complete.',
 'DASH, ROM di prono-supinazione in gradi.',
 'Bado JL. The Monteggia lesion. Clin Orthop Relat Res.',
 '1967', 'moderate'),

('Lesione della membrana interossea (lesione di Essex-Lopresti)',
 'lesione di Essex-Lopresti,instabilita radio-ulnare longitudinale,Essex-Lopresti lesion,longitudinal radioulnar dissociation',
 'Riconoscere precocemente l''instabilita longitudinale radio-ulnare, prevenire la migrazione prossimale del radio, ripristinare stabilita e funzione del gomito/polso.',
 'Valutazione della stabilita radio-ulnare distale, dolore al polso associato a frattura della testa radiale, imaging mirato se sospetto clinico (spesso misconosciuta inizialmente).',
 'Dolore al polso persistente dopo frattura/resezione della testa radiale non spiegato da altre cause -- sospettare lesione della membrana interossea fino a prova contraria.',
 'Evitare la resezione isolata della testa radiale senza valutare la stabilita della membrana interossea/DRUJ, se il quadro e compatibile con Essex-Lopresti.',
 'Gestione post-chirurgica secondo protocollo specifico (spesso protezione prolungata della prono-supinazione), mobilizzazione progressiva sotto stretto controllo della stabilita radio-ulnare.',
 'Stabilita radio-ulnare mantenuta nel tempo, assenza di migrazione prossimale del radio ai controlli, funzione di prensione e prono-supinazione soddisfacente.',
 'Stabilita radio-ulnare mantenuta ai controlli, funzione di prensione soddisfacente.',
 'DASH, ROM di gomito/polso, imaging di controllo per la migrazione radiale.',
 'Essex-Lopresti P. Fractures of the radial head with distal radio-ulnar dislocation. J Bone Joint Surg Br.',
 '1951', 'low'),

('Rizoartrosi (artrosi trapezio-metacarpale)',
 'rizoartrosi,artrosi trapezio-metacarpale,artrosi base del pollice,thumb CMC osteoarthritis,basal joint arthritis',
 'Riduzione del dolore in presa/pinza, mantenimento della funzione del pollice nelle attivita quotidiane.',
 'Grind test, valutazione della forza di pinza e presa, osservazione della deformita a Z in stadi avanzati.',
 'Nessuna red flag specifica; escludere componente infiammatoria sistemica se poliarticolare/simmetrica.',
 'Evitare esercizi di pinza in resistenza durante le riacutizzazioni dolorose.',
 'Ortesi di stabilizzazione del pollice, esercizi di mobilita protetta, rinforzo progressivo della muscolatura tenar, adattamento delle attivita ad alto carico di pinza.',
 'Riduzione del dolore nelle attivita quotidiane, forza di pinza funzionale, minor ricorso all''ortesi.',
 'Riduzione del dolore nelle attivita di pinza quotidiane, forza funzionale, ridotta necessita di ortesi.',
 'DASH, Patient-Rated Wrist/Hand Evaluation, forza di pinza dinamometrica.',
 'Eaton RG, Glickel SZ. Trapeziometacarpal osteoarthritis. Staging as a rationale for treatment. Hand Clin.',
 '1987', 'moderate'),

('Frattura pelvica da fragilita (branche ilio-ischio-pubiche)',
 'frattura pelvica da fragilita,frattura da insufficienza del bacino,pelvic fragility fracture,pelvic insufficiency fracture',
 'Mobilizzazione precoce sicura, prevenzione delle complicanze da immobilita (tromboembolia, decondizionamento), recupero della deambulazione autonoma.',
 'Valutazione del carico tollerato, test di compressione/distrazione pelvica con cautela, screening del dolore a riposo vs sotto carico.',
 'Instabilita emodinamica, dolore severo sproporzionato, sospetta lesione associata (vescicale, vascolare) -- a maggior ragione dopo trauma ad alta energia.',
 'Evitare test provocativi pelvici aggressivi in fase acuta senza stabilita confermata.',
 'Mobilizzazione progressiva con carico secondo tolleranza, training del cammino con ausili, rinforzo dei muscoli dell''anca in scarico prima del carico completo.',
 'Carico completo indolore, deambulazione autonoma sicura, assenza di dolore a riposo.',
 'Carico completo indolore, deambulazione autonoma sicura, ritorno al livello funzionale pre-frattura.',
 'Timed Up and Go (TUG), scala di mobilita funzionale, VAS.',
 'Rommens PM, Hofmann A. Comprehensive classification of fragility fractures of the pelvic ring: Recommendations for surgical treatment. Injury.',
 '2013', 'moderate'),

('Disfunzione sacro-iliaca',
 'disfunzione sacro-iliaca,dolore sacro-iliaco,sacroiliac joint dysfunction,SI joint pain',
 'Riduzione del dolore lombo-pelvico, ripristino del controllo motorio e della stabilita della cintura pelvica.',
 'Cluster di provocazione sacro-iliaca (thigh thrust, compressione, distrazione, Gaenslen), test di controllo motorio del bacino.',
 'Dolore notturno ingravescente non meccanico, febbre associata (sospetta sacroileite infettiva/infiammatoria) -- approfondire.',
 'Nessuna specifica; cautela con manipolazioni ad alta velocita in gravidanza o osteoporosi severa.',
 'Esercizi di stabilizzazione del core e della cintura pelvica, terapia manuale mirata, rieducazione del pattern di carico durante cammino/trasferimenti.',
 'Riduzione/scomparsa del dolore nei test di provocazione, ripresa delle attivita funzionali senza compenso doloroso.',
 'Cluster di test di provocazione negativizzato, ripresa delle attivita funzionali/sportive senza compenso doloroso.',
 'Oswestry Disability Index (ODI), VAS.',
 'Laslett M. Evidence-based diagnosis and treatment of the painful sacroiliac joint. J Man Manip Ther.',
 '2008', 'moderate'),

('Coccigodinia',
 'coccigodinia,dolore al coccige,coccydynia,tailbone pain',
 'Riduzione del dolore in posizione seduta, ripristino della tolleranza funzionale alla seduta prolungata.',
 'Palpazione esterna/interna del coccige (con consenso e formazione appropriata), valutazione posturale della seduta.',
 'Dolore notturno ingravescente, perdita di peso inspiegata, sanguinamento rettale associato -- approfondire per escludere cause non muscoloscheletriche.',
 'Evitare la pressione diretta prolungata sul coccige durante il trattamento e nella vita quotidiana (seduta prolungata su superfici rigide).',
 'Cuscino a ciambella/a cuneo per scaricare il coccige, terapia manuale del pavimento pelvico se indicata, correzione posturale della seduta.',
 'Tolleranza alla seduta prolungata senza dolore, ripresa delle attivita quotidiane complete.',
 'Tolleranza alla seduta prolungata (oltre 30-60 minuti) senza dolore significativo.',
 'VAS specifica per la posizione seduta, questionario di impatto funzionale.',
 'Lirette LS, et al. Coccydynia: an overview of the anatomy, etiology, and treatment of coccyx pain. Ochsner J.',
 '2014', 'low'),

('Frattura sacrale da insufficienza',
 'frattura sacrale da insufficienza,sacral insufficiency fracture,sacral stress fracture',
 'Gestione del dolore, mobilizzazione progressiva secondo tolleranza, prevenzione del decondizionamento nell''anziano.',
 'Sospetto clinico in presenza di lombalgia bassa persistente nell''anziano senza trauma significativo; conferma per imaging (RM piu sensibile della radiografia standard).',
 'Deficit neurologico agli arti inferiori o sfinterico (sospetta compromissione delle radici sacrali) -- riferire con urgenza.',
 'Evitare carico assiale elevato e manipolazioni dirette in fase acuta prima della stabilizzazione clinica.',
 'Mobilizzazione protetta e progressiva, training del cammino con ausili secondo tolleranza al dolore, gestione della postura seduta/sdraiata.',
 'Riduzione del dolore a riposo e sotto carico, ripresa della deambulazione funzionale.',
 'Deambulazione funzionale autonoma, assenza di dolore a riposo.',
 'Timed Up and Go (TUG), VAS a riposo e sotto carico.',
 'Lyders EM, et al. Imaging and treatment of sacral insufficiency fractures. AJNR Am J Neuroradiol.',
 '2010', 'low'),

('Frattura diafisaria femorale (post-chiodo endomidollare)',
 'frattura diafisaria femorale,femoral shaft fracture',
 'Recupero di ROM di anca e ginocchio, rinforzo muscolare progressivo, ripristino del pattern di cammino fisiologico.',
 'ROM attivo/passivo di anca e ginocchio, forza del quadricipite, valutazione della simmetria del passo.',
 'Dolore acuto ingravescente con gonfiore severo della coscia (sospetta sindrome compartimentale), segni di trombosi venosa profonda.',
 'Rispettare il carico protetto secondo indicazione chirurgica fino a segni di consolidamento.',
 'Mobilizzazione precoce di anca/ginocchio, rinforzo isometrico poi progressivamente concentrico/eccentrico del quadricipite, training del cammino progressivo.',
 'Consolidamento radiografico, ROM funzionale, forza e pattern di cammino simmetrici.',
 'Consolidamento radiografico, forza e pattern di cammino simmetrici, autorizzazione al carico completo.',
 'Lower Extremity Functional Scale (LEFS), ROM di ginocchio/anca, test di forza del quadricipite.',
 'Winquist RA, Hansen ST. Comminuted fractures of the femoral shaft treated by intramedullary nailing. Orthop Clin North Am.',
 '1980', 'high'),

('Frattura tibiale acuta (gestione post-chirurgica)',
 'frattura tibiale,frattura di tibia,tibial shaft fracture',
 'Prevenzione della sindrome compartimentale nella fase acuta, recupero progressivo del carico e della funzione di cammino.',
 'Valutazione del dolore sproporzionato/tensione dei compartimenti nella fase acuta, ROM di ginocchio/caviglia, progressione del carico secondo indicazione.',
 'Dolore sproporzionato e ingravescente, parestesie distali, pallore/assenza di polso (sindrome compartimentale acuta) -- emergenza chirurgica.',
 'Rispettare rigorosamente il carico protetto indicato fino a segni di consolidamento.',
 'Mobilizzazione precoce di ginocchio e caviglia entro i limiti consentiti, rinforzo progressivo, training del cammino con ausili e progressione del carico.',
 'Consolidamento confermato, carico completo indolore, pattern di cammino simmetrico.',
 'Consolidamento confermato, carico completo indolore, pattern di cammino simmetrico.',
 'LEFS, misurazione della pressione intracompartimentale se indicata, ROM di ginocchio/caviglia.',
 'McQueen MM, Gaston P, Court-Brown CM. Acute compartment syndrome: who is at risk? J Bone Joint Surg Br.',
 '2000', 'high'),

('Frattura malleolare (Weber)',
 'frattura malleolare,classificazione di Weber,malleolar fracture,Weber classification,ankle fracture',
 'Recupero di mobilita di caviglia, forza e propriocezione, prevenzione dell''instabilita cronica.',
 'ROM di caviglia, forza dei muscoli peronieri, test di stabilita (in fase avanzata secondo tolleranza), squat monopodalico per la funzione globale.',
 'Segni di instabilita della sindesmosi persistente, dolore acuto ingravescente post-chirurgico (sospetta complicanza).',
 'Rispettare il carico protetto secondo indicazione fino al consolidamento/stabilita confermata della sindesmosi.',
 'Mobilizzazione progressiva di caviglia, rinforzo dei peronieri, training propriocettivo su superfici instabili nelle fasi avanzate.',
 'ROM di caviglia funzionale, forza simmetrica, buona performance ai test propriocettivi prima del ritorno allo sport/lavoro.',
 'ROM funzionale, forza simmetrica, buona performance propriocettiva prima del ritorno allo sport/lavoro.',
 'Foot and Ankle Ability Measure (FAAM), ROM di caviglia, test propriocettivi (single leg balance).',
 'Weber BG. Die Verletzungen des oberen Sprunggelenkes, 2nd ed. Bern: Hans Huber.',
 '1972', 'high'),

('Sindrome compartimentale cronica da sforzo',
 'sindrome compartimentale cronica da sforzo,chronic exertional compartment syndrome,CECS',
 'Ridurre il dolore da overuse indotto dall''aumento di pressione intracompartimentale durante l''esercizio, permettere il ritorno alla corsa/attivita senza recidiva.',
 'Anamnesi tipica (dolore che compare a un tempo/intensita di sforzo prevedibile e si risolve rapidamente a riposo), misurazione della pressione intracompartimentale pre/post sforzo (gold standard diagnostico).',
 'Dolore che non si risolve a riposo, progressivo deficit sensitivo/motorio (sospetta evoluzione verso sindrome compartimentale acuta) -- differenziare con urgenza dalla forma cronica.',
 'Evitare la prosecuzione dell''attivita ad alta intensita che riproduce sistematicamente i sintomi senza prima modificare volume/tecnica di carico.',
 'Modifica della tecnica di corsa (cadenza, pattern di appoggio), gestione del carico di allenamento (riduzione temporanea e ripresa graduale), rinforzo della muscolatura della gamba.',
 'Aumento della soglia di sforzo prima della comparsa dei sintomi, ripresa progressiva del volume di allenamento precedente senza recidiva.',
 'Aumento della soglia di sforzo prima della comparsa dei sintomi, ripresa del volume di allenamento precedente senza recidiva.',
 'Misurazione della pressione intracompartimentale pre/post sforzo, VAS durante attivita standardizzata.',
 'Pedowitz RA, et al. Modified criteria for the objective diagnosis of chronic compartment syndrome of the leg. Am J Sports Med.',
 '1990', 'moderate'),

('Frattura da stress metatarsale',
 'frattura da stress metatarsale,metatarsal stress fracture',
 'Gestione del carico per permettere la guarigione ossea, ripresa graduale dell''attivita senza recidiva.',
 'Palpazione mirata del metatarso, test di carico/salto monopodalico (se tollerato), valutazione dei fattori di carico allenante.',
 'Dolore che persiste a riposo e peggiora progressivamente nonostante scarico (possibile evoluzione a frattura completa/mancata unione).',
 'Evitare la ripresa immediata di corsa/salti ad alto impatto prima della risoluzione della sintomatologia a riposo.',
 'Scarico relativo iniziale, ripresa progressiva del carico secondo tolleranza al dolore, correzione dei fattori di carico allenante (volume, superficie, calzatura).',
 'Assenza di dolore a riposo e alla palpazione, tolleranza progressiva al carico da impatto, ripresa graduale dell''attivita sportiva.',
 'Assenza di dolore a riposo/palpazione, tolleranza progressiva al carico da impatto, protocollo di ritorno alla corsa completato.',
 'FAAM, VAS, valutazione dei fattori di carico allenante.',
 'Iwamoto J, Takeda T. Stress fractures in athletes: review of 196 cases. J Orthop Sci.',
 '2003', 'moderate'),

('Frattura del collo dell''astragalo',
 'frattura del collo dell''astragalo,talar neck fracture',
 'Monitoraggio del rischio di necrosi avascolare, recupero progressivo di carico e mobilita della caviglia/sottoastragalica.',
 'ROM di caviglia e sottoastragalica, follow-up per segni radiografici di necrosi avascolare (segno di Hawkins), valutazione del carico tollerato.',
 'Segni clinici/radiografici di necrosi avascolare, dolore persistente sproporzionato al consolidamento atteso -- riferire per rivalutazione ortopedica.',
 'Rispettare rigorosamente le restrizioni di carico indicate, dato l''alto rischio di complicanze vascolari di questo osso.',
 'Mobilizzazione protetta secondo tolleranza, progressione del carico molto graduale e guidata da indicazione medica/imaging, rinforzo del tricipite surale nelle fasi avanzate.',
 'Assenza di segni di necrosi avascolare, consolidamento confermato, carico completo funzionale.',
 'Assenza di segni di necrosi avascolare, consolidamento confermato, carico completo funzionale.',
 'FAAM, imaging di controllo per segni di necrosi avascolare (segno di Hawkins).',
 'Hawkins LG. Fractures of the neck of the talus. J Bone Joint Surg Am.',
 '1970', 'moderate'),

('Frattura del dente dell''epistrofeo (C2)',
 'frattura del dente dell''epistrofeo,frattura odontoidea,odontoid fracture,dens fracture',
 'Gestione secondo il percorso medico/chirurgico indicato; una volta stabilizzata, recupero progressivo e sicuro di mobilita e controllo neuromuscolare cervicale.',
 'Screening di instabilita cervicale alta e di segni di compromissione midollare prima di qualsiasi intervento fisioterapico attivo.',
 'Segni di mielopatia (parestesie diffuse, alterazione dell''andatura, iperreflessia), instabilita non consolidata -- controindicazione assoluta a mobilizzazione/manipolazione fino a consolidamento/stabilizzazione confermata.',
 'Manipolazione e mobilizzazione ad alta velocita del rachide cervicale alto controindicate fino a piena stabilita ossea confermata dal team medico.',
 'Nella fase post-stabilizzazione: esercizi di controllo motorio cervicale a basso carico, mobilizzazione progressiva secondo indicazione medica, rieducazione posturale.',
 'Stabilita confermata dal team medico, ROM cervicale progressivo senza segni neurologici, controllo neuromuscolare funzionale.',
 'Stabilita confermata dal team medico/chirurgico, ROM cervicale progressivo senza segni neurologici.',
 'Neck Disability Index (NDI), scala neurologica standardizzata (ASIA se coinvolgimento midollare).',
 'Anderson LD, D''Alonzo RT. Fractures of the odontoid process of the axis. J Bone Joint Surg Am.',
 '1974', 'high'),

('Frattura vertebrale da compressione osteoporotica (dorso-lombare)',
 'frattura vertebrale da compressione,frattura da compressione osteoporotica,vertebral compression fracture,osteoporotic compression fracture',
 'Gestione del dolore acuto, prevenzione dell''accentuazione della cifosi, mantenimento della funzione respiratoria e dell''autonomia.',
 'Valutazione della postura in cifosi, palpazione dei processi spinosi, screening del dolore con i cambi di posizione (supino-seduto-stazione eretta).',
 'Dolore notturno ingravescente non meccanico, deficit neurologico agli arti inferiori, storia di neoplasia (frattura patologica da sospettare).',
 'Evitare flessione del tronco sotto carico e manipolazioni dirette sul livello fratturato in fase acuta.',
 'Esercizi di estensione toracica/lombare leggera secondo tolleranza, rinforzo posturale, training respiratorio, educazione alla gestione dei carichi quotidiani.',
 'Riduzione del dolore nei cambi di posizione, mantenimento/miglioramento della postura, ripresa delle attivita quotidiane sicure.',
 'Riduzione del dolore nei cambi di posizione e nel carico, ripresa delle attivita quotidiane sicure.',
 'Oswestry Disability Index (ODI), VAS, misurazione dell''angolo di cifosi.',
 'Genant HK, et al. Vertebral fracture assessment using a semiquantitative technique. J Bone Miner Res.',
 '1993', 'high'),

('Scoliosi idiopatica dell''adolescente (curva dorsale)',
 'scoliosi idiopatica dell''adolescente,adolescent idiopathic scoliosis,AIS',
 'Monitoraggio della progressione della curva, mantenimento/miglioramento della funzione respiratoria e della simmetria posturale.',
 'Test di Adams (forward bend), misurazione della gobba costale, follow-up radiografico dell''angolo di Cobb secondo indicazione medica.',
 'Progressione rapida della curva, dolore significativo (atipico nella scoliosi idiopatica non complicata, da approfondire), segni neurologici associati.',
 'Nessuna specifica per l''esercizio terapeutico; il bracing, se indicato, segue protocolli medici dedicati.',
 'Esercizi specifici per la scoliosi (es. approccio Schroth), rinforzo posturale asimmetrico mirato, training respiratorio.',
 'Stabilita o riduzione dell''angolo di Cobb nel follow-up, miglioramento della simmetria posturale e della funzione respiratoria.',
 'Stabilita/riduzione dell''angolo di Cobb nel follow-up, piena partecipazione alle attivita fisiche.',
 'Angolo di Cobb radiografico, Scoliosis Research Society-22 (SRS-22) questionnaire.',
 'Negrini S, et al. 2016 SOSORT guidelines: orthopaedic and rehabilitation treatment of idiopathic scoliosis during growth. Scoliosis Spinal Disord.',
 '2018', 'high'),

('Morbo di Scheuermann (cifosi giovanile)',
 'morbo di Scheuermann,cifosi di Scheuermann,Scheuermann''s disease,Scheuermann''s kyphosis',
 'Ottimizzare la postura e la mobilita toracica durante la fase di crescita, prevenire l''accentuazione della cifosi strutturale, gestire il dolore associato.',
 'Test di Adams con valutazione del profilo sagittale, misurazione della cifosi toracica, radiografia per il rilievo dei tipici corpi vertebrali a cuneo/irregolarita dei piatti (noduli di Schmorl).',
 'Dolore notturno severo, deficit neurologico associato (raro nella forma tipica, da approfondire se presente).',
 'Evitare carichi assiali eccessivi ripetuti (es. sollevamento pesi ad alto carico) durante le fasi di rapida crescita in presenza di cifosi marcata sintomatica.',
 'Esercizi di estensione toracica ed estensori spinali, stretching della catena anteriore (pettorali, ileopsoas), educazione posturale, monitoraggio della progressione durante la crescita.',
 'Stabilizzazione o miglioramento del profilo posturale, riduzione del dolore, mantenimento della partecipazione alle attivita fisiche.',
 'Stabilizzazione del profilo posturale, mantenimento della partecipazione alle attivita fisiche.',
 'Misurazione della cifosi toracica (goniometro/inclinometro), SRS-22.',
 'Palazzo C, et al. Scheuermann''s disease: an update. Joint Bone Spine.',
 '2014', 'low'),

('Spondilolistesi istmica L5-S1',
 'spondilolistesi istmica,scivolamento vertebrale,isthmic spondylolisthesis,spondylolisthesis',
 'Stabilizzazione funzionale del segmento, riduzione del dolore meccanico, ottimizzazione del controllo motorio lombo-pelvico.',
 'Test di instabilita segmentale (prone instability test), valutazione del controllo motorio lombare, screening neurologico se sintomi radicolari associati.',
 'Deficit neurologico progressivo, sintomi radicolari bilaterali con disfunzione sfinterica (sospetta stenosi severa associata) -- approfondire.',
 'Cautela con iperestensione lombare ripetuta sotto carico (es. alcuni gesti ginnici/sportivi) in fase sintomatica.',
 'Esercizi di stabilizzazione segmentale (multifido, trasverso dell''addome), rinforzo del core in posizione neutra, educazione al controllo del movimento lombare.',
 'Riduzione del dolore meccanico, miglioramento del controllo motorio ai test specifici, ripresa delle attivita funzionali/sportive.',
 'Controllo motorio lombo-pelvico soddisfacente ai test specifici, ripresa delle attivita funzionali/sportive senza dolore.',
 'Oswestry Disability Index (ODI), grado di Meyerding al follow-up radiografico.',
 'Meyerding HW. Spondylolisthesis. Surg Gynecol Obstet.',
 '1932', 'moderate')

) AS v(condition_name, condition_keywords, goals, clinical_tests, red_flags,
       contraindications, typical_exercises, progression_criteria,
       return_to_activity_criteria, outcome_measures, source, source_date, evidence_level)
WHERE NOT EXISTS (
  SELECT 1 FROM knowledge_base k WHERE k.condition_name = v.condition_name
);

-- ----------------------------------------------------------------------------
-- 3) body_zone_conditions -- 42 links (14 zones x 3 conditions each)
-- ----------------------------------------------------------------------------

INSERT INTO body_zone_conditions (zone_id, condition_id)
SELECT z.id, k.id
FROM (VALUES
  -- (zone slug, condition_name-or-NULL, existing_condition_id-or-NULL)
  ('bone-cranio',              'Disfunzione temporo-mandibolare (DTM)', NULL),
  ('bone-cranio',              'Vertigine posizionale post-trauma cranico lieve', NULL),
  ('bone-cranio',              'Trauma cranico lieve (commozione cerebrale) -- ritorno graduale all''attivita', NULL),

  ('bone-clavicola-scapola',   'Frattura di clavicola', NULL),
  ('bone-clavicola-scapola',   'Discinesia scapolare', NULL),
  ('bone-clavicola-scapola',   NULL, 52), -- Sindrome dello stretto toracico

  ('bone-coste-sterno',        'Frattura costale', NULL),
  ('bone-coste-sterno',        'Costocondrite (sindrome di Tietze)', NULL),
  ('bone-coste-sterno',        'Disfunzione articolare costo-vertebrale/costo-trasversaria', NULL),

  ('bone-omero',               'Frattura del collo chirurgico dell''omero', NULL),
  ('bone-omero',               'Frattura diafisaria omerale con neuroaprassia del nervo radiale', NULL),
  ('bone-omero',               NULL, 19), -- Capsulite adesiva (spalla congelata)

  ('bone-radio-ulna',          NULL, 53), -- Frattura di radio distale
  ('bone-radio-ulna',          'Frattura di Monteggia/Galeazzi', NULL),
  ('bone-radio-ulna',          'Lesione della membrana interossea (lesione di Essex-Lopresti)', NULL),

  ('bone-mano',                NULL, 64), -- Frattura dello scafoide
  ('bone-mano',                'Rizoartrosi (artrosi trapezio-metacarpale)', NULL),
  ('bone-mano',                NULL, 76), -- Dito a scatto (tenosinovite stenosante)

  ('bone-bacino',              'Frattura pelvica da fragilita (branche ilio-ischio-pubiche)', NULL),
  ('bone-bacino',              'Disfunzione sacro-iliaca', NULL),
  ('bone-bacino',              NULL, 21), -- Pubalgia/dolore inguinale da adduttori

  ('bone-sacro',               'Coccigodinia', NULL),
  ('bone-sacro',               'Frattura sacrale da insufficienza', NULL),
  ('bone-sacro',               NULL, 9),  -- Spondilite anchilosante (spondiloartrite assiale)

  ('bone-femore',              NULL, 60), -- Frattura d'anca (post-chirurgica, anziano)
  ('bone-femore',              'Frattura diafisaria femorale (post-chiodo endomidollare)', NULL),
  ('bone-femore',              NULL, 30), -- Sindrome del dolore trocanterico

  ('bone-tibia-perone',        'Frattura tibiale acuta (gestione post-chirurgica)', NULL),
  ('bone-tibia-perone',        'Frattura malleolare (Weber)', NULL),
  ('bone-tibia-perone',        'Sindrome compartimentale cronica da sforzo', NULL),

  ('bone-piede',               'Frattura da stress metatarsale', NULL),
  ('bone-piede',               'Frattura del collo dell''astragalo', NULL),
  ('bone-piede',               NULL, 58), -- Sindrome del tunnel tarsale

  ('bone-cervicale',           'Frattura del dente dell''epistrofeo (C2)', NULL),
  ('bone-cervicale',           NULL, 28), -- Radicolopatia cervicale
  ('bone-cervicale',           NULL, 95), -- Mielopatia cervicale spondilotica

  ('bone-dorsale',             'Frattura vertebrale da compressione osteoporotica (dorso-lombare)', NULL),
  ('bone-dorsale',             'Scoliosi idiopatica dell''adolescente (curva dorsale)', NULL),
  ('bone-dorsale',             'Morbo di Scheuermann (cifosi giovanile)', NULL),

  ('bone-lombare',             'Frattura vertebrale da compressione osteoporotica (dorso-lombare)', NULL),
  ('bone-lombare',             'Spondilolistesi istmica L5-S1', NULL),
  ('bone-lombare',             NULL, 45)  -- Stenosi spinale lombare con claudicatio neurogena

) AS link(zone_slug, condition_name, existing_condition_id)
JOIN body_zones z ON z.slug = link.zone_slug
JOIN knowledge_base k
  ON (link.condition_name IS NOT NULL AND k.condition_name = link.condition_name)
  OR (link.existing_condition_id IS NOT NULL AND k.id = link.existing_condition_id)
WHERE NOT EXISTS (
  SELECT 1 FROM body_zone_conditions bzc
  WHERE bzc.zone_id = z.id AND bzc.condition_id = k.id
);

COMMIT;

-- ----------------------------------------------------------------------------
-- Sanity check after running: every one of the 14 new zones should show
-- exactly 3 linked conditions.
-- ----------------------------------------------------------------------------
-- select z.slug, count(*) as n_conditions
-- from body_zones z
-- join body_zone_conditions bzc on bzc.zone_id = z.id
-- where z.slug like 'bone-%'
-- group by z.slug
-- order by z.slug;
