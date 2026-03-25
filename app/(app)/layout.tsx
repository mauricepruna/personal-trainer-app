import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/ui/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isTrainer = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isTrainer = profile?.role === "trainer";
  }

  return <AppShell isTrainer={isTrainer}>{children}</AppShell>;
}
