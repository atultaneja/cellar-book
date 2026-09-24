"use client";

import { useMemo, useState } from "react";
import {
  groupBy,
  regionOf,
  FACET_LABEL,
  type Facet,
} from "@/lib/whisky";
import type { Bottle } from "@/lib/types";

const FACETS: Facet[] = ["region", "type", "cask", "age"];

export function MaltDashboard({ malts }: { malts: Bottle[] }) {
  const [facet, setFacet] = useState<Facet>("region");

  const stats = useMemo(() => {
    const inStock = malts.filter((b) => b.level > 0).length;
    const regions = new Set(malts.map((b) => regionOf(b)).filter((r) => r !== "Unspecified"));
    return { total: malts.length, inStock, regions: regions.size };
  }, [malts]);

  const groups = useMemo(() => groupBy(malts, facet), [malts, facet]);
  const max = groups.reduce((m, g) => Math.max(m, g.total), 0) || 1;

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
            onClick={() => setFacet(f)}
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

      {/* Breakdown bars */}
      <div className="club-card divide-y divide-brass/20">
        {groups.map((g) => (
          <div key={g.label} className="px-4 py-2.5">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="font-body text-sm font-semibold text-ink">{g.label}</span>
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
          </div>
        ))}
      </div>
      <p className="mt-2 font-body text-xs italic text-ink-soft">
        Region from the distillery; cask and age read from the label. Bottles we can&rsquo;t place
        sit under &ldquo;Unspecified&rdquo;.
      </p>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="club-card p-3 text-center">
      <div className="font-display text-2xl font-bold text-racing">{value}</div>
      <div className="font-body text-[11px] uppercase tracking-widest text-ink-soft">{label}</div>
    </div>
  );
}
