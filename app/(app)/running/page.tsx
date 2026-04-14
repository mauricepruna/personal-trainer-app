import { getSession } from "@/lib/auth/session";
import { getRunningPlans, getRunLogs } from "@/lib/db/queries/running";
import { RunningView } from "@/components/running/running-view";
import { redirect } from "next/navigation";

export default async function RunningPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [plans, runLogs] = await Promise.all([
    getRunningPlans(),
    getRunLogs(session.userId),
  ]);

  return <RunningView plans={plans} runLogs={runLogs} />;
}
