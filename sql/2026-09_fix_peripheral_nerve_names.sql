-- Fix: peripheral_nerves.name was seeded in ENGLISH for all 17 rows
-- (seed-peripheral-nerves.js), unlike every other text field on this table
-- (origin/anatomy/motor_function/sensory_function/compression_site/
-- clinical_sign), which was correctly authored in Italian from the start.
--
-- Every other section of the app assumes Italian source content and
-- translates on demand (lib/contentTranslation.ts short-circuits for
-- lang='it', returning the raw DB value unchanged) — so with an English
-- `name`, Italian-mode users saw English nerve names, exactly as reported.
--
-- This only corrects `name`. Existing cached translations for these nerves
-- in content_translations (content_type = 'peripheral_nerve') will
-- self-invalidate the next time each nerve is fetched in a non-Italian
-- language, because translateContent's cache key includes a hash of the
-- current field values — once `name` changes here, the old hash no longer
-- matches, so EN/ES/FR translations regenerate automatically from the
-- corrected Italian name. No manual cache cleanup needed.

begin;

update peripheral_nerves set name = 'Plesso Brachiale' where slug = 'brachial-plexus';
update peripheral_nerves set name = 'Plesso Lombosacrale' where slug = 'lumbosacral-plexus';
update peripheral_nerves set name = 'Nervo Mediano' where slug = 'median-nerve';
update peripheral_nerves set name = 'Nervo Ulnare' where slug = 'ulnar-nerve';
update peripheral_nerves set name = 'Nervo Radiale' where slug = 'radial-nerve';
update peripheral_nerves set name = 'Nervo Muscolocutaneo' where slug = 'musculocutaneous-nerve';
update peripheral_nerves set name = 'Nervo Ascellare' where slug = 'axillary-nerve';
update peripheral_nerves set name = 'Nervo Toracico Lungo' where slug = 'long-thoracic-nerve';
update peripheral_nerves set name = 'Nervo Sciatico' where slug = 'sciatic-nerve';
update peripheral_nerves set name = 'Nervo Femorale' where slug = 'femoral-nerve';
update peripheral_nerves set name = 'Nervo Otturatorio' where slug = 'obturator-nerve';
update peripheral_nerves set name = 'Nervo Tibiale' where slug = 'tibial-nerve';
update peripheral_nerves set name = 'Nervo Peroneale Comune' where slug = 'common-peroneal-nerve';
update peripheral_nerves set name = 'Nervo Peroneale Superficiale' where slug = 'superficial-peroneal-nerve';
update peripheral_nerves set name = 'Nervo Peroneale Profondo' where slug = 'deep-peroneal-nerve';
update peripheral_nerves set name = 'Nervo Cutaneo Femorale Laterale' where slug = 'lateral-femoral-cutaneous-nerve';
update peripheral_nerves set name = 'Nervo Accessorio Spinale (XI nervo cranico)' where slug = 'spinal-accessory-nerve';

commit;
