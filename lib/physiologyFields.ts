// Stable field-order constant for Physiology Concepts (foundational
// muscular/neurological physiology, not tied to a single anatomical zone —
// see sql/2026-09_physiology_concepts.sql for the table and rationale).
// Translated via the generic lib/contentTranslation.ts engine, same pattern
// as lib/urinaryFields.ts etc.

export const CONCEPT_FIELD_ORDER = ['name', 'explanation', 'clinical_relevance'] as const;
export type ConceptField = (typeof CONCEPT_FIELD_ORDER)[number];
