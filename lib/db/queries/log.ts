import { getDb } from "@/lib/db";

export interface WeightEntry {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
}

export interface ExerciseLogEntry {
  id: string;
  user_id: string;
  date: string;
  exercise_id: string | null;
  exercise_name: string | null;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
}

export function getWeightLog(userId: string, date: string): WeightEntry[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM weight_log WHERE user_id = ? AND date = ? ORDER BY rowid")
    .all(userId, date) as WeightEntry[];
}

export function getExerciseLog(userId: string, date: string): ExerciseLogEntry[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT el.*, e.name AS exercise_name
       FROM exercise_log el
       LEFT JOIN exercises e ON e.id = el.exercise_id
       WHERE el.user_id = ? AND el.date = ?
       ORDER BY el.rowid`
    )
    .all(userId, date) as ExerciseLogEntry[];
}

export function getWeightHistory(userId: string, fromDate: string): WeightEntry[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM weight_log WHERE user_id = ? AND date >= ? ORDER BY date")
    .all(userId, fromDate) as WeightEntry[];
}
