// exercise_translations.instructions is jsonb and is normally an array of
// steps. One imported exercise (alternating_oblique_sit_ups, 12 Oct 2026)
// stores them as a single numbered string ("1. ... 2. ..."), which crashed the
// exercise detail modal (it calls .map on the steps). Normalising here keeps
// every row displayable without touching the stored data.
export function normalizeInstructions(value: unknown): string[] | null {
  if (Array.isArray(value)) return value.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
  if (typeof value !== 'string' || !value.trim()) return null;
  const steps = value
    .split(/\n+|(?:^|\s)(?=\d{1,2}\.\s)/)
    .map((s) => s.replace(/^\s*\d{1,2}\.\s*/, '').trim())
    .filter(Boolean);
  return steps.length ? steps : null;
}
