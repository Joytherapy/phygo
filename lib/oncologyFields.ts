// Stable field-order constants for Oncology content translated via the
// generic lib/contentTranslation.ts engine. Unlike Body Map/Brain Map,
// Oncology's conditions live in their OWN `oncology_conditions` table (not
// the shared `knowledge_base` used by the public Library, Body Map and
// Brain Map), so they go through this generic engine too rather than
// lib/conditionTranslation.ts's getTranslatedCondition().

export const STRUCTURE_FIELD_ORDER = ['name', 'anatomy', 'function', 'clinical_relevance'] as const;
export type StructureField = (typeof STRUCTURE_FIELD_ORDER)[number];

export const CONDITION_FIELD_ORDER = [
  'condition_name',
  'goals',
  'clinical_tests',
  'red_flags',
  'contraindications',
  'typical_exercises',
] as const;
export type ConditionField = (typeof CONDITION_FIELD_ORDER)[number];

export const TEST_FIELD_ORDER = ['name', 'procedure', 'interpretation'] as const;
export type TestField = (typeof TEST_FIELD_ORDER)[number];

export const REHAB_FIELD_ORDER = ['name', 'description', 'protocol', 'evidence_note'] as const;
export type RehabField = (typeof REHAB_FIELD_ORDER)[number];

export const TREATMENT_FIELD_ORDER = ['name', 'description', 'pt_implications', 'evidence_note'] as const;
export type TreatmentField = (typeof TREATMENT_FIELD_ORDER)[number];
