"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { levelMeta, needsRestock, inStock } from "@/lib/levels";
import { familyOf, FAMILIES } from "@/lib/categories";
import type { Bottle } from "@/lib/types";

export function RestockView({ bottles, isAdmin }: { bottles: Bottle[]; isAdmin: boolean }) {
  const supabase = createClient();
  const [levels, setLevels] = useState<Record<string, number>>(
    Object.fromEntries(bottles.map((b) => [b.id, b.level]))
  );

  async function markFull(id: string) {
    setLevels((prev) => ({ ...prev, [id]: 5 }));
    await supabase.from("bottles").update({ level: 5 }).eq("id", id);
  }

  const view = useMemo(() => {
    const current = bottles.map((b) => ({ ...b, level: levels[b.id] ?? b.level }));
    const low = current.filter((b) => needsRestock(b.level));

    // Per-family stock health, to flag whole categories that are depleted.
    const famTotals = new Map<string, { total: number; stocked: number }>();
    for (const b of current) {
      const f = familyOf(b.category);
      const t = famTotals.get(f) ?? { total: 0, stocked: 0 };
      t.total += 1;
      if (inStock(b.level)) t.stocked += 1;
      famTotals.set(f, t);
    }

    // Group the low/empty bottles by family, ordered as in FAMILIES.
    const byFam = new Map<string, Bottle[]>();
    for (const b of low) {
      const f = familyOf(b.category);
      if (!byFam.has(f)) byFam.set(f, []);
      byFam.get(f)!.push(b);
    }
    const groups = FAMILIES.filter((f) => byFam.has(f)).map((f) => ({
      family: f,
      depleted: (famTotals.get(f)?.stocked ?? 0) === 0, // nothing in good supply
      items: byFam
        .get(f)!
        .sort((a, b) => a.level - b.level || a.category.localeCompare(b.category)),
    }));

    return { count: low.length, depletedFamilies: groups.filter((g) => g.depleted), groups };
  }, [bottles, levels]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-racing">The Restock List</h1>
      <p className="mb-5 font-body text-sm text-ink-soft">
        What&rsquo;s run dry or nearly so, grouped by category. Emailed to you each Monday.
      </p>

      {view.count === 0 ? (
        <div className="club-card p-8 text-center">
          <p className="font-display text-lg text-racing">The bar is well provisioned.</p>
          <p className="mt-1 font-body text-sm text-ink-soft">Nothing wants replenishing.</p>
        </div>
      ) : (
        <>
          {view.depletedFamilies.length > 0 && (
            <div className="club-card mb-5 border-oxblood/30 p-4">
              <div className="mb-2 font-display text-sm font-semibold uppercase tracking-widest text-oxblood">
                Categories to replenish
              </div>
              <p className="mb-2 font-body text-sm text-ink-soft">
                You have nothing in good supply in these — a whole shelf to restock:
              </p>
              <div className="flex flex-wrap gap-2">
                {view.depletedFamilies.map((g) => (
                  <span
                    key={g.family}
                    className="club-chip border-oxblood/40 bg-oxblood/10 text-oxblood"
                  >
                    {g.family}
                  </span>
                ))}
              </div>
            </div>
          )}

          {view.groups.map((g) => (
            <section key={g.family} className="mb-6">
              <div className="mb-2 flex items-center gap-3">
                <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
                  {g.family}
                </h2>
                {g.depleted && (
                  <span className="club-chip border-oxblood/40 bg-oxblood/10 text-oxblood">
                    out
                  </span>
                )}
                <span className="font-body text-xs text-ink-soft">{g.items.length}</span>
                <div className="club-rule flex-1" />
              </div>
              <div className="club-card divide-y divide-brass/20">
                {g.items.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-body font-semibold text-ink">{b.name}</div>
                      <div className="font-body text-xs text-ink-soft">
                        {b.category}
                        {b.size && b.size !== "Unknown" ? ` · ${b.size}` : ""} ·{" "}
                        <span className={b.level === 0 ? "text-oxblood" : "text-brass-dark"}>
                          {levelMeta(b.level).label}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        className="club-btn-ghost !py-1.5 text-xs"
                        onClick={() => markFull(b.id)}
                      >
                        Restocked
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
