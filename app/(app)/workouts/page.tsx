import { getSession } from "@/lib/auth/session";
import { getWorkouts } from "@/lib/db/queries/workouts";
import { getExercises } from "@/lib/db/queries/exercises";
import { WorkoutList } from "@/components/workouts/workout-list";
import { redirect } from "next/navigation";

export default async function WorkoutsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [workouts, exercises] = await Promise.all([
    getWorkouts(session.userId),
    getExercises(session.userId),
  ]);

  return <WorkoutList initialWorkouts={workouts} exercises={exercises} />;
}
