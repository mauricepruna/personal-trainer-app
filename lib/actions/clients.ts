"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getUserByEmail, addClient, removeClient } from "@/lib/db/queries/clients";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function addClientAction(formData: FormData) {
  const session = await requireSession();
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) return { error: "Email required" };

  // verify trainer role
  const db = getDb();
  const profile = db
    .prepare("SELECT role FROM profiles WHERE id = ?")
    .get(session.userId) as { role: string } | undefined;
  if (profile?.role !== "trainer") return { error: "Not a trainer account" };

  const client = getUserByEmail(email);
  if (!client) return { error: "No account found with that email" };
  if (client.id === session.userId) return { error: "Cannot add yourself as a client" };

  const existing = db
    .prepare("SELECT 1 FROM trainer_clients WHERE trainer_id=? AND client_id=?")
    .get(session.userId, client.id);
  if (existing) return { error: "Client already in your list" };

  addClient(session.userId, client.id);
  revalidatePath("/clients");
  return { success: true };
}

export async function removeClientAction(clientId: string) {
  const session = await requireSession();
  removeClient(session.userId, clientId);
  revalidatePath("/clients");
  return { success: true };
}
