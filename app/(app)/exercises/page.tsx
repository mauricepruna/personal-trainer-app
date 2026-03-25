import { createClient } from "@/lib/supabase/server";
import { ExerciseList } from "@/components/exercises/exercise-list";

export default async function ExercisesPage() {
  const supabase = createClient();

  const [exercisesResult, equipmentResult] = await Promise.all([
    supabase
      .from("exercises")
      .select("*, equipment:equipment_types(*)")
      .order("name"),
    supabase.from("equipment_types").select("*").order("name"),
  ]);

  return (
    <ExerciseList
      initialExercises={exercisesResult.data ?? []}
      equipment={equipmentResult.data ?? []}
    />
  );
}
