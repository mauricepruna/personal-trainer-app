import { getDb } from "@/lib/db";

export interface CalendarSession {
  id: string;
  user_id: string;
  workout_id: string | null;
  workout_name: string | null;
  scheduled_at: string;
  completed_at: string | null;
  notes: string | null;
}

interface SessionRow {
  id: string;
  user_id: string;
  workout_id: string | null;
  workout_name: string | null;
  scheduled_at: string;
  completed_at: string | null;
  notes: string | null;
}

export function getSessionsForMonth(userId: string, year: number, month: number): CalendarSession[] {
  const db = getDb();
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const toDate = new Date(year, month, 1);
  const to = `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, "0")}-01`;

  return db
    .prepare(
      `SELECT s.*, w.name AS workout_name
       FROM sessions s
       LEFT JOIN workouts w ON w.id = s.workout_id
       WHERE s.user_id = ? AND s.scheduled_at >= ? AND s.scheduled_at < ?
       ORDER BY s.scheduled_at`
    )
    .all(userId, from, to) as SessionRow[];
}
