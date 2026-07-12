import { AppShell } from "@/components/AppShell";
import { RecommendationsView } from "@/components/RecommendationsView";
import { createClient } from "@/lib/supabase/server";
import { EMPTY_PROFILE, type TasteProfile } from "@/lib/taste";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: bottles }, { data: profileRow }] = await Promise.all([
    supabase.from("bottles").select("*"),
    user
      ? supabase.from("taste_profiles").select("data").eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const profile: TasteProfile = { ...EMPTY_PROFILE, ...((profileRow?.data as object) ?? {}) };

  return (
    <AppShell>
      <RecommendationsView bottles={(bottles as Bottle[]) ?? []} initialProfile={profile} />
    </AppShell>
  );
}
