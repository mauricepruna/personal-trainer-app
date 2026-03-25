import { createClient } from "@/lib/supabase/server";
import { RunningView } from "@/components/running/running-view";

export default async function RunningPage() {
  const supabase = createClient();

  const [plansResult, logsResult] = await Promise.all([
    supabase.from("running_plans").select("*").order("name"),
    supabase
      .from("running_log")
      .select("*")
      .order("date", { ascending: false })
      .limit(50),
  ]);

  return (
    <RunningView
      plans={plansResult.data ?? []}
      runLogs={logsResult.data ?? []}
    />
  );
}
