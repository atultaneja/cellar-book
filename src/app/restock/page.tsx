import { AppShell } from "@/components/AppShell";
import { RestockView } from "@/components/RestockView";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RestockPage() {
  const supabase = createClient();
  const [{ data }, { data: { user } }] = await Promise.all([
    supabase.from("bottles").select("*"),
    supabase.auth.getUser(),
  ]);
  const isAdmin = isAdminEmail(user?.email);

  return (
    <AppShell isAdmin={isAdmin}>
      <RestockView bottles={(data as Bottle[]) ?? []} isAdmin={isAdmin} />
    </AppShell>
  );
}
