import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getWorkoutById } from "@/lib/db/queries/workouts";
import { getExercises } from "@/lib/db/queries/exercises";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { redirect } from "next/navigation";

export default async function EditWorkoutPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [workout, exercises] = await Promise.all([
    getWorkoutById(params.id, session.userId),
    getExercises(session.userId),
  ]);

  if (!workout) notFound();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Edit Workout</h1>
      <WorkoutForm
        workoutId={workout.id}
        initialName={workout.name}
        initialExercises={workout.exercises.sort((a, b) => a.order_index - b.order_index)}
        exercises={exercises}
      />
    </div>
  );
}
