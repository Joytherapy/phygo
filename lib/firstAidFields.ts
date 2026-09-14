// Stable field-order constants for First Aid / BLSD content translated via
// the generic lib/contentTranslation.ts engine. Both sections live in their
// own dedicated tables (first_aid_topics + first_aid_country_protocols,
// bls_procedures) — not the shared `knowledge_base` — so they go through
// this generic engine, same pattern as Oncology/Cardiopulmonary/Manual
// Therapy.

export const FIRST_AID_TOPIC_FIELD_ORDER = ['name', 'description'] as const;
export type FirstAidTopicField = (typeof FIRST_AID_TOPIC_FIELD_ORDER)[number];

// emergency_number is deliberately excluded — it's a phone number, not
// translatable text.
export const FIRST_AID_PROTOCOL_FIELD_ORDER = ['governing_body', 'protocol', 'notes_on_differences', 'key_source'] as const;
export type FirstAidProtocolField = (typeof FIRST_AID_PROTOCOL_FIELD_ORDER)[number];

export const BLS_PROCEDURE_FIELD_ORDER = [
  'name',
  'age_group',
  'patient_position',
  'procedure',
  'key_parameters',
  'precautions',
  'evidence_note',
] as const;
export type BlsProcedureField = (typeof BLS_PROCEDURE_FIELD_ORDER)[number];
