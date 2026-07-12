import { AppShell } from "@/components/AppShell";
import { CellarView } from "@/components/CellarView";
import { createClient } from "@/lib/supabase/server";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CellarPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("bottles")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  return (
    <AppShell>
      <CellarView initial={(data as Bottle[]) ?? []} />
    </AppShell>
  );
}
