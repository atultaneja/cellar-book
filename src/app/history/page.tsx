import { AppShell } from "@/components/AppShell";
import { HistoryView } from "@/components/HistoryView";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = createClient();
  const [{ data: pours }, { data: { user } }] = await Promise.all([
    supabase
      .from("drink_log")
      .select("bottle_name, category, volume_ml, note, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.auth.getUser(),
  ]);

  return (
    <AppShell isAdmin={isAdminEmail(user?.email)}>
      <HistoryView pours={pours ?? []} />
    </AppShell>
  );
}
