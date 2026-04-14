import { getSession } from "@/lib/auth/session";
import { getSessionsForMonth } from "@/lib/db/queries/calendar";
import { getWorkouts } from "@/lib/db/queries/workouts";
import { CalendarView } from "@/components/calendar/calendar-view";
import { redirect } from "next/navigation";

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const [sessions, workouts] = await Promise.all([
    getSessionsForMonth(session.userId, now.getFullYear(), now.getMonth() + 1),
    getWorkouts(session.userId),
  ]);

  const workoutOptions = workouts.map((w) => ({ id: w.id, name: w.name }));

  return <CalendarView initialSessions={sessions} workouts={workoutOptions} />;
}
