// What a patient may see of a session note in My Phygo. The note itself holds
// the clinician's working record: subjective and objective findings, the
// assessment, the plan and the AI-drafted clinical reasoning (hypotheses,
// differentials, red flags), which may not have been reviewed. None of that is
// sent to the patient. Only what was written for them is: the summary for the
// patient and the exercise plan, plus the note's id and date.
//
// Exercises keep only what the patient needs to do them; internal fields
// (clinical_check, source_type, provider ids, debug keywords) are dropped.

export type PatientExercise =
  | string
  | {
      name: string;
      description: string | null;
      instructions: string[] | null;
      media: { image_url: string | null; gif_url: string | null; video_url: string | null } | null;
      dosing: {
        sets: number | null;
        reps: number | null;
        duration_seconds: number | null;
        frequency_per_week: number | null;
        notes: string | null;
      } | null;
    };

export type PatientNote = {
  id: string;
  created_at: string;
  summary_for_patient: string | null;
  exercises: PatientExercise[];
};

/** Columns read for the patient: never select('*'). */
export const PATIENT_NOTE_COLUMNS = 'id, created_at, summary_for_patient, exercises';

const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const url = (v: unknown) => (typeof v === 'string' && /^https:\/\//.test(v) ? v : null);

function patientExercise(ex: unknown): PatientExercise | null {
  if (typeof ex === 'string') return ex.trim() ? ex : null;
  if (!ex || typeof ex !== 'object') return null;
  const e = ex as Record<string, any>;
  const name = text(e.name);
  if (!name) return null;
  const media = e.media && typeof e.media === 'object' ? { image_url: url(e.media.image_url), gif_url: url(e.media.gif_url), video_url: url(e.media.video_url) } : null;
  const d = e.dosing && typeof e.dosing === 'object' ? e.dosing : null;
  return {
    name,
    description: text(e.description),
    instructions: Array.isArray(e.instructions) ? e.instructions.filter((s: unknown): s is string => typeof s === 'string' && !!s.trim()) : null,
    media,
    dosing: d
      ? { sets: num(d.sets), reps: num(d.reps), duration_seconds: num(d.duration_seconds), frequency_per_week: num(d.frequency_per_week), notes: text(d.notes) }
      : null,
  };
}

export function toPatientNote(row: Record<string, unknown>): PatientNote {
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    summary_for_patient: text(row.summary_for_patient),
    exercises: (Array.isArray(row.exercises) ? row.exercises : []).map(patientExercise).filter((e): e is PatientExercise => e !== null),
  };
}
