"use client";

import { useState } from "react";
import { cocktailById } from "@/lib/cocktails";
import { CocktailDetail } from "./CocktailDetail";

export type Pick = {
  kind: "cocktail" | "neat" | "acquire";
  title: string;
  detail: string;
  cocktail_id: string | null;
};

export type RecResult = { intro: string; picks: Pick[] };

const KIND_LABEL: Record<Pick["kind"], string> = {
  cocktail: "Cocktail",
  neat: "Neat pour",
  acquire: "Worth acquiring",
};

export function PickCard({ p, onAccept }: { p: Pick; onAccept?: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const c = p.cocktail_id ? cocktailById(p.cocktail_id) : undefined;
  return (
    <div className="club-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-racing">{p.title}</h3>
        <span className="font-body text-[11px] uppercase tracking-widest text-brass-dark">
          {KIND_LABEL[p.kind]}
        </span>
      </div>
      <p className="mt-1 font-body text-sm text-ink">{p.detail}</p>
      <div className="mt-2 flex items-center gap-4">
        {c && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="font-body text-xs font-semibold text-racing underline decoration-brass/50"
          >
            {open ? "Hide recipe" : "View full recipe"}
          </button>
        )}
        {onAccept && (
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onAccept();
              setBusy(false);
            }}
            className="club-btn-ghost !py-1 text-xs"
          >
            {busy ? "Logging…" : "🍸 I'm drinking this"}
          </button>
        )}
      </div>
      {open && c && <CocktailDetail cocktail={c} />}
    </div>
  );
}

export function Sommelier({
  onResult,
  canAccept,
  onAccept,
}: {
  onResult?: (r: RecResult) => void;
  canAccept?: boolean;
  onAccept?: (body: { cocktailId?: string; type?: string; token?: string }) => Promise<void>;
}) {
  const [occasion, setOccasion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecResult | null>(null);

  async function ask() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "The sommelier is unavailable");
      setResult(json as RecResult);
      onResult?.(json as RecResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
          Ask the Sommelier
        </h2>
        <div className="club-rule flex-1" />
      </div>

      <div className="club-card p-4">
        <label className="club-label">What are you in the mood for tonight?</label>
        <input
          className="club-input"
          placeholder="e.g. something smoky before dinner · celebrating · a light nightcap"
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") ask();
          }}
        />
        <button className="club-btn mt-3 w-full" disabled={loading} onClick={ask}>
          {loading ? "Consulting the cellar…" : "Recommend me something"}
        </button>
        <p className="mt-2 font-body text-xs text-ink-soft">
          Tuned to your saved taste profile and tonight&rsquo;s stock. Saved automatically to
          &ldquo;Recent&rdquo; below.
        </p>
        {error && <p className="mt-3 font-body text-sm text-oxblood">{error}</p>}
      </div>

      {result && (
        <div className="mt-4">
          <p className="mb-3 font-body italic text-ink">{result.intro}</p>
          <div className="grid grid-cols-1 gap-3">
            {result.picks.map((p, i) => (
              <PickCard
                key={i}
                p={p}
                onAccept={
                  canAccept && onAccept && p.cocktail_id
                    ? () => onAccept({ cocktailId: p.cocktail_id! })
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
