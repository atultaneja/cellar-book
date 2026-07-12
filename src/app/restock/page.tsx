import { AppShell } from "@/components/AppShell";
import { RestockView } from "@/components/RestockView";
import { createClient } from "@/lib/supabase/server";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RestockPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("bottles")
    .select("*")
    .lte("level", 1)
    .order("level", { ascending: true })
    .order("category", { ascending: true });

  return (
    <AppShell>
      <RestockView initial={(data as Bottle[]) ?? []} />
    </AppShell>
  );
}
