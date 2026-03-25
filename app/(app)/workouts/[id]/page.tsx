import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkoutForm } from "@/components/workouts/workout-form";

export default async function EditWorkoutPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [workoutResult, exercisesResult] = await Promise.all([
    supabase
      .from("workouts")
      .select(`
        *,
        workout_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .eq("id", params.id)
      .single(),
    supabase.from("exercises").select("*").order("name"),
  ]);

  if (!workoutResult.data) notFound();

  const workout = workoutResult.data;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        Edit Workout
      </h1>
      <WorkoutForm
        workoutId={workout.id}
        initialName={workout.name}
        initialExercises={
          workout.workout_exercises?.sort(
            (a: { order_index: number }, b: { order_index: number }) =>
              a.order_index - b.order_index
          ) ?? []
        }
        exercises={exercisesResult.data ?? []}
      />
    </div>
  );
}
