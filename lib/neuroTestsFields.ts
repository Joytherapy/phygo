// Stable field-order constant for the DB-backed Neurology test library
// (`neuro_tests`, the Clinical Toolkit "Neurology" tab's cranial nerve /
// reflex / sensation / strength / coordination / balance-gait test list),
// translated via the generic lib/contentTranslation.ts engine — same
// pattern as lib/pelvicFloorFields.ts and lib/manualTherapyFields.ts.
// `category` is a real DB column used for grouping/filtering, so it is
// deliberately excluded here and instead given a translated display label
// via ui.clinicalToolkit.neuro.categoryLabels, keeping the exact DB value
// as the dictionary key.

export const TEST_FIELD_ORDER = ['name', 'procedure', 'interpretation'] as const;
export type TestField = (typeof TEST_FIELD_ORDER)[number];
