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

export async function createSessionAction(formData: FormData) {
  const session = await requireSession();
  const workoutId = (formData.get("workout_id") as string) || null;
  const scheduledAt = formData.get("scheduled_at") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!scheduledAt) return { error: "Date/time required" };

  const db = getDb();
  db.prepare(
    "INSERT INTO sessions (id, user_id, workout_id, scheduled_at, notes) VALUES (?,?,?,?,?)"
  ).run(randomUUID(), session.userId, workoutId, scheduledAt, notes);

  revalidatePath("/calendar");
  return { success: true };
}

export async function markSessionCompleteAction(sessionId: string) {
  const session = await requireSession();
  const db = getDb();
  db.prepare(
    "UPDATE sessions SET completed_at=datetime('now') WHERE id=? AND user_id=? AND completed_at IS NULL"
  ).run(sessionId, session.userId);
  revalidatePath("/calendar");
  return { success: true };
}

export async function deleteSessionAction(sessionId: string) {
  const session = await requireSession();
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE id=? AND user_id=?").run(sessionId, session.userId);
  revalidatePath("/calendar");
  return { success: true };
}
