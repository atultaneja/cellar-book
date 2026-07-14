import Link from "next/link";
import { familyOf, FAMILIES } from "@/lib/categories";
import { inStock, needsRestock } from "@/lib/levels";
import type { Bottle } from "@/lib/types";

type Pour = {
  bottle_name: string | null;
  category: string | null;
  volume_ml: number | null;
  created_at: string;
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function HomeView({
  bottles,
  pours,
  isAdmin,
}: {
  bottles: Bottle[];
  pours: Pour[];
  isAdmin: boolean;
}) {
  const total = bottles.length;
  const good = bottles.filter((b) => inStock(b.level)).length;
  const low = bottles.filter((b) => needsRestock(b.level) && !b.restock_ignore).length;

  const famCounts = FAMILIES.map((f) => ({
    family: f,
    count: bottles.filter((b) => familyOf(b.category) === f).length,
  })).filter((x) => x.count > 0);
  const maxFam = Math.max(1, ...famCounts.map((x) => x.count));

  // Most-poured bottles in the log (favourites lately).
  const favMap = new Map<string, number>();
  for (const p of pours) {
    const name = p.bottle_name ?? "Unknown";
    favMap.set(name, (favMap.get(name) ?? 0) + 1);
  }
  const faves = Array.from(favMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentAdds = [...bottles]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 5);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-racing">The Bar at a Glance</h1>
      <p className="mb-5 font-body text-sm text-ink-soft">Tantaan Tiki Bar · good friends, good times.</p>

      {/* Stat tiles */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        <Stat label="Bottles" value={total} />
        <Stat label="In supply" value={good} />
        <Link href="/restock">
          <Stat label="To restock" value={low} tone={low > 0 ? "oxblood" : undefined} />
        </Link>
      </div>

      {/* By the shelf */}
      {famCounts.length > 0 && (
        <section className="mb-6">
          <Head label="By the shelf" />
          <div className="club-card space-y-2 p-4">
            {famCounts.map((f) => (
              <div key={f.family} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate font-body text-sm text-ink">{f.family}</span>
                <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-brass/15">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-racing"
                    style={{ width: `${(f.count / maxFam) * 100}%` }}
                  />
                </span>
                <span className="w-6 text-right font-body text-sm font-semibold text-ink-soft">
                  {f.count}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lately at the bar */}
      <section className="mb-6">
        <Head label="Lately at the bar" />
        {pours.length === 0 ? (
          <div className="club-card p-5 text-center">
            <p className="font-body text-sm text-ink-soft">
              No pours logged yet.
              {isAdmin ? " Tap “pour” on a bottle in the Cellar to start your drink history." : ""}
            </p>
          </div>
        ) : (
          <div className="club-card divide-y divide-brass/20">
            {pours.slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 truncate font-body text-ink">
                  {p.bottle_name ?? "A pour"}
                  {p.volume_ml ? (
                    <span className="text-ink-soft"> · {p.volume_ml} ml</span>
                  ) : null}
                </span>
                <span className="shrink-0 font-body text-xs text-ink-soft">
                  {timeAgo(p.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
        {faves.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {faves.map(([name, n]) => (
              <span key={name} className="club-chip border-brass/40 text-ink-soft">
                {name} · {n}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Tonight */}
      <section className="mb-6">
        <Head label="Tonight" />
        <Link href="/recommendations" className="club-btn w-full">
          Ask the sommelier for a pour
        </Link>
      </section>

      {/* Recently added */}
      {recentAdds.length > 0 && (
        <section className="mb-4">
          <Head label="Recently added" />
          <div className="club-card divide-y divide-brass/20">
            {recentAdds.map((b) => (
              <div key={b.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 truncate font-body text-ink">{b.name}</span>
                <span className="shrink-0 font-body text-xs text-ink-soft">
                  {b.category} · {timeAgo(b.created_at)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "oxblood";
}) {
  return (
    <div className="club-card p-3 text-center">
      <div
        className={`font-display text-2xl font-bold ${
          tone === "oxblood" ? "text-oxblood" : "text-racing"
        }`}
      >
        {value}
      </div>
      <div className="font-body text-[11px] uppercase tracking-widest text-ink-soft">{label}</div>
    </div>
  );
}

function Head({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
        {label}
      </h2>
      <div className="club-rule flex-1" />
    </div>
  );
}
