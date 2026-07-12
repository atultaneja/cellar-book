import { NextResponse } from "next/server";
import { anthropic, MODEL, parseJsonResponse } from "@/lib/ai";
import { CATEGORIES } from "@/lib/categories";
import { SIZE_OPTIONS } from "@/lib/sizes";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ImageInput = { media_type: string; data: string };

type Identified = {
  bottles: {
    name: string;
    brand: string | null;
    category: string;
    size: string;
    guessed_level: number | null; // 0..5, null if not visible
    confidence: "high" | "medium" | "low";
  }[];
};

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
          name: { type: "string" },
          brand: { type: ["string", "null"] },
          category: { type: "string", enum: [...CATEGORIES] },
          size: { type: "string", enum: [...SIZE_OPTIONS] },
          guessed_level: { type: ["integer", "null"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["name", "brand", "category", "size", "guessed_level", "confidence"],
      },
    },
  },
  required: ["bottles"],
} as const;

const SYSTEM = `You identify bottles of alcohol from photographs for a home-bar inventory.
For every distinct bottle you can see, return its name/expression (e.g. "Lagavulin 16"),
the brand or distiller if legible, and the single best-fit category from the allowed list.
For size: if the printed volume is legible (e.g. "750 mL", "70 cl" = 700 ml, "1 L"), map it to
the closest allowed size value; if it is not legible, use "Unknown".
If the remaining liquid level is visible through the glass, estimate it as an integer:
5=full, 4=three-quarters, 3=half, 2=quarter, 1=nearly empty, 0=empty. If you cannot see
the level, return null. Set confidence to how sure you are of the identification.
Only report bottles you can actually see. Do not invent bottles.`;

export async function POST(request: Request) {
  // Require a signed-in user — keeps the API key from being abused.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdminEmail(user.email))
    return NextResponse.json({ error: "Only the owner can add bottles." }, { status: 403 });
  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ error: "Photo scanning is turned off." }, { status: 503 });

  let images: ImageInput[];
  try {
    ({ images } = await request.json());
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: "no images" }, { status: 400 });
  }

  const imageBlocks = images.slice(0, 6).map((img) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: img.media_type as "image/jpeg" | "image/png" | "image/webp",
      data: img.data,
    },
  }));

  try {
    const client = anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            { type: "text", text: "Identify every bottle in these photographs." },
          ],
        },
      ],
    });

    const parsed = parseJsonResponse<Identified>(res.content);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "identification failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
