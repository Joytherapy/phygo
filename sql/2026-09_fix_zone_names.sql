-- Fix: body_zones.name (34 rows) and brain_zones.name (14 rows) were seeded
-- entirely in ENGLISH — same class of bug as peripheral_nerves.name (see
-- sql/2026-09_fix_peripheral_nerve_names.sql), but affecting every row in
-- both tables rather than a subset.
--
-- Names below match exactly what's already used in lib/i18n/uiStrings.ts's
-- ui.bodyMap.zoneNames / ui.bodyMap.boneNames / ui.brainMap.zoneNames, so the
-- DB source of truth now agrees with the app's own translated dictionaries.
--
-- Existing cached EN/ES/FR translations in content_translations will
-- self-invalidate the next time each zone is fetched in a non-Italian
-- language (the cache key includes a hash of the current field values), so
-- no manual cache cleanup is needed.

begin;

-- body_zones (34)
update body_zones set name = 'Caviglia / Piede' where slug = 'ankle-foot';
update body_zones set name = 'Bicipite' where slug = 'biceps';
update body_zones set name = 'Polpaccio' where slug = 'calf';
update body_zones set name = 'Rachide Cervicale' where slug = 'cervical-spine';
update body_zones set name = 'Vertebre Cervicali' where slug = 'bone-cervicale';
update body_zones set name = 'Petto / Pettorali' where slug = 'chest';
update body_zones set name = 'Clavicola e Scapola' where slug = 'bone-clavicola-scapola';
update body_zones set name = 'Core / Addome' where slug = 'core-abdomen';
update body_zones set name = 'Gomito' where slug = 'elbow';
update body_zones set name = 'Femore' where slug = 'bone-femore';
update body_zones set name = 'Ossa del Piede' where slug = 'bone-piede';
update body_zones set name = 'Avambraccio' where slug = 'forearm';
update body_zones set name = 'Glutei' where slug = 'glutes';
update body_zones set name = 'Femorali' where slug = 'hamstrings';
update body_zones set name = 'Ossa della Mano' where slug = 'bone-mano';
update body_zones set name = 'Anca' where slug = 'hip';
update body_zones set name = 'Omero' where slug = 'bone-omero';
update body_zones set name = 'Ginocchio' where slug = 'knee';
update body_zones set name = 'Rachide Lombare / Schiena Bassa' where slug = 'lumbar-spine';
update body_zones set name = 'Vertebre Lombari' where slug = 'bone-lombare';
update body_zones set name = 'Bacino' where slug = 'bone-bacino';
update body_zones set name = 'Quadricipite' where slug = 'quadriceps';
update body_zones set name = 'Radio e Ulna' where slug = 'bone-radio-ulna';
update body_zones set name = 'Coste e Sterno' where slug = 'bone-coste-sterno';
update body_zones set name = 'Sacro e Coccige' where slug = 'bone-sacro';
update body_zones set name = 'Spalla' where slug = 'shoulder';
update body_zones set name = 'Cranio' where slug = 'bone-cranio';
update body_zones set name = 'Rachide Toracico / Schiena Alta' where slug = 'thoracic-spine';
update body_zones set name = 'Vertebre Toraciche' where slug = 'bone-dorsale';
update body_zones set name = 'Tibia e Perone' where slug = 'bone-tibia-perone';
update body_zones set name = 'Trapezio / Trapezio Superiore' where slug = 'trapezius';
update body_zones set name = 'Tricipite' where slug = 'triceps';
update body_zones set name = 'Corpo Intero / Equilibrio e Andatura' where slug = 'whole-body';
update body_zones set name = 'Polso / Mano' where slug = 'wrist-hand';

-- brain_zones (14)
update brain_zones set name = 'Amigdala' where slug = 'amygdala';
update brain_zones set name = 'Gangli della Base' where slug = 'basal-ganglia';
update brain_zones set name = 'Tronco Encefalico' where slug = 'brainstem';
update brain_zones set name = 'Cervelletto' where slug = 'cerebellum';
update brain_zones set name = 'Corpo Calloso' where slug = 'corpus-callosum';
update brain_zones set name = 'Lobo Frontale' where slug = 'frontal-lobe';
update brain_zones set name = 'Ippocampo' where slug = 'hippocampus';
update brain_zones set name = 'Ipotalamo' where slug = 'hypothalamus';
update brain_zones set name = 'Insula' where slug = 'insula';
update brain_zones set name = 'Lobo Occipitale' where slug = 'occipital-lobe';
update brain_zones set name = 'Lobo Parietale' where slug = 'parietal-lobe';
update brain_zones set name = 'Midollo Spinale' where slug = 'spinal-cord';
update brain_zones set name = 'Lobo Temporale' where slug = 'temporal-lobe';
update brain_zones set name = 'Talamo' where slug = 'thalamus';

commit;
