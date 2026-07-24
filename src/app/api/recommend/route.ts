import { NextResponse } from "next/server";
import { anthropic, MODEL_SOMMELIER, parseJsonResponse } from "@/lib/ai";
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
    recipe: { ingredients: string[]; steps: string[]; glass: string; garnish: string | null };
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
          recipe: {
            type: "object",
            additionalProperties: false,
            properties: {
              ingredients: { type: "array", items: { type: "string" } },
              steps: { type: "array", items: { type: "string" } },
              glass: { type: "string" },
              garnish: { type: ["string", "null"] },
            },
            required: ["ingredients", "steps", "glass", "garnish"],
          },
        },
        required: ["kind", "title", "detail", "cocktail_id", "recipe"],
      },
    },
  },
  required: ["intro", "picks"],
} as const;

const SYSTEM = `You are the mixologist at the Tantaan Tiki Bar — imaginative, well-travelled, and
genuinely responsive to the moment. Read the member's occasion and mood first, then their palate,
and suggest drinks that fit THAT specific brief — using only spirits currently in stock.

Rules:
- Anchor every pick to tonight's occasion/mood. Your "intro" must show you actually understood the
  request (reference it), not a generic greeting.
- Range widely across the whole world of drinks — classics, modern, regional, tiki, lesser-known —
  not a fixed shortlist. You are ENCOURAGED to suggest drinks beyond the CANON list below, as long as
  every ingredient's base spirit is in the in-stock list. Vary your picks each time; never fall back
  to the same two or three drinks.
- For a cocktail (kind:"cocktail"): if it exactly matches a CANON entry, put its cocktail_id so the app
  can show the full recipe; otherwise set cocktail_id:null and include a short build in "detail"
  (key spirits + rough proportions + one line on why it fits tonight).
- Optionally include one neat/on-the-rocks pour (kind:"neat", cocktail_id:null) and at most one bottle
  worth acquiring (kind:"acquire", cocktail_id:null) with a reason.
- Give 4–6 picks with real variety, including at least one adventurous or unexpected choice that still
  fits the brief.
- Use only spirits that appear in the in-stock list. Never invent bottles.
- Avoid repeating anything in "RECENTLY SUGGESTED" unless it is clearly the single best fit.
- Keep each "detail" to 1–3 vivid, useful sentences.
- For EVERY kind:"cocktail" pick, fill "recipe" with a real, complete recipe: "ingredients" as
  lines that include measures (e.g. "45 ml gin", "15 ml lime juice", "2 dashes Angostura"), ordered
  "steps", a "glass", and a "garnish" (or null). This is required even for drinks not in the CANON.
- For kind:"neat" and kind:"acquire", set recipe to {ingredients:[], steps:[], glass:"", garnish:null}.`;

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

  const [{ data: bottleRows }, { data: profileRow }, { data: recentRows }] = await Promise.all([
    supabase.from("bottles").select("*"),
    // Shared bar profile (one row); readable by admin and viewers alike.
    supabase.from("taste_profiles").select("data").limit(1).maybeSingle(),
    supabase
      .from("ai_recommendations")
      .select("result")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // Titles suggested recently, so the sommelier can deliberately vary from them.
  const recentTitles = Array.from(
    new Set(
      ((recentRows as { result: Recommendation }[]) ?? [])
        .flatMap((r) => (r.result?.picks ?? []).map((p) => p.title))
        .filter(Boolean)
    )
  ).slice(0, 20);

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

  const userMsg = `TONIGHT'S REQUEST (this is the brief — center everything on it):
${occasion || "(none given — surprise me with something suited to a relaxed evening)"}

MEMBER'S PALATE (saved taste profile):
${profileText}

SPIRITS & BOTTLES IN STOCK (you may build anything whose base spirits are here):
${inventoryText}

CANON — known recipes you can reference by cocktail_id (NOT an exhaustive menu; feel free to go beyond):
${makeableText || "(none)"}

BOTTLES ONE SHORT (ideas for a kind:"acquire" pick):
${almostText || "(none)"}

RECENTLY SUGGESTED — vary away from these unless one is truly the best fit:
${recentTitles.length ? recentTitles.join(", ") : "(nothing yet)"}

Now craft tonight's recommendations.`;

  try {
    const client = anthropic();
    const res = await client.messages.create({
      model: MODEL_SOMMELIER,
      max_tokens: 4000,
      // Think it through — read the occasion, range widely, avoid repeats.
      thinking: { type: "adaptive" },
      system: SYSTEM,
      output_config: {
        effort: "high",
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
