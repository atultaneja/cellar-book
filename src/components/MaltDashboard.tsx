"use client";

import { useMemo, useState } from "react";
import {
  groupBy,
  facetValue,
  needsEnrichment,
  FACET_LABEL,
  SOFT_LABELS,
  type Facet,
  type Overrides,
} from "@/lib/whisky";
import type { Bottle } from "@/lib/types";

const FACETS: Facet[] = ["region", "type", "cask", "age"];

export function MaltDashboard({
  malts,
  initialOverrides,
}: {
  malts: Bottle[];
  initialOverrides: Overrides;
}) {
  const [facet, setFacet] = useState<Facet>("region");
  const [open, setOpen] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Overrides>(initialOverrides);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const inStock = malts.filter((b) => b.level > 0).length;
    const regions = new Set(
      malts.map((b) => facetValue(b, "region", overrides)).filter((r) => !SOFT_LABELS.has(r))
    );
    return { total: malts.length, inStock, regions: regions.size };
  }, [malts, overrides]);

  const groups = useMemo(() => groupBy(malts, facet, overrides), [malts, facet, overrides]);
  const max = groups.reduce((m, g) => Math.max(m, g.total), 0) || 1;

  const gapCount = useMemo(
    () => malts.filter((b) => needsEnrichment(b, overrides)).length,
    [malts, overrides]
  );

  async function enrich() {
    setEnriching(true);
    setError(null);
    try {
      const res = await fetch("/api/malt-enrich", { method: "POST" });
      const raw = await res.text();
      let json: { facets?: Overrides; error?: string } = {};
      try {
        json = JSON.parse(raw);
      } catch {
        throw new Error("That took too long — please try again.");
      }
      if (!res.ok || !json.facets) throw new Error(json.error || "Couldn't enrich");
      setOverrides(json.facets);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setEnriching(false);
    }
  }

  if (malts.length === 0) {
    return (
      <div className="club-card mb-6 p-6 text-center">
        <p className="font-body text-ink-soft">
          No single malts catalogued yet. Add a few in the Cellar and your collection will map out
          here.
        </p>
      </div>
    );
  }

  // Close the open row when switching facets (its label won't exist anymore).
  function pickFacet(f: Facet) {
    setFacet(f);
    setOpen(null);
  }

  return (
    <section className="mb-8">
      {/* Headline stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat value={stats.total} label="Malts" />
        <Stat value={stats.inStock} label="In stock" />
        <Stat value={stats.regions} label="Regions" />
      </div>

      {/* Facet switcher */}
      <div className="mb-3 flex flex-wrap gap-2">
        {FACETS.map((f) => (
          <button
            key={f}
            onClick={() => pickFacet(f)}
            className={`club-chip ${
              facet === f
                ? "border-racing bg-racing text-parchment"
                : "border-brass/40 text-ink-soft hover:bg-brass/10"
            }`}
          >
            {FACET_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Breakdown bars — each row expands to the bottles inside it */}
      <div className="club-card divide-y divide-brass/20">
        {groups.map((g) => {
          const isOpen = open === g.label;
          return (
            <div key={g.label}>
              <button
                onClick={() => setOpen(isOpen ? null : g.label)}
                className="block w-full px-4 py-2.5 text-left transition-colors hover:bg-brass/5"
              >
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="font-body text-sm font-semibold text-ink">
                    <span className="mr-1.5 text-ink-soft">{isOpen ? "▾" : "▸"}</span>
                    {g.label}
                  </span>
                  <span className="font-body text-xs text-ink-soft">
                    {g.total}
                    {g.inStock < g.total && (
                      <span className="text-ink-soft/70"> · {g.inStock} in stock</span>
                    )}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-brass/10">
                  <div
                    className="h-full rounded-full bg-racing"
                    style={{ width: `${Math.round((g.total / max) * 100)}%` }}
                  />
                </div>
              </button>
              {isOpen && (
                <ul className="bg-brass/5 px-4 pb-3 pt-1">
                  {g.items.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-baseline justify-between gap-3 border-b border-brass/10 py-1.5 last:border-0"
                    >
                      <span className="font-body text-sm text-ink">
                        {b.name}
                        {b.brand ? <span className="text-ink-soft"> · {b.brand}</span> : null}
                      </span>
                      <span className="shrink-0 font-body text-[11px] uppercase tracking-widest text-ink-soft">
                        {subLabel(b, facet, overrides)}
                        {b.level <= 0 ? " · finished" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="font-body text-xs italic text-ink-soft">
          Region from the distillery; cask and age read from the label. Tap a row to see its bottles.
        </p>
        {gapCount > 0 && (
          <button
            onClick={enrich}
            disabled={enriching}
            className="club-btn-ghost shrink-0 !py-1 text-xs"
          >
            {enriching ? "Looking up…" : `Fill in ${gapCount} gap${gapCount === 1 ? "" : "s"}`}
          </button>
        )}
      </div>
      {error && <p className="mt-1 font-body text-xs text-oxblood">{error}</p>}
    </section>
  );
}

// A small secondary label shown next to each bottle in an expanded group, giving
// a useful cross-facet detail (e.g. its age when grouped by region).
function subLabel(b: Bottle, facet: Facet, overrides: Overrides): string {
  const other: Facet = facet === "age" ? "region" : "age";
  const v = facetValue(b, other, overrides);
  return SOFT_LABELS.has(v) ? "" : v;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="club-card p-3 text-center">
      <div className="font-display text-2xl font-bold text-racing">{value}</div>
      <div className="font-body text-[11px] uppercase tracking-widest text-ink-soft">{label}</div>
    </div>
  );
}
