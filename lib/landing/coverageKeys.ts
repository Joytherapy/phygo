// Library fields whose coverage the landing page reports. Kept apart from
// landingData.ts so client components can import it without pulling in the
// Supabase client.
export type CoverageKey =
  | 'goals'
  | 'clinical_tests'
  | 'red_flags'
  | 'contraindications'
  | 'typical_exercises'
  | 'progression_criteria'
  | 'return_to_activity_criteria'
  | 'outcome_measures'
  | 'source';

export const COVERAGE_KEYS: CoverageKey[] = [
  'goals',
  'clinical_tests',
  'red_flags',
  'contraindications',
  'typical_exercises',
  'progression_criteria',
  'return_to_activity_criteria',
  'outcome_measures',
  'source',
];
