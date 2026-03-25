import { createClient } from "@/lib/supabase/server";
import { WorkoutForm } from "@/components/workouts/workout-form";

export default async function NewWorkoutPage() {
  const supabase = createClient();
  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("name");

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        New Workout
      </h1>
      <WorkoutForm exercises={exercises ?? []} />
    </div>
  );
}
