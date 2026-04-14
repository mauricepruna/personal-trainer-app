import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { AppShell } from "@/components/ui/app-shell";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const profile = db
    .prepare("SELECT role FROM profiles WHERE id = ?")
    .get(session.userId) as { role: string } | undefined;
  const isTrainer = profile?.role === "trainer";

  return <AppShell isTrainer={isTrainer}>{children}</AppShell>;
}
