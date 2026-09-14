// Stable field-order constants for Manual Therapy content translated via the
// generic lib/contentTranslation.ts engine. Both manual_therapy_techniques
// and manual_therapy_concepts are dedicated tables (not the shared
// knowledge_base), so they go through the generic engine rather than
// lib/conditionTranslation.ts.

export const TECHNIQUE_FIELD_ORDER = [
  'name',
  'patient_position',
  'direction',
  'indications',
  'contraindications',
  'procedure',
] as const;
export type TechniqueField = (typeof TECHNIQUE_FIELD_ORDER)[number];

export const CONCEPT_FIELD_ORDER = ['name', 'framework', 'summary', 'content'] as const;
export type ConceptField = (typeof CONCEPT_FIELD_ORDER)[number];
