import { getDb } from "@/lib/db";

export interface RunningPlan {
  id: string;
  name: string;
  goal_distance_km: number | null;
  weeks: number | null;
  level: string | null;
}

export interface RunLog {
  id: string;
  user_id: string;
  date: string;
  distance_km: number;
  duration_sec: number | null;
  pace_min_km: number | null;
}

export function getRunningPlans(): RunningPlan[] {
  const db = getDb();
  return db.prepare("SELECT * FROM running_plans ORDER BY goal_distance_km").all() as RunningPlan[];
}

export function getRunLogs(userId: string): RunLog[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM running_log WHERE user_id = ? ORDER BY date DESC")
    .all(userId) as RunLog[];
}

export interface RunPlanSession {
  id: string;
  plan_id: string;
  week: number;
  day: number;
  type: string | null;
  distance_km: number | null;
  notes: string | null;
}

export function getRunPlanSessions(planId: string): RunPlanSession[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM running_sessions WHERE plan_id = ? ORDER BY week, day")
    .all(planId) as RunPlanSession[];
}
