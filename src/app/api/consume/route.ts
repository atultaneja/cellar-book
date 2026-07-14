import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";
import { cocktailById } from "@/lib/cocktails";
import { tokensFor } from "@/lib/categories";
import { inStock, mlForLevel, levelForMl } from "@/lib/levels";
import { sizeToMl } from "@/lib/sizes";
import type { Bottle } from "@/lib/types";

export const dynamic = "force-dynamic";

const POUR_ML = 45; // standard pour deducted per spirit

// "I'm drinking this" — log the pour(s) and deduct from the bottles that make it.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdminEmail(user.email))
    return NextResponse.json({ error: "Only the owner can log drinks." }, { status: 403 });

  let body: { cocktailId?: string; type?: string; token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // Determine the spirit tokens to deduct, and a label for the log.
  let tokens: string[];
  let note: string;
  if (body.cocktailId) {
    const c = cocktailById(body.cocktailId);
    if (!c) return NextResponse.json({ error: "unknown cocktail" }, { status: 400 });
    tokens = c.requires;
    note = c.name;
  } else if (body.type === "neat" && body.token) {
    tokens = [body.token];
    note = `${body.token} (neat)`;
  } else {
    return NextResponse.json({ error: "nothing to log" }, { status: 400 });
  }

  const { data: rows } = await supabase.from("bottles").select("*");
  const stocked = ((rows as Bottle[]) ?? []).filter((b) => inStock(b.level));

  const deducted: string[] = [];
  const usedIds = new Set<string>();
  for (const tok of tokens) {
    // Prefer a bottle not already used for this drink, fullest first.
    const matches = stocked
      .filter((b) => tokensFor(b.category).includes(tok) && !usedIds.has(b.id))
      .sort((a, b) => (b.remaining_ml ?? b.level * 1000) - (a.remaining_ml ?? a.level * 1000));
    const b = matches[0];
    if (!b) continue;
    usedIds.add(b.id);

    const sizeMl = sizeToMl(b.size);
    if (sizeMl != null) {
      const currentMl = b.remaining_ml ?? mlForLevel(b.level, sizeMl);
      const newMl = Math.max(0, currentMl - POUR_ML);
      await supabase
        .from("bottles")
        .update({ remaining_ml: newMl, level: levelForMl(newMl, sizeMl) })
        .eq("id", b.id);
    }
    await supabase.from("drink_log").insert({
      bottle_id: b.id,
      bottle_name: b.name,
      category: b.category,
      volume_ml: POUR_ML,
      note,
    });
    deducted.push(b.name);
  }

  return NextResponse.json({ ok: true, deducted, note });
}
