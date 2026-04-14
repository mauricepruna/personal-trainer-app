import { getSession } from "@/lib/auth/session";
import { getEquipmentTypes, getExercises } from "@/lib/db/queries/exercises";
import { PlanGenerator } from "@/components/plan-generator/plan-generator";
import { redirect } from "next/navigation";

export default async function PlanGeneratorPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [equipment, exercises] = await Promise.all([
    getEquipmentTypes(),
    getExercises(session.userId),
  ]);

  return <PlanGenerator equipment={equipment} exercises={exercises} />;
}
