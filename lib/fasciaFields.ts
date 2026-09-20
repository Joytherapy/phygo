// Stable field-order constants for Fascia content translated via the
// generic lib/contentTranslation.ts engine. All three Fascia tables
// (fascia_structures, fascia_function, fascia_treatments) are simple
// dedicated tables — none of them route through the shared
// `knowledge_base` / lib/conditionTranslation.ts pattern, so this file
// follows the same shape as lib/endocrineFields.ts and lib/oncologyFields.ts.

export const STRUCTURE_FIELD_ORDER = ['name', 'anatomy', 'function', 'clinical_relevance'] as const;
export type StructureField = (typeof STRUCTURE_FIELD_ORDER)[number];

export const FUNCTION_FIELD_ORDER = ['name', 'description', 'clinical_relevance'] as const;
export type FunctionField = (typeof FUNCTION_FIELD_ORDER)[number];

export const TREATMENT_FIELD_ORDER = ['name', 'description', 'pt_implications', 'evidence_note'] as const;
export type TreatmentField = (typeof TREATMENT_FIELD_ORDER)[number];

export const REHAB_FIELD_ORDER = ['name', 'description', 'protocol', 'evidence_note'] as const;
export type RehabField = (typeof REHAB_FIELD_ORDER)[number];
