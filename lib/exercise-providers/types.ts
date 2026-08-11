export type ExerciseMedia = {
  image_url: string | null;
  gif_url: string | null;
  video_url: string | null;
};

export type ExerciseEntry = {
  internal_id: string;
  provider: string;
  provider_id: string | null;
  name: string;
  description: string | null;
  instructions: string[] | null;
  body_region: string | null;
  primary_muscle: string | null;
  secondary_muscles: string[] | null;
  equipment: string[] | null;
  difficulty: string | null;
  category: string | null;
  tags: string[] | null;
  media: ExerciseMedia | null;
  license: string | null;
  language: string;
};

export type ExerciseSearchCriteria = {
  bodyRegion?: string;
  targetMuscle?: string;
  equipment?: string[];
  keywords?: string[];
  language?: string;
};

export interface ExerciseProvider {
  searchExercises(criteria: ExerciseSearchCriteria): Promise<ExerciseEntry[]>;
  getExercise(providerId: string): Promise<ExerciseEntry | null>;
  getExercisesByBodyPart(bodyPart: string, language?: string): Promise<ExerciseEntry[]>;
  getExercisesByGoal(goal: string, language?: string): Promise<ExerciseEntry[]>;
}
