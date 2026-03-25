import { createClient } from "@/lib/supabase/server";
import { DailyLog } from "@/components/log/daily-log";

export default async function LogPage() {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const [exercisesResult, weightResult, exerciseLogResult] = await Promise.all([
    supabase.from("exercises").select("*").order("name"),
    supabase.from("weight_log").select("*").eq("date", today),
    supabase
      .from("exercise_log")
      .select("*, exercise:exercises(name)")
      .eq("date", today),
  ]);

  return (
    <DailyLog
      exercises={exercisesResult.data ?? []}
      initialWeightLogs={weightResult.data ?? []}
      initialExerciseLogs={exerciseLogResult.data ?? []}
      initialDate={today}
    />
  );
}
