import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { levelMeta, inStock } from "@/lib/levels";
import { anthropic, MODEL, parseJsonResponse } from "@/lib/ai";
import { COCKTAILS, makeable } from "@/lib/cocktails";
import { tokensFor } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Triggered by Vercel Cron every Monday (see vercel.json).
// Sends the restock list plus an organic "sommelier's pick of the week".
// Vercel automatically sends the CRON_SECRET as a Bearer token.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: low }, { data: allBottles }, { data: profileRows }] = await Promise.all([
    supabase.from("bottles").select("name, category, level").lte("level", 1).order("level"),
    supabase.from("bottles").select("name, brand, category, level"),
    supabase.from("taste_profiles").select("data").limit(1),
  ]);

  const restock = low ?? [];
  const bottles = allBottles ?? [];

  // ---- Sommelier's pick of the week (best-effort) ----
  let pick: { title: string; detail: string } | null = null;
  try {
    const stocked = bottles.filter((b) => inStock(b.level as number));
    const availableCats = new Set<string>();
    for (const b of stocked) tokensFor(b.category as string).forEach((t) => availableCats.add(t));
    const canMake = COCKTAILS.filter((c) => makeable(c, availableCats));
    if (stocked.length > 0 && process.env.ANTHROPIC_API_KEY) {
      const profile = profileRows?.[0]?.data ?? {};
      const client = anthropic();
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system:
          "You are the resident mixologist at the Tantaan Tiki Bar. Choose ONE drink to enjoy " +
          "this week, from the in-stock bottles and taste profile. Prefer a makeable cocktail; " +
          "a neat pour is fine. Return a short elegant title and one or two sentences.",
        output_config: {
          effort: "low",
          format: {
            type: "json_schema",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: { title: { type: "string" }, detail: { type: "string" } },
              required: ["title", "detail"],
            },
          },
        },
        messages: [
          {
            role: "user",
            content:
              `PALATE: ${JSON.stringify(profile)}\n\n` +
              `IN STOCK:\n${stocked.map((b) => `- ${b.name} [${b.category}]`).join("\n")}\n\n` +
              `MAKEABLE COCKTAILS: ${canMake.map((c) => c.name).join(", ") || "(none)"}\n\n` +
              `Choose this week's pour.`,
          },
        ],
      });
      pick = parseJsonResponse<{ title: string; detail: string }>(res.content);
    }
  } catch {
    // Sommelier is optional — never let it block the restock email.
    pick = null;
  }

  if (restock.length === 0 && !pick) {
    return NextResponse.json({ ok: true, sent: false, reason: "nothing to send" });
  }

  const restockRows = restock
    .map(
      (b) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #E7DBBE;">${escape(b.name)}</td>
         <td style="padding:6px 10px;border-bottom:1px solid #E7DBBE;color:#5A4E3D;">${escape(b.category)}</td>
         <td style="padding:6px 10px;border-bottom:1px solid #E7DBBE;color:${
           b.level === 0 ? "#6E1F1B" : "#8A6D34"
         };">${escape(levelMeta(b.level).label)}</td></tr>`
    )
    .join("");

  const restockSection = restock.length
    ? `<p style="margin:0 0 12px;color:#5A4E3D;">The following want replenishing:</p>
       <table style="width:100%;border-collapse:collapse;font-size:15px;">
         <thead><tr style="text-align:left;color:#14432A;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
           <th style="padding:6px 10px;">Bottle</th><th style="padding:6px 10px;">Category</th><th style="padding:6px 10px;">Level</th>
         </tr></thead><tbody>${restockRows}</tbody></table>`
    : `<p style="margin:0;color:#5A4E3D;">The bar is well provisioned — nothing to restock.</p>`;

  const pickSection = pick
    ? `<div style="margin-top:22px;padding-top:18px;border-top:1px solid #E7DBBE;">
         <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#B08D46;">Sommelier's pick of the week</div>
         <div style="font-size:18px;font-weight:bold;color:#14432A;margin:4px 0;">${escape(pick.title)}</div>
         <div style="color:#2B2118;">${escape(pick.detail)}</div>
       </div>`
    : "";

  const html = `
  <div style="font-family:Georgia,'Times New Roman',serif;background:#F4ECD8;padding:28px;color:#2B2118;">
    <div style="max-width:520px;margin:0 auto;background:#FBF6E9;border:1px solid rgba(176,141,70,0.35);border-radius:10px;overflow:hidden;">
      <div style="background:#14432A;color:#F4ECD8;padding:20px 24px;">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#C9A85E;">Tantaan Tiki Bar</div>
        <div style="font-size:22px;font-weight:bold;">Your Weekly Dispatch</div>
      </div>
      <div style="padding:22px 24px;">${restockSection}${pickSection}</div>
    </div>
  </div>`;

  const subject =
    restock.length > 0
      ? `Tantaan Tiki Bar — ${restock.length} to restock${pick ? ` · this week: ${pick.title}` : ""}`
      : `Tantaan Tiki Bar — this week: ${pick!.title}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESTOCK_EMAIL_FROM,
      to: [process.env.RESTOCK_EMAIL_TO],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ ok: false, error: "email failed", detail }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sent: true, restock: restock.length, pick: !!pick });
}

function escape(s: string) {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string
  );
}
