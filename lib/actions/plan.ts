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

const PLAN_DAYS: { name: string }[] = [
  { name: "Upper A - Push Focus" },
  { name: "Lower A - Quad & Glute" },
  { name: "Cardio + Core" },
  { name: "Upper B - Pull Focus" },
  { name: "Lower B - Hamstring & Posterior" },
  { name: "Easy Cardio" },
];

const TOTAL_SESSIONS = 72; // 12 weeks × 6 days

function localDate(base: string, daysOffset: number): string {
  const [y, m, d] = base.split("-").map(Number);
  const date = new Date(y, m - 1, d + daysOffset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T07:30:00`;
}

/** Ensures the 6 plan workouts exist for the user and returns their IDs by name. */
function ensurePlanWorkouts(userId: string): Record<string, string> {
  const db = getDb();
  const ids: Record<string, string> = {};
  for (const { name } of PLAN_DAYS) {
    const existing = db.prepare("SELECT id FROM workouts WHERE user_id = ? AND name = ?")
      .get(userId, name) as { id: string } | undefined;
    if (existing) {
      ids[name] = existing.id;
    } else {
      const id = randomUUID();
      db.prepare("INSERT INTO workouts (id, user_id, name) VALUES (?, ?, ?)")
        .run(id, userId, name);
      ids[name] = id;
    }
  }
  return ids;
}

const WORKOUT_TO_DAY: Record<string, string> = {
  "Upper A - Push Focus":           "upper-a",
  "Lower A - Quad & Glute":          "lower-a",
  "Cardio + Core":                   "cardio",
  "Upper B - Pull Focus":            "upper-b",
  "Lower B - Hamstring & Posterior": "lower-b",
  "Easy Cardio":                     "easy-cardio",
};

export interface PlanStatus {
  startDate: string | null;
  todayDayId: string | null;
  missedDayIds: string[];
  nextDayId: string | null;
  currentWeek: number;
  currentPhase: 1 | 2 | 3;
  completedCount: number;
}

export async function getPlanStatus(): Promise<PlanStatus> {
  const session = await requireSession();
  const db = getDb();

  const settings = db.prepare("SELECT plan_start_date FROM user_settings WHERE user_id = ?")
    .get(session.userId) as { plan_start_date: string | null } | undefined;

  const empty: PlanStatus = {
    startDate: null, todayDayId: null, missedDayIds: [],
    nextDayId: null, currentWeek: 1, currentPhase: 1, completedCount: 0,
  };
  if (!settings?.plan_start_date) return empty;

  const names = PLAN_DAYS.map((d) => d.name);
  const ph = names.map(() => "?").join(",");

  const rows = db.prepare(`
    SELECT s.scheduled_at, s.completed_at, w.name as workout_name
    FROM sessions s
    JOIN workouts w ON w.id = s.workout_id
    WHERE s.user_id = ? AND w.name IN (${ph})
    ORDER BY s.scheduled_at
  `).all(session.userId, ...names) as Array<{
    scheduled_at: string; completed_at: string | null; workout_name: string;
  }>;

  const today = new Date().toISOString().split("T")[0];
  const completedCount = rows.filter((r) => r.completed_at !== null).length;
  const currentWeek = Math.min(12, Math.floor(completedCount / 6) + 1);
  const currentPhase = Math.min(3, Math.floor(completedCount / 24) + 1) as 1 | 2 | 3;

  const todayRow = rows.find((r) => r.scheduled_at.startsWith(today) && !r.completed_at);
  const todayDayId = todayRow ? (WORKOUT_TO_DAY[todayRow.workout_name] ?? null) : null;

  const missedSet = new Set(
    rows
      .filter((r) => r.scheduled_at.split("T")[0] < today && !r.completed_at)
      .map((r) => WORKOUT_TO_DAY[r.workout_name])
      .filter(Boolean)
  );
  const missedDayIds = Array.from(missedSet);

  const nextRow = rows.find((r) => r.scheduled_at.split("T")[0] >= today && !r.completed_at);
  const nextDayId = nextRow ? (WORKOUT_TO_DAY[nextRow.workout_name] ?? null) : null;

  return {
    startDate: settings.plan_start_date, todayDayId, missedDayIds,
    nextDayId, currentWeek, currentPhase, completedCount,
  };
}

export async function getPlanStartDate(): Promise<string | null> {
  const session = await requireSession();
  const db = getDb();
  const row = db.prepare("SELECT plan_start_date FROM user_settings WHERE user_id = ?")
    .get(session.userId) as { plan_start_date: string | null } | undefined;
  return row?.plan_start_date ?? null;
}

/** Set (or reset) the plan start date. Wipes all plan sessions and regenerates 72 from scratch. */
export async function setPlanStartDateAction(formData: FormData) {
  const session = await requireSession();
  const startDate = formData.get("start_date") as string;
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return { error: "Invalid date" };
  }

  const db = getDb();

  db.prepare(`
    INSERT INTO user_settings (user_id, plan_start_date)
    VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET plan_start_date = excluded.plan_start_date
  `).run(session.userId, startDate);

  const workoutIds = ensurePlanWorkouts(session.userId);

  const placeholders = Object.values(workoutIds).map(() => "?").join(",");
  db.prepare(`DELETE FROM sessions WHERE user_id = ? AND workout_id IN (${placeholders})`)
    .run(session.userId, ...Object.values(workoutIds));

  const insertSession = db.prepare(
    "INSERT INTO sessions (id, user_id, workout_id, scheduled_at) VALUES (?, ?, ?, ?)"
  );

  db.transaction(() => {
    for (let i = 0; i < TOTAL_SESSIONS; i++) {
      const { name } = PLAN_DAYS[i % 6];
      const dayOffset = Math.floor(i / 6) * 7 + (i % 6);
      insertSession.run(randomUUID(), session.userId, workoutIds[name], localDate(startDate, dayOffset));
    }
  })();

  revalidatePath("/calendar");
  revalidatePath("/my-plan");
  return { success: true };
}

/**
 * Reschedule remaining (incomplete) plan sessions starting from a chosen date.
 * Completed sessions are never touched — the workout sequence continues from
 * exactly where the user left off.
 */
export async function reschedulePlanAction(formData: FormData) {
  const session = await requireSession();
  const fromDate = formData.get("from_date") as string;
  if (!fromDate || !/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
    return { error: "Invalid date" };
  }

  const db = getDb();
  const workoutIds = ensurePlanWorkouts(session.userId);
  const idList = Object.values(workoutIds);
  const placeholders = idList.map(() => "?").join(",");

  // Count completed plan sessions to know where in the 72-session sequence we are
  const { count: completedCount } = db.prepare(`
    SELECT COUNT(*) as count FROM sessions
    WHERE user_id = ? AND workout_id IN (${placeholders}) AND completed_at IS NOT NULL
  `).get(session.userId, ...idList) as { count: number };

  // Delete all incomplete plan sessions
  db.prepare(`
    DELETE FROM sessions
    WHERE user_id = ? AND workout_id IN (${placeholders}) AND completed_at IS NULL
  `).run(session.userId, ...idList);

  // Re-insert remaining sessions continuing the workout sequence
  const remaining = TOTAL_SESSIONS - completedCount;
  if (remaining <= 0) return { success: true, remaining: 0 };

  const insertSession = db.prepare(
    "INSERT INTO sessions (id, user_id, workout_id, scheduled_at) VALUES (?, ?, ?, ?)"
  );

  db.transaction(() => {
    for (let j = 0; j < remaining; j++) {
      const dayIndex = (completedCount + j) % 6;
      const { name } = PLAN_DAYS[dayIndex];
      const dayOffset = Math.floor(j / 6) * 7 + (j % 6);
      insertSession.run(randomUUID(), session.userId, workoutIds[name], localDate(fromDate, dayOffset));
    }
  })();

  revalidatePath("/calendar");
  revalidatePath("/my-plan");
  return { success: true, remaining };
}
