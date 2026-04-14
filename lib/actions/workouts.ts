"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export interface WorkoutExerciseInput {
  exerciseId: string;
  sets: number;
  reps: number;
  weightKg: number | null;
  restSec: number | null;
}

export async function createWorkoutAction(name: string, exercises: WorkoutExerciseInput[]) {
  const session = await requireSession();
  const db = getDb();
  const workoutId = randomUUID();

  db.transaction(() => {
    db.prepare("INSERT INTO workouts (id, user_id, name) VALUES (?,?,?)").run(
      workoutId, session.userId, name
    );
    exercises.forEach((ex, i) => {
      db.prepare(
        "INSERT INTO workout_exercises (id, workout_id, exercise_id, sets, reps, weight_kg, rest_sec, order_index) VALUES (?,?,?,?,?,?,?,?)"
      ).run(randomUUID(), workoutId, ex.exerciseId, ex.sets, ex.reps, ex.weightKg, ex.restSec, i);
    });
  })();

  revalidatePath("/workouts");
  return { success: true, workoutId };
}

export async function updateWorkoutAction(
  workoutId: string,
  name: string,
  exercises: WorkoutExerciseInput[]
) {
  const session = await requireSession();
  const db = getDb();

  db.transaction(() => {
    db.prepare("UPDATE workouts SET name=? WHERE id=? AND user_id=?").run(
      name, workoutId, session.userId
    );
    db.prepare("DELETE FROM workout_exercises WHERE workout_id=?").run(workoutId);
    exercises.forEach((ex, i) => {
      db.prepare(
        "INSERT INTO workout_exercises (id, workout_id, exercise_id, sets, reps, weight_kg, rest_sec, order_index) VALUES (?,?,?,?,?,?,?,?)"
      ).run(randomUUID(), workoutId, ex.exerciseId, ex.sets, ex.reps, ex.weightKg, ex.restSec, i);
    });
  })();

  revalidatePath("/workouts");
  return { success: true };
}

export async function deleteWorkoutAction(workoutId: string) {
  const session = await requireSession();
  const db = getDb();
  db.prepare("DELETE FROM workouts WHERE id=? AND user_id=?").run(workoutId, session.userId);
  revalidatePath("/workouts");
  return { success: true };
}
