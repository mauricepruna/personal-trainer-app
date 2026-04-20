import { PlanView } from "@/components/my-plan/PlanView";
import { getPlanStatus } from "@/lib/actions/plan";

export const metadata = { title: "My 12-Week Plan" };

export default async function MyPlanPage() {
  const status = await getPlanStatus();
  return <PlanView status={status} />;
}
