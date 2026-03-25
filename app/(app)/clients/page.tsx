import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientsView } from "@/components/clients/clients-view";
import type { TrainerClient } from "@/lib/types/database";

export default async function ClientsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "trainer") {
    return (
      <div className="py-16 text-center text-gray-500 dark:text-gray-400">
        This section is for trainers only.
      </div>
    );
  }

  const { data: links } = await supabase
    .from("trainer_clients")
    .select("client_id, assigned_at, client:profiles!client_id(id, name, email, role, created_at)")
    .eq("trainer_id", user.id)
    .order("assigned_at", { ascending: false });

  const clients: TrainerClient[] = (links ?? []).map((link) => {
    const client = link.client as unknown as Omit<TrainerClient, "assigned_at">;
    return { ...client, assigned_at: link.assigned_at };
  });

  return <ClientsView initialClients={clients} />;
}
