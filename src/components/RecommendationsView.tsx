"use client";

import { useMemo, useState } from "react";
import { COCKTAILS, NEAT_POURS, makeable, missingCount, type Cocktail, type Mood } from "@/lib/cocktails";
import { inStock } from "@/lib/levels";
import { tokensFor, familyOf, FAMILIES } from "@/lib/categories";
import { profileIsEmpty, type TasteProfile } from "@/lib/taste";
import type { Bottle } from "@/lib/types";
import { Sommelier, PickCard, type RecResult } from "./Sommelier";
import { TasteProfileEditor } from "./TasteProfileEditor";
import { CocktailDetail } from "./CocktailDetail";

export type RecentRec = { id: string; result: RecResult; created_at: string };

const MOODS: (Mood | "All")[] = [
  "All",
  "Aperitif",
  "Celebratory",
  "Summer",
  "Contemplative",
  "Nightcap",
  "Crowd-pleaser",
];

export function RecommendationsView({
  bottles,
  initialProfile,
  initialRecent,
  aiEnabled,
  isAdmin,
}: {
  bottles: Bottle[];
  initialProfile: TasteProfile;
  initialRecent: RecentRec[];
  aiEnabled: boolean;
  isAdmin: boolean;
}) {
  const [mood, setMood] = useState<Mood | "All">("All");
  const [profile, setProfile] = useState<TasteProfile>(initialProfile);
  const [editingProfile, setEditingProfile] = useState(false);
  const [recent, setRecent] = useState<RecentRec[]>(initialRecent);

  const available = useMemo(() => {
    const s = new Set<string>();
    for (const b of bottles) if (inStock(b.level)) tokensFor(b.category).forEach((t) => s.add(t));
    return s;
  }, [bottles]);

  const canMake = useMemo(
    () =>
      COCKTAILS.filter((c) => makeable(c, available)).filter(
        (c) => mood === "All" || c.moods.includes(mood)
      ),
    [available, mood]
  );

  const oneShort = useMemo(
    () =>
      COCKTAILS.filter((c) => missingCount(c, available) === 1).map((c) => ({
        cocktail: c,
        missing: c.requires.filter((r) => !available.has(r)),
      })),
    [available]
  );

  const pours = useMemo(
    () =>
      Object.entries(NEAT_POURS)
        .filter(([cat]) => available.has(cat))
        .filter(([, v]) => mood === "All" || v.mood === mood),
    [available, mood]
  );

  // Underexplored families — nothing (or barely anything) in the cellar.
  const gaps = useMemo(() => {
    const count = new Map<string, number>();
    for (const b of bottles) {
      const f = familyOf(b.category);
      count.set(f, (count.get(f) ?? 0) + 1);
    }
    const unexplored = FAMILIES.filter((f) => (count.get(f) ?? 0) === 0);
    const thin = FAMILIES.filter((f) => (count.get(f) ?? 0) === 1);
    return { unexplored, thin };
  }, [bottles]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-racing">The Recommendation</h1>
      <p className="mb-4 font-body text-sm text-ink-soft">
        Drawn entirely from what stands in good supply tonight.
      </p>

      {/* AI section — only when a Claude key is configured */}
      {aiEnabled && (
        <>
          {isAdmin &&
            (editingProfile ? (
              <TasteProfileEditor
                initial={profile}
                onSaved={(p) => {
                  setProfile(p);
                  setEditingProfile(false);
                }}
                onClose={() => setEditingProfile(false)}
              />
            ) : (
              <div className="club-card mb-5 flex items-center justify-between gap-3 p-3">
                <p className="font-body text-sm text-ink-soft">
                  {profileIsEmpty(profile)
                    ? "Set your taste profile so the sommelier knows your palate."
                    : "The sommelier remembers your palate."}
                </p>
                <button
                  className="club-btn-ghost !py-1.5 text-xs"
                  onClick={() => setEditingProfile(true)}
                >
                  {profileIsEmpty(profile) ? "Set profile" : "Edit"}
                </button>
              </div>
            ))}

          <Sommelier
            onResult={(r) =>
              setRecent((prev) =>
                [{ id: `live-${prev.length}`, result: r, created_at: "" }, ...prev].slice(0, 12)
              )
            }
          />

          {recent.length > 0 && <RecentList recent={recent} />}

          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
              Straight from your cellar
            </h2>
            <div className="club-rule flex-1" />
          </div>
        </>
      )}

      {/* Mood filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m}
            onClick={() => setMood(m)}
            className={`club-chip ${
              mood === m
                ? "border-racing bg-racing text-parchment"
                : "border-brass/40 text-ink-soft hover:bg-brass/10"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {available.size === 0 && (
        <div className="club-card mb-6 p-6 text-center">
          <p className="font-body text-ink-soft">
            Add a few bottles to the cellar and the suggestions will pour in.
          </p>
        </div>
      )}

      {/* Cocktails you can make — click a card for the full recipe */}
      <section className="mb-7">
        <SectionHead label={`Cocktails you can make (${canMake.length})`} />
        {canMake.length === 0 ? (
          <p className="font-body text-sm italic text-ink-soft">
            Nothing complete for this mood — try another, or see &ldquo;one bottle short&rdquo; below.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {canMake.map((c) => (
              <MakeableCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>

      {/* Neat pours */}
      {pours.length > 0 && (
        <section className="mb-7">
          <SectionHead label="A considered neat pour" />
          <div className="club-card divide-y divide-brass/20">
            {pours.map(([cat, v]) => (
              <div key={cat} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-body font-semibold text-ink">{cat}</span>
                  <span className="font-body text-[11px] uppercase tracking-widest text-brass-dark">
                    {v.mood}
                  </span>
                </div>
                <p className="font-body text-sm text-ink-soft">{v.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Expand your bar — underexplored categories worth acquiring */}
      {(gaps.unexplored.length > 0 || gaps.thin.length > 0) && (
        <section className="mb-7">
          <SectionHead label="Expand your bar" />
          <p className="mb-2 font-body text-xs text-ink-soft">
            Categories you&rsquo;ve barely explored — a bottle here opens new ground.
          </p>
          <div className="club-card divide-y divide-brass/20">
            {gaps.unexplored.map((f) => (
              <div key={f} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-body font-semibold text-ink">{f}</span>
                <span className="club-chip border-brass/40 text-brass-dark">not stocked</span>
              </div>
            ))}
            {gaps.thin.map((f) => (
              <div key={f} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-body font-semibold text-ink">{f}</span>
                <span className="club-chip border-brass/40 text-ink-soft">just one bottle</span>
              </div>
            ))}
          </div>
          {aiEnabled && (
            <p className="mt-2 font-body text-xs italic text-ink-soft">
              Ask the sommelier above for a specific bottle to buy next.
            </p>
          )}
        </section>
      )}

      {/* One bottle short */}
      {oneShort.length > 0 && (
        <section className="mb-4">
          <SectionHead label="One bottle short" />
          <p className="mb-2 font-body text-xs text-ink-soft">
            Acquire the missing bottle and these open up.
          </p>
          <div className="club-card divide-y divide-brass/20">
            {oneShort.map(({ cocktail, missing }) => (
              <div key={cocktail.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-body font-semibold text-ink">{cocktail.name}</span>
                <span className="club-chip border-oxblood/40 bg-oxblood/10 text-oxblood">
                  needs {missing.join(", ")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MakeableCard({ c }: { c: Cocktail }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="club-card p-4">
      <button className="flex w-full items-baseline justify-between gap-2 text-left" onClick={() => setOpen((o) => !o)}>
        <h3 className="font-display text-lg font-semibold text-racing">{c.name}</h3>
        <span className="font-body text-[11px] uppercase tracking-widest text-brass-dark">
          {open ? "hide" : "recipe"}
        </span>
      </button>
      <p className="mt-1 font-body text-sm text-ink">{c.method}</p>
      {open && <CocktailDetail cocktail={c} />}
    </div>
  );
}

function RecentList({ recent }: { recent: RecentRec[] }) {
  const [show, setShow] = useState(false);
  return (
    <section className="mb-7">
      <button
        onClick={() => setShow((s) => !s)}
        className="mb-3 flex w-full items-center gap-3"
      >
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
          Recent picks ({recent.length})
        </h2>
        <span className="font-body text-xs text-ink-soft">{show ? "hide" : "show"}</span>
        <div className="club-rule flex-1" />
      </button>
      {show && (
        <div className="space-y-4">
          {recent.map((r) => (
            <div key={r.id}>
              <p className="mb-2 font-body text-sm italic text-ink">
                {r.result.intro}
                {r.created_at ? (
                  <span className="ml-2 not-italic text-ink-soft">
                    · {new Date(r.created_at).toLocaleDateString()}
                  </span>
                ) : null}
              </p>
              <div className="grid grid-cols-1 gap-3">
                {r.result.picks.map((p, i) => (
                  <PickCard key={i} p={p} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionHead({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
        {label}
      </h2>
      <div className="club-rule flex-1" />
    </div>
  );
}
