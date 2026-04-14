import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getClients } from "@/lib/db/queries/clients";
import { ClientsView } from "@/components/clients/clients-view";
import { redirect } from "next/navigation";

export default async function ClientsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const profile = db
    .prepare("SELECT role FROM profiles WHERE id = ?")
    .get(session.userId) as { role: string } | undefined;

  if (profile?.role !== "trainer") {
    return (
      <div className="py-16 text-center text-gray-500 dark:text-gray-400">
        This section is for trainers only.
      </div>
    );
  }

  const clients = getClients(session.userId);
  return <ClientsView initialClients={clients} />;
}
