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

export async function createExerciseAction(formData: FormData) {
  const session = await requireSession();
  const name = (formData.get("name") as string)?.trim();
  const muscleGroups = formData.getAll("muscle_groups") as string[];
  const equipmentId = (formData.get("equipment_id") as string) || null;
  const instructions = (formData.get("instructions") as string)?.trim() || null;
  const videoUrl = (formData.get("video_url") as string)?.trim() || null;

  if (!name) return { error: "Name is required" };

  const db = getDb();
  db.prepare(
    "INSERT INTO exercises (id, user_id, name, muscle_groups, equipment_id, instructions, video_url) VALUES (?,?,?,?,?,?,?)"
  ).run(randomUUID(), session.userId, name, JSON.stringify(muscleGroups), equipmentId, instructions, videoUrl);

  revalidatePath("/exercises");
  return { success: true };
}

export async function updateExerciseAction(formData: FormData) {
  const session = await requireSession();
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const muscleGroups = formData.getAll("muscle_groups") as string[];
  const equipmentId = (formData.get("equipment_id") as string) || null;
  const instructions = (formData.get("instructions") as string)?.trim() || null;
  const videoUrl = (formData.get("video_url") as string)?.trim() || null;

  if (!name) return { error: "Name is required" };

  const db = getDb();
  db.prepare(
    "UPDATE exercises SET name=?, muscle_groups=?, equipment_id=?, instructions=?, video_url=? WHERE id=? AND user_id=?"
  ).run(name, JSON.stringify(muscleGroups), equipmentId, instructions, videoUrl, id, session.userId);

  revalidatePath("/exercises");
  return { success: true };
}

export async function deleteExerciseAction(id: string) {
  const session = await requireSession();
  const db = getDb();
  db.prepare("DELETE FROM exercises WHERE id = ? AND user_id = ?").run(id, session.userId);
  revalidatePath("/exercises");
  return { success: true };
}
