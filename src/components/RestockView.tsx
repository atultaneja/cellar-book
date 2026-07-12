"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { levelMeta } from "@/lib/levels";
import type { Bottle } from "@/lib/types";

export function RestockView({ initial, isAdmin }: { initial: Bottle[]; isAdmin: boolean }) {
  const supabase = createClient();
  const [bottles, setBottles] = useState<Bottle[]>(initial);

  async function markFull(id: string) {
    setBottles((prev) => prev.filter((b) => b.id !== id));
    await supabase.from("bottles").update({ level: 5 }).eq("id", id);
  }

  const empty = bottles.filter((b) => b.level === 0);
  const low = bottles.filter((b) => b.level > 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-racing">The Restock List</h1>
      <p className="mb-5 font-body text-sm text-ink-soft">
        What&rsquo;s run dry or nearly so. You are emailed this every Monday.
      </p>

      {bottles.length === 0 ? (
        <div className="club-card p-8 text-center">
          <p className="font-display text-lg text-racing">The bar is well provisioned.</p>
          <p className="mt-1 font-body text-sm text-ink-soft">
            Nothing wants replenishing. Carry on.
          </p>
        </div>
      ) : (
        <>
          {empty.length > 0 && (
            <Section title="Run dry" tone="oxblood" items={empty} onMarkFull={markFull} isAdmin={isAdmin} />
          )}
          {low.length > 0 && (
            <Section title="Running low" tone="brass" items={low} onMarkFull={markFull} isAdmin={isAdmin} />
          )}
        </>
      )}
    </div>
  );
}

function Section({
  title,
  tone,
  items,
  onMarkFull,
  isAdmin,
}: {
  title: string;
  tone: "oxblood" | "brass";
  items: Bottle[];
  onMarkFull: (id: string) => void;
  isAdmin: boolean;
}) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center gap-3">
        <span
          className={`club-chip ${
            tone === "oxblood"
              ? "border-oxblood/40 bg-oxblood/10 text-oxblood"
              : "border-brass-dark/40 bg-brass/15 text-brass-dark"
          }`}
        >
          {title} · {items.length}
        </span>
        <div className="club-rule flex-1" />
      </div>
      <div className="club-card divide-y divide-brass/20">
        {items.map((b) => (
          <div key={b.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate font-body font-semibold text-ink">{b.name}</div>
              <div className="font-body text-xs text-ink-soft">
                {b.category} · {levelMeta(b.level).label}
              </div>
            </div>
            {isAdmin && (
              <button className="club-btn-ghost !py-1.5 text-xs" onClick={() => onMarkFull(b.id)}>
                Restocked
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
