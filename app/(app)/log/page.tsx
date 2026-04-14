import { getSession } from "@/lib/auth/session";
import { getWeightLog, getExerciseLog } from "@/lib/db/queries/log";
import { getExercises } from "@/lib/db/queries/exercises";
import { DailyLog } from "@/components/log/daily-log";
import { redirect } from "next/navigation";

export default async function LogPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const today = new Date().toISOString().split("T")[0];
  const date = searchParams.date ?? today;

  const [exercises, weightLogs, exerciseLogs] = await Promise.all([
    getExercises(session.userId),
    getWeightLog(session.userId, date),
    getExerciseLog(session.userId, date),
  ]);

  return (
    <DailyLog
      exercises={exercises}
      initialWeightLogs={weightLogs}
      initialExerciseLogs={exerciseLogs}
      initialDate={date}
    />
  );
}
