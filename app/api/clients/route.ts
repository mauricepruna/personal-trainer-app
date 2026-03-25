import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const email = (body.email as string)?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const admin = createAdminClient();

  // Find user by email
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) return NextResponse.json({ error: "Lookup failed" }, { status: 500 });

  const clientUser = users.find((u) => u.email?.toLowerCase() === email);
  if (!clientUser) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (clientUser.id === user.id) {
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
  }

  // Upsert client profile (ensure profile row exists)
  await admin.from("profiles").upsert(
    { id: clientUser.id, email: clientUser.email ?? null, role: "user" },
    { onConflict: "id" }
  );

  // Link trainer ↔ client
  const { error: linkError } = await admin.from("trainer_clients").upsert(
    { trainer_id: user.id, client_id: clientUser.id },
    { onConflict: "trainer_id,client_id" }
  );
  if (linkError) return NextResponse.json({ error: "Link failed" }, { status: 500 });

  const { data: clientProfile } = await admin
    .from("profiles")
    .select("id, name, email, role, created_at")
    .eq("id", clientUser.id)
    .single();

  // assigned_at isn't on profiles — fetch from trainer_clients
  const { data: link } = await admin
    .from("trainer_clients")
    .select("assigned_at")
    .eq("trainer_id", user.id)
    .eq("client_id", clientUser.id)
    .single();

  return NextResponse.json({ client: { ...clientProfile, assigned_at: link?.assigned_at } });
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const clientId = body.clientId as string;
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  await supabase
    .from("trainer_clients")
    .delete()
    .eq("trainer_id", user.id)
    .eq("client_id", clientId);

  return NextResponse.json({ success: true });
}
