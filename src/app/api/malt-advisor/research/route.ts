import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic, MODEL } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import { isMalt, facetValue, type Overrides } from "@/lib/whisky";
import type { Source } from "@/lib/malt";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Step 1 of the advisor: a fast web-search pass that gathers current single-malt
// releases and market news relevant to the collection's gaps and the member's
// focus. Returns concise findings + cited sources for the Opus plan step to use.

type LooseBlock = {
  type: string;
  text?: string;
  content?: Array<{ type?: string; url?: string; title?: string }> | { error_code?: string };
};

const SYSTEM = `You are a single-malt whisky market researcher. Given the member's collection
(summarised by region/cask/age) and their focus, use web_search to find the most relevant CURRENT
information: new and limited releases, upcoming bottlings, awards, and price/availability chatter
from the last few months — especially things that fill gaps in THIS collection or relate to the
focus. Return concise bullet-point notes (facts, names, dates, why relevant), not prose. Be
specific and current; do not pad. No preamble.`;

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
  try {
    const body = await request.json();
    focus = (body?.focus ?? "").toString().slice(0, 500);
  } catch {
    // no body is fine
  }

  const [{ data: bottleRows }, { data: facetRow }] = await Promise.all([
    supabase.from("bottles").select("*"),
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
  const overrides = (facetRow?.result as { facets?: Overrides } | null)?.facets ?? {};

  const summary =
    malts.length === 0
      ? "(no single malts yet — a fresh start)"
      : malts
          .map(
            (b) =>
              `- ${b.name}${b.brand ? ` (${b.brand})` : ""} — ` +
              `${facetValue(b, "region", overrides)} · ${facetValue(b, "cask", overrides)} · ${facetValue(b, "age", overrides)}`
          )
          .join("\n");

  const userMsg = `MEMBER'S COLLECTION:\n${summary}\n\n${
    focus ? `FOCUS: ${focus}\n\n` : ""
  }Research the current market and return the findings notes.`;

  // Basic web-search variant is faster than the dynamic-filtering one (which runs
  // code execution under the hood); we only need a quick current-releases pass.
  const tools = [
    { type: "web_search_20250305", name: "web_search", max_uses: 2 },
  ] as unknown as Anthropic.Tool[];

  try {
    const client = anthropic();
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMsg }];
    let res: Anthropic.Message | null = null;
    for (let i = 0; i < 3; i++) {
      res = await client.messages.create({
        model: MODEL, // Sonnet 5 — fast enough to search several sources in budget
        max_tokens: 1200,
        thinking: { type: "disabled" },
        system: SYSTEM,
        output_config: { effort: "low" },
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

    const findings = blocks
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text as string)
      .join("\n")
      .trim();

    return NextResponse.json({ findings, sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : "research failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
