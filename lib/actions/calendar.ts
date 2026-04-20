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

export async function fetchSessionsAction(year: number, month: number) {
  const session = await requireSession();
  const { getSessionsForMonth } = await import("@/lib/db/queries/calendar");
  return getSessionsForMonth(session.userId, year, month);
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

export async function toggleSessionCompleteAction(sessionId: string, currentlyComplete: boolean) {
  const session = await requireSession();
  const db = getDb();
  if (currentlyComplete) {
    db.prepare("UPDATE sessions SET completed_at=NULL WHERE id=? AND user_id=?").run(sessionId, session.userId);
  } else {
    db.prepare("UPDATE sessions SET completed_at=datetime('now') WHERE id=? AND user_id=? AND completed_at IS NULL").run(sessionId, session.userId);
  }
  revalidatePath("/calendar");
  return { success: true };
}

export async function updateSessionTimeAction(sessionId: string, time: string) {
  const session = await requireSession();
  const db = getDb();
  // time is "HH:MM", keep existing date
  const row = db.prepare("SELECT scheduled_at FROM sessions WHERE id=? AND user_id=?")
    .get(sessionId, session.userId) as { scheduled_at: string } | undefined;
  if (!row) return { success: false };
  const date = row.scheduled_at.split("T")[0];
  db.prepare("UPDATE sessions SET scheduled_at=? WHERE id=? AND user_id=?")
    .run(`${date}T${time}:00`, sessionId, session.userId);
  revalidatePath("/calendar");
  return { success: true };
}

// Maps plan day IDs to the workout names created by the ICS seeder
const DAY_TO_WORKOUT: Record<string, string> = {
  "upper-a":    "Upper A - Push Focus",
  "lower-a":    "Lower A - Quad & Glute",
  "cardio":     "Cardio + Core",
  "upper-b":    "Upper B - Pull Focus",
  "lower-b":    "Lower B - Hamstring & Posterior",
  "easy-cardio":"Easy Cardio",
};

export async function markPlanDayCompleteAction(dayId: string) {
  const session = await requireSession();
  const workoutName = DAY_TO_WORKOUT[dayId];
  if (!workoutName) return { success: false, marked: false, usedFallback: false };

  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  // Try exact match first (session scheduled for today)
  const todayRow = db.prepare(`
    SELECT s.id FROM sessions s
    JOIN workouts w ON w.id = s.workout_id
    WHERE s.user_id = ? AND date(s.scheduled_at) = ? AND w.name = ?
    AND s.completed_at IS NULL
    LIMIT 1
  `).get(session.userId, today, workoutName) as { id: string } | undefined;

  if (todayRow) {
    db.prepare("UPDATE sessions SET completed_at = datetime('now') WHERE id = ?").run(todayRow.id);
    revalidatePath("/calendar");
    return { success: true, marked: true, usedFallback: false };
  }

  // Fallback: nearest incomplete session of this workout type (past or future)
  const fallbackRow = db.prepare(`
    SELECT s.id FROM sessions s
    JOIN workouts w ON w.id = s.workout_id
    WHERE s.user_id = ? AND w.name = ? AND s.completed_at IS NULL
    ORDER BY ABS(julianday(date(s.scheduled_at)) - julianday(?))
    LIMIT 1
  `).get(session.userId, workoutName, today) as { id: string } | undefined;

  if (fallbackRow) {
    db.prepare("UPDATE sessions SET completed_at = datetime('now') WHERE id = ?").run(fallbackRow.id);
    revalidatePath("/calendar");
    return { success: true, marked: true, usedFallback: true };
  }

  return { success: true, marked: false, usedFallback: false };
}

export async function updateSessionNotesAction(sessionId: string, notes: string) {
  const session = await requireSession();
  const db = getDb();
  db.prepare(
    "UPDATE sessions SET notes=? WHERE id=? AND user_id=?"
  ).run(notes.trim() || null, sessionId, session.userId);
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
