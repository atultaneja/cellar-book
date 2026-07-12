import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PartyView } from "@/components/PartyView";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import type { Bottle, Party } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PartyPage() {
  const supabase = createClient();

  // Hosting is admin-only; viewers are bounced to the cellar.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) redirect("/cellar");

  const [{ data: parties }, { data: bottles }] = await Promise.all([
    supabase.from("parties").select("*").order("created_at", { ascending: false }).limit(1),
    supabase.from("bottles").select("*").order("category").order("name"),
  ]);

  const party = (parties?.[0] as Party) ?? null;

  let openBottleIds: string[] = [];
  let cocktailIds: string[] = [];
  if (party) {
    const [{ data: pb }, { data: pc }] = await Promise.all([
      supabase.from("party_bottles").select("bottle_id").eq("party_id", party.id),
      supabase.from("party_cocktails").select("cocktail_id").eq("party_id", party.id),
    ]);
    openBottleIds = (pb ?? []).map((r) => r.bottle_id as string);
    cocktailIds = (pc ?? []).map((r) => r.cocktail_id as string);
  }

  return (
    <AppShell isAdmin>
      <PartyView
        initialParty={party}
        bottles={(bottles as Bottle[]) ?? []}
        initialOpenBottleIds={openBottleIds}
        initialCocktailIds={cocktailIds}
      />
    </AppShell>
  );
}
