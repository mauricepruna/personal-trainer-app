import { getSession } from "@/lib/auth/session";
import { getExercises } from "@/lib/db/queries/exercises";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { redirect } from "next/navigation";

export default async function NewWorkoutPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const exercises = await getExercises(session.userId);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">New Workout</h1>
      <WorkoutForm exercises={exercises} />
    </div>
  );
}
