import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MaltAdvisorView } from "@/components/MaltAdvisorView";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import type { MaltAdvice, Source } from "@/lib/malt";
import { isMalt, type Overrides } from "@/lib/whisky";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MaltPage() {
  const supabase = createClient();

  // Building the collection is the owner's tool; viewers go to the cellar.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) redirect("/cellar");

  const [{ data: bottles }, { data: lastRec }, { data: facetRow }] = await Promise.all([
    supabase.from("bottles").select("*").order("category").order("name"),
    supabase
      .from("ai_recommendations")
      .select("result, created_at")
      .eq("kind", "malt")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("ai_recommendations")
      .select("result")
      .eq("kind", "malt_facets")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const malts = ((bottles as Bottle[]) ?? []).filter((b) => isMalt(b.category));

  const saved = (lastRec?.result as { advice?: MaltAdvice; sources?: Source[] } | null) ?? null;
  const overrides = (facetRow?.result as { facets?: Overrides } | null)?.facets ?? {};

  return (
    <AppShell isAdmin>
      <MaltAdvisorView
        aiEnabled={!!process.env.ANTHROPIC_API_KEY}
        malts={malts}
        overrides={overrides}
        initialAdvice={saved?.advice ?? null}
        initialSources={saved?.sources ?? []}
        lastUpdated={lastRec?.created_at ?? null}
      />
    </AppShell>
  );
}
