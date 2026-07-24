import { AppShell } from "@/components/AppShell";
import { HomeView } from "@/components/HomeView";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";

// Start of the current week — Monday 00:00 UTC — so the weekly count resets.
function startOfWeekIso(): string {
  const now = new Date();
  const daysSinceMon = (now.getUTCDay() + 6) % 7;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMon)
  );
  return monday.toISOString();
}

export default async function HomePage() {
  const supabase = createClient();
  const weekStart = startOfWeekIso();
  const [{ data: bottles }, { data: pours }, { count: weekCount }, { data: { user } }] =
    await Promise.all([
      supabase.from("bottles").select("*"),
      supabase
        .from("drink_log")
        .select("bottle_name, category, volume_ml, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("drink_log")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart),
      supabase.auth.getUser(),
    ]);

  return (
    <AppShell isAdmin={isAdminEmail(user?.email)}>
      <HomeView
        bottles={(bottles as Bottle[]) ?? []}
        pours={pours ?? []}
        poursThisWeek={weekCount ?? 0}
        isAdmin={isAdminEmail(user?.email)}
      />
    </AppShell>
  );
}
