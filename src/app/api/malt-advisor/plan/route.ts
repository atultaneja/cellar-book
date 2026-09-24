import { NextResponse } from "next/server";
import { anthropic, MODEL_ADVISOR, parseJsonResponse } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import { isMalt, facetValue, type Overrides } from "@/lib/whisky";
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
and the RESEARCH NOTES of what's currently releasing/hot, produce a strategic acquisition plan:
fill regional, cask, age and style gaps; balance daily-drinkers with special bottles; and time
purchases around what the notes say is available or worth waiting for.

Rules:
- 4-6 "acquire" picks, ordered by priority (now first). Real, buyable expressions — never invented.
- Ground picks in the RESEARCH NOTES where possible; anchor each to a specific GAP in THEIR collection.
- 2-4 "watch" picks for upcoming/limited releases from the notes.
- Be specific and honest about value; call out overhyped/overpriced bottles in "note".
- Do not just list famous bottles they already own.`;

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
  const malts = bottles.filter((b) => isMalt(b.category));
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
