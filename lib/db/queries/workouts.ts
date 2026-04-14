import { getDb } from "@/lib/db";

export interface WorkoutExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  rest_sec: number | null;
  order_index: number;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  exercises: WorkoutExercise[];
}

interface WorkoutRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

interface WorkoutExerciseRow {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  rest_sec: number | null;
  order_index: number;
}

export function getWorkouts(userId: string): Workout[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM workouts WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as WorkoutRow[];

  const exRows = db
    .prepare(
      `SELECT we.*, e.name AS exercise_name
       FROM workout_exercises we
       JOIN exercises e ON e.id = we.exercise_id
       WHERE we.workout_id IN (SELECT id FROM workouts WHERE user_id = ?)
       ORDER BY we.order_index`
    )
    .all(userId) as (WorkoutExerciseRow & { workout_id: string })[];

  const exByWorkout: Record<string, WorkoutExercise[]> = {};
  for (const ex of exRows) {
    (exByWorkout[ex.workout_id] ??= []).push(ex);
  }

  return rows.map((w) => ({ ...w, exercises: exByWorkout[w.id] ?? [] }));
}

export function getWorkoutById(workoutId: string, userId: string): Workout | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM workouts WHERE id = ? AND user_id = ?")
    .get(workoutId, userId) as WorkoutRow | undefined;
  if (!row) return null;

  const exercises = db
    .prepare(
      `SELECT we.*, e.name AS exercise_name
       FROM workout_exercises we
       JOIN exercises e ON e.id = we.exercise_id
       WHERE we.workout_id = ?
       ORDER BY we.order_index`
    )
    .all(workoutId) as WorkoutExerciseRow[];

  return { ...row, exercises };
}
