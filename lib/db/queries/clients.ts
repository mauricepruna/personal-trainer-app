import { getDb } from "@/lib/db";

export interface Client {
  client_id: string;
  email: string;
  name: string;
  assigned_at: string;
}

export function getClients(trainerId: string): Client[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT tc.client_id, u.email, p.name, tc.assigned_at
       FROM trainer_clients tc
       JOIN users u ON u.id = tc.client_id
       JOIN profiles p ON p.id = tc.client_id
       WHERE tc.trainer_id = ?
       ORDER BY tc.assigned_at DESC`
    )
    .all(trainerId) as Client[];
}

export function getUserByEmail(email: string): { id: string; email: string } | null {
  const db = getDb();
  return db.prepare("SELECT id, email FROM users WHERE email = ?").get(email) as
    | { id: string; email: string }
    | null;
}

export function addClient(trainerId: string, clientId: string): void {
  const db = getDb();
  db.prepare(
    "INSERT OR IGNORE INTO trainer_clients (trainer_id, client_id) VALUES (?, ?)"
  ).run(trainerId, clientId);
}

export function removeClient(trainerId: string, clientId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM trainer_clients WHERE trainer_id = ? AND client_id = ?").run(
    trainerId,
    clientId
  );
}
