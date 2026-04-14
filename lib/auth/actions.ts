"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/auth/session";

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password required" };
  }

  const db = getDb();
  const user = db
    .prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
    .get(email) as { id: string; email: string; password_hash: string } | undefined;

  if (!user) return { error: "Invalid email or password" };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return { error: "Invalid email or password" };

  await createSession({ userId: user.id, email: user.email });
  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string)?.trim() ?? "";

  if (!email || !password) {
    return { error: "Email and password required" };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return { error: "An account with this email already exists" };

  const id = randomUUID();
  const hash = await bcrypt.hash(password, 10);

  db.transaction(() => {
    db.prepare(
      "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)"
    ).run(id, email, hash);
    db.prepare(
      "INSERT INTO profiles (id, name, role) VALUES (?, ?, 'user')"
    ).run(id, name || email.split("@")[0]);
  })();

  await createSession({ userId: id, email });
  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
