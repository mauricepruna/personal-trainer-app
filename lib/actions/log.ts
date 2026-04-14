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

export async function logWeightAction(formData: FormData) {
  const session = await requireSession();
  const date = formData.get("date") as string;
  const weightKg = parseFloat(formData.get("weight_kg") as string);

  if (!date || isNaN(weightKg)) return { error: "Invalid data" };

  const db = getDb();
  db.prepare(
    "INSERT INTO weight_log (id, user_id, date, weight_kg) VALUES (?,?,?,?)"
  ).run(randomUUID(), session.userId, date, weightKg);

  revalidatePath("/log");
  return { success: true };
}

export async function logExerciseAction(formData: FormData) {
  const session = await requireSession();
  const date = formData.get("date") as string;
  const exerciseId = (formData.get("exercise_id") as string) || null;
  const sets = parseInt(formData.get("sets") as string) || null;
  const reps = parseInt(formData.get("reps") as string) || null;
  const weightKg = parseFloat(formData.get("weight_kg") as string) || null;

  if (!date) return { error: "Date required" };

  const db = getDb();
  db.prepare(
    "INSERT INTO exercise_log (id, user_id, date, exercise_id, sets, reps, weight_kg) VALUES (?,?,?,?,?,?,?)"
  ).run(randomUUID(), session.userId, date, exerciseId, sets, reps, weightKg);

  revalidatePath("/log");
  return { success: true };
}
