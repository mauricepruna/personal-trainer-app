export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "full_body";

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "full_body",
];

export interface EquipmentType {
  id: string;
  name: string;
  icon: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_groups: MuscleGroup[];
  equipment_id: string | null;
  instructions: string | null;
  video_url: string | null;
  created_by: string | null;
}

export interface ExerciseWithEquipment extends Exercise {
  equipment: EquipmentType | null;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  rest_sec: number | null;
  order_index: number;
}

export interface WorkoutExerciseWithDetails extends WorkoutExercise {
  exercise: Exercise;
}

export interface WorkoutWithExercises extends Workout {
  workout_exercises: WorkoutExerciseWithDetails[];
}

export interface Session {
  id: string;
  user_id: string;
  workout_id: string;
  scheduled_at: string;
  completed_at: string | null;
  notes: string | null;
}

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  role: "user" | "trainer";
  created_at: string;
}

export interface TrainerClient extends Profile {
  assigned_at: string;
}

export interface ExerciseLog {
  id: string;
  user_id: string;
  date: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
}

export interface WeightLog {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
}
