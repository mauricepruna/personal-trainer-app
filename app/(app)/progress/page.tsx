import { createClient } from "@/lib/supabase/server";
import { ProgressCharts } from "@/components/charts/progress-charts";

export default async function ProgressPage() {
  const supabase = createClient();
  const since90 = new Date();
  since90.setDate(since90.getDate() - 90);
  const since90Str = since90.toISOString().split("T")[0];

  const [weightResult, runResult, sessionsResult] = await Promise.all([
    supabase
      .from("weight_log")
      .select("date, weight_kg")
      .gte("date", since90Str)
      .order("date"),
    supabase
      .from("running_log")
      .select("date, distance_km, duration_sec, pace_min_km")
      .gte("date", since90Str)
      .order("date"),
    supabase
      .from("sessions")
      .select("completed_at")
      .not("completed_at", "is", null)
      .gte("completed_at", since90.toISOString()),
  ]);

  return (
    <ProgressCharts
      weightLogs={weightResult.data ?? []}
      runLogs={runResult.data ?? []}
      completedSessions={(sessionsResult.data ?? []) as { completed_at: string }[]}
    />
  );
}
