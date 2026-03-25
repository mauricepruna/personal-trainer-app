import { createClient } from "@/lib/supabase/server";
import { PlanGenerator } from "@/components/plan-generator/plan-generator";

export default async function PlanGeneratorPage() {
  const supabase = createClient();

  const [equipmentResult, exercisesResult] = await Promise.all([
    supabase.from("equipment_types").select("*").order("name"),
    supabase.from("exercises").select("*").order("name"),
  ]);

  return (
    <PlanGenerator
      equipment={equipmentResult.data ?? []}
      exercises={exercisesResult.data ?? []}
    />
  );
}
