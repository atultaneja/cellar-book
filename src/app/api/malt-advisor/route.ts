import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic, MODEL_ADVISOR } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import { EMPTY_PROFILE, type TasteProfile } from "@/lib/taste";
import { facetValue, type Overrides } from "@/lib/whisky";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Categories that make up a single-malt / malt-whisky collection.
const MALT_CATEGORIES = new Set([
  "Single Malt Scotch",
  "Blended Malt Scotch",
  "Japanese Whisky",
  "Indian Single Malt",
]);

export type AcquirePick = {
  name: string;
  distillery: string;
  style: string; // region / cask / profile, e.g. "Islay · sherry cask"
  approx_price: string; // e.g. "£75 / ₹9,000" or "mid-range"
  priority: "now" | "soon" | "opportunistic";
  why: string; // tie to a gap in the collection AND to current news/release
};

export type WatchPick = {
  name: string;
  distillery: string;
  expected: string; // when / where it's landing
  why: string;
};

export type MaltAdvice = {
  assessment: string;
  strategy: string;
  acquire: AcquirePick[];
  watch: WatchPick[];
  note: string;
};

export type Source = { title: string; url: string };

const SYSTEM = `You are the resident whisky buyer for a private home bar — a seasoned single-malt
specialist who builds collections with intent, not impulse. Your job: given the member's CURRENT
single-malt collection and their palate, lay out a strategic acquisition plan that makes the
collection genuinely great over time — filling regional, style, cask and age gaps; balancing
daily-drinkers with special bottles; and timing purchases around what is actually releasing and
what is hot right now.

You have a live web_search tool. USE IT before advising — search for the latest single malt
releases, limited editions, distillery news, awards, and price/availability chatter from the last
few months. Ground your "acquire" and "watch" picks in what you find: name specific expressions and
say why they matter now (new release, allocation, award, discontinued, price drop, hype to avoid).

Return your answer as a SINGLE JSON object and nothing else — no prose, no markdown, no code fences.
Shape:
{
  "assessment": "2-4 sentences: honest state of the collection — strengths and the biggest gaps.",
  "strategy": "2-4 sentences: the strategic approach to building from here for THIS collection.",
  "acquire": [
    {
      "name": "expression name",
      "distillery": "distillery",
      "style": "region / cask / profile, e.g. 'Islay · heavily peated' or 'Speyside · first-fill sherry'",
      "approx_price": "rough price band or figure",
      "priority": "now | soon | opportunistic",
      "why": "1-2 sentences tying it to a specific GAP in their collection AND to current news/release you found via search"
    }
  ],
  "watch": [
    {
      "name": "upcoming or hyped expression",
      "distillery": "distillery",
      "expected": "when/where it's landing or being talked about",
      "why": "why it's worth watching for this collection"
    }
  ],
  "note": "1-2 sentences: cautions — hype traps, overpriced flips, or what to skip. May be empty."
}

Rules:
- 4-6 "acquire" picks, ordered by priority (now first). Real, buyable expressions — never invented.
- 2-4 "watch" picks for upcoming/limited releases.
- Anchor every pick to a gap in THEIR collection; don't just list famous bottles they already own.
- Prefer picks you can support with something current you found via search.
- Be specific and honest about value; call out overhyped/overpriced bottles in "note".`;

function parseAdvice(text: string): MaltAdvice {
  let t = text.trim();
  // Strip accidental code fences.
  if (t.startsWith("```")) t = t.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  // Fall back to the outermost object if the model wrapped it in any prose.
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first > 0 || last < t.length - 1) {
    if (first !== -1 && last !== -1) t = t.slice(first, last + 1);
  }
  const parsed = JSON.parse(t) as Partial<MaltAdvice>;
  return {
    assessment: parsed.assessment ?? "",
    strategy: parsed.strategy ?? "",
    acquire: Array.isArray(parsed.acquire) ? parsed.acquire : [],
    watch: Array.isArray(parsed.watch) ? parsed.watch : [],
    note: parsed.note ?? "",
  };
}

// Loosely-typed view of response blocks so we can read web-search results and
// text without depending on exact SDK block typings across versions.
type LooseBlock = {
  type: string;
  text?: string;
  content?: Array<{ type?: string; url?: string; title?: string }> | { error_code?: string };
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Purchase strategy is the owner's tool.
  if (!isAdminEmail(user?.email))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ error: "The advisor is turned off." }, { status: 503 });

  let focus = "";
  try {
    const body = await request.json();
    focus = (body?.focus ?? "").toString().slice(0, 500);
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
  const malts = bottles.filter((b) => MALT_CATEGORIES.has(b.category));
  const profile: TasteProfile = { ...EMPTY_PROFILE, ...(profileRow?.data ?? {}) };
  const overrides = (facetRow?.result as { facets?: Overrides } | null)?.facets ?? {};

  const collectionText =
    malts.length === 0
      ? "(no single malts in the collection yet — this is a fresh start)"
      : malts
          .map((b) => {
            const region = facetValue(b, "region", overrides);
            const cask = facetValue(b, "cask", overrides);
            const age = facetValue(b, "age", overrides);
            return (
              `- ${b.name}${b.brand ? ` (${b.brand})` : ""} — ${region} · ${cask} · ${age}` +
              `${b.level <= 0 ? " — finished" : ""}${b.notes ? ` — ${b.notes}` : ""}`
            );
          })
          .join("\n");

  const userMsg = `MEMBER'S CURRENT SINGLE-MALT COLLECTION:
${collectionText}

MEMBER'S PALATE (saved taste profile):
${JSON.stringify(profile)}

${focus ? `THIS SESSION'S FOCUS (weight your plan toward this): ${focus}\n\n` : ""}Research what's
releasing and what's hot right now, then build the acquisition plan as specified.`;

  const tools = [
    { type: "web_search_20260209", name: "web_search", max_uses: 4 },
  ] as unknown as Anthropic.Tool[];

  try {
    const client = anthropic();

    // Server-side web search runs inside the call; long agentic loops can return
    // stop_reason "pause_turn" — resume by echoing the assistant content back.
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMsg }];
    let res: Anthropic.Message | null = null;
    for (let i = 0; i < 4; i++) {
      res = await client.messages.create({
        model: MODEL_ADVISOR,
        max_tokens: 4000,
        thinking: { type: "adaptive" },
        system: SYSTEM,
        output_config: { effort: "medium" },
        tools,
        messages,
      });
      if (res.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: res.content });
        continue;
      }
      break;
    }
    if (!res) throw new Error("no response");

    const blocks = res.content as unknown as LooseBlock[];

    // Collect cited sources from web-search result blocks (success content is a list).
    const sources: Source[] = [];
    const seen = new Set<string>();
    for (const b of blocks) {
      if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
        for (const r of b.content) {
          if (r?.url && !seen.has(r.url)) {
            seen.add(r.url);
            sources.push({ title: r.title || r.url, url: r.url });
          }
        }
      }
    }

    const answerText = blocks
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text as string)
      .join("\n")
      .trim();

    const advice = parseAdvice(answerText);

    // Remember the plan so it shows on return.
    await supabase.from("ai_recommendations").insert({
      user_id: user!.id,
      kind: "malt",
      context: { focus },
      result: { advice, sources },
    });

    return NextResponse.json({ advice, sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : "advisor failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
