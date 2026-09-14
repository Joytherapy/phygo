// Stable field-order constant for the hardcoded Orthopedic Tests dataset
// (lib/orthopedicTestsContent.ts), translated via the generic
// lib/contentTranslation.ts engine. All five fields are free-text clinical
// prose authored in Italian — there is no backing DB table and no
// enum/filter column to preserve, so every field is translatable.
//
// Keep this array IDENTICAL wherever an orthopedic test is translated (only
// app/api/clinical-tools/orthopedic-tests/route.ts today) so the
// (content_type, content_id, lang) cache row stays shared and valid.

export const TEST_FIELD_ORDER = ['name', 'targets', 'procedure', 'positive', 'accuracy'] as const;
export type TestField = (typeof TEST_FIELD_ORDER)[number];
