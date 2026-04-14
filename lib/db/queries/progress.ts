import { getDb } from "@/lib/db";

export function getWeightTrend(userId: string, fromDate: string) {
  const db = getDb();
  return db
    .prepare("SELECT date, weight_kg FROM weight_log WHERE user_id = ? AND date >= ? ORDER BY date")
    .all(userId, fromDate) as { date: string; weight_kg: number }[];
}

export function getWeeklyWorkouts(userId: string, fromDate: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT strftime('%Y-%W', scheduled_at) AS week, COUNT(*) AS count
       FROM sessions
       WHERE user_id = ? AND completed_at IS NOT NULL AND scheduled_at >= ?
       GROUP BY week ORDER BY week`
    )
    .all(userId, fromDate) as { week: string; count: number }[];
}

export function getCompletedWorkoutsCount(userId: string, fromDate: string): number {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) AS count FROM sessions WHERE user_id = ? AND completed_at IS NOT NULL AND scheduled_at >= ?"
    )
    .get(userId, fromDate) as { count: number };
  return row.count;
}

export function getWeeklyRunning(userId: string, fromDate: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT strftime('%Y-%W', date) AS week, SUM(distance_km) AS km
       FROM running_log WHERE user_id = ? AND date >= ?
       GROUP BY week ORDER BY week`
    )
    .all(userId, fromDate) as { week: string; km: number }[];
}

export function getRunStats(userId: string, fromDate: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT COUNT(*) AS total_runs, ROUND(SUM(distance_km),1) AS total_km,
              ROUND(AVG(pace_min_km),2) AS avg_pace
       FROM running_log WHERE user_id = ? AND date >= ?`
    )
    .get(userId, fromDate) as { total_runs: number; total_km: number; avg_pace: number };
}
