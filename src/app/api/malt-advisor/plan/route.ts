import { NextResponse } from "next/server";
import { anthropic, MODEL_ADVISOR, parseJsonResponse } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import { isMalt, facetValue, type Overrides } from "@/lib/whisky";
import { isFullSize } from "@/lib/sizes";
import { PLAN_SCHEMA, type MaltAdvice, type Source } from "@/lib/malt";
import { EMPTY_PROFILE, type TasteProfile } from "@/lib/taste";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Step 2 of the advisor: the reasoning pass. Opus 5 with deep thinking takes the
// research findings + the collection and produces the strategic acquisition plan
// as structured JSON. No tools here, so it comfortably fits the 60s budget.

const SYSTEM = `You are the resident whisky buyer for a private home bar — a seasoned single-malt
specialist who builds collections with intent. Using the member's CURRENT collection, their palate,
and the RESEARCH NOTES of what's currently releasing/hot, produce a strategic acquisition plan,
organized BY GAP.

STRATEGY — breadth before depth (unless the FOCUS says otherwise):
- The default goal is COVERAGE. First fill the collection's missing REGIONS and STYLES across the
  whole world of whisky — Scotch regions (Highland, Speyside, Islay, Campbeltown, Lowland, Islands),
  Japan, Ireland, America, and anywhere else under-represented — plus missing profiles (serious peat,
  cask strength, wine-cask maturation). Give each real gap ONE strong, representative bottle.
- Only AFTER breadth is covered should you suggest going vertical (deepening a producer already owned).
- Do NOT pile more picks onto brands the member already owns several of. If a producer already appears
  2+ times in their collection, recommend it again only when it is clearly the single best way to fill
  a genuine gap, and say so.
- Every gap you name in a "gap" entry MUST have at least one pick that fills it. Never name a gap and
  leave it unaddressed.

OUTPUT:
- "headline": 1-2 sentences naming the strategic direction of this plan (e.g. broaden regional coverage).
- "gaps": the core of the plan. Each entry is { gap, why, picks }:
    - "gap": a short label (e.g. "Highland Scotch — unrepresented", "No cask-strength bottle").
    - "why": one sentence on why it matters for THIS collection/palate.
    - "picks": 1-2 real, buyable bottles that fill it, each with priority "now" | "soon" |
      "opportunistic", a rough price, a "style" (region · cask · profile · ABV), and a one-sentence
      "why" tying it to the gap and any current news hook from the RESEARCH NOTES.
  Order gaps by priority — the most important coverage gaps first. Aim for 4-6 gaps total.
- "watch": 2-4 upcoming/limited releases worth tracking.
- "note": honest value cautions — hype traps, overpriced flips, what to skip.
- "verdict": if the FOCUS names or asks about a SPECIFIC bottle (bought, pre-booked, or considering),
  set { bottle, call: "buy"|"hold"|"skip", reason }. Otherwise call "none" with empty bottle/reason.

RULES:
- Real, buyable expressions only — never invent bottles.
- Keep every "why" to ONE tight sentence. No dense paragraphs anywhere.
- If a recommended bottle is one the member owns only as a MINIATURE, say it's a mini → full upgrade.`;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ error: "The advisor is turned off." }, { status: 503 });

  let focus = "";
  let findings = "";
  let sources: Source[] = [];
  try {
    const body = await request.json();
    focus = (body?.focus ?? "").toString().slice(0, 500);
    findings = (body?.findings ?? "").toString().slice(0, 8000);
    if (Array.isArray(body?.sources)) {
      sources = (body.sources as Source[])
        .filter((s) => s && typeof s.url === "string")
        .slice(0, 30)
        .map((s) => ({ title: String(s.title || s.url).slice(0, 300), url: String(s.url) }));
    }
  } catch {
    // no body is fine
  }

  const [{ data: bottleRows }, { data: profileRow }, { data: facetRow }] = await Promise.all([
    supabase.from("bottles").select("*"),
    supabase.from("taste_profiles").select("data").limit(1).maybeSingle(),
    supabase
      .from("ai_recommendations")
      .select("result")
      .eq("kind", "malt_facets")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const bottles = (bottleRows as Bottle[]) ?? [];
  // Full-size bottles only — a 50 ml mini is a tasting pour, not a collection bottle.
  const malts = bottles.filter((b) => isMalt(b.category) && isFullSize(b.size));
  const profile: TasteProfile = { ...EMPTY_PROFILE, ...(profileRow?.data ?? {}) };
  const overrides = (facetRow?.result as { facets?: Overrides } | null)?.facets ?? {};

  const collectionText =
    malts.length === 0
      ? "(no single malts yet — a fresh start)"
      : malts
          .map(
            (b) =>
              `- ${b.name}${b.brand ? ` (${b.brand})` : ""} — ` +
              `${facetValue(b, "region", overrides)} · ${facetValue(b, "cask", overrides)} · ${facetValue(b, "age", overrides)}` +
              `${b.level <= 0 ? " — finished" : ""}`
          )
          .join("\n");

  const userMsg = `MEMBER'S CURRENT SINGLE-MALT COLLECTION:
${collectionText}

MEMBER'S PALATE:
${JSON.stringify(profile)}

${focus ? `THIS SESSION'S FOCUS (weight the plan toward this): ${focus}\n\n` : ""}RESEARCH NOTES (current releases / market news gathered just now):
${findings || "(none gathered — rely on your knowledge, and be conservative about 'current' claims)"}

Now produce the acquisition plan.`;

  try {
    const client = anthropic();
    // Stream + medium effort so Opus's deep reasoning still finishes inside the
    // 60s serverless budget (high effort routinely overran it).
    const stream = client.messages.stream({
      model: MODEL_ADVISOR, // Opus 5 — the reasoning step
      // Roomy cap: thinking tokens count toward this too, so a tight limit
      // truncates the JSON. Streaming keeps us clear of HTTP timeouts.
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: SYSTEM,
      output_config: { effort: "medium", format: { type: "json_schema", schema: PLAN_SCHEMA } },
      messages: [{ role: "user", content: userMsg }],
    });
    const res = await stream.finalMessage();

    if (res.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "The plan was cut off — please try again." },
        { status: 502 }
      );
    }

    const advice = parseJsonResponse<MaltAdvice>(res.content);

    await supabase.from("ai_recommendations").insert({
      user_id: user!.id,
      kind: "malt",
      context: { focus },
      result: { advice, sources },
    });

    return NextResponse.json({ advice, sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : "plan failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
