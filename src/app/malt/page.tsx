import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MaltAdvisorView } from "@/components/MaltAdvisorView";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import type { MaltAdvice, Source } from "@/app/api/malt-advisor/route";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";

const MALT_CATEGORIES = new Set([
  "Single Malt Scotch",
  "Blended Malt Scotch",
  "Japanese Whisky",
  "Indian Single Malt",
]);

export default async function MaltPage() {
  const supabase = createClient();

  // Building the collection is the owner's tool; viewers go to the cellar.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) redirect("/cellar");

  const [{ data: bottles }, { data: lastRec }] = await Promise.all([
    supabase.from("bottles").select("category"),
    supabase
      .from("ai_recommendations")
      .select("result, created_at")
      .eq("kind", "malt")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const maltCount = ((bottles as Pick<Bottle, "category">[]) ?? []).filter((b) =>
    MALT_CATEGORIES.has(b.category)
  ).length;

  const saved = (lastRec?.result as { advice?: MaltAdvice; sources?: Source[] } | null) ?? null;

  return (
    <AppShell isAdmin>
      <MaltAdvisorView
        aiEnabled={!!process.env.ANTHROPIC_API_KEY}
        maltCount={maltCount}
        initialAdvice={saved?.advice ?? null}
        initialSources={saved?.sources ?? []}
        lastUpdated={lastRec?.created_at ?? null}
      />
    </AppShell>
  );
}
