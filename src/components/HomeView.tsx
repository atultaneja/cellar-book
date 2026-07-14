import Link from "next/link";
import { Crest } from "./Crest";
import { familyOf, FAMILIES } from "@/lib/categories";
import { inStock, needsRestock } from "@/lib/levels";
import type { Bottle } from "@/lib/types";

type Pour = {
  bottle_name: string | null;
  category: string | null;
  volume_ml: number | null;
  created_at: string;
};

// A colour per family — used for the shelf bars and favourite chips.
const FAMILY_COLOR: Record<string, string> = {
  Whiskey: "#B08D46",
  Gin: "#1E5C3A",
  Vodka: "#6E7B8B",
  Rum: "#9A4A2E",
  "Tequila & Agave": "#7A8B3A",
  "Brandy & Cognac": "#8A5A2B",
  "Aperitifs & Vermouth": "#B23A48",
  Liqueurs: "#7A5B8A",
  Wine: "#6E1F1B",
  "Beer & Cider": "#C9A85E",
  Bitters: "#4A6D5A",
  Other: "#8A7A66",
};

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
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

  const weekAgo = Date.now() - 7 * 86_400_000;
  const poursThisWeek = pours.filter((p) => new Date(p.created_at).getTime() >= weekAgo).length;

  const famCounts = FAMILIES.map((f) => ({
    family: f,
    count: bottles.filter((b) => familyOf(b.category) === f).length,
  })).filter((x) => x.count > 0);
  const maxFam = Math.max(1, ...famCounts.map((x) => x.count));

  const favMap = new Map<string, { n: number; category: string | null }>();
  for (const p of pours) {
    const name = p.bottle_name ?? "Unknown";
    const cur = favMap.get(name) ?? { n: 0, category: p.category };
    cur.n += 1;
    favMap.set(name, cur);
  }
  const faves = Array.from(favMap.entries())
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 5);

  const recentAdds = [...bottles]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 5);

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-xl border border-brass/40 bg-racing p-5 text-parchment shadow-ledger">
        <div className="absolute -right-6 -top-4 opacity-20">
          <Crest size={120} />
        </div>
        <div className="relative">
          <div className="font-body text-[11px] uppercase tracking-[0.25em] text-brass-light">
            Tantaan Tiki Bar
          </div>
          <div className="mt-1 font-display text-3xl font-bold">Welcome back 🍹</div>
          <div className="mt-3 flex items-end gap-6">
            <div>
              <div className="font-display text-4xl font-bold text-brass-light">{total}</div>
              <div className="font-body text-[11px] uppercase tracking-widest text-parchment/70">
                bottles
              </div>
            </div>
            <div>
              <div className="font-display text-4xl font-bold text-brass-light">{poursThisWeek}</div>
              <div className="font-body text-[11px] uppercase tracking-widest text-parchment/70">
                poured this week
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        <Stat label="In supply" value={good} accent="#1E5C3A" />
        <Link href="/restock">
          <Stat label="To restock" value={low} accent={low > 0 ? "#6E1F1B" : "#8A7A66"} />
        </Link>
        <Stat label="Shelves" value={famCounts.length} accent="#B08D46" />
      </div>

      {/* By the shelf */}
      {famCounts.length > 0 && (
        <section className="mb-6">
          <Head label="By the shelf" />
          <div className="club-card space-y-2.5 p-4">
            {famCounts
              .sort((a, b) => b.count - a.count)
              .map((f) => (
                <div key={f.family} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate font-body text-sm text-ink">
                    {f.family}
                  </span>
                  <span className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-brass/15">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${(f.count / maxFam) * 100}%`,
                        backgroundColor: FAMILY_COLOR[f.family] ?? "#8A7A66",
                      }}
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
            <div className="text-2xl">🥃</div>
            <p className="mt-1 font-body text-sm text-ink-soft">
              No pours logged yet.
              {isAdmin ? " Tap “pour” on a bottle, or “I'm drinking this” on a recommendation." : ""}
            </p>
          </div>
        ) : (
          <>
            {faves.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {faves.map(([name, info]) => (
                  <span
                    key={name}
                    className="club-chip text-parchment"
                    style={{ backgroundColor: FAMILY_COLOR[familyOf(info.category ?? "")] ?? "#8A7A66", borderColor: "transparent" }}
                  >
                    {name} · {info.n}
                  </span>
                ))}
              </div>
            )}
            <div className="club-card divide-y divide-brass/20">
              {pours.slice(0, 8).map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: FAMILY_COLOR[familyOf(p.category ?? "")] ?? "#8A7A66" }}
                  />
                  <span className="min-w-0 flex-1 truncate font-body text-ink">
                    {p.bottle_name ?? "A pour"}
                    {p.volume_ml ? <span className="text-ink-soft"> · {p.volume_ml} ml</span> : null}
                  </span>
                  <span className="shrink-0 font-body text-xs text-ink-soft">
                    {timeAgo(p.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Tonight */}
      <section className="mb-6">
        <Head label="Tonight" />
        <Link href="/recommendations" className="club-btn w-full">
          🍸 Ask the sommelier for a pour
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

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="club-card overflow-hidden p-0 text-center">
      <div className="h-1" style={{ backgroundColor: accent }} />
      <div className="p-3">
        <div className="font-display text-2xl font-bold" style={{ color: accent }}>
          {value}
        </div>
        <div className="font-body text-[11px] uppercase tracking-widest text-ink-soft">{label}</div>
      </div>
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
