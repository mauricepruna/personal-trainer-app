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

export async function getPlanSessionsAction(planId: string) {
  const session = await requireSession();
  void session; // auth check only
  const { getRunPlanSessions } = await import("@/lib/db/queries/running");
  return getRunPlanSessions(planId);
}

export async function logRunAction(formData: FormData) {
  const session = await requireSession();
  const date = formData.get("date") as string;
  const distanceKm = parseFloat(formData.get("distance_km") as string);
  const hours = parseInt(formData.get("hours") as string) || 0;
  const minutes = parseInt(formData.get("minutes") as string) || 0;
  const seconds = parseInt(formData.get("seconds") as string) || 0;
  const durationSec = hours * 3600 + minutes * 60 + seconds || null;
  const paceMinKm = durationSec && distanceKm > 0
    ? Math.round((durationSec / 60 / distanceKm) * 100) / 100
    : null;

  if (!date || isNaN(distanceKm)) return { error: "Invalid data" };

  const db = getDb();
  db.prepare(
    "INSERT INTO running_log (id, user_id, date, distance_km, duration_sec, pace_min_km) VALUES (?,?,?,?,?,?)"
  ).run(randomUUID(), session.userId, date, distanceKm, durationSec, paceMinKm);

  revalidatePath("/running");
  return { success: true };
}
