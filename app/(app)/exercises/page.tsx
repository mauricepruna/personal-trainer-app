import { getSession } from "@/lib/auth/session";
import { getExercises, getEquipmentTypes } from "@/lib/db/queries/exercises";
import { ExerciseList } from "@/components/exercises/exercise-list";
import { redirect } from "next/navigation";

export default async function ExercisesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [exercises, equipment] = await Promise.all([
    getExercises(session.userId),
    getEquipmentTypes(),
  ]);

  return <ExerciseList initialExercises={exercises} equipment={equipment} />;
}
