import { AppShell } from "@/components/AppShell";
import { CellarView } from "@/components/CellarView";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CellarPage() {
  const supabase = createClient();
  const [{ data }, { data: { user } }] = await Promise.all([
    supabase.from("bottles").select("*").order("category").order("name"),
    supabase.auth.getUser(),
  ]);
  const isAdmin = isAdminEmail(user?.email);

  return (
    <AppShell isAdmin={isAdmin}>
      <CellarView
        initial={(data as Bottle[]) ?? []}
        aiEnabled={isAdmin && !!process.env.ANTHROPIC_API_KEY}
        isAdmin={isAdmin}
      />
    </AppShell>
  );
}
