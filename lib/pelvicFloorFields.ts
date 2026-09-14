// Stable field-order constants for the DB-backed Pelvic Floor Atlas content
// (`pelvic_floor_tests`, `pelvic_floor_structures`, `pelvic_floor_rehab`),
// translated via the generic lib/contentTranslation.ts engine — same pattern
// as lib/cardiopulmonaryFields.ts / lib/manualTherapyFields.ts. `category` is
// a real DB column used for grouping/filtering, so it is deliberately
// excluded here and instead given a translated display label via
// ui.clinicalToolkit.pelvicFloor.categoryLabels / ui.pelvicFloorAtlas.*
// categoryLabels, keeping the exact DB value as the dictionary key.
// Conditions in this section come from the SHARED `knowledge_base` table
// (linked via the `pelvic_floor_condition_tags` bridge table), so they go
// through lib/conditionTranslation.ts's getTranslatedCondition() instead —
// not listed here.

export const TEST_FIELD_ORDER = ['name', 'procedure', 'interpretation'] as const;
export type TestField = (typeof TEST_FIELD_ORDER)[number];

export const STRUCTURE_FIELD_ORDER = ['name', 'anatomy', 'function', 'clinical_relevance'] as const;
export type StructureField = (typeof STRUCTURE_FIELD_ORDER)[number];

export const REHAB_FIELD_ORDER = ['name', 'description', 'protocol', 'evidence_note'] as const;
export type RehabField = (typeof REHAB_FIELD_ORDER)[number];
