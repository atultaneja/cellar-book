"use client";

import Link from "next/link";

type Pour = {
  bottle_name: string | null;
  category: string | null;
  volume_ml: number | null;
  note: string | null;
  created_at: string;
};

export function HistoryView({ pours }: { pours: Pour[] }) {
  // Group by local calendar day, preserving newest-first order.
  const groups: { day: string; items: Pour[] }[] = [];
  for (const p of pours) {
    const day = new Date(p.created_at).toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(p);
    else groups.push({ day, items: [p] });
  }

  const totalMl = pours.reduce((n, p) => n + (p.volume_ml ?? 0), 0);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-racing">Pour History</h1>
        <Link href="/home" className="font-body text-xs text-ink-soft underline decoration-brass/50">
          ← Home
        </Link>
      </div>
      <p className="mb-5 font-body text-sm text-ink-soft">
        Every pour logged, most recent first
        {pours.length ? ` · ${pours.length} pours · ${(totalMl / 1000).toFixed(1)} L total` : ""}.
      </p>

      {pours.length === 0 ? (
        <div className="club-card p-8 text-center">
          <div className="text-2xl">🥃</div>
          <p className="mt-1 font-body text-sm text-ink-soft">
            No pours logged yet. Log one from the Cellar or accept a recommendation, and it&rsquo;ll
            show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.day}>
              <div className="mb-2 flex items-center gap-3">
                <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
                  {g.day}
                </h2>
                <span className="font-body text-xs text-ink-soft">{g.items.length}</span>
                <div className="club-rule flex-1" />
              </div>
              <div className="club-card divide-y divide-brass/20">
                {g.items.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-16 shrink-0 font-body text-xs tabular-nums text-ink-soft">
                      {new Date(p.created_at).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-body font-semibold text-ink">
                        {p.bottle_name ?? "A pour"}
                      </div>
                      {(p.note || p.category) && (
                        <div className="truncate font-body text-xs text-ink-soft">
                          {p.note || p.category}
                        </div>
                      )}
                    </div>
                    {p.volume_ml ? (
                      <span className="shrink-0 font-body text-sm font-semibold tabular-nums text-brass-dark">
                        {p.volume_ml} ml
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
