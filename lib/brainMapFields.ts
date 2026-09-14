// Stable field-order constants for Brain Map content translated via the
// generic lib/contentTranslation.ts engine. Keeping each list's order (and
// membership) IDENTICAL across every route that touches that content type
// is what keeps the (content_type, content_id, lang) cache row shared and
// valid everywhere that content is used — e.g. a peripheral nerve is
// translated with the exact same field set whether the request comes from
// the nerve list or the nerve detail page, so switching between the two
// views never forces a re-translation.

export const NERVE_FIELD_ORDER = [
  'name',
  'origin',
  'anatomy',
  'motor_function',
  'sensory_function',
  'compression_site',
  'clinical_sign',
] as const;
export type NerveField = (typeof NERVE_FIELD_ORDER)[number];

export const ZONE_INFO_FIELD_ORDER = [
  'anatomy',
  'connections',
  'function',
  'clinicalRelevance',
  'vascularSupply',
] as const;
export type ZoneInfoField = (typeof ZONE_INFO_FIELD_ORDER)[number];

export const PATHWAY_FIELD_ORDER = ['title', 'subtitle', 'route', 'description'] as const;
export type PathwayField = (typeof PATHWAY_FIELD_ORDER)[number];

export const GAIT_FIELD_ORDER = ['name', 'origin', 'description'] as const;
export type GaitField = (typeof GAIT_FIELD_ORDER)[number];

export const LOCALIZATION_FIELD_ORDER = ['title', 'content'] as const;
export type LocalizationField = (typeof LOCALIZATION_FIELD_ORDER)[number];

export const GERIATRIC_FIELD_ORDER = ['title', 'content'] as const;
export type GeriatricField = (typeof GERIATRIC_FIELD_ORDER)[number];

export const NERVE_INJURY_FIELD_ORDER = ['name', 'severity', 'description'] as const;
export type NerveInjuryField = (typeof NERVE_INJURY_FIELD_ORDER)[number];

// diameter/velocity are pure measurements (μm, m/s) — identical in every
// language, so they're deliberately excluded from translation to save calls.
export const CONDUCTION_FIELD_ORDER = ['name', 'myelination', 'function'] as const;
export type ConductionField = (typeof CONDUCTION_FIELD_ORDER)[number];
