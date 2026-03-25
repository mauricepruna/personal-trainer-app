import { createClient } from "@/lib/supabase/server";
import { WorkoutList } from "@/components/workouts/workout-list";

export default async function WorkoutsPage() {
  const supabase = createClient();

  const { data: workouts } = await supabase
    .from("workouts")
    .select(`
      *,
      workout_exercises(
        *,
        exercise:exercises(*)
      )
    `)
    .order("created_at", { ascending: false });

  return <WorkoutList initialWorkouts={workouts ?? []} />;
}
