import { getSession } from "@/lib/auth/session";
import { getWeightTrend, getWeeklyWorkouts, getCompletedWorkoutsCount, getWeeklyRunning, getRunStats } from "@/lib/db/queries/progress";
import { ProgressCharts } from "@/components/charts/progress-charts";
import { redirect } from "next/navigation";

export default async function ProgressPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const since90 = new Date();
  since90.setDate(since90.getDate() - 90);
  const since90Str = since90.toISOString().split("T")[0];

  const [weightLogs, weeklyWorkouts, runStats, weeklyRunning] = await Promise.all([
    getWeightTrend(session.userId, since90Str),
    getWeeklyWorkouts(session.userId, since90Str),
    getRunStats(session.userId, since90Str),
    getWeeklyRunning(session.userId, since90Str),
  ]);

  const completedCount = await getCompletedWorkoutsCount(session.userId, since90Str);

  return (
    <ProgressCharts
      weightLogs={weightLogs}
      weeklyWorkouts={weeklyWorkouts}
      runStats={runStats}
      weeklyRunning={weeklyRunning}
      completedWorkouts={completedCount}
    />
  );
}
