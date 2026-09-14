// Stable field-order constants for Cardiopulmonary content translated via the
// generic lib/contentTranslation.ts engine. Conditions in this section come
// from the SHARED `knowledge_base` table (linked via the
// `cardiopulmonary_condition_tags` bridge table), so they go through
// lib/conditionTranslation.ts's getTranslatedCondition() instead — not
// listed here. Structures, tests, rehab protocols and airway clearance
// techniques each live in their own dedicated table, so they use this
// generic engine.

export const STRUCTURE_FIELD_ORDER = ['name', 'anatomy', 'function', 'clinical_relevance'] as const;
export type StructureField = (typeof STRUCTURE_FIELD_ORDER)[number];

export const TEST_FIELD_ORDER = ['name', 'procedure', 'interpretation'] as const;
export type TestField = (typeof TEST_FIELD_ORDER)[number];

export const REHAB_FIELD_ORDER = ['name', 'description', 'protocol', 'evidence_note'] as const;
export type RehabField = (typeof REHAB_FIELD_ORDER)[number];

export const AIRWAY_FIELD_ORDER = [
  'name',
  'patient_position',
  'procedure',
  'indications',
  'contraindications_precautions',
  'evidence_note',
] as const;
export type AirwayField = (typeof AIRWAY_FIELD_ORDER)[number];
