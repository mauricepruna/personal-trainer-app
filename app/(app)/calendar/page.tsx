import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const supabase = createClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

  const [sessionsResult, workoutsResult] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, workout:workouts(name)")
      .gte("scheduled_at", startOfMonth)
      .lte("scheduled_at", endOfMonth)
      .order("scheduled_at"),
    supabase.from("workouts").select("id, name").order("name"),
  ]);

  return (
    <CalendarView
      initialSessions={sessionsResult.data ?? []}
      workouts={workoutsResult.data ?? []}
    />
  );
}
