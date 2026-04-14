import { getDb } from "@/lib/db";

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  muscle_groups: string[];
  equipment_id: string | null;
  equipment_name: string | null;
  instructions: string | null;
  video_url: string | null;
  created_at: string;
}

interface ExerciseRow {
  id: string;
  user_id: string | null;
  name: string;
  muscle_groups: string;
  equipment_id: string | null;
  equipment_name: string | null;
  instructions: string | null;
  video_url: string | null;
  created_at: string;
}

function rowToExercise(row: ExerciseRow): Exercise {
  return {
    ...row,
    muscle_groups: JSON.parse(row.muscle_groups || "[]"),
  };
}

export function getExercises(userId: string): Exercise[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT e.*, et.name AS equipment_name
       FROM exercises e
       LEFT JOIN equipment_types et ON et.id = e.equipment_id
       WHERE e.user_id = ? OR e.user_id IS NULL
       ORDER BY e.name`
    )
    .all(userId) as ExerciseRow[];
  return rows.map(rowToExercise);
}

export function getEquipmentTypes() {
  const db = getDb();
  return db.prepare("SELECT * FROM equipment_types ORDER BY name").all() as {
    id: string;
    name: string;
    icon: string | null;
  }[];
}
