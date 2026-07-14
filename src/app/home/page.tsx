import { AppShell } from "@/components/AppShell";
import { HomeView } from "@/components/HomeView";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();
  const [{ data: bottles }, { data: pours }, { data: { user } }] = await Promise.all([
    supabase.from("bottles").select("*"),
    supabase
      .from("drink_log")
      .select("bottle_name, category, volume_ml, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.auth.getUser(),
  ]);

  return (
    <AppShell isAdmin={isAdminEmail(user?.email)}>
      <HomeView
        bottles={(bottles as Bottle[]) ?? []}
        pours={pours ?? []}
        isAdmin={isAdminEmail(user?.email)}
      />
    </AppShell>
  );
}
