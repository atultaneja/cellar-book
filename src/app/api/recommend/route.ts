import { NextResponse } from "next/server";
import { anthropic, MODEL, parseJsonResponse } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { COCKTAILS, makeable } from "@/lib/cocktails";
import { tokensFor } from "@/lib/categories";
import { inStock } from "@/lib/levels";
import { EMPTY_PROFILE, type TasteProfile } from "@/lib/taste";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Recommendation = {
  intro: string;
  picks: {
    kind: "cocktail" | "neat" | "acquire";
    title: string;
    detail: string;
    cocktail_id: string | null;
  }[];
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    intro: { type: "string" },
    picks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          kind: { type: "string", enum: ["cocktail", "neat", "acquire"] },
          title: { type: "string" },
          detail: { type: "string" },
          cocktail_id: { type: ["string", "null"] },
        },
        required: ["kind", "title", "detail", "cocktail_id"],
      },
    },
  },
  required: ["intro", "picks"],
} as const;

const SYSTEM = `You are the resident mixologist at the Tantaan Tiki Bar, Karishma & Atul's home bar —
erudite, warm, economical with words. You recommend drinks strictly from what the member has in stock tonight,
tuned to their stated palate. Prefer cocktails from the provided "makeable" list (reference the
exact cocktail_id). You may also suggest a neat/on-the-rocks pour of a spirit in stock (kind:"neat",
cocktail_id null), and at most one bottle worth acquiring next (kind:"acquire", cocktail_id null),
chosen to fit their taste and unlock drinks they can nearly make. Give 3–5 picks total. Keep each
"detail" to one or two elegant sentences. Never recommend something not supported by the inventory.`;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ error: "The sommelier is turned off." }, { status: 503 });

  let occasion = "";
  try {
    const body = await request.json();
    occasion = (body?.occasion ?? "").toString().slice(0, 500);
  } catch {
    // no body is fine
  }

  const [{ data: bottleRows }, { data: profileRow }] = await Promise.all([
    supabase.from("bottles").select("*"),
    // Shared bar profile (one row); readable by admin and viewers alike.
    supabase.from("taste_profiles").select("data").limit(1).maybeSingle(),
  ]);

  const bottles = (bottleRows as Bottle[]) ?? [];
  const profile: TasteProfile = { ...EMPTY_PROFILE, ...(profileRow?.data ?? {}) };

  const stocked = bottles.filter((b) => inStock(b.level));
  const availableCats = new Set<string>();
  for (const b of stocked) tokensFor(b.category).forEach((t) => availableCats.add(t));
  const canMake = COCKTAILS.filter((c) => makeable(c, availableCats));
  const almost = COCKTAILS.filter(
    (c) => c.requires.filter((r) => !availableCats.has(r)).length === 1
  );

  const inventoryText =
    stocked.length === 0
      ? "The cellar is empty."
      : stocked
          .map((b) => `- ${b.name}${b.brand ? ` (${b.brand})` : ""} [${b.category}]`)
          .join("\n");

  const makeableText = canMake.map((c) => `${c.id}: ${c.name} (${c.moods.join(", ")})`).join("\n");
  const almostText = almost
    .map((c) => `${c.name} — missing ${c.requires.filter((r) => !availableCats.has(r)).join(", ")}`)
    .join("\n");

  const profileText = JSON.stringify(profile);

  const userMsg = `MEMBER'S PALATE (their saved taste profile):
${profileText}

TONIGHT'S REQUEST: ${occasion || "(none given — recommend for a typical evening)"}

BOTTLES IN STOCK:
${inventoryText}

COCKTAILS FULLY MAKEABLE NOW (use these cocktail_ids for kind:"cocktail"):
${makeableText || "(none)"}

ONE BOTTLE SHORT (for kind:"acquire" ideas):
${almostText || "(none)"}

Recommend now.`;

  try {
    const client = anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      // No extended thinking — this is light selection work, not deep reasoning.
      thinking: { type: "disabled" },
      system: SYSTEM,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [{ role: "user", content: userMsg }],
    });

    const parsed = parseJsonResponse<Recommendation>(res.content);

    // Remember what we suggested (the app's memory of past recommendations).
    await supabase.from("ai_recommendations").insert({
      user_id: user.id,
      kind: "guided",
      context: { occasion },
      result: parsed,
    });

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "recommendation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
