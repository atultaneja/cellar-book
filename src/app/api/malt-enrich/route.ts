import { NextResponse } from "next/server";
import { anthropic, MODEL, parseJsonResponse } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import { isMalt, needsEnrichment, type Overrides } from "@/lib/whisky";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One-time lookup: classify the malts our heuristics couldn't place, and save
// the result so the dashboard shows real regions/casks/ages instead of
// "Unspecified". Uses the model's whisky knowledge (fast, single call); the
// values are best-effort and can be corrected later.

const REGIONS = [
  "Islay",
  "Speyside",
  "Highland",
  "Lowland",
  "Campbeltown",
  "Islands",
  "Japan",
  "India",
  "Other",
];

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    bottles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          region: { type: "string", enum: REGIONS },
          cask: { type: "string" }, // e.g. "Sherry", "Bourbon", "PX Sherry", "Port", "Unspecified"
          age: { type: "string" }, // e.g. "12 yr", "18 yr", "NAS"
        },
        required: ["id", "region", "cask", "age"],
      },
    },
  },
  required: ["bottles"],
} as const;

type EnrichRow = { id: string; region: string; cask: string; age: string };

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ error: "Enrichment is turned off." }, { status: 503 });

  // Current bottles + any previously-saved overrides.
  const [{ data: bottleRows }, { data: savedRow }] = await Promise.all([
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
  const existing: Overrides = (savedRow?.result as { facets?: Overrides } | null)?.facets ?? {};

  const malts = bottles.filter((b) => isMalt(b.category));
  const todo = malts.filter((b) => needsEnrichment(b, existing));

  if (todo.length === 0) {
    return NextResponse.json({ facets: existing, enriched: 0 });
  }

  const list = todo
    .map((b) => `${b.id} | ${b.name}${b.brand ? ` — ${b.brand}` : ""} [${b.category}]`)
    .join("\n");

  const system = `You are a single-malt whisky reference. For each bottle, identify its Scotch
region (or Japan/India/Other), the dominant cask maturation, and the age statement. Use your
knowledge of these distilleries and expressions. If you are genuinely unsure of the cask, return
"Unspecified"; if there is no age statement, return "NAS". Region must be one of:
${REGIONS.join(", ")}. Return every bottle id exactly as given.`;

  const userMsg = `Classify these bottles (format: "id | name — brand [category]"):\n${list}`;

  try {
    const client = anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: userMsg }],
    });

    const parsed = parseJsonResponse<{ bottles: EnrichRow[] }>(res.content);

    const merged: Overrides = { ...existing };
    let count = 0;
    const validIds = new Set(todo.map((b) => b.id));
    for (const row of parsed.bottles ?? []) {
      if (!validIds.has(row.id)) continue;
      merged[row.id] = {
        region: row.region,
        cask: row.cask,
        age: row.age,
      };
      count += 1;
    }

    await supabase.from("ai_recommendations").insert({
      user_id: user!.id,
      kind: "malt_facets",
      context: { enriched: count },
      result: { facets: merged },
    });

    return NextResponse.json({ facets: merged, enriched: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "enrichment failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
