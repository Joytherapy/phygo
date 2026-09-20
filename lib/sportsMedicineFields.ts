export const SPORTS_MEDICINE_FIELD_ORDER = ['name', 'explanation', 'clinical_relevance'] as const;
export type SportsMedicineField = (typeof SPORTS_MEDICINE_FIELD_ORDER)[number];
