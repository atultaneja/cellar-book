import { AppShell } from "@/components/AppShell";
import { RecommendationsView } from "@/components/RecommendationsView";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import { EMPTY_PROFILE, type TasteProfile } from "@/lib/taste";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const supabase = createClient();
  // One shared bar profile (readable by everyone), so a viewer's recommendations
  // are tuned to it too.
  const [{ data: bottles }, { data: profileRow }, { data: { user } }] = await Promise.all([
    supabase.from("bottles").select("*"),
    supabase.from("taste_profiles").select("data").limit(1).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const profile: TasteProfile = { ...EMPTY_PROFILE, ...((profileRow?.data as object) ?? {}) };

  return (
    <AppShell isAdmin={isAdminEmail(user?.email)}>
      <RecommendationsView
        bottles={(bottles as Bottle[]) ?? []}
        initialProfile={profile}
        aiEnabled={!!process.env.ANTHROPIC_API_KEY}
        isAdmin={isAdminEmail(user?.email)}
      />
    </AppShell>
  );
}
